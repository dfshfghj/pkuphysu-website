<template>
  <h2 class="font-serif">欢迎来到管理员面板！</h2>
  <div class="avatar-list">
    <div class="list-header">
      <h3 class="font-serif">用户</h3>
    </div>
    <div v-if="users.users.length > 0" class="avatar-container">
      <el-tooltip
        v-for="user in users.users"
        :key="user.id"
        class="avatar-item"
        :content="`${user.username}`"
        placement="top"
        :offset="10"
        :show-after="300"
      >
        <user-avatar
          :userid="user.id"
          :size="60"
          style="border: 2px solid #eee; margin-bottom: 10px; background: #ddd"
        />
      </el-tooltip>
    </div>

    <el-empty v-else description="暂无用户" />
  </div>
  <div class="avatar-list">
    <div class="list-header">
      <h3 class="font-serif">管理员</h3>
    </div>
    <div v-if="users.admins.length > 0" class="avatar-container">
      <el-tooltip
        v-for="admin in users.admins"
        :key="admin.id"
        class="avatar-item"
        :content="`${admin.username}`"
        placement="top"
        :offset="10"
        :show-after="300"
      >
        <user-avatar
          :userid="admin.id"
          :size="60"
          style="border: 2px solid #eee; margin-bottom: 10px; background: #ddd"
        />
      </el-tooltip>
    </div>

    <el-empty v-else description="暂无管理员" />
  </div>
  <el-divider />
  <div>
    <div class="list-header">
      <h3 class="font-serif">公众号后台管理</h3>
    </div>
    <div>
      <span> cookies 失效时间：{{ FormatTime(cookies_expire) }}</span>
    </div>
    <el-button
      type="primary"
      plain
      :loading="checking"
      @click="checkWechatEngine"
    >
      {{ checking ? "检查中..." : "手动检查" }}
    </el-button>
    <el-button
      type="primary"
      plain
      :loading="refreshing"
      @click="refreshWechatState"
    >
      {{ refreshing ? "更新中..." : "更新文章" }}
    </el-button>

    <el-dialog
      v-model="QRcodeDialogVisible"
      title="扫码登录"
      width="500"
      align-center
    >
      <img :src="qrcodeUrl" />
    </el-dialog>

    <div class="qrcodeContainer" v-if="qrcodeUrl"></div>
  </div>
</template>

<script setup>
import { requestApi } from "../../api/api";
import UserAvatar from "../../components/UserAvatar.vue";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const users = ref({
  users: [],
  admins: [],
});
const fingerprint = ref("");
const loading = ref(false);
const checking = ref(false);
const refreshing = ref(false);
const cookies_expire = ref(0);
const qrcodeUrl = ref("");
const QRcodeDialogVisible = ref(false);

const getBrowserFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  fingerprint.value = result.visitorId;
};

const FormatTime = function (timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
};

const loadUserList = async (group) => {
  loading.value = true;
  try {
    const res = await requestApi(`/api/${group}/list`);

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
    const res = await requestApi("/api/wechat/check-health");

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
    const res = await requestApi("/api/wechat/");

    const result = await res.json();

    if (res.ok) {
      ElMessage.success("登录状态有效");
    } else {
      ElMessage.error(result.message || "登录状态失效");
      const res = await requestApi(
        `/api/wechat/scanloginqrcode?action=getqrcode&fingerprint=${fingerprint.value}`,
      );
      if (res.ok) {
        const blob = await res.blob();
        if (qrcodeUrl.value) {
          URL.revokeObjectURL(qrcodeUrl.value);
        }
        qrcodeUrl.value = URL.createObjectURL(blob);
        QRcodeDialogVisible.value = true;
      }
      let isLogged = false;
      while (!isLogged) {
        const res = await requestApi(
          `/api/wechat/scanloginqrcode?action=ask&fingerprint=${fingerprint.value}`,
        );
        const result = await res.json();
        if (result.status == 1) {
          isLogged = true;
          URL.revokeObjectURL(qrcodeUrl.value);
          qrcodeUrl.value = "";
          QRcodeDialogVisible.value = false;
          await requestApi(
            `/api/wechat/login?fingerprint=${fingerprint.value}`,
          );
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    checking.value = false;
  }
};

const refreshWechatState = async () => {
  refreshing.value = true;
  try {
    const res = await requestApi("/api/wechat/update-posts");

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
};

onMounted(() => {
  loadUserList("admins");
  loadUserList("users");
  cookiesExpire();
  getBrowserFingerprint();
});
</script>

<style scoped></style>
