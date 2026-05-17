/**
 * Core type definitions for the Tetris game.
 * All shapes, game states, and configuration types are defined here.
 */

/** The 7 classic Tetris tetromino shapes */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Game states */
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

/** A single cell on the board: null = empty, string = color class */
export type Cell = string | null;

/** The game board is a 2D grid of cells (rows x cols) */
export type Board = Cell[][];

/** Position on the grid */
export interface Position {
  row: number;
  col: number;
}

/** A shape's rotation states (0-3) */
export type RotationState = 0 | 1 | 2 | 3;

/** Shape definition with positions relative to a pivot */
export interface ShapeDefinition {
  /** The 4 rotation states, each containing 4 block positions */
  rotations: Position[][];
  /** Color associated with this tetromino (Tailwind class) */
  color: string;
  /** CSS color value for glow effects */
  glowColor: string;
}

/** Active tetromino piece on the board */
export interface Piece {
  type: TetrominoType;
  shape: ShapeDefinition;
  rotation: RotationState;
  position: Position; // top-left anchor of the bounding box
}

/** Line clear animation state */
export interface LineClearAnimation {
  rows: number[];
  progress: number; // 0 to 1
  startTime: number;
}

/** Score and level tracking */
export interface GameStats {
  score: number;
  level: number;
  lines: number;
  combo: number;
  highScore: number;
}

/** Input action types for the game engine */
export type GameAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SOFT_DROP'
  | 'HARD_DROP'
  | 'ROTATE'
  | 'HOLD'
  | 'PAUSE'
  | 'RESTART';

/** Sound effect types */
export type SoundEffect = 'move' | 'rotate' | 'drop' | 'lineClear' | 'tetris' | 'gameOver' | 'levelUp' | 'hold';

/** Game configuration */
export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  /** Initial drop interval in ms (level 1) */
  baseDropInterval: number;
  /** How much faster each level gets (multiplier) */
  speedMultiplier: number;
  /** Lines required to advance to next level */
  linesPerLevel: number;
  /** Points awarded for clearing 1-4 lines */
  lineClearPoints: Record<number, number>;
  /** Soft drop points per row */
  softDropPoints: number;
  /** Hard drop points per row */
  hardDropPoints: number;
  /** Combo bonus multiplier */
  comboMultiplier: number;
  /** Number of next pieces to show in preview */
  previewCount: number;
}
