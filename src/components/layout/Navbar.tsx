"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user as SessionUser;

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "ORGANIZER"
        ? "/dashboard/organizer"
        : "/account";

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass flex items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            E
          </motion.div>
          <Link href="/" className="font-bold text-lg text-white/90 dark:text-white/90 text-gray-900 dark:text-gray-100">Eventra</Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-white/80 dark:text-white/80 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white transition">Events</Link>
          {!session ? (
            <>
              <Link href="/auth/login" className="text-sm text-white/70 dark:text-white/70 text-gray-700 dark:text-gray-400 hover:text-white dark:hover:text-white transition">Sign in</Link>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Get started</Button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href={dashboardHref} className="text-sm text-white/80 dark:text-white/80 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white transition">Dashboard</Link>
              <Link href="/account" className="text-sm text-white/80 dark:text-white/80 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white transition">My Tickets</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-red-400 dark:text-red-400 text-red-600 dark:text-red-400 hover:underline">Sign out</button>
            </div>
          )}
          <ThemeToggle />
        </div>

        <button className="md:hidden p-2 text-white/80 dark:text-white/80 text-gray-700 dark:text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-2 glass p-3 space-y-2">
          <Link href="/" className="block text-sm text-white/90 dark:text-white/90 text-gray-900 dark:text-gray-100 py-2" onClick={() => setMenuOpen(false)}>Events</Link>
          {!session ? (
            <>
              <Link href="/auth/login" className="block text-sm text-white/90 dark:text-white/90 text-gray-900 dark:text-gray-100 py-2" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/auth/register" className="block text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-center" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          ) : (
            <>
              <Link href={dashboardHref} className="block text-sm text-white/90 dark:text-white/90 text-gray-900 dark:text-gray-100 py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/account" className="block text-sm text-white/90 dark:text-white/90 text-gray-900 dark:text-gray-100 py-2" onClick={() => setMenuOpen(false)}>My Tickets</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="block text-sm text-red-400 dark:text-red-400 text-red-600 dark:text-red-400 py-2 w-full text-left">Sign out</button>
            </>
          )}
          <div className="flex justify-center py-2">
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
