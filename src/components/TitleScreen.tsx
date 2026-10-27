/**
 * Enhanced Title Screen for HD Battle Arena
 * Features bespoke inline SVG title lockup, PWA install CTA, weapon loadout preview, and flat control hint line.
 */

import React, { useEffect, useState } from 'react';
import { Play, Trophy, Shield, Zap, Crosshair } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { WEAPONS } from '../game/engine';
import { WeaponType } from '../game/types';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
}

const PREVIEW_WEAPONS: WeaponType[] = ['BLASTER', 'SHOTGUN', 'RAILGUN', 'VULCAN', 'MISSILE'];

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScore }) => {
  const [selectedPreview, setSelectedPreview] = useState<WeaponType>('BLASTER');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  const getRank = (score: number) => {
    if (score >= 20000) return 'WARLORD';
    if (score >= 10000) return 'CYBER ACE';
    if (score >= 5000) return 'VETERAN';
    if (score >= 1500) return 'COMMANDER';
    return 'RECRUIT';
  };

  const activeWpn = WEAPONS[selectedPreview];

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-8 select-none bg-radial from-slate-950/45 via-slate-950/80 to-slate-950/95 overflow-y-auto">
      {/* Top Bar Info with PWA Install CTA */}
      <div className="w-full max-w-5xl flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold tracking-wider">TACTICAL ARENA</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>ONLINE STANDALONE V4.5</span>
        </div>

        <div className="flex items-center gap-3">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">RANK: <strong className="text-amber-400">{getRank(highScore)}</strong></span>
              <span className="text-slate-600">·</span>
              <span className="font-bold text-white tabular-nums">{highScore.toLocaleString()}</span>
            </div>
          )}
          <PWAInstallButton variant="compact" />
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto my-auto py-4">
        <div className="mb-3">
          <svg
            viewBox="0 0 600 120"
            className="w-full max-w-md sm:max-w-lg drop-shadow-[0_0_28px_rgba(0,240,255,0.45)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="glowG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Futuristic Tech Glyphs */}
            <path d="M30 60 L70 20 L85 35 L55 65 L40 60 Z" fill="#00f0ff" opacity="0.85" />
            <path d="M570 60 L530 20 L515 35 L545 65 L560 60 Z" fill="#f59e0b" opacity="0.85" />

            {/* Glowing Accent lines */}
            <path d="M50 100 L550 100" stroke="url(#glowG)" strokeWidth="2" strokeDasharray="8 4" />

            {/* Title Text */}
            <text
              x="300"
              y="68"
              textAnchor="middle"
              fontFamily="'Oswald', sans-serif"
              fontSize="56"
              fontWeight="700"
              letterSpacing="6"
              fill="url(#cyberGrad)"
            >
              HD BATTLE ARENA
            </text>

            <text
              x="300"
              y="94"
              textAnchor="middle"
              fontFamily="'JetBrains Mono', monospace"
              fontSize="12"
              fontWeight="600"
              letterSpacing="8"
              fill="#94a3b8"
            >
              SURVIVAL CYBER COMBAT
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6 font-medium leading-relaxed">
          Repel escalating cyber swarms, unlock specialized heavy ordnances, and dominate the endless gladiatorial arena.
        </p>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onStart}
            type="button"
            className="group relative px-8 py-3.5 sm:py-4 rounded-xl bg-linear-to-r from-cyan-500 via-sky-500 to-amber-500 text-slate-950 font-black text-lg sm:text-xl font-display tracking-wider shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-3"
          >
            <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:translate-x-0.5" />
            <span>PLAY NOW</span>
          </button>

          <PWAInstallButton variant="banner" />
        </div>

        <span className="mt-3 text-[11px] font-mono text-slate-400">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded-sm border border-slate-700 text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded-sm border border-slate-700 text-slate-300">Enter</kbd> to launch
        </span>

        {/* Weapons Arsenal Showcase */}
        <div className="mt-6 w-full max-w-lg bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-left">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 font-bold flex items-center justify-between">
            <span>ARMORY INTEL</span>
            <span className="text-cyan-400">{activeWpn.name}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-2.5">
            {PREVIEW_WEAPONS.map((type) => {
              const isSelected = selectedPreview === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedPreview(type)}
                  type="button"
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans mb-2">
            {activeWpn.description}
          </p>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">DMG: </span>
              <span className="text-white font-bold">{activeWpn.damage}</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">ROF: </span>
              <span className="text-white font-bold">{activeWpn.fireRate}/s</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">VELOCITY: </span>
              <span className="text-white font-bold">{activeWpn.bulletSpeed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Hint Line (Single flat line) */}
      <div className="w-full text-center py-2">
        <div className="text-xs sm:text-sm font-mono text-slate-400">
          <span className="text-slate-300 font-semibold">WASD / Touch Joystick</span> Move
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-300 font-semibold">Mouse / Space / Fire</span> Shoot
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-300 font-semibold">Shift / Dash</span> Boost
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-300 font-semibold">1-5</span> Weapons
          <span className="mx-2 text-slate-600">·</span>
          <span className="text-slate-300 font-semibold">Esc / P</span> Pause
        </div>
      </div>
    </div>
  );
};
