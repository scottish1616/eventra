"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, ArrowRight } from "lucide-react";

export default function OrganizerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError("Name, email and password are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.organizationName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/organizer-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "ORGANIZER",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Registration failed");
      }

      toast.success("Account created! Awaiting admin approval...");
      router.push("/auth/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/auth/register"
          className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1"
        >
          ← Back
        </Link>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Organizer Registration
              </h2>
              <p className="text-xs text-gray-500">Pending admin approval</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Full Name
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Email
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Organization Name
              </span>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Your company name"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Phone
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0712 345 678"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Password
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Your account will be reviewed by admin before you can create events
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already registered?{" "}
          <Link
            href="/auth/login"
            className="text-purple-600 hover:text-purple-700 font-semibold"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
