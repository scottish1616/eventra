import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_ROUTES: Record<string, string> = {
  OVERSEER: "/dashboard/overseer",
  ADMIN: "/dashboard/admin",
  ORGANIZER: "/dashboard/organizer",
  STAFF_GATEKEEPER: "/dashboard/gatekeeper",
  STAFF_LOGISTICS: "/dashboard/logistics",
  CUSTOMER: "/dashboard/customer",
  USER: "/dashboard/customer",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as {
    role?: string;
    subscriptionStatus?: string;
  } | undefined;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuth = pathname.startsWith("/auth");

  if (isDashboard && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isDashboard && user?.role) {
    const allowedPath = ROLE_ROUTES[user.role];

    if (allowedPath && !pathname.startsWith(allowedPath)) {
      return NextResponse.redirect(new URL(allowedPath, req.url));
    }
  }

  if (isAuth && req.auth && user?.role) {
    const destination = ROLE_ROUTES[user.role] || "/";
    if (pathname === "/auth/login" || pathname === "/auth/admin-login") {
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
