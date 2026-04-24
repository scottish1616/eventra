"use client";

import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  Ticket, X, ChevronRight, LogOut,
  LayoutDashboard, Calendar, BarChart3,
  Users, MessageSquare, Settings, Plus,
  Shield
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
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
  onCreateEvent?: () => void;
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
  onCreateEvent,
}: Props) {
  const navItems = role === "admin" ? adminNav : organizerNav;
  const gradient = role === "admin" ? "from-red-500 to-orange-500" : "from-purple-500 to-blue-500";

  const SidebarInner = () => (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">Eventra</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-2.5 h-2.5 text-gray-600" />
              <p className="text-xs text-gray-600 capitalize">{role}</p>
            </div>
          </div>
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="lg:hidden text-gray-600 hover:text-white transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick action */}
      {role === "organizer" && onCreateEvent && (
        <div className="px-3 pt-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { onCreateEvent(); onMobileClose?.(); }}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} text-white text-xs font-semibold py-2.5 rounded-xl shadow-lg`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create event
          </motion.button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const badge = badges[item.id];
          return (
            <motion.button
              key={item.id}
              onClick={() => { setActiveTab(item.id); onMobileClose?.(); }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative group ${
                isActive ? "text-white" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={`active-nav-${role}`}
                  className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-xl border border-white/10`}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <item.icon className={`w-4 h-4 relative z-10 flex-shrink-0`} />
              <span className="relative z-10 flex-1 text-left">{item.label}</span>
              {badge && badge > 0 ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                >
                  {badge > 9 ? "9+" : badge}
                </motion.span>
              ) : !isActive ? (
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30 transition-opacity relative z-10" />
              ) : null}
            </motion.button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-gray-800">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-white/5 border border-gray-800">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer`}
          >
            {userName.charAt(0).toUpperCase()}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-56 flex-col min-h-screen sticky top-0 border-r border-gray-800 flex-shrink-0">
        <SidebarInner />
      </aside>

      {/* Mobile overlay */}
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
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-56 z-50 lg:hidden border-r border-gray-800"
            >
              <SidebarInner />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}