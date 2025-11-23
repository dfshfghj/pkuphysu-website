<script setup>
import { computed } from "vue";
import { toggleDark, isDark } from "../../composables/theme";
import { useUserStore } from "../../stores/user";
import { More } from "@element-plus/icons-vue";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();
const userStore = useUserStore();
const username = computed(() => userStore.username);

const scrollTop = inject("scrollTop");

const isScrolled = computed(() => scrollTop.value > 50)

const userAvatar = computed(() => {
  const path = `${API_BASE}/api/avatars/${username.value}`;
  return path + "?t=" + Date.now();
});

const handleCommand = command => {
  if (command === "logout") {
    userStore.logout();
    ElMessage.success("已退出登录");
    router.push("/login");
  } else if (command === "profile") {
    router.push("/profile");
  }
};
</script>

<template>
  <div :class="['menu-wrapper acrylic', { scrolled: isScrolled }]">
    <el-menu :class="{ scrolled: isScrolled }" mode="horizontal" :ellipsis="false" router popper-class="acrylic">
      <el-menu-item index="/">
        <div class="flex items-center justify-center gap-2" style="display: flex; align-items: center">
          <img src="../../assets/logo_white.svg" class="logo" v-if="isDark" />
          <img src="../../assets/logo_black.svg" class="logo" v-else />
          <b id="title">物院学生会</b>
        </div>
      </el-menu-item>
      <el-sub-menu index="2">
        <template #title>
          <el-icon class="submenu-icon">
            <More />
          </el-icon>
          <span class="submenu-title"> 合集 </span>
        </template>
        <el-sub-menu index="2-1">
          <template #title> 活动 </template>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fhomepage%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26hid%3D4%26sn%3D5477391a10433e8e98fef35d599f3c87">
            生活活动
          </el-menu-item>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fhomepage%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26hid%3D2%26sn%3Dc6783ec8ccb47da7ad0ba275676ea651">
            文体活动
          </el-menu-item>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fappmsgalbum%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26action%3Dgetalbum%26album_id%3D3631246162134335494%23wechat_redirect">
            壹周物语
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2-2">
          <template #title> 学术 </template>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fhomepage%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26hid%3D3%26sn%3D9d32b513d3e72c0db38cc8e2e8e5bb87">
            讲座动态
          </el-menu-item>
          <el-menu-item index="redirect?redirect=https%3A%2F%2Fdocs.qq.com%2Fdoc%2FDWHF6bWRzTk9tVEZj">
            常用网站
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title> 信息合集 </template>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fhomepage%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26hid%3D1%26sn%3Dcf77b06bc5a896a5216edc98b7386f7f">
            学生会
          </el-menu-item>
          <el-menu-item index="redirect?redirect=https%3A%2F%2Fdocs.qq.com%2Fform%2Fpage%2FDVVFEeUNSUnJNUWFI">
            权益问题收集
          </el-menu-item>
          <el-menu-item
            index="redirect?redirect=https%3A%2F%2Fmp.weixin.qq.com%2Fmp%2Fhomepage%3F__biz%3DMzIwNDEzMDI5OA%3D%3D%26hid%3D11%26sn%3Db883f3f5b4e67a4a529052576c11b008">
            综运与常代
          </el-menu-item>
        </el-sub-menu>
      </el-sub-menu>
      <el-menu-item index="/chat/articles" id="document"> BBS </el-menu-item>
      <el-menu-item index="/chat/blogs" id="document"> 论坛 </el-menu-item>
      <el-menu-item index="/doc" id="document"> 文档 </el-menu-item>
      <el-menu-item index="/posts" id="posts"> Posts </el-menu-item>

      <el-menu-item h="full" @click="toggleDark()" id="toggleDark">
        <button class="cursor-pointer border-none bg-transparent" style="height: var(--ep-menu-item-height); padding: none;">
          <el-icon-sunny v-if="!isDark" width="20px" height="20px" />
          <el-icon-moon v-else width="20px" height="20px" />
        </button>
      </el-menu-item>
      <el-menu-item>
        <div v-if="userStore.isLoggedIn" style="display: flex">
          <el-dropdown @command="handleCommand">
            <el-avatar :size="40" :src="userAvatar" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout" divided style="color: #f56c6c"> 退出登录 </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <el-button v-else link type="primary" plain @click="$router.push('/login')" class="border-none"> 登录 </el-button>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style>
.menu-wrapper {
  position: sticky;
  border: 1px solid var(--c-border);
  width: 100%;
  top: 0;
  z-index: 999;
  justify-content: center;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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

.el-menu--horizontal>.el-menu-item:nth-child(1) {
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
    border-radius: 30px;
    top: 20px;
    margin: 0px 10%;
  }
}
</style>
