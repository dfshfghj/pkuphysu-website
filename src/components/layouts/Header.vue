<script setup>
import { computed } from "vue";
import { toggleDark, isDark } from "../../composables/theme";
import { useUserStore } from "../../stores/user";
import { Delete, More, Setting } from "@element-plus/icons-vue";
import UserAvatar from "../UserAvatar.vue";

const router = useRouter();
const userStore = useUserStore();

const scrollTop = inject("scrollTop");

const isScrolled = computed(() => scrollTop.value > 50);

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.logout();
    ElMessage.success("已退出登录");
    router.push("/login");
  } else if (command === "settings") {
    router.push("/settings");
  }
};
</script>

<template>
  <div :class="['menu-wrapper acrylic unselectable', { scrolled: isScrolled }]">
    <el-menu
      :class="{ scrolled: isScrolled }"
      mode="horizontal"
      :ellipsis="false"
      router
      popper-class="acrylic"
    >
      <el-menu-item index="/">
        <div
          class="flex items-center justify-center gap-2"
          style="display: flex; align-items: center"
        >
          <img src="../../assets/logo_white.svg" class="logo" v-if="isDark" />
          <img src="../../assets/logo_black.svg" class="logo" v-else />
          <b id="title" class="font-serif">物院学生会</b>
        </div>
      </el-menu-item>
      <el-sub-menu index="1" id="more">
        <template #title>
          <el-icon>
            <More />
          </el-icon>
        </template>
        <el-menu-item index="/forum"> 论坛 </el-menu-item>
        <el-menu-item index="/doc"> 文档 </el-menu-item>
        <el-menu-item index="/posts"> 文章 </el-menu-item>
      </el-sub-menu>
      <el-menu-item index="/forum" id="document"> 论坛 </el-menu-item>
      <el-menu-item index="/doc" id="document"> 文档 </el-menu-item>
      <el-menu-item index="/posts" id="posts"> 文章 </el-menu-item>

      <el-menu-item h="full" @click="toggleDark()" id="toggleDark">
        <button
          class="cursor-pointer border-none bg-transparent"
          style="height: var(--ep-menu-item-height); padding: 0"
        >
          <el-icon-sunny v-if="!isDark" width="20px" height="20px" />
          <el-icon-moon v-else width="20px" height="20px" />
        </button>
      </el-menu-item>
      <el-menu-item>
        <div v-if="userStore.isLoggedIn" style="display: flex">
          <el-dropdown @command="handleCommand">
            <UserAvatar />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>个人设置</span>
                </el-dropdown-item>
                <el-dropdown-item
                  command="logout"
                  divided
                  style="color: #f56c6c"
                >
                  <el-icon>
                    <Delete />
                  </el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button
          v-else
          link
          type="primary"
          plain
          @click="$router.push('/login')"
          class="border-none"
        >
          登录
        </el-button>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style>
.menu-wrapper {
  position: sticky;
  border-bottom: 1px solid var(--c-border);
  width: 100%;
  top: 0;
  z-index: 999;
  justify-content: center;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.el-menu--horizontal.el-menu {
  border: none;
}

.el-menu {
  border: none;
  background-color: transparent;
}

.el-menu :deep(.el-menu-item:hover) {
  background-color: rgba(230, 247, 255, 0.2) !important;
}

.el-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}

.logo {
  height: 80px;
  margin-right: 20px;
}

.submenu-icon {
  visibility: hidden;
}

@media (max-width: 768px) {
  .el-menu {
    --el-menu-base-level-padding: 10px;
  }

  #title,
  #document,
  #toggleDark,
  #posts {
    visibility: hidden;
    width: 0px;
    padding: 0px;
  }

  .logo {
    margin-right: 0px;
  }

  .submenu-icon {
    visibility: visible;
  }

  .submenu-title {
    visibility: hidden;
    width: 0px;
  }

  .menu-wrapper.scrolled {
    width: 80%;
    border: none;
    border-radius: 30px;
    top: 20px;
    margin: 0px 10%;
  }
}

@media (min-width: 768px) {
  #more {
    visibility: hidden;
    width: 0px;
    padding: 0px;
  }
}
</style>
