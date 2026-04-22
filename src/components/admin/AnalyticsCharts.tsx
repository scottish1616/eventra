"use client";

import { lazy, Suspense } from "react";
import { motion } from "framer-motion";

const {
  ResponsiveContainer, AreaChart, Area,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} = {
  ResponsiveContainer: lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer }))),
  AreaChart: lazy(() => import("recharts").then(m => ({ default: m.AreaChart }))),
  Area: lazy(() => import("recharts").then(m => ({ default: m.Area }))),
  LineChart: lazy(() => import("recharts").then(m => ({ default: m.LineChart }))),
  Line: lazy(() => import("recharts").then(m => ({ default: m.Line }))),
  BarChart: lazy(() => import("recharts").then(m => ({ default: m.BarChart }))),
  Bar: lazy(() => import("recharts").then(m => ({ default: m.Bar }))),
  XAxis: lazy(() => import("recharts").then(m => ({ default: m.XAxis }))),
  YAxis: lazy(() => import("recharts").then(m => ({ default: m.YAxis }))),
  CartesianGrid: lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid }))),
  Tooltip: lazy(() => import("recharts").then(m => ({ default: m.Tooltip }))),
};

const data = [
  { month: "Oct", events: 3, organizers: 2, tickets: 45, revenue: 112500 },
  { month: "Nov", events: 5, organizers: 3, tickets: 89, revenue: 222500 },
  { month: "Dec", events: 8, organizers: 4, tickets: 156, revenue: 390000 },
  { month: "Jan", events: 6, organizers: 5, tickets: 120, revenue: 300000 },
  { month: "Feb", events: 10, organizers: 6, tickets: 230, revenue: 575000 },
  { month: "Mar", events: 14, organizers: 8, tickets: 340, revenue: 850000 },
  { month: "Apr", events: 18, organizers: 10, tickets: 450, revenue: 1125000 },
];

const tooltipStyle = {
  contentStyle: {
    background: "#111827",
    border: "1px solid #1f2937",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#f9fafb",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: "#9ca3af", fontWeight: 600 },
};

const ChartSkeleton = ({ h = 180 }: { h?: number }) => (
  <div className="skeleton rounded-xl" style={{ height: h }} />
);

const axisProps = {
  tick: { fill: "#6b7280", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};

export function AnalyticsCharts() {
  return (
    <div className="grid lg:grid-cols-2 gap-5">

      {/* Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Revenue</h3>
            <p className="text-xs text-gray-600 mt-0.5">Platform earnings (KES)</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revG)" name="Revenue (KES)" />
            </AreaChart>
          </ResponsiveContainer>
        </Suspense>
      </motion.div>

      {/* Events & Tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white">Events & Tickets</h3>
            <p className="text-xs text-gray-600 mt-0.5">Monthly activity</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-purple-500" />Events
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" />Tickets
            </span>
          </div>
        </div>
        <Suspense fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="events" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Events" />
              <Bar dataKey="tickets" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </Suspense>
      </motion.div>

      {/* Organizer growth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5 lg:col-span-2"
      >
        <div className="mb-5">
          <h3 className="text-sm font-bold text-white">Organizer growth</h3>
          <p className="text-xs text-gray-600 mt-0.5">New organizers per month</p>
        </div>
        <Suspense fallback={<ChartSkeleton h={130} />}>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="organizers"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Organizers"
              />
            </LineChart>
          </ResponsiveContainer>
        </Suspense>
      </motion.div>
    </div>
  );
}