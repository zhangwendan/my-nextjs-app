import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages, model, apiKey, apiBaseUrl, systemPrompt, knowledgeBaseFiles, temperature } = await req.json()

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
    
    // 处理多个知识库文件
    if (knowledgeBaseFiles && Array.isArray(knowledgeBaseFiles) && knowledgeBaseFiles.length > 0) {
      fullSystemPrompt += '\n\n=== 知识库信息 ===\n'
      fullSystemPrompt += '以下是相关的知识库内容，请结合这些信息回答用户问题：\n\n'
      
      knowledgeBaseFiles.forEach((file, index) => {
        if (file && file.content && file.filename) {
          fullSystemPrompt += `--- 文件 ${index + 1}: ${file.filename} ---\n`
          fullSystemPrompt += `${file.content}\n\n`
        }
      })
      
      fullSystemPrompt += '=== 知识库结束 ===\n'
      fullSystemPrompt += '请基于以上知识库内容和你的知识来回答用户问题。如果知识库中有相关信息，请优先使用知识库的内容。'
    }

    // 检查系统提示词长度并给出反馈
    const promptLength = fullSystemPrompt.length
    console.log(`系统提示词长度: ${promptLength} 字符`)
    
    if (promptLength > 10000) {
      console.log('✓ 检测到长指示词 (>10k字符)，系统完全支持')
    }

    // 检查是否有图片消息
    const hasImageMessage = messages.some((msg: any) => msg.imageUrl)
    
    // 构建消息数组，支持图片
    const chatMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.map((msg: any) => {
        if (msg.imageUrl) {
          // 构建支持图片的消息格式
          return {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: msg.content
              },
              {
                type: 'image_url',
                image_url: {
                  url: msg.imageUrl
                }
              }
            ]
          }
        }
        return {
          role: msg.role,
          content: msg.content
        }
      })
    ]

    // 如果有图片消息，添加图片识别提示
    if (hasImageMessage) {
      fullSystemPrompt += '\n\n=== 图片识别说明 ===\n'
      fullSystemPrompt += '用户可能会发送图片，请仔细分析图片内容并提供详细的描述和回答。如果图片不清晰或无法识别，请说明具体原因。'
    }

    // 计算总token估算 (粗略估算: 1中文字符≈1.5tokens, 1英文字符≈0.25tokens)
    const estimatedTokens = Math.ceil(fullSystemPrompt.length * 1.2 + 
      messages.reduce((sum: number, msg: any) => sum + (msg.content?.length || 0), 0) * 1.2)
    
    console.log(`预估总token数: ${estimatedTokens}`)
    
    if (estimatedTokens > 50000) {
      console.log('⚠️ 检测到超长对话，可能会影响响应速度')
    }

    if (hasImageMessage) {
      console.log('🖼️ 检测到图片消息，使用图片识别模式')
    }

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
        // 如果有图片，可能需要增加最大token数
        ...(hasImageMessage && { max_tokens: 4000 })
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API Error:', errorText)
      
      let errorMessage = `AI API Error: ${response.status}`
      
      // 针对常见错误提供更具体的提示
      switch (response.status) {
        case 400:
          // 处理参数错误
          if (errorText.includes('max_tokens') || errorText.includes('invalid')) {
            errorMessage = `API参数错误 (400)。请检查以下几点：\n1. API Key是否正确\n2. 模型名称是否支持\n3. 如果使用长指示词，请适当缩短内容`
          } else if (hasImageMessage) {
            errorMessage = `图片识别请求失败 (400)。请检查：\n1. 使用的模型是否支持图片识别（推荐使用 gpt-4-vision-preview 或 gpt-4o）\n2. 图片格式是否正确\n3. 图片大小是否符合要求`
          } else {
            errorMessage = `请求参数错误 (400)。请检查API Key和请求参数是否正确`
          }
          break
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
        case 413:
          errorMessage = `请求内容过大 (413)。您的知识库或消息内容可能过长，请尝试：\n1. 减少知识库文件数量或大小\n2. 缩短系统提示词\n3. 清除部分历史对话\n4. 如果上传了图片，请尝试压缩图片大小`
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
        // 添加自定义头部来传递调试信息
        'X-Prompt-Length': promptLength.toString(),
        'X-Estimated-Tokens': estimatedTokens.toString(),
        'X-Knowledge-Files': knowledgeBaseFiles ? knowledgeBaseFiles.length.toString() : '0',
        'X-Has-Image': hasImageMessage.toString()
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