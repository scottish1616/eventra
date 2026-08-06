import type { NextConfig } from "next";

type ExtendedNextConfig = NextConfig & {
  eslint?: { ignoreDuringBuilds: boolean };
};

const nextConfig: ExtendedNextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;