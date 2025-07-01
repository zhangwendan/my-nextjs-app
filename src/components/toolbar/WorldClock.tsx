'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Clock, Search } from 'lucide-react'
import { format } from 'date-fns'

// 城市时区映射表
const cityTimezones: Record<string, string> = {
  // 中文城市名
  '北京': 'Asia/Shanghai',
  '上海': 'Asia/Shanghai', 
  '深圳': 'Asia/Shanghai',
  '广州': 'Asia/Shanghai',
  '香港': 'Asia/Hong_Kong',
  '台北': 'Asia/Taipei',
  '东京': 'Asia/Tokyo',
  '首尔': 'Asia/Seoul',
  '新加坡': 'Asia/Singapore',
  '曼谷': 'Asia/Bangkok',
  '雅加达': 'Asia/Jakarta',
  '马尼拉': 'Asia/Manila',
  '胡志明市': 'Asia/Ho_Chi_Minh',
  '吉隆坡': 'Asia/Kuala_Lumpur',
  '孟买': 'Asia/Kolkata',
  '新德里': 'Asia/Kolkata',
  '迪拜': 'Asia/Dubai',
  '伊斯坦布尔': 'Europe/Istanbul',
  '莫斯科': 'Europe/Moscow',
  '柏林': 'Europe/Berlin',
  '巴黎': 'Europe/Paris',
  '伦敦': 'Europe/London',
  '罗马': 'Europe/Rome',
  '马德里': 'Europe/Madrid',
  '阿姆斯特丹': 'Europe/Amsterdam',
  '苏黎世': 'Europe/Zurich',
  '斯德哥尔摩': 'Europe/Stockholm',
  '纽约': 'America/New_York',
  '洛杉矶': 'America/Los_Angeles',
  '旧金山': 'America/Los_Angeles',
  '芝加哥': 'America/Chicago',
  '华盛顿': 'America/New_York',
  '波士顿': 'America/New_York',
  '西雅图': 'America/Los_Angeles',
  '温哥华': 'America/Vancouver',
  '多伦多': 'America/Toronto',
  '蒙特利尔': 'America/Montreal',
  '墨西哥城': 'America/Mexico_City',
  '圣保罗': 'America/Sao_Paulo',
  '里约热内卢': 'America/Sao_Paulo',
  '布宜诺斯艾利斯': 'America/Argentina/Buenos_Aires',
  '利马': 'America/Lima',
  '悉尼': 'Australia/Sydney',
  '墨尔本': 'Australia/Melbourne',
  '珀斯': 'Australia/Perth',
  '奥克兰': 'Pacific/Auckland',
  '开罗': 'Africa/Cairo',
  '约翰内斯堡': 'Africa/Johannesburg',
  '拉各斯': 'Africa/Lagos',
  
  // 英文城市名
  'beijing': 'Asia/Shanghai',
  'shanghai': 'Asia/Shanghai',
  'shenzhen': 'Asia/Shanghai',
  'guangzhou': 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  'taipei': 'Asia/Taipei',
  'tokyo': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'singapore': 'Asia/Singapore',
  'bangkok': 'Asia/Bangkok',
  'jakarta': 'Asia/Jakarta',
  'manila': 'Asia/Manila',
  'ho chi minh': 'Asia/Ho_Chi_Minh',
  'kuala lumpur': 'Asia/Kuala_Lumpur',
  'mumbai': 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'dubai': 'Asia/Dubai',
  'istanbul': 'Europe/Istanbul',
  'moscow': 'Europe/Moscow',
  'berlin': 'Europe/Berlin',
  'paris': 'Europe/Paris',
  'london': 'Europe/London',
  'rome': 'Europe/Rome',
  'madrid': 'Europe/Madrid',
  'amsterdam': 'Europe/Amsterdam',
  'zurich': 'Europe/Zurich',
  'stockholm': 'Europe/Stockholm',
  'new york': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'chicago': 'America/Chicago',
  'washington': 'America/New_York',
  'boston': 'America/New_York',
  'seattle': 'America/Los_Angeles',
  'vancouver': 'America/Vancouver',
  'toronto': 'America/Toronto',
  'montreal': 'America/Montreal',
  'mexico city': 'America/Mexico_City',
  'sao paulo': 'America/Sao_Paulo',
  'rio de janeiro': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'lima': 'America/Lima',
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'perth': 'Australia/Perth',
  'auckland': 'Pacific/Auckland',
  'cairo': 'Africa/Cairo',
  'johannesburg': 'Africa/Johannesburg',
  'lagos': 'Africa/Lagos'
}

export function WorldClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [cityInput, setCityInput] = useState('')
  const [cityTime, setCityTime] = useState<string | null>(null)
  const [cityError, setCityError] = useState<string | null>(null)
  const [cityTimezone, setCityTimezone] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    // 初始化时间，避免 hydration 问题
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 获取建议列表
  const getSuggestions = (input: string) => {
    if (!input.trim()) return []
    
    const inputLower = input.toLowerCase()
    const matches = Object.keys(cityTimezones).filter(city => 
      city.toLowerCase().includes(inputLower)
    )
    
    return matches.slice(0, 5) // 最多显示5个建议
  }

  const getCityTime = (cityName: string) => {
    if (!cityName.trim()) {
      setCityTime(null)
      setCityError(null)
      setCityTimezone(null)
      return
    }

    try {
      setCityError(null)
      
      // 查找时区
      const inputLower = cityName.toLowerCase().trim()
      const timezone = cityTimezones[inputLower]
      
      if (!timezone) {
        throw new Error('City not found')
      }

      // 创建目标时区的时间
      const now = new Date()
      const cityDateTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}))
      
      setCityTime(format(cityDateTime, 'yyyy-MM-dd HH:mm:ss'))
      setCityTimezone(timezone)
    } catch (error) {
      setCityError('未找到该城市，请尝试其他城市名称')
      setCityTime(null)
      setCityTimezone(null)
    }
  }

  const handleInputChange = (value: string) => {
    setCityInput(value)
    setSuggestions(getSuggestions(value))
  }

  const handleSearch = () => {
    getCityTime(cityInput)
    setSuggestions([])
  }

  const handleSuggestionClick = (suggestion: string) => {
    setCityInput(suggestion)
    getCityTime(suggestion)
    setSuggestions([])
  }

  const quickCities = ['北京', '纽约', '伦敦', '东京', '悉尼', '巴黎']

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          世界时钟
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-xs">城市/地区</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="city"
                value={cityInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入城市名称（支持中英文）"
                className="h-8"
              />
              {/* 建议列表 */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={handleSearch}
              className="h-8 px-3"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
          
          {cityError && (
            <p className="text-xs text-red-500">{cityError}</p>
          )}
          
          {cityTime && (
            <div className="p-2 bg-green-50 rounded-md">
              <div className="text-sm font-medium text-green-800">
                {cityInput}
              </div>
              <div className="text-xs text-green-600 font-mono">
                {cityTime}
              </div>
              {cityTimezone && (
                <div className="text-xs text-green-500">
                  时区: {cityTimezone}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 快捷城市 */}
        <div className="space-y-2">
          <Label className="text-xs">快捷查询</Label>
          <div className="grid grid-cols-3 gap-1">
            {quickCities.map((city) => (
              <Button
                key={city}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setCityInput(city)
                  getCityTime(city)
                }}
              >
                {city}
              </Button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-600 mb-1">本地时间</div>
          <div className="text-sm font-mono">
            {currentTime ? format(currentTime, 'yyyy-MM-dd HH:mm:ss') : '--:--:--'}
          </div>
          <div className="text-xs text-gray-500">
            时区: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}