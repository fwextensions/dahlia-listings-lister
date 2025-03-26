import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "media.api.sf.gov",
      "media-housing-prod.dev.sf.gov",
      "media.sf.gov",
      "housing.sfgov.org"
    ],
  },
};

export default nextConfig;
