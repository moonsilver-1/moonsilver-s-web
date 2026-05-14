import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
