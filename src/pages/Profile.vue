<template>
  <div class="profile-container" v-if="userStore.isLoggedIn && currentUser">
    <div class="subHead">
      <h2 class="subhead-heading">个人资料</h2>
    </div>
    <div>
      <el-row>
        <el-col :span="16">
          <el-form label-position="top">
            <el-form-item label="用户名">
              <el-input v-model="currentUser.username" />
            </el-form-item>
            <el-form-item label="个性签名">
              <el-input
                v-model="currentUser.bio"
                type="textarea"
                :maxlength="100"
                show-word-limit
                word-limit-position="outside"
              />
            </el-form-item>
            <!---
            <el-form-item label="公开的邮箱">
              <el-select
                v-model="currentUser.publicEmail"
                placeholder="选择一个邮箱"
                clearable
              />
            </el-form-item>
            -->
            <el-form-item>
              <el-button @click="updateProfile"> 提交 </el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="8">
          <div style="margin-top: 16px; display: flex; flex-direction: column">
            <label> 头像 </label>
            <UserAvatar :userid="userStore.userid" :size="120" />
            <el-upload
              :action="avatarUpload"
              :headers="{ Authorization: 'Bearer ' + userStore.token }"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :limit="1"
              :auto-upload="true"
              accept=".jpg,.jpeg,.png,.gif"
            >
              <el-button size="small">
                <el-icon>
                  <Edit />
                </el-icon>
                更换
              </el-button>
            </el-upload>
            <!---
            <p class="tip">支持 JPG、PNG、GIF，最大 5MB</p>
            -->
          </div>
        </el-col>
      </el-row>
    </div>
    <!---
    <div class="subHead">
      <h2 class="subhead-heading">邮箱</h2>
    </div>
    <div class="card">
      <ul>
        <li class="row">
          <span>{{ currentUser.email }}</span>
        </li>
      </ul>
    </div>
    --->
    <div class="subHead">
      <h2 class="subhead-heading">认证</h2>
    </div>
    <div>
      <div>
        <label> 权限 </label>
        <el-tag :type="currentUser.verified ? 'success' : 'warning'" round>
          {{ currentUser.verified ? "已验证" : "未验证" }}
        </el-tag>
        <el-tag :type="currentUser.is_admin ? 'success' : 'info'" round>
          {{ currentUser.is_admin ? "管理员" : "用户" }}
        </el-tag>
        <el-button
          v-if="currentUser.is_admin"
          @click="router.push('/admin/dashboard')"
          style="float: right"
          size="small"
        >
          后台入口
        </el-button>
        <el-button
          v-if="!currentUser.verified"
          style="margin-left: 20px"
          @click="VerifyDialogVisible = true"
          >前往认证</el-button
        >
      </div>
      <span v-if="currentUser.verified">{{ currentUser.realname }}</span>
      &nbsp;
      <span label="学号" v-if="currentUser.verified">{{
        currentUser.real_id
      }}</span>
      &nbsp;
      <span label="邮箱" v-if="currentUser.email">{{ currentUser.email }}</span>
    </div>
  </div>
  <el-dialog
    v-model="VerifyDialogVisible"
    title="认证"
    width="500"
    align-center
  >
    <span>输入北京大学门户网站cookies中的SESSION:</span>
    <el-form :model="verifyForm" label-width="auto">
      <el-input v-model="verifyForm.token" />
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="VerifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verify"> 提交 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";
import { requestApi } from "../api/api";
import { Edit } from "@element-plus/icons-vue";
import UserAvatar from "../components/UserAvatar.vue";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const userStore = useUserStore();
const currentUser = ref(null);
const avatarUpload = `${API_BASE}/api/upload-avatar`;
const VerifyDialogVisible = ref(false);

const verifyForm = reactive({
  token: "",
});

onBeforeMount(async () => {
  try {
    const res = await requestApi("/api/user");
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

const updateProfile = async () => {
  const res = await requestApi("/api/user/profile", {
    method: "POST",
    body: JSON.stringify({
      username: currentUser.value.username,
      bio: currentUser.value.bio,
    }),
  });
  const result = await res.json();
  if (res.ok) {
    ElMessage.success("更新成功");
  } else {
    ElMessage.error(result.message);
  }
};
const verify = async () => {
  VerifyDialogVisible.value = false;
  const res = await requestApi("/api/auth", {
    method: "POST",
    body: JSON.stringify({
      token: verifyForm.token,
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

const beforeUpload = (file) => {
  const isImage = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
  ].includes(file.type);
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    ElMessage.error("只能上传图片格式！");
  }
  if (!isLt5M) {
    ElMessage.error("图片大小不能超过 5MB！");
  }
  return isImage && isLt5M;
};

const handleUploadSuccess = (response) => {
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
  margin: 0px auto;
  padding: 20px;
}

.subHead {
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 8px;
}

.subhead-heading {
  font-size: 22px;
  font-weight: 400;
  margin: 0px;
}

.el-col {
  padding-left: 16px;
  padding-right: 16px;
}

.el-form-item {
  margin-top: 18px;
}

:deep(.el-form-item__label) {
  color: unset;
  font-size: unset;
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
