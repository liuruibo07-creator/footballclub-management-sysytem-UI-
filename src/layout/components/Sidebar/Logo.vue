<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }" :style="{ backgroundColor: sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
    <router-link class="sidebar-logo-link" to="/" aria-label="返回首页">
      <img :src="logo" class="sidebar-logo" alt="天津津门虎俱乐部队徽" />
      <span class="sidebar-title">{{ title }}</span>
    </router-link>
  </div>
</template>

<script setup>
import variables from '@/assets/styles/variables.module.scss'
import logo from '@/assets/images/tianjin-jinmen-tiger.png'
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = "俱乐部管理系统";
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 104px;
  line-height: 104px;
  background: #091321;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    // 覆盖 sidebar.scss 中高优先级的 #app .sidebar-container a { display: inline-block; }
    display: flex !important;
    align-items: center;
    height: 100%;
    width: 100%;
    gap: 10px;
    padding: 0 14px;
    box-sizing: border-box;
    text-align: left;

    & .sidebar-logo {
      width: 48px;
      height: 58px;
      flex-shrink: 0;
      object-fit: contain;
      filter: drop-shadow(0 5px 9px rgba(0, 0, 0, .34));
    }

    & .sidebar-title {
      display: block;
      flex: 1;
      min-width: 0;
      margin: 0;
      color: #f3f6fa !important;
      font-weight: 600;
      overflow: hidden;
      font-size: 14px;
      font-family: "Microsoft YaHei UI", "PingFang SC", sans-serif;
      line-height: 1.35;
      letter-spacing: .3px;
      opacity: 1;
      visibility: visible;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &.collapse {
    height: 104px;

    .sidebar-logo-link {
      justify-content: center;
      gap: 0;
      padding: 0;
    }

    .sidebar-logo {
      width: 42px;
      height: 50px;
    }

    .sidebar-title {
      display: none;
    }
  }
}
</style>
