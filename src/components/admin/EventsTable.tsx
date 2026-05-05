"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, ExternalLink, Filter } from "lucide-react";
import type { Event } from "./types";

interface Props {
  events: Event[];
  loading: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Published", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  DRAFT: { label: "Draft", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  COMPLETED: { label: "Completed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

function EventSkeleton() {
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

export function EventsTable({ events, loading }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search events..."
            className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 w-56"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {["ALL", "PUBLISHED", "DRAFT", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 ml-auto">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Event", "Organizer", "Date", "Status", "Tickets"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => <EventSkeleton key={i} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-gray-400 font-medium text-sm">No events found</p>
                    <p className="text-gray-600 text-xs mt-1">Try a different search or filter</p>
                  </td>
                </tr>
              ) : (
                paginated.map((event, i) => {
                  const sc = statusConfig[event.status] || statusConfig.DRAFT;
                  return (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{event.title}</p>
                            <p className="text-xs text-gray-500">{event.location}</p>
                          </div>
                          <Link
                            href={`/event/${event.slug}/buy`}
                            className="ml-2 text-gray-600 hover:text-purple-400 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {event.organizer?.organizationName ?? event.organizer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.className}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-white">
                        {event._count?.tickets || 0}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}