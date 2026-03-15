<template>
  <div v-if="!showIaaaLogin" class="login">
    <div class="header">
      <h2>欢迎回来</h2>
      <p>请登录您的账户以继续访问</p>
    </div>
    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="switchTab('login')">登录</button>
      <button class="tab-btn" :class="{ active: activeTab === 'register' }" @click="switchTab('register')">注册</button>
    </div>
    <form v-show="activeTab === 'login'" class="form-content" @submit="handleLogin">
      <div class="form-group">
        <input v-model="loginForm.username" type="text" class="form-control" placeholder="电子邮箱 / 用户名" required />
      </div>
      <div class="form-group">
        <input v-model="loginForm.password" type="password" class="form-control" placeholder="密码" required />
      </div>

      <button type="submit" class="btn-submit">立即登录</button>

      <div class="extra-links">
        <label><input v-model="rememberMe" type="checkbox" /> 记住我</label>
        <a href="#">忘记密码？</a>
      </div>
    </form>
    <form v-show="activeTab === 'register'" class="form-content" @submit="handleRegister">
      <div class="form-group">
        <div class="input-group">
          <input v-model="registerForm.email" type="email" class="form-control" placeholder="请输入电子邮箱" required />
          <button
            type="button"
            :disabled="isSendingCode || sendCodeCooldown > 0"
            @click="sendVerificationCode"
            class="btn-code"
          >
            {{ sendCodeCooldown > 0 ? `重新发送(${sendCodeCooldown}s)` : "发送验证码" }}
          </button>
        </div>
      </div>
      <div class="form-group">
        <input
          v-model="registerForm.code"
          type="text"
          class="form-control"
          placeholder="请输入验证码"
          maxlength="6"
          required
        />
      </div>

      <button type="submit" class="btn-submit" :disabled="isRegistering">创建账户</button>

      <div class="extra-links" style="justify-content: center; margin-top: 15px">
        <label style="font-size: 12px; color: #666">
          <input type="checkbox" v-model="agreeTerms" required /> 我已阅读并同意
          <a href="#">服务条款</a>
        </label>
      </div>
      <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #999">
        <i class="fas fa-info-circle"></i> 注册成功后可在个人中心设置密码
      </div>
    </form>
    <div class="divider">
      <span>其他方式登录</span>
    </div>

    <div class="social-login">
      <button class="social-btn pku" title="IAAA登录" @click="quickIaaaLogin">
        <img src="../assets/PKU.svg" alt="PKU" class="pku-icon-svg" />
      </button>
    </div>
  </div>
  <div v-else class="login">
    <div class="header">
      <h2>IAAA登录</h2>
      <p>使用北京大学统一认证登录</p>
    </div>

    <form class="form-content" @submit="handleIaaaLoginSubmit">
      <div class="form-group">
        <input v-model="iaaaForm.username" type="text" class="form-control" placeholder="学号/工号" required />
      </div>
      <div class="form-group">
        <input v-model="iaaaForm.password" type="password" class="form-control" placeholder="IAAA密码" required />
      </div>

      <button type="submit" class="btn-submit" :disabled="isIaaaLoggingIn">IAAA登录</button>

      <div class="extra-links" style="justify-content: center">
        <a @click="backToMain" style="cursor: pointer">返回主登录页</a>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watchEffect, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { requestApi } from "../api/api";
import { sha256 } from "../utils";
import { useUserStore } from "../stores/user";

const loginForm = reactive({
  username: "",
  password: "",
});

const registerForm = reactive({
  email: "",
  code: "",
});

const iaaaForm = reactive({
  username: "",
  password: "",
});

const activeTab = ref("login");
const isIaaaLoggingIn = ref(false);
const showIaaaLogin = ref(false);

const agreeTerms = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const isSendingCode = ref(false);
const isRegistering = ref(false);
const sendCodeCooldown = ref(0);
const router = useRouter();
const userStore = useUserStore();

watchEffect(() => {
  if (sendCodeCooldown.value > 0) {
    const timer = setTimeout(() => {
      sendCodeCooldown.value--;
    }, 1000);
    onUnmounted(() => clearTimeout(timer));
  }
});

const switchTab = (tabName) => {
  activeTab.value = tabName;
};

const sendVerificationCode = async () => {
  if (!registerForm.email) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

  isSendingCode.value = true;
  try {
    const res = await requestApi("/api/v2/email/send", {
      method: "POST",
      body: JSON.stringify({
        email: registerForm.email,
      }),
    });

    if (res.ok) {
      ElMessage.success("验证码已发送，请查收邮箱");
      sendCodeCooldown.value = 60; // 60s
    } else {
      const result = await res.json();
      ElMessage.error(result.message || "发送验证码失败");
    }
  } catch (err) {
    ElMessage.error("网络连接失败，请稍后再试");
    console.error(err);
  } finally {
    isSendingCode.value = false;
  }
};

const handleLogin = async (event) => {
  event.preventDefault();

  loading.value = true;
  try {
    const res = await requestApi("/api/v2/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginForm.username,
        password: await sha256(loginForm.password, "hello_pkuphysu"),
      }),
    });

    const result = await res.json();

    if (res.ok) {
      userStore.login({
        token: result.data.token || "dummy-token",
        username: result.data.username || loginForm.username,
        userid: result.data.userid,
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
};

const handleRegister = async (event) => {
  event.preventDefault();

  if (!agreeTerms.value) {
    ElMessage.warning("请先同意服务条款");
    return;
  }

  if (!registerForm.email || !registerForm.code) {
    ElMessage.warning("请填写完整信息");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

  if (registerForm.code.length !== 6) {
    ElMessage.warning("验证码应为6位数字");
    return;
  }

  isRegistering.value = true;
  try {
    const res = await requestApi("/api/v2/email/verify", {
      method: "POST",
      body: JSON.stringify({
        email: registerForm.email,
        code: registerForm.code,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      userStore.login({
        token: result.data.token || "dummy-token",
        username: result.data.username || registerForm.email,
        userid: result.data.userid,
      });

      ElMessage.success("注册成功！欢迎加入物院学生会");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      await router.push(redirect);
    } else {
      ElMessage.error(result.message || "验证码错误或已过期");
    }
  } catch (err) {
    ElMessage.error("网络连接失败，请稍后再试");
    console.error(err);
  } finally {
    isRegistering.value = false;
  }
};

const handleIaaaLoginSubmit = async (event) => {
  event.preventDefault();

  if (!iaaaForm.username || !iaaaForm.password) {
    ElMessage.warning("请输入学号/工号和密码");
    return;
  }

  isIaaaLoggingIn.value = true;
  try {
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqw9PsMk8v9ED/LiLT62I
DnelyIA/s8blyxqNmbgXT4xtq+Y64Bd+THYPZ4dUIRuFmMvPowQm9wL27W3PEtQy
C8VN+TzW/nPzc74fy9cRxgaSh1FXNQBqYZtltb6G5YvwBvZlYdKhE3Oo3noUD0FJ
JC11Nmcy2/x1V2pwXHRy2DHKaWB1EEtQ9dRxuMZolZIpEwWnT4CHfwEvth83kNRp
E8471KJEqyQqmqJt3JRerH4X4p41zQFIxCsrznAwku3b1qm0vgGLQ8t7XEiCjDX0
m5yIJEuW5t1YcteutuJX5+5oXxe2Fo04Wkn1pO6+QoJopqHcHJD5C+7GlnPOLB1c
DQIDAQAB
-----END PUBLIC KEY-----`;

    let encryptedPassword;
    try {
      const { JSEncrypt } = await import("jsencrypt");
      const encrypt = new JSEncrypt();
      encrypt.setPublicKey(publicKey);
      encryptedPassword = encrypt.encrypt(iaaaForm.password);
    } catch {
      if (typeof window !== "undefined" && window.JSEncrypt) {
        const encrypt = new window.JSEncrypt();
        encrypt.setPublicKey(publicKey);
        encryptedPassword = encrypt.encrypt(iaaaForm.password);
      } else {
        throw new Error("RSA加密库不可用");
      }
    }

    const res = await requestApi("/api/v2/iaaa/login", {
      method: "POST",
      body: JSON.stringify({
        username: iaaaForm.username,
        password: encryptedPassword,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      userStore.login({
        token: result.data.token || "dummy-token",
        username: result.data.username || iaaaForm.username,
        userid: result.data.userid,
      });

      ElMessage.success("IAAA登录成功！");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      await router.push(redirect);
    } else {
      ElMessage.error(result.message || "IAAA登录失败，请检查学号/工号和密码");
    }
  } catch (err) {
    ElMessage.error("网络连接失败或加密错误，请稍后再试");
    console.error(err);
  } finally {
    isIaaaLoggingIn.value = false;
  }
};

const quickIaaaLogin = () => {
  showIaaaLogin.value = true;
};

const backToMain = () => {
  showIaaaLogin.value = false;
  iaaaForm.username = "";
  iaaaForm.password = "";
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.login {
  margin: 100px auto;
  background: var(--c-card);
  width: 400px;
  padding: 40px;
  border-radius: 12px;
  box-shadow: var(--c-box-shadow);
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: var(--c-text);
  font-size: 24px;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  font-size: 14px;
}

/* 切换标签 */
.tabs {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--c-border);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.tab-btn.active {
  color: var(--c-primary);
  font-weight: 600;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--c-primary);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  z-index: 2;
}

.form-control {
  width: 100%;
  padding: 12px 15px 12px 15px;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: var(--c-primary);
}

/* 验证码输入组样式 */
.input-group {
  display: flex;
  gap: 10px;
}

.input-group .form-control {
  flex: 1;
}

.btn-code {
  padding: 0 15px;
  background-color: var(--c-card);
  border: 1px solid var(--c-primary);
  color: var(--c-primary);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-code:hover:not(:disabled) {
  background-color: var(--c-hover);
}

.btn-code:disabled {
  border-color: var(--c-border);
  color: #999;
  background-color: #f9f9f9;
  cursor: not-allowed;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background-color: var(--c-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-submit:hover:not(:disabled) {
  filter: brightness(1.2);
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.extra-links {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
}

.extra-links a {
  color: #666;
  text-decoration: none;
}

.extra-links a:hover {
  color: var(--c-primary);
}

/* 第三方登录 */
.divider {
  margin: 25px 0;
  text-align: center;
  position: relative;
}

.divider span {
  padding: 0 10px;
  color: var(--c-text);
  font-size: 13px;
  position: relative;
  z-index: 1;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--c-border);
  z-index: 0;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: all 0.3s;
  color: var(--c-text);
  font-size: 18px;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--c-box-shadow);
}

.pku-icon {
  font-family: "SimHei", "Microsoft YaHei", Arial, sans-serif;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 新增PKU SVG图标的样式 */
.pku-icon-svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.social-btn.pku {
  background: var(--c-label);
  color: white;
  border: 1px solid var(--c-border);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  width: 40px;
  height: 40px;
}

/* 隐藏/显示控制 */
.form-content {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .login {
    width: 90%;
    padding: 25px;
  }

  .input-group {
    flex-direction: column;
    gap: 10px;
  }

  .btn-code {
    padding: 12px;
    width: 100%;
  }
}
</style>
