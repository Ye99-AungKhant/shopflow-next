import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShopFlow",
    short_name: "ShopFlow",
    description:
      "AI-powered order entry and management system for online shops.",
    start_url: "/",
    display: "standalone",
    theme_color: "#ffffff", // Change this to your app's background color
    background_color: "#ffffff",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
