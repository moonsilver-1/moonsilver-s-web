// 习概刷题 —— 类型定义（纯类型，无运行时代码）

/** 题型判别字段 */
export type TypeKey = "single" | "multiple" | "true_false";

export interface QuestionOption {
  key: string; // "A" | "B" | ... 或 "A"/"B"（判断题对/错）
  text: string;
}

/** 单道题目（三种题型共用同一结构，用 type_key 区分） */
export interface Question {
  id: string; // 如 "1-001"
  chapter: string; // 如 "第1章"
  chapter_index: number; // 1..17
  number: number; // 章内序号
  type: string; // 中文标签：单选题 / 多选题 / 判断题
  type_key: TypeKey;
  stem: string; // 题干
  options: QuestionOption[];
  answer: string[]; // 正确答案键集合
  answer_text: string; // 易读形式："A" | "ABCD" | "对"
  source_file: string;
}

export interface ChapterMeta {
  chapter: string;
  chapter_index: number;
  total: number;
  single_choice: number;
  multiple_choice: number;
  true_false: number;
}

/** 刷题模式 */
export type DrillMode = "chapter" | "wrong" | "mixed" | "exam";

/** 一道题在本轮会话中的作答记录 */
export interface SessionItem {
  selected: string[]; // 用户选择的键（提交时排序）
  submitted: boolean; // 是否已提交（锁定）
  correct: boolean; // 提交时计算
}

/** 一轮刷题会话：4 种模式共用同一结构 */
export interface Session {
  id: string;
  mode: DrillMode;
  questionIds: string[]; // 有序列表（已按需洗牌）
  cursor: number; // 当前题索引
  items: Record<string, SessionItem>; // 按 questionId 索引
  startedAt: number; // epoch ms
  endsAt?: number; // 考试截止 epoch ms
  finished: boolean; // 是否已结束（考试交卷）
}

/** 屏幕状态机 */
export type Screen =
  | { kind: "home" }
  | { kind: "drill"; session: Session }
  | { kind: "exam"; session: Session }
  | { kind: "exam-review"; session: Session }
  | { kind: "wrong-list" }
  | { kind: "stats" };

/** 单章统计 */
export interface ChapterStat {
  answered: number;
  correct: number;
}

/** 各章统计，按 chapter_index 索引 */
export type Stats = Record<number, ChapterStat>;

/** 全局累计统计（含考试批量） */
export interface GlobalStat {
  answered: number;
  correct: number;
}
