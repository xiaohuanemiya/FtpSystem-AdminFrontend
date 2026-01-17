import request from '@/utils/request'
import type { ApiResponse, FileInfo, PageResponse, PageParams } from '@/types'

export const fileApi = {
  // 获取文件列表
  getFiles(params: PageParams = {}) {
    return request.get<ApiResponse<PageResponse<FileInfo>>>('/admin/files', { params })
  },

  // 获取单个文件
  getFile(id: number) {
    return request.get<ApiResponse<FileInfo>>(`/admin/files/${id}`)
  },

  // 更新文件
  updateFile(id: number, params: { newName?: string; newFolderId?: number }) {
    return request.put<ApiResponse<FileInfo>>(`/admin/files/${id}`, null, { params })
  },

  // 删除文件
  deleteFile(id: number) {
    return request.delete<ApiResponse<null>>(`/admin/files/${id}`)
  }
}
