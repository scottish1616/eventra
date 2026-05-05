"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Bell, ChevronDown, Shield, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  title: string;
  subtitle: string;
  userName: string;
  onMobileMenuOpen: () => void;
}

export function AdminTopbar({ title, subtitle, userName, onMobileMenuOpen }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">

        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">{title}</h1>
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>

        {/* Search */}
        <motion.div
          animate={{ width: searchFocused ? 240 : 180 }}
          className="hidden md:flex items-center gap-2 bg-white/5 border border-gray-800 rounded-xl px-3 py-2 hover:border-gray-700 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-xs text-white placeholder-gray-600 focus:outline-none w-full"
          />
        </motion.div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-gray-950" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs font-semibold text-white">{userName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-purple-400" />
                    <p className="text-xs text-purple-400">Super Admin</p>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <User className="w-3.5 h-3.5" /> Profile
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
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