import express, { Request, Response, Router } from "express";
import passport from 'passport';
import { JWTUtil } from "../../../../../shared/utils/jwt.util.ts";
// import Status from "../../../../../shared/types/enums/status.enum.ts";

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
    return this.router.get('/google', passport.authenticate('google', {
      scope: ['profile', 'email'],
    }));
  }

  /**
   * GET /authentication/google/callback
   * Handles Google OAuth2 callback
   */
  private get _googleCallbackRoute(): Router {
    return this.router.get(
      '/google/callback',
      passport.authenticate('google', { session: false }),
      async (req: Request, res: Response): Promise<void> => {
        try {
          if (!req.user) {
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
            return;
          }

          const user = req.user as any;

          // Generate JWT tokens
          const { accessToken, refreshToken } = JWTUtil.generateTokenPair({
            userId: user.id,
            email: user.email || ''
          });

          // Set HTTP-only cookies
          const isProduction = process.env.NODE_ENV === 'production';
          res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 // 1 hour
          });

          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });

          // Redirect to frontend with success
          res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
        } catch (error) {
          console.error('Google OAuth callback error:', error);
          res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
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
