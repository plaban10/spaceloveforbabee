import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Sparkles, Compass } from 'lucide-react';
import { CelestialDestination } from '../../types';

interface TopHeaderProps {
  destination: CelestialDestination;
  onOpenStory: () => void;
  onOpenConstellation: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  destination,
  onOpenStory,
  onOpenConstellation,
}) => {
  const worldIndexString =
    destination.worldIndex === 0
      ? 'DEPARTURE ORIGIN'
      : `WORLD 0${destination.worldIndex} // 07`;

  return (
    <div
      id="top-header-hud"
      className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      {/* Title & Romantic Poetic Caption */}
      <motion.div
        key={destination.id}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl"
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: destination.themeColor }}
          />
          <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
            {worldIndexString}
          </span>
          <span className="text-slate-600 font-mono text-xs">•</span>
          <span className="font-mono text-xs tracking-wider text-slate-400">
            {destination.subtitle}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight">
          {destination.name}
        </h1>

        <p className="font-serif italic text-base sm:text-xl md:text-2xl text-slate-300 font-light mt-1.5 tracking-wide leading-relaxed">
          &ldquo;{destination.poeticCaption}&rdquo;
        </p>
      </motion.div>

      {/* Actions: Captain's Log & Constellation Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="pointer-events-auto self-start md:self-auto flex items-center gap-2.5 flex-wrap"
      >
        <button
          id="open-constellation-map-btn"
          onClick={onOpenConstellation}
          className="flex items-center gap-2 px-4 py-2 rounded-full hud-glass-interactive text-xs font-mono tracking-wider text-slate-200 group border border-cyan-500/30 hover:border-cyan-400/70 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all"
          title="Open Astrometric Constellation Sky Chart"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span>CONSTELLATION MAP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        </button>

        <button
          id="open-captain-log-btn"
          onClick={onOpenStory}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full hud-glass-interactive text-xs font-mono tracking-wider text-slate-200 group"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>CAPTAIN&apos;S LOG</span>
          <Sparkles className="w-3 h-3 text-amber-300 opacity-60 group-hover:opacity-100" />
        </button>
      </motion.div>
    </div>
  );
};
