import type { NextConfig } from "next";

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
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
