import * as THREE from 'three';

export interface EngineTrailController {
  group: THREE.Group;
  update: (
    delta: number,
    shipWorldPos: THREE.Vector3,
    shipWorldQuat: THREE.Quaternion,
    isWarping: boolean,
    warpProgress?: number
  ) => void;
  destroy: () => void;
}

/**
 * High-performance particle-based engine exhaust trail system.
 * Emits glowing plasma particles from twin nacelles and central engine nozzles,
 * trailing dynamically behind the spaceship as it cruises or accelerates into hyperspace.
 */
export function createEngineTrail(): EngineTrailController {
  const group = new THREE.Group();

  const maxParticles = 650;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const sizes = new Float32Array(maxParticles);

  // Particle tracking arrays
  const lifetimes = new Float32Array(maxParticles);
  const maxLifetimes = new Float32Array(maxParticles);
  const velocities = new Float32Array(maxParticles * 3);
  const active = new Uint8Array(maxParticles);

  // Hide initially
  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -9999;
    positions[i * 3 + 2] = 0;
    sizes[i] = 0;
    active[i] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Particle glow sprite
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(103, 232, 249, 0.9)'); // Cyan core
  grad.addColorStop(0.55, 'rgba(56, 189, 248, 0.45)'); // Sky blue
  grad.addColorStop(0.85, 'rgba(14, 165, 233, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const trailTexture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 1.8,
    map: trailTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  group.add(points);

  // Relative engine exhaust nozzle offsets in local spaceship coordinates
  // Left Nacelle (-1.4, 0.1, -2.4), Right Nacelle (1.4, 0.1, -2.4), Center (0, 0.05, -2.2)
  // Scaled by 0.65 (ship scale)
  const nozzleOffsets = [
    new THREE.Vector3(-1.4 * 0.65, 0.1 * 0.65, -2.4 * 0.65),
    new THREE.Vector3(1.4 * 0.65, 0.1 * 0.65, -2.4 * 0.65),
    new THREE.Vector3(0, 0.05 * 0.65, -2.2 * 0.65),
  ];

  let nextParticleIdx = 0;
  let emitTimer = 0;

  // Temp vectors to avoid garbage collection
  const tempPos = new THREE.Vector3();
  const backwardDir = new THREE.Vector3(0, 0, -1);
  const worldBack = new THREE.Vector3();

  return {
    group,
    update: (delta, shipWorldPos, shipWorldQuat, isWarping, warpProgress = 0) => {
      // Calculate world backwards vector from ship orientation
      worldBack.copy(backwardDir).applyQuaternion(shipWorldQuat).normalize();

      // Spawn rate: during normal cruise emit ~60-80 particles/sec; during warp emit massive continuous stream
      const emitInterval = isWarping ? 0.004 : 0.016;
      emitTimer += delta;

      const particlesPerBurst = isWarping ? 8 : 2;

      while (emitTimer >= emitInterval) {
        emitTimer -= emitInterval;

        for (let b = 0; b < particlesPerBurst; b++) {
          const nozzle = nozzleOffsets[Math.floor(Math.random() * nozzleOffsets.length)];
          tempPos.copy(nozzle).applyQuaternion(shipWorldQuat).add(shipWorldPos);

          const idx = nextParticleIdx;
          nextParticleIdx = (nextParticleIdx + 1) % maxParticles;

          active[idx] = 1;
          lifetimes[idx] = 0;

          if (isWarping) {
            // Warp mode: high-speed elongated streak with hyperspace violet-cyan color shift
            maxLifetimes[idx] = 0.45 + Math.random() * 0.35;
            const warpEjectionSpeed = 16.0 + Math.random() * 18.0;

            velocities[idx * 3] = worldBack.x * warpEjectionSpeed + (Math.random() - 0.5) * 1.5;
            velocities[idx * 3 + 1] = worldBack.y * warpEjectionSpeed + (Math.random() - 0.5) * 1.5;
            velocities[idx * 3 + 2] = worldBack.z * warpEjectionSpeed + (Math.random() - 0.5) * 1.5;

            // Hyper-drive colors: cyan shifting to energetic violet/magenta
            const isViolet = Math.random() > 0.4;
            if (isViolet) {
              colors[idx * 3] = 0.95; // R
              colors[idx * 3 + 1] = 0.35; // G
              colors[idx * 3 + 2] = 1.0; // B
            } else {
              colors[idx * 3] = 0.3;
              colors[idx * 3 + 1] = 0.9;
              colors[idx * 3 + 2] = 1.0;
            }
            sizes[idx] = 3.5 + Math.random() * 3.0;
          } else {
            // Normal cruise mode: gentle blue ion plasma plume drifting behind the ship
            maxLifetimes[idx] = 1.2 + Math.random() * 0.8;
            const cruiseSpeed = 0.8 + Math.random() * 1.2;

            velocities[idx * 3] = worldBack.x * cruiseSpeed + (Math.random() - 0.5) * 0.3;
            velocities[idx * 3 + 1] = worldBack.y * cruiseSpeed + (Math.random() - 0.5) * 0.3;
            velocities[idx * 3 + 2] = worldBack.z * cruiseSpeed + (Math.random() - 0.5) * 0.3;

            // Ion blue-cyan plasma
            colors[idx * 3] = 0.22;
            colors[idx * 3 + 1] = 0.74;
            colors[idx * 3 + 2] = 0.98;
            sizes[idx] = 1.8 + Math.random() * 1.4;
          }

          positions[idx * 3] = tempPos.x;
          positions[idx * 3 + 1] = tempPos.y;
          positions[idx * 3 + 2] = tempPos.z;
        }
      }

      // Update existing particles
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colAttr = geometry.attributes.color as THREE.BufferAttribute;
      const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

      for (let i = 0; i < maxParticles; i++) {
        if (!active[i]) continue;

        lifetimes[i] += delta;
        const progress = lifetimes[i] / maxLifetimes[i];

        if (progress >= 1.0) {
          active[i] = 0;
          positions[i * 3 + 1] = -9999;
          sizes[i] = 0;
          continue;
        }

        // Move particle by velocity
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Size expansion and alpha fade
        const fade = 1.0 - progress;
        sizes[i] = isWarping
          ? (3.0 + progress * 4.0) * fade
          : (1.8 + progress * 2.5) * fade;

        // Color temperature cooling as exhaust disperses
        if (!isWarping) {
          colors[i * 3] = 0.22 * fade;
          colors[i * 3 + 1] = 0.74 * fade;
          colors[i * 3 + 2] = 0.98 * fade;
        } else {
          colors[i * 3] *= 0.98;
          colors[i * 3 + 1] *= 0.98;
          colors[i * 3 + 2] *= 0.98;
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    },
    destroy: () => {
      geometry.dispose();
      material.dispose();
      trailTexture.dispose();
    },
  };
}
