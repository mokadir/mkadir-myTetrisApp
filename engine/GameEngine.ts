/**
 * GameEngine - Core Tetris game logic
 *
 * This module handles all game state management including:
 * - Board state and piece movement
 * - Collision detection (AABB) with wall kicks (SRS)
 * - Scoring, levels, combos
 * - Bag randomizer for fair piece distribution
 * - Ghost piece projection
 * - Line clearing with animation support
 * - Hold piece mechanics
 *
 * The engine is designed to be pure and testable, with no DOM dependencies.
 * It processes actions and returns new state rather than mutating.
 */

import {
  Board, Cell, Piece, Position, RotationState,
  GameStatus, GameStats, GameAction, GameConfig,
  TetrominoType, LineClearAnimation
} from '../types';
import {
  GAME_CONFIG, getShape, generateBag, getWallKicks,
  TETROMINO_COLORS, ALL_TETROMINOS
} from '../constants';

// ─── STATE INTERFACE ────────────────────────────────────────────────────────

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPieces: TetrominoType[];
  holdPiece: TetrominoType | null;
  canHold: boolean; // can only hold once per piece placement
  status: GameStatus;
  stats: GameStats;
  bag: TetrominoType[];
  lineClearAnimation: LineClearAnimation | null;
  ghostPosition: Position | null;
  lastDropTime: number;
  lastActionTime: number;
}

// ─── INITIALIZATION ─────────────────────────────────────────────────────────

/** Create an empty game board */
export function createEmptyBoard(width: number, height: number): Board {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );
}

/** Load high score from localStorage */
function loadHighScore(): number {
  try {
    const stored = localStorage.getItem('tetris-high-score');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/** Save high score to localStorage */
function saveHighScore(score: number): void {
  try {
    localStorage.setItem('tetris-high-score', score.toString());
  } catch {
    // localStorage may be unavailable
  }
}

/** Create initial game state */
export function createInitialState(): GameState {
  const bag = generateBag();
  const nextPieces: TetrominoType[] = [];
  const remainingBag = [...bag];

  // Fill next pieces queue from bag
  for (let i = 0; i < GAME_CONFIG.previewCount + 1; i++) {
    if (remainingBag.length === 0) {
      remainingBag.push(...generateBag());
    }
    nextPieces.push(remainingBag.shift()!);
  }

  return {
    board: createEmptyBoard(GAME_CONFIG.boardWidth, GAME_CONFIG.boardHeight),
    currentPiece: null,
    nextPieces,
    holdPiece: null,
    canHold: true,
    status: 'idle',
    stats: {
      score: 0,
      level: 1,
      lines: 0,
      combo: -1,
      highScore: loadHighScore(),
    },
    bag: remainingBag,
    lineClearAnimation: null,
    ghostPosition: null,
    lastDropTime: 0,
    lastActionTime: 0,
  };
}

// ─── PIECE CREATION ─────────────────────────────────────────────────────────

/** Create a new piece at the spawn position */
export function createPiece(type: TetrominoType): Piece {
  const shape = getShape(type);
  // Spawn position: centered horizontally, at the top
  const spawnCol = Math.floor((GAME_CONFIG.boardWidth - 4) / 2);
  return {
    type,
    shape,
    rotation: 0,
    position: { row: 0, col: spawnCol },
  };
}

/** Get the absolute board positions of a piece's blocks */
export function getPieceBlocks(piece: Piece): Position[] {
  const blocks = piece.shape.rotations[piece.rotation];
  return blocks.map(b => ({
    row: b.row + piece.position.row,
    col: b.col + piece.position.col,
  }));
}

// ─── COLLISION DETECTION ────────────────────────────────────────────────────

/** Check if a set of block positions collides with walls or existing blocks */
export function checkCollision(
  blocks: Position[],
  board: Board,
  width: number,
  height: number
): boolean {
  for (const block of blocks) {
    // Out of bounds
    if (block.col < 0 || block.col >= width || block.row >= height) {
      return true;
    }
    // Above the board is okay (pieces spawn at top)
    if (block.row < 0) continue;
    // Collision with placed blocks
    if (board[block.row][block.col] !== null) {
      return true;
    }
  }
  return false;
}

/** Check if entire piece collides */
function pieceCollides(piece: Piece, board: Board): boolean {
  const blocks = getPieceBlocks(piece);
  return checkCollision(
    blocks,
    board,
    GAME_CONFIG.boardWidth,
    GAME_CONFIG.boardHeight
  );
}

// ─── MOVEMENT & ROTATION ───────────────────────────────────────────────────

/** Try to move a piece, returns new piece if successful, null if blocked */
export function movePiece(
  piece: Piece,
  dRow: number,
  dCol: number,
  board: Board
): Piece | null {
  const newPiece: Piece = {
    ...piece,
    position: {
      row: piece.position.row + dRow,
      col: piece.position.col + dCol,
    },
  };

  if (!pieceCollides(newPiece, board)) {
    return newPiece;
  }
  return null;
}

/**
 * Try to rotate a piece with SRS wall kicks.
 * Tests all 5 kick positions and returns the first valid one.
 */
export function rotatePiece(
  piece: Piece,
  board: Board,
  direction: 1 | -1 = 1 // 1 = CW, -1 = CCW (we only implement CW for simplicity)
): Piece | null {
  const fromRotation = piece.rotation;
  const toRotation = ((fromRotation + direction + 4) % 4) as RotationState;

  // Get wall kick offsets for this transition
  const kicks = getWallKicks(piece.type, fromRotation, toRotation);

  for (const [kickCol, kickRow] of kicks) {
    const newPiece: Piece = {
      ...piece,
      rotation: toRotation,
      position: {
        row: piece.position.row - kickRow, // SRS offsets: +row = up, we use +row = down
        col: piece.position.col + kickCol,
      },
    };

    if (!pieceCollides(newPiece, board)) {
      return newPiece;
    }
  }

  return null; // rotation failed
}

// ─── GHOST PIECE ────────────────────────────────────────────────────────────

/** Calculate ghost piece position (hard drop preview) */
export function getGhostPosition(piece: Piece, board: Board): Position {
  let ghostRow = piece.position.row;
  while (true) {
    const testPiece: Piece = {
      ...piece,
      position: { row: ghostRow + 1, col: piece.position.col },
    };
    if (pieceCollides(testPiece, board)) {
      break;
    }
    ghostRow++;
  }
  return { row: ghostRow, col: piece.position.col };
}

// ─── HARD DROP ──────────────────────────────────────────────────────────────

/** Hard drop: drop piece instantly to the lowest valid position */
export function hardDrop(
  piece: Piece,
  board: Board
): { piece: Piece; distance: number } {
  let distance = 0;
  let currentPiece = { ...piece };

  while (true) {
    const next = movePiece(currentPiece, 1, 0, board);
    if (!next) break;
    currentPiece = next;
    distance++;
  }

  return { piece: currentPiece, distance };
}

// ─── LOCKING & LINE CLEARING ───────────────────────────────────────────────

/** Lock a piece onto the board, returning the new board and cleared rows */
export function lockPiece(
  piece: Piece,
  board: Board
): { newBoard: Board; clearedRows: number[] } {
  const newBoard = board.map(row => [...row]);
  const blocks = getPieceBlocks(piece);
  const color = TETROMINO_COLORS[piece.type].bg;

  const clearedRows: number[] = [];
  const rowCounts = new Map<number, number>();

  // Place blocks
  for (const block of blocks) {
    if (block.row >= 0 && block.row < GAME_CONFIG.boardHeight) {
      newBoard[block.row][block.col] = color;
      rowCounts.set(block.row, (rowCounts.get(block.row) || 0) + 1);
    }
  }

  // Find completed rows
  for (const [row, count] of rowCounts) {
    if (count === GAME_CONFIG.boardWidth) {
      clearedRows.push(row);
    }
  }

  // Sort rows descending so we remove from bottom up
  clearedRows.sort((a, b) => b - a);

  return { newBoard, clearedRows };
}

/** Clear completed rows from the board, returning the new board */
export function clearRows(board: Board, rows: number[]): Board {
  const newBoard = board.map(row => [...row]);
  // Remove cleared rows and add empty rows at top
  for (const row of rows) {
    newBoard.splice(row, 1);
    newBoard.unshift(Array(GAME_CONFIG.boardWidth).fill(null));
  }
  return newBoard;
}

// ─── SCORING ────────────────────────────────────────────────────────────────

/** Calculate points for clearing lines */
export function calculateScore(
  linesCleared: number,
  level: number,
  combo: number,
  softDropDistance: number,
  hardDropDistance: number
): { score: number; linePoints: number; comboBonus: number } {
  let score = 0;

  // Line clear points
  const linePoints = linesCleared > 0
    ? (GAME_CONFIG.lineClearPoints[linesCleared] || 0) * level
    : 0;
  score += linePoints;

  // Combo bonus
  const comboBonus = combo > 0
    ? GAME_CONFIG.comboMultiplier * combo * level
    : 0;
  score += comboBonus;

  // Drop points
  score += softDropDistance * GAME_CONFIG.softDropPoints;
  score += hardDropDistance * GAME_CONFIG.hardDropPoints;

  return { score, linePoints, comboBonus };
}

/** Get drop interval for a given level */
export function getDropInterval(level: number): number {
  // Each level gets faster, with a minimum cap
  const interval = GAME_CONFIG.baseDropInterval *
    Math.pow(GAME_CONFIG.speedMultiplier, level - 1);
  return Math.max(interval, 50); // Never faster than 50ms
}

// ─── BAG RANDOMIZER ─────────────────────────────────────────────────────────

/** Get the next piece from the bag, refilling as needed */
export function getNextPiece(state: GameState): { piece: Piece; newState: Partial<GameState> } {
  const bag = [...state.bag];
  const nextPieces = [...state.nextPieces];

  // Get the next piece type
  const nextType = nextPieces.shift()!;

  // If bag is running low, refill
  if (bag.length <= 7) {
    bag.push(...generateBag());
  }

  // Take the next piece from bag to fill the queue
  const fillType = bag.shift()!;
  nextPieces.push(fillType);

  return {
    piece: createPiece(nextType),
    newState: {
      bag,
      nextPieces,
    },
  };
}

// ─── MAIN GAME LOOP PROCESSING ─────────────────────────────────────────────

/** Process a game action and return the new state */
export function processAction(
  state: GameState,
  action: GameAction,
  timestamp: number
): { state: GameState; sound?: string; linesCleared?: number } {
  // Don't process most actions if game is over or idle
  if (state.status === 'gameover' && action !== 'RESTART') {
    return { state };
  }
  if (state.status === 'idle' && action !== 'RESTART' && action !== 'PAUSE') {
    // Start game on any action when idle
    if (['MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP', 'HARD_DROP', 'ROTATE'].includes(action)) {
      action = 'RESTART';
    }
  }

  switch (action) {
    case 'RESTART': {
      const newState = createInitialState();
      const { piece, newState: ns } = getNextPiece(newState);
      const ghostPos = getGhostPosition(piece, newState.board);
      return {
        state: {
          ...newState,
          ...ns,
          currentPiece: piece,
          ghostPosition: ghostPos,
          status: 'playing',
          lastDropTime: timestamp,
          lastActionTime: timestamp,
        },
      };
    }

    case 'PAUSE': {
      if (state.status === 'playing') {
        return { state: { ...state, status: 'paused' } };
      }
      if (state.status === 'paused') {
        return { state: { ...state, status: 'playing', lastDropTime: timestamp } };
      }
      return { state };
    }

    case 'MOVE_LEFT':
    case 'MOVE_RIGHT': {
      if (state.status !== 'playing' || !state.currentPiece) return { state };
      const dCol = action === 'MOVE_LEFT' ? -1 : 1;
      const moved = movePiece(state.currentPiece, 0, dCol, state.board);
      if (!moved) return { state };

      const ghostPos = getGhostPosition(moved, state.board);
      return {
        state: {
          ...state,
          currentPiece: moved,
          ghostPosition: ghostPos,
          lastActionTime: timestamp,
        },
        sound: 'move',
      };
    }

    case 'SOFT_DROP': {
      if (state.status !== 'playing' || !state.currentPiece) return { state };
      const moved = movePiece(state.currentPiece, 1, 0, state.board);
      if (!moved) return { state };

      const ghostPos = getGhostPosition(moved, state.board);
      return {
        state: {
          ...state,
          currentPiece: moved,
          ghostPosition: ghostPos,
          lastDropTime: timestamp, // reset drop timer
          lastActionTime: timestamp,
          stats: {
            ...state.stats,
            score: state.stats.score + GAME_CONFIG.softDropPoints,
          },
        },
        sound: 'move',
      };
    }

    case 'HARD_DROP': {
      if (state.status !== 'playing' || !state.currentPiece) return { state };
      const { piece: dropped, distance } = hardDrop(state.currentPiece, state.board);
      const { newBoard, clearedRows } = lockPiece(dropped, state.board);

      let linesCleared = clearedRows.length;
      let sound: string = linesCleared > 0
        ? (linesCleared === 4 ? 'tetris' : 'lineClear')
        : 'drop';

      if (linesCleared > 0) {
        sound = linesCleared >= 4 ? 'tetris' : 'lineClear';
      }

      // Score calculation
      const combo = linesCleared > 0 ? state.stats.combo + 1 : -1;
      const scoreResult = calculateScore(
        linesCleared,
        state.stats.level,
        linesCleared > 0 ? combo : -1,
        0,
        distance
      );

      const totalLines = state.stats.lines + linesCleared;
      const newLevel = Math.floor(totalLines / GAME_CONFIG.linesPerLevel) + 1;
      const isLevelUp = newLevel > state.stats.level;

      const newScore = state.stats.score + scoreResult.score;
      const newHighScore = Math.max(newScore, state.stats.highScore);

      // Save high score
      saveHighScore(newHighScore);

      const newBoard2 = linesCleared > 0
        ? clearRows(newBoard, clearedRows)
        : newBoard;

      // Get next piece
      const { piece: nextPiece, newState: ns } = getNextPiece(state);
      const ghostPos = getGhostPosition(nextPiece, newBoard2);

      let newStatus: GameStatus = 'playing';

      // Check if game over (new piece collides immediately)
      if (pieceCollides(nextPiece, newBoard2)) {
        newStatus = 'gameover';
        sound = 'gameOver';
      }

      const lineAnim: LineClearAnimation | null = linesCleared > 0
        ? { rows: clearedRows, progress: 0, startTime: timestamp }
        : null;

      return {
        state: {
          ...state,
          board: newBoard2,
          currentPiece: newStatus === 'playing' ? nextPiece : null,
          ghostPosition: newStatus === 'playing' ? ghostPos : null,
          holdPiece: state.holdPiece,
          canHold: true, // reset hold after placing
          status: newStatus,
          stats: {
            score: newScore,
            level: newLevel,
            lines: totalLines,
            combo,
            highScore: newHighScore,
          },
          nextPieces: ns.nextPieces,
          bag: ns.bag,
          lineClearAnimation: lineAnim,
          lastDropTime: timestamp,
          lastActionTime: timestamp,
        },
        sound: isLevelUp && newStatus !== 'gameover' ? 'levelUp' : sound,
        linesCleared,
      };
    }

    case 'ROTATE': {
      if (state.status !== 'playing' || !state.currentPiece) return { state };
      const rotated = rotatePiece(state.currentPiece, state.board, 1);
      if (!rotated) return { state };

      const ghostPos = getGhostPosition(rotated, state.board);
      return {
        state: {
          ...state,
          currentPiece: rotated,
          ghostPosition: ghostPos,
          lastActionTime: timestamp,
        },
        sound: 'rotate',
      };
    }

    case 'HOLD': {
      if (state.status !== 'playing' || !state.currentPiece || !state.canHold) return { state };

      let newHoldPiece = state.currentPiece.type;
      let newCurrentPiece: Piece | null;
      let newCanHold = false;

      if (state.holdPiece !== null) {
        // Swap with hold
        newCurrentPiece = createPiece(state.holdPiece);
      } else {
        // First hold: get next piece and refill queue
        const { piece, newState } = getNextPiece(state);
        newCurrentPiece = piece;
        // Update next pieces from bag
        state.nextPieces = newState.nextPieces!;
        state.bag = newState.bag!;
      }

      // Check if new piece collides
      if (pieceCollides(newCurrentPiece, state.board)) {
        // Game over
        return {
          state: {
            ...state,
            status: 'gameover',
            sound: 'gameOver',
          },
        };
      }

      const ghostPos = getGhostPosition(newCurrentPiece, state.board);

      return {
        state: {
          ...state,
          currentPiece: newCurrentPiece,
          holdPiece: newHoldPiece,
          canHold: newCanHold,
          ghostPosition: ghostPos,
          lastActionTime: timestamp,
        },
        sound: 'hold',
      };
    }

    default:
      return { state };
  }
}

// ─── GRAVITY TICK ───────────────────────────────────────────────────────────

/** Process gravity: move the current piece down one row */
export function processGravityTick(
  state: GameState,
  timestamp: number
): { state: GameState; sound?: string; linesCleared?: number } {
  if (state.status !== 'playing' || !state.currentPiece) return { state };

  const moved = movePiece(state.currentPiece, 1, 0, state.board);

  if (moved) {
    // Piece moved down successfully
    const ghostPos = getGhostPosition(moved, state.board);
    return {
      state: {
        ...state,
        currentPiece: moved,
        ghostPosition: ghostPos,
        lastDropTime: timestamp,
      },
    };
  } else {
    // Piece can't move down - lock it
    const { newBoard, clearedRows } = lockPiece(state.currentPiece, state.board);
    const linesCleared = clearedRows.length;

    let sound: string = 'drop';
    if (linesCleared > 0) {
      sound = linesCleared >= 4 ? 'tetris' : 'lineClear';
    }

    const combo = linesCleared > 0 ? state.stats.combo + 1 : -1;
    const scoreResult = calculateScore(
      linesCleared,
      state.stats.level,
      linesCleared > 0 ? combo : -1,
      0,
      0
    );

    const totalLines = state.stats.lines + linesCleared;
    const newLevel = Math.floor(totalLines / GAME_CONFIG.linesPerLevel) + 1;
    const isLevelUp = newLevel > state.stats.level;

    const newScore = state.stats.score + scoreResult.score;
    const newHighScore = Math.max(newScore, state.stats.highScore);
    saveHighScore(newHighScore);

    const newBoard2 = linesCleared > 0
      ? clearRows(newBoard, clearedRows)
      : newBoard;

    const { piece: nextPiece, newState: ns } = getNextPiece(state);
    const ghostPos = getGhostPosition(nextPiece, newBoard2);

    let newStatus: GameStatus = 'playing';

    if (pieceCollides(nextPiece, newBoard2)) {
      newStatus = 'gameover';
      sound = 'gameOver';
    }

    const lineAnim: LineClearAnimation | null = linesCleared > 0
      ? { rows: clearedRows, progress: 0, startTime: timestamp }
      : null;

    return {
      state: {
        ...state,
        board: newBoard2,
        currentPiece: newStatus === 'playing' ? nextPiece : null,
        ghostPosition: newStatus === 'playing' ? ghostPos : null,
        canHold: true,
        status: newStatus,
        stats: {
          score: newScore,
          level: newLevel,
          lines: totalLines,
          combo,
          highScore: newHighScore,
        },
        nextPieces: ns.nextPieces,
        bag: ns.bag,
        lineClearAnimation: lineAnim,
        lastDropTime: timestamp,
        lastActionTime: timestamp,
      },
      sound: isLevelUp && newStatus !== 'gameover' ? 'levelUp' : sound,
      linesCleared,
    };
  }
}

/** Check if it's time for a gravity tick */
export function shouldDrop(state: GameState, timestamp: number, currentInterval: number): boolean {
  return (timestamp - state.lastDropTime) >= currentInterval;
}

/** Update animation state for line clears */
export function updateAnimation(state: GameState, timestamp: number): GameState {
  if (!state.lineClearAnimation) return state;

  const elapsed = timestamp - state.lineClearAnimation.startTime;
  const duration = 400; // 400ms animation
  const progress = Math.min(elapsed / duration, 1);

  if (progress >= 1) {
    // Animation complete - remove the rows if not already done
    // (they should already be cleared, but just in case)
    const newBoard = clearRows(state.board, state.lineClearAnimation.rows);
    return {
      ...state,
      board: newBoard,
      lineClearAnimation: null,
    };
  }

  return {
    ...state,
    lineClearAnimation: {
      ...state.lineClearAnimation,
      progress,
    },
  };
}
