"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  isUsed: boolean;
  createdAt: string;
  event: {
    title: string;
    date: string;
    location: string;
  };
  ticketType: {
    name: string;
    price: number;
    category: string;
  };
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/tickets/my")
        .then((r) => r.json())
        .then((d) => {
          setTickets(d.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const categoryColors: Record<string, string> = {
    REGULAR: "bg-blue-50 text-blue-700",
    VIP: "bg-amber-50 text-amber-700",
    VVIP: "bg-violet-50 text-violet-700",
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session?.user?.name}</span>
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Browse events
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} purchased
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <p className="text-4xl mb-4">🎟️</p>
            <p className="font-medium text-gray-700">No tickets yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Browse events and buy your first ticket
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
            >
              Browse events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/ticket/${ticket.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex items-center gap-5 cursor-pointer">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${categoryColors[ticket.ticketType.category]}`}
                  >
                    🎫
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {ticket.event.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ticket.ticketType.name} · {ticket.ticketNumber}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColors[ticket.ticketType.category]}`}
                      >
                        {ticket.ticketType.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        📅 {formatDate(ticket.event.date)}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatCurrency(ticket.ticketType.price)}
                      </span>
                      <span
                        className={`text-xs ${ticket.isUsed ? "text-gray-400" : "text-emerald-600"}`}
                      >
                        {ticket.isUsed ? "Used" : "✓ Valid"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
