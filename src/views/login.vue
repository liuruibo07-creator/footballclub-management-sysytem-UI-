<template>
  <div class="login">
    <el-form
      ref="loginRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      @keyup.enter="handleLogin"
    >
      <!-- 完整队徽 SVG：圆形外框 + 虎头 -->
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 80 80" class="brand-svg" role="img" aria-label="天津津门虎俱乐部队徽">
          <defs>
            <linearGradient id="tigerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1aa6f4" />
              <stop offset="100%" stop-color="#0654b3" />
            </linearGradient>
            <linearGradient id="tigerGradInner" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0a3a78" />
              <stop offset="100%" stop-color="#0e6cc8" />
            </linearGradient>
          </defs>
          <!-- 外圈 + 内圈 -->
          <circle cx="40" cy="40" r="38" fill="url(#tigerGrad)" />
          <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1" />
          <circle cx="40" cy="40" r="33" fill="url(#tigerGradInner)" />
          <!-- 虎耳（两只） -->
          <path d="M22 24 L26 12 L33 22 Z" fill="#0a4f95" />
          <path d="M58 24 L54 12 L47 22 Z" fill="#0a4f95" />
          <!-- 额头"王"字 -->
          <text x="40" y="34" text-anchor="middle" font-size="13" font-weight="900" fill="#fff" font-family="serif">王</text>
          <!-- 虎眼 -->
          <circle class="tiger-eye tiger-eye--left" cx="32" cy="42" r="2.4" fill="#fff" />
          <circle class="tiger-eye tiger-eye--right" cx="48" cy="42" r="2.4" fill="#fff" />
          <circle cx="32" cy="42" r="1" fill="#1aa6f4" />
          <circle cx="48" cy="42" r="1" fill="#1aa6f4" />
          <!-- 鼻子 + 嘴 -->
          <path d="M38 47 L42 47 L40 50 Z" fill="#fff" />
          <path d="M40 50 Q36 54 33 52" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" />
          <path d="M40 50 Q44 54 47 52" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" />
          <!-- 胡须 -->
          <line x1="28" y1="48" x2="16" y2="50" stroke="rgba(255,255,255,0.55)" stroke-width="0.6" />
          <line x1="28" y1="52" x2="16" y2="54" stroke="rgba(255,255,255,0.55)" stroke-width="0.6" />
          <line x1="52" y1="48" x2="64" y2="50" stroke="rgba(255,255,255,0.55)" stroke-width="0.6" />
          <line x1="52" y1="52" x2="64" y2="54" stroke="rgba(255,255,255,0.55)" stroke-width="0.6" />
        </svg>
      </div>

      <h3 class="title">天津津门虎俱乐部管理系统</h3>
      <p class="subtitle">TIANJIN JINMEN TIGER CLUB MANAGEMENT</p>

      <el-form-item prop="username">
        <label for="login-username" class="sr-only">账号</label>
        <el-input
          id="login-username"
          ref="usernameRef"
          v-model.trim="loginForm.username"
          type="text"
          size="large"
          autocomplete="username"
          placeholder="请输入账号"
          aria-label="账号"
        >
          <template #prefix>
            <svg-icon icon-class="user" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <label for="login-password" class="sr-only">密码</label>
        <el-input
          id="login-password"
          v-model="loginForm.password"
          type="password"
          size="large"
          autocomplete="current-password"
          placeholder="请输入密码"
          aria-label="密码"
          show-password
        >
          <template #prefix>
            <svg-icon icon-class="password" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="captchaEnabled" prop="code" class="captcha-item">
        <label for="login-code" class="sr-only">验证码</label>
        <el-input
          id="login-code"
          v-model.trim="loginForm.code"
          size="large"
          autocomplete="off"
          placeholder="请输入验证码"
          aria-label="验证码"
          class="captcha-input"
        >
          <template #prefix>
            <svg-icon icon-class="validCode" class="input-icon" />
          </template>
        </el-input>
        <button
          type="button"
          class="login-code"
          title="点击刷新验证码"
          aria-label="点击刷新验证码"
          @click="getCode"
        >
          <img :src="codeUrl" alt="验证码" />
        </button>
      </el-form-item>

      <div class="form-options">
        <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
        <router-link v-if="register" class="register-link" to="/register">
          注册账号
        </router-link>
      </div>

      <el-button
        :loading="loading"
        size="large"
        type="primary"
        class="login-button"
        @click="onLoginClick"
      >
        <span v-if="!loading" class="login-button-inner">
          <svg class="login-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M12 3 L12 21 M3 12 L21 12 M5.5 5.5 L18.5 18.5 M5.5 18.5 L18.5 5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          登 录
        </span>
        <span v-else>登 录 中...</span>
      </el-button>

      <div class="security-tip">
        <svg-icon icon-class="lock" />
        <span>
          登录即代表您同意遵守
          <a href="#" class="security-link" @click.prevent>俱乐部数据安全规范</a>
        </span>
      </div>
    </el-form>

    <footer class="login-footer">
      <span>Copyright © {{ currentYear }} 天津津门虎俱乐部管理系统</span>
    </footer>
  </div>
</template>

<script setup>
import { getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Cookies from "js-cookie";
import { getCodeImg } from "@/api/login";
import { decrypt, encrypt } from "@/utils/jsencrypt";
import useUserStore from "@/store/modules/user";

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();

const codeUrl = ref("");
const loading = ref(false);
const captchaEnabled = ref(true);
const register = ref(import.meta.env.VITE_APP_REGISTER === "true");
const redirect = ref(undefined);
const currentYear = new Date().getFullYear();
const usernameRef = ref(null);

const data = reactive({
  loginForm: {
    username: "",
    password: "",
    rememberMe: false,
    code: "",
    uuid: ""
  },
  loginRules: {
    username: [
      { required: true, trigger: "blur", message: "请输入账号" }
    ],
    password: [
      { required: true, trigger: "blur", message: "请输入密码" }
    ],
    code: [
      { required: true, trigger: "change", message: "请输入验证码" }
    ]
  }
});

const { loginForm, loginRules } = toRefs(data);

watch(
  () => route.query,
  (query) => {
    redirect.value = query?.redirect;
  },
  { immediate: true }
);

function getCode() {
  getCodeImg()
    .then((res) => {
      captchaEnabled.value =
        res.captchaEnabled === undefined ? true : res.captchaEnabled;

      if (captchaEnabled.value) {
        codeUrl.value = `data:image/gif;base64,${res.img}`;
        loginForm.value.uuid = res.uuid;
        loginForm.value.code = "";
      }
    })
    .catch(() => {
      captchaEnabled.value = false;
    });
}

function getCookie() {
  const username = Cookies.get("username");
  const encryptedPassword = Cookies.get("password");
  const rememberMe = Cookies.get("rememberMe");

  loginForm.value.username = username || "";
  loginForm.value.rememberMe = rememberMe === "true";

  if (encryptedPassword) {
    try {
      loginForm.value.password = decrypt(encryptedPassword) || "";
    } catch {
      loginForm.value.password = "";
      Cookies.remove("password");
    }
  }
}

function handleLogin() {
  proxy.$refs.loginRef.validate((valid) => {
    if (!valid || loading.value) return;

    loading.value = true;

    if (loginForm.value.rememberMe) {
      Cookies.set("username", loginForm.value.username, { expires: 30 });
      Cookies.set("password", encrypt(loginForm.value.password), {
        expires: 30
      });
      Cookies.set("rememberMe", "true", { expires: 30 });
    } else {
      Cookies.remove("username");
      Cookies.remove("password");
      Cookies.remove("rememberMe");
    }

    userStore
      .login(loginForm.value)
      .then(() => {
        router.push({ path: redirect.value || "/" });
      })
      .catch(() => {
        loading.value = false;
        if (captchaEnabled.value) getCode();
      });
  });
}

/**
 * 登录按钮点击：先生成 ripple 涟漪，再调用登录
 */
function onLoginClick(event) {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "login-ripple";
  ripple.style.width = ripple.style.height = `${diameter}px`;
  ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;
  target.appendChild(ripple);
  // 涟漪动画结束后移除元素
  setTimeout(() => ripple.remove(), 600);
  handleLogin();
}

getCode();
getCookie();

/**
 * 页面进入后自动聚焦到账号输入框（除非记住密码已经填上）
 */
onMounted(() => {
  nextTick(() => {
    if (!loginForm.value.username) {
      const inst = usernameRef.value;
      // el-input 实例上有一个 .focus() 方法
      if (inst && typeof inst.focus === "function") {
        inst.focus();
      } else if (inst && inst.$el) {
        const input = inst.$el.querySelector("input");
        if (input) input.focus();
      }
    }
  });
});
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  width: 100%;
  min-width: 320px;
  min-height: 100vh;
  padding: 48px clamp(48px, 8vw, 150px);
  overflow: hidden;
  background-color: #031630;
  background-image: url("@/assets/images/login-background1.jpg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.login::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: "";
  pointer-events: none;
  background: linear-gradient(
    90deg,
    rgba(2, 18, 42, 0.02) 0%,
    rgba(2, 18, 42, 0.05) 48%,
    rgba(2, 18, 42, 0.32) 72%,
    rgba(2, 18, 42, 0.58) 100%
  );
}

.login-form {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: min(420px, 100%);
  padding: 38px 38px 30px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 30px 80px rgba(0, 11, 32, 0.38);
  backdrop-filter: blur(18px);
  animation: cardIn 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}

/* ===== 完整队徽 SVG ===== */
.brand-mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  margin: 0 auto 12px;
  filter: drop-shadow(0 10px 24px rgba(0, 126, 216, 0.32));
}

.brand-svg {
  width: 100%;
  height: 100%;
}

/* 虎眼眨眼睛动效 */
.tiger-eye {
  transform-origin: center;
  transform-box: fill-box;
  animation: blink 4.2s ease-in-out infinite;
}

.tiger-eye--right {
  animation-delay: 0.05s;
}

@keyframes blink {
  0%, 92%, 100% { transform: scaleY(1); }
  94%, 98% { transform: scaleY(0.1); }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* 屏幕阅读器专用：视觉上隐藏但保留语义 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.title {
  margin: 0;
  color: #0a2448;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.45;
  text-align: center;
  letter-spacing: 1px;
}

.subtitle {
  margin: 6px 0 28px;
  color: #7c8da5;
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
  letter-spacing: 1.2px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  padding: 0 15px;
  border: none;
  border-radius: 10px;
  background: #ffffff !important;
  box-shadow: 0 0 0 1px #d9e3ef !important;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #85bfe8 !important;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background: #fff !important;
  box-shadow: 0 0 0 1px #0797df !important,
    0 0 0 3px rgba(7, 151, 223, 0.12) !important;
}

/* 输入框内部文字、占位符、图标统一改回深色，覆盖 dark-console.scss 的暗色规则 */
.login-form :deep(.el-input__inner),
.login-form :deep(.el-input__inner::placeholder),
.login-form :deep(.el-select__placeholder),
.login-form :deep(.el-select__selected-item),
.login-form :deep(.el-range-input) {
  color: #1f2c3d !important;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #94a3b8 !important;
}

.input-icon {
  width: 18px;
  height: 18px;
  color: #6b7a8c !important;
}

.captcha-item :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.login-code {
  flex: 0 0 112px;
  height: 48px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  border: none;
  border-radius: 10px;
  background: #ffffff !important;
  box-shadow: 0 0 0 1px #d9e3ef !important;
  transition: box-shadow 0.2s ease;
}

.login-code:hover {
  box-shadow: 0 0 0 1px #85bfe8 !important;
}

.login-code img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -2px 0 22px;
}

.register-link {
  color: #078bd0;
  font-size: 14px;
  text-decoration: none;
}

.register-link:hover {
  color: #006cb0;
}

.login-button {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(100deg, #00a6ef, #0562c7);
  box-shadow: 0 12px 24px rgba(5, 98, 199, 0.22);
}

.login-button:hover,
.login-button:focus {
  background: linear-gradient(100deg, #11b4f6, #0872da);
}

.login-button-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn-icon {
  width: 18px;
  height: 18px;
  color: #fff;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

.login-button:hover .login-btn-icon,
.login-button:focus .login-btn-icon {
  transform: rotate(360deg);
}

.login-ripple {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  transform: scale(0);
  opacity: 0.6;
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  to {
    transform: scale(2.2);
    opacity: 0;
  }
}

.security-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  color: #93a0b2;
  font-size: 12px;
}

.security-link {
  color: #078bd0;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px dashed rgba(7, 139, 208, 0.4);
  transition: color 0.2s ease, border-color 0.2s ease;
}

.security-link:hover {
  color: #006cb0;
  border-bottom-color: #006cb0;
}

.login-footer {
  position: absolute;
  right: 0;
  bottom: 18px;
  left: 0;
  z-index: 1;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

@media (max-width: 900px) {
  .login {
    justify-content: center;
    padding: 32px 20px 70px;
    background-position: 32% center;
  }

  .login::after {
    background: rgba(2, 18, 42, 0.5);
  }

  .login-form {
    padding: 34px 28px 28px;
  }
}

@media (max-width: 480px) {
  .login-form {
    padding: 30px 20px 24px;
    border-radius: 16px;
  }

  .title {
    font-size: 21px;
  }

  .subtitle {
    margin-bottom: 24px;
    font-size: 9px;
  }

  .login-code {
    flex-basis: 98px;
  }
}
</style>
