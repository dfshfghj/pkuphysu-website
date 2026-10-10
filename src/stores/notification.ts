import { defineStore } from "pinia";
import { requestApi } from "@/api/api";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    unreadCount: 0,
  }),
  actions: {
    setUnreadCount(count: number) {
      this.unreadCount = Math.max(0, count);
    },
    async fetchUnreadCount() {
      try {
        const res = await requestApi("/api/v2/notifications/unread-count");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.setUnreadCount(data.data.unread_count ?? 0);
      } catch (error) {
        console.error("Fetch unread count failed:", error);
      }
    },
    async markRead(id: number) {
      try {
        const res = await requestApi(`/api/v2/notifications/${id}/read`, { method: "PUT" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.setUnreadCount(data.data.unread_count ?? 0);
      } catch (error) {
        console.error("Mark notification read failed:", error);
      }
    },
    async markAllRead() {
      try {
        const res = await requestApi("/api/v2/notifications/read-all", { method: "PUT" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.setUnreadCount(0);
      } catch (error) {
        console.error("Mark all notifications read failed:", error);
      }
    },
  },
});
