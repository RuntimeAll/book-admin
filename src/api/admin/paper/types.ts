/**
 * book-admin · 卷库 CRUD TypeScript 类型契约（PRD-B-006 round-2 修复）
 *
 * 对齐：
 * - BizPaper 实体字段（codeplace-B/book-server ruoyi-book BizPaper.java）
 * - AdminQuestionController POST 风格 + MisiktPageVo 分页响应
 * - 端点前缀 /admin/paper/** (AdminPaperController)
 */

/**
 * 卷库状态枚举（'0' 草稿 / '1' 发布 / '2' 软删）
 */
export enum PaperStatusEnum {
  DRAFT = '0',
  PUBLISHED = '1',
  DELETED = '2'
}

/**
 * 试卷类型枚举（1 手工 / 2 自动）
 */
export enum PaperTypeEnum {
  MANUAL = 1,
  AUTO = 2
}

/**
 * 卷库列表项 VO（对齐 BizPaper 实体字段）
 */
export interface PaperVO {
  id: number | string;
  name: string;
  subjectId?: string;
  paperCategoryId?: string;
  directoryName?: string;
  questionCount?: number;
  score?: number;
  suggestTime?: number;
  hgScore?: number;
  paperType?: number;
  examYear?: string;
  isShare?: number;
  status: string;
  sort?: number;
  createBy?: string;
  createTime?: number | string;
  updateBy?: string;
  updateTime?: number | string;
  remark?: string;
}

/**
 * 卷库分页查询入参（对齐 AdminQuestionPageBo 命名：pageIndex 不是 pageNum）
 */
export interface PaperQuery {
  pageIndex: number;
  pageSize: number;
  name?: string;
  subjectId?: string;
  status?: string;
}

/**
 * 卷库分页响应（MisiktPageVo 格式：list + total）
 */
export interface PaperPageResult {
  total: number;
  list: PaperVO[];
  pageNum: number;
  pageSize: number;
}

/**
 * 卷库编辑表单（新建 + 修改统一）
 */
export interface PaperForm {
  id?: string | number | null;
  name: string;
  subjectId?: string;
  paperCategoryId?: string;
  directoryName?: string;
  suggestTime?: number;
  examYear?: string;
  remark?: string;
  status?: string;
}
