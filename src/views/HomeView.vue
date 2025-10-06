<template>
  <div class="home">
    <!-- 戒烟计时器 -->
    <QuitTimer :last-record-time="lastRecordTime || undefined" />
    
    <!-- 今日统计 -->
    <div class="stats-section">
      <div class="section-title">今日统计</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ todayStats.count }}</div>
          <div class="stat-label">抽烟数量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">¥{{ todayStats.cost.toFixed(2) }}</div>
          <div class="stat-label">今日花费</div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <div class="section-title">快速记录</div>
      <div class="action-buttons">
        <van-button 
          type="primary" 
          size="large" 
          class="action-btn smoke-btn"
          @click="showRecordModal('smoke')"
        >
          <van-icon name="smoke" class="btn-icon" />
          抽烟记录
        </van-button>
        <van-button 
          type="warning" 
          size="large" 
          class="action-btn share-btn"
          @click="showRecordModal('share')"
        >
          <van-icon name="share" class="btn-icon" />
          分烟记录
        </van-button>
      </div>
    </div>

    <!-- 健康收益统计 -->
    <div class="health-benefits">
      <div class="section-title">健康收益</div>
      <div class="benefits-list">
        <div class="benefit-item">
          <div class="benefit-icon">💓</div>
          <div class="benefit-info">
            <div class="benefit-title">心率改善</div>
            <div class="benefit-desc">戒烟20分钟后心率恢复正常</div>
          </div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">🫁</div>
          <div class="benefit-info">
            <div class="benefit-title">肺部恢复</div>
            <div class="benefit-desc">戒烟2-12周后肺部功能改善</div>
          </div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">🧠</div>
          <div class="benefit-info">
            <div class="benefit-title">大脑恢复</div>
            <div class="benefit-desc">戒烟2-4周后大脑功能改善</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增记录浮层 -->
    <van-popup 
      v-model:show="showRecordPopup" 
      position="bottom" 
      round
      :style="{ height: '60%' }"
    >
      <div class="record-popup">
        <div class="popup-header">
          <div class="popup-title">新增记录</div>
          <van-icon name="cross" @click="showRecordPopup = false" />
        </div>
        
        <div class="popup-content">
          <van-form @submit="submitRecord">
            <!-- 香烟选择 -->
            <van-field
              v-model="recordForm.cigaretteName"
              name="cigarette"
              label="香烟品牌"
              placeholder="请选择香烟"
              readonly
              is-link
              @click="showCigarettePicker = true"
            />
            
            <!-- 记录类型 -->
            <van-field name="type" label="记录类型">
              <template #input>
                <van-radio-group v-model="recordForm.type" direction="horizontal">
                  <van-radio name="smoke">抽烟</van-radio>
                  <van-radio name="share">分烟</van-radio>
                </van-radio-group>
              </template>
            </van-field>

            <!-- 价格显示 -->
            <van-field
              :model-value="recordForm.price.toFixed(2)"
              name="price"
              label="价格"
              placeholder="0.00"
              readonly
            >
              <template #right-icon>
                <span>元</span>
              </template>
            </van-field>

            <div style="margin: 16px;">
              <van-button round block type="primary" native-type="submit">
                确认记录
              </van-button>
            </div>
          </van-form>
        </div>
      </div>
    </van-popup>

    <!-- 香烟选择器 -->
    <van-popup 
      v-model:show="showCigarettePicker" 
      position="bottom" 
      round
    >
      <van-picker
        :columns="cigaretteOptions"
        @confirm="onCigaretteConfirm"
        @cancel="showCigarettePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { showToast } from 'vant';
import QuitTimer from '@/components/QuitTimer.vue';
import { db, STORE_CIGARETTES, STORE_RECORDS, RecordType, type Cigarette, type Record } from '@/utils/db';
import dayjs from 'dayjs';

// 响应式数据
const lastRecordTime = ref<number | null>(null);
const cigarettes = ref<Cigarette[]>([]);
const todayRecords = ref<Record[]>([]);
const showRecordPopup = ref(false);
const showCigarettePicker = ref(false);

// 记录表单
const recordForm = ref({
  cigaretteId: 0,
  cigaretteName: '',
  type: 'smoke' as RecordType,
  price: 0
});

// 计算今日统计
const todayStats = computed(() => {
  const count = todayRecords.value.filter(record => 
    record.type === RecordType.SMOKE
  ).length;
  
  const cost = todayRecords.value.reduce((total, record) => {
    return total + (record.price || 0);
  }, 0);

  return { count, cost };
});

// 默认香烟（不在香烟管理里面）
const defaultCigarette = {
  id: -1,
  name: '接烟',
  price: 0,
  packSize: 1
};

// 香烟选项（包含默认香烟）
const cigaretteOptions = computed(() => {
  const options = cigarettes.value.map(cig => ({
    text: `${cig.name} (¥${cig.price})`,
    value: cig.id
  }));
  
  // 添加默认香烟选项
  options.unshift({
    text: `${defaultCigarette.name} (¥${defaultCigarette.price})`,
    value: defaultCigarette.id
  });
  
  return options;
});

// 显示记录弹窗
const showRecordModal = (type: string) => {
  recordForm.value.type = type as RecordType;
  recordForm.value.cigaretteId = 0;
  recordForm.value.cigaretteName = '';
  recordForm.value.price = 0;
  showRecordPopup.value = true;
};

// 选择香烟确认
const onCigaretteConfirm = ({ selectedOptions }: any) => {
  const selected = selectedOptions[0];
  
  // 处理默认香烟
  if (selected.value === defaultCigarette.id) {
    recordForm.value.cigaretteId = defaultCigarette.id;
    recordForm.value.cigaretteName = defaultCigarette.name;
    recordForm.value.price = 0;
  } else {
    // 处理普通香烟
    const cigarette = cigarettes.value.find(c => c.id === selected.value);
    if (cigarette) {
      recordForm.value.cigaretteId = cigarette.id!;
      recordForm.value.cigaretteName = cigarette.name;
      // 显示每根烟的价格（整包价格 ÷ 一包数量）
      recordForm.value.price = cigarette.price / cigarette.packSize;
    }
  }
  
  showCigarettePicker.value = false;
};

// 提交记录
const submitRecord = async () => {
  if (!recordForm.value.cigaretteId) {
    showToast('请选择香烟品牌');
    return;
  }

  try {
    let cigaretteName = '';
    let price = 0;

    // 处理默认香烟
    if (recordForm.value.cigaretteId === defaultCigarette.id) {
      cigaretteName = defaultCigarette.name;
      price = 0;
    } else {
      // 处理普通香烟
      const cigarette = cigarettes.value.find(c => c.id === recordForm.value.cigaretteId);
      if (!cigarette) {
        showToast('香烟信息不存在');
        return;
      }
      cigaretteName = cigarette.name;
      price = cigarette.price / cigarette.packSize;
    }

    // 创建记录
    const record: Omit<Record, 'id'> = {
      cigaretteId: recordForm.value.cigaretteId,
      cigaretteName: cigaretteName,
      type: recordForm.value.type,
      price: price,
      timestamp: dayjs().valueOf(),
      createdAt: dayjs().valueOf()
    };

    // 保存记录
    await db.add(STORE_RECORDS, record);

    // 重置戒烟计时器（抽烟记录）
    if (recordForm.value.type === RecordType.SMOKE) {
      lastRecordTime.value = record.timestamp;
    }

    showToast('记录成功');
    showRecordPopup.value = false;
    
    // 刷新数据
    await loadData();
  } catch (error) {
    console.error('记录失败:', error);
    showToast('记录失败');
  }
};

// 加载数据
const loadData = async () => {
  try {
    // 加载香烟列表
    cigarettes.value = await db.getAll(STORE_CIGARETTES);
    
    // 加载今日记录
    todayRecords.value = await db.getTodayRecords();
    
    // 获取最新记录时间
    const latestRecord = await db.getLatestRecord();
    if (latestRecord && latestRecord.type === RecordType.SMOKE) {
      lastRecordTime.value = latestRecord.timestamp;
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

// 初始化
onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
.home {
  padding: 16px;
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px; /* 为底部导航栏留出空间 */
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1989fa;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #969799;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
}

.btn-icon {
  margin-right: 8px;
}

.smoke-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border: none;
}

.share-btn {
  background: linear-gradient(135deg, #feca57, #ff9ff3);
  border: none;
}

.receive-btn {
  background: linear-gradient(135deg, #48dbfb, #0abde3);
  border: none;
}

.record-popup {
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

.popup-content {
  flex: 1;
  overflow-y: auto;
}

/* 健康收益统计 */
.health-benefits {
  margin-bottom: 20px;
}

.benefits-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.benefit-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f2f3f5;
}

.benefit-item:last-child {
  border-bottom: none;
}

.benefit-icon {
  font-size: 24px;
  margin-right: 12px;
  width: 40px;
  text-align: center;
}

.benefit-info {
  flex: 1;
}

.benefit-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.benefit-desc {
  font-size: 12px;
  color: #969799;
}

/* 移动端适配 */
@media (max-width: 414px) {
  .home {
    padding: 12px;
  }
  
  .stats-grid {
    gap: 8px;
  }
  
  .stat-card {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .benefit-item {
    padding: 12px;
  }
  
  .benefit-icon {
    font-size: 20px;
    width: 32px;
  }
}

@media (max-width: 375px) {
  .stat-value {
    font-size: 18px;
  }
  
  .action-btn {
    height: 44px;
    font-size: 14px;
  }
  
  .benefit-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .benefit-icon {
    margin-right: 0;
  }
}
</style>
