import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mixim.ax";
  const routes = [
    "",
    "/heroes",
    "/fabled",
    "/equipment",
    "/abilities",
    "/tactics",
    "/hyper-moves",
    "/passives",
    "/drops",
    "/kizuna",
    "/teams",
  ];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
