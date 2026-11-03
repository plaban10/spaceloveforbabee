import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Gauge,
  Thermometer,
  Wind,
  Shield,
  Clock,
  Eye,
  Activity,
  Radio,
} from 'lucide-react';
import { CelestialDestination, CameraMode } from '../../types';
import { ambientAudio } from '../../audio/ambientAudio';

interface TelemetryHUDProps {
  destination: CelestialDestination;
  missionSeconds: number;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  isWarping: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  destination,
  missionSeconds,
  cameraMode,
  onCameraModeChange,
  isWarping,
}) => {
  const [audioActive, setAudioActive] = useState<boolean>(ambientAudio.getIsPlaying());
  const [distanceJitter, setDistanceJitter] = useState<number>(0);
  const [isExpandedMobile, setIsExpandedMobile] = useState<boolean>(false);

  // Subtle real-time telemetry drift for realistic live sensor feel
  useEffect(() => {
    const interval = setInterval(() => {
      setDistanceJitter((Math.random() - 0.5) * 4);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const toggleAudio = () => {
    const active = ambientAudio.toggle();
    setAudioActive(active);
  };

  // Format Mission Elapsed Time (MET)
  const formatMET = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `MET ${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden absolute top-28 right-4 z-20 pointer-events-auto">
        <button
          id="toggle-telemetry-mobile-btn"
          onClick={() => setIsExpandedMobile(!isExpandedMobile)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hud-glass-interactive text-xs font-mono text-cyan-300"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isExpandedMobile ? 'HIDE HUD' : 'TELEMETRY'}</span>
        </button>
      </div>

      {/* Primary Telemetry Panel */}
      <motion.aside
        id="flight-telemetry-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className={`absolute top-24 right-4 sm:right-6 md:right-8 z-20 w-72 sm:w-80 hud-glass rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4 pointer-events-auto transition-all duration-300 ${
          isExpandedMobile ? 'block' : 'hidden md:block'
        }`}
      >
        {/* Ship ID & Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="font-mono text-xs font-bold tracking-widest text-white block">
                S.S. STARLIGHT
              </span>
              <span className="font-mono text-[10px] text-slate-400 tracking-wider">
                FLAGSHIP EXPLORER
              </span>
            </div>
          </div>

          {/* Ambient Audio Toggle */}
          <button
            id="hud-audio-toggle-btn"
            onClick={toggleAudio}
            title={audioActive ? 'Mute Celestial Audio' : 'Play Celestial Audio'}
            className={`p-2 rounded-xl border transition-all ${
              audioActive
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 glow-blue'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {audioActive ? (
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mission Elapsed Time */}
        <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>FLIGHT DURATION</span>
          </div>
          <span className="text-cyan-200 font-semibold tracking-wider">
            {formatMET(missionSeconds)}
          </span>
        </div>

        {/* Real-time Distance Readout */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-indigo-950/30 p-3.5 rounded-xl border border-cyan-500/20">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase block mb-0.5">
            CALCULATED DISTANCE FROM TERRA
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white flex items-baseline gap-1">
            <span>
              {destination.distanceKmNumeric === 0
                ? '0'
                : (destination.distanceKmNumeric + distanceJitter).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 }
                  )}
            </span>
            <span className="text-xs font-normal text-slate-400 font-sans">
              {destination.distanceKmNumeric > 10000000000 ? 'km (Deep Space)' : 'km'}
            </span>
          </div>
        </div>

        {/* Planetary Diagnostics Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {/* Orbital Speed */}
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>ORBIT VELOCITY</span>
            </div>
            <div className="text-slate-200 font-semibold truncate">
              {destination.orbitalVelocity}
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>TEMPERATURE</span>
            </div>
            <div className="text-slate-200 font-semibold truncate">
              {destination.temperature}
            </div>
          </div>

          {/* Atmosphere */}
          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5 col-span-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Wind className="w-3 h-3 text-blue-400" />
              <span>ATMOSPHERE PROFILE</span>
            </div>
            <div className="text-slate-200 font-medium text-[11px] truncate">
              {destination.atmosphere}
            </div>
          </div>
        </div>

        {/* Sub-Systems Integrity */}
        <div className="space-y-1.5 pt-1 border-t border-white/10 font-mono text-[10px]">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              Hull Deflector Shield
            </span>
            <span className="text-emerald-400 font-semibold">100% NOMINAL</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-full" />
          </div>
        </div>

        {/* Camera View Selector */}
        <div className="pt-2 border-t border-white/10">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block mb-1.5">
            VIEWPORT ANGLE
          </span>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
            {(['orbit', 'cockpit', 'flyby'] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onCameraModeChange(mode)}
                disabled={isWarping}
                className={`py-1.5 rounded-lg border uppercase tracking-wider transition-all ${
                  cameraMode === mode
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </motion.aside>
    </>
  );
};
