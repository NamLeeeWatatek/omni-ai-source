'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  const SelectedIcon = (FiIcons as any)[value] || FiIcons.FiMessageSquare

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        className="w-8 h-8 text-white hover:bg-white/20"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <FiIcons.FiEdit2 className="w-4 h-4" />
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 glass rounded-lg border border-border shadow-lg z-50">
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
                    className={`p-2 rounded hover:bg-accent transition-colors ${
                      value === iconName ? 'bg-primary/10 text-primary' : ''
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
          </div>
        </>
      )}
    </div>
  )
}
