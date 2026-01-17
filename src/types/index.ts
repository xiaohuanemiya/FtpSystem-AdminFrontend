// API响应类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 登录请求类型
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应类型
export interface LoginResponse {
  token: string
  userId: number
  username: string
  userType: number
  userTypeName: string
}

// 用户类型
export interface User {
  id: number
  username: string
  userType: number
  userTypeName: string
  status: number
  createTime: string
  updateTime: string
}

// 创建/更新用户请求类型
export interface UserRequest {
  username: string
  password?: string
  userType: number
  status: number
}

// 文件夹类型
export interface Folder {
  id: number
  name: string
  parentId: number | null
  parentName: string | null
  allowSubfolder: number
  description: string | null
  creatorId: number
  creatorName: string
  path: string
  createTime: string
  updateTime: string
  children: Folder[] | null
  files: FileInfo[] | null
}

// 创建/更新文件夹请求类型
export interface FolderRequest {
  name: string
  parentId: number | null
  allowSubfolder: number
  description?: string
}

// 文件类型
export interface FileInfo {
  id: number
  originalName: string
  extension: string
  fileSize: number
  fileSizeFormatted: string
  mimeType: string
  folderId: number
  folderName: string
  uploaderId: number
  uploaderName: string
  createTime: string
  updateTime: string
}

// 更新文件请求类型
export interface FileUpdateRequest {
  newName?: string
  newFolderId?: number
}

// 分页查询参数
export interface PageParams {
  page?: number
  size?: number
  keyword?: string
}
