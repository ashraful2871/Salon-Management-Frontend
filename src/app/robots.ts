import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Signed-in areas stay out of search (they also send X-Robots-Tag: noindex). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/my-profile"] },
    host: SITE.url,
  };
}
