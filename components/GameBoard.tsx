/**
 * GameBoard - The main 10x20 Tetris playing field
 *
 * Renders the grid with placed blocks, current active piece,
 * ghost piece projection, and line clear animations.
 * Fully responsive using CSS custom properties.
 * Theme-aware using CSS custom properties.
 */

import React, { memo, useMemo } from 'react';
import { Board as BoardType, Piece } from '../types';
import { getPieceBlocks } from '../engine/GameEngine';
import { TETROMINO_COLORS } from '../constants';
import Cell from './Cell';

interface GameBoardProps {
  board: BoardType;                // Placed blocks
  currentPiece: Piece | null;      // Current falling piece
  ghostPiece: Piece | null;        // Ghost projection
  lineClearRows: number[];         // Rows being cleared
  lineClearProgress: number;       // Clear animation progress (0-1)
  status: string;                  // Game status for overlay
  onRestart: () => void;           // Restart callback
}

/**
 * GameBoard component - renders the full playing field.
 * Uses memo and careful keying to minimize re-renders.
 * Cell size is driven by CSS custom property --cell-size for responsiveness.
 */
const GameBoard: React.FC<GameBoardProps> = memo(({
  board,
  currentPiece,
  ghostPiece,
  lineClearRows,
  lineClearProgress,
  status,
  onRestart,
}) => {
  const height = board.length;
  const width = board[0]?.length || 10;

  // Compute positions of active piece blocks
  const pieceBlocks = useMemo(
    () => currentPiece ? getPieceBlocks(currentPiece) : [],
    [currentPiece]
  );

  // Compute ghost piece blocks
  const ghostBlocks = useMemo(
    () => ghostPiece ? getPieceBlocks(ghostPiece) : [],
    [ghostPiece]
  );

  // Quick lookup sets for performance
  const pieceBlockSet = useMemo(() => {
    const set = new Set<string>();
    pieceBlocks.forEach(b => set.add(`${b.row},${b.col}`));
    return set;
  }, [pieceBlocks]);

  const ghostBlockSet = useMemo(() => {
    const set = new Set<string>();
    ghostBlocks.forEach(b => set.add(`${b.row},${b.col}`));
    return set;
  }, [ghostBlocks]);

  const clearRowSet = useMemo(() => {
    return new Set(lineClearRows);
  }, [lineClearRows]);

  // Get current piece info for ghost coloring
  const currentGlowColor = currentPiece
    ? TETROMINO_COLORS[currentPiece.type]?.glow
    : undefined;

  return (
    <div className="relative" role="grid" aria-label="Tetris game board" aria-live="polite">
      {/* Board container with arcade-style border */}
      <div
        className="relative border-2 rounded-lg overflow-hidden"
        style={{
          borderColor: 'var(--board-border)',
          boxShadow: 'var(--board-shadow)',
          width: `calc(var(--cell-size) * ${width} + 4px)`,
          height: `calc(var(--cell-size) * ${height} + 4px)`,
        }}
      >
        {/* Grid cells */}
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
            gridTemplateRows: `repeat(${height}, var(--cell-size))`,
          }}
        >
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isActiveBlock = pieceBlockSet.has(`${rowIdx},${colIdx}`);
              const isGhostBlock = !isActiveBlock && ghostBlockSet.has(`${rowIdx},${colIdx}`);
              const isClearingRow = clearRowSet.has(rowIdx);

              // Determine display properties
              let displayColor = cell;
              let isGhost = false;
              let glow = undefined;

              if (isActiveBlock && currentPiece) {
                // Current piece overrides the board cell
                const colors = TETROMINO_COLORS[currentPiece.type];
                displayColor = colors.bg;
                glow = colors.glow;
              } else if (isGhostBlock) {
                isGhost = true;
                displayColor = currentGlowColor || 'bg-white';
                glow = currentGlowColor;
              }

              return (
                <Cell
                  key={key}
                  color={displayColor}
                  isGhost={isGhost}
                  isClearing={isClearingRow}
                  clearingProgress={lineClearProgress}
                  glowColor={isActiveBlock ? glow : isGhostBlock ? glow : undefined}
                />
              );
            })
          )}
        </div>

        {/* Scanline overlay for retro CRT effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline-color) 2px, var(--scanline-color) 4px)',
            zIndex: 10,
          }}
          aria-hidden="true"
        />

        {/* Game status overlays */}
        {status === 'paused' && (
          <Overlay>
            <div className="text-center animate-fade-in">
              <div className="font-arcade text-neon-cyan mb-4" style={{ fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
                PAUSED
              </div>
              <div className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 'clamp(10px, 1.8vw, 14px)' }}>
                Press 'P' to resume
              </div>
            </div>
          </Overlay>
        )}

        {status === 'idle' && (
          <Overlay>
            <div className="text-center animate-fade-in">
              <div className="font-arcade text-neon-cyan mb-4" style={{ fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
                TETRIS
              </div>
              <div className="font-mono mb-6" style={{ color: 'var(--text-dim)', fontSize: 'clamp(10px, 1.8vw, 14px)' }}>
                Press any key to start
              </div>
            </div>
          </Overlay>
        )}

        {status === 'gameover' && (
          <Overlay>
            <div className="text-center animate-fade-in">
              <div className="font-arcade text-neon-red mb-4" style={{ fontSize: 'clamp(10px, 2.5vw, 14px)' }}>
                GAME OVER
              </div>
              <button
                onClick={onRestart}
                className="px-4 sm:px-6 py-1.5 sm:py-2 mt-4 font-mono rounded
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                style={{
                  backgroundColor: 'rgba(0, 245, 255, 0.15)',
                  border: '1px solid rgba(0, 245, 255, 0.4)',
                  color: '#00f5ff',
                  fontSize: 'clamp(10px, 1.8vw, 14px)',
                }}
                aria-label="Restart game"
              >
                PLAY AGAIN
              </button>
            </div>
          </Overlay>
        )}
      </div>
    </div>
  );
});

/** Overlay component for game status screens */
const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="absolute inset-0 flex items-center justify-center z-20"
    style={{
      backgroundColor: 'var(--overlay-bg)',
      backdropFilter: 'blur(4px)',
    }}
    role="alert"
  >
    {children}
  </div>
);

GameBoard.displayName = 'GameBoard';

export default GameBoard;
