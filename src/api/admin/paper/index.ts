/**
 * book-admin · 卷库 CRUD API 封装（PRD-B-006 round-2 修复）
 *
 * 端点契约：/admin/paper/** (AdminPaperController，对齐 AdminQuestionController POST 风格)
 *
 * 关键约束：
 * - 全部走 plus-ui 模板 axios 封装（`@/utils/request`），不自起 axios.create
 * - 响应拦截器在成功时 `return res.data` → 业务拿到 RuoYi envelope `{code, msg, data}`
 * - 全部使用 POST（对齐 AdminQuestionController 风格）
 * - 分页响应 data = MisiktPageVo：`{total, list, pageNum, pageSize, ...}`
 */
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { PaperForm, PaperPageResult, PaperQuery, PaperVO } from './types';

/**
 * 卷库分页（POST /admin/paper/page，返回 MisiktPageVo 格式：data.list + data.total）
 */
export function listAdminPaper(query: PaperQuery): AxiosPromise<PaperPageResult> {
  return request({
    url: '/admin/paper/page',
    method: 'post',
    data: query
  });
}

/**
 * 卷库详情（POST /admin/paper/select/{id}）
 */
export function getAdminPaper(id: number | string): AxiosPromise<PaperVO> {
  return request({
    url: '/admin/paper/select/' + id,
    method: 'post'
  });
}

/**
 * 新建 / 编辑统一端点（POST /admin/paper/edit）
 * id=null → 新建草稿；id 有值 → 更新
 */
export function addAdminPaper(data: PaperForm): AxiosPromise<{ id: number }> {
  return request({
    url: '/admin/paper/edit',
    method: 'post',
    data
  });
}

/**
 * 编辑卷库（POST /admin/paper/edit，id 有值时为更新）
 */
export function updateAdminPaper(data: PaperForm): AxiosPromise<{ id: number }> {
  return request({
    url: '/admin/paper/edit',
    method: 'post',
    data
  });
}

/**
 * 软删卷库（POST /admin/paper/delete/{id}）
 */
export function delAdminPaper(id: string | number): AxiosPromise<void> {
  return request({
    url: '/admin/paper/delete/' + id,
    method: 'post'
  });
}
