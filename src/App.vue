<script setup>
import Header from "./components/layouts/Header.vue";
import { useUserStore } from "./stores/user";
const userStore = useUserStore();
const route = useRoute();

const scrollbarRef = ref();
const scrollTop = ref(0);
provide("scrollTop", scrollTop);

onMounted(async () => {
  userStore.restoreSession();

  if (userStore.isLoggedIn) {
    await userStore.validateToken();
  }
});
</script>

<template>
  <el-config-provider>
    <el-scrollbar
      ref="scrollbarRef"
      class="main-container"
      @scroll="(e) => (scrollTop = scrollbarRef.wrapRef.scrollTop)"
    >
      <Header v-if="route.name && !route.meta.noHeader" />
      <RouterView />
    </el-scrollbar>
  </el-config-provider>
</template>

<style>
.main-container {
  max-height: 100vh;
  display: contents;
}
</style>
