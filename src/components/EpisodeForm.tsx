'use client';

import { useState, useRef } from 'react';
import { Upload, X, Plus, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { Episode } from '@/lib/types';

interface EpisodeFormProps {
  episode: Episode;
  onChange: (updates: Partial<Episode>) => void;
}

export function EpisodeForm({ episode, onChange }: EpisodeFormProps) {
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !episode.tags.includes(tag)) {
      onChange({ tags: [...episode.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onChange({ tags: episode.tags.filter((t) => t !== tag) });
  };

  const handleCoverArt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ coverArtUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Cover art */}
      <div className="flex gap-4 items-start">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
        >
          {episode.coverArtUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={episode.coverArtUrl}
              alt="cover"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="text-xs">Cover</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverArt}
        />

        <div className="flex-1 space-y-3">
          <div>
            <Label htmlFor="ep-title" className="text-xs text-muted-foreground mb-1 block">
              Title *
            </Label>
            <Input
              id="ep-title"
              value={episode.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Episode title…"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Season</Label>
              <Input
                type="number"
                min={1}
                value={episode.season ?? ''}
                onChange={(e) =>
                  onChange({ season: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Episode #</Label>
              <Input
                type="number"
                min={1}
                value={episode.episodeNumber ?? ''}
                onChange={(e) =>
                  onChange({
                    episodeNumber: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="1"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div>
        <Label htmlFor="ep-desc" className="text-xs text-muted-foreground mb-1 block">
          Description
        </Label>
        <Textarea
          id="ep-desc"
          rows={4}
          value={episode.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What's this episode about?"
          className="resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tag…"
          />
          <Button variant="outline" size="icon" onClick={addTag}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {episode.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {episode.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => removeTag(tag)}
              >
                {tag}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>
      {/* Visibility */}
      {episode.status === 'published' && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Hide from feed</p>
              <p className="text-xs text-muted-foreground">Keeps the episode but removes it from your RSS feed</p>
            </div>
          </div>
          <Switch
            checked={!!episode.hidden}
            onCheckedChange={(v) => onChange({ hidden: v })}
          />
        </div>
      )}
    </div>
  );
}
