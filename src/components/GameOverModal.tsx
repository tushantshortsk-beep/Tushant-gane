/**
 * Game Over Screen with detailed battle performance stats and instant restart
 */

import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Skull, Crosshair, Award } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface GameOverModalProps {
  score: number;
  highScore: number;
  wave: number;
  kills: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  wave,
  kills,
  onRestart,
}) => {
  const isNewHighScore = score > highScore;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-center flex flex-col items-center">
        {/* Header */}
        <div className="text-xs font-mono font-bold tracking-widest text-rose-500 mb-1">
          HULL DESTROYED
        </div>
        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-wide text-white mb-2">
          BATTLE CONCLUDED
        </h2>

        {isNewHighScore && (
          <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>NEW ARENA RECORD!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl text-left">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 uppercase">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>FINAL SCORE</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl text-left">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 uppercase">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>WAVE REACHED</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-cyan-300 mt-1">
              WAVE {wave}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl text-left">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 uppercase">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>ENEMIES PURGED</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-200 mt-1">
              {kills}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl text-left">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 uppercase">
              <Trophy className="w-3.5 h-3.5 text-slate-500" />
              <span>BEST RECORD</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
              {Math.max(score, highScore).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Play Again Single-line Action */}
        <button
          onClick={onRestart}
          type="button"
          className="w-full py-3.5 px-6 rounded-xl bg-linear-to-r from-cyan-500 to-amber-500 text-slate-950 font-bold font-display text-lg tracking-wider flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>PLAY AGAIN</span>
        </button>

        <div className="w-full mt-3 flex justify-center">
          <PWAInstallButton variant="compact" />
        </div>

        <span className="mt-3 text-xs font-mono text-slate-400">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded-sm border border-slate-700 text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded-sm border border-slate-700 text-slate-300">Enter</kbd> to restart
        </span>
      </div>
    </div>
  );
};
