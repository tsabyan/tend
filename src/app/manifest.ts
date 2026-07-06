import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tend",
    short_name: "Tend",
    description: "Goals, habits and tasks — one calm place.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFAF7",
    theme_color: "#FBFAF7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
