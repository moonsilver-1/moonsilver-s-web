import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/music/:path*",
        destination: "/api/music/:path*",
      },
    ];
  },
};

export default nextConfig;
