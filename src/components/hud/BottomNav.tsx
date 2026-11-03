import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Compass, RotateCcw } from 'lucide-react';
import { CelestialDestination } from '../../types';

interface BottomNavProps {
  destinations: CelestialDestination[];
  currentIndex: number;
  onSelectDestination: (index: number) => void;
  onOpenConstellation?: () => void;
  isWarping: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  destinations,
  currentIndex,
  onSelectDestination,
  onOpenConstellation,
  isWarping,
}) => {
  const current = destinations[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === destinations.length - 1;
  const nextDestination = !isLast ? destinations[currentIndex + 1] : null;

  const handlePrevious = () => {
    if (currentIndex > 0 && !isWarping) {
      onSelectDestination(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isWarping) {
      if (isLast) {
        onSelectDestination(0); // Return home to Earth or cycle
      } else {
        onSelectDestination(currentIndex + 1);
      }
    }
  };

  return (
    <div
      id="bottom-navigation-bar"
      className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      {/* Back Button */}
      <div className="pointer-events-auto w-full sm:w-auto flex justify-between sm:justify-start">
        <button
          id="nav-back-button"
          onClick={handlePrevious}
          disabled={isFirst || isWarping}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full hud-glass-interactive font-mono text-xs tracking-wider transition-all ${
            isFirst || isWarping
              ? 'opacity-30 cursor-not-allowed text-slate-500'
              : 'text-slate-200 hover:text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREVIOUS SECTOR</span>
        </button>
      </div>

      {/* Progress Pagination Dots */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full hud-glass">
        {destinations.map((dest, idx) => {
          const isActive = idx === currentIndex;
          const isNext = idx === currentIndex + 1;
          const isVisited = idx <= currentIndex;

          let badgeLabel = 'DESTINATION';
          let badgeColorClass = 'text-slate-400';

          if (isActive) {
            badgeLabel = 'CURRENT ORBIT';
            badgeColorClass = 'text-emerald-400';
          } else if (isNext) {
            badgeLabel = 'NEXT JUMP';
            badgeColorClass = 'text-cyan-300 font-semibold animate-pulse';
          } else if (idx < currentIndex) {
            badgeLabel = 'EXPLORED SECTOR';
            badgeColorClass = 'text-slate-500';
          } else {
            badgeLabel = `FUTURE SECTOR 0${dest.worldIndex}`;
            badgeColorClass = 'text-indigo-300';
          }

          return (
            <button
              key={dest.id}
              onClick={() => !isWarping && onSelectDestination(idx)}
              disabled={isWarping}
              title={`${dest.worldIndex === 0 ? 'Terra Origin' : `World 0${dest.worldIndex}`}: ${dest.name}`}
              className="group relative flex items-center justify-center p-1 focus:outline-none"
            >
              <div
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-7 sm:w-8 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50'
                    : isNext
                    ? 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover:scale-125'
                    : isVisited
                    ? 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-cyan-600/70 group-hover:bg-cyan-400 group-hover:scale-110'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-700 group-hover:bg-slate-500 group-hover:scale-110'
                }`}
              />

              {/* Anticipation Tooltip on hover */}
              <div
                className={`absolute bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap min-w-[130px] p-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border ${
                  isNext
                    ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                    : isActive
                    ? 'border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                    : 'border-white/15 shadow-2xl'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: dest.themeColor }}
                  />
                  <span className={`font-mono text-[9px] tracking-wider uppercase ${badgeColorClass}`}>
                    {badgeLabel}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white tracking-wide font-serif">
                  {dest.name}
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between gap-3 mt-0.5">
                  <span className="truncate max-w-[110px]">{dest.subtitle}</span>
                  <span className="text-cyan-400/90 text-[9px]">{dest.distanceFromEarth}</span>
                </div>

                {isNext && (
                  <div className="mt-1.5 pt-1 border-t border-cyan-500/20 text-[9px] font-mono text-cyan-300 font-medium flex items-center gap-1">
                    <span>Target Locked</span>
                    <span className="text-slate-400">• Click to jump</span>
                  </div>
                )}

                {/* Bottom Pointer Caret */}
                <div
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-950 border-r border-b ${
                    isNext
                      ? 'border-cyan-400/60'
                      : isActive
                      ? 'border-emerald-500/40'
                      : 'border-white/15'
                  }`}
                />
              </div>
            </button>
          );
        })}

        {onOpenConstellation && (
          <div className="flex items-center pl-1 border-l border-white/10 ml-0.5">
            <button
              id="pagination-constellation-btn"
              onClick={onOpenConstellation}
              disabled={isWarping}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all focus:outline-none"
              title="Open Constellation Star Map"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic CTA Button: Set course: [Next Planet] -> */}
      <div className="pointer-events-auto w-full sm:w-auto flex justify-end">
        <button
          id="nav-next-cta-button"
          onClick={handleNext}
          disabled={isWarping}
          className={`group flex items-center gap-3 px-6 py-3 rounded-full font-mono text-xs font-semibold tracking-widest uppercase transition-all duration-300 shadow-xl ${
            isWarping
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              : isLast
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:scale-105 active:scale-95'
          }`}
        >
          {isLast ? (
            <>
              <RotateCcw className="w-4 h-4 text-pink-200 group-hover:-rotate-90 transition-transform" />
              <span>Restart Odyssey</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
              <span>Set course: {nextDestination?.name}</span>
              <ChevronRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
