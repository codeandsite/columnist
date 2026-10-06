/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
  webpack: (config) => {
    // epubjs pulls in an optional node-only helper; ignore it for the browser bundle
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false, path: false };
    return config;
  },
};

export default nextConfig;
