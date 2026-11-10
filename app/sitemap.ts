import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://socialworknigeria.org";

  const staticRoutes = [
    "",
    "/why-teach",
    "/how-it-works",
    "/about-us",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms-of-service",
    "/login",
    "/register",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
