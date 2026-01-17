import request from '@/utils/request'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types'

export const authApi = {
  // 用户登录
  login(data: LoginRequest) {
    return request.post<ApiResponse<LoginResponse>>('/auth/login', data)
  }
}
