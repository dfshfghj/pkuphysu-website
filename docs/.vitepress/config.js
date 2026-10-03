import { defineConfig } from "vitepress";

export default defineConfig({
  title: "PKUPhySU",
  description: "Just playing around.",
  base: "/docs/",
  lang: "zh-CN",

  themeConfig: {
    outline: [2, 3],
    nav: [
      { text: "主页", link: "/" },
      { text: "API文档", link: "/api" },
      { text: "前端约定", link: "/frontend" },
      { text: "后端约定", link: "/backend" },
    ],
  },
});
