'use client';

import { usePathname } from 'next/navigation';
import { Headphones } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/':         'Episodes',
  '/record':   'Studio',
  '/publish':  'Publish',
  '/settings': 'Settings',
};

export function TopBar() {
  const pathname = usePathname();

  // Match dynamic routes like /episode/[id]
  const isEpisode = pathname.startsWith('/episode/');
  const pageTitle = isEpisode ? 'Episode Editor' : (PAGE_TITLES[pathname] ?? '');

  return (
    <header className="fixed top-0 left-16 right-0 h-12 z-40 flex items-center px-5 gap-3 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-2 select-none">
        <Headphones className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold tracking-tight">PodcastStudio</span>
      </div>

      {/* Divider + current page */}
      {pageTitle && (
        <>
          <span className="text-border text-sm">·</span>
          <span className="text-sm text-muted-foreground">{pageTitle}</span>
        </>
      )}
    </header>
  );
}
