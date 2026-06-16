"use client";

import Link from "next/link";
import { ArrowRight, Zap, BarChart3, Smartphone, Users, TrendingUp, QrCode, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function OrganizerLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-purple-900/80 backdrop-blur-md border-b border-purple-700 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Eventra for Organizers</span>
          </div>
          <Link href="/auth/organizer-register" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold transition-colors">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block mb-6 px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-full">
              <p className="text-sm font-semibold text-purple-200">Event Management Platform</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Sell More Tickets, Faster
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Create events, manage attendees, accept M-Pesa payments, and grow your business with Eventra's powerful tools.
            </p>
            <Link href="/auth/organizer-register" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-lg font-bold text-lg transition-all">
              Start Your Free Account <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Powerful Features for Event Organizers</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: Zap, title: "Quick Event Setup", desc: "Create a professional event page in minutes with custom ticket types and pricing" },
            { icon: Smartphone, title: "M-Pesa Integration", desc: "Accept mobile payments directly. Money deposited to your account instantly" },
            { icon: BarChart3, title: "Real-Time Dashboard", desc: "Track sales, revenue, and attendees live as your event grows" },
            { icon: QrCode, title: "Automated QR Tickets", desc: "Every attendee gets a unique scannable QR code ticket after purchase" },
            { icon: Share2, title: "Easy Sharing", desc: "Get shareable links for WhatsApp, Instagram, Facebook, and email" },
            { icon: Users, title: "Attendee Management", desc: "View complete attendee list, contact info, and ticket details" },
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-purple-800/50 border border-purple-700 rounded-2xl p-8 hover:border-purple-500 transition-colors">
              <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-purple-100">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How to Start */}
      <section className="py-20 px-4 bg-purple-800/30 border-y border-purple-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Get Started in 4 Steps</h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Register Account", desc: "Sign up with your details. Your account will be reviewed by our admin team" },
              { step: "2", title: "Get Approved", desc: "Once approved, you'll receive your login credentials via email" },
              { step: "3", title: "Create Your Event", desc: "Add event details, ticket types, pricing, and promotional images" },
              { step: "4", title: "Start Selling", desc: "Share your event link and start accepting payments immediately" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0 shadow-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-purple-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing hint */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-purple-100 mb-8 text-lg">No hidden fees. Just a small commission on each ticket sold.</p>
          <div className="bg-purple-800/50 border border-purple-700 rounded-2xl p-8">
            <div className="text-4xl font-bold text-purple-300 mb-2">8%</div>
            <p className="text-purple-200 mb-6">Commission per ticket sold</p>
            <p className="text-purple-100 text-sm">Plus M-Pesa transaction fees (standard rate)</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Sell More Tickets?</h2>
          <p className="text-purple-100 mb-8 text-lg">Join hundreds of event organizers using Eventra to grow their business.</p>
          <Link href="/auth/organizer-register" className="inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
            Start Your Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-700 py-8 px-4 text-center text-purple-300 text-sm">
        <p>Eventra for Organizers | Professional. Reliable. Empowering.</p>
      </footer>
    </div>
  );
}
