"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  Ticket, X, ChevronRight, LogOut,
  LayoutDashboard, Calendar, BarChart3,
  Users, MessageSquare, Settings, Plus
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface Props {
  role: "admin" | "organizer";
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userName: string;
  userEmail: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  badges?: Record<string, number>;
}

const adminNav: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "events", label: "Events", icon: Calendar },
  { id: "organizers", label: "Organizers", icon: Users },
  { id: "complaints", label: "Complaints", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

const organizerNav: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "My Events", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "complaints", label: "Attendee Issues", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  role,
  activeTab,
  setActiveTab,
  userName,
  userEmail,
  mobileOpen,
  onMobileClose,
  badges = {},
}: Props) {
  const navItems = role === "admin" ? adminNav : organizerNav;
  const accentColor = role === "admin" ? "from-red-500 to-orange-500" : "from-purple-500 to-blue-500";

  const Content = () => (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${accentColor} flex items-center justify-center shadow-lg`}>
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">Eventra</p>
            <p className="text-xs text-gray-600 mt-0.5 capitalize">{role} panel</p>
          </div>
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick action for organizer */}
      {role === "organizer" && (
        <div className="px-3 pt-4">
          <button
            onClick={() => { setActiveTab("events"); onMobileClose?.(); }}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${accentColor} text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create event
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const badge = badges[item.id];
          return (
            <motion.button
              key={item.id}
              onClick={() => { setActiveTab(item.id); onMobileClose?.(); }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                isActive ? "text-white" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`sidebar-active-${role}`}
                  className={`absolute inset-0 bg-gradient-to-r ${accentColor} opacity-15 rounded-xl border border-white/10`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={`w-4 h-4 relative z-10 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
              <span className="relative z-10 flex-1 text-left">{item.label}</span>
              {badge && badge > 0 ? (
                <span className="relative z-10 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : !isActive ? (
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30 transition-opacity relative z-10" />
              ) : null}
            </motion.button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-white/5 border border-gray-800">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accentColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-56 flex-col min-h-screen sticky top-0 border-r border-gray-800">
        <Content />
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 h-full w-56 z-50 lg:hidden border-r border-gray-800"
            >
              <Content />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}