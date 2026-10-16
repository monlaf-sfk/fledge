import { Logo } from "@/components/logo";

export function AuthShell({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-ink p-10 text-paper md:flex">
        <Logo inverted />
        <div>{aside}</div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/40">Discover → Evaluate → Match → Connect</p>
      </section>
      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="md:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight">{title}</h1>
          <div className="mt-10">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-ink/20 bg-white/70 px-4 py-3 text-base outline-none transition placeholder:text-ink/30 focus:border-ink focus:bg-white focus:ring-4 focus:ring-signal/15"
      />
    </label>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm text-[#a8320a]">
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm text-moss">
        {message}
      </p>
    );
  return null;
}
