import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Heart, Sparkles, Send, Check } from 'lucide-react';
import { CelestialDestination } from '../../types';

interface StoryModalProps {
  destination: CelestialDestination;
  isOpen: boolean;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  destination,
  isOpen,
  onClose,
}) => {
  const [personalNote, setPersonalNote] = useState<string>(() => {
    return localStorage.getItem(`starlight_note_${destination.id}`) || '';
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    localStorage.setItem(`starlight_note_${destination.id}`, personalNote);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div
      id="story-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl hud-glass rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="close-story-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
          <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
          <span>EXPEDITION LOGBOOK // {destination.name}</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal mb-2">
          {destination.name}
        </h2>

        <p className="font-serif italic text-lg sm:text-xl text-cyan-200/90 font-light mb-6">
          &ldquo;{destination.poeticCaption}&rdquo;
        </p>

        {/* Extended Narrative */}
        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3 mb-6 font-sans text-slate-300 text-sm sm:text-base leading-relaxed font-light">
          <p>{destination.extendedStory}</p>
        </div>

        {/* Personal Stargazer Note */}
        <div className="border-t border-white/10 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="stargazer-note-input"
              className="font-mono text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Captain&apos;s Personal Stargazer Dedication
            </label>
            {isSaved && (
              <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Transmitted to ship archives
              </span>
            )}
          </div>

          <textarea
            id="stargazer-note-input"
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Write a personal romantic note or memory to accompany this world..."
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 resize-none font-sans font-light"
          />

          <div className="flex justify-end">
            <button
              id="save-stargazer-note-btn"
              onClick={handleSaveNote}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Log Note</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
