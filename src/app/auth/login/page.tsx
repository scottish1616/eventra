"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, Eye, EyeOff, LogIn } from "lucide-react";

export default function OrganizerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { signIn } = await import("next-auth/react");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const role = (sessionData?.user as { role?: string })?.role;

    if (role === "ADMIN") {
      router.push("/dashboard/admin");
    } else if (role === "ORGANIZER") {
      router.push("/dashboard/organizer");
    } else {
      setError("Account not authorized as organizer");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen page-bg text-slate-200 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-left mb-6">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 inline-flex items-center gap-1">
            ← Back to home
          </Link>
        </div>
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl text-white">Eventra</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Organizer sign in</h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in to manage your events
          </p>
        </div>

        <div className="surface-card p-8 shadow-xl shadow-slate-900/20">
          {error && (
            <div className="mb-5 p-4 bg-red-900/60 border border-red-700/50 rounded-xl">
              <p className="text-sm text-red-100 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          <div className="surface-card p-4 text-center">
            <p className="text-xs text-slate-400">
              Looking to buy tickets?{" "}
              <Link href="/" className="text-purple-300 font-semibold hover:text-white hover:underline">
                Browse events
              </Link>
              {" "}— no account needed
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/auth/admin-login"
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Admin portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}