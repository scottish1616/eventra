"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Ticket,
  User, Mail, Phone, Download,
  Share2, CheckCircle, XCircle,
  AlertCircle, ArrowLeft
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string | null;
  attendeePhone?: string | null;
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
  order?: {
    buyerPhone: string | null;
  } | null;
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const formatShortDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });

  const formatDayOfWeek = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { weekday: "long" });

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
      await navigator.share({
        title: `My ticket - ${ticket?.event?.title}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const categoryColors: Record<string, { badge: string; accent: string; text: string }> = {
    REGULAR: {
      badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      accent: "#3b82f6",
      text: "text-blue-300",
    },
    VIP: {
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      accent: "#f59e0b",
      text: "text-amber-300",
    },
    VVIP: {
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      accent: "#a855f7",
      text: "text-purple-300",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white font-bold text-lg">Ticket not found</p>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            {error || "This ticket does not exist"}
          </p>
          <Link
            href="/ticket/lookup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition"
          >
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

      {/* Navbar */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-base">EVENTRA</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Download</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${
          ticket.isUsed
            ? "bg-gray-800 text-gray-400 border border-gray-700"
            : "bg-green-500/10 text-green-400 border border-green-500/20"
        }`}>
          {ticket.isUsed ? (
            <><XCircle className="w-4 h-4" /> Ticket Used</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> Active Ticket</>
          )}
        </div>

        {/* Main ticket card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl print:shadow-none">

          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row">

            {/* LEFT — Event banner and info */}
            <div className="lg:w-[55%] relative">

              {/* Banner image */}
              <div className="relative h-64 lg:h-full min-h-[280px]">
                {hasBanner ? (
                  <img
                    src={ticket.event!.bannerUrl!}
                    alt={ticket.event?.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                    <div className="text-center px-8">
                      <p className="text-6xl mb-4">🎪</p>
                      <p className="text-white font-black text-2xl">
                        {ticket.event?.title}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${colors.badge}`}>
                    {category} ACCESS
                  </span>
                </div>

                {/* Event title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
                    {ticket.event?.title}
                  </h1>
                  {ticket.event?.description && (
                    <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                      {ticket.event.description}
                    </p>
                  )}

                  {/* Event quick info */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {ticket.event?.date ? formatShortDate(ticket.event.date) : "—"}
                        </p>
                        <p className="text-xs text-white/60">
                          {ticket.event?.date ? formatDayOfWeek(ticket.event.date) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {ticket.event?.date ? formatTime(ticket.event.date) : "—"}
                        </p>
                        <p className="text-xs text-white/60">Event time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5">
                      <MapPin className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">
                          {ticket.event?.venue || ticket.event?.location || "—"}
                        </p>
                        <p className="text-xs text-white/60">
                          {ticket.event?.venue ? ticket.event.location : "Venue"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical divider with notches */}
            <div className="hidden lg:flex flex-col items-center relative w-8 bg-gray-950">
              <div className="absolute -left-4 top-8 w-8 h-8 rounded-full bg-gray-950 border border-gray-800" />
              <div className="flex-1 border-l-2 border-dashed border-gray-700 my-12 mx-auto" />
              <div className="absolute -left-4 bottom-8 w-8 h-8 rounded-full bg-gray-950 border border-gray-800" />
            </div>

            {/* Horizontal divider for mobile */}
            <div className="lg:hidden relative h-8 bg-gray-950 flex items-center">
              <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-gray-950 border border-gray-800" />
              <div className="flex-1 border-t-2 border-dashed border-gray-700 mx-12" />
              <div className="absolute -top-4 right-8 w-8 h-8 rounded-full bg-gray-950 border border-gray-800" />
            </div>

            {/* RIGHT — Ticket details */}
            <div className="lg:w-[45%] p-6 flex flex-col">

              {/* Ticket number */}
              <div className="text-center mb-6">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                  Ticket number
                </p>
                <p className="font-black text-white text-xl tracking-wider font-mono">
                  {ticket.ticketNumber}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-800 mb-5" />

              {/* Event name */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Event
                </p>
                <p className="text-sm font-bold text-white">
                  {ticket.event?.title}
                </p>
              </div>

              {/* Date and time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Date
                  </p>
                  <p className="text-sm font-bold text-white">
                    {ticket.event?.date ? formatShortDate(ticket.event.date) : "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.event?.date ? formatDayOfWeek(ticket.event.date) : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Time
                  </p>
                  <p className="text-sm font-bold text-white">
                    {ticket.event?.date ? formatTime(ticket.event.date) : "—"}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Venue
                </p>
                <p className="text-sm font-bold text-white">
                  {ticket.event?.venue || "—"}
                </p>
                <p className="text-xs text-gray-500">{ticket.event?.location}</p>
              </div>

              {/* Ticket type, entry type, price */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                    Ticket type
                  </p>
                  <p className={`text-sm font-black ${colors.text}`}>
                    {ticket.ticketType?.category || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                    Entry type
                  </p>
                  <p className="text-sm font-bold text-white">
                    {ticket.ticketType?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                    Price
                  </p>
                  <p className="text-sm font-bold text-white">
                    {ticket.ticketType?.price
                      ? formatCurrency(ticket.ticketType.price)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Purchase date */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">
                  Purchase date
                </p>
                <p className="text-sm font-bold text-white">
                  {formatPurchaseDate(ticket.createdAt)}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-800 mb-5" />

              {/* Attendee info */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Attendee</p>
                    <p className="text-sm font-semibold text-white">{ticket.attendeeName}</p>
                  </div>
                </div>
                {ticket.attendeeEmail && !ticket.attendeeEmail.includes("@guest.eventra") && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="text-sm font-semibold text-white">{ticket.attendeeEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status footer */}
              <div className={`mt-auto rounded-2xl p-3 text-center ${
                ticket.isUsed
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-green-500/10 border border-green-500/20"
              }`}>
                <p className={`text-xs font-black uppercase tracking-wider ${
                  ticket.isUsed ? "text-gray-500" : "text-green-400"
                }`}>
                  {ticket.isUsed ? "Used — Entry granted" : "Status: Active"}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom info bar */}
          <div className="border-t border-gray-800 px-6 py-4 bg-gray-900/50 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">
                    Important information
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Please arrive early and have your ticket number ready for check-in.
                    This ticket is non-transferable and non-refundable.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Need Help?</p>
              <p className="text-xs text-gray-600">Contact our support team</p>
              <a
                href="mailto:support@eventra.com"
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                support@eventra.com
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 text-gray-300 py-3.5 rounded-2xl text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            <Download className="w-4 h-4" />
            Download ticket
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-2xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            <Share2 className="w-4 h-4" />
            {copied ? "Link copied!" : "Share ticket"}
          </button>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse more events
        </Link>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}