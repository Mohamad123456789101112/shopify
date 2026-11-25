import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { rls, logSecurity } from "@/db/rls";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LIMITS: Record<string, number> = { logo: 2 * 1024 * 1024, favicon: 1024 * 1024, product: 5 * 1024 * 1024, receipt: 5 * 1024 * 1024 };

/** Magic-byte sniffing — the declared MIME type is never trusted, SVG is always rejected. */
function sniff(buf: Uint8Array): string | null {
  const b = buf;
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  const ascii = (i: number, len: number) => String.fromCharCode(...b.slice(i, i + len));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(4, 4) === "ftyp" && ascii(8, 4).startsWith("avif")) return "image/avif";
  return null;
}

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) return databaseUnavailableResponse();
  const user = await getSessionUser();
  if (!user?.merchant) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "product");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  if (!LIMITS[kind]) return NextResponse.json({ ok: false, error: "Invalid folder." }, { status: 400 });
  if (file.size > LIMITS[kind]) {
    return NextResponse.json({ ok: false, error: `Max size for ${kind} is ${Math.round(LIMITS[kind] / 1024 / 1024)}MB.` }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniff(bytes);
  if (!mime) {
    await logSecurity("upload.rejected", { kind, declared: file.type.slice(0, 40) }, user.id);
    return NextResponse.json({ ok: false, error: "Only JPEG, PNG, WebP, GIF or AVIF images are allowed (SVG is rejected)." }, { status: 400 });
  }

  const dataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
  const id = await rls(user.id, async (tx) => {
    const res = await tx.execute(sql`
      insert into media(merchant_id, kind, mime, bytes, data, is_public)
      values (${user.id}, ${kind}, ${mime}, ${bytes.length}, ${dataUrl}, ${kind === "receipt" ? false : false})
      returning id`);
    return (res.rows[0] as { id: string }).id;
  });

  return NextResponse.json({ ok: true, url: `/api/media/${id}`, mime, bytes: bytes.length });
}
