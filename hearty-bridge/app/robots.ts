import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/content/landing";

// The landing page is the only public page; the app itself sits behind login.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/auth", "/api"],
    },
    sitemap: `${COMPANY.siteUrl}/sitemap.xml`,
  };
}
