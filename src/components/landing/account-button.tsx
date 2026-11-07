import Link from "next/link";
import { UserRound } from "lucide-react";

// Account shortcut shown on the landing page once a visitor is signed in.
export function AccountButton({ className = "" }: { className?: string }) {
  return (
    <Link href="/discover" aria-label="Go to Discover" title="Discover" className={className}>
      <UserRound className="size-5" aria-hidden />
    </Link>
  );
}
