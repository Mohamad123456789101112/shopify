"use client";

import { LogoMark } from "@/components/Logo";

const SHOTS = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80",
];

/** Pure-CSS device composition used across the marketing site (no heavy assets). */
export function HeroMock() {
  return (
    <div className="relative select-none">
      <div className="absolute -right-6 -top-6 hidden w-[190px] rounded-2xl border bg-white p-3 shadow-soft lg:block" style={{ borderColor: "var(--border)" }}>
        <div className="text-[10px] font-semibold text-[#6f6a64]">Total Sales</div>
        <div className="mt-1 flex items-end justify-between">
          <span className="display text-[19px] font-extrabold text-[#111]">$2,843</span>
          <span className="pill bg-emerald-50 text-emerald-600">+19%</span>
        </div>
        <svg viewBox="0 0 120 34" className="mt-2 w-full">
          <polyline points="0,28 16,24 32,26 48,18 64,20 80,12 96,14 120,4" fill="none" stroke="#e0704a" strokeWidth="2" />
        </svg>
      </div>

      <div className="rounded-[22px] border bg-[var(--panel)] p-3 shadow-soft" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <LogoMark size={18} />
            <span className="display text-[11px] font-bold">BRANDLY</span>
          </div>
          <div className="flex gap-3 text-[9px] text-[var(--dim)]">
            <span>Shop</span><span>About</span><span>Contact</span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_1fr]">
          <div className="aspect-box h-[178px] rounded-xl" >
            <img src={SHOTS[0]} alt="" className="h-full w-full rounded-xl object-cover" />
          </div>
          <div className="flex flex-col justify-center gap-2 px-1">
            <div className="serif text-[19px] leading-tight">Your Brand<br />Your Store</div>
            <div className="text-[10.5px] text-[var(--dim)]">Launch in minutes, sell across Egypt.</div>
            <span className="btn btn-primary !py-1.5 !text-[10.5px] w-fit">Shop Now →</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {SHOTS.map((s) => (
            <div key={s} className="aspect-box h-[66px] rounded-lg">
              <img src={s} alt="" className="h-full w-full rounded-lg object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-8 left-2 hidden w-[230px] rounded-2xl border bg-white p-3 shadow-soft md:block" style={{ borderColor: "var(--border)" }}>
        <div className="text-[10px] font-semibold text-[#6f6a64]">Orders</div>
        {[["#1347", "$48.00"], ["#1346", "$72.00"], ["#1345", "$56.00"]].map(([id, amt]) => (
          <div key={id} className="mt-2 flex items-center justify-between text-[10px] text-[#111]">
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full brand-grad opacity-80" /> New Order {id}
            </span>
            <span className="font-semibold">{amt}</span>
          </div>
        ))}
      </div>

      <div className="absolute -bottom-6 right-0 hidden rounded-2xl bg-[#111] px-4 py-3 text-white shadow-soft lg:block">
        <div className="text-[11px] font-semibold">Your Store is Ready!</div>
        <div className="mt-1 text-[10.5px] text-white/60">brandly.store/yourbrand</div>
      </div>
    </div>
  );
}

export function DashboardMock() {
  return (
    <div className="rounded-[22px] border bg-[var(--panel)] p-3 shadow-soft" style={{ borderColor: "var(--border)" }}>
      <div className="grid grid-cols-[130px_1fr] gap-3">
        <div className="rounded-xl bg-[var(--panel2)] p-2 text-[10px] text-[var(--dim)]">
          <div className="mb-2 flex items-center gap-1.5 px-1"><LogoMark size={14} /> <span className="display text-[10px] font-bold">BRANDLY</span></div>
          {["Dashboard", "Products", "Orders", "Customers", "Analytics", "Marketing", "Settings"].map((i, idx) => (
            <div key={i} className={`rounded-lg px-2 py-1.5 ${idx === 0 ? "bg-[var(--panel)] font-semibold text-[var(--fg)]" : ""}`}>{i}</div>
          ))}
        </div>
        <div>
          <div className="text-[11px] font-semibold">Good morning, Ahmed 👋</div>
          <div className="text-[9.5px] text-[var(--dim)]">Here is what is happening with your store today.</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[["Total Sales", "$2,843", "+12%"], ["Orders", "124", "+6%"], ["Visitors", "8,421", "+15%"]].map(([l, v, d]) => (
              <div key={l} className="rounded-xl bg-[var(--panel2)] p-2">
                <div className="text-[9px] text-[var(--dim)]">{l}</div>
                <div className="display text-[13px] font-bold">{v}</div>
                <div className="text-[9px] font-semibold text-emerald-600">{d}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-xl bg-[var(--panel2)] p-3">
            <div className="flex items-center justify-between text-[9.5px] text-[var(--dim)]"><span>Sales Overview</span><span>Last 7 days</span></div>
            <svg viewBox="0 0 300 70" className="mt-1 w-full">
              <polyline points="0,60 40,52 80,55 120,40 160,44 200,26 240,30 300,10" fill="none" stroke="#e0704a" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
