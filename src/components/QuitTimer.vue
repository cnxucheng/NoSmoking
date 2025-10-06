<template>
  <div class="quit-timer">
    <div class="timer-card" :class="timerClass">
      <div class="timer-title">戒烟计时器</div>
      <div class="timer-display">
        <div class="time-unit">
          <span class="time-value">{{ days }}</span>
          <span class="time-label">天</span>
        </div>
        <div class="time-separator">:</div>
        <div class="time-unit">
          <span class="time-value">{{ hours }}</span>
          <span class="time-label">小时</span>
        </div>
        <div class="time-separator">:</div>
        <div class="time-unit">
          <span class="time-value">{{ minutes }}</span>
          <span class="time-label">分钟</span>
        </div>
      </div>
      <div class="encouragement-text">{{ encouragementText }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="progressStyle"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import dayjs from 'dayjs';

interface Props {
  lastRecordTime?: number;
}

const props = defineProps<Props>();

const days = ref(0);
const hours = ref(0);
const minutes = ref(0);
let timer: number | null = null;

// 计算时间差
const calculateTimeDiff = (lastTime: number) => {
  const now = dayjs();
  const last = dayjs(lastTime);
  const diff = now.diff(last);
  
  // 手动计算时间差
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  
  days.value = Math.floor(totalHours / 24);
  hours.value = totalHours % 24;
  minutes.value = totalMinutes % 60;
};

// 更新计时器
const updateTimer = () => {
  if (props.lastRecordTime) {
    calculateTimeDiff(props.lastRecordTime);
  }
};

// 鼓励文案
const encouragementText = computed(() => {
  const totalMinutes = days.value * 24 * 60 + hours.value * 60 + minutes.value;
  
  if (totalMinutes < 30) {
    return '坚持住！每一分钟都是胜利！';
  } else if (totalMinutes < 60) {
    return '太棒了！你已经坚持了半小时！';
  } else if (totalMinutes < 120) {
    return '了不起！一小时过去了！';
  } else if (totalMinutes < 480) {
    return '加油！你正在创造新的记录！';
  } else if (totalMinutes < 1440) {
    return '太厉害了！坚持了一整天！';
  } else if (days.value < 3) {
    return '恭喜！你已经坚持了超过一天！';
  } else if (days.value < 7) {
    return '太棒了！坚持了一周！身体正在恢复！';
  } else if (days.value < 30) {
    return '了不起！坚持了一个月！肺部功能正在改善！';
  } else if (days.value < 90) {
    return '恭喜！坚持了三个月！心血管风险显著降低！';
  } else if (days.value < 365) {
    return '太厉害了！坚持了一年！你做到了！';
  } else {
    return '恭喜！你已经成功戒烟！继续保持！';
  }
});

// 进度条样式
const progressStyle = computed(() => {
  const totalMinutes = days.value * 24 * 60 + hours.value * 60 + minutes.value;
  const maxMinutes = 7 * 24 * 60; // 一周的分钟数
  const progress = Math.min(totalMinutes / maxMinutes, 1);
  
  return {
    width: `${progress * 100}%`
  };
});

// 计时器样式类
const timerClass = computed(() => {
  const totalMinutes = days.value * 24 * 60 + hours.value * 60 + minutes.value;
  
  if (totalMinutes < 60) {
    return 'timer-beginner';
  } else if (totalMinutes < 480) {
    return 'timer-intermediate';
  } else if (totalMinutes < 1440) {
    return 'timer-advanced';
  } else {
    return 'timer-expert';
  }
});

// 初始化计时器
onMounted(() => {
  updateTimer();
  timer = setInterval(updateTimer, 60000); // 每分钟更新一次
});

// 清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 监听props变化
watch(() => props.lastRecordTime, () => {
  updateTimer();
});
</script>

<style scoped>
.quit-timer {
  margin-bottom: 16px;
}

.timer-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.timer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

.timer-beginner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.timer-intermediate {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.timer-advanced {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.timer-expert {
  background: linear-gradient(135deg, #1dd1a1 0%, #10ac84 100%);
}

.timer-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  opacity: 0.9;
}

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 8px;
}

.time-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.time-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.time-separator {
  font-size: 24px;
  font-weight: 700;
  margin: 0 4px;
  opacity: 0.7;
}

.encouragement-text {
  text-align: center;
  font-size: 14px;
  margin-bottom: 12px;
  opacity: 0.9;
  font-weight: 500;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 移动端适配 */
@media (max-width: 414px) {
  .timer-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .time-value {
    font-size: 28px;
  }
  
  .time-separator {
    font-size: 20px;
  }
  
  .timer-title {
    font-size: 14px;
  }
  
  .encouragement-text {
    font-size: 13px;
  }
}

@media (max-width: 375px) {
  .time-value {
    font-size: 24px;
  }
  
  .time-unit {
    margin: 0 6px;
  }
}
</style>
