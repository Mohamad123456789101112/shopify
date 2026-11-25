import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--panel2)] px-5">
      <div className="card card-lg w-full max-w-[460px] p-10 text-center shadow-soft">
        <div className="mx-auto w-fit"><LogoMark size={40} /></div>
        <div className="display mt-5 text-[52px] font-extrabold leading-none tracking-tight">404</div>
        <h1 className="mt-3 text-[16px] font-bold">Page not found</h1>
        <p className="mt-2 text-[13px] text-[var(--dim)]">The page you are looking for has moved or never existed.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to BLY</Link>
      </div>
    </main>
  );
}
