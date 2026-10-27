import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'compact' | 'modal-btn';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed and running as a standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          type="button"
          aria-label="Install App"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold tracking-wide transition-all shadow-sm hover:shadow-cyan-500/20 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>INSTALL APP</span>
        </button>

        {showGuide && (
          <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-400/50 hover:border-cyan-300 text-slate-100 font-mono text-xs font-semibold tracking-wide shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
          {installedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4" />}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
            OFFLINE PWA APP
          </span>
          <span className="font-bold text-slate-200 group-hover:text-white">
            {installedSuccess ? 'APP INSTALLED!' : 'INSTALL TO PHONE (APK)'}
          </span>
        </div>
        <Download className="w-4 h-4 text-cyan-400 ml-1 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {showGuide && (
        <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />
      )}
    </>
  );
};

interface InstallGuideModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-left">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Install HD Battle Arena</h3>
            <p className="text-[11px] font-mono text-cyan-400">PWA Offline Standalone App</p>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-300 my-4 leading-relaxed font-sans">
            <p className="text-slate-400">Install directly onto your iPhone or iPad home screen without the App Store:</p>
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <Share2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Step 1:</strong> Tap the <strong>Share</strong> button at the bottom of Safari.
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <PlusSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Step 2:</strong> Scroll down and choose <strong>Add to Home Screen</strong>.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300 my-4 leading-relaxed font-sans">
            <p className="text-slate-400">Install directly to your Android device or Desktop without an APK download:</p>
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                Tap your browser menu (the <strong className="text-white">three dots ⋮</strong> at top right).
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                Select <strong className="text-white">"Install App"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Once added, it launches in pure full-screen mode like a native APK game with 100% offline support!
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          type="button"
          className="mt-2 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          Got it, Close
        </button>
      </div>
    </div>
  );
};
