/**
 * Game constants: tetromino definitions, colors, scoring, and configuration.
 * All 7 classic tetrominoes with their rotation states (SRS wall kick compatible).
 */

import { TetrominoType, ShapeDefinition, GameConfig } from './types';

// ─── TETROMINO SHAPE DEFINITIONS ────────────────────────────────────────────
// Each shape has 4 rotation states with 4 blocks each (relative positions).
// Using standard Super Rotation System (SRS) orientations.

const SHAPES: Record<TetrominoType, ShapeDefinition> = {
  I: {
    rotations: [
      // 0° (spawn)
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }],
      // 90° (clockwise)
      [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 }],
      // 180°
      [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }],
      // 270°
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 3, col: 1 }],
    ],
    color: 'bg-cyan-400',
    glowColor: '#00f5ff',
  },
  O: {
    rotations: [
      // O doesn't rotate - all states are the same
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    ],
    color: 'bg-yellow-400',
    glowColor: '#ffe600',
  },
  T: {
    rotations: [
      [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
      [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    ],
    color: 'bg-purple-500',
    glowColor: '#8a2be2',
  },
  S: {
    rotations: [
      [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
      [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
      [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    ],
    color: 'bg-green-400',
    glowColor: '#00ff41',
  },
  Z: {
    rotations: [
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
      [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
      [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
    ],
    color: 'bg-red-400',
    glowColor: '#ff0040',
  },
  J: {
    rotations: [
      [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
      [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
    ],
    color: 'bg-blue-400',
    glowColor: '#0080ff',
  },
  L: {
    rotations: [
      [{ row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
      [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
      [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 0 }],
      [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    ],
    color: 'bg-orange-400',
    glowColor: '#ff8c00',
  },
};

// ─── SRS WALL KICK DATA ─────────────────────────────────────────────────────
// Standard Super Rotation System wall kick offsets.
// Key format: "fromRotation>toRotation"
// These are the kick tests attempted when a rotation fails.
// The I-piece has different kick data from the other pieces.

type WallKicks = Record<string, [number, number][]>;

/** Wall kick offsets for J, L, S, T, Z pieces */
const WALL_KICKS_STANDARD: WallKicks = {
  '0>1': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  '1>0': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  '1>2': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  '2>1': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  '2>3': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  '3>2': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  '3>0': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  '0>3': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
};

/** Wall kick offsets for the I piece (different from standard) */
const WALL_KICKS_I: WallKicks = {
  '0>1': [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],
  '1>0': [[0,0], [2,0], [-1,0], [2,-1], [-1,2]],
  '1>2': [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],
  '2>1': [[0,0], [1,0], [-2,0], [1,2], [-2,-1]],
  '2>3': [[0,0], [2,0], [-1,0], [2,-1], [-1,2]],
  '3>2': [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],
  '3>0': [[0,0], [1,0], [-2,0], [1,2], [-2,-1]],
  '0>3': [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],
};

/** Get wall kick offsets for a given piece type and rotation transition */
export function getWallKicks(
  pieceType: TetrominoType,
  fromRotation: number,
  toRotation: number
): [number, number][] {
  const key = `${fromRotation}>${toRotation}`;
  if (pieceType === 'I') {
    return WALL_KICKS_I[key] || [[0, 0]];
  }
  if (pieceType === 'O') {
    return [[0, 0]]; // O piece never needs kicks
  }
  return WALL_KICKS_STANDARD[key] || [[0, 0]];
}

// ─── COLOR MAP ──────────────────────────────────────────────────────────────
// Maps tetromino types to their visual colors

export const TETROMINO_COLORS: Record<TetrominoType, { bg: string; border: string; glow: string; light: string }> = {
  I: { bg: 'bg-cyan-400', border: 'border-cyan-300', glow: '#00f5ff', light: 'rgba(0, 245, 255, 0.3)' },
  O: { bg: 'bg-yellow-400', border: 'border-yellow-300', glow: '#ffe600', light: 'rgba(255, 230, 0, 0.3)' },
  T: { bg: 'bg-purple-500', border: 'border-purple-300', glow: '#8a2be2', light: 'rgba(138, 43, 226, 0.3)' },
  S: { bg: 'bg-green-400', border: 'border-green-300', glow: '#00ff41', light: 'rgba(0, 255, 65, 0.3)' },
  Z: { bg: 'bg-red-400', border: 'border-red-300', glow: '#ff0040', light: 'rgba(255, 0, 64, 0.3)' },
  J: { bg: 'bg-blue-400', border: 'border-blue-300', glow: '#0080ff', light: 'rgba(0, 128, 255, 0.3)' },
  L: { bg: 'bg-orange-400', border: 'border-orange-300', glow: '#ff8c00', light: 'rgba(255, 140, 0, 0.3)' },
};

// ─── GAME CONFIGURATION ─────────────────────────────────────────────────────

export const GAME_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  baseDropInterval: 800, // ms at level 1
  speedMultiplier: 0.8, // multiply interval by this each level
  linesPerLevel: 10,
  lineClearPoints: {
    1: 100,   // Single
    2: 300,   // Double
    3: 500,   // Triple
    4: 800,   // Tetris!
  },
  softDropPoints: 1,
  hardDropPoints: 2,
  comboMultiplier: 50, // additional points per combo
  previewCount: 3,
};

// ─── UTILITY ────────────────────────────────────────────────────────────────

/** All tetromino types in a flat array for random generation */
export const ALL_TETROMINOS: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** Get shape definition for a tetromino type */
export function getShape(type: TetrominoType): ShapeDefinition {
  return SHAPES[type];
}

/** Generate a shuffled bag of 7 tetrominoes (bag randomizer) */
export function generateBag(): TetrominoType[] {
  const bag = [...ALL_TETROMINOS];
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export { SHAPES };
