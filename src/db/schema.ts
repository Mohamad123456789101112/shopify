import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** auth.users equivalent (Supabase Auth parity: email + password, sessions in httpOnly cookies) */
export const authUsers = pgTable(
  "auth_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("auth_users_email_key").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    ua: text("ua"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
});

export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    storeName: text("store_name").notNull(),
    storeSlug: text("store_slug").notNull(),
    plan: text("plan").notNull().default("free"),
    billing: text("billing").notNull().default("monthly"),
    planStartedAt: timestamp("plan_started_at", { withTimezone: true }),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    subStatus: text("sub_status").notNull().default("active"),
    suspended: boolean("suspended").notNull().default(false),
    suspendedReason: text("suspended_reason"),
    onboarded: boolean("onboarded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("merchants_slug_key").on(t.storeSlug)],
);

export const stores = pgTable("stores", {
  merchantId: uuid("merchant_id")
    .primaryKey()
    .references(() => merchants.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().default({}),
  site: jsonb("site").notNull().default({}),
  sitePublished: jsonb("site_published"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    compareAt: numeric("compare_at", { precision: 12, scale: 2 }),
    stock: integer("stock").notNull().default(0),
    image: text("image"),
    images: text("images").array(),
    category: text("category"),
    collection: text("collection"),
    colors: text("colors").array(),
    sizes: text("sizes").array(),
    badge: text("badge"),
    status: text("status").notNull().default("active"),
    sold: integer("sold").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_merchant_idx").on(t.merchantId), index("products_status_idx").on(t.status)],
);

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    trackingCode: text("tracking_code").notNull(),
    customer: jsonb("customer").notNull(),
    items: jsonb("items").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    shipping: numeric("shipping", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("New"),
    payment: text("payment").notNull().default("cod"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    paymentRef: text("payment_ref"),
    receiptUrl: text("receipt_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    carrier: text("carrier"),
    carrierTracking: text("carrier_tracking"),
    note: text("note"),
    history: jsonb("history").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_tracking_key").on(t.trackingCode),
    index("orders_merchant_idx").on(t.merchantId),
  ],
);

export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    type: text("type").notNull().default("percent"),
    value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
    uses: integer("uses").notNull().default(0),
    maxUses: integer("max_uses"),
    active: boolean("active").notNull().default(true),
    minOrder: numeric("min_order", { precision: 12, scale: 2 }).notNull().default("0"),
    maxDiscount: numeric("max_discount", { precision: 12, scale: 2 }),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    oncePerCustomer: boolean("once_per_customer").notNull().default(false),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("discounts_merchant_code_key").on(t.merchantId, t.code)],
);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("email"),
  audience: text("audience").notNull().default("all"),
  status: text("status").notNull().default("draft"),
  openRate: integer("open_rate").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("info"),
  title: text("title").notNull(),
  text: text("text"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const planPayments = pgTable("plan_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  billing: text("billing").notNull().default("monthly"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull().default("wallet"),
  ref: text("ref").notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by"),
});

export const platformOwners = pgTable("platform_owners", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").notNull().default({}),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actor: uuid("actor"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
});

export const securityLogs = pgTable("security_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actor: uuid("actor"),
  type: text("type").notNull(),
  meta: jsonb("meta").notNull().default({}),
});

/** Storage parity: private per-merchant media, copied to "public" on publish. */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("product"),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    data: text("data").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_merchant_idx").on(t.merchantId)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  hits: integer("hits").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
});

/** Single-use, hashed password reset tokens; never readable by app_client. */
export const passwordResets = pgTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
