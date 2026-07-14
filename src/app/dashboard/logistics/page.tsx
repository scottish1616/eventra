"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import {
  Package, Calendar, Users, CheckSquare,
  Clock, MapPin, LogOut, Ticket, BarChart3
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  venue: string | null;
  status: string;
  _count: { tickets: number };
  ticketTypes: { name: string; totalSlots: number; soldCount: number }[];
}

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export default function LogisticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const user = session?.user as SessionUser | undefined;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/events")
        .then((r) => r.json())
        .then((d) => { setEvents(d.data || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit",
    });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal-800 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) > new Date() && e.status === "PUBLISHED"
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Logistics</p>
            <p className="text-xs text-gray-500">{user?.name}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total events", value: events.length, icon: Calendar, color: "from-teal-500 to-blue-600" },
            { label: "Upcoming", value: upcomingEvents.length, icon: Clock, color: "from-purple-500 to-blue-600" },
            { label: "Total tickets", value: events.reduce((s, e) => s + (e._count?.tickets || 0), 0), icon: Ticket, color: "from-green-500 to-teal-600" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-md`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Event planning */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Events list */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Upcoming events
              </h2>
            </div>
            <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
              {upcomingEvents.length === 0 ? (
                <div className="p-10 text-center">
                  <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left px-5 py-4 hover:bg-white/5 transition-colors ${
                      selectedEvent?.id === event.id ? "bg-teal-500/10 border-l-2 border-teal-500" : ""
                    }`}
                  >
                    <p className="font-semibold text-white text-sm">{event.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((event._count?.tickets || 0) /
                                (event.ticketTypes?.reduce(
                                  (s, tt) => s + tt.totalSlots, 0
                                ) || 1)) * 100
                            )}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {event._count?.tickets || 0} tickets
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Event detail */}
          <div>
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
              >
                <div className="h-32 bg-gradient-to-br from-teal-900/50 to-blue-900/50 flex items-center justify-center px-5">
                  <h3 className="text-lg font-black text-white text-center">{selectedEvent.title}</h3>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: "Date", value: formatDate(selectedEvent.date), icon: Calendar },
                    { label: "Time", value: formatTime(selectedEvent.date), icon: Clock },
                    { label: "Location", value: selectedEvent.location, icon: MapPin },
                    { label: "Venue", value: selectedEvent.venue || "TBD", icon: Package },
                    { label: "Attendees", value: `${selectedEvent._count?.tickets || 0} tickets sold`, icon: Users },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                        <row.icon className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{row.label}</p>
                        <p className="text-sm font-semibold text-white">{row.value}</p>
                      </div>
                    </div>
                  ))}

                  {/* Ticket breakdown */}
                  {selectedEvent.ticketTypes && selectedEvent.ticketTypes.length > 0 && (
                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Ticket breakdown
                      </p>
                      <div className="space-y-2">
                        {selectedEvent.ticketTypes.map((tt, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{tt.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-500 rounded-full"
                                  style={{ width: `${(tt.soldCount / tt.totalSlots) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {tt.soldCount}/{tt.totalSlots}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500 font-semibold text-sm">Select an event</p>
                <p className="text-gray-700 text-xs mt-1">Click an event to view logistics details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}