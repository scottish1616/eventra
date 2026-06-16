"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Users, Shield, TrendingUp, Lock, Settings, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Eventra Admin</span>
          </div>
          <Link href="/auth/admin-login" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors">
            Admin Portal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block mb-6 px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-full">
              <p className="text-sm font-semibold text-red-300">Administration Dashboard</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Manage Your Event Ecosystem
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Full control over organizers, attendees, payments, and platform settings. Monitor platform health and make data-driven decisions.
            </p>
            <Link href="/auth/admin-login" className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 px-8 py-4 rounded-lg font-bold text-lg transition-all">
              Access Admin Portal <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Administrative Controls</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: Users, title: "Organizer Management", desc: "Approve/reject organizers, manage subscriptions, view performance metrics" },
            { icon: TrendingUp, title: "Analytics & Reporting", desc: "Real-time revenue tracking, transaction history, platform statistics" },
            { icon: BarChart3, title: "Event Oversight", desc: "Monitor all events, verify details, handle complaints and disputes" },
            { icon: Lock, title: "Security & Access", desc: "Manage user roles, permissions, audit logs, and system security" },
            { icon: AlertCircle, title: "Complaints System", desc: "Review and resolve attendee complaints, manage refunds" },
            { icon: Settings, title: "Platform Settings", desc: "Configure fees, payment methods, email templates, system parameters" },
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-red-600/50 transition-colors">
              <feature.icon className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gray-800/30 border-y border-gray-700">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          {[
            { label: "Active Organizers", value: "100+" },
            { label: "Monthly Revenue", value: "KES 5M+" },
            { label: "Transactions", value: "10K+" },
            { label: "Attendees", value: "50K+" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">{stat.value}</div>
              <p className="text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Manage the Platform?</h2>
          <p className="text-gray-400 mb-8">Login to your admin dashboard to access all management tools and analytics.</p>
          <Link href="/auth/admin-login" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold transition-colors">
            Go to Admin Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-8 px-4 text-center text-gray-400 text-sm">
        <p>Eventra Admin Portal | Secure. Powerful. Professional.</p>
      </footer>
    </div>
  );
}
