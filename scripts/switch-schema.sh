#!/bin/bash

# Script to switch Prisma schema based on environment
# Usage: ./scripts/switch-schema.sh [development|staging|production]

ENV=$1

if [ -z "$ENV" ]; then
  echo "Usage: ./scripts/switch-schema.sh [development|staging|production]"
  exit 1
fi

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Switch schema based on environment
case $ENV in
  development)
    echo "Switching to SQLite schema for development..."
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    ;;
  staging|production)
    echo "Switching to MongoDB schema for $ENV..."
    cp prisma/schema.mongodb.prisma prisma/schema.prisma
    ;;
  *)
    echo "Invalid environment: $ENV"
    exit 1
    ;;
esac

echo "Schema switched. Run 'npm run prisma:generate' to regenerate Prisma client."
