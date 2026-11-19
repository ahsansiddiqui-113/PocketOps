import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/mdx";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticPaths = [
    "", "/pricing", "/blog",
    "/tools/budget-splitter", "/tools/subscription-leak", "/tools/take-home-pay",
    "/legal/about", "/legal/privacy", "/legal/terms",
  ];
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const })),
    ...getAllPostsMeta().map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.publishedAt })),
  ];
}
