import type { Episode, PodcastProfile } from '@/lib/types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfcDate(ts: number): string {
  return new Date(ts).toUTCString();
}

export function generateRssFeed(
  profile: PodcastProfile,
  episodes: Episode[],
  baseUrl: string
): string {
  const publishedEps = episodes.filter((e) => e.status === 'published' && !e.hidden);

  const blockTag = profile.blocked ? `\n    <itunes:block>Yes</itunes:block>` : '';
  const itemsXml = publishedEps
    .map((ep) => {
      const enclosure = ep.audioSize
        ? `<enclosure url="${escapeXml(baseUrl)}/episodes/${ep.id}.mp3" length="${ep.audioSize}" type="audio/mpeg" />`
        : '';
      const duration = ep.audioDuration
        ? `<itunes:duration>${Math.round(ep.audioDuration)}</itunes:duration>`
        : '';
      const epNum = ep.episodeNumber ? `<itunes:episode>${ep.episodeNumber}</itunes:episode>` : '';
      const season = ep.season ? `<itunes:season>${ep.season}</itunes:season>` : '';
      const image = ep.coverArtUrl
        ? `<itunes:image href="${escapeXml(ep.coverArtUrl)}" />`
        : '';

      return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description}]]></description>
      <pubDate>${rfcDate(ep.publishedAt ?? ep.updatedAt)}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      ${enclosure}
      ${duration}
      ${epNum}
      ${season}
      ${image}
      <itunes:explicit>${profile.explicit ? 'true' : 'false'}</itunes:explicit>
    </item>`;
    })
    .join('\n');

  const coverImage = profile.coverArtUrl
    ? `<itunes:image href="${escapeXml(profile.coverArtUrl)}" />`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(profile.title)}</title>
    <link>${escapeXml(profile.website)}</link>
    <description><![CDATA[${profile.description}]]></description>
    <language>${escapeXml(profile.language)}</language>
    <itunes:author>${escapeXml(profile.author)}</itunes:author>
    <itunes:owner>
      <itunes:name>${escapeXml(profile.author)}</itunes:name>
      <itunes:email>${escapeXml(profile.email)}</itunes:email>
    </itunes:owner>
    <itunes:category text="${escapeXml(profile.category)}" />
    <itunes:explicit>${profile.explicit ? 'true' : 'false'}</itunes:explicit>${blockTag}
    ${coverImage}
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
