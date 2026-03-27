<template>
  <h2 class="font-serif">欢迎来到管理员面板！</h2>
  <div class="avatar-list">
    <div class="list-header">
      <h3 class="font-serif">用户</h3>
      <el-button type="primary" size="small" @click="showCreateUserDialog">创建新用户</el-button>
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
    <el-button type="primary" plain :loading="checking" @click="checkWechatEngine">
      {{ checking ? "检查中..." : "手动检查" }}
    </el-button>
    <el-button type="primary" plain :loading="refreshing" @click="refreshWechatState">
      {{ refreshing ? "更新中..." : "更新文章" }}
    </el-button>

    <el-dialog v-model="QRcodeDialogVisible" title="扫码登录" width="500" align-center>
      <img :src="qrcodeUrl" />
    </el-dialog>

    <div class="qrcodeContainer" v-if="qrcodeUrl"></div>
  </div>

  <!-- 创建用户对话框 -->
  <el-dialog v-model="createUserDialogVisible" title="创建新用户" width="400">
    <el-form :model="newUserForm" :rules="createUserRules" ref="createUserFormRef" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="newUserForm.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="newUserForm.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="newUserForm.role" placeholder="请选择角色">
          <el-option :value="0" label="普通用户" />
          <el-option :value="1" label="访客" />
          <el-option :value="2" label="管理员" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createUserDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleCreateUser" :loading="creatingUser">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { requestApi } from "../../api/api";
import UserAvatar from "../../components/UserAvatar.vue";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { sha256 } from "../../utils";

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

// 创建用户相关状态
const createUserDialogVisible = ref(false);
const creatingUser = ref(false);
const newUserForm = reactive({
  username: "",
  password: "",
  role: 0,
});
const createUserFormRef = ref();

const createUserRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度应在3-20个字符之间", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 30, message: "密码长度应在6-30个字符之间", trigger: "blur" }
  ],
  role: [
    { required: true, message: "请选择角色", trigger: "change" }
  ]
};

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
    const res = await requestApi(`/api/v2/${group}`);

    const result = await res.json();

    if (res.ok) {
      users.value[group] = result.data[group];
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
      const res = await requestApi(`/api/wechat/scanloginqrcode?action=getqrcode&fingerprint=${fingerprint.value}`);
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
        const res = await requestApi(`/api/wechat/scanloginqrcode?action=ask&fingerprint=${fingerprint.value}`);
        const result = await res.json();
        if (result.status == 1) {
          isLogged = true;
          URL.revokeObjectURL(qrcodeUrl.value);
          qrcodeUrl.value = "";
          QRcodeDialogVisible.value = false;
          await requestApi(`/api/wechat/login?fingerprint=${fingerprint.value}`);
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

const showCreateUserDialog = () => {
  createUserDialogVisible.value = true;
  newUserForm.username = "";
  newUserForm.password = "";
  newUserForm.role = 0;
};

const handleCreateUser = async () => {
  if (!createUserFormRef.value) return;
  
  try {
    await createUserFormRef.value.validate();
    creatingUser.value = true;
    const hashedPassword = await sha256(newUserForm.password, "hello_pkuphysu");
    
    const response = await requestApi("/api/v2/user/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: newUserForm.username,
        password: hashedPassword,
        role: newUserForm.role,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      ElMessage.success("用户创建成功");
      createUserDialogVisible.value = false;
      loadUserList("users");
      loadUserList("admins");
    } else {
      ElMessage.error(result.message || "创建用户失败");
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    creatingUser.value = false;
  }
};

onMounted(() => {
  loadUserList("admins");
  loadUserList("users");
  cookiesExpire();
  getBrowserFingerprint();
});
</script>

<style scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.avatar-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.avatar-item {
  cursor: pointer;
}
</style>