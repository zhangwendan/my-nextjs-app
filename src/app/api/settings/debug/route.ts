import { NextRequest } from 'next/server'

// 引用全局设置（需要与设置API保持一致）
const getGlobalSettings = () => {
  // 这里需要访问设置API中的globalSettings
  // 为了简化，我们直接创建一个测试接口
  return fetch('/api/settings').then(res => res.json())
}

export async function GET() {
  try {
    const response = await fetch('http://localhost:3000/api/settings')
    const result = await response.json()
    
    if (result.success) {
      const settings = result.data
      return Response.json({
        success: true,
        debug: {
          hasApiKey: !!settings.apiKey,
          hasSystemPrompt: !!settings.systemPrompt,
          knowledgeFileCount: settings.knowledgeBaseFiles?.length || 0,
          knowledgeFiles: settings.knowledgeBaseFiles?.map((file: any) => ({
            id: file.id,
            filename: file.filename,
            size: file.size,
            uploadTime: new Date(file.uploadTime).toLocaleString()
          })) || [],
          temperature: settings.temperature,
          modelName: settings.modelName,
          lastUpdated: new Date(settings.lastUpdated).toLocaleString()
        }
      })
    } else {
      return Response.json({
        success: false,
        error: '无法获取设置'
      })
    }
  } catch (error) {
    return Response.json({
      success: false,
      error: '调试接口错误',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 