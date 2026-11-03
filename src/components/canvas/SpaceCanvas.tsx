import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Sun, Pause, Play, RotateCw, Compass, Sparkles, X } from 'lucide-react';
import { CelestialDestination, CameraMode } from '../../types';
import { createPlanetMesh, PlanetMeshController } from './PlanetMesh';
import { createSpaceship, SpaceshipController } from './SpaceshipMesh';
import { createStarfield, StarfieldController, StarCluster } from './Starfield';
import { createWarpDriveEffect, WarpDriveController } from './WarpDriveEffect';
import { createEngineTrail, EngineTrailController } from './EngineTrail';
import { createOrbitalTrail, OrbitalTrailController } from './OrbitalTrail';
import { planetRotationAudio } from '../../audio/rotationAudio';

interface SpaceCanvasProps {
  currentDestination: CelestialDestination;
  isWarping: boolean;
  warpProgress: number; // 0 to 1
  cameraMode: CameraMode;
  onCanvasReady?: () => void;
}

export const SpaceCanvas: React.FC<SpaceCanvasProps> = ({
  currentDestination,
  isWarping,
  warpProgress,
  cameraMode,
  onCanvasReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);

  // Entities
  const starfieldCtrlRef = useRef<StarfieldController | null>(null);
  const warpCtrlRef = useRef<WarpDriveController | null>(null);
  const spaceshipCtrlRef = useRef<SpaceshipController | null>(null);
  const planetCtrlRef = useRef<PlanetMeshController | null>(null);
  const engineTrailCtrlRef = useRef<EngineTrailController | null>(null);
  const orbitalTrailCtrlRef = useRef<OrbitalTrailController | null>(null);

  // Deep Space Focus State
  const [focusedCluster, setFocusedCluster] = useState<StarCluster | null>(null);
  const [isFocusingSpace, setIsFocusingSpace] = useState<boolean>(false);
  const deepFocusProgressRef = useRef<number>(0); // 0 (normal) to 1 (max zoom into star cluster)
  const deepFocusTargetRef = useRef<StarCluster | null>(null);
  const deepFocusReturnAnglesRef = useRef<{ theta: number; phi: number; dist: number }>({
    theta: 0.35,
    phi: 1.35,
    dist: 15,
  });

  // Lights & Dynamic Day/Night Cycle
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunSpriteRef = useRef<THREE.Sprite | null>(null);
  const sunPositionRef = useRef(new THREE.Vector3(25, 12, 18));
  const sunDirectionRef = useRef(new THREE.Vector3(25, 12, 18).normalize());

  // Light-Source Rotation state
  const [isSunRotating, setIsSunRotating] = useState<boolean>(true);
  const [sunAngleDeg, setSunAngleDeg] = useState<number>(35);
  const [sunSpeedMultiplier, setSunSpeedMultiplier] = useState<number>(1);
  const isSunRotatingRef = useRef(true);
  const sunOrbitAngleRef = useRef(0.6); // Radians
  const sunRotationSpeedRef = useRef(0.045); // Radians/sec

  // Ship orbit progression around planet
  const shipOrbitAngleRef = useRef<number>(0.4);
  const tempShipWorldPosRef = useRef(new THREE.Vector3());
  const tempShipWorldQuatRef = useRef(new THREE.Quaternion());

  // Interaction / Orbit state
  const isDraggingRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const orbitAnglesRef = useRef({ theta: 0.35, phi: 1.35 });
  const targetAnglesRef = useRef({ theta: 0.35, phi: 1.35 });
  const cameraDistanceRef = useRef(15);
  const targetDistanceRef = useRef(15);

  // Current Destination Ref for loop access
  const destRef = useRef(currentDestination);
  destRef.current = currentDestination;

  // Sync state with refs
  useEffect(() => {
    isSunRotatingRef.current = isSunRotating;
  }, [isSunRotating]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020307);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    camera.position.set(0, 2, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // Attach to DOM
    containerRef.current.replaceChildren(renderer.domElement);

    // 1. Post-Processing Effect Pass (Unreal Bloom Pass for stars & planet bright limb)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.65, // Subtle, cinematic bloom strength
      0.45, // Bloom radius
      0.82 // Bloom threshold: blooms bright stars, specular glints, solar corona, illuminated planet limb
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);
    composerRef.current = composer;

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.8);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Sun directional key light
    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    dirLight.position.copy(sunPositionRef.current);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Distant Solar Disc & Corona Sprite
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 256;
    sunCanvas.height = 256;
    const sCtx = sunCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(128, 128, 4, 128, 128, 128);
    sGrad.addColorStop(0, '#ffffff');
    sGrad.addColorStop(0.12, '#fffdf0');
    sGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.7)');
    sGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.25)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const sunTex = new THREE.CanvasTexture(sunCanvas);
    const sunSpriteMat = new THREE.SpriteMaterial({
      map: sunTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sunSprite = new THREE.Sprite(sunSpriteMat);
    const sunFarPos = sunPositionRef.current.clone().normalize().multiplyScalar(400);
    sunSprite.position.copy(sunFarPos);
    sunSprite.scale.set(65, 65, 1);
    scene.add(sunSprite);
    sunSpriteRef.current = sunSprite;

    // Rim specular light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-20, -10, -15);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // 3. Starfield with Flickering Particle System
    const starfield = createStarfield();
    scene.add(starfield.group);
    starfieldCtrlRef.current = starfield;

    // 4. Warp Drive Tunnel
    const warpDrive = createWarpDriveEffect();
    scene.add(warpDrive.group);
    warpCtrlRef.current = warpDrive;

    // 5. Spaceship
    const spaceship = createSpaceship();
    spaceship.group.position.set(4.8, 0.2, 1.8);
    spaceship.group.rotation.y = -Math.PI / 6;
    scene.add(spaceship.group);
    spaceshipCtrlRef.current = spaceship;

    // 5b. Particle-based Engine Exhaust Trail
    const engineTrail = createEngineTrail();
    scene.add(engineTrail.group);
    engineTrailCtrlRef.current = engineTrail;

    // 5c. Glowing Orbital Path Line Trail
    const orbitalTrail = createOrbitalTrail(destRef.current.themeColor);
    scene.add(orbitalTrail.group);
    orbitalTrailCtrlRef.current = orbitalTrail;

    // 6. Initial Planet
    const planet = createPlanetMesh(destRef.current);
    scene.add(planet.group);
    planetCtrlRef.current = planet;

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth === 0 || newHeight === 0) return;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
        composer.setSize(newWidth, newHeight);
        bloomPass.resolution.set(newWidth, newHeight);
      }
    });
    resizeObserver.observe(containerRef.current);

    // Signal ready
    if (onCanvasReady) onCanvasReady();

    // Animation loop
    let lastTime = performance.now();
    let animFrameId: number;
    let uiThrottleTime = 0;

    const animate = (time: number) => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      uiThrottleTime += delta;

      // 1. Light-source rotation control: rotate sun around planet creating dynamic day/night cycle
      if (isSunRotatingRef.current && !isWarping) {
        sunOrbitAngleRef.current += delta * sunRotationSpeedRef.current * sunSpeedMultiplier;
        if (sunOrbitAngleRef.current > Math.PI * 2) {
          sunOrbitAngleRef.current -= Math.PI * 2;
        }

        // Periodic UI state sync (every ~150ms)
        if (uiThrottleTime > 0.15) {
          uiThrottleTime = 0;
          const deg = Math.round(((sunOrbitAngleRef.current / (Math.PI * 2)) * 360) % 360);
          setSunAngleDeg(deg);
        }
      }

      // Calculate new sun position vector
      const currentSunAngle = sunOrbitAngleRef.current;
      const sunDist = 32;
      const sx = Math.cos(currentSunAngle) * sunDist;
      const sz = Math.sin(currentSunAngle) * sunDist;
      const sy = 9 + Math.sin(currentSunAngle * 0.7) * 4;
      sunPositionRef.current.set(sx, sy, sz);
      sunDirectionRef.current.copy(sunPositionRef.current).normalize();

      if (dirLightRef.current) {
        dirLightRef.current.position.copy(sunPositionRef.current);
      }
      if (sunSpriteRef.current) {
        sunSpriteRef.current.position.copy(sunDirectionRef.current).multiplyScalar(400);
      }

      // 2. Spaceship dynamic orbital path around the planet
      if (!isWarping) {
        // Natural Keplerian orbit progression around planet
        shipOrbitAngleRef.current += delta * 0.16; // gentle, majestic orbit
        const shipOrbitR = currentDestination.radius + 1.8;
        const currentAngle = shipOrbitAngleRef.current;
        // Tilted circular orbit
        const sx = Math.cos(currentAngle) * shipOrbitR;
        const sz = Math.sin(currentAngle) * shipOrbitR;
        const sy = Math.sin(currentAngle * 1.5) * 0.6 + 0.2;

        spaceship.group.position.set(sx, sy, sz);

        // Calculate orbital tangent forward vector so ship noses in the flight direction
        const tangentX = -Math.sin(currentAngle);
        const tangentZ = Math.cos(currentAngle);
        const yaw = Math.atan2(tangentX, tangentZ);
        spaceship.group.rotation.set(0, yaw, 0);
      }

      // Update controllers
      starfield.update(delta, isWarping);
      spaceship.update(delta, isWarping);

      // Get world position and quaternion for engine exhaust trail
      spaceship.group.getWorldPosition(tempShipWorldPosRef.current);
      spaceship.group.getWorldQuaternion(tempShipWorldQuatRef.current);

      if (engineTrailCtrlRef.current) {
        engineTrailCtrlRef.current.update(
          delta,
          tempShipWorldPosRef.current,
          tempShipWorldQuatRef.current,
          isWarping,
          warpProgress
        );
      }

      if (orbitalTrailCtrlRef.current) {
        orbitalTrailCtrlRef.current.update(
          delta,
          tempShipWorldPosRef.current,
          isWarping
        );
      }

      if (planetCtrlRef.current) {
        planetCtrlRef.current.update(delta, sunDirectionRef.current, camera.position);
      }

      // Handle Deep Space Zoom/Focus Animation
      if (deepFocusTargetRef.current) {
        // Smoothly zoom in to focus on star cluster
        deepFocusProgressRef.current = Math.min(1, deepFocusProgressRef.current + delta * 1.8);
      } else if (deepFocusProgressRef.current > 0) {
        // Smoothly return to orbit view
        deepFocusProgressRef.current = Math.max(0, deepFocusProgressRef.current - delta * 1.6);
      }

      // Smooth Orbit Camera Interpolation
      orbitAnglesRef.current.theta += (targetAnglesRef.current.theta - orbitAnglesRef.current.theta) * 0.08;
      orbitAnglesRef.current.phi += (targetAnglesRef.current.phi - orbitAnglesRef.current.phi) * 0.08;
      cameraDistanceRef.current += (targetDistanceRef.current - cameraDistanceRef.current) * 0.08;

      // Idle auto-orbit drift when user isn't dragging and not focusing deep space
      if (!isDraggingRef.current && !isWarping && deepFocusProgressRef.current === 0) {
        targetAnglesRef.current.theta += 0.0006;
      }

      // Camera positioning based on mode
      if (!isWarping) {
        let baseCamX = 0;
        let baseCamY = 2;
        let baseCamZ = 15;
        let lookTarget = new THREE.Vector3(0, 0, 0);

        if (cameraMode === 'orbit') {
          const theta = orbitAnglesRef.current.theta;
          const phi = orbitAnglesRef.current.phi;
          const r = cameraDistanceRef.current;

          baseCamX = r * Math.sin(phi) * Math.sin(theta);
          baseCamY = r * Math.cos(phi);
          baseCamZ = r * Math.sin(phi) * Math.cos(theta);
          lookTarget.set(0.6, 0, 0); // Framed on world center
        } else if (cameraMode === 'cockpit') {
          // Follow just behind spaceship
          const shipPos = spaceship.group.position;
          baseCamX = shipPos.x - 0.2;
          baseCamY = shipPos.y + 0.8;
          baseCamZ = shipPos.z + 3.8;
          lookTarget.copy(shipPos).add(new THREE.Vector3(0, 0, -4));
        } else if (cameraMode === 'flyby') {
          baseCamX = 6.5;
          baseCamY = -1.8;
          baseCamZ = 4.5;
          lookTarget.copy(spaceship.group.position);
        }

        // Apply deep space focus interpolation if active
        if (deepFocusProgressRef.current > 0 && deepFocusTargetRef.current) {
          const focusT = deepFocusProgressRef.current;
          // Smoothstep curve
          const easeT = focusT * focusT * (3 - 2 * focusT);
          const targetCluster = deepFocusTargetRef.current;
          // Zoom towards star cluster position while retaining perspective
          const clusterDir = targetCluster.position.clone().normalize();
          const focusCamPos = clusterDir.clone().multiplyScalar(120);

          camera.position.lerpVectors(new THREE.Vector3(baseCamX, baseCamY, baseCamZ), focusCamPos, easeT);
          const interpolatedLook = new THREE.Vector3().lerpVectors(lookTarget, targetCluster.position, easeT);
          camera.lookAt(interpolatedLook);
        } else {
          camera.position.set(baseCamX, baseCamY, baseCamZ);
          camera.lookAt(lookTarget);
        }
      } else {
        // Procedural camera shake effect when warp drive is engaged
        // Multi-frequency harmonic shake: high-frequency shudder + low-frequency sway
        const warpIntensity = Math.sin(warpProgress * Math.PI); // Peaks in middle of warp
        const t = performance.now() * 0.001;

        const shakeX = (Math.sin(t * 45) * 0.5 + Math.sin(t * 85) * 0.3 + (Math.random() - 0.5) * 0.4) * 0.25 * warpIntensity;
        const shakeY = (Math.cos(t * 52) * 0.5 + Math.cos(t * 92) * 0.3 + (Math.random() - 0.5) * 0.4) * 0.25 * warpIntensity;
        const shakeZ = (Math.sin(t * 38) * 0.3 + (Math.random() - 0.5) * 0.2) * 0.18 * warpIntensity;

        camera.position.set(
          shakeX,
          shakeY,
          8 - warpProgress * 4 + shakeZ
        );
        camera.lookAt(shakeX * 2, shakeY * 2, -100);
      }

      // Render through cinematic Post-Processing Effect Composer pass (Bloom)
      composer.render();
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      if (planetCtrlRef.current) {
        planetCtrlRef.current.destroy();
      }
      if (starfieldCtrlRef.current) {
        starfieldCtrlRef.current.destroy();
      }
      if (engineTrailCtrlRef.current) {
        engineTrailCtrlRef.current.destroy();
      }
      if (orbitalTrailCtrlRef.current) {
        orbitalTrailCtrlRef.current.destroy();
      }
      planetRotationAudio.stop();
      renderer.dispose();
    };
  }, []);

  // Handle destination changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove previous planet
    if (planetCtrlRef.current) {
      sceneRef.current.remove(planetCtrlRef.current.group);
      planetCtrlRef.current.destroy();
      planetCtrlRef.current = null;
    }

    // Create new planet
    const newPlanet = createPlanetMesh(currentDestination);
    newPlanet.update(0, sunDirectionRef.current, cameraRef.current?.position);
    sceneRef.current.add(newPlanet.group);
    planetCtrlRef.current = newPlanet;

    // Reset orbital trail with new planetary theme color
    if (orbitalTrailCtrlRef.current) {
      sceneRef.current.remove(orbitalTrailCtrlRef.current.group);
      orbitalTrailCtrlRef.current.destroy();
      const newTrail = createOrbitalTrail(currentDestination.themeColor);
      sceneRef.current.add(newTrail.group);
      orbitalTrailCtrlRef.current = newTrail;
    }

    // Update lighting accent
    if (rimLightRef.current) {
      rimLightRef.current.color = new THREE.Color(currentDestination.themeColor);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color = new THREE.Color(currentDestination.ambientColor);
    }

    // Adjust camera distance according to planetary radius
    const baseDist = currentDestination.radius * 3.4;
    targetDistanceRef.current = Math.max(12, Math.min(28, baseDist));
  }, [currentDestination]);

  // Handle warp effect animation update
  useEffect(() => {
    if (!warpCtrlRef.current || !spaceshipCtrlRef.current || !cameraRef.current) return;

    warpCtrlRef.current.setVisible(isWarping);

    if (isWarping) {
      // Warp Drive Tunnel update
      warpCtrlRef.current.update(0.016, true, warpProgress);

      // Camera warp effect: push forward into warp tunnel
      const camera = cameraRef.current;
      camera.position.set(0, 0, 8 - warpProgress * 4);
      camera.lookAt(0, 0, -100);
      camera.fov = 45 + Math.sin(warpProgress * Math.PI) * 32; // Relativistic speed FoV dilation!
      camera.updateProjectionMatrix();

      // Spaceship aligns forward into hyperspace
      spaceshipCtrlRef.current.group.position.set(0, -0.6, 3.5);
      spaceshipCtrlRef.current.group.rotation.set(0, Math.PI, 0);

      // Scale down current planet during peak warp
      if (planetCtrlRef.current) {
        const planetScale = 1 - Math.sin(warpProgress * Math.PI) * 0.98;
        planetCtrlRef.current.group.scale.set(planetScale, planetScale, planetScale);
      }
    } else {
      // Restore normal FoV and positions
      const camera = cameraRef.current;
      camera.fov = 45;
      camera.updateProjectionMatrix();

      if (spaceshipCtrlRef.current) {
        spaceshipCtrlRef.current.group.position.set(4.8, 0.2, 1.8);
        spaceshipCtrlRef.current.group.rotation.set(0, -Math.PI / 6, 0);
      }

      if (planetCtrlRef.current) {
        planetCtrlRef.current.group.scale.set(1, 1, 1);
      }
    }
  }, [isWarping, warpProgress]);

  // Pointer controls (Orbit, Zoom, and Cluster Click Detection)
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isWarping) return;
    isDraggingRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isWarping) return;
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    // Play subtle, physical low-frequency hum during manual planet rotation
    const dragSpeed = Math.hypot(dx, dy);
    if (dragSpeed > 0.4) {
      planetRotationAudio.updateHum(dragSpeed);
    }

    // If user moves camera while focused on deep space, exit focus mode
    if (deepFocusTargetRef.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      deepFocusTargetRef.current = null;
      setFocusedCluster(null);
      setIsFocusingSpace(false);
    }

    targetAnglesRef.current.theta += dx * 0.007;
    targetAnglesRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI - 0.15, targetAnglesRef.current.phi - dy * 0.007)
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;
    planetRotationAudio.stop();

    if (isWarping || !wasDragging) return;

    // Check if pointer up was a click (minimal movement)
    const moveDist = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );

    if (moveDist < 6 && starfieldCtrlRef.current && cameraRef.current && containerRef.current) {
      // Raycast against star clusters
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const hitCluster = starfieldCtrlRef.current.hitTestCluster(raycaster);
      if (hitCluster) {
        triggerClusterFocus(hitCluster);
      }
    }
  };

  const triggerClusterFocus = (cluster: StarCluster) => {
    setFocusedCluster(cluster);
    setIsFocusingSpace(true);
    deepFocusTargetRef.current = cluster;
    deepFocusProgressRef.current = 0.05;

    // Save camera return angles
    deepFocusReturnAnglesRef.current = {
      theta: orbitAnglesRef.current.theta,
      phi: orbitAnglesRef.current.phi,
      dist: cameraDistanceRef.current,
    };

    // Auto-return timer after 6 seconds if user doesn't dismiss
    setTimeout(() => {
      // Only clear if still on this cluster
      if (deepFocusTargetRef.current?.id === cluster.id) {
        deepFocusTargetRef.current = null;
        setFocusedCluster(null);
        setIsFocusingSpace(false);
      }
    }, 6500);
  };

  const handleDismissFocus = () => {
    deepFocusTargetRef.current = null;
    setFocusedCluster(null);
    setIsFocusingSpace(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isWarping) return;
    targetDistanceRef.current = Math.max(
      6,
      Math.min(36, targetDistanceRef.current + e.deltaY * 0.02)
    );
  };

  // Manual light-source rotation scrubbing
  const handleSunAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value);
    setSunAngleDeg(deg);
    sunOrbitAngleRef.current = (deg / 180) * Math.PI;
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D WebGL Canvas */}
      <div
        id="space-viewport-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Light-Source Dynamic Day/Night Cycle Interactive Control Widget */}
      {!isWarping && (
        <div
          id="sun-terminator-control"
          className="absolute bottom-24 left-4 sm:left-6 z-20 pointer-events-auto flex flex-col gap-2 p-3 sm:p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs shadow-2xl max-w-[280px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Sun className="w-4 h-4 animate-spin" style={{ animationDuration: '14s' }} />
              <span className="font-semibold tracking-wider text-[11px] text-amber-200 uppercase">
                Day / Night Cycle
              </span>
            </div>

            <button
              id="sun-rotation-toggle-btn"
              onClick={() => setIsSunRotating(!isSunRotating)}
              title={isSunRotating ? 'Pause Sun Rotation' : 'Resume Sun Rotation'}
              className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] transition-all ${
                isSunRotating
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {isSunRotating ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>RUNNING</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>PAUSED</span>
                </>
              )}
            </button>
          </div>

          {/* Scrubbable Terminator Angle Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>SOLAR LONGITUDE</span>
              <span className="text-amber-300 font-semibold">{sunAngleDeg}°</span>
            </div>
            <input
              id="sun-longitude-slider"
              type="range"
              min="0"
              max="360"
              value={sunAngleDeg}
              onChange={handleSunAngleChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Speed multiplier toggle */}
          <div className="flex items-center justify-between text-[10px] pt-1">
            <span className="text-slate-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-slate-400" />
              CYCLE RATE:
            </span>
            <div className="flex gap-1">
              {[0.5, 1, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSunSpeedMultiplier(speed)}
                  className={`px-1.5 py-0.5 rounded border text-[9px] ${
                    sunSpeedMultiplier === speed
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deep Space Star Cluster Quick Focus Selector */}
      {!isWarping && starfieldCtrlRef.current && (
        <div
          id="deep-space-clusters-bar"
          className="absolute top-20 left-4 sm:left-6 z-20 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] shadow-xl max-w-[calc(100vw-2rem)] overflow-x-auto"
        >
          <div className="flex items-center gap-1 px-2 text-cyan-400 font-semibold tracking-wider text-[10px] uppercase whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>DEEP SPACE</span>
          </div>

          <div className="flex items-center gap-1">
            {starfieldCtrlRef.current.getClusters().map((cluster) => {
              const isSelected = focusedCluster?.id === cluster.id;
              return (
                <button
                  key={cluster.id}
                  onClick={() => triggerClusterFocus(cluster)}
                  className={`px-2.5 py-1 rounded-full text-[10px] transition-all whitespace-nowrap flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <span>{cluster.name.replace(' Cluster', '').replace(' Stream', '')}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Deep Space Active Focus HUD Telemetry Card */}
      {!isWarping && focusedCluster && (
        <div
          id="deep-space-focus-modal"
          className="absolute top-36 left-4 sm:left-6 z-20 pointer-events-auto p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-cyan-500/30 text-white font-mono text-xs shadow-2xl max-w-sm animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-semibold tracking-widest uppercase">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>OBSERVATION TARGET LOCKED</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-wide mt-0.5">
                {focusedCluster.name}
              </h3>
              <p className="text-[11px] text-cyan-400/80">{focusedCluster.designation}</p>
            </div>
            <button
              onClick={handleDismissFocus}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
              title="Return Camera to Orbit"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            {focusedCluster.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/5 p-2 rounded-xl border border-white/10">
            <div>
              <span className="text-slate-400 block">ESTIMATED DISTANCE</span>
              <span className="text-cyan-300 font-semibold">{focusedCluster.distanceLightYears}</span>
            </div>
            <div>
              <span className="text-slate-400 block">SPECTRAL DOMAIN</span>
              <span className="text-amber-300 font-semibold">Broadband Stellar Band</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>DRAG SCREEN TO EXIT FOCUS</span>
            <button
              onClick={handleDismissFocus}
              className="text-cyan-400 hover:text-cyan-200 underline font-semibold"
            >
              RESTORE ORBIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
