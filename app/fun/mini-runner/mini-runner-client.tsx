"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";

/* ── types ── */
type GameStatus = "idle" | "playing" | "over";

type Obstacle = {
  x: number;
  w: number;
  h: number;
  type: "rock" | "stump" | "gap" | "bird";
  scored: boolean;
};

type Leaf = {
  x: number;
  y: number;
  size: number;
  speed: number;
  rot: number;
  rotSpeed: number;
};

type Cloud = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
  frame: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: "dust" | "coin" | "shield" | "speed";
};

type State = {
  status: GameStatus;
  playerY: number;
  playerVy: number;
  playerFrame: number;
  crouching: boolean;
  shielding: boolean;
  shieldTimer: number;
  energy: number;
  obstacles: Obstacle[];
  leaves: Leaf[];
  clouds: Cloud[];
  coins: Coin[];
  particles: Particle[];
  scrollSpeed: number;
  distance: number;
  score: number;
  lastObstacleX: number;
  groundOffset: number;
  wasOnGround: boolean;
  coinCount: number;
};

/* ── constants (virtual coords 400×260) ── */
/* ── scene system ── */
type SceneType = "forest" | "beach" | "city" | "countryside" | "mountains" | "night";

function getScene(score: number): SceneType {
  if (score >= 1000) return "night";
  if (score >= 800) return "mountains";
  if (score >= 600) return "countryside";
  if (score >= 400) return "city";
  if (score >= 200) return "beach";
  return "forest";
}

const W = 400;
const H = 260;
const GROUND_Y = 215;
const GRAVITY = 0.85;
const JUMP_VEL = -11.0;
const BASE_SPEED = 2.8;
const PLAYER_X = 60;
const PLAYER_W = 18;
const PLAYER_H = 26;
const PLAYER_CROUCH_H = 14;
const HIT_SHRINK = 3;

const MIN_GAP = 170;
const MAX_GAP = 300;
const ENERGY_MAX = 5;
const SHIELD_DURATION = 90; // frames

const LS_KEY = "moonsilver-runner-best";

/* ── palettes ── */
type ScenePalette = {
  skyTop: string; skyBot: string; hillFar: string; hillNear: string;
  ground: string; grass: string; grassBlade: string;
  obstacle: string; obstacleDark: string; obstacleLight: string;
  tree: string; treeTrunk: string;
  cloud: string; cloudHighlight: string;
  particleDust: string;
};
function palette(theme: string, scene: SceneType = "forest") {
  const light = theme === "light";
  const sc: Record<string, ScenePalette> = {
    forest: {
      skyTop: light ? "#f5f1e8" : "#0a0806",
      skyBot: light ? "#efe0cf" : "#1c130d",
      hillFar: light ? "#d4c4a8" : "#1a1209",
      hillNear: light ? "#c2ad8a" : "#261c0e",
      ground: light ? "#8b6d4a" : "#2a1f15",
      grass: light ? "#7a9a56" : "#3a4a2a",
      grassBlade: light ? "#6a8a46" : "#2a3a1a",
      obstacle: light ? "#9b7b55" : "#3a3025",
      obstacleDark: light ? "#7a5e3e" : "#2a2015",
      obstacleLight: light ? "#b8956e" : "#4a4035",
      tree: light ? "#6a8a46" : "#2a3a1a",
      treeTrunk: light ? "#7a5e3e" : "#3a2a15",
      cloud: light ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)",
      cloudHighlight: light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)",
      particleDust: light ? "rgba(139,109,74,0.6)" : "rgba(180,150,100,0.5)",
    },
    beach: {
      skyTop: light ? "#4a90d9" : "#0a1628",
      skyBot: light ? "#a0d4f0" : "#162a45",
      hillFar: light ? "#2a7ab8" : "#0a2545",
      hillNear: light ? "#2068a0" : "#153555",
      ground: light ? "#e8d5a0" : "#3a3020",
      grass: light ? "#d4c080" : "#4a4030",
      grassBlade: light ? "#c0aa68" : "#3a3525",
      obstacle: light ? "#6a8a9a" : "#2a3540",
      obstacleDark: light ? "#5a7a8a" : "#1a2530",
      obstacleLight: light ? "#8aaabb" : "#3a4555",
      tree: light ? "#2a8a2a" : "#1a4a1a",
      treeTrunk: light ? "#8a6a3a" : "#4a3a20",
      cloud: light ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.05)",
      cloudHighlight: light ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)",
      particleDust: light ? "rgba(232,213,160,0.6)" : "rgba(200,180,120,0.5)",
    },
    city: {
      skyTop: light ? "#a0b0c0" : "#0d1117",
      skyBot: light ? "#c0c8d0" : "#161b22",
      hillFar: light ? "#607080" : "#0d1218",
      hillNear: light ? "#506070" : "#151d25",
      ground: light ? "#606870" : "#1a1e22",
      grass: light ? "#808890" : "#2a3038",
      grassBlade: light ? "#707880" : "#222830",
      obstacle: light ? "#5a6068" : "#252a30",
      obstacleDark: light ? "#484e55" : "#1a2025",
      obstacleLight: light ? "#727a82" : "#353a40",
      tree: light ? "#408040" : "#1a3a1a",
      treeTrunk: light ? "#707070" : "#353535",
      cloud: light ? "rgba(200,200,210,0.6)" : "rgba(255,255,255,0.03)",
      cloudHighlight: light ? "rgba(220,220,230,0.8)" : "rgba(255,255,255,0.05)",
      particleDust: light ? "rgba(100,110,120,0.5)" : "rgba(80,90,100,0.4)",
    },
    countryside: {
      skyTop: light ? "#50a8e0" : "#0a1428",
      skyBot: light ? "#80c8f0" : "#142840",
      hillFar: light ? "#6ab84a" : "#0a2a0a",
      hillNear: light ? "#5aa838" : "#0a3a0a",
      ground: light ? "#5a9030" : "#1a2a10",
      grass: light ? "#4a8020" : "#2a4a1a",
      grassBlade: light ? "#3a7018" : "#1a3a10",
      obstacle: light ? "#8a7a55" : "#3a3020",
      obstacleDark: light ? "#6a5a3a" : "#2a2010",
      obstacleLight: light ? "#aa9a75" : "#4a4030",
      tree: light ? "#4a8a2a" : "#1a3a10",
      treeTrunk: light ? "#6a4a2a" : "#3a2a15",
      cloud: light ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.04)",
      cloudHighlight: light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)",
      particleDust: light ? "rgba(90,150,50,0.5)" : "rgba(70,120,40,0.4)",
    },
    mountains: {
      skyTop: light ? "#7aa0be" : "#0a1020",
      skyBot: light ? "#a0c0d8" : "#152030",
      hillFar: light ? "#8090a0" : "#101820",
      hillNear: light ? "#6a7a8a" : "#182028",
      ground: light ? "#8a8070" : "#252018",
      grass: light ? "#c0c8d0" : "#3a3a40",
      grassBlade: light ? "#b0b8c0" : "#2a2a30",
      obstacle: light ? "#7a7060" : "#302820",
      obstacleDark: light ? "#5a5040" : "#201810",
      obstacleLight: light ? "#9a9080" : "#403830",
      tree: light ? "#2a5a2a" : "#102a10",
      treeTrunk: light ? "#5a4030" : "#2a1a10",
      cloud: light ? "rgba(220,230,240,0.7)" : "rgba(255,255,255,0.04)",
      cloudHighlight: light ? "rgba(240,245,255,0.9)" : "rgba(255,255,255,0.06)",
      particleDust: light ? "rgba(160,170,180,0.5)" : "rgba(120,130,140,0.4)",
    },
    night: {
      skyTop: light ? "#1a0a3a" : "#050510",
      skyBot: light ? "#2a1a5a" : "#0a0a20",
      hillFar: light ? "#0a1a2a" : "#050a12",
      hillNear: light ? "#0a0a1a" : "#080810",
      ground: light ? "#1a1028" : "#0a0810",
      grass: light ? "#2a1a4a" : "#12101a",
      grassBlade: light ? "#1a0a3a" : "#0e0c15",
      obstacle: light ? "#3a2a5a" : "#1a1525",
      obstacleDark: light ? "#2a1a4a" : "#12101a",
      obstacleLight: light ? "#4a3a6a" : "#252035",
      tree: light ? "#1a2a4a" : "#0a1020",
      treeTrunk: light ? "#2a1a3a" : "#151020",
      cloud: light ? "rgba(100,80,150,0.3)" : "rgba(50,30,80,0.15)",
      cloudHighlight: light ? "rgba(120,100,170,0.5)" : "rgba(60,40,90,0.2)",
      particleDust: light ? "rgba(80,60,120,0.5)" : "rgba(60,40,100,0.4)",
    },
  };
  const s = sc[scene] || sc.forest;
  return {
    ...s,
    playerBody: light ? "#5c3a1e" : "#d4a34a",
    playerHead: light ? "#f5dfc0" : "#f0d8a0",
    playerHat: light ? "#b33a1c" : "#c0392b",
    playerHatDark: light ? "#8b2c14" : "#962d22",
    playerArm: light ? "#7a5030" : "#c49030",
    playerShoe: light ? "#3a2210" : "#5c3a1e",
    playerCape: light ? "#c0392b" : "#e74c3c",
    playerCapeDark: light ? "#962d22" : "#c0392b",
    eyeColor: "#1a1a1a",
    coin: light ? "#d4a34a" : "#f0d860",
    coinDark: light ? "#b7791f" : "#c49a30",
    coinShine: light ? "#f5e6a0" : "#fffbe0",
    leafColors: scene === "beach"
      ? ["#ffffff", "#87ceeb", "#4a90d9", "#e8d5a0", "#f0e68c", "#deb887"]
      : scene === "city"
        ? ["#ff6600", "#ffaa00", "#ffffff", "#aaaaaa", "#ff4444", "#44aaff"]
        : scene === "countryside"
          ? ["#ff69b4", "#ffffff", "#ffdd44", "#ff88aa", "#aa66ff", "#ffaa88"]
          : scene === "mountains"
            ? ["#ffffff", "#e0e8f0", "#c0d0e0", "#a0b8d0", "#f0f5ff", "#d0e0f0"]
            : scene === "night"
              ? ["#00ffff", "#ff00ff", "#8800ff", "#00aaff", "#ff4488", "#44ffaa"]
              : ["#c0392b", "#d4a34a", "#b7791f", "#8b4513", "#e67e22", "#a93226"],
    scoreText: light ? "#181513" : "#f6f2ea",
    scoreShadow: light ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
    particleCoin: light ? "#d4a34a" : "#f0d860",
    shieldColor: light ? "#3498db" : "#5dade2",
    shieldGlow: light ? "rgba(52,152,219,0.25)" : "rgba(93,173,226,0.2)",
    speedColor: light ? "#e67e22" : "#f39c12",
    overlayBg: light ? "rgba(245,241,232,0.75)" : "rgba(5,5,5,0.75)",
    overlayText: light ? "#181513" : "#f6f2ea",
    overlayMuted: light ? "rgba(24,21,19,0.6)" : "rgba(246,242,234,0.5)",
    birdBody: light ? "#5c3a1e" : "#a08060",
    birdWing: light ? "#7a5030" : "#c49030",
    energyEmpty: light ? "rgba(24,21,19,0.15)" : "rgba(246,242,234,0.1)",
    energyFull: light ? "#d4a34a" : "#f0d860",
    crouchHint: light ? "rgba(24,21,19,0.4)" : "rgba(246,242,234,0.3)",
    scene,
  };
}

function initState(): State {
  return {
    status: "idle",
    playerY: 0,
    playerVy: 0,
    playerFrame: 0,
    crouching: false,
    shielding: false,
    shieldTimer: 0,
    energy: 0,
    obstacles: [],
    leaves: Array.from({ length: 12 }, () => makeLeaf(Math.random() * W)),
    clouds: Array.from({ length: 5 }, () => makeCloud(Math.random() * W)),
    coins: [],
    particles: [],
    scrollSpeed: BASE_SPEED,
    distance: 0,
    score: 0,
    lastObstacleX: W + 100,
    groundOffset: 0,
    wasOnGround: true,
    coinCount: 0,
  };
}

function makeLeaf(startX: number): Leaf {
  return {
    x: startX,
    y: Math.random() * (GROUND_Y - 30),
    size: 4 + Math.random() * 5,
    speed: 0.3 + Math.random() * 0.6,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.08,
  };
}

function makeCloud(startX: number): Cloud {
  return {
    x: startX,
    y: 15 + Math.random() * 60,
    w: 30 + Math.random() * 40,
    h: 12 + Math.random() * 10,
    speed: 0.15 + Math.random() * 0.25,
  };
}

// spawn coins in a jump arc between obstacles, not above them
function spawnCoinArc(state: State, afterX: number) {
  if (Math.random() > 0.7) return;
  // coins at comfortable jump height: GROUND_Y - 45 to GROUND_Y - 75
  const baseY = GROUND_Y - 50 - Math.random() * 25;
  const startX = afterX + 40 + Math.random() * 30;
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    state.coins.push({
      x: startX + i * 20,
      y: baseY - Math.sin(i / (count - 1) * Math.PI) * 15,
      collected: false,
      frame: 0,
    });
  }
}

function spawnObstacle(state: State): void {
  const rand = Math.random();
  let type: Obstacle["type"], w: number, h: number;
  if (rand < 0.3) {
    type = "rock";
    w = 18 + Math.random() * 10;
    h = 14 + Math.random() * 10;
  } else if (rand < 0.55) {
    type = "stump";
    w = 14 + Math.random() * 6;
    h = 22 + Math.random() * 8;
  } else if (rand < 0.75) {
    type = "gap";
    w = 30 + Math.random() * 20;
    h = 40;
  } else {
    // bird - flies at head height, must crouch
    type = "bird";
    w = 20;
    h = 10;
  }
  state.obstacles.push({ x: W + 20, w, h, type, scored: false });

  // coins between obstacles at jump height, not above this obstacle
  const prevObs = state.obstacles.length >= 2 ? state.obstacles[state.obstacles.length - 2] : null;
  if (prevObs) {
    spawnCoinArc(state, prevObs.x + prevObs.w);
  }

  state.lastObstacleX = W + 20;
}

function emitDust(state: State, x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 2.5,
      vy: -Math.random() * 2,
      life: 15 + Math.random() * 10,
      maxLife: 25,
      size: 2 + Math.random() * 2,
      kind: "dust",
    });
  }
}

function emitCoinParticles(state: State, x: number, y: number) {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 12 + Math.random() * 8,
      maxLife: 20,
      size: 1.5 + Math.random() * 1.5,
      kind: "coin",
    });
  }
}

function emitShieldParticle(state: State, x: number, y: number) {
  state.particles.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -Math.random() * 1.5,
    life: 10 + Math.random() * 8,
    maxLife: 18,
    size: 3 + Math.random() * 3,
    kind: "shield",
  });
}

/* ── drawing helpers ── */
function drawSky(ctx: CanvasRenderingContext2D, p: ReturnType<typeof palette>) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, p.skyTop);
  grad.addColorStop(1, p.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, GROUND_Y);
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[], p: ReturnType<typeof palette>) {
  for (const c of clouds) {
    ctx.fillStyle = p.cloud;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.cloudHighlight;
    ctx.beginPath();
    ctx.ellipse(c.x - c.w * 0.15, c.y - c.h * 0.15, c.w * 0.3, c.h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx: CanvasRenderingContext2D, offset: number, p: ReturnType<typeof palette>) {
  ctx.fillStyle = p.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 2) {
    const y = GROUND_Y - 35 - Math.sin((x + offset * 0.15) * 0.012) * 25 - Math.sin((x + offset * 0.15) * 0.025) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const tx = ((i * 55 + 20 - offset * 0.15) % (W + 60)) - 30;
    const hillY = GROUND_Y - 35 - Math.sin((tx + offset * 0.15) * 0.012) * 25 - Math.sin((tx + offset * 0.15) * 0.025) * 12;
    drawSmallTree(ctx, tx, hillY, 6 + (i % 3) * 2, p);
  }

  ctx.fillStyle = p.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= W; x += 2) {
    const y = GROUND_Y - 18 - Math.sin((x + offset * 0.3) * 0.018) * 18 - Math.sin((x + offset * 0.3) * 0.04) * 8;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, GROUND_Y);
  ctx.fill();
}

function drawSmallTree(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: number, p: ReturnType<typeof palette>) {
  const scene = (p as Record<string, unknown>).scene as SceneType;
  if (scene === "beach") {
    ctx.strokeStyle = p.treeTrunk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + 2, baseY - size, x + 4, baseY - size * 1.3);
    ctx.stroke();
    ctx.fillStyle = p.tree;
    for (let a = 0; a < 5; a++) {
      const angle = (a / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, baseY - size * 1.3);
      ctx.quadraticCurveTo(
        x + 4 + Math.cos(angle) * size * 0.6,
        baseY - size * 1.3 + Math.sin(angle) * size * 0.3 - size * 0.2,
        x + 4 + Math.cos(angle) * size * 0.8,
        baseY - size * 1.0 + Math.sin(angle) * size * 0.5
      );
      ctx.lineTo(x + 4, baseY - size * 1.2);
      ctx.fill();
    }
  } else if (scene === "city") {
    ctx.fillStyle = p.treeTrunk;
    ctx.fillRect(x - size * 0.4, baseY - size * 1.5, size * 0.8, size * 1.5);
    ctx.fillStyle = p.obstacleLight;
    for (let wy = 0; wy < 3; wy++) {
      for (let wx = 0; wx < 2; wx++) {
        ctx.fillRect(
          x - size * 0.3 + wx * size * 0.35,
          baseY - size * 1.4 + wy * size * 0.4,
          size * 0.2, size * 0.15
        );
      }
    }
  } else if (scene === "countryside") {
    ctx.fillStyle = p.tree;
    ctx.beginPath();
    ctx.arc(x, baseY - size * 0.5, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    const flowerColors = ["#ff69b4", "#ffdd44", "#ff88aa", "#aa66ff"];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = flowerColors[i];
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(i * 1.5) * size * 0.3,
        baseY - size * 0.5 + Math.sin(i * 1.5) * size * 0.3,
        1.5, 0, Math.PI * 2
      );
      ctx.fill();
    }
  } else if (scene === "mountains") {
    ctx.fillStyle = p.treeTrunk;
    ctx.fillRect(x - 1, baseY - size * 0.3, 2, size * 0.3);
    ctx.fillStyle = p.tree;
    for (let i = 0; i < 3; i++) {
      const w = size * (0.6 - i * 0.12);
      const y = baseY - size * (0.3 + i * 0.35);
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.3);
      ctx.lineTo(x - w, y);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (scene === "night") {
    ctx.fillStyle = p.tree;
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 1.2);
    ctx.lineTo(x - size * 0.3, baseY);
    ctx.lineTo(x + size * 0.3, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.shieldColor;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, baseY - size * 0.4, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = p.treeTrunk;
    ctx.fillRect(x - 1, baseY - size * 0.4, 2, size * 0.4);
    ctx.fillStyle = p.tree;
    ctx.beginPath();
    ctx.moveTo(x, baseY - size * 1.2);
    ctx.lineTo(x - size * 0.5, baseY - size * 0.3);
    ctx.lineTo(x + size * 0.5, baseY - size * 0.3);
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number, p: ReturnType<typeof palette>) {
  const scene = (p as Record<string, unknown>).scene as SceneType;
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = p.grass;
  ctx.fillRect(0, GROUND_Y, W, 3);

  if (scene === "beach") {
    ctx.strokeStyle = p.obstacleLight;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const gx = ((i * 80 - offset * 0.5) % (W + 80)) - 40;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 10 + i * 8);
      ctx.quadraticCurveTo(gx + 20, GROUND_Y + 8 + i * 8, gx + 40, GROUND_Y + 10 + i * 8);
      ctx.stroke();
    }
  } else if (scene === "city") {
    ctx.strokeStyle = p.obstacleLight;
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + (H - GROUND_Y) / 2);
    ctx.lineTo(W, GROUND_Y + (H - GROUND_Y) / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (scene === "countryside") {
    const flowerColors = ["#ff69b4", "#ffdd44", "#ff88aa", "#ffffff"];
    for (let i = 0; i < 15; i++) {
      const gx = ((i * 29 - offset * 0.7) % (W + 30)) - 15;
      ctx.fillStyle = flowerColors[i % flowerColors.length];
      ctx.beginPath();
      ctx.arc(gx, GROUND_Y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === "mountains") {
    ctx.fillStyle = p.grassBlade;
    for (let i = 0; i < 10; i++) {
      const gx = ((i * 45 - offset * 0.6) % (W + 50)) - 25;
      ctx.fillRect(gx, GROUND_Y + 3, 8 + (i % 3) * 4, 2);
    }
  } else if (scene === "night") {
    for (let i = 0; i < 8; i++) {
      const gx = ((i * 55 - offset * 0.4) % (W + 60)) - 30;
      ctx.fillStyle = p.shieldColor;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(gx, GROUND_Y + 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    for (let i = 0; i < 40; i++) {
      const gx = ((i * 11 - offset) % (W + 20)) - 10;
      ctx.fillStyle = i % 3 === 0 ? p.grassBlade : p.grass;
      ctx.fillRect(gx, GROUND_Y - 3, 1, 4);
    }
    ctx.strokeStyle = p.obstacleDark;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 12; i++) {
      const gx = ((i * 38 - offset * 0.8) % (W + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 8 + (i % 3) * 10);
      ctx.lineTo(gx + 15 + (i % 2) * 8, GROUND_Y + 8 + (i % 3) * 10);
      ctx.stroke();
    }
  }
}

function drawObstacles(ctx: CanvasRenderingContext2D, obstacles: Obstacle[], frame: number, p: ReturnType<typeof palette>) {
  for (const ob of obstacles) {
    if (ob.x + ob.w < -10 || ob.x > W + 10) continue;

    if (ob.type === "gap") {
      ctx.fillStyle = p.skyBot;
      ctx.fillRect(ob.x, GROUND_Y, ob.w, H - GROUND_Y);
      ctx.fillStyle = p.playerHat;
      for (let sy = 0; sy < 8; sy += 4) {
        ctx.fillRect(ob.x + (sy % 4 === 0 ? 0 : 2), GROUND_Y + sy, 2, 2);
        ctx.fillRect(ob.x + ob.w - 2 + (sy % 4 === 0 ? 0 : 2), GROUND_Y + sy, 2, 2);
      }
    } else if (ob.type === "bird") {
      const birdY = GROUND_Y - PLAYER_H - 6;
      const cx = ob.x + ob.w / 2;
      const wingPhase = Math.sin(frame * 0.25) * 5;

      // tail feathers
      ctx.fillStyle = p.birdWing;
      ctx.beginPath();
      ctx.moveTo(cx + 7, birdY);
      ctx.lineTo(cx + 14, birdY - 4);
      ctx.lineTo(cx + 11, birdY);
      ctx.lineTo(cx + 14, birdY + 3);
      ctx.closePath();
      ctx.fill();

      // body (rounder)
      ctx.fillStyle = p.birdBody;
      ctx.beginPath();
      ctx.ellipse(cx, birdY, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // wing
      ctx.fillStyle = p.birdWing;
      ctx.beginPath();
      ctx.moveTo(cx - 2, birdY - 3);
      ctx.quadraticCurveTo(cx, birdY - 12 + wingPhase, cx + 6, birdY - 2);
      ctx.closePath();
      ctx.fill();

      // head
      ctx.fillStyle = p.birdBody;
      ctx.beginPath();
      ctx.arc(cx - 7, birdY, 4, 0, Math.PI * 2);
      ctx.fill();

      // beak
      ctx.fillStyle = p.coin;
      ctx.beginPath();
      ctx.moveTo(cx - 10, birdY - 1);
      ctx.lineTo(cx - 14, birdY);
      ctx.lineTo(cx - 10, birdY + 1);
      ctx.closePath();
      ctx.fill();

      // eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx - 8, birdY - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.eyeColor;
      ctx.beginPath();
      ctx.arc(cx - 8.5, birdY - 1, 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const baseY = GROUND_Y - ob.h;
      ctx.fillStyle = p.obstacleDark;
      ctx.fillRect(ob.x + 2, baseY + 2, ob.w, ob.h);
      ctx.fillStyle = p.obstacle;
      ctx.fillRect(ob.x, baseY, ob.w, ob.h);
      ctx.fillStyle = p.obstacleLight;
      ctx.fillRect(ob.x + 2, baseY + 2, ob.w - 4, 2);
      ctx.fillStyle = p.obstacleDark;
      ctx.fillRect(ob.x, baseY, ob.w, 2);

      if (ob.type === "stump") {
        ctx.fillStyle = p.obstacleLight;
        ctx.fillRect(ob.x - 4, baseY + 4, 5, 3);
        ctx.fillRect(ob.x + ob.w - 1, baseY + 6, 5, 3);
        ctx.fillStyle = p.obstacleDark;
        ctx.beginPath();
        ctx.arc(ob.x + ob.w / 2, baseY + 1, Math.min(ob.w / 3, 4), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (ob.type === "rock") {
        ctx.fillStyle = p.grass;
        ctx.fillRect(ob.x + 3, baseY + 1, 4, 2);
      }
    }
  }
}

function drawCoins(ctx: CanvasRenderingContext2D, coins: Coin[], p: ReturnType<typeof palette>) {
  for (const coin of coins) {
    if (coin.collected) continue;
    const bobY = Math.sin(coin.frame * 0.1) * 2;
    const squeeze = Math.abs(Math.cos(coin.frame * 0.08));

    ctx.fillStyle = p.coinShine;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bobY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = p.coin;
    ctx.beginPath();
    ctx.ellipse(coin.x, coin.y + bobY, 5 * Math.max(squeeze, 0.3), 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.coinDark;
    ctx.beginPath();
    ctx.ellipse(coin.x, coin.y + bobY, 3 * Math.max(squeeze, 0.3), 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (squeeze > 0.5) {
      ctx.fillStyle = p.coinShine;
      ctx.fillRect(coin.x - 1, coin.y + bobY - 3, 1.5, 2);
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, y: number, frame: number, crouching: boolean, shielding: boolean, shieldTimer: number, p: ReturnType<typeof palette>) {
  const px = PLAYER_X;
  const ph = crouching ? PLAYER_CROUCH_H : PLAYER_H;
  const py = GROUND_Y - ph + y;
  const legPhase = Math.floor(frame / 4) % 4;

  // shield glow
  if (shielding) {
    ctx.fillStyle = p.shieldGlow;
    ctx.beginPath();
    ctx.arc(px + PLAYER_W / 2, py + ph / 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.shieldColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4 + Math.sin(frame * 0.2) * 0.2;
    ctx.beginPath();
    ctx.arc(px + PLAYER_W / 2, py + ph / 2, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (crouching) {
    // crouching pose - squished
    // body wider
    ctx.fillStyle = p.playerBody;
    ctx.fillRect(px + 1, py + 4, PLAYER_W - 2, ph - 8);

    // head
    ctx.fillStyle = p.playerHead;
    ctx.beginPath();
    ctx.arc(px + PLAYER_W / 2, py + 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // hat
    ctx.fillStyle = p.playerHat;
    ctx.fillRect(px + 1, py - 1, PLAYER_W - 2, 3);

    // eyes
    ctx.fillStyle = p.eyeColor;
    ctx.fillRect(px + PLAYER_W / 2, py + 3, 2.5, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px + PLAYER_W / 2 + 1, py + 3, 1, 1);

    // small cape
    ctx.fillStyle = p.playerCape;
    ctx.fillRect(px - 3, py + 6, 4, 5);
  } else {
    // cape
    const capeWave = Math.sin(frame * 0.2) * 3;
    ctx.fillStyle = p.playerCape;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 9);
    ctx.quadraticCurveTo(px - 6 + capeWave, py + 18, px - 4 + capeWave * 0.5, py + PLAYER_H);
    ctx.lineTo(px + 3, py + PLAYER_H - 2);
    ctx.fill();
    ctx.fillStyle = p.playerCapeDark;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 10);
    ctx.quadraticCurveTo(px - 3 + capeWave * 0.6, py + 15, px - 2 + capeWave * 0.3, py + PLAYER_H - 3);
    ctx.lineTo(px + 3, py + PLAYER_H - 3);
    ctx.fill();

    // body
    ctx.fillStyle = p.playerBody;
    ctx.fillRect(px + 3, py + 8, PLAYER_W - 6, PLAYER_H - 14);

    // arm
    ctx.fillStyle = p.playerArm;
    const armSwing = y < 0 ? -3 : Math.sin(frame * 0.3) * 4;
    ctx.fillRect(px + PLAYER_W - 2, py + 10 + armSwing, 4, 3);
    if (y < 0) {
      ctx.fillRect(px - 2, py + 6, 3, 3);
    }

    // head
    ctx.fillStyle = p.playerHead;
    ctx.beginPath();
    ctx.arc(px + PLAYER_W / 2, py + 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // hat
    ctx.fillStyle = p.playerHat;
    ctx.fillRect(px + 1, py - 1, PLAYER_W - 2, 4);
    ctx.fillRect(px + 4, py - 5, PLAYER_W - 8, 5);
    ctx.fillStyle = p.playerHatDark;
    ctx.fillRect(px + 4, py + 2, PLAYER_W - 8, 1);

    // eyes
    ctx.fillStyle = p.eyeColor;
    ctx.fillRect(px + PLAYER_W / 2, py + 4, 2.5, 2.5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px + PLAYER_W / 2 + 1, py + 4, 1, 1);

    // mouth
    ctx.fillStyle = p.playerHat;
    ctx.fillRect(px + PLAYER_W / 2 + 1, py + 8, 2, 1);

    // legs
    ctx.fillStyle = p.playerShoe;
    if (y < 0) {
      ctx.fillRect(px + 5, py + PLAYER_H - 6, 3, 6);
      ctx.fillRect(px + PLAYER_W - 8, py + PLAYER_H - 6, 3, 6);
    } else {
      const offsets = [[0, 4], [2, 2], [4, 0], [2, 2]];
      const [l1, l2] = offsets[legPhase];
      ctx.fillRect(px + 4, py + PLAYER_H - 6 + l1, 3, 6 - l1);
      ctx.fillRect(px + PLAYER_W - 7, py + PLAYER_H - 6 + l2, 3, 6 - l2);
    }
  }
}

function drawLeaves(ctx: CanvasRenderingContext2D, leaves: Leaf[], p: ReturnType<typeof palette>) {
  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.fillStyle = p.leafColors[Math.abs(Math.floor(leaf.x * 7 + leaf.y * 3)) % p.leafColors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(-leaf.size * 0.7, 0);
    ctx.lineTo(leaf.size * 0.7, 0);
    ctx.stroke();
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], p: ReturnType<typeof palette>) {
  for (const pt of particles) {
    const alpha = pt.life / pt.maxLife;
    ctx.globalAlpha = alpha;
    if (pt.kind === "coin") {
      ctx.fillStyle = p.particleCoin;
    } else if (pt.kind === "shield") {
      ctx.fillStyle = p.shieldColor;
    } else {
      ctx.fillStyle = p.particleDust;
    }
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, energy: number, shielding: boolean, p: ReturnType<typeof palette>) {
  // score
  ctx.fillStyle = p.scoreShadow;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "right";
  ctx.fillText(String(score), W - 10, 23);
  ctx.fillStyle = p.scoreText;
  ctx.fillText(String(score), W - 11, 22);

  // energy dots
  for (let i = 0; i < ENERGY_MAX; i++) {
    ctx.fillStyle = i < energy ? p.energyFull : p.energyEmpty;
    ctx.beginPath();
    ctx.arc(W - 10 - (ENERGY_MAX - 1 - i) * 12, 38, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // shield bar
  if (shielding) {
    ctx.fillStyle = p.shieldColor;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(10, H - 12, W - 20, 4);
    ctx.globalAlpha = 1;
  }
}

function drawCrouchHint(ctx: CanvasRenderingContext2D, frame: number, p: ReturnType<typeof palette>) {
  if (frame % 120 < 60) return; // blink
  ctx.fillStyle = p.crouchHint;
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("↓ crouch  5coins→shield", 10, H - 6);
}

/* ── component ── */
export default function MiniRunnerClient() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<State>(initState());
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [displayScore, setDisplayScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [highScore, setHighScore] = useState(0);

  const copy = language === "en"
    ? { start: "Mini Runner", hint: "Space: jump · ↓: crouch · 5 coins = shield", over: "Game Over", score: "Score", best: "Best", retry: "Space / Click to retry", shield: "Shield" }
    : { start: "跑酷小游戏", hint: "空格:跳跃 · ↓:蹲下 · 集齐5金币自动护盾", over: "游戏结束", score: "分数", best: "最高", retry: "空格 / 点击 重试", shield: "护盾" };

  const p = palette(theme, getScene(stateRef.current.score));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setHighScore(parseInt(stored, 10));
    } catch {}
  }, []);

  const startOrJump = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "idle") {
      s.status = "playing";
      setGameStatus("playing");
    }
    if (s.status === "over") {
      Object.assign(stateRef.current, initState(), { status: "playing" });
      setGameStatus("playing");
      setDisplayScore(0);
      return;
    }
    if (s.status === "playing" && s.playerY >= 0 && !s.crouching) {
      s.playerVy = JUMP_VEL;
      emitDust(s, PLAYER_X + PLAYER_W / 2, GROUND_Y, 4);
    }
  }, []);

  const activateShield = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "playing" && s.energy >= ENERGY_MAX && !s.shielding) {
      s.shielding = true;
      s.shieldTimer = SHIELD_DURATION;
      s.energy = 0;
    }
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === "Space") {
        e.preventDefault();
        startOrJump();
      }
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        e.preventDefault();
        activateShield();
      }
      const s = stateRef.current;
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        if (s.status === "playing" && s.playerY >= 0) {
          s.crouching = true;
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        stateRef.current.crouching = false;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [startOrJump, activateShield]);

  // game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let scoreTick = 0;

    const loop = () => {
      const s = stateRef.current;

      if (document.hidden) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr * rect.width / W, 0, 0, dpr * rect.height / H, 0, 0);

      const pal = palette(theme, getScene(s.score));

      if (s.status === "playing") {
        const onGround = s.playerY >= 0;
        if (!s.wasOnGround && onGround) {
          emitDust(s, PLAYER_X + PLAYER_W / 2, GROUND_Y, 5);
        }
        s.wasOnGround = onGround;

        s.playerVy += GRAVITY;
        s.playerY += s.playerVy;
        if (s.playerY >= 0) {
          s.playerY = 0;
          s.playerVy = 0;
        }
        s.playerFrame++;

        // shield countdown
        if (s.shielding) {
          s.shieldTimer--;
          if (s.shieldTimer <= 0) {
            s.shielding = false;
          }
          if (s.playerFrame % 3 === 0) {
            emitShieldParticle(s, PLAYER_X + PLAYER_W / 2, GROUND_Y - (s.crouching ? PLAYER_CROUCH_H : PLAYER_H) / 2 + s.playerY);
          }
        }

        s.scrollSpeed = BASE_SPEED + s.distance * 0.0003;
        s.distance += s.scrollSpeed;
        s.groundOffset += s.scrollSpeed;

        scoreTick++;
        if (scoreTick >= 4) {
          scoreTick = 0;
          s.score++;
          setDisplayScore(s.score);
        }

        // obstacles
        for (const ob of s.obstacles) {
          ob.x -= s.scrollSpeed;
          if (!ob.scored && ob.x + ob.w < PLAYER_X) {
            ob.scored = true;
            s.score += 5;
            setDisplayScore(s.score);
          }
        }
        s.obstacles = s.obstacles.filter((ob) => ob.x + ob.w > -30);

        // coins
        for (const coin of s.coins) {
          coin.x -= s.scrollSpeed;
          coin.frame++;
          if (!coin.collected) {
            const dx = PLAYER_X + PLAYER_W / 2 - coin.x;
            const ph = s.crouching ? PLAYER_CROUCH_H : PLAYER_H;
            const dy = (GROUND_Y - ph / 2 + s.playerY) - coin.y;
            if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
              coin.collected = true;
              s.score += 10;
              s.coinCount++;
              s.energy = Math.min(s.energy + 1, ENERGY_MAX);
              if (s.energy >= ENERGY_MAX && !s.shielding) {
                s.shielding = true;
                s.shieldTimer = SHIELD_DURATION;
                s.energy = 0;
              }
              setDisplayScore(s.score);
              emitCoinParticles(s, coin.x, coin.y);
            }
          }
        }
        s.coins = s.coins.filter((c) => c.x > -20);

        // spawn
        const last = s.obstacles[s.obstacles.length - 1];
        const lastX = last ? last.x : -999;
        const spacing = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
        if (lastX < W - spacing) {
          spawnObstacle(s);
        }

        // leaves
        for (const leaf of s.leaves) {
          leaf.x -= leaf.speed + s.scrollSpeed * 0.2;
          leaf.y += 0.3 + Math.sin(leaf.rot) * 0.2;
          leaf.rot += leaf.rotSpeed;
          if (leaf.x < -20) {
            leaf.x = W + 10;
            leaf.y = Math.random() * (GROUND_Y - 30);
          }
        }

        // clouds
        for (const cloud of s.clouds) {
          cloud.x -= cloud.speed + s.scrollSpeed * 0.05;
          if (cloud.x + cloud.w < -20) {
            cloud.x = W + 20;
            cloud.y = 15 + Math.random() * 60;
          }
        }

        // particles
        for (const pt of s.particles) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.08;
          pt.life--;
        }
        s.particles = s.particles.filter((pt) => pt.life > 0);

        // collision (skip if shielding)
        if (!s.shielding) {
          const ph = s.crouching ? PLAYER_CROUCH_H : PLAYER_H;
          const px1 = PLAYER_X + HIT_SHRINK;
          const px2 = PLAYER_X + PLAYER_W - HIT_SHRINK;
          const py1 = GROUND_Y - ph + s.playerY + HIT_SHRINK;
          const py2 = GROUND_Y + s.playerY - HIT_SHRINK;

          for (const ob of s.obstacles) {
            if (ob.type === "gap") {
              if (s.playerY >= 0 && px2 > ob.x + 4 && px1 < ob.x + ob.w - 4) {
                s.status = "over";
                setGameStatus("over");
                if (s.score > highScore) {
                  setHighScore(s.score);
                  try { localStorage.setItem(LS_KEY, String(s.score)); } catch {}
                }
                break;
              }
            } else if (ob.type === "bird") {
              // bird at head height - only hits standing player
              const birdY = GROUND_Y - PLAYER_H - 6;
              const by1 = birdY - 4;
              const by2 = birdY + 4;
              if (px2 > ob.x && px1 < ob.x + ob.w && py2 > by1 && py1 < by2) {
                s.status = "over";
                setGameStatus("over");
                if (s.score > highScore) {
                  setHighScore(s.score);
                  try { localStorage.setItem(LS_KEY, String(s.score)); } catch {}
                }
                break;
              }
            } else {
              const oy1 = GROUND_Y - ob.h;
              const oy2 = GROUND_Y;
              if (px2 > ob.x && px1 < ob.x + ob.w && py2 > oy1 && py1 < oy2) {
                s.status = "over";
                setGameStatus("over");
                if (s.score > highScore) {
                  setHighScore(s.score);
                  try { localStorage.setItem(LS_KEY, String(s.score)); } catch {}
                }
                break;
              }
            }
          }
        }
      } else {
        // idle/over: slow animations
        for (const leaf of s.leaves) {
          leaf.x -= leaf.speed * 0.3;
          leaf.y += 0.15 + Math.sin(leaf.rot) * 0.1;
          leaf.rot += leaf.rotSpeed;
          if (leaf.x < -20) {
            leaf.x = W + 10;
            leaf.y = Math.random() * (GROUND_Y - 30);
          }
        }
        for (const cloud of s.clouds) {
          cloud.x -= cloud.speed * 0.3;
          if (cloud.x + cloud.w < -20) {
            cloud.x = W + 20;
          }
        }
        for (const pt of s.particles) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.08;
          pt.life--;
        }
        s.particles = s.particles.filter((pt) => pt.life > 0);
      }

      // ── draw ──
      drawSky(ctx, pal);
      drawClouds(ctx, s.clouds, pal);
      drawHills(ctx, s.groundOffset, pal);
      drawLeaves(ctx, s.leaves.filter((_, i) => i < 6), pal);
      drawGround(ctx, s.groundOffset, pal);
      drawObstacles(ctx, s.obstacles, s.playerFrame, pal);
      drawCoins(ctx, s.coins, pal);
      drawPlayer(ctx, s.playerY, s.playerFrame, s.crouching, s.shielding, s.shieldTimer, pal);
      drawParticles(ctx, s.particles, pal);
      drawLeaves(ctx, s.leaves.filter((_, i) => i >= 6), pal);

      if (s.status === "playing") {
        drawHUD(ctx, s.score, s.energy, s.shielding, pal);
        if (s.distance < 500) {
          drawCrouchHint(ctx, s.playerFrame, pal);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [theme, highScore]);

  return (
    <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5 backdrop-blur-sm">
      <div
        ref={wrapperRef}
        className="relative min-h-[260px] rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 overflow-hidden cursor-pointer"
        onClick={startOrJump}
        onTouchStart={(e) => { e.preventDefault(); startOrJump(); }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {gameStatus === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: p.overlayBg }}>
            <p className="text-lg font-bold" style={{ color: p.overlayText }}>{copy.start}</p>
            <p className="mt-2 text-center text-xs leading-5" style={{ color: p.overlayMuted }}>{copy.hint}</p>
          </div>
        )}

        {gameStatus === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: p.overlayBg }}>
            <p className="text-lg font-bold" style={{ color: p.overlayText }}>{copy.over}</p>
            <p className="mt-3 text-2xl font-bold" style={{ color: p.overlayText }}>{displayScore}</p>
            {highScore > 0 && (
              <p className="mt-1 text-xs" style={{ color: p.overlayMuted }}>{copy.best}: {highScore}</p>
            )}
            <p className="mt-3 text-xs" style={{ color: p.overlayMuted }}>{copy.retry}</p>
          </div>
        )}
      </div>
    </div>
  );
}
