"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { ComplaintsCenter } from "@/components/shared/ComplaintsCenter";
import {
  TrendingUp, Ticket, Calendar, Users,
  Plus, Eye, BarChart3, Settings, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { lazy, Suspense } from "react";

const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));
const AreaChart = lazy(() => import("recharts").then(m => ({ default: m.AreaChart })));
const Area = lazy(() => import("recharts").then(m => ({ default: m.Area })));
const XAxis = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import("recharts").then(m => ({ default: m.Tooltip })));

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

type Tab = "overview" | "events" | "analytics" | "complaints" | "settings";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

const tabConfig: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard", subtitle: "Your events and performance" },
  events: { title: "My Events", subtitle: "Manage your events" },
  analytics: { title: "Analytics", subtitle: "Event performance and ticket trends" },
  complaints: { title: "Attendee Issues", subtitle: "Handle and resolve attendee complaints" },
  settings: { title: "Settings", subtitle: "Account and event preferences" },
};

const chartData = [
  { month: "Oct", tickets: 12, revenue: 30000 },
  { month: "Nov", tickets: 28, revenue: 70000 },
  { month: "Dec", tickets: 45, revenue: 112500 },
  { month: "Jan", tickets: 32, revenue: 80000 },
  { month: "Feb", tickets: 58, revenue: 145000 },
  { month: "Mar", tickets: 74, revenue: 185000 },
  { month: "Apr", tickets: 91, revenue: 227500 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  DRAFT: { label: "Draft", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETED: { label: "Completed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEvent, setShowNewEvent] = useState(false);

  const user = session?.user as SessionUser | undefined;

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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabInfo = tabConfig[activeTab];

  const statCards = [
    { label: "Total revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "from-green-500 to-emerald-600", change: "+12%" },
    { label: "Tickets sold", value: totalTickets.toString(), icon: Ticket, color: "from-purple-500 to-blue-600", change: "+18%" },
    { label: "Active events", value: published.toString(), icon: Calendar, color: "from-blue-500 to-cyan-600", change: `${events.length} total` },
    { label: "Total events", value: events.length.toString(), icon: BarChart3, color: "from-amber-500 to-orange-500", change: "All time" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />

      <Sidebar
        role="organizer"
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab as Tab); if (tab === "events") setShowNewEvent(false); }}
        userName={user?.name || "Organizer"}
        userEmail={user?.email || ""}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        badges={{ complaints: 2 }}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          title={tabInfo.title}
          subtitle={tabInfo.subtitle}
          userName={user?.name || "Organizer"}
          userRole="organizer"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >

                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Welcome */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Good day, {user?.name?.split(" ")[0]} 👋
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Here is what is happening with your events</p>
                      </div>
                      <Link
                        href="/dashboard/organizer/events/new"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create event
                      </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {statCards.map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                              <s.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>{s.change}</span>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-white">{s.value}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Quick revenue chart */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-sm font-bold text-white">Revenue trend</h3>
                          <p className="text-xs text-gray-600 mt-0.5">Monthly ticket sales revenue</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("analytics")}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          Full analytics →
                        </button>
                      </div>
                      <Suspense fallback={<div className="h-40 bg-gray-800 rounded-xl animate-pulse" />}>
                        <ResponsiveContainer width="100%" height={160}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                              contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", fontSize: "12px", color: "#f9fafb" }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)" name="Revenue (KES)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Suspense>
                    </div>

                    {/* Recent events */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">Recent events</h3>
                        <button onClick={() => setActiveTab("events")} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                          View all →
                        </button>
                      </div>
                      <div className="space-y-2">
                        {events.slice(0, 4).map((event, i) => {
                          const revenue = (event.orders || []).reduce((s, o) => s + o.total, 0);
                          const sc = statusConfig[event.status] || statusConfig.DRAFT;
                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 hover:border-gray-700 transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                                <p className="text-xs text-gray-600">{formatDate(event.date)} · {event.location}</p>
                              </div>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.className} flex-shrink-0`}>
                                {sc.label}
                              </span>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-bold text-white">{event._count?.tickets || 0} tickets</p>
                                <p className="text-xs text-gray-600">{formatCurrency(revenue)}</p>
                              </div>
                              <Link href={`/event/${event.slug}/buy`} className="text-gray-600 hover:text-purple-400 transition-colors">
                                <Eye className="w-4 h-4" />
                              </Link>
                            </motion.div>
                          );
                        })}
                        {events.length === 0 && (
                          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                            <Calendar className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium text-sm">No events yet</p>
                            <Link
                              href="/dashboard/organizer/events/new"
                              className="inline-flex items-center gap-1.5 mt-4 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create your first event
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Events tab */}
                {activeTab === "events" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-base font-bold text-white">My Events</h2>
                        <p className="text-xs text-gray-600 mt-0.5">{events.length} events total</p>
                      </div>
                      <Link
                        href="/dashboard/organizer/events/new"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create event
                      </Link>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      {events.length === 0 ? (
                        <div className="p-16 text-center">
                          <Calendar className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-300 font-semibold">No events yet</p>
                          <p className="text-gray-600 text-sm mt-2 mb-6">Create your first event to start selling tickets</p>
                          <Link
                            href="/dashboard/organizer/events/new"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
                          >
                            <Plus className="w-4 h-4" /> Create event
                          </Link>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-800">
                                {["Event", "Date", "Status", "Tickets", "Revenue", ""].map((h) => (
                                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {events.map((event, i) => {
                                const revenue = (event.orders || []).reduce((s, o) => s + o.total, 0);
                                const sc = statusConfig[event.status] || statusConfig.DRAFT;
                                return (
                                  <motion.tr
                                    key={event.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <td className="px-4 py-3">
                                      <p className="text-sm font-semibold text-white">{event.title}</p>
                                      <p className="text-xs text-gray-600">{event.location}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(event.date)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.className}`}>
                                        {sc.label}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-bold text-white">{event._count?.tickets || 0}</td>
                                    <td className="px-4 py-3 text-xs font-bold text-green-400">{formatCurrency(revenue)}</td>
                                    <td className="px-4 py-3">
                                      <Link href={`/event/${event.slug}/buy`} className="text-gray-600 hover:text-purple-400 transition-colors">
                                        <Eye className="w-4 h-4" />
                                      </Link>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics tab */}
                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Total revenue", value: formatCurrency(totalRevenue), color: "text-green-400" },
                        { label: "Tickets sold", value: totalTickets, color: "text-purple-400" },
                        { label: "Avg per event", value: events.length > 0 ? Math.round(totalTickets / events.length) : 0, color: "text-blue-400" },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-gray-600 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-sm font-bold text-white mb-5">Ticket sales over time</h3>
                      <Suspense fallback={<div className="h-56 bg-gray-800 rounded-xl animate-pulse" />}>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", fontSize: "12px", color: "#f9fafb" }} />
                            <Area type="monotone" dataKey="tickets" stroke="#8b5cf6" strokeWidth={2} fill="url(#ticketGrad)" name="Tickets sold" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Suspense>
                    </div>
                  </div>
                )}

                {/* Complaints tab */}
                {activeTab === "complaints" && (
                  <ComplaintsCenter role="organizer" />
                )}

                {/* Settings tab */}
                {activeTab === "settings" && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                    <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-300 font-semibold text-base">Account settings</p>
                    <p className="text-gray-600 text-sm mt-2">Profile and notification preferences coming soon.</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}