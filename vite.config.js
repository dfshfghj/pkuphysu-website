import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const target = process.env.VITE_PROXY_TARGET || "http://localhost:5200";
const certPath = path.resolve(__dirname, "./cert.pem");
const keyPath = path.resolve(__dirname, "./key.pem");

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          resolveIcons: true,
          importStyle: "css",
        }),
      ],
      dirs: ["src/components"],
      extensions: ["vue"],
      dts: "src/components.d.ts",
    }),
  ],
  server: {
    proxy: {
      "/api/v2": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, ""),
      },
      "/api": {
        target: target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
  },
  build: {
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 20480,
      },
    },
  },
});
