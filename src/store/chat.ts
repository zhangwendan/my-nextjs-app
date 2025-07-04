import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string // 支持图片消息
  documentName?: string // 支持文档名称
}

interface ChatState {
  messages: Message[]
  addMessage: (message: Message) => void
  clearMessages: () => void
  updateMessage: (id: string, content: string) => void
  setMessages: (messages: Message[]) => void
  deleteMessage: (id: string) => void
}

export const useChat = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      
      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message]
        }))
      },
      
      clearMessages: () => {
        set({ messages: [] })
      },
      
      updateMessage: (id: string, content: string) => {
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, content } : msg
          )
        }))
      },
      
      setMessages: (messages: Message[]) => {
        set({ messages })
      },
      
      deleteMessage: (id: string) => {
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== id)
        }))
      }
    }),
    {
      name: 'chat-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        console.log('🔄 正在迁移聊天存储，版本:', version)
        
        if (!persistedState || !Array.isArray(persistedState.messages)) {
          console.log('📝 聊天存储数据异常，重置为空')
          return { messages: [] }
        }
        
        const validMessages = persistedState.messages.filter((msg: any) => {
          return msg && typeof msg === 'object' && 
                 typeof msg.id === 'string' && 
                 typeof msg.role === 'string' && 
                 typeof msg.content === 'string' && 
                 typeof msg.timestamp === 'number'
        })
        
        console.log('✅ 聊天存储迁移完成')
        return { messages: validMessages }
      },
      onRehydrateStorage: () => {
        console.log('🔄 开始恢复聊天存储...')
        return (state, error) => {
          if (error) {
            console.error('❌ 恢复聊天存储失败:', error)
            useChat.setState({ messages: [] })
          } else {
            console.log('✅ 聊天存储恢复完成')
          }
        }
      }
    }
  )
) 