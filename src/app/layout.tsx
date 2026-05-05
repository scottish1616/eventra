import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: { default: "Eventra Ticketing", template: "%s | Eventra" },
  description: "Kenya's modern event ticketing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-950 text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}