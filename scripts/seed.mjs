import { readFileSync } from "node:fs";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(_scrypt);
const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const client = new pg.Client({ connectionString: url });

async function hash(pw) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(pw, salt, 64);
  return `scrypt$${salt}$${buf.toString("hex")}`;
}

const raw = readFileSync("src/db/sql.ts", "utf8");
const start = raw.indexOf("BOOTSTRAP_SQL = `") + "BOOTSTRAP_SQL = `".length;
const SQL = raw.slice(start, raw.lastIndexOf("`"));

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=80`;
const PRODUCTS = [
  ["Linen wrap dress", 1450, 1850, 14, "1595777457583-95e059d581b8", "Dresses", "New in", ["#e6ded3", "#111111"], "Bestseller"],
  ["Silk slip skirt", 980, 0, 9, "1594633312681-425c7b97ccd1", "Skirts", "New in", ["#3b2a2e", "#c9a75a"], ""],
  ["Oversized poplin shirt", 890, 1100, 22, "1602810318383-e386cc2a3ccf", "Shirts", "Essentials", ["#ffffff", "#1f4e79"], "Sale"],
  ["Structured tote bag", 1750, 0, 6, "1584917865442-de89df76afd3", "Bags", "Leather", ["#8b5e3c"], ""],
  ["Gold hoop earrings", 620, 0, 40, "1515562141207-7a88fb7ce338", "Jewellery", "Gold", ["#c9a75a"], "Limited"],
  ["Knit cardigan", 1290, 1490, 3, "1434389677669-e08b4cac3105", "Knitwear", "Winter", ["#f4f1ec", "#6f6a64"], ""],
];

async function main() {
  await client.connect();
  console.log("applying security layer…");
  await client.query(SQL);

  const existing = await client.query("select id from auth_users where lower(email) = 'layla@studio.com'");
  if (existing.rows.length === 0) {
    const pw = await hash("Brandly2026");
    const owner = await client.query("insert into auth_users(email, password_hash) values ('owner@brandly.store', $1) returning id", [pw]);
    const ownerId = owner.rows[0].id;
    await client.query("insert into profiles(id, email, name) values ($1, 'owner@brandly.store', 'Platform Owner')", [ownerId]);
    await client.query("insert into platform_owners(user_id, is_active) values ($1, true)", [ownerId]);

    const m = await client.query("insert into auth_users(email, password_hash) values ('layla@studio.com', $1) returning id", [pw]);
    const mid = m.rows[0].id;
    await client.query("insert into profiles(id, email, name) values ($1, 'layla@studio.com', 'Layla Hassan')", [mid]);
    await client.query(
      `insert into merchants(id, email, name, store_name, store_slug, plan, billing, plan_started_at, plan_expires_at, sub_status, onboarded)
       values ($1, 'layla@studio.com', 'Layla Hassan', 'Layla Studio', 'layla-studio', 'growth', 'monthly', now(), now() + interval '21 days', 'active', true)`,
      [mid],
    );
    await client.query(
      `insert into stores(merchant_id, settings, site)
       values ($1, jsonb_build_object('currency','EGP','shippingFee',60,'freeShippingThreshold',1500,'codFee',0,'category','Fashion',
         'paymentsPublic', jsonb_build_object('cod',true,'wallet',false,'instapay',false)), '{}'::jsonb)`,
      [mid],
    );
    for (const [name, price, compare, stock, img, category, collection, colors, badge] of PRODUCTS) {
      await client.query(
        `insert into products(merchant_id, name, description, price, compare_at, stock, image, category, collection, colors, sizes, badge)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [mid, name, "Cut and sewn in small batches in our Cairo studio.", price, compare || null, stock, IMG(img), category, collection, colors, ["S", "M", "L"], badge || null],
      );
    }
    const prods = await client.query("select id, name, price, image from products where merchant_id = $1 limit 2", [mid]);
    let i = 0;
    for (const p of prods.rows) {
      i++;
      await client.query(
        `insert into orders(merchant_id, tracking_code, customer, items, subtotal, discount, shipping, total, status, payment, payment_status, history, created_at)
         values ($1, $2, $3::jsonb, $4::jsonb, $5, 0, 60, $6, $7, 'cod', 'unpaid',
           jsonb_build_array(jsonb_build_object('at', now(), 'label', 'Order placed')), now() - ($8 || ' days')::interval)`,
        [
          mid,
          `LS-${String(10000 + i)}`,
          JSON.stringify({ name: i === 1 ? "Mariam Adel" : "Hana Saeed", phone: `0100000000${i}`, city: i === 1 ? "Cairo" : "Alexandria", email: "customer@example.com", address: "12 Nile St" }),
          JSON.stringify([{ productId: p.id, name: p.name, qty: 1, price: Number(p.price), image: p.image }]),
          Number(p.price),
          Number(p.price) + 60,
          i === 1 ? "New" : "Delivered",
          String(i * 2),
        ],
      );
    }
    await client.query(
      "insert into notifications(merchant_id, kind, title, text) values ($1, 'info', 'Welcome to BLY', 'Your demo store is ready.')",
      [mid],
    );
    console.log("seeded demo merchant + platform owner");
  } else {
    console.log("demo data already present");
  }
  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end().catch(() => {});
  process.exit(1);
});
