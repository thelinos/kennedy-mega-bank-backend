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
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/authentication/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
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
            // Update tokens if they've changed
            await prisma.oAuthAccount.update({
              where: { id: existingAccount.id },
              data: {
                accessToken,
                refreshToken,
                expiresAt: refreshToken ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days
              },
            });

            return done(null, {
              userId: existingAccount.user.id,
              email: existingAccount.user.email || '',
            });
          }

          // Check if user exists with the same email
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.emails?.[0]?.value },
          });

          if (existingUser) {
            // Link Google account to existing user
            await prisma.oAuthAccount.create({
              data: {
                userId: existingUser.id,
                provider: 'google',
                providerId: profile.id,
                accessToken,
                refreshToken,
                expiresAt: refreshToken ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
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
              email: profile.emails?.[0]?.value || null,
              name: profile.displayName || null,
              emailVerified: profile.emails?.[0]?.verified || false,
              password: null, // OAuth users don't need password
            },
          });

          // Create OAuth account link
          await prisma.oAuthAccount.create({
            data: {
              userId: newUser.id,
              provider: 'google',
              providerId: profile.id,
              accessToken,
              refreshToken,
              expiresAt: refreshToken ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
            },
          });

          return done(null, {
            userId: newUser.id,
            email: newUser.email || '',
          });
        } catch (error) {
          return done(error as Error);
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
};

export default passport;
