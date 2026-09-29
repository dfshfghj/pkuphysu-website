<template>
  <span
    :style="`height: ${props.size}px; width: ${props.size}px;`"
    class="inline-flex text-center bg-transparent cursor-pointer rounded-full overflow-hidden"
  >
    <img :src="userAvatar" class="w-full h-full object-cover" />
  </span>
</template>
<script setup lang="ts">
import { useUserStore } from "@/stores/user";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const userStore = useUserStore();

const props = defineProps({
  userid: {
    type: String,
    default: "",
  },
  size: {
    type: Number,
    default: 40,
  },
});

const userAvatar = ref(`${API_BASE}/api/v2/user/avatar/${props.userid || userStore.userid}`);
</script>
