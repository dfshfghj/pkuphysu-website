<template>
  <div>
    <h2 class="font-serif">欢迎来到管理员面板！</h2>
    <div class="avatar-list">
      <div class="list-header">
        <h3 class="font-serif">用户</h3>
        <Button size="sm" @click="showCreateUserDialog">创建新用户</Button>
      </div>
      <TooltipProvider v-if="users.users.length > 0">
        <div class="avatar-container">
          <Tooltip v-for="user in users.users" :key="user.id">
            <TooltipTrigger as-child>
              <UserAvatar
                :userid="user.id"
                :size="60"
                class="cursor-pointer mb-2.5 border-2 border-[#eee] bg-[#ddd]"
              />
            </TooltipTrigger>
            <TooltipContent>{{ user.username }}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <EmptyState v-else description="暂无用户" />
    </div>
    <div class="avatar-list">
      <div class="list-header">
        <h3 class="font-serif">管理员</h3>
      </div>
      <TooltipProvider v-if="users.admins.length > 0">
        <div class="avatar-container">
          <Tooltip v-for="admin in users.admins" :key="admin.id">
            <TooltipTrigger as-child>
              <UserAvatar
                :userid="admin.id"
                :size="60"
                class="cursor-pointer mb-2.5 border-2 border-[#eee] bg-[#ddd]"
              />
            </TooltipTrigger>
            <TooltipContent>{{ admin.username }}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <EmptyState v-else description="暂无管理员" />
    </div>
    <Separator class="my-4" />
    <div>
      <div class="list-header">
        <h3 class="font-serif">公众号后台管理</h3>
      </div>
      <div>
        <span> cookies 失效时间：{{ FormatTime(cookies_expire) }}</span>
      </div>
      <Button variant="outline" :disabled="checking" @click="checkWechatEngine">
        {{ checking ? "检查中..." : "手动检查" }}
      </Button>
      <Button variant="outline" :disabled="refreshing" @click="refreshWechatState">
        {{ refreshing ? "更新中..." : "更新文章" }}
      </Button>

      <Dialog :open="QRcodeDialogVisible" @update:open="QRcodeDialogVisible = $event">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>扫码登录</DialogTitle>
          </DialogHeader>
          <img :src="qrcodeUrl" />
        </DialogContent>
      </Dialog>

      <div class="qrcodeContainer" v-if="qrcodeUrl"></div>
    </div>

    <Dialog :open="createUserDialogVisible" @update:open="createUserDialogVisible = $event">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>创建新用户</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="new-username">用户名</Label>
            <Input id="new-username" v-model="newUserForm.username" placeholder="请输入用户名" />
            <p v-if="errors.username" class="text-xs text-(--red-6)">{{ errors.username }}</p>
          </div>
          <div class="grid gap-2">
            <Label for="new-password">密码</Label>
            <Input id="new-password" v-model="newUserForm.password" type="password" placeholder="请输入密码" />
            <p v-if="errors.password" class="text-xs text-(--red-6)">{{ errors.password }}</p>
          </div>
          <div class="grid gap-2">
            <Label>角色</Label>
            <Select v-model="newUserForm.role">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="0">普通用户</SelectItem>
                <SelectItem :value="1">访客</SelectItem>
                <SelectItem :value="2">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="createUserDialogVisible = false">取消</Button>
          <Button :disabled="creatingUser" @click="handleCreateUser">
            {{ creatingUser ? "创建中..." : "确定" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { requestApi } from "../../api/api";
import EmptyState from "../../components/EmptyState.vue";
import UserAvatar from "../../components/UserAvatar.vue";
import Button from "@/components/ui/button/Button.vue";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "vue-sonner";
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

const createUserDialogVisible = ref(false);
const creatingUser = ref(false);
const newUserForm = reactive({
  username: "",
  password: "",
  role: 0,
});
const errors = reactive({ username: "", password: "" });

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
      toast.error(result.message || "获取用户列表失败");
    }
  } catch (err) {
    toast.error("网络错误，请检查连接");
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
      toast.error(result.message || "获取cookies失败");
    }
  } catch (err) {
    toast.error("网络错误，请检查连接");
    console.error(err);
  }
};

const checkWechatEngine = async () => {
  checking.value = true;
  try {
    const res = await requestApi("/api/wechat/");

    const result = await res.json();

    if (res.ok) {
      toast.success("登录状态有效");
    } else {
      toast.error(result.message || "登录状态失效");
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
    toast.error("网络错误，请检查连接");
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
      toast.success("更新成功");
    } else {
      toast.error(result.message || "更新失败");
    }
  } catch (err) {
    toast.error("网络错误，请检查连接");
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
  errors.username = "";
  errors.password = "";
};

const validateNewUser = () => {
  errors.username = !newUserForm.username
    ? "请输入用户名"
    : newUserForm.username.length < 3 || newUserForm.username.length > 20
      ? "用户名长度应在3-20个字符之间"
      : "";
  errors.password = !newUserForm.password
    ? "请输入密码"
    : newUserForm.password.length < 6 || newUserForm.password.length > 30
      ? "密码长度应在6-30个字符之间"
      : "";
  return !errors.username && !errors.password;
};

const handleCreateUser = async () => {
  if (!validateNewUser()) return;

  try {
    creatingUser.value = true;
    const hashedPassword = await sha256(newUserForm.password, "hello_pkuphysu");

    const response = await requestApi("/api/v2/user/create", {
      method: "POST",
      body: JSON.stringify({
        username: newUserForm.username,
        password: hashedPassword,
        role: newUserForm.role,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      toast.success("用户创建成功");
      createUserDialogVisible.value = false;
      loadUserList("users");
      loadUserList("admins");
    } else {
      toast.error(result.message || "创建用户失败");
    }
  } catch (err) {
    toast.error("网络错误，请检查连接");
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
</style>
