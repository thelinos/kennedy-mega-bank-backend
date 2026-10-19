import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getPrismaClient } from '../database/prisma.ts';
import { JWTUtil } from '../utils/jwt.util.ts';

const prisma = getPrismaClient();

/**
 * Configure Google OAuth2 Strategy
 *
 * This strategy handles authentication via Google OAuth2.
 * It will either create a new user or link the OAuth account to an existing user.
 */
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

          return done(null, existingAccount.user);
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

          return done(null, existingUser);
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

        return done(null, newUser);
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
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
