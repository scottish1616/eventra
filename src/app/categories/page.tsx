"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, ArrowRight, Calendar, MapPin } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  slug: string;
  ticketTypes: { price: number }[];
}

const CATEGORIES = [
  { id: "music", label: "Music & Concerts", emoji: "🎵", description: "Live performances, concerts and music festivals", color: "from-pink-600 to-rose-600" },
  { id: "tech", label: "Tech & Innovation", emoji: "💻", description: "Conferences, hackathons and tech meetups", color: "from-blue-600 to-cyan-600" },
  { id: "food", label: "Food & Drink", emoji: "🍔", description: "Food festivals, tastings and culinary events", color: "from-orange-600 to-amber-600" },
  { id: "sports", label: "Sports & Fitness", emoji: "⚽", description: "Tournaments, marathons and sporting events", color: "from-green-600 to-teal-600" },
  { id: "arts", label: "Arts & Culture", emoji: "🎨", description: "Exhibitions, galleries and cultural events", color: "from-purple-600 to-violet-600" },
  { id: "business", label: "Business & Networking", emoji: "💼", description: "Summits, workshops and networking events", color: "from-gray-600 to-slate-600" },
  { id: "comedy", label: "Comedy & Entertainment", emoji: "😂", description: "Stand-up shows, open mics and entertainment", color: "from-yellow-600 to-orange-600" },
  { id: "fashion", label: "Fashion & Lifestyle", emoji: "👗", description: "Fashion shows, expos and lifestyle events", color: "from-fuchsia-600 to-pink-600" },
  { id: "education", label: "Education & Training", emoji: "📚", description: "Seminars, workshops and training sessions", color: "from-indigo-600 to-blue-600" },
  { id: "startup", label: "Startups & Entrepreneurship", emoji: "🚀", description: "Pitch nights, startup events and investor meetups", color: "from-teal-600 to-green-600" },
  { id: "health", label: "Health & Wellness", emoji: "💪", description: "Wellness events, yoga sessions and health fairs", color: "from-emerald-600 to-teal-600" },
  { id: "nightlife", label: "Nightlife & Parties", emoji: "🎉", description: "Parties, club events and nightlife experiences", color: "from-violet-600 to-purple-600" },
];

export default function CategoriesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.data || []))
      .catch(() => {});
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency", currency: "KES", minimumFractionDigits: 0,
    }).format(n);

  const minPrice = (ticketTypes: { price: number }[]) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return Math.min(...ticketTypes.map((t) => t.price));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      day: "numeric", month: "short",
    });

  const getCategoryEvents = (categoryId: string) =>
    events.filter(
      (e) =>
        e.title.toLowerCase().includes(categoryId) ||
        categoryId === "all"
    );

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
                    item.href === "/categories"
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-300 border border-white/10 rounded-xl transition-all">
                Sign in
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:opacity-90 transition">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Event Categories
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Find events that match your interests. From music to tech, we have something for everyone.
            </p>
          </div>

          {/* Categories grid */}
          {!selectedCategory ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat, i) => {
                const catEvents = getCategoryEvents(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="group bg-white/5 border border-white/10 rounded-3xl p-6 text-left hover:border-purple-500/40 hover:bg-white/8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      {cat.emoji}
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-purple-300 transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">
                        {catEvents.length} event{catEvents.length !== 1 ? "s" : ""}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              {/* Back button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
              >
                ← Back to categories
              </button>

              {(() => {
                const cat = CATEGORIES.find((c) => c.id === selectedCategory);
                const catEvents = getCategoryEvents(selectedCategory);
                return (
                  <>
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat?.color} flex items-center justify-center text-3xl shadow-lg`}>
                        {cat?.emoji}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{cat?.label}</h2>
                        <p className="text-gray-400 text-sm">{catEvents.length} events</p>
                      </div>
                    </div>

                    {catEvents.length === 0 ? (
                      <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                        <p className="text-5xl mb-4">{cat?.emoji}</p>
                        <p className="text-gray-300 font-bold text-xl mb-2">No events yet</p>
                        <p className="text-gray-600 mb-6">Check back soon for {cat?.label} events</p>
                        <Link
                          href="/events"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
                        >
                          Browse all events
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {catEvents.map((event) => (
                          <Link
                            key={event.id}
                            href={`/event/${event.slug}/buy`}
                            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all group"
                          >
                            <div className={`h-36 bg-gradient-to-br ${cat?.color} opacity-60 flex items-center justify-center`}>
                              <span className="text-4xl">{cat?.emoji}</span>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-white text-sm mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                                {event.title}
                              </h3>
                              <div className="space-y-1 mb-3">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(event.date)}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-purple-400">
                                  {formatCurrency(minPrice(event.ticketTypes))}
                                </span>
                                <span className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-semibold">
                                  Book now
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">© 2026 Eventra Ticketing. Built in Kenya for Kenya.</p>
        </div>
      </footer>
    </div>
  );
}