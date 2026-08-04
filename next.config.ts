import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al servidor de desarrollo por IP de red (no solo localhost).
  allowedDevOrigins: [
    "10.0.32.92",
    "10.0.32.63",
    "localhost",
    "127.0.0.1",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/resguardos",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
