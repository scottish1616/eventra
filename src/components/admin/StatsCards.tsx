"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, Calendar, Users, Ticket,
  DollarSign, Clock, CheckCircle, ArrowUpRight
} from "lucide-react";
import type { PlatformStats } from "./types";

interface Props {
  stats: PlatformStats;
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-gray-800" />
        <div className="w-16 h-4 bg-gray-800 rounded" />
      </div>
      <div className="w-24 h-7 bg-gray-800 rounded mb-1" />
      <div className="w-20 h-3 bg-gray-800 rounded" />
    </div>
  );
}

export function StatsCards({ stats, loading }: Props) {
  const cards = [
    {
      label: "Total revenue",
      value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`,
      sub: "All time platform revenue",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      glow: "shadow-green-500/20",
      change: "+12%",
    },
    {
      label: "Subscription revenue",
      value: `KES ${(stats.subscriptionRevenue || 0).toLocaleString()}`,
      sub: "From organizer subscriptions",
      icon: DollarSign,
      color: "from-purple-500 to-violet-600",
      glow: "shadow-purple-500/20",
      change: "+8%",
    },
    {
      label: "Total events",
      value: stats.totalEvents || 0,
      sub: `${stats.publishedEvents || 0} published`,
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      glow: "shadow-blue-500/20",
      change: "+5%",
    },
    {
      label: "Total tickets",
      value: (stats.totalTickets || 0).toLocaleString(),
      sub: "Tickets issued",
      icon: Ticket,
      color: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20",
      change: "+18%",
    },
    {
      label: "Active organizers",
      value: stats.activeOrganizers || 0,
      sub: `${stats.pendingOrganizers || 0} pending approval`,
      icon: CheckCircle,
      color: "from-teal-500 to-green-600",
      glow: "shadow-teal-500/20",
      change: "+3",
    },
    {
      label: "Total organizers",
      value: stats.totalOrganizers || 0,
      sub: "Registered on platform",
      icon: Users,
      color: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20",
      change: "+2",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
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
          transition={{ delay: i * 0.05, duration: 0.3 }}
          whileHover={{ y: -2 }}
          className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all shadow-lg ${card.glow}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              {card.change}
            </div>
          </div>
          <p className="text-xl font-bold text-white mb-1">{card.value}</p>
          <p className="text-xs text-gray-500 font-medium">{card.label}</p>
          <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}