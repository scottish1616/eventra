"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket, User, Mail, Phone, Lock,
  Eye, EyeOff, CheckCircle, ArrowRight,
  Building, Users, Shield
} from "lucide-react";

type AccountType = "customer" | "organizer";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [step, setStep] = useState<"type" | "form" | "success">("type");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          organizationName: form.organizationName || null,
          role: accountType === "customer" ? "CUSTOMER" : "ORGANIZER",
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Registration failed");
        setLoading(false);
        return;
      }

      if (accountType === "customer") {
        const { signIn } = await import("next-auth/react");
        await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push("/dashboard/customer");
        }
        router.refresh();
      } else {
        setStep("success");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl text-white">EVENTRA</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Join thousands of Kenyans using Eventra
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1 — Choose account type */}
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-5">
                <p className="text-sm font-semibold text-gray-400 mb-5 text-center">
                  What type of account do you need?
                </p>

                <div className="space-y-3">
                  {/* Customer */}
                  <button
                    onClick={() => { setAccountType("customer"); setStep("form"); }}
                    className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-base">Customer account</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Buy tickets, track events, earn loyalty points
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {["Buy tickets", "Track events", "Loyalty rewards"].map((f) => (
                          <span key={f} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </button>

                  {/* Organizer */}
                  <button
                    onClick={() => { setAccountType("organizer"); setStep("form"); }}
                    className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-base">Organizer account</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Create events, sell tickets, manage attendees
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Requires admin approval
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </button>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-purple-400 font-semibold hover:text-purple-300">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2 — Registration form */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Type indicator */}
              <div className={`flex items-center gap-3 mb-5 p-4 rounded-2xl border ${
                accountType === "customer"
                  ? "bg-purple-500/10 border-purple-500/20"
                  : "bg-blue-500/10 border-blue-500/20"
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  accountType === "customer"
                    ? "bg-gradient-to-br from-purple-600 to-blue-600"
                    : "bg-gradient-to-br from-blue-600 to-teal-600"
                }`}>
                  {accountType === "customer" ? <Users className="w-4 h-4 text-white" /> : <Building className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">
                    {accountType === "customer" ? "Customer account" : "Organizer account"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {accountType === "customer"
                      ? "You will be signed in immediately after registration"
                      : "Requires admin approval before you can log in"}
                  </p>
                </div>
                <button
                  onClick={() => setStep("type")}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Change
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                {error && (
                  <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Full name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Jane Wanjiru"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Phone number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="0712 345 678"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {accountType === "organizer" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Organization name
                      </label>
                      <div className="relative">
                        <Building className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={form.organizationName}
                          onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                          placeholder="Nairobi Events Co."
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      Email address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@email.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPw ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Min 6 chars"
                          required
                          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
                        >
                          {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        Confirm password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full transition-all ${
                              form.password.length >= i * 2
                                ? form.password.length >= 8
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                                : "bg-gray-800"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        {form.password.length < 6
                          ? "Too short"
                          : form.password.length < 8
                          ? "Fair"
                          : "Strong password"}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-purple-500/20 mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : accountType === "customer" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <Building className="w-4 h-4" />
                    )}
                    {loading
                      ? "Creating account..."
                      : accountType === "customer"
                      ? "Create customer account"
                      : "Submit organizer request"}
                  </button>
                </form>
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-purple-400 font-semibold hover:text-purple-300">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 3 — Organizer success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  Request submitted!
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                  Your organizer account request has been submitted successfully. Admin will review and activate your account.
                </p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 text-left">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                    What happens next
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { n: "1", text: "Admin reviews your registration details" },
                      { n: "2", text: "Your subscription plan is confirmed" },
                      { n: "3", text: "Account gets activated by admin" },
                      { n: "4", text: "You sign in and start creating events" },
                    ].map((s) => (
                      <div key={s.n} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {s.n}
                        </div>
                        <p className="text-sm text-gray-400">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:opacity-90 transition"
                  >
                    Go to sign in
                  </Link>
                  <Link
                    href="/"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-300 py-3.5 rounded-2xl text-sm font-semibold hover:bg-white/10 transition"
                  >
                    Browse events
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}