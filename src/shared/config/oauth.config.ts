import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getPrismaClient } from '../database/prisma.ts';

const prisma = getPrismaClient();

/**
 * configureGoogleOAuth - Configures Google OAuth2 Strategy
 *
 * This function configures the Google OAuth2 strategy for Passport.
 * It must be called after environment variables are loaded.
 * It will either create a new user or link the OAuth account to an existing user.
 */
export const configureGoogleOAuth = () => {
  if (!isGoogleOAuthConfigured()) {
    return false;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL;
  if (!callbackURL) {
    throw new Error('GOOGLE_CALLBACK_URL is required when Google OAuth is configured');
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const providerEmail = profile.emails?.[0];
          if (!providerEmail?.value || providerEmail.verified !== true) {
            return done(new Error('Google account must provide a verified email address'));
          }

          // Check if user already exists with this Google account
          const existingAccount = await prisma.oAuthAccount.findUnique({
            where: {
              provider_providerId: {
                provider: 'google',
                providerId: profile.id,
              },
            },
            include: {
              user: true,
            },
          });

          if (existingAccount) {
            await prisma.oAuthAccount.update({
              where: { id: existingAccount.id },
              data: { accessToken: null, refreshToken: null, expiresAt: null },
            });
            return done(null, {
              userId: existingAccount.user.id,
              email: existingAccount.user.email || '',
            });
          }

          // Check if user exists with the same email
          const existingUser = await prisma.user.findUnique({
            where: { email: providerEmail.value },
          });

          if (existingUser) {
            // Link Google account to existing user
            await prisma.oAuthAccount.create({
              data: {
                userId: existingUser.id,
                provider: 'google',
                providerId: profile.id,
              },
            });

            return done(null, {
              userId: existingUser.id,
              email: existingUser.email || '',
            });
          }

          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: providerEmail.value,
              name: profile.displayName || null,
              emailVerified: true,
              password: null, // OAuth users don't need password
            },
          });

          // Create OAuth account link
          await prisma.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider: 'google',
              providerId: profile.id,
            },
          });

          return done(null, {
            userId: newUser.id,
            email: newUser.email || '',
          });
        } catch (error) {
          return done(error instanceof Error ? error : new Error('Google authentication failed'));
        }
      }
    )
  );

  /**
   * Serialize user for session
   */
  passport.serializeUser((user: any, done) => {
    done(null, user.userId || user.id);
  });

  /**
   * Deserialize user from session
   */
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user) {
        done(null, {
          userId: user.id,
          email: user.email || '',
        });
      } else {
        done(null, null);
      }
    } catch (error) {
      done(error);
    }
  });

  return true;
};

export const isGoogleOAuthConfigured = (): boolean => {
  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  if (!hasClientId && !hasClientSecret) {
    return false;
  }
  if (!hasClientId || !hasClientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together');
  }
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;
  const frontendURL = process.env.FRONTEND_URL;
  if (!callbackURL || !frontendURL) {
    throw new Error('GOOGLE_CALLBACK_URL and FRONTEND_URL are required when Google OAuth is configured');
  }

  const callback = parseWebUrl(callbackURL);
  const frontend = parseWebUrl(frontendURL);
  if (!callback || !frontend) {
    throw new Error('Google OAuth callback and frontend URLs must be absolute HTTP(S) URLs');
  }
  if (
    (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') &&
    (callback.protocol !== 'https:' || frontend.protocol !== 'https:')
  ) {
    throw new Error('Google OAuth callback and frontend URLs must use HTTPS in staging and production');
  }

  return true;
};

const parseWebUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username.length > 0 ||
      url.password.length > 0
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

export default passport;
