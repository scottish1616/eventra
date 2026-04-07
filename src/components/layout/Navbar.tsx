"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900"
          >
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              E
            </div>
            Eventra
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Events
            </Link>
            {!session ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700"
                >
                  Get started
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href={dashboardHref}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/account"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  My Tickets
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-red-500 hover:underline"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          <Link
            href="/"
            className="block text-sm text-gray-700 py-2"
            onClick={() => setMenuOpen(false)}
          >
            Events
          </Link>
          {!session ? (
            <>
              <Link
                href="/auth/login"
                className="block text-sm text-gray-700 py-2"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="block text-sm bg-violet-600 text-white px-4 py-2 rounded-lg text-center"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </Link>
            </>
          ) : (
            <>
              <Link
                href={dashboardHref}
                className="block text-sm text-gray-700 py-2"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                className="block text-sm text-gray-700 py-2"
                onClick={() => setMenuOpen(false)}
              >
                My Tickets
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block text-sm text-red-600 py-2 w-full text-left"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
