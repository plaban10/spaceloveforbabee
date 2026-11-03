import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { ambientAudio } from '../../audio/ambientAudio';

interface IntroOverlayProps {
  onLaunch: () => void;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onLaunch }) => {
  const [step, setStep] = useState<number>(0);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Sequential text reveal pacing
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 3200);
    const t3 = setTimeout(() => setStep(3), 5800);
    const t4 = setTimeout(() => setStep(4), 7800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleLaunchClick = () => {
    if (!audioEnabled) {
      ambientAudio.toggle();
      setAudioEnabled(true);
    }
    onLaunch();
  };

  const toggleSound = () => {
    const isPlaying = ambientAudio.toggle();
    setAudioEnabled(isPlaying);
  };

  return (
    <div
      id="intro-overlay-container"
      className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 md:p-12"
    >
      {/* Top Bar Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="flex justify-between items-center w-full"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse glow-blue" />
          <span className="font-mono text-xs tracking-widest text-slate-300 uppercase">
            S.S. STARLIGHT // EXPEDITION 01
          </span>
        </div>

        <button
          id="intro-audio-toggle-btn"
          onClick={toggleSound}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full hud-glass-interactive text-xs font-mono tracking-wider text-slate-300"
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>AUDIO ACTIVE</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              <span>ENABLE AUDIO</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Center Cinematic Typography */}
      <div className="my-auto max-w-3xl mx-auto text-center px-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-serif text-3xl sm:text-5xl md:text-6xl text-slate-100 font-light italic tracking-wide">
                &ldquo;She asked me to take her out...&rdquo;
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-serif text-3xl sm:text-5xl md:text-6xl text-cyan-100 font-light tracking-wide">
                &ldquo;...so I built us a ship instead.&rdquo;
              </p>
            </motion.div>
          )}

          {step >= 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full hud-glass border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interplanetary Romance Protocol</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white font-normal tracking-tight leading-tight">
                Seven worlds. One trip. <span className="italic font-light text-cyan-200">Ready?</span>
              </h1>

              <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base font-sans font-light leading-relaxed">
                Step aboard the S.S. Starlight. An intimate cosmic voyage across the Moon, Venus,
                Mars, Jupiter, Saturn, Neptune, and the deep unknown.
              </p>

              {/* Primary Action Button */}
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="pt-4"
                >
                  <button
                    id="initiate-launch-button"
                    onClick={handleLaunchClick}
                    className="pointer-events-auto group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-mono text-sm tracking-widest uppercase font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <Rocket className="w-4 h-4 text-cyan-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                    <span>Initiate Launch</span>
                    <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-25 pointer-events-none" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="text-center w-full"
      >
        <p className="font-mono text-xs text-slate-500 tracking-widest uppercase">
          [ Drag to inspect Earth • Scroll to adjust orbital distance ]
        </p>
      </motion.div>
    </div>
  );
};
