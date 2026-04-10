'use client';

import { Sidebar } from '@/components/Sidebar';
import { RssFeedPanel } from '@/components/RssFeedPanel';
import { GitHubDeploy } from '@/components/GitHubDeploy';
import { Separator } from '@/components/ui/separator';

export default function PublishPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Publish</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate your RSS feed and deploy your podcast to the world.
            </p>
          </div>
          <RssFeedPanel />
          <Separator className="my-8" />
          <GitHubDeploy />
        </div>
      </main>
    </div>
  );
}
