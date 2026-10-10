<template>
  <ScrollPane class="h-screen! flex-1" :distance="400" back-top>
    <div class="min-h-lvh">
      <h2 class="hidden sm:block text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">消息</h2>
      <ListLoading v-if="loading" />
      <EmptyState v-else-if="notifications.length === 0" description="暂无消息" />
      <template v-else>
        <Item
          variant="outline"
          v-for="notification in notifications"
          :key="notification.id"
          class="m-4"
          :class="
            notification.related_post_id || notification.related_user_id
              ? 'cursor-pointer transition-colors hover:bg-accent/50'
              : ''
          "
          @click="openNotification(notification)"
        >
          <ItemContent>
            <div class="flex items-center justify-between gap-2">
              <ItemTitle>{{ notification.title }}</ItemTitle>
              <span class="shrink-0 text-xs text-(--c-secondary)">
                {{ formatNotificationTime(notification.created_at) }}
              </span>
            </div>
            <ItemDescription>{{ notification.content }}</ItemDescription>
          </ItemContent>
        </Item>
      </template>
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import { requestApi } from "@/api/api";
import { formatTime } from "@/utils";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  type: string;
  related_user_id?: number;
  related_post_id?: number;
  related_comment_id?: number;
}

const router = useRouter();
const notifications = ref<Notification[]>([]);
const loading = ref(false);

const formatNotificationTime = (createdAt: string) => {
  const timestamp = Math.floor(new Date(createdAt).getTime() / 1000);
  if (!Number.isFinite(timestamp)) {
    return "";
  }
  return formatTime(timestamp).relativeTime;
};

const openNotification = (notification: Notification) => {
  if (notification.related_post_id) {
    router.push(`/${notification.related_post_id}`);
    return;
  }
  if (notification.related_user_id) {
    router.push({ name: "UserProfile", params: { id: notification.related_user_id } });
  }
};
const fechNotifications = async () => {
  loading.value = true;
  try {
    const res = await requestApi("/api/v2/notifications");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    notifications.value = data.data.notifications;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fechNotifications();
});
</script>
