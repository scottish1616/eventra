"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  qrCode: string;
  qrCodeData: string;
  attendeeName: string;
  attendeeEmail: string;
  isUsed: boolean;
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

export default function PublicTicketPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      setError("No ticket ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/tickets/public/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTicket(d.data);
        } else {
          setError(d.error || "Ticket not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load ticket");
        setLoading(false);
      });
  }, [params?.id]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const categoryGradients: Record<string, string> = {
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
        <div className="card p-12 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">
            {error || "Ticket not found"}
          </p>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            Check your ticket number and try again
          </p>
          <Link
            href="/ticket/lookup"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  const gradient =
    categoryGradients[ticket.ticketType?.category || "REGULAR"];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              Eventra
            </Link>
            <Link href="/ticket/lookup" className="text-sm text-gray-500 hover:text-purple-600">
              Find another ticket
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-10">

        {/* Success banner */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Ticket confirmed</p>
            <p className="text-xs text-emerald-600">Show QR code at venue entrance</p>
          </div>
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">

          {/* Header */}
          <div className={`bg-gradient-to-r ${gradient} px-6 py-6 text-white`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                  {ticket.ticketType?.category || "TICKET"}
                </p>
                <h1 className="text-xl font-bold leading-tight">
                  {ticket.event?.title || "Event"}
                </h1>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full flex-shrink-0 ml-3">
                <p className="text-xs font-bold">{ticket.ticketType?.name}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-white/90">
              {ticket.event?.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {formatDate(ticket.event.date)}
                </div>
              )}
              {ticket.event?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {ticket.event.location}
                  {ticket.event.venue ? ` · ${ticket.event.venue}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Dashed divider */}
          <div className="relative mx-4">
            <div className="border-t-2 border-dashed border-gray-200" />
            <div className="absolute -left-7 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
            <div className="absolute -right-7 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
          </div>

          {/* QR Code */}
          <div className="px-6 py-6 flex flex-col items-center">
            {ticket.qrCode ? (
              <div className="bg-white p-3 rounded-2xl border-2 border-gray-100 shadow-sm mb-4">
                <img
                  src={ticket.qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-52 h-52 bg-gray-100 rounded-2xl flex flex-col items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                <p className="text-xs text-gray-400 text-center px-4">
                  QR code will appear here
                </p>
                <p className="text-xs font-mono text-gray-500 mt-2 text-center break-all px-2">
                  {ticket.qrCodeData}
                </p>
              </div>
            )}
            <p className="text-xs font-mono text-gray-400 text-center break-all">
              {ticket.ticketNumber}
            </p>
          </div>

          {/* Dashed divider */}
          <div className="relative mx-4">
            <div className="border-t-2 border-dashed border-gray-200" />
            <div className="absolute -left-7 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
            <div className="absolute -right-7 -top-3 w-6 h-6 rounded-full bg-gray-50 border border-gray-200" />
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-2.5 text-sm">
            {[
              { label: "Attendee", value: ticket.attendeeName },
              {
                label: "Price paid",
                value: ticket.ticketType
                  ? formatCurrency(ticket.ticketType.price)
                  : "—",
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">{row.label}</span>
                <span className="font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div
            className={`px-6 py-3 text-center ${
              ticket.isUsed ? "bg-gray-100" : "bg-emerald-50"
            }`}
          >
            <p
              className={`text-xs font-bold ${
                ticket.isUsed ? "text-gray-500" : "text-emerald-700"
              }`}
            >
              {ticket.isUsed ? "Already used at entry" : "Valid — not yet used"}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Screenshot or bookmark this page to access your ticket anytime
        </p>

        <Link
          href="/"
          className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Browse more events
        </Link>
      </div>
    </div>
  );
}