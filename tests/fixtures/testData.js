export const createTestUser = async (prisma, overrides = {}) => {
    return prisma.user.create({
        data: {
            email: 'test@example.com',
            username: 'testuser',
            name: 'Test User',
            ...overrides,
        },
    });
};
export const createTestAccount = async (prisma, userId, overrides = {}) => {
    return prisma.account.create({
        data: {
            userId,
            accountType: 'checking',
            balance: 1000.0,
            ...overrides,
        },
    });
};
export const createTestTransaction = async (prisma, accountId, overrides = {}) => {
    return prisma.transaction.create({
        data: {
            accountId,
            amount: 100.0,
            type: 'deposit',
            description: 'Test transaction',
            ...overrides,
        },
    });
};
export const createFullTestDataset = async (prisma) => {
    const user = await createTestUser(prisma);
    const account = await createTestAccount(prisma, user.id);
    const transaction = await createTestTransaction(prisma, account.id);
    return { user, account, transaction };
};
export const cleanupTestData = async (prisma) => {
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
};
//# sourceMappingURL=testData.js.map