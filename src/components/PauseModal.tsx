/**
 * Pause Modal for HD Battle Arena
 */

import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl text-center flex flex-col items-center">
        <div className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 mb-1">
          SIMULATION SUSPENDED
        </div>
        <h2 className="text-3xl font-black font-display tracking-wider text-white mb-6">
          GAME PAUSED
        </h2>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-display text-base tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME SIMULATION</span>
          </button>

          <button
            onClick={onRestart}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={onToggleMute}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>AUDIO: {isMuted ? 'MUTED' : 'ENABLED'}</span>
          </button>

          <div className="pt-1">
            <PWAInstallButton variant="banner" />
          </div>
        </div>

        {/* Quick controls review */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 w-full text-xs font-mono text-slate-400 leading-relaxed">
          <p>WASD / Joystick to move</p>
          <p>Mouse / Touch to fire</p>
          <p>Shift / Dash button to boost</p>
        </div>
      </div>
    </div>
  );
};
