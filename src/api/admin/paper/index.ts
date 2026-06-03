/**
 * book-admin · 卷库 CRUD API 封装（PRD-B-006）
 *
 * 端点契约：/admin/paper/** (AdminPaperController，BE 待实现)
 *
 * 关键约束：
 * - 全部走 plus-ui 模板 axios 封装（`@/utils/request`），不自起 axios.create
 * - 响应拦截器在成功时 `return res.data` → 业务拿到 RuoYi envelope `{code, msg, data, rows, total}`
 * - 写端点全部 POST（对齐 ruoyi-book-admin 约定）；分页 POST JSON body
 */
import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import type { PaperForm, PaperPageResult, PaperQuery, PaperVO } from './types';

/**
 * 卷库分页（GET /admin/paper/list，RuoYi 标准 rows/total 格式）
 */
export function listAdminPaper(query: PaperQuery): AxiosPromise<PaperPageResult> {
  return request({
    url: '/admin/paper/list',
    method: 'get',
    params: query
  });
}

/**
 * 卷库详情（GET /admin/paper/{id}）
 */
export function getAdminPaper(id: number | string): AxiosPromise<PaperVO> {
  return request({
    url: '/admin/paper/' + id,
    method: 'get'
  });
}

/**
 * 新建卷库（POST /admin/paper）
 */
export function addAdminPaper(data: PaperForm): AxiosPromise<void> {
  return request({
    url: '/admin/paper',
    method: 'post',
    data
  });
}

/**
 * 编辑卷库（PUT /admin/paper）
 */
export function updateAdminPaper(data: PaperForm): AxiosPromise<void> {
  return request({
    url: '/admin/paper',
    method: 'put',
    data
  });
}

/**
 * 删除卷库（DELETE /admin/paper/{ids}）
 */
export function delAdminPaper(ids: string | number): AxiosPromise<void> {
  return request({
    url: '/admin/paper/' + ids,
    method: 'delete'
  });
}
