import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../pages/Home.vue"),
  },
  {
    path: "/redirect",
    name: "Redirect",
    component: () => import("../pages/Redirect.vue"),
  },
  {
    path: "/login",
    name: "Auth",
    component: () => import("../pages/Auth.vue"),
    meta: { noHeader: true },
  },
  {
    path: "/random_draw/invest",
    name: "EveParty",
    component: () => import("../pages/EveParty.vue"),
    meta: { login: true },
  },
  {
    path: "/puzzle",
    name: "Puzzle",
    component: () => import("../pages/Puzzle.vue"),
    meta: { login: true },
  },
  {
    path: "/doc",
    name: "Document",
    component: () => import("../pages/Document.vue"),
  },
  {
    path: "/posts",
    name: "Posts",
    component: () => import("../pages/Posts.vue"),
  },
  {
    path: "/settings",
    name: "Profile",
    component: () => import("../pages/Profile.vue"),
    meta: { login: true },
  },
  {
    path: "/new-article",
    name: "WriteArticle",
    component: () => import("../pages/WriteArticle.vue"),
    meta: { login: true },
  },
  {
    path: "/chat/articles",
    name: "ArticleCenter",
    component: () => import("../pages/ArticleCenter.vue"),
    meta: {
      noHeader: true,
      login: true,
    },
  },
  {
    path: "/chat/articles/:id",
    name: "Article",
    component: () => import("../pages/Article.vue"),
    meta: { login: true },
    props: true,
  },
  {
    path: "/chat/blogs",
    name: "BlogCenter",
    component: () => import("../pages/BlogCenter.vue"),
    meta: {
      noHeader: true,
      login: true,
    },
  },
  {
    path: "/admin/random-draw",
    name: "RandomDraw",
    component: () => import("../pages/admin/RandomDraw.vue"),
    meta: {
      noHeader: true,
      admin: true,
    },
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../pages/admin/Admin.vue"),
    meta: { admin: true },
    children: [
      {
        path: "dashboard",
        name: "DashBoard",
        component: () => import("../pages/admin/DashBoard.vue"),
        meta: { admin: true },
      },
      {
        path: "dba",
        name: "AdminDBA",
        component: () => import("../pages/admin/DBA.vue"),
        meta: { admin: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  if (!to.meta.login && !to.meta.admin) {
    return next();
  }

  const result = await userStore.validateToken();

  if (!userStore.isLoggedIn) {
    return next(`/login?redirect=${to.fullPath}`);
  }

  if (to.meta.admin) {
    if (result.user.is_admin) {
      return next();
    } else {
      // 可以跳转到无权限页面，或首页，或登录页
      return next("/"); // 或 '/login'
    }
  }
  return next();
});

export default router;
