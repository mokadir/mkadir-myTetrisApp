/**
 * Tetris Game - Main Application Component
 *
 * An arcade-quality Tetris clone built with React, TypeScript, and Tailwind CSS.
 * Features modern UI with neon aesthetics, smooth animations, and responsive design.
 */

import React from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import GameBoard from './components/GameBoard';
import ScorePanel from './components/ScorePanel';
import PreviewPanel from './components/PreviewPanel';
import HoldPanel from './components/HoldPanel';
import Controls from './components/Controls';

const App: React.FC = () => {
  const { gameState, controls } = useGameLoop();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" role="application" aria-label="Tetris Game">
      {/* Header */}
      <header className="flex-shrink-0 py-2 md:py-3 text-center">
        <h1
          className="text-xl md:text-2xl font-arcade tracking-wider"
          style={{
            color: '#00f5ff',
            textShadow: '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.2)',
            letterSpacing: '0.3em',
          }}
        >
          TETRIS
        </h1>
        <div className="text-[10px] text-gray-500 mt-1 font-mono">
          Arcade Edition
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex items-start justify-center overflow-hidden px-2 pb-2">
        <div className="flex gap-3 md:gap-4 items-start">
          {/* Left panel - Hold */}
          <div className="hidden sm:flex flex-col gap-3 pt-1" style={{ minWidth: 100 }}>
            <HoldPanel holdPiece={gameState.holdPiece} canHold={gameState.canHold} />
          </div>

          {/* Center - Game Board */}
          <div className="flex flex-col items-center gap-2">
            <GameBoard
              board={gameState.board}
              currentPiece={gameState.currentPiece}
              ghostPiece={gameState.ghostPiece}
              lineClearRows={gameState.lineClearRows}
              lineClearProgress={gameState.lineClearProgress}
              status={gameState.status}
              onRestart={controls.restart}
            />

            {/* Mobile controls */}
            <div className="block sm:hidden w-full mt-2">
              <Controls
                onAction={controls.handleAction}
                status={gameState.status}
                isMuted={controls.isMuted}
                onToggleMute={controls.toggleMute}
              />
            </div>
          </div>

          {/* Right panel - Score & Next */}
          <div className="flex flex-col gap-3 pt-1" style={{ minWidth: 120 }}>
            <ScorePanel
              score={gameState.score}
              level={gameState.level}
              lines={gameState.lines}
              highScore={gameState.highScore}
              combo={gameState.combo}
            />
            <PreviewPanel nextPieces={gameState.nextPieces} />

            {/* Desktop hold display */}
            <div className="sm:hidden">
              <HoldPanel holdPiece={gameState.holdPiece} canHold={gameState.canHold} />
            </div>
          </div>
        </div>
      </main>

      {/* Desktop controls footer */}
      <footer className="hidden sm:block flex-shrink-0 pb-2">
        <Controls
          onAction={controls.handleAction}
          status={gameState.status}
          isMuted={controls.isMuted}
          onToggleMute={controls.toggleMute}
        />
      </footer>

      {/* Keyboard hints */}
      <div
        className="flex-shrink-0 text-center pb-1 text-[9px] text-gray-600 font-mono"
        aria-label="Keyboard controls"
      >
        <span className="hidden sm:inline">
          ←→ Move &nbsp;↓ Soft Drop &nbsp;↑ Rotate &nbsp;Space Hard Drop &nbsp;Shift Hold &nbsp;P Pause
        </span>
        <span className="sm:hidden">
          Touch controls active &bull; Keyboard also supported
        </span>
      </div>
    </div>
  );
};

export default App;
