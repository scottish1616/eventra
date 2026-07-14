"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, MapPin, Calendar, Ticket,
  Filter, SlidersHorizontal, ArrowRight,
  Clock, ChevronDown, X
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  venue: string | null;
  slug: string;
  status: string;
  description: string | null;
  ticketTypes: { price: number; name: string; category: string; totalSlots: number; soldCount: number }[];
  organizer: { name: string; organizationName: string | null } | null;
}

const CATEGORIES = [
  { id: "all", label: "All Events", emoji: "🎪" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "tech", label: "Tech", emoji: "💻" },
  { id: "food", label: "Food & Drink", emoji: "🍔" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "arts", label: "Arts", emoji: "🎨" },
  { id: "business", label: "Business", emoji: "💼" },
  { id: "comedy", label: "Comedy", emoji: "😂" },
  { id: "fashion", label: "Fashion", emoji: "👗" },
];

const SORT_OPTIONS = [
  { id: "date_asc", label: "Date (Earliest)" },
  { id: "date_desc", label: "Date (Latest)" },
  { id: "price_asc", label: "Price (Lowest)" },
  { id: "price_desc", label: "Price (Highest)" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const minPrice = (ticketTypes: { price: number }[]) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });

  const isUpcoming = (date: string) => new Date(date) > new Date();

  const getAvailability = (ticketTypes: Event["ticketTypes"]) => {
    const total = ticketTypes.reduce((s, tt) => s + tt.totalSlots, 0);
    const sold = ticketTypes.reduce((s, tt) => s + tt.soldCount, 0);
    const available = total - sold;
    const pct = total > 0 ? (sold / total) * 100 : 0;
    return { total, sold, available, pct };
  };

  const filtered = events
    .filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "all" ||
        e.title.toLowerCase().includes(selectedCategory) ||
        (e.description || "").toLowerCase().includes(selectedCategory);

      const price = minPrice(e.ticketTypes);
      const matchMin = priceRange.min === "" || price >= Number(priceRange.min);
      const matchMax = priceRange.max === "" || price <= Number(priceRange.max);

      return matchSearch && matchCategory && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (sortBy === "date_asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "date_desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "price_asc") return minPrice(a.ticketTypes) - minPrice(b.ticketTypes);
      if (sortBy === "price_desc") return minPrice(b.ticketTypes) - minPrice(a.ticketTypes);
      return 0;
    });

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setPriceRange({ min: "", max: "" });
    setSortBy("date_asc");
  };

  const hasActiveFilters =
    search || selectedCategory !== "all" || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
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
                    item.href === "/events"
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-300 border border-white/10 hover:border-white/20 rounded-xl transition-all">
                Sign in
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-16 bg-gradient-to-b from-gray-900 to-gray-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              All Events
            </h1>
            <p className="text-gray-400 text-lg">
              Discover {events.length} events happening across Kenya
            </p>
          </div>

          {/* Main search */}
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, locations..."
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold border transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-white text-purple-600 rounded-full text-xs font-black flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="max-w-2xl mx-auto mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Sort by</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Min price (KES)</label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Max price (KES)</label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="Any"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {search ? `Results for "${search}"` : "All upcoming events"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"}`}
            >
              <div className="grid grid-cols-2 gap-0.5">
                {[1,2,3,4].map((i) => <div key={i} className="w-1.5 h-1.5 bg-current rounded-sm" />)}
              </div>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-600 hover:text-white"}`}
            >
              <div className="space-y-0.5">
                {[1,2,3].map((i) => <div key={i} className="w-5 h-1 bg-current rounded" />)}
              </div>
            </button>
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/10" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/10 rounded" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-8 bg-white/10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Search className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-gray-300 font-bold text-xl mb-2">No events found</p>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => {
              const price = minPrice(event.ticketTypes);
              const availability = getAvailability(event.ticketTypes);
              const upcoming = isUpcoming(event.date);

              return (
                <div
                  key={event.id}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-purple-900/60 to-blue-900/60 relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">
                      🎪
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {!upcoming && (
                        <span className="bg-red-500/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Ended
                        </span>
                      )}
                      {upcoming && availability.pct > 80 && (
                        <span className="bg-red-500/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Almost full
                        </span>
                      )}
                      {upcoming && availability.pct <= 30 && (
                        <span className="bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                        {formatCurrency(price)}
                      </span>
                    </div>

                    {/* Date overlay */}
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10">
                      <p className="text-xs font-bold text-white">{formatDate(event.date)}</p>
                      <p className="text-xs text-gray-300">{formatTime(event.date)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-base mb-2 group-hover:text-purple-300 transition-colors line-clamp-2 flex-1">
                      {event.title}
                    </h3>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{event.location}{event.venue ? ` · ${event.venue}` : ""}</span>
                      </div>
                      {event.organizer && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>By {event.organizer.organizationName || event.organizer.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Availability bar */}
                    {event.ticketTypes.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{availability.available} spots left</span>
                          <span className="text-gray-600">{Math.round(availability.pct)}% sold</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              availability.pct > 80
                                ? "bg-red-500"
                                : availability.pct > 50
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(100, availability.pct)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Ticket types */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {event.ticketTypes.slice(0, 3).map((tt, j) => (
                        <span
                          key={j}
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            tt.category === "VVIP"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : tt.category === "VIP"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {tt.name} · {formatCurrency(tt.price)}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={upcoming ? `/event/${event.slug}/buy` : "#"}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-2xl text-sm transition-all ${
                        upcoming
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {upcoming ? (
                        <>BOOK NOW <ArrowRight className="w-4 h-4" /></>
                      ) : (
                        "Event Ended"
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3">
            {filtered.map((event) => {
              const price = minPrice(event.ticketTypes);
              const upcoming = isUpcoming(event.date);
              return (
                <div
                  key={event.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex items-center gap-5"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-900/60 to-blue-900/60 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    🎪
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{event.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-white">{formatCurrency(price)}</p>
                    <Link
                      href={upcoming ? `/event/${event.slug}/buy` : "#"}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl mt-2 transition-all ${
                        upcoming
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {upcoming ? "Book now" : "Ended"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 Eventra Ticketing. Built in Kenya for Kenya.
          </p>
        </div>
      </footer>
    </div>
  );
}