<template>
  <ScrollPane class="h-screen! flex-1" :distance="400" back-top :refresh="fechNotifications">
    <div class="min-h-lvh bg-card">
      <div class="hidden items-center justify-between pt-6 pr-6 pl-6 sm:flex">
        <h2 class="mt-0 text-xl font-bold sm:font-serif">消息</h2>
        <Button
          v-if="notificationStore.unreadCount > 0"
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          @click="markAllRead"
        >
          全部已读
        </Button>
      </div>
      <ListLoading v-if="loading" />
      <EmptyState v-else-if="notifications.length === 0" description="暂无消息" />
      <template v-else>
        <Item
          variant="outline"
          v-for="notification in notifications"
          :key="notification.id"
          class="m-4"
          :class="[
            canOpen(notification) ? 'cursor-pointer transition-colors hover:bg-accent/50' : '',
            notification.read ? '' : 'bg-muted',
          ]"
          @click="openNotification(notification)"
        >
          <ItemContent>
            <div class="flex items-center justify-between gap-2">
              <ItemTitle class="flex items-center gap-2">
                <span v-if="!notification.read" class="size-2 shrink-0 rounded-full bg-primary" />
                <span>{{ notificationTitle(notification) }}</span>
              </ItemTitle>
              <span class="shrink-0 text-xs text-muted-foreground">
                {{ formatNotificationTime(notification.created_at) }}
              </span>
            </div>
            <ItemDescription v-if="notificationRef(notification)">{{ notificationRef(notification) }}</ItemDescription>
          </ItemContent>
        </Item>
      </template>
    </div>
  </ScrollPane>
</template>
<script setup lang="ts">
import { requestApi } from "@/api/api";
import { formatTime } from "@/utils";
import { canOpenNotification, notificationRef, notificationTitle, type AppNotification } from "@/utils/notification";
import ScrollPane from "@/components/ScrollPane.vue";
import ListLoading from "@/components/ListLoading.vue";
import EmptyState from "@/components/EmptyState.vue";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification";

const router = useRouter();
const notificationStore = useNotificationStore();
const notifications = ref<AppNotification[]>([]);
const loading = ref(false);

const formatNotificationTime = (createdAt: string) => {
  const timestamp = Math.floor(new Date(createdAt).getTime() / 1000);
  if (!Number.isFinite(timestamp)) {
    return "";
  }
  return formatTime(timestamp).relativeTime;
};

const canOpen = canOpenNotification;

const openNotification = async (notification: AppNotification) => {
  if (!notification.read) {
    notification.read = true;
    await notificationStore.markRead(notification.id);
  }
  if (notification.related_post_id) {
    router.push(`/${notification.related_post_id}`);
    return;
  }
  if (notification.related_user_id) {
    router.push({ name: "UserProfile", params: { id: notification.related_user_id } });
  }
};

const markAllRead = async () => {
  await notificationStore.markAllRead();
  notifications.value.forEach((notification) => {
    notification.read = true;
  });
};

const fechNotifications = async () => {
  loading.value = true;
  try {
    const res = await requestApi("/api/v2/notifications");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    notifications.value = data.data.notifications;
    notificationStore.setUnreadCount(data.data.unread_count ?? 0);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fechNotifications();
});
</script>
