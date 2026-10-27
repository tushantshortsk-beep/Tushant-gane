/**
 * Low-Occlusion, World-Matched HUD Overlay for HD Battle Arena
 * Clean perimeters, zero button collisions with joystick, screen shake toggle, and tabular numerals.
 */

import React from 'react';
import {
  Heart,
  Shield,
  Trophy,
  Skull,
  Volume2,
  VolumeX,
  Pause,
  Zap,
  Activity,
} from 'lucide-react';
import { GameHUDData, WeaponType } from '../game/types';
import { WEAPONS } from '../game/engine';

interface GameHUDProps {
  data: GameHUDData;
  isMuted: boolean;
  onToggleMute: () => void;
  screenShake: boolean;
  onToggleScreenShake: () => void;
  onPause: () => void;
  onSelectWeapon: (weapon: WeaponType) => void;
  onTriggerDash: () => void;
}

const WEAPON_KEYS: WeaponType[] = ['BLASTER', 'SHOTGUN', 'RAILGUN', 'VULCAN', 'MISSILE'];

export const GameHUD: React.FC<GameHUDProps> = ({
  data,
  isMuted,
  onToggleMute,
  screenShake,
  onToggleScreenShake,
  onPause,
  onSelectWeapon,
  onTriggerDash,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (data.hp / data.maxHp) * 100));
  const shieldPercent = data.maxShield > 0 ? Math.max(0, Math.min(100, (data.shield / data.maxShield) * 100)) : 0;
  const currentWeaponConfig = WEAPONS[data.weaponType];

  return (
    <header className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Bar Perimeter Cluster (Slim single-row contract) */}
      <div className="flex items-start justify-between w-full gap-2 sm:gap-4">
        {/* Left Status: HP, Shield & Active Weapon */}
        <div className="pointer-events-auto flex flex-col gap-1.5 min-w-[140px] sm:min-w-[210px] bg-slate-950/80 border border-slate-800/90 p-2 sm:p-2.5 rounded-xl shadow-lg backdrop-blur-xs">
          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold mb-0.5">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                <span className="hidden sm:inline">HULL</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {data.hp}<span className="text-slate-500 text-[9px]">/{data.maxHp}</span>
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-linear-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Shield Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold mb-0.5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">SHIELD</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {data.shield}<span className="text-slate-500 text-[9px]">/{data.maxShield}</span>
              </span>
            </div>
            <div className="w-full h-1 sm:h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-linear-to-r from-cyan-600 to-cyan-400 transition-all duration-150"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Active Weapon Indicator (Compact on Mobile) */}
          <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono border-t border-slate-850">
            <span className="text-slate-400 font-semibold truncate max-w-[90px] sm:max-w-none" style={{ color: currentWeaponConfig.color }}>
              {currentWeaponConfig.name.split(' ')[0]}
            </span>
            <span className="text-amber-400 text-[9px] font-bold">LVL {data.weaponLevel}</span>
          </div>
        </div>

        {/* Center: Sector Wave & Boss Bar */}
        <div className="flex flex-col items-center">
          <div className="pointer-events-auto bg-slate-950/80 border border-slate-800/90 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl text-center shadow-lg backdrop-blur-xs">
            <div className="text-[9px] tracking-widest text-slate-400 font-mono font-bold uppercase">
              SECTOR
            </div>
            <div className="text-sm sm:text-base font-black tracking-wider text-cyan-300 font-display">
              WAVE {data.wave}
            </div>
          </div>

          {/* Combo Indicator */}
          {data.comboStreak >= 3 && (
            <div className="mt-1 text-[11px] sm:text-xs font-black font-mono tracking-wider text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
              {data.comboStreak}x KILL STREAK
            </div>
          )}

          {/* Boss Bar */}
          {data.bossHpPercent !== null && data.bossHpPercent !== undefined && (
            <div className="mt-1.5 w-48 sm:w-72 bg-slate-950/90 border border-red-500/60 p-1.5 rounded-xl text-center shadow-xl shadow-red-950/50">
              <div className="text-[10px] font-mono font-bold text-red-400 tracking-wider mb-0.5">
                GOLIATH MECH TITAN
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-red-900">
                <div
                  className="h-full bg-linear-to-r from-red-600 to-red-400 transition-all duration-100"
                  style={{ width: `${data.bossHpPercent * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Status: Score, Shake Toggle, Mute & Pause */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-950/80 border border-slate-800/90 p-1.5 sm:p-2 rounded-xl shadow-lg backdrop-blur-xs">
          <div className="flex flex-col items-end pr-1.5 sm:pr-2 border-r border-slate-800">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs sm:text-sm font-mono tabular-nums">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>{data.score.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono tabular-nums">
              <Skull className="w-2.5 h-2.5 text-slate-500" />
              <span>{data.kills}</span>
            </div>
          </div>

          {/* Screen Shake Toggle Button */}
          <button
            onClick={onToggleScreenShake}
            type="button"
            title={screenShake ? 'Disable Screen Shake' : 'Enable Screen Shake'}
            aria-label="Toggle Screen Shake"
            className={`p-1.5 sm:p-2 rounded-lg border text-xs font-mono transition-colors ${
              screenShake
                ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                : 'bg-slate-900 border-rose-900/60 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            type="button"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Mute"
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            type="button"
            title="Pause Game"
            aria-label="Pause Game"
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop Only: Bottom Center Weapon Hotkeys & Dash Indicator */}
      <div className="hidden sm:flex flex-col items-center gap-2 mb-2 pointer-events-none">
        {/* Dash Ready Indicator (Desktop) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onTriggerDash}
            disabled={!data.dashReady}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              data.dashReady
                ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-sm shadow-cyan-500/20 hover:bg-cyan-500/25'
                : 'bg-slate-950/80 border-slate-800 text-slate-600'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>DASH (SHIFT)</span>
            {!data.dashReady && (
              <span className="text-[10px] text-slate-500">
                {Math.ceil((1 - data.dashProgress) * 1.7 * 10) / 10}s
              </span>
            )}
          </button>
        </div>

        {/* Weapons Hotkey Bar (Desktop Only) */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 border border-slate-800/90 p-1.5 rounded-xl shadow-xl shadow-black/50">
          {WEAPON_KEYS.map((key, idx) => {
            const wpn = WEAPONS[key];
            const isEquipped = data.weaponType === key;
            return (
              <button
                key={key}
                onClick={() => onSelectWeapon(key)}
                type="button"
                className={`relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono cursor-pointer ${
                  isEquipped
                    ? 'bg-slate-800 border border-cyan-400/80 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-bold">{idx + 1}</span>
                  <span
                    className="font-bold tracking-tight"
                    style={{ color: isEquipped ? wpn.color : undefined }}
                  >
                    {wpn.name.split(' ')[0]}
                  </span>
                </div>
                {isEquipped && (
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-0.5"
                    style={{ backgroundColor: wpn.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
