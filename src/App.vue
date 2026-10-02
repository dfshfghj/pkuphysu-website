<script setup lang="ts">
import Header from "./components/layouts/Header.vue";
import { useUserStore } from "./stores/user";
import "@/composables/theme";
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
const userStore = useUserStore();

onMounted(async () => {
  userStore.restoreSession();

  if (userStore.isLoggedIn) {
    await userStore.validateToken();
  }
});
</script>

<template>
  <RouterView />
  <Toaster position="top-center" />
</template>
