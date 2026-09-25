import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/content/landing";

// Only "/" is public (/about, /services and /contact redirect into it).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: COMPANY.siteUrl, changeFrequency: "monthly", priority: 1 }];
}
