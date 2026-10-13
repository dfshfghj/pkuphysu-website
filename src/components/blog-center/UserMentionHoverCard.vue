<template>
  <HoverCard :open="open" :close-delay="0" @update:open="open = $event">
    <HoverCardExternalTrigger ref="externalTriggerRef" />
    <HoverCardContent :reference="reference" class="w-60">
      <div class="flex items-center gap-3">
        <UserAvatar :userid="String(userId ?? '')" :size="50" />
        <span class="min-w-0 flex-1 truncate font-bold">{{ username }}</span>
      </div>
      <div class="mt-3 flex items-center border-t border-(--border) pt-2 text-center">
        <div class="flex flex-1 flex-col">
          <span class="font-bold">{{ stats?.post_count ?? "-" }}</span>
          <span class="text-xs text-muted-foreground">帖子</span>
        </div>
        <div class="flex flex-1 flex-col">
          <span class="font-bold">{{ stats?.comment_count ?? "-" }}</span>
          <span class="text-xs text-muted-foreground">评论</span>
        </div>
        <div class="flex flex-1 flex-col">
          <span class="font-bold">{{ stats?.likes_received ?? "-" }}</span>
          <span class="text-xs text-muted-foreground">获赞</span>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</template>

<script setup lang="ts">
import { requestApi } from "@/api/api";
import UserAvatar from "@/components/UserAvatar.vue";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import HoverCardExternalTrigger from "@/components/ui/hover-card/HoverCardExternalTrigger.vue";

interface UserStats {
  post_count: number;
  comment_count: number;
  likes_received: number;
}

const statsCache = new Map<number, UserStats>();

const open = ref(false);
const reference = ref<HTMLElement | null>(null);
const externalTriggerRef = ref<InstanceType<typeof HoverCardExternalTrigger> | null>(null);
const userId = ref<number | null>(null);
const username = ref("");
const stats = ref<UserStats | null>(null);
let currentId: number | null = null;

const loadStats = async (id: number) => {
  const cached = statsCache.get(id);
  if (cached) {
    if (currentId === id) stats.value = cached;
    return;
  }

  try {
    const res = await requestApi(`/api/v2/users/${id}/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    const data = result?.data as UserStats | undefined;
    if (data) {
      statsCache.set(id, data);
      if (currentId === id) stats.value = data;
    }
  } catch (error) {
    console.error("Load mention user stats failed:", error);
  }
};

const show = (link: HTMLAnchorElement) => {
  const id = Number(link.dataset.mention);
  if (!Number.isFinite(id)) {
    return;
  }

  externalTriggerRef.value?.setTriggerElement(link);
  reference.value = link;
  currentId = id;
  userId.value = id;
  username.value = (link.textContent ?? "").replace(/^@/, "").trim();
  stats.value = statsCache.get(id) ?? null;
  open.value = true;

  if (!stats.value) {
    loadStats(id);
  }
};

onBeforeUnmount(() => externalTriggerRef.value?.setTriggerElement(null));

defineExpose({ show });
</script>
