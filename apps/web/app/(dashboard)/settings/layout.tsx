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

const settingsSections = [
  {
    title: 'General',
    items: [
      { name: 'AI Models', href: '/settings', icon: FiCpu, description: 'Configure AI providers' },
      { name: 'Profile', href: '/settings/profile', icon: FiUser, description: 'Your account settings' },
      { name: 'Notifications', href: '/settings/notifications', icon: FiBell, description: 'Notification preferences' },
    ]
  },
  {
    title: 'Content Management',
    items: [
      { name: 'Tags', href: '/settings/tags', icon: FiTag, description: 'Manage tags' },
      { name: 'Categories', href: '/settings/categories', icon: FiFolder, description: 'Organize content' },
      { name: 'Icons', href: '/settings/icons', icon: FiImage, description: 'Icon library' },
    ]
  },
  {
    title: 'Security',
    items: [
      { name: 'Security', href: '/settings/security', icon: FiShield, description: 'Security settings' },
    ]
  }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex">
      {}
      <aside className="w-64 border-r border-border/40 bg-card/30 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiSettings className="text-primary" />
            Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your preferences
          </p>
        </div>

        <nav className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-start gap-3 px-3 py-2 rounded-lg transition-colors group",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn(
                          "size-4 mt-0.5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-sm font-medium",
                            isActive && "text-primary"
                          )}>
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
