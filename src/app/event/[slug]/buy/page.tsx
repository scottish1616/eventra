"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Ticket, Shield, ChevronRight, Minus, Plus, CheckCircle } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  price: number;
  category: string;
  totalSlots: number;
  soldCount: number;
  maxPerOrder: number;
  description: string | null;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  venue: string | null;
  description: string | null;
  ticketTypes: TicketType[];
}

export default function BuyTicketPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [issuedTickets, setIssuedTickets] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("SIMULATED");

  useEffect(() => {
    fetch(`/api/events/slug/${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setEvent(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const setQty = (id: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, Math.min(max, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: next };
    });
  };

  const ticketTypesList = event?.ticketTypes ?? [];
  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = ticketTypesList.reduce((sum, tt) => sum + tt.price * (quantities[tt.id] ?? 0), 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || totalItems === 0) { setError("Please select at least one ticket"); return; }
    if (!buyerName.trim()) { setError("Please enter your name"); return; }
    if (!buyerPhone.trim()) { setError("Please enter your phone number"); return; }

    setSubmitting(true);
    setError("");

    const items = Object.entries(quantities).filter(([, q]) => q > 0).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await fetch("/api/payments/guest-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, items, buyerName: buyerName.trim(), buyerPhone: buyerPhone.trim(), paymentMethod }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || "Something went wrong"); setSubmitting(false); return; }
      setIssuedTickets(json.data.tickets || []);
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryConfig: Record<string, { gradient: string; badge: string }> = {
    REGULAR: { gradient: "from-blue-500 to-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    VIP: { gradient: "from-amber-500 to-orange-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    VVIP: { gradient: "from-purple-600 to-blue-600", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card p-12 max-w-sm mx-auto">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-700 font-semibold text-lg">Event not found</p>
          <Link href="/" className="mt-4 inline-block text-purple-600 text-sm hover:underline">
            Browse all events
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="card p-8 shadow-2xl shadow-green-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tickets Confirmed!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your tickets are ready. Click each ticket to view your QR code. Save the links!
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your tickets</p>
              <div className="space-y-2">
                {issuedTickets.map((ticketId, i) => (
                  <Link
                    key={ticketId}
                    href={`/ticket/view/${ticketId}`}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-purple-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Ticket {i + 1}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-left mb-6">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Event details</p>
              <p className="font-bold text-gray-900">{event.title}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(event.date)}</p>
              <p className="text-xs text-gray-500">{event.location}</p>
            </div>

            <p className="text-xs text-gray-400">
              Screenshot or bookmark the ticket links above
            </p>
          </div>

          <Link href="/" className="mt-4 text-center block text-sm text-gray-500 hover:text-gray-700">
            ← Browse more events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Eventra</span>
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
              ← Browse events
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-10">
        <div className="max-w-3xl mx-auto px-4 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-purple-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {event.location}{event.venue ? ` · ${event.venue}` : ""}
            </div>
          </div>
          {event.description && (
            <p className="mt-3 text-purple-100 text-sm leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Ticket types */}
          <div className="card p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-600" />
              Select your tickets
            </h2>

            {ticketTypesList.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No tickets available</p>
            ) : (
              <div className="space-y-3">
                {ticketTypesList.map((tt) => {
                  const available = tt.totalSlots - tt.soldCount;
                  const qty = quantities[tt.id] ?? 0;
                  const isSoldOut = available === 0;
                  const config = categoryConfig[tt.category] || categoryConfig.REGULAR;

                  return (
                    <div
                      key={tt.id}
                      className={`border-2 rounded-2xl p-4 transition-all ${qty > 0
                          ? "border-purple-300 bg-purple-50 shadow-md"
                          : isSoldOut
                            ? "border-gray-100 bg-gray-50 opacity-60"
                            : "border-gray-100 bg-white hover:border-purple-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-gray-900">{tt.name}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                              {tt.category}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-purple-600">{formatCurrency(tt.price)}</p>
                          {tt.description && (
                            <p className="text-xs text-gray-500 mt-1">{tt.description}</p>
                          )}
                          <p className={`text-xs mt-1 font-medium ${isSoldOut ? "text-red-500" : "text-gray-400"}`}>
                            {isSoldOut ? "Sold out" : `${available} spots remaining`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <button
                            type="button"
                            onClick={() => setQty(tt.id, -1, Math.min(available, tt.maxPerOrder))}
                            disabled={qty === 0}
                            className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-lg font-bold text-gray-900">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(tt.id, 1, Math.min(available, tt.maxPerOrder))}
                            disabled={isSoldOut || qty >= Math.min(available, tt.maxPerOrder)}
                            className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalItems > 0 && (
              <div className="mt-5 pt-5 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">
                    {totalItems} ticket{totalItems !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400">5% platform fee included</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</p>
              </div>
            )}
          </div>

          {/* Buyer details */}
          <div className="card p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Your details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="John Kamau"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone number</label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="0712 345 678"
                  required
                  className="input-field"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Used to identify your ticket. No account created.
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Payment method</h2>
            <div className="space-y-3">
              {[
                { value: "MPESA", label: "M-Pesa", desc: "STK push to your phone", icon: "📱", recommended: true },
                { value: "SIMULATED", label: "Test payment", desc: "For demo — no real charge", icon: "⚡", recommended: false },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${paymentMethod === m.value
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-100 bg-white hover:border-purple-200"
                    }`}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{m.label}</p>
                      {m.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.value
                      ? "border-purple-600 bg-purple-600"
                      : "border-gray-300"
                    }`}>
                    {paymentMethod === m.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || totalItems === 0}
            className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
            {submitting
              ? "Processing payment..."
              : totalItems === 0
                ? "Select tickets to continue"
                : `Pay ${formatCurrency(totalPrice)} securely`}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5" />
            Secured · No account needed · Instant ticket delivery
          </div>
        </form>
      </div>
    </div>
  );
}