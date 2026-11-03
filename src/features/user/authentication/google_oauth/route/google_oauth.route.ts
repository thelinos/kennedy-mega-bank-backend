import express, { Request, Response, Router } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import passport from 'passport';
import { isGoogleOAuthConfigured } from "../../../../../shared/config/oauth.config.ts";
import { AuthSessionUtil } from "../../../../../shared/utils/auth-session.util.ts";
import { AuthCookieUtil } from "../../../../../shared/utils/cookie.util.ts";
import { authRateLimit } from "../../../../../shared/middleware/rate-limit.middleware.ts";

const STATE_COOKIE = 'googleOAuthState';
const STATE_COOKIE_PATH = '/authentication/google/callback';

export class GoogleOAuth {
  constructor() { }

  private get router() {
    return express.Router();
  }

  /**
   * GET /authentication/google
   * Initiates Google OAuth2 authentication flow
   */
  private get _googleAuthRoute(): Router {
    if (!isGoogleOAuthConfigured()) {
      return this.router.get('/google', (_req, res) => {
        res.status(503).json({ message: 'Google authentication is not configured' });
      });
    }

    return this.router.get('/google', authRateLimit, (req, res, next) => {
      const state = randomBytes(32).toString('base64url');
      res.cookie(STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
        sameSite: 'lax',
        path: STATE_COOKIE_PATH,
        maxAge: 10 * 60 * 1000,
      });
      passport.authenticate('google', {
        scope: ['profile', 'email'],
        state,
      })(req, res, next);
    });
  }

  /**
   * GET /authentication/google/callback
   * Handles Google OAuth2 callback
   */
  private get _googleCallbackRoute(): Router {
    if (!isGoogleOAuthConfigured()) {
      return this.router.get('/google/callback', (_req, res) => {
        res.status(503).json({ message: 'Google authentication is not configured' });
      });
    }

    return this.router.get(
      '/google/callback',
      (req, res, next) => {
        const state = req.query.state;
        const cookieState = req.cookies?.[STATE_COOKIE];
        const stateBytes = typeof state === 'string' ? Buffer.from(state) : null;
        const cookieStateBytes = typeof cookieState === 'string' ? Buffer.from(cookieState) : null;
        res.clearCookie(STATE_COOKIE, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
          sameSite: 'lax',
          path: STATE_COOKIE_PATH,
        });

        if (
          !stateBytes ||
          !cookieStateBytes ||
          stateBytes.length !== cookieStateBytes.length ||
          !timingSafeEqual(stateBytes, cookieStateBytes)
        ) {
          res.status(400).json({ message: 'Invalid OAuth state' });
          return;
        }

        next();
      },
      passport.authenticate('google', { session: false }),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const frontendUrl = process.env.FRONTEND_URL;
          if (!frontendUrl) {
            res.status(503).json({ message: 'Google authentication redirect is not configured' });
            return;
          }

          if (!req.user?.userId) {
            res.redirect(new URL('/login?error=auth_failed', frontendUrl).toString());
            return;
          }

          const tokens = await AuthSessionUtil.issueTokenPair({
            userId: req.user.userId,
            email: req.user.email || ''
          });
          AuthCookieUtil.setAuthCookies(res, tokens);

          // Redirect to frontend with success
          res.redirect(new URL('/auth/success', frontendUrl).toString());
        } catch (error) {
          console.error('Google OAuth callback error:', error);
          const frontendUrl = process.env.FRONTEND_URL;
          if (frontendUrl) {
            res.redirect(new URL('/login?error=server_error', frontendUrl).toString());
            return;
          }

          res.status(500).json({ message: 'Google authentication failed' });
        }
      }
    );
  }

  public get googleAuthRoute(): Router {
    return this._googleAuthRoute;
  }

  public get googleCallbackRoute(): Router {
    return this._googleCallbackRoute;
  }
}
