"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Ticket, ArrowRight, Zap, Shield, Star } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Eventra</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors"
              >
                Organizer sign in
              </Link>
              <Link
                href="/auth/login"
                className="btn-primary text-sm py-2 px-4"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/30">
            <Zap className="w-4 h-4" />
            No account needed to buy tickets
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Your next event
            <br />
            <span className="text-yellow-300">starts here</span>
          </h1>
          <p className="text-purple-100 text-lg mb-10 max-w-2xl mx-auto">
            Find events across Kenya. Pay with M-Pesa. Get your QR ticket instantly. No app, no account needed.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events by name or city..."
                  className="flex-1 text-sm text-gray-900 focus:outline-none bg-transparent"
                  onKeyDown={(e) => e.key === "Enter" && {}}
                />
              </div>
              <button className="btn-primary text-sm py-2.5 px-6 rounded-xl">
                Search
              </button>
            </div>

            {/* Ticket lookup */}
            <div className="mt-4 flex gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Ticket className="w-4 h-4 text-white/70 flex-shrink-0" />
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                  placeholder="Enter ticket number to view your ticket..."
                  className="flex-1 text-sm text-white placeholder-white/50 focus:outline-none bg-transparent font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleTicketLookup()}
                />
              </div>
              <button
                onClick={handleTicketLookup}
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                View ticket
              </button>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="relative">
          <svg viewBox="0 0 1440 60" className="w-full fill-gray-50" preserveAspectRatio="none">
            <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-12">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "🎟️", value: "KES 0", label: "Setup fee" },
            { icon: "⚡", value: "3 min", label: "To create event" },
            { icon: "📱", value: "M-Pesa", label: "Payments" },
          ].map((s) => (
            <div key={s.label} className="card p-5 text-center shadow-md">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-lg font-bold text-purple-600">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {search ? `Results for "${search}"` : "Upcoming events"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} available
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
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-600 font-semibold text-lg">No events found</p>
            <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
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
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                      Live
                    </span>
                  </div>
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
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl group-hover:shadow-md transition-all">
                      Buy ticket
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why organizers choose Eventra
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Everything you need to run successful events in Kenya
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant setup",
                desc: "Create your event in 3 minutes. Add ticket types, set prices, share your link.",
                color: "from-yellow-400 to-orange-500",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure payments",
                desc: "M-Pesa integration built in. Every ticket has a tamper-proof QR code.",
                color: "from-green-400 to-emerald-600",
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Real-time dashboard",
                desc: "Track sales, revenue, and attendees live from your organizer dashboard.",
                color: "from-purple-500 to-blue-600",
              },
            ].map((f) => (
              <div key={f.title} className="card p-7 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-md`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Simple for organizers. Even simpler for attendees.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="card p-7">
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                For organizers
              </div>
              {[
                { n: "1", t: "Create your account", d: "Admin creates your organizer account" },
                { n: "2", t: "Create your event", d: "Add details, date, location and ticket prices" },
                { n: "3", t: "Share your link", d: "Share on WhatsApp, social media or anywhere" },
                { n: "4", t: "Track and earn", d: "Watch sales and revenue in real time" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 mb-5 last:mb-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.t}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
              <Link href="/auth/login" className="btn-primary mt-6 w-full flex items-center justify-center gap-2 text-sm">
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="card p-7">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                For attendees
              </div>
              {[
                { n: "1", t: "Find your event", d: "Search or follow the organizer link" },
                { n: "2", t: "Pick your ticket", d: "Choose Regular, VIP or VVIP" },
                { n: "3", t: "Enter name and phone", d: "No account needed at all" },
                { n: "4", t: "Pay and get ticket", d: "M-Pesa prompt and instant QR ticket" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4 mb-5 last:mb-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.t}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
              <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-green-700">No account or app needed</p>
                <p className="text-xs text-green-600 mt-0.5">Just open the link and pay with M-Pesa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
            backgroundSize: "30px 30px"
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to sell your first ticket?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-xl mx-auto">
            Join organizers across Kenya running successful events on Eventra.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-purple-900/30 transition-all hover:-translate-y-0.5 text-base"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">Eventra Ticketing</span>
            </div>
            <p className="text-gray-400 text-sm">
              {String(new Date().getFullYear())} Eventra. Built for Kenya.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                Organizer login
              </Link>
              <Link href="/ticket/lookup" className="text-gray-400 hover:text-white text-sm transition-colors">
                Find my ticket
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}