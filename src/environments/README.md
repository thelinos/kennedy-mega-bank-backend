# Runtime Environments

## Development

`src/environments/development/index.ts` loads `.env.development`, connects
Prisma using the SQLite schema, and starts the local server.

```bash
npm run switch-schema:dev
npm run dev
```

## Staging and production

Both use the PostgreSQL schema. Generate the matching Prisma client before
running either environment; `npm run staging` and `npm run prod` do this
automatically. For compiled deployments, use:

```bash
npm run build:staging
npm run start:staging

npm run build:production
npm run start:prod
```

Set `DATABASE_URL` to the environment's PostgreSQL connection string and
configure `CORS_ORIGINS` and JWT signing secrets. Apply production migrations
with `npm run prisma:migrate:deploy:postgres` as a deployment step before
starting the new application version.

## Shutdown

Each environment connects to Prisma before listening and calls
`disconnectAllDatabases()` during shutdown.

## Environment loading

`loadEnv('development' | 'staging' | 'production')` loads the matching
`.env.<environment>` file and falls back to `.env` only when `DATABASE_URL` is
not set. Production secrets should be injected by the deployment platform, not
stored in the repository.
