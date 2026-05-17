/**
 * useGameLoop - Custom React hook for managing the Tetris game loop
 *
 * Uses requestAnimationFrame for smooth, efficient animation timing.
 * Handles keyboard input, gravity ticks, sound effects, and state management.
 * Implements performance optimizations to prevent unnecessary re-renders.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  GameState, GameAction, Piece, TetrominoType,
  Position, Cell, Board
} from '../types';
import {
  createInitialState,
  processAction as processGameAction,
  processGravityTick,
  shouldDrop,
  getDropInterval,
  updateAnimation,
} from '../engine/GameEngine';
import { GAME_CONFIG, TETROMINO_COLORS } from '../constants';
import { soundManager } from '../audio/SoundManager';

/** Fields to derive/compute for component consumption */
export interface DerivedGameState {
  board: Board;
  currentPiece: Piece | null;
  ghostPiece: Piece | null;
  nextPieces: TetrominoType[];
  holdPiece: TetrominoType | null;
  status: string;
  score: number;
  level: number;
  lines: number;
  highScore: number;
  combo: number;
  lineClearRows: number[];
  lineClearProgress: number;
  canHold: boolean;
}

export interface GameControls {
  start: () => void;
  pause: () => void;
  restart: () => void;
  handleAction: (action: GameAction) => void;
  toggleMute: () => boolean;
  isMuted: boolean;
}

export function useGameLoop(): { gameState: DerivedGameState; controls: GameControls } {
  // Core game state ref (not state to avoid re-renders on every tick)
  const stateRef = useRef<GameState>(createInitialState());
  // Force re-render state
  const [renderTick, setRenderTick] = useState(0);
  // Audio init flag
  const audioInited = useRef(false);

  const [isMuted, setIsMuted] = useState(false);

  // Animation frame ID
  const animFrameId = useRef<number>(0);
  // Timestamp tracking for corrected delta time
  const lastTimestamp = useRef(0);

  // Derived state - computed from game state for rendering
  const derivedState = useMemo((): DerivedGameState => {
    const s = stateRef.current;
    const { currentPiece, ghostPosition, board, lineClearAnimation, stats } = s;

    // Build ghost piece for display
    let ghostPiece: Piece | null = null;
    if (currentPiece && ghostPosition) {
      ghostPiece = {
        ...currentPiece,
        position: ghostPosition,
      };
    }

    return {
      board: s.board,
      currentPiece,
      ghostPiece,
      nextPieces: s.nextPieces.slice(0, GAME_CONFIG.previewCount),
      holdPiece: s.holdPiece,
      status: s.status,
      score: stats.score,
      level: stats.level,
      lines: stats.lines,
      highScore: stats.highScore,
      combo: stats.combo,
      lineClearRows: lineClearAnimation?.rows || [],
      lineClearProgress: lineClearAnimation?.progress || 0,
      canHold: s.canHold,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick]);

  /** Trigger a re-render */
  const render = useCallback(() => {
    setRenderTick(t => t + 1);
  }, []);

  /** Process a game action and handle sounds */
  const processAction = useCallback((action: GameAction) => {
    // Initialize audio on first interaction
    if (!audioInited.current) {
      soundManager.init();
      audioInited.current = true;
    }

    const now = performance.now();
    const result = processGameAction(stateRef.current, action, now);
    stateRef.current = result.state;

    if (result.sound) {
      soundManager.play(result.sound as any);
    }

    if (action === 'RESTART') {
      soundManager.stopMusic();
      setTimeout(() => soundManager.startMusic(), 100);
    }

    render();
  }, [render]);

  /** Game loop - runs every frame via requestAnimationFrame */
  const gameLoop = useCallback((timestamp: number) => {
    const state = stateRef.current;

    if (state.status === 'playing') {
      const interval = getDropInterval(state.stats.level);

      // Update line clear animation
      if (state.lineClearAnimation) {
        stateRef.current = updateAnimation(state, timestamp);
      }

      // Gravity tick
      if (shouldDrop(state, timestamp, interval)) {
        const result = processGravityTick(stateRef.current, timestamp);
        stateRef.current = result.state;
        if (result.sound) {
          soundManager.play(result.sound as any);
        }
      }
    }

    // Always re-render to keep UI updated
    render();

    // Continue the loop
    animFrameId.current = requestAnimationFrame(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render]);

  // Start/stop game loop
  useEffect(() => {
    animFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [gameLoop]);

  // ─── KEYBOARD HANDLING ─────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys
      const gameKeys = [
        'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
        ' ', 'Shift', 'c', 'C', 'p', 'P'
      ];
      if (gameKeys.includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
          processAction('MOVE_LEFT');
          break;
        case 'ArrowRight':
          processAction('MOVE_RIGHT');
          break;
        case 'ArrowDown':
          processAction('SOFT_DROP');
          break;
        case 'ArrowUp':
          processAction('ROTATE');
          break;
        case ' ':
          processAction('HARD_DROP');
          break;
        case 'Shift':
        case 'c':
        case 'C':
          processAction('HOLD');
          break;
        case 'p':
        case 'P':
          processAction('PAUSE');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processAction]);

  // ─── CONTROLS API ──────────────────────────────────────────────────────

  const controls: GameControls = useMemo(() => ({
    start: () => processAction('RESTART'),
    pause: () => processAction('PAUSE'),
    restart: () => processAction('RESTART'),
    handleAction: processAction,
    toggleMute: () => {
      const muted = soundManager.toggleMute();
      setIsMuted(muted);
      if (!muted) {
        if (stateRef.current.status === 'playing') {
          soundManager.startMusic();
        }
      }
      return muted;
    },
    isMuted,
  }), [processAction, isMuted]);

  return { gameState: derivedState, controls };
}

export default useGameLoop;
