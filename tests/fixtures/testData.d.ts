import { PrismaClient } from '@prisma/client';
export declare const createTestUser: (prisma: PrismaClient, overrides?: {}) => Promise<{
    id: string;
    email: string;
    username: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const createTestAccount: (prisma: PrismaClient, userId: string, overrides?: {}) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    accountType: string;
    balance: number;
}>;
export declare const createTestTransaction: (prisma: PrismaClient, accountId: string, overrides?: {}) => Promise<{
    id: string;
    createdAt: Date;
    accountId: string;
    amount: number;
    type: string;
    description: string | null;
}>;
export declare const createFullTestDataset: (prisma: PrismaClient) => Promise<{
    user: {
        id: string;
        email: string;
        username: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
    };
    account: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        accountType: string;
        balance: number;
    };
    transaction: {
        id: string;
        createdAt: Date;
        accountId: string;
        amount: number;
        type: string;
        description: string | null;
    };
}>;
export declare const cleanupTestData: (prisma: PrismaClient) => Promise<void>;
//# sourceMappingURL=testData.d.ts.map