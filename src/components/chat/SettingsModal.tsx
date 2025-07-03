'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAiSettings } from '@/store/ai-settings'
import { toast } from 'sonner'
import { Eye, EyeOff, Upload, X, Download, Cloud, CloudOff, FileText, Trash2, Link, Plus, Edit } from 'lucide-react'

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
  const [uploading, setUploading] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newUrlTitle, setNewUrlTitle] = useState('')
  const [newUrlDescription, setNewUrlDescription] = useState('')
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  
  const {
    apiKey,
    apiBaseUrl,
    systemPrompt,
    knowledgeBaseFiles,
    knowledgeBaseUrls,
    temperature,
    modelName,
    isGlobalSync,
    lastSyncTime,
    setApiKey,
    setApiBaseUrl,
    setSystemPrompt,
    addKnowledgeFile,
    removeKnowledgeFile,
    clearKnowledgeFiles,
    addKnowledgeUrl,
    removeKnowledgeUrl,
    updateKnowledgeUrl,
    clearKnowledgeUrls,
    setTemperature,
    setModelName,
    toggleGlobalSync,
    syncFromServer,
    saveToServer
  } = useAiSettings()

  const [localSettings, setLocalSettings] = useState({
    apiKey,
    apiBaseUrl,
    systemPrompt,
    temperature,
    modelName
  })

  // 同步本地设置
  useEffect(() => {
    setLocalSettings({
      apiKey,
      apiBaseUrl,
      systemPrompt,
      temperature,
      modelName
    })
  }, [apiKey, apiBaseUrl, systemPrompt, temperature, modelName])

  // 自动从服务器同步设置
  useEffect(() => {
    if (isGlobalSync && passwordVerified) {
      syncFromServer()
    }
  }, [isGlobalSync, passwordVerified])

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    const supportedTypes = [
      'text/plain',           // .txt
      'text/markdown',        // .md
      'application/json',     // .json
      'text/csv',            // .csv
      'application/pdf',     // .pdf
      'application/msword',  // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ]

    try {
      for (const file of Array.from(files)) {
        // 检查文件大小 (最大50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`文件 "${file.name}" 超过50MB限制`)
          continue
        }

        const fileExtension = file.name.toLowerCase().split('.').pop()
        const supportedExtensions = ['txt', 'md', 'json', 'csv', 'pdf', 'doc', 'docx']

        if (supportedTypes.includes(file.type) || supportedExtensions.includes(fileExtension || '')) {
          const reader = new FileReader()
          
          await new Promise<void>((resolve, reject) => {
            reader.onload = (e) => {
              try {
                let content = e.target?.result as string
                
                // 根据文件类型做简单的内容处理
                if (fileExtension === 'json') {
                  try {
                    const jsonData = JSON.parse(content)
                    content = JSON.stringify(jsonData, null, 2)
                  } catch (error) {
                    toast.error(`JSON文件 "${file.name}" 格式错误`)
                    resolve()
                    return
                  }
                }
                
                // 检查内容长度
                if (content.length > 500000) {
                  content = content.substring(0, 500000) + '\n...[文件内容过长，已截断]'
                  toast.warning(`文件 "${file.name}" 内容过长，已自动截断`)
                }
                
                const knowledgeFile = {
                  id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  content,
                  filename: file.name,
                  uploadTime: Date.now(),
                  size: content.length
                }
                
                addKnowledgeFile(knowledgeFile)
                toast.success(`知识库文件 "${file.name}" 上传成功`)
                resolve()
              } catch (error) {
                toast.error(`处理文件 "${file.name}" 失败`)
                reject(error)
              }
            }
            
            reader.onerror = () => {
              toast.error(`读取文件 "${file.name}" 失败`)
              reject(new Error('File read error'))
            }
            
            // PDF等二进制文件需要特殊提示
            if (file.type === 'application/pdf') {
              toast.warning(`PDF文件 "${file.name}" 已上传，但可能需要先转换为文本格式以获得最佳效果`)
            }
            
            reader.readAsText(file, 'UTF-8')
          })
        } else {
          toast.error(`文件 "${file.name}" 格式不支持。支持格式：.txt, .md, .json, .csv, .pdf, .doc, .docx`)
        }
      }
    } finally {
      setUploading(false)
      // 清空文件输入
      event.target.value = ''
    }
  }

  const handleSave = async () => {
    setApiKey(localSettings.apiKey)
    setApiBaseUrl(localSettings.apiBaseUrl)
    setSystemPrompt(localSettings.systemPrompt)
    setTemperature(localSettings.temperature)
    setModelName(localSettings.modelName)
    
    // 如果启用了全局同步，保存到服务器
    if (isGlobalSync) {
      await saveToServer()
      toast.success('设置已保存并同步到服务器')
    } else {
      toast.success('设置已保存到本地')
    }
    
    onOpenChange(false)
    setPasswordVerified(false)
  }

  const handleSyncToggle = async () => {
    if (!isGlobalSync) {
      // 启用同步时，先从服务器拉取最新设置
      await syncFromServer()
      toast.success('已启用全局同步并拉取最新设置')
    } else {
      toast.success('已关闭全局同步')
    }
    toggleGlobalSync()
  }

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      toast.error('请输入网址')
      return
    }

    // 简单的URL验证
    try {
      new URL(newUrl)
    } catch {
      toast.error('请输入有效的网址')
      return
    }

    if (!newUrlTitle.trim()) {
      toast.error('请输入网址标题')
      return
    }

    const urlObj = {
      id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: newUrl.trim(),
      title: newUrlTitle.trim(),
      description: newUrlDescription.trim() || undefined,
      addTime: Date.now()
    }

    addKnowledgeUrl(urlObj)
    setNewUrl('')
    setNewUrlTitle('')
    setNewUrlDescription('')
    toast.success(`网址 "${newUrlTitle}" 已添加到知识库`)
  }

  const handleUpdateUrl = (id: string) => {
    if (!newUrl.trim() || !newUrlTitle.trim()) {
      toast.error('请填写完整的网址和标题')
      return
    }

    try {
      new URL(newUrl)
    } catch {
      toast.error('请输入有效的网址')
      return
    }

    updateKnowledgeUrl(id, {
      url: newUrl.trim(),
      title: newUrlTitle.trim(),
      description: newUrlDescription.trim() || undefined
    })

    setEditingUrlId(null)
    setNewUrl('')
    setNewUrlTitle('')
    setNewUrlDescription('')
    toast.success('网址信息已更新')
  }

  const handleEditUrl = (url: any) => {
    setEditingUrlId(url.id)
    setNewUrl(url.url)
    setNewUrlTitle(url.title)
    setNewUrlDescription(url.description || '')
  }

  const handleCancelEdit = () => {
    setEditingUrlId(null)
    setNewUrl('')
    setNewUrlTitle('')
    setNewUrlDescription('')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN')
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

  // 计算知识库总大小
  const totalKnowledgeSize = knowledgeBaseFiles.reduce((total, file) => total + file.size, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI 设置
            {isGlobalSync && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Cloud className="h-4 w-4" />
                全局同步
              </div>
            )}
          </DialogTitle>
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
            {/* 全局同步开关 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  {isGlobalSync ? <Cloud className="h-5 w-5 text-green-600" /> : <CloudOff className="h-5 w-5 text-gray-400" />}
                  <div>
                    <Label className="text-sm font-medium">全局设置同步</Label>
                    <p className="text-xs text-gray-500">
                      {isGlobalSync 
                        ? `已启用 • 最后同步: ${lastSyncTime ? formatTime(lastSyncTime) : '从未同步'}`
                        : '设置仅保存在本地浏览器'
                      }
                    </p>
                  </div>
                </div>
                <Switch checked={isGlobalSync} onCheckedChange={handleSyncToggle} />
              </div>
              
              {/* 同步调试信息 */}
              {isGlobalSync && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="font-medium text-blue-800 mb-1">📊 同步状态</div>
                  <div className="text-blue-700">
                    • 知识库文件: {knowledgeBaseFiles.length} 个文件
                    {knowledgeBaseFiles.length > 0 && (
                      <div className="ml-2 mt-1">
                        {knowledgeBaseFiles.map(file => (
                          <div key={file.id}>- {file.filename} ({formatFileSize(file.size)})</div>
                        ))}
                      </div>
                    )}
                    • 知识库网址: {knowledgeBaseUrls.length} 个网址
                    {knowledgeBaseUrls.length > 0 && (
                      <div className="ml-2 mt-1">
                        {knowledgeBaseUrls.map(url => (
                          <div key={url.id}>- {url.title}</div>
                        ))}
                      </div>
                    )}
                    • 系统提示词: {localSettings.systemPrompt.length} 字符
                    • API配置: {localSettings.apiKey ? '已设置' : '未设置'}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={async () => {
                        await syncFromServer()
                        toast.success('已从服务器拉取最新设置')
                      }}
                      className="h-6 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      拉取最新
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={async () => {
                        await saveToServer()
                        toast.success('已推送当前设置到服务器')
                      }}
                      className="h-6 text-xs"
                    >
                      <Cloud className="h-3 w-3 mr-1" />
                      立即推送
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>API 服务地址</Label>
              <div className="space-y-2">
                <Input
                  value={localSettings.apiBaseUrl}
                  onChange={(e) => {
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
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>字符数: {localSettings.systemPrompt.length}</span>
                <span className={localSettings.systemPrompt.length > 2000 ? 'text-green-600' : 'text-gray-500'}>
                  {localSettings.systemPrompt.length > 2000 ? '✓ 支持长指示词' : '支持超长指示词 (2000+ 字符)'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>知识库 ({knowledgeBaseFiles.length} 个文件)</Label>
                <div className="text-xs text-gray-500">
                  总大小: {formatFileSize(totalKnowledgeSize)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".txt,.md,.json,.csv,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="knowledge-files"
                    multiple
                  />
                  <Button variant="outline" asChild disabled={uploading}>
                    <label htmlFor="knowledge-files" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? '上传中...' : '选择文件 (支持多选)'}
                    </label>
                  </Button>
                  {knowledgeBaseFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearKnowledgeFiles}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      清空全部
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-gray-500">
                  支持格式：.txt, .md, .json, .csv, .pdf, .doc, .docx (单文件最大50MB)
                </p>
                
                {/* 文件列表 */}
                {knowledgeBaseFiles.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {knowledgeBaseFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{file.filename}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {formatTime(file.uploadTime)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKnowledgeFile(file.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 网址知识库管理 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>知识库网址 ({knowledgeBaseUrls.length} 个网址)</Label>
                {knowledgeBaseUrls.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearKnowledgeUrls}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    清空全部
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {/* 添加/编辑网址表单 */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {editingUrlId ? '编辑网址' : '添加网址'}
                    </span>
                  </div>
                  
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="输入网址 (如: https://example.com)"
                  />
                  
                  <Input
                    value={newUrlTitle}
                    onChange={(e) => setNewUrlTitle(e.target.value)}
                    placeholder="网址标题"
                  />
                  
                  <Input
                    value={newUrlDescription}
                    onChange={(e) => setNewUrlDescription(e.target.value)}
                    placeholder="网址描述 (可选)"
                  />
                  
                  <div className="flex gap-2">
                    {editingUrlId ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateUrl(editingUrlId)}
                          disabled={!newUrl.trim() || !newUrlTitle.trim()}
                        >
                          更新网址
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleAddUrl}
                        disabled={!newUrl.trim() || !newUrlTitle.trim()}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加网址
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* 网址列表 */}
                {knowledgeBaseUrls.length > 0 && (
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {knowledgeBaseUrls.map((urlItem) => (
                      <div key={urlItem.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{urlItem.title}</p>
                            <p className="text-xs text-blue-600 truncate">
                              <a href={urlItem.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {urlItem.url}
                              </a>
                            </p>
                            {urlItem.description && (
                              <p className="text-xs text-gray-500 truncate">{urlItem.description}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatTime(urlItem.addTime)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUrl(urlItem)}
                            className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKnowledgeUrl(urlItem.id)}
                            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500">
                  添加的网址将作为知识库内容，AI可以参考这些网页信息回答问题
                </p>
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
              {isGlobalSync ? '保存并同步设置' : '保存设置'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 