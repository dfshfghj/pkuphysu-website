<template>
  <ScrollPane class="h-screen! flex-1" :distance="400" back-top>
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">消息</h2>
      <Item variant="outline" v-for="notification in notifications" class="m-4">
        <ItemContent>
          <ItemTitle>{{ notification.title }}</ItemTitle>
          <ItemDescription>{{ notification.content }}</ItemDescription>
        </ItemContent>
      </Item>
      <div v-if="notifications.length === 0" class="text-center">
        <span class="text-sm"> 暂无更多消息 </span>
      </div>
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import { requestApi } from "@/api/api";
import ScrollPane from "@/components/ScrollPane.vue";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  type: string;
}

const notifications = ref<Notification[]>([]);
const fechNotifications = async () => {
  const res = await requestApi("/api/v2/notifications");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  notifications.value = data.data.notifications;
};

onMounted(() => {
  fechNotifications();
});
</script>
