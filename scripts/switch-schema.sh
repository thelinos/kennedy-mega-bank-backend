#!/usr/bin/env bash
set -euo pipefail

environment="${1:-}"

case "$environment" in
  development)
    schema="prisma/schema.prisma"
    ;;
  staging|production)
    schema="prisma/postgresql/schema.prisma"
    ;;
  *)
    echo "Usage: $0 [development|staging|production]" >&2
    exit 1
    ;;
esac

echo "Generating Prisma client for $environment from $schema..."
npx prisma generate --schema "$schema"
