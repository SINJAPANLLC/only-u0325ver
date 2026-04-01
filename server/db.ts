import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const rawUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Remove channel_binding parameter which is not supported by node-postgres
const connectionString = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "");

export const pool = new Pool({
  connectionString,
  ssl: rawUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
