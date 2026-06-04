<template>
  <div class="p-2">
    <!-- 顶部页头 -->
    <el-card shadow="hover" class="mb-[10px]">
      <div class="flex items-center justify-between">
        <el-page-header @back="handleBack">
          <template #content>
            <span class="text-base font-bold">{{ editId ? `编辑题目 #${editId}` : '新建题目' }}</span>
          </template>
        </el-page-header>
        <div>
          <el-button @click="handleBack">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存草稿</el-button>
        </div>
      </div>
    </el-card>

    <el-card v-loading="loading" shadow="hover">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <!-- 章节 -->
        <el-form-item label="章节" prop="subjectId">
          <el-tree-select
            v-model="form.subjectId"
            :data="chapterTree"
            :props="treeProps"
            node-key="id"
            placeholder="请选择章节"
            check-strictly
            :render-after-expand="false"
            filterable
            style="width: 360px"
          />
        </el-form-item>

        <!-- 题型 -->
        <el-form-item label="题型" prop="questionType">
          <el-radio-group v-model="form.questionType">
            <el-radio :value="1">选择题</el-radio>
            <el-radio :value="2">填空题</el-radio>
            <el-radio :value="3">判断题</el-radio>
            <el-radio :value="4">计算题</el-radio>
            <el-radio :value="5">解答题</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 难度 -->
        <el-form-item label="难度" prop="difficult">
          <el-rate v-model="form.difficult" :max="4" />
        </el-form-item>

        <!-- 题干文本 -->
        <el-form-item label="题干文本" prop="stemText">
          <el-input v-model="form.stemText" type="textarea" :rows="4" placeholder="题干文本（与题干图至少填一项）" />
        </el-form-item>

        <!-- 答案文本（PRD-B-006 收尾） -->
        <el-form-item label="答案文本">
          <el-input
            v-model="form.answerText"
            type="textarea"
            :autosize="{ minRows: 2 }"
            placeholder="填空/解答题的答案文本，选择题留空"
          />
        </el-form-item>

        <!-- 解析文本（PRD-B-006 收尾） -->
        <el-form-item label="解析文本">
          <el-input
            v-model="form.explainText"
            type="textarea"
            :autosize="{ minRows: 2 }"
            placeholder="解题思路/解析说明，可选"
          />
        </el-form-item>

        <!-- 题干图 -->
        <el-form-item label="题干图">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="(opts: any) => doUpload(opts, 'stem')"
            accept=".png,.jpg,.jpeg"
          >
            <div v-if="form.stemImgUrl" class="upload-preview">
              <img :src="form.stemImgUrl" />
              <el-icon class="close-btn" @click.stop="form.stemImgUrl = ''"><Close /></el-icon>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>题干图</span>
            </div>
          </el-upload>
          <div class="upload-tip">支持 png/jpg/jpeg，单图 ≤ 5MB</div>
        </el-form-item>

        <!-- 选项（仅选择题） -->
        <el-form-item v-if="form.questionType === 1" label="选项">
          <div class="options-wrap">
            <div v-for="(opt, idx) in form.options" :key="idx" class="option-row">
              <span class="option-key">{{ opt.key }}</span>
              <el-input
                v-model="opt.content"
                type="textarea"
                :rows="1"
                :autosize="{ minRows: 1, maxRows: 3 }"
                :placeholder="`选项 ${opt.key} 内容`"
                style="flex: 1; margin-right: 8px"
              />
              <el-button
                v-if="form.options.length > 2"
                link
                type="danger"
                icon="Delete"
                @click="removeOption(idx)"
              >删除</el-button>
            </div>
            <el-button
              v-if="form.options.length < 10"
              type="primary"
              plain
              icon="Plus"
              size="small"
              @click="addOption"
            >新增选项</el-button>
          </div>
        </el-form-item>

        <!-- 正确答案 -->
        <el-form-item label="正确答案" prop="correctAnswer">
          <template v-if="form.questionType === 1">
            <el-input
              v-model="form.correctAnswer"
              placeholder="如 A 或 AB（多选）"
              style="width: 240px"
              @input="form.correctAnswer = ($event || '').toUpperCase()"
            />
            <span class="ml-2 text-xs text-gray-400">每个字符必须出现在已添加的选项 key 中</span>
          </template>
          <template v-else-if="form.questionType === 3">
            <el-radio-group v-model="form.correctAnswer">
              <el-radio value="正确">正确</el-radio>
              <el-radio value="错误">错误</el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="form.questionType === 4">
            <el-input v-model="form.correctAnswer" placeholder="计算结果" style="width: 360px" />
          </template>
          <template v-else>
            <el-input v-model="form.correctAnswer" type="textarea" :rows="3" placeholder="参考答案" />
          </template>
        </el-form-item>

        <!-- 答案图（非选择题显示） -->
        <el-form-item v-if="form.questionType !== 1" label="答案图">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="(opts: any) => doUpload(opts, 'answer')"
            accept=".png,.jpg,.jpeg"
          >
            <div v-if="form.answerImgUrl" class="upload-preview">
              <img :src="form.answerImgUrl" />
              <el-icon class="close-btn" @click.stop="form.answerImgUrl = ''"><Close /></el-icon>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>答案图</span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 解析图 -->
        <el-form-item label="解析图">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="(opts: any) => doUpload(opts, 'explain')"
            accept=".png,.jpg,.jpeg"
          >
            <div v-if="form.explainImgUrl" class="upload-preview">
              <img :src="form.explainImgUrl" />
              <el-icon class="close-btn" @click.stop="form.explainImgUrl = ''"><Close /></el-icon>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>解析图</span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 知识点 -->
        <el-form-item label="知识点" prop="knowledgeIds">
          <el-tree-select
            v-model="form.knowledgeIds"
            :data="knowledgeTree"
            :props="treeProps"
            node-key="id"
            placeholder="请选择知识点（≥1，仅叶子节点可选）"
            multiple
            check-strictly
            :render-after-expand="false"
            filterable
            style="width: 560px"
            :check-on-click-node="false"
          />
          <div class="text-xs text-gray-400 mt-1">
            提交时只保留叶子节点（hasChildren=false），非叶子节点会被忽略
          </div>
        </el-form-item>

        <!-- ===== 标签（PRD-B-006 D+E：自定义面板 = 推荐主视觉 + 5 档范围 chip + 全库搜索）===== -->
        <el-form-item label="标签">
          <div class="tag-selector-wrap" style="width: 560px">
            <!-- 已选 chip 展示行 + 触发下拉的输入框 -->
            <el-popover
              v-model:visible="tagPanelVisible"
              trigger="click"
              placement="bottom-start"
              :width="560"
              :show-arrow="false"
              popper-class="tag-panel-popper"
              @after-leave="freeTagInput = ''"
            >
              <!-- 触发器：模拟 el-select multiple 外观 -->
              <template #reference>
                <div
                  class="tag-trigger"
                  :class="{ 'is-focus': tagPanelVisible }"
                  @click="tagPanelVisible = !tagPanelVisible"
                >
                  <!-- 已选 chip -->
                  <el-tag
                    v-for="tagName in form.tagNames"
                    :key="tagName"
                    closable
                    size="small"
                    class="mr-1 mb-1"
                    @close.stop="removeTag(tagName)"
                  >
                    {{ tagName }}
                  </el-tag>
                  <!-- 占位符 -->
                  <span v-if="form.tagNames.length === 0" class="tag-placeholder">
                    点击选择标签 / 输入新标签
                  </span>
                  <!-- 下拉箭头图标 -->
                  <el-icon class="tag-arrow" :class="{ 'is-rotate': tagPanelVisible }">
                    <ArrowDown />
                  </el-icon>
                </div>
              </template>

              <!-- ===== 下拉面板内容 ===== -->
              <div class="tag-panel" @click.stop>

                <!-- 推荐区（主视觉） -->
                <div class="tag-panel-section">
                  <div class="tag-panel-section-header">
                    <span class="tag-panel-section-title">当前知识点关联（按共现频次）</span>
                    <span v-if="recommendLoading" class="tag-panel-loading">加载中...</span>
                  </div>

                  <!-- 5 档范围切换 chip -->
                  <div class="tag-scope-chips">
                    <el-radio-group v-model="currentScope" size="small" @change="onScopeChange">
                      <el-radio-button :value="5">叶子</el-radio-button>
                      <el-radio-button :value="4">节</el-radio-button>
                      <el-radio-button :value="3">章</el-radio-button>
                      <el-radio-button :value="2">学期</el-radio-button>
                      <el-radio-button :value="1">学段</el-radio-button>
                    </el-radio-group>
                  </div>

                  <!-- 推荐标签列表 -->
                  <div class="tag-recommend-body">
                    <!-- 空态：未选知识点 -->
                    <div v-if="form.knowledgeIds.length === 0" class="tag-empty-hint">
                      选完知识点后这里会自动推荐相关标签
                    </div>
                    <!-- 空态：有知识点但推荐返空 -->
                    <div v-else-if="!recommendLoading && recommendedTags.length === 0" class="tag-empty-hint">
                      该范围下暂无共现标签，试试扩大范围或搜全库
                    </div>
                    <!-- 推荐列表 -->
                    <div v-else class="tag-recommend-list">
                      <label
                        v-for="tag in recommendedTags"
                        :key="tag.tagId"
                        class="tag-recommend-item"
                        :class="{ 'is-checked': form.tagNames.includes(tag.tagName) }"
                        @click="toggleTag(tag.tagName)"
                      >
                        <el-checkbox
                          :model-value="form.tagNames.includes(tag.tagName)"
                          @change="toggleTag(tag.tagName)"
                          @click.stop
                        />
                        <span class="tag-name">{{ tag.tagName }}</span>
                        <span class="tag-co-count">共现 {{ tag.coCount }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- 分割线 -->
                <el-divider class="my-2" />

                <!-- 全库搜索区 -->
                <div class="tag-panel-section">
                  <div class="tag-panel-section-header">
                    <span class="tag-panel-section-title">搜索全库</span>
                  </div>
                  <div class="tag-search-row">
                    <el-input
                      v-model="globalSearchKeyword"
                      placeholder="输入关键词搜索已有标签"
                      size="small"
                      clearable
                      style="flex: 1"
                      @input="onGlobalSearch"
                      @keydown.enter.prevent="tryAddFreeTag(globalSearchKeyword)"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                  </div>
                  <!-- 全库搜索结果 -->
                  <div v-if="globalSearchKeyword" class="tag-search-results">
                    <div v-if="tagSearching" class="tag-empty-hint">搜索中...</div>
                    <div v-else-if="tagOptions.length === 0" class="tag-empty-hint">
                      未找到匹配标签 —
                      <el-button link type="primary" size="small" @click="tryAddFreeTag(globalSearchKeyword)">
                        直接新建"{{ globalSearchKeyword }}"
                      </el-button>
                    </div>
                    <div v-else class="tag-recommend-list">
                      <label
                        v-for="opt in tagOptions"
                        :key="opt.id"
                        class="tag-recommend-item"
                        :class="{ 'is-checked': form.tagNames.includes(opt.name) }"
                        @click="toggleTag(opt.name)"
                      >
                        <el-checkbox
                          :model-value="form.tagNames.includes(opt.name)"
                          @change="toggleTag(opt.name)"
                          @click.stop
                        />
                        <span class="tag-name">{{ opt.name }}</span>
                        <span class="tag-co-count">({{ opt.useCount }})</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- 自由标签输入区 -->
                <el-divider class="my-2" />
                <div class="tag-panel-section">
                  <div class="tag-panel-section-header">
                    <span class="tag-panel-section-title">新建自由标签</span>
                    <span class="tag-panel-section-hint">（字典里没有的，直接输入后回车）</span>
                  </div>
                  <div class="tag-search-row">
                    <el-input
                      v-model="freeTagInput"
                      placeholder="输入新标签名，回车添加"
                      size="small"
                      style="flex: 1"
                      @keydown.enter.prevent="tryAddFreeTag(freeTagInput)"
                    />
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      :disabled="!freeTagInput.trim()"
                      @click="tryAddFreeTag(freeTagInput)"
                    >添加</el-button>
                  </div>
                </div>

              </div>
            </el-popover>
          </div>
          <div class="text-xs text-gray-400 mt-1">
            推荐区按知识点共现自动推荐；可搜全库 / 直接新建自由标签（BE 自动建字典）
          </div>
        </el-form-item>

      </el-form>
    </el-card>
  </div>
</template>

<script setup name="QuestionEdit" lang="ts">
import { Close, Plus, ArrowDown, Search } from '@element-plus/icons-vue';
import {
  editAdminQuestion,
  getAdminQuestion,
  lazyTreeKnowledge,
  uploadAdminQuestionFile,
  searchAdminFreeTag,
  tagBySubject
} from '@/api/admin/question';
import type {
  FreeTagOption,
  OptionItem,
  QuestionForm,
  QuestionKnowledgeNode,
  QuestionVO,
  TagWithCoCount
} from '@/api/admin/question/types';

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

// ===== 状态 =====
// ⚠️ editId 用 string — Snowflake 19 位超 Number.MAX_SAFE_INTEGER (2^53)，
// Number(route.params.id) 会精度丢（...3970 → ...4000），loadDetail 拿不到数据 + 保存会建新行
const editId = ref<string | null>(null);
const loading = ref(false);
const submitting = ref(false);

const formRef = ref<ElFormInstance>();

interface EditFormState {
  questionType: number;
  difficult: number;
  subjectId: string;
  stemText: string;
  answerText: string;   // PRD-B-006 收尾：答案文本（填空/解答题）
  explainText: string;  // PRD-B-006 收尾：解析文本
  stemImgUrl: string;
  answerImgUrl: string;
  explainImgUrl: string;
  options: OptionItem[];
  correctAnswer: string;
  knowledgeIds: string[];
  tagNames: string[];
}

const form = reactive<EditFormState>({
  questionType: 1,
  difficult: 1,
  subjectId: '',
  stemText: '',
  answerText: '',
  explainText: '',
  stemImgUrl: '',
  answerImgUrl: '',
  explainImgUrl: '',
  options: [
    { key: 'A', content: '' },
    { key: 'B', content: '' },
    { key: 'C', content: '' },
    { key: 'D', content: '' }
  ],
  correctAnswer: '',
  knowledgeIds: [],
  tagNames: []
});

// el-form 内置校验规则（FE 额外的 R3/R5/R7 在 handleSubmit 里做）
const rules = reactive({
  subjectId: [{ required: true, message: '请选择章节', trigger: 'change' }],
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficult: [
    {
      validator: (_: any, value: number, cb: any) => {
        if (!value || value < 1 || value > 4) {
          cb(new Error('请选择难度（1-4 星）'));
        } else {
          cb();
        }
      },
      trigger: 'change'
    }
  ],
  correctAnswer: [{ required: true, message: '请填写正确答案', trigger: 'blur' }]
});

const treeProps = { label: 'name', children: 'children', value: 'id' };

// ===== 章节 / 知识点树 =====
const chapterTree = ref<QuestionKnowledgeNode[]>([]);
const knowledgeTree = ref<QuestionKnowledgeNode[]>([]);

const loadTree = async () => {
  try {
    const res: any = await lazyTreeKnowledge({});
    const data: QuestionKnowledgeNode[] = res?.data ?? [];
    chapterTree.value = Array.isArray(data) ? data : [];
    knowledgeTree.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[QuestionEdit] lazyTree 接口失败：', err);
    chapterTree.value = [];
    knowledgeTree.value = [];
  }
};

// ===== 选项动态增减 =====
const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const reindexOptionKeys = () => {
  form.options.forEach((opt, idx) => {
    opt.key = KEYS[idx] ?? String(idx + 1);
  });
};

const addOption = () => {
  if (form.options.length >= 10) return;
  form.options.push({ key: KEYS[form.options.length] ?? '', content: '' });
};

const removeOption = (idx: number) => {
  if (form.options.length <= 2) {
    proxy?.$modal.msgWarning('选择题至少保留 2 个选项');
    return;
  }
  form.options.splice(idx, 1);
  reindexOptionKeys();
};

// ===== 标签面板状态（D+E：自定义 popover 面板）=====
const tagPanelVisible = ref(false);

// ===== 标签操作 =====
const toggleTag = (tagName: string) => {
  const idx = form.tagNames.indexOf(tagName);
  if (idx >= 0) {
    form.tagNames.splice(idx, 1);
  } else {
    form.tagNames.push(tagName);
  }
};

const removeTag = (tagName: string) => {
  const idx = form.tagNames.indexOf(tagName);
  if (idx >= 0) form.tagNames.splice(idx, 1);
};

// ===== 自由标签输入（面板内"新建"区）=====
const freeTagInput = ref('');

const tryAddFreeTag = (input: string) => {
  const val = (input || '').trim();
  if (!val) return;
  if (!form.tagNames.includes(val)) {
    form.tagNames.push(val);
  }
  // 清空对应输入框
  if (input === freeTagInput.value) {
    freeTagInput.value = '';
  } else if (input === globalSearchKeyword.value) {
    globalSearchKeyword.value = '';
    tagOptions.value = [];
  }
};

// ===== 全库搜索（面板内搜索区）=====
const globalSearchKeyword = ref('');
const tagOptions = ref<FreeTagOption[]>([]);
const tagSearching = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const onGlobalSearch = (keyword: string) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const kw = (keyword ?? '').trim();
    if (!kw) {
      tagOptions.value = [];
      return;
    }
    tagSearching.value = true;
    try {
      const res: any = await searchAdminFreeTag(kw, 20);
      const data: FreeTagOption[] = res?.data ?? [];
      tagOptions.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('[QuestionEdit] freeTagSearch 失败：', err);
      tagOptions.value = [];
    } finally {
      tagSearching.value = false;
    }
  }, 300);
};

// ===== 标签推荐（PRD-B-006 D+E）=====
// currentScope: 5 档范围（5=叶子/4=节/3=章/2=学期/1=学段），默认叶子
const currentScope = ref<1 | 2 | 3 | 4 | 5>(5);

const recommendedTags = ref<TagWithCoCount[]>([]);
const recommendLoading = ref(false);

/**
 * 把 biz_subject ID 截到目标 level 前缀长度
 * level 1 学段: 4 位 / level 2 学期: 7 位 / level 3 章: 10 位 / level 4 节: 13 位 / level 5 叶子: 16 位
 */
const truncateToLevel = (id: string, level: 1 | 2 | 3 | 4 | 5): string => {
  const targetLen = 1 + 3 * level;
  return id.length > targetLen ? id.substring(0, targetLen) : id;
};

const loadRecommendedTags = async () => {
  const knowledgeIds = form.knowledgeIds;
  if (!knowledgeIds || knowledgeIds.length === 0) {
    recommendedTags.value = [];
    return;
  }
  recommendLoading.value = true;
  try {
    // 截断到目标 level，然后去重
    const truncated = [...new Set(knowledgeIds.map((id) => truncateToLevel(id, currentScope.value)))];

    // 并行调所有截断后 subjectId 的推荐接口
    const results = await Promise.allSettled(
      truncated.map((kid) => tagBySubject(kid, 50))
    );

    // 合并：tagId → 累加 coCount
    const mergeMap = new Map<number, TagWithCoCount>();
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const list: TagWithCoCount[] = (result.value as any)?.data ?? [];
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const existing = mergeMap.get(item.tagId);
            if (existing) {
              existing.coCount += item.coCount;
            } else {
              mergeMap.set(item.tagId, { ...item });
            }
          });
        }
      }
    });

    // 按合并后 coCount desc 排序，取 top 50 显示
    const merged = [...mergeMap.values()].sort((a, b) => b.coCount - a.coCount).slice(0, 50);
    recommendedTags.value = merged;
  } catch (err) {
    console.warn('[QuestionEdit] 推荐标签加载失败：', err);
    recommendedTags.value = [];
  } finally {
    recommendLoading.value = false;
  }
};

// 范围 chip 切换时立即重拉
const onScopeChange = () => {
  loadRecommendedTags();
};

// watch knowledgeIds：变化时重新拉推荐标签（防抖 300ms 避免树选择过程中多次触发）
let recommendTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => form.knowledgeIds,
  () => {
    if (recommendTimer) clearTimeout(recommendTimer);
    recommendTimer = setTimeout(() => {
      loadRecommendedTags();
    }, 300);
  },
  { deep: true }
);

// ===== 图上传 =====
const beforeUpload = (file: File): boolean => {
  const name = file.name || '';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  if (!['png', 'jpg', 'jpeg'].includes(ext)) {
    ElMessage.error('文件格式必须是 png/jpg/jpeg');
    return false;
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
};

const doUpload = async (opts: any, type: 'stem' | 'answer' | 'explain') => {
  try {
    const fd = new FormData();
    fd.append('file', opts.file);
    fd.append('type', type);
    const res: any = await uploadAdminQuestionFile(fd);
    const url: string | undefined = res?.data?.url;
    if (!url) {
      proxy?.$modal.msgError('上传失败，返回无 url');
      return;
    }
    if (type === 'stem') form.stemImgUrl = url;
    else if (type === 'answer') form.answerImgUrl = url;
    else if (type === 'explain') form.explainImgUrl = url;
    proxy?.$modal.msgSuccess('图片上传成功');
  } catch (err) {
    console.warn('[QuestionEdit] upload 失败：', err);
    proxy?.$modal.msgError('图片上传失败');
  }
};

// ===== 知识点叶子过滤 =====
const leafIdSet = computed<Set<string>>(() => {
  const set = new Set<string>();
  const walk = (nodes: QuestionKnowledgeNode[]) => {
    nodes.forEach((n) => {
      const kids = n.children || [];
      if (!n.hasChildren && kids.length === 0) {
        set.add(n.id);
      }
      if (kids.length) walk(kids);
    });
  };
  walk(knowledgeTree.value);
  return set;
});

// ===== 编辑回填 =====
const parseOptionsFromVO = (vo: any): OptionItem[] => {
  // optionsJson 在 VO 里可能叫 optionsJson 或 options，按实测兜底
  const raw = vo?.optionsJson ?? vo?.options ?? null;
  if (Array.isArray(raw)) {
    return raw
      .filter((x: any) => x && (x.key || x.content !== undefined))
      .map((x: any) => ({ key: String(x.key ?? ''), content: String(x.content ?? '') }));
  }
  // JSON string 兜底
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((x: any) => ({ key: String(x.key ?? ''), content: String(x.content ?? '') }));
      }
    } catch (e) {
      // ignore
    }
  }
  return [];
};

const loadDetail = async (id: string) => {
  loading.value = true;
  try {
    const res: any = await getAdminQuestion(id);
    const vo: QuestionVO | undefined = res?.data;
    if (!vo) {
      proxy?.$modal.msgError('题目不存在');
      return;
    }
    form.questionType = vo.questionType;
    form.difficult = vo.difficult ?? 1;
    form.subjectId = vo.subjectId ?? '';
    form.stemText = vo.stemText || '';
    form.answerText = vo.answerText || '';
    form.explainText = vo.explainText || '';
    form.stemImgUrl = vo.stemImg || '';
    form.answerImgUrl = vo.answerImg || '';
    form.explainImgUrl = vo.explainImg || '';
    form.correctAnswer = vo.correctAnswer || '';

    const parsedOptions = parseOptionsFromVO(vo);
    if (parsedOptions.length >= 2) {
      form.options = parsedOptions;
    } else if (form.questionType === 1) {
      // 选择题但 BE 没返选项，给默认 4 个
      form.options = [
        { key: 'A', content: '' },
        { key: 'B', content: '' },
        { key: 'C', content: '' },
        { key: 'D', content: '' }
      ];
    }

    form.knowledgeIds = (vo.questionKnowledges || []).map((k) => String(k.knowledgeId));
    form.tagNames = (vo.freeTags || []).map((t) => t.name).filter(Boolean);
  } catch (err) {
    console.warn('[QuestionEdit] loadDetail 失败：', err);
    proxy?.$modal.msgError('加载题目失败');
  } finally {
    loading.value = false;
  }
};

// ===== 提交 =====
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch (e) {
    return;
  }

  // R7: 题干文本和题干图至少一个非空
  if (!form.stemText.trim() && !form.stemImgUrl) {
    ElMessage.error('题干文本和题干图至少填一项');
    return;
  }

  // R5: 知识点 ≥ 1，且只保留叶子
  const leafKnowledgeIds = form.knowledgeIds.filter((id) => leafIdSet.value.has(id));
  if (leafKnowledgeIds.length < 1) {
    ElMessage.error('请至少选择 1 个叶子知识点');
    return;
  }

  // 选择题校验：≥ 2 选项 + R3 答案 key 都在 options 内
  if (form.questionType === 1) {
    const validOptions = form.options.filter((o) => o.content.trim());
    if (validOptions.length < 2) {
      ElMessage.error('选择题至少需要 2 个非空选项');
      return;
    }
    const optionKeys = new Set(form.options.map((o) => o.key));
    const answerStr = (form.correctAnswer || '').toUpperCase().trim();
    if (!answerStr) {
      ElMessage.error('请填写正确答案');
      return;
    }
    for (const ch of answerStr) {
      if (!optionKeys.has(ch)) {
        ElMessage.error(`答案 "${ch}" 不在选项 key 列表中（当前选项：${[...optionKeys].join(',')}）`);
        return;
      }
    }
  }

  submitting.value = true;
  try {
    const payload: QuestionForm = {
      id: editId.value,
      questionType: form.questionType,
      difficult: form.difficult,
      subjectId: form.subjectId,
      stemText: form.stemText,
      answerText: form.answerText || null,
      explainText: form.explainText || null,
      stemImgUrl: form.stemImgUrl || null,
      answerImgUrl: form.answerImgUrl || null,
      explainImgUrl: form.explainImgUrl || null,
      optionsJson: form.questionType === 1 ? form.options : undefined,
      correctAnswer: form.correctAnswer,
      tagNames: form.tagNames,
      questionKnowledges: leafKnowledgeIds.map((id) => ({ knowledgeId: id, source: 'U' as const }))
    };

    const res: any = await editAdminQuestion(payload);
    if (res?.code === 200) {
      proxy?.$modal.msgSuccess(editId.value ? '编辑成功' : '新建成功');
      router.push('/question/list');
    } else {
      proxy?.$modal.msgError(res?.msg || '保存失败');
    }
  } catch (err: any) {
    console.warn('[QuestionEdit] 保存失败：', err);
    proxy?.$modal.msgError(err?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
};

const handleBack = () => {
  router.push('/question/list');
};

onMounted(() => {
  // 性能优化（H1 卡 §6 R12）：loadTree（biz_subject 2116 行整树 ~200KB）
  // 和 loadDetail（5 表 JOIN）从串行 await 改并行 fire；loading 只覆盖 detail —
  // 用户进编辑页先看到表单骨架，章节/知识点树异步填进 el-tree-select
  loadTree();
  const rid = route.params.id;
  if (rid) {
    const idStr = String(Array.isArray(rid) ? rid[0] : rid).trim();
    if (idStr && /^\d+$/.test(idStr)) {
      editId.value = idStr;
      loadDetail(idStr);
    } else {
      editId.value = null;
    }
  }
});
</script>

<style scoped>
.upload-placeholder {
  width: 148px;
  height: 148px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #8c8c8c;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.upload-preview {
  width: 148px;
  height: 148px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.upload-preview .close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.options-wrap {
  width: 100%;
}

.option-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.option-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 32px;
  background: #f5f7fa;
  border-radius: 4px;
  font-weight: bold;
  color: #303133;
}

/* ===== 标签自定义面板样式 ===== */
.tag-selector-wrap {
  position: relative;
}

/* 触发器：模拟 el-select multiple 外观 */
.tag-trigger {
  min-height: 32px;
  padding: 4px 30px 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  position: relative;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.tag-trigger:hover {
  border-color: #c0c4cc;
}

.tag-trigger.is-focus {
  border-color: #409eff;
  outline: none;
}

.tag-placeholder {
  color: #a8abb2;
  font-size: 14px;
  line-height: 24px;
}

.tag-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  transition: transform 0.2s;
}

.tag-arrow.is-rotate {
  transform: translateY(-50%) rotate(180deg);
}

/* 面板整体 */
.tag-panel {
  padding: 12px 0;
}

.tag-panel-section {
  padding: 0 12px;
}

.tag-panel-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-panel-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.tag-panel-section-hint {
  font-size: 12px;
  color: #909399;
}

.tag-panel-loading {
  font-size: 12px;
  color: #909399;
}

/* 范围切换 chip */
.tag-scope-chips {
  margin-bottom: 10px;
}

/* 推荐标签列表区 */
.tag-recommend-body {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background: #fafafa;
}

.tag-recommend-list {
  padding: 4px 0;
}

.tag-recommend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.tag-recommend-item:hover {
  background: #f0f7ff;
}

.tag-recommend-item.is-checked {
  background: #ecf5ff;
}

.tag-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-co-count {
  font-size: 11px;
  color: #909399;
  flex-shrink: 0;
}

/* 空态提示 */
.tag-empty-hint {
  padding: 12px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 全库搜索行 */
.tag-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

/* 搜索结果列表 */
.tag-search-results {
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background: #fafafa;
}
</style>

<!-- 全局样式：覆盖 el-popover 内边距，让面板内容撑满 -->
<style>
.tag-panel-popper {
  padding: 0 !important;
}
</style>
