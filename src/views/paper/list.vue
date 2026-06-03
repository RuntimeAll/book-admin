<template>
  <div class="p-2">
    <!-- 筛选 -->
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="卷名" prop="name">
              <el-input v-model="queryParams.name" placeholder="试卷名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="草稿" value="0" />
                <el-option label="已发布" value="1" />
                <el-option label="已删除" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <!-- 主表格 -->
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd">新建试卷</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="paperList" border stripe>
        <el-table-column type="index" width="50" align="center" label="#" />
        <el-table-column prop="name" label="卷名" min-width="240" show-overflow-tooltip />
        <el-table-column prop="questionCount" label="题数" width="80" align="center">
          <template #default="{ row }">{{ row.questionCount ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="score" label="总分" width="80" align="center">
          <template #default="{ row }">{{ row.score ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageIndex"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="PaperList" lang="ts">
import { listAdminPaper, delAdminPaper } from '@/api/admin/paper';
import type { PaperQuery, PaperVO } from '@/api/admin/paper/types';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const paperList = ref<PaperVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const queryParams = reactive<PaperQuery>({
  pageIndex: 1,
  pageSize: 20,
  name: '',
  status: ''
});

/** 拉卷库列表（POST /admin/paper/page，响应 MisiktPageVo: data.list + data.total） */
const getList = async () => {
  loading.value = true;
  try {
    const res: any = await listAdminPaper(queryParams);
    // RuoYi envelope: res = {code, msg, data}；data = MisiktPageVo: {total, list, ...}
    const pageVo = res?.data ?? res;
    paperList.value = pageVo?.list ?? [];
    total.value = pageVo?.total ?? 0;
  } catch (err: any) {
    proxy?.$modal.msgError('加载失败：' + (err?.message ?? '未知错误'));
    paperList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.pageIndex = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.name = '';
  queryParams.status = '';
  queryParams.pageIndex = 1;
  getList();
};

const handleAdd = () => {
  router.push('/paper/edit');
};

const handleEdit = (row: PaperVO) => {
  router.push(`/paper/edit/${row.id}`);
};

const handleDelete = async (row: PaperVO) => {
  try {
    await proxy?.$modal.confirm(`确认删除试卷「${row.name}」？`);
  } catch {
    return;
  }
  try {
    const res: any = await delAdminPaper(String(row.id));
    if (res?.code === 200 || res?.code === undefined) {
      proxy?.$modal.msgSuccess('删除成功');
      getList();
    } else {
      proxy?.$modal.msgError(res?.msg || '删除失败');
    }
  } catch (err: any) {
    proxy?.$modal.msgError(err?.message || '删除失败');
  }
};

// ===== 工具方法 =====
const statusLabel = (s: string) => ({ '0': '草稿', '1': '已发布', '2': '已删除' }[s] ?? s);
const statusTag = (s: string) => (({ '0': 'info', '1': 'success', '2': 'danger' }[s] ?? '') as any);

const formatTime = (ts?: number | string) => {
  if (!ts) return '-';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

onMounted(() => {
  getList();
});
</script>
