import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import autoImport from "./.eslintrc-auto-import.js";

export default defineConfig([
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "public/**",
      ".venv/**",
      "**/*.min.js",
      "release/**",
      "tmp/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...autoImport.globals },
    },
  },
  pluginVue.configs["flat/essential"],
  { rules: { "vue/multi-word-component-names": "off" } },
]);
