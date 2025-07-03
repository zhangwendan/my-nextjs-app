'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAiSettings } from '@/store/ai-settings'
import { SettingsModal } from './SettingsModal'
import { MessageList } from './MessageList'
import { Settings, Send, Bot, History, Trash2, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// 生成唯一ID的函数
const generateUniqueId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function ChatPanel() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const shouldSaveHistoryRef = useRef(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const { 
    modelName, 
    setModelName, 
    modelHistory,
    addModelToHistory,
    apiKey, 
    apiBaseUrl, 
    systemPrompt, 
    knowledgeBaseFiles, 
    temperature, 
    chatHistories,
    saveChatHistory,
    deleteChatHistory,
    clearAllHistory,
    isGlobalSync,
    syncFromServer
  } = useAiSettings()

  // 在 effect 中保存聊天历史，避免在渲染期间更新状态
  useEffect(() => {
    if (shouldSaveHistoryRef.current && messages.length >= 2) {
      const finalMessages = messages.map(msg => ({
        ...msg,
        timestamp: Date.now()
      }))
      saveChatHistory(finalMessages)
      shouldSaveHistoryRef.current = false
    }
  }, [messages, saveChatHistory])

  // 处理模型选择
  const handleModelSelect = (selectedModel: string) => {
    setModelName(selectedModel)
    addModelToHistory(selectedModel)
    setModelDropdownOpen(false)
  }

  // 处理模型输入框回车
  const handleModelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addModelToHistory(modelName)
      setModelDropdownOpen(false)
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!apiKey || !input.trim() || isLoading) {
      return
    }

    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 创建初始的 AI 消息
    const aiMessageId = generateUniqueId()
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: ''
    }

    setMessages(prev => [...prev, aiMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model: modelName,
          apiKey,
          apiBaseUrl,
          systemPrompt,
          knowledgeBaseFiles,
          temperature
        }),
      })

      if (!response.ok) {
        // 尝试解析错误响应
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // 如果无法解析 JSON，使用默认错误消息
        }
        throw new Error(errorMessage)
      }

      // 检查响应是否为流式
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('text/plain')) {
        // 可能是 JSON 错误响应
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || '服务器返回了非预期的响应')
        } catch (jsonError) {
          throw new Error('服务器响应格式错误')
        }
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let content = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          content += chunk

          // 更新消息内容
          setMessages(prev => {
            const updatedMessages = prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content }
                : msg
            )
            return updatedMessages
          })
        }
        
        // 标记需要保存历史记录
        shouldSaveHistoryRef.current = true
      } catch (streamError) {
        console.error('Stream processing error:', streamError)
        // 移除空的 AI 消息并显示错误
        setMessages(prev => prev.filter(msg => msg.id !== aiMessageId))
        throw new Error('处理AI响应时出错')
      }
     } catch (error) {
       console.error('Chat error:', error)
       
       // 移除可能的空 AI 消息
       setMessages(prev => prev.filter(msg => msg.id !== aiMessageId))
       
       const errorMessage = error instanceof Error ? error.message : '发送消息失败'
       toast.error(errorMessage)
     } finally {
       setIsLoading(false)
     }
  }

  // 处理知识库拉取最新
  const handleSyncFromServer = async () => {
    try {
      await syncFromServer()
      toast.success('知识库已更新到最新版本')
    } catch (error) {
      toast.error('知识库更新失败')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-500" />
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent font-bold">
                🦄 锦鲤君-东风 ✨
              </span>
            </div>
            <p className="text-xs text-gray-600 font-normal italic">
              东风已至，锦鲤自来，请君执笔，签下山海
            </p>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="relative"
            >
              <History className="h-4 w-4" />
              {chatHistories.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {chatHistories.length > 9 ? '9+' : chatHistories.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncFromServer}
              title="拉取最新知识库"
              className="text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">模型:</span>
          <Popover open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
            <PopoverTrigger asChild>
              <div className="flex-1">
                <Input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  onKeyDown={handleModelKeyDown}
                  onFocus={() => setModelDropdownOpen(true)}
                  placeholder="输入模型名称"
                  className="h-8"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="max-h-40 overflow-y-auto">
                {modelHistory.map((model, index) => (
                  <div
                    key={`model-${index}-${model}`}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleModelSelect(model)}
                  >
                    <span>{model}</span>
                    <span className="text-xs text-gray-400">历史记录</span>
                  </div>
                ))}
                {modelHistory.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    暂无历史记录
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-4">
        <div className="flex-1 min-h-0">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        <form onSubmit={onSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={apiKey ? "输入你的问题..." : "请先在设置中配置 API Key"}
            disabled={!apiKey || isLoading}
            className="flex-1 h-12 text-base px-4"
          />
          <Button 
            type="submit" 
            disabled={!apiKey || !input.trim() || isLoading}
            className="h-12 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>

        {!apiKey && (
          <div className="text-center text-sm text-orange-600 bg-orange-50 p-2 rounded">
            请点击设置按钮配置 API Key 后开始对话
          </div>
        )}
      </CardContent>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      
      {/* 聊天历史对话框 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              聊天历史
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索聊天记录..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="flex-1"
              />
              {historySearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistorySearchQuery('')}
                >
                  清除
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                共 {chatHistories.filter(history => 
                  historySearchQuery === '' || 
                  history.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                  history.messages.some(msg => 
                    msg.content.toLowerCase().includes(historySearchQuery.toLowerCase())
                  )
                ).length} 条记录
              </p>
              {chatHistories.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    clearAllHistory()
                    toast.success('已清空所有聊天历史')
                    setHistorySearchQuery('')
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清空全部
                </Button>
              )}
            </div>
            
            {chatHistories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无聊天记录</p>
                <p className="text-sm">开始对话后，历史记录会自动保存在这里</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chatHistories
                  .filter(history => 
                    historySearchQuery === '' || 
                    history.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                    history.messages.some(msg => 
                      msg.content.toLowerCase().includes(historySearchQuery.toLowerCase())
                    )
                  )
                  .map((history) => (
                  <div key={history.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 cursor-pointer space-y-1" onClick={() => {
                      setMessages(history.messages.map(m => ({
                        id: generateUniqueId(), // 为加载的历史消息生成新的唯一ID
                        role: m.role,
                        content: m.content
                      })))
                      setHistoryOpen(false)
                      toast.success('已加载历史对话')
                    }}>
                      <p className="font-medium text-sm">{history.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(history.createdAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {history.messages.length} 条消息
                      </p>
                      {/* 显示消息预览 */}
                      {historySearchQuery && (
                        <div className="text-xs text-gray-600 mt-1 max-h-12 overflow-hidden">
                          {history.messages
                            .filter(msg => msg.content.toLowerCase().includes(historySearchQuery.toLowerCase()))
                            .slice(0, 1)
                            .map((msg, msgIndex) => (
                              <div key={`${history.id}-preview-${msgIndex}`} className="truncate">
                                <span className="font-medium">{msg.role === 'user' ? '你' : 'AI'}:</span> {msg.content}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChatHistory(history.id)
                        toast.success('已删除该聊天记录')
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {/* 搜索无结果提示 */}
                {historySearchQuery && 
                 chatHistories.filter(history => 
                   history.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                   history.messages.some(msg => 
                     msg.content.toLowerCase().includes(historySearchQuery.toLowerCase())
                   )
                 ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>未找到包含 "{historySearchQuery}" 的聊天记录</p>
                    <p className="text-sm">尝试使用其他关键词搜索</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 