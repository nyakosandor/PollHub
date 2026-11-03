import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { resetDatabase } from "../prisma/seed-data";
import { E2E_DATABASE_URL } from "./env";

/** Direct access to the database the app under test uses. */
export const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: E2E_DATABASE_URL }),
});

/** Back to the seed: demo users, two polls, and four votes on the closed one. */
export const resetDb = () => resetDatabase(db);
