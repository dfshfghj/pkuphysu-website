<script setup>
import Header from './components/layouts/Header.vue';
import { useUserStore } from "./stores/user";
const userStore = useUserStore();

onMounted(async () => {
  userStore.restoreSession()

  if (userStore.isLoggedIn) {
    await userStore.validateToken()
  }
});
</script>

<template>
  <el-config-provider>
    <Header />
    <div class="main-container">
      <div w="full" py="4">
        <RouterView />
      </div>
    </div>
  </el-config-provider>
</template>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  min-height: calc(100vh - var(--el-menu-item-height) - 4px);
}
</style>