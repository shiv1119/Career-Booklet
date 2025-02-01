import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["127.0.0.1"], // Allow images from local server
  },
};

export default nextConfig;
