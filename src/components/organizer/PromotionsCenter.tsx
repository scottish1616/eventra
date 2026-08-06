"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Zap, Plus, Clock, CheckCircle,
  XCircle, Star, TrendingUp,
  Megaphone, ChevronDown
} from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  amount: number;
  adminNote: string | null;
  createdAt: string;
  event: { id: string; title: string } | null;
}

interface Event {
  id: string;
  title: string;
}

const PROMOTION_TYPES = [
  {
    id: "FEATURE",
    label: "Feature my event",
    desc: "Get your event featured on the home page",
    icon: "⭐",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "SPOTLIGHT",
    label: "Spotlight promotion",
    desc: "Highlight your event in search results",
    icon: "🔦",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "HOMEPAGE",
    label: "Homepage banner",
    desc: "Show your event as a banner on the homepage",
    icon: "🏠",
    color: "from-purple-500 to-blue-600",
  },
  {
    id: "DISCOUNT",
    label: "Discount campaign",
    desc: "Run a discount promotion for your event",
    icon: "💸",
    color: "from-green-500 to-teal-500",
  },
];

const statusConfig = {
  PENDING: { label: "Pending review", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ACTIVE: { label: "Active", icon: CheckCircle, className: "bg-green-500/10 text-green-400 border-green-500/20" },
  APPROVED: { label: "Approved", icon: CheckCircle, className: "bg-green-500/10 text-green-400 border-green-500/20" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-400 border-red-500/20" },
  EXPIRED: { label: "Expired", icon: Clock, className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

export function PromotionsCenter() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("FEATURE");
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventId: "",
    amount: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, eventsRes] = await Promise.all([
        fetch("/api/promotions").then((r) => r.json()),
        fetch("/api/events?mine=true").then((r) => r.json()),
      ]);
      setPromotions(promoRes.data || []);
      setEvents(eventsRes.data || []);
    } catch {
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type: selectedType,
          amount: form.amount ? Number(form.amount) : 0,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Promotion request submitted! Admin will review it.");
      setShowForm(false);
      setForm({ title: "", description: "", eventId: "", amount: "", startDate: "", endDate: "" });
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const activeCount = promotions.filter((p) => p.status === "ACTIVE").length;
  const pendingCount = promotions.filter((p) => p.status === "PENDING").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total requests", value: promotions.length, icon: Megaphone, color: "from-purple-500 to-blue-600" },
          { label: "Active promos", value: activeCount, icon: Zap, color: "from-green-500 to-teal-600" },
          { label: "Pending review", value: pendingCount, icon: Clock, color: "from-yellow-500 to-orange-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-white">Promotion requests</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Request admin to promote your events
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          Request promotion
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
              <h3 className="text-sm font-bold text-white mb-5">
                New promotion request
              </h3>

              {/* Type selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-gray-400 mb-3">
                  Promotion type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PROMOTION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedType === type.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{type.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{type.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Promotion title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Feature Nairobi Tech Summit on homepage"
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what you want and why..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Event (optional)
                    </label>
                    <div className="relative">
                      <select
                        value={form.eventId}
                        onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                      >
                        <option value="">All my events</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Budget (KES)
                    </label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Start date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      End date
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                    {formLoading ? "Submitting..." : "Submit request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-3 bg-gray-800 text-gray-300 text-sm rounded-xl hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotions list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))
        ) : promotions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">No promotions yet</p>
            <p className="text-gray-600 text-sm mt-2">
              Request a promotion to boost your event visibility
            </p>
          </div>
        ) : (
          promotions.map((promo, i) => {
            const sc = statusConfig[promo.status as keyof typeof statusConfig] || statusConfig.PENDING;
            const StatusIcon = sc.icon;
            const promoType = PROMOTION_TYPES.find((t) => t.id === promo.type);

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${promoType?.color || "from-gray-600 to-gray-700"} flex items-center justify-center text-xl flex-shrink-0 shadow-md`}>
                      {promoType?.icon || "📢"}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{promo.title}</p>
                      {promo.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {promo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-600">
                          {promoType?.label || promo.type}
                        </span>
                        {promo.event && (
                          <span className="text-xs text-purple-400">
                            📍 {promo.event.title}
                          </span>
                        )}
                        {promo.amount > 0 && (
                          <span className="text-xs text-green-400">
                            KES {promo.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {promo.adminNote && (
                        <div className="mt-2 px-3 py-2 bg-gray-800 rounded-xl">
                          <p className="text-xs text-gray-400">
                            <span className="font-semibold text-gray-300">Admin note:</span>{" "}
                            {promo.adminNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.className}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    <p className="text-xs text-gray-600 mt-2">
                      {formatDate(promo.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}