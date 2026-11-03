import React from 'react';
import { motion } from 'motion/react';
import { Zap, Compass } from 'lucide-react';
import { CelestialDestination } from '../../types';

interface WarpOverlayProps {
  targetDestination: CelestialDestination;
  progress: number; // 0 to 1
}

export const WarpOverlay: React.FC<WarpOverlayProps> = ({
  targetDestination,
  progress,
}) => {
  // Speed calculation scaling up to warp 9.8
  const warpFactor = (1 + Math.sin(progress * Math.PI) * 8.8).toFixed(2);
  const percent = Math.floor(progress * 100);

  return (
    <div
      id="warp-overlay-hud"
      className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center p-6"
    >
      {/* Central Minimalist HUD Alert */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.15, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg p-6 sm:p-8 rounded-2xl hud-glass border border-cyan-400/40 shadow-2xl shadow-cyan-500/20 text-center relative overflow-hidden"
      >
        {/* Hyperspace flash bar */}
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all duration-75"
          style={{ width: `${percent}%` }}
        />

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 font-mono text-xs tracking-widest uppercase mb-4 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>ALCUBIERRE DRIVE ACTIVE</span>
        </div>

        {/* Primary Prompt Headline */}
        <h2 className="font-mono text-lg sm:text-2xl font-bold tracking-widest text-white uppercase mb-2">
          WARP DRIVE ENGAGED
        </h2>

        <p className="font-serif italic text-2xl sm:text-3xl text-cyan-200 font-light mb-6">
          Destination: {targetDestination.name}
        </p>

        {/* Telemetry Metrics During Warp */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/10 font-mono text-xs text-left mb-6">
          <div>
            <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
              WARP FACTOR
            </span>
            <span className="text-cyan-300 font-semibold text-sm">
              WARP {warpFactor}c
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] tracking-wider uppercase">
              DISTANCE REMAINING
            </span>
            <span className="text-slate-200 font-semibold text-sm">
              {targetDestination.distanceFromEarth}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400 animate-spin" />
              Hyperspace Vector
            </span>
            <span>{percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-75"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
