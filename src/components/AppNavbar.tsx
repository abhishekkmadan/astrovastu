"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, LogOut } from "lucide-react";

export function AppNavbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary text-2xl">&#9784;</span>
          AstroVastu Pro
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-surface-dim"
          >
            <Home size={16} />
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-surface-dim"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
