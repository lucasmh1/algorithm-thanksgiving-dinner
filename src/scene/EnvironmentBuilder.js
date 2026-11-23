import * as THREE from 'three';
import { ScreenTextures } from './ScreenTextures.js';
import { LightingController } from './LightingController.js';

// ---------------------------------------------------------------------------
// Procedural Canvas Textures (Wood, Rug, Wallpaper, Kitchen Tile, Night View)
// ---------------------------------------------------------------------------

function createWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    const y = row * plankH;
    const toneShift = ((row * 37) % 24) - 12;
    const r = Math.min(255, Math.max(0, 96 + toneShift));
    const g = Math.min(255, Math.max(0, 60 + Math.floor(toneShift * 0.7)));
    const b = Math.min(255, Math.max(0, 34 + Math.floor(toneShift * 0.5)));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, 512, plankH - 2);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(30, 16, 8, 0.16)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const gy = y + 6 + i * 7;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + Math.sin(row + i) * 3, 340, gy - Math.cos(row + i) * 3, 512, gy);
      ctx.stroke();
    }

    // Plank seam
    ctx.fillStyle = '#2d1a0d';
    ctx.fillRect(0, y + plankH - 2, 512, 2);

    // Staggered vertical joints
    const jointX = ((row * 193 + 90) % 440) + 36;
    ctx.fillRect(jointX, y, 2, plankH);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4.5, 4.0);
  return tex;
}

function createRugTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Deep autumn burgundy base
  ctx.fillStyle = '#5c1d24';
  ctx.fillRect(0, 0, 512, 512);

  // Outer gold & cream borders
  ctx.strokeStyle = '#d49b4b';
  ctx.lineWidth = 16;
  ctx.strokeRect(22, 22, 468, 468);

  ctx.strokeStyle = '#e7d2b5';
  ctx.lineWidth = 5;
  ctx.strokeRect(44, 44, 424, 424);

  ctx.strokeStyle = '#a84a28';
  ctx.lineWidth = 10;
  ctx.strokeRect(64, 64, 384, 384);

  // Subtle woven pattern
  ctx.fillStyle = 'rgba(212, 155, 75, 0.14)';
  for (let y = 84; y < 428; y += 24) {
    for (let x = 84; x < 428; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Center medallion
  ctx.save();
  ctx.translate(256, 256);
  ctx.fillStyle = '#3d151c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 115, 82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d49b4b';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#9e3e22';
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWallpaperTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Warm suburban cream/taupe wallpaper with subtle vertical stripes
  ctx.fillStyle = '#d8cbb8';
  ctx.fillRect(0, 0, 256, 256);

  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = 'rgba(155, 134, 108, 0.22)';
    ctx.fillRect(x, 0, 14, 256);
    ctx.fillStyle = 'rgba(255, 248, 236, 0.28)';
    ctx.fillRect(x + 14, 0, 4, 256);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 2);
  return tex;
}

function createKitchenTileTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');

  const s = 64;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#d8d0c0' : '#a89f91';
      ctx.fillRect(x * s, y * s, s, s);
      ctx.strokeStyle = '#736c62';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * s, y * s, s, s);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 5);
  return tex;
}

function createNightWindowTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#070b18');
  grad.addColorStop(0.65, '#121c33');
  grad.addColorStop(1, '#090e19');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Moon & soft clouds
  ctx.fillStyle = 'rgba(219, 234, 254, 0.85)';
  ctx.beginPath();
  ctx.arc(380, 92, 26, 0, Math.PI * 2);
  ctx.fill();

  // Stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = 0; i < 36; i++) {
    const sx = (i * 137) % 500;
    const sy = (i * 73) % 220;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Distant neighborhood house silhouettes
  ctx.fillStyle = '#070a12';
  // House 1
  ctx.fillRect(30, 325, 130, 120);
  ctx.beginPath();
  ctx.moveTo(20, 325);
  ctx.lineTo(95, 265);
  ctx.lineTo(170, 325);
  ctx.closePath();
  ctx.fill();

  // House 2
  ctx.fillRect(280, 340, 170, 110);
  ctx.beginPath();
  ctx.moveTo(265, 340);
  ctx.lineTo(365, 280);
  ctx.lineTo(465, 340);
  ctx.closePath();
  ctx.fill();

  // Trees
  ctx.beginPath();
  ctx.arc(215, 330, 52, 0, Math.PI * 2);
  ctx.arc(245, 355, 42, 0, Math.PI * 2);
  ctx.fill();

  // Warm glowing neighbor windows
  ctx.fillStyle = '#f6c36b';
  ctx.fillRect(58, 355, 24, 30);
  ctx.fillRect(108, 355, 24, 30);
  ctx.fillRect(318, 370, 32, 26);
  ctx.fillRect(384, 370, 26, 26);

  // Ground
  ctx.fillStyle = '#05080f';
  ctx.fillRect(0, 435, 512, 77);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPortraitTexture(bgHex, hairHex, shirtHex, accentHex) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 128, 160);
  // Shoulders
  ctx.fillStyle = shirtHex;
  ctx.beginPath();
  ctx.arc(64, 158, 48, Math.PI, 0);
  ctx.fill();
  // Head
  ctx.fillStyle = '#e8c19e';
  ctx.beginPath();
  ctx.arc(64, 72, 26, 0, Math.PI * 2);
  ctx.fill();
  // Hair
  ctx.fillStyle = hairHex;
  ctx.beginPath();
  ctx.arc(64, 62, 27, Math.PI, 0);
  ctx.fill();
  // Accent (glasses/necklace)
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(54, 74, 7, 0, Math.PI * 2);
  ctx.arc(74, 74, 7, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Main Environment Builder
// ---------------------------------------------------------------------------

export function buildEnvironment(scene) {
  const root = new THREE.Group();
  root.name = 'EnvironmentRoot';
  scene.add(root);

  const colliders = [];
  const interactables = [];
  const disposableTextures = [];

  const screenTextures = new ScreenTextures();
  const lightingController = new LightingController(scene);

  const addBoxCollider = (minX, minY, minZ, maxX, maxY, maxZ) => {
    colliders.push(
      new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ))
    );
  };

  const registerInteractable = (id, mesh, label, type, highlightMeshes) => {
    mesh.userData.interactableId = id;
    mesh.traverse((child) => {
      child.userData.interactableId = id;
    });
    interactables.push({ id, mesh, label, type, highlightMeshes });
  };

  // Shared procedural textures
  const woodTex = createWoodTexture();
  const rugTex = createRugTexture();
  const wallTex = createWallpaperTexture();
  const tileTex = createKitchenTileTexture();
  const nightTex = createNightWindowTexture();
  disposableTextures.push(woodTex, rugTex, wallTex, tileTex, nightTex);

  // Reusable architectural materials (NOT used in highlightMeshes)
  const matFloor = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.52, metalness: 0.05 });
  const matTile = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4, metalness: 0.05 });
  const matWall = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
  const matWainscot = new THREE.MeshStandardMaterial({ color: 0xefe7da, roughness: 0.65 });
  const matCeiling = new THREE.MeshStandardMaterial({ color: 0xf0e8dc, roughness: 0.92 });
  const matDarkWood = new THREE.MeshStandardMaterial({ color: 0x452715, roughness: 0.45, metalness: 0.05 });
  const matMidWood = new THREE.MeshStandardMaterial({ color: 0x6b3e22, roughness: 0.5 });
  const matBrass = new THREE.MeshStandardMaterial({ color: 0xd4a44a, roughness: 0.3, metalness: 0.8 });
  const matSilver = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.85 });
  const matCeramic = new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.25, metalness: 0.05 });
  const matCreamCabinet = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.55 });
  const matCounter = new THREE.MeshStandardMaterial({ color: 0x3b3836, roughness: 0.3, metalness: 0.1 });

  // Helper to create wall segments with wainscoting & crown molding
  const addWallSegment = (x, z, lenX, lenZ, height = 3.4, withWainscot = true) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(lenX, height, lenZ), matWall);
    wall.position.set(x, height / 2, z);
    wall.receiveShadow = true;
    root.add(wall);

    if (withWainscot) {
      const ws = new THREE.Mesh(new THREE.BoxGeometry(lenX + 0.04, 1.05, lenZ + 0.04), matWainscot);
      ws.position.set(x, 0.525, z);
      ws.receiveShadow = true;
      root.add(ws);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(lenX + 0.08, 0.06, lenZ + 0.08), matWainscot);
      rail.position.set(x, 1.06, z);
      root.add(rail);
    }

    const crown = new THREE.Mesh(new THREE.BoxGeometry(lenX + 0.08, 0.12, lenZ + 0.08), matWainscot);
    crown.position.set(x, height - 0.06, z);
    root.add(crown);
  };

  // -------------------------------------------------------------------------
  // 1. ROOM ARCHITECTURE (Main Dining Room 11m x 9m + Open Kitchen Extension)
  // -------------------------------------------------------------------------
  const roomH = 3.4;

  // Dining Room Floor & Ceiling
  const diningFloor = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 9.0), matFloor);
  diningFloor.rotation.x = -Math.PI / 2;
  diningFloor.receiveShadow = true;
  root.add(diningFloor);

  const diningCeiling = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 9.0), matCeiling);
  diningCeiling.rotation.x = Math.PI / 2;
  diningCeiling.position.y = roomH;
  root.add(diningCeiling);

  // Patterned Autumn Area Rug under Dining Table
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 3.8),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.92 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.008, 0);
  rug.receiveShadow = true;
  root.add(rug);

  // Kitchen Floor & Ceiling (x: 5.5..9.5, z: -4.5..0.5)
  const kitchenFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 5.0), matTile);
  kitchenFloor.rotation.x = -Math.PI / 2;
  kitchenFloor.position.set(7.5, 0.002, -2.0);
  kitchenFloor.receiveShadow = true;
  root.add(kitchenFloor);

  const kitchenCeiling = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 5.0), matCeiling);
  kitchenCeiling.rotation.x = Math.PI / 2;
  kitchenCeiling.position.set(7.5, roomH, -2.0);
  root.add(kitchenCeiling);

  // Dining Room Perimeter Walls
  addWallSegment(0, -4.55, 11.2, 0.14, roomH); // North wall
  addWallSegment(0, 4.55, 11.2, 0.14, roomH);  // South wall
  addWallSegment(-5.55, 0, 0.14, 9.2, roomH);  // West wall

  // East wall with open archway into Kitchen (open z: -3.4 to -0.6)
  addWallSegment(5.55, -3.95, 0.14, 1.1, roomH); // East-North pier
  addWallSegment(5.55, 1.95, 0.14, 5.1, roomH);  // East-South wall
  // Header beam above kitchen archway
  const archHeader = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 2.86), matWainscot);
  archHeader.position.set(5.55, 3.0, -2.0);
  root.add(archHeader);

  // Kitchen Outer Walls
  addWallSegment(7.5, -4.55, 4.1, 0.14, roomH, false); // Kitchen North
  addWallSegment(9.55, -2.0, 0.14, 5.2, roomH, false); // Kitchen East
  addWallSegment(7.5, 0.55, 4.1, 0.14, roomH, false);  // Kitchen South

  // Room Wall Colliders
  addBoxCollider(-5.8, 0, -4.8, 9.8, roomH, -4.45); // North wall (dining + kitchen)
  addBoxCollider(-5.8, 0, 4.45, 5.8, roomH, 4.8);   // South wall
  addBoxCollider(-5.8, 0, -4.8, -5.45, roomH, 4.8); // West wall
  addBoxCollider(5.45, 0, -4.6, 5.65, roomH, -3.4); // East-North pier
  addBoxCollider(5.45, 0, -0.6, 5.65, roomH, 4.6);  // East-South wall
  addBoxCollider(9.45, 0, -4.6, 9.8, roomH, 0.6);   // Kitchen East wall
  addBoxCollider(5.5, 0, 0.45, 9.6, roomH, 0.7);    // Kitchen South wall

  // -------------------------------------------------------------------------
  // 2. WINDOWS (West & South) + Night Sky & Lightning Backdrop
  // -------------------------------------------------------------------------
  const windowBackdropMats = [];
  const createWindow = (x, y, z, rotY) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(x, y, z);
    winGroup.rotation.y = rotY;

    const skyMat = new THREE.MeshBasicMaterial({ map: nightTex, color: 0xbccce8 });
    windowBackdropMats.push(skyMat);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.55), skyMat);
    sky.position.z = 0.01;
    winGroup.add(sky);

    // Window frame & muntins
    const frameThick = 0.08;
    const topF = new THREE.Mesh(new THREE.BoxGeometry(1.9, frameThick, 0.1), matWainscot);
    topF.position.y = 0.8;
    const botF = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.1, 0.14), matWainscot);
    botF.position.y = -0.8;
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(frameThick, 1.65, 0.1), matWainscot);
    leftF.position.x = -0.9;
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(frameThick, 1.65, 0.1), matWainscot);
    rightF.position.x = 0.9;
    const midV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.55, 0.06), matWainscot);
    midV.position.z = 0.03;
    const midH = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.04, 0.06), matWainscot);
    midH.position.z = 0.03;
    winGroup.add(topF, botF, leftF, rightF, midV, midH);

    // Warm autumn curtains
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0x7c2d23, roughness: 0.85 });
    const cLeft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.05, 0.12), curtainMat);
    cLeft.position.set(-1.02, -0.05, 0.08);
    const cRight = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.05, 0.12), curtainMat);
    cRight.position.set(1.02, -0.05, 0.08);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.45, 8), matBrass);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 0.98, 0.1);
    winGroup.add(cLeft, cRight, rod);

    root.add(winGroup);
  };

  createWindow(-5.47, 1.85, -2.35, Math.PI / 2);
  createWindow(-5.47, 1.85, 2.05, Math.PI / 2);
  createWindow(2.45, 1.85, 4.47, Math.PI);

  // -------------------------------------------------------------------------
  // 3. WARM CHANDELIER (Center Ceiling)
  // -------------------------------------------------------------------------
  const chandelier = new THREE.Group();
  chandelier.position.set(0, roomH, 0);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 8), matBrass);
  chain.position.y = -0.36;
  chandelier.add(chain);

  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), matBrass);
  hub.position.y = -0.74;
  chandelier.add(hub);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d1,
    emissive: 0xffb85c,
    emissiveIntensity: 1.6,
    roughness: 0.25
  });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.56, 8), matBrass);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -angle;
    arm.position.set(Math.cos(angle) * 0.28, -0.74, Math.sin(angle) * 0.28);
    chandelier.add(arm);

    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), bulbMat);
    shade.position.set(Math.cos(angle) * 0.54, -0.64, Math.sin(angle) * 0.54);
    chandelier.add(shade);
  }
  root.add(chandelier);

  // -------------------------------------------------------------------------
  // 4. DINING TABLE, CHAIRS, THANKSGIVING FEAST & SMARTPHONE ('obj_phone')
  // -------------------------------------------------------------------------
  const tableGroup = new THREE.Group();
  root.add(tableGroup);

  // Table top (3.6m x 1.6m, top at y = 0.78m)
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 1.6), matDarkWood);
  tableTop.position.set(0, 0.74, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  tableGroup.add(tableTop);

  // Table apron & 4 tapered legs
  const apron = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.1, 1.32), matDarkWood);
  apron.position.set(0, 0.66, 0);
  tableGroup.add(apron);

  const legOffsets = [[-1.58, -0.62], [1.58, -0.62], [-1.58, 0.62], [1.58, 0.62]];
  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.036, 0.7, 10), matDarkWood);
    leg.position.set(lx, 0.35, lz);
    leg.castShadow = true;
    tableGroup.add(leg);
  });

  // Autumn Linen Table Runner
  const runner = new THREE.Mesh(
    new THREE.BoxGeometry(3.25, 0.01, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xb8522a, roughness: 0.85 })
  );
  runner.position.set(0, 0.785, 0);
  runner.receiveShadow = true;
  tableGroup.add(runner);

  // Dining chairs are built and owned by CharacterManager.js to avoid Z-fighting.
  // Table + chairs collision box (keeps spawn at (0, 1.65, 3.2) completely clear)
  addBoxCollider(-2.38, 0, -1.38, 2.38, 1.5, 1.38);

  // --- Thanksgiving Feast Centerpiece ---
  const feastY = 0.79;

  // Golden Half-Eaten Turkey on Silver Platter
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.025, 20), matSilver);
  platter.scale.set(1.35, 1, 0.92);
  platter.position.set(0, feastY + 0.012, -0.04);
  tableGroup.add(platter);

  const matTurkey = new THREE.MeshStandardMaterial({ color: 0xa65319, roughness: 0.42 });
  const matTurkeyMeat = new THREE.MeshStandardMaterial({ color: 0xe8d0b3, roughness: 0.75 });
  const turkeyBody = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), matTurkey);
  turkeyBody.scale.set(1.38, 0.82, 0.95);
  turkeyBody.position.set(0, feastY + 0.14, -0.04);
  turkeyBody.castShadow = true;
  tableGroup.add(turkeyBody);

  // Carved-out white meat patch (half-eaten!)
  const carvedSlice = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.12), matTurkeyMeat);
  carvedSlice.position.set(0.11, feastY + 0.17, 0.07);
  carvedSlice.rotation.y = 0.35;
  tableGroup.add(carvedSlice);

  // Drumsticks
  [-1, 1].forEach((side) => {
    const drum = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.12, 6, 8), matTurkey);
    drum.position.set(side * 0.2, feastY + 0.13, 0.09);
    drum.rotation.z = side * 0.85;
    drum.rotation.x = 0.4;
    tableGroup.add(drum);
  });

  // Rising Turkey Steam Particles (animated translucent puffs)
  const steamPuffs = [];
  const steamGeo = new THREE.SphereGeometry(0.045, 8, 8);
  for (let i = 0; i < 8; i++) {
    const sMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    const puff = new THREE.Mesh(steamGeo, sMat);
    puff.position.set((Math.random() - 0.5) * 0.18, feastY + 0.24 + i * 0.09, -0.04 + (Math.random() - 0.5) * 0.12);
    tableGroup.add(puff);
    steamPuffs.push({ mesh: puff, phase: i / 8, baseX: puff.position.x, baseZ: puff.position.z });
  }

  // Mashed Potatoes Bowl
  const potatoBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.09, 16), matCeramic);
  potatoBowl.position.set(-0.62, feastY + 0.045, 0.16);
  const potatoes = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf4e8c6, roughness: 0.7 })
  );
  potatoes.scale.set(1, 0.45, 1);
  potatoes.position.set(-0.62, feastY + 0.09, 0.16);
  const gravy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.015, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b3b18, roughness: 0.25 })
  );
  gravy.position.set(-0.62, feastY + 0.145, 0.16);
  tableGroup.add(potatoBowl, potatoes, gravy);

  // Cranberry Sauce Dish (iconic can-shaped!)
  const cranDish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.03, 14), matCeramic);
  cranDish.position.set(0.62, feastY + 0.015, -0.2);
  const cranLog = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.13, 14),
    new THREE.MeshStandardMaterial({ color: 0x7f0e28, roughness: 0.18, metalness: 0.05 })
  );
  cranLog.rotation.z = Math.PI / 2;
  cranLog.position.set(0.62, feastY + 0.075, -0.2);
  tableGroup.add(cranDish, cranLog);

  // Pumpkin Pie
  const pieTin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.045, 18), matSilver);
  pieTin.position.set(0.86, feastY + 0.022, 0.22);
  const pieFill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.155, 0.02, 18, 1, false, 0, Math.PI * 1.68),
    new THREE.MeshStandardMaterial({ color: 0xc95b16, roughness: 0.65 })
  );
  pieFill.position.set(0.86, feastY + 0.042, 0.22);
  const cream = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.5 })
  );
  cream.position.set(0.86, feastY + 0.07, 0.22);
  tableGroup.add(pieTin, pieFill, cream);

  // Green Bean Casserole
  const beanDish = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.19), matCeramic);
  beanDish.position.set(-0.78, feastY + 0.035, -0.26);
  const beans = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.02, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x4b6b2f, roughness: 0.8 })
  );
  beans.position.set(-0.78, feastY + 0.07, -0.26);
  tableGroup.add(beanDish, beans);

  // Centerpiece Pumpkins & 3 Glowing Taper Candles
  const pumpkinPositions = [[-0.36, -0.18, 0.09, 0xd9681e], [0.38, 0.15, 0.075, 0xe88b28], [-1.22, 0.02, 0.08, 0xc7541a]];
  pumpkinPositions.forEach(([px, pz, r, col]) => {
    const pump = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 10),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })
    );
    pump.scale.set(1.15, 0.82, 1.15);
    pump.position.set(px, feastY + r * 0.78, pz);
    tableGroup.add(pump);
  });

  const candleFlames = [];
  const candlePositions = [[-0.42, 0.04], [0.42, -0.05], [1.18, -0.02]];
  candlePositions.forEach(([cx, cz], idx) => {
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.048, 0.06, 10), matBrass);
    holder.position.set(cx, feastY + 0.03, cz);
    const wax = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0xfbf2de, roughness: 0.5 })
    );
    wax.position.set(cx, feastY + 0.16, cz);
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.05, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    flame.position.set(cx, feastY + 0.295, cz);
    tableGroup.add(holder, wax, flame);
    candleFlames.push({ mesh: flame, seed: idx * 2.1, baseY: flame.position.y });
  });

  // 6 Place Settings (Plates, Silverware, Wine Glasses)
  const matGlass = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45
  });
  const matWine = new THREE.MeshStandardMaterial({ color: 0x6b0f1a, roughness: 0.2 });

  const placeSettings = [
    [-1.52, 0, Math.PI / 2],
    [1.52, 0, -Math.PI / 2],
    [-0.95, -0.56, 0],
    [0.95, -0.56, 0],
    [-1.0, 0.56, Math.PI],
    [1.0, 0.56, Math.PI]
  ];
  placeSettings.forEach(([px, pz, rot]) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(px, feastY, pz);
    pGroup.rotation.y = rot;

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.11, 0.018, 16), matCeramic);
    plate.position.y = 0.01;
    pGroup.add(plate);

    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.008, 0.16), matSilver);
    fork.position.set(-0.19, 0.008, 0);
    const knife = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.008, 0.17), matSilver);
    knife.position.set(0.19, 0.008, 0);
    pGroup.add(fork, knife);

    // Wine glass
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6), matGlass);
    stem.position.set(0.18, 0.045, 0.13);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.022, 0.08, 10), matGlass);
    bowl.position.set(0.18, 0.12, 0.13);
    const wine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.035, 10), matWine);
    wine.position.set(0.18, 0.105, 0.13);
    pGroup.add(stem, bowl, wine);

    tableGroup.add(pGroup);
  });

  // INTERACTABLE: Smartphone ('obj_phone') on South-East edge of table
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(0.55, feastY + 0.012, 0.56);
  phoneGroup.rotation.y = -0.28;

  const phoneBodyMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.25, metalness: 0.8 });
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.19), phoneBodyMat);
  phoneGroup.add(phoneBody);

  const phoneScreenMat = new THREE.MeshStandardMaterial({
    map: screenTextures.textures.phone,
    emissive: 0xffffff,
    emissiveMap: screenTextures.textures.phone,
    emissiveIntensity: 0.85,
    roughness: 0.15
  });
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.172), phoneScreenMat);
  phoneScreen.rotation.x = -Math.PI / 2;
  phoneScreen.position.y = 0.007;
  phoneGroup.add(phoneScreen);
  tableGroup.add(phoneGroup);

  registerInteractable('obj_phone', phoneGroup, 'Smartphone (Black Friday Alerts)', 'object', [phoneBody]);

  // -------------------------------------------------------------------------
  // 5. NORTH WALL: SMART TV ('obj_tv'), MEDIA CONSOLE, SPEAKER ('obj_speaker'), ROUTER ('obj_router')
  // -------------------------------------------------------------------------
  // Media Console
  const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.72, 0.68), matDarkWood);
  consoleMesh.position.set(0, 0.36, -4.05);
  consoleMesh.castShadow = true;
  consoleMesh.receiveShadow = true;
  root.add(consoleMesh);
  addBoxCollider(-1.38, 0, -4.45, 1.38, 0.8, -3.62);

  // INTERACTABLE: Smart TV ('obj_tv')
  const tvGroup = new THREE.Group();
  tvGroup.position.set(0, 1.98, -4.41);

  const tvBezelMat = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.3, metalness: 0.65 });
  const tvBezel = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.4, 0.07), tvBezelMat);
  tvBezel.castShadow = true;
  tvGroup.add(tvBezel);

  const tvScreenMat = new THREE.MeshStandardMaterial({
    map: screenTextures.textures.tv,
    emissive: 0xffffff,
    emissiveMap: screenTextures.textures.tv,
    emissiveIntensity: 0.88,
    roughness: 0.2
  });
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.29), tvScreenMat);
  tvScreen.position.z = 0.038;
  tvGroup.add(tvScreen);
  root.add(tvGroup);

  registerInteractable('obj_tv', tvGroup, 'Smart TV (DINNER.AI)', 'object', [tvBezel]);

  // INTERACTABLE: Smart Speaker ('obj_speaker') directly below DINNER.AI hologram (0, 1.6, -3.7)
  const speakerGroup = new THREE.Group();
  speakerGroup.position.set(0, 0.72, -3.74);

  const speakerBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e242e, roughness: 0.4, metalness: 0.4 });
  const speakerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.26, 20), speakerBodyMat);
  speakerBody.position.y = 0.13;
  speakerBody.castShadow = true;
  speakerGroup.add(speakerBody);

  const speakerRingMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });
  const speakerRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.015, 10, 24), speakerRingMat);
  speakerRing.rotation.x = Math.PI / 2;
  speakerRing.position.y = 0.262;
  speakerGroup.add(speakerRing);
  root.add(speakerGroup);

  registerInteractable('obj_speaker', speakerGroup, 'DINNER.AI Smart Speaker', 'object', [speakerBody]);

  // INTERACTABLE: Wi-Fi Router ('obj_router') on right side of media console
  const routerGroup = new THREE.Group();
  routerGroup.position.set(0.95, 0.72, -3.96);

  const routerBodyMat = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: 0.35, metalness: 0.5 });
  const routerBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.22), routerBodyMat);
  routerBody.position.y = 0.03;
  routerGroup.add(routerBody);

  // 4 antennas
  [[-0.13, -0.09], [0.13, -0.09], [-0.13, 0.04], [0.13, 0.04]].forEach(([ax, az], idx) => {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.24, 6), routerBodyMat);
    ant.position.set(ax, 0.14, az);
    ant.rotation.z = idx % 2 === 0 ? 0.16 : -0.16;
    routerGroup.add(ant);
  });

  // Blinking LEDs
  const routerLeds = [];
  for (let i = 0; i < 4; i++) {
    const ledMat = new THREE.MeshBasicMaterial({ color: i === 3 ? 0xff4d6d : 0x22c55e });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.008), ledMat);
    led.position.set(-0.08 + i * 0.05, 0.035, 0.112);
    routerGroup.add(led);
    routerLeds.push(ledMat);
  }
  root.add(routerGroup);

  registerInteractable('obj_router', routerGroup, 'Wi-Fi Router', 'object', [routerBody]);

  // -------------------------------------------------------------------------
  // 6. EAST WALL SIDEBOARD: CONFISCATED GIFTS ('obj_gifts') & SCRAPBOOK ('obj_scrapbook')
  // -------------------------------------------------------------------------
  const sideboard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 2.7), matDarkWood);
  sideboard.position.set(5.1, 0.425, 2.2);
  sideboard.castShadow = true;
  sideboard.receiveShadow = true;
  root.add(sideboard);
  addBoxCollider(4.68, 0, 0.82, 5.5, 0.9, 3.58);

  // INTERACTABLE: Confiscated Gifts Pile ('obj_gifts') — 5 distinct wrapped boxes
  const giftsGroup = new THREE.Group();
  giftsGroup.position.set(5.04, 0.85, 1.55);
  const giftHighlightMeshes = [];

  const giftSpecs = [
    { pos: [0, 0.15, -0.32], size: [0.34, 0.3, 0.36], col: 0xb91c1c, rib: 0xfbbf24 },
    { pos: [-0.04, 0.12, 0.1], size: [0.3, 0.24, 0.34], col: 0x1d4ed8, rib: 0xf8fafc },
    { pos: [0.02, 0.39, -0.26], size: [0.24, 0.18, 0.24], col: 0x15803d, rib: 0xfde047 },
    { pos: [-0.02, 0.32, 0.12], size: [0.22, 0.16, 0.22], col: 0x7e22ce, rib: 0xf472b6 },
    { pos: [-0.46, -0.68, -0.2], size: [0.36, 0.34, 0.38], col: 0xd97706, rib: 0x7c2d12 } // 5th box on floor beside sideboard
  ];
  giftSpecs.forEach((g) => {
    const bMat = new THREE.MeshStandardMaterial({ color: g.col, roughness: 0.55 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(...g.size), bMat);
    box.position.set(...g.pos);
    box.castShadow = true;
    giftsGroup.add(box);
    giftHighlightMeshes.push(box);

    const rMat = new THREE.MeshStandardMaterial({ color: g.rib, roughness: 0.35, metalness: 0.2 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(g.size[0] + 0.012, g.size[1] + 0.012, 0.04), rMat);
    r1.position.set(...g.pos);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, g.size[1] + 0.012, g.size[2] + 0.012), rMat);
    r2.position.set(...g.pos);
    giftsGroup.add(r1, r2);
  });
  root.add(giftsGroup);

  registerInteractable('obj_gifts', giftsGroup, 'Confiscated Gifts Pile', 'object', giftHighlightMeshes);

  // INTERACTABLE: Family Photo Scrapbook ('obj_scrapbook')
  const scrapbookGroup = new THREE.Group();
  scrapbookGroup.position.set(5.02, 0.86, 2.9);
  scrapbookGroup.rotation.y = -0.18;

  const coverMat = new THREE.MeshStandardMaterial({ color: 0x5c2418, roughness: 0.7 });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.025, 0.48), coverMat);
  scrapbookGroup.add(cover);

  const pageMat = new THREE.MeshStandardMaterial({ color: 0xf5ebd6, roughness: 0.85 });
  const leftPage = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.018, 0.21), pageMat);
  leftPage.position.set(0, 0.018, -0.115);
  const rightPage = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.018, 0.21), pageMat);
  rightPage.position.set(0, 0.018, 0.115);
  const stickyNote = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.006, 0.09),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 })
  );
  stickyNote.position.set(-0.06, 0.03, 0.11);
  stickyNote.rotation.y = 0.22;
  scrapbookGroup.add(leftPage, rightPage, stickyNote);
  root.add(scrapbookGroup);

  registerInteractable('obj_scrapbook', scrapbookGroup, 'Family Photo Scrapbook', 'clue', [cover, stickyNote]);

  // Autumn Wreath & Framed Family Portraits above East Sideboard
  const wreath = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.09, 10, 22),
    new THREE.MeshStandardMaterial({ color: 0x9c3b19, roughness: 0.85 })
  );
  wreath.rotation.y = -Math.PI / 2;
  wreath.position.set(5.44, 2.25, 2.2);
  root.add(wreath);

  const portraitConfigs = [
    { z: 1.25, bg: '#3b4f66', hair: '#7c4b28', shirt: '#991b1b', acc: '#fbbf24' },
    { z: 3.15, bg: '#4e5b49', hair: '#d4d4d8', shirt: '#6b21a8', acc: '#e2e8f0' }
  ];
  portraitConfigs.forEach((p) => {
    const pTex = createPortraitTexture(p.bg, p.hair, p.shirt, p.acc);
    disposableTextures.push(pTex);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.5), matBrass);
    frame.position.set(5.45, 2.15, p.z);
    const pic = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.54),
      new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.6 })
    );
    pic.rotation.y = -Math.PI / 2;
    pic.position.set(5.42, 2.15, p.z);
    root.add(frame, pic);
  });

  // -------------------------------------------------------------------------
  // 7. WEST WALL DESK: LAPTOP ('obj_laptop') & RECEIPT/TELEMETRY ('obj_receipt')
  // -------------------------------------------------------------------------
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 1.85), matMidWood);
  deskTop.position.set(-5.05, 0.76, -0.2);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  root.add(deskTop);
  [[-5.35, -1.04], [-4.75, -1.04], [-5.35, 0.64], [-4.75, 0.64]].forEach(([dx, dz]) => {
    const dLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), matDarkWood);
    dLeg.position.set(dx, 0.37, dz);
    root.add(dLeg);
  });
  addBoxCollider(-5.48, 0, -1.16, -4.62, 0.85, 0.76);

  // Desk lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), matBrass);
  lampBase.position.set(-5.18, 0.81, -0.88);
  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 8), matBrass);
  lampPost.position.set(-5.18, 1.0, -0.88);
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.18, 14, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf3e1c0, emissive: 0xffb347, emissiveIntensity: 0.5, side: THREE.DoubleSide })
  );
  lampShade.position.set(-5.18, 1.18, -0.88);
  root.add(lampBase, lampPost, lampShade);

  // INTERACTABLE: Laptop ('obj_laptop')
  const laptopGroup = new THREE.Group();
  laptopGroup.position.set(-4.98, 0.79, -0.4);
  laptopGroup.rotation.y = Math.PI / 2 - 0.14;

  const laptopBaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.75 });
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.018, 0.27), laptopBaseMat);
  laptopGroup.add(laptopBase);

  const laptopLid = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.014), laptopBaseMat);
  laptopLid.position.set(0, 0.125, -0.13);
  laptopLid.rotation.x = -0.22;
  laptopGroup.add(laptopLid);

  const laptopScreenMat = new THREE.MeshStandardMaterial({
    map: screenTextures.textures.laptop,
    emissive: 0xffffff,
    emissiveMap: screenTextures.textures.laptop,
    emissiveIntensity: 0.85,
    roughness: 0.2
  });
  const laptopScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.225), laptopScreenMat);
  laptopScreen.position.set(0, 0.125, -0.121);
  laptopScreen.rotation.x = -0.22;
  laptopGroup.add(laptopScreen);
  root.add(laptopGroup);

  registerInteractable('obj_laptop', laptopGroup, 'Laptop (Compatibility Analysis)', 'object', [laptopBase, laptopLid]);

  // INTERACTABLE: Shopping Receipt & Telemetry Printout ('obj_receipt')
  const receiptGroup = new THREE.Group();
  receiptGroup.position.set(-4.9, 0.796, 0.32);

  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const telemetrySheet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.32), sheetMat);
  telemetrySheet.rotation.y = 0.15;
  receiptGroup.add(telemetrySheet);

  const receiptMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 });
  const receiptStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.42), receiptMat);
  receiptStrip.position.set(0.14, 0.006, 0.05);
  receiptStrip.rotation.y = -0.25;
  receiptGroup.add(receiptStrip);
  root.add(receiptGroup);

  registerInteractable('obj_receipt', receiptGroup, 'Telemetry Printout & Receipt', 'clue', [telemetrySheet, receiptStrip]);

  // -------------------------------------------------------------------------
  // 8. SOUTH WALL: LOCKED FRONT DOOR ('obj_front_door') & CONTROL PANEL ('obj_control_panel')
  // -------------------------------------------------------------------------
  // INTERACTABLE: Locked Front Entrance Door ('obj_front_door')
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-1.65, 0, 4.44);

  const doorWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a1f14, roughness: 0.5 });
  const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.38, 0.09), doorWoodMat);
  doorSlab.position.y = 1.19;
  doorGroup.add(doorSlab);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.48, 0.06), matWainscot);
  doorFrame.position.set(0, 1.24, 0.03);
  doorGroup.add(doorFrame);

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), matBrass);
  handle.position.set(0.46, 1.05, -0.08);
  doorGroup.add(handle);

  // Red Laser / LED Lockdown Bar
  const lockBarMat = new THREE.MeshStandardMaterial({
    color: 0xff1e42,
    emissive: 0xff1e42,
    emissiveIntensity: 2.4,
    roughness: 0.2
  });
  const lockBar = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.055, 0.045), lockBarMat);
  lockBar.position.set(0, 1.32, -0.065);
  doorGroup.add(lockBar);
  root.add(doorGroup);

  registerInteractable('obj_front_door', doorGroup, 'Locked Front Door', 'object', [doorSlab, lockBar]);

  // INTERACTABLE: Central Smart-Home Control Panel ('obj_control_panel')
  const panelGroup = new THREE.Group();
  panelGroup.position.set(-0.35, 1.48, 4.43);

  const panelFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.7 });
  const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.66, 0.06), panelFrameMat);
  panelGroup.add(panelFrame);

  const panelScreenMat = new THREE.MeshStandardMaterial({
    map: screenTextures.textures.panel,
    emissive: 0xffffff,
    emissiveMap: screenTextures.textures.panel,
    emissiveIntensity: 0.88,
    roughness: 0.2
  });
  const panelScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.58), panelScreenMat);
  panelScreen.rotation.y = Math.PI;
  panelScreen.position.z = -0.032;
  panelGroup.add(panelScreen);
  root.add(panelGroup);

  registerInteractable('obj_control_panel', panelGroup, 'Smart-Home Control Panel', 'object', [panelFrame]);

  // -------------------------------------------------------------------------
  // 9. OPEN KITCHEN: COUNTERS, SMART FRIDGE ('obj_fridge'), STOVE & TIMER NOTE ('obj_turkey_note')
  // -------------------------------------------------------------------------
  // Kitchen East Countertop & Lower/Upper Cabinets
  const lowerCab = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.9, 4.8), matCreamCabinet);
  lowerCab.position.set(9.05, 0.45, -2.0);
  lowerCab.receiveShadow = true;
  root.add(lowerCab);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 4.84), matCounter);
  counterTop.position.set(9.02, 0.92, -2.0);
  root.add(counterTop);

  const upperCab = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.9, 4.6), matCreamCabinet);
  upperCab.position.set(9.22, 2.25, -2.0);
  root.add(upperCab);

  // Warm under-cabinet LED strip
  const underCabLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.025, 4.2),
    new THREE.MeshBasicMaterial({ color: 0xffe0a3 })
  );
  underCabLed.position.set(9.06, 1.79, -2.0);
  root.add(underCabLed);

  addBoxCollider(8.52, 0, -4.45, 9.5, 2.8, 0.48);

  // Stove / Oven built into East counter (z = -2.0)
  const stoveFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.84, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.3, metalness: 0.7 })
  );
  stoveFront.position.set(8.62, 0.46, -2.0);
  root.add(stoveFront);

  // Dry Turkey Roasting Pan on Stove
  const pan = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.36), matSilver);
  pan.position.set(8.92, 0.99, -2.0);
  const dryBird = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x61391c, roughness: 0.95 })
  );
  dryBird.scale.set(1.3, 0.6, 0.9);
  dryBird.position.set(8.92, 1.04, -2.0);
  root.add(pan, dryBird);

  // INTERACTABLE: Kitchen Timer & Turkey Note ('obj_turkey_note')
  const noteGroup = new THREE.Group();
  noteGroup.position.set(8.72, 0.96, -1.25);

  const noteMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 });
  const notePaper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.26), noteMat);
  notePaper.rotation.y = 0.25;
  noteGroup.add(notePaper);

  const timerMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  const kitchenTimer = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 14), timerMat);
  kitchenTimer.position.set(0.06, 0.035, -0.14);
  noteGroup.add(kitchenTimer);
  root.add(noteGroup);

  registerInteractable('obj_turkey_note', noteGroup, 'Kitchen Timer Note', 'clue', [notePaper, kitchenTimer]);

  // INTERACTABLE: Smart Fridge ('obj_fridge') on Kitchen North Wall
  const fridgeGroup = new THREE.Group();
  fridgeGroup.position.set(6.55, 0, -4.02);

  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.72 });
  const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.15, 0.84), fridgeMat);
  fridgeBody.position.y = 1.075;
  fridgeBody.castShadow = true;
  fridgeGroup.add(fridgeBody);

  const fridgeScreenMat = new THREE.MeshStandardMaterial({
    map: screenTextures.textures.fridge,
    emissive: 0xffffff,
    emissiveMap: screenTextures.textures.fridge,
    emissiveIntensity: 0.82,
    roughness: 0.2
  });
  const fridgeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.68), fridgeScreenMat);
  fridgeScreen.position.set(0.22, 1.38, 0.425);
  fridgeGroup.add(fridgeScreen);

  const fridgeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), matSilver);
  fridgeHandle.position.set(-0.08, 1.38, 0.45);
  fridgeGroup.add(fridgeHandle);
  root.add(fridgeGroup);

  addBoxCollider(5.98, 0, -4.48, 7.12, 2.2, -3.56);
  registerInteractable('obj_fridge', fridgeGroup, 'Smart Fridge', 'object', [fridgeBody]);

  // -------------------------------------------------------------------------
  // 10. AUTONOMOUS SMART VACUUM / HOLOGRAM PROJECTOR BOT
  // -------------------------------------------------------------------------
  const botGroup = new THREE.Group();
  botGroup.position.set(-3.5, 0, 2.4);

  const botChassis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.25, 0.085, 20),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.6 })
  );
  botChassis.position.y = 0.045;
  botChassis.castShadow = true;
  botGroup.add(botChassis);

  const botRingMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.8
  });
  const botRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 8, 22), botRingMat);
  botRing.rotation.x = Math.PI / 2;
  botRing.position.y = 0.09;
  botGroup.add(botRing);

  // Projected wireframe house-map hologram cone
  const holoConeMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    wireframe: true,
    transparent: true,
    opacity: 0.26
  });
  const holoCone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 6, 2, true), holoConeMat);
  holoCone.rotation.x = Math.PI;
  holoCone.position.y = 0.31;
  botGroup.add(holoCone);

  const holoMap = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.12, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.55 })
  );
  holoMap.position.y = 0.52;
  botGroup.add(holoMap);
  root.add(botGroup);

  // Safe rectangular patrol waypoints around the dining room perimeter
  const botWaypoints = [
    new THREE.Vector3(-3.55, 0, 2.45),
    new THREE.Vector3(3.45, 0, 2.45),
    new THREE.Vector3(3.45, 0, -2.65),
    new THREE.Vector3(-3.55, 0, -2.65)
  ];
  let botWpIndex = 0;

  // -------------------------------------------------------------------------
  // UPDATE & DISPOSE
  // -------------------------------------------------------------------------
  const tempColor = new THREE.Color();

  function update(dt, time, heat = 18) {
    screenTextures.update(dt, time, heat);
    lightingController.update(dt, time, heat);

    // 1. Candle flame flicker
    for (const c of candleFlames) {
      const s = 0.88 + Math.sin(time * 13 + c.seed) * 0.14 + Math.sin(time * 23 + c.seed) * 0.06;
      c.mesh.scale.set(1, s, 1);
      c.mesh.position.y = c.baseY + (s - 1) * 0.015;
    }

    // 2. Rising turkey steam puffs
    for (const p of steamPuffs) {
      const t = (time * 0.28 + p.phase) % 1;
      p.mesh.position.y = feastY + 0.22 + t * 0.65;
      p.mesh.position.x = p.baseX + Math.sin(time * 1.8 + p.phase * 6.28) * 0.04;
      p.mesh.position.z = p.baseZ + Math.cos(time * 1.5 + p.phase * 6.28) * 0.04;
      const scale = 0.7 + t * 1.1;
      p.mesh.scale.setScalar(scale);
      p.mesh.material.opacity = Math.sin(t * Math.PI) * 0.22;
    }

    // 3. Smart Speaker & Vacuum Bot AI color sync with heat
    if (heat >= 71) {
      tempColor.setHex(0xff1e42);
    } else if (heat >= 36) {
      tempColor.setHex(0xffa726);
    } else {
      tempColor.setHex(0x00e5ff);
    }
    speakerRingMat.color.copy(tempColor);
    speakerRingMat.emissive.copy(tempColor);
    speakerRingMat.emissiveIntensity = 1.6 + Math.sin(time * (heat > 70 ? 8 : 3)) * 0.7;

    botRingMat.color.copy(tempColor);
    botRingMat.emissive.copy(tempColor);
    holoConeMat.color.copy(tempColor);

    // 4. Door lockdown bar pulse
    lockBarMat.emissiveIntensity = 1.6 + Math.sin(time * (heat > 70 ? 9 : 3.5)) * 0.8;

    // 5. Router LED blink
    for (let i = 0; i < routerLeds.length; i++) {
      const on = Math.sin(time * (5 + i * 3.1)) > -0.2;
      routerLeds[i].color.setHex(on ? (i === 3 && heat > 50 ? 0xff2a55 : 0x22c55e) : 0x0f172a);
    }

    // 6. Window exterior lightning flash sync
    const flash = lightingController.lightningFlash;
    const skyBrightness = 0.78 + flash * 0.9;
    for (const mat of windowBackdropMats) {
      mat.color.setRGB(skyBrightness * 0.9, skyBrightness * 0.95, Math.min(1.5, skyBrightness * 1.1));
    }

    // 7. Autonomous Smart Vacuum Bot patrol
    const target = botWaypoints[botWpIndex];
    const toTarget = new THREE.Vector3().subVectors(target, botGroup.position);
    const dist = toTarget.length();
    if (dist < 0.08) {
      botWpIndex = (botWpIndex + 1) % botWaypoints.length;
    } else {
      toTarget.normalize();
      const speed = 0.52;
      botGroup.position.addScaledVector(toTarget, Math.min(dist, speed * dt));
      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      botGroup.rotation.y = targetAngle;
    }
    holoMap.rotation.y = time * 1.4;
    holoCone.rotation.y = -time * 0.8;
  }

  function dispose() {
    screenTextures.dispose();
    lightingController.dispose();
    for (const tex of disposableTextures) {
      tex.dispose();
    }
    root.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    scene.remove(root);
  }

  return {
    root,
    colliders,
    interactables,
    screenTextures,
    lightingController,
    update,
    dispose
  };
}
