"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface Ticket {
  id: string;
  ticketNumber: string;
  qrCode: string;
  attendeeName: string;
  attendeeEmail: string;
  isUsed: boolean;
  event: {
    title: string;
    date: string;
    location: string;
    venue: string | null;
    organizer: { name: string; organizationName: string | null };
  };
  ticketType: {
    name: string;
    price: number;
    category: string;
  };
}

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/tickets/${params.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setTicket(d.data);
          } else {
            setError(d.error || "Ticket not found");
          }
          setLoading(false);
        });
    }
  }, [status, params.id, router]);

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
    VIP: "from-amber-500 to-amber-600",
    VVIP: "from-violet-600 to-violet-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-medium">
            {error || "Ticket not found"}
          </p>
          <Link
            href="/account"
            className="mt-4 inline-block text-violet-600 text-sm hover:underline"
          >
            Back to my tickets
          </Link>
        </div>
      </div>
    );
  }

  const gradient =
    categoryGradients[ticket.ticketType.category] ??
    "from-gray-600 to-gray-700";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-gray-900"
        >
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            E
          </div>
          Eventra
        </Link>
        <Link href="/account" className="text-sm text-gray-600 hover:underline">
          My tickets
        </Link>
      </nav>

      <div className="max-w-md mx-auto px-4 py-10">
        {/* Success banner */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6">
          <span className="text-emerald-600 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Ticket confirmed
            </p>
            <p className="text-xs text-emerald-600">
              Show this QR code at the venue entrance
            </p>
          </div>
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
          {/* Header */}
          <div className={`bg-gradient-to-r ${gradient} px-6 py-6 text-white`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  {ticket.ticketType.category} TICKET
                </p>
                <h1 className="text-xl font-bold leading-tight">
                  {ticket.event.title}
                </h1>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <p className="text-xs font-bold">{ticket.ticketType.name}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-white/90">
              <p>📅 {formatDate(ticket.event.date)}</p>
              <p>
                📍 {ticket.event.location}
                {ticket.event.venue ? ` · ${ticket.event.venue}` : ""}
              </p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-gray-200 mx-4" />

          {/* QR Code */}
          <div className="px-6 py-6 flex flex-col items-center">
            {ticket.qrCode ? (
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <Image
                  src={ticket.qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <p className="text-xs text-gray-400">QR code unavailable</p>
              </div>
            )}
            <p className="text-xs font-mono text-gray-400 text-center break-all">
              {ticket.ticketNumber}
            </p>
          </div>

          {/* Dashed divider */}
          <div className="border-t-2 border-dashed border-gray-200 mx-4" />

          {/* Details */}
          <div className="px-6 py-4 space-y-2 text-sm">
            {[
              { label: "Attendee", value: ticket.attendeeName },
              { label: "Email", value: ticket.attendeeEmail },
              {
                label: "Price paid",
                value: formatCurrency(ticket.ticketType.price),
              },
              {
                label: "Organizer",
                value:
                  ticket.event.organizer.organizationName ??
                  ticket.event.organizer.name,
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-medium text-gray-900 truncate ml-4">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div
            className={`px-6 py-3 text-center ${ticket.isUsed ? "bg-gray-100" : "bg-emerald-50"}`}
          >
            <p
              className={`text-xs font-semibold ${ticket.isUsed ? "text-gray-500" : "text-emerald-700"}`}
            >
              {ticket.isUsed ? "Already used" : "Valid — not yet used"}
            </p>
          </div>
        </div>

        <Link
          href="/account"
          className="mt-6 w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Back to my tickets
        </Link>
      </div>
    </div>
  );
}
