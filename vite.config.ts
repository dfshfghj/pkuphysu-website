// import fs from "fs";
import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from 'vite-plugin-compression';
import vueDevTools from "vite-plugin-vue-devtools";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import tailwindcss from "@tailwindcss/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// const certPath = path.resolve(__dirname, "./cert.pem");
// const keyPath = path.resolve(__dirname, "./key.pem");

export default defineConfig({
  plugins: [
    vue(),
    // viteCompression({
    //   verbose: true,
    //   disable: false,
    //   threshold: 10240,
    //   algorithm: 'brotliCompress',
    //   ext: '.br',
    //   deleteOriginFile: false,
    //   compressionOptions: {
    //     level: 11,
    //   },
    // }),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
      compressionOptions: {
        level: 9,
      },
    }),
    vueDevTools(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
      imports: ["vue", "vue-router", "pinia"],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [
        ElementPlusResolver({
          // resolveIcons: true,
          importStyle: "css",
        }),
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
      dirs: ["src/components"],
      extensions: ["vue"],
      dts: "src/components.d.ts",
    }),
    Icons({
      autoInstall: true,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      "/api/v2": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, ""),
      },
      "/api/dev": {
        target: "http://localhost:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dev/, ""),
      },
    },
    // https: {
    //   key: fs.readFileSync(keyPath),
    //   cert: fs.readFileSync(certPath),
    // },
  },
});
