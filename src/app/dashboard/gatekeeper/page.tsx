"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import {
  Ticket, CheckCircle, XCircle, Search,
  QrCode, Users, LogOut, Shield, Clock
} from "lucide-react";
import { signOut } from "next-auth/react";

interface TicketData {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  isUsed: boolean;
  createdAt: string;
  event: { title: string; date: string; location: string } | null;
  ticketType: { name: string; category: string } | null;
}

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export default function GatekeeperDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticketInput, setTicketInput] = useState("");
  const [scannedTicket, setScannedTicket] = useState<TicketData | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [checkedIn, setCheckedIn] = useState<TicketData[]>([]);
  const [stats, setStats] = useState({
    checkedIn: 0,
    pending: 0,
    total: 0,
  });

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleLookup = async () => {
    if (!ticketInput.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setScannedTicket(null);

    try {
      const res = await fetch(
        `/api/tickets/lookup?number=${encodeURIComponent(ticketInput.trim())}`
      );
      const json = await res.json();

      if (!json.success || !json.data) {
        setLookupError("Ticket not found. Check the number and try again.");
        setLookupLoading(false);
        return;
      }

      const ticketRes = await fetch(
        `/api/tickets/public/${json.data.id}`
      );
      const ticketJson = await ticketRes.json();

      if (ticketJson.success) {
        setScannedTicket(ticketJson.data);
      } else {
        setLookupError("Could not load ticket details.");
      }
    } catch {
      setLookupError("Something went wrong. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedTicket) return;

    if (scannedTicket.isUsed) {
      toast.error("This ticket has already been used!");
      return;
    }

    try {
      const res = await fetch(
        `/api/tickets/checkin/${scannedTicket.id}`,
        { method: "PATCH" }
      );
      const json = await res.json();

      if (json.success) {
        const updated = { ...scannedTicket, isUsed: true };
        setScannedTicket(updated);
        setCheckedIn((prev) => [updated, ...prev]);
        setStats((prev) => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
        }));
        toast.success(`✅ ${scannedTicket.attendeeName} checked in successfully!`);
        setTimeout(() => {
          setScannedTicket(null);
          setTicketInput("");
        }, 2000);
      } else {
        toast.error(json.error || "Check-in failed");
      }
    } catch {
      toast.error("Check-in failed. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-green-800 border-t-green-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-center" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: "12px" },
      }} />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Gate Keeper</p>
            <p className="text-xs text-gray-500">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-black text-green-400">{stats.checkedIn}</p>
              <p className="text-xs text-gray-600">Checked in</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Scan / Lookup */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-400" />
            Ticket Check-In
          </h2>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                placeholder="Enter ticket number e.g. NAI-2025-123456"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                autoFocus
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !ticketInput.trim()}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-5 py-3.5 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lookupLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {lookupLoading ? "..." : "Lookup"}
            </button>
          </div>

          {lookupError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{lookupError}</p>
            </motion.div>
          )}
        </div>

        {/* Ticket result */}
        <AnimatePresence>
          {scannedTicket && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl overflow-hidden border-2 ${
                scannedTicket.isUsed
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-green-500/50 bg-green-500/5"
              }`}
            >
              {/* Status header */}
              <div className={`px-6 py-4 flex items-center gap-3 ${
                scannedTicket.isUsed
                  ? "bg-red-500/20"
                  : "bg-green-500/20"
              }`}>
                {scannedTicket.isUsed ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
                <div>
                  <p className={`font-black text-base ${
                    scannedTicket.isUsed ? "text-red-300" : "text-green-300"
                  }`}>
                    {scannedTicket.isUsed ? "ALREADY USED" : "VALID TICKET"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {scannedTicket.isUsed
                      ? "This ticket has already been scanned"
                      : "Ready for check-in"}
                  </p>
                </div>
              </div>

              {/* Ticket details */}
              <div className="px-6 py-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xl font-black text-white">
                      {scannedTicket.attendeeName}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {scannedTicket.event?.title || "Unknown event"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      scannedTicket.ticketType?.category === "VVIP"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : scannedTicket.ticketType?.category === "VIP"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}>
                      {scannedTicket.ticketType?.name || "TICKET"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Ticket #", value: scannedTicket.ticketNumber },
                    { label: "Event date", value: scannedTicket.event?.date
                      ? new Date(scannedTicket.event.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                      : "—" },
                    { label: "Venue", value: scannedTicket.event?.location || "—" },
                    { label: "Ticket type", value: scannedTicket.ticketType?.category || "—" },
                  ].map((row) => (
                    <div key={row.label} className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-0.5">{row.label}</p>
                      <p className="text-sm font-semibold text-white truncate">{row.value}</p>
                    </div>
                  ))}
                </div>

                {!scannedTicket.isUsed && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckIn}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-black py-4 rounded-2xl text-base hover:opacity-90 transition shadow-xl shadow-green-500/20"
                  >
                    <CheckCircle className="w-5 h-5" />
                    CONFIRM CHECK-IN
                  </motion.button>
                )}

                {scannedTicket.isUsed && (
                  <button
                    onClick={() => { setScannedTicket(null); setTicketInput(""); }}
                    className="w-full py-3 bg-gray-800 text-gray-300 font-semibold rounded-2xl text-sm hover:bg-gray-700 transition"
                  >
                    Scan next ticket
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent check-ins */}
        {checkedIn.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent check-ins ({checkedIn.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {checkedIn.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.attendeeName}</p>
                    <p className="text-xs text-gray-600 font-mono">{t.ticketNumber}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    t.ticketType?.category === "VVIP"
                      ? "bg-purple-500/20 text-purple-400"
                      : t.ticketType?.category === "VIP"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {t.ticketType?.name || "TICKET"}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {checkedIn.length === 0 && !scannedTicket && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-gray-800">
              <QrCode className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-gray-400 font-semibold">Ready to check in attendees</p>
            <p className="text-gray-600 text-sm mt-1">
              Enter a ticket number above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}