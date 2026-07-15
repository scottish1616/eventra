"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/shared/Sidebar";
import { Topbar } from "@/components/shared/Topbar";
import { StatsCards } from "@/components/admin/StatsCards";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { EventsTable } from "@/components/admin/EventsTable";
import { OrganizersTable } from "@/components/admin/OrganizersTable";
import { ComplaintsCenter } from "@/components/shared/ComplaintsCenter";
import {
  Shield, Users, Settings, Activity,
  Plus, Trash2, CheckCircle, XCircle,
  Crown
} from "lucide-react";
import type { Event, Organizer, PlatformStats } from "@/components/shared/types";

type Tab = "overview" | "events" | "organizers" | "admins" | "complaints" | "settings";
type SessionUser = { name?: string | null; email?: string | null; role?: string };

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  subscriptionStatus: string;
}

const tabConfig: Record<Tab, { title: string; subtitle: string }> = {
  overview: { title: "Platform Overview", subtitle: "Full system health and analytics" },
  events: { title: "All Events", subtitle: "Every event on the platform" },
  organizers: { title: "Organizers", subtitle: "Manage organizer accounts" },
  admins: { title: "Admin Management", subtitle: "Manage platform administrators" },
  complaints: { title: "Complaints", subtitle: "All escalated complaints" },
  settings: { title: "Platform Settings", subtitle: "Global configuration" },
};

const overseerNavItems = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "events", label: "Events", icon: Activity },
  { id: "organizers", label: "Organizers", icon: Users },
  { id: "admins", label: "Admins", icon: Shield },
  { id: "complaints", label: "Complaints", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function OverseerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [heroImageLoading, setHeroImageLoading] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState<any>(null);
  const [stats, setStats] = useState<PlatformStats>({
    totalRevenue: 0, subscriptionRevenue: 0,
    totalEvents: 0, publishedEvents: 0,
    totalTickets: 0, totalOrganizers: 0,
    activeOrganizers: 0, pendingOrganizers: 0,
    totalComplaints: 0, pendingComplaints: 0, escalatedComplaints: 0,
  });

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      if (user?.role !== "OVERSEER") {
        router.push("/auth/login");
        return;
      }
      setAuthChecked(true);
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, orgsRes, adminsRes] = await Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/admin/organizers").then((r) => r.json()),
        fetch("/api/overseer/admins").then((r) => r.json()),
      ]);

      const eventsData: Event[] = eventsRes.data || [];
      const orgsData: Organizer[] = orgsRes.data || [];
      const adminsData: AdminUser[] = adminsRes.data || [];

      setEvents(eventsData);
      setOrganizers(orgsData);
      setAdmins(adminsData);

      const totalTickets = eventsData.reduce(
        (s, e) => s + (e._count?.tickets || 0), 0
      );
      const activeOrgs = orgsData.filter(
        (o) => o.subscriptionStatus === "active"
      ).length;
      const pendingOrgs = orgsData.filter(
        (o) => !o.subscriptionStatus || o.subscriptionStatus === "pending"
      ).length;

      setStats({
        totalRevenue: totalTickets * 2500,
        subscriptionRevenue: activeOrgs * 5000,
        totalEvents: eventsData.length,
        publishedEvents: eventsData.filter((e) => e.status === "PUBLISHED").length,
        totalTickets,
        totalOrganizers: orgsData.length,
        activeOrganizers: activeOrgs,
        pendingOrganizers: pendingOrgs,
        totalComplaints: 0,
        pendingComplaints: 0,
        escalatedComplaints: 0,
      });
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormLoading(true);
    try {
      const res = await fetch("/api/overseer/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...adminForm, role: "ADMIN" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAdmins((prev) => [json.data, ...prev]);
      setAdminForm({ name: "", email: "", password: "" });
      setShowAddAdmin(false);
      toast.success("Admin account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setAdminFormLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const res = await fetch(`/api/overseer/admins/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to remove admin");
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
  }, []);

  const handleDeleteOrganizer = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/organizers/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: Organizer["subscriptionStatus"]) => {
    const res = await fetch(`/api/admin/organizers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionStatus: newStatus }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setOrganizers((prev) =>
      prev.map((o) => o.id === id ? { ...o, subscriptionStatus: newStatus } : o)
    );
  }, []);

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

  if (status === "loading" || (status === "authenticated" && !authChecked)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-800 border-t-red-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading overseer panel...</p>
        </div>
      </div>
    );
  }

  const tabInfo = tabConfig[activeTab];
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: "12px", fontSize: "13px" },
      }} />

      {/* Custom overseer sidebar */}
      <aside className="hidden lg:flex w-56 flex-col min-h-screen sticky top-0 border-r border-gray-800 bg-gray-950">
        <div className="px-4 py-4 border-b border-gray-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Eventra</p>
            <p className="text-xs text-red-400 font-semibold">Overseer</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { id: "overview", label: "Overview", emoji: "📊" },
            { id: "events", label: "Events", emoji: "🎪" },
            { id: "organizers", label: "Organizers", emoji: "👥" },
            { id: "admins", label: "Admins", emoji: "🛡️" },
            { id: "complaints", label: "Complaints", emoji: "💬" },
            { id: "settings", label: "Settings", emoji: "⚙️" },
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                activeTab === item.id ? "text-white" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="overseer-active"
                  className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/20"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative z-10">{item.emoji}</span>
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          ))}
          {/* Content management — external page link */}
          <a
            href="/dashboard/content"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-gray-500 hover:text-gray-200 hover:bg-white/5"
          >
            <span>🖼️</span>
            <span>Content</span>
          </a>
        </nav>


        <div className="px-3 py-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || "O"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-red-400 font-semibold">Overseer</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const { signOut } = await import("next-auth/react");
              signOut({ callbackUrl: "/" });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar
          title={tabInfo.title}
          subtitle={tabInfo.subtitle}
          userName={user?.name || "Overseer"}
          userRole="overseer"
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
                    {/* Overseer badge */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4">
                      <Crown className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="text-sm font-bold text-red-400">Overseer Access</p>
                        <p className="text-xs text-gray-500">You have full platform control including admin management</p>
                      </div>
                    </div>
                    <StatsCards stats={stats} loading={loading} />
                    <AnalyticsCharts />
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

                {activeTab === "admins" && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-bold text-white">
                          Platform Admins ({admins.length})
                        </h2>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Only you (Overseer) can manage admins
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddAdmin(!showAddAdmin)}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add admin
                      </button>
                    </div>

                    {showAddAdmin && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5"
                      >
                        <h3 className="text-sm font-bold text-white mb-4">
                          Create admin account
                        </h3>
                        <form onSubmit={handleAddAdmin} className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full name</label>
                            <input
                              value={adminForm.name}
                              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                              placeholder="Admin name"
                              required
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={adminForm.email}
                              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                              placeholder="admin@eventra.com"
                              required
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
                            <input
                              type="password"
                              value={adminForm.password}
                              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                              placeholder="Temporary password"
                              required
                              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div className="col-span-3 flex gap-3">
                            <button
                              type="submit"
                              disabled={adminFormLoading}
                              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
                            >
                              {adminFormLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                              {adminFormLoading ? "Creating..." : "Create admin"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddAdmin(false)}
                              className="px-5 py-2.5 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      {admins.length === 0 ? (
                        <div className="p-16 text-center">
                          <Shield className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400 font-semibold">No admins yet</p>
                          <p className="text-gray-600 text-sm mt-2">Create the first admin account</p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-800">
                              {["Name", "Email", "Role", "Joined", "Actions"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {admins.map((admin, i) => (
                              <motion.tr
                                key={admin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                                      {admin.name.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-sm font-semibold text-white">{admin.name}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">{admin.email}</td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                    {admin.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">{formatDate(admin.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "complaints" && (
                  <ComplaintsCenter role="admin" />
                )}

                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-3xl bg-gray-800 flex items-center justify-center">
                          <Settings className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Platform Settings</p>
                          <p className="text-gray-500 text-sm">Manage global configuration for the platform.</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-800 pt-6 mt-6">
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
                            <label className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition cursor-pointer shadow-lg disabled:opacity-50">
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