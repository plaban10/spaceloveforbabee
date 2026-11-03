import * as THREE from 'three';

export interface SpaceshipController {
  group: THREE.Group;
  update: (delta: number, isWarping: boolean) => void;
  setThrusterIntensity: (intensity: number) => void;
}

export function createSpaceship(): SpaceshipController {
  const group = new THREE.Group();

  // Materials
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    metalness: 0.85,
    roughness: 0.25,
  });

  const darkPlatesMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    metalness: 0.9,
    roughness: 0.4,
  });

  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    metalness: 0.95,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const thrusterCoreMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const thrusterPlumeMaterial = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.8,
  });

  // 1. Central Fuselage (Main Body)
  const fuselageGeo = new THREE.ConeGeometry(0.55, 3.2, 8);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, hullMaterial);
  fuselage.scale.set(1.1, 0.45, 1);
  group.add(fuselage);

  // 2. Cockpit Canopy
  const canopyGeo = new THREE.SphereGeometry(0.32, 16, 16);
  canopyGeo.scale(0.8, 0.35, 1.4);
  const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
  canopy.position.set(0, 0.2, 0.6);
  group.add(canopy);

  // 3. Swept-back Main Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.2, -1.2);
  wingShape.lineTo(2.0, -1.7);
  wingShape.lineTo(0.3, -1.1);
  wingShape.lineTo(0, -1.1);
  wingShape.closePath();

  const wingExtrudeSettings = {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  };

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  wingGeo.rotateX(Math.PI / 2);

  // Right Wing
  const rightWing = new THREE.Mesh(wingGeo, hullMaterial);
  rightWing.position.set(0.1, 0, 0.4);
  group.add(rightWing);

  // Left Wing (mirrored)
  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  leftWing.position.set(-0.1, 0, 0.4);
  group.add(leftWing);

  // 4. Warp Nacelles / Twin Engine Pods
  const nacelleGeo = new THREE.CylinderGeometry(0.16, 0.22, 2.2, 12);
  nacelleGeo.rotateX(Math.PI / 2);

  // Left Nacelle
  const leftNacelle = new THREE.Mesh(nacelleGeo, darkPlatesMaterial);
  leftNacelle.position.set(-1.4, 0.1, -0.6);
  group.add(leftNacelle);

  // Right Nacelle
  const rightNacelle = new THREE.Mesh(nacelleGeo, darkPlatesMaterial);
  rightNacelle.position.set(1.4, 0.1, -0.6);
  group.add(rightNacelle);

  // Nacelle Pylons
  const pylonGeo = new THREE.BoxGeometry(0.8, 0.06, 0.4);
  const leftPylon = new THREE.Mesh(pylonGeo, hullMaterial);
  leftPylon.position.set(-0.8, 0.05, -0.6);
  leftPylon.rotation.z = -0.15;
  group.add(leftPylon);

  const rightPylon = new THREE.Mesh(pylonGeo, hullMaterial);
  rightPylon.position.set(0.8, 0.05, -0.6);
  rightPylon.rotation.z = 0.15;
  group.add(rightPylon);

  // 5. Twin Engine Thruster Cores & Plumes
  const plumeGeo = new THREE.ConeGeometry(0.16, 1.4, 12);
  plumeGeo.rotateX(-Math.PI / 2);

  // Left Plume
  const leftPlume = new THREE.Mesh(plumeGeo, thrusterPlumeMaterial);
  leftPlume.position.set(-1.4, 0.1, -2.4);
  group.add(leftPlume);

  // Right Plume
  const rightPlume = new THREE.Mesh(plumeGeo, thrusterPlumeMaterial);
  rightPlume.position.set(1.4, 0.1, -2.4);
  group.add(rightPlume);

  // Main Central Engine
  const centerPlume = new THREE.Mesh(plumeGeo, thrusterPlumeMaterial);
  centerPlume.scale.set(1.3, 1.3, 1.3);
  centerPlume.position.set(0, 0.05, -2.2);
  group.add(centerPlume);

  // Thruster Light
  const thrusterLight = new THREE.PointLight(0x38bdf8, 2, 8);
  thrusterLight.position.set(0, 0, -2.2);
  group.add(thrusterLight);

  // Ship scale and position beside the planet
  group.scale.set(0.65, 0.65, 0.65);

  let hoverTime = 0;

  return {
    group,
    update: (delta: number, isWarping: boolean) => {
      hoverTime += delta;

      if (!isWarping) {
        // Natural gentle zero-G orbital drift
        group.position.y += Math.sin(hoverTime * 1.5) * 0.002;
        group.rotation.z = Math.sin(hoverTime * 0.8) * 0.03;
        group.rotation.x = Math.sin(hoverTime * 1.2) * 0.02;

        // Soft engine pulsing
        const pulse = 0.8 + Math.sin(hoverTime * 10) * 0.2;
        leftPlume.scale.set(1, 1, pulse);
        rightPlume.scale.set(1, 1, pulse);
        centerPlume.scale.set(1.3, 1.3, 1.3 * pulse);
        thrusterLight.intensity = 1.5 + pulse * 0.8;
      } else {
        // High-throttle warp acceleration posture
        group.rotation.x = -0.15;
        group.rotation.z = (Math.random() - 0.5) * 0.02;
        leftPlume.scale.set(2, 2, 3.5 + Math.random() * 0.5);
        rightPlume.scale.set(2, 2, 3.5 + Math.random() * 0.5);
        centerPlume.scale.set(2.4, 2.4, 4.5 + Math.random() * 0.6);
        thrusterLight.intensity = 5.0;
      }
    },
    setThrusterIntensity: (intensity: number) => {
      thrusterPlumeMaterial.opacity = Math.min(1, Math.max(0.2, intensity));
      thrusterLight.intensity = intensity * 3;
    },
  };
}
