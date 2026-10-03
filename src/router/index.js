import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";
import { buildTreeholeSiteUrl } from "../utils/treehole-quote";

const routes = [
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
  {
    path: "/about",
    name: "About",
    component: () => import("../pages/About.vue"),
    meta: { noHeader: true },
  },
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
        path: "u/:id",
        name: "UserProfile",
        component: () => import("../pages/Profile.vue"),
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
    path: "/treehole/:pathMatch(.*)*",
    name: "TreeholeRedirect",
    beforeEnter(to) {
      window.location.replace(buildTreeholeSiteUrl(to.path));
      return false;
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
