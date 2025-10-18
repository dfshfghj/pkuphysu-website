<template>
  <h2 class="page-title">抽奖投点</h2>
  <div class="note-container">
    <el-row :gutter="16" style="margin-bottom: 30px; justify-content: center">
      <el-col :xs="24" :sm="12" :md="8" class="text-center mb-4">
        <el-countdown title="" format="HH:mm:ss" :value="value1" />
      </el-col>
    </el-row>
    <el-alert type="warning" :closable="false" show-icon>
      <template #default>
        <div><strong>投入点数为非负整数，且总和应在 0-99 之间。</strong></div>
      </template>
    </el-alert>
    <el-alert type="warning" :closable="false" show-icon style="margin-top: 8px">
      <template #default>
        <div><strong>注意：只有现场的同学才能抽奖！</strong></div>
      </template>
    </el-alert>
  </div>

  <!-- 投点表单 -->
  <el-form @submit.prevent="submitInvest">
    <el-table :data="prizeData" stripe class="investTable" show-overflow-tooltip>
      <el-table-column label="奖项">
        <template #default="{ row }">
          <strong>{{ row.name }}</strong>
        </template>
      </el-table-column>

      <el-table-column label="信息" prop="desc" />

      <el-table-column label="投点">
        <template #default="{ row }">
          <el-input-number v-model="inputs[row.name]" :min="0" :max="99" :controls="true" placeholder="0" size="small" style="width: 80px" controls-position="right" />
        </template>
      </el-table-column>
    </el-table>

    <!-- 提交区域 -->
    <div class="submit-footer">
      <div class="total-info">
        <span> 当前总点数：</span>
        <el-tag :type="total <= 99 ? 'success' : 'danger'" effect="light">
          {{ total }}
        </el-tag>
        <span> / 99 </span>
        <el-text v-if="total > 99" type="danger" style="margin-left: 10px">⚠️ 超出限制</el-text>
      </div>
      <el-button native-type="submit" type="primary" :loading="submitting" :disabled="total < 0 || total > 99" size="default">
        {{ submitting ? "提交中..." : "提交" }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup>
import { useUserStore } from "../stores/user";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const prizeData = ref([]);
const inputs = ref({});
const submitting = ref(false);
const value1 = ref(Date.now() + 1000 * 60 * 60 * 24 * 2);
const userStore = useUserStore();
const username = userStore.username;

// -------------------------------
// 计算属性：总点数
// -------------------------------

const total = computed(() => {
  return Object.values(inputs.value).reduce((sum, val) => sum + (val || 0), 0);
});

onMounted(async () => {
  try {
    // 获取用户信息与配置
    const configRes = await fetch(`${API_BASE}/api/random_draw/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify({
        username: username,
      }),
    });
    if (!configRes.ok) throw new Error("获取配置失败");
    const config = await configRes.json();

    prizeData.value = config.prizes;

    // 初始化 inputs
    config.prizes.forEach(prize => {
      inputs.value[prize.name] = prize.investment || 0;
    });
  } catch (err) {
    ElMessage.error("加载数据失败：" + (err.message || "网络错误"));
    console.error(err);
  }
});

// -------------------------------
// 提交投点
// -------------------------------

const submitInvest = async () => {
  const pointTotal = total.value;
  if (pointTotal < 0 || pointTotal > 99) {
    ElMessage.warning("总投点必须在 0 到 99 之间！");
    return;
  }

  submitting.value = true;
  try {
    const response = await fetch(`${API_BASE}/api/random_draw/invest`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify(inputs.value),
    });

    const result = await response.json();

    if (response.ok) {
      ElMessage.success(`投点成功！总点数：${pointTotal}`);
    } else {
      ElMessage.error(result.message || "提交失败，请重试");
    }
  } catch (err) {
    ElMessage.error("网络错误，请检查连接");
    console.error(err);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>

.el-table :deep(.el-table__cell) {
  text-align: center;
}

.invest-container {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.page-title {
  text-align: center;
  margin-bottom: 20px;
}

.note-container {
  margin-bottom: 24px;
}
.investTable {
  width: auto;
  margin: 16px 10% 0px 10%;
  border: 1px solid var(--c-border);
  border-radius: 5px;
  box-shadow: 0 10px 30px var(--c-box-shadow);
}

.submit-footer {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 50px;
}

.total-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--ep-text-color-regular);
}

@media (max-width: 768px) {
  .submit-footer {
    flex-direction: column;
    align-items: stretch;
    margin: 0px;
    margin-top: 50px;
  }

  .total-info {
    justify-content: center;
  }

  .investTable {
    margin-top: 16px;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
