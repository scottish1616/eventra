"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Search,
  PauseCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Organizer } from "./types.ts";

interface Props {
  organizers: Organizer[];
  loading: boolean;
  onAdd: (data: Partial<Organizer> & { password: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (
    id: string,
    status: Organizer["subscriptionStatus"],
  ) => Promise<void>;
}

const subStatusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
};

function OrganizerSkeleton() {
  return (
    <tr className="border-b border-gray-800">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function OrganizersTable({
  organizers,
  loading,
  onAdd,
  onDelete,
  onUpdateStatus,
}: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organizationName: "",
    password: "",
  });

  const filtered = organizers.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      (o.organizationName || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await onAdd(form);
      setShowModal(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        organizationName: "",
        password: "",
      });
      toast.success("Organizer account created successfully");
    } catch (err) {
      toast.error("Failed to create organizer");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeleteConfirm(null);
      toast.success("Organizer removed");
    } catch {
      toast.error("Failed to delete organizer");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: Organizer["subscriptionStatus"],
  ) => {
    try {
      await onUpdateStatus(id, status);
      toast.success(`Organizer ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizers..."
              className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 w-56"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-gray-800 px-2 py-1 rounded-lg">
              {filtered.length} total
            </span>
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-lg">
              {
                organizers.filter((o) => o.subscriptionStatus === "active")
                  .length
              }{" "}
              active
            </span>
            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-lg">
              {
                organizers.filter(
                  (o) =>
                    o.subscriptionStatus === "pending" || !o.subscriptionStatus,
                ).length
              }{" "}
              pending
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Add organizer
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  "Organizer",
                  "Contact",
                  "Subscription",
                  "Joined",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => <OrganizerSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium text-sm">
                      No organizers yet
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Create the first organizer account
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Add organizer →
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((org, i) => {
                  const subStatus = (org.subscriptionStatus ||
                    "pending") as keyof typeof subStatusConfig;
                  const sc =
                    subStatusConfig[subStatus] || subStatusConfig.pending;
                  const SubIcon = sc.icon;
                  return (
                    <motion.tr
                      key={org.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {org.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {org.organizationName || "No org"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-300">{org.email}</p>
                        <p className="text-xs text-gray-600">
                          {org.phone || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.className}`}
                        >
                          <SubIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(org.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {subStatus !== "active" && (
                            <button
                              onClick={() =>
                                handleStatusChange(org.id, "active")
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold transition-all"
                            >
                              <CheckCircle className="w-3 h-3" /> Activate
                            </button>
                          )}
                          {subStatus === "active" && (
                            <button
                              onClick={() =>
                                handleStatusChange(org.id, "paused")
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs font-semibold transition-all"
                            >
                              <PauseCircle className="w-3 h-3" /> Pause
                            </button>
                          )}
                          {subStatus !== "inactive" &&
                            subStatus !== "pending" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(org.id, "inactive")
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition-all"
                              >
                                <XCircle className="w-3 h-3" /> Deactivate
                              </button>
                            )}
                          {deleteConfirm === org.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(org.id)}
                                className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(org.id)}
                              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add organizer modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gray-900 border border-gray-700 rounded-3xl p-7 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-1">
                Create organizer account
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Share login credentials after creation
              </p>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Full name *
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Jane Wanjiru"
                      required
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Organization
                    </label>
                    <input
                      value={form.organizationName}
                      onChange={(e) =>
                        setForm({ ...form, organizationName: e.target.value })
                      }
                      placeholder="Events Co."
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Email address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="jane@company.com"
                    required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="0712 345 678"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Temporary password *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="They can change this later"
                    required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {formLoading ? "Creating..." : "Create account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
