'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Truck, MapPin, Video } from 'lucide-react'

export function QuickLinks() {
  const links = [
    {
      name: '运费查询',
      url: 'https://www.jiandaoyun.com/app/6170c74d308c2f0009397523/entry/6861f61947af811261f9625d',
      icon: Truck
    },
    {
      name: '谷歌地图',
      url: 'https://www.google.com/maps',
      icon: MapPin
    },
    {
      name: '视频工具',
      url: 'https://youtube.iiilab.com/',
      icon: Video
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4" />
          常用链接
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => {
          const IconComponent = link.icon
          return (
            <Button
              key={link.name}
              variant="outline"
              size="sm"
              className="w-full justify-start h-8"
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <IconComponent className="h-3 w-3" />
                <span className="text-xs">{link.name}</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
} 