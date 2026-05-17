/**
 * Controls - On-screen game control buttons
 *
 * Provides touch-friendly buttons for mobile users
 * and alternate input methods. Includes Start, Pause,
 * Restart, and direction buttons.
 */

import React, { memo, useCallback } from 'react';
import { GameAction } from '../types';

interface ControlsProps {
  onAction: (action: GameAction) => void;
  status: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

/** Styled action button */
const ActionButton: React.FC<{
  onClick: (...args: any[]) => void;
  label: string;
  ariaLabel: string;
  className?: string;
  active?: boolean;
}> = memo(({ onClick, label, ariaLabel, className = '', active }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`touch-controls-area px-4 py-2 rounded text-sm font-mono font-bold
      transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2
      focus:ring-neon-cyan/50 select-none ${className}`}
    style={{
      backgroundColor: active ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
      border: active ? '1px solid rgba(0, 245, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
      color: active ? '#00f5ff' : '#c0c0c0',
      minWidth: 48,
      minHeight: 44,
    }}
  >
    {label}
  </button>
));

ActionButton.displayName = 'ActionButton';

/** Directional control button */
const DirButton: React.FC<{
  onClick: (...args: any[]) => void;
  label: string;
  ariaLabel: string;
  size?: 'sm' | 'lg';
}> = memo(({ onClick, label, ariaLabel, size = 'sm' }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`touch-controls-area flex items-center justify-center rounded-lg
      transition-all duration-100 active:scale-90 active:bg-white/10
      focus:outline-none select-none ${size === 'lg' ? 'w-16 h-16' : 'w-14 h-14'}`}
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      color: '#e0e0e0',
      fontSize: size === 'lg' ? '24px' : '20px',
      touchAction: 'manipulation',
    }}
  >
    {label}
  </button>
));

DirButton.displayName = 'DirButton';

const Controls: React.FC<ControlsProps> = memo(({
  onAction,
  status,
  isMuted,
  onToggleMute,
}) => {
  const handleAction = useCallback(
    (action: GameAction) => {
      return (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAction(action);
      };
    },
    [onAction]
  );

  const isGameOver = status === 'gameover';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  return (
    <div className="space-y-3" role="group" aria-label="Game controls">
      {/* Top row - Game state buttons */}
      <div className="flex gap-2 justify-center">
        {(isIdle || isGameOver) && (
          <ActionButton
            onClick={handleAction('RESTART')}
            label="START"
            ariaLabel="Start game"
            active
          />
        )}
        {isPlaying && (
          <ActionButton
            onClick={handleAction('PAUSE')}
            label="PAUSE"
            ariaLabel="Pause game"
          />
        )}
        {isPaused && (
          <ActionButton
            onClick={handleAction('PAUSE')}
            label="RESUME"
            ariaLabel="Resume game"
            active
          />
        )}
        {(isPlaying || isPaused) && (
          <ActionButton
            onClick={handleAction('RESTART')}
            label="RESTART"
            ariaLabel="Restart game"
          />
        )}
        <ActionButton
          onClick={onToggleMute}
          label={isMuted ? '🔇' : '🔊'}
          ariaLabel={isMuted ? 'Unmute sound' : 'Mute sound'}
          active={!isMuted}
        />
      </div>

      {/* Directional controls for mobile */}
      <div
        className="flex flex-col items-center gap-2 mt-4"
        role="group"
        aria-label="Directional controls"
      >
        {/* Top row */}
        <div className="flex gap-10">
          <DirButton
            onClick={handleAction('ROTATE')}
            label="↻"
            ariaLabel="Rotate piece"
          />
        </div>

        {/* Middle row - left, down, right */}
        <div className="flex gap-3 items-center">
          <DirButton
            onClick={handleAction('MOVE_LEFT')}
            label="←"
            ariaLabel="Move left"
          />
          <DirButton
            onClick={handleAction('SOFT_DROP')}
            label="↓"
            ariaLabel="Soft drop"
            size="lg"
          />
          <DirButton
            onClick={handleAction('MOVE_RIGHT')}
            label="→"
            ariaLabel="Move right"
          />
        </div>

        {/* Bottom row - hard drop and hold */}
        <div className="flex gap-3 mt-1">
          <ActionButton
            onClick={handleAction('HARD_DROP')}
            label="DROP"
            ariaLabel="Hard drop"
          />
          <ActionButton
            onClick={handleAction('HOLD')}
            label="HOLD"
            ariaLabel="Hold piece"
          />
        </div>
      </div>
    </div>
  );
});

Controls.displayName = 'Controls';

export default Controls;
