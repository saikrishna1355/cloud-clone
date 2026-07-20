import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewareClientMaxBodySize: 10737418240, // 10GB
  },
};

export default nextConfig;
