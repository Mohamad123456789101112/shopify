import { NextRequest, NextResponse } from "next/server";

/** Extra CSRF protection for all cookie-authenticated mutations. */
export function proxy(req: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ ok: false, error: "Request origin is not allowed." }, { status: 403 });
    }
  }
  return NextResponse.next();
}
export const config = { matcher: "/api/:path*" };
