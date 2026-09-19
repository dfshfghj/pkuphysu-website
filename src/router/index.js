import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
  // {
  //   path: "/",
  //   name: "Home",
  //   component: () => import("../pages/Home.vue"),
  // },
  {
    path: "/redirect",
    name: "Redirect",
    component: () => import("../pages/Redirect.vue"),
  },
  {
    path: "/login",
    name: "Auth",
    component: () => import("../pages/AuthV2.vue"),
    meta: { noHeader: true },
  },
  // {
  //  path: "/random_draw/invest",
  //  name: "EveParty",
  //  component: () => import("../pages/EveParty.vue"),
  //  meta: { login: true },
  // },
  // {
  //   path: "/puzzle",
  //   name: "Puzzle",
  //   component: () => import("../pages/Puzzle.vue"),
  //   meta: { login: true },
  // },
  // {
  //   path: "/doc",
  //   name: "Document",
  //   component: () => import("../pages/Document.vue"),
  // },
  {
    path: "/posts",
    name: "Posts",
    component: () => import("../pages/Posts.vue"),
  },
  {
    path: "/settings-1",
    name: "Settings",
    component: () => import("../pages/Settings.vue"),
    meta: { login: true },
  },
  {
    path: "/",
    name: "BlogCenter",
    component: () => import("../pages/blog-center/BlogCenter.vue"),
    meta: {
      noHeader: true,
      login: true,
    },
    children: [
      {
        path: "/",
        name: "PostsView",
        component: () => import("../pages/blog-center/PostsView.vue"),
        meta: { login: true },
      },
      {
        path: "follow",
        name: "FollowView",
        component: () => import("../pages/blog-center/FollowView.vue"),
        meta: { login: true },
      },
      {
        path: "search",
        name: "SearchView",
        component: () => import("../pages/blog-center/SearchView.vue"),
        meta: { login: true },
      },
      {
        path: ":id",
        name: "CommentsView",
        component: () => import("../pages/blog-center/CommentsView.vue"),
        meta: { login: true },
      },
      {
        path: "messages",
        name: "Messages",
        component: () => import("../pages/blog-center/Messages.vue"),
        meta: { login: true },
      },
      {
        path: "settings",
        name: "SettingsBeta",
        component: () => import("../pages/blog-center/SettingsBeta.vue"),
        meta: { login: true },
      },
      {
        path: "switch",
        name: "SwitchBoard",
        component: () => import("../pages/blog-center/SwitchBoard.vue"),
        meta: { login: true },
      },
    ],
  },
  {
    path: "/treehole",
    name: "Treehole",
    component: () => import("../pages/treehole/Treehole.vue"),
    meta: {
      noHeader: true,
      login: true,
    },
    children: [
      {
        path: "",
        name: "TreeholePostsView",
        component: () => import("../pages/treehole/PostsView.vue"),
        meta: { login: true },
      },
      {
        path: "follow",
        name: "TreeholeFollowView",
        component: () => import("../pages/treehole/FollowView.vue"),
        meta: { login: true },
      },
      {
        path: "search/:query?",
        name: "TreeholeSearchView",
        component: () => import("../pages/treehole/SearchView.vue"),
        meta: { login: true },
      },
      {
        path: ":id",
        name: "TreeholeCommentsView",
        component: () => import("../pages/treehole/CommentsView.vue"),
        meta: { login: true },
      },
    ],
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
    if (result.data.role == 2) {
      return next();
    } else {
      // 可以跳转到无权限页面，或首页，或登录页
      return next("/"); // 或 '/login'
    }
  }
  return next();
});

export default router;
