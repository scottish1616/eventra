"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, Bell, ChevronDown,
  LogOut, User, X, Check
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { Notification } from "./types";

interface Props {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: string;
  onMobileMenuOpen: () => void;
  notifications?: Notification[];
}

const sampleNotifications: Notification[] = [
  { id: "1", message: "New complaint submitted for Nairobi Tech Summit", type: "complaint", read: false, createdAt: new Date().toISOString() },
  { id: "2", message: "Organizer Jane Wanjiru pending approval", type: "organizer", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", message: "45 tickets sold for Mombasa Music Festival", type: "ticket", read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const typeColors = {
  complaint: "bg-red-500",
  organizer: "bg-purple-500",
  ticket: "bg-green-500",
  event: "bg-blue-500",
};

export function Topbar({ title, subtitle, userName, userRole, onMobileMenuOpen, notifications = sampleNotifications }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [localNotifs, setLocalNotifs] = useState(notifications);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = localNotifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-5 py-3 sticky top-0 z-30">
      <div className="flex items-center gap-3">

        {/* Mobile menu */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-600 truncate hidden sm:block">{subtitle}</p>}
        </div>

        {/* Search */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 overflow-hidden"
            >
              <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none flex-1 min-w-0"
              />
              <button onClick={() => { setSearchOpen(false); setSearchVal(""); }} className="text-gray-600 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-950"
              />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-bold text-white">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                    <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {localNotifs.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">No notifications</p>
                    </div>
                  ) : (
                    localNotifs.map((n) => (
                      <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${!n.read ? "bg-white/[0.02]" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type]} ${n.read ? "opacity-30" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${n.read ? "text-gray-500" : "text-gray-200"}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-700 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-xs text-gray-400 font-medium max-w-[80px] truncate">
              {userName.split(" ")[0]}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-600 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs font-bold text-white">{userName}</p>
                  <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <User className="w-3.5 h-3.5" /> Profile settings
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all mt-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}