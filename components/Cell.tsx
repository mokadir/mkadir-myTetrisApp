/**
 * Cell - A single block/cell on the game board
 *
 * Renders colored blocks with gradient and glow effects.
 * Supports different visual states: active, ghost, cleared.
 * Cell dimensions driven by CSS custom property --cell-size for responsiveness.
 * Theme-aware using CSS custom properties.
 */

import React, { memo } from 'react';

interface CellProps {
  color?: string | null;        // Tailwind CSS class for the cell color
  isGhost?: boolean;            // Whether this is a ghost piece
  isClearing?: boolean;         // Whether this cell is being cleared
  clearingProgress?: number;    // 0-1 progress of clear animation
  glowColor?: string;           // CSS color for glow effect
}

/**
 * Memoized cell component to prevent unnecessary re-renders.
 * Only re-renders when its visual properties change.
 * Uses CSS variable --cell-size for responsive dimensions.
 */
const Cell: React.FC<CellProps> = memo(({
  color,
  isGhost = false,
  isClearing = false,
  clearingProgress = 0,
  glowColor,
}) => {
  // Empty cell
  if (!color) {
    return (
      <div
        className="w-full h-full"
        style={{
          width: 'var(--cell-size)',
          height: 'var(--cell-size)',
          backgroundColor: 'var(--cell-empty-bg)',
          border: '1px solid var(--cell-empty-border)',
          borderRadius: '2px',
        }}
        aria-hidden="true"
      />
    );
  }

  // Ghost cell (projected drop position)
  if (isGhost) {
    return (
      <div
        className="w-full h-full rounded-sm"
        style={{
          width: 'var(--cell-size)',
          height: 'var(--cell-size)',
          backgroundColor: 'var(--ghost-bg)',
          border: `1px solid ${glowColor || 'var(--ghost-border)'}`,
          borderRadius: '2px',
          boxShadow: `inset 0 0 4px ${glowColor || 'transparent'}`,
          animation: 'ghostPulse 1.5s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
    );
  }

  // Clearing cell (line clear animation)
  if (isClearing) {
    const scale = 1 - clearingProgress * 0.3;
    const opacity = 1 - clearingProgress;
    const brightness = 1 + clearingProgress;

    return (
      <div
        className="w-full h-full"
        style={{
          width: 'var(--cell-size)',
          height: 'var(--cell-size)',
          backgroundColor: '#ffffff',
          transform: `scaleY(${scale})`,
          opacity,
          filter: `brightness(${brightness})`,
          borderRadius: '2px',
          boxShadow: `0 0 20px rgba(255, 255, 255, 0.8)`,
          transition: 'all 0.05s linear',
        }}
        aria-hidden="true"
      />
    );
  }

  // Active placed block
  return (
    <div
      className="w-full h-full relative"
      style={{
        width: 'var(--cell-size)',
        height: 'var(--cell-size)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Main block with gradient */}
      <div
        className={`w-full h-full ${color} rounded-sm`}
        style={{
          boxShadow: glowColor
            ? `inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2), 0 0 6px ${glowColor}40`
            : 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {/* Highlight/shine effect */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: '2px 2px 0 0',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
