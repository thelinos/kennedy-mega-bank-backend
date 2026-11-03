import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma.ts';
import { REFRESH_TOKEN_TTL_SECONDS, JWTUtil, TokenPair } from './jwt.util.ts';

type SessionWriter = Prisma.TransactionClient | PrismaClient;

export class AuthSessionUtil {
  static async issueTokenPair(
    identity: { userId: string; email: string },
    familyId: string = randomUUID(),
    client: SessionWriter = getPrismaClient(),
  ): Promise<TokenPair> {
    const tokens = JWTUtil.generateTokenPair(identity);
    const refresh = JWTUtil.verifyRefreshToken(tokens.refreshToken);

    if (!refresh.tokenId) {
      throw new Error('Generated refresh token is missing its identifier');
    }

    await client.refreshSession.create({
      data: {
        tokenId: refresh.tokenId,
        familyId,
        userId: identity.userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return tokens;
  }
}
