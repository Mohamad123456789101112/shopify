import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { Pool } from "pg";

async function main() {
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("Use an isolated TEST_DATABASE_URL; this test creates and removes merchant accounts.");
const pool = new Pool({ connectionString: databaseUrl });
const suffix = randomBytes(6).toString("hex");
const password = `TestCommerce${suffix}9`;
const emails = [`owner-${suffix}@example.test`, `other-${suffix}@example.test`];
const users: string[] = [];
let cookie = "";
async function post(path: string, data: unknown, session = cookie) {
  const res = await fetch(new URL(path, base), { method: "POST", headers: { "Content-Type": "application/json", Cookie: session, "x-forwarded-for": "192.0.2.123" }, body: JSON.stringify(data) });
  const body = await res.json();
  return { res, body };
}
const merchant = (action: string, data: unknown = {}, session = cookie) => post("/api/merchant", { action, data }, session);
try {
  const health = await fetch(new URL("/api/health", base));
  assert.equal(health.status, 200); assert.equal((await health.json()).database, "connected");
  assert.equal((await merchant("product.save", { name: "Unauthorized" }, "")).res.status, 401);
  assert.equal((await post("/api/auth/signup", { email: "invalid" })).res.status, 400);
  let otherCookie = "";
  for (const [index,email] of emails.entries()) {
    const signup = await post("/api/auth/signup", { email, password, name: "Test Merchant", storeName: `Atelier ${suffix} ${index}` }, "");
    assert.equal(signup.res.status, 200, JSON.stringify(signup.body));
    assert.equal(signup.body.redirect, "/setup");
    const session = signup.res.headers.get("set-cookie")!;
    assert.match(session, /HttpOnly/i); assert.match(session, /SameSite=lax/i);
    if (index === 0) cookie = session.split(";")[0]; else otherCookie = session.split(";")[0];
    const account = await pool.query("select id,password_hash from auth_users where email=$1", [email]);
    users.push(account.rows[0].id);
    assert.match(account.rows[0].password_hash, /^scrypt\$/);
    assert.notEqual(account.rows[0].password_hash, password);
  }
  assert.equal((await post("/api/auth/login", { email: emails[0], password: "Incorrect123!" }, "")).body.ok, false);
  const login = await post("/api/auth/login", { email: emails[0], password }, "");
  assert.equal(login.body.ok, true, JSON.stringify(login.body));
  cookie = login.res.headers.get("set-cookie")!.split(";")[0];
  const duplicate = await post("/api/auth/signup", { email: emails[0], password, name: "Test Merchant", storeName: "Duplicate" }, "");
  assert.equal(duplicate.body.ok, false);
  const slug = `atelier-${suffix}`;
  const setup = await merchant("setup.complete", { storeName: "Integration Atelier", slug, theme: "atelier", currency: "EGP", category: "Fashion" });
  assert.equal(setup.body.ok, true, JSON.stringify(setup.body));
  assert.equal(setup.body.slug, slug);
  for (const path of ["/dashboard", "/dashboard?days=7", "/dashboard/products", "/dashboard/orders", "/dashboard/customers", "/dashboard/settings", "/dashboard/builder"]) {
    const res = await fetch(new URL(path, base), { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(res.status, 200, path); await res.text();
  }
  const product = await merchant("product.save", { name: "Test linen shirt", price: 250, stock: 5, colors: ["#111111"], sizes: ["M", "L"], status: "active" });
  assert.equal(product.body.ok, true, JSON.stringify(product.body));
  const id = product.body.id;
  const foreign = await merchant("product.save", { id, name: "HACKED", price: 1, stock: 500 }, otherCookie);
  const stored = await pool.query("select name,price,stock from products where id=$1", [id]);
  assert.equal(stored.rows[0].name, "Test linen shirt");
  assert.equal(foreign.body.ok, false, "Cross-tenant updates must not report success");
  const storefront = await fetch(new URL(`/store/${slug}`, base));
  assert.equal(storefront.status, 200); assert.match(await storefront.text(), /Test linen shirt/);
  const order = await post("/api/store", { action: "order.place", data: { slug, payment: "cod", customer: { name: "Test Buyer", phone: "01012345678", city: "Cairo", address: "Test address" }, items: [{ productId: id, qty: 2, price: 1 }] } }, "");
  assert.equal(order.body.ok, true, JSON.stringify(order.body));
  const ordered = await pool.query("select subtotal,total,shipping,status from orders where id=$1", [order.body.order.id]);
  assert.equal(Number(ordered.rows[0].subtotal), 500, "Server must ignore client-supplied prices");
  assert.equal(Number(ordered.rows[0].total), 500 + Number(ordered.rows[0].shipping));
  assert.equal((await pool.query("select stock from products where id=$1", [id])).rows[0].stock, 3);
  const track = await post("/api/store", { action: "order.track", data: { slug, code: order.body.order.tracking_code, phone: "01012345678" } }, "");
  assert.equal(track.body.ok, true, JSON.stringify(track.body));
  const wrongPhone = await post("/api/store", { action: "order.track", data: { slug, code: order.body.order.tracking_code, phone: "000000" } }, "");
  assert.equal(wrongPhone.body.ok, false);
  assert.equal((await merchant("order.update", { id: order.body.order.id, status: "Delivered" })).body.ok, true);
  assert.equal((await pool.query("select status from orders where id=$1", [order.body.order.id])).rows[0].status, "Delivered");
  const settings = await merchant("settings.save", { storeName: "Integration Atelier", settings: { currency: "EGP", shippingFee: 35, freeShippingThreshold: 2000, codFee: 0 }, payments: { cod: { enabled: true, fee: 0, label: "Cash on delivery", note: "" } } });
  assert.equal(settings.body.ok, true, JSON.stringify(settings.body));
  await pool.query("update merchants set plan='growth' where id=$1", [users[0]]);
  const discount = await merchant("discount.save", { code: "WELCOME25", type: "percent", value: 25, active: true, oncePerCustomer: true });
  assert.equal(discount.body.ok, true, JSON.stringify(discount.body));
  const preview = await post("/api/store", { action: "discount.check", data: { slug, code: "WELCOME25", subtotal: 500 } }, "");
  assert.equal(preview.body.ok, true, JSON.stringify(preview.body));
  assert.equal(Number(preview.body.amount), 125);
  const discountOrder = { action: "order.place", data: { slug, payment: "cod", code: "WELCOME25", customer: { name: "Discount Buyer", phone: "01187654321" }, items: [{ productId: id, qty: 2 }] } };
  const discounted = await post("/api/store", discountOrder, "");
  assert.equal(discounted.body.ok, true, JSON.stringify(discounted.body));
  assert.equal(Number(discounted.body.order.total), 410);
  const repeated = await post("/api/store", discountOrder, "");
  assert.equal(repeated.body.ok, false, "Once-per-customer code must not be reusable");
  assert.equal((await pool.query("select stock from products where id=$1", [id])).rows[0].stock, 1);
  const admin = await post("/api/admin", { action: "overview" });
  assert.equal(admin.res.status, 403);
  const formData = new FormData();
  formData.append("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7L8AAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "test.png");
  formData.append("kind", "product");
  const uploaded = await fetch(new URL("/api/upload", base), { method: "POST", headers: { Cookie: cookie }, body: formData });
  const media = await uploaded.json();
  assert.equal(media.ok, true, JSON.stringify(media));
  assert.equal((await fetch(new URL(media.url, base))).status, 404, "Unpublished uploads must stay private");
  const site = (await pool.query("select site from stores where merchant_id=$1", [users[0]])).rows[0].site;
  const publish = await merchant("site.publish", { site });
  assert.equal(publish.body.ok, true);
  assert.equal((await fetch(new URL(media.url, base))).status, 200);
  assert.equal((await merchant("product.delete", { id })).body.ok, true);
  assert.equal((await pool.query("select 1 from products where id=$1", [id])).rowCount, 0);
  // Exercise real row-level security, not only API ownership filters.
  const conn = await pool.connect();
  try {
    await conn.query("begin");
    await conn.query("select set_config('app.user_id', $1, true)", [users[1]]);
    await conn.query("set local role app_client");
    assert.equal((await conn.query("select * from orders where merchant_id=$1", [users[0]])).rowCount, 0);
    await conn.query("rollback");
  } finally { conn.release(); }
  const csrf = await fetch(new URL("/api/auth/logout", base), { method: "POST", headers: { Origin: "https://untrusted.example" } });
  assert.equal(csrf.status, 403);
  const rawToken = randomBytes(32).toString("base64url");
  await pool.query("insert into password_resets(token_hash,user_id,expires_at) values($1,$2,now()+interval '30 minutes')", [createHash("sha256").update(rawToken).digest("hex"), users[0]]);
  const newPassword = `NewCommerce${suffix}8`;
  assert.equal((await post("/api/auth/reset-password", { token: rawToken, password: newPassword }, "")).body.ok, true);
  assert.equal((await post("/api/auth/reset-password", { token: rawToken, password: newPassword }, "")).body.ok, false, "Tokens must be single-use");
  const revoked = await fetch(new URL("/dashboard", base), { headers: { Cookie: cookie }, redirect: "manual" });
  assert.equal(revoked.status, 307);
  assert.equal((await post("/api/auth/login", { email: emails[0], password }, "")).body.ok, false);
  const relogin = await post("/api/auth/login", { email: emails[0], password: newPassword }, "");
  assert.equal(relogin.body.ok, true);
  cookie = relogin.res.headers.get("set-cookie")!.split(";")[0];
  const logout = await post("/api/auth/logout", {});
  assert.equal(logout.body.ok, true);
  const signedOut = await fetch(new URL("/dashboard", base), { headers: { Cookie: cookie }, redirect: "manual" });
  assert.equal(signedOut.status, 307);
  console.log("PASS: signup, duplicate/invalid accounts, password hashing, login, secure cookies, setup, dashboard pages, product CRUD/tenant isolation, storefront, server-priced checkout/stock, tracking, fulfillment, shipping settings, discount preview/redemption/single-use, private/public media, RLS, CSRF, single-use password reset, session revocation and logout.");
} finally {
  for (const uid of users) await pool.query("delete from auth_users where id=$1", [uid]);
  await pool.query("delete from rate_limits where key like '%192.0.2.123%'");
  await pool.end();
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
