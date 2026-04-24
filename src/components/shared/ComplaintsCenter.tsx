"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, AlertTriangle, Clock,
  CheckCircle, ArrowUpCircle, Filter,
  Send, ChevronDown, ChevronUp, Search
} from "lucide-react";
import toast from "react-hot-toast";
import type { Complaint, ComplaintReply } from "./types";

interface Props {
  role: "admin" | "organizer";
  organizerId?: string;
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  IN_PROGRESS: { label: "In Progress", icon: AlertTriangle, className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  RESOLVED: { label: "Resolved", icon: CheckCircle, className: "bg-green-500/10 text-green-400 border-green-500/20" },
  ESCALATED: { label: "Escalated", icon: ArrowUpCircle, className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const priorityConfig = {
  LOW: { label: "Low", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  MEDIUM: { label: "Medium", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  HIGH: { label: "High", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const categoryLabels = {
  PAYMENT: "Payment Issue",
  TICKET: "Ticket Problem",
  EVENT_ISSUE: "Event Issue",
  OTHER: "Other",
};

function ComplaintSkeleton() {
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

export function ComplaintsCenter({ role, organizerId }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const sampleComplaints: Complaint[] = [
    {
      id: "c1",
      title: "Payment deducted but no ticket received",
      description: "I paid KES 2500 via M-Pesa but did not receive my ticket confirmation. Reference: QJD7Y8X2",
      category: "PAYMENT",
      priority: "HIGH",
      status: "PENDING",
      type: "ATTENDEE",
      complainantName: "James Mwangi",
      complainantPhone: "0712345678",
      complainantEmail: null,
      eventId: null,
      organizerId: null,
      resolvedBy: null,
      response: null,
      escalatedAt: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      event: { title: "Nairobi Tech Summit 2025", slug: "nairobi-tech-summit-2025" },
      replies: [],
    },
    {
      id: "c2",
      title: "QR code not scanning at venue",
      description: "My ticket QR code is not being scanned at the venue entrance. Ticket number: NAI-2025-543210",
      category: "TICKET",
      priority: "HIGH",
      status: "IN_PROGRESS",
      type: "ATTENDEE",
      complainantName: "Sarah Odhiambo",
      complainantPhone: "0722345678",
      complainantEmail: null,
      eventId: null,
      organizerId: null,
      resolvedBy: null,
      response: "We are looking into this issue right now.",
      escalatedAt: null,
      resolvedAt: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date().toISOString(),
      event: { title: "Mombasa Music Festival 2025", slug: "mombasa-music-festival-2025" },
      replies: [
        {
          id: "r1",
          complaintId: "c2",
          message: "We are investigating the issue with your QR code. Please wait at the entrance.",
          senderName: "Jane Wanjiru",
          senderRole: "ORGANIZER",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    },
    {
      id: "c3",
      title: "Event cancelled without refund",
      description: "The event was cancelled but I have not received any refund for my tickets purchased.",
      category: "EVENT_ISSUE",
      priority: "HIGH",
      status: "ESCALATED",
      type: "ATTENDEE",
      complainantName: "Peter Kamau",
      complainantPhone: "0733345678",
      complainantEmail: null,
      eventId: null,
      organizerId: null,
      resolvedBy: null,
      response: null,
      escalatedAt: new Date(Date.now() - 1800000).toISOString(),
      resolvedAt: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      event: { title: "Kisumu Startup Pitch Night", slug: "kisumu-startup-pitch-2025" },
      replies: [],
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setComplaints(sampleComplaints);
      setLoading(false);
    }, 800);
  }, []);

  const filtered = complaints.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.complainantName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleReply = async (complaintId: string) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const newReply: ComplaintReply = {
      id: Math.random().toString(36).slice(2),
      complaintId,
      message: replyText.trim(),
      senderName: role === "admin" ? "Admin" : "Organizer",
      senderRole: role.toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId
          ? { ...c, replies: [...(c.replies || []), newReply], status: "IN_PROGRESS" }
          : c
      )
    );
    setReplyText("");
    setReplyLoading(false);
    toast.success("Reply sent");
  };

  const handleStatusChange = async (complaintId: string, newStatus: Complaint["status"]) => {
    setComplaints((prev) =>
      prev.map((c) => c.id === complaintId ? { ...c, status: newStatus } : c)
    );
    toast.success(`Complaint marked as ${newStatus.toLowerCase().replace("_", " ")}`);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    escalated: complaints.filter((c) => c.status === "ESCALATED").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Escalated", value: stats.escalated, color: "text-red-400" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label} complaints</p>
          </div>
        ))}
      </div>

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
      </div>

      {/* Complaints list */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <ComplaintSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No complaints found</p>
            <p className="text-gray-600 text-xs mt-1">
              {statusFilter !== "ALL" ? `No ${statusFilter.toLowerCase()} complaints` : "All clear!"}
            </p>
          </div>
        ) : (
          filtered.map((complaint, i) => {
            const sc = statusConfig[complaint.status];
            const pc = priorityConfig[complaint.priority];
            const StatusIcon = sc.icon;
            const isExpanded = expandedId === complaint.id;

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${pc.className}`}>
                          {pc.label}
                        </span>
                        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                          {categoryLabels[complaint.category]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{complaint.title}</p>
                    </div>
                    <button className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>👤 {complaint.complainantName}</span>
                    {complaint.complainantPhone && <span>📱 {complaint.complainantPhone}</span>}
                    {complaint.event && <span>🎪 {complaint.event.title}</span>}
                    <span className="ml-auto">{timeAgo(complaint.createdAt)}</span>
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
                          <p className="text-xs font-semibold text-gray-400 mb-1">Complaint description</p>
                          <p className="text-sm text-gray-200 leading-relaxed">{complaint.description}</p>
                        </div>

                        {/* Replies thread */}
                        {complaint.replies && complaint.replies.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Conversation ({complaint.replies.length})
                            </p>
                            {complaint.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={`flex gap-3 ${reply.senderRole === "ATTENDEE" ? "" : "flex-row-reverse"}`}
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  reply.senderRole === "ADMIN"
                                    ? "bg-red-500/20 text-red-400"
                                    : reply.senderRole === "ORGANIZER"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-gray-700 text-gray-400"
                                }`}>
                                  {reply.senderName.charAt(0).toUpperCase()}
                                </div>
                                <div className={`flex-1 max-w-xs ${reply.senderRole !== "ATTENDEE" ? "text-right" : ""}`}>
                                  <div className={`inline-block px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                    reply.senderRole === "ATTENDEE"
                                      ? "bg-gray-800 text-gray-200"
                                      : "bg-purple-600/20 text-purple-200 border border-purple-500/20"
                                  }`}>
                                    {reply.message}
                                  </div>
                                  <p className="text-xs text-gray-700 mt-1">
                                    {reply.senderName} · {timeAgo(reply.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {complaint.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleStatusChange(complaint.id, "RESOLVED")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Mark resolved
                            </button>
                          )}
                          {complaint.status !== "ESCALATED" && complaint.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleStatusChange(complaint.id, "ESCALATED")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate to admin
                            </button>
                          )}
                          {complaint.status !== "IN_PROGRESS" && complaint.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleStatusChange(complaint.id, "IN_PROGRESS")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold transition-all"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Mark in progress
                            </button>
                          )}
                        </div>

                        {/* Reply input */}
                        {complaint.status !== "RESOLVED" && (
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                rows={2}
                                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
                              />
                            </div>
                            <button
                              onClick={() => handleReply(complaint.id)}
                              disabled={!replyText.trim() || replyLoading}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
                            >
                              {replyLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              Send
                            </button>
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