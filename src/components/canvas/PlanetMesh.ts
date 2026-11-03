import * as THREE from 'three';
import { CelestialDestination } from '../../types';
import {
  getEarthTexture,
  getEarthNightTexture,
  getEarthCloudsTexture,
  getMoonTexture,
  getVenusTexture,
  getMarsTexture,
  getJupiterTexture,
  getSaturnTexture,
  getSaturnRingsTexture,
  getNeptuneTexture,
  getDeepSpaceCoreTexture,
  getPlanetNormalTexture,
} from './ProceduralTextures';
import {
  createPlanetSurfaceMaterial,
  createAtmosphereGlowMaterial,
  createEarthCloudsMaterial,
} from './PlanetShaders';

export interface PlanetMeshController {
  group: THREE.Group;
  update: (delta: number, sunDirection?: THREE.Vector3, cameraPosition?: THREE.Vector3) => void;
  destroy: () => void;
}

export function createPlanetMesh(destination: CelestialDestination): PlanetMeshController {
  const group = new THREE.Group();
  let cloudsMesh: THREE.Mesh | null = null;
  let accretionRings: THREE.Mesh | null = null;
  let coronaParticles: THREE.Points | null = null;

  const radius = destination.radius;

  // 1. Atmospheric Glow Outer Shell
  let atmosphereMesh: THREE.Mesh | null = null;
  if (destination.hasAtmosphereGlow) {
    const glowGeo = new THREE.SphereGeometry(radius * 1.16, 64, 64);
    const glowMat = createAtmosphereGlowMaterial(destination);
    atmosphereMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(atmosphereMesh);
  }

  // 2. Planet Body Geometry
  const sphereGeo = new THREE.SphereGeometry(radius, 64, 64);
  let mainMaterial: THREE.Material;
  const normalMap = getPlanetNormalTexture(destination.id);

  switch (destination.meshType) {
    case 'earth': {
      const earthTex = getEarthTexture();
      const earthNightTex = getEarthNightTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, earthTex, earthNightTex, normalMap);

      // Clouds Layer with sun terminator shading
      const cloudsTex = getEarthCloudsTexture();
      const cloudsGeo = new THREE.SphereGeometry(radius * 1.025, 64, 64);
      const cloudsMat = createEarthCloudsMaterial(cloudsTex, 0xf97316);
      cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
      group.add(cloudsMesh);
      break;
    }

    case 'moon': {
      const moonTex = getMoonTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, moonTex, null, normalMap);
      break;
    }

    case 'venus': {
      const venusTex = getVenusTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, venusTex, null, normalMap);
      break;
    }

    case 'mars': {
      const marsTex = getMarsTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, marsTex, null, normalMap);
      break;
    }

    case 'jupiter': {
      const jupiterTex = getJupiterTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, jupiterTex, null, normalMap);
      break;
    }

    case 'saturn': {
      const saturnTex = getSaturnTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, saturnTex, null, normalMap);

      // Saturn Rings
      const ringInner = radius * 1.35;
      const ringOuter = radius * 2.5;
      const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 96);
      ringGeo.rotateX(Math.PI / 2);

      // UV mapping so texture spreads radially
      const pos = ringGeo.attributes.position;
      const uvs = ringGeo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const u = (dist - ringInner) / (ringOuter - ringInner);
        uvs.setXY(i, u, 0.5);
      }
      uvs.needsUpdate = true;

      const ringsTex = getSaturnRingsTexture();
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringsTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        roughness: 0.4,
      });

      const ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsMesh.rotation.x = 0.45; // 26 degrees planetary tilt
      ringsMesh.rotation.z = -0.15;
      group.add(ringsMesh);
      break;
    }

    case 'neptune': {
      const neptuneTex = getNeptuneTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, neptuneTex, null, normalMap);
      break;
    }

    case 'deepspace': {
      // Cosmic singularity core with luminous corona
      const coreTex = getDeepSpaceCoreTexture();
      mainMaterial = createPlanetSurfaceMaterial(destination, coreTex, null, normalMap);

      // Accretion / Love Singularity Luminous Ring
      const accGeo = new THREE.RingGeometry(radius * 1.3, radius * 2.8, 64);
      accGeo.rotateX(Math.PI / 2.3);
      const accMat = new THREE.MeshBasicMaterial({
        color: 0xf472b6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      accretionRings = new THREE.Mesh(accGeo, accMat);
      group.add(accretionRings);

      // Corona sparkling particle cloud
      const coronaCount = 350;
      const cGeo = new THREE.BufferGeometry();
      const cPositions = new Float32Array(coronaCount * 3);
      const cColors = new Float32Array(coronaCount * 3);
      for (let i = 0; i < coronaCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const r = radius * 1.2 + Math.random() * radius * 1.8;
        cPositions[i * 3] = r * Math.cos(phi) * Math.cos(theta);
        cPositions[i * 3 + 1] = r * Math.sin(phi);
        cPositions[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

        const col = Math.random() > 0.4 ? new THREE.Color(0xf472b6) : new THREE.Color(0x38bdf8);
        cColors[i * 3] = col.r;
        cColors[i * 3 + 1] = col.g;
        cColors[i * 3 + 2] = col.b;
      }
      cGeo.setAttribute('position', new THREE.BufferAttribute(cPositions, 3));
      cGeo.setAttribute('color', new THREE.BufferAttribute(cColors, 3));

      const cMat = new THREE.PointsMaterial({
        size: 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      coronaParticles = new THREE.Points(cGeo, cMat);
      group.add(coronaParticles);
      break;
    }

    default:
      mainMaterial = new THREE.MeshStandardMaterial({ color: 0x64748b });
  }

  const planetMesh = new THREE.Mesh(sphereGeo, mainMaterial);
  group.add(planetMesh);

  // Natural axial tilt
  planetMesh.rotation.z = 0.15;

  let animTime = 0;

  return {
    group,
    update: (delta: number, sunDirection?: THREE.Vector3, cameraPosition?: THREE.Vector3) => {
      animTime += delta;

      // Axial rotation of the planet
      planetMesh.rotation.y += destination.rotationSpeed;

      // Clouds spin slightly faster to simulate atmospheric trade winds
      if (cloudsMesh) {
        cloudsMesh.rotation.y += destination.rotationSpeed * 1.25;
      }

      // Update shader uniforms based on sun position and camera
      if (mainMaterial instanceof THREE.ShaderMaterial) {
        if (sunDirection && mainMaterial.uniforms.uSunDirection) {
          mainMaterial.uniforms.uSunDirection.value.copy(sunDirection);
        }
        if (cameraPosition && mainMaterial.uniforms.uCameraPosition) {
          mainMaterial.uniforms.uCameraPosition.value.copy(cameraPosition);
        }
        if (mainMaterial.uniforms.uTime) {
          mainMaterial.uniforms.uTime.value = animTime;
        }
      }

      if (atmosphereMesh && atmosphereMesh.material instanceof THREE.ShaderMaterial) {
        if (sunDirection && atmosphereMesh.material.uniforms.uSunDirection) {
          atmosphereMesh.material.uniforms.uSunDirection.value.copy(sunDirection);
        }
        if (cameraPosition && atmosphereMesh.material.uniforms.uCameraPosition) {
          atmosphereMesh.material.uniforms.uCameraPosition.value.copy(cameraPosition);
        }
      }

      if (cloudsMesh && cloudsMesh.material instanceof THREE.ShaderMaterial) {
        if (sunDirection && cloudsMesh.material.uniforms.uSunDirection) {
          cloudsMesh.material.uniforms.uSunDirection.value.copy(sunDirection);
        }
        if (cameraPosition && cloudsMesh.material.uniforms.uCameraPosition) {
          cloudsMesh.material.uniforms.uCameraPosition.value.copy(cameraPosition);
        }
        if (cloudsMesh.material.uniforms.uTime) {
          cloudsMesh.material.uniforms.uTime.value = animTime;
        }
      }

      // Deep space accretion swirl
      if (accretionRings) {
        accretionRings.rotation.z += 0.005;
      }
      if (coronaParticles) {
        coronaParticles.rotation.y += 0.003;
        coronaParticles.rotation.x += 0.001;
      }
    },
    destroy: () => {
      sphereGeo.dispose();
      mainMaterial.dispose();
      if (atmosphereMesh) {
        atmosphereMesh.geometry.dispose();
        if (Array.isArray(atmosphereMesh.material)) {
          atmosphereMesh.material.forEach((m) => m.dispose());
        } else {
          atmosphereMesh.material.dispose();
        }
      }
      if (cloudsMesh) {
        cloudsMesh.geometry.dispose();
        if (Array.isArray(cloudsMesh.material)) {
          cloudsMesh.material.forEach((m) => m.dispose());
        } else {
          cloudsMesh.material.dispose();
        }
      }
    },
  };
}
