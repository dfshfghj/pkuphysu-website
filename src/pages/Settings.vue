<template>
  <div class="main">
    <div class="user-header">
      <UserAvatar :size="50" />
      <div class="ml-5 flex flex-1 flex-col items-start">
        <span class="font-semibold font-serif">
          {{ currentUser.username }}
        </span>
        <Badge variant="secondary"> id: {{ currentUser.id }} </Badge>
      </div>
      <div>
        <Button variant="outline" @click="router.push('/')"> 前往个人主页 </Button>
      </div>
    </div>
    <div class="container">
      <div class="sidebar">
        <nav class="flex flex-col gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="side-item"
            :class="{ 'side-item--active': currentPage === tab.value }"
            @click="currentPage = tab.value"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
      <div class="profile-container" v-if="userStore.isLoggedIn && currentUser">
        <div class="subHead" v-if="currentPage === 'publicProfile'">
          <h2 class="subhead-heading font-serif">个人资料</h2>
        </div>
        <div v-if="currentPage === 'publicProfile'">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="md:col-span-2">
              <div class="grid gap-2 mt-4.5">
                <Label for="profile-username">用户名</Label>
                <Input id="profile-username" v-model="currentUser.username" />
              </div>
              <div class="grid gap-2 mt-4.5">
                <Label for="profile-bio">个性签名</Label>
                <Textarea id="profile-bio" v-model="currentUser.bio" :maxlength="100" />
                <span class="text-xs text-(--c-secondary)">{{ (currentUser.bio || "").length }} / 100</span>
              </div>
              <div class="mt-4.5">
                <Button variant="outline" size="sm" @click="updateProfile"> 更新 </Button>
              </div>
            </div>
            <div class="md:col-span-1">
              <div class="mt-4 flex flex-col">
                <label> 头像 </label>
                <UserAvatar :userid="userStore.userid" :size="120" />
                <input
                  ref="fileInput"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  class="hidden"
                  @change="handleAvatarChange"
                />
                <Button variant="outline" size="sm" class="mt-2 w-fit" @click="fileInput?.click()">
                  <Pencil class="size-4" />
                  更换
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div class="subHead" v-if="currentPage === 'account'">
          <h2 class="subhead-heading font-serif">认证</h2>
        </div>
        <div v-if="currentPage === 'account'">
          <span v-if="currentUser.verified">{{ currentUser.realname }}</span>
          &nbsp;
          <span label="学号" v-if="currentUser.verified">{{ currentUser.real_id }}</span>
          &nbsp;
          <div>
            <label> 权限 </label>
            <Badge :variant="currentUser.verified ? 'default' : 'secondary'">
              {{ currentUser.verified ? "已验证" : "未验证" }}
            </Badge>
            <Badge variant="secondary">
              {{ currentUser.is_admin ? "管理员" : "用户" }}
            </Badge>
            <Button
              v-if="currentUser.is_admin"
              class="float-right"
              variant="outline"
              size="sm"
              @click="router.push('/admin/dashboard')"
            >
              后台入口
            </Button>
            <Button
              v-if="!currentUser.verified"
              class="ml-5"
              variant="outline"
              size="sm"
              @click="VerifyDialogVisible = true"
              >前往认证</Button
            >
          </div>
        </div>
        <div class="subHead" v-if="currentPage === 'account'">
          <h2 class="subhead-heading font-serif">账户绑定</h2>
        </div>
        <div class="item-card" v-if="currentPage === 'account'">
          <Mail class="size-5" />
          <div class="ml-5 flex-1">
            <label> 邮箱 </label>
            <div v-for="email in currentUser.emails" :key="email">
              <span label="邮箱">{{ email }}</span>
            </div>
            <div v-if="!currentUser.emails">
              <span> 未绑定 </span>
            </div>
          </div>
          <Button variant="outline" size="sm" @click="EmailDialogVisible = true">
            {{ currentUser.emails ? "修改绑定" : "绑定" }}
          </Button>
        </div>
        <div class="subHead" v-if="currentPage === 'security'">
          <h2 class="subhead-heading font-serif">安全设置</h2>
        </div>
        <div class="item-card" v-if="currentPage === 'security'">
          <Lock class="size-5" />
          <div class="ml-5 flex-1">
            <label> 修改密码 </label>
          </div>
          <Button variant="outline" size="sm" @click="PasswordDialogVisible = true"> 修改 </Button>
        </div>
        <div class="item-card text-(--red-6)" v-if="currentPage === 'security'">
          <Trash2 class="size-5" />
          <div class="ml-5 flex-1">
            <label> 注销账户 </label>
          </div>
          <Button variant="destructive" size="sm" @click="DeleteAccountDialogVisible = true"> 删除 </Button>
        </div>
      </div>
    </div>

    <Dialog :open="VerifyDialogVisible" @update:open="VerifyDialogVisible = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>认证</DialogTitle>
          <DialogDescription>输入北京大学门户网站cookies中的SESSION:</DialogDescription>
        </DialogHeader>
        <Input v-model="verifyForm.token" />
        <DialogFooter>
          <Button variant="outline" @click="VerifyDialogVisible = false">取消</Button>
          <Button @click="verify"> 提交 </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="EmailDialogVisible" @update:open="EmailDialogVisible = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>绑定邮箱</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="flex items-center gap-2.5">
            <Input v-model="emailForm.email" placeholder="输入邮箱地址" class="flex-1" />
            <Button variant="outline" @click="sendVerificationCode">发送验证码</Button>
          </div>
          <Input v-model="emailForm.verificationCode" placeholder="输入验证码" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="EmailDialogVisible = false">取消</Button>
          <Button @click="bindEmail">确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="PasswordDialogVisible" @update:open="PasswordDialogVisible = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="old-password">旧密码</Label>
            <Input id="old-password" v-model="passwordForm.oldPassword" type="password" />
          </div>
          <div class="grid gap-2">
            <Label for="settings-new-password">新密码</Label>
            <Input id="settings-new-password" v-model="passwordForm.newPassword" type="password" />
          </div>
          <div class="grid gap-2">
            <Label for="settings-confirm-password">确认新密码</Label>
            <Input id="settings-confirm-password" v-model="passwordForm.confirmNewPassword" type="password" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="PasswordDialogVisible = false">取消</Button>
          <Button @click="changePassword">提交</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="DeleteAccountDialogVisible" @update:open="DeleteAccountDialogVisible = $event">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>警告</DialogTitle>
          <DialogDescription>您确定要删除您的账户吗？此操作不可逆。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="DeleteAccountDialogVisible = false">取消</Button>
          <Button variant="destructive" @click="deleteAccount">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { useUserStore } from "../stores/user";
import { requestApi } from "../api/api";
import { Lock, Mail, Pencil, Trash2 } from "lucide-vue-next";
import UserAvatar from "../components/UserAvatar.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "vue-sonner";
import { sha256 } from "../utils";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const userStore = useUserStore();
const currentPage = ref("publicProfile");

const tabs = [
  { value: "publicProfile", label: "个人资料" },
  { value: "account", label: "账户" },
  { value: "security", label: "安全设置" },
];

const currentUser = ref(null);
const fileInput = ref(null);
const avatarUpload = `${API_BASE}/api/v2/user/avatar`;
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
    const res = await requestApi("/api/v2/user/me");
    const result = await res.json();
    if (res.ok) {
      currentUser.value = result.data;
    } else {
      toast.error("加载失败");
    }
  } catch (err) {
    toast.error("网络错误");
    console.error(err);
  }
});

const updateProfile = async () => {
  const res = await requestApi("/api/v2/user/me", {
    method: "PUT",
    body: JSON.stringify({
      username: currentUser.value.username,
      bio: currentUser.value.bio,
    }),
  });
  const result = await res.json();
  if (res.ok) {
    toast.success("更新成功");
    userStore.username = currentUser.value.username;
    localStorage.setItem("user_name", currentUser.value.username);
  } else {
    toast.error(result.message);
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
    toast.error(result.message);
  }
};

const beforeUpload = (file) => {
  const isImage = ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type);
  const isLt5M = file.size / 1024 / 1024 < 5;

  if (!isImage) {
    toast.error("只能上传图片格式！");
  }
  if (!isLt5M) {
    toast.error("图片大小不能超过 5MB！");
  }
  return isImage && isLt5M;
};

const handleUploadSuccess = (response) => {
  if (response.status == 200) {
    currentUser.value.avatar_url = response.avatarUrl + "?t=" + Date.now();
    window.location.reload();
    toast.success("头像更新成功");
  } else {
    toast.error(response.message || "上传失败");
  }
};

const handleAvatarChange = async (event) => {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !beforeUpload(file)) {
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(avatarUpload, {
      method: "POST",
      headers: { Authorization: "Bearer " + userStore.token },
      body: formData,
    });
    handleUploadSuccess(await res.json());
  } catch (err) {
    toast.error("上传失败");
    console.error("Avatar upload failed:", err);
  }
};

const sendVerificationCode = async () => {
  if (!emailForm.email) {
    toast.error("请输入邮箱地址");
    return;
  }

  try {
    const res = await requestApi(`/api/verify_email?email=${emailForm.email}`);
    const result = await res.json();
    if (res.ok) {
      toast.success("验证码已发送，请查收邮件");
    } else {
      toast.error(result.message || "发送验证码失败");
    }
  } catch (err) {
    toast.error("网络错误");
    console.error(err);
  }
};

const bindEmail = async () => {
  if (!emailForm.email || !emailForm.verificationCode) {
    toast.error("请输入邮箱和验证码");
    return;
  }

  try {
    const res = await requestApi(`/api/verify_email?email=${emailForm.email}&code=${emailForm.verificationCode}`, {
      method: "POST",
    });
    const result = await res.json();
    if (res.ok) {
      toast.success("邮箱绑定成功");
      EmailDialogVisible.value = false;
    } else {
      toast.error(result.message || "绑定邮箱失败");
    }
  } catch (err) {
    toast.error("网络错误");
    console.error(err);
  }
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    toast.error("两次输入的新密码不一致");
    return;
  }

  const res = await requestApi("/api/v2/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      oldPassword: await sha256(passwordForm.oldPassword, "hello_pkuphysu"),
      newPassword: await sha256(passwordForm.newPassword, "hello_pkuphysu"),
    }),
  });

  const result = await res.json();
  if (res.ok) {
    toast.success("密码修改成功");
    PasswordDialogVisible.value = false;
  } else {
    toast.error(result.message || "修改密码失败");
  }
};

const deleteAccount = async () => {
  const res = await requestApi("/api/v2/user/me", {
    method: "DELETE",
  });

  const result = await res.json();
  if (res.ok) {
    toast.success("账户已删除");
    userStore.logout();
    router.push("/");
  } else {
    toast.error(result.message || "删除账户失败");
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

.side-item {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  height: 40px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--c-text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.side-item:hover {
  background: var(--c-hover);
}

.side-item--active {
  background: var(--gray-2);
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
</style>
