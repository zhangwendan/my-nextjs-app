'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, ExternalLink } from 'lucide-react'

export function CurrencyConverter() {
  const [usd, setUsd] = useState('')
  const [cny, setCny] = useState('')
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取实时汇率
    const fetchExchangeRate = async () => {
      try {
        // 使用免费的汇率API
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await response.json()
        setExchangeRate(data.rates.CNY)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
        // 使用默认汇率
        setExchangeRate(7.2)
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRate()
    // 每5分钟更新一次汇率
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleUsdChange = (value: string) => {
    setUsd(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && exchangeRate) {
      setCny((numValue * exchangeRate).toFixed(2))
    } else {
      setCny('')
    }
  }

  const handleCnyChange = (value: string) => {
    setCny(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && exchangeRate) {
      setUsd((numValue / exchangeRate).toFixed(2))
    } else {
      setUsd('')
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4" />
          汇率计算
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="usd" className="text-xs">美元 (USD)</Label>
          <Input
            id="usd"
            type="number"
            value={usd}
            onChange={(e) => handleUsdChange(e.target.value)}
            placeholder="输入美元金额"
            className="h-8"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cny" className="text-xs">人民币 (CNY)</Label>
          <Input
            id="cny"
            type="number"
            value={cny}
            onChange={(e) => handleCnyChange(e.target.value)}
            placeholder="输入人民币金额"
            className="h-8"
            disabled={loading}
          />
        </div>
        
        <div className="text-xs text-gray-500">
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span>汇率: 1 USD = {exchangeRate?.toFixed(4)} CNY</span>
          )}
        </div>
        
        <a
          href="https://www.boc.cn/sourcedb/whpj/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          更多汇率查询
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  )
} 