import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import { isEncryptedFile, stripEncExt, decryptBuffer, ENC_EXT } from "./content-crypto";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  content: string;
};

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const SUPPORTED_EXTENSIONS = new Set([".md", ".markdown", ".txt"]);
const IGNORED_FILENAMES = new Set(["README.md"]);

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeDate(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugFromFileName(fileName: string) {
  const plain = stripEncExt(fileName);
  return plain.replace(/\.(md|markdown|txt)$/i, "");
}

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlStr.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (key) {
      if (value.startsWith("[") && value.endsWith("]")) {
        data[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      } else {
        data[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  return { data, body };
}

function applyInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function parseMarkdownToHtml(markdown: string): string {
  const blocks = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      if (/^###\s+/.test(block)) {
        return `<h3>${applyInlineMarkdown(block.replace(/^###\s+/, ""))}</h3>`;
      }

      if (/^##\s+/.test(block)) {
        return `<h2>${applyInlineMarkdown(block.replace(/^##\s+/, ""))}</h2>`;
      }

      if (/^#\s+/.test(block)) {
        return `<h1>${applyInlineMarkdown(block.replace(/^#\s+/, ""))}</h1>`;
      }

      if (/^>\s+/.test(block)) {
        return `<blockquote>${applyInlineMarkdown(block.replace(/^>\s+/gm, ""))}</blockquote>`;
      }

      if (/^---+$/.test(block)) {
        return "<hr />";
      }

      const unorderedItems = block.match(/^[-*]\s+(.+)$/gm);
      if (unorderedItems && unorderedItems.length === block.split("\n").length) {
        return `<ul>${unorderedItems.map((item) => `<li>${applyInlineMarkdown(item.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
      }

      const orderedItems = block.match(/^\d+\.\s+(.+)$/gm);
      if (orderedItems && orderedItems.length === block.split("\n").length) {
        return `<ol>${orderedItems.map((item) => `<li>${applyInlineMarkdown(item.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
      }

      return `<p>${applyInlineMarkdown(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function getFirstTextBlock(body: string, excluded?: string) {
  return (
    body
      .split(/\n{2,}|\n/)
      .map((line) => line.replace(/^#+\s+/, "").trim())
      .find((line) => line && line !== excluded) ?? ""
  );
}

function createExcerpt(body: string, title: string) {
  const firstBlock = getFirstTextBlock(body, title);
  if (!firstBlock) {
    return title;
  }

  return firstBlock.length > 140 ? `${firstBlock.slice(0, 140)}...` : firstBlock;
}

function normalizePost(
  slug: string,
  data: Record<string, unknown>,
  body: string,
  fallbackDate: string,
): BlogPost | null {
  const bodyTitle = getFirstTextBlock(body);
  const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : bodyTitle;
  const content = body.trim();
  const excerpt =
    typeof data.excerpt === "string" && data.excerpt.trim() ? data.excerpt.trim() : createExcerpt(content, title);

  if (!title || !content) {
    return null;
  }

  return {
    slug,
    title,
    excerpt,
    publishedAt: normalizeDate(data.publishedAt, fallbackDate),
    updatedAt: normalizeDate(data.updatedAt, normalizeDate(data.publishedAt, fallbackDate)),
    tags: toStringArray(data.tags),
    content: parseMarkdownToHtml(content),
  };
}

async function readPostFile(fileName: string): Promise<BlogPost | null> {
  const slug = slugFromFileName(fileName);
  const filePath = path.join(BLOG_CONTENT_DIR, fileName);

  try {
    const fileStat = await stat(filePath);
    const fallbackDate = fileStat.mtime.toISOString().slice(0, 10);
    let raw: string;
    if (isEncryptedFile(fileName)) {
      const buf = await readFile(filePath);
      raw = decryptBuffer(buf);
    } else {
      raw = await readFile(filePath, "utf8");
    }
    const { data, body } = parseFrontmatter(raw);
    return normalizePost(slug, data, body, fallbackDate);
  } catch {
    return null;
  }
}

function isValidBlogFile(name: string): boolean {
  if (IGNORED_FILENAMES.has(name)) return false;
  if (SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase())) return true;
  if (isEncryptedFile(name)) {
    const inner = stripEncExt(name);
    return SUPPORTED_EXTENSIONS.has(path.extname(inner).toLowerCase());
  }
  return false;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const entries = await readdir(BLOG_CONTENT_DIR, { withFileTypes: true });
    const allNames = entries.filter((e) => e.isFile() && isValidBlogFile(e.name)).map((e) => e.name);

    // Deduplicate by slug: prefer .enc over plain
    const best = new Map<string, string>();
    for (const name of allNames) {
      const slug = slugFromFileName(name);
      const prev = best.get(slug);
      if (!prev || isEncryptedFile(name)) best.set(slug, name);
    }

    const posts = await Promise.all([...best.values()].map((name) => readPostFile(name)));

    return posts
      .filter((post): post is BlogPost => Boolean(post))
      .sort((a, b) => {
        const dateDiff = b.publishedAt.localeCompare(a.publishedAt);
        if (dateDiff !== 0) return dateDiff;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllBlogPosts();
  const normalizedSlug = normalizeSlug(slug);
  return posts.find((post) => post.slug === normalizedSlug) ?? null;
}

export function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
