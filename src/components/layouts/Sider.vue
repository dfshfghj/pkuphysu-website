<script lang="ts" setup>
import {
  Menu,
  Setting,
  ArrowLeft,
  ArrowRight,
  Tickets,
} from "@element-plus/icons-vue";

const isCollapsed = ref(false);
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
defineExpose({
  isCollapsed,
});

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
  theme: {
    type: String,
    validator: (val) => ["dark", "light"].includes(val),
    default: "dark",
  },
});

const themeClass = computed(() => `sider--${props.theme}`);
</script>

<template>
  <el-menu
    router
    class="el-menu-vertical-demo"
    :collapse="isCollapsed"
    :class="[themeClass, { 'sider--collapsed': collapsed }]"
  >
    <el-menu-item class="collapse-toggle" @click="toggleSidebar">
      <el-icon>
        <ArrowLeft v-if="!isCollapsed" />
        <ArrowRight v-else />
      </el-icon>
    </el-menu-item>
    <el-menu-item index="/admin/dashboard">
      <el-icon>
        <Menu />
      </el-icon>
      <template #title> DashBoard </template>
    </el-menu-item>
    <el-menu-item index="/admin/dba">
      <el-icon>
        <Setting />
      </el-icon>
      <template #title> 数据库管理 </template>
    </el-menu-item>
    <el-sub-menu index="/admin/random-draw">
      <template #title>
        <el-icon>
          <Tickets />
        </el-icon>
        <span>抽奖管理</span>
      </template>
      <el-menu-item
        ><a
          href="/admin/random-draw?event=抽奖&word=一等奖抽奖&prize=0"
          class="menu-link"
          >一等奖</a
        ></el-menu-item
      >
      <el-menu-item
        ><a
          href="/admin/random-draw?event=抽奖&word=二等奖抽奖&prize=1"
          class="menu-link"
          >二等奖</a
        ></el-menu-item
      >
      <el-menu-item
        ><a
          href="/admin/random-draw?event=抽奖&word=三等奖抽奖&prize=2"
          class="menu-link"
          >三等奖</a
        ></el-menu-item
      >
    </el-sub-menu>
  </el-menu>
</template>

<style scoped>
.el-menu {
  position: fixed;
  height: calc(100vh - var(--el-menu-item-height) - 4px);
  background-color: transparent;
}

.el-menu.dark {
  background: rgba(255, 255, 255, 0.2);
}

.el-menu.dark:deep(*) {
  color: #ffffff;
}

.el-menu :deep(.el-menu-item:hover) {
  background-color: rgba(230, 247, 255, 0.2) !important;
}

.el-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
