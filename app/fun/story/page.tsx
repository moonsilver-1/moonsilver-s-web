import type { Metadata } from "next";
import StoryReaderClient from "@/app/fun/story/story-reader-client";

export const metadata: Metadata = {
  title: "Reading Room",
  description: "A quiet private reading space.",
  robots: { index: false, follow: false },
};

export default async function StoryPage() {
  return <StoryReaderClient />;
}
