"use client";

export async function merchantRequest(action: string, data: Record<string, unknown> = {}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const res = await fetch("/api/merchant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) });
    const body = await res.json();
    return { ...body, ok: res.ok && body.ok === true };
  } catch {
    return { ok: false, error: "Could not connect. Check your connection and try again." };
  }
}
