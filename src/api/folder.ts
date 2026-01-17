import request from '@/utils/request'
import type { ApiResponse, Folder, FolderRequest, FileInfo, PageResponse, PageParams } from '@/types'

export const folderApi = {
  // 获取文件夹列表
  getFolders(params: PageParams = {}) {
    return request.get<ApiResponse<PageResponse<Folder>>>('/admin/folders', { params })
  },

  // 获取单个文件夹
  getFolder(id: number) {
    return request.get<ApiResponse<Folder>>(`/admin/folders/${id}`)
  },

  // 创建文件夹
  createFolder(data: FolderRequest) {
    return request.post<ApiResponse<Folder>>('/admin/folders', data)
  },

  // 更新文件夹
  updateFolder(id: number, data: FolderRequest) {
    return request.put<ApiResponse<Folder>>(`/admin/folders/${id}`, data)
  },

  // 删除文件夹
  deleteFolder(id: number) {
    return request.delete<ApiResponse<null>>(`/admin/folders/${id}`)
  },

  // 获取文件夹树
  getFolderTree() {
    return request.get<ApiResponse<Folder[]>>('/admin/folders/tree')
  },

  // 获取文件夹内的文件列表
  getFolderFiles(folderId: number) {
    return request.get<ApiResponse<FileInfo[]>>(`/admin/folders/${folderId}/files`)
  }
}
