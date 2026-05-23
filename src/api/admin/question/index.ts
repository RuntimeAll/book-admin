/**
 * book-admin · 题目 CRUD API 封装（H1 卡 V-10）
 *
 * 端点契约：PRD §3 + 现有 misikt /teacher/question/* 加 /admin/ 前缀复用（V-5）。
 *
 * 关键约束：
 * - 全部走 plus-ui 模板 axios 封装（`@/utils/request`），不自起 axios.create
 * - 响应拦截器在成功时 `return res.data` → 业务拿到 envelope `{code, msg, data, rows, total, ...}`
 * - PRD §3 多数端点 POST + JSON body（misikt 复用 page/select/lazyTree）；写端点 /admin/question/edit
 *   /delete/{id} /publish/{id} /fileUpload 全部 POST
 */
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type {
  QuestionForm,
  QuestionPageResult,
  QuestionQuery,
  QuestionVO,
  QuestionKnowledgeNode,
  QuestionLazyTreeQuery,
  QuestionUploadResult,
  FreeTagOption
} from './types';

/**
 * 题目分页（POST /admin/question/page，复用 misikt /teacher/question/page 实现，admin 路由前缀）
 *
 * @param query 入参对齐 misikt QuestionPageBo（pageIndex 不是 pageNum！）
 * @returns envelope.data = MisiktPageVo<QuestionItemVo>
 */
export function listAdminQuestion(query: QuestionQuery): AxiosPromise<QuestionPageResult> {
  return request({
    url: '/admin/question/page',
    method: 'post',
    data: query
  });
}

/**
 * 题目详情（POST /admin/question/select/{id}）
 */
export function getAdminQuestion(id: number | string): AxiosPromise<QuestionVO> {
  return request({
    url: '/admin/question/select/' + id,
    method: 'post'
  });
}

/**
 * lazyTree 懒加载（POST /admin/question/lazyTree）
 *
 * 章节树（level 2-3）+ 知识点树（level 4-5）共用同端点，FE 通过 parentId 控制深度。
 * onlyLeaf 参数 R3 风险待 BE 确认，本波先不传，默认拉全树。
 */
export function lazyTreeKnowledge(query: QuestionLazyTreeQuery = {}): AxiosPromise<QuestionKnowledgeNode[]> {
  return request({
    url: '/admin/question/lazyTree',
    method: 'post',
    data: query
  });
}

/**
 * 题目编辑（新建 + 修改统一端点，POST /admin/question/edit）
 *
 * id=null → 新建草稿（status='0'）；id 有值 → 更新（status 不动，发布走 publish 端点）
 */
export function editAdminQuestion(data: QuestionForm): AxiosPromise<{ id: number }> {
  return request({
    url: '/admin/question/edit',
    method: 'post',
    data: data
  });
}

/**
 * 题目软删（POST /admin/question/delete/{id}）
 *
 * BE service 层先校验 biz_paper_question 引用，被引用题抛 ServiceException → R.fail；
 * 否则 UPDATE biz_question SET status='2'。
 */
export function delAdminQuestion(id: number | string): AxiosPromise<void> {
  return request({
    url: '/admin/question/delete/' + id,
    method: 'post'
  });
}

/**
 * 题目发布（POST /admin/question/publish/{id}）— status 0→1 单向转换
 */
export function publishAdminQuestion(id: number | string): AxiosPromise<void> {
  return request({
    url: '/admin/question/publish/' + id,
    method: 'post'
  });
}

/**
 * 题图上传（POST /admin/question/fileUpload，multipart → ai-book OSS bucket）
 *
 * @param formData FormData 含 file (binary) + type (stem | answer | explain)
 */
export function uploadAdminQuestionFile(formData: FormData): AxiosPromise<QuestionUploadResult> {
  return request({
    url: '/admin/question/fileUpload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 自由标签搜索（POST /admin/question/freeTagSearch — H1 Bug2）
 *
 * keyword 为空 / null 时 BE 返热门 top N（按 use_count desc）；
 * 非空 keyword 走 LIKE 模糊匹配。limit 默认 BE 兜底（一般 20）。
 *
 * @param keyword 搜索关键词；空串 / null = 取热门
 * @param limit 返回上限（默认 BE 决定）
 */
export function searchAdminFreeTag(
  keyword: string | null,
  limit?: number
): AxiosPromise<FreeTagOption[]> {
  return request({
    url: '/admin/question/freeTagSearch',
    method: 'post',
    data: { keyword, limit }
  });
}
