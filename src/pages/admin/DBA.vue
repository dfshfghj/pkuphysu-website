<template>
  <div>
    <h2 class="font-serif">数据库管理面板</h2>
    <Separator class="my-4" />
    <div class="mb-4 flex flex-wrap gap-2">
      <Button variant="outline" @click="loadTables">刷新表列表</Button>
      <Button @click="createAllTables">创建所有表</Button>
      <Button variant="outline" size="icon" v-if="!currentTable" @click="toggleDisplayMode">
        <LayoutGrid v-if="displayMode === 'card'" class="size-4" />
        <List v-else class="size-4" />
      </Button>
      <Button variant="outline" class="invisible" @click="showMigratePlan">检查迁移</Button>
      <Button variant="destructive" class="invisible" @click="applyMigrate">执行迁移</Button>
    </div>

    <div v-if="!currentTable && displayMode === 'card'" class="grid gap-4 px-7.5 py-2 sm:grid-cols-2 md:grid-cols-3">
      <Card v-for="(tableInfo, name) in tables" :key="name" class="cursor-pointer transition-transform hover:scale-105">
        <CardHeader>
          <CardTitle class="font-serif">{{ name }}</CardTitle>
        </CardHeader>
        <CardContent @click="viewTable(name)">
          <div>
            状态：
            <Badge
              variant="outline"
              :class="tableInfo.exists ? 'border-(--green-3) text-(--green-6)' : 'border-(--red-3) text-(--red-6)'"
            >
              {{ tableInfo.exists ? "存在" : "不存在" }}
            </Badge>
          </div>
          <div class="mt-1">
            数据行数: <strong>{{ tableInfo.rows }}</strong>
          </div>
          <Button
            size="sm"
            variant="destructive"
            class="mt-2"
            @click.stop="truncateTable(name)"
            :disabled="!tableInfo.exists || tableInfo.rows === 0"
          >
            清空
          </Button>
        </CardContent>
      </Card>
    </div>

    <Table v-if="!currentTable && displayMode === 'list'">
      <TableHeader>
        <TableRow>
          <TableHead class="h-9">表名</TableHead>
          <TableHead class="h-9">状态</TableHead>
          <TableHead class="h-9">数据行数</TableHead>
          <TableHead class="h-9 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="[name, tableInfo] in Object.entries(tables)"
          :key="name"
          class="cursor-pointer even:bg-muted/50"
          @click="viewTable(name)"
        >
          <TableCell class="py-1.5">{{ name }}</TableCell>
          <TableCell class="py-1.5">
            <Badge
              variant="outline"
              :class="tableInfo.exists ? 'border-(--green-3) text-(--green-6)' : 'border-(--red-3) text-(--red-6)'"
            >
              {{ tableInfo.exists ? "存在" : "不存在" }}
            </Badge>
          </TableCell>
          <TableCell class="py-1.5">{{ tableInfo.rows }}</TableCell>
          <TableCell class="py-1.5 text-right">
            <Button
              size="sm"
              variant="destructive"
              @click.stop="truncateTable(name)"
              :disabled="!tableInfo.exists || tableInfo.rows === 0"
            >
              清空
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div v-if="currentTable">
      <Breadcrumb class="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink class="cursor-pointer" @click.prevent="backToTables">全部表</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ currentTable }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div class="flex justify-between items-center mb-3">
        <div class="flex items-center gap-2">
          <h4>数据预览 ({{ currentData.count }} 条记录)</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button size="icon" variant="outline" class="size-7" @click="refreshCurrentTable">
                  <RefreshCw class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>刷新</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div class="max-h-100 overflow-auto rounded-md border border-(--c-border)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="h-9 w-12">#</TableHead>
              <TableHead v-for="(col, index) in columns" :key="col" class="h-9 min-w-37.5">
                <div class="table-header-cell">
                  <span>{{ col }}&nbsp;</span>
                  <span class="text-xs italic">{{ info[index] }}</span>
                </div>
              </TableHead>
              <TableHead class="h-9 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(row, rowIndex) in currentData.data"
              :key="rowIndex"
              class="even:bg-muted/50"
              @dblclick="startEdit(row)"
            >
              <TableCell class="py-1.5">{{ rowIndex + 1 }}</TableCell>
              <TableCell v-for="col in columns" :key="col" class="py-1.5">
                <template v-if="editingRow === row">
                  <Textarea
                    v-if="getColumnType(col, row) === 'textarea'"
                    v-model="row[col]"
                    :rows="3"
                    autofocus
                    @keyup.enter="saveEdit(row)"
                    @keyup.escape="cancelEdit(row)"
                  />
                  <Input
                    v-else
                    v-model="row[col]"
                    :type="getColumnType(col, row)"
                    autofocus
                    @keyup.enter="saveEdit(row)"
                    @keyup.escape="cancelEdit(row)"
                    @focus="$event.target.select()"
                  />
                </template>
                <span v-else class="cell-value" @dblclick="startEdit(row)" v-html="formatValueForDisplay(row[col])" />
              </TableCell>
              <TableCell class="py-1.5 text-right">
                <Button variant="link" size="sm" @click="confirmDelete(row)">删除</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div>
        <Button variant="outline" class="mt-2 w-full" @click="addNewRow"><b> + </b></Button>
      </div>
    </div>

    <Dialog :open="migrateVisible" @update:open="migrateVisible = $event">
      <DialogContent class="sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>迁移计划</DialogTitle>
        </DialogHeader>
        <pre class="dialog-pre"><code>{{ migrateOutput }}</code></pre>
        <DialogFooter>
          <Button variant="outline" @click="migrateVisible = false">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="confirmState.open" @update:open="onConfirmOpenChange">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmState.title }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmState.description }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="resolveConfirm(false)">{{ confirmState.cancelText }}</AlertDialogCancel>
          <AlertDialogAction
            :class="confirmState.destructive ? 'bg-destructive text-white hover:bg-destructive/90' : ''"
            @click="resolveConfirm(true)"
          >
            {{ confirmState.confirmText }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import { requestApi } from "../../api/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutGrid, List, RefreshCw } from "lucide-vue-next";
import { toast } from "vue-sonner";

const tables = ref({});
const displayMode = ref("list");
const currentTable = ref(null);
const currentData = ref({ count: 0, data: [], columns: [] });
const migrateOutput = ref("");
const migrateVisible = ref(false);

const editingRow = ref(null);
const tempBackup = ref({});

const columns = computed(() => {
  return currentData.value.columns;
});

const info = computed(() => {
  return currentData.value.types;
});

const isNewRow = (row) => row.__isNew;

const formatValueForDisplay = (val) => {
  if (val === null || val === undefined) return "(null)";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
};

const hasNewlines = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).includes("\n");
};

const getColumnType = (col, row) => {
  const value = row?.[col];
  if (typeof value === "number") return "number";
  if (hasNewlines(value)) return "textarea";

  const sample = currentData.value.data.find((r) => r[col] != null)?.[col];
  return typeof sample === "number" ? "number" : "text";
};

const confirmState = reactive({
  open: false,
  title: "",
  description: "",
  confirmText: "确定",
  cancelText: "取消",
  destructive: false,
  resolve: null,
});

const confirm = (options) =>
  new Promise((resolve) => {
    Object.assign(confirmState, { confirmText: "确定", cancelText: "取消", destructive: false }, options, {
      open: true,
      resolve,
    });
  });

const resolveConfirm = (ok) => {
  confirmState.open = false;
  const resolve = confirmState.resolve;
  confirmState.resolve = null;
  resolve?.(ok);
};

const onConfirmOpenChange = (open) => {
  if (!open && confirmState.open) {
    resolveConfirm(false);
  }
};

const loadTables = async () => {
  try {
    const res = await requestApi("/api/v2/dba/db-tables");
    const data = await res.json();
    tables.value = data.data;
    toast.success("表列表已加载");
  } catch (e) {
    toast.error("加载表失败: " + e.message);
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
    toast.error("获取数据失败: " + e.message);
    backToTables();
  }
};

const backToTables = () => {
  currentTable.value = null;
  currentData.value = { count: 0, data: [] };
  editingRow.value = null;
};

const createAllTables = async () => {
  const ok = await confirm({ title: "提示", description: "确定要创建所有缺失的表吗？" });
  if (!ok) return;

  try {
    await requestApi("/api/v2/dba/db-tables/create-all", { method: "POST" });
    toast.success("已创建所有表");
    await loadTables();
  } catch (e) {
    toast.error("创建失败: " + e.message);
  }
};

const truncateTable = async (tableName) => {
  const ok = await confirm({
    title: "警告",
    description: `确定要清空表 ${tableName} 的所有数据吗？`,
    destructive: true,
  });
  if (!ok) return;

  try {
    await requestApi(`/api/v2/dba/db-tables/${tableName}`, {
      method: "DELETE",
      body: JSON.stringify({ data: "all" }),
    });
    toast.success("已清空");
    await loadTables();
    if (currentTable.value === tableName) {
      currentData.value.data = [];
      currentData.value.count = 0;
    }
  } catch (e) {
    toast.error("清空失败: " + e.message);
  }
};

const startEdit = (row) => {
  if (editingRow.value) return;

  tempBackup.value = { ...row };
  editingRow.value = row;
};

const saveEdit = async (row) => {
  if (!editingRow.value) return;

  try {
    await requestApi(`/api/v2/dba/db-tables/${currentTable.value}`, {
      method: "PUT",
      body: JSON.stringify({ data: [row] }),
    });

    toast.success("保存成功");
    editingRow.value = null;

    if (isNewRow(row)) {
      delete row.__isNew;
      currentData.value.count++;
    }

    await refreshCurrentTable();
  } catch (e) {
    toast.error("保存失败: " + e.message);
    Object.assign(tempBackup.value, row);
    if (isNewRow(row)) {
      currentData.value.data = currentData.value.data.filter((r) => r !== row);
    }
  }
};

const cancelEdit = (row) => {
  if (!editingRow.value || editingRow.value !== row) return;

  if (isNewRow(row)) {
    currentData.value.data = currentData.value.data.filter((r) => r !== row);
  }

  editingRow.value = null;
};

const addNewRow = () => {
  const newRow = { __isNew: true };
  for (const col of columns.value) {
    newRow[col] = "";
  }
  currentData.value.data.push(newRow);
  startEdit(newRow);
};

const confirmDelete = async (row) => {
  const ok = await confirm({ title: "警告", description: "确定要删除这条记录吗？", destructive: true });
  if (!ok) return;

  try {
    await requestApi(`/api/v2/dba/db-tables/${currentTable.value}`, {
      method: "DELETE",
      body: JSON.stringify({ data: [row] }),
    });
    toast.success("删除成功");
    await refreshCurrentTable();
  } catch (e) {
    toast.error("删除失败: " + e.message);
  }
};

const showMigratePlan = async () => {
  try {
    const res = await requestApi("api/v2/dba/db-tables/migrate");
    migrateOutput.value = res.migration;
    migrateVisible.value = true;
  } catch (e) {
    toast.error("获取迁移计划失败: " + e.message);
  }
};

const applyMigrate = async () => {
  const ok = await confirm({
    title: "危险操作",
    description: "确定要应用以上迁移操作吗？此操作不可逆！",
    confirmText: "确认执行",
    destructive: true,
  });
  if (!ok) return;

  try {
    await requestApi("/api/v2/dba/db-tables/migrate", { method: "POST" });
    toast.success("迁移成功！");
    migrateVisible.value = false;
    await loadTables();
  } catch (e) {
    toast.error("迁移失败: " + e.message);
  }
};

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === "card" ? "list" : "card";
};

onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.table-header-cell {
  display: flex;
  align-items: baseline;
  font-family: "Consolas", monospace;
  font-size: 14px;
}

.dialog-pre {
  text-align: left;
  background: var(--gray-2);
  padding: 16px;
  border-radius: 6px;
  max-height: 50vh;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.dialog-pre code {
  font-family: "Consolas", monospace;
  font-size: 14px;
}

.cell-value {
  display: block;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-family: "SFMono-Regular", "Consolas", "DejaVu Sans Mono", monospace;
}
</style>
