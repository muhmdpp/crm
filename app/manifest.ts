import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Watermelon CRM",
    short_name: "Watermelon",
    description: "Client work tracking and invoicing for creative agencies",
    start_url: "/admin",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#4f46e5",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
