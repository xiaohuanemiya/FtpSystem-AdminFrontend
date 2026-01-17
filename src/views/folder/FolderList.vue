<template>
  <div class="page-container">
    <el-card>
      <!-- 搜索区域 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件夹名称"
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
          <el-icon><Plus /></el-icon>新建文件夹
        </el-button>
        <el-button @click="showTreeDialog">
          <el-icon><Grid /></el-icon>查看树结构
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="parentName" label="父文件夹">
          <template #default="{ row }">
            {{ row.parentName || '根目录' }}
          </template>
        </el-table-column>
        <el-table-column prop="allowSubfolder" label="允许子文件夹">
          <template #default="{ row }">
            <el-tag :type="row.allowSubfolder === 1 ? 'success' : 'info'">
              {{ row.allowSubfolder === 1 ? '允许' : '不允许' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建者" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showFiles(row)">文件</el-button>
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
      :title="isEdit ? '编辑文件夹' : '新建文件夹'"
      width="500"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="文件夹名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入文件夹名称" />
        </el-form-item>
        <el-form-item label="父文件夹" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="folderTreeOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="根目录"
            clearable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="允许子文件夹" prop="allowSubfolder">
          <el-switch
            v-model="form.allowSubfolder"
            :active-value="1"
            :inactive-value="0"
            active-text="允许"
            inactive-text="不允许"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
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

    <!-- 树结构对话框 -->
    <el-dialog v-model="treeDialogVisible" title="文件夹树结构" width="600">
      <el-tree
        :data="folderTree"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <el-icon><Folder /></el-icon>
            <span>{{ node.label }}</span>
            <el-tag v-if="data.allowSubfolder === 0" size="small" type="info">
              不允许子文件夹
            </el-tag>
          </span>
        </template>
      </el-tree>
    </el-dialog>

    <!-- 文件列表对话框 -->
    <el-dialog v-model="filesDialogVisible" :title="`${currentFolder?.name} - 文件列表`" width="800">
      <el-table :data="folderFiles" v-loading="filesLoading">
        <el-table-column prop="originalName" label="文件名" />
        <el-table-column prop="extension" label="扩展名" width="100" />
        <el-table-column prop="fileSizeFormatted" label="大小" width="120" />
        <el-table-column prop="uploaderName" label="上传者" width="100" />
        <el-table-column prop="createTime" label="上传时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Plus, Folder, Grid } from '@element-plus/icons-vue'
import { folderApi } from '@/api/folder'
import type { Folder as FolderType, FileInfo } from '@/types'

const loading = ref(false)
const tableData = ref<FolderType[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const treeDialogVisible = ref(false)
const folderTree = ref<FolderType[]>([])
const folderTreeOptions = ref<FolderType[]>([])

const filesDialogVisible = ref(false)
const filesLoading = ref(false)
const currentFolder = ref<FolderType | null>(null)
const folderFiles = ref<FileInfo[]>([])

const form = reactive({
  name: '',
  parentId: null as number | null,
  allowSubfolder: 1,
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' }
  ],
  allowSubfolder: [
    { required: true, message: '请选择是否允许子文件夹', trigger: 'change' }
  ]
}

async function loadData() {
  loading.value = true
  try {
    const response = await folderApi.getFolders({
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
    folderTreeOptions.value = response.data.data
  } catch {
    // 错误已在拦截器中处理
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

async function showCreateDialog() {
  isEdit.value = false
  editId.value = null
  await loadFolderTree()
  dialogVisible.value = true
}

async function showEditDialog(row: FolderType) {
  isEdit.value = true
  editId.value = row.id
  await loadFolderTree()
  form.name = row.name
  form.parentId = row.parentId
  form.allowSubfolder = row.allowSubfolder
  form.description = row.description || ''
  dialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.parentId = null
  form.allowSubfolder = 1
  form.description = ''
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          name: form.name,
          parentId: form.parentId,
          allowSubfolder: form.allowSubfolder,
          description: form.description || undefined
        }
        
        if (isEdit.value && editId.value) {
          await folderApi.updateFolder(editId.value, data)
          ElMessage.success('更新成功')
        } else {
          await folderApi.createFolder(data)
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

async function handleDelete(row: FolderType) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件夹 "${row.name}" 吗？文件夹必须为空才能删除。`,
      '删除确认',
      { type: 'warning' }
    )
    await folderApi.deleteFolder(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (err) {
    if (err !== 'cancel') {
      // 错误已在拦截器中处理
    }
  }
}

async function showTreeDialog() {
  await loadFolderTree()
  treeDialogVisible.value = true
}

async function showFiles(row: FolderType) {
  currentFolder.value = row
  filesDialogVisible.value = true
  filesLoading.value = true
  try {
    const response = await folderApi.getFolderFiles(row.id)
    folderFiles.value = response.data.data
  } catch {
    // 错误已在拦截器中处理
  } finally {
    filesLoading.value = false
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

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
