"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Ticket, Calendar, Star, LogOut,
  User, MapPin, CheckCircle, XCircle,
  Clock, Gift, ChevronRight, Plus
} from "lucide-react";
import { signOut } from "next-auth/react";

interface TicketData {
  id: string;
  ticketNumber: string;
  isUsed: boolean;
  createdAt: string;
  event: { id: string; title: string; date: string; location: string } | null;
  ticketType: { name: string; price: number; category: string } | null;
}

interface ReviewForm {
  eventId: string;
  rating: number;
  comment: string;
}

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

type Tab = "tickets" | "events" | "loyalty" | "profile";

export default function CustomerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("tickets");
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState<ReviewForm | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/customer/tickets")
        .then((r) => r.json())
        .then((d) => {
          setTickets(d.data || []);
          setLoyaltyPoints(d.loyaltyPoints || 0);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm) return;
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted! You earned 10 loyalty points.");
        setReviewForm(null);
        setLoyaltyPoints((prev) => prev + 10);
      } else {
        toast.error(json.error || "Failed to submit review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReviewLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const attendedEvents = tickets.filter((t) => t.isUsed);
  const upcomingTickets = tickets.filter((t) => !t.isUsed);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: "12px" },
      }} />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{user?.name || "Customer"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Gift className="w-3 h-3 text-yellow-400" />
                <p className="text-xs text-yellow-400 font-semibold">
                  {loyaltyPoints} loyalty points
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-purple-400 font-semibold hover:text-purple-300 transition-colors"
            >
              Browse events
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "My tickets", value: tickets.length, icon: Ticket, color: "from-purple-500 to-blue-600" },
            { label: "Attended", value: attendedEvents.length, icon: CheckCircle, color: "from-green-500 to-teal-600" },
            { label: "Loyalty pts", value: loyaltyPoints, icon: Gift, color: "from-yellow-500 to-orange-500" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-md`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 mb-6">
          {[
            { id: "tickets", label: "My Tickets", icon: Ticket },
            { id: "events", label: "Attended", icon: Calendar },
            { id: "loyalty", label: "Loyalty", icon: Gift },
            { id: "profile", label: "Profile", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >

            {/* My tickets */}
            {activeTab === "tickets" && (
              <div className="space-y-3">
                {upcomingTickets.length === 0 && attendedEvents.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                    <Ticket className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 font-semibold">No tickets yet</p>
                    <p className="text-gray-600 text-sm mt-2 mb-6">Browse events and buy your first ticket</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
                    >
                      <Plus className="w-4 h-4" /> Browse events
                    </Link>
                  </div>
                ) : (
                  [...upcomingTickets, ...attendedEvents].map((ticket, i) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
                    >
                      <div className={`h-1 ${
                        ticket.ticketType?.category === "VVIP"
                          ? "bg-gradient-to-r from-purple-500 to-blue-500"
                          : ticket.ticketType?.category === "VIP"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : "bg-gradient-to-r from-blue-500 to-teal-500"
                      }`} />
                      <div className="px-5 py-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white text-sm truncate">
                              {ticket.event?.title || "Event"}
                            </p>
                            {ticket.isUsed ? (
                              <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Used
                              </span>
                            ) : (
                              <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Valid
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {ticket.event?.date ? formatDate(ticket.event.date) : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ticket.event?.location || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold text-purple-400">
                              {ticket.ticketType?.name || "Ticket"}
                            </span>
                            <span className="text-xs text-gray-600 font-mono">
                              {ticket.ticketNumber}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/ticket/view/${ticket.id}`}
                          target="_blank"
                          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold flex-shrink-0"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Attended events */}
            {activeTab === "events" && (
              <div className="space-y-3">
                {attendedEvents.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                    <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 font-semibold">No events attended yet</p>
                    <p className="text-gray-600 text-sm mt-2">Events you attend will appear here</p>
                  </div>
                ) : (
                  attendedEvents.map((ticket, i) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{ticket.event?.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {ticket.event?.date ? formatDate(ticket.event.date) : "—"} ·{" "}
                            {ticket.event?.location}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-600">
                              {ticket.ticketType?.name} ·{" "}
                              {ticket.ticketType?.price
                                ? formatCurrency(ticket.ticketType.price)
                                : "—"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setReviewForm({
                            eventId: ticket.event?.id || "",
                            rating: 5,
                            comment: "",
                          })}
                          className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-xl font-semibold hover:bg-yellow-500/20 transition"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Leave review
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Loyalty points */}
            {activeTab === "loyalty" && (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/20 rounded-3xl p-8 text-center">
                  <Gift className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-4xl font-black text-yellow-400 mb-1">{loyaltyPoints}</p>
                  <p className="text-gray-400 font-semibold">Loyalty Points</p>
                  <p className="text-gray-600 text-sm mt-2">Earn points by attending events and leaving reviews</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-4 text-sm">How to earn points</h3>
                  <div className="space-y-3">
                    {[
                      { action: "Attend an event", points: "+20 pts", icon: "🎪" },
                      { action: "Leave a review", points: "+10 pts", icon: "⭐" },
                      { action: "Buy a ticket", points: "+5 pts", icon: "🎟️" },
                      { action: "Refer a friend", points: "+50 pts", icon: "👥" },
                    ].map((item) => (
                      <div key={item.action} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <p className="text-sm text-gray-300">{item.action}</p>
                        </div>
                        <span className="text-sm font-bold text-yellow-400">{item.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Profile */}
            {activeTab === "profile" && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {user?.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                        Customer
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Total tickets", value: tickets.length.toString() },
                    { label: "Events attended", value: attendedEvents.length.toString() },
                    { label: "Loyalty points", value: loyaltyPoints.toString() },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/"
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition"
                >
                  Browse events
                </Link>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewForm(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-gray-900 border border-gray-700 rounded-3xl p-7 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">Leave a review</h3>
              <p className="text-xs text-gray-500 mb-5">Rate your experience at this event</p>

              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((prev) => prev ? { ...prev, rating: star } : null)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= reviewForm.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => prev ? { ...prev, comment: e.target.value } : null)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold py-3 rounded-2xl hover:opacity-90 transition disabled:opacity-60"
                  >
                    {reviewLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                    {reviewLoading ? "Submitting..." : "Submit review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm(null)}
                    className="px-5 py-3 bg-gray-800 text-gray-300 text-sm rounded-2xl hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}