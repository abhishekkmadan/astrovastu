"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-dim px-4">
        <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 shadow-sm text-center">
          <span className="text-primary text-4xl">&#9993;</span>
          <h1 className="mt-4 text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-text-muted">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Button variant="secondary" className="mt-6" onClick={() => router.push("/auth/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-dim px-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="text-primary text-4xl">&#9784;</span>
          <h1 className="mt-3 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-text-muted">
            Start analyzing Vastu layouts today
          </p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Name"
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
