import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  createdAt: number
}

interface KnowledgeFile {
  id: string
  content: string
  filename: string
  uploadTime: number
  size: number
}

interface KnowledgeUrl {
  id: string
  url: string
  title: string
  description?: string
  addTime: number
}

interface AiSettingsState {
  apiKey: string
  apiBaseUrl: string
  systemPrompt: string
  knowledgeBaseFiles: KnowledgeFile[]
  knowledgeBaseUrls: KnowledgeUrl[]
  temperature: number
  modelName: string
  modelHistory: string[]
  chatHistories: ChatHistory[]
  isGlobalSync: boolean
  lastSyncTime: number
  
  // Actions
  setApiKey: (key: string) => void
  setApiBaseUrl: (url: string) => void
  setSystemPrompt: (prompt: string) => void
  addKnowledgeFile: (file: KnowledgeFile) => void
  removeKnowledgeFile: (id: string) => void
  clearKnowledgeFiles: () => void
  addKnowledgeUrl: (url: KnowledgeUrl) => void
  removeKnowledgeUrl: (id: string) => void
  updateKnowledgeUrl: (id: string, updates: Partial<KnowledgeUrl>) => void
  clearKnowledgeUrls: () => void
  setTemperature: (temp: number) => void
  setModelName: (name: string) => void
  addModelToHistory: (modelName: string) => void
  saveChatHistory: (messages: Message[]) => void
  deleteChatHistory: (id: string) => void
  clearAllHistory: () => void
  resetSettings: () => void
  toggleGlobalSync: () => void
  syncFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
}

const defaultSettings = {
  apiKey: '',
  apiBaseUrl: 'https://aihubmix.com/v1/chat/completions',
  systemPrompt: '你是锦鲤君-东风，一位可爱而聪明的AI助手。请以友好、亲切的语气回答用户的问题。',
  knowledgeBaseFiles: [] as KnowledgeFile[],
  knowledgeBaseUrls: [] as KnowledgeUrl[],
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
  modelHistory: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-haiku', 'claude-3-sonnet'] as string[],
  chatHistories: [] as ChatHistory[],
  isGlobalSync: false,
  lastSyncTime: 0
}

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      setApiKey: (key: string) => {
        set({ apiKey: key })
        // 如果开启了全局同步，自动保存到服务器
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      setApiBaseUrl: (url: string) => {
        set({ apiBaseUrl: url })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      setSystemPrompt: (prompt: string) => {
        set({ systemPrompt: prompt })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      addKnowledgeFile: (file: KnowledgeFile) => {
        set((state) => ({
          knowledgeBaseFiles: [...state.knowledgeBaseFiles, file]
        }))
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      removeKnowledgeFile: (id: string) => {
        set((state) => ({
          knowledgeBaseFiles: state.knowledgeBaseFiles.filter(f => f.id !== id)
        }))
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      clearKnowledgeFiles: () => {
        set({ knowledgeBaseFiles: [] })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      addKnowledgeUrl: (url: KnowledgeUrl) => {
        set((state) => ({
          knowledgeBaseUrls: [...state.knowledgeBaseUrls, url]
        }))
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      removeKnowledgeUrl: (id: string) => {
        set((state) => ({
          knowledgeBaseUrls: state.knowledgeBaseUrls.filter(u => u.id !== id)
        }))
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      updateKnowledgeUrl: (id: string, updates: Partial<KnowledgeUrl>) => {
        set((state) => ({
          knowledgeBaseUrls: state.knowledgeBaseUrls.map(u =>
            u.id === id ? { ...u, ...updates } : u
          )
        }))
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      clearKnowledgeUrls: () => {
        set({ knowledgeBaseUrls: [] })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      setTemperature: (temp: number) => {
        set({ temperature: temp })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      setModelName: (name: string) => {
        set({ modelName: name })
        const state = get()
        if (state.isGlobalSync) {
          state.saveToServer().catch(console.error)
        }
      },
      
      addModelToHistory: (modelName: string) => {
        if (!modelName.trim()) return
        set((state) => {
          const existing = state.modelHistory
          const filtered = existing.filter(m => m !== modelName)
          return {
            modelHistory: [modelName, ...filtered].slice(0, 10) // 保留最近10个模型
          }
        })
      },
      
      saveChatHistory: (messages: Message[]) => {
        if (messages.length === 0) return
        
        const firstUserMessage = messages.find(m => m.role === 'user')
        const title = firstUserMessage?.content.slice(0, 30) + '...' || '新对话'
        
        // 生成唯一ID，避免时间戳冲突
        const uniqueId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        const newHistory: ChatHistory = {
          id: uniqueId,
          title,
          messages,
          createdAt: Date.now()
        }
        
        set((state) => ({
          chatHistories: [newHistory, ...state.chatHistories.slice(0, 19)] // 保留最近20条
        }))
      },
      
      deleteChatHistory: (id: string) => {
        set((state) => ({
          chatHistories: state.chatHistories.filter(h => h.id !== id)
        }))
      },
      
      clearAllHistory: () => set({ chatHistories: [] }),
      
      resetSettings: () => set(defaultSettings),
      
      toggleGlobalSync: () => {
        set((state) => ({ isGlobalSync: !state.isGlobalSync }))
      },
      
      syncFromServer: async () => {
        try {
          console.log('🔄 开始从服务器同步设置...')
          const response = await fetch('/api/settings')
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const result = await response.json()
          
          if (result.success && result.data) {
            const serverSettings = result.data
            console.log('📥 服务器设置:', {
              hasApiKey: !!serverSettings.apiKey,
              systemPromptLength: serverSettings.systemPrompt?.length || 0,
              knowledgeFileCount: serverSettings.knowledgeBaseFiles?.length || 0,
              knowledgeFiles: serverSettings.knowledgeBaseFiles?.map((f: any) => f.filename) || [],
              knowledgeUrlCount: serverSettings.knowledgeBaseUrls?.length || 0,
              knowledgeUrls: serverSettings.knowledgeBaseUrls?.map((u: any) => u.title) || []
            })
            
            // 只同步服务器上存在的设置，保留本地其他设置
            const currentState = get()
            set({
              apiKey: serverSettings.apiKey || currentState.apiKey,
              apiBaseUrl: serverSettings.apiBaseUrl || currentState.apiBaseUrl,
              systemPrompt: serverSettings.systemPrompt || currentState.systemPrompt,
              knowledgeBaseFiles: serverSettings.knowledgeBaseFiles || currentState.knowledgeBaseFiles,
              knowledgeBaseUrls: serverSettings.knowledgeBaseUrls || currentState.knowledgeBaseUrls,
              temperature: serverSettings.temperature !== undefined ? serverSettings.temperature : currentState.temperature,
              modelName: serverSettings.modelName || currentState.modelName,
              lastSyncTime: Date.now()
            })
            console.log('✅ 设置同步完成')
          } else {
            console.warn('⚠️ 服务器返回失败:', result.error || '未知错误')
            throw new Error(result.error || '同步失败')
          }
        } catch (error) {
          console.error('❌ 同步设置失败:', error)
          throw error
        }
      },
      
      saveToServer: async () => {
        try {
          const state = get()
          const settingsToSync = {
            apiKey: state.apiKey,
            apiBaseUrl: state.apiBaseUrl,
            systemPrompt: state.systemPrompt,
            knowledgeBaseFiles: state.knowledgeBaseFiles,
            knowledgeBaseUrls: state.knowledgeBaseUrls,
            temperature: state.temperature,
            modelName: state.modelName
          }
          
          console.log('📤 推送设置到服务器:', {
            hasApiKey: !!settingsToSync.apiKey,
            systemPromptLength: settingsToSync.systemPrompt?.length || 0,
            knowledgeFileCount: settingsToSync.knowledgeBaseFiles?.length || 0,
            knowledgeFiles: settingsToSync.knowledgeBaseFiles?.map(f => f.filename) || [],
            knowledgeUrlCount: settingsToSync.knowledgeBaseUrls?.length || 0,
            knowledgeUrls: settingsToSync.knowledgeBaseUrls?.map(u => u.title) || []
          })
          
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsToSync)
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const result = await response.json()
          if (result.success) {
            set({ lastSyncTime: Date.now() })
            console.log('✅ 设置推送成功')
          } else {
            console.warn('⚠️ 推送失败:', result.error)
            throw new Error(result.error || '推送失败')
          }
        } catch (error) {
          console.error('❌ 保存设置失败:', error)
          throw error
        }
      }
    }),
    {
      name: 'ai-settings-storage',
      // 确保所有重要设置都被持久化
      partialize: (state) => ({
        apiKey: state.apiKey,
        apiBaseUrl: state.apiBaseUrl,
        systemPrompt: state.systemPrompt,
        knowledgeBaseFiles: state.knowledgeBaseFiles,
        knowledgeBaseUrls: state.knowledgeBaseUrls,
        temperature: state.temperature,
        modelName: state.modelName,
        modelHistory: state.modelHistory,
        chatHistories: state.chatHistories,
        isGlobalSync: state.isGlobalSync,
        lastSyncTime: state.lastSyncTime
      }),
      // 版本控制，避免不兼容的数据结构
      version: 2,
      // 添加迁移函数来处理版本变化
      migrate: (persistedState: any, version: number) => {
        console.log('🔄 正在迁移设置存储，版本:', version)
        
        // 如果是从旧版本迁移，返回默认设置
        if (version < 2) {
          console.log('📝 从旧版本迁移，使用默认设置')
          return defaultSettings
        }
        
        // 确保所有必需的字段都存在
        const migratedState = {
          ...defaultSettings,
          ...persistedState
        }
        
        // 验证数据结构
        if (!Array.isArray(migratedState.knowledgeBaseFiles)) {
          migratedState.knowledgeBaseFiles = []
        }
        if (!Array.isArray(migratedState.knowledgeBaseUrls)) {
          migratedState.knowledgeBaseUrls = []
        }
        if (!Array.isArray(migratedState.modelHistory)) {
          migratedState.modelHistory = defaultSettings.modelHistory
        }
        if (!Array.isArray(migratedState.chatHistories)) {
          migratedState.chatHistories = []
        }
        
        console.log('✅ 设置迁移完成')
        return migratedState
      },
      // 添加错误处理
      onRehydrateStorage: () => {
        console.log('🔄 开始恢复设置存储...')
        return (state, error) => {
          if (error) {
            console.error('❌ 恢复设置存储失败:', error)
            // 如果恢复失败，重置为默认设置
            useAiSettings.setState(defaultSettings)
          } else {
            console.log('✅ 设置存储恢复完成')
          }
        }
      },
      // 跳过服务端渲染时的水合
      skipHydration: false
    }
  )
) 