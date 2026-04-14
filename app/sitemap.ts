import { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/runtime-env";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getAppUrl();
  const now = new Date();

  return [
    {
      url: `${appUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${appUrl}/cigarettes`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/members`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${appUrl}/reviews`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];
}

