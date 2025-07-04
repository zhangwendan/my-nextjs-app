import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean
  deviceId: string
  rememberedDevices: string[]
  login: (username: string, password: string) => boolean
  logout: () => void
  isDeviceRemembered: () => boolean
  generateDeviceId: () => string
}

const VALID_USERNAME = 'tirox'
const VALID_PASSWORD = '001'

// 生成设备ID的工具函数
const createDeviceId = () => {
  if (typeof window === 'undefined') return ''
  
  try {
    // 生成基于浏览器和设备信息的唯一ID
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const language = navigator.language
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 15)
    
    // 创建更稳定的设备指纹
    const deviceFingerprint = `${userAgent}-${platform}-${language}-${screen.width}x${screen.height}`
    const deviceId = btoa(deviceFingerprint + timestamp + random)
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 32)
    
    return deviceId
  } catch (error) {
    console.error('生成设备ID失败:', error)
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      deviceId: '',
      rememberedDevices: [],
      
      generateDeviceId: () => {
        const state = get()
        if (state.deviceId) {
          // 如果已经有设备ID，直接返回
          return state.deviceId
        }
        
        const newDeviceId = createDeviceId()
        set({ deviceId: newDeviceId })
        
        console.log('生成新的设备ID:', newDeviceId)
        return newDeviceId
      },
      
      login: (username: string, password: string) => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
          const state = get()
          const currentDeviceId = state.deviceId || state.generateDeviceId()
          
          set({
            isAuthenticated: true,
            deviceId: currentDeviceId,
            rememberedDevices: [...new Set([...state.rememberedDevices, currentDeviceId])]
          })
          
          console.log('登录成功，设备ID已记住:', currentDeviceId)
          return true
        }
        return false
      },
      
      logout: () => {
        set({ isAuthenticated: false })
        console.log('用户已退出登录')
      },
      
      isDeviceRemembered: () => {
        const state = get()
        if (!state.deviceId) {
          // 如果没有设备ID，先生成一个
          const newDeviceId = state.generateDeviceId()
          return state.rememberedDevices.includes(newDeviceId)
        }
        
        const isRemembered = state.rememberedDevices.includes(state.deviceId)
        console.log('设备记住状态:', {
          deviceId: state.deviceId,
          isRemembered,
          rememberedDevices: state.rememberedDevices
        })
        
        return isRemembered
      }
    }),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        deviceId: state.deviceId,
        rememberedDevices: state.rememberedDevices,
        isAuthenticated: state.isAuthenticated
      }),
      migrate: (persistedState: any, version: number) => {
        console.log('🔄 正在迁移认证存储，版本:', version)
        
        if (!persistedState || typeof persistedState !== 'object') {
          console.log('📝 认证存储数据异常，重置为默认值')
          return {
            isAuthenticated: false,
            deviceId: '',
            rememberedDevices: []
          }
        }
        
        const migratedState = {
          isAuthenticated: Boolean(persistedState.isAuthenticated),
          deviceId: typeof persistedState.deviceId === 'string' ? persistedState.deviceId : '',
          rememberedDevices: Array.isArray(persistedState.rememberedDevices) ? persistedState.rememberedDevices : []
        }
        
        console.log('✅ 认证存储迁移完成')
        return migratedState
      },
      onRehydrateStorage: () => {
        console.log('🔄 开始恢复认证存储...')
        return (state, error) => {
          if (error) {
            console.error('❌ 恢复认证存储失败:', error)
            useAuth.setState({
              isAuthenticated: false,
              deviceId: '',
              rememberedDevices: []
            })
          } else {
            console.log('✅ 认证存储恢复完成')
          }
        }
      }
    }
  )
) 