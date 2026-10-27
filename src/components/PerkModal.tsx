/**
 * Tactical Perk Selection Modal (Awarded every 2 waves)
 */

import React from 'react';
import { Shield, Zap, Sparkles, Heart, Crosshair, Cpu } from 'lucide-react';

export interface PerkOption {
  id: string;
  title: string;
  desc: string;
  category: string;
  iconName: 'SHIELD' | 'SPEED' | 'DAMAGE' | 'DRONE' | 'HEAL' | 'CRIT';
}

interface PerkModalProps {
  wave: number;
  onSelectPerk: (perkId: string) => void;
}

const ALL_PERKS: PerkOption[] = [
  {
    id: 'SHIELD_BOOST',
    title: 'Reinforced Kinetic Shield',
    desc: 'Increases maximum shield capacity by +30 points and instantly replenishes shields.',
    category: 'DEFENSE',
    iconName: 'SHIELD',
  },
  {
    id: 'WEAPON_DAMAGE',
    title: 'Weapon Overclock',
    desc: 'Upgrades your active weapon level by +1, increasing damage and shot density.',
    category: 'OFFENSE',
    iconName: 'DAMAGE',
  },
  {
    id: 'COMBAT_DRONE',
    title: 'Autonomous Defense Drone',
    desc: 'Deploys an orbital support drone that revolves around you and fires at approaching threats.',
    category: 'UTILITY',
    iconName: 'DRONE',
  },
  {
    id: 'NANITE_REPAIR',
    title: 'Nanite Hull Reconstitution',
    desc: 'Expands maximum hull HP by +25 and heals +50 HP immediately.',
    category: 'RECOVERY',
    iconName: 'HEAL',
  },
  {
    id: 'SPEED_BOOST',
    title: 'Turbo Thrusters & Fast Dash',
    desc: 'Increases base maneuverability speed by +40 and decreases dash cooldown by 0.3s.',
    category: 'AGILITY',
    iconName: 'SPEED',
  },
  {
    id: 'CRIT_SURGE',
    title: 'High-Energy Critical Matrix',
    desc: 'Grants +15% critical hit chance for 1.8x amplified projectile damage.',
    category: 'OFFENSE',
    iconName: 'CRIT',
  },
];

export const PerkModal: React.FC<PerkModalProps> = ({ wave, onSelectPerk }) => {
  // Select 3 random perks deterministically
  const [perks] = React.useState<PerkOption[]>(() => {
    const shuffled = [...ALL_PERKS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'SHIELD':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'DAMAGE':
        return <Crosshair className="w-5 h-5 text-amber-400" />;
      case 'DRONE':
        return <Cpu className="w-5 h-5 text-pink-400" />;
      case 'HEAL':
        return <Heart className="w-5 h-5 text-emerald-400" />;
      case 'SPEED':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center">
        <div className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 mb-1">
          WAVE {wave - 1} CLEARED
        </div>
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wide text-white mb-2">
          CHOOSE TACTICAL UPGRADE
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 font-medium">
          Select an enhancement module to integrate into your combat rig.
        </p>

        <div className="w-full flex flex-col gap-3">
          {perks.map((perk) => (
            <button
              key={perk.id}
              onClick={() => onSelectPerk(perk.id)}
              type="button"
              className="group text-left p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer flex items-start gap-4 active:scale-[0.99] shadow-sm hover:shadow-md hover:shadow-cyan-950/30"
            >
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 shrink-0">
                {getIcon(perk.iconName)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {perk.title}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400">
                    {perk.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {perk.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
