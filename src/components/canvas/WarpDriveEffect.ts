import * as THREE from 'three';

export interface WarpDriveController {
  group: THREE.Group;
  update: (delta: number, active: boolean, progress: number) => void;
  setVisible: (visible: boolean) => void;
}

export function createWarpDriveEffect(): WarpDriveController {
  const group = new THREE.Group();
  group.visible = false;

  const count = 1800;
  const positions = new Float32Array(count * 6); // 2 vertices per line streak
  const colors = new Float32Array(count * 6);

  const tunnelRadiusMin = 3;
  const tunnelRadiusMax = 40;
  const tunnelLength = 600;

  // Streak initial data
  const streakData: { speed: number; x: number; y: number; z: number; length: number }[] = [];

  const colorPalette = [
    new THREE.Color(0x38bdf8), // Cyan
    new THREE.Color(0x818cf8), // Indigo
    new THREE.Color(0xffffff), // White
    new THREE.Color(0xc084fc), // Purple
    new THREE.Color(0x67e8f9), // Bright blue
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = tunnelRadiusMin + Math.random() * (tunnelRadiusMax - tunnelRadiusMin);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (Math.random() - 0.5) * tunnelLength;
    const length = 4 + Math.random() * 12;
    const speed = 350 + Math.random() * 300;

    streakData.push({ speed, x, y, z, length });

    const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    // Vertex 1 (Head of streak)
    positions[i * 6 + 0] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    colors[i * 6 + 0] = c.r;
    colors[i * 6 + 1] = c.g;
    colors[i * 6 + 2] = c.b;

    // Vertex 2 (Tail of streak)
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = z - length;
    colors[i * 6 + 3] = c.r * 0.2;
    colors[i * 6 + 4] = c.g * 0.2;
    colors[i * 6 + 5] = c.b * 0.2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    linewidth: 1,
  });

  const lines = new THREE.LineSegments(geometry, material);
  group.add(lines);

  // Shockwave ring for hyperspace burst
  const ringGeo = new THREE.RingGeometry(0.5, 1.2, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const shockwave = new THREE.Mesh(ringGeo, ringMat);
  shockwave.position.z = -20;
  group.add(shockwave);

  return {
    group,
    setVisible: (visible: boolean) => {
      group.visible = visible;
    },
    update: (delta: number, active: boolean, progress: number) => {
      if (!group.visible && !active) return;

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Dynamic opacity ramp based on progress
      if (active) {
        if (progress < 0.2) {
          material.opacity = progress / 0.2;
        } else if (progress > 0.8) {
          material.opacity = (1 - progress) / 0.2;
        } else {
          material.opacity = 1;
        }

        // Relativistic acceleration
        const speedMultiplier = 1 + Math.sin(progress * Math.PI) * 2.5;

        for (let i = 0; i < count; i++) {
          const item = streakData[i];
          item.z += item.speed * speedMultiplier * delta;

          // Loop back to far distance
          if (item.z > 80) {
            item.z = -tunnelLength / 2 - Math.random() * 80;
          }

          const dynamicLength = item.length * (1 + speedMultiplier * 1.8);

          // Head
          posArray[i * 6 + 0] = item.x;
          posArray[i * 6 + 1] = item.y;
          posArray[i * 6 + 2] = item.z;

          // Tail stretching backward
          posArray[i * 6 + 3] = item.x;
          posArray[i * 6 + 4] = item.y;
          posArray[i * 6 + 5] = item.z - dynamicLength;
        }
        posAttr.needsUpdate = true;

        // Shockwave expansion at warp engage / exit
        if (progress < 0.3) {
          const ringScale = progress / 0.3 * 80;
          shockwave.scale.set(ringScale, ringScale, 1);
          ringMat.opacity = (1 - progress / 0.3) * 0.8;
        } else if (progress > 0.7) {
          const exitProg = (progress - 0.7) / 0.3;
          const ringScale = exitProg * 70;
          shockwave.scale.set(ringScale, ringScale, 1);
          ringMat.opacity = (1 - exitProg) * 0.8;
        } else {
          ringMat.opacity = 0;
        }
      } else {
        material.opacity = 0;
        ringMat.opacity = 0;
      }
    },
  };
}
