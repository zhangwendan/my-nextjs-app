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
      
      setApiKey: (key: string) => set({ apiKey: key }),
      setApiBaseUrl: (url: string) => set({ apiBaseUrl: url }),
      setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
      
      addKnowledgeFile: (file: KnowledgeFile) => {
        set((state) => ({
          knowledgeBaseFiles: [...state.knowledgeBaseFiles, file]
        }))
      },
      
      removeKnowledgeFile: (id: string) => {
        set((state) => ({
          knowledgeBaseFiles: state.knowledgeBaseFiles.filter(f => f.id !== id)
        }))
      },
      
      clearKnowledgeFiles: () => set({ knowledgeBaseFiles: [] }),
      
      addKnowledgeUrl: (url: KnowledgeUrl) => {
        set((state) => ({
          knowledgeBaseUrls: [...state.knowledgeBaseUrls, url]
        }))
      },
      
      removeKnowledgeUrl: (id: string) => {
        set((state) => ({
          knowledgeBaseUrls: state.knowledgeBaseUrls.filter(u => u.id !== id)
        }))
      },
      
      updateKnowledgeUrl: (id: string, updates: Partial<KnowledgeUrl>) => {
        set((state) => ({
          knowledgeBaseUrls: state.knowledgeBaseUrls.map(u =>
            u.id === id ? { ...u, ...updates } : u
          )
        }))
      },
      
      clearKnowledgeUrls: () => set({ knowledgeBaseUrls: [] }),
      
      setTemperature: (temp: number) => set({ temperature: temp }),
      setModelName: (name: string) => set({ modelName: name }),
      
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
          const result = await response.json()
          
          if (result.success) {
            const serverSettings = result.data
            console.log('📥 服务器设置:', {
              hasApiKey: !!serverSettings.apiKey,
              systemPromptLength: serverSettings.systemPrompt?.length || 0,
              knowledgeFileCount: serverSettings.knowledgeBaseFiles?.length || 0,
              knowledgeFiles: serverSettings.knowledgeBaseFiles?.map((f: any) => f.filename) || [],
              knowledgeUrlCount: serverSettings.knowledgeBaseUrls?.length || 0,
              knowledgeUrls: serverSettings.knowledgeBaseUrls?.map((u: any) => u.title) || []
            })
            
            set({
              apiKey: serverSettings.apiKey || '',
              apiBaseUrl: serverSettings.apiBaseUrl || defaultSettings.apiBaseUrl,
              systemPrompt: serverSettings.systemPrompt || defaultSettings.systemPrompt,
              knowledgeBaseFiles: serverSettings.knowledgeBaseFiles || [],
              knowledgeBaseUrls: serverSettings.knowledgeBaseUrls || [],
              temperature: serverSettings.temperature || defaultSettings.temperature,
              modelName: serverSettings.modelName || defaultSettings.modelName,
              lastSyncTime: Date.now()
            })
            console.log('✅ 设置同步完成')
          } else {
            console.warn('⚠️ 服务器返回失败:', result.error)
          }
        } catch (error) {
          console.error('❌ 同步设置失败:', error)
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
          
          const result = await response.json()
          if (result.success) {
            set({ lastSyncTime: Date.now() })
            console.log('✅ 设置推送成功')
          } else {
            console.warn('⚠️ 推送失败:', result.error)
          }
        } catch (error) {
          console.error('❌ 保存设置失败:', error)
        }
      }
    }),
    {
      name: 'ai-settings-storage'
    }
  )
) 