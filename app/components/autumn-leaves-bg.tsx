"use client";

import { useEffect, useRef } from "react";
import { SCENES, type SceneKey, type ParticleConfig } from "@/app/lib/scene-config";
import { useScene } from "@/app/components/scene-provider";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  sway: number;
  swaySpeed: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  color: string;
};

function createParticle(cfg: ParticleConfig, w: number, h: number, randomY: boolean): Particle {
  const [minSize, maxSize] = cfg.sizeRange;
  const [minSpeed, maxSpeed] = cfg.speedRange;
  const [minOp, maxOp] = cfg.opacityRange;
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : -Math.random() * 60,
    size: minSize + Math.random() * (maxSize - minSize),
    speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.003 + Math.random() * 0.007,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: 0.003 + Math.random() * 0.01,
    opacity: minOp + Math.random() * (maxOp - minOp),
    color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
  };
}

function drawLeaf(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s, -s, s, s, 0, s);
  ctx.bezierCurveTo(-s, s, -s, -s, 0, -s);
  ctx.fill();
}

function drawPetal(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.6, s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, s: number, twinkle: number) {
  ctx.globalAlpha *= 0.6 + Math.sin(twinkle) * 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
}

export function SceneParticlesBg() {
  const { scene } = useScene();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let w = 0;
    let h = 0;
    let tick = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const cfg = SCENES[sceneRef.current].particle;
    const particles = Array.from({ length: cfg.count }, () => createParticle(cfg, w, h, true));

    const draw = () => {
      const currentCfg = SCENES[sceneRef.current].particle;
      ctx.clearRect(0, 0, w, h);
      tick++;

      for (const p of particles) {
        p.y += p.speed;
        p.sway += p.swaySpeed;
        p.rotation += p.rotSpeed;
        p.x += Math.sin(p.sway) * currentCfg.swayAmplitude;

        if (p.y > h + 20) Object.assign(p, createParticle(currentCfg, w, h, false));

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        switch (currentCfg.type) {
          case "leaf":
            drawLeaf(ctx, p.size);
            break;
          case "petal":
            drawPetal(ctx, p.size);
            break;
          case "snowflake":
            drawSnowflake(ctx, p.size);
            break;
          case "star":
            drawStar(ctx, p.size, tick * 0.02 + p.sway);
            break;
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

export const AutumnLeavesBg = SceneParticlesBg;
