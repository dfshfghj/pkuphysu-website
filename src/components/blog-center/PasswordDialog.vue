<template>
  <el-dialog v-model="internalVisible" title="设置密码" width="500" align-center>
    <el-form :model="passwordForm" label-width="auto">
      <el-form-item label="新密码">
        <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入至少6位密码" />
      </el-form-item>
      <el-form-item label="确认密码">
        <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">稍后设置</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
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

// 组件挂载时检查是否需要设置密码
const checkUserPasswordStatus = async () => {
  if (!userStore.isLoggedIn) return;

  try {
    const res = await requestApi("/api/v2/user/me");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 检查 has_password 字段
    if (data.data && data.data.has_password === false) {
      ElMessage.warning("您尚未设置密码，请尽快设置以保障账户安全");
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
  // 重置表单
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
};

const handleSubmit = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.error("密码长度至少6位");
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
      ElMessage.success("密码设置成功");
      internalVisible.value = false;
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
      emit("success");
    } else {
      ElMessage.error(result.message || "设置密码失败");
    }
  } catch (error) {
    ElMessage.error("网络错误");
    console.error("Password change failed:", error);
  }
};
</script>
