"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { StatsCards } from "@/components/admin/StatsCards";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { EventsTable } from "@/components/admin/EventsTable";
import { OrganizersTable } from "@/components/admin/OrganizersTable";
import { ComplaintsCenter } from "@/components/shared/ComplaintsCenter";
import type { Event, Organizer, PlatformStats } from "@/components/shared/types";

type Tab = "overview" | "events" | "organizers" | "complaints" | "settings";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

const tabConfig: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Platform performance at a glance" },
  events: { title: "All Events", subtitle: "Monitor all events on the platform" },
  organizers: { title: "Organizers", subtitle: "Manage accounts and subscriptions" },
  complaints: { title: "Complaints Center", subtitle: "Handle escalated issues" },
  settings: { title: "Settings", subtitle: "Platform configuration" },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalRevenue: 0, subscriptionRevenue: 0,
    totalEvents: 0, publishedEvents: 0,
    totalTickets: 0, totalOrganizers: 0,
    activeOrganizers: 0, pendingOrganizers: 0,
    totalComplaints: 3, pendingComplaints: 1, escalatedComplaints: 1,
  });
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      if (user?.role !== "ADMIN") { router.push("/dashboard/organizer"); return; }
      setAuthChecked(true);
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, orgsRes] = await Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/admin/organizers").then((r) => r.json()),
      ]);
      const eventsData: Event[] = eventsRes.data || [];
      const orgsData: Organizer[] = orgsRes.data || [];
      setEvents(eventsData);
      setOrganizers(orgsData);
      const totalTickets = eventsData.reduce((s, e) => s + (e._count?.tickets || 0), 0);
      const activeOrgs = orgsData.filter((o) => o.subscriptionStatus === "active").length;
      const pendingOrgs = orgsData.filter((o) => !o.subscriptionStatus || o.subscriptionStatus === "pending").length;
      setStats({
        totalRevenue: totalTickets * 2500,
        subscriptionRevenue: activeOrgs * 5000,
        totalEvents: eventsData.length,
        publishedEvents: eventsData.filter((e) => e.status === "PUBLISHED").length,
        totalTickets,
        totalOrganizers: orgsData.length,
        activeOrganizers: activeOrgs,
        pendingOrganizers: pendingOrgs,
        totalComplaints: 3,
        pendingComplaints: 1,
        escalatedComplaints: 1,
      });
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganizer = useCallback(async (data: Partial<Organizer> & { password: string }) => {
    const res = await fetch("/api/admin/organizers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) => [{ ...json.data, subscriptionStatus: "pending" as const }, ...prev]);
    setStats((prev) => ({ ...prev, totalOrganizers: prev.totalOrganizers + 1, pendingOrganizers: prev.pendingOrganizers + 1 }));
  }, []);

  const handleDeleteOrganizer = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/organizers/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) => prev.filter((o) => o.id !== id));
    setStats((prev) => ({ ...prev, totalOrganizers: Math.max(0, prev.totalOrganizers - 1) }));
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: Organizer["subscriptionStatus"]) => {
    const res = await fetch(`/api/admin/organizers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionStatus: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) => prev.map((o) => o.id === id ? { ...o, subscriptionStatus: newStatus } : o));
  }, []);

  const pendingOrgsCount = organizers.filter((o) => o.subscriptionStatus === "pending" || !o.subscriptionStatus).length;

  if (status === "loading" || (status === "authenticated" && !authChecked)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const tabInfo = tabConfig[activeTab];

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
        role="admin"
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as Tab)}
        userName={user?.name || "Admin"}
        userEmail={user?.email || ""}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        badges={{ organizers: pendingOrgsCount, complaints: stats.escalatedComplaints }}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          title={tabInfo.title}
          subtitle={tabInfo.subtitle}
          userName={user?.name || "Admin"}
          userRole="admin"
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <StatsCards stats={stats} loading={loading} />
                    <AnalyticsCharts />
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">Recent events</h2>
                        <button onClick={() => setActiveTab("events")} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                          View all →
                        </button>
                      </div>
                      <EventsTable events={events.slice(0, 5)} loading={loading} />
                    </div>
                  </div>
                )}

                {activeTab === "events" && (
                  <EventsTable events={events} loading={loading} />
                )}

                {activeTab === "organizers" && (
                  <OrganizersTable
                    organizers={organizers}
                    loading={loading}
                    onAdd={handleAddOrganizer}
                    onDelete={handleDeleteOrganizer}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}

                {activeTab === "complaints" && (
                  <ComplaintsCenter role="admin" />
                )}

                {activeTab === "settings" && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
                    <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-gray-300 font-semibold text-base">Platform settings</p>
                    <p className="text-gray-600 text-sm mt-2">Commission rates and platform config coming soon.</p>
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