export type FeedEntry = {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
};

const DEFAULT_FEED_URL = "https://www.johnlin.top/feed.xml";

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&#39;", "'");
}

function stripTags(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function readAttr(block: string, tag: string, attr: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?\\s${attr}=["']([^"']+)["'][^>]*\\/?>`, "i"));
  return match ? match[1].trim() : "";
}

function normalizeItem(block: string): FeedEntry | null {
  const title = decodeEntities(stripTags(readTag(block, "title")));
  const link = decodeEntities(stripTags(readTag(block, "link") || readAttr(block, "link", "href")));
  const publishedAt = readTag(block, "pubDate") || readTag(block, "updated") || readTag(block, "published");
  const summary = decodeEntities(stripTags(readTag(block, "description") || readTag(block, "summary") || readTag(block, "content")));

  if (!title || !link) {
    return null;
  }

  return {
    title,
    link,
    publishedAt: publishedAt.trim(),
    summary,
  };
}

export async function getFeedEntries(feedUrl: string = DEFAULT_FEED_URL): Promise<FeedEntry[]> {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 60 * 30 } });
    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
    const entryBlocks = [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
    const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

    return blocks.map(normalizeItem).filter((item): item is FeedEntry => Boolean(item)).slice(0, 5);
  } catch {
    return [];
  }
}
