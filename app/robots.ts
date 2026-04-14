import { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/runtime-env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cigarettes", "/cigarette/", "/members", "/profile/", "/reviews"],
        disallow: ["/admin", "/settings", "/auth", "/api/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}

