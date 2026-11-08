"use client";

import React from "react";
import Link from "next/link";
import { App } from "./App";
import "./index.css";

export default function EJudgeAppPage() {
  return (
    <div className="relative">
      {/* 悬浮返回导航栏 */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-[#2b1408]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border-2 border-[#d49b55] shadow-pixel text-xs text-[#fbf2d5]">
        <Link
          href="/"
          className="hover:text-[#ffdf79] flex items-center gap-1 font-serifSc text-[11px] tracking-wider"
        >
          <span>返回星空主页</span>
        </Link>
        <span className="text-[#8b5329]">•</span>
        <Link
          href="/my"
          className="hover:text-[#ffdf79] flex items-center gap-1 font-serifSc text-[11px] tracking-wider"
        >
          <span>个人履历</span>
        </Link>
      </div>

      {/* E-Judge AI 全功能独立工作台 */}
      <App />
    </div>
  );
}
