import { db } from "./db.ts";
import { seed } from "./seed.ts";

export { db };

export async function listUsers(limit = 10) {
  await seed();
  const users = [];

  for await (const user of db.orm.users.select("_id", "email", "username", "name").limit(limit).all()) {
    users.push({
      id: String(user._id),
      email: user.email,
      username: user.username ?? null,
      name: user.name ?? null,
      createdAt: null as string | null,
    });
  }

  return users;
}

export type StarterUser = Awaited<ReturnType<typeof listUsers>>[number];
