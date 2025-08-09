<template>
  <main class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Client Search (Fuse.js + Sharded Index)</h1>

    <SearchBar
      :model-value="{ category, datePrefix, q }"
      @update:q="v => { q = v; onQuery(); }"
      @update:filters="v => { category = v.category; datePrefix = v.datePrefix; }"
      @load="ensureLoaded"
    />

    <p class="text-sm text-gray-600 my-2">
      Loaded shards: {{ loadedShardIds.length }} / {{ manifest?.shards.length || 0 }} ・ Results: {{ results.length }}
    </p>

    <ul class="space-y-3">
      <li v-for="(r,i) in results" :key="i" class="border p-3 rounded">
        <a :href="r.item.link" target="_blank" class="font-semibold underline">{{ r.item.title }}</a>
        <div class="text-xs text-gray-600">
          <span>{{ r.item.category }}</span>
          <span v-if="r.item.published"> · {{ r.item.published }}</span>
        </div>
        <p class="text-sm mt-1">{{ r.item.summary }}</p>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SearchBar from './components/SearchBar.vue';
import { loadManifest, loadShard, filterShards } from './composables/useManifest';
import { useShardedFuse } from './composables/useShardedFuse';
import type { Manifest } from './composables/types';

const q = ref('');
let category = '';
let datePrefix = '';

const manifest = ref<Manifest>();
const loadedShardIds = ref<string[]>([]);
const results = ref<{ item: any; score: number }[]>([]);

const { addShard, hasShard, search } = useShardedFuse();

// 初期ロード：manifest
(async () => {
  manifest.value = await loadManifest();
})();

async function ensureLoaded({ category: c, datePrefix: d }: { category: string; datePrefix: string }) {
  if (!manifest.value) return;
  const targets = filterShards(manifest.value.shards, { category: c || undefined, datePrefix: d || undefined });
  for (const s of targets) {
    if (loadedShardIds.value.includes(s.id) || hasShard(s.id)) continue;
    const docs = await loadShard(s.url);
    addShard(s.id, docs);
    loadedShardIds.value.push(s.id);
  }
}

function onQuery() {
  if (!q.value || q.value.length < 2) {
    results.value = [];
    return;
  }
  results.value = search(q.value, 50, {
    category: category || undefined,
    datePrefix: datePrefix || undefined,
  });
}
</script>
