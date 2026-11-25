import type { Metadata } from "next";
import { isDatabaseConfigured } from "@/db";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset your password · BLY", referrer: "no-referrer", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" && /^[A-Za-z0-9_-]{43}$/.test(params.token) ? params.token : "";
  return <AuthForm mode="reset" token={token} databaseAvailable={isDatabaseConfigured()} />;
}
