<template>
  <div class="main">
    <div class="user-header">
      <UserAvatar :size="50" />
      <div
        style="
          margin-left: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        "
      >
        <span style="font-weight: 600" class="font-serif">
          {{ currentUser.username }}
        </span>
        <el-tag round type="info"> id: {{ currentUser.id }} </el-tag>
      </div>
      <div>
        <el-button> 前往个人主页 </el-button>
      </div>
    </div>
    <div class="container">
      <div class="sidebar">
        <el-menu default-active="1">
          <el-menu-item @click="currentPage = 'publicProfile'" index="1">
            <template #title> 个人资料 </template>
          </el-menu-item>
          <el-menu-item @click="currentPage = 'account'" index="2">
            <template #title> 账户 </template>
          </el-menu-item>
          <el-menu-item @click="currentPage = 'security'" index="3">
            <template #title> 安全设置 </template>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="profile-container" v-if="userStore.isLoggedIn && currentUser">
        <div class="subHead" v-if="currentPage === 'publicProfile'">
          <h2 class="subhead-heading font-serif">个人资料</h2>
        </div>
        <div v-if="currentPage === 'publicProfile'">
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
                  <el-button @click="updateProfile" size="small">
                    更新
                  </el-button>
                </el-form-item>
              </el-form>
            </el-col>
            <el-col :span="8">
              <div
                style="margin-top: 16px; display: flex; flex-direction: column"
              >
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
        <div class="subHead" v-if="currentPage === 'account'">
          <h2 class="subhead-heading font-serif">认证</h2>
        </div>
        <div v-if="currentPage === 'account'">
          <span v-if="currentUser.verified">{{ currentUser.realname }}</span>
          &nbsp;
          <span label="学号" v-if="currentUser.verified">{{
            currentUser.real_id
          }}</span>
          &nbsp;
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
        </div>
        <div class="subHead" v-if="currentPage === 'account'">
          <h2 class="subhead-heading font-serif">账户绑定</h2>
        </div>
        <div class="item-card" v-if="currentPage === 'account'">
          <el-icon>
            <Message />
          </el-icon>
          <div style="flex: 1; margin-left: 20px">
            <label> 邮箱 </label>
            <div v-for="email in currentUser.emails" :key="email">
              <span label="邮箱">{{ email }}</span>
            </div>
            <div v-if="!currentUser.emails">
              <span> 未绑定 </span>
            </div>
          </div>
          <el-button size="small" @click="EmailDialogVisible = true">
            {{ currentUser.emails ? "修改绑定" : "绑定" }}
          </el-button>
        </div>
        <div class="subHead" v-if="currentPage === 'security'">
          <h2 class="subhead-heading font-serif">安全设置</h2>
        </div>
        <div class="item-card" v-if="currentPage === 'security'">
          <el-icon>
            <Lock />
          </el-icon>
          <div style="flex: 1; margin-left: 20px">
            <label> 修改密码 </label>
          </div>
          <el-button size="small" @click="PasswordDialogVisible = true">
            修改
          </el-button>
        </div>
        <div
          class="item-card"
          v-if="currentPage === 'security'"
          style="color: var(--red-5)"
        >
          <el-icon>
            <Delete />
          </el-icon>
          <div style="flex: 1; margin-left: 20px">
            <label> 注销账户 </label>
          </div>
          <el-button
            size="small"
            style="background: var(--red-5)"
            @click="DeleteAccountDialogVisible = true"
          >
            删除
          </el-button>
        </div>
      </div>
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
  <el-dialog
    v-model="EmailDialogVisible"
    title="绑定邮箱"
    width="500"
    align-center
  >
    <el-form :model="emailForm" label-width="auto">
      <el-form-item>
        <el-input
          v-model="emailForm.email"
          placeholder="输入邮箱地址"
          style="width: auto; flex: 1; margin-right: 10px"
        />
        <el-button @click="sendVerificationCode">发送验证码</el-button>
      </el-form-item>
      <el-form-item>
        <el-input
          v-model="emailForm.verificationCode"
          placeholder="输入验证码"
          style="margin-right: 10px"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="bindEmail">确定</el-button>
        <el-button @click="EmailDialogVisible = false">取消</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="PasswordDialogVisible"
    title="修改密码"
    width="500"
    align-center
  >
    <el-form :model="passwordForm" label-width="auto">
      <el-form-item label="旧密码">
        <el-input v-model="passwordForm.oldPassword" type="password" />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input v-model="passwordForm.newPassword" type="password" />
      </el-form-item>
      <el-form-item label="确认新密码">
        <el-input v-model="passwordForm.confirmNewPassword" type="password" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="PasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">提交</el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="DeleteAccountDialogVisible"
    title="警告"
    width="500"
    align-center
  >
    <span>您确定要删除您的账户吗？此操作不可逆。</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="DeleteAccountDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteAccount">确认删除</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores/user";
import { requestApi } from "../api/api";
import { Delete, Edit, Lock, Message } from "@element-plus/icons-vue";
import UserAvatar from "../components/UserAvatar.vue";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const userStore = useUserStore();
const currentPage = ref("publicProfile");

const currentUser = ref(null);
const avatarUpload = `${API_BASE}/api/upload-avatar`;
const VerifyDialogVisible = ref(false);
const EmailDialogVisible = ref(false);
const PasswordDialogVisible = ref(false);

const emailForm = reactive({
  email: "",
  verificationCode: "",
});

const verifyForm = reactive({
  token: "",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

const DeleteAccountDialogVisible = ref(false);

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

const sendVerificationCode = async () => {
  if (!emailForm.email) {
    ElMessage.error("请输入邮箱地址");
    return;
  }

  try {
    const res = await requestApi(`/api/verify_email?email=${emailForm.email}`);
    const result = await res.json();
    if (res.ok) {
      ElMessage.success("验证码已发送，请查收邮件");
    } else {
      ElMessage.error(result.message || "发送验证码失败");
    }
  } catch (err) {
    ElMessage.error("网络错误");
    console.error(err);
  }
};

const bindEmail = async () => {
  if (!emailForm.email || !emailForm.verificationCode) {
    ElMessage.error("请输入邮箱和验证码");
    return;
  }

  try {
    const res = await requestApi(
      `/api/verify_email?email=${emailForm.email}&code=${emailForm.verificationCode}`,
      {
        method: "POST",
      },
    );
    const result = await res.json();
    if (res.ok) {
      ElMessage.success("邮箱绑定成功");
      EmailDialogVisible.value = false;
    } else {
      ElMessage.error(result.message || "绑定邮箱失败");
    }
  } catch (err) {
    ElMessage.error("网络错误");
    console.error(err);
  }
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    ElMessage.error("两次输入的新密码不一致");
    return;
  }

  const res = await requestApi("/api/change-password", {
    method: "POST",
    body: JSON.stringify({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    }),
  });

  const result = await res.json();
  if (res.ok) {
    ElMessage.success("密码修改成功");
    PasswordDialogVisible.value = false;
  } else {
    ElMessage.error(result.message || "修改密码失败");
  }
};

const deleteAccount = async () => {
  const res = await requestApi("/api/delete-account", {
    method: "POST",
  });

  const result = await res.json();
  if (res.ok) {
    ElMessage.success("账户已删除");
    userStore.logout();
    router.push("/");
  } else {
    ElMessage.error(result.message || "删除账户失败");
  }
};
</script>

<style scoped>
.main {
  padding: 20px;
  max-width: 1280px;
  margin: 0 auto;
}

.container {
  display: flex;
}

.sidebar {
  min-width: 150px;
}

.user-header {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.profile-container {
  margin-left: 16px;
  width: 100%;
}

.subHead {
  margin-top: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 8px;
}

.subhead-heading {
  font-size: 22px;
  font-weight: bold;
  margin: 0px;
}

.item-card {
  max-width: 500px;
  margin: 5px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 6px;
  border: 1px solid var(--c-border);
}

.el-button {
  background: var(--gray-1);
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
