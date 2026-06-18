import type { Metadata } from "next";
import { XigaiClient } from "@/app/fun/xigai/xigai-client";

export const metadata: Metadata = {
  title: "习概刷题",
  description: "969 道政治理论题，严格判定刷题、错题本与模拟考试。",
};

export default function XigaiPage() {
  return <XigaiClient />;
}
