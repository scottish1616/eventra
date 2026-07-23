"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, AlertCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

interface PendingOrganizer {
  id: string;
  name: string;
  email: string;
  organizationName: string | null;
  phone: string | null;
  createdAt: string;
  approvalStatus: string;
}

interface Props {
  organizerId?: string;
}

export function PendingOrganizersApproval() {
  const [organizers, setOrganizers] = useState<PendingOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPendingOrganizers();
  }, []);

  const fetchPendingOrganizers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organizers");
      const json = await res.json();
      if (json.success) {
        const pending = (json.data || []).filter(
          (org: PendingOrganizer) => org.approvalStatus === "PENDING",
        );
        setOrganizers(pending);
      }
    } catch (error) {
      console.error("Failed to fetch pending organizers", error);
      toast.error("Failed to load pending organizers");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: "APPROVED" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to approve");
      }
      setOrganizers((prev) => prev.filter((org) => org.id !== id));
      toast.success("Organizer approved!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setApproving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    setApproving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus: "REJECTED",
          rejectionReason: reason || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reject");
      }
      setOrganizers((prev) => prev.filter((org) => org.id !== id));
      toast.success("Organizer rejected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setApproving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-5 h-5 text-purple-600 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">
          Loading pending organizers...
        </span>
      </div>
    );
  }

  if (organizers.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">No pending organizers</p>
        <p className="text-gray-600 text-xs mt-1">
          All organizer requests have been reviewed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {organizers.map((org, i) => (
        <motion.div
          key={org.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{org.name}</p>
              <p className="text-xs text-gray-500 mt-1">{org.email}</p>
              {org.organizationName && (
                <p className="text-xs text-gray-600 mt-1">
                  📋 {org.organizationName}
                </p>
              )}
              {org.phone && (
                <p className="text-xs text-gray-600 mt-0.5">📱 {org.phone}</p>
              )}
              <p className="text-xs text-gray-700 mt-2">
                Applied: {formatDate(org.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleApprove(org.id)}
                disabled={approving[org.id]}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {approving[org.id] ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
              <button
                onClick={() => handleReject(org.id)}
                disabled={approving[org.id]}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {approving[org.id] ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Reject
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
