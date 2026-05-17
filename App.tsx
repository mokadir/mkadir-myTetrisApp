/**
 * Tetris Game - Main Application Component
 *
 * An arcade-quality Tetris clone built with React, TypeScript, and Tailwind CSS.
 * Features modern UI with neon aesthetics, smooth animations, and responsive design.
 * Adapts seamlessly from mobile portrait to desktop widescreen.
 * Supports dark and light themes with persistent preference.
 */

import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useGameLoop } from './hooks/useGameLoop';
import GameBoard from './components/GameBoard';
import ScorePanel from './components/ScorePanel';
import PreviewPanel from './components/PreviewPanel';
import HoldPanel from './components/HoldPanel';
import Controls from './components/Controls';

/** Theme toggle button with sun/moon icon */
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="touch-controls-area flex items-center justify-center rounded-lg
        transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2
        focus:ring-neon-cyan/50 select-none"
      style={{
        backgroundColor: 'var(--dir-btn-bg)',
        border: '1px solid var(--dir-btn-border)',
        color: 'var(--dir-btn-color)',
        width: 'clamp(32px, 6vw, 40px)',
        height: 'clamp(32px, 6vw, 40px)',
        fontSize: 'clamp(14px, 2.5vw, 18px)',
        touchAction: 'manipulation',
      }}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
};

/** Inner app content that uses theme context */
const AppContent: React.FC = () => {
  const { gameState, controls } = useGameLoop();
  const { isDark } = useTheme();

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      role="application"
      aria-label="Tetris Game"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)'
          : 'linear-gradient(135deg, #f0f0f5 0%, #e8e8ee 50%, #f0f0f5 100%)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Header */}
      <header className="flex-shrink-0 py-1 sm:py-2 md:py-3 text-center relative">
        <h1
          className="font-arcade tracking-wider"
          style={{
            color: '#00f5ff',
            textShadow: isDark
              ? '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.2)'
              : '0 0 10px rgba(0, 245, 255, 0.3), 0 0 20px rgba(0, 245, 255, 0.1)',
            letterSpacing: '0.3em',
            fontSize: 'clamp(14px, 3.5vw, 24px)',
          }}
        >
          TETRIS
        </h1>
        <div
          className="mt-0.5 sm:mt-1 font-mono"
          style={{
            color: 'var(--subtitle-color)',
            fontSize: 'clamp(7px, 1.5vw, 10px)',
          }}
        >
          Arcade Edition
        </div>

        {/* Theme toggle positioned top-right */}
        <div className="absolute top-1 sm:top-2 right-2 sm:right-3 md:right-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex items-start justify-center overflow-hidden px-1 sm:px-2 pb-1 sm:pb-2">
        <div className="flex gap-1 sm:gap-2 md:gap-3 lg:gap-4 items-start">
          {/* Left panel - Hold (desktop) */}
          <div className="hidden sm:flex flex-col gap-2 md:gap-3 pt-1 panel-min-width">
            <HoldPanel holdPiece={gameState.holdPiece} canHold={gameState.canHold} />
          </div>

          {/* Center - Game Board */}
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <GameBoard
              board={gameState.board}
              currentPiece={gameState.currentPiece}
              ghostPiece={gameState.ghostPiece}
              lineClearRows={gameState.lineClearRows}
              lineClearProgress={gameState.lineClearProgress}
              status={gameState.status}
              onRestart={controls.restart}
            />

            {/* Mobile controls (below board on small screens) */}
            <div className="block sm:hidden w-full max-w-[90vw] mt-1">
              <Controls
                onAction={controls.handleAction}
                status={gameState.status}
                isMuted={controls.isMuted}
                onToggleMute={controls.toggleMute}
              />
            </div>
          </div>

          {/* Right panel - Score & Next */}
          <div className="flex flex-col gap-2 md:gap-3 pt-1 panel-min-width">
            <ScorePanel
              score={gameState.score}
              level={gameState.level}
              lines={gameState.lines}
              highScore={gameState.highScore}
              combo={gameState.combo}
            />
            <PreviewPanel nextPieces={gameState.nextPieces} />

            {/* Hold panel on mobile (shown below preview on small screens) */}
            <div className="sm:hidden">
              <HoldPanel holdPiece={gameState.holdPiece} canHold={gameState.canHold} />
            </div>
          </div>
        </div>
      </main>

      {/* Desktop controls footer */}
      <footer className="hidden sm:block flex-shrink-0 pb-1 sm:pb-2">
        <Controls
          onAction={controls.handleAction}
          status={gameState.status}
          isMuted={controls.isMuted}
          onToggleMute={controls.toggleMute}
        />
      </footer>

      {/* Keyboard hints */}
      <div
        className="flex-shrink-0 text-center pb-0.5 sm:pb-1 font-mono"
        style={{
          color: 'var(--keyboard-hint)',
          fontSize: 'clamp(7px, 1.2vw, 9px)',
        }}
        aria-label="Keyboard controls"
      >
        <span className="hidden sm:inline">
          {'\u2190\u2192'} Move &nbsp;{'\u2193'} Soft Drop &nbsp;{'\u2191'} Rotate &nbsp;Space Hard Drop &nbsp;Shift Hold &nbsp;P Pause
        </span>
        <span className="sm:hidden">
          Touch controls active &bull; Keyboard also supported
        </span>
      </div>
    </div>
  );
};

/** Root App component with ThemeProvider wrapper */
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
