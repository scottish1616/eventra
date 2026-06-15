import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import AnimatedLayout from "@/components/layout/AnimatedLayout";

export const metadata: Metadata = {
  title: { default: "Eventra Ticketing", template: "%s | Eventra" },
  description: "Kenya's modern event ticketing platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased page-bg surface-text">
        <Providers>
          <AnimatedLayout>{children}</AnimatedLayout>
        </Providers>
      </body>
    </html>
  );
}