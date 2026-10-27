/**
 * HD Battle Arena - Main Full-Viewport Game Shell
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameHUDData, GameState, WeaponType } from './game/types';
import { sounds } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { PerkModal } from './components/PerkModal';
import { VirtualControls } from './components/VirtualJoystick';

const HIGH_SCORE_KEY = 'hd_battle_arena_high_score';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [hudData, setHudData] = useState<GameHUDData>({
    hp: 100,
    maxHp: 100,
    shield: 35,
    maxShield: 35,
    score: 0,
    kills: 0,
    wave: 1,
    comboStreak: 0,
    dashReady: true,
    dashProgress: 1,
    weaponName: 'Pulse Blaster',
    weaponType: 'BLASTER',
    weaponLevel: 1,
    bossHpPercent: null,
    enemiesRemaining: 0,
    state: 'TITLE',
  });

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.isMuted());
  const [screenShake, setScreenShake] = useState<boolean>(true);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [autoFire, setAutoFire] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor network online/offline state for PWA offline compliance
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Game Engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      (data) => {
        setHudData(data);
      },
      (state) => {
        setGameState(state);
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync high score
  useEffect(() => {
    if (hudData.score > highScore) {
      setHighScore(hudData.score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, hudData.score.toString());
      } catch {
        // LocalStorage might fail in incognito
      }
    }
  }, [hudData.score, highScore]);

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    const newMuted = sounds.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Screen shake toggle
  const handleToggleScreenShake = useCallback(() => {
    setScreenShake((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.screenShakeEnabled = next;
      }
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleRestartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleSelectWeapon = useCallback((weapon: WeaponType) => {
    if (engineRef.current) {
      engineRef.current.switchWeapon(weapon);
    }
  }, []);

  const handleTriggerDash = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDash();
    }
  }, []);

  const handleApplyPerk = useCallback((perkId: string) => {
    if (engineRef.current) {
      engineRef.current.applyPerk(perkId);
    }
  }, []);

  // Virtual Controls Handlers (Memoized!)
  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.virtualJoyX = x;
      engineRef.current.virtualJoyY = y;
    }
  }, []);

  const handleFireChange = useCallback((firing: boolean) => {
    if (engineRef.current) {
      engineRef.current.virtualFire = firing;
    }
  }, []);

  const handleToggleAutoFire = useCallback(() => {
    setAutoFire((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.autoFire = next;
      }
      return next;
    });
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 60fps Native Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair touch-none"
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen onStart={handleStartGame} highScore={highScore} />
      )}

      {/* Active In-Game HUD (Low-Occlusion & Collision Free) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'PERK_SELECT') && (
        <GameHUD
          data={hudData}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          screenShake={screenShake}
          onToggleScreenShake={handleToggleScreenShake}
          onPause={handlePause}
          onSelectWeapon={handleSelectWeapon}
          onTriggerDash={handleTriggerDash}
        />
      )}

      {/* Touch Virtual Dual-Stick Controls (Enabled on touch devices or small screens) */}
      {(isTouchDevice || window.innerWidth <= 768) && gameState === 'PLAYING' && (
        <VirtualControls
          onMove={handleJoystickMove}
          onFireChange={handleFireChange}
          onDash={handleTriggerDash}
          dashReady={hudData.dashReady}
          dashProgress={hudData.dashProgress}
          autoFire={autoFire}
          onToggleAutoFire={handleToggleAutoFire}
        />
      )}

      {/* Perk Upgrade Milestone Modal */}
      {gameState === 'PERK_SELECT' && (
        <PerkModal wave={hudData.wave} onSelectPerk={handleApplyPerk} />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={hudData.score}
          highScore={highScore}
          wave={hudData.wave}
          kills={hudData.kills}
          onRestart={handleRestartGame}
        />
      )}

      {/* Offline Mode Toast Indicator for PWA */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/95 border border-cyan-500/50 px-3.5 py-1 text-[11px] font-mono font-bold text-cyan-300 shadow-xl backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>OFFLINE MODE ACTIVE · LOCAL CACHE READY</span>
        </div>
      )}
    </main>
  );
}
