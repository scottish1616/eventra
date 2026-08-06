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
import { PromotionsAdmin } from "@/components/admin/PromotionsAdmin";
import type {
  Event,
  Organizer,
  PlatformStats,
} from "@/components/shared/types";

type Tab = "overview" | "events" | "organizers" | "complaints" | "promotions" | "settings";

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
  promotions: { title: "Promotions", subtitle: "Review and manage promotion requests" },
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
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [heroImageLoading, setHeroImageLoading] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState<any>(null);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      if (String(user?.role || "").toUpperCase() !== "ADMIN") {
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
      const [eventsRes, orgsRes, analyticsRes, complaintsRes, profileRes] =
        await Promise.all([
          fetch("/api/events").then((r) => r.json()),
          fetch("/api/admin/organizers").then((r) => r.json()),
          fetch("/api/admin/analytics").then((r) => r.json()),
          fetch("/api/complaints").then((r) => r.json()),
          fetch("/api/profile").then((r) => r.json()),
        ]);

      const eventsData: Event[] = eventsRes.data || [];
      const orgsData: Organizer[] = orgsRes.data || [];
      const analytics = analyticsRes.success ? analyticsRes.data : null;
      const complaints = complaintsRes.success ? complaintsRes.data : [];

      setEvents(eventsData);
      setOrganizers(orgsData);
      setAnalyticsData(analytics);

      if (profileRes.data) {
        setProfileData(profileRes.data);
      }

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

  const fetchHeroImage = useCallback(async () => {
    try {
      const res = await fetch("/api/site-assets/hero_background");
      const data = await res.json();
      if (data.success) {
        setCurrentHeroImage(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "settings") {
      fetchHeroImage();
    }
  }, [activeTab, fetchHeroImage]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeroImageLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/site-assets/hero_background", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to upload image");
      } else {
        toast.success("Homepage image updated successfully!");
        fetchHeroImage();
      }
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setHeroImageLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const pendingOrgsCount = organizers.filter(
    (o) => o.approvalStatus === "PENDING",
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
        userImage={profileData?.image || (user as any)?.image || null}
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
          userImage={profileData?.image || (user as any)?.image || null}
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

                    {/* Profile card with bio */}
                    {profileData && (
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-white mb-1">
                              {profileData.name || user?.name}
                            </h3>
                            {profileData.bio && (
                              <p className="text-xs text-gray-400 leading-relaxed">
                                {profileData.bio}
                              </p>
                            )}
                            {!profileData.bio && (
                              <p className="text-xs text-gray-600 italic">
                                No bio added yet
                              </p>
                            )}
                          </div>
                          <a
                            href="/dashboard/profile"
                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all"
                          >
                            Edit
                          </a>
                        </div>
                      </div>
                    )}

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
                    userRole={user?.role}
                  />
                )}

                {activeTab === "complaints" && (
                  <ComplaintsCenter role="admin" />
                )}

                {activeTab === "promotions" && (
                  <PromotionsAdmin />
                )}

                {activeTab === "settings" && (
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
                            Manage global platform configuration and homepage appearance.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                      <p className="text-sm font-semibold text-white">Homepage Appearance</p>
                      <p className="text-gray-500 text-sm mt-1 mb-6">
                        Set the background image for the homepage hero section. You can only change this once every 7 days.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-full sm:w-1/2 aspect-video bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden relative">
                          {currentHeroImage?.imageUrl ? (
                            <img src={currentHeroImage.imageUrl} alt="Hero Background" className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                              <span className="text-2xl mb-2">🖼️</span>
                              <span className="text-xs">No image set</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          {currentHeroImage?.updatedAt && (
                            <p className="text-xs text-gray-400">
                              Last updated: {new Date(currentHeroImage.updatedAt).toLocaleDateString()}
                            </p>
                          )}
                          <label className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer shadow-lg disabled:opacity-50">
                            {heroImageLoading ? "Uploading..." : "Upload New Image"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleHeroImageUpload}
                              disabled={heroImageLoading}
                            />
                          </label>
                        </div>
                      </div>
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
