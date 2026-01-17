import request from '@/utils/request'
import type { ApiResponse, User, UserRequest, PageResponse, PageParams } from '@/types'

export const userApi = {
  // 获取用户列表
  getUsers(params: PageParams = {}) {
    return request.get<ApiResponse<PageResponse<User>>>('/admin/users', { params })
  },

  // 获取单个用户
  getUser(id: number) {
    return request.get<ApiResponse<User>>(`/admin/users/${id}`)
  },

  // 创建用户
  createUser(data: UserRequest) {
    return request.post<ApiResponse<User>>('/admin/users', data)
  },

  // 更新用户
  updateUser(id: number, data: UserRequest) {
    return request.put<ApiResponse<User>>(`/admin/users/${id}`, data)
  },

  // 删除用户
  deleteUser(id: number) {
    return request.delete<ApiResponse<null>>(`/admin/users/${id}`)
  }
}
