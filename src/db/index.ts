import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// Lazy/placeholder URL keeps `next build` from crashing when DATABASE_URL is unset;
// real queries still fail loudly at runtime if it is missing.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/clearledger";

const client = globalForDb.pgClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
