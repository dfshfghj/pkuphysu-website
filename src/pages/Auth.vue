<template>
  <div class="auth-container">
    <!-- 认证卡片 -->
    <el-card class="auth-card">
      <!-- 标题与切换 -->
      <div class="tabs">
        <button :class="['tab-btn', { active: isLogin }]" @click="isLogin = true">登录</button>
        <button :class="['tab-btn', { active: !isLogin }]" @click="isLogin = false">注册</button>
      </div>
      <el-form v-if="isLogin" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="auth-form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入学号或用户名" size="large" clearable prefix-icon="UserFilled" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password prefix-icon="Lock" @keyup.enter="handleLogin" />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" native-type="submit" :loading="loading" style="width: 100%">
            {{ loading ? "登录中..." : "登 录" }}
          </el-button>
        </el-form-item>
      </el-form>
      <el-form v-else ref="registerFormRef" :model="registerForm" :rules="registerRules" class="auth-form" @submit.prevent="handleRegister">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" clearable prefix-icon="UserFilled" />
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码（至少6位）" size="large" show-password prefix-icon="Lock" />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" size="large" show-password prefix-icon="Unlock" @keyup.enter="handleRegister" />
        </el-form-item>

        <el-form-item>
          <el-button type="success" size="large" native-type="submit" :loading="registering" style="width: 100%">
            {{ registering ? "注册中..." : "注 册" }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { useUserStore } from "../stores/user";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// --- 组件引用 ---
const loginFormRef = ref();
const registerFormRef = ref();

// --- 数据定义 ---
const isLogin = ref(true); // true=登录，false=注册
const loading = ref(false);
const registering = ref(false);
const rememberMe = ref(true); // 默认记住
const router = useRouter();
const userStore = useUserStore();

// --- 登录表单 ---
const loginForm = reactive({
  username: "",
  password: "",
});

const loginRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

// --- 注册表单 ---
const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
});

const registerRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// --- 登录逻辑 ---
const handleLogin = async () => {
  await loginFormRef.value?.validate(async valid => {
    if (!valid) return;

    loading.value = true;
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        userStore.login({
          token: result.token || "dummy-token",
          username: result.username || loginForm.username,
        });

        ElMessage.success("登录成功！");
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
        await router.push(redirect);
      } else {
        ElMessage.error(result.message || "账户或密码错误");
      }
    } catch (err) {
      ElMessage.error("网络连接失败，请稍后再试");
      console.error(err);
    } finally {
      loading.value = false;
    }
  });
};

// --- 注册逻辑 ---
const handleRegister = async () => {
  await registerFormRef.value?.validate(async valid => {
    if (!valid) return;

    registering.value = true;
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        ElMessage.success("注册成功！请登录");
        // 自动切换到登录页
        isLogin.value = true;
        loginForm.username = registerForm.username;
        loginForm.password = registerForm.password;
      } else {
        ElMessage.error(result.message || "注册失败");
      }
    } catch (err) {
      ElMessage.error("网络错误，请检查连接");
      console.error(err);
    } finally {
      registering.value = false;
    }
  });
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - var(--el-menu-item-height) - 4px);
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.auth-card {
  width: 300px;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 30px var(--c-box-shadow);
}

.tabs {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--c-border);
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.tab-btn.active {
  color: #409eff;
  font-weight: 600;
  border-bottom: 3px solid #409eff;
}

.auth-form {
  margin-top: 10px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: 1px solid var(--c-border);
}

:deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}
</style>
