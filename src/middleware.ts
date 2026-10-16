import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that need the session; the landing page and static files skip middleware.
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/discover/:path*",
    "/saved/:path*",
    "/matches/:path*",
    "/insights/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
  ],
};
