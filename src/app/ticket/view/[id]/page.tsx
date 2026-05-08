"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { EnhancedTicketCard } from "@/components/tickets/EnhancedTicketCard";

interface TicketData {
  id: string;
  ticketNumber: string;
  qrCode: string | null;
  qrCodeData: string | null;
  attendeeName: string;
  attendeeEmail: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  event: {
    title: string;
    date: string;
    endDate?: string;
    location: string;
    venue: string | null;
    slug: string;
  } | null;
  ticketType: {
    name: string;
    price: number;
    category: string;
    description?: string;
  } | null;
  order?: {
    total: number;
    status: string;
    buyerName: string;
  } | null;
}

export default function TicketViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-purple-600 border-t-purple-300 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
}

function TicketContent() {
  const params = useParams();
  const id = params?.id as string;
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No ticket ID");
      setLoading(false);
      return;
    }

    fetch(`/api/ticket/view/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setTicket(d.data);
        } else {
          setError(d.error || "Ticket not found");
        }
      })
      .catch(() => setError("Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-600 border-t-purple-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-gray-800 font-bold text-lg">Ticket not found</p>
=======
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <p className="text-white font-bold text-lg">Ticket not found</p>
>>>>>>> 929991a (feat: Complete ticket system redesign and analytics implementation)
          <p className="text-gray-400 text-sm mt-2 mb-6">
            {error || "This ticket does not exist or has been removed"}
          </p>
          <Link
            href="/ticket/lookup"
<<<<<<< HEAD
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
          >
=======
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
>>>>>>> 929991a (feat: Complete ticket system redesign and analytics implementation)
            Try lookup
          </Link>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  const gradient = gradients[ticket.ticketType?.category || "REGULAR"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <nav className="border-b border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            Eventra
          </Link>
          <Link
            href="/ticket/lookup"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to lookup
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <EnhancedTicketCard ticket={ticket} />
      </div>
    </div>
  );
}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {ticket.event.location}
                    {ticket.event.venue ? ` · ${ticket.event.venue}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tear line */}
          <div className="relative h-0 mx-4">
            <div className="absolute inset-0 border-t-2 border-dashed border-gray-200" />
            <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
            <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
          </div>

          {/* QR Code */}
          <div className="px-6 pt-6 pb-4 flex flex-col items-center">
            {ticket.qrCode ? (
              <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm mb-3">
                <img
                  src={ticket.qrCode}
                  alt="QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex flex-col items-center justify-center mb-3 border-2 border-dashed border-gray-200">
                <Ticket className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 text-center px-4">QR Code</p>
              </div>
            )}
            <p className="font-mono text-xs text-gray-400 text-center break-all">
              {ticket.ticketNumber}
            </p>
          </div>

          {/* Tear line */}
          <div className="relative h-0 mx-4">
            <div className="absolute inset-0 border-t-2 border-dashed border-gray-200" />
            <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
            <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-2">
            {[
              { label: "Attendee", value: ticket.attendeeName },
              {
                label: "Ticket type",
                value: ticket.ticketType?.name || "—"
              },
              {
                label: "Price paid",
                value: ticket.ticketType
                  ? formatCurrency(ticket.ticketType.price)
                  : "—"
              },
              {
                label: "Purchased",
                value: new Date(ticket.createdAt).toLocaleDateString("en-KE", {
                  day: "numeric", month: "short", year: "numeric"
                })
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{row.label}</span>
                <span className="text-xs font-semibold text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Status footer */}
          <div className={`px-6 py-3 text-center ${
            ticket.isUsed ? "bg-gray-100" : "bg-emerald-50"
          }`}>
            <p className={`text-xs font-bold ${
              ticket.isUsed ? "text-gray-500" : "text-emerald-700"
            }`}>
              {ticket.isUsed ? "USED — Entry already granted" : "VALID — Not yet used"}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Screenshot or bookmark this page to access your ticket anytime
        </p>

        <Link
          href="/"
          className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Browse more events
        </Link>
      </div>
    </div>
  );
=======
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <nav className="border-b border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            Eventra
          </Link>
          <Link
            href="/ticket/lookup"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to lookup
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <EnhancedTicketCard ticket={ticket} />
      </div>
    </div>
  );
}

export default function TicketViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-purple-600 border-t-purple-300 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
>>>>>>> 929991a (feat: Complete ticket system redesign and analytics implementation)
}
