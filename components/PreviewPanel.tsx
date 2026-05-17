/**
 * PreviewPanel - Shows upcoming tetromino pieces
 *
 * Displays the next 3 pieces in the queue so players can plan ahead.
 */

import React, { memo } from 'react';
import { TetrominoType } from '../types';
import { SHAPES, TETROMINO_COLORS } from '../constants';

interface PreviewPanelProps {
  nextPieces: TetrominoType[];
}

/** Render a single piece preview in a small grid */
const PiecePreview: React.FC<{ type: TetrominoType; label: string }> = memo(({ type, label }) => {
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
        className="grid gap-px mb-2"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, 14px)`,
          gridTemplateRows: `repeat(${gridHeight}, 14px)`,
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
                  width: 14,
                  height: 14,
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
      className="flex flex-col gap-3 p-4 rounded-lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      role="region"
      aria-label="Next pieces preview"
    >
      <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">
        NEXT
      </div>
      {nextPieces.map((type, i) => (
        <PiecePreview key={`${type}-${i}`} type={type} label={`Piece ${i + 1}`} />
      ))}
      {nextPieces.length === 0 && (
        <div className="text-xs text-gray-600 italic">No upcoming pieces</div>
      )}
    </div>
  );
});

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;
