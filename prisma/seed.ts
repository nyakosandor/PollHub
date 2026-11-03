/**
 * Resets the database to the demo state. Run with `npx prisma db seed`.
 * Deletes existing rows first, so it is safe to run repeatedly.
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_USERS, resetDatabase } from "./seed-data";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

resetDatabase(prisma)
  .then(() => {
    console.log("Seeded demo data. Sign in with:");
    for (const { email, password, role } of Object.values(DEMO_USERS)) {
      console.log(`  ${role.padEnd(11)} ${email} / ${password}`);
    }
  })
  .finally(() => prisma.$disconnect());
