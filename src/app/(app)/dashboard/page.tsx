import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

// The old dashboard is now the Personal Account page; keep the URL for login redirects and bookmarks.
export default async function DashboardPage() {
  const session = await requireSession();
  if (session.isAdmin && !session.ownCardId) redirect("/insights");
  redirect("/account");
}
