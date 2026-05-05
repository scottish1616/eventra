"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
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
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const role = (sessionData?.user as { role?: string })?.role;

    if (role !== "ADMIN") {
      setError("This login is for admins only");
      setLoading(false);
      return;
    }

    router.push("/dashboard/admin");
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin portal</h1>
          <p className="text-gray-400 text-sm mt-1">Restricted access — admins only</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          {error && (
            <div className="mb-5 p-4 bg-red-900/50 border border-red-700 rounded-xl">
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Admin email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eventra.app"
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Access admin panel"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-300">
            ← Back to home
          </Link>
          <span className="text-gray-600 mx-3">·</span>
          <Link href="/auth/login" className="text-gray-500 text-sm hover:text-gray-300">
            Organizer login
          </Link>
        </div>
      </div>
    </div>
  );
}