/**
 * PreviewPanel - Shows upcoming tetromino pieces
 *
 * Displays the next 3 pieces in the queue so players can plan ahead.
 * Responsive sizing adapts to panel width.
 * Theme-aware using CSS custom properties.
 */

import React, { memo } from 'react';
import { TetrominoType } from '../types';
import { SHAPES, TETROMINO_COLORS } from '../constants';

interface PreviewPanelProps {
  nextPieces: TetrominoType[];
}

/** Render a single piece preview in a small grid */
const PiecePreview: React.FC<{ type: TetrominoType; cellSize?: number }> = memo(({ type, cellSize = 14 }) => {
  const shape = SHAPES[type];
  const colors = TETROMINO_COLORS[type];
  const blocks = shape.rotations[0]; // Always show spawn rotation
  const color = colors.bg;

  // Calculate bounding box of the piece
  const rows = blocks.map(b => b.row);
  const cols = blocks.map(b => b.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const gridHeight = maxRow - minRow + 1;
  const gridWidth = maxCol - minCol + 1;

  // Normalize blocks to 0,0
  const normalizedBlocks = blocks.map(b => ({
    row: b.row - minRow,
    col: b.col - minCol,
  }));

  const blockSet = new Set(normalizedBlocks.map(b => `${b.row},${b.col}`));

  return (
    <div className="flex flex-col items-center">
      <div
        className="grid gap-px mb-1 sm:mb-2"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: gridHeight }, (_, r) =>
          Array.from({ length: gridWidth }, (_, c) => {
            const hasBlock = blockSet.has(`${r},${c}`);
            return (
              <div
                key={`${r}-${c}`}
                className="rounded-sm"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: hasBlock ? undefined : 'transparent',
                }}
              >
                {hasBlock && (
                  <div
                    className={`w-full h-full ${color} rounded-sm`}
                    style={{
                      boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)`,
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

PiecePreview.displayName = 'PiecePreview';

const PreviewPanel: React.FC<PreviewPanelProps> = memo(({ nextPieces }) => {
  return (
    <div
      className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-panel)',
      }}
      role="region"
      aria-label="Next pieces preview"
    >
      <div
        className="font-mono uppercase tracking-wider mb-0.5 sm:mb-1"
        style={{
          color: 'var(--text-dim)',
          fontSize: 'clamp(7px, 1.5vw, 10px)',
        }}
      >
        NEXT
      </div>
      {nextPieces.map((type, i) => (
        <PiecePreview key={`${type}-${i}`} type={type} cellSize={i === 0 ? 16 : 12} />
      ))}
      {nextPieces.length === 0 && (
        <div className="text-xs italic" style={{ color: 'var(--text-faint)' }}>No upcoming pieces</div>
      )}
    </div>
  );
});

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;
