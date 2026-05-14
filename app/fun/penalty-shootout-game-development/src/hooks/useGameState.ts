import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShotResult, RoundScore } from '../types/game';
import {
  getZoneFromAim,
  getGoalkeeperDiveDirection,
  calculateShotResult,
  getCpuShotZone,
  calculateCpuShotResult,
  ZONE_POSITIONS,
  checkSuddenDeath,
} from '../utils/gameLogic';
import {
  GOAL_W,
  GOAL_H,
  GOAL_L,
  GOAL_T,
  BALL_SX,
  BALL_SY,
} from '../components/Pitch';

const MAX_ROUNDS = 5;
const POWER_SPEED = 1.6;

const initialState = (): GameState => ({
  phase: 'menu',
  playerScore: 0,
  cpuScore: 0,
  currentRound: 0,
  maxRounds: MAX_ROUNDS,
  isSuddenDeath: false,
  roundHistory: [],
  currentShot: null,
  isPlayerTurn: true,
  aimX: 0.5,
  aimY: 0.5,
  power: 0,
  powerDirection: 1,
  goalkeeperX: 0,
  goalkeeperDive: null,
  shotResult: null,
  ballX: BALL_SX,
  ballY: BALL_SY,
  ballAnimating: false,
  showResultText: false,
});

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState());
  const powerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const stopPowerMeter = useCallback(() => {
    if (powerIntervalRef.current !== null) {
      clearInterval(powerIntervalRef.current);
      powerIntervalRef.current = null;
    }
  }, []);

  const startPowerMeter = useCallback(() => {
    stopPowerMeter();
    powerIntervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'shooting') return prev;
        let newPower = prev.power + POWER_SPEED * prev.powerDirection;
        let newDir = prev.powerDirection;
        if (newPower >= 100) {
          newPower = 100;
          newDir = -1;
        } else if (newPower <= 0) {
          newPower = 0;
          newDir = 1;
        }
        return { ...prev, power: newPower, powerDirection: newDir };
      });
    }, 16);
  }, [stopPowerMeter]);



  const processRoundEnd = useCallback((
    playerResult: ShotResult,
    cpuResult: ShotResult,
    prevState: GameState
  ) => {
    const newRound: RoundScore = { player: playerResult, cpu: cpuResult };
    const newHistory = [...prevState.roundHistory, newRound];
    const newPlayerScore = prevState.playerScore + (playerResult === 'goal' ? 1 : 0);
    const newCpuScore = prevState.cpuScore + (cpuResult === 'goal' ? 1 : 0);
    const newRoundNum = prevState.currentRound + 1;

    const sd = checkSuddenDeath(newPlayerScore, newCpuScore, newRoundNum, prevState.maxRounds);

    // Check if game is over
    let gameOver = false;
    if (prevState.isSuddenDeath) {
      // Sudden death: game over after each round if scores differ
      if (newPlayerScore !== newCpuScore) gameOver = true;
    } else {
      const remaining = prevState.maxRounds - newRoundNum;
      if (newPlayerScore > newCpuScore + remaining) gameOver = true;
      if (newCpuScore > newPlayerScore + remaining) gameOver = true;
      if (newRoundNum >= prevState.maxRounds && newPlayerScore !== newCpuScore) gameOver = true;
    }

    return {
      newHistory,
      newPlayerScore,
      newCpuScore,
      newRoundNum,
      sd,
      gameOver,
    };
  }, []);

  const runCpuShot = useCallback(async (prevState: GameState, playerResult: ShotResult) => {
    // Small delay before CPU shot
    await new Promise((r) => setTimeout(r, 800));

    setState((prev) => ({
      ...prev,
      phase: 'shooting',
      isPlayerTurn: false,
      goalkeeperDive: null,
      shotResult: null,
      ballX: BALL_SX,
      ballY: BALL_SY,
      ballAnimating: false,
      showResultText: false,
    }));

    await new Promise((r) => setTimeout(r, 1800));

    const cpuZone = getCpuShotZone();
    const cpuResult = calculateCpuShotResult(cpuZone);

    // Goalkeeper response for CPU shot (player is the keeper)
    // Player keeper: random dive
    const diveRandom = Math.random();
    let playerDive: 'left' | 'right' | 'center';
    if (diveRandom < 0.35) playerDive = 'left';
    else if (diveRandom < 0.7) playerDive = 'right';
    else playerDive = 'center';

    const targetPos = ZONE_POSITIONS[cpuZone];
    const targetX = GOAL_L + targetPos.x * GOAL_W;
    const targetY = GOAL_T + targetPos.y * GOAL_H;

    // Animate
    setState((prev) => ({
      ...prev,
      phase: 'ball_flying',
      ballAnimating: true,
      ballX: targetX,
      ballY: targetY,
      goalkeeperDive: playerDive,
      isPlayerTurn: false,
    }));

    await new Promise((r) => setTimeout(r, 700));

    setState((prev) => ({
      ...prev,
      phase: 'result',
      shotResult: cpuResult,
      showResultText: true,
    }));

    await new Promise((r) => setTimeout(r, 1800));

    // Process round
    setState((prev) => {
      const {
        newHistory,
        newPlayerScore,
        newCpuScore,
        newRoundNum,
        sd,
        gameOver,
      } = processRoundEnd(playerResult, cpuResult, prevState);

      if (gameOver) {
        return {
          ...prev,
          roundHistory: newHistory,
          playerScore: newPlayerScore,
          cpuScore: newCpuScore,
          currentRound: newRoundNum,
          isSuddenDeath: sd,
          phase: 'game_over',
          showResultText: false,
        };
      }

      return {
        ...prev,
        roundHistory: newHistory,
        playerScore: newPlayerScore,
        cpuScore: newCpuScore,
        currentRound: newRoundNum,
        isSuddenDeath: sd,
        phase: 'round_end',
        showResultText: false,
      };
    });
  }, [processRoundEnd]);

  const shoot = useCallback(async () => {
    const st = stateRef.current;
    if (st.phase !== 'shooting' || !st.isPlayerTurn) return;

    stopPowerMeter();

    const zone = getZoneFromAim(st.aimX, st.aimY);
    const power = st.power;
    const gkDive = getGoalkeeperDiveDirection(zone, power);
    const result = calculateShotResult(zone, power, gkDive);

    const targetPos = ZONE_POSITIONS[zone];
    const targetX = GOAL_L + targetPos.x * GOAL_W;
    const targetY = GOAL_T + targetPos.y * GOAL_H;

    // Start animation
    setState((prev) => ({
      ...prev,
      phase: 'ball_flying',
      ballAnimating: true,
      ballX: targetX,
      ballY: targetY,
      goalkeeperDive: gkDive,
      power,
    }));

    await new Promise((r) => setTimeout(r, 700));

    const finalResult = result;

    setState((prev) => ({
      ...prev,
      phase: 'result',
      shotResult: finalResult,
      showResultText: true,
    }));

    await new Promise((r) => setTimeout(r, 1600));

    setState((prev) => ({ ...prev, showResultText: false }));

    // Now CPU shoots
    runCpuShot(st, finalResult);
  }, [stopPowerMeter, runCpuShot]);

  // Start power meter when shooting phase begins as player
  useEffect(() => {
    if (state.phase === 'shooting' && state.isPlayerTurn) {
      startPowerMeter();
    } else {
      stopPowerMeter();
    }
    return () => stopPowerMeter();
  }, [state.phase, state.isPlayerTurn, startPowerMeter, stopPowerMeter]);

  const startGame = useCallback(() => {
    setState(initialState());
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        phase: 'shooting',
        isPlayerTurn: true,
      }));
    }, 50);
  }, []);

  const nextRound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'shooting',
      isPlayerTurn: true,
      aimX: 0.5,
      aimY: 0.5,
      power: 0,
      powerDirection: 1,
      goalkeeperDive: null,
      shotResult: null,
      ballX: BALL_SX,
      ballY: BALL_SY,
      ballAnimating: false,
      showResultText: false,
    }));
  }, []);

  const goToMenu = useCallback(() => {
    stopPowerMeter();
    setState(initialState());
  }, [stopPowerMeter]);

  const setAim = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, aimX: x, aimY: y }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => stopPowerMeter();
  }, [stopPowerMeter]);

  return {
    state,
    shoot,
    startGame,
    nextRound,
    goToMenu,
    setAim,
  };
}
