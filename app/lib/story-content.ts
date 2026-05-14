import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { isEncryptedFile, stripEncExt, decryptBuffer } from "./content-crypto";

export type StoryChapter = {
  id: string;
  chapterLabel: string;
  title: string;
  period: string;
  paragraphs: string[];
  excerpt: string;
};

export type Story = {
  id: string;
  title: string;
  sourceName: string;
  paragraphs: string[];
  chapters: StoryChapter[];
};

const STORY_DIR = path.join(process.cwd(), "content", "story");
const STORY_EXTENSIONS = new Set([".txt", ".md", ".markdown"]);
const IGNORED_FILES = new Set(["README.md"]);
const FEATURED_STORY_SOURCE = "2425.word";
const STORY_TITLE_OVERRIDES = new Map([[FEATURED_STORY_SOURCE, "dxy"]]);

function isValidStoryFile(name: string): boolean {
  if (IGNORED_FILES.has(name)) return false;
  if (STORY_EXTENSIONS.has(path.extname(name).toLowerCase())) return true;
  if (isEncryptedFile(name)) {
    const inner = stripEncExt(name);
    return STORY_EXTENSIONS.has(path.extname(inner).toLowerCase());
  }
  return false;
}

function storyFileSlug(name: string): string {
  const plain = stripEncExt(name);
  return plain.replace(/\.(md|markdown|txt)$/i, "");
}
const FALLBACK_CHAPTER_LABELS = ["\u7b2c\u4e00\u7ae0", "\u7b2c\u4e8c\u7ae0", "\u7b2c\u4e09\u7ae0", "\u7b2c\u56db\u7ae0"];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitStoryStem(fileName: string) {
  const plain = stripEncExt(fileName);
  return plain.replace(/\.(md|markdown|txt)$/i, "");
}

function storyTitleFromFileName(fileName: string) {
  const stem = splitStoryStem(fileName);
  return STORY_TITLE_OVERRIDES.get(stem) ?? stem.split(".")[0] ?? stem;
}

function extractChapterMeta(paragraph: string) {
  const heading = normalizeWhitespace(paragraph);
  const markerIndex = heading.indexOf("\u7ae0\uff1a");

  if (heading.startsWith("\u7b2c") && markerIndex !== -1) {
    const chapterLabel = heading.slice(0, markerIndex + 1);
    const remainder = heading.slice(markerIndex + 2).trim();
    const match = remainder.match(/^(.*?)[\uff08(](.*?)[\uff09)]$/);

    if (!match) {
      return {
        chapterLabel,
        title: remainder,
        period: "",
      };
    }

    return {
      chapterLabel,
      title: normalizeWhitespace(match[1]),
      period: normalizeWhitespace(match[2]),
    };
  }

  const numberedMatch = heading.match(/^([一二三四五六七八九十百千零]+)[、.．]\s*(.*)$/);
  if (numberedMatch) {
    return {
      chapterLabel: `${numberedMatch[1]}、`,
      title: normalizeWhitespace(numberedMatch[2]),
      period: "",
    };
  }

  if (/^(序|前言|楔子|尾声|后记)$/.test(heading)) {
    return {
      chapterLabel: heading,
      title: heading,
      period: "",
    };
  }

  return {
    chapterLabel: FALLBACK_CHAPTER_LABELS[0],
    title: heading,
    period: "",
  };
}

function isChapterHeading(paragraph: string) {
  const heading = normalizeWhitespace(paragraph);
  return (
    (heading.startsWith("\u7b2c") && heading.includes("\u7ae0\uff1a")) ||
    /^([一二三四五六七八九十百千零]+)[、.．]\s*(.*)$/.test(heading) ||
    /^(序|前言|楔子|尾声|后记)$/.test(heading)
  );
}

function buildExcerpt(paragraphs: string[]) {
  const candidate = paragraphs
    .filter((paragraph) => !paragraph.startsWith("\u3010") && !paragraph.endsWith("\u3011"))
    .join(" ");

  if (!candidate) {
    return "";
  }

  const shortened = normalizeWhitespace(candidate);
  return shortened.length > 96 ? `${shortened.slice(0, 95)}…` : shortened;
}

function parseChapters(paragraphs: string[]): StoryChapter[] {
  const chapters: StoryChapter[] = [];
  let currentChapter: StoryChapter | null = null;

  for (const paragraph of paragraphs) {
    if (isChapterHeading(paragraph)) {
      const meta = extractChapterMeta(paragraph);
      const chapterLabel = meta.chapterLabel || FALLBACK_CHAPTER_LABELS[chapters.length] || `\u7b2c${chapters.length + 1}\u7ae0`;
      currentChapter = {
        id: `chapter-${chapters.length + 1}`,
        chapterLabel,
        title: meta.title,
        period: meta.period,
        paragraphs: [],
        excerpt: "",
      };
      chapters.push(currentChapter);
      continue;
    }

    if (!currentChapter) {
      continue;
    }

    currentChapter.paragraphs.push(paragraph);
  }

  return chapters.map((chapter) => ({
    ...chapter,
    excerpt: buildExcerpt(chapter.paragraphs),
  }));
}

async function readStoryFile(fileName: string): Promise<Story | null> {
  const filePath = path.join(STORY_DIR, fileName);
  const stem = splitStoryStem(fileName);

  try {
    let raw: string;
    if (isEncryptedFile(fileName)) {
      const buf = await readFile(filePath);
      raw = decryptBuffer(buf);
    } else {
      raw = await readFile(filePath, "utf8");
    }
    const paragraphs = raw
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return {
      id: stem,
      title: storyTitleFromFileName(fileName),
      sourceName: stem,
      paragraphs,
      chapters: parseChapters(paragraphs),
    };
  } catch {
    return null;
  }
}

export async function getAllStories(): Promise<Story[]> {
  try {
    const entries = await readdir(STORY_DIR, { withFileTypes: true });
    const allNames = entries.filter((e) => e.isFile() && isValidStoryFile(e.name)).map((e) => e.name);

    // Deduplicate by slug: prefer .enc over plain
    const best = new Map<string, string>();
    for (const name of allNames) {
      const slug = storyFileSlug(name);
      const prev = best.get(slug);
      if (!prev || isEncryptedFile(name)) best.set(slug, name);
    }

    const stories = await Promise.all([...best.values()].map((name) => readStoryFile(name)));

    return stories
      .filter((story): story is Story => Boolean(story))
      .sort((a, b) => {
        if (a.sourceName === FEATURED_STORY_SOURCE) return -1;
        if (b.sourceName === FEATURED_STORY_SOURCE) return 1;
        return a.title.localeCompare(b.title, "zh-Hans-CN");
      });
  } catch {
    return [];
  }
}

export async function getFirstStory(): Promise<Story> {
  const stories = await getAllStories();
  return stories[0] ?? {
    id: FEATURED_STORY_SOURCE,
    title: "dxy",
    sourceName: FEATURED_STORY_SOURCE,
    paragraphs: [],
    chapters: [],
  };
}
