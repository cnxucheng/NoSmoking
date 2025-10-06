<template>
  <div class="app">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
    
    <!-- 底部导航栏 -->
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item name="home" to="/" icon="home-o">
        首页
      </van-tabbar-item>
      <van-tabbar-item name="cigarettes" to="/cigarettes" icon="smile-o">
        香烟管理
      </van-tabbar-item>
      <van-tabbar-item name="records" to="/records" icon="records">
        记录查询
      </van-tabbar-item>
      <van-tabbar-item name="stats" to="/stats" icon="chart-trending-o">
        数据统计
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeTab = ref('home');

// 监听路由变化，更新激活的标签页
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      activeTab.value = 'home';
    } else if (newPath === '/cigarettes') {
      activeTab.value = 'cigarettes';
    } else if (newPath === '/records') {
      activeTab.value = 'records';
    } else if (newPath === '/stats') {
      activeTab.value = 'stats';
    }
  },
  { immediate: true }
);
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f7f8fa;
  color: #323233;
  line-height: 1.5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: 0; /* 移除底部内边距，由各页面自行控制 */
}

/* 自定义Vant样式 */
.van-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.van-button {
  border-radius: 8px;
}

.van-card {
  border-radius: 12px;
}

.van-cell {
  border-radius: 8px;
}

.van-popup {
  border-radius: 16px;
}

/* 移动端适配 */
@media (max-width: 414px) {
  .main-content {
    padding-bottom: 0; /* 移除底部内边距 */
  }
}

@media (max-width: 375px) {
  .main-content {
    padding-bottom: 0; /* 移除底部内边距 */
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
