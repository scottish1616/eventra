"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Ticket, Eye, EyeOff, LogIn,
  Mail, Lock, AlertCircle, Shield
} from "lucide-react";

type SessionUser = {
  role?: string;
  subscriptionStatus?: string;
};

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  ORGANIZER: "/dashboard/organizer",
  USER: "/",
};

const BLOCKED_STATUSES = ["PENDING", "REJECTED"];

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your organizer account is pending approval. Please wait for admin review.",
  REJECTED: "Your organizer application was rejected. Please contact support.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const redirectTo = searchParams?.get("redirect") || "";

    try {
      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const user = sessionData?.user as SessionUser;
      const role = user?.role;
      const subStatus = user?.subscriptionStatus;

      if (!role) {
        setError("Could not verify your account. Please try again.");
        setLoading(false);
        return;
      }

      if (
        role === "ORGANIZER" &&
        subStatus &&
        BLOCKED_STATUSES.includes(subStatus)
      ) {
        setError(STATUS_MESSAGES[subStatus] || "Account access denied.");
        const { signOut } = await import("next-auth/react");
        await signOut({ redirect: false });
        setLoading(false);
        return;
      }

      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }

      const destination = ROLE_ROUTES[role] || "/";
      window.location.href = destination;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl text-white tracking-tight">
              EVENTRA
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white mb-1">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:bg-white/8 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 mt-2"
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

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            New to Eventra?{" "}
            <Link
              href="/auth/register"
              className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
            >
              Create account
            </Link>
          </p>
          <p className="text-xs text-gray-700">
            Organizer pending approval?{" "}
            <Link
              href="/contact"
              className="text-gray-500 hover:text-gray-400 transition-colors"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}