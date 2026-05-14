export type GamePhase =
  | 'menu'
  | 'shooting'
  | 'ball_flying'
  | 'result'
  | 'round_end'
  | 'game_over';

export type ShotResult = 'goal' | 'saved' | 'miss' | null;

export type GoalZone =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-center'
  | 'mid-right'
  | 'bot-left'
  | 'bot-center'
  | 'bot-right';

export interface Shot {
  zone: GoalZone;
  power: number;
  result: ShotResult;
}

export interface RoundScore {
  player: ShotResult;
  cpu: ShotResult;
}

export interface GameState {
  phase: GamePhase;
  playerScore: number;
  cpuScore: number;
  currentRound: number;
  maxRounds: number;
  isSuddenDeath: boolean;
  roundHistory: RoundScore[];
  currentShot: Shot | null;
  isPlayerTurn: boolean;
  aimX: number;
  aimY: number;
  power: number;
  powerDirection: 1 | -1;
  goalkeeperX: number; // -1 to 1
  goalkeeperDive: 'left' | 'right' | 'center' | null;
  shotResult: ShotResult;
  ballX: number;
  ballY: number;
  ballAnimating: boolean;
  showResultText: boolean;
}
