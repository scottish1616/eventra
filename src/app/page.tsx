"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Calendar, Ticket,
  ChevronRight, Bell, User, Menu, X,
  ArrowRight, Zap, Shield, Clock
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  slug: string;
  venue: string | null;
  ticketTypes: { price: number }[];
}

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));

    // Load hero background from site assets
    fetch("/api/site-assets/hero_background")
      .then((r) => r.json())
      .then((d) => { if (d.imageUrl) setHeroImageUrl(d.imageUrl); })
      .catch(() => {}); // silently fall back to gradient
  }, []);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short", year: "numeric",
    });

  const minPrice = (ticketTypes: { price: number }[]) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const handleTicketLookup = () => {
    if (ticketNumber.trim()) {
      router.push(`/ticket/lookup?number=${ticketNumber.trim()}`);
    }
  };



  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight">
                <span className="text-white">EVENTRA</span>
              </span>
            </Link>

            {/* Desktop nav */}
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
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-3">
              <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
              </button>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                Sign up
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-white/10 px-4 py-4 space-y-2">
            {[
              { label: "Home", href: "/" },
              { label: "Events", href: "/events" },
              { label: "Categories", href: "/categories" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <Link href="/auth/login" className="flex-1 text-center py-2.5 text-sm font-semibold border border-white/10 rounded-xl text-gray-300">
                Sign in
              </Link>
              <Link href="/auth/register" className="flex-1 text-center py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white">
                Sign up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Background */}
        <div className="absolute inset-0">
          {/* Background image (dynamic) or fallback gradient */}
          {heroImageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroImageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-purple-950/30 to-gray-950" />
          )}
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/60 to-gray-950" />
          {/* Ambient glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Floating ticket decorations */}
        <div className="absolute top-32 right-20 hidden lg:block animate-bounce" style={{ animationDuration: "3s" }}>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl rotate-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">TICKET</p>
                <p className="text-xs text-gray-400">*** *** ***</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-40 left-20 hidden lg:block animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl -rotate-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">TICKET</p>
                <p className="text-xs text-gray-400">*** *** ***</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            Kenya&apos;s #1 Event Ticketing Platform
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 leading-none tracking-tight">
            <span className="block text-white">EVENTRA</span>
            <span className="block">
              <em className="not-italic font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 italic">
                ***tickets***
              </em>
            </span>
          </h1>

          {/* Caption */}
          <p className="text-lg md:text-2xl text-gray-300 mb-4 font-medium max-w-3xl mx-auto leading-relaxed">
            &apos;EVENTRA: Elevating your ticket experience,
            <br />
            <span className="text-white font-bold">one epic moment at a time.</span>&apos;
          </p>

          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto">
            Buy tickets with M-Pesa. No app needed. No account required to buy.
            Get your QR ticket instantly.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events by name or city..."
                  className="flex-1 text-sm text-white placeholder-gray-500 focus:outline-none bg-transparent"
                />
              </div>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition shadow-lg">
                Search
              </button>
            </div>
          </div>

          {/* Ticket lookup */}
          <div className="max-w-2xl mx-auto flex gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Ticket className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                placeholder="Enter ticket number to view your ticket..."
                className="flex-1 text-sm text-white placeholder-gray-600 focus:outline-none bg-transparent font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleTicketLookup()}
              />
            </div>
            <button
              onClick={handleTicketLookup}
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all border border-white/10"
            >
              View ticket
            </button>
          </div>


        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-white mb-1">
                Upcoming Events
              </h2>
              <p className="text-gray-500 text-sm">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Scrollable events */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse snap-start"
                >
                  <div className="h-44 bg-white/10" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                    <div className="h-8 bg-white/10 rounded-xl" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <Ticket className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400 font-semibold">No events found</p>
                <p className="text-gray-600 text-sm mt-1">Try a different search</p>
              </div>
            ) : (
              filtered.map((event) => (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-72 bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group snap-start"
                >
                  {/* Event image placeholder */}
                  <div className="h-44 bg-gradient-to-br from-purple-900/50 to-blue-900/50 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-5xl">🎉</p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                        LIVE
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-purple-600/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                        {formatCurrency(minPrice(event.ticketTypes))}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-white text-base mb-3 group-hover:text-purple-300 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        {event.location}
                        {event.venue ? ` · ${event.venue}` : ""}
                      </div>
                    </div>
                    <Link
                      href={`/event/${event.slug}/buy`}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold py-3 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40"
                    >
                      BOOK NOW
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Scroll hint */}
          {filtered.length > 3 && (
            <div className="flex justify-center mt-4 gap-1">
              {filtered.slice(0, 5).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? "bg-purple-500" : "bg-white/20"}`} />
              ))}
            </div>
          )}
        </div>
      </section>




      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)"
        }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ready to experience
            <br />
            <em className="not-italic italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              ***tickets***
            </em>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Kenyans who use Eventra for seamless event experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition shadow-2xl shadow-purple-500/30 text-base"
            >
              Browse events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition text-base"
            >
              <User className="w-5 h-5" />
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-white text-lg">EVENTRA</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Elevating your ticket experience, one epic moment at a time.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick links</p>
              <div className="space-y-2">
                {[
                  { label: "Home", href: "/" },
                  { label: "Events", href: "/events" },
                  { label: "Categories", href: "/categories" },
                  { label: "Contact", href: "/contact" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-sm text-gray-600 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <p className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Account</p>
              <div className="space-y-2">
                {[
                  { label: "Sign in", href: "/auth/login" },
                  { label: "Register", href: "/auth/register" },
                  { label: "Find my ticket", href: "/ticket/lookup" },
                  { label: "Submit complaint", href: "/complaints/new" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-sm text-gray-600 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Contact</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">📧 kisakalevi15@gmail.com</p>
                <p className="text-sm text-gray-600">📱 +254 746484946</p>
                <p className="text-sm text-gray-600">📍 Chuka, Kenya</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2026 Eventra Ticketing. Built in Kenya for Kenya.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}