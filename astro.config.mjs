import { defineConfig } from "astro/config";

// GitHub Pages project-site config: served at
// https://luiscova-tech.github.io/az-swim-zones/. If a custom domain is
// added later, change `site` to it and `base` to "/".
export default defineConfig({
  site: "https://luiscova-tech.github.io",
  base: "/az-swim-zones",
  output: "static",
  trailingSlash: "ignore",
});
