'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnitConverter } from './UnitConverter'
import { CurrencyConverter } from './CurrencyConverter'
import { WorldClock } from './WorldClock'
import { QuickLinks } from './QuickLinks'
import { Wrench } from 'lucide-react'

export function ToolBar() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            实用工具
          </CardTitle>
        </CardHeader>
      </Card>

      <UnitConverter />
      <CurrencyConverter />
      <WorldClock />
      <QuickLinks />
    </div>
  )
} 