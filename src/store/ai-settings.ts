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

interface AiSettingsState {
  apiKey: string
  apiBaseUrl: string
  systemPrompt: string
  knowledgeBaseContent: string | null
  knowledgeFileName: string | null
  temperature: number
  modelName: string
  modelHistory: string[]
  chatHistories: ChatHistory[]
  
  // Actions
  setApiKey: (key: string) => void
  setApiBaseUrl: (url: string) => void
  setSystemPrompt: (prompt: string) => void
  setKnowledgeBase: (content: string | null, filename: string | null) => void
  setTemperature: (temp: number) => void
  setModelName: (name: string) => void
  addModelToHistory: (modelName: string) => void
  saveChatHistory: (messages: Message[]) => void
  deleteChatHistory: (id: string) => void
  clearAllHistory: () => void
  resetSettings: () => void
}

const defaultSettings = {
  apiKey: '',
  apiBaseUrl: 'https://aihubmix.com/v1/chat/completions',
  systemPrompt: '你是锦鲤君-东风，一位可爱而聪明的AI助手。请以友好、亲切的语气回答用户的问题。',
  knowledgeBaseContent: null,
  knowledgeFileName: null,
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
  modelHistory: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-haiku', 'claude-3-sonnet'] as string[],
  chatHistories: [] as ChatHistory[]
}

export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      setApiKey: (key: string) => set({ apiKey: key }),
      setApiBaseUrl: (url: string) => set({ apiBaseUrl: url }),
      setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
      setKnowledgeBase: (content: string | null, filename: string | null) => 
        set({ knowledgeBaseContent: content, knowledgeFileName: filename }),
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
      
      resetSettings: () => set(defaultSettings)
    }),
    {
      name: 'ai-settings-storage'
    }
  )
) 