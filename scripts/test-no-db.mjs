import assert from "node:assert/strict";

// Run against `npm start` with DATABASE_URL unset, after `npm run build`.
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
async function request(path, options = {}) {
  return fetch(new URL(path, base), { redirect: "manual", ...options });
}

for (const path of ["/", "/about", "/pricing", "/features", "/templates", "/login", "/signup", "/forgot-password"]) {
  const res = await request(path, { headers: { Cookie: "bly_session=stale-session" } });
  assert.equal(res.status, 200, path);
  await res.text();
  console.log(`PASS 200 ${path} (including stale session cookie)`);
}
const health = await request("/api/health");
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { ok: true, database: "not_configured", mode: "website-only" });

for (const path of ["/api/auth/login", "/api/auth/signup", "/api/auth/reset", "/api/merchant", "/api/admin", "/api/store", "/api/upload", "/api/media/00000000-0000-0000-0000-000000000001"]) {
  const res = await request(path, { method: path.includes("/media/") ? "GET" : "POST" });
  assert.equal(res.status, 503, path);
  assert.equal((await res.json()).code, "DATABASE_NOT_CONFIGURED", path);
  console.log(`PASS controlled 503 ${path}`);
}
const logout = await request("/api/auth/logout", { method: "POST", headers: { Cookie: "bly_session=stale-session" } });
assert.equal(logout.status, 200);
assert.equal((await logout.json()).ok, true);
assert.match(logout.headers.get("set-cookie"), /bly_session=;/);

for (const path of ["/dashboard", "/dashboard/products", "/setup", "/admin"]) {
  const res = await request(path);
  assert.ok([307, 308].includes(res.status), path);
  assert.equal(new URL(res.headers.get("location"), base).pathname, "/login", path);
}
for (const path of ["/store/missing", "/store/missing/checkout", "/store/missing/track", "/store/missing/p/00000000-0000-0000-0000-000000000001", "/store/missing/page/about"]) {
  const res = await request(path);
  assert.equal(res.status, 404, path);
}
console.log("PASS health, logout, protected redirects, and missing storefronts. No-database checks passed.");
