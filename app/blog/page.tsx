import type { Metadata } from "next";
import { getAllBlogPosts } from "@/app/lib/blog-content";
import { getFeedEntries } from "@/app/lib/feed-content";
import BlogPageClient from "./blog-page-client";

export const metadata: Metadata = {
  title: "Blog / 博客",
  description: "A local text-file driven blog index / 基于本地文本文件的博客索引。",
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  const feedEntries = await getFeedEntries();

  return <BlogPageClient posts={posts} feedEntries={feedEntries} />;
}
