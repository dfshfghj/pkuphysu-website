import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const target = process.env.VITE_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          resolveIcons: true,
          importStyle: 'css'
        }),
      ],
      dirs: ["src/components"],
      extensions: ["vue"],
      dts: "src/components.d.ts",
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: target,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  }
});
