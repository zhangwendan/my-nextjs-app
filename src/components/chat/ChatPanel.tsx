'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAiSettings } from '@/store/ai-settings'
import { useAuth } from '@/store/auth'
import { useChat } from '@/store/chat'
import { SettingsModal } from './SettingsModal'
import { MessageList } from './MessageList'
import { Settings, Send, Bot, History, Trash2, Download, LogOut, Image, Cloud, FileText, X } from 'lucide-react'
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
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<{name: string, content: string} | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const shouldSaveHistoryRef = useRef(false)
  
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
    syncFromServer,
    saveToServer
  } = useAiSettings()
  
  const { logout } = useAuth()
  const { messages, addMessage, clearMessages, updateMessage, setMessages, deleteMessage } = useChat()

  // 处理图片和文档粘贴
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i] && items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile()
            if (file) {
              handleImageFile(file)
            }
          }
        }
      }
    }
    
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  // 处理图片文件
  const handleImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (result && typeof result === 'string') {
        setSelectedImage(result)
        toast.success('图片已上传，请输入问题后发送')
      }
    }
    reader.readAsDataURL(file)
  }

  // 处理文档文件
  const handleDocumentFile = async (file: File) => {
    const supportedTypes = [
      'text/plain',           // .txt
      'text/markdown',        // .md
      'application/json',     // .json
      'text/csv',            // .csv
    ]

    const fileExtension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = ['txt', 'md', 'json', 'csv']

    if (!supportedTypes.includes(file.type) && !supportedExtensions.includes(fileExtension || '')) {
      toast.error('暂时只支持 .txt, .md, .json, .csv 格式的文档')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for chat
      toast.error('文档大小不能超过10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        if (content) {
          setSelectedDocument({
            name: file.name,
            content: content.length > 10000 ? content.substring(0, 10000) + '\n...[文档内容过长，已截断]' : content
          })
          toast.success(`文档 "${file.name}" 已上传，请输入问题后发送`)
        }
      } catch (error) {
        toast.error(`处理文档 "${file.name}" 失败`)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

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

  // 处理图片选择
  const handleImageSelect = () => {
    imageInputRef.current?.click()
  }

  // 处理文档选择
  const handleDocumentSelect = () => {
    docInputRef.current?.click()
  }

  // 处理图片文件选择
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file)
    }
  }

  // 处理文档文件选择
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleDocumentFile(file)
    }
  }

  // 移除选中的图片
  const removeSelectedImage = () => {
    setSelectedImage(null)
  }

  // 移除选中的文档
  const removeSelectedDocument = () => {
    setSelectedDocument(null)
  }

  // 删除单条消息
  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId)
    toast.success('消息已删除')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!apiKey || (!input.trim() && !selectedImage && !selectedDocument) || isLoading) {
      return
    }

    let messageContent = input.trim() || ''
    
    // 如果有文档，将文档内容添加到消息中
    if (selectedDocument) {
      if (messageContent) {
        messageContent += '\n\n'
      }
      messageContent += `【文档：${selectedDocument.name}】\n${selectedDocument.content}`
      if (!input.trim()) {
        messageContent = `请分析这个文档：${selectedDocument.name}\n\n${selectedDocument.content}`
      }
    }
    
    if (selectedImage && !input.trim()) {
      messageContent = '请描述这张图片'
    }

    const userMessage = {
      id: generateUniqueId(),
      role: 'user' as const,
      content: messageContent,
      timestamp: Date.now(),
      imageUrl: selectedImage || undefined,
      documentName: selectedDocument?.name
    }

    addMessage(userMessage)
    setInput('')
    setSelectedImage(null)
    setSelectedDocument(null)
    setIsLoading(true)

    // 创建初始的 AI 消息
    const aiMessageId = generateUniqueId()
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now()
    }

    addMessage(aiMessage)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content,
            imageUrl: m.imageUrl
          })),
          model: modelName,
          apiKey,
          apiBaseUrl,
          systemPrompt,
          knowledgeBaseFiles,
          temperature
        }),
      })

      if (!response.ok) {
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
          updateMessage(aiMessageId, content)
        }
        
        // 标记需要保存历史记录
        shouldSaveHistoryRef.current = true
      } catch (streamError) {
        console.error('Stream processing error:', streamError)
        throw new Error('处理AI响应时出错')
      }
     } catch (error) {
       console.error('Chat error:', error)
       
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

  // 处理云同步
  const handleCloudSync = async () => {
    try {
      await saveToServer()
      toast.success('设置已同步到云端')
    } catch (error) {
      toast.error('云同步失败')
    }
  }

  // 处理退出登录
  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
  }

  // 处理手动清空聊天记录
  const handleClearChat = () => {
    clearMessages()
    toast.success('聊天记录已清空')
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
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
              onClick={handleCloudSync}
              title="云同步设置"
              className="text-green-600 hover:text-green-700"
            >
              <Cloud className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
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

      <CardContent className="flex-1 flex flex-col p-4 pb-0 min-h-0">
        {/* 消息列表区域 - 严格限制高度 */}
        <div className="flex-1 min-h-0 mb-4 overflow-hidden">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            onDeleteMessage={handleDeleteMessage}
          />
        </div>

        {/* 工具按钮区域 - 固定位置 */}
        {messages.length > 0 && (
          <div className="flex justify-center mb-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有聊天记录
            </Button>
          </div>
        )}

        {/* 选中的图片预览 - 固定位置 */}
        {selectedImage && (
          <div className="mb-4 flex-shrink-0">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">已选择图片:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedImage}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={selectedImage}
                alt="Selected"
                className="max-w-full max-h-32 object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* 选中的文档预览 - 固定位置 */}
        {selectedDocument && (
          <div className="mb-4 flex-shrink-0">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">已选择文档: {selectedDocument.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedDocument}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 max-h-20 overflow-y-auto bg-white p-2 rounded border">
                {selectedDocument.content.length > 200 
                  ? selectedDocument.content.substring(0, 200) + '...' 
                  : selectedDocument.content
                }
              </div>
            </div>
          </div>
        )}

        {/* 输入区域 - 固定在底部 */}
        <div className="border-t pt-4 bg-white flex-shrink-0">
          <form onSubmit={onSubmit} className="space-y-3">
            {/* 文本输入框 - 改为多行 */}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={apiKey ? (selectedImage || selectedDocument ? "描述图片/文档或提问..." : "输入你的问题...") : "请先在设置中配置 API Key"}
              disabled={!apiKey || isLoading}
              className="min-h-[80px] text-base resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSubmit(e as any)
                }
              }}
            />
            
            {/* 按钮区域 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleImageSelect}
                  disabled={!apiKey || isLoading}
                  className="h-10 px-4"
                  title="选择图片"
                >
                  <Image className="h-4 w-4 mr-2" />
                  图片
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleDocumentSelect}
                  disabled={!apiKey || isLoading}
                  className="h-10 px-4"
                  title="选择文档"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  文档
                </Button>
              </div>
              
              <Button 
                type="submit" 
                disabled={!apiKey || (!input.trim() && !selectedImage && !selectedDocument) || isLoading}
                className="h-10 px-8"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? '发送中...' : '发送'}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              💡 支持粘贴图片 | 支持文档格式：.txt, .md, .json, .csv | Shift+Enter 换行，Enter 发送
            </p>
          </form>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          style={{ display: 'none' }}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json,text/csv"
          onChange={handleDocumentFileChange}
          style={{ display: 'none' }}
        />

        {!apiKey && (
          <div className="text-center text-sm text-orange-600 bg-orange-50 p-2 rounded mt-4">
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
                      const historyMessages = history.messages.map(m => ({
                        id: generateUniqueId(),
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp || Date.now()
                      }))
                      setMessages(historyMessages)
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 