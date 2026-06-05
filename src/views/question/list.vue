<template>
  <div class="p-2">
    <el-row :gutter="10">
      <!-- 左侧章节树（本波静态 mock，下波接 lazyTree 端点） -->
      <el-col :xs="24" :sm="6" :md="5" :lg="4" :xl="4">
        <el-card shadow="hover" class="chapter-tree-card">
          <template #header>
            <span class="text-sm font-bold">章节</span>
          </template>
          <el-tree
            ref="chapterTreeRef"
            :data="chapterTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            @node-click="handleChapterClick"
          >
            <template #default="{ node }">
              <span class="el-tree-node__label" :title="node.label">{{ node.label }}</span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧主区 -->
      <el-col :xs="24" :sm="18" :md="19" :lg="20" :xl="20">
        <!-- 筛选 -->
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
          <div v-show="showSearch" class="mb-[10px]">
            <el-card shadow="hover">
              <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                <el-form-item label="题型" prop="questionType">
                  <el-select v-model="queryParams.questionType" placeholder="全部" clearable style="width: 120px">
                    <el-option label="选择题" :value="1" />
                    <el-option label="填空题" :value="2" />
                    <el-option label="判断题" :value="3" />
                    <el-option label="计算题" :value="4" />
                    <el-option label="解答题" :value="5" />
                  </el-select>
                </el-form-item>
                <el-form-item label="难度" prop="difficult">
                  <el-select v-model="queryParams.difficult" placeholder="全部" clearable style="width: 120px">
                    <el-option label="1 星" :value="1" />
                    <el-option label="2 星" :value="2" />
                    <el-option label="3 星" :value="3" />
                    <el-option label="4 星" :value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                  <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
                    <el-option label="草稿" value="0" />
                    <el-option label="已发布" value="1" />
                    <el-option label="已删除" value="2" />
                  </el-select>
                </el-form-item>
                <el-form-item label="标签" prop="tagIds">
                  <el-select
                    v-model="queryParams.tagIds"
                    multiple
                    filterable
                    remote
                    :remote-method="onTagSearch"
                    :loading="tagSearching"
                    placeholder="搜索标签筛选"
                    style="width: 280px"
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                  >
                    <el-option
                      v-for="opt in tagOptions"
                      :key="opt.id"
                      :label="opt.name"
                      :value="opt.id"
                    >
                      <span>{{ opt.name }}</span>
                      <span class="text-gray-400 text-xs ml-2">({{ opt.useCount }})</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="关键词" prop="keyWord">
                  <el-input v-model="queryParams.keyWord" placeholder="题干关键词" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </transition>

        <!-- 主表格卡 -->
        <el-card shadow="hover">
          <template #header>
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd">新建题目</el-button>
              </el-col>
              <el-col v-if="useMockData" :span="6">
                <el-tag type="warning" effect="plain">BE 未 ready - 当前显示 mock 数据</el-tag>
              </el-col>
              <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
            </el-row>
          </template>

          <vxe-table
            ref="tableRef"
            v-loading="loading"
            :data="questionList"
            border
            stripe
            :row-config="{ isHover: true }"
            :cell-config="{ height: 60 }"
            :column-config="{ resizable: true }"
            empty-text="暂无题目数据"
          >
            <vxe-column type="seq" width="50" align="center" title="#" />
            <vxe-column field="questionType" title="题型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="qTypeTag(row.questionType)" size="small">{{ qTypeLabel(row.questionType) }}</el-tag>
              </template>
            </vxe-column>
            <vxe-column field="stemText" title="题干" min-width="320">
              <template #default="{ row }">
                <span>{{ truncate(row.stemText, 80) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="difficult" title="难度" width="100" align="center">
              <template #default="{ row }">
                <span class="text-[#f59e0b]">{{ '★'.repeat(row.difficult || 0) }}{{ '☆'.repeat(4 - (row.difficult || 0)) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="status" title="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </vxe-column>
            <vxe-column field="createTime" title="创建时间" width="160" align="center">
              <template #default="{ row }">
                <span>{{ formatTime(row.createTime) }}</span>
              </template>
            </vxe-column>
            <vxe-column title="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
                <el-button v-if="row.status === '0'" link type="success" icon="Promotion" @click="handlePublish(row)">发布</el-button>
                <el-button v-if="row.status !== '2'" link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
              </template>
            </vxe-column>
          </vxe-table>

          <pagination
            v-show="total > 0"
            v-model:page="queryParams.pageIndex"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="QuestionList" lang="ts">
import { listAdminQuestion, lazyTreeKnowledge, publishAdminQuestion, delAdminQuestion, searchAdminFreeTag } from '@/api/admin/question';
import type { FreeTagOption, QuestionKnowledgeNode, QuestionQuery, QuestionVO } from '@/api/admin/question/types';

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const questionList = ref<QuestionVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const useMockData = ref(false);

const queryFormRef = ref<ElFormInstance>();
const tableRef = ref();
const chapterTreeRef = ref();

const queryParams = reactive<QuestionQuery>({
  pageIndex: 1,
  pageSize: 20,
  subjectId: '',
  questionType: null,
  difficult: null,
  keyWord: '',
  status: '',
  tagIds: []
});

// ===== 标签 remote search（H1 Bug2 - list 筛选） =====
// value 用 tag.id（number），BE page 入参 AdminQuestionPageBo.tagIds: List<Long> OR 语义
const tagOptions = ref<FreeTagOption[]>([]);
const tagSearching = ref(false);

const onTagSearch = async (keyword: string) => {
  tagSearching.value = true;
  try {
    const kw = (keyword ?? '').trim();
    const res: any = await searchAdminFreeTag(kw === '' ? null : kw, 20);
    const data: FreeTagOption[] = res?.data ?? [];
    tagOptions.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[QuestionList] freeTagSearch 失败：', err);
    tagOptions.value = [];
  } finally {
    tagSearching.value = false;
  }
};

/**
 * 章节树（POST /admin/question/lazyTree 真接入）
 *
 * BE 一次性返整树（biz_subject ~2k 行内存建树）；FE 头部加 "全部" 哑根用于清筛选。
 * 接口失败兜底空树 + 仍可点 "全部" 不卡死页面。
 */
const chapterTree = ref<Array<QuestionKnowledgeNode | { id: string; name: string; children?: QuestionKnowledgeNode[] }>>([
  { id: '', name: '全部' }
]);

const loadChapterTree = async () => {
  try {
    const res = await lazyTreeKnowledge({});
    const envelope: any = res;
    const data: QuestionKnowledgeNode[] = envelope?.data ?? [];
    chapterTree.value = [{ id: '', name: '全部' }, ...(Array.isArray(data) ? data : [])];
  } catch (err) {
    console.warn('[QuestionList] lazyTree 接口失败，章节树仅显示 "全部"：', err);
    chapterTree.value = [{ id: '', name: '全部' }];
  }
};

/** Mock 兜底数据（BE 未 ready 时） */
const buildMockList = (): QuestionVO[] => {
  const now = Date.now();
  return [
    {
      id: 10001,
      questionType: 1,
      difficult: 2,
      subjectId: '3071001',
      stemText: '若 a + b = 5，则 a - b 不可能等于（  ）',
      stemImg: '',
      freeTag: '代数,基础题',
      status: '1',
      createBy: 'admin',
      createTime: now - 86400000 * 3,
      questionKnowledges: [{ knowledgeId: '3071001005003', source: 'U' as const }]
    },
    {
      id: 10002,
      questionType: 4,
      difficult: 3,
      subjectId: '3071001',
      stemText: '计算：(2x + 3)(x - 1)',
      stemImg: '',
      freeTag: '代数,计算',
      status: '1',
      createBy: 'admin',
      createTime: now - 86400000 * 2
    },
    {
      id: 10003,
      questionType: 2,
      difficult: 1,
      subjectId: '3071001',
      stemText: '请填空：勾股定理 a² + b² = ____',
      stemImg: '',
      freeTag: '几何,基础',
      status: '0',
      createBy: 'admin',
      createTime: now - 86400000
    },
    {
      id: 10004,
      questionType: 3,
      difficult: 1,
      subjectId: '3071001',
      stemText: '所有整数都是有理数（  ）',
      stemImg: '',
      freeTag: '判断',
      status: '1',
      createBy: 'admin',
      createTime: now - 3600000 * 12
    },
    {
      id: 10005,
      questionType: 5,
      difficult: 4,
      subjectId: '3081001',
      stemText: '证明：直角三角形中两直角边平方和等于斜边平方',
      stemImg: '',
      freeTag: '几何,证明',
      status: '0',
      createBy: 'admin',
      createTime: now - 3600000
    }
  ];
};

/** 查询题目列表（BE 未 ready 时降级 mock） */
const getList = async () => {
  loading.value = true;
  try {
    const res = await listAdminQuestion(queryParams);
    // RuoYi 拦截器成功时 return res.data → 业务侧拿到的是 { code, msg, data: MisiktPageVo }
    // axios type 标的是 AxiosPromise<T>，但拦截器把 res 直接展平了，这里 res 等同 envelope object
    const envelope: any = res;
    const pageData = envelope?.data ?? envelope?.rows;
    if (pageData) {
      questionList.value = pageData.list ?? pageData.rows ?? [];
      total.value = pageData.total ?? 0;
      useMockData.value = false;
    } else {
      throw new Error('empty page response');
    }
  } catch (err) {
    // BE 未 ready / 500 / 拦截器 reject — 走 mock 兜底，保证页面可渲染
    console.warn('[QuestionList] BE 接口失败，使用 mock 兜底:', err);
    questionList.value = buildMockList();
    total.value = questionList.value.length;
    useMockData.value = true;
  } finally {
    loading.value = false;
  }
};

/** 章节树点击 */
const handleChapterClick = (node: { id: string; name: string }) => {
  queryParams.subjectId = node.id || '';
  queryParams.pageIndex = 1;
  getList();
};

/** 搜索 */
const handleQuery = () => {
  queryParams.pageIndex = 1;
  getList();
};

/** 重置 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.subjectId = '';
  queryParams.questionType = null;
  queryParams.difficult = null;
  queryParams.keyWord = '';
  queryParams.status = '';
  queryParams.tagIds = [];
  queryParams.pageIndex = 1;
  getList();
};

/** 新建（占位 — V-8 接编辑器） */
const handleAdd = () => {
  router.push({ path: '/question/edit' });
};

/** 编辑 */
const handleEdit = (row: QuestionVO) => {
  router.push({ path: `/question/edit/${row.id}` });
};

/** 发布（V-3）— status 0→1 单向，状态机由 BE service 层兜底（已发布再发返 500） */
const handlePublish = async (row: QuestionVO) => {
  // ⚠️ row.id 是字符串（Snowflake 19 位），全程不走 Number()
  const idStr = String(row.id);
  try {
    await proxy?.$modal.confirm(`确认发布题目 #${idStr}？发布后不可改为草稿。`);
  } catch {
    return; // 用户取消
  }
  try {
    const res: any = await publishAdminQuestion(idStr);
    if (res?.code === 200) {
      proxy?.$modal.msgSuccess('发布成功');
      getList();
    } else {
      proxy?.$modal.msgError(res?.msg || '发布失败');
    }
  } catch (err: any) {
    proxy?.$modal.msgError(err?.message || '发布失败');
  }
};

/** 软删（V-2）— biz_paper_question 引用校验由 BE 兜底（被引用题返 500 提示） */
const handleDelete = async (row: QuestionVO) => {
  const idStr = String(row.id);
  try {
    await proxy?.$modal.confirm(`确认软删题目 #${idStr}？已被试卷引用的题会被拒绝。`);
  } catch {
    return;
  }
  try {
    const res: any = await delAdminQuestion(idStr);
    if (res?.code === 200) {
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

const qTypeLabel = (t: number) => ({ 1: '选择', 2: '填空', 3: '判断', 4: '计算', 5: '解答' }[t] ?? '未知');
const qTypeTag = (t: number) => (['', 'primary', 'success', 'warning', 'info', 'danger'][t] ?? '') as any;

const statusLabel = (s: string) => ({ '0': '草稿', '1': '已发布', '2': '已删除' }[s] ?? s);
const statusTag = (s: string) => (({ '0': 'info', '1': 'success', '2': 'danger' }[s] ?? '') as any);

const truncate = (s: string | undefined, n: number) => {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
};

const formatTime = (ts?: number | string) => {
  if (!ts) return '-';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

onMounted(() => {
  loadChapterTree();
  // H1 Bug2：预拉热门标签 top 20，筛选区下拉无输入也能看候选
  onTagSearch('');
  getList();
});
</script>

<style scoped>
.chapter-tree-card {
  min-height: 600px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
</style>
