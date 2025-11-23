<template>
  <div class="profile-container" v-if="userStore.isLoggedIn && currentUser">
    <h2>个人资料</h2>

    <div class="avatar-section">
      <h3>头像</h3>
      <div class="avatar-upload">
        <el-avatar :size="80" :src="avatarUrl" style="border: 2px solid #eee; margin-bottom: 10px" />
        <el-upload :action="avatarUpload" :headers="{ Authorization: 'Bearer ' + userStore.token }"
          :show-file-list="false" :on-success="handleUploadSuccess" :before-upload="beforeUpload" :limit="1"
          :auto-upload="true" accept=".jpg,.jpeg,.png,.gif">
          <el-button type="primary" size="small">更换头像</el-button>
        </el-upload>
        <p class="tip">支持 JPG、PNG、GIF，最大 5MB</p>
      </div>
    </div>

    <!-- 其他信息 -->
    <div class="info-section">
      <h3>基本信息</h3>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="用户名">
          {{ currentUser.username }}
          <el-tag :type="currentUser.verified ? 'success' : 'warning'" round> {{ currentUser.verified ? "已验证" : "未验证" }} </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentUser.verified ? "已验证" : "未验证" }}
          <el-button v-if="!currentUser.verified" type="primary" style="margin-left: 20px;" @click="VerifyDialogVisible = true">前往认证</el-button>
        </el-descriptions-item>
        <el-descriptions-item label="姓名" v-if="currentUser.verified">{{ currentUser.realname }}</el-descriptions-item>
        <el-descriptions-item label="学号" v-if="currentUser.verified">{{ currentUser.real_id }}</el-descriptions-item>
        <el-descriptions-item label="邮箱" v-if="currentUser.email">{{ currentUser.email }}</el-descriptions-item>
        <el-descriptions-item label="权限">
          {{ currentUser.is_admin ? "管理员" : "用户" }}
          <el-button v-if="currentUser.is_admin" @click="router.push('/admin/dashboard')" style="float: right;" size="small"> 后台入口 </el-button>
        </el-descriptions-item>
      </el-descriptions>
      <el-dialog v-model="VerifyDialogVisible" title="认证" width="500" align-center>
        <span>输入北京大学门户网站cookies中的SESSION:</span>
        <el-form :model="form" label-width="auto">
          <el-input v-model="form.token" />
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="VerifyDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="onSubmit">
              提交
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const userStore = useUserStore();
const currentUser = ref(null);
const avatarUpload = `${API_BASE}/api/upload-avatar`;
const VerifyDialogVisible = ref(false);

const avatarUrl = computed(() => {
  const path = `${API_BASE}/api/avatars/${currentUser.value.username}`;
  return path + "?t=" + Date.now();
});

const form = reactive({
  token: "",
});

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/user`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    });
    const result = await res.json();
    if (res.ok) {
      currentUser.value = result.user;
    } else {
      ElMessage.error("加载失败");
    }
  } catch (err) {
    ElMessage.error("网络错误");
    console.error(err);
  }
});

const onSubmit = async () => {
  VerifyDialogVisible.value = false;
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userStore.token}`,
    },
    body: JSON.stringify({
      token: form.token,
    }),
  });
  const result = await res.json();
  if (res.ok) {
    currentUser.value.realname = result.realname;
    currentUser.value.real_id = result.real_id;
  } else {
    ElMessage.error(result.message);
  }
};

const beforeUpload = file => {
  const isImage = ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type);
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error("只能上传图片格式！");
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过 5MB！");
  }
  return isImage && isLt5M;
};

const handleUploadSuccess = response => {
  if (response.status == 200) {
    // 更新显示
    currentUser.value.avatar_url = response.avatarUrl + "?t=" + Date.now(); // 加时间戳防缓存
    window.location.reload();
    ElMessage.success("头像更新成功");
  } else {
    ElMessage.error(response.message || "上传失败");
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--c-border);
  box-shadow: 0 4px 12px var(--c-box-shadow);
}

h2,
h3 {
  text-align: left;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-upload {
  margin-top: 10px;
}

.tip {
  font-size: 12px;
  color: #999;
  margin: 5px 0 0;
}

.info-section {
  text-align: left;
}

.el-form-item__content {
  flex-wrap: nowrap !important;
}
</style>
