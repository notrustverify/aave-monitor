import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";

function copyRecursive(src: string, dest: string) {
  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    readdirSync(src).forEach((item) => {
      copyRecursive(resolve(src, item), resolve(dest, item));
    });
  } else {
    copyFileSync(src, dest);
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      writeBundle() {
        const outDir =
          process.env.NODE_ENV === "firefox" ? "firefox_dist" : "dist";

        // Copy manifest.json
        if (process.env.NODE_ENV === "firefox") {
          copyFileSync("manifest_firefox.json", `${outDir}/manifest.json`);
        } else {
          copyFileSync("manifest.json", `${outDir}/manifest.json`);
        }

        // Copy public assets recursively
        const publicAssets = ["icon128.png", "icon16.png", "icon32.png"];
        publicAssets.forEach((asset) => {
          if (existsSync(`public/${asset}`)) {
            copyRecursive(`public/${asset}`, `${outDir}/public/${asset}`);
          }
        });

        // Copy assets directory to the root for CSS/JS references
        if (existsSync("public/assets")) {
          copyRecursive("public/assets", `${outDir}/assets`);
        }
      },
    },
  ],
  build: {
    outDir: process.env.NODE_ENV === "firefox" ? "firefox_dist" : "dist",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "public/index.html"),
        options: resolve(__dirname, "public/options.html"),
        sidepanel: resolve(__dirname, "public/sidepanel.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      external: [],
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "js/background.js";
          }
          return "js/[name].js";
        },
        chunkFileNames: "js/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".html")) {
            return "[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
    copyPublicDir: false, // We handle copying manually
  },
  base: "./", // Use relative paths for Chrome extension
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development"
    ),
  },
});
