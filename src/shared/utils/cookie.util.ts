import { CookieOptions, Response } from 'express';
import { TokenPair } from './jwt.util.ts';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * AuthCookieUtil - Shared HTTP-only cookie options for access/refresh tokens
 */
export class AuthCookieUtil {
  static cookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
      sameSite: 'strict',
      path: '/',
      maxAge,
    };
  }

  static setAuthCookies(res: Response, tokens: TokenPair): void {
    res.cookie('accessToken', tokens.accessToken, this.cookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie('refreshToken', tokens.refreshToken, this.cookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
  }

  static clearAuthCookies(res: Response): void {
    const base = this.cookieOptions(0);
    res.clearCookie('accessToken', base);
    res.clearCookie('refreshToken', base);
  }
}
