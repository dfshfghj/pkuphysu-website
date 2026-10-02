<script lang="ts" setup>
import { Database, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from "lucide-vue-next";

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <div class="admin-container">
    <nav :class="['admin-nav', isCollapsed ? 'admin-nav--collapsed' : 'admin-nav--expanded']">
      <button type="button" class="nav-item collapse-toggle" @click="toggleSidebar">
        <PanelLeftClose v-if="!isCollapsed" class="size-5" />
        <PanelLeftOpen v-else class="size-5" />
      </button>
      <RouterLink to="/admin/dashboard" class="nav-item" active-class="nav-item--active">
        <LayoutDashboard class="size-5" />
        <span v-if="!isCollapsed">DashBoard</span>
      </RouterLink>
      <RouterLink to="/admin/dba" class="nav-item" active-class="nav-item--active">
        <Database class="size-5" />
        <span v-if="!isCollapsed">数据库管理</span>
      </RouterLink>
    </nav>
    <div :class="['main-content', isCollapsed ? 'main-content--collapsed' : 'main-content--expanded']">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  display: flex;
}

.admin-nav {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  box-sizing: border-box;
  transition: width 0.5s ease;
}

.admin-nav--expanded {
  width: 200px;
}

.admin-nav--collapsed {
  width: 100px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--c-text);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--c-hover);
}

.nav-item--active {
  background: var(--gray-2);
}

.collapse-toggle {
  justify-content: flex-start;
}

.main-content {
  position: relative;
  margin-right: 5%;
  transition: all 0.5s ease;
}

.main-content--expanded {
  width: calc(0.9 * (100vw - 200px));
  margin-left: 200px;
}

.main-content--collapsed {
  width: calc(0.9 * (100vw - 100px));
  margin-left: 100px;
}
</style>
