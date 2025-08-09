import Fuse from 'fuse.js';
import { ref } from 'vue';
import type { RecordItem } from './types';

export function useShardedFuse() {
  const fusePerShard = ref<Map<string, Fuse<RecordItem>>>(new Map());

  const options: Fuse.IFuseOptions<RecordItem> = {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.35,
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'summary', weight: 0.3 },
    ],
  };

  function addShard(id: string, docs: RecordItem[]) {
    const fuse = new Fuse(docs, options);
    fusePerShard.value.set(id, fuse);
  }

  function hasShard(id: string) {
    return fusePerShard.value.has(id);
  }

  function search(
    query: string,
    limit = 50,
    filters?: { category?: string; datePrefix?: string }
  ) {
    const results: { item: RecordItem; score: number }[] = [];
    for (const [_, fuse] of fusePerShard.value.entries()) {
      const r = fuse.search(query).slice(0, limit);
      for (const hit of r) {
        const item = hit.item;
        if (filters?.category && item.category !== filters.category) continue;
        if (filters?.datePrefix && item.published && !item.published.startsWith(filters.datePrefix)) continue;
        results.push({ item, score: hit.score ?? 1 });
      }
    }
    results.sort((a, b) => a.score - b.score);
    return results.slice(0, limit);
  }

  return { addShard, hasShard, search, fusePerShard };
}
