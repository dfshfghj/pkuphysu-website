<template>
  <div class="login-bg" id="loginBg">
    <div class="corner-top">
      <svg height="1337" width="1337">
        <defs>
          <path
            id="path-1"
            opacity="1"
            fill-rule="evenodd"
            d="M1337,668.5 C1337,1037.455193874239 1037.455193874239,1337 668.5,1337 C523.6725684305388,1337 337,1236 370.50000000000006,1094 C434.03835568300906,824.6732385973953 6.906089672974592e-14,892.6277623047779 0,668.5000000000001 C0,299.5448061257611 299.5448061257609,1.1368683772161603e-13 668.4999999999999,0 C1037.455193874239,0 1337,299.544806125761 1337,668.5Z"
          />
          <linearGradient
            id="linearGradient-2"
            x1="0.79"
            y1="0.62"
            x2="0.21"
            y2="0.86"
          >
            <stop offset="0" stop-color="#ff6b6b" stop-opacity="1" />
            <stop offset="1" stop-color="#c41212" stop-opacity="1" />
          </linearGradient>
        </defs>
        <g opacity="1">
          <use href="#path-1" fill="url(#linearGradient-2)" fill-opacity="1" />
        </g>
      </svg>
    </div>

    <div class="corner-bottom">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        height="896"
        width="967.8852157128662"
      >
        <defs>
          <path
            id="path-2"
            opacity="1"
            fill-rule="evenodd"
            d="M896,448 C1142.6325445712241,465.5747656464056 695.2579309733121,896 448,896 C200.74206902668806,896 5.684341886080802e-14,695.2579309733121 0,448.0000000000001 C0,200.74206902668806 200.74206902668791,5.684341886080802e-14 447.99999999999994,0 C695.2579309733121,0 475,418 896,448Z"
          />
          <linearGradient id="linearGradient-3" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stop-color="#ff6b6b" stop-opacity="1" />
            <stop offset="1" stop-color="#c41212" stop-opacity="1" />
          </linearGradient>
        </defs>
        <g opacity="1">
          <use href="#path-2" fill="url(#linearGradient-3)" fill-opacity="1" />
        </g>
      </svg>
    </div>
  </div>
  <div class="auth-container">
    <el-card class="auth-card">
      <div class="auth-title">
        <img src="../assets/logo_white.svg" class="logo" v-if="isDark" />
        <img src="../assets/logo_black.svg" class="logo" v-else />
        <h2 style="color: #f53f3f">
          {{ isLogin ? "登录" : "注册" }}到物院学生会
        </h2>
      </div>
      <el-form
        v-if="isLogin"
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="auth-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            clearable
            prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="rememberMe" size="large">记住账号</el-checkbox>
        </div>

        <el-form-item>
          <el-button
            class="tab-btn minor"
            size="large"
            @click="isLogin = false"
          >
            注册
          </el-button>
          <el-button
            class="tab-btn major"
            size="large"
            native-type="submit"
            :loading="loading"
          >
            {{ loading ? "登录中..." : "登 录" }}
          </el-button>
        </el-form-item>
      </el-form>
      <el-form
        v-else
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="auth-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
            clearable
            prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            show-password
            prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            size="large"
            show-password
            prefix-icon="Unlock"
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="success"
            size="large"
            native-type="submit"
            :loading="registering"
            style="width: 100%"
            class="tab-btn minor"
          >
            {{ registering ? "注册中..." : "注 册" }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { requestApi } from "../api/api";
import { useUserStore } from "../stores/user";
import { isDark } from "../composables/theme";

const loginFormRef = ref();
const registerFormRef = ref();

const isLogin = ref(true);
const loading = ref(false);
const registering = ref(false);
const rememberMe = ref(true);
const router = useRouter();
const userStore = useUserStore();

const loginForm = reactive({
  username: "",
  password: "",
});

const loginRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

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

const handleLogin = async () => {
  await loginFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const res = await requestApi("/api/login", {
        method: "POST",
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
        const redirect =
          new URLSearchParams(window.location.search).get("redirect") || "/";
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

const handleRegister = async () => {
  await registerFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    registering.value = true;
    try {
      const res = await requestApi("/api/register", {
        method: "POST",
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        ElMessage.success("注册成功！请登录");
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

.auth-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.auth-card {
  width: 90%;
  padding: 4px;
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

.tab-btn.major,
.tab-btn.major * {
  background: var(--red-1);
  color: var(--red-9);
}

.tab-btn.minor,
.tab-btn.minor * {
  background: var(--pinkpurple-1);
  color: var(--pinkpurple-9);
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
  border-radius: 8px;
}

:deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

.login-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background-color: #fbaca3;
  overflow: hidden;
}

.dark .login-bg {
  background-color: #770813;
}

.corner-top,
.corner-bottom {
  position: absolute;
}

.corner-top {
  top: -1170px;
}

.corner-bottom {
  left: -100px;
  bottom: -760px;
}

@media (min-width: 768px) {
  .auth-card {
    width: 364px;
  }

  .corner-top {
    right: -300px;
    top: -900px;
  }

  .corner-bottom {
    left: -200px;
    bottom: -400px;
  }
}
</style>
