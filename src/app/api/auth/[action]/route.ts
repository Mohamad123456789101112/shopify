import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { NextResponse } from "next/server";
import {
  clientIp, destroySession, getSessionUser, signIn, signUpMerchant, validEmail, validatePassword,
} from "@/lib/auth";
import { logSecurity, rateLimit } from "@/db/rls";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;
const str = (b: Body, k: string, max = 200) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  if (action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  if (!isDatabaseConfigured()) return databaseUnavailableResponse();

  if (action === "signup") {
    const ip = await clientIp();
    if (!(await rateLimit(`signup:${ip}`, 6, 900, 900))) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const email = str(body, "email", 200).toLowerCase();
    const password = typeof body.password === "string" ? (body.password as string) : "";
    const name = str(body, "name", 60);
    const storeName = str(body, "storeName", 40) || name;
    if (!validEmail(email)) return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
    if (name.length < 2) return NextResponse.json({ ok: false, error: "Name must be at least 2 characters." }, { status: 400 });
    if (storeName.length < 2) return NextResponse.json({ ok: false, error: "Store name must be at least 2 characters." }, { status: 400 });
    const pwErr = validatePassword(password);
    if (pwErr) return NextResponse.json({ ok: false, error: pwErr }, { status: 400 });

    const { id } = await signUpMerchant(email, password, name, storeName);
    if (!id) {
      await logSecurity("signup.duplicate", { email: email.slice(0, 80), ip });
      return NextResponse.json({ ok: false, error: "Could not create this account. Try logging in instead." }, { status: 400 });
    }
    const res = await signIn(email, password);
    if ("error" in res) return NextResponse.json({ ok: true, redirect: "/login" });
    await logSecurity("signup.success", { ip }, id);
    return NextResponse.json({ ok: true, redirect: "/setup" });
  }

  if (action === "login") {
    const email = str(body, "email", 200).toLowerCase();
    const password = typeof body.password === "string" ? (body.password as string) : "";
    if (!email || !password) return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 400 });
    const res = await signIn(email, password);
    if ("error" in res) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    const user = await getSessionUser();
    const redirect = user?.isOwner ? "/admin" : user?.merchant?.onboarded ? "/dashboard" : "/setup";
    return NextResponse.json({ ok: true, redirect });
  }

  if (action === "reset") {
    // Never reveals whether the account exists.
    const ip = await clientIp();
    await rateLimit(`reset:${ip}`, 6, 900, 900);
    await logSecurity("password.reset_requested", { email: str(body, "email", 80), ip });
    return NextResponse.json({ ok: true, message: "If an account exists for that email, a reset link is on its way." });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 404 });
}
