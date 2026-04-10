'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CassetteTape, Library, Rss, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/', icon: Library, label: 'Episodes' },
  { href: '/record', icon: CassetteTape, label: 'Record' },
  { href: '/publish', icon: Rss, label: 'Publish' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-12 h-[calc(100%-3rem)] w-16 flex flex-col items-center py-5 gap-2 bg-sidebar border-r border-sidebar-border z-50">
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Tooltip key={href}>
              <TooltipTrigger
                render={
                  <Link
                    href={href}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
                      active
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  />
                }
              >
                <Icon className="w-5 h-5" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
