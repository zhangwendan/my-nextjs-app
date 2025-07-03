import { NextRequest } from 'next/server'

// 简单的内存存储，实际项目中应该使用数据库
let globalSettings = {
  apiKey: '',
  apiBaseUrl: 'https://aihubmix.com/v1/chat/completions',
  systemPrompt: '你是锦鲤君-东风，一位可爱而聪明的AI助手。请以友好、亲切的语气回答用户的问题。',
  knowledgeBaseFiles: [] as Array<{
    id: string
    content: string
    filename: string
    uploadTime: number
    size: number
  }>,
  knowledgeBaseUrls: [] as Array<{
    id: string
    url: string
    title: string
    description?: string
    addTime: number
  }>,
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
  lastUpdated: Date.now()
}

// GET: 获取全局设置
export async function GET() {
  try {
    return Response.json({ 
      success: true, 
      data: globalSettings 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: '获取设置失败' 
    }, { status: 500 })
  }
}

// POST: 保存全局设置
export async function POST(req: NextRequest) {
  try {
    const newSettings = await req.json()
    
    // 更新全局设置
    globalSettings = {
      ...globalSettings,
      ...newSettings,
      lastUpdated: Date.now()
    }

    return Response.json({ 
      success: true, 
      message: '设置已保存并同步到所有用户',
      data: globalSettings 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: '保存设置失败' 
    }, { status: 500 })
  }
}

// DELETE: 重置设置
export async function DELETE() {
  try {
    globalSettings = {
      apiKey: '',
      apiBaseUrl: 'https://aihubmix.com/v1/chat/completions',
      systemPrompt: '你是锦鲤君-东风，一位可爱而聪明的AI助手。请以友好、亲切的语气回答用户的问题。',
      knowledgeBaseFiles: [],
      knowledgeBaseUrls: [],
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo',
      lastUpdated: Date.now()
    }

    return Response.json({ 
      success: true, 
      message: '设置已重置' 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: '重置设置失败' 
    }, { status: 500 })
  }
} 