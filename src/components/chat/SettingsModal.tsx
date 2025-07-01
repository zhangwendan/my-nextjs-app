'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// import { Slider } from '@radix-ui/react-slider' // 暂时注释掉
import { useAiSettings } from '@/store/ai-settings'
import { toast } from 'sonner'
import { Eye, EyeOff, Upload, X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SETTINGS_PASSWORD = 'zwd155155'

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  const {
    apiKey,
    apiBaseUrl,
    systemPrompt,
    knowledgeBaseContent,
    knowledgeFileName,
    temperature,
    modelName,
    setApiKey,
    setApiBaseUrl,
    setSystemPrompt,
    setKnowledgeBase,
    setTemperature,
    setModelName
  } = useAiSettings()

  const [localSettings, setLocalSettings] = useState({
    apiKey,
    apiBaseUrl,
    systemPrompt,
    temperature,
    modelName
  })

  const handlePasswordSubmit = () => {
    if (passwordInput === SETTINGS_PASSWORD) {
      setPasswordVerified(true)
      setPasswordInput('')
      toast.success('密码验证成功')
    } else {
      toast.error('密码错误')
      setPasswordInput('')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const supportedTypes = [
      'text/plain',           // .txt
      'text/markdown',        // .md
      'application/json',     // .json
      'text/csv',            // .csv
      'application/pdf',     // .pdf (需要特殊处理)
      'application/msword',  // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ]

    const fileExtension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = ['txt', 'md', 'json', 'csv', 'pdf', 'doc', 'docx']

    if (supportedTypes.includes(file.type) || supportedExtensions.includes(fileExtension || '')) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        let content = e.target?.result as string
        
        // 根据文件类型做简单的内容处理
        if (fileExtension === 'json') {
          try {
            const jsonData = JSON.parse(content)
            content = JSON.stringify(jsonData, null, 2)
          } catch (error) {
            toast.error('JSON文件格式错误')
            return
          }
        }
        
        setKnowledgeBase(content, file.name)
        toast.success(`知识库文件 "${file.name}" 上传成功`)
      }
      
      reader.onerror = () => {
        toast.error('文件读取失败')
      }
      
      // PDF等二进制文件需要特殊处理
      if (file.type === 'application/pdf') {
        toast.warning('PDF文件已上传，但可能需要先转换为文本格式以获得最佳效果')
      }
      
      reader.readAsText(file, 'UTF-8')
    } else {
      toast.error('支持的文件格式：.txt, .md, .json, .csv, .pdf, .doc, .docx')
    }
  }

  const handleSave = () => {
    setApiKey(localSettings.apiKey)
    setApiBaseUrl(localSettings.apiBaseUrl)
    setSystemPrompt(localSettings.systemPrompt)
    setTemperature(localSettings.temperature)
    setModelName(localSettings.modelName)
    toast.success('设置已保存')
    onOpenChange(false)
    setPasswordVerified(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    setPasswordVerified(false)
    setPasswordInput('')
    // 重置本地设置
    setLocalSettings({
      apiKey,
      apiBaseUrl,
      systemPrompt,
      temperature,
      modelName
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
        </DialogHeader>
        
        {!passwordVerified ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>请输入密码</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="输入密码以访问设置"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              验证密码
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>API 服务地址</Label>
              <div className="space-y-2">
                <Input
                  value={localSettings.apiBaseUrl}
                  onChange={(e) => {
                    // 清理URL - 移除可能的@符号和多余空格
                    let cleanUrl = e.target.value.trim().replace(/^@+/, '')
                    setLocalSettings(prev => ({ ...prev, apiBaseUrl: cleanUrl }))
                  }}
                  placeholder="输入API服务地址"
                />
                <div className="grid grid-cols-1 gap-1">
                  <p className="text-xs text-gray-500 mb-1">常用服务商:</p>
                  <div className="flex flex-wrap gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setLocalSettings(prev => ({ ...prev, apiBaseUrl: 'https://aihubmix.com/v1/chat/completions' }))}
                    >
                      AIHubMix
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setLocalSettings(prev => ({ ...prev, apiBaseUrl: 'https://api.openai.com/v1/chat/completions' }))}
                    >
                      OpenAI
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setLocalSettings(prev => ({ ...prev, apiBaseUrl: 'https://api.anthropic.com/v1/messages' }))}
                    >
                      Claude
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-red-500">⚠️ 请确保URL格式正确，不要包含@符号</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API 密钥</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="输入你的 API 密钥"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>模型名称</Label>
              <Input
                value={localSettings.modelName}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="例如: gpt-3.5-turbo"
              />
            </div>

            <div className="space-y-2">
              <Label>系统提示词</Label>
              <Textarea
                value={localSettings.systemPrompt}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="设置 AI 的角色和行为"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>知识库</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="knowledge-file"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="knowledge-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      上传知识库文件
                    </label>
                  </Button>
                  {knowledgeFileName && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <span>{knowledgeFileName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setKnowledgeBase(null, null)}
                        className="h-auto p-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">支持格式：.txt, .md, .json, .csv, .pdf, .doc, .docx</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>模型温度</Label>
              <Input
                type="number"
                value={localSettings.temperature}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)) }))}
                min={0}
                max={1}
                step={0.1}
                placeholder="0.0 - 1.0"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 (精确)</span>
                <span>1 (创意)</span>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              保存设置
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 