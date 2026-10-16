import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { signOut } from "@/app/auth/actions";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, fullName, ownCardId } = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Logo />
          {ownCardId && <NavLinks />}
          <div className="flex items-center gap-3">
            <span
              className={`hidden rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] sm:inline ${
                role === "investor" ? "bg-moss text-paper" : "bg-signal text-white"
              }`}
              title={fullName}
            >
              {role}
            </span>
            <form action={signOut}>
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium transition hover:border-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
        {ownCardId && (
          <div className="border-t border-line md:hidden">
            <NavLinks mobile />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
