import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-surface-border bg-surface sticky top-0 z-50">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-primary text-2xl">&#9784;</span>
            AstroVastu Pro
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-text-muted hover:text-text"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-text-muted hover:text-text"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-surface-border py-8 text-center text-sm text-text-muted">
        &copy; {new Date().getFullYear()} AstroVastu Pro. All rights reserved.
      </footer>
    </>
  );
}
