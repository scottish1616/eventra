"use client";

import Link from "next/link";
import { ArrowRight, Ticket, MapPin, Smartphone, Heart, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendeeLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-blue-900/80 backdrop-blur-md border-b border-blue-700 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Eventra for Attendees</span>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors">
            Browse Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block mb-6 px-4 py-2 bg-blue-600/20 border border-blue-500/50 rounded-full">
              <p className="text-sm font-semibold text-blue-200">Event Ticketing Made Easy</p>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Find & Book Your Next Experience
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse thousands of events across Kenya. Pay with M-Pesa. No account needed. Get your tickets instantly.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-4 rounded-lg font-bold text-lg transition-all">
              Start Exploring <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Why Choose Eventra?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: MapPin, title: "Browse Events Everywhere", desc: "Discover concerts, conferences, sports, festivals and more across Kenya" },
            { icon: Smartphone, title: "Pay with M-Pesa", desc: "Simple, secure M-Pesa payments. No credit card needed. Instant checkout" },
            { icon: Ticket, title: "Instant Digital Tickets", desc: "Get your QR-coded ticket immediately after payment. Show at gate" },
            { icon: Heart, title: "Save Your Favorites", desc: "Bookmark events and create a personalized wishlist" },
            { icon: Clock, title: "Real-Time Updates", desc: "Get notifications about events, last-minute deals, and reminders" },
            { icon: Shield, title: "Secure & Trusted", desc: "Your data is safe. Verified events and reliable organizers" },
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-blue-800/50 border border-blue-700 rounded-2xl p-8 hover:border-cyan-500 transition-colors">
              <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-blue-100">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How to Book */}
      <section className="py-20 px-4 bg-blue-800/30 border-y border-blue-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">Book Your Ticket in 3 Steps</h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Find Your Event", desc: "Browse our event listings or use search to find what interests you" },
              { step: "2", title: "Select Tickets", desc: "Choose your ticket type and quantity, then proceed to checkout" },
              { step: "3", title: "Pay & Get Tickets", desc: "Complete M-Pesa payment and receive your digital tickets instantly" },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-bold flex items-center justify-center flex-shrink-0 shadow-lg">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-blue-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">What You Can Find</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {["🎵 Music Concerts", "🎭 Theater Shows", "⚽ Sports Events", "🎓 Conferences", "🎪 Festivals", "🎨 Workshops", "🏃 Marathons", "🍽️ Food Events"].map((cat, i) => (
              <div key={i} className="bg-blue-800/50 border border-blue-700 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors">
                <p className="text-lg font-semibold">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-blue-800/30 border-y border-blue-700">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {[
            { value: "50K+", label: "Happy Attendees" },
            { value: "100+", label: "Active Events" },
            { value: "KES 50M+", label: "Tickets Sold" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-cyan-400 mb-2">{stat.value}</div>
              <p className="text-blue-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Discover Your Next Event?</h2>
          <p className="text-blue-100 mb-8 text-lg">Browse thousands of events happening near you right now.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors">
            Browse Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ Hint */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Quick FAQs</h2>
          <div className="space-y-6">
            {[
              { q: "Do I need to create an account?", a: "No! You can book tickets without an account. Just have your M-Pesa ready." },
              { q: "How will I receive my tickets?", a: "Instant digital tickets with QR codes are sent to the phone number used for payment." },
              { q: "Can I transfer my ticket to someone else?", a: "Yes, most tickets can be transferred to another person via the ticket details." },
              { q: "What if I can't attend?", a: "Check the organizer's refund policy. Many allow refunds or exchanges." },
            ].map((faq, i) => (
              <div key={i} className="bg-blue-800/50 border border-blue-700 rounded-xl p-6">
                <p className="font-bold mb-2">{faq.q}</p>
                <p className="text-blue-100">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-700 py-8 px-4 text-center text-blue-300 text-sm">
        <p>Eventra for Attendees | Discover. Book. Enjoy.</p>
      </footer>
    </div>
  );
}
