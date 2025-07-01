import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey, apiBaseUrl, systemPrompt, knowledgeBase, temperature } = await req.json()

    // 基本验证
    if (!apiKey) {
      return Response.json({ error: 'API Key 未配置，请在设置中填入有效的API密钥' }, { status: 400 })
    }

    if (!apiBaseUrl) {
      return Response.json({ error: 'API服务地址未配置，请在设置中填入正确的API地址' }, { status: 400 })
    }

    // URL格式验证
    try {
      const url = new URL(apiBaseUrl)
      if (!url.protocol.startsWith('http')) {
        throw new Error('URL必须使用http或https协议')
      }
    } catch (urlError) {
      return Response.json({ error: `API地址格式错误: ${apiBaseUrl}。请确保格式正确，例如: https://aihubmix.com/v1/chat/completions` }, { status: 400 })
    }

    // 构建完整的系统提示词
    let fullSystemPrompt = systemPrompt || '你是🦄 锦鲤君-东风 ✨，一位经验丰富的AI助手。'
    
    if (knowledgeBase) {
      fullSystemPrompt += '\n\n以下是相关的知识库内容，请结合这些信息回答用户问题：\n' + knowledgeBase
    }

    // 构建消息数组
    const chatMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages
    ]

    // 调用配置的 AI API
    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: chatMessages,
        temperature: temperature || 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API Error:', errorText)
      
      let errorMessage = `AI API Error: ${response.status}`
      
      // 针对常见错误提供更具体的提示
      switch (response.status) {
        case 404:
          errorMessage = `API地址不存在 (404)。请检查API地址是否正确:\n当前地址: ${apiBaseUrl}\n建议尝试: https://aihubmix.com/v1/chat/completions`
          break
        case 405:
          errorMessage = `请求方法不被允许 (405)。请检查API地址是否正确，确保地址以 /v1/chat/completions 结尾`
          break
        case 401:
          errorMessage = `API密钥无效 (401)。请检查API Key是否正确`
          break
        case 403:
          errorMessage = `访问被拒绝 (403)。请检查API Key权限或账户余额`
          break
        case 429:
          errorMessage = `请求过于频繁 (429)。请稍后重试`
          break
        case 500:
          errorMessage = `服务器内部错误 (500)。AI服务暂时不可用，请稍后重试`
          break
        default:
          errorMessage = `AI API错误 (${response.status}): ${errorText}`
      }
      
      return Response.json({ error: errorMessage }, { status: response.status })
    }

    // 处理流式响应并格式化为前端需要的格式
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(content))
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return Response.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 