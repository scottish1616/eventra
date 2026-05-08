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
import { PendingOrganizersApproval } from "@/components/admin/PendingOrganizersApproval";
import { ComplaintsCenter } from "@/components/shared/ComplaintsCenter";
import type {
  Event,
  Organizer,
  PlatformStats,
} from "@/components/shared/types";

type Tab = "overview" | "events" | "organizers" | "complaints" | "settings";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

const tabConfig: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Platform performance at a glance" },
  events: {
    title: "All Events",
    subtitle: "Monitor all events on the platform",
  },
  organizers: {
    title: "Organizers",
    subtitle: "Manage accounts and subscriptions",
  },
  complaints: {
    title: "Complaints Center",
    subtitle: "Handle escalated issues",
  },
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
    totalRevenue: 0,
    subscriptionRevenue: 0,
    totalEvents: 0,
    publishedEvents: 0,
    totalTickets: 0,
    totalOrganizers: 0,
    activeOrganizers: 0,
    pendingOrganizers: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    escalatedComplaints: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [defaultCommissionRule, setDefaultCommissionRule] = useState<any>(null);
  const [commissionForm, setCommissionForm] = useState({
    id: "",
    name: "Default platform rate",
    feePercent: 5,
    feeFixed: 0,
    minTicketPrice: 0,
    isDefault: true,
  });
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      if (user?.role !== "ADMIN") {
        router.push("/dashboard/organizer");
        return;
      }
      setAuthChecked(true);
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, orgsRes, analyticsRes, complaintsRes, settingsRes] =
        await Promise.all([
          fetch("/api/events").then((r) => r.json()),
          fetch("/api/admin/organizers").then((r) => r.json()),
          fetch("/api/admin/analytics").then((r) => r.json()),
          fetch("/api/complaints").then((r) => r.json()),
          fetch("/api/admin/settings").then((r) => r.json()),
        ]);

      const eventsData: Event[] = eventsRes.data || [];
      const orgsData: Organizer[] = orgsRes.data || [];
      const analytics = analyticsRes.success ? analyticsRes.data : null;
      const complaints = complaintsRes.success ? complaintsRes.data : [];
      const settings = settingsRes.success ? settingsRes.data : null;

      setSettingsData(settings);
      setCommissionRules(settings?.rules || []);
      setDefaultCommissionRule(settings?.defaultRule || null);
      if (settings?.defaultRule) {
        setCommissionForm({
          id: settings.defaultRule.id,
          name: settings.defaultRule.name,
          feePercent: settings.defaultRule.feePercent,
          feeFixed: settings.defaultRule.feeFixed,
          minTicketPrice: settings.defaultRule.minTicketPrice,
          isDefault: settings.defaultRule.isDefault,
        });
      }

      setEvents(eventsData);
      setOrganizers(orgsData);
      setAnalyticsData(analytics);

      const totalTickets = eventsData.reduce(
        (s, e) => s + (e._count?.tickets || 0),
        0,
      );
      const activeOrgs = orgsData.filter(
        (o) => o.approvalStatus === "APPROVED",
      ).length;
      const pendingOrgs = orgsData.filter(
        (o) => o.approvalStatus === "PENDING",
      ).length;

      // Calculate real revenue from analytics or fallback to estimation
      const realRevenue = analytics?.currentStats?.totalRevenue || 0;
      const platformFees = analytics?.currentStats?.platformFees || 0;

      // Count complaints by status
      const pendingComplaints = complaints.filter(
        (c: any) => c.status === "PENDING",
      ).length;
      const escalatedComplaints = complaints.filter(
        (c: any) => c.status === "ESCALATED",
      ).length;

      setStats({
        totalRevenue: realRevenue,
        subscriptionRevenue: platformFees, // Platform fees as subscription revenue
        totalEvents: analytics?.currentStats?.totalEvents || eventsData.length,
        publishedEvents:
          analytics?.currentStats?.publishedEvents ||
          eventsData.filter((e) => e.status === "PUBLISHED").length,
        totalTickets: analytics?.currentStats?.totalTickets || totalTickets,
        totalOrganizers:
          analytics?.currentStats?.totalOrganizers || orgsData.length,
        activeOrganizers:
          analytics?.currentStats?.activeOrganizers || activeOrgs,
        pendingOrganizers:
          analytics?.currentStats?.pendingOrganizers || pendingOrgs,
        totalComplaints: complaints.length,
        pendingComplaints,
        escalatedComplaints,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrganizer = useCallback(
    async (data: Partial<Organizer> & { password: string }) => {
      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOrganizers((prev) => [
        { ...json.data, subscriptionStatus: "pending" as const },
        ...prev,
      ]);
      setStats((prev) => ({
        ...prev,
        totalOrganizers: prev.totalOrganizers + 1,
        pendingOrganizers: prev.pendingOrganizers + 1,
      }));
    },
    [],
  );

  const handleDeleteOrganizer = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/organizers/${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) => prev.filter((o) => o.id !== id));
    setStats((prev) => ({
      ...prev,
      totalOrganizers: Math.max(0, prev.totalOrganizers - 1),
    }));
  }, []);

  const handleUpdateStatus = useCallback(
    async (id: string, newStatus: Organizer["subscriptionStatus"]) => {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setOrganizers((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, subscriptionStatus: newStatus } : o,
        ),
      );
    },
    [],
  );

  const pendingOrgsCount = organizers.filter(
    (o) => o.subscriptionStatus === "pending" || !o.subscriptionStatus,
  ).length;

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
        badges={{
          organizers: pendingOrgsCount,
          complaints: stats.escalatedComplaints,
        }}
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
                    <AnalyticsCharts analyticsData={analyticsData} />

                    {/* Pending Organizers */}
                    {pendingOrgsCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            ⏳ Pending Organizer Approvals
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              {pendingOrgsCount}
                            </span>
                          </h2>
                        </div>
                        <PendingOrganizersApproval />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white">
                          Recent events
                        </h2>
                        <button
                          onClick={() => setActiveTab("events")}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          View all →
                        </button>
                      </div>
                      <EventsTable
                        events={events.slice(0, 5)}
                        loading={loading}
                      />
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
                  <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-6">
                      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-3xl bg-gray-800 flex items-center justify-center">
                            <Settings className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Platform settings
                            </p>
                            <p className="text-gray-500 text-sm">
                              Manage commission rates and platform fee
                              configuration.
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4">
                          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5">
                            <p className="text-xs uppercase text-gray-500 tracking-[0.16em] font-semibold">
                              Active commission rule
                            </p>
                            {defaultCommissionRule ? (
                              <div className="mt-4 space-y-2">
                                <p className="text-white font-semibold">
                                  {defaultCommissionRule.name}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {defaultCommissionRule.feePercent}% + KES{" "}
                                  {defaultCommissionRule.feeFixed} per ticket
                                </p>
                                <p className="text-sm text-gray-500">
                                  Minimum ticket price: KES{" "}
                                  {defaultCommissionRule.minTicketPrice}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm mt-4">
                                No commission rule configured yet.
                              </p>
                            )}
                          </div>

                          <div className="rounded-3xl border border-gray-800 bg-gray-950 p-5">
                            <p className="text-xs uppercase text-gray-500 tracking-[0.16em] font-semibold">
                              Platform config
                            </p>
                            <p className="mt-4 text-sm text-gray-400">
                              Commission rules are applied automatically to all
                              ticket orders on the marketplace.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Commission rule library
                            </p>
                            <p className="text-gray-500 text-sm">
                              Available commission rate presets.
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3">
                          {commissionRules.length > 0 ? (
                            commissionRules.map((rule) => (
                              <button
                                key={rule.id}
                                type="button"
                                onClick={() =>
                                  setCommissionForm({
                                    id: rule.id,
                                    name: rule.name,
                                    feePercent: rule.feePercent,
                                    feeFixed: rule.feeFixed,
                                    minTicketPrice: rule.minTicketPrice,
                                    isDefault: rule.isDefault,
                                  })
                                }
                                className="w-full rounded-3xl border border-gray-800 bg-gray-950 p-4 text-left hover:border-purple-500 transition"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {rule.name}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {rule.feePercent}% + KES {rule.feeFixed}
                                    </p>
                                  </div>
                                  {rule.isDefault && (
                                    <span className="text-xs text-green-400 font-semibold uppercase tracking-[0.2em]">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No commission rules created yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                      <p className="text-sm font-semibold text-white">
                        Create / update rule
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Save your platform commission rates here.
                      </p>

                      {commissionError && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                          {commissionError}
                        </div>
                      )}

                      <form
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!commissionForm.name.trim()) {
                            const message = "Rule name is required.";
                            setCommissionError(message);
                            toast.error(message);
                            return;
                          }
                          if (
                            !Number.isFinite(commissionForm.feePercent) ||
                            commissionForm.feePercent < 0 ||
                            !Number.isFinite(commissionForm.feeFixed) ||
                            commissionForm.feeFixed < 0 ||
                            !Number.isFinite(commissionForm.minTicketPrice) ||
                            commissionForm.minTicketPrice < 0
                          ) {
                            const message =
                              "Fee values must be valid non-negative numbers.";
                            setCommissionError(message);
                            toast.error(message);
                            return;
                          }
                          setCommissionError(null);
                          setCommissionSaving(true);
                          try {
                            const response = await fetch(
                              "/api/admin/settings",
                              {
                                method: "POST",
                                credentials: "same-origin",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(commissionForm),
                              },
                            );
                            const json = await response.json();
                            if (!json.success) {
                              throw new Error(
                                json.error || "Unable to save rule",
                              );
                            }
                            const refreshed = await fetch(
                              "/api/admin/settings",
                              { credentials: "same-origin" },
                            ).then((r) => r.json());
                            setCommissionRules(refreshed.data?.rules || []);
                            setDefaultCommissionRule(
                              refreshed.data?.defaultRule || null,
                            );
                            setCommissionForm({
                              id: json.data.id,
                              name: json.data.name,
                              feePercent: json.data.feePercent,
                              feeFixed: json.data.feeFixed,
                              minTicketPrice: json.data.minTicketPrice,
                              isDefault: json.data.isDefault,
                            });
                            setCommissionError(null);
                            toast.success("Commission rule saved.");
                          } catch (saveError) {
                            const message =
                              saveError instanceof Error
                                ? saveError.message
                                : "Failed to save commission rule.";
                            console.error("Commission save failed:", saveError);
                            setCommissionError(message);
                            toast.error(message);
                          } finally {
                            setCommissionSaving(false);
                          }
                        }}
                        className="mt-6 space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Rule name
                          </label>
                          <input
                            value={commissionForm.name}
                            onChange={(event) =>
                              setCommissionForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Fee percent
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={0.1}
                              value={commissionForm.feePercent}
                              onChange={(event) =>
                                setCommissionForm((prev) => ({
                                  ...prev,
                                  feePercent: Number(event.target.value),
                                }))
                              }
                              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Fixed fee
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={commissionForm.feeFixed}
                              onChange={(event) =>
                                setCommissionForm((prev) => ({
                                  ...prev,
                                  feeFixed: Number(event.target.value),
                                }))
                              }
                              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300">
                            Minimum ticket price
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={commissionForm.minTicketPrice}
                            onChange={(event) =>
                              setCommissionForm((prev) => ({
                                ...prev,
                                minTicketPrice: Number(event.target.value),
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                          />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={commissionForm.isDefault}
                            onChange={(event) =>
                              setCommissionForm((prev) => ({
                                ...prev,
                                isDefault: event.target.checked,
                              }))
                            }
                            className="rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500"
                          />
                          Make this the default commission rule
                        </label>

                        <button
                          type="submit"
                          disabled={commissionSaving}
                          className="w-full rounded-2xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {commissionSaving ? "Saving..." : "Save rule"}
                        </button>
                      </form>
                    </div>
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
