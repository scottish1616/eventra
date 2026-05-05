"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Calendar, Ticket, ArrowRight,
  X, Menu, Zap, Shield, BarChart3, Users,
  Info, ChevronRight, Star
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  slug: string;
  ticketTypes: { price: number }[];
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketNumber, setTicketNumber] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"events" | "organizer" | "attendee" | "about">("events");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const minPrice = (ticketTypes: { price: number }[]) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(amount);

  const handleTicketLookup = () => {
    if (ticketNumber.trim()) {
      router.push(`/ticket/lookup?number=${ticketNumber.trim()}`);
    }
  };

  const navItems = [
    { id: "events", label: "Browse Events", icon: Calendar },
    { id: "organizer", label: "For Organizers", icon: BarChart3 },
    { id: "attendee", label: "For Attendees", icon: Users },
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
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-100`}>

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
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Kenya's event ticketing platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Navigation
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id as typeof activeSection); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {activeSection !== item.id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
            </button>
          ))}
        </nav>

        {/* Ticket lookup in sidebar */}
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Find your ticket
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
              placeholder="Ticket number..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
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

        {/* Organizer login */}
<div className="p-4 border-t border-gray-100 space-y-2">
  <Link
    href="/auth/login"
    className="w-full btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
  >
    Organizer sign in <ArrowRight className="w-4 h-4" />
  </Link>
  <Link
    href="/auth/admin-login"
    className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-1"
  >
    Admin portal →
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
            <Link href="/auth/login" className="text-xs font-semibold text-purple-600">
              Sign in
            </Link>
          </div>
        </nav>

        {/* Browse Events section */}
        {activeSection === "events" && (
          <div className="flex-1">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 py-16 px-6">
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
                  backgroundSize: "40px 40px"
                }}
              />
              <div className="relative max-w-3xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                  Find your next event
                </h1>
                <p className="text-purple-100 mb-8">
                  Browse events across Kenya. Pay with M-Pesa. No account needed.
                </p>
                <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl max-w-xl mx-auto">
                  <div className="flex-1 flex items-center gap-3 px-3">
                    <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search events by name or city..."
                      className="flex-1 text-sm text-gray-900 focus:outline-none bg-transparent"
                    />
                  </div>
                  <button className="btn-primary text-sm py-2.5 px-6 rounded-xl">
                    Search
                  </button>
                </div>
              </div>
              <svg viewBox="0 0 1440 60" className="absolute bottom-0 left-0 w-full fill-gray-50">
                <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" />
              </svg>
            </div>

            {/* Events grid */}
            <div className="max-w-6xl mx-auto px-4 py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {search ? `Results for "${search}"` : "Upcoming events"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-6 animate-pulse">
                      <div className="h-40 bg-gray-100 rounded-xl mb-4" />
                      <div className="h-4 bg-gray-100 rounded mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <p className="text-5xl mb-4">🔍</p>
                  <p className="text-gray-600 font-semibold">No events found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((event) => (
                    <Link
                      key={event.id}
                      href={`/event/${event.slug}/buy`}
                      className="card overflow-hidden hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className="h-44 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
                            backgroundSize: "20px 20px"
                          }}
                        />
                        <p className="text-5xl relative z-10">🎉</p>
                        <span className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                          Live
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-base mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            {event.location}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-400">From</p>
                            <p className="text-base font-bold text-purple-600">
                              {formatCurrency(minPrice(event.ticketTypes))}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                            Buy ticket
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* For Organizers section */}
        {activeSection === "organizer" && (
          <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">For Organizers</h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Create events, sell tickets, manage attendees — all from one powerful dashboard.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                { icon: "🎪", title: "Create events", desc: "Set up your event in minutes with custom ticket types, pricing, and slot limits." },
                { icon: "📱", title: "M-Pesa payments", desc: "Accept M-Pesa payments directly. Money goes straight to your account." },
                { icon: "📊", title: "Live dashboard", desc: "Track ticket sales, revenue, and attendees in real-time." },
                { icon: "🔗", title: "Shareable links", desc: "Get a unique event link to share on WhatsApp, Instagram and more." },
                { icon: "🎟️", title: "QR tickets", desc: "Every attendee gets a unique QR-coded ticket automatically after payment." },
                { icon: "👥", title: "Manage attendees", desc: "View attendee list, ticket types purchased and contact information." },
              ].map((f) => (
                <div key={f.title} className="card p-6 hover:shadow-md transition-shadow flex gap-4">
                  <div className="text-3xl flex-shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscription info */}
            <div className="card p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100 mb-8">
              <h2 className="font-bold text-gray-900 text-xl mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                How to get started as an organizer
              </h2>
              <div className="space-y-4">
                {[
                  { n: "1", t: "Contact admin", d: "Reach out to the Eventra admin to create your organizer account." },
                  { n: "2", t: "Subscribe", d: "Choose a subscription plan. Admin approves your account once payment is confirmed." },
                  { n: "3", t: "Get credentials", d: "Receive your login email and temporary password from admin." },
                  { n: "4", t: "Start selling", d: "Log in, create your first event and start selling tickets immediately." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-md">
                      {s.n}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.t}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
                Organizer sign in <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-400 mt-3">
                Need an account? Contact{" "}
                <a href="mailto:admin@eventra.app" className="text-purple-600 hover:underline">
                  admin@eventra.app
                </a>
              </p>
            </div>
          </div>
        )}

        {/* For Attendees section */}
        {activeSection === "attendee" && (
          <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">For Attendees</h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Buy tickets instantly with M-Pesa. No account needed. No app required.
              </p>
            </div>

            {/* Steps */}
            <div className="card p-8 mb-8">
              <h2 className="font-bold text-gray-900 text-xl mb-6">How to buy a ticket</h2>
              <div className="space-y-6">
                {[
                  {
                    n: "1", icon: "🔍",
                    t: "Find your event",
                    d: "Search for events on this page or follow a link shared by the organizer on WhatsApp or social media.",
                  },
                  {
                    n: "2", icon: "🎟️",
                    t: "Select your ticket",
                    d: "Choose from Regular, VIP or VVIP. Pick how many tickets you need.",
                  },
                  {
                    n: "3", icon: "📝",
                    t: "Enter your details",
                    d: "Just your name and M-Pesa phone number. No account, no email, no password needed.",
                  },
                  {
                    n: "4", icon: "📱",
                    t: "Pay with M-Pesa",
                    d: "You will receive an M-Pesa STK push on your phone. Enter your PIN to confirm.",
                  },
                  {
                    n: "5", icon: "✅",
                    t: "Get your QR ticket",
                    d: "Your ticket appears instantly on screen. Screenshot it or save the link.",
                  },
                ].map((s) => (
                  <div key={s.n} className="flex gap-5">
                    <div className="flex-shrink-0 text-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                        {s.n}
                      </div>
                    </div>
                    <div className="flex-1 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{s.icon}</span>
                        <p className="font-bold text-gray-900">{s.t}</p>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Find ticket */}
            <div className="card p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 mb-8">
              <h2 className="font-bold text-gray-900 text-lg mb-2">Already have a ticket?</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter your ticket number to view your QR code anytime.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. NAI-2025-123456"
                  className="input-field flex-1 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleTicketLookup()}
                />
                <button
                  onClick={handleTicketLookup}
                  className="btn-primary px-6 whitespace-nowrap"
                  style={{ background: "linear-gradient(to right, #16a34a, #059669)" }}
                >
                  View ticket
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setActiveSection("events")}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
                style={{ background: "linear-gradient(to right, #16a34a, #059669)" }}
              >
                Browse events <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* About section */}
        {activeSection === "about" && (
          <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">About Eventra</h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Kenya's modern event ticketing platform built for organizers and attendees alike.
              </p>
            </div>

            <div className="card p-8 mb-6">
              <h2 className="font-bold text-gray-900 text-xl mb-4">Our mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Eventra was built to solve a simple problem — buying and selling event tickets in Kenya is too complicated. We built a platform where organizers can create events in minutes, share a link, and start collecting M-Pesa payments instantly.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Attendees never need to create an account or download an app. Just open the link, enter your name and phone number, pay with M-Pesa, and your QR ticket is ready. That simple.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: <Zap className="w-6 h-6" />, title: "Fast setup", desc: "Create an event and start selling in under 3 minutes.", color: "from-yellow-400 to-orange-500" },
                { icon: <Shield className="w-6 h-6" />, title: "Secure", desc: "QR-coded tickets with tamper-proof verification.", color: "from-green-400 to-emerald-600" },
                { icon: <Star className="w-6 h-6" />, title: "Built for Kenya", desc: "M-Pesa first. Works on any phone, any network.", color: "from-purple-500 to-blue-600" },
              ].map((f) => (
                <div key={f.title} className="card p-6 text-center hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mx-auto mb-4 shadow-md`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="card p-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100">
              <h2 className="font-bold text-gray-900 text-xl mb-4">Contact us</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <a href="mailto:kisakalevi15@gmail.com" className="text-sm font-semibold text-purple-600 hover:underline">
                      kisakalevi15@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">+254 746484946</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-semibold text-gray-900">Nairobi, Kenya</p>
                  </div>
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
            <p className="text-gray-400 text-sm">
              {String(new Date().getFullYear())} Eventra. Built for Kenya.
            </p>
            <div className="flex gap-4">
              <Link href="/auth/login" className="text-gray-400 hover:text-white text-xs transition-colors">
                Organizer login
              </Link>
              <Link href="/ticket/lookup" className="text-gray-400 hover:text-white text-xs transition-colors">
                Find my ticket
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}