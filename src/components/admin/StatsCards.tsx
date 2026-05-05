"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Calendar, Users, Ticket, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import type { PlatformStats } from "@/components/shared/types";

interface Props {
  stats: PlatformStats;
  loading: boolean;
}

export function StatsCards({ stats, loading }: Props) {
  const cards = [
    {
      label: "Total revenue",
      value: stats.totalRevenue,
      formatter: (n: number) => `KES ${n.toLocaleString()}`,
      sub: "All time platform",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/15",
      change: "+12%",
    },
    {
      label: "Subscription revenue",
      value: stats.subscriptionRevenue,
      formatter: (n: number) => `KES ${n.toLocaleString()}`,
      sub: "From organizers",
      icon: DollarSign,
      color: "from-purple-500 to-violet-600",
      shadow: "shadow-purple-500/15",
      change: "+8%",
    },
    {
      label: "Total events",
      value: stats.totalEvents,
      sub: `${stats.publishedEvents} published`,
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      shadow: "shadow-blue-500/15",
      change: "+5",
    },
    {
      label: "Tickets issued",
      value: stats.totalTickets,
      sub: "All events",
      icon: Ticket,
      color: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/15",
      change: "+18%",
    },
    {
      label: "Active organizers",
      value: stats.activeOrganizers,
      sub: `${stats.pendingOrganizers} pending`,
      icon: CheckCircle,
      color: "from-teal-500 to-green-500",
      shadow: "shadow-teal-500/15",
      change: "+3",
    },
    {
      label: "Open complaints",
      value: stats.pendingComplaints + stats.escalatedComplaints,
      sub: `${stats.escalatedComplaints} escalated`,
      icon: stats.escalatedComplaints > 0 ? AlertTriangle : Clock,
      color: stats.escalatedComplaints > 0 ? "from-red-500 to-rose-600" : "from-gray-500 to-gray-600",
      shadow: stats.escalatedComplaints > 0 ? "shadow-red-500/15" : "shadow-gray-500/15",
      change: stats.escalatedComplaints > 0 ? `${stats.escalatedComplaints} escalated` : "All clear",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} rows={2} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`card p-5 hover:border-gray-700 transition-all shadow-lg ${card.shadow}`}
        >
          <div className="flex items-center justify-between mb-4">
            <motion.div
              whileHover={{ rotate: 5 }}
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md flex-shrink-0`}
            >
              <card.icon className="w-4 h-4 text-white" />
            </motion.div>
            <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              {card.change}
            </div>
          </div>
          <p className="text-xl font-bold text-white mb-0.5">
            <AnimatedCounter
              value={card.value}
              formatter={card.formatter}
              duration={1000}
            />
          </p>
          <p className="text-xs font-semibold text-gray-400">{card.label}</p>
          <p className="text-xs text-gray-700 mt-0.5">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}