"use client";

import {
  Download,
  Share2,
  Send,
  QrCode,
  Clock,
  Calendar,
  MapPin,
  User,
  Tag,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

interface TicketDetailProps {
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

export function EnhancedTicketCard({ ticket }: { ticket: TicketDetailProps }) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferring, setTransferring] = useState(false);

  const categoryGradients: Record<string, string> = {
    REGULAR: "from-blue-500 to-cyan-600",
    VIP: "from-amber-500 to-orange-600",
    VVIP: "from-purple-500 to-pink-600",
  };

  const categoryIcons: Record<string, string> = {
    REGULAR: "🎫",
    VIP: "⭐",
    VVIP: "👑",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(n);

  const handleDownload = async () => {
    if (!ticket.qrCode) {
      toast.error("QR code not available");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = ticket.qrCode;
      link.download = `${ticket.ticketNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Ticket downloaded");
    } catch {
      toast.error("Failed to download ticket");
    }
  };

  const handleShare = async () => {
    const ticketUrl = `${window.location.origin}/ticket/view/${ticket.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ticket.event?.title} Ticket`,
          text: `Check out my ticket for ${ticket.event?.title}`,
          url: ticketUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(ticketUrl);
        toast.success("Ticket link copied to clipboard");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleTransfer = async () => {
    if (!transferEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setTransferring(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAttendeeEmail: transferEmail }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Ticket transfer initiated. Check email for confirmation.");
      setShowTransfer(false);
      setTransferEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  const isPast = new Date(ticket.event?.date || "") < new Date();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Ticket Card */}
      <div
        className={`relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${categoryGradients[ticket.ticketType?.category || "REGULAR"]}`}
      >
        {/* Ticket Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/20 rounded-full" />
        <div className="absolute -left-12 bottom-20 w-40 h-40 bg-white/10 rounded-full" />

        <div className="relative z-10 p-8 md:p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {categoryIcons[ticket.ticketType?.category || "REGULAR"]}
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">
                  {ticket.ticketType?.category || "REGULAR"}
                </p>
                <h2 className="text-white text-2xl font-bold">
                  {ticket.event?.title || "Event Ticket"}
                </h2>
              </div>
            </div>
            {ticket.isUsed && (
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-semibold">
                ✓ Used
              </div>
            )}
          </div>

          {/* QR Code Section */}
          {ticket.qrCode && (
            <div className="mb-8 bg-white rounded-2xl p-6 flex flex-col items-center">
              <p className="text-gray-600 text-sm font-medium mb-4">
                Scan to check in
              </p>
              <Image
                src={ticket.qrCode}
                alt="QR Code"
                width={200}
                height={200}
                className="w-48 h-48"
              />
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-white/60 text-xs font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                DATE
              </p>
              <p className="text-white font-semibold">
                {formatDate(ticket.event?.date || "")}
              </p>
              <p className="text-white/70 text-sm">
                {formatTime(ticket.event?.date || "")}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-white/60 text-xs font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                LOCATION
              </p>
              <p className="text-white font-semibold">
                {ticket.event?.venue || ticket.event?.location}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-white/60 text-xs font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                ATTENDEE
              </p>
              <p className="text-white font-semibold">{ticket.attendeeName}</p>
              {ticket.attendeeEmail && (
                <p className="text-white/70 text-sm truncate">
                  {ticket.attendeeEmail}
                </p>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <p className="text-white/60 text-xs font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                PRICE
              </p>
              <p className="text-white font-semibold">
                {formatCurrency(ticket.ticketType?.price || 0)}
              </p>
              {ticket.order && (
                <p className="text-white/70 text-xs">
                  Order: {formatCurrency(ticket.order.total)}
                </p>
              )}
            </div>
          </div>

          {/* Ticket Number & Status */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-8">
            <p className="text-white/60 text-xs font-medium mb-2">
              TICKET NUMBER
            </p>
            <p className="text-white text-lg font-mono font-bold">
              {ticket.ticketNumber}
            </p>
            {ticket.isUsed && ticket.usedAt && (
              <p className="text-white/70 text-xs mt-2">
                Used on {formatDate(ticket.usedAt)} at{" "}
                {formatTime(ticket.usedAt)}
              </p>
            )}
          </div>

          {/* Check-in Status */}
          {isPast && !ticket.isUsed && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-4 mb-8 text-white text-sm">
              <p className="font-semibold">⚠️ Event has ended</p>
              <p className="text-white/80 text-xs mt-1">
                This ticket was not scanned during the event
              </p>
            </div>
          )}

          {!isPast && !ticket.isUsed && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-2xl p-4 mb-8 text-white text-sm">
              <p className="font-semibold">✓ Ready for check-in</p>
              <p className="text-white/80 text-xs mt-1">
                Show the QR code at the event entrance
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-semibold transition"
        >
          <Download className="w-5 h-5" />
          Download
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-semibold transition"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>

        {!ticket.isUsed && !isPast && (
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-semibold transition"
          >
            <Send className="w-5 h-5" />
            Transfer
          </button>
        )}
      </div>

      {/* Transfer Form */}
      {showTransfer && !ticket.isUsed && (
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Transfer Ticket
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Transfer this ticket to another attendee. They'll receive a
            confirmation email.
          </p>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Recipient's email address"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-3">
              <button
                onClick={handleTransfer}
                disabled={transferring}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                {transferring ? "Transferring..." : "Confirm Transfer"}
              </button>
              <button
                onClick={() => setShowTransfer(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Link */}
      {ticket.event && (
        <div className="mt-6 text-center">
          <Link
            href={`/event/${ticket.event.slug}`}
            className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            View event details →
          </Link>
        </div>
      )}
    </div>
  );
}

export default EnhancedTicketCard;
