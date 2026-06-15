"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Calendar,
  Ticket,
  ArrowRight,
  X,
  Menu,
  Info,
  ChevronRight,
  Star,
} from "lucide-react";
import GlassHero from "@/components/ui/GlassHero";
import ProfessionalEventCard from "@/components/events/ProfessionalEventCard";
import EventPreviewModal from "@/components/events/EventPreviewModal";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  slug: string;
  ticketTypes: { price: number }[];
  coverImage?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketNumber, setTicketNumber] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"events" | "about">("events");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const minPrice = (ticketTypes: { price: number }[]) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleTicketLookup = () => {
    if (ticketNumber.trim()) {
      router.push(`/ticket/lookup?number=${ticketNumber.trim()}`);
    }
  };

  const navItems = [
    { id: "events", label: "Browse Events", icon: Calendar },
    { id: "about", label: "About Eventra", icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-100`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Eventra</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Kenya's event ticketing platform
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider px-3 mb-3">
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id as typeof activeSection);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {activeSection !== item.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              )}
            </button>
          ))}
        </nav>

        {/* Ticket lookup in sidebar */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Find your ticket
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="Ticket number..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleTicketLookup()}
            />
            <button
              onClick={handleTicketLookup}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Find
            </button>
          </div>
        </div>

        {/* Portal & Auth Links */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            href="/landing/organizer"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-purple-600 bg-purple-50 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
          >
            For Organizers
          </Link>
          <Link
            href="/landing/attendee"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-blue-600 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            For Attendees
          </Link>
          <Link
            href="/landing/admin"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-red-600 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            Admin Portal
          </Link>
          <Link
            href="/complaints"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Report an issue
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navbar (mobile) */}
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30 lg:hidden">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-purple-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Eventra</span>
            </div>
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-purple-600"
            >
              Sign in
            </Link>
          </div>
        </nav>

        {/* Browse Events section */}
        {activeSection === "events" && (
          <div className="flex-1">
            {/* Hero */}
            <div>
              <React.Suspense fallback={
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 py-16 px-6">
                  <div className="relative max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">Find your next event</h1>
                    <p className="text-purple-100 mb-8">Browse events across Kenya. Pay with M-Pesa. No account needed.</p>
                  </div>
                </div>
              }>
                <GlassHero search={search} setSearch={setSearch} />
              </React.Suspense>

              <div className="mt-8 rounded-3xl border border-purple-100 bg-white/90 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">
                      Choose your path
                    </p>
                    <p className="mt-2 text-gray-600 max-w-2xl">
                      Explore the right portal for your role: admin management, event creation, or ticket booking.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Link
                      href="/landing/admin"
                      className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                    >
                      Admin portal
                    </Link>
                    <Link
                      href="/landing/organizer"
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                      Organizer signup
                    </Link>
                    <Link
                      href="/landing/attendee"
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-cyan-700 transition-colors"
                    >
                      Attendee deals
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Events grid */}
            <div className="max-w-6xl mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {search ? `Results for "${search}"` : "Upcoming events"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {filtered.length} event{filtered.length !== 1 ? "s" : ""}{" "}
                    found
                  </p>
                </div>
              </div>

              {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card p-6 animate-pulse">
                        <div className="h-40 bg-gray-800 rounded-xl mb-4" />
                        <div className="h-4 bg-gray-800 rounded mb-2" />
                        <div className="h-3 bg-gray-800 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
              ) : filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-gray-600 font-semibold">No events found</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Try a different search
                  </p>
                </div>
              ) : (
                <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((event, index) => (
                    <ProfessionalEventCard
                      key={event.id}
                      event={event}
                      index={index}
                      onPreview={() => {
                        setPreviewEvent(event);
                        setPreviewOpen(true);
                      }}
                      onClick={() => router.push(`/event/${event.slug}/buy`)}
                    />
                  ))}
                </div>
                <EventPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} event={previewEvent} />
                </>
              )}
            </div>
          </div>
        )}

        {/* About section */}

        {/* About section */}
        {activeSection === "about" && (
          <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                About Eventra
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Kenya's modern event ticketing platform built by Kenyans, for Kenyans. Empowering organizers and connecting attendees.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="card p-8 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                <h2 className="font-bold text-gray-900 text-xl mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  Simplify event ticketing in Kenya. We make it effortless for organizers to create events and collect payments, while attendees can discover and book tickets without friction. Zero complexity. Maximum impact.
                </p>
              </div>

              <div className="card p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                <h2 className="font-bold text-gray-900 text-xl mb-4">Our Vision</h2>
                <p className="text-gray-700 leading-relaxed">
                  Become Kenya's trusted event platform. A place where every event organizer can succeed, and every event attendee finds experiences worth remembering. Built for Kenya's digital-first future.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="card p-8 mb-12 border border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl mb-8">Why We Exist</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: "⚡",
                    title: "Speed",
                    desc: "Create events in minutes, not days. Sell tickets instantly.",
                  },
                  {
                    icon: "🤝",
                    title: "Simplicity",
                    desc: "Zero complexity. Intuitive interface. No learning curve.",
                  },
                  {
                    icon: "🇰🇪",
                    title: "Built for Kenya",
                    desc: "M-Pesa first. Works on any phone. Offline friendly.",
                  },
                  {
                    icon: "💪",
                    title: "Empowerment",
                    desc: "Tools that help organizers grow their business.",
                  },
                  {
                    icon: "📊",
                    title: "Transparency",
                    desc: "Real-time analytics. No hidden fees. Complete control.",
                  },
                  {
                    icon: "🛡️",
                    title: "Security",
                    desc: "QR verification. Safe payments. Data protection.",
                  },
                ].map((value, i) => (
                  <div key={i} className="text-center p-4">
                    <div className="text-4xl mb-3">{value.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Features Section */}
            <div className="card p-8 bg-gray-50 border border-gray-200 mb-12">
              <h2 className="font-bold text-gray-900 text-xl mb-6">What Makes Eventra Different</h2>
              <div className="space-y-4">
                {[
                  {
                    title: "✓ No Account Required",
                    desc: "Attendees can buy tickets in seconds without creating an account. Just name + phone number.",
                  },
                  {
                    title: "✓ M-Pesa Integration",
                    desc: "First platform in Kenya with native M-Pesa integration. Direct to organizer account.",
                  },
                  {
                    title: "✓ QR Verification",
                    desc: "Tamper-proof QR tickets. Instant verification at the gate. No fraud.",
                  },
                  {
                    title: "✓ Real-Time Analytics",
                    desc: "Live dashboards for organizers. Track sales, attendees, revenue instantly.",
                  },
                  {
                    title: "✓ Organizer Support",
                    desc: "Dedicated support team. Guidance on pricing, promotion, and event management.",
                  },
                  {
                    title: "✓ Scalable Solution",
                    desc: "From intimate workshops to large conferences. Platform grows with you.",
                  },
                ].map((feature, i) => (
                  <div key={i} className="border-l-4 border-purple-600 pl-4">
                    <p className="font-bold text-gray-900">{feature.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { value: "100+", label: "Active Organizers" },
                { value: "50K+", label: "Happy Attendees" },
                { value: "KES 50M+", label: "Tickets Sold" },
                { value: "24/7", label: "Support Available" },
              ].map((stat, i) => (
                <div key={i} className="card p-6 text-center bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stat.value}</div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Contact section */}
            <div className="card p-8 border border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl mb-6">Get In Touch</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Support & Inquiries</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="text-xs text-gray-700 font-medium">Email</p>
                        <a
                          href="mailto:kisakalevi15@gmail.com"
                          className="text-sm font-semibold text-purple-600 hover:underline"
                        >
                          kisakalevi15@gmail.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📱</span>
                      <div>
                        <p className="text-xs text-gray-700 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">+254 746484946</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Organizer Registration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Want to start selling tickets? We offer comprehensive support for new organizers.
                  </p>
                  <Link
                    href="/auth/organizer-register"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Register as Organizer <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 py-8 px-6 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Eventra Ticketing</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {String(new Date().getFullYear())} Eventra. Built for Kenya.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/auth/login"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  Organizer login
                </Link>
                <Link
                  href="/ticket/lookup"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  Find my ticket
                </Link>
              </div>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="https://www.facebook.com/profile.php?id=61577863482658"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/levikisaka?igsh=MXF0Y3R5aTluY2w5NQ=="
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@leviekisaka"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-500 hover:text-white text-xs font-medium transition-colors"
                >
                  TikTok
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
