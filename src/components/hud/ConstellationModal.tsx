import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Compass, Sparkles, Orbit, ChevronRight, Zap, Crosshair, Globe } from 'lucide-react';
import { CelestialDestination } from '../../types';

interface ConstellationModalProps {
  destinations: CelestialDestination[];
  currentDestinationIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (index: number) => void;
  isWarping: boolean;
}

interface ConstellationNode {
  destination: CelestialDestination;
  index: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  bayerDesignation: string;
  spectralClass: string;
  rightAscension: string;
  declination: string;
  apparentMagnitude: string;
}

export const ConstellationModal: React.FC<ConstellationModalProps> = ({
  destinations,
  currentDestinationIndex,
  isOpen,
  onClose,
  onSelectDestination,
  isWarping,
}) => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(currentDestinationIndex);
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);

  // Sync selected node with current destination on open
  useEffect(() => {
    if (isOpen) {
      setSelectedNodeIndex(currentDestinationIndex);
    }
  }, [isOpen, currentDestinationIndex]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Constellation coordinate mapping across the sky chart
  const constellationNodes: ConstellationNode[] = useMemo(() => {
    const coords = [
      { x: 14, y: 72, bayer: 'α-Terrana', spec: 'G2V Planetary', ra: '04h 18m', dec: '+16° 32\'', mag: '-26.74' },
      { x: 25, y: 48, bayer: 'β-Selene', spec: 'Satellite Core', ra: '06h 44m', dec: '+24° 18\'', mag: '-12.74' },
      { x: 38, y: 64, bayer: 'γ-Cytherea', spec: 'Dense Auric', ra: '09h 12m', dec: '+12° 54\'', mag: '-4.60' },
      { x: 49, y: 34, bayer: 'δ-Ares', spec: 'Rust Horizon', ra: '12h 28m', dec: '+32° 11\'', mag: '-2.91' },
      { x: 62, y: 56, bayer: 'ε-Joviana', spec: 'Gas Sovereign', ra: '15h 54m', dec: '-04° 19\'', mag: '-2.94' },
      { x: 73, y: 32, bayer: 'ζ-Kronos', spec: 'Ringed Gem', ra: '18h 22m', dec: '+21° 04\'', mag: '+0.20' },
      { x: 84, y: 62, bayer: 'η-Neptuni', spec: 'Azure Edge', ra: '21h 38m', dec: '-14° 48\'', mag: '+7.78' },
      { x: 92, y: 22, bayer: 'θ-Aeterna', spec: 'Interstellar Void', ra: '23h 58m', dec: '+48° 12\'', mag: '-0.10' },
    ];

    return destinations.map((dest, idx) => {
      const coord = coords[idx] || {
        x: 10 + idx * 11,
        y: 50 + (idx % 2 === 0 ? 15 : -15),
        bayer: `Node-0${idx}`,
        spec: 'Stellar Body',
        ra: `${idx * 3}h 00m`,
        dec: '+00° 00\'',
        mag: '+0.00',
      };

      return {
        destination: dest,
        index: idx,
        x: coord.x,
        y: coord.y,
        bayerDesignation: coord.bayer,
        spectralClass: coord.spec,
        rightAscension: coord.ra,
        declination: coord.dec,
        apparentMagnitude: coord.mag,
      };
    });
  }, [destinations]);

  // Background deep sky decorative stars
  const backgroundStars = useMemo(() => {
    const stars = [];
    for (let i = 0; i < 75; i++) {
      stars.push({
        id: i,
        x: (i * 37) % 98 + 1,
        y: (i * 61) % 94 + 3,
        r: (i % 3) * 0.6 + 0.8,
        opacity: 0.2 + (i % 5) * 0.15,
        pulseDelay: (i % 6) * 0.7,
      });
    }
    return stars;
  }, []);

  if (!isOpen) return null;

  const activeNode = constellationNodes[selectedNodeIndex] || constellationNodes[0];
  const activeDest = activeNode.destination;
  const isCurrentOrbit = activeNode.index === currentDestinationIndex;

  const handleJumpToSelected = () => {
    if (!isWarping && !isCurrentOrbit) {
      onSelectDestination(activeNode.index);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        id="constellation-map-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-2xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-full max-w-6xl h-[92vh] max-h-[820px] rounded-3xl bg-[#040711] border border-cyan-500/25 shadow-[0_0_80px_rgba(6,182,212,0.18)] flex flex-col overflow-hidden"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] sm:text-xs text-cyan-400 font-semibold tracking-widest uppercase">
                    CELESTIAL ASTRONOMICAL CHART
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    VOYAGER ASTERISM // 7 DESTINATIONS
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl text-white font-normal tracking-wide">
                  The Odyssey Constellation
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>Current Orbit</span>
                </span>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span>Jump Available</span>
                </span>
              </div>

              <button
                id="close-constellation-modal-btn"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 hover:border-white/30 transition-all focus:outline-none"
                title="Close Star Map (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Body: Star Map Canvas + Telemetry Sidebar */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Left/Center: Sky Dome Projection */}
            <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.9)_0%,#030611_100%)] select-none">
              {/* Grid Lines: Celestial Coordinate Spheres */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                {/* Declination parallels */}
                <ellipse cx="50%" cy="50%" rx="46%" ry="44%" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="3,6" />
                <ellipse cx="50%" cy="50%" rx="36%" ry="33%" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,4" />
                <ellipse cx="50%" cy="50%" rx="24%" ry="22%" fill="none" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,4" />
                {/* Celestial axes */}
                <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="4,8" />
                <line x1="50%" y1="6%" x2="50%" y2="94%" stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="4,8" />
                {/* Diagonal celestial meridian arcs */}
                <line x1="18%" y1="18%" x2="82%" y2="82%" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,6" />
                <line x1="18%" y1="82%" x2="82%" y2="18%" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="2,6" />
              </svg>

              {/* Background Stars Field */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {backgroundStars.map((s) => (
                  <circle
                    key={s.id}
                    cx={`${s.x}%`}
                    cy={`${s.y}%`}
                    r={s.r}
                    fill="#ffffff"
                    opacity={s.opacity}
                  />
                ))}
              </svg>

              {/* Luminous Constellation Lines Vector Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <linearGradient id="constellationGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
                  </linearGradient>
                  <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer halo line for glow */}
                <polyline
                  points={constellationNodes.map((n) => `${n.x * 0.01 * 100}%,${n.y * 0.01 * 100}%`).join(' ')}
                  fill="none"
                  stroke="url(#constellationGlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#lineGlow)"
                  opacity="0.6"
                />

                {/* Core bright filament line */}
                <polyline
                  points={constellationNodes.map((n) => `${n.x * 0.01 * 100}%,${n.y * 0.01 * 100}%`).join(' ')}
                  fill="none"
                  stroke="#e0f2fe"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6,3"
                  opacity="0.85"
                />

                {/* Secondary astronomical cross-link lines for authentic constellation pattern */}
                <line
                  x1={`${constellationNodes[1].x}%`}
                  y1={`${constellationNodes[1].y}%`}
                  x2={`${constellationNodes[3].x}%`}
                  y2={`${constellationNodes[3].y}%`}
                  stroke="#38bdf8"
                  strokeWidth="0.7"
                  strokeDasharray="2,4"
                  opacity="0.3"
                />
                <line
                  x1={`${constellationNodes[3].x}%`}
                  y1={`${constellationNodes[3].y}%`}
                  x2={`${constellationNodes[5].x}%`}
                  y2={`${constellationNodes[5].y}%`}
                  stroke="#818cf8"
                  strokeWidth="0.7"
                  strokeDasharray="2,4"
                  opacity="0.3"
                />
                <line
                  x1={`${constellationNodes[4].x}%`}
                  y1={`${constellationNodes[4].y}%`}
                  x2={`${constellationNodes[6].x}%`}
                  y2={`${constellationNodes[6].y}%`}
                  stroke="#c084fc"
                  strokeWidth="0.7"
                  strokeDasharray="2,4"
                  opacity="0.3"
                />
              </svg>

              {/* Celestial Coordinate Labels */}
              <div className="absolute top-3 left-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest pointer-events-none">
                RA 00h • +60° DEC
              </div>
              <div className="absolute bottom-3 left-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest pointer-events-none">
                RA 00h • -60° DEC
              </div>
              <div className="absolute top-3 right-4 font-mono text-[9px] text-slate-500 uppercase tracking-widest pointer-events-none">
                RA 24h • +60° DEC
              </div>

              {/* Star Nodes (Interactive Buttons) */}
              <div className="absolute inset-0 z-20">
                {constellationNodes.map((node) => {
                  const isCurrent = node.index === currentDestinationIndex;
                  const isSelected = node.index === selectedNodeIndex;
                  const isHovered = node.index === hoveredNodeIndex;
                  const isNext = node.index === currentDestinationIndex + 1;

                  return (
                    <div
                      key={node.destination.id}
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute"
                    >
                      {/* Active Orbit Reticle Rings */}
                      {isCurrent && (
                        <div className="absolute -inset-4 pointer-events-none flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border border-emerald-400/40 animate-ping opacity-30" />
                          <div className="absolute w-9 h-9 rounded-full border border-emerald-400/80 animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                      )}

                      {/* Selected Node Halo Ring */}
                      {isSelected && !isCurrent && (
                        <div className="absolute -inset-3 pointer-events-none flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-cyan-400/60 animate-pulse" />
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedNodeIndex(node.index)}
                        onMouseEnter={() => setHoveredNodeIndex(node.index)}
                        onMouseLeave={() => setHoveredNodeIndex(null)}
                        className={`group relative flex items-center justify-center transition-transform duration-200 focus:outline-none ${
                          isSelected ? 'scale-125' : 'hover:scale-115'
                        }`}
                        title={`${node.destination.name} (${node.bayerDesignation}) - Click to inspect or jump`}
                      >
                        {/* Outer Glow Disc */}
                        <div
                          className={`w-7 h-7 rounded-full transition-all duration-300 ${
                            isCurrent
                              ? 'bg-emerald-400/25 shadow-[0_0_20px_rgba(52,211,153,0.8)]'
                              : isSelected
                              ? 'bg-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                              : isNext
                              ? 'bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                              : 'bg-white/10 group-hover:bg-white/25'
                          }`}
                        />

                        {/* Center Star Core */}
                        <div
                          className={`absolute rounded-full transition-all ${
                            isCurrent
                              ? 'w-3 h-3 bg-emerald-300 shadow-[0_0_10px_#34d399]'
                              : isSelected
                              ? 'w-3 h-3 bg-cyan-200 shadow-[0_0_10px_#38bdf8]'
                              : 'w-2.5 h-2.5 bg-white group-hover:w-3 group-hover:h-3'
                          }`}
                          style={{
                            backgroundColor: isCurrent ? '#34d399' : node.destination.themeColor,
                          }}
                        />

                        {/* Node Label Floating Below */}
                        <div
                          className={`absolute top-8 pointer-events-none whitespace-nowrap flex flex-col items-center transition-all ${
                            isSelected || isHovered
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-70 group-hover:opacity-100'
                          }`}
                        >
                          <span
                            className={`font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-black/70 border ${
                              isCurrent
                                ? 'text-emerald-300 border-emerald-500/40'
                                : isSelected
                                ? 'text-cyan-300 border-cyan-400/50'
                                : 'text-slate-200 border-white/10'
                            }`}
                          >
                            {node.destination.name}
                          </span>
                          <span className="font-mono text-[8px] text-slate-400 tracking-tight mt-0.5">
                            {node.bayerDesignation}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Destination Sector Strip */}
              <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-auto flex items-center justify-center gap-1.5 overflow-x-auto py-1">
                {constellationNodes.map((node) => {
                  const isCurrent = node.index === currentDestinationIndex;
                  const isSelected = node.index === selectedNodeIndex;

                  return (
                    <button
                      key={node.destination.id}
                      onClick={() => setSelectedNodeIndex(node.index)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[10px] whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : isCurrent
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-black/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/30'
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: node.destination.themeColor }}
                      />
                      <span>{node.destination.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Star Telemetry & Jump Console */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-950/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Sector Classification Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: activeDest.themeColor }}
                      />
                      <span className="font-mono text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">
                        {activeDest.worldIndex === 0
                          ? 'ORIGIN STATION'
                          : `SECTOR WORLD 0${activeDest.worldIndex} // 07`}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-white font-normal mt-0.5">
                      {activeDest.name}
                    </h3>
                  </div>

                  {isCurrentOrbit ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>IN ORBIT</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
                      {activeNode.bayerDesignation}
                    </span>
                  )}
                </div>

                {/* Romantic Caption */}
                <p className="font-serif italic text-sm text-slate-300 leading-relaxed mb-4">
                  &ldquo;{activeDest.poeticCaption}&rdquo;
                </p>

                {/* Astronomical Star Chart Coordinates */}
                <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 font-mono text-xs space-y-2">
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    <span>STELLAR ASTROMETRY</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">RIGHT ASCENSION</span>
                      <span className="text-slate-200 font-medium">{activeNode.rightAscension}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">DECLINATION</span>
                      <span className="text-slate-200 font-medium">{activeNode.declination}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">APPARENT MAGNITUDE</span>
                      <span className="text-amber-300 font-medium">{activeNode.apparentMagnitude}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">SPECTRAL CLASSIFICATION</span>
                      <span className="text-indigo-300 font-medium">{activeNode.spectralClass}</span>
                    </div>
                  </div>
                </div>

                {/* Planetary Physical Parameters */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[9px]">DISTANCE FROM TERRA</span>
                    <span className="text-white font-medium text-[11px] truncate block">
                      {activeDest.distanceFromEarth}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[9px]">EQUATORIAL DIAMETER</span>
                    <span className="text-white font-medium text-[11px]">
                      {activeDest.diameter}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[9px]">ATMOSPHERIC DENSITY</span>
                    <span className="text-white font-medium text-[11px] truncate block">
                      {activeDest.atmosphere}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-slate-400 block text-[9px]">SURFACE GRAVITY</span>
                    <span className="text-white font-medium text-[11px]">
                      {activeDest.gravity}
                    </span>
                  </div>
                </div>

                {/* Narrative Excerpt */}
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-3">
                  {activeDest.extendedStory}
                </p>
              </div>

              {/* Action Jump Button Deck */}
              <div className="pt-4 border-t border-white/10 mt-4">
                {isCurrentOrbit ? (
                  <div className="w-full py-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold text-center flex items-center justify-center gap-2">
                    <Orbit className="w-4 h-4 text-emerald-400" />
                    <span>SPACESHIP CURRENTLY IN STABLE ORBIT</span>
                  </div>
                ) : (
                  <button
                    id="constellation-jump-action-btn"
                    onClick={handleJumpToSelected}
                    disabled={isWarping}
                    className="w-full group py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 text-cyan-200 group-hover:scale-125 transition-transform" />
                    <span>ENGAGE HYPERSPACE JUMP: {activeDest.name}</span>
                    <ChevronRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
                  <span>ESC KEY TO DISMISS</span>
                  <span>STARLIGHT VECTOR LOCK ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
