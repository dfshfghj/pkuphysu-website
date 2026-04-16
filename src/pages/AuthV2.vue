<template>
  <div v-if="!showIaaaLogin" class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-100 bg-card rounded-xl shadow-xl overflow-hidden">
      <div class="p-8">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold">欢迎回来</h2>
          <p class="text-sm">登录账户以继续访问</p>
        </div>
        <div class="flex mb-6 border-b border-(--c-border)">
          <button
            class="flex-1 py-3 px-4 text-center relative transition-colors duration-300"
            :class="[activeTab === 'login' ? 'font-semibold border-b-2 border-foreground' : '']"
            @click="switchTab('login')"
          >
            <span>登录</span>
          </button>
          <button
            class="flex-1 py-3 px-4 text-center relative transition-colors duration-300"
            :class="[activeTab === 'register' ? 'font-semibold border-b-2 border-foreground' : '']"
            @click="switchTab('register')"
          >
            <span>注册</span>
          </button>
        </div>

        <form v-show="activeTab === 'login'" class="mb-6" @submit="handleLogin">
          <FieldGroup>
            <Field>
              <Input v-model="loginForm.username" type="text" class="w-full" placeholder="电子邮箱 / 用户名" required />
            </Field>
            <Field>
              <Input v-model="loginForm.password" type="password" class="w-full" placeholder="密码" required />
            </Field>

            <Button type="submit" class="w-full" :disabled="loading">立即登录</Button>
          </FieldGroup>
          <div class="flex justify-between mt-3 text-sm">
            <Label class="text-sm font-normal"><Checkbox v-model="rememberMe" />记住我</Label>
            <a href="#">忘记密码？</a>
          </div>
        </form>

        <form v-show="activeTab === 'register'" class="mb-6" @submit="handleRegister">
          <div class="mb-5">
            <div class="flex gap-3">
              <Input
                v-model="registerForm.email"
                type="email"
                class="flex-1 p-3"
                placeholder="请输入电子邮箱"
                required
              />
              <Button
                type="submit"
                :disabled="isSendingCode || sendCodeCooldown > 0"
                @click="sendVerificationCode"
                class="px-4 py-2"
              >
                {{ sendCodeCooldown > 0 ? `${sendCodeCooldown}s后重发` : "发送验证码" }}
              </Button>
            </div>
          </div>

          <div class="mb-5">
            <Input
              v-model="registerForm.code"
              type="text"
              class="w-full p-3"
              placeholder="请输入验证码"
              maxlength="6"
              required
            />
          </div>

          <Button type="submit" class="w-full py-3" :disabled="isRegistering">
            {{ isRegistering ? "提交中..." : "创建账户" }}
          </Button>

          <div class="flex items-center justify-center mt-4 hidden">
            <label class="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" v-model="agreeTerms" class="mr-1" required /> 我已阅读并同意
              <a href="#" class="text-blue-500 hover:text-blue-700 ml-1">服务条款</a>
            </label>
          </div>
          <div class="text-center mt-3 text-xs text-gray-500">注册成功后可在个人中心设置密码</div>
        </form>

        <div class="my-4 text-center relative">
          <span class="text-sm relative z-10">其他方式登录</span>
          <div class="absolute top-1/2 left-0 w-full h-px border-b border-(--c-border) z-0"></div>
        </div>

        <div class="flex justify-center gap-4">
          <div class="flex flex-col items-center">
            <span class="text-xs"> IAAA </span>
            <button
              class="w-10 h-10 rounded-full flex justify-center items-center cursor-pointer transition-all duration-300 hover:shadow-md"
              title="IAAA登录"
              @click="quickIaaaLogin"
            >
              <img src="../assets/PKU.svg" alt="PKU" class="w-10 h-10 object-contain" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-100 rounded-xl shadow-xl overflow-hidden">
      <div class="p-8 bg-card">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold">IAAA登录</h2>
          <p class="text-sm">使用北京大学统一认证登录</p>
        </div>
        <form class="mb-6" @submit="handleIaaaLoginSubmit">
          <div class="mb-5">
            <Input v-model="iaaaForm.username" type="text" class="w-full p-3" placeholder="学号/工号" required />
          </div>
          <div class="mb-5">
            <Input v-model="iaaaForm.password" type="password" class="w-full p-3" placeholder="IAAA密码" required />
          </div>

          <Button type="submit" class="w-full py-3" :disabled="isIaaaLoggingIn">
            {{ isIaaaLoggingIn ? "登录中..." : "IAAA登录" }}
          </Button>

          <div class="flex justify-center mt-4">
            <a @click="backToMain" class="cursor-pointer text-sm">返回主登录页</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
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

const agreeTerms = ref(true);
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

const switchTab = (tabName: string) => {
  activeTab.value = tabName;
};

const sendVerificationCode = async () => {
  if (!registerForm.email) {
    toast.warning("请输入邮箱地址");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    toast.warning("请输入有效的邮箱地址");
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
      toast.success("验证码已发送，请查收邮箱");
      sendCodeCooldown.value = 60; // 60s
    } else {
      const result = await res.json();
      toast.error(result.message || "发送验证码失败");
    }
  } catch (err) {
    toast.error("网络连接失败，请稍后再试");
    console.error(err);
  } finally {
    isSendingCode.value = false;
  }
};

const handleLogin = async (event: Event) => {
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

      toast.success("登录成功！");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      await router.push(redirect);
    } else {
      toast.error(result.message || "账户或密码错误");
    }
  } catch (err) {
    toast.error("网络连接失败，请稍后再试");
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleRegister = async (event: Event) => {
  event.preventDefault();

  if (!agreeTerms.value) {
    toast.warning("请先同意服务条款");
    return;
  }

  if (!registerForm.email || !registerForm.code) {
    toast.warning("请填写完整信息");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    toast.warning("请输入有效的邮箱地址");
    return;
  }

  if (registerForm.code.length !== 6) {
    toast.warning("验证码应为6位数字");
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

      toast.success("注册成功！欢迎加入物院学生会");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      await router.push(redirect);
    } else {
      toast.error(result.message || "验证码错误或已过期");
    }
  } catch (err) {
    toast.error("网络连接失败，请稍后再试");
    console.error(err);
  } finally {
    isRegistering.value = false;
  }
};

const handleIaaaLoginSubmit = async (event: Event) => {
  event.preventDefault();

  if (!iaaaForm.username || !iaaaForm.password) {
    toast.warning("请输入学号/工号和密码");
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

      toast.success("IAAA登录成功！");
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      await router.push(redirect);
    } else {
      toast.error(result.message || "IAAA登录失败，请检查学号/工号和密码");
    }
  } catch (err) {
    toast.error("网络连接失败或加密错误，请稍后再试");
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
