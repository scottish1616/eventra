"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ticket,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  LogOut,
  BarChart3,
  Shield,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  slug: string;
  organizer: { name: string; organizationName: string | null };
  _count: { tickets: number };
}

interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organizationName: string | null;
  createdAt: string;
}

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "organizers"
  >("overview");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organizationName: "",
    password: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      const user = session?.user as SessionUser;
      if (user?.role !== "ADMIN") {
        router.push("/dashboard/organizer");
        return;
      }
      setAuthChecked(true);
      Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/admin/organizers").then((r) => r.json()),
      ])
        .then(([eventsData, organizersData]) => {
          setEvents(eventsData.data || []);
          setOrganizers(organizersData.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleAddOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");
    try {
      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed");
        setFormLoading(false);
        return;
      }
      setFormSuccess(`Account created for ${form.name}`);
      setOrganizers((prev) => [json.data, ...prev]);
      setForm({
        name: "",
        email: "",
        phone: "",
        organizationName: "",
        password: "",
      });
      setShowAddForm(false);
    } catch {
      setFormError("Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const statusConfig: Record<string, { label: string; className: string }> = {
    PUBLISHED: {
      label: "Published",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    DRAFT: {
      label: "Draft",
      className: "bg-gray-100 text-gray-600 border border-gray-200",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-50 text-red-600 border border-red-200",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
  };

  if (
    status === "loading" ||
    (status === "authenticated" && !authChecked) ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as SessionUser;

  const stats = [
    {
      label: "Total events",
      value: events.length,
      icon: Calendar,
      color: "from-purple-500 to-blue-600",
    },
    {
      label: "Published events",
      value: events.filter((e) => e.status === "PUBLISHED").length,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Total tickets",
      value: events.reduce((s, e) => s + (e._count?.tickets || 0), 0),
      icon: Ticket,
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Organizers",
      value: organizers.length,
      icon: Users,
      color: "from-blue-500 to-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col min-h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Eventra</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              Super Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "events", label: "All Events", icon: Calendar },
            { id: "organizers", label: "Organizers", icon: Users },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-3 px-3">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "overview" && "Platform Overview"}
              {activeTab === "events" && "All Events"}
              {activeTab === "organizers" && "Manage Organizers"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === "overview" &&
                "Monitor platform activity and performance"}
              {activeTab === "events" &&
                "View and monitor all events on the platform"}
              {activeTab === "organizers" &&
                "Add and manage organizer accounts"}
            </p>
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="card p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-md`}
                    >
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {s.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent events */}
              <div className="card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">Recent events</h2>
                  <button
                    onClick={() => setActiveTab("events")}
                    className="text-sm text-purple-600 font-semibold hover:text-purple-700"
                  >
                    View all →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Organizer
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tickets
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {events.slice(0, 5).map((event) => {
                        const sc =
                          statusConfig[event.status] || statusConfig.DRAFT;
                        return (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900 text-sm">
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {event.location}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {event.organizer?.organizationName ??
                                event.organizer?.name}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.className}`}
                              >
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                              {event._count?.tickets || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Events tab */}
          {activeTab === "events" && (
            <div className="card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">
                  All events ({events.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Organizer
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tickets
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {events.map((event) => {
                      const sc =
                        statusConfig[event.status] || statusConfig.DRAFT;
                      return (
                        <tr
                          key={event.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href={`/event/${event.slug}/buy`}
                              className="font-semibold text-gray-900 text-sm hover:text-purple-600 transition-colors"
                            >
                              {event.title}
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {event.location}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {event.organizer?.organizationName ??
                              event.organizer?.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(event.date)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.className}`}
                            >
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                            {event._count?.tickets || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Organizers tab */}
          {activeTab === "organizers" && (
            <div>
              {formSuccess && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    {formSuccess}
                  </p>
                </div>
              )}

              <div className="card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">
                      Organizers ({organizers.length})
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Manage organizer accounts
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setFormError("");
                    }}
                    className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
                  >
                    <Plus className="w-4 h-4" />
                    Add organizer
                  </button>
                </div>

                {showAddForm && (
                  <div className="px-6 py-6 border-b border-gray-100 bg-purple-50">
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      Create organizer account
                    </h3>
                    {formError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {formError}
                      </div>
                    )}
                    <form
                      onSubmit={handleAddOrganizer}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Full name
                        </label>
                        <input
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          placeholder="Jane Wanjiru"
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Organization
                        </label>
                        <input
                          value={form.organizationName}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              organizationName: e.target.value,
                            })
                          }
                          placeholder="Nairobi Events Co."
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Email address
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          placeholder="jane@company.com"
                          required
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Phone number
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          placeholder="0712 345 678"
                          className="input-field"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Temporary password
                        </label>
                        <input
                          type="password"
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          placeholder="They can change this later"
                          required
                          className="input-field"
                        />
                      </div>
                      <div className="col-span-2 flex gap-3">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {formLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {formLoading
                            ? "Creating..."
                            : "Create organizer account"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="btn-secondary px-5"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {organizers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Users className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-gray-500 font-medium">
                              No organizers yet
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              Click Add organizer to create the first account
                            </p>
                          </td>
                        </tr>
                      ) : (
                        organizers.map((org) => (
                          <tr
                            key={org.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {org.name.charAt(0).toUpperCase()}
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {org.name}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {org.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {org.organizationName || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {org.phone || "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">
                              {formatDate(org.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
