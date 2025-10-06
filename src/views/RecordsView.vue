<template>
  <div class="records">
    <div class="page-header">
      <div class="page-title">记录查询</div>
      <div class="filter-controls">
        <van-dropdown-menu>
          <van-dropdown-item v-model="filterType" :options="typeOptions" />
        </van-dropdown-menu>
        <van-field
          v-model="selectedDate"
          readonly
          clickable
          name="date"
          placeholder="选择日期"
          @click="showDatePicker = true"
          class="date-field"
        />
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="records-list">
      <van-empty
        v-if="filteredRecords.length === 0"
        :description="emptyText"
        image="search"
      />
      
      <div
        v-for="record in filteredRecords"
        :key="record.id"
        class="record-item"
        @click="showRecordDetail(record)"
      >
        <div class="record-icon" :class="getRecordTypeClass(record.type)">
          <van-icon :name="getRecordIcon(record.type)" />
        </div>
        
        <div class="record-info">
          <div class="record-main">
            <span class="cigarette-name">{{ record.cigaretteName }}</span>
            <span class="record-price" v-if="record.price">
              ¥{{ record.price.toFixed(2) }}
            </span>
          </div>
          <div class="record-time">
            {{ formatTime(record.timestamp) }}
          </div>
        </div>
        
        <div class="record-type">
          {{ getRecordTypeText(record.type) }}
        </div>
      </div>
    </div>

    <!-- 记录详情弹窗 -->
    <van-popup
      v-model:show="showDetailPopup"
      position="bottom"
      round
      :style="{ height: '40%' }"
    >
      <div class="detail-popup" v-if="selectedRecord">
        <div class="popup-header">
          <div class="popup-title">记录详情</div>
          <van-icon name="cross" @click="showDetailPopup = false" />
        </div>
        
        <div class="detail-content">
          <div class="detail-item">
            <span class="label">香烟品牌:</span>
            <span class="value">{{ selectedRecord.cigaretteName }}</span>
          </div>
          
          <div class="detail-item">
            <span class="label">记录类型:</span>
            <span class="value" :class="getRecordTypeClass(selectedRecord.type)">
              {{ getRecordTypeText(selectedRecord.type) }}
            </span>
          </div>
          
          <div class="detail-item" v-if="selectedRecord.price">
            <span class="label">价格:</span>
            <span class="value">¥{{ selectedRecord.price.toFixed(2) }}</span>
          </div>
          
          <div class="detail-item">
            <span class="label">记录时间:</span>
            <span class="value">{{ formatDetailTime(selectedRecord.timestamp) }}</span>
          </div>
          
          <div class="detail-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDetailTime(selectedRecord.createdAt) }}</span>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 移动端友好的日期选择器 -->
    <van-popup 
      v-model:show="showDatePicker" 
      position="bottom" 
      round
      :style="{ height: '50%' }"
    >
      <div class="date-picker-popup">
        <div class="popup-header">
          <div class="popup-title">选择日期</div>
          <van-icon name="cross" @click="showDatePicker = false" />
        </div>
        
        <div class="date-picker-content">
          <input
            v-model="selectedDate"
            type="date"
            class="mobile-date-input"
            :max="maxDate.toISOString().split('T')[0]"
            :min="minDate.toISOString().split('T')[0]"
            @change="showDatePicker = false"
          />
          
          <div class="date-picker-actions">
            <van-button 
              type="default" 
              size="small" 
              @click="clearDate"
            >
              清除
            </van-button>
            <van-button 
              type="primary" 
              size="small" 
              @click="showDatePicker = false"
            >
              确定
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { db, STORE_RECORDS, RecordType, type Record } from '@/utils/db';
import dayjs from 'dayjs';

// 响应式数据
const records = ref<Record[]>([]);
const filterType = ref('all');
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const showDatePicker = ref(false);
const showDetailPopup = ref(false);
const selectedRecord = ref<Record | null>(null);

// 日期范围
const minDate = new Date(2020, 0, 1);
const maxDate = new Date(new Date().setHours(23, 59, 59, 999));

// 类型选项
const typeOptions = [
  { text: '全部记录', value: 'all' },
  { text: '抽烟', value: RecordType.SMOKE },
  { text: '分烟', value: RecordType.SHARE },
];

// 过滤后的记录
const filteredRecords = computed(() => {
  let filtered = [...records.value];
  
  // 按类型筛选
  if (filterType.value !== 'all') {
    filtered = filtered.filter(record => record.type === filterType.value);
  }
  
  // 按具体日期筛选
  if (selectedDate.value) {
    const selectedDay = dayjs(selectedDate.value);
    filtered = filtered.filter(record => 
      dayjs(record.timestamp).isSame(selectedDay, 'day')
    );
  }
  
  // 按时间倒序排列
  return filtered.sort((a, b) => b.timestamp - a.timestamp);
});

// 空状态文本
const emptyText = computed(() => {
  if (filterType.value === 'all' && !selectedDate.value) {
    return '暂无记录';
  }
  
  let text = '';
  if (filterType.value !== 'all') {
    const typeText = typeOptions.find(opt => opt.value === filterType.value)?.text || '';
    text += typeText;
  }
  
  if (selectedDate.value) {
    const dateText = dayjs(selectedDate.value).format('YYYY年MM月DD日');
    if (text) {
      text += `的${dateText}`;
    } else {
      text = dateText;
    }
  }
  
  return `暂无${text}记录`;
});

// 获取记录类型样式类
const getRecordTypeClass = (type: RecordType) => {
  switch (type) {
    case RecordType.SMOKE:
      return 'type-smoke';
    case RecordType.SHARE:
      return 'type-share';
    default:
      return '';
  }
};

// 获取记录类型图标
const getRecordIcon = (type: RecordType) => {
  switch (type) {
    case RecordType.SMOKE:
      return 'smoke';
    case RecordType.SHARE:
      return 'share';
    default:
      return 'question';
  }
};

// 获取记录类型文本
const getRecordTypeText = (type: RecordType) => {
  switch (type) {
    case RecordType.SMOKE:
      return '抽烟';
    case RecordType.SHARE:
      return '分烟';
    default:
      return '未知';
  }
};

// 格式化时间（相对时间）
const formatTime = (timestamp: number) => {
  const now = dayjs();
  const recordTime = dayjs(timestamp);
  const diff = now.diff(recordTime, 'minute');
  
  if (diff < 1) {
    return '刚刚';
  } else if (diff < 60) {
    return `${diff}分钟前`;
  } else if (diff < 1440) {
    return `${Math.floor(diff / 60)}小时前`;
  } else {
    return recordTime.format('MM-DD HH:mm');
  }
};

// 格式化详细时间
const formatDetailTime = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

// 显示记录详情
const showRecordDetail = (record: Record) => {
  selectedRecord.value = record;
  showDetailPopup.value = true;
};

// 清除日期
const clearDate = () => {
  selectedDate.value = '';
  showDatePicker.value = false;
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
.records {
  padding: 16px;
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px; /* 为底部导航栏留出空间 */
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.date-input {
  width: 120px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #ebedf0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #323233;
  outline: none;
}

.date-input:focus {
  border-color: #1989fa;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.record-icon.type-smoke {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}

.record-icon.type-share {
  background: linear-gradient(135deg, #feca57, #ff9ff3);
}

.record-icon.type-receive {
  background: linear-gradient(135deg, #48dbfb, #0abde3);
}

.record-info {
  flex: 1;
}

.record-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.cigarette-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.record-price {
  font-size: 14px;
  color: #1989fa;
  font-weight: 600;
}

.record-time {
  font-size: 12px;
  color: #969799;
}

.record-type {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f2f3f5;
  color: #969799;
}

.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #969799;
  font-size: 14px;
}

.value {
  color: #323233;
  font-size: 14px;
  font-weight: 500;
}

.value.type-smoke {
  color: #ee5a24;
}

.value.type-share {
  color: #feca57;
}

.value.type-receive {
  color: #0abde3;
}

/* 移动端适配 */
@media (max-width: 414px) {
  .records {
    padding: 12px;
  }
  
  .record-item {
    padding: 12px;
  }
  
  .record-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .detail-content {
    padding: 16px;
  }
}

/* 日期选择器样式 */
.date-picker-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.date-picker-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
}

.mobile-date-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  color: #323233;
  outline: none;
}

.mobile-date-input:focus {
  border-color: #1989fa;
}

.date-picker-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

@media (max-width: 375px) {
  .record-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
