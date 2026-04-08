import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Skip auth check for public routes (but still refresh session on /login)
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/auth") || path.startsWith("/api/stripe")) {
    return res;
  }

  // Skip auth if Supabase is not configured (demo mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Protect API routes — require valid session
  if (path.startsWith("/api/") && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If user is on /login and already has session, redirect to dashboard
  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect pages — redirect to login
  if ((path === "/dashboard" || path === "/agency") && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard", "/agency", "/login"],
};
