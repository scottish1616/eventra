"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, Bell, ChevronDown,
  LogOut, User, X, CheckCheck,
  AlertCircle, Ticket, Calendar, MessageSquare
} from "lucide-react";
import { signOut } from "next-auth/react";

interface Notification {
  id: string;
  message: string;
  type: "complaint" | "ticket" | "event" | "organizer";
  read: boolean;
  time: string;
}

interface Props {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: string;
  onMobileMenuOpen: () => void;
}

const DEMO_NOTIFS: Notification[] = [
  { id: "1", message: "New complaint: Payment issue from James Mwangi", type: "complaint", read: false, time: "2m ago" },
  { id: "2", message: "45 tickets sold for Nairobi Tech Summit", type: "ticket", read: false, time: "15m ago" },
  { id: "3", message: "Organizer Jane Wanjiru is pending approval", type: "organizer", read: false, time: "1h ago" },
  { id: "4", message: "Mombasa Music Festival published successfully", type: "event", read: true, time: "3h ago" },
];

const typeIcon = {
  complaint: MessageSquare,
  ticket: Ticket,
  event: Calendar,
  organizer: User,
};

const typeColor = {
  complaint: "text-red-400 bg-red-500/10",
  ticket: "text-green-400 bg-green-500/10",
  event: "text-blue-400 bg-blue-500/10",
  organizer: "text-purple-400 bg-purple-500/10",
};

export function Topbar({ title, subtitle, userName, userRole, onMobileMenuOpen }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <Menu className="w-4 h-4" />
        </motion.button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-white truncate"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="text-xs text-gray-600 truncate hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Search */}
        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 overflow-hidden"
            >
              <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none flex-1 min-w-0"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSearchOpen(false); setSearchVal(""); }}
                className="text-gray-600 hover:text-white flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Bell className="w-4 h-4" />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-gray-950"
                />
              )}
            </AnimatePresence>
          </motion.button>

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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Notifications</p>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark read
                  </motion.button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.map((n, i) => {
                    const Icon = typeIcon[n.type];
                    const colors = typeColor[n.type];
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? "bg-white/[0.02]" : ""}`}
                        onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${n.read ? "text-gray-500" : "text-gray-200"}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-700 mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0 mt-1.5" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-xs text-gray-400 font-medium max-w-[70px] truncate">
              {userName.split(" ")[0]}
            </span>
            <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            </motion.div>
          </motion.button>

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
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-purple-400" />
                    <p className="text-xs text-purple-400 capitalize">{userRole}</p>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                    <User className="w-3.5 h-3.5" /> Profile settings
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-0.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}