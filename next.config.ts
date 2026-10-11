import type { NextConfig } from "next";

// Signed-in pages: never framed (clickjacking), never indexed, and no full
// URL sent to other sites in the Referer. Not `same-origin`: OpenStreetMap's
// tile servers answer 403 "Access blocked" to tile requests with no Referer,
// and the policy sticks to the tab after client-side navigation to public pages.
const PRIVATE_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  images: {
    // Only these hosts go through the optimizer; SafeImage loads any other
    // pasted URL unoptimized. Keep in step with OPTIMIZED_HOSTS there.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/dashboard/:path*", headers: PRIVATE_HEADERS },
      { source: "/my-profile", headers: PRIVATE_HEADERS },
    ];
  },
};

export default nextConfig;
