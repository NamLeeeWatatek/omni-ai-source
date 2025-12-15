'use client'

import { ReactNode, useEffect } from 'react'
import '../../lib/i18n/i18n'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    // I18n is already initialized by importing the i18n file above
    // This ensures it only runs on the client side
  }, [])

  return <>{children}</>
}
