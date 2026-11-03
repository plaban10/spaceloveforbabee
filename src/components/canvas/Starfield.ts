import * as THREE from 'three';

export interface StarCluster {
  id: string;
  name: string;
  designation: string;
  position: THREE.Vector3;
  color: string;
  description: string;
  distanceLightYears: string;
}

export interface StarfieldController {
  group: THREE.Group;
  update: (delta: number, isWarping: boolean) => void;
  getClusters: () => StarCluster[];
  hitTestCluster: (raycaster: THREE.Raycaster) => StarCluster | null;
  destroy: () => void;
}

export function createStarfield(): StarfieldController {
  const group = new THREE.Group();

  // 0. Distinct Interactive Deep Space Star Clusters
  const clustersData: StarCluster[] = [
    {
      id: 'pleiades',
      name: 'Pleiades Cluster',
      designation: 'Messier 45 / Seven Sisters',
      position: new THREE.Vector3(180, 110, -320).normalize().multiplyScalar(420),
      color: '#38bdf8',
      description: 'Open star cluster dominated by luminous hot blue B-type stars enveloped in reflection nebulosity.',
      distanceLightYears: '444 ly',
    },
    {
      id: 'hyades',
      name: 'Hyades Nebula Stream',
      designation: 'Caldwell 41',
      position: new THREE.Vector3(-240, 160, -290).normalize().multiplyScalar(430),
      color: '#fbbf24',
      description: 'Ancient golden-hued stellar association with massive evolved red giants.',
      distanceLightYears: '153 ly',
    },
    {
      id: 'orion',
      name: 'Great Orion Nebula Cluster',
      designation: 'Messier 42 / NGC 1976',
      position: new THREE.Vector3(120, -180, -360).normalize().multiplyScalar(440),
      color: '#f43f5e',
      description: 'Vibrant stellar nursery actively coalescing massive stars within ionizing molecular dust.',
      distanceLightYears: '1,344 ly',
    },
    {
      id: 'omega_centauri',
      name: 'Omega Centauri Globular',
      designation: 'NGC 5139',
      position: new THREE.Vector3(-280, -140, 260).normalize().multiplyScalar(450),
      color: '#c084fc',
      description: 'The most massive globular cluster in the Milky Way containing over 10 million gravitationally bound stars.',
      distanceLightYears: '17,090 ly',
    },
    {
      id: 'andromeda',
      name: 'Andromeda Core Stellar Stream',
      designation: 'M31 Super-Cluster',
      position: new THREE.Vector3(260, 220, 240).normalize().multiplyScalar(460),
      color: '#a7f3d0',
      description: 'Dense spiral galactic core halo radiating multi-band ultraviolet starlight across intergalactic space.',
      distanceLightYears: '2.537M ly',
    },
  ];

  // Create clickable / interactive visual halos around star clusters
  const clusterHitMeshes: { mesh: THREE.Mesh; cluster: StarCluster }[] = [];
  const clusterGroup = new THREE.Group();
  group.add(clusterGroup);

  // High-res reticle texture for cluster indicator
  const reticleCanvas = document.createElement('canvas');
  reticleCanvas.width = 128;
  reticleCanvas.height = 128;
  const rCtx = reticleCanvas.getContext('2d')!;
  rCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  rCtx.lineWidth = 2.5;

  // Outer segmented ring
  rCtx.beginPath();
  rCtx.arc(64, 64, 48, 0, Math.PI * 0.4);
  rCtx.stroke();
  rCtx.beginPath();
  rCtx.arc(64, 64, 48, Math.PI * 0.5, Math.PI * 0.9);
  rCtx.stroke();
  rCtx.beginPath();
  rCtx.arc(64, 64, 48, Math.PI * 1.0, Math.PI * 1.4);
  rCtx.stroke();
  rCtx.beginPath();
  rCtx.arc(64, 64, 48, Math.PI * 1.5, Math.PI * 1.9);
  rCtx.stroke();

  // Central crosshair & diamond
  rCtx.strokeRect(56, 56, 16, 16);
  rCtx.beginPath();
  rCtx.arc(64, 64, 6, 0, Math.PI * 2);
  rCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  rCtx.fill();

  const reticleTex = new THREE.CanvasTexture(reticleCanvas);

  clustersData.forEach((cluster) => {
    // Interactive invisible hit sphere for generous touch/click target in 3D
    const hitGeo = new THREE.SphereGeometry(32, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({
      visible: false,
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    hitMesh.position.copy(cluster.position);
    clusterGroup.add(hitMesh);
    clusterHitMeshes.push({ mesh: hitMesh, cluster });

    // Visual glowing sprite for the cluster
    const clusterMat = new THREE.SpriteMaterial({
      map: reticleTex,
      color: new THREE.Color(cluster.color),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(clusterMat);
    sprite.position.copy(cluster.position);
    sprite.scale.set(40, 40, 1);
    clusterGroup.add(sprite);

    // Denser local cloud of extra bright stars surrounding the cluster core
    const subCount = 45;
    const subGeo = new THREE.BufferGeometry();
    const subPos = new Float32Array(subCount * 3);
    const subCol = new Float32Array(subCount * 3);
    const clusterCol = new THREE.Color(cluster.color);

    for (let s = 0; s < subCount; s++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45,
        (Math.random() - 0.5) * 45
      );
      const sp = cluster.position.clone().add(offset);
      subPos[s * 3] = sp.x;
      subPos[s * 3 + 1] = sp.y;
      subPos[s * 3 + 2] = sp.z;

      subCol[s * 3] = clusterCol.r;
      subCol[s * 3 + 1] = clusterCol.g;
      subCol[s * 3 + 2] = clusterCol.b;
    }

    subGeo.setAttribute('position', new THREE.BufferAttribute(subPos, 3));
    subGeo.setAttribute('color', new THREE.BufferAttribute(subCol, 3));

    const subMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const subPoints = new THREE.Points(subGeo, subMat);
    clusterGroup.add(subPoints);
  });

  // 1. Static Deep Celestial Background Starfield
  const baseCount = 3600;
  const baseGeometry = new THREE.BufferGeometry();
  const basePositions = new Float32Array(baseCount * 3);
  const baseColors = new Float32Array(baseCount * 3);

  const starColors = [
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0xdbeafe), // Light blue-white (B-type star)
    new THREE.Color(0xfef08a), // Pale yellow (G-type like Sun)
    new THREE.Color(0xfed7aa), // Soft orange (K-type)
    new THREE.Color(0xfbcfe8), // Subtle soft rose
  ];

  for (let i = 0; i < baseCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 400 + Math.random() * 500;

    basePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    basePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    basePositions[i * 3 + 2] = r * Math.cos(phi);

    const color = starColors[Math.floor(Math.random() * starColors.length)];
    baseColors[i * 3] = color.r * 0.75;
    baseColors[i * 3 + 1] = color.g * 0.75;
    baseColors[i * 3 + 2] = color.b * 0.75;
  }

  baseGeometry.setAttribute('position', new THREE.BufferAttribute(basePositions, 3));
  baseGeometry.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));

  // Circular star sprite via Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const baseStarTexture = new THREE.CanvasTexture(canvas);

  const baseMaterial = new THREE.PointsMaterial({
    size: 2.0,
    map: baseStarTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const basePoints = new THREE.Points(baseGeometry, baseMaterial);
  group.add(basePoints);

  // 2. Flickering Particle System for Distant Twinkling Stars (PointsMaterial & Random Distribution)
  const twinkleCount = 1400;
  const twinkleGeometry = new THREE.BufferGeometry();
  const twinklePositions = new Float32Array(twinkleCount * 3);
  const twinkleColors = new Float32Array(twinkleCount * 3);
  const twinkleBaseColors = new Float32Array(twinkleCount * 3);
  const twinkleFreqs = new Float32Array(twinkleCount);
  const twinklePhases = new Float32Array(twinkleCount);
  const twinkleHarmonics = new Float32Array(twinkleCount);

  // High-acuity cross-diffraction star sprite for twinkling stars
  const twinkleCanvas = document.createElement('canvas');
  twinkleCanvas.width = 64;
  twinkleCanvas.height = 64;
  const tCtx = twinkleCanvas.getContext('2d')!;

  // Central stellar disc
  const tGrad = tCtx.createRadialGradient(32, 32, 0, 32, 32, 28);
  tGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  tGrad.addColorStop(0.18, 'rgba(255, 255, 255, 0.9)');
  tGrad.addColorStop(0.45, 'rgba(224, 242, 254, 0.4)');
  tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  tCtx.fillStyle = tGrad;
  tCtx.fillRect(0, 0, 64, 64);

  // Subtle 4-point stellar diffraction spikes
  tCtx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  tCtx.lineWidth = 1.2;
  tCtx.beginPath();
  tCtx.moveTo(32, 4);
  tCtx.lineTo(32, 60);
  tCtx.moveTo(4, 32);
  tCtx.lineTo(60, 32);
  tCtx.stroke();

  const twinkleTexture = new THREE.CanvasTexture(twinkleCanvas);

  for (let i = 0; i < twinkleCount; i++) {
    // Random distribution across deep cosmic spherical shell
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 380 + Math.random() * 480;

    twinklePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    twinklePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    twinklePositions[i * 3 + 2] = r * Math.cos(phi);

    const baseCol = starColors[Math.floor(Math.random() * starColors.length)];
    // Add extra brightness for twinkling stars to catch the cinematic bloom
    const boost = 1.0 + Math.random() * 1.5;
    twinkleBaseColors[i * 3] = baseCol.r * boost;
    twinkleBaseColors[i * 3 + 1] = baseCol.g * boost;
    twinkleBaseColors[i * 3 + 2] = baseCol.b * boost;

    twinkleColors[i * 3] = twinkleBaseColors[i * 3];
    twinkleColors[i * 3 + 1] = twinkleBaseColors[i * 3 + 1];
    twinkleColors[i * 3 + 2] = twinkleBaseColors[i * 3 + 2];

    // Varied scintillation frequency & phase parameters
    twinkleFreqs[i] = 1.4 + Math.random() * 4.8;
    twinklePhases[i] = Math.random() * Math.PI * 2;
    twinkleHarmonics[i] = 0.6 + Math.random() * 2.2;
  }

  twinkleGeometry.setAttribute('position', new THREE.BufferAttribute(twinklePositions, 3));
  const twinkleColorsAttr = new THREE.BufferAttribute(twinkleColors, 3);
  twinkleGeometry.setAttribute('color', twinkleColorsAttr);

  const twinkleMaterial = new THREE.PointsMaterial({
    size: 3.4,
    map: twinkleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const twinklePoints = new THREE.Points(twinkleGeometry, twinkleMaterial);
  group.add(twinklePoints);

  // 3. Subtle Ambient Nebula Dust Clouds
  const nebulaCount = 120;
  const nebulaGeo = new THREE.BufferGeometry();
  const nebPositions = new Float32Array(nebulaCount * 3);
  const nebColors = new Float32Array(nebulaCount * 3);

  const nebPalette = [
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xa855f7),
    new THREE.Color(0x3b82f6),
    new THREE.Color(0xec4899),
  ];

  for (let i = 0; i < nebulaCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 250 + Math.random() * 300;
    nebPositions[i * 3] = Math.cos(angle) * r;
    nebPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    nebPositions[i * 3 + 2] = Math.sin(angle) * r;

    const c = nebPalette[Math.floor(Math.random() * nebPalette.length)];
    nebColors[i * 3] = c.r;
    nebColors[i * 3 + 1] = c.g;
    nebColors[i * 3 + 2] = c.b;
  }

  nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebPositions, 3));
  nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebColors, 3));

  const nebCanvas = document.createElement('canvas');
  nebCanvas.width = 64;
  nebCanvas.height = 64;
  const nCtx = nebCanvas.getContext('2d')!;
  const nGrad = nCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  nGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  nGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  nGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  nCtx.fillStyle = nGrad;
  nCtx.fillRect(0, 0, 64, 64);
  const nebTexture = new THREE.CanvasTexture(nebCanvas);

  const nebMat = new THREE.PointsMaterial({
    size: 140,
    map: nebTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const nebPoints = new THREE.Points(nebulaGeo, nebMat);
  group.add(nebPoints);

  let elapsedTime = 0;

  return {
    group,
    update: (delta: number, isWarping: boolean) => {
      elapsedTime += delta;

      // Slow galactic rotation
      const rotSpeed = isWarping ? 0.005 : 0.0003;
      group.rotation.y += rotSpeed * delta;
      group.rotation.x += rotSpeed * 0.4 * delta;

      // Dynamically calculate flickering / twinkling star scintillation
      const t = elapsedTime;
      for (let i = 0; i < twinkleCount; i++) {
        const freq = twinkleFreqs[i];
        const phase = twinklePhases[i];
        const harm = twinkleHarmonics[i];

        // Multi-frequency harmonic stellar twinkle curve
        const wave1 = Math.sin(t * freq + phase) * 0.5 + 0.5;
        const wave2 = Math.sin(t * (freq * harm) + phase * 1.5) * 0.35 + 0.65;
        // Peak flash modulation
        const flicker = 0.12 + 0.88 * (wave1 * wave2);

        const i3 = i * 3;
        twinkleColors[i3] = twinkleBaseColors[i3] * flicker;
        twinkleColors[i3 + 1] = twinkleBaseColors[i3 + 1] * flicker;
        twinkleColors[i3 + 2] = twinkleBaseColors[i3 + 2] * flicker;
      }
      twinkleColorsAttr.needsUpdate = true;
    },
    getClusters: () => clustersData,
    hitTestCluster: (raycaster: THREE.Raycaster): StarCluster | null => {
      const meshes = clusterHitMeshes.map((c) => c.mesh);
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = clusterHitMeshes.find((c) => c.mesh === intersects[0].object);
        return hit ? hit.cluster : null;
      }
      return null;
    },
    destroy: () => {
      reticleTex.dispose();
      baseGeometry.dispose();
      baseMaterial.dispose();
      baseStarTexture.dispose();
      twinkleGeometry.dispose();
      twinkleMaterial.dispose();
      twinkleTexture.dispose();
      nebulaGeo.dispose();
      nebMat.dispose();
      nebTexture.dispose();
    },
  };
}
