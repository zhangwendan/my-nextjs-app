'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Ruler } from 'lucide-react'

export function UnitConverter() {
  const [inches, setInches] = useState('')
  const [millimeters, setMillimeters] = useState('')

  const handleInchesChange = (value: string) => {
    setInches(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setMillimeters((numValue * 25.4).toFixed(2))
    } else {
      setMillimeters('')
    }
  }

  const handleMillimetersChange = (value: string) => {
    setMillimeters(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setInches((numValue / 25.4).toFixed(4))
    } else {
      setInches('')
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Ruler className="h-4 w-4" />
          单位换算
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="inches" className="text-xs">英寸 (inch)</Label>
          <Input
            id="inches"
            type="number"
            value={inches}
            onChange={(e) => handleInchesChange(e.target.value)}
            placeholder="输入英寸数值"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="millimeters" className="text-xs">毫米 (mm)</Label>
          <Input
            id="millimeters"
            type="number"
            value={millimeters}
            onChange={(e) => handleMillimetersChange(e.target.value)}
            placeholder="输入毫米数值"
            className="h-7 text-xs"
          />
        </div>
        <p className="text-xs text-gray-500">1 英寸 = 25.4 毫米</p>
      </CardContent>
    </Card>
  )
} 