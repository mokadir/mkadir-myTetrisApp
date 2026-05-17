/**
 * HoldPanel - Displays the currently held piece
 *
 * Shows which piece is in the hold slot and whether
 * the player can use the hold feature again.
 */

import React, { memo } from 'react';
import { TetrominoType } from '../types';
import { SHAPES, TETROMINO_COLORS } from '../constants';

interface HoldPanelProps {
  holdPiece: TetrominoType | null;
  canHold: boolean;
}

const HoldPanel: React.FC<HoldPanelProps> = memo(({ holdPiece, canHold }) => {
  return (
    <div
      className="flex flex-col items-center p-4 rounded-lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        opacity: canHold ? 1 : 0.5,
        transition: 'opacity 0.2s ease',
      }}
      role="region"
      aria-label={holdPiece ? `Holding ${holdPiece} piece` : 'Hold piece slot'}
    >
      <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
        HOLD
      </div>

      {holdPiece ? (
        <PiecePreview type={holdPiece} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{
            width: 60,
            height: 40,
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          }}
        >
          <span className="text-xs text-gray-600">Empty</span>
        </div>
      )}

      <div className="mt-2 text-[10px] text-gray-500 font-mono">
        {canHold ? 'Shift / C' : 'Used'}
      </div>
    </div>
  );
});

/** Mini piece preview for the hold panel */
const PiecePreview: React.FC<{ type: TetrominoType }> = memo(({ type }) => {
  const shape = SHAPES[type];
  const colors = TETROMINO_COLORS[type];
  const blocks = shape.rotations[0];
  const color = colors.bg;

  const rows = blocks.map(b => b.row);
  const cols = blocks.map(b => b.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);
  const gridHeight = maxRow - minRow + 1;
  const gridWidth = maxCol - minCol + 1;

  const normalizedBlocks = blocks.map(b => ({
    row: b.row - minRow,
    col: b.col - minCol,
  }));

  const blockSet = new Set(normalizedBlocks.map(b => `${b.row},${b.col}`));

  return (
    <div
      className="grid gap-px"
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
              style={{ width: 14, height: 14 }}
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
  );
});

PiecePreview.displayName = 'HoldPiecePreview';
HoldPanel.displayName = 'HoldPanel';

export default HoldPanel;
