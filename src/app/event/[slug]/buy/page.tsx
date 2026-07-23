"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle, MapPin, Smartphone, Ticket, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface TicketType {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  totalSlots: number;
  soldCount: number;
  maxPerOrder: number;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  location?: string;
  venue?: string;
  date?: string;
  endDate?: string;
  bannerUrl: string | null;
  organizer?: {
    name?: string;
    organizationName?: string;
  } | null;
  ticketTypes: TicketType[];
}

type PaymentMethod = "MPESA" | "SIMULATED";

export default function EventBuyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params?.slug as string | undefined;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MPESA");
  const [submitting, setSubmitting] = useState(false);
  const [successTicketIds, setSuccessTicketIds] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) {
      setError("Invalid event slug.");
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/slug/${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Unable to load event.");
          return;
        }

        setEvent(json.data);
      } catch (err) {
        setError("Unable to load event. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const ticketTypes = event?.ticketTypes || [];

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
    [quantities]
  );

  const totalPrice = useMemo(
    () =>
      ticketTypes.reduce((sum, tt) => sum + tt.price * (quantities[tt.id] ?? 0), 0),
    [quantities, ticketTypes]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  const setQty = (ticketTypeId: string, next: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketTypeId]: Math.max(0, next),
    }));
  };

  const handlePurchase = async () => {
    if (!event) return;
    if (totalItems === 0) {
      setError("Select at least one ticket.");
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const endpoint = session?.user ? "/api/payments/checkout" : "/api/payments/guest-checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          items,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: buyerEmail.trim(),
          paymentMethod,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Checkout failed. Please try again.");
        setSubmitting(false);
        return;
      }

      if (json.data.awaitingPayment) {
        router.push(`/checkout/mpesa-pending?orderId=${json.data.orderId}`);
        return;
      }

      setSuccessTicketIds(json.data.tickets || []);
    } catch (err) {
      setError("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center py-20 glass-card p-8">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/80">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-100 shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 text-purple-600 w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Ticket className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to load purchase page</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition"
          >
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/6 bg-white/3 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-sm text-white/70">Event purchase</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-600 to-blue-600">
                {event?.bannerUrl && (
                  <>
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/80" />
                  </>
                )}
                <div className="relative z-10 p-6 text-white">
                  <h1 className="text-2xl md:text-3xl font-bold mb-3">{event?.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-purple-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event?.date)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {event?.location}{event?.venue ? ` · ${event.venue}` : ""}
                    </div>
                  </div>
                  {event?.description && (
                    <p className="mt-3 text-purple-100 text-sm leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Card variant="clay" className="p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Select tickets</h2>
              <div className="space-y-4">
                {ticketTypes.length === 0 ? (
                  <p className="text-sm text-white/70">No tickets are available for this event.</p>
                ) : (
                  ticketTypes.map((ticketType) => {
                    const available = Math.max(0, ticketType.totalSlots - ticketType.soldCount);
                    const qty = quantities[ticketType.id] ?? 0;
                    const maxQty = Math.min(available, ticketType.maxPerOrder || available);

                    return (
                      <div key={ticketType.id} className="glass-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{ticketType.name}</p>
                            <p className="text-xs text-white/70">{ticketType.category} • {formatCurrency(ticketType.price)}</p>
                            {ticketType.description && <p className="text-xs text-white/60 mt-2">{ticketType.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 mt-3 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => setQty(ticketType.id, qty - 1)}
                              disabled={qty === 0}
                              className="h-10 w-10 rounded-full border border-white/6 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(ticketType.id, qty + 1)}
                              disabled={qty >= maxQty}
                              className="h-10 w-10 rounded-full border border-white/6 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-white/60">
                          {available === 0 ? "Sold out" : `${available} available, max ${ticketType.maxPerOrder || available} per order`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
            </div>

            {/* Sign in prompt for non-signed-in users */}
            {!session && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Sign in for a better experience
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Track your tickets and earn loyalty points
                    </p>
                  </div>
                </div>
                <Link
                  href={`/auth/login?redirect=/event/${slug}/buy`}
                  className="flex-shrink-0 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap"
                >
                  Sign in →
                </Link>
              </div>
            )}

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buyer details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700">
                  <span>Name</span>
                  <input
                    value={buyerName}
                    onChange={(event) => setBuyerName(event.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700">
                  <span>Phone</span>
                  <input
                    value={buyerPhone}
                    onChange={(event) => setBuyerPhone(event.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <label className="sm:col-span-2 space-y-2 text-sm text-gray-700">
                  <span>Email (optional)</span>
                  <input
                    value={buyerEmail}
                    onChange={(event) => setBuyerEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Payment method</p>
                  <p className="text-xs text-white/70">M-Pesa is supported now. Use test payment for demo checkout.</p>
                </div>
              </div>
              <div className="space-y-3">
                {(["MPESA", "SIMULATED"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      paymentMethod === method
                        ? "border-violet-500 bg-white/6"
                        : "border-white/6 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{method === "MPESA" ? "M-Pesa" : "Test payment"}</p>
                        <p className="text-xs text-gray-500">
                          {method === "MPESA"
                            ? "Pay with STK push."
                            : "Simulate a completed order for testing."}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border ${
                          paymentMethod === method
                            ? "border-violet-500 bg-violet-600"
                            : "border-white/6"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/70">Total</p>
                  <p className="text-3xl font-semibold text-white">{formatCurrency(totalPrice)}</p>
                </div>
                <div className="rounded-3xl bg-white/6 p-3 text-white">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-600/10 border border-red-500/10 p-4 text-sm text-red-300 mb-4">
                  {error}
                </div>
              )}

              <Button
                onClick={handlePurchase}
                disabled={submitting || totalItems === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-4 disabled:opacity-50"
              >
                {submitting ? "Processing…" : totalItems === 0 ? "Select tickets to continue" : `Pay ${formatCurrency(totalPrice)}`}
              </Button>

              <p className="text-xs text-white/60 mt-4">
                Your tickets will be delivered to your email after successful payment.
              </p>
            </div>

            {successTicketIds.length > 0 && (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Purchase complete</p>
                    <p className="text-xs text-emerald-800">Your tickets are ready.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {successTicketIds.map((ticketId, index) => (
                    <Link
                      key={ticketId}
                      href={`/ticket/view/${ticketId}`}
                      className="block rounded-2xl bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      View ticket {index + 1}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
