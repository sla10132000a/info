export type RecordItem = {
  title: string;
  summary?: string;
  link?: string;
  category?: string;
  published?: string; // ISO8601 or YYYY-MM-DD
};

export type ShardMeta = {
  id: string;
  url: string;     // /data/shards/xxx.json
  count: number;
  category?: string;
  date?: string;   // YYYY-MM-DD
};

export type Manifest = {
  version: number;
  shards: ShardMeta[];
};
