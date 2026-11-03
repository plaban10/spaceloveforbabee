import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { DESTINATIONS } from './data/destinations';
import { FlightPhase, CameraMode } from './types';
import { SpaceCanvas } from './components/canvas/SpaceCanvas';
import { IntroOverlay } from './components/hud/IntroOverlay';
import { WarpOverlay } from './components/hud/WarpOverlay';
import { TopHeader } from './components/hud/TopHeader';
import { TelemetryHUD } from './components/hud/TelemetryHUD';
import { BottomNav } from './components/hud/BottomNav';
import { StoryModal } from './components/hud/StoryModal';
import { ConstellationModal } from './components/hud/ConstellationModal';
import { ambientAudio } from './audio/ambientAudio';

export default function App() {
  const [currentDestIndex, setCurrentDestIndex] = useState<number>(0);
  const [targetDestIndex, setTargetDestIndex] = useState<number>(0);
  const [flightPhase, setFlightPhase] = useState<FlightPhase>('intro');
  const [warpProgress, setWarpProgress] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');
  const [missionSeconds, setMissionSeconds] = useState<number>(0);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [isConstellationOpen, setIsConstellationOpen] = useState<boolean>(false);

  const warpAnimRef = useRef<number | null>(null);
  const missionTimerRef = useRef<number | null>(null);

  // Mission Elapsed Time timer starting once launched
  useEffect(() => {
    if (flightPhase !== 'intro') {
      missionTimerRef.current = window.setInterval(() => {
        setMissionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (missionTimerRef.current) clearInterval(missionTimerRef.current);
    };
  }, [flightPhase]);

  // Initiate Warp Transition to Target Destination
  const triggerWarpTo = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentDestIndex && flightPhase !== 'intro') return;

      setTargetDestIndex(targetIndex);
      setFlightPhase('warp');
      setWarpProgress(0);

      // Trigger Web Audio API warp sound
      ambientAudio.triggerWarpSound();

      const durationMs = 2800;
      const startTime = performance.now();

      const stepWarp = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        setWarpProgress(progress);

        // Mid-warp (progress ~ 0.5): switch celestial body while tunnel is at peak opacity
        if (progress >= 0.5 && currentDestIndex !== targetIndex) {
          setCurrentDestIndex(targetIndex);
        }

        if (progress < 1) {
          warpAnimRef.current = requestAnimationFrame(stepWarp);
        } else {
          // Exit warp into steady orbit
          setFlightPhase('orbit');
          setWarpProgress(0);
          warpAnimRef.current = null;
        }
      };

      warpAnimRef.current = requestAnimationFrame(stepWarp);
    },
    [currentDestIndex, flightPhase]
  );

  // Handle Intro Launch: Launch from Earth (index 0) to World 01: The Moon (index 1)
  const handleLaunch = () => {
    triggerWarpTo(1);
  };

  const handleSelectDestination = (targetIndex: number) => {
    triggerWarpTo(targetIndex);
  };

  const currentDestination = DESTINATIONS[currentDestIndex];
  const targetDestination = DESTINATIONS[targetDestIndex];

  return (
    <main
      id="space-odyssey-app"
      className="relative w-screen h-screen overflow-hidden bg-black text-white"
    >
      {/* 3D WebGL Canvas Layer */}
      <SpaceCanvas
        currentDestination={currentDestination}
        isWarping={flightPhase === 'warp'}
        warpProgress={warpProgress}
        cameraMode={cameraMode}
      />

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)] z-10" />

      {/* 1. INTRO & LANDING PHASE */}
      <AnimatePresence>
        {flightPhase === 'intro' && (
          <IntroOverlay onLaunch={handleLaunch} />
        )}
      </AnimatePresence>

      {/* 2. WARP SPEED TRANSITION EFFECT */}
      <AnimatePresence>
        {flightPhase === 'warp' && (
          <WarpOverlay
            targetDestination={targetDestination}
            progress={warpProgress}
          />
        )}
      </AnimatePresence>

      {/* 3. PLANETARY DASHBOARD & HUD OVERLAY (ORBIT PHASE) */}
      {flightPhase !== 'intro' && (
        <>
          {/* Top Header Typography & Captions */}
          <TopHeader
            destination={currentDestination}
            onOpenStory={() => setIsStoryModalOpen(true)}
            onOpenConstellation={() => setIsConstellationOpen(true)}
          />

          {/* Right Telemetry Panel */}
          <TelemetryHUD
            destination={currentDestination}
            missionSeconds={missionSeconds}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            isWarping={flightPhase === 'warp'}
          />

          {/* Bottom Navigation Bar */}
          <BottomNav
            destinations={DESTINATIONS}
            currentIndex={currentDestIndex}
            onSelectDestination={handleSelectDestination}
            onOpenConstellation={() => setIsConstellationOpen(true)}
            isWarping={flightPhase === 'warp'}
          />
        </>
      )}

      {/* Captain's Log / Romantic Story Modal */}
      <StoryModal
        destination={currentDestination}
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
      />

      {/* Constellation Astrometric Star-Map Modal */}
      <ConstellationModal
        destinations={DESTINATIONS}
        currentDestinationIndex={currentDestIndex}
        isOpen={isConstellationOpen}
        onClose={() => setIsConstellationOpen(false)}
        onSelectDestination={handleSelectDestination}
        isWarping={flightPhase === 'warp'}
      />
    </main>
  );
}
