/**
 * Virtual Dual-Stick and Action Controls for mobile/touch devices
 * Reliable pointer tracking, large touch zone, zero-reset bug, and clear visual indicators.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Crosshair, Zap } from 'lucide-react';
import { sounds } from '../game/audio';

interface VirtualControlsProps {
  onMove: (x: number, y: number) => void;
  onFireChange: (isFiring: boolean) => void;
  onDash: () => void;
  dashReady: boolean;
  dashProgress: number;
  autoFire: boolean;
  onToggleAutoFire: () => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onFireChange,
  onDash,
  dashReady,
  dashProgress,
  autoFire,
  onToggleAutoFire,
}) => {
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoyActive, setIsJoyActive] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  // Keep latest onMove and onFireChange in refs to avoid recreating listeners
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onFireChangeRef = useRef(onFireChange);
  onFireChangeRef.current = onFireChange;

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    if (!joyBaseRef.current) return;
    const rect = joyBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const maxRadius = rect.width / 2;
    const distance = Math.hypot(dx, dy);

    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMoveRef.current(dx / maxRadius, dy / maxRadius);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pointerIdRef.current = e.pointerId;
    setIsJoyActive(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) {
      e.preventDefault();
      updateJoystick(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) {
      pointerIdRef.current = null;
      setIsJoyActive(false);
      setKnobPos({ x: 0, y: 0 });
      onMoveRef.current(0, 0);
    }
  };

  // Only zero out on unmount!
  useEffect(() => {
    return () => {
      onMoveRef.current(0, 0);
      onFireChangeRef.current(false);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 touch-none">
      {/* Movement Virtual Joystick Area (Left Bottom Quadrant) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute bottom-4 left-4 w-44 h-44 sm:w-52 sm:h-52 pointer-events-auto flex items-center justify-center touch-none"
      >
        <div
          ref={joyBaseRef}
          className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 transition-colors flex items-center justify-center shadow-xl ${
            isJoyActive
              ? 'border-cyan-400 bg-slate-900/80 shadow-cyan-500/30'
              : 'border-cyan-500/40 bg-slate-950/60 shadow-black/60'
          }`}
        >
          {/* Directional cross guidelines */}
          <div className="absolute w-full h-[1px] bg-cyan-400/20" />
          <div className="absolute h-full w-[1px] bg-cyan-400/20" />

          {/* Cardinal direction indicators */}
          <span className="absolute top-1 text-[9px] font-mono text-cyan-400/70 font-bold">▲</span>
          <span className="absolute bottom-1 text-[9px] font-mono text-cyan-400/70 font-bold">▼</span>
          <span className="absolute left-1 text-[9px] font-mono text-cyan-400/70 font-bold">◄</span>
          <span className="absolute right-1 text-[9px] font-mono text-cyan-400/70 font-bold">►</span>

          {/* Draggable Knob */}
          <div
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoyActive ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-13 h-13 rounded-full bg-linear-to-b from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-400/60 border-2 border-white/90 pointer-events-none flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </div>
        </div>
      </div>

      {/* Action Buttons Cluster (Right Bottom) */}
      <div className="absolute bottom-5 right-4 flex items-end gap-3 pointer-events-auto touch-none">
        {/* Auto Fire Toggle */}
        <button
          onClick={onToggleAutoFire}
          type="button"
          aria-label="Toggle Auto Fire"
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all border shadow-md active:scale-95 ${
            autoFire
              ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-amber-500/30'
              : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
          }`}
        >
          AUTO-FIRE: {autoFire ? 'ON' : 'OFF'}
        </button>

        {/* Dash Button */}
        <div className="relative">
          <button
            onClick={() => {
              sounds.triggerHaptic(25);
              onDash();
            }}
            disabled={!dashReady}
            type="button"
            aria-label="Dash"
            className={`w-15 h-15 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
              dashReady
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-cyan-500/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-600'
            }`}
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Dash</span>
          </button>
          {!dashReady && (
            <div
              className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
              style={{
                clipPath: `inset(${(1 - dashProgress) * 100}% 0 0 0)`,
              }}
            />
          )}
        </div>

        {/* Fire Button */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            sounds.triggerHaptic(18);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            onFireChangeRef.current(true);
          }}
          onPointerUp={() => onFireChangeRef.current(false)}
          onPointerCancel={() => onFireChangeRef.current(false)}
          onPointerLeave={() => onFireChangeRef.current(false)}
          type="button"
          aria-label="Fire Weapon"
          className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-rose-500 to-red-600 border-3 border-white/90 text-white font-black text-sm sm:text-base flex flex-col items-center justify-center shadow-2xl shadow-red-600/50 active:scale-95 cursor-pointer touch-none"
        >
          <Crosshair className="w-6 h-6 mb-0.5" />
          <span>FIRE</span>
        </button>
      </div>
    </div>
  );
};
