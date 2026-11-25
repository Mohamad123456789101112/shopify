import { LogoMark } from "@/components/Logo";

export function Suspended({ name }: { name: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#faf8f5] px-5">
      <div className="card card-lg w-full max-w-[440px] p-10 text-center shadow-soft">
        <div className="mx-auto w-fit"><LogoMark size={36} /></div>
        <h1 className="display mt-5 text-[20px] font-bold">{name} is temporarily unavailable</h1>
        <p className="mt-2 text-[13px] text-[var(--dim)]">This store is paused while the merchant sorts things out. Please check back soon.</p>
      </div>
    </main>
  );
}
