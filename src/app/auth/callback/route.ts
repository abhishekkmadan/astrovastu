import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";
const SAFE_BASE_URL = "https://astrovastu.local";

function getSafeRedirectPath(next: string | null): string {
  if (!next) return DEFAULT_REDIRECT_PATH;
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("@") ||
    next.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(next)
  ) {
    return DEFAULT_REDIRECT_PATH;
  }
  const lowerNext = next.toLowerCase();
  if (lowerNext.includes("%2f") || lowerNext.includes("%5c")) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const parsed = new URL(next, SAFE_BASE_URL);
    if (parsed.origin !== SAFE_BASE_URL) return DEFAULT_REDIRECT_PATH;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=Could+not+authenticate", origin));
}
