"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Calendar, CheckCircle,
  XCircle, Ticket, ArrowLeft
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: string;
  qrCode: string | null;
  qrCodeData: string | null;
  attendeeName: string;
  attendeeEmail: string | null;
  isUsed: boolean;
  createdAt: string;
  event: {
    title: string;
    date: string;
    location: string;
    venue: string | null;
  } | null;
  ticketType: {
    name: string;
    price: number;
    category: string;
  } | null;
}

export default function TicketViewPage() {
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

    fetch(`/api/tickets/public/${id}`)
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const gradients: Record<string, string> = {
    REGULAR: "from-blue-600 to-blue-700",
    VIP: "from-amber-500 to-orange-500",
    VVIP: "from-purple-600 to-blue-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-gray-800 font-bold text-lg">Ticket not found</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            {error || "This ticket does not exist or has been removed"}
          </p>
          <Link
            href="/ticket/lookup"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
          >
            Try lookup
          </Link>
        </div>
      </div>
    );
  }

  const gradient = gradients[ticket.ticketType?.category || "REGULAR"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          Eventra
        </Link>
        <Link
          href="/ticket/lookup"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Find another ticket
        </Link>
      </nav>

      <div className="max-w-sm mx-auto px-4 py-8">
        {/* Status banner */}
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 ${
          ticket.isUsed
            ? "bg-gray-100 border border-gray-200"
            : "bg-emerald-50 border border-emerald-200"
        }`}>
          {ticket.isUsed
            ? <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            : <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          }
          <div>
            <p className={`text-sm font-bold ${ticket.isUsed ? "text-gray-600" : "text-emerald-800"}`}>
              {ticket.isUsed ? "Ticket already used" : "Valid ticket"}
            </p>
            <p className={`text-xs ${ticket.isUsed ? "text-gray-400" : "text-emerald-600"}`}>
              {ticket.isUsed ? "This ticket has been scanned at entry" : "Show QR code at venue entrance"}
            </p>
          </div>
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">

          {/* Header with gradient */}
          <div className={`bg-gradient-to-br ${gradient} px-6 py-6 text-white`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {ticket.ticketType?.category || "TICKET"}
                </span>
                <h1 className="text-lg font-bold mt-1 leading-tight">
                  {ticket.event?.title || "Event"}
                </h1>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl flex-shrink-0">
                <p className="text-xs font-bold">{ticket.ticketType?.name || "Ticket"}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-white/80">
              {ticket.event?.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDate(ticket.event.date)}</span>
                </div>
              )}
              {ticket.event?.location && (
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
}