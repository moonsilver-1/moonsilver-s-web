// 习概刷题 —— 数据层（静态 import JSON，薄再导出，照搬 jobti-data.ts 风格）

import allQuestionsData from "./all_questions.json";
import chaptersData from "./chapters.json";
import type { ChapterMeta, Question } from "./xigai-types";

/** 全部 969 题（唯一数据源，避免重复 import 分类文件导致体积翻倍） */
export const ALL_QUESTIONS = allQuestionsData as Question[];

/** 17 章元数据 */
export const CHAPTERS = chaptersData as ChapterMeta[];

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;
export const TOTAL_CHAPTERS = CHAPTERS.length;

/** id -> 题目 的快速查找 */
export const QUESTION_BY_ID: Map<string, Question> = new Map(
  ALL_QUESTIONS.map((q) => [q.id, q]),
);
