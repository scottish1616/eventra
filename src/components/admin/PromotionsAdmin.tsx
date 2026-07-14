"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Megaphone, Clock, CheckCircle,
  XCircle, Star, Zap
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
  organizer: { name: string; email: string; organizationName: string | null } | null;
  event: { id: string; title: string } | null;
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  ACTIVE: { label: "Active", icon: CheckCircle, className: "bg-green-500/10 text-green-400 border-green-500/20" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-400 border-red-500/20" },
  EXPIRED: { label: "Expired", icon: Clock, className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const typeEmojis: Record<string, string> = {
  FEATURE: "⭐",
  SPOTLIGHT: "🔦",
  HOMEPAGE: "🏠",
  DISCOUNT: "💸",
};

export function PromotionsAdmin() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [actionNote, setActionNote] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promotions");
      const json = await res.json();
      setPromotions(json.data || []);
    } catch {
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: actionNote }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: status === "APPROVED" ? "ACTIVE" : status, adminNote: actionNote }
            : p
        )
      );
      setActionId(null);
      setActionNote("");
      toast.success(`Promotion ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const filtered = promotions.filter(
    (p) => filter === "ALL" || p.status === filter
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const pendingCount = promotions.filter((p) => p.status === "PENDING").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: promotions.length, color: "text-white" },
          { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          { label: "Active", value: promotions.filter((p) => p.status === "ACTIVE").length, color: "text-green-400" },
          { label: "Rejected", value: promotions.filter((p) => p.status === "REJECTED").length, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {["ALL", "PENDING", "ACTIVE", "REJECTED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            {f === "PENDING" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-yellow-950 text-xs font-black px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Promotions */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">No promotions found</p>
          </div>
        ) : (
          filtered.map((promo, i) => {
            const sc = statusConfig[promo.status as keyof typeof statusConfig] || statusConfig.PENDING;
            const StatusIcon = sc.icon;
            const isExpanded = actionId === promo.id;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl flex-shrink-0">
                        {typeEmojis[promo.type] || "📢"}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{promo.title}</p>
                        {promo.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-600">
                            By {promo.organizer?.organizationName || promo.organizer?.name}
                          </span>
                          {promo.event && (
                            <span className="text-xs text-purple-400">
                              📍 {promo.event.title}
                            </span>
                          )}
                          {promo.amount > 0 && (
                            <span className="text-xs text-green-400 font-semibold">
                              KES {promo.amount.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs text-gray-700">
                            {formatDate(promo.createdAt)}
                          </span>
                        </div>
                        {promo.adminNote && (
                          <div className="mt-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-400">
                              Note: {promo.adminNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions for pending */}
                  {promo.status === "PENDING" && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      {!isExpanded ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setActionId(promo.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleAction(promo.id, "REJECTED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <textarea
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            placeholder="Add a note for the organizer (optional)..."
                            rows={2}
                            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(promo.id, "APPROVED")}
                              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Confirm approve
                            </button>
                            <button
                              onClick={() => handleAction(promo.id, "REJECTED")}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Confirm reject
                            </button>
                            <button
                              onClick={() => { setActionId(null); setActionNote(""); }}
                              className="px-3 py-2 bg-gray-800 text-gray-400 rounded-xl text-xs hover:bg-gray-700 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}