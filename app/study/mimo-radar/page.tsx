import type { Metadata } from "next";
import katex from "katex";
import "katex/dist/katex.min.css";
import { sections } from "./content";
import StudyClient from "./study-client";

export const metadata: Metadata = {
  title: "MIMO Tensor Radar / 张量雷达学习",
  description:
    "从零开始学 MIMO 雷达与张量分解：雷达原理 → 阵列天线 → DOA 估计 → 子空间方法 → 张量分解 → Slow-Time MIMO。",
};

function renderBlockMath(html: string): string {
  return html.replace(
    /<p\s+class="math"\s*>([\s\S]*?)<\/p>/g,
    (_, tex) => {
      const trimmed = tex.trim();
      if (!trimmed) return `<p class="math"></p>`;
      try {
        const rendered = katex.renderToString(trimmed, {
          throwOnError: false,
          displayMode: true,
        });
        return `<div class="math">${rendered}</div>`;
      } catch {
        return `<p class="math">${trimmed}</p>`;
      }
    }
  );
}

function renderInlineMath(html: string): string {
  return html.replace(/\$([^$]+)\$/g, (_, tex) => {
    const trimmed = tex.trim();
    if (!trimmed) return `$${tex}$`;
    try {
      return katex.renderToString(trimmed, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `$${tex}$`;
    }
  });
}

function renderSectionContent(content: string): string {
  let html = content;
  html = renderBlockMath(html);
  html = renderInlineMath(html);
  return html;
}

export default function MimoRadarStudyPage() {
  const renderedSections = sections.map((s) => ({
    id: s.id,
    title: s.title,
    content: renderSectionContent(s.content),
  }));

  return <StudyClient sections={renderedSections} />;
}
