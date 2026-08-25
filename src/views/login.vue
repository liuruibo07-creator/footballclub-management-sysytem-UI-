<template>
  <div class="login">
    <el-form
      ref="loginRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      @keyup.enter="handleLogin"
    >
      <div class="brand-mark" aria-hidden="true">
        <span class="brand-mark__ear brand-mark__ear--left"></span>
        <span class="brand-mark__ear brand-mark__ear--right"></span>
        <span class="brand-mark__face">虎</span>
      </div>

      <h3 class="title">天津津门虎俱乐部管理系统</h3>
      <p class="subtitle">TIANJIN JINMEN TIGER CLUB MANAGEMENT</p>

      <el-form-item prop="username">
        <el-input
          v-model.trim="loginForm.username"
          type="text"
          size="large"
          autocomplete="username"
          placeholder="请输入账号"
        >
          <template #prefix>
            <svg-icon icon-class="user" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          autocomplete="current-password"
          placeholder="请输入密码"
          show-password
        >
          <template #prefix>
            <svg-icon icon-class="password" class="input-icon" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="captchaEnabled" prop="code" class="captcha-item">
        <el-input
          v-model.trim="loginForm.code"
          size="large"
          autocomplete="off"
          placeholder="请输入验证码"
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
        @click="handleLogin"
      >
        <span v-if="!loading">登 录</span>
        <span v-else>登 录 中...</span>
      </el-button>

      <div class="security-tip">
        <svg-icon icon-class="lock" />
        <span>登录即代表您同意遵守俱乐部数据安全规范</span>
      </div>
    </el-form>

    <footer class="login-footer">
      <span>Copyright © {{ currentYear }} 天津津门虎俱乐部管理系统</span>
    </footer>
  </div>
</template>

<script setup>
import { getCurrentInstance, reactive, ref, toRefs, watch } from "vue";
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

getCode();
getCookie();
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
  box-sizing: border-box;
  width: min(420px, 100%);
  padding: 38px 38px 30px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 30px 80px rgba(0, 11, 32, 0.38);
  backdrop-filter: blur(18px);
}

.brand-mark {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 54px;
  margin: 0 auto 12px;
  color: #fff;
  border-radius: 18px 18px 22px 22px;
  background: linear-gradient(145deg, #00a9f4, #0756b5);
  box-shadow: 0 10px 24px rgba(0, 126, 216, 0.25);
}

.brand-mark__ear {
  position: absolute;
  top: -5px;
  width: 18px;
  height: 18px;
  border-radius: 5px 12px 5px 12px;
  background: #087ad0;
}

.brand-mark__ear--left {
  left: 5px;
  transform: rotate(-18deg);
}

.brand-mark__ear--right {
  right: 5px;
  transform: scaleX(-1) rotate(-18deg);
}

.brand-mark__face {
  position: relative;
  z-index: 1;
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
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
  border: 1px solid #d9e3ef;
  border-radius: 10px;
  background: #f7faff;
  box-shadow: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #85bfe8;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #0797df;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(7, 151, 223, 0.12);
}

.input-icon {
  width: 18px;
  height: 18px;
  color: #7d91a9;
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
  border: 1px solid #d9e3ef;
  border-radius: 10px;
  background: #f7faff;
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

.security-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  color: #93a0b2;
  font-size: 12px;
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
