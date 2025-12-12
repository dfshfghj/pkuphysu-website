<template>
  <el-avatar :size="props.size" :src="userAvatar" @error="onImageError" />
</template>
<script setup>
import { useUserStore } from "../stores/user";
import { minidenticon } from "minidenticons";

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

const userAvatar = ref(
  `${API_BASE}/api/avatars/${props.userid || userStore.userid}`,
);

function onImageError() {
  const svgString = minidenticon(String(props.userid || userStore.userid), 64);
  const svgPath =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
  userAvatar.value = svgPath;
}
</script>
<style scoped>
.el-avatar {
  background: transparent;
  cursor: pointer;
}
</style>
