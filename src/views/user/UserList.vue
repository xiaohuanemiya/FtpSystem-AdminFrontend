<template>
  <div class="page-container">
    <el-card>
      <!-- 搜索区域 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名"
          clearable
          style="width: 200px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>新建用户
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="userTypeName" label="用户类型">
          <template #default="{ row }">
            <el-tag :type="row.userType === 1 ? 'danger' : ''">
              {{ row.userType === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showEditDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新建用户'"
      width="500"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="form.userType" placeholder="请选择用户类型">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import type { User } from '@/types'

const loading = ref(false)
const tableData = ref<User[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  userType: 0,
  status: 1
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ]
}

async function loadData() {
  loading.value = true
  try {
    const response = await userApi.getUsers({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value || undefined
    })
    tableData.value = response.data.data.records
    total.value = response.data.data.total
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function showCreateDialog() {
  isEdit.value = false
  editId.value = null
  dialogVisible.value = true
}

function showEditDialog(row: User) {
  isEdit.value = true
  editId.value = row.id
  form.username = row.username
  form.password = ''
  form.userType = row.userType
  form.status = row.status
  dialogVisible.value = true
}

function resetForm() {
  form.username = ''
  form.password = ''
  form.userType = 0
  form.status = 1
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data: Record<string, unknown> = {
          username: form.username,
          userType: form.userType,
          status: form.status
        }
        if (form.password) {
          data.password = form.password
        }
        
        if (isEdit.value && editId.value) {
          await userApi.updateUser(editId.value, data as { username: string; userType: number; status: number; password?: string })
          ElMessage.success('更新成功')
        } else {
          await userApi.createUser(data as { username: string; userType: number; status: number; password: string })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } catch {
        // 错误已在拦截器中处理
      } finally {
        submitLoading.value = false
      }
    }
  })
}

async function handleDelete(row: User) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      '删除确认',
      { type: 'warning' }
    )
    await userApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (err) {
    if (err !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  height: 100%;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
