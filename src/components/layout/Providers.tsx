"use client";

// import { SessionProvider } from "next-auth/react"; // Temporarily disabled to isolate SIGTERM crash
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  // SessionProvider temporarily removed to isolate silent crash on startup.
  // If the app stays alive without it, NextAuth initialization is the culprit.
  // TODO: Re-enable SessionProvider once the root cause is identified and fixed.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
            borderRadius: "12px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#f9fafb" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#f9fafb" } },
        }}
      />
    </QueryClientProvider>
  );
}