export type FlightPhase = 'intro' | 'warp' | 'orbit';

export interface CelestialDestination {
  id: string;
  name: string;
  subtitle: string;
  worldIndex: number; // 0 is Earth (Intro), 1..7 for the 7 worlds
  poeticCaption: string;
  extendedStory: string;
  distanceFromEarth: string;
  distanceKmNumeric: number;
  orbitalVelocity: string;
  temperature: string;
  atmosphere: string;
  diameter: string;
  gravity: string;
  themeColor: string; // Accent color hex
  ambientColor: string; // Three.js light color
  meshType: 'earth' | 'moon' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'neptune' | 'deepspace';
  radius: number;
  rotationSpeed: number;
  hasAtmosphereGlow?: boolean;
  atmosphereColor?: string;
  twilightColor?: string; // Rayleigh scattering color at the terminator sunset band
  terminatorSoftness?: number; // Smoothness of the day/night boundary (0.02 airless to 0.35 dense atmosphere)
  atmosphereIntensity?: number; // Surface atmospheric haze scattering factor
  oceanSpecular?: number; // Ocean / surface specular reflection factor
  hasNightLights?: boolean; // Night side city lights (Earth)
  hasRings?: boolean;
}

export type CameraMode = 'orbit' | 'cockpit' | 'flyby';

export interface TelemetryState {
  distanceCurrentKm: number;
  warpProgress: number; // 0 to 1
  missionElapsedTime: number; // in seconds
  hullIntegrity: number; // percentage (e.g. 100%)
  warpDriveCharge: number; // percentage (e.g. 100%)
  coordinates: { x: number; y: number; z: number };
}
