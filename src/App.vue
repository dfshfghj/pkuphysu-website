<script setup lang="ts">
import Header from "./components/layouts/Header.vue";
import { useUserStore } from "./stores/user";
import "@/composables/theme";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
import { useMediaQuery } from "@vueuse/core";
const userStore = useUserStore();
const isMobile = useMediaQuery("(max-width: 600px)");

onMounted(async () => {
  userStore.restoreSession();

  if (userStore.isLoggedIn) {
    await userStore.validateToken();
  }
});
</script>

<template>
  <RouterView />
  <Toaster
    position="top-center"
    :visible-toasts="isMobile ? 1 : 3"
    :duration="isMobile ? 2000 : 4000"
    :mobile-offset="{ left: '12.5vw', right: '12.5vw' }"
  />
</template>
