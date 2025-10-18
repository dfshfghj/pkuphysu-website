export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("user_token") || null,
    username: localStorage.getItem("user_name") || null,
    isLoggedIn: !!localStorage.getItem("user_token"),
  }),

  actions: {
    login(data) {
      this.token = data.token;
      this.username = data.username;
      this.isLoggedIn = true;

      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user_name", data.username);
    },

    // 退出登录
    logout() {
      this.token = null;
      this.username = null;
      this.isLoggedIn = false;

      localStorage.removeItem("user_token");
      localStorage.removeItem("user_name");
    },

    // 应用启动时尝试恢复登录状态
    restoreSession() {
      const token = localStorage.getItem("user_token");
      const username = localStorage.getItem("user_name");

      if (token && username) {
        this.token = token;
        this.username = username;
        this.isLoggedIn = true;
      }
    },

    // 向后端验证 token 是否仍然有效
    async validateToken() {
      const API_BASE = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE}/api/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (!res.ok) {
        this.logout();
        return {};
      } else {
        const result = await res.json();
        return result;
      }
    },
  },
});
