<template>
  <h2>欢迎来到管理员面板！</h2>
  <div class="avatar-list">
    <div class="list-header">
      <h3>用户</h3>
    </div>
    <div v-if="users.users.length > 0" class="avatar-container">
      <el-tooltip v-for="user in users.users" :key="user.id" class="avatar-item" :content="`${user.username}`"
        placement="top" :offset="10" :show-after="300">
        <el-avatar :size="60" :src="avatarUrl(user)" style="border: 2px solid #eee; margin-bottom: 10px" />
      </el-tooltip>
    </div>

    <el-empty v-else description="暂无用户" />
  </div>
  <div class="avatar-list">
    <div class="list-header">
      <h3>管理员</h3>
    </div>
    <div v-if="users.admins.length > 0" class="avatar-container">
      <el-tooltip v-for="admin in users.admins" :key="admin.id" class="avatar-item" :content="`${admin.username}`"
        placement="top" :offset="10" :show-after="300">
        <el-avatar :size="60" :src="avatarUrl(admin)" style="border: 2px solid #eee; margin-bottom: 10px" />
      </el-tooltip>
    </div>

    <el-empty v-else description="暂无管理员" />
  </div>
  <el-divider />
  <div>
    <div class="list-header">
      <h3>公众号后台管理</h3>
    </div>
    <div>
      <span> cookies 失效时间：{{ FormatTime(cookies_expire) }}</span>
    </div>
    <el-button type="primary" plain :loading="checking" @click="checkWechatEngine"> {{ checking ? "检查中..." : "手动检查" }}
    </el-button>
    <el-button type="primary" plain :loading="refreshing" @click="refreshWechatState"> {{ refreshing ? "更新中..." : "更新文章"
    }}
    </el-button>

    <div class="qrcodeContainer" v-if="qrcodeUrl">
      <img :src="qrcodeUrl" />
    </div>

  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "../../stores/user";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const userStore = useUserStore();

const users = ref({
  "users": [],
  "admins": []
});
const loading = ref(false);
const checking = ref(false);
const refreshing = ref(false);
const cookies_expire = ref(0);
const qrcodeUrl = ref('');

const FormatTime = function (timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
}

const avatarUrl = function (user) {
  const path = `${API_BASE}/api/avatars/${user.username}`;
  return path;
};

const loadUserList = async (group) => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/${group}/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await res.json();

    if (res.ok) {
      users.value[group] = result.data.users;
    } else {
      ElMessage.error(result.message || "获取用户列表失败");
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const cookiesExpire = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/wechat/check-health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    });

    const result = await res.json();

    if (res.ok) {
      cookies_expire.value = result.expire * 1000;
    } else {
      ElMessage.error(result.message || "获取cookies失败");
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  }
};

const checkWechatEngine = async () => {
  checking.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/wechat/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await res.json();

    if (res.ok) {
      ElMessage.success("登录状态有效");
    } else {
      ElMessage.error(result.message || "登录状态失效");
      await fetch(`${API_BASE}/api/wechat/refresh-login`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
      })
      let qrcodeDone = false;
      while (!qrcodeDone) {
        const res = await fetch(`${API_BASE}/api/wechat/cgi-bin/scanloginqrcode`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userStore.token}`,
          },
        });
        if (res.ok) {
          const blob = await res.blob();
          if (qrcodeUrl.value) {
            URL.revokeObjectURL(qrcodeUrl.value);
          }
          qrcodeUrl.value = URL.createObjectURL(blob);
          qrcodeDone = true;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }
      let isLogged = false;
      while (!isLogged) {
        const res = await fetch(`${API_BASE}/api/wechat/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userStore.token}`,
          },
        });
        if (res.ok) {
          isLogged = true;
          URL.revokeObjectURL(qrcodeUrl.value);
          qrcodeUrl.value = '';
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    checking.value = false;
  }
}

const refreshWechatState = async () => {
  refreshing.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/wechat/update-posts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
    });

    const result = await res.json();

    if (res.ok) {
      ElMessage.success("更新成功");
    } else {
      ElMessage.error(result.message || "更新失败");
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    refreshing.value = false;
  }
}

onMounted(() => {
  loadUserList("admins");
  loadUserList("users");
  cookiesExpire();
});
</script>

<style scoped></style>
