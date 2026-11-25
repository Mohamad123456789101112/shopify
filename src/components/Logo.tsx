import Link from "next/link";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[9px] bg-[#111111] text-white dark:bg-white dark:text-[#111]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <path
          d="M7 4.5h6.2c2.3 0 3.8 1.2 3.8 3.1 0 1.4-.8 2.4-2.1 2.9 1.7.4 2.7 1.6 2.7 3.3 0 2.3-1.8 3.7-4.6 3.7H7V4.5Zm3 2.4v3h2.6c1.1 0 1.8-.6 1.8-1.5s-.7-1.5-1.8-1.5H10Zm0 5.2v3.4h3c1.2 0 2-.7 2-1.7s-.8-1.7-2-1.7h-3Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", size = 28 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="display text-[17px] font-extrabold tracking-tight">
        <span style={{ color: "var(--fg)" }}>brand</span>
        <span className="text-[#008060]">ly</span>
      </span>
    </Link>
  );
}
