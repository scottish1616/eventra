"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Ticket,
  User, Download, Share2, Star,
  CheckCircle, XCircle, Info,
  CreditCard, Tag, ShoppingBag
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
      day: "numeric", month: "short", year: "numeric",
    });

  const formatDay = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { weekday: "long" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });

  const formatPurchase = (d: string) =>
    new Date(d).toLocaleString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const formatCurrency = (n: number) =>
    `KSh ${n.toLocaleString()}`;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `My ticket — ${ticket?.event?.title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-xs w-full text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold">Ticket not found</p>
          <p className="text-gray-500 text-xs mt-1 mb-4">{error}</p>
          <Link href="/ticket/lookup"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition">
            Find ticket
          </Link>
        </div>
      </div>
    );
  }

  const category = ticket.ticketType?.category || "REGULAR";
  const hasBanner = !!ticket.event?.bannerUrl;

  const categoryAccent: Record<string, string> = {
    REGULAR: "#60a5fa",
    VIP: "#f59e0b",
    VVIP: "#a855f7",
  };
  const accent = categoryAccent[category] || "#a855f7";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Minimal navbar */}
      <nav className="bg-gray-950/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Ticket className="w-3 h-3 text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">
            <span className="text-purple-400">E</span>VENTRA
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.print()}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-3 py-5">
        <div className="w-full max-w-sm">

          {/* ═══════════════════════════════════════
              TICKET CARD — Glassmorphism over banner
              ═══════════════════════════════════════ */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ boxShadow: `0 0 40px ${accent}25, 0 20px 60px rgba(0,0,0,0.8)` }}>

            {/* Background — event banner */}
            <div className="absolute inset-0">
              {hasBanner ? (
                <img
                  src={ticket.event!.bannerUrl!}
                  alt={ticket.event?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-950 via-indigo-950 to-blue-950" />
              )}
              {/* Dark gradient overlay top-left to bottom-right */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/90" />
              {/* Extra bottom fade for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Card content */}
            <div className="relative z-10 p-4">

              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  {/* Category badge */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="w-3 h-3" style={{ color: accent }} />
                    <span className="text-xs font-black uppercase tracking-widest"
                      style={{ color: accent }}>
                      {category} ACCESS
                    </span>
                  </div>
                  {/* Event title */}
                  <h1 className="text-xl font-black text-white leading-tight">
                    {ticket.event?.title}
                  </h1>
                  {ticket.event?.description && (
                    <p className="text-xs text-white/60 mt-0.5 leading-relaxed line-clamp-2">
                      {ticket.event.description}
                    </p>
                  )}
                </div>

                {/* EVENTRA logo top right */}
                <div className="flex-shrink-0 text-right ml-3">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Ticket className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs font-black text-white tracking-tight">
                      <span className="text-purple-400">E</span>VENTRA
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-end mb-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  ticket.isUsed
                    ? "bg-gray-800/80 border-gray-600/50 text-gray-400"
                    : "bg-green-500/20 border-green-500/40 text-green-300"
                }`}
                  style={{
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ticket.isUsed ? "bg-gray-500" : "bg-green-400"}`} />
                  {ticket.isUsed ? "Used" : "Active Ticket"}
                </div>
              </div>

              {/* Ticket number — prominent */}
              <div className="mb-3 text-right">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Ticket Number</p>
                <p className="text-lg font-black text-white tracking-wider font-mono"
                  style={{ textShadow: `0 0 20px ${accent}60` }}>
                  {ticket.ticketNumber}
                </p>
              </div>

              {/* Glass divider */}
              <div className="h-px bg-white/10 mb-3" />

              {/* DATE / TIME / VENUE row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {/* Date */}
                <div className="rounded-2xl p-2.5"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="w-2.5 h-2.5 text-white/40" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-xs font-black text-white leading-tight">
                    {ticket.event?.date ? formatDate(ticket.event.date) : "—"}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {ticket.event?.date ? formatDay(ticket.event.date) : ""}
                  </p>
                </div>

                {/* Time */}
                <div className="rounded-2xl p-2.5"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-2.5 h-2.5 text-white/40" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Time</span>
                  </div>
                  <p className="text-xs font-black text-white leading-tight">
                    {ticket.event?.date ? formatTime(ticket.event.date) : "—"}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {ticket.event?.endDate ? `Until ${formatTime(ticket.event.endDate)}` : "Until Late"}
                  </p>
                </div>

                {/* Venue */}
                <div className="rounded-2xl p-2.5"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-2.5 h-2.5 text-white/40" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Venue</span>
                  </div>
                  <p className="text-xs font-black text-white leading-tight">
                    {ticket.event?.venue || ticket.event?.location || "—"}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {ticket.event?.venue ? ticket.event.location : "Kenya"}
                  </p>
                </div>
              </div>

              {/* TICKET TYPE / ENTRY / ATTENDEE / DATE row */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  {
                    icon: <Tag className="w-2.5 h-2.5" />,
                    label: "Ticket Type",
                    value: ticket.ticketType?.category || "—",
                    accent: true,
                  },
                  {
                    icon: <ShoppingBag className="w-2.5 h-2.5" />,
                    label: "Entry Type",
                    value: ticket.ticketType?.name || "—",
                    accent: false,
                  },
                  {
                    icon: <User className="w-2.5 h-2.5" />,
                    label: "Attendee",
                    value: ticket.attendeeName,
                    accent: false,
                  },
                  {
                    icon: <Calendar className="w-2.5 h-2.5" />,
                    label: "Purchase Date",
                    value: formatPurchase(ticket.createdAt),
                    accent: false,
                  },
                ].map((item) => (
                  <div key={item.label}
                    className="rounded-xl p-2"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <div className="flex items-center gap-0.5 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {item.icon}
                      <span className="text-[9px] uppercase tracking-wider leading-none">{item.label}</span>
                    </div>
                    <p className={`text-[10px] font-black leading-tight ${item.accent ? "" : "text-white"}`}
                      style={item.accent ? { color: accent } : {}}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* PRICE + IMPORTANT row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Price */}
                <div className="rounded-2xl p-3 flex items-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}>
                    <span className="text-xs font-black" style={{ color: accent }}>KSH</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider">Price</p>
                    <p className="text-sm font-black text-white">
                      {ticket.ticketType?.price ? formatCurrency(ticket.ticketType.price) : "—"}
                    </p>
                  </div>
                </div>

                {/* Important info */}
                <div className="rounded-2xl p-3 flex items-start gap-2"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}>
                  <Info className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Important</p>
                    <p className="text-[10px] text-white/60 leading-relaxed">
                      Please arrive early and have your ticket number ready for check-in.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-white/30" />
                  <span className="text-[10px] text-white/30">
                    Non-transferable · Non-refundable
                  </span>
                </div>
                <a href="mailto:support@eventra.com"
                  className="text-[10px] font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: accent }}>
                  kisakalevi15@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 text-white/70 py-2.5 rounded-2xl text-xs font-semibold hover:bg-white/10 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold text-white hover:opacity-90 transition-all"
              style={{ background: `linear-gradient(135deg, #7c3aed, #4f46e5)` }}
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Share"}
            </button>
          </div>

          <Link href="/"
            className="flex items-center justify-center gap-1.5 mt-3 text-xs text-white/30 hover:text-white/50 transition-colors">
            ← Browse more events
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav, a[href="/"] { display: none !important; }
          body { background: #000 !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}