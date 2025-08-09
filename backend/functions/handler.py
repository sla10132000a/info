import os
import json
import boto3
import feedparser
from datetime import datetime, timezone

s3 = boto3.client("s3")
BUCKET = os.environ["BUCKET_NAME"]

def _iso8601(dt_tuple):
    try:
        return datetime(*dt_tuple[:6], tzinfo=timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

def _get_date(entry):
    if getattr(entry, "published_parsed", None):
        return _iso8601(entry.published_parsed)
    if getattr(entry, "updated_parsed", None):
        return _iso8601(entry.updated_parsed)
    return datetime.now(timezone.utc).isoformat()

def save_rss(feed_url, category):
    feed = feedparser.parse(feed_url)
    items = []
    for e in feed.entries:
        doc = {
            "category": category,
            "title": getattr(e, "title", ""),
            "link": getattr(e, "link", ""),
            "published": _get_date(e),
            "summary": getattr(e, "summary", ""),
            "source_feed": feed_url,
        }
        items.append(doc)

    if not items:
        print(f"[NO NEW] {feed_url}")
        return

    key = f"{category}/{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(items, ensure_ascii=False),
        ContentType="application/json",
    )
    print(f"[PUT] s3://{BUCKET}/{key} count={len(items)}")

def handler(event, context):
    it_feeds = [
        "https://rss.itmedia.co.jp/rss/2.0/ait.xml",
        "http://dev.classmethod.jp/feed/",
        "https://zenn.dev/feed",
        "https://qiita.com/popular-items/feed.atom",
    ]
    for u in it_feeds:
        save_rss(u, "it")

    invest_feeds = [
        "https://assets.wor.jp/rss/rdf/reuters/top.rdf",
        "https://assets.wor.jp/rss/rdf/reuters/forex.rdf",
        "https://assets.wor.jp/rss/rdf/reuters/stock.rdf",
        "https://assets.wor.jp/rss/rdf/reuters/economy.rdf",
        "https://assets.wor.jp/rss/rdf/reuters/business.rdf",
        "https://assets.wor.jp/rss/rdf/reuters/technology.rdf",
        "https://assets.wor.jp/rss/rdf/bloomberg/top.rdf",
        "https://assets.wor.jp/rss/rdf/bloomberg/overseas.rdf",
        "https://assets.wor.jp/rss/rdf/bloomberg/markets.rdf",
        "https://assets.wor.jp/rss/rdf/bloomberg/economy.rdf",
    ]
    for u in invest_feeds:
        save_rss(u, "invest")
