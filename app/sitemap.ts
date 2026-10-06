import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://columnist.site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/books",
    "/categories",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  try {
    const supabase = createClient();
    const [{ data: categories }, { data: books }] = await Promise.all([
      supabase.from("categories").select("slug, updated_at"),
      supabase
        .from("books")
        .select("slug, updated_at")
        .eq("published", true),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = (
      (categories ?? []) as Array<{ slug: string; updated_at: string }>
    ).map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const bookRoutes: MetadataRoute.Sitemap = (
      (books ?? []) as Array<{ slug: string; updated_at: string }>
    ).map((b) => ({
      url: `${base}/books/${b.slug}`,
      lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...categoryRoutes, ...bookRoutes];
  } catch {
    // If Supabase is unreachable at build time, still serve static routes.
    return staticRoutes;
  }
}
