'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import * as FiIcons from 'react-icons/fi'

// Popular bot icons
const BOT_ICONS = [
  'FiMessageSquare',
  'FiMessageCircle',
  'FiCpu',
  'FiZap',
  'FiActivity',
  'FiCommand',
  'FiTarget',
  'FiStar',
  'FiHeart',
  'FiSmile',
  'FiUser',
  'FiUsers',
  'FiMail',
  'FiSend',
  'FiPhone',
  'FiHeadphones',
  'FiMic',
  'FiVideo',
  'FiCamera',
  'FiImage',
  'FiMusic',
  'FiPlay',
  'FiPause',
  'FiSkipForward',
  'FiVolume2',
  'FiTrendingUp',
  'FiBarChart',
  'FiPieChart',
  'FiShoppingCart',
  'FiShoppingBag',
  'FiGift',
  'FiPackage',
  'FiTruck',
  'FiMapPin',
  'FiGlobe',
  'FiCompass',
  'FiAward',
  'FiThumbsUp',
  'FiCheckCircle',
  'FiAlertCircle',
  'FiInfo',
  'FiHelpCircle',
  'FiSettings',
  'FiTool',
  'FiCode',
  'FiTerminal',
  'FiDatabase',
  'FiServer',
  'FiCloud',
  'FiLock',
  'FiUnlock',
  'FiKey',
  'FiShield',
  'FiEye',
  'FiSearch',
  'FiFilter',
  'FiBell',
  'FiCalendar',
  'FiClock',
  'FiWatch',
  'FiSun',
  'FiMoon',
  'FiCloudRain',
  'FiWind',
  'FiFeather',
  'FiAnchor',
  'FiUmbrella',
  'FiCoffee',
  'FiBook',
  'FiBookOpen',
  'FiFileText',
  'FiFolder',
  'FiArchive',
  'FiInbox',
  'FiLayers',
  'FiGrid',
  'FiBox',
  'FiPackage',
]

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
}

export function IconPicker({ value = 'FiMessageSquare', onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = BOT_ICONS.filter(icon =>
    icon.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-white hover:bg-white/20"
        >
          <FiIcons.FiEdit2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="grid grid-cols-6 gap-1 p-2 max-h-64 overflow-y-auto">
          {filteredIcons.map((iconName) => {
            const Icon = (FiIcons as any)[iconName]
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName)
                  setOpen(false)
                }}
                className={`p-2 rounded hover:bg-accent transition-colors ${value === iconName ? 'bg-primary/10 text-primary' : ''
                  }`}
                title={iconName}
              >
                <Icon className="w-5 h-5 mx-auto" />
              </button>
            )
          })}
        </div>
        {filteredIcons.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No icons found
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
