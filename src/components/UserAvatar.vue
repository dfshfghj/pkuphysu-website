<template>
  <span
    :style="`height: ${props.size}px; width: ${props.size}px;`"
    class="inline-flex text-center bg-transparent cursor-pointer rounded-full overflow-hidden"
  >
    <img :src="userAvatar" loading="lazy" decoding="async" class="w-full h-full object-cover" />
  </span>
</template>
<script setup lang="ts">
import { useUserStore } from "@/stores/user";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AVATAR_SIZE_BUCKETS = [32, 48, 64, 96, 128, 192, 256];
const userStore = useUserStore();

const props = defineProps({
  userid: {
    type: [String, Number],
    default: "",
  },
  size: {
    type: Number,
    default: 40,
  },
});

const avatarSize = computed(
  () => AVATAR_SIZE_BUCKETS.find((bucket) => bucket >= props.size) ?? AVATAR_SIZE_BUCKETS[AVATAR_SIZE_BUCKETS.length - 1],
);

const userAvatar = computed(
  () => `${API_BASE}/api/v2/user/avatar/${props.userid || userStore.userid}?size=${avatarSize.value}`,
);
</script>
