import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  // Our tables use native Postgres uuid primary keys; let the DB generate them.
  advanced: {
    database: { generateId: false },
  },
  // Production trusts only the configured URL. In development any localhost port is trusted,
  // so `next dev` falling back to 3001/3002 (when 3000 is busy) doesn't break sign-in.
  trustedOrigins: async (request) => {
    const origins = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter((o): o is string => Boolean(o));
    if (process.env.NODE_ENV !== "production") {
      const origin = request?.headers.get("origin");
      if (origin) {
        try {
          const { hostname } = new URL(origin);
          if (hostname === "localhost" || hostname === "127.0.0.1") origins.push(origin);
        } catch {
          /* ignore malformed Origin */
        }
      }
    }
    return origins;
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "free",
        input: false,
      },
      currencyCode: {
        type: "string",
        defaultValue: "USD",
      },
    },
  },
});
