/**
 * book-admin · 题目 CRUD TypeScript 类型契约（H1 卡 V-10）
 *
 * 对齐：
 * - PRD §3.1 BE /admin/question/edit schema（QuestionForm）
 * - 数据建模/项目概览 data-product.md §4.3 biz_question 字段（QuestionVO）
 * - 现有 misikt /teacher/question/page 复用（QuestionItemVo Java VO 已发布字段）
 *
 * 命名规则：camelCase（BE MyBatis-Plus 默认 snake↔camel）。
 */

/**
 * 题型枚举（1 选 / 2 填 / 3 判 / 4 计算 / 5 解答 — PRD §3.1 / 数据建模 04）
 */
export enum QuestionTypeEnum {
  CHOICE = 1,
  FILL = 2,
  JUDGE = 3,
  CALC = 4,
  ESSAY = 5
}

/**
 * 状态枚举（'0' 草稿 / '1' 发布 / '2' 软删 — biz_question.status CHAR(1)）
 */
export enum QuestionStatusEnum {
  DRAFT = '0',
  PUBLISHED = '1',
  DELETED = '2'
}

/**
 * 选项项（选择题 options_json 元素）
 */
export interface OptionItem {
  key: string; // 'A' / 'B' / 'C' / 'D' / ...
  content: string;
}

/**
 * 题×知识点关联（U 轨）
 */
export interface QuestionKnowledge {
  knowledgeId: string; // biz_subject.id（叶子层）
  source?: 'U' | 'S'; // 用户挂 / 标准挂；本卡只录 U
  knowledgeName?: string; // 仅展示用，BE 返回
}

/**
 * 自由标签（X 卡产物 — biz_question_free_tag JOIN biz_free_tag 后扁平化）
 */
export interface FreeTagItem {
  id?: number; // biz_free_tag.id
  name: string;
  position?: number; // 0/1/2/3/4 — FE 颜色循环
}

/**
 * 题目列表项 VO（/admin/question/page list 元素）
 *
 * 对齐现有 misikt QuestionItemVo（FE 字段名跟 BE Java VO 一致 camelCase）。
 */
export interface QuestionVO {
  id: number;
  questionType: number;
  difficult: number;
  subjectId: string;
  shortTitle: string;
  stemText: string;
  answerText?: string;   // PRD-B-006 收尾：答案文本（biz_text_content 外置）
  explainText?: string;  // PRD-B-006 收尾：解析文本（biz_text_content 外置）
  stemImg: string; // ⚠️ 不带 _url 后缀（misikt 抓包归一化）
  answerImg?: string;
  explainImg?: string;
  freeTag: string; // 老逗号串字段（保留兼容）
  correctAnswer: string;
  score?: number;
  examYear?: string;
  examPaperId?: number;
  examPaperName?: string;
  isShare?: number;
  isRepeat?: number;
  repeatQuestionId?: number;
  status: string; // '0' / '1' / '2'
  createUser?: number;
  createBy?: string;
  createTime?: number; // ms timestamp
  updateTime?: number;
  updateBy?: string;
  questionKnowledges?: QuestionKnowledge[];
  freeTags?: FreeTagItem[]; // 结构化标签数组（X 卡）
}

/**
 * 题目分页查询入参
 *
 * 对齐 misikt QuestionPageBo 字段名（pageIndex 不是 pageNum！）
 * 新增：status 状态过滤（admin 列表需筛 0/1/2）
 * H1 Bug2：tagIds 标签多选筛选（OR 语义，BE 用 tag_id IN 子查询）
 */
export interface QuestionQuery {
  pageIndex: number; // ⚠️ misikt 风格 pageIndex 不是 pageNum
  pageSize: number;
  subjectId?: string;
  questionType?: number | null;
  difficult?: number | null;
  keyWord?: string;
  status?: string; // '0' / '1' / '2' — admin 端筛选状态
  tagIds?: number[]; // H1 Bug2: 标签 id 多选，BE 用 tag_id IN 子查询（Long 数组）
  notTaskQuestion?: number; // 0=不限 / 1=过滤
  notUsedQuestion?: number;
}

/**
 * 自由标签下拉选项 VO（POST /admin/question/freeTagSearch 返回元素）
 *
 * H1 Bug2：edit / list 标签 remote select 候选项；useCount 用于排序提示。
 */
export interface FreeTagOption {
  id: number;
  name: string;
  useCount: number;
}

/**
 * 题目分页响应（MisiktPageVo<QuestionItemVo> 结构）
 *
 * 注：RuoYi axios 拦截器 `return res.data` 后业务拿到 envelope =
 *   { code, msg, data: QuestionPageResult }
 * 即 `pageRes.data.list` / `pageRes.data.total`。
 */
export interface QuestionPageResult {
  total: number;
  list: QuestionVO[];
  pageNum: number;
  pageSize: number;
  size: number;
  startRow: number;
  endRow: number;
  pages: number;
  prePage: number;
  nextPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  navigatePages: number;
  navigatepageNums: number[];
  navigateFirstPage: number;
  navigateLastPage: number;
}

/**
 * 标签共现推荐 VO（POST /admin/question/tag/byKnowledge 返回元素）
 *
 * PRD-B-006 收尾：按知识点 id 查共现频次 top N 的标签
 */
export interface TagWithCoCount {
  tagId: number;
  tagName: string;
  coCount: number;
}

/**
 * 题目编辑表单（POST /admin/question/edit 入参 — PRD §3.1 严格对齐）
 */
export interface QuestionForm {
  // ⚠️ id 用 string — Snowflake 19 位超 Number.MAX_SAFE_INTEGER (2^53)，JS Number 转会精度丢
  // BE Jackson @JsonSerialize(ToStringSerializer) 已经把 Long 序列化为字符串，FE 全程字符串处理
  id: string | null; // null = 新建 / 字符串 = 编辑
  questionType: number;
  difficult: number;
  subjectId: string;
  shortTitle?: string;
  stemText: string;
  answerText?: string | null;   // PRD-B-006 收尾：答案文本（填空/解答题）
  explainText?: string | null;  // PRD-B-006 收尾：解析文本
  stemImgUrl?: string | null;
  answerImgUrl?: string | null;
  explainImgUrl?: string | null;
  optionsJson?: OptionItem[];
  correctAnswer?: string;
  scoreStdJson?: any; // OOS-3 本卡不录入
  tagNames?: string[]; // FE 传字符串数组，BE 维护 biz_question_free_tag + 字典
  questionKnowledges: QuestionKnowledge[]; // ≥ 1
}

/**
 * lazyTree 节点（章节树 / 知识点树 复用同端点）
 */
export interface QuestionKnowledgeNode {
  id: string; // biz_subject.id（vchar 编码 e.g. "3071001"）
  name: string;
  parentId: string;
  level: number; // 1 学段 / 2 学科 / 3 教材 / 4 章节 / 5 知识点
  hasChildren?: boolean;
  children?: QuestionKnowledgeNode[];
}

/**
 * lazyTree 查询入参
 */
export interface QuestionLazyTreeQuery {
  parentId?: string; // 缺省 = 根（level=1）
  onlyLeaf?: boolean; // 知识点选择器场景过滤叶子（R3 风险待 BE 确认）
}

/**
 * 文件上传响应 data 段
 */
export interface QuestionUploadResult {
  url: string; // OSS URL
  assetId: number;
}
