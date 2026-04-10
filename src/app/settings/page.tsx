'use client';

import { useEffect, useState } from 'react';
import { Save, Moon, Sun, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/Sidebar';
import { getPodcastProfile, savePodcastProfile } from '@/lib/store/episodes';
import type { PodcastProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [profile, setProfile] = useState<PodcastProfile>(DEFAULT_PROFILE);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    getPodcastProfile().then((p) => { if (p) setProfile(p); });
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
  };

  const handleSave = async () => {
    await savePodcastProfile(profile);
    toast.success('Settings saved');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Podcast profile and preferences</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>

          {/* Appearance */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between dark and light themes</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDark} />
            </div>
          </section>

          <Separator className="mb-8" />

          {/* Podcast Profile */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Podcast Profile</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Podcast Title</Label>
                <Input
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="My Awesome Podcast"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Author</Label>
                <Input
                  value={profile.author}
                  onChange={(e) => setProfile({ ...profile, author: e.target.value })}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Email <span className="text-muted-foreground/60">(optional)</span></Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Website <span className="text-muted-foreground/60">(optional)</span></Label>
                <Input
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="https://yourpodcast.com"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Language <span className="text-muted-foreground/60">(optional)</span></Label>
                <Input
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  placeholder="en"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Category <span className="text-muted-foreground/60">(optional)</span></Label>
                <Input
                  value={profile.category}
                  onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                  placeholder="Technology"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
              <Textarea
                rows={3}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="What your podcast is about…"
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={profile.explicit}
                onCheckedChange={(v) => setProfile({ ...profile, explicit: v })}
              />
              <Label className="text-sm">Explicit content</Label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-medium text-destructive">Block podcast from directories</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adds <code className="text-xs bg-muted px-1 rounded">&lt;itunes:block&gt;</code> to your feed — tells Apple, Spotify and others to remove your podcast. Redeploy to take effect.
                </p>
              </div>
              <Switch
                checked={!!profile.blocked}
                onCheckedChange={(v) => setProfile({ ...profile, blocked: v })}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
