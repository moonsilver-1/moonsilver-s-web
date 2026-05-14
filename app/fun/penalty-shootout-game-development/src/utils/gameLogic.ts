import { GoalZone, ShotResult } from '../types/game';

export const ZONE_POSITIONS: Record<GoalZone, { x: number; y: number }> = {
  'top-left':    { x: 0.18, y: 0.15 },
  'top-center':  { x: 0.50, y: 0.15 },
  'top-right':   { x: 0.82, y: 0.15 },
  'mid-left':    { x: 0.18, y: 0.50 },
  'mid-center':  { x: 0.50, y: 0.50 },
  'mid-right':   { x: 0.82, y: 0.50 },
  'bot-left':    { x: 0.18, y: 0.82 },
  'bot-center':  { x: 0.50, y: 0.82 },
  'bot-right':   { x: 0.82, y: 0.82 },
};

export function getZoneFromAim(aimX: number, aimY: number): GoalZone {
  const col = aimX < 0.33 ? 'left' : aimX < 0.67 ? 'center' : 'right';
  const row = aimY < 0.33 ? 'top' : aimY < 0.67 ? 'mid' : 'bot';
  return `${row}-${col}` as GoalZone;
}

export function getGoalkeeperDiveDirection(
  zone: GoalZone,
  power: number
): 'left' | 'right' | 'center' {
  // GK difficulty scales with power: higher power = harder to save
  const saveChance = Math.max(0.1, 0.8 - power * 0.006);
  const random = Math.random();

  if (zone.includes('left')) {
    if (random < saveChance) return 'left';
    return random < saveChance + 0.2 ? 'center' : 'right';
  } else if (zone.includes('right')) {
    if (random < saveChance) return 'right';
    return random < saveChance + 0.2 ? 'center' : 'left';
  } else {
    // center shot
    if (random < saveChance * 0.5) return 'center';
    return random < saveChance * 0.5 + 0.4 ? 'left' : 'right';
  }
}

export function calculateShotResult(
  zone: GoalZone,
  power: number,
  goalkeeperDive: 'left' | 'right' | 'center'
): ShotResult {
  // Miss chance if power is low
  if (power < 20) {
    return Math.random() < 0.5 ? 'miss' : 'saved';
  }
  if (power < 35) {
    if (Math.random() < 0.2) return 'miss';
  }

  // Check if shot is on target (corners are harder to save)
  const isCorner = zone.includes('top') && (zone.includes('left') || zone.includes('right'));

  // Determine if GK saved it
  const dirMatch =
    (zone.includes('left') && goalkeeperDive === 'left') ||
    (zone.includes('right') && goalkeeperDive === 'right') ||
    (zone.includes('center') && goalkeeperDive === 'center');

  if (dirMatch) {
    // GK dove the right way — can they reach it?
  const isTop = zone.includes('top');
  if (isCorner && power > 65) {
      return Math.random() < 0.25 ? 'saved' : 'goal';
    }
    if (isTop && !isCorner && power > 55) {
      return Math.random() < 0.45 ? 'saved' : 'goal';
    }
    return 'saved';
  }

  // GK went wrong way — almost always goal
  if (!dirMatch) {
    if (zone === 'mid-center' || zone === 'bot-center') {
      // Center shots can still be saved if GK stays
      if (goalkeeperDive === 'center' && Math.random() < 0.6) return 'saved';
    }
    return 'goal';
  }

  return 'goal';
}

export function getCpuShotZone(): GoalZone {
  const zones: GoalZone[] = [
    'top-left', 'top-right', 'mid-left', 'mid-right',
    'top-center', 'bot-left', 'bot-right'
  ];
  return zones[Math.floor(Math.random() * zones.length)];
}

export function calculateCpuShotResult(zone: GoalZone): ShotResult {
  const saveZones: Record<GoalZone, number> = {
    'top-left':   0.25,
    'top-right':  0.25,
    'top-center': 0.35,
    'mid-left':   0.4,
    'mid-right':  0.4,
    'mid-center': 0.5,
    'bot-left':   0.3,
    'bot-right':  0.3,
    'bot-center': 0.55,
  };
  const saveProb = saveZones[zone];
  const rand = Math.random();
  if (rand < 0.05) return 'miss';
  if (rand < 0.05 + saveProb) return 'saved';
  return 'goal';
}

export function canGameEnd(
  playerScore: number,
  cpuScore: number,
  currentRound: number,
  maxRounds: number,
  isSuddenDeath: boolean
): boolean {
  if (isSuddenDeath) return false;
  const remaining = maxRounds - currentRound;
  // Player has won
  if (playerScore > cpuScore + remaining) return true;
  // CPU has won
  if (cpuScore > playerScore + remaining) return true;
  return false;
}

export function checkSuddenDeath(
  playerScore: number,
  cpuScore: number,
  currentRound: number,
  maxRounds: number
): boolean {
  return currentRound >= maxRounds && playerScore === cpuScore;
}
