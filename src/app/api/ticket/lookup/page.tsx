"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, Search, ArrowRight } from "lucide-react";

export default function TicketLookupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState(
    searchParams.get("number") || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const number = searchParams.get("number");
    if (number) {
      setTicketNumber(number);
      doLookup(number);
    }
  }, []);

  const doLookup = async (number: string) => {
    if (!number.trim()) {
      setError("Please enter your ticket number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/tickets/lookup?number=${encodeURIComponent(number.trim())}`
      );
      const json = await res.json();

      if (!json.success || !json.data) {
        setError("Ticket not found. Please check your ticket number.");
        setLoading(false);
        return;
      }

      router.push(`/ticket/view/${json.data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(ticketNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            Eventra
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Find your ticket</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your ticket number to view your QR code
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ticket number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. NAI-2025-123456"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Found on your ticket confirmation screen
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !ticketNumber.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {loading ? "Looking up..." : "View my ticket"}
            </button>
          </form>
        </div>

        {/* Helpers */}
        <div className="mt-5 space-y-2 text-center">
          <p className="text-sm text-gray-500">
            <Link href="/" className="text-purple-600 font-semibold hover:underline">
              Browse events
            </Link>
            {" "}or follow your organizer's link to buy tickets
          </p>
        </div>
      </div>
    </div>
  );
}