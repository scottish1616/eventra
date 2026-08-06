"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ticket, Mail, Phone, MapPin,
  Send, CheckCircle, MessageSquare,
  Clock, ArrowRight
} from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email us",
      value: "admin@eventra.com",
      sub: "We reply within 24 hours",
      color: "from-purple-600 to-blue-600",
      href: "mailto:admin@eventra.com",
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Call us",
      value: "+254 700 000 000",
      sub: "Mon–Fri, 8am–6pm EAT",
      color: "from-green-600 to-teal-600",
      href: "tel:+254700000000",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      label: "Visit us",
      value: "Nairobi, Kenya",
      sub: "Westlands, Nairobi CBD",
      color: "from-orange-600 to-red-600",
      href: "#",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "WhatsApp",
      value: "+254 700 000 000",
      sub: "Chat with us instantly",
      color: "from-teal-600 to-green-600",
      href: "https://wa.me/254700000000",
    },
  ];

  const faqs = [
    {
      q: "How do I buy a ticket?",
      a: "Browse events on our home page, click 'Book Now', enter your name and phone number, and pay with M-Pesa. No account needed.",
    },
    {
      q: "How do I find my ticket?",
      a: "Your ticket appears immediately after payment. You can also find it anytime using your ticket number on our 'Find my ticket' page.",
    },
    {
      q: "How do I become an organizer?",
      a: "Register on our sign up page. After submitting your details, admin will review and approve your organizer account.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept M-Pesa payments. Simply enter your phone number and confirm the STK push to complete your purchase.",
    },
    {
      q: "Can I get a refund?",
      a: "Refund policies depend on the event organizer. Contact the organizer directly or submit a complaint through our platform.",
    },
    {
      q: "How do I contact an organizer?",
      a: "You can submit a complaint or issue through our complaints system on the event page after purchasing a ticket.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-white">EVENTRA</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Home", href: "/" },
                { label: "Events", href: "/events" },
                { label: "Categories", href: "/categories" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    item.href === "/contact"
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-300 border border-white/10 rounded-xl">
                Sign in
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Get in touch
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Have a question? We are here to help. Reach out through any channel below.
            </p>
          </div>

          {/* Contact cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {contactInfo.map((info, i) => (
              <motion.a
                key={info.label}
                href={info.href}
                target={info.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:border-purple-500/30 transition-all group block"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {info.icon}
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{info.label}</p>
                <p className="text-sm font-bold text-white mb-1">{info.value}</p>
                <p className="text-xs text-gray-600">{info.sub}</p>
              </motion.a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact form */}
            <div>
              <h2 className="text-2xl font-black text-white mb-6">Send us a message</h2>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-3xl p-10 text-center"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Message sent!</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    We will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "", type: "general" }); }}
                    className="text-sm text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Send another message →
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Type selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">
                      What is this about?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "general", label: "General" },
                        { id: "organizer", label: "Organizer" },
                        { id: "support", label: "Support" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm({ ...form, type: t.id })}
                          className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            form.type === t.id
                              ? "bg-purple-600 text-white"
                              : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Subject *</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="How can we help?"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us more..."
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-purple-500/20"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {loading ? "Sending..." : "Send message"}
                  </motion.button>
                </form>
              )}
            </div>

            {/* FAQs */}
            <div>
              <h2 className="text-2xl font-black text-white mb-6">
                Frequently asked questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/20 transition-all"
                  >
                    <h3 className="font-bold text-white text-sm mb-2 flex items-start gap-2">
                      <span className="text-purple-400 flex-shrink-0">Q.</span>
                      {faq.q}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed pl-5">
                      {faq.a}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <p className="font-bold text-white text-sm">Support hours</p>
                </div>
                <p className="text-gray-500 text-sm">
                  Monday – Friday: 8:00 AM – 6:00 PM EAT
                  <br />
                  Saturday: 9:00 AM – 2:00 PM EAT
                  <br />
                  Sunday: Closed
                </p>
              </div>

              <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="font-bold text-white text-sm mb-3">
                  Need to submit a complaint?
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  If you have an issue with an event or ticket, use our complaints system for faster resolution.
                </p>
                <Link
                  href="/complaints/new"
                  className="inline-flex items-center gap-2 text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
                >
                  Submit a complaint <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 Eventra Ticketing. Built in Kenya for Kenya.
          </p>
        </div>
      </footer>
    </div>
  );
}