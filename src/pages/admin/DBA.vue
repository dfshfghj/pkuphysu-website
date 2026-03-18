<template>
  <h2 class="font-serif">数据库管理面板</h2>
  <el-divider />
  <div class="mb-4 flex flex-wrap gap-2">
    <el-button type="primary" plain @click="loadTables">刷新表列表</el-button>
    <el-button type="success" @click="createAllTables">创建所有表</el-button>
    <el-button @click="toggleDisplayMode" v-if="!currentTable">
      <component :is="displayMode === 'card' ? Grid : List" style="width: 16px; height: 16px" />
    </el-button>
    <el-button type="warning" @click="showMigratePlan" style="visibility: hidden">检查迁移</el-button>
    <el-button type="danger" @click="applyMigrate" style="visibility: hidden">执行迁移</el-button>
  </div>

  <el-row v-if="!currentTable && displayMode === 'card'" :gutter="16">
    <el-col v-for="(info, name) in tables" :key="name" :md="8" :sm="12" :xs="24">
      <el-card class="mb-3" shadow="hover" @click="viewTable(name)" style="margin: 10px 30px 10px 30px">
        <template #header>
          <div class="font-bold font-serif">{{ name }}</div>
        </template>
        <div>
          <div>
            状态：
            <el-tag :type="info.exists ? 'success' : 'danger'">
              {{ info.exists ? "存在" : "不存在" }}
            </el-tag>
          </div>
          <div class="mt-1">
            数据行数: <strong>{{ info.rows }}</strong>
          </div>
          <el-button
            size="small"
            type="danger"
            class="mt-2"
            @click.stop="truncateTable(name)"
            :disabled="!info.exists || info.rows === 0"
          >
            清空
          </el-button>
        </div>
      </el-card>
    </el-col>
  </el-row>

  <el-table
    v-if="!currentTable && displayMode === 'list'"
    :data="Object.entries(tables).map(([name, info]) => ({ name, ...info }))"
    stripe
    @row-click="handleRowClick"
  >
    <el-table-column prop="name" label="表名" />
    <el-table-column prop="exists" label="状态">
      <template #default="{ row }">
        <el-tag :type="row.exists ? 'success' : 'danger'">
          {{ row.exists ? "存在" : "不存在" }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="rows" label="数据行数" />
    <el-table-column fixed="right" label="操作">
      <template #default="{ row }">
        <el-button size="small" type="danger" @click="truncateTable(row.name)" :disabled="!row.exists || row.rows === 0"
          >清空</el-button
        >
      </template>
    </el-table-column>
  </el-table>

  <div v-if="currentTable">
    <el-breadcrumb separator="/" class="mb-3">
      <el-breadcrumb-item @click.prevent="backToTables" style="cursor: pointer"> 全部表 </el-breadcrumb-item>
      <el-breadcrumb-item>{{ currentTable }}</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 操作栏 -->
    <div class="flex justify-between items-center mb-3">
      <div style="display: ruby">
        <h4>数据预览 ({{ currentData.count }} 条记录)</h4>
        <el-tooltip content="刷新" placement="top">
          <el-button size="small" circle :icon="Refresh" @click="refreshCurrentTable" />
        </el-tooltip>
      </div>
    </div>

    <!-- 数据表格（支持行内编辑） -->
    <el-table
      :data="currentData.data"
      stripe
      @row-dblclick="startEdit"
      highlight-current-row
      max-height="400px"
      style="text-align: left"
    >
      <el-table-column fixed type="index" width="50" />

      <!-- 动态列：每个字段都变成可编辑单元格 -->
      <el-table-column v-for="(col, index) in columns" :key="col" min-width="150" show-overflow-tooltip>
        <template #header>
          <div class="table-header-cell">
            <!-- 列名 -->
            <span>{{ col }}&nbsp;</span>
            <!-- 数据类型 -->
            <span style="text-overflow: ellipsis; font-style: italic; font-size: 12px">{{ info[index] }}</span>
          </div>
        </template>

        <template #default="{ row }">
          <!-- 编辑状态显示输入框 -->
          <template v-if="editingRow === row">
            <el-input
              v-model="row[col]"
              :type="getColumnType(col, row)"
              :step="isNumberField(col) ? 'any' : undefined"
              :rows="hasNewlines(row[col]) ? 3 : 1"
              @keyup.enter="saveEdit(row)"
              @focus="$event.target.select()"
              @keyup.escape="cancelEdit(row)"
              autofocus
            />
          </template>
          <!-- 非编辑状态显示值 -->
          <template v-else>
            <span class="cell-value" @dblclick="startEdit(row)" v-html="formatValueForDisplay(row[col])"> </span>
          </template>
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="操作">
        <template #default="{ row }">
          <el-button link size="small" type="primary" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div>
      <el-button @click="addNewRow" style="width: 100%"><b> + </b></el-button>
    </div>
  </div>

  <!-- 迁移结果弹窗 -->
  <el-dialog v-model="migrateVisible" title="迁移计划" width="60%">
    <pre class="dialog-pre"><code>{{ migrateOutput }}</code></pre>
    <template #footer>
      <el-button @click="migrateVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { Refresh, Grid, List } from "@element-plus/icons-vue";
import { requestApi } from "../../api/api";

// --- Refs ---
const tables = ref({});
const displayMode = ref("list");
const currentTable = ref(null);
const currentData = ref({ count: 0, data: [], columns: [] });
const migrateOutput = ref("");
const migrateVisible = ref(false);

const editingRow = ref(null);
const tempBackup = ref({});

// --- Computed ---
const columns = computed(() => {
  return currentData.value.columns;
});

const info = computed(() => {
  return currentData.value.types;
});

// 判断是否为新添加的未保存行
const isNewRow = (row) => row.__isNew;

// 格式化显示值（用于v-html）
const formatValueForDisplay = (val) => {
  if (val === null || val === undefined) return "(null)";
  // 将换行符转换为<br>标签，并转义HTML特殊字符
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
};

// 判断字段是否包含换行符（用于决定是否使用textarea）
const hasNewlines = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).includes("\n");
};

// 推断输入框类型（目前只区分 text/number/textarea）
const getColumnType = (col, row) => {
  const value = row?.[col];
  if (typeof value === "number") return "number";
  if (hasNewlines(value)) return "textarea";

  const sample = currentData.value.data.find((r) => r[col] != null)?.[col];
  return typeof sample === "number" ? "number" : "text";
};

const isNumberField = (col) => {
  const sample = currentData.value.data.find((r) => r[col] != null)?.[col];
  return typeof sample === "number";
};

const loadTables = async () => {
  try {
    const res = await requestApi("/api/v2/dba/db-tables");
    const data = await res.json();
    tables.value = data.data;
    ElMessage.success("表列表已加载");
  } catch (e) {
    ElMessage.error("加载表失败: " + e.message);
  }
};

const viewTable = async (tableName) => {
  currentTable.value = tableName;
  await refreshCurrentTable();
};

const refreshCurrentTable = async () => {
  try {
    const res = await requestApi(`/api/v2/dba/db-tables/${currentTable.value}`);
    const data = await res.json();
    currentData.value = data.data;
  } catch (e) {
    ElMessage.error("获取数据失败: " + e.message);
    backToTables();
  }
};

const backToTables = () => {
  currentTable.value = null;
  currentData.value = { count: 0, data: [] };
  editingRow.value = null;
};

const createAllTables = async () => {
  await ElMessageBox.confirm("确定要创建所有缺失的表吗？", "提示", {
    type: "warning",
  }).catch(() => {
    return Promise.reject(new Error("cancel"));
  });

  try {
    await requestApi("/api/v2/dba/db-tables/create-all", { method: "POST" });
    ElMessage.success("已创建所有表");
    await loadTables();
  } catch (e) {
    if (e.message !== "cancel") {
      ElMessage.error("创建失败: " + e.message);
    }
  }
};

const truncateTable = async (tableName) => {
  await ElMessageBox.confirm(`确定要清空表 ${tableName} 的所有数据吗？`, "警告", {
    type: "error",
  }).catch(() => {
    return Promise.reject(new Error("cancel"));
  });

  try {
    await requestApi(`/api/v2/dba/db-tables/${tableName}`, {
      method: "DELETE",
      body: JSON.stringify({ data: "all" }),
    });
    ElMessage.success("已清空");
    await loadTables();
    if (currentTable.value === tableName) {
      currentData.value.data = [];
      currentData.value.count = 0;
    }
  } catch (e) {
    ElMessage.error("清空失败: " + e.message);
  }
};

// 开始编辑某一行
const startEdit = (row) => {
  if (editingRow.value) return; // 防止重复编辑

  // 备份当前行
  tempBackup.value = { ...row };
  editingRow.value = row;
};

// 保存编辑（包括新增和修改）
const saveEdit = async (row) => {
  if (!editingRow.value) return;

  try {
    // 提交整行数据更新（后端应支持 upsert）
    await requestApi(`/api/v2/dba/db-tables/${currentTable.value}`, {
      method: "PUT",
      body: JSON.stringify({ data: [row] }),
    });

    ElMessage.success("保存成功");
    editingRow.value = null;

    // 如果是新行，清除标记并更新计数
    if (isNewRow(row)) {
      delete row.__isNew;
      currentData.value.count++;
    }

    await refreshCurrentTable(); // 重新加载保持一致性（可优化为局部更新）
  } catch (e) {
    ElMessage.error("保存失败: " + e.message);
    // 恢复旧数据
    Object.assign(tempBackup.value, row);
    if (isNewRow(row)) {
      currentData.value.data = currentData.value.data.filter((r) => r !== row);
    }
  }
};

const cancelEdit = (row) => {
  if (!editingRow.value || editingRow.value !== row) return;

  // 如果是新行，直接删除
  if (isNewRow(row)) {
    currentData.value.data = currentData.value.data.filter((r) => r !== row);
  }

  editingRow.value = null;
};

// 新增一行
const addNewRow = () => {
  const newRow = { __isNew: true };
  for (const col of columns.value) {
    newRow[col] = "";
  }
  currentData.value.data.push(newRow); // 插入到顶部
  startEdit(newRow);
};

// 取消新增行
// const cancelNewRow = row => {
//   currentData.value.data = currentData.value.data.filter(r => r !== row);
//   if (editingRow.value === row) {
//     editingRow.value = null;
//   }
// };

// 删除确认
const confirmDelete = async (row) => {
  await ElMessageBox.confirm("确定要删除这条记录吗？", "警告", {
    type: "error",
  }).catch(() => {
    return Promise.reject(new Error("cancel"));
  });

  try {
    // 假设后端接受 DELETE /db-tables/{table}?id=... 或通过 body 删除
    await requestApi(`/api/v2/dba/db-tables/${currentTable.value}`, {
      method: "DELETE",
      body: JSON.stringify({ data: [row] }),
    });
    ElMessage.success("删除成功");
    await refreshCurrentTable();
  } catch (e) {
    ElMessage.error("删除失败: " + e.message);
  }
};

// 显示迁移计划
const showMigratePlan = async () => {
  try {
    const res = await requestApi("api/v2/dba/db-tables/migrate");
    migrateOutput.value = res.migration;
    migrateVisible.value = true;
  } catch (e) {
    ElMessage.error("获取迁移计划失败: " + e.message);
  }
};

// 执行迁移
const applyMigrate = async () => {
  await ElMessageBox.confirm("确定要应用以上迁移操作吗？此操作不可逆！", "危险操作", {
    type: "error",
    confirmButtonText: "确认执行",
    cancelButtonText: "取消",
  }).catch(() => {
    return Promise.reject(new Error("cancel"));
  });

  try {
    await requestApi("/api/v2/dba/db-tables/migrate", { method: "POST" });
    ElMessage.success("迁移成功！");
    migrateVisible.value = false;
    await loadTables();
  } catch (e) {
    ElMessage.error("迁移失败: " + e.message);
  }
};

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === "card" ? "list" : "card";
};

// 添加处理函数
const handleRowClick = (row) => {
  viewTable(row.name);
};

onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.el-table--fit,
.dialog-pre code {
  font-family: "Consolas" !important;
  font-size: 14px;
}

.el-table:deep(input) {
  font-family: "Consolas" !important;
  font-size: 14px;
}

.el-table:deep(.el-input__wrapper) {
  background-color: transparent;
}

.el-card:hover {
  transform: scale(1.05);
}

.dialog-pre {
  text-align: left;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  max-height: 50vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.cell-value {
  display: block;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-family: "SFMono-Regular", "Consolas", "DejaVu Sans Mono", monospace;
}

/* 输入框在表格里更好看 */
.el-input--small .el-input__wrapper {
  padding: 2px 4px;
}

.el-input__inner {
  font-family: "SFMono-Regular", "Consolas", "DejaVu Sans Mono", monospace;
}

.dialog-pre {
  text-align: left;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  max-height: 50vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

/* 设置表格行的鼠标悬停样式 */
.el-table__row {
  cursor: pointer;
}
</style>
