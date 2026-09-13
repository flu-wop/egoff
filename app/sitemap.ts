import type { MetadataRoute } from "next";

const BASE_URL = "https://www.egoffessentials.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
