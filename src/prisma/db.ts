import mongo from "@prisma/orm-mongo/runtime";

import service from "../../service.ts";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

function getDatabaseUrl(): string | undefined {
  try {
    return service.input().databaseUrl.expose();
  } catch {
    return process.env.DATABASE_URL;
  }
}

const databaseUrl = getDatabaseUrl();

export const db = databaseUrl
  ? mongo<Contract>({ contractJson, url: databaseUrl })
  : mongo<Contract>({ contractJson });

let connection: Promise<void> | undefined;

export function connectDatabase(): Promise<void> {
  connection ??= db.connect().then(() => undefined).catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  return connection;
}
