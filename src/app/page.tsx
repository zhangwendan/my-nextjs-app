'use client'

import { ChatPanel } from '@/components/chat/ChatPanel'
import { ToolBar } from '@/components/toolbar/ToolBar'
import { Toaster } from 'sonner'

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function HomePage() {
	  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 Logo 栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">锦</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              锦鲤君-东风 AI 工具集
            </h1>
            <p className="text-xs text-gray-500 italic">东风已至，锦鲤自来，请君执笔，签下山海</p>
          </div>
        </div>
      </div>
      
      {/* 双栏布局容器 */}
      <div className="flex h-[calc(100vh-76px)]">
				{/* 左侧 AI 对话区域 - 70% 宽度 */}
				<div className="flex-1 p-4 pr-2">
					<ChatPanel />
				</div>

				{/* 右侧工具栏区域 - 30% 宽度 */}
				<div className="w-80 p-4 pl-2 overflow-y-auto">
					<ToolBar />
				</div>
			</div>

			{/* Toast 通知组件 */}
			<Toaster position="top-right" />
		</div>
	)
}
