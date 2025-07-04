'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnitConverter } from './UnitConverter'
import { CurrencyConverter } from './CurrencyConverter'
import { WorldClock } from './WorldClock'
import { QuickLinks } from './QuickLinks'
import { Wrench } from 'lucide-react'

export function ToolBar() {
  return (
    <div className="h-full flex flex-col space-y-3 overflow-y-auto px-1">
      <div className="flex-shrink-0">
        <UnitConverter />
      </div>
      <div className="flex-shrink-0">
        <CurrencyConverter />
      </div>
      <div className="flex-shrink-0">
        <WorldClock />
      </div>
      <div className="flex-shrink-0">
        <QuickLinks />
      </div>
    </div>
  )
} 