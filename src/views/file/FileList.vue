<template>
  <div class="page-container">
    <el-card>
      <!-- 搜索区域 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件名"
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
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="originalName" label="文件名" min-width="200">
          <template #default="{ row }">
            <div class="file-name">
              <el-icon :size="18"><Document /></el-icon>
              <span>{{ row.originalName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="extension" label="扩展名" width="100" />
        <el-table-column prop="fileSizeFormatted" label="大小" width="120" />
        <el-table-column prop="folderName" label="所属文件夹" />
        <el-table-column prop="uploaderName" label="上传者" width="100" />
        <el-table-column prop="createTime" label="上传时间" width="180" />
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

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑文件"
      width="500"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="文件名" prop="newName">
          <el-input v-model="form.newName" placeholder="请输入新文件名" />
        </el-form-item>
        <el-form-item label="所属文件夹" prop="newFolderId">
          <el-tree-select
            v-model="form.newFolderId"
            :data="folderTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择文件夹"
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
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
import { Search, Document } from '@element-plus/icons-vue'
import { fileApi } from '@/api/file'
import { folderApi } from '@/api/folder'
import type { FileInfo, Folder } from '@/types'

const loading = ref(false)
const tableData = ref<FileInfo[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const editId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const folderTree = ref<Folder[]>([])

const form = reactive({
  newName: '',
  newFolderId: null as number | null
})

const rules: FormRules = {
  newName: [
    { required: true, message: '请输入文件名', trigger: 'blur' }
  ],
  newFolderId: [
    { required: true, message: '请选择文件夹', trigger: 'change' }
  ]
}

async function loadData() {
  loading.value = true
  try {
    const response = await fileApi.getFiles({
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

async function loadFolderTree() {
  try {
    const response = await folderApi.getFolderTree()
    folderTree.value = response.data.data
  } catch {
    // 错误已在拦截器中处理
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

async function showEditDialog(row: FileInfo) {
  editId.value = row.id
  await loadFolderTree()
  form.newName = row.originalName
  form.newFolderId = row.folderId
  dialogVisible.value = true
}

function resetForm() {
  form.newName = ''
  form.newFolderId = null
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid && editId.value) {
      submitLoading.value = true
      try {
        await fileApi.updateFile(editId.value, {
          newName: form.newName,
          newFolderId: form.newFolderId || undefined
        })
        ElMessage.success('更新成功')
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

async function handleDelete(row: FileInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${row.originalName}" 吗？`,
      '删除确认',
      { type: 'warning' }
    )
    await fileApi.deleteFile(row.id)
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

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
