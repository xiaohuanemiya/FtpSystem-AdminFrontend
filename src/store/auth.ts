import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginResponse } from '@/types'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<LoginResponse | null>(
    JSON.parse(localStorage.getItem('userInfo') || 'null')
  )

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.userType === 1)

  async function login(username: string, password: string) {
    const response = await authApi.login({ username, password })
    const data = response.data.data
    token.value = data.token
    userInfo.value = data
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data))
    return data
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    logout
  }
})
