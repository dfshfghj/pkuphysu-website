<template>
  <el-scrollbar class="h-screen! flex-1">
    <div class="min-h-lvh">
      <h2 class="text-xl font-bold sm:font-serif pl-6 mt-0 pt-6">设置</h2>
      <div class="p-4 mt-10">
        <Label class="p-2" for="picture"> 头像 </Label>
        <div class="flex items-end">
          <UserAvatar class="min-w-0 m-3" :userid="userStore.userid || ''" :size="70" />
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
        </div>
      </div>
      <div class="p-4">
        <form v-if="currentUser" @submit.prevent="updateProfile">
          <FieldLabel class="p-2" for="username"> 用户名 </FieldLabel>
          <Input class="box-border" id="username" v-model="currentUser.username" required />
          <FieldLabel class="p-2" for="bio"> 个性签名 </FieldLabel>
          <Textarea id="bio" v-model="currentUser.bio" class="box-border resize-none" />
          <Field class="p-2 justify-end" orientation="horizontal">
            <Button type="submit" class="border" size="sm"> 更新 </Button>
          </Field>
        </form>
        <div class="border-b border-(--c-border) my-2"></div>
        <Item variant="outline">
          <ItemMedia>
            <ShieldCheckIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>修改密码</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Dialog>
              <DialogTrigger as-child>
                <Button variant="outline" size="sm"> 修改 </Button>
              </DialogTrigger>
              <DialogContent class="sm:max-w-100">
                <DialogHeader>
                  <DialogTitle>修改密码</DialogTitle>
                </DialogHeader>
                <div class="grid gap-4">
                  <div class="grid gap-3">
                    <Label>旧密码</Label>
                    <Input v-model="passwordForm.oldPassword" type="password" />
                  </div>
                  <div class="grid gap-3">
                    <Label>新密码</Label>
                    <Input v-model="passwordForm.newPassword" type="password" />
                  </div>
                  <div class="grid gap-3">
                    <Label>确认新密码</Label>
                    <Input v-model="passwordForm.confirmNewPassword" type="password" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose as-child>
                    <Button variant="outline"> 取消 </Button>
                  </DialogClose>
                  <DialogClose as-child>
                    <Button type="submit" @click="changePassword"> 确认 </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ItemActions>
        </Item>
        <Item variant="outline" class="text-(--red-7)">
          <ItemMedia>
            <AlertCircleIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>注销账号</ItemTitle>
          </ItemContent>
          <ItemActions>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button class="border" type="submit" size="sm"> 确认 </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>警告</AlertDialogTitle>
                  <AlertDialogDescription> 您确定要删除您的账户吗？此操作不可逆。 </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction>确认</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ItemActions>
        </Item>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { useUserStore } from "@/stores/user";
import { requestApi } from "@/api/api";
import Button from "@/components/ui/button/Button.vue";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import UserAvatar from "@/components/UserAvatar.vue";
import { toast } from "vue-sonner";
import { AlertCircleIcon, Edit, ShieldCheckIcon } from "lucide-vue-next";
import { sha256 } from "@/utils";

interface User {
  id: number;
  username: string;
  role: number;
  disabled: boolean;
  has_password: boolean;
  verified: boolean;
  stuid: string;
  stuname: string;
  bio: string;
}
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const avatarUpload = `${API_BASE}/api/v2/user/avatar`;
const userStore = useUserStore();
const currentUser = ref<User>({} as User);

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

const beforeUpload = (file: any) => {
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

const handleUploadSuccess = (response: any) => {
  if (response.status == 200) {
    window.location.reload();
    toast.success("头像更新成功");
  } else {
    toast.error(response.message || "上传失败");
  }
};

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

const changePassword = async () => {
  console.log(passwordForm);
  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    ElMessage.error("两次输入的新密码不一致");
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
  } else {
    toast.error(result.message || "修改密码失败");
  }
};

onBeforeMount(async () => {
  try {
    const res = await requestApi("/api/v2/user/me");
    const result = await res.json();
    if (res.ok) {
      currentUser.value = result.data;
      console.log(currentUser.value);
    } else {
      toast.error("加载失败");
    }
  } catch (err) {
    toast.error("网络错误");
    console.error(err);
  }
});
</script>
