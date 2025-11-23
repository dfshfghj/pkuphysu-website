<script lang="ts" setup>
import { Menu, Setting, ArrowLeft, ArrowRight, Tickets } from "@element-plus/icons-vue";
const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
  <div class="adminContainer">
    <el-menu router default-active="/admin/dashboard" class="el-menu-vertical-demo" :collapse="isCollapsed">
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
        <el-menu-item index="/admin/random-draw?event=抽奖&word=一等奖抽奖&prize=0">一等奖</el-menu-item>
        <el-menu-item index="/admin/random-draw?event=抽奖&word=二等奖抽奖&prize=1">二等奖</el-menu-item>
        <el-menu-item index="/admin/random-draw?event=抽奖&word=三等奖抽奖&prize=2">三等奖</el-menu-item>
      </el-sub-menu>
    </el-menu>
    <div :class="['main-content', isCollapsed ? 'main-content--collapsed' : 'main-content--expanded']">
        <RouterView />
    </div>
  </div>
</template>

<style scoped>
.adminContainer {
  display: flex;
}

.el-menu {
  position: fixed;
  height: calc(100vh - var(--el-menu-item-height) - 4px);
}

.main-content {
  position: relative;
  margin-right: 5%;
  transition: all 0.5s ease;
}

.main-content--expanded {
  width: calc(0.9*(100vw - 200px));
  margin-left: 200px;
}

.main-content--collapsed {
  width: calc(0.9*(100vw - 100px));
  margin-left: 100px;
}
</style>
