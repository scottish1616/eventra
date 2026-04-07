"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket, TrendingUp, Calendar, Users, Plus, Eye, BarChart3, LogOut } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  slug: string;
  _count: { tickets: number; orders: number };
  orders: { total: number }[];
}

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/events?mine=true")
        .then((r) => r.json())
        .then((d) => { setEvents(d.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const totalRevenue = events.reduce((sum, e) => sum + (e.orders || []).reduce((s, o) => s + o.total, 0), 0);
  const totalTickets = events.reduce((sum, e) => sum + (e._count?.tickets || 0), 0);
  const published = events.filter((e) => e.status === "PUBLISHED").length;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  const statusConfig: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: "Published", className: "bg-green-50 text-green-700 border border-green-200" },
    DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600 border border-gray-200" },
    CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600 border border-red-200" },
    COMPLETED: { label: "Completed", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Eventra</span>
                <span className="text-gray-300 mx-2">/</span>
                <span className="text-gray-500 text-sm">Organizer</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good day, {session?.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here is what is happening with your events</p>
          </div>
          <Link
            href="/dashboard/organizer/events/new"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-600" },
            { label: "Tickets sold", value: totalTickets.toString(), icon: Ticket, color: "from-purple-500 to-blue-600", bg: "bg-purple-50", text: "text-purple-600" },
            { label: "Active events", value: published.toString(), icon: Calendar, color: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-600" },
            { label: "Total events", value: events.length.toString(), icon: BarChart3, color: "from-amber-500 to-orange-600", bg: "bg-amber-50", text: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-md`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Events table */}
        <div className="card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Your events</h2>
              <p className="text-xs text-gray-400 mt-0.5">{events.length} total</p>
            </div>
            <Link
              href="/dashboard/organizer/events/new"
              className="text-sm text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> New event
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">No events yet</p>
              <p className="text-gray-400 text-sm mt-2 mb-6">Create your first event to start selling tickets</p>
              <Link href="/dashboard/organizer/events/new" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Create your first event
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tickets</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((event) => {
                    const revenue = (event.orders || []).reduce((s, o) => s + o.total, 0);
                    const sc = statusConfig[event.status] || statusConfig.DRAFT;
                    return (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {event.location}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(event.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.className}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                          {event._count?.tickets || 0}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(revenue)}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/event/${event.slug}/buy`}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}