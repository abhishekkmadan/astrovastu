import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";

function safeRedirectUrl(next: string | null, origin: string): URL {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return new URL(DEFAULT_REDIRECT_PATH, origin);
  }

  const redirectUrl = new URL(next, origin);
  return redirectUrl.origin === origin
    ? redirectUrl
    : new URL(DEFAULT_REDIRECT_PATH, origin);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(safeRedirectUrl(next, origin));
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could+not+authenticate`);
}
