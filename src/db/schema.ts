import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  bigint,
  date,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan_tier", ["free", "pro"]);
export const subStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "expired",
]);
export const billingCycleEnum = pgEnum("billing_cycle", [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    currencyCode: varchar("currency_code", { length: 3 }).default("USD").notNull(),
    plan: planEnum("plan").default("free").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_plan_idx").on(table.plan),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_idx").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
  ]
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 128 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)]
);

export const verifications = pgTable("verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerSubscriptionId: varchar("provider_subscription_id", { length: 128 }).notNull(),
    providerCustomerId: varchar("provider_customer_id", { length: 128 }).notNull(),
    variantId: varchar("variant_id", { length: 128 }).notNull(),
    status: subStatusEnum("status").notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sub_user_id_idx").on(table.userId),
    uniqueIndex("sub_provider_sub_id_idx").on(table.providerSubscriptionId),
  ]
);

export const webhookEvents = pgTable("webhook_events", {
  eventId: varchar("event_id", { length: 128 }).primaryKey(),
  eventName: varchar("event_name", { length: 64 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

export interface BudgetAllocationItem {
  id: string;
  label: string;
  bucket: "need" | "want" | "saving" | "debt";
  amountCents: number;
}

export const savedBudgets = pgTable(
  "saved_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    monthYear: varchar("month_year", { length: 7 }).notNull(),
    netIncomeCents: bigint("net_income_cents", { mode: "number" }).notNull(),
    allocations: jsonb("allocations").$type<BudgetAllocationItem[]>().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("budgets_user_id_idx").on(table.userId)]
);

export const recurringBills = pgTable(
  "recurring_bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    category: varchar("category", { length: 50 }).default("Utility").notNull(),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    billingCycle: billingCycleEnum("billing_cycle").default("monthly").notNull(),
    nextDueDate: date("next_due_date", { mode: "string" }).notNull(),
    remindDaysBefore: bigint("remind_days_before", { mode: "number" }).default(2).notNull(),
    lastRemindedForDate: date("last_reminded_for_date", { mode: "string" }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bills_user_id_idx").on(table.userId),
    index("bills_due_date_idx").on(table.nextDueDate),
  ]
);
