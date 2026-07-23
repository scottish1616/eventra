"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Ticket,
  User, Download, Share2,
  CheckCircle, XCircle, AlertCircle,
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string | null;
  isUsed: boolean;
  createdAt: string;
  event: {
    id: string;
    title: string;
    date: string;
    endDate: string | null;
    location: string;
    venue: string | null;
    description: string | null;
    bannerUrl: string | null;
    organizer?: { name: string; organizationName: string | null } | null;
  } | null;
  ticketType: {
    name: string;
    price: number;
    category: string;
    description: string | null;
  } | null;
  order?: { buyerPhone: string | null } | null;
}

export default function TicketViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) { setError("No ticket ID"); setLoading(false); return; }
    fetch(`/api/tickets/public/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setTicket(d.data);
        else setError(d.error || "Ticket not found");
      })
      .catch(() => setError("Failed to load ticket"))
      .finally(() => setLoading(false));
  }, [id]);

  const formatShortDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatDayOfWeek = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { weekday: "long" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const formatPurchaseDate = (d: string) =>
    new Date(d).toLocaleString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `My ticket - ${ticket?.event?.title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categoryColors: Record<string, { badge: string; text: string; glow: string }> = {
    REGULAR: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/30", text: "text-blue-300", glow: "shadow-blue-500/20" },
    VIP: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/30", text: "text-amber-300", glow: "shadow-amber-500/20" },
    VVIP: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/30", text: "text-purple-300", glow: "shadow-purple-500/20" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-xs">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold">Ticket not found</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">{error}</p>
          <Link href="/ticket/lookup" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition">
            Find my ticket
          </Link>
        </div>
      </div>
    );
  }

  const category = ticket.ticketType?.category || "REGULAR";
  const colors = categoryColors[category] || categoryColors.REGULAR;
  const hasBanner = !!ticket.event?.bannerUrl;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Compact navbar */}
      <nav className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-white text-sm">EVENTRA</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Download</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-2.5 py-1.5 hover:bg-white/5 rounded-lg transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </nav>

      {/* Status bar */}
      <div className={`py-2 text-center text-xs font-bold ${
        ticket.isUsed
          ? "bg-gray-800 text-gray-400"
          : "bg-green-500/10 text-green-400"
      }`}>
        {ticket.isUsed ? (
          <span className="flex items-center justify-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Ticket Already Used
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Active Ticket — Present at venue entrance
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-3 py-5">

        {/* TICKET CARD */}
        <div className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl ${colors.glow}`}>

          {/* LEFT + RIGHT layout */}
          <div className="flex flex-col sm:flex-row">

            {/* LEFT — Banner */}
            <div className="sm:w-[42%] relative">
              <div className="h-48 sm:h-full min-h-[200px] relative overflow-hidden">
                {hasBanner ? (
                  <img
                    src={ticket.event!.bannerUrl!}
                    alt={ticket.event?.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                    <span className="text-5xl">🎪</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${colors.badge}`}>
                    {category}
                  </span>
                </div>

                {/* Event title on banner */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-base font-black text-white leading-tight">
                    {ticket.event?.title}
                  </h2>
                  {ticket.event?.description && (
                    <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">
                      {ticket.event.description}
                    </p>
                  )}

                  {/* Quick date/location chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {ticket.event?.date && (
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Calendar className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-xs text-white font-semibold">
                          {formatShortDate(ticket.event.date)}
                        </span>
                      </div>
                    )}
                    {ticket.event?.date && (
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Clock className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-xs text-white font-semibold">
                          {formatTime(ticket.event.date)}
                        </span>
                      </div>
                    )}
                    {ticket.event?.venue && (
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <MapPin className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-xs text-white font-semibold truncate max-w-[100px]">
                          {ticket.event.venue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:flex flex-col items-center w-5 bg-gray-950 relative">
              <div className="absolute -left-2.5 top-6 w-5 h-5 rounded-full bg-gray-950 border border-gray-800" />
              <div className="flex-1 border-l border-dashed border-gray-700 my-10 mx-auto" />
              <div className="absolute -left-2.5 bottom-6 w-5 h-5 rounded-full bg-gray-950 border border-gray-800" />
            </div>

            {/* Mobile divider */}
            <div className="sm:hidden relative h-5 bg-gray-950 flex items-center">
              <div className="absolute -top-2.5 left-6 w-5 h-5 rounded-full bg-gray-950 border border-gray-800" />
              <div className="flex-1 border-t border-dashed border-gray-700 mx-10" />
              <div className="absolute -top-2.5 right-6 w-5 h-5 rounded-full bg-gray-950 border border-gray-800" />
            </div>

            {/* RIGHT — Details */}
            <div className="sm:flex-1 p-4 flex flex-col gap-3">

              {/* Ticket number */}
              <div className="text-center pb-3 border-b border-gray-800">
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">
                  Ticket Number
                </p>
                <p className="font-black text-white text-lg tracking-wider font-mono">
                  {ticket.ticketNumber}
                </p>
              </div>

              {/* Event name */}
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Event</p>
                <p className="text-sm font-bold text-white leading-tight">
                  {ticket.event?.title}
                </p>
              </div>

              {/* Date, Time, Venue grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Date</p>
                  <p className="text-xs font-bold text-white">
                    {ticket.event?.date ? formatShortDate(ticket.event.date) : "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.event?.date ? formatDayOfWeek(ticket.event.date) : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Time</p>
                  <p className="text-xs font-bold text-white">
                    {ticket.event?.date ? formatTime(ticket.event.date) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Venue</p>
                  <p className="text-xs font-bold text-white">
                    {ticket.event?.venue || ticket.event?.location || "—"}
                  </p>
                  {ticket.event?.venue && (
                    <p className="text-xs text-gray-500">{ticket.event.location}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Price</p>
                  <p className="text-xs font-bold text-white">
                    {ticket.ticketType?.price
                      ? formatCurrency(ticket.ticketType.price)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Ticket type row */}
              <div className="flex items-center gap-2 py-2 border-t border-gray-800">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">
                    Ticket Type
                  </p>
                  <p className={`text-xs font-black ${colors.text}`}>
                    {ticket.ticketType?.category}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">
                    Entry Type
                  </p>
                  <p className="text-xs font-bold text-white">
                    {ticket.ticketType?.name}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">
                    Status
                  </p>
                  <p className={`text-xs font-black ${
                    ticket.isUsed ? "text-gray-500" : "text-green-400"
                  }`}>
                    {ticket.isUsed ? "Used" : "Active"}
                  </p>
                </div>
              </div>

              {/* Attendee */}
              <div className="flex items-center gap-2.5 py-2 border-t border-gray-800">
                <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Attendee</p>
                  <p className="text-xs font-bold text-white">{ticket.attendeeName}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-600">Purchased</p>
                  <p className="text-xs text-gray-400">
                    {formatPurchaseDate(ticket.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/50 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Arrive early · Non-transferable · Non-refundable
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-600">Need help?</p>
              <a
                href="mailto:support@eventra.com"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                support@eventra.com
              </a>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 border border-gray-800 text-gray-300 py-3 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Share ticket"}
          </button>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Browse more events
        </Link>
      </div>

      <style jsx global>{`
        @media print {
          nav, .print-hide { display: none !important; }
          body { background: #030712 !important; }
        }
      `}</style>
    </div>
  );
      }
