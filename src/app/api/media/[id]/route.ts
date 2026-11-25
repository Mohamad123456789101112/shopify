import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { sql } from "drizzle-orm";
import { rls } from "@/db/rls";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Private bucket read: RLS decides (own media, platform owner, or published/public copies). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return databaseUnavailableResponse();
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const user = await getSessionUser();
  const row = await rls(user?.id ?? null, async (tx) => {
    const res = await tx.execute(sql`select mime, data, is_public from media where id = ${id} limit 1`);
    return res.rows[0] as { mime: string; data: string; is_public: boolean } | undefined;
  });
  if (!row) return new Response("Not found", { status: 404 });
  const base64 = row.data.split(",")[1] ?? "";
  const buf = Buffer.from(base64, "base64");
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": row.is_public ? "public, max-age=604800, immutable" : "private, max-age=60",
      "Content-Length": String(buf.length),
    },
  });
}
