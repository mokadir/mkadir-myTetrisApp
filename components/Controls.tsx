/**
 * Controls - On-screen game control buttons
 *
 * Provides touch-friendly buttons for mobile users
 * and alternate input methods. Includes Start, Pause,
 * Restart, and direction buttons.
 * Responsive sizing adapts to screen width.
 * Theme-aware using CSS custom properties.
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
    className={`touch-controls-area px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded text-sm font-mono font-bold
      transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2
      focus:ring-neon-cyan/50 select-none ${className}`}
    style={{
      backgroundColor: active ? 'var(--btn-bg-active)' : 'var(--btn-bg)',
      border: active ? '1px solid var(--btn-border-active)' : '1px solid var(--btn-border)',
      color: active ? 'var(--btn-color-active)' : 'var(--btn-color)',
      fontSize: 'clamp(11px, 2.5vw, 14px)',
      minWidth: 'clamp(40px, 10vw, 56px)',
      minHeight: 'clamp(36px, 8vw, 44px)',
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
      transition-all duration-100 active:scale-90 focus:outline-none select-none`}
    style={{
      backgroundColor: 'var(--dir-btn-bg)',
      border: '1px solid var(--dir-btn-border)',
      color: 'var(--dir-btn-color)',
      fontSize: size === 'lg' ? 'clamp(20px, 5vw, 28px)' : 'clamp(16px, 4vw, 22px)',
      width: size === 'lg' ? 'clamp(48px, 12vw, 64px)' : 'clamp(42px, 10vw, 56px)',
      height: size === 'lg' ? 'clamp(48px, 12vw, 64px)' : 'clamp(42px, 10vw, 56px)',
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
    <div className="space-y-1.5 sm:space-y-2 md:space-y-3" role="group" aria-label="Game controls">
      {/* Top row - Game state buttons */}
      <div className="flex gap-1.5 sm:gap-2 justify-center">
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
        className="flex flex-col items-center gap-1 sm:gap-2 mt-1 sm:mt-2 md:mt-4"
        role="group"
        aria-label="Directional controls"
      >
        {/* Top row - rotate */}
        <div className="flex gap-8 sm:gap-10">
          <DirButton
            onClick={handleAction('ROTATE')}
            label="↻"
            ariaLabel="Rotate piece"
          />
        </div>

        {/* Middle row - left, down, right */}
        <div className="flex gap-2 sm:gap-3 items-center">
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
        <div className="flex gap-2 sm:gap-3 mt-0.5 sm:mt-1">
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
