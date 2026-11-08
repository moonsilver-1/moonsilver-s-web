"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface StarParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

interface Firefly {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaSpeed: number;
}

export default function EpicStarlitPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 随机动态微光星
    const stars: StarParticle[] = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.7),
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    // 偶尔划过的流星
    const shootingStars: ShootingStar[] = Array.from({ length: 3 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.4),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 6 + 7,
      angle: (Math.PI / 4) + (Math.random() - 0.5) * 0.2,
      alpha: 0,
      active: false,
    }));

    // 草丛间游弋的萤火虫
    const fireflies: Firefly[] = Array.from({ length: 22 }).map(() => ({
      x: Math.random() * width,
      y: height * 0.6 + Math.random() * (height * 0.38),
      radius: Math.random() * 1.8 + 1.2,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      alphaSpeed: (Math.random() - 0.5) * 0.03,
    }));

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      // 绘制闪烁微星
      stars.forEach((s) => {
        s.alpha += s.speed;
        const currentAlpha = 0.3 + 0.7 * Math.abs(Math.sin(s.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 周期性激活流星
      if (tick % 180 === 0) {
        const inactive = shootingStars.find((st) => !st.active);
        if (inactive) {
          inactive.active = true;
          inactive.x = Math.random() * width * 0.7 + width * 0.1;
          inactive.y = Math.random() * height * 0.25;
          inactive.alpha = 1;
        }
      }

      // 绘制流星
      shootingStars.forEach((st) => {
        if (!st.active) return;
        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;
        st.alpha -= 0.015;

        if (st.alpha <= 0) {
          st.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 240, 200, ${st.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(
            st.x - Math.cos(st.angle) * st.length,
            st.y - Math.sin(st.angle) * st.length
          );
          ctx.stroke();
          ctx.restore();
        }
      });

      // 绘制萤火虫
      fireflies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.alpha += f.alphaSpeed;

        if (f.alpha > 0.95 || f.alpha < 0.15) {
          f.alphaSpeed = -f.alphaSpeed;
        }

        if (f.y < height * 0.55) f.vy = Math.abs(f.vy);
        if (f.y > height) f.vy = -Math.abs(f.vy);
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 230, 110, 0.9)";
        ctx.fillStyle = `rgba(255, 235, 120, ${Math.max(0.1, f.alpha)})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 w-screen h-screen overflow-hidden bg-[#070512] select-none">
      
      {/* 宏大的像素艺术主背景：卷发男孩仰望浩瀚星河 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/images/starlit_boy.jpg')",
          imageRendering: "pixelated",
        }}
      />

      {/* 动态星空粒子层 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* 星空中深邃而神秘的隐秘指引星宿：左侧金色星宿 -> /six 评判系统 */}
      <div
        className="absolute top-[28%] left-[23%] z-20 cursor-pointer group"
        onMouseEnter={() => setHoveredStar("six")}
        onMouseLeave={() => setHoveredStar(null)}
      >
        <Link href="/six" className="block relative">
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffdf79] shadow-[0_0_12px_#ffdf79] group-hover:scale-150 transition-all duration-300 animate-pulse" />
            <span className="absolute w-6 h-6 rounded-full border border-[#ffdf79]/40 group-hover:border-[#ffdf79] group-hover:scale-125 transition-all duration-300" />
          </div>
          
          <div
            className={`absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded bg-[#2b1408]/90 border border-[#d49b55] text-[#ffdf79] text-xs font-serif tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 ${
              hoveredStar === "six"
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2 pointer-events-none"
            }`}
          >
            E-Judge 职务智能评判系统
          </div>
        </Link>
      </div>

      {/* 星空中银白月芒星宿：右侧星座 -> /my 个人世界 */}
      <div
        className="absolute top-[34%] right-[32%] z-20 cursor-pointer group"
        onMouseEnter={() => setHoveredStar("my")}
        onMouseLeave={() => setHoveredStar(null)}
      >
        <Link href="/my" className="block relative">
          <div className="w-5 h-5 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d0e5ff] shadow-[0_0_12px_#d0e5ff] group-hover:scale-150 transition-all duration-300 animate-pulse" />
            <span className="absolute w-6 h-6 rounded-full border border-[#d0e5ff]/40 group-hover:border-[#d0e5ff] group-hover:scale-125 transition-all duration-300" />
          </div>
          
          <div
            className={`absolute right-7 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded bg-[#10192e]/90 border border-[#79a9e8] text-[#d0e5ff] text-xs font-serif tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-all duration-300 ${
              hoveredStar === "my"
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-2 pointer-events-none"
            }`}
          >
            Moonsilver 个人履历与沉思
          </div>
        </Link>
      </div>

      {/* 右上角纯净优雅的微光星宿罗盘按钮 */}
      <div className="absolute top-5 right-5 z-40">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-[#1b120c]/70 hover:bg-[#2b180d] border border-[#d49b55]/60 hover:border-[#ffdf79] text-[#ffdf79] flex items-center justify-center shadow-lg backdrop-blur-md transition-all duration-200"
          title="展开星空传送阵"
        >
          <span className="text-xs font-mono tracking-widest">{menuOpen ? "✕" : "✦"}</span>
        </button>

        {/* 侧滑出的极简星宿传送罗盘 */}
        {menuOpen && (
          <div className="absolute top-12 right-0 w-56 rounded-xl bg-[#24130a]/95 border-2 border-[#5b2b14] shadow-[0_8px_32px_rgba(0,0,0,0.9)] backdrop-blur-md p-3.5 space-y-2 text-xs font-serif text-[#eedcb1] animate-fadeIn">
            <div className="border-b border-[#5b2b14]/60 pb-2 text-center text-[#ffdf79] font-bold tracking-widest text-[11px]">
              银月星辰罗盘
            </div>

            <Link
              href="/six"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>职务智能评判系统</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/six</span>
            </Link>

            <Link
              href="/my"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>个人履历与空间</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/my</span>
            </Link>

            <Link
              href="/blog"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>技术博客与杂思</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/blog</span>
            </Link>

            <Link
              href="/contest"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>科技竞技荣誉长廊</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/contest</span>
            </Link>

            <Link
              href="/fun"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>像素街机小游戏</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/fun</span>
            </Link>

            <Link
              href="/study"
              className="flex items-center justify-between p-2 rounded hover:bg-[#4a2411] hover:text-[#ffdf79] transition-colors"
            >
              <span>求索书斋研学笔记</span>
              <span className="font-mono text-[10px] text-[#d49b55]">/study</span>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
