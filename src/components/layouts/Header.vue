<script setup>
import { computed } from "vue";
import { toggleDark, isDark } from "../../composables/theme";
import { useUserStore } from "../../stores/user";
import { Ellipsis, Moon, Settings, Sun, Trash2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import UserAvatar from "../UserAvatar.vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const router = useRouter();
const userStore = useUserStore();

const scrollTop = inject("scrollTop");

const isScrolled = computed(() => scrollTop.value > 50);

const handleCommand = (command) => {
  if (command === "logout") {
    userStore.logout();
    toast.success("已退出登录");
    router.push("/login");
  } else if (command === "settings") {
    router.push("/settings");
  }
};

const gotoDocs = () => {
  window.location.href = "/docs";
};
</script>

<template>
  <div :class="['menu-wrapper acrylic unselectable', { scrolled: isScrolled }]">
    <nav class="header-bar">
      <RouterLink to="/" class="header-brand">
        <img src="../../assets/logo_white.svg" class="logo" v-if="isDark" />
        <img src="../../assets/logo_black.svg" class="logo" v-else />
        <b id="title" class="font-serif">物院学生会</b>
      </RouterLink>

      <DropdownMenu>
        <DropdownMenuTrigger id="more" class="header-link">
          <Ellipsis class="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="router.push('/')">论坛</DropdownMenuItem>
          <DropdownMenuItem @click="gotoDocs">文档</DropdownMenuItem>
          <DropdownMenuItem @click="router.push('/posts')">文章</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RouterLink to="/" class="header-link header-link--mobile-hidden">论坛</RouterLink>
      <button type="button" class="header-link header-link--mobile-hidden" @click="gotoDocs">文档</button>
      <RouterLink to="/posts" class="header-link header-link--mobile-hidden">文章</RouterLink>

      <button type="button" class="header-link header-link--mobile-hidden" @click="toggleDark()">
        <Sun v-if="!isDark" class="size-5" />
        <Moon v-else class="size-5" />
      </button>

      <div class="header-user">
        <DropdownMenu v-if="userStore.isLoggedIn">
          <DropdownMenuTrigger class="cursor-pointer border-none bg-transparent p-0">
            <UserAvatar />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="handleCommand('settings')">
              <Settings class="size-4" />
              <span>个人设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-(--red-6)" @click="handleCommand('logout')">
              <Trash2 class="size-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button v-else variant="link" @click="router.push('/login')" class="border-none"> 登录 </Button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.menu-wrapper {
  --header-height: 56px;
  position: sticky;
  border-bottom: 1px solid var(--c-border);
  width: 100%;
  top: 0;
  z-index: 999;
  justify-content: center;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-bar {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 10px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
  text-decoration: none;
}

.header-link {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--c-text);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.header-link:hover {
  background-color: rgba(230, 247, 255, 0.2);
}

.header-user {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

.logo {
  height: 80px;
  margin-right: 20px;
}

#more {
  display: none;
}

@media (max-width: 768px) {
  .header-link {
    padding: 0 6px;
  }

  .header-link--mobile-hidden,
  #title {
    display: none;
  }

  #more {
    display: flex;
  }

  .logo {
    margin-right: 0px;
  }

  .menu-wrapper.scrolled {
    width: 80%;
    border: none;
    border-radius: 30px;
    top: 20px;
    margin: 0px 10%;
  }
}
</style>
