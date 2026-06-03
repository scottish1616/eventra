"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, AlertTriangle, Clock,
  CheckCircle, ArrowUpCircle, Filter,
  Send, ChevronDown, ChevronUp, Search,
  User, Calendar
} from "lucide-react";
import toast from "react-hot-toast";

interface ComplaintReply {
  id: string;
  complaintId: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  complainantName: string;
  complainantPhone: string | null;
  complainantEmail: string | null;
  eventId: string | null;
  organizerId: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  event: { id: string; title: string; slug: string } | null;
  organizer: { id: string; name: string; organizationName: string | null } | null;
  replies: ComplaintReply[];
}

interface Props {
  role: "admin" | "organizer";
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  IN_PROGRESS: { label: "In Progress", icon: AlertTriangle, className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  RESOLVED: { label: "Resolved", icon: CheckCircle, className: "bg-green-500/10 text-green-400 border-green-500/20" },
  ESCALATED: { label: "Escalated to Admin", icon: ArrowUpCircle, className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const priorityConfig = {
  LOW: { label: "Low", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  MEDIUM: { label: "Medium", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  HIGH: { label: "High", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const categoryLabels: Record<string, string> = {
  PAYMENT: "Payment",
  TICKET: "Ticket",
  EVENT_ISSUE: "Event Issue",
  OTHER: "Other",
};

function SkeletonComplaint() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-48 h-4 bg-gray-800 rounded" />
        <div className="w-20 h-5 bg-gray-800 rounded-full" />
      </div>
      <div className="w-full h-3 bg-gray-800 rounded mb-2" />
      <div className="w-3/4 h-3 bg-gray-800 rounded" />
    </div>
  );
}

export function ComplaintsCenter({ role }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter !== "ALL"
          ? `/api/complaints?status=${statusFilter}`
          : "/api/complaints";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setComplaints(json.data || []);
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    complaintId: string,
    action: "reply" | "resolve" | "escalate",
    message?: string
  ) => {
    setActionLoading(`${complaintId}-${action}`);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      if (action === "reply") {
        setReplyTexts((prev) => ({ ...prev, [complaintId]: "" }));
        toast.success("Reply sent");
      } else if (action === "resolve") {
        toast.success("Complaint resolved");
      } else if (action === "escalate") {
        toast.success("Complaint escalated to admin");
      }

      await loadComplaints();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.complainantName.toLowerCase().includes(search.toLowerCase()) ||
      (c.event?.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    escalated: complaints.filter((c) => c.status === "ESCALATED").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Escalated", value: stats.escalated, color: "text-red-400" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {role === "admin" && (
        <div className="mb-5 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
          <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            You are viewing escalated complaints assigned to admin
          </p>
          <p className="text-xs text-gray-500 mt-1">
            These complaints were escalated by organizers after failing to resolve them.
          </p>
        </div>
      )}

      {role === "organizer" && (
        <div className="mb-5 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
          <p className="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Attendee complaints assigned to you
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Resolve complaints or escalate to admin if you cannot resolve them.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints..."
            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 w-52"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {["ALL", "PENDING", "IN_PROGRESS", "ESCALATED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700"
              }`}
            >
              {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          onClick={loadComplaints}
          className="text-xs text-gray-500 hover:text-white ml-auto"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Complaints list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonComplaint key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No complaints found</p>
            <p className="text-gray-600 text-xs mt-1">
              {statusFilter !== "ALL"
                ? `No ${statusFilter.toLowerCase().replace("_", " ")} complaints`
                : role === "organizer"
                ? "No attendee complaints for your events yet"
                : "No escalated complaints at this time"}
            </p>
          </div>
        ) : (
          filtered.map((complaint, i) => {
            const sc =
              statusConfig[complaint.status as keyof typeof statusConfig];
            const pc =
              priorityConfig[complaint.priority as keyof typeof priorityConfig];
            const StatusIcon = sc?.icon || Clock;
            const isExpanded = expandedId === complaint.id;
            const replyText = replyTexts[complaint.id] || "";

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : complaint.id)
                  }
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {sc && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.className}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        )}
                        {pc && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pc.className}`}
                          >
                            {pc.label}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                          {categoryLabels[complaint.category] || complaint.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {complaint.title}
                      </p>
                    </div>
                    <button className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {complaint.complainantName}
                    </span>
                    {complaint.complainantPhone && (
                      <span>📱 {complaint.complainantPhone}</span>
                    )}
                    {complaint.event && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {complaint.event.title}
                      </span>
                    )}
                    {complaint.escalatedAt && (
                      <span className="text-red-400 font-semibold">
                        ⚠ Escalated
                      </span>
                    )}
                    <span className="ml-auto">
                      {timeAgo(complaint.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-gray-800 pt-4">
                        {/* Description */}
                        <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
                          <p className="text-xs font-semibold text-gray-400 mb-1">
                            Complaint description
                          </p>
                          <p className="text-sm text-gray-200 leading-relaxed">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Event info */}
                        {complaint.event && (
                          <div className="bg-gray-800/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-300">
                                {complaint.event.title}
                              </p>
                              <p className="text-xs text-gray-600">
                                Event reference
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Replies thread */}
                        {(complaint.replies?.length ?? 0) > 0 && (
                          <div className="space-y-3 mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Conversation ({complaint.replies?.length ?? 0})
                            </p>
                            {(complaint.replies || []).map((reply) => {
                              const isOwnReply =
                                reply.senderRole === role.toUpperCase();
                              return (
                                <div
                                  key={reply.id}
                                  className={`flex gap-3 ${isOwnReply ? "flex-row-reverse" : ""}`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                      reply.senderRole === "ADMIN"
                                        ? "bg-red-500/20 text-red-400"
                                        : reply.senderRole === "ORGANIZER"
                                        ? "bg-purple-500/20 text-purple-400"
                                        : "bg-gray-700 text-gray-400"
                                    }`}
                                  >
                                    {reply.senderName.charAt(0).toUpperCase()}
                                  </div>
                                  <div
                                    className={`flex-1 max-w-xs ${isOwnReply ? "text-right" : ""}`}
                                  >
                                    <div
                                      className={`inline-block px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                        reply.senderRole === "ATTENDEE"
                                          ? "bg-gray-800 text-gray-200"
                                          : isOwnReply
                                          ? "bg-purple-600/20 text-purple-200 border border-purple-500/20"
                                          : "bg-blue-600/20 text-blue-200 border border-blue-500/20"
                                      }`}
                                    >
                                      {reply.message}
                                    </div>
                                    <p className="text-xs text-gray-700 mt-1">
                                      {reply.senderName} ·{" "}
                                      {timeAgo(reply.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Actions */}
                        {complaint.status !== "RESOLVED" && (
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <button
                              onClick={() =>
                                handleAction(complaint.id, "resolve")
                              }
                              disabled={
                                actionLoading === `${complaint.id}-resolve`
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Mark resolved
                            </button>

                            {role === "organizer" &&
                              complaint.status !== "ESCALATED" && (
                                <button
                                  onClick={() =>
                                    handleAction(
                                      complaint.id,
                                      "escalate",
                                      "Unable to resolve this issue at organizer level. Escalating to admin."
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    `${complaint.id}-escalate`
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                                >
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                  Escalate to admin
                                </button>
                              )}
                          </div>
                        )}

                        {/* Reply input */}
                        {complaint.status !== "RESOLVED" && (
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [complaint.id]: e.target.value,
                                  }))
                                }
                                placeholder="Type your reply to the attendee..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                              />
                            </div>
                            <button
                              onClick={() =>
                                handleAction(
                                  complaint.id,
                                  "reply",
                                  replyText
                                )
                              }
                              disabled={
                                !replyText.trim() ||
                                actionLoading === `${complaint.id}-reply`
                              }
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                            >
                              {actionLoading === `${complaint.id}-reply` ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              Send
                            </button>
                          </div>
                        )}

                        {complaint.status === "RESOLVED" && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-center">
                            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                            <p className="text-xs text-green-400 font-semibold">
                              This complaint has been resolved
                            </p>
                            {complaint.resolvedAt && (
                              <p className="text-xs text-gray-600 mt-0.5">
                                {timeAgo(complaint.resolvedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}