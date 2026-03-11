import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://scalingflow.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/welcome"],
        disallow: [
          "/api/",
          "/onboarding",
          "/settings",
          "/admin",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
