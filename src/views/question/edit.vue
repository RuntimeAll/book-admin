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

        <!-- 标签（H1 Bug2：remote select 搜索式多选 + allow-create 新建） -->
        <el-form-item label="标签">
          <el-select
            v-model="form.tagNames"
            multiple
            filterable
            remote
            :remote-method="onTagSearch"
            :loading="tagSearching"
            allow-create
            default-first-option
            reserve-keyword
            placeholder="搜索标签 / 直接输入新标签"
            style="width: 560px"
          >
            <el-option
              v-for="opt in tagOptions"
              :key="opt.id"
              :label="opt.name"
              :value="opt.name"
            >
              <span>{{ opt.name }}</span>
              <span class="text-gray-400 text-xs ml-2">({{ opt.useCount }})</span>
            </el-option>
          </el-select>
          <div class="text-xs text-gray-400 mt-1">
            输入关键词搜索已有标签；找不到时直接回车新建（BE 自动建字典）
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup name="QuestionEdit" lang="ts">
import { Close, Plus } from '@element-plus/icons-vue';
import {
  editAdminQuestion,
  getAdminQuestion,
  lazyTreeKnowledge,
  uploadAdminQuestionFile,
  searchAdminFreeTag
} from '@/api/admin/question';
import type {
  FreeTagOption,
  OptionItem,
  QuestionForm,
  QuestionKnowledgeNode,
  QuestionVO
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

// ===== 标签 remote search（H1 Bug2） =====
// keyword='' 时由 BE 返热门 top 20；非空时走 LIKE。
// allow-create 让用户直接回车输入新 tag（BE 收 tagNames 字符串数组，按 name 查/建字典）。
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
    console.warn('[QuestionEdit] freeTagSearch 失败：', err);
    tagOptions.value = [];
  } finally {
    tagSearching.value = false;
  }
};

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
  // race condition 不存在：handleSubmit 校验 leafIdSet 时用户必须已点选过知识点，
  // 那时树肯定已加载完
  loadTree();
  // H1 Bug2：预拉热门标签 top 20，下拉无输入时也能展开看候选（与 loadTree 并行）
  onTagSearch('');
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

</style>
