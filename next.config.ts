import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The lecturer form uploads a photo (≤5MB) and a research PDF (≤10MB);
      // raise the default 1MB Server Action body cap to fit both + overhead.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
