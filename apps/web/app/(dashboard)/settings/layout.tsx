"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FiSettings, 
  FiTag, 
  FiFolder, 
  FiImage, 
  FiUser, 
  FiShield,
  FiBell,
  FiCpu
} from 'react-icons/fi';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}
