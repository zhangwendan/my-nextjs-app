'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Bot, X, FileText } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string
  documentName?: string
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onDeleteMessage?: (messageId: string) => void
}

export function MessageList({ messages, isLoading, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div className="space-y-2">
          <Bot className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">
            欢迎使用 🦄 锦鲤君-东风 ✨ AI 助手
          </h3>
          <p className="text-gray-500">
            东风已至，锦鲤自来～我是你的专属AI助手，随时为您提供支持和解答呢！
          </p>
          <p className="text-sm text-blue-600 mt-2">
            💡 支持粘贴图片 | 支持上传文档 (.txt, .md, .json, .csv) | 可删除单条消息
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 items-start ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* AI头像 - 始终在左侧 */}
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          )}
          
          {/* 消息气泡 - 修复宽度和对齐问题 */}
          <div className={`flex flex-col max-w-[75%] ${
            message.role === 'user' ? 'items-end' : 'items-start'
          }`}>
            <Card className={`p-3 relative group ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-200'
            }`}>
              {/* 删除按钮 */}
              {onDeleteMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteMessage(message.id)}
                  className={`absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 rounded-full ${
                    message.role === 'user' 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title="删除这条消息"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              <div className="space-y-2">
                {/* 文档标记 */}
                {message.documentName && (
                  <div className={`flex items-center gap-1 text-xs ${
                    message.role === 'user' ? 'text-blue-100' : 'text-blue-600'
                  }`}>
                    <FileText className="h-3 w-3" />
                    <span>文档: {message.documentName}</span>
                  </div>
                )}

                {/* 显示图片 */}
                {message.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.imageUrl} 
                      alt="用户上传的图片" 
                      className="max-w-full max-h-48 object-contain rounded-lg border"
                    />
                  </div>
                )}
                
                {/* 显示文本内容 */}
                {message.content && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                )}
                
                {/* 显示时间戳 */}
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </Card>
          </div>

          {/* 用户头像 - 始终在右侧 */}
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex gap-3 justify-start items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="max-w-[75%]">
            <Card className="p-3 bg-white border border-gray-200">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-xs text-gray-500 ml-1">AI正在思考中...</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}