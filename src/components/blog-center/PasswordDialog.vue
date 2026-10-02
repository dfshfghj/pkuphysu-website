<template>
  <Dialog :open="internalVisible" @update:open="handleVisibleChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>设置密码</DialogTitle>
        <DialogDescription>设置密码后可用账号密码登录，请妥善保管。</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <div class="grid gap-2">
          <Label for="new-password">新密码</Label>
          <Input id="new-password" v-model="passwordForm.newPassword" type="password" placeholder="请输入至少6位密码" />
        </div>
        <div class="grid gap-2">
          <Label for="confirm-password">确认密码</Label>
          <Input
            id="confirm-password"
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">稍后设置</Button>
        <Button @click="handleSubmit">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
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
import { toast } from "vue-sonner";
import { requestApi } from "../../api/api";
import { sha256 } from "../../utils";
import { useUserStore } from "../../stores/user";
const emit = defineEmits(["success"]);

const userStore = useUserStore();
const internalVisible = ref(false);
const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

const handleVisibleChange = (visible: boolean) => {
  if (!visible) {
    handleCancel();
    return;
  }
  internalVisible.value = visible;
};

const checkUserPasswordStatus = async () => {
  if (!userStore.isLoggedIn) return;

  try {
    const res = await requestApi("/api/v2/user/me");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.data && data.data.has_password === false) {
      toast.warning("您尚未设置密码，请尽快设置以保障账户安全");
      internalVisible.value = true;
    }
  } catch {
    console.error("Check user password status failed:");
  }
};

onMounted(() => {
  checkUserPasswordStatus();
});

const handleCancel = () => {
  internalVisible.value = false;
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
};

const handleSubmit = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error("两次输入的密码不一致");
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    toast.error("密码长度至少6位");
    return;
  }

  try {
    const res = await requestApi("/api/v2/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        oldPassword: await sha256("", "hello_pkuphysu"),
        newPassword: await sha256(passwordForm.newPassword, "hello_pkuphysu"),
      }),
    });

    const result = await res.json();
    if (res.ok) {
      toast.success("密码设置成功");
      internalVisible.value = false;
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      emit("success");
    } else {
      toast.error(result.message || "设置密码失败");
    }
  } catch (error) {
    toast.error("网络错误");
    console.error("Password change failed:", error);
  }
};
</script>
