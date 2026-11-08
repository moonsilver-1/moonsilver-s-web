"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSiteLanguage } from "@/app/components/language-provider";

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

export default function ArtisticStarlitHome() {
  const { language } = useSiteLanguage();
  const isEnglish = language === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const stars: StarParticle[] = Array.from({ length: 85 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.75),
      radius: Math.random() * 1.4 + 0.4,
      alpha: Math.random(),
      speed: Math.random() * 0.018 + 0.006,
    }));

    const shootingStars: ShootingStar[] = Array.from({ length: 3 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.35),
      length: Math.random() * 90 + 50,
      speed: Math.random() * 5 + 6,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      alpha: 0,
      active: false,
    }));

    const fireflies: Firefly[] = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * width,
      y: height * 0.5 + Math.random() * (height * 0.45),
      radius: Math.random() * 1.8 + 1.0,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      alphaSpeed: (Math.random() - 0.5) * 0.025,
    }));

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      stars.forEach((s) => {
        s.alpha += s.speed;
        const currentAlpha = 0.25 + 0.75 * Math.abs(Math.sin(s.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (tick % 200 === 0) {
        const inactive = shootingStars.find((st) => !st.active);
        if (inactive) {
          inactive.active = true;
          inactive.x = Math.random() * width * 0.7 + width * 0.15;
          inactive.y = Math.random() * height * 0.25;
          inactive.alpha = 1;
        }
      }

      shootingStars.forEach((st) => {
        if (!st.active) return;
        st.x += Math.cos(st.angle) * st.speed;
        st.y += Math.sin(st.angle) * st.speed;
        st.alpha -= 0.014;

        if (st.alpha <= 0) {
          st.active = false;
        } else {
          ctx.save();
          ctx.strokeStyle = `rgba(255, 240, 190, ${st.alpha})`;
          ctx.lineWidth = 1.6;
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

      fireflies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.alpha += f.alphaSpeed;

        if (f.alpha > 0.95 || f.alpha < 0.15) {
          f.alphaSpeed = -f.alphaSpeed;
        }

        if (f.y < height * 0.45) f.vy = Math.abs(f.vy);
        if (f.y > height) f.vy = -Math.abs(f.vy);
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 230, 110, 0.85)";
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

  const portals = [
    {
      id: "my",
      href: "/my",
      tag: isEnglish ? "CHRONICLES OF GROWTH" : "银月秋风",
      title: isEnglish ? "Personal Sanctuary & Journal" : "求索与躬耕录",
      subtitle: isEnglish
        ? "Harvest Season, Three Acts of Contests and Lab Lighthouse"
        : "麦穗金黄 砚田晨昏 三幕竞技远征与实验室灯塔",
      badgeImg: "/images/badges/matrix.jpg",
      gradient: "from-[#2b1408]/90 via-[#1f0d04]/90 to-[#120702]/95",
      accent: "#d49b55",
      borderGlow: "hover:border-[#ffdf79]/80 hover:shadow-[0_8px_30px_rgba(212,155,85,0.3)]",
    },
    {
      id: "six",
      href: "/six",
      tag: isEnglish ? "E-JUDGE STUDIO" : "智能评判",
      title: isEnglish ? "Student Role Evaluation System" : "职务智能评判系统",
      subtitle: isEnglish
        ? "Dual-track Decoupled Multi-Agent Engine & STAR Interview"
        : "双轨解耦多智能体协作评判 答辩模拟与五维量化评价",
      badgeImg: "/images/badges/scales.jpg",
      gradient: "from-[#26150b]/90 via-[#1a0e06]/90 to-[#0e0703]/95",
      accent: "#ffdf79",
      borderGlow: "hover:border-[#ffd979]/80 hover:shadow-[0_8px_30px_rgba(255,217,121,0.3)]",
    },
    {
      id: "blog",
      href: "/blog",
      tag: isEnglish ? "ESSAYS & MUSINGS" : "思考长廊",
      title: isEnglish ? "Writings & Midnight Contemplation" : "文海笔耕与思绪",
      subtitle: isEnglish
        ? "From third-person monologues to quiet essays of life and tech"
        : "从第三人称的独白到行路散记 在算力世界里安放柔软灵魂",
      badgeImg: "/images/icons/quill.jpg",
      gradient: "from-[#1a1528]/90 via-[#120d1c]/90 to-[#0a0710]/95",
      accent: "#c4a3ff",
      borderGlow: "hover:border-[#c4a3ff]/80 hover:shadow-[0_8px_30px_rgba(196,163,255,0.3)]",
    },
    {
      id: "study",
      href: "/study/mimo-radar",
      tag: isEnglish ? "RESEARCH & TENSORS" : "求索书斋",
      title: isEnglish ? "MIMO Tensor Radar Journey" : "MIMO张量雷达研学径",
      subtitle: isEnglish
        ? "From echolocation to array manifolds and tensor decompositions"
        : "从回声定位到阵列流型与张量分解 信号处理探索之旅",
      badgeImg: "/images/icons/orb.jpg",
      gradient: "from-[#0c182b]/90 via-[#08111e]/90 to-[#040810]/95",
      accent: "#79a9e8",
      borderGlow: "hover:border-[#79a9e8]/80 hover:shadow-[0_8px_30px_rgba(121,169,232,0.3)]",
    },
    {
      id: "contest",
      href: "/contest",
      tag: isEnglish ? "HONOR CORRIDOR" : "科技竞技",
      title: isEnglish ? "Arena of Innovation" : "科技竞技荣誉长廊",
      subtitle: isEnglish
        ? "Worldwide AMS honors and national technology championship trails"
        : "全球特等奖提名与国家级竞赛攻坚 淬火成芒的极客历程",
      badgeImg: "/images/badges/shield.jpg",
      gradient: "from-[#231508]/90 via-[#180e04]/90 to-[#0c0602]/95",
      accent: "#e8a33d",
      borderGlow: "hover:border-[#e8a33d]/80 hover:shadow-[0_8px_30px_rgba(232,163,61,0.3)]",
    },
    {
      id: "fun",
      href: "/fun",
      tag: isEnglish ? "PIXEL RETRO" : "像素庄园",
      title: isEnglish ? "Stardew Farm & Arcade" : "像素街机与休闲农庄",
      subtitle: isEnglish
        ? "Rest your pack in a cozy pixel arcade with sprouts and carrots"
        : "拾起锄头与矿石 在像素复古乐园中暂歇疲惫行囊",
      badgeImg: "/images/badges/growth.jpg",
      gradient: "from-[#132310]/90 via-[#0d180a]/90 to-[#070d05]/95",
      accent: "#7cc74f",
      borderGlow: "hover:border-[#7cc74f]/80 hover:shadow-[0_8px_30px_rgba(124,199,79,0.3)]",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#070512] text-[#eedcb1] overflow-x-hidden select-none">
      
      {/* 宏大的像素艺术主背景：卷发男孩仰望浩瀚星河 */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{
          backgroundImage: "url('/images/starlit_boy.jpg')",
          imageRendering: "pixelated",
        }}
      />

      {/* 动态星空粒子层 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* 渐变流光遮罩层，营造空间流动深邃感 */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#070512]/70 via-transparent to-[#070512] pointer-events-none z-10" />

      {/* 主体内容流 */}
      <div className="relative z-20 mx-auto max-w-6xl px-6 pt-32 pb-24 flex flex-col items-center">
        
        {/* 顶部微光星宿名牌 */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1b120c]/80 border border-[#d49b55]/60 text-[#ffdf79] text-xs font-serif tracking-widest shadow-lg backdrop-blur-md mb-8 animate-fadeIn">
          <span className="text-[#ffdf79]">✦</span>
          <span>{isEnglish ? "AUTUMN MOONLIT COSMOS" : "银月秋风 星海求索"}</span>
          <span className="text-[#ffdf79]">✦</span>
        </div>

        {/* 艺术英文字体主标题 */}
        <h1
          className="font-brand text-5xl sm:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-[#ffe89c] via-[#ffd979] to-[#eedcb1] tracking-[0.25em] font-bold text-center mb-6 drop-shadow-[0_6px_24px_rgba(212,155,85,0.45)]"
        >
          MOONSILVER
        </h1>

        {/* 充满流动感的人文诗意表达 */}
        <p className="font-serif text-base sm:text-xl text-[#f3e5c3]/90 text-center max-w-2xl mx-auto leading-relaxed italic mb-4">
          {isEnglish
            ? "Where silicon equations meet the quiet cosmos, blooming poetry amidst circuits and code."
            : "在算力与电路的坚硬骨骼里 盛放诗意与星辉"}
        </p>

        <p className="font-serif text-xs sm:text-sm text-[#eedcb1]/60 text-center tracking-wider max-w-xl mx-auto mb-12">
          {isEnglish
            ? "A sanctuary of academic exploration, intelligent systems and reflective prose"
            : "不喧哗的晨昏 沉潜的学力印记与无垠求索"}
        </p>

        {/* 艺术流动分割线 */}
        <div className="flex items-center gap-3 w-48 mb-16 opacity-75">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d49b55]" />
          <span className="text-[#ffdf79] text-xs">✦</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d49b55]" />
        </div>

        {/* 六维艺术星宿殿堂网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {portals.map((portal) => (
            <Link
              key={portal.id}
              href={portal.href}
              className={`group relative p-6 sm:p-7 rounded-3xl border border-[#5b2b14]/70 bg-gradient-to-b ${portal.gradient} backdrop-blur-md transition-all duration-500 hover:-translate-y-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${portal.borderGlow} flex flex-col justify-between overflow-hidden`}
            >
              {/* 卡片内流光悬停背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

              <div>
                {/* 顶栏徽章与标签 */}
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full border border-current opacity-85"
                    style={{ color: portal.accent }}
                  >
                    {portal.tag}
                  </span>

                  <img
                    src={portal.badgeImg}
                    alt={portal.title}
                    className="w-8 h-8 rounded-lg object-cover border border-[#5b2b14] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                  />
                </div>

                {/* 卡片主标题 */}
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#ffdf79] group-hover:text-[#ffe89c] transition-colors mb-2.5">
                  {portal.title}
                </h3>

                {/* 副标题与诗意概括 */}
                <p className="font-serif text-xs sm:text-sm text-[#eedcb1]/75 leading-relaxed">
                  {portal.subtitle}
                </p>
              </div>

              {/* 底栏探入指引 */}
              <div className="mt-6 pt-4 border-t border-[#5b2b14]/50 flex items-center justify-between text-xs font-serif text-[#d49b55] group-hover:text-[#ffdf79] transition-colors">
                <span className="tracking-wider">
                  {isEnglish ? "Explore Realm" : "进入探寻"}
                </span>
                <span className="font-mono text-sm transform group-hover:translate-x-1.5 transition-transform duration-300">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 卷尾流动星河寄语 */}
        <div className="mt-20 text-center max-w-xl mx-auto space-y-3">
          <div className="w-8 h-8 rounded-full bg-[#1b120c]/80 border border-[#d49b55]/60 text-[#ffdf79] flex items-center justify-center mx-auto text-xs shadow-md">
            ✦
          </div>
          <p className="text-xs sm:text-sm text-[#eedcb1]/75 font-serif italic leading-relaxed">
            {isEnglish
              ? "Honors are merely wildflowers gathered along the trail. What truly endures is the soul that derived equations into dawn and still gazes upon the starlight."
              : "麦穗已在秋风中垂首，星光依然在夜空深处闪烁。所谓奖项不过是远征沿途采下的野花与矿石。真正珍贵的，是那个在深夜台灯下专注推导、在星空草丘上依然仰望未来的灵魂。"}
          </p>
        </div>

      </div>

    </div>
  );
}
