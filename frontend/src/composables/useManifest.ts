import type { Manifest, ShardMeta, RecordItem } from './types';

export async function loadManifest(): Promise<Manifest> {
  const res = await fetch('/data/manifest.json', { cache: 'force-cache' });
  if (!res.ok) throw new Error('failed to load manifest');
  return res.json();
}

export async function loadShard(url: string): Promise<RecordItem[]> {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`failed to load shard: ${url}`);
  return res.json();
}

export function filterShards(
  shards: ShardMeta[],
  opts: { category?: string; datePrefix?: string }
) {
  return shards.filter(s => {
    if (opts.category && s.category !== opts.category) return false;
    if (opts.datePrefix && s.date && !s.date.startsWith(opts.datePrefix)) return false;
    return true;
  });
}
