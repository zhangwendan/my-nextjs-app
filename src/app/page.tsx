'use client'

import { useEffect, useState } from 'react'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ToolBar } from '@/components/toolbar/ToolBar'
import { LoginModal } from '@/components/auth/LoginModal'
import { useAuth } from '@/store/auth'
import { Toaster } from 'sonner'

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function HomePage() {
	const [loginModalOpen, setLoginModalOpen] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)
	const { isAuthenticated, isDeviceRemembered, generateDeviceId } = useAuth()

	useEffect(() => {
		// 初始化认证状态
		const initializeAuth = async () => {
			try {
				// 确保设备ID存在
				generateDeviceId()
				
				// 检查认证状态
				const isRemembered = isDeviceRemembered()
				const needsLogin = !isAuthenticated && !isRemembered
				
				console.log('认证状态:', {
					isAuthenticated,
					isRemembered,
					needsLogin
				})
				
				if (needsLogin) {
					setLoginModalOpen(true)
				}
				
				setIsInitialized(true)
			} catch (error) {
				console.error('认证初始化失败:', error)
				setIsInitialized(true)
			}
		}
		
		initializeAuth()
	}, [isAuthenticated, isDeviceRemembered, generateDeviceId])

	// 监听认证状态变化
	useEffect(() => {
		if (isInitialized && !isAuthenticated && !isDeviceRemembered()) {
			setLoginModalOpen(true)
		}
	}, [isAuthenticated, isDeviceRemembered, isInitialized])

	// 如果还没有初始化完成，显示加载状态
	if (!isInitialized) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
						<span className="text-white font-bold text-3xl">锦</span>
					</div>
					<h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
						锦鲤君-东风 AI 工具集
					</h1>
					<p className="text-gray-500">初始化中...</p>
				</div>
			</div>
		)
	}

	// 如果未认证且设备未记住，显示登录界面
	if (!isAuthenticated && !isDeviceRemembered()) {
		return (
			<>
				<div className="min-h-screen bg-gray-50 flex items-center justify-center">
					<div className="text-center">
						<div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
							<span className="text-white font-bold text-3xl">锦</span>
						</div>
						<h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
							锦鲤君-东风 AI 工具集
						</h1>
						<p className="text-gray-500">请先登录以使用工具</p>
					</div>
				</div>
				<LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
				<Toaster position="top-right" />
			</>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 双栏布局容器 - 占满整个屏幕高度 */}
			<div className="flex h-screen">
				{/* 左侧 AI 对话区域 - 70% 宽度 */}
				<div className="flex-1 p-4 pr-2">
					<ChatPanel />
				</div>

				{/* 右侧工具栏区域 - 30% 宽度，固定高度，可滚动 */}
				<div className="w-80 p-3 pl-2 h-full">
					<ToolBar />
				</div>
			</div>

			{/* Toast 通知组件 */}
			<Toaster position="top-right" />
		</div>
	)
}
