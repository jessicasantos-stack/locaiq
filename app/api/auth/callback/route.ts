import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// ── /api/auth/callback ────────────────────────────────────────
// Supabase redireciona para cá após login OAuth (Google)

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirecionar para o dashboard após login
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
