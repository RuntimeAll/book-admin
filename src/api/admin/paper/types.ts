/**
 * book-admin · 卷库 CRUD TypeScript 类型契约（PRD-B-006）
 *
 * 对齐：
 * - BizPaper 实体字段（codeplace-B/book-server ruoyi-book BizPaper.java）
 * - PRD-B-006 AC4 卷库 CRUD 跑通
 * - 端点前缀 /admin/paper/** (待 BE AdminPaperController 落地)
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
 * 卷库列表项 VO
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
 * 卷库分页查询入参
 */
export interface PaperQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
  subjectId?: string;
  status?: string;
}

/**
 * 卷库分页响应
 */
export interface PaperPageResult {
  total: number;
  rows: PaperVO[];
}

/**
 * 卷库编辑表单（新建 + 修改统一）
 */
export interface PaperForm {
  id?: string | null;
  name: string;
  subjectId?: string;
  paperCategoryId?: string;
  directoryName?: string;
  suggestTime?: number;
  examYear?: string;
  remark?: string;
  status?: string;
}
