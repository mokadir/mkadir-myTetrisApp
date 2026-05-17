/**
 * ScorePanel - Displays game statistics
 *
 * Shows score, level, lines cleared, combo, and high score
 * with animated transitions for score changes.
 */

import React, { memo, useEffect, useRef, useState } from 'react';

interface ScorePanelProps {
  score: number;
  level: number;
  lines: number;
  highScore: number;
  combo: number;
}

/** Animated number display with slide-up effect on change */
const AnimatedNumber: React.FC<{ value: number; label: string; color?: string }> = memo(({
  value,
  label,
  color = 'text-white',
}) => {
  const [animate, setAnimate] = useState(false);
  const prevValue = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimate(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAnimate(false), 400);
      prevValue.current = value;
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-lg font-mono font-bold ${color} tabular-nums transition-all duration-200`}
        style={{
          transform: animate ? 'scale(1.1)' : 'scale(1)',
          textShadow: animate ? '0 0 20px rgba(0, 245, 255, 0.5)' : 'none',
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

const ScorePanel: React.FC<ScorePanelProps> = memo(({
  score,
  level,
  lines,
  highScore,
  combo,
}) => {
  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      role="region"
      aria-label="Game statistics"
    >
      <AnimatedNumber value={score} label="SCORE" color="text-neon-cyan" />
      <AnimatedNumber value={highScore} label="HIGH SCORE" color="text-yellow-400" />
      <div className="w-full h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <AnimatedNumber value={level} label="LEVEL" color="text-neon-green" />
      <AnimatedNumber value={lines} label="LINES" color="text-gray-300" />

      {combo > 0 && (
        <div className="animate-fade-in">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
            COMBO
          </div>
          <div className="text-lg font-mono font-bold text-neon-orange">
            x{combo}
          </div>
        </div>
      )}
    </div>
  );
});

ScorePanel.displayName = 'ScorePanel';

export default ScorePanel;
