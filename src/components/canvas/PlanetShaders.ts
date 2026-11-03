import * as THREE from 'three';
import { CelestialDestination } from '../../types';

export interface PlanetShaderUniforms {
  uMap: { value: THREE.Texture | null };
  uNightMap: { value: THREE.Texture | null };
  uNormalMap: { value: THREE.Texture | null };
  uHasNightLights: { value: number };
  uHasNormalMap: { value: number };
  uNormalScale: { value: number };
  uSunDirection: { value: THREE.Vector3 };
  uCameraPosition: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Color };
  uAtmosphereColor: { value: THREE.Color };
  uTwilightColor: { value: THREE.Color };
  uAtmosphereIntensity: { value: number };
  uTerminatorSoftness: { value: number };
  uNightAmbient: { value: number };
  uOceanSpecular: { value: number };
  uTime: { value: number };
}

export interface AtmosphereShaderUniforms {
  uSunDirection: { value: THREE.Vector3 };
  uCameraPosition: { value: THREE.Vector3 };
  uAtmosphereColor: { value: THREE.Color };
  uTwilightColor: { value: THREE.Color };
  uGlowIntensity: { value: number };
}

export interface CloudsShaderUniforms {
  uMap: { value: THREE.Texture | null };
  uSunDirection: { value: THREE.Vector3 };
  uCameraPosition: { value: THREE.Vector3 };
  uSunColor: { value: THREE.Color };
  uTwilightColor: { value: THREE.Color };
  uTerminatorSoftness: { value: number };
  uTime: { value: number };
}

/**
 * Custom Planet Surface Shader Material
 * Computes realistic light-side / dark-side terminator line,
 * normal mapping from procedural noise texture (craters, mountain ranges),
 * procedural atmospheric haze / rim lighting, Rayleigh twilight/sunset scattering,
 * ocean specular reflection, and night city lights.
 */
export function createPlanetSurfaceMaterial(
  destination: CelestialDestination,
  diffuseMap: THREE.Texture,
  nightMap?: THREE.Texture | null,
  normalMap?: THREE.Texture | null
): THREE.ShaderMaterial {
  const atmoColor = new THREE.Color(destination.atmosphereColor || destination.themeColor || 0x38bdf8);
  const twilightColor = new THREE.Color(destination.twilightColor || 0xf97316);
  const sunColor = new THREE.Color(0xfff8ed);

  // Normal bump scale tailored per planetary terrain ruggedness
  const normalScale =
    destination.id === 'moon'
      ? 1.45
      : destination.id === 'mars'
      ? 1.25
      : destination.id === 'earth'
      ? 0.95
      : destination.id === 'venus'
      ? 0.85
      : destination.id === 'deepspace'
      ? 0.65
      : 0.45;

  const uniforms: PlanetShaderUniforms = {
    uMap: { value: diffuseMap },
    uNightMap: { value: nightMap || null },
    uNormalMap: { value: normalMap || null },
    uHasNightLights: { value: destination.hasNightLights && nightMap ? 1.0 : 0.0 },
    uHasNormalMap: { value: normalMap ? 1.0 : 0.0 },
    uNormalScale: { value: normalScale },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uCameraPosition: { value: new THREE.Vector3(0, 0, 15) },
    uSunColor: { value: sunColor },
    uAtmosphereColor: { value: atmoColor },
    uTwilightColor: { value: twilightColor },
    uAtmosphereIntensity: { value: destination.atmosphereIntensity ?? (destination.hasAtmosphereGlow ? 0.75 : 0.0) },
    uTerminatorSoftness: { value: destination.terminatorSoftness ?? 0.2 },
    uNightAmbient: { value: 0.04 }, // Subtle cosmic starlight on the unlit hemisphere
    uOceanSpecular: { value: destination.oceanSpecular ?? 0.0 },
    uTime: { value: 0 },
  };

  const vertexShader = `
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPositionWorld = worldPos.xyz;
      // Transform normal into world space
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uMap;
    uniform sampler2D uNightMap;
    uniform sampler2D uNormalMap;
    uniform float uHasNightLights;
    uniform float uHasNormalMap;
    uniform float uNormalScale;
    uniform vec3 uSunDirection;
    uniform vec3 uCameraPosition;
    uniform vec3 uSunColor;
    uniform vec3 uAtmosphereColor;
    uniform vec3 uTwilightColor;
    uniform float uAtmosphereIntensity;
    uniform float uTerminatorSoftness;
    uniform float uNightAmbient;
    uniform float uOceanSpecular;
    uniform float uTime;

    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec2 vUv;

    // Normal mapping function reading from procedural noise texture
    // Reconstructs orthonormal tangent-bitangent-normal (TBN) frame
    // and perturbs normal vector according to terrain craters, canyons, and mountain ridges
    vec3 getPerturbedNormal(vec3 surfNormal, vec3 worldPos, vec2 uv) {
      if (uHasNormalMap < 0.5) return surfNormal;
      vec3 normalTex = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
      normalTex.xy *= uNormalScale;

      // Screen-space derivation for orthonormal tangent/bitangent frame
      vec3 q0 = dFdx(worldPos);
      vec3 q1 = dFdy(worldPos);
      vec2 st0 = dFdx(uv);
      vec2 st1 = dFdy(uv);

      vec3 S = normalize(q0 * st1.t - q1 * st0.t);
      vec3 T = normalize(-q0 * st1.s + q1 * st0.s);
      vec3 N = normalize(surfNormal);

      // Gram-Schmidt orthogonalization
      S = normalize(S - N * dot(N, S));
      T = normalize(cross(N, S));
      mat3 tbn = mat3(S, T, N);

      return normalize(tbn * normalTex);
    }

    void main() {
      vec3 geomN = normalize(vNormalWorld);
      vec3 L = normalize(uSunDirection);
      vec3 V = normalize(uCameraPosition - vPositionWorld);

      // Perturb normal using procedural noise normal map (craters, mountains, rift valleys)
      vec3 N = getPerturbedNormal(geomN, vPositionWorld, vUv);

      // Diffuse texture
      vec4 texSample = texture2D(uMap, vUv);
      vec3 albedo = texSample.rgb;

      // 1. Light-side / Dark-side Terminator calculation
      // Both geometric normal and terrain bump normal contribute to illumination
      float NdotL = dot(N, L);
      float geomNdotL = dot(geomN, L);

      // Smooth step creates a physically accurate twilight transition zone
      float s = max(0.015, uTerminatorSoftness);
      float dayFactor = smoothstep(-s, s, NdotL);
      float macroDayFactor = smoothstep(-s * 1.5, s * 0.8, geomNdotL);

      // 2. Rayleigh Twilight / Sunset Scattering Band
      // Sunlight passing through grazing atmospheric layers along the terminator line
      // scatters warm longer wavelengths (sunset red/gold/amber on Earth/Venus, sapphire on Mars)
      float twilightPeak = exp(-pow(geomNdotL / (s * 0.9), 2.0));
      vec3 twilightGlow = uTwilightColor * (twilightPeak * (uAtmosphereIntensity * 0.95 + 0.18));

      // 3. Procedural Atmospheric 'Haze' & Rim Light Effect on Edges of Planet Sphere
      // Increases optical depth and depth perception of spherical celestial bodies
      float VdotGeomN = max(0.0, dot(V, geomN));
      float edgeRim = pow(1.0 - VdotGeomN, 2.4); // Increases strongly towards sphere silhouette

      // Sun exposure modulation: rim is brightest on sunlit side, with soft twilight roll-off
      float sunLimbExposure = smoothstep(-0.3, 0.4, geomNdotL);
      // Forward scattering halo when viewing backlit crescent
      float forwardScatter = pow(max(0.0, dot(V, -L)), 3.2);

      // Multi-layer procedural haze color shifting from horizon blue/amber to deep space
      vec3 edgeHazeColor = mix(uAtmosphereColor, uTwilightColor, twilightPeak * 0.65);
      vec3 proceduralAtmosphericHaze = edgeHazeColor * (edgeRim * (sunLimbExposure * 0.85 + 0.15) + forwardScatter * 0.5) * (uAtmosphereIntensity * 1.15);

      // 4. Specular reflection (for planetary oceans)
      float specular = 0.0;
      if (uOceanSpecular > 0.02) {
        // Distinguish ocean from land via texture chroma (ocean has low red relative to green/blue)
        float isOcean = smoothstep(0.02, 0.12, (albedo.b + albedo.g * 0.5) - albedo.r * 1.2);
        vec3 H = normalize(L + V);
        float NdotH = max(0.0, dot(N, H));
        specular = pow(NdotH, 38.0) * uOceanSpecular * isOcean * dayFactor;
      }

      // 5. Illumination Blending with Terrain Relief Shadowing
      float diffuse = max(0.0, (NdotL + s * 0.4) / (1.0 + s * 0.4));
      vec3 sunlitAlbedo = albedo * uSunColor * (diffuse * 0.92 + 0.08);

      // Night side receives subtle cosmic starlight ambient
      vec3 darkAlbedo = albedo * uNightAmbient;

      // Interpolate between night and day across the terminator
      vec3 surfaceColor = mix(darkAlbedo, sunlitAlbedo, dayFactor);

      // Blend in the warm sunset terminator band
      surfaceColor += twilightGlow;

      // Add procedural atmospheric haze and edge rim lighting
      surfaceColor += proceduralAtmosphericHaze;

      // Add ocean specular glint
      surfaceColor += uSunColor * specular;

      // 6. Night Lights (City clusters on the unlit hemisphere for inhabited worlds)
      if (uHasNightLights > 0.5) {
        vec3 nightLightsTex = texture2D(uNightMap, vUv).rgb;
        // Night lights appear on the dark side and seamlessly vanish past the terminator
        float nightLightMask = 1.0 - smoothstep(-s * 1.4, s * 0.2, geomNdotL);
        vec3 glowingCityLights = nightLightsTex * nightLightMask * 1.9;
        surfaceColor += glowingCityLights;
      }

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader,
    fragmentShader,
  });
}

/**
 * Custom Atmospheric Glow Outer Shell Shader Material
 * Accurately simulates the volumetric rim of planetary atmospheres,
 * illuminated by the sun's position with sunset reddening at the terminator edge
 * and forward Rayleigh scattering.
 */
export function createAtmosphereGlowMaterial(
  destination: CelestialDestination
): THREE.ShaderMaterial {
  const atmoColor = new THREE.Color(destination.atmosphereColor || destination.themeColor || 0x38bdf8);
  const twilightColor = new THREE.Color(destination.twilightColor || 0xf97316);

  const uniforms: AtmosphereShaderUniforms = {
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uCameraPosition: { value: new THREE.Vector3(0, 0, 15) },
    uAtmosphereColor: { value: atmoColor },
    uTwilightColor: { value: twilightColor },
    uGlowIntensity: { value: destination.atmosphereIntensity ?? 1.0 },
  };

  const vertexShader = `
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPositionWorld = worldPos.xyz;
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform vec3 uSunDirection;
    uniform vec3 uCameraPosition;
    uniform vec3 uAtmosphereColor;
    uniform vec3 uTwilightColor;
    uniform float uGlowIntensity;

    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;

    void main() {
      vec3 N = normalize(vNormalWorld);
      vec3 L = normalize(uSunDirection);
      vec3 V = normalize(uCameraPosition - vPositionWorld);

      // Rim grazing angle for outer shell (using BackSide, N points outward, V is towards camera)
      // On the back hemisphere of the outer sphere, dot(V, N) is negative
      float VdotN = max(0.0, dot(V, -N));
      float rim = pow(VdotN, 2.5);

      // Sun alignment: the atmosphere is brightly illuminated on the sun-facing side
      float NdotL = dot(N, L);
      // Soft transition from sunlit limb to unlit space
      float sunExposure = smoothstep(-0.35, 0.45, NdotL);

      // Twilight reddening along the limb near the terminator
      float twilightFactor = exp(-pow(NdotL / 0.38, 2.0));
      vec3 dynamicAtmoColor = mix(uAtmosphereColor, uTwilightColor, twilightFactor * 0.85);

      // Forward Rayleigh scattering when camera looks in direction of the sun
      float forwardScatter = pow(max(0.0, dot(V, -L)), 2.8);

      // Alpha intensity combining rim falloff, sun exposure, and forward scatter
      float alpha = (rim * sunExposure + pow(rim, 3.8) * forwardScatter * 1.6) * uGlowIntensity * 0.95;

      gl_FragColor = vec4(dynamicAtmoColor, clamp(alpha, 0.0, 1.0));
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * Custom Cloud Layer Shader Material (e.g. for Earth)
 * Responds dynamically to the sun's position, casting clouds in shadow on the night hemisphere
 * and tinting them with golden sunset highlights right at the terminator line.
 */
export function createEarthCloudsMaterial(
  cloudsMap: THREE.Texture,
  twilightHex = 0xf97316
): THREE.ShaderMaterial {
  const twilightColor = new THREE.Color(twilightHex);
  const sunColor = new THREE.Color(0xfff8ed);

  const uniforms: CloudsShaderUniforms = {
    uMap: { value: cloudsMap },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uCameraPosition: { value: new THREE.Vector3(0, 0, 15) },
    uSunColor: { value: sunColor },
    uTwilightColor: { value: twilightColor },
    uTerminatorSoftness: { value: 0.22 },
    uTime: { value: 0 },
  };

  const vertexShader = `
    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPositionWorld = worldPos.xyz;
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
    uniform sampler2D uMap;
    uniform vec3 uSunDirection;
    uniform vec3 uCameraPosition;
    uniform vec3 uSunColor;
    uniform vec3 uTwilightColor;
    uniform float uTerminatorSoftness;

    varying vec3 vNormalWorld;
    varying vec3 vPositionWorld;
    varying vec2 vUv;

    void main() {
      vec4 cloudSample = texture2D(uMap, vUv);
      float cloudAlpha = cloudSample.a;
      if (cloudAlpha < 0.02) discard;

      vec3 N = normalize(vNormalWorld);
      vec3 L = normalize(uSunDirection);

      float NdotL = dot(N, L);
      float s = uTerminatorSoftness;
      float dayFactor = smoothstep(-s, s, NdotL);

      // Sunset twilight color on cloud tops along the terminator
      float twilight = exp(-pow(NdotL / (s * 0.95), 2.0));
      vec3 cloudLitColor = mix(uSunColor, uTwilightColor, twilight * 0.85);

      // Lit clouds vs dark night clouds (faint ambient opacity so clouds don't abruptly vanish)
      vec3 cloudNightColor = vec3(0.04, 0.06, 0.1);
      vec3 cloudFinalColor = mix(cloudNightColor, cloudLitColor, dayFactor);

      // Night clouds are more translucent
      float finalAlpha = cloudAlpha * (dayFactor * 0.85 + 0.12);

      gl_FragColor = vec4(cloudFinalColor, finalAlpha);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}
