import * as THREE from 'three';

export interface OrbitalTrailController {
  group: THREE.Group;
  update: (delta: number, currentShipPos: THREE.Vector3, isWarping: boolean) => void;
  reset: (initialShipPos?: THREE.Vector3) => void;
  destroy: () => void;
}

/**
 * Creates a glowing, animated orbital path line that trails behind the spaceship
 * as it orbits around the planet in the 3D scene.
 * Uses ribbon/line buffer vertices with a fading alpha gradient and pulsing glow.
 */
export function createOrbitalTrail(themeColorHex: string = '#38bdf8'): OrbitalTrailController {
  const group = new THREE.Group();

  const maxPoints = 260;
  const positions = new Float32Array(maxPoints * 3);
  const colors = new Float32Array(maxPoints * 3);

  const baseColor = new THREE.Color(themeColorHex);
  const coreGlowColor = new THREE.Color(0xffffff);

  // Initialize with dummy off-screen points
  for (let i = 0; i < maxPoints; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -9999;
    positions[i * 3 + 2] = 0;

    colors[i * 3] = baseColor.r;
    colors[i * 3 + 1] = baseColor.g;
    colors[i * 3 + 2] = baseColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Custom LineBasicMaterial with vertex colors and additive blending
  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    linewidth: 2,
    depthWrite: false,
  });

  const line = new THREE.Line(geometry, lineMaterial);
  group.add(line);

  // Second halo line for extra volumetric glow effect
  const haloGeo = geometry.clone();
  const haloMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    linewidth: 3,
    depthWrite: false,
  });
  const haloLine = new THREE.Line(haloGeo, haloMaterial);
  group.add(haloLine);

  // Buffer history of captured points
  const history: THREE.Vector3[] = [];
  let sampleTimer = 0;
  const sampleInterval = 0.045; // record point every ~45ms
  let pulseTime = 0;

  return {
    group,
    update: (delta: number, currentShipPos: THREE.Vector3, isWarping: boolean) => {
      pulseTime += delta;

      if (isWarping) {
        // Fade out line during warp drive
        lineMaterial.opacity = Math.max(0, lineMaterial.opacity - delta * 4);
        haloMaterial.opacity = Math.max(0, haloMaterial.opacity - delta * 4);
        history.length = 0;
        return;
      }

      lineMaterial.opacity = Math.min(0.95, lineMaterial.opacity + delta * 3);
      haloMaterial.opacity = Math.min(0.5, haloMaterial.opacity + delta * 2);

      sampleTimer += delta;
      if (sampleTimer >= sampleInterval) {
        sampleTimer = 0;

        // Push new position if moved enough
        const lastP = history[history.length - 1];
        if (!lastP || lastP.distanceTo(currentShipPos) > 0.05) {
          history.push(currentShipPos.clone());
          if (history.length > maxPoints) {
            history.shift();
          }
        }
      }

      const count = history.length;
      if (count < 2) return;

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colAttr = geometry.attributes.color as THREE.BufferAttribute;
      const haloPosAttr = haloGeo.attributes.position as THREE.BufferAttribute;
      const haloColAttr = haloGeo.attributes.color as THREE.BufferAttribute;

      const pulse = 0.85 + Math.sin(pulseTime * 3) * 0.15;

      for (let i = 0; i < maxPoints; i++) {
        const i3 = i * 3;
        if (i < count) {
          const pt = history[i];
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
          haloPosAttr.setXYZ(i, pt.x, pt.y, pt.z);

          // Head of the line (near ship) is white/bright cyan, tail fades to transparent theme color
          const alphaFactor = Math.pow((i + 1) / count, 1.8);
          const isNearHead = i > count - 8;
          const mixCol = isNearHead ? coreGlowColor : baseColor;

          const r = mixCol.r * alphaFactor * pulse;
          const g = mixCol.g * alphaFactor * pulse;
          const b = mixCol.b * alphaFactor * pulse;

          colAttr.setXYZ(i, r, g, b);
          haloColAttr.setXYZ(i, r * 0.8, g * 0.8, b * 0.8);
        } else {
          // Collapse unused buffer vertices to the latest point
          const latest = history[count - 1];
          posAttr.setXYZ(i, latest.x, latest.y, latest.z);
          colAttr.setXYZ(i, 0, 0, 0);
          haloPosAttr.setXYZ(i, latest.x, latest.y, latest.z);
          haloColAttr.setXYZ(i, 0, 0, 0);
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      haloPosAttr.needsUpdate = true;
      haloColAttr.needsUpdate = true;
    },
    reset: (initialShipPos?: THREE.Vector3) => {
      history.length = 0;
      if (initialShipPos) {
        history.push(initialShipPos.clone());
      }
    },
    destroy: () => {
      geometry.dispose();
      haloGeo.dispose();
      lineMaterial.dispose();
      haloMaterial.dispose();
    },
  };
}
