import * as THREE from 'three';

// Cache generated textures so we do not re-render them repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

function createNoise(ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = (Math.random() - 0.5) * 255 * opacity;
    data[i] = Math.min(255, Math.max(0, data[i] + val));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + val));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + val));
  }
  ctx.putImageData(imgData, 0, 0);
}

// 1. Earth Texture
export function getEarthTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth')) return textureCache.get('earth')!;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0a1d37');
  oceanGrad.addColorStop(0.5, '#072448');
  oceanGrad.addColorStop(1, '#0a1d37');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continental shapes (stylized geography)
  const drawContinent = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
    points = 16
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const dist = (0.7 + Math.sin(angle * 3) * 0.2 + Math.cos(angle * 5) * 0.15) * 1.0;
      const x = cx + Math.cos(angle) * rx * dist;
      const y = cy + Math.sin(angle) * ry * dist;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // North America
  drawContinent(550, 320, 260, 180, '#2d5a3f');
  drawContinent(500, 300, 140, 100, '#466b44');
  // South America
  drawContinent(700, 680, 150, 260, '#2b5735');
  drawContinent(730, 720, 90, 180, '#214d2a');
  // Eurasia
  drawContinent(1300, 320, 380, 200, '#365338');
  drawContinent(1550, 350, 280, 160, '#4b6b45');
  // Africa
  drawContinent(1100, 560, 200, 250, '#59693d');
  drawContinent(1120, 500, 160, 140, '#a39366'); // Sahara
  // Australia
  drawContinent(1680, 720, 130, 110, '#8c6d48');
  // Polar Caps
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, 30, canvas.width / 2, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height - 30, canvas.width / 2, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  createNoise(ctx, canvas.width, canvas.height, 0.12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth', texture);
  return texture;
}

// 1b. Earth Night Lights Texture (City clusters glowing on night hemisphere)
export function getEarthNightTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth_night')) return textureCache.get('earth_night')!;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep black ocean & unpopulated night
  ctx.fillStyle = '#010204';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to draw city light clusters with warm golden/amber glow
  const drawCityCluster = (
    cx: number,
    cy: number,
    radius: number,
    density: number,
    brightColor = '#fef08a',
    glowColor = 'rgba(245, 158, 11, 0.35)'
  ) => {
    // Ambient urban glow
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Individual bright light nodes
    ctx.fillStyle = brightColor;
    for (let i = 0; i < density; i++) {
      const r = Math.pow(Math.random(), 1.5) * radius * 0.85;
      const angle = Math.random() * Math.PI * 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const size = 0.8 + Math.random() * 1.6;
      ctx.fillRect(x, y, size, size);
    }
  };

  // Major Population Centers & Metropolitan corridors
  // North America (US East Coast, Megalopolis Boston-DC, Chicago, West Coast)
  drawCityCluster(620, 310, 48, 65, '#fef08a', 'rgba(251, 191, 36, 0.4)');
  drawCityCluster(580, 320, 35, 45, '#fde047', 'rgba(245, 158, 11, 0.35)');
  drawCityCluster(540, 310, 30, 35, '#fde047', 'rgba(245, 158, 11, 0.3)');
  drawCityCluster(480, 320, 25, 25, '#fef08a', 'rgba(251, 191, 36, 0.3)'); // California
  drawCityCluster(560, 380, 25, 25, '#fde047', 'rgba(245, 158, 11, 0.25)'); // Texas / Mexico

  // Europe (London, Paris, Rhine-Ruhr, Milan, Benelux, Madrid)
  drawCityCluster(1220, 260, 45, 75, '#ffffff', 'rgba(253, 224, 71, 0.45)');
  drawCityCluster(1260, 280, 40, 60, '#fef08a', 'rgba(251, 191, 36, 0.4)');
  drawCityCluster(1300, 290, 35, 50, '#fde047', 'rgba(245, 158, 11, 0.35)');
  drawCityCluster(1190, 310, 25, 30, '#fef08a', 'rgba(251, 191, 36, 0.3)'); // Iberian

  // Middle East & Nile River ribbon
  drawCityCluster(1200, 380, 15, 35, '#ffffff', 'rgba(253, 224, 71, 0.5)'); // Nile Delta
  drawCityCluster(1280, 410, 28, 35, '#fde047', 'rgba(245, 158, 11, 0.35)'); // Persian Gulf

  // India & South Asia (Ganges Plain, Mumbai, Delhi, Bengaluru)
  drawCityCluster(1420, 410, 45, 80, '#fef08a', 'rgba(251, 191, 36, 0.45)');
  drawCityCluster(1450, 450, 35, 60, '#fde047', 'rgba(245, 158, 11, 0.35)');

  // East Asia (Pearl River Delta, Yangtze River / Shanghai, Beijing, Japan, Seoul)
  drawCityCluster(1600, 340, 40, 65, '#ffffff', 'rgba(253, 224, 71, 0.45)'); // Beijing/Tianjin
  drawCityCluster(1620, 380, 45, 75, '#ffffff', 'rgba(253, 224, 71, 0.45)'); // Shanghai
  drawCityCluster(1580, 430, 40, 60, '#fef08a', 'rgba(251, 191, 36, 0.4)'); // Guangzhou/HK
  drawCityCluster(1690, 350, 35, 70, '#ffffff', 'rgba(253, 224, 71, 0.5)'); // Tokyo / Japan corridor
  drawCityCluster(1650, 340, 20, 40, '#ffffff', 'rgba(253, 224, 71, 0.45)'); // Seoul

  // South America (São Paulo, Rio, Buenos Aires)
  drawCityCluster(750, 720, 30, 35, '#fde047', 'rgba(245, 158, 11, 0.3)');
  drawCityCluster(720, 770, 25, 25, '#fde047', 'rgba(245, 158, 11, 0.25)');

  // Australia (Sydney, Melbourne)
  drawCityCluster(1740, 750, 20, 25, '#fef08a', 'rgba(251, 191, 36, 0.3)');

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth_night', texture);
  return texture;
}

// 1c. Earth Cloud Layer Texture (semi-transparent)
export function getEarthCloudsTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth_clouds')) return textureCache.get('earth_clouds')!;

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Swirling cloud filaments
  for (let i = 0; i < 45; i++) {
    const cx = Math.random() * canvas.width;
    const cy = 150 + Math.random() * (canvas.height - 300);
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160 + Math.random() * 140);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180 + Math.random() * 120, 60 + Math.random() * 50, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth_clouds', texture);
  return texture;
}

// 2. Moon Texture (craters, maria, lunar regolith)
export function getMoonTexture(): THREE.CanvasTexture {
  if (textureCache.has('moon')) return textureCache.get('moon')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8f949c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Lunar Maria (dark basalt plains)
  const drawMare = (cx: number, cy: number, r: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, '#515459');
    grad.addColorStop(0.7, '#676b73');
    grad.addColorStop(1, 'rgba(143, 148, 156, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  drawMare(350, 220, 130); // Mare Imbrium
  drawMare(520, 250, 110); // Mare Serenitatis
  drawMare(600, 310, 90);  // Mare Tranquillitatis
  drawMare(250, 320, 150); // Oceanus Procellarum
  drawMare(800, 200, 70);
  drawMare(750, 340, 60);

  // Craters with rim shadows
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 4 + Math.random() * 18;

    // Rim highlight
    ctx.strokeStyle = '#cdd1d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, -0.5, Math.PI * 0.8);
    ctx.stroke();

    // Crater interior shadow
    ctx.fillStyle = '#393c42';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  createNoise(ctx, canvas.width, canvas.height, 0.18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('moon', texture);
  return texture;
}

// 3. Venus Texture (golden sulfuric atmosphere swirls)
export function getVenusTexture(): THREE.CanvasTexture {
  if (textureCache.has('venus')) return textureCache.get('venus')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  baseGrad.addColorStop(0, '#fef08a');
  baseGrad.addColorStop(0.3, '#fde047');
  baseGrad.addColorStop(0.5, '#eab308');
  baseGrad.addColorStop(0.7, '#ca8a04');
  baseGrad.addColorStop(1, '#a16207');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Smooth swirling haze bands
  for (let y = 0; y < canvas.height; y += 4) {
    const sin1 = Math.sin(y * 0.05) * 25;
    const sin2 = Math.cos(y * 0.02) * 15;
    ctx.fillStyle = (y % 8 === 0) ? 'rgba(254, 240, 138, 0.18)' : 'rgba(161, 98, 7, 0.14)';
    ctx.fillRect(0, y + sin1 + sin2, canvas.width, 3);
  }

  // Large atmospheric V-shape vortex bands
  for (let i = 0; i < 15; i++) {
    const cx = (i / 15) * canvas.width;
    const grad = ctx.createRadialGradient(cx, 256, 20, cx, 256, 300);
    grad.addColorStop(0, 'rgba(255, 247, 237, 0.25)');
    grad.addColorStop(1, 'rgba(180, 83, 9, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  createNoise(ctx, canvas.width, canvas.height, 0.06);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('venus', texture);
  return texture;
}

// 4. Mars Texture (red iron oxide, canyons, polar ice cap)
export function getMarsTexture(): THREE.CanvasTexture {
  if (textureCache.has('mars')) return textureCache.get('mars')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b9472e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Darker volcanic basalt plains (Syrtis Major, Sinus Sabaeus)
  const drawDarkHighland = (cx: number, cy: number, w: number, h: number) => {
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w);
    grad.addColorStop(0, '#5f2316');
    grad.addColorStop(0.7, '#853220');
    grad.addColorStop(1, 'rgba(185, 71, 46, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  drawDarkHighland(300, 260, 160, 80);
  drawDarkHighland(550, 300, 180, 90);
  drawDarkHighland(800, 240, 140, 70);

  // Valles Marineris canyon rift line
  ctx.strokeStyle = '#3e160e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(350, 280);
  ctx.bezierCurveTo(450, 290, 520, 275, 620, 285);
  ctx.stroke();

  // Olympus Mons caldera ring
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(220, 200, 24, 0, Math.PI * 2);
  ctx.stroke();

  // White polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, 20, canvas.width / 2, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, canvas.height - 15, canvas.width / 2, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  createNoise(ctx, canvas.width, canvas.height, 0.16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('mars', texture);
  return texture;
}

// 5. Jupiter Texture (atmospheric zones, belts, Great Red Spot)
export function getJupiterTexture(): THREE.CanvasTexture {
  if (textureCache.has('jupiter')) return textureCache.get('jupiter')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Alternating ammonia and phosphor-colored gas stripes
  const bands = [
    '#5c3d28', '#8c593b', '#d4a373', '#fefae0', '#bc6c25',
    '#99582a', '#e09f3e', '#fff1e6', '#c97a3e', '#6f4518',
    '#3e2723', '#a76d47', '#fde2e4', '#b08968', '#4a3525'
  ];

  const bandHeight = canvas.height / bands.length;
  for (let i = 0; i < bands.length; i++) {
    const y = i * bandHeight;
    ctx.fillStyle = bands[i];
    ctx.fillRect(0, y, canvas.width, bandHeight + 1);

    // Wavy turbulence on boundaries
    ctx.fillStyle = bands[(i + 1) % bands.length];
    ctx.beginPath();
    ctx.moveTo(0, y + bandHeight);
    for (let x = 0; x <= canvas.width; x += 30) {
      const offset = Math.sin((x / 60) + i) * 6 + Math.cos(x / 40) * 4;
      ctx.lineTo(x, y + bandHeight + offset);
    }
    ctx.lineTo(canvas.width, y + bandHeight);
    ctx.lineTo(0, y + bandHeight);
    ctx.fill();
  }

  // The Great Red Spot (iconic giant anticyclonic storm)
  const spotX = 640;
  const spotY = 320;
  const spotGrad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 50);
  spotGrad.addColorStop(0, '#dc2626');
  spotGrad.addColorStop(0.6, '#b91c1c');
  spotGrad.addColorStop(0.85, '#e07a5f');
  spotGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 65, 38, -0.08, 0, Math.PI * 2);
  ctx.fill();

  createNoise(ctx, canvas.width, canvas.height, 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('jupiter', texture);
  return texture;
}

// 6. Saturn Texture & Rings
export function getSaturnTexture(): THREE.CanvasTexture {
  if (textureCache.has('saturn')) return textureCache.get('saturn')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#ca8a04');
  grad.addColorStop(0.2, '#fde047');
  grad.addColorStop(0.4, '#eab308');
  grad.addColorStop(0.6, '#d97706');
  grad.addColorStop(0.8, '#fef08a');
  grad.addColorStop(1, '#b45309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft subtle pastel stripes
  for (let y = 0; y < canvas.height; y += 8) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(0, y, canvas.width, 3);
  }

  createNoise(ctx, canvas.width, canvas.height, 0.04);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('saturn', texture);
  return texture;
}

// 6b. Saturn Rings Texture (alpha gradient across the ring radii)
export function getSaturnRingsTexture(): THREE.CanvasTexture {
  if (textureCache.has('saturn_rings')) return textureCache.get('saturn_rings')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.1, 'rgba(234, 179, 8, 0.2)');
  grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)'); // Ring C
  grad.addColorStop(0.48, 'rgba(253, 224, 71, 0.9)');  // Ring B (densest)
  grad.addColorStop(0.53, 'rgba(0, 0, 0, 0.05)');       // Cassini Division gap!
  grad.addColorStop(0.58, 'rgba(245, 158, 11, 0.7)');  // Ring A
  grad.addColorStop(0.72, 'rgba(254, 240, 138, 0.5)');
  grad.addColorStop(0.85, 'rgba(202, 138, 4, 0.15)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Concentric fine micro-grooves
  for (let x = 0; x < canvas.width; x += 3) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, 0, 1, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('saturn_rings', texture);
  return texture;
}

// 7. Neptune Texture (deep vibrant azure, supersonic white cirrus streaks)
export function getNeptuneTexture(): THREE.CanvasTexture {
  if (textureCache.has('neptune')) return textureCache.get('neptune')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.3, '#0369a1');
  grad.addColorStop(0.5, '#0284c7');
  grad.addColorStop(0.7, '#075985');
  grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Great Dark Spot
  const darkGrad = ctx.createRadialGradient(420, 270, 5, 420, 270, 45);
  darkGrad.addColorStop(0, '#082f49');
  darkGrad.addColorStop(0.8, '#0c4a6e');
  darkGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = darkGrad;
  ctx.beginPath();
  ctx.ellipse(420, 270, 55, 30, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // High altitude brilliant white methane cirrus cloud streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * (canvas.width - 250);
    const y = 80 + Math.random() * (canvas.height - 160);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 50, y - 5, x + 120, y + 4, x + 200, y - 2);
    ctx.stroke();
  }

  createNoise(ctx, canvas.width, canvas.height, 0.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('neptune', texture);
  return texture;
}

// 8. Deep Space / Final Destination (Cosmic singularity / iridescent glowing stellar nebula core)
export function getDeepSpaceCoreTexture(): THREE.CanvasTexture {
  if (textureCache.has('deepspace_core')) return textureCache.get('deepspace_core')!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Iridescent stellar nebula background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#090514');
  grad.addColorStop(0.25, '#2e1065');
  grad.addColorStop(0.5, '#581c87');
  grad.addColorStop(0.75, '#831843');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Radiant cosmic plasma tendrils
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 80 + Math.random() * 160;
    const pGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    pGrad.addColorStop(0, 'rgba(232, 121, 249, 0.45)');
    pGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glittering micro-stars inside the celestial heart
  for (let i = 0; i < 250; i++) {
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    const brightness = Math.random();
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.9})`;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('deepspace_core', texture);
  return texture;
}

// 9. Procedural Normal Map Generator for Planetary Surfaces (Craters, Mountains, Rifts, Storms)
export function getPlanetNormalTexture(destinationId: string): THREE.CanvasTexture {
  const cacheKey = `normal_${destinationId}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const width = 1024;
  const height = 512;
  const heightMap = new Float32Array(width * height);

  // Simple pseudo-random hash
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // Smooth 2D noise helper
  const smoothNoise = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const n00 = hash(i, j);
    const n10 = hash(i + 1, j);
    const n01 = hash(i, j + 1);
    const n11 = hash(i + 1, j + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  };

  // Multi-octave fractal noise
  const fbm = (x: number, y: number, octaves = 5) => {
    let val = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let o = 0; o < octaves; o++) {
      val += smoothNoise(x * freq, y * freq) * amp;
      freq *= 2.05;
      amp *= 0.5;
    }
    return val;
  };

  // Generate heightfield based on planetary archetype
  if (destinationId === 'moon') {
    // Lunar terrain: Rugged highlands + prominent impact craters with rims & central peaks
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const baseNoise = fbm(u * 16, v * 16, 5) * 0.45;
        const fineNoise = fbm(u * 48, v * 48, 3) * 0.15;
        heightMap[y * width + x] = baseNoise + fineNoise;
      }
    }

    // Carve 180 procedural impact craters
    const craterCount = 180;
    for (let c = 0; c < craterCount; c++) {
      const cx = hash(c * 17.1, c * 31.7) * width;
      const cy = (hash(c * 23.4, c * 59.2) * 0.8 + 0.1) * height;
      const radius = 6 + Math.pow(hash(c * 43.1, c * 11.9), 2.5) * 42;
      const depth = 0.35 + hash(c * 19.3, c * 7.1) * 0.45;
      const rimHeight = depth * 0.65;

      const minX = Math.max(0, Math.floor(cx - radius * 1.5));
      const maxX = Math.min(width - 1, Math.ceil(cx + radius * 1.5));
      const minY = Math.max(0, Math.floor(cy - radius * 1.5));
      const maxY = Math.min(height - 1, Math.ceil(cy + radius * 1.5));

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const dx = px - cx;
          const dy = py - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius * 1.4) {
            const normDist = dist / radius;
            let craterDelta = 0;

            if (normDist < 0.85) {
              // Excavated crater depression
              craterDelta = -depth * (1.0 - Math.pow(normDist / 0.85, 2));
              // Central rebound peak for larger craters
              if (radius > 16 && normDist < 0.25) {
                craterDelta += rimHeight * (1.0 - normDist / 0.25) * 0.8;
              }
            } else if (normDist <= 1.35) {
              // Raised crater rim
              const rimFactor = (normDist - 0.85) / 0.5;
              craterDelta = rimHeight * Math.sin(rimFactor * Math.PI);
            }

            heightMap[py * width + px] += craterDelta;
          }
        }
      }
    }
  } else if (destinationId === 'mars') {
    // Martian terrain: Volcanic calderas (Olympus Mons), Valles Marineris canyon rift, rugged cratered highlands
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const base = fbm(u * 12, v * 12, 6) * 0.5;
        const ridge = Math.abs(fbm(u * 20, v * 20, 4) - 0.5) * 0.4;
        heightMap[y * width + x] = base + ridge;
      }
    }

    // Add Valles Marineris canyon system (deep equatorial rift)
    for (let x = 320; x < 680; x++) {
      const u = (x - 320) / 360;
      const centerY = 265 + Math.sin(u * Math.PI * 3) * 12;
      for (let dy = -18; dy <= 18; dy++) {
        const y = Math.round(centerY + dy);
        if (y >= 0 && y < height) {
          const canyonDist = Math.abs(dy) / 18;
          const canyonDepth = -0.65 * (1.0 - canyonDist * canyonDist) * Math.sin(u * Math.PI);
          heightMap[y * width + x] += canyonDepth;
        }
      }
    }

    // Add Olympus Mons volcanic caldera dome
    const vcx = 280;
    const vcy = 210;
    const vr = 48;
    for (let dy = -vr; dy <= vr; dy++) {
      for (let dx = -vr; dx <= vr; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= vr) {
          const nd = dist / vr;
          let dome = (1.0 - nd * nd) * 0.8;
          // Caldera crater at the summit
          if (nd < 0.22) {
            dome -= 0.35 * (1.0 - nd / 0.22);
          }
          const px = (vcx + dx + width) % width;
          const py = Math.max(0, Math.min(height - 1, vcy + dy));
          heightMap[py * width + px] += dome;
        }
      }
    }
  } else if (destinationId === 'earth') {
    // Earth: Rugged continental mountain belts (Himalayas, Andes, Rockies), smooth ocean floors
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const continentNoise = fbm(u * 8, v * 8, 4);
        const mountainRidge = Math.pow(Math.abs(fbm(u * 28 + 0.3, v * 28 + 0.3, 4) * 2 - 1), 2) * 0.6;
        heightMap[y * width + x] = continentNoise * 0.4 + mountainRidge * 0.35;
      }
    }
  } else if (destinationId === 'venus') {
    // Venus: Volcanic tesserae, wrinkly basalt ridges, lava plateaus
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const ridges = Math.abs(Math.sin(u * 40 + fbm(u * 12, v * 12, 3) * 6)) * 0.35;
        const rolling = fbm(u * 14, v * 14, 5) * 0.4;
        heightMap[y * width + x] = ridges + rolling;
      }
    }
  } else if (destinationId === 'jupiter' || destinationId === 'saturn' || destinationId === 'neptune') {
    // Gas Giants: Cloud belt shear waves, vortices, Great Red Spot atmospheric swell
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const beltBands = Math.sin(v * 48 + fbm(u * 10, v * 8, 3) * 3) * 0.28;
        const shearWaves = fbm(u * 32, v * 16, 4) * 0.22;
        heightMap[y * width + x] = beltBands + shearWaves;
      }
    }
  } else {
    // Deep Space: Gravitational ripple singularity waves
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const ripple = Math.sin(Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2)) * 60) * 0.35;
        heightMap[y * width + x] = ripple + fbm(u * 18, v * 18, 4) * 0.25;
      }
    }
  }

  // Convert heightfield to RGB tangent-space normal map using Sobel filter
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const bumpStrength = destinationId === 'moon' ? 2.8 : destinationId === 'mars' ? 2.2 : 1.6;

  for (let y = 0; y < height; y++) {
    const yPrev = Math.max(0, y - 1) * width;
    const yNext = Math.min(height - 1, y + 1) * width;
    const yCurr = y * width;

    for (let x = 0; x < width; x++) {
      const xPrev = (x - 1 + width) % width;
      const xNext = (x + 1) % width;

      // Sobel kernel horizontal & vertical gradients
      const tl = heightMap[yPrev + xPrev];
      const t = heightMap[yPrev + x];
      const tr = heightMap[yPrev + xNext];
      const l = heightMap[yCurr + xPrev];
      const r = heightMap[yCurr + xNext];
      const bl = heightMap[yNext + xPrev];
      const b = heightMap[yNext + x];
      const br = heightMap[yNext + xNext];

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * bumpStrength;
      let ny = -dy * bumpStrength;
      let nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (yCurr + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}
