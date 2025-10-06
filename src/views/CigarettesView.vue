<template>
  <div class="cigarettes">
    <div class="page-header">
      <div class="page-title">香烟管理</div>
      <van-button type="primary" size="small" @click="showAddPopup = true">
        <van-icon name="add" />
        添加香烟
      </van-button>
    </div>

    <!-- 香烟列表 -->
    <div class="cigarette-list">
      <van-empty
        v-if="cigarettes.length === 0"
        description="暂无香烟数据"
        image="search"
      />
      
      <div
        v-for="cigarette in cigarettes"
        :key="cigarette.id"
        class="cigarette-item"
      >
        <div class="cigarette-info">
          <div class="cigarette-name">{{ cigarette.name }}</div>
          <div class="cigarette-details">
            <span class="price">¥{{ cigarette.price }}</span>
            <span class="pack-size">{{ cigarette.packSize }}支/包</span>
          </div>
          <div class="cigarette-date">
            添加时间: {{ formatDate(cigarette.createdAt) }}
          </div>
        </div>
        
        <div class="cigarette-actions">
          <van-button
            size="small"
            type="primary"
            @click="editCigarette(cigarette)"
          >
            编辑
          </van-button>
          <van-button
            size="small"
            type="danger"
            @click="deleteCigarette(cigarette.id!)"
          >
            删除
          </van-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <van-popup
      v-model:show="showAddPopup"
      position="bottom"
      round
      :style="{ height: '50%' }"
    >
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">{{ isEditing ? '编辑香烟' : '添加香烟' }}</div>
          <van-icon name="cross" @click="closePopup" />
        </div>
        
        <van-form @submit="submitCigarette" class="cigarette-form">
          <van-field
            v-model="cigaretteForm.name"
            name="name"
            label="香烟名称"
            placeholder="请输入香烟名称"
            :rules="[{ required: true, message: '请输入香烟名称' }]"
          />
          
          <van-field
            v-model="cigaretteForm.price"
            name="price"
            label="价格"
            placeholder="请输入价格"
            type="number"
            :rules="[
              { required: true, message: '请输入价格' },
              { validator: priceValidator, message: '价格必须大于0' }
            ]"
          >
            <template #right-icon>
              <span>元</span>
            </template>
          </van-field>
          
          <van-field
            v-model="cigaretteForm.packSize"
            name="packSize"
            label="一包数量"
            placeholder="请输入一包的数量"
            type="number"
            :rules="[
              { required: true, message: '请输入一包的数量' },
              { validator: packSizeValidator, message: '数量必须大于0' }
            ]"
          >
            <template #right-icon>
              <span>支</span>
            </template>
          </van-field>

          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              {{ isEditing ? '更新' : '添加' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showToast, showConfirmDialog } from 'vant';
import { db, STORE_CIGARETTES, type Cigarette } from '@/utils/db';
import dayjs from 'dayjs';

// 响应式数据
const cigarettes = ref<Cigarette[]>([]);
const showAddPopup = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

// 香烟表单
const cigaretteForm = ref({
  name: '',
  price: 0,
  packSize: 20 // 默认一包20支
});

// 价格验证器
const priceValidator = (val: number) => val > 0;

// 包大小验证器
const packSizeValidator = (val: number) => val > 0;

// 格式化日期
const formatDate = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
};

// 加载香烟列表
const loadCigarettes = async () => {
  try {
    cigarettes.value = await db.getAll(STORE_CIGARETTES);
    // 按创建时间倒序排列
    cigarettes.value.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('加载香烟列表失败:', error);
    showToast('加载失败');
  }
};

// 编辑香烟
const editCigarette = (cigarette: Cigarette) => {
  isEditing.value = true;
  editingId.value = cigarette.id!;
  cigaretteForm.value = {
    name: cigarette.name,
    price: cigarette.price,
    packSize: cigarette.packSize
  };
  showAddPopup.value = true;
};

// 删除香烟
const deleteCigarette = async (id: number) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条香烟记录吗？'
    });
    
    await db.delete(STORE_CIGARETTES, id);
    showToast('删除成功');
    await loadCigarettes();
  } catch (error) {
    // 用户取消删除
    console.log('取消删除');
  }
};

// 提交香烟表单
const submitCigarette = async () => {
  try {
    const now = dayjs().valueOf();
    
    if (isEditing.value && editingId.value) {
      // 更新香烟
      const cigarette: Cigarette = {
        id: editingId.value,
        name: cigaretteForm.value.name,
        price: cigaretteForm.value.price,
        packSize: cigaretteForm.value.packSize,
        createdAt: cigarettes.value.find(c => c.id === editingId.value)!.createdAt,
        updatedAt: now
      };
      
      await db.update(STORE_CIGARETTES, cigarette);
      showToast('更新成功');
    } else {
      // 添加新香烟
      const cigarette: Omit<Cigarette, 'id'> = {
        name: cigaretteForm.value.name,
        price: cigaretteForm.value.price,
        packSize: cigaretteForm.value.packSize,
        createdAt: now,
        updatedAt: now
      };
      
      await db.add(STORE_CIGARETTES, cigarette);
      showToast('添加成功');
    }
    
    closePopup();
    await loadCigarettes();
  } catch (error) {
    console.error('操作失败:', error);
    showToast('操作失败');
  }
};

// 关闭弹窗
const closePopup = () => {
  showAddPopup.value = false;
  isEditing.value = false;
  editingId.value = null;
  cigaretteForm.value = {
    name: '',
    price: 0,
    packSize: 20
  };
};

// 初始化
onMounted(async () => {
  await loadCigarettes();
});
</script>

<style scoped>
.cigarettes {
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

.cigarette-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cigarette-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.cigarette-info {
  flex: 1;
}

.cigarette-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.cigarette-details {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.price {
  color: #1989fa;
  font-weight: 600;
}

.pack-size {
  color: #969799;
}

.cigarette-date {
  font-size: 12px;
  color: #c8c9cc;
}

.cigarette-actions {
  display: flex;
  gap: 8px;
}

.popup-content {
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

.cigarette-form {
  flex: 1;
  overflow-y: auto;
}

/* 移动端适配 */
@media (max-width: 414px) {
  .cigarettes {
    padding: 12px;
  }
  
  .cigarette-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .cigarette-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 375px) {
  .cigarette-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .cigarette-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .cigarette-actions .van-button {
    width: 100%;
  }
}
</style>
