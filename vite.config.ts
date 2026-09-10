import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    // The site lives at https://ukabuer.github.io/curl-noise-fluid/, so every
    // emitted asset path has to stay relative to index.html.
    base: "./",
    plugins: [
      glsl({
        include: ["**/*.glsl"],
        minify: isProduction,
        warnDuplicatedImports: false,
      }),
    ],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: !isProduction,
    },
  };
});
