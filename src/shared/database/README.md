# Database Configuration

## Database providers

- Development and automated tests use SQLite with `prisma/schema.prisma`.
- Staging and production use PostgreSQL with `prisma/postgresql/schema.prisma`.
- Each provider has a separate migration history. Generate the matching Prisma
  client before building or starting that environment.

```bash
npm run prisma:generate              # SQLite
npm run prisma:generate:postgres      # PostgreSQL
npm run prisma:migrate:dev            # Apply SQLite development migrations
npm run prisma:migrate:dev:postgres   # Apply PostgreSQL development migrations
npm run prisma:migrate:deploy:postgres
npm run build:production
```

`npm run build:production` generates the PostgreSQL client before compiling.
Set `DATABASE_URL` to a SQLite file for local development and to a PostgreSQL
connection string for staging and production. Do not copy production
credentials into `.env.example`.

The test runner always overrides `DATABASE_URL` with the ignored
`tests/test.db`, generates the SQLite client, and applies its migrations before
workers start. It never uses the developer database.

## Connections

`connectPrismaOnly()` eagerly connects the Prisma client so an invalid database
URL or unavailable database fails startup. `disconnectAllDatabases()` closes
the active client on shutdown.

The singleton in `prisma.ts` provides one Prisma client per process. Account
balances and transaction amounts are stored as integer minor units and parsed
using the currency's ISO 4217 precision. Account creation defaults to USD for
backward compatibility; clients can specify another supported currency.
