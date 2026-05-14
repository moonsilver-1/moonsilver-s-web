import type { Metadata } from "next";
import { JobtiClient } from "@/app/fun/jobti/jobti-client";

export const metadata: Metadata = {
  title: "Jobti / 职业测评",
  description: "Career assessment page based on the built-in question bank / 基于内置题库生成结果的职业测评页面。",
};

export default function JobtiPage() {
  return <JobtiClient />;
}
