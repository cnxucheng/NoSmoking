<template>
  <div class="stats">
    <div class="page-header">
      <div class="page-title">数据统计</div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="overview-card">
        <div class="overview-item">
          <div class="overview-value">{{ stats.totalCount }}</div>
          <div class="overview-label">总抽烟数</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">¥{{ stats.totalCost.toFixed(2) }}</div>
          <div class="overview-label">总花费</div>
        </div>
        <div class="overview-item">
          <div class="overview-value">{{ stats.avgPerDay.toFixed(1) }}</div>
          <div class="overview-label">日均抽烟</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-card">
        <div class="chart-title">本周抽烟趋势</div>
        <div class="chart-container">
          <!-- 简单的柱状图实现 -->
          <div class="bar-chart">
            <div
              v-for="(item, index) in chartData"
              :key="index"
              class="bar-item"
            >
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-wrapper">
                <div
                  class="bar"
                  :style="{ height: `${item.percentage}%` }"
                  :class="getBarClass(item.value)"
                ></div>
              </div>
              <div class="bar-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细统计 -->
    <div class="detail-stats">
      <div class="section-title">详细统计</div>
      <div class="stats-list">
        <div class="stat-item">
          <span class="stat-name">最长戒烟时间</span>
          <span class="stat-value">{{ formatDuration(stats.maxQuitTime) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-name">记录天数</span>
          <span class="stat-value">{{ stats.recordDays }}天</span>
        </div>
        <div class="stat-item">
          <span class="stat-name">日均花费</span>
          <span class="stat-value">¥{{ stats.avgCostPerDay.toFixed(2) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-name">单根烟平均价格</span>
          <span class="stat-value">¥{{ stats.avgPricePerCigarette.toFixed(2) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { db, STORE_RECORDS, RecordType, type Record } from '@/utils/db';
import dayjs from 'dayjs';

// 响应式数据
const records = ref<Record[]>([]);

// 计算统计概览
const stats = computed(() => {
  const smokeRecords = records.value.filter(record => 
    record.type === RecordType.SMOKE
  );
  
  const totalCount = smokeRecords.length;
  const totalCost = records.value.reduce((sum, record) => sum + (record.price || 0), 0);
  
  // 计算记录天数
  const recordDays = new Set(
    records.value.map(record => dayjs(record.timestamp).format('YYYY-MM-DD'))
  ).size;

  // 计算日均抽烟数
  const avgPerDay = totalCount / Math.max(recordDays, 1);
  
  // 计算最长戒烟时间
  const maxQuitTime = calculateMaxQuitTime(records.value);
  
  // 计算日均花费
  const avgCostPerDay = totalCost / Math.max(recordDays, 1);
  
  // 计算单根烟平均价格
  const avgPricePerCigarette = totalCount > 0 ? totalCost / totalCount : 0;

  return {
    totalCount,
    totalCost,
    avgPerDay,
    maxQuitTime,
    recordDays,
    avgCostPerDay,
    avgPricePerCigarette
  };
});

// 图表数据
const chartData = computed(() => {
  const smokeRecords = records.value.filter(record =>
    record.type === RecordType.SMOKE
  );
  
  const days = 7; // 周统计固定为7天
  const data = [];

  const hash: { [key: string]: string } = {
    "Monday": "一",
    "Tuesday": "二",
    "Wednesday": "三",
    "Thursday": "四",
    "Friday": "五",
    "Saturday": "六",
    "Sunday": "日"
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const dateStr = hash[date.format('dddd')]; // 显示星期几
    console.log(dateStr);
    
    const dayRecords = smokeRecords.filter(record => 
      dayjs(record.timestamp).isSame(date, 'day')
    );
    
    data.push({
      label: dateStr,
      value: dayRecords.length
    });
  }
  
  // 计算百分比用于柱状图高度
  const maxValue = Math.max(...data.map(item => item.value), 1);
  return data.map(item => ({
    ...item,
    percentage: (item.value / maxValue) * 80
  }));
});

// 获取柱状图样式类
const getBarClass = (value: number) => {
  if (value === 0) return 'bar-zero';
  if (value <= 3) return 'bar-low';
  if (value <= 6) return 'bar-medium';
  return 'bar-high';
};

// 格式化时长
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}小时`;
  } else {
    return `${Math.floor(minutes / 1440)}天`;
  }
};

// 计算最长戒烟时间
const calculateMaxQuitTime = (filteredRecords: Record[]) => {
  const smokeRecords = filteredRecords
    .filter(record => record.type === RecordType.SMOKE)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  let maxQuitTime = 0;
  
  // 计算历史最长戒烟时间
  for (let i = 1; i < smokeRecords.length; i++) {
    const quitTime = smokeRecords[i]!.timestamp - smokeRecords[i - 1]!.timestamp;
    maxQuitTime = Math.max(maxQuitTime, quitTime);
  }
  
  // 计算当前戒烟时间（从最后一次抽烟到现在）
  const now = dayjs();
  const lastSmokeTime = smokeRecords.length > 0 ? smokeRecords[smokeRecords.length - 1]!.timestamp : 0;
  const currentQuitTime = lastSmokeTime > 0 ? now.diff(lastSmokeTime) : 0;
  
  // 取历史最长戒烟时间和当前戒烟时间的最大值
  const finalMaxQuitTime = Math.max(maxQuitTime, currentQuitTime);
  
  return Math.floor(finalMaxQuitTime / (1000 * 60)); // 转换为分钟
};

// 加载记录
const loadRecords = async () => {
  try {
    records.value = await db.getAll(STORE_RECORDS);
  } catch (error) {
    console.error('加载记录失败:', error);
  }
};

// 初始化
onMounted(async () => {
  await loadRecords();
});
</script>

<style scoped>
.stats {
  padding: 16px;
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px; /* 为底部导航栏留出空间 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.stats-overview {
  margin-bottom: 20px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.overview-item {
  text-align: center;
}

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: #1989fa;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 12px;
  color: #969799;
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #323233;
}

.chart-container {
  min-height: 200px;
}

.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding: 0 8px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 40px;
}

.bar-label {
  font-size: 10px;
  color: #969799;
  margin-bottom: 8px;
  text-align: center;
}

.bar-wrapper {
  height: 120px;
  width: 20px;
  background: #f2f3f5;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 10px;
  transition: height 0.3s ease;
}

.bar-zero {
  background: #ebedf0;
}

.bar-low {
  background: linear-gradient(to top, #48dbfb, #0abde3);
}

.bar-medium {
  background: linear-gradient(to top, #feca57, #ff9ff3);
}

.bar-high {
  background: linear-gradient(to top, #ff6b6b, #ee5a24);
}

.bar-value {
  font-size: 10px;
  color: #323233;
  margin-top: 4px;
  font-weight: 600;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pie-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pie-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.pie-label {
  font-size: 14px;
  color: #323233;
  flex: 1;
}

.pie-value {
  font-size: 14px;
  color: #969799;
  font-weight: 600;
}

.detail-stats {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.stats-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-name {
  color: #969799;
  font-size: 14px;
}

.stat-value {
  color: #323233;
  font-size: 14px;
  font-weight: 600;
}



/* 移动端适配 */
@media (max-width: 414px) {
  .stats {
    padding: 12px;
  }
  
  .overview-card {
    padding: 16px;
  }
  
  .overview-value {
    font-size: 20px;
  }
  
  .chart-card {
    padding: 12px;
  }
  
  .bar-item {
    max-width: 30px;
  }
  
  .bar-wrapper {
    width: 16px;
  }
}

@media (max-width: 375px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .overview-card {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
