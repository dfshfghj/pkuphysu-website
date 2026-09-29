<template>
  <nav class="bottom-nav flex sm:hidden">
    <button type="button" class="nav-btn" :class="{ 'nav-btn--active': isActive(homeNames) }" @click="emit('home')">
      <IconRiHomeLine width="22" height="22" />
      <span>主页</span>
    </button>
    <button
      type="button"
      class="nav-btn"
      :class="{ 'nav-btn--active': isActive(['SwitchBoard']) }"
      @click="router.push('/switch')"
    >
      <IconRiBook2Line width="22" height="22" />
      <span>板块</span>
    </button>
    <button type="button" class="nav-btn" @click="emit('post')">
      <span class="nav-btn-post">
        <IconRiAddLine width="22" height="22" />
      </span>
      <span>发帖</span>
    </button>
    <button
      type="button"
      class="nav-btn"
      :class="{ 'nav-btn--active': isActive(['Messages']) }"
      @click="router.push('/messages')"
    >
      <IconRiNotification3Line width="22" height="22" />
      <span>通知</span>
    </button>
    <button
      type="button"
      class="nav-btn"
      :class="{ 'nav-btn--active': isActive(['SettingsBeta']) }"
      @click="router.push('/settings')"
    >
      <IconRiSettings3Line width="22" height="22" />
      <span>设置</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps({
  homeNames: {
    type: Array as () => string[],
    default: () => [],
  },
});

const emit = defineEmits(["home", "post"]);

const route = useRoute();
const router = useRouter();

const isActive = (names: string[]) => names.includes(String(route.name));
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-top: 1px solid var(--c-border);
  background-color: color-mix(in srgb, var(--background) 80%, transparent);
  backdrop-filter: blur(8px) saturate(120%);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 6px 0;
  font-size: 11px;
  color: var(--c-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-btn--active {
  color: var(--el-color-primary);
}

.nav-btn-post {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin: -6px 0 -4px;
  border-radius: 9999px;
  color: var(--el-color-white);
  background-color: var(--el-color-primary);
}
</style>
