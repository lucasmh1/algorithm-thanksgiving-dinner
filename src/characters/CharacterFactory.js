import * as THREE from 'three';

/**
 * Procedural texture helpers for stylized-cinematic clothing & furniture.
 */
function createFlannelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep crimson base
  ctx.fillStyle = '#8b1e24';
  ctx.fillRect(0, 0, 256, 256);

  // Dark navy bands
  ctx.fillStyle = 'rgba(20, 32, 54, 0.72)';
  for (let i = 0; i < 256; i += 64) {
    ctx.fillRect(i, 0, 24, 256);
    ctx.fillRect(0, i, 256, 24);
  }

  // Subtle forest accent lines
  ctx.fillStyle = 'rgba(30, 68, 46, 0.45)';
  for (let i = 28; i < 256; i += 64) {
    ctx.fillRect(i, 0, 8, 256);
    ctx.fillRect(0, i, 256, 8);
  }

  // Cream pin stripes
  ctx.fillStyle = 'rgba(244, 232, 206, 0.55)';
  for (let i = 44; i < 256; i += 64) {
    ctx.fillRect(i, 0, 3, 256);
    ctx.fillRect(0, i, 256, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createKnitTexture(baseColor = '#d8cbb8', ribColor = '#c2b29a', accent = '#e8dfd1') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Knit vertical ribs & chevrons
  for (let x = 0; x < 256; x += 16) {
    ctx.fillStyle = ribColor;
    ctx.fillRect(x, 0, 4, 256);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + 10, y + 12);
      ctx.lineTo(x + 16, y + 4);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createArgyleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dad's classic navy sweater vest
  ctx.fillStyle = '#25384d';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle muted diamonds
  const step = 64;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      ctx.fillStyle = (x + y) % 128 === 0 ? '#314963' : '#1e2e40';
      ctx.beginPath();
      ctx.moveTo(x + step / 2, y);
      ctx.lineTo(x + step, y + step / 2);
      ctx.lineTo(x + step / 2, y + step);
      ctx.lineTo(x, y + step / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(205, 175, 128, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#5a3622';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 3) {
    const shade = 12 * Math.sin(y * 0.09) + 6 * Math.cos(y * 0.23);
    ctx.fillStyle = `rgb(${90 + shade}, ${54 + shade * 0.6}, ${34 + shade * 0.4})`;
    ctx.fillRect(0, y, 256, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPhoneScreenTexture(accentColor = '#38bdf8', header = 'BREAKING') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 224;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 224);

  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 128, 34);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(header, 10, 22);

  // Chat / feed cards
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#334155';
    ctx.fillRect(10, 46 + i * 40, 108, 30);
    ctx.fillStyle = i === 0 ? '#f87171' : '#94a3b8';
    ctx.fillRect(16, 54 + i * 40, 74, 5);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(16, 64 + i * 40, 52, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function enableShadows(obj, cast = true, receive = true) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

/**
 * Builds a warm walnut dining chair with upholstered cushion.
 * Seat top sits at y = 0.45m to match a standard 0.78m dining table.
 */
export function createDiningChair() {
  const group = new THREE.Group();
  const woodTex = createWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.58,
    metalness: 0.05
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x7c5a46,
    roughness: 0.88,
    metalness: 0.0
  });

  // Seat frame
  const seatFrame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.46), woodMat);
  seatFrame.position.set(0, 0.425, 0);
  group.add(seatFrame);

  // Upholstered seat pad
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.045, 0.43), cushionMat);
  seatPad.position.set(0, 0.46, 0.01);
  group.add(seatPad);

  // 4 tapered legs
  const legGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.43, 8);
  const legCoords = [
    [-0.2, 0.215, 0.19],
    [0.2, 0.215, 0.19],
    [-0.2, 0.215, -0.19],
    [0.2, 0.215, -0.19]
  ];
  for (const [lx, ly, lz] of legCoords) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  }

  // Backrest uprights (at -Z since character faces +Z)
  const postGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.56, 8);
  for (const sx of [-0.2, 0.2]) {
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(sx, 0.72, -0.21);
    post.rotation.x = -0.07;
    group.add(post);
  }

  // Top curved-look crest rail & slats
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.035), woodMat);
  topRail.position.set(0, 0.98, -0.23);
  group.add(topRail);

  for (const sx of [-0.11, 0, 0.11]) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.02), woodMat);
    slat.position.set(sx, 0.71, -0.215);
    slat.rotation.x = -0.07;
    group.add(slat);
  }

  enableShadows(group, true, true);
  return group;
}

/**
 * Shared humanoid builder returning a rich articulated seated character rig.
 */
function buildSeatedHumanoid(config) {
  const {
    id,
    name,
    skinColor,
    torsoColor,
    torsoMap = null,
    sleeveColor,
    sleeveMap = null,
    pantsColor,
    shoeColor = 0x26201c,
    eyeColor = 0x3b2a20,
    browColor = 0x3a2a20,
    lipColor = 0xb56b60,
    torsoScale = [1, 1, 1],
    headScale = 1.0,
    shoulderWidth = 0.21,
    slouch = 0.0,
    tiredEyes = false
  } = config;

  const root = new THREE.Group();
  root.name = id;
  root.userData.interactableId = id;

  const highlightMeshes = [];

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.68,
    metalness: 0.02
  });

  const torsoMat = new THREE.MeshStandardMaterial({
    color: torsoMap ? 0xffffff : torsoColor,
    map: torsoMap,
    roughness: 0.82,
    metalness: 0.02
  });

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: sleeveMap ? 0xffffff : (sleeveColor ?? torsoColor),
    map: sleeveMap,
    roughness: 0.82,
    metalness: 0.02
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.86,
    metalness: 0.02
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.6,
    metalness: 0.08
  });

  // Hips / pelvis seated on chair pad (y = 0.48)
  const hipsGroup = new THREE.Group();
  hipsGroup.position.set(0, 0.49, -0.02);
  root.add(hipsGroup);

  const pelvis = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 16, 12),
    pantsMat
  );
  pelvis.scale.set(1.15 * torsoScale[0], 0.72, 0.95);
  hipsGroup.add(pelvis);

  // Seated legs (thighs forward, shins down to floor)
  const thighGeo = new THREE.CapsuleGeometry(0.072, 0.26, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.056, 0.30, 6, 12);
  const shoeGeo = new THREE.BoxGeometry(0.095, 0.065, 0.20);

  for (const side of [-1, 1]) {
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.rotation.x = Math.PI / 2 - 0.06;
    thigh.position.set(side * 0.105, 0.01, 0.18);
    hipsGroup.add(thigh);

    const shin = new THREE.Mesh(shinGeo, pantsMat);
    shin.position.set(side * 0.105, -0.22, 0.34);
    hipsGroup.add(shin);

    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(side * 0.105, -0.455, 0.38);
    hipsGroup.add(shoe);
  }

  // Torso pivot (for breathing, leaning, laughing, arguing)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 0.06, 0);
  torsoPivot.rotation.x = slouch;
  hipsGroup.add(torsoPivot);

  const torsoMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.26, 8, 16),
    torsoMat
  );
  torsoMesh.position.set(0, 0.22, 0);
  torsoMesh.scale.set(torsoScale[0] * 1.12, torsoScale[1], torsoScale[2] * 0.85);
  torsoPivot.add(torsoMesh);
  highlightMeshes.push(torsoMesh);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.10, 12),
    skinMat
  );
  neck.position.set(0, 0.45, 0.01);
  torsoPivot.add(neck);

  // Head pivot
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.50, 0.015);
  headPivot.scale.setScalar(headScale);
  torsoPivot.add(headPivot);

  // Cranium / head
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 20, 16),
    skinMat
  );
  headMesh.position.set(0, 0.10, 0);
  headMesh.scale.set(0.95, 1.08, 0.98);
  headPivot.add(headMesh);
  highlightMeshes.push(headMesh);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.028, 10, 8);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, skinMat);
    ear.position.set(side * 0.128, 0.095, -0.005);
    ear.scale.set(0.55, 1.0, 0.75);
    headPivot.add(ear);
  }

  // Stylized Nose
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.022, 0.052, 8),
    skinMat
  );
  nose.position.set(0, 0.088, 0.135);
  nose.rotation.x = Math.PI * 0.42;
  headPivot.add(nose);

  // Subtle warm cheeks
  const cheekMat = new THREE.MeshStandardMaterial({
    color: 0xd97b74,
    roughness: 0.8,
    transparent: true,
    opacity: 0.24
  });
  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), cheekMat);
    cheek.position.set(side * 0.065, 0.068, 0.105);
    cheek.scale.set(1.1, 0.65, 0.4);
    headPivot.add(cheek);
  }

  // Eyes (sclera + iris + pupil + upper eyelid)
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.25 });
  const irisMat = new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.15 });
  const eyelidMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

  const eyes = {};
  for (const [key, side] of [['left', -1], ['right', 1]]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.046, 0.115, 0.116);
    headPivot.add(eyeGroup);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), scleraMat);
    sclera.scale.set(1.0, 0.92, 0.65);
    eyeGroup.add(sclera);

    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, 0, 0.011);
    eyeGroup.add(pupilGroup);

    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), irisMat);
    iris.position.z = 0.002;
    pupilGroup.add(iris);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0065, 10), pupilMat);
    pupil.position.z = 0.003;
    pupilGroup.add(pupil);

    // Specular catchlight dot
    const glint = new THREE.Mesh(
      new THREE.CircleGeometry(0.0028, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    glint.position.set(0.004, 0.004, 0.0035);
    pupilGroup.add(glint);

    // Upper eyelid (rotates/scales for blinking & tired look)
    const eyelid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0235, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      eyelidMat
    );
    eyelid.scale.set(1.02, 0.95, 0.72);
    eyelid.rotation.x = tiredEyes ? -0.35 : -0.78;
    eyeGroup.add(eyelid);

    if (tiredEyes) {
      const bagMat = new THREE.MeshStandardMaterial({
        color: 0x8b6a72,
        roughness: 0.9,
        transparent: true,
        opacity: 0.32
      });
      const bag = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), bagMat);
      bag.position.set(0, -0.01, 0.008);
      bag.rotation.z = Math.PI;
      eyeGroup.add(bag);
    }

    eyes[key] = { eyeGroup, pupilGroup, eyelid };
  }

  // Eyebrows
  const browMat = new THREE.MeshStandardMaterial({ color: browColor, roughness: 0.85 });
  const browGeo = new THREE.BoxGeometry(0.044, 0.011, 0.014);
  const leftBrow = new THREE.Mesh(browGeo, browMat);
  leftBrow.position.set(-0.048, 0.148, 0.122);
  headPivot.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, browMat);
  rightBrow.position.set(0.048, 0.148, 0.122);
  headPivot.add(rightBrow);

  // Articulated Mouth
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, 0.044, 0.123);
  headPivot.add(mouthGroup);

  const mouthInnerMat = new THREE.MeshStandardMaterial({ color: 0x45181c, roughness: 0.6 });
  const lipMat = new THREE.MeshStandardMaterial({ color: lipColor, roughness: 0.65 });

  const mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), mouthInnerMat);
  mouthOpen.scale.set(1.3, 0.15, 0.35);
  mouthGroup.add(mouthOpen);

  const mouthBar = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.009, 0.01), lipMat);
  mouthBar.position.set(0, 0, 0.004);
  mouthGroup.add(mouthBar);

  const smileLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.01), lipMat);
  smileLeft.position.set(-0.026, 0.002, 0.002);
  mouthGroup.add(smileLeft);

  const smileRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.01), lipMat);
  smileRight.position.set(0.026, 0.002, 0.002);
  mouthGroup.add(smileRight);

  // Articulated Arms (Left & Right)
  const upperArmGeo = new THREE.CapsuleGeometry(0.048, 0.20, 6, 10);
  const forearmGeo = new THREE.CapsuleGeometry(0.040, 0.19, 6, 10);
  const handGeo = new THREE.SphereGeometry(0.042, 10, 8);

  const arms = {};
  for (const [key, side] of [['left', -1], ['right', 1]]) {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(side * shoulderWidth * torsoScale[0], 0.38, 0.0);
    torsoPivot.add(shoulderPivot);

    const upperArm = new THREE.Mesh(upperArmGeo, sleeveMat);
    upperArm.position.set(0, -0.12, 0);
    shoulderPivot.add(upperArm);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.24, 0);
    shoulderPivot.add(elbowPivot);

    const forearm = new THREE.Mesh(forearmGeo, sleeveMat);
    forearm.position.set(0, -0.11, 0);
    elbowPivot.add(forearm);

    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.set(0, -0.23, 0.01);
    hand.scale.set(0.9, 0.85, 1.15);
    elbowPivot.add(hand);

    const propMount = new THREE.Group();
    propMount.position.set(0, -0.23, 0.04);
    elbowPivot.add(propMount);

    arms[key] = { shoulderPivot, elbowPivot, hand, propMount };
  }

  // Invisible raycast hitbox covering seated character (head + torso)
  const hitboxMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const hitbox = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 1.25, 10), hitboxMat);
  hitbox.position.set(0, 0.88, 0.05);
  hitbox.name = `${id}_hitbox`;
  hitbox.userData.interactableId = id;
  root.add(hitbox);

  enableShadows(root, true, true);
  hitbox.castShadow = false;
  hitbox.receiveShadow = false;

  // Tag all highlight meshes
  for (const m of highlightMeshes) {
    m.userData.interactableId = id;
  }

  return {
    id,
    name,
    root,
    hitbox,
    highlightMeshes,
    parts: {
      hipsGroup,
      torsoPivot,
      headPivot,
      leftEye: eyes.left,
      rightEye: eyes.right,
      leftBrow,
      rightBrow,
      mouthGroup,
      mouthOpen,
      mouthBar,
      smileLeft,
      smileRight,
      leftArm: arms.left,
      rightArm: arms.right
    }
  };
}

/**
 * 1. UNCLE FRANK — Flannel shirt, slightly receding hair & mustache, glowing smartphone, conspiratorial gestures.
 */
export function createUncleFrank() {
  const flannelTex = createFlannelTexture();
  const rig = buildSeatedHumanoid({
    id: 'char_frank',
    name: 'Uncle Frank',
    skinColor: 0xe3b190,
    torsoColor: 0x8b1e24,
    torsoMap: flannelTex,
    sleeveMap: flannelTex,
    pantsColor: 0x3a4756,
    eyeColor: 0x3b4d3e,
    browColor: 0x4b3b30,
    torsoScale: [1.14, 1.03, 1.12],
    shoulderWidth: 0.225,
    slouch: 0.05
  });

  const { headPivot, torsoPivot, leftArm } = rig.parts;

  // Shirt collar
  const collarMat = new THREE.MeshStandardMaterial({ map: flannelTex, roughness: 0.8 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.022, 8, 16), collarMat);
  collar.position.set(0, 0.42, 0.015);
  collar.rotation.x = Math.PI / 2 + 0.15;
  torsoPivot.add(collar);

  // Receding graying-brown hair (sides + back, slightly thinner on crown)
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x524238, roughness: 0.9 });
  const backHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.136, 16, 12, 0, Math.PI * 2, 0.15, Math.PI * 0.52),
    hairMat
  );
  backHair.position.set(0, 0.115, -0.024);
  backHair.rotation.x = -0.35;
  headPivot.add(backHair);

  // Graying temples
  const templeMat = new THREE.MeshStandardMaterial({ color: 0x8c8782, roughness: 0.88 });
  for (const side of [-1, 1]) {
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.075, 0.09), templeMat);
    temple.position.set(side * 0.118, 0.13, -0.01);
    headPivot.add(temple);
  }

  // Expressive Bushy Mustache
  const stacheMat = new THREE.MeshStandardMaterial({ color: 0x4d3c32, roughness: 0.9 });
  const stache = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.068, 6, 10), stacheMat);
  stache.position.set(0, 0.064, 0.13);
  stache.rotation.z = Math.PI / 2;
  stache.scale.set(0.85, 1.0, 0.7);
  headPivot.add(stache);

  // Glowing Smartphone in left hand
  const phoneGroup = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.125, 0.011),
    new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.3, metalness: 0.7 })
  );
  phoneGroup.add(phoneBody);

  const phoneTex = createPhoneScreenTexture('#ef4444', 'HOT TAKE');
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.112),
    new THREE.MeshStandardMaterial({
      map: phoneTex,
      emissive: 0x38bdf8,
      emissiveMap: phoneTex,
      emissiveIntensity: 0.85,
      roughness: 0.2
    })
  );
  phoneScreen.position.z = 0.0065;
  phoneGroup.add(phoneScreen);

  phoneGroup.position.set(0.02, 0.02, 0.02);
  phoneGroup.rotation.set(-0.45, 0.35, -0.15);
  leftArm.propMount.add(phoneGroup);
  rig.parts.phoneScreen = phoneScreen;

  enableShadows(rig.root, true, true);
  rig.hitbox.castShadow = false;
  rig.hitbox.receiveShadow = false;
  return rig;
}

/**
 * 2. AUNT LINDA — Burgundy cardigan, pearl necklace, styled bob hair, wine glass & phone, expressive gossip brows.
 */
export function createAuntLinda() {
  const cardiganTex = createKnitTexture('#6d1d34', '#581529', '#822843');
  const rig = buildSeatedHumanoid({
    id: 'char_linda',
    name: 'Aunt Linda',
    skinColor: 0xf0c7aa,
    torsoColor: 0x6d1d34,
    torsoMap: cardiganTex,
    sleeveMap: cardiganTex,
    pantsColor: 0x2a242a,
    eyeColor: 0x466353,
    browColor: 0x4b2a1e,
    lipColor: 0xb03349,
    torsoScale: [0.92, 0.98, 0.9],
    headScale: 0.96,
    shoulderWidth: 0.19
  });

  const { headPivot, torsoPivot, leftArm, rightArm } = rig.parts;

  // Cream blouse V-inset on cardigan front
  const blouseMat = new THREE.MeshStandardMaterial({ color: 0xf4eadb, roughness: 0.78 });
  const blouse = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.25, 0.04), blouseMat);
  blouse.position.set(0, 0.30, 0.125);
  torsoPivot.add(blouse);

  // Pearl necklace
  const pearlMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    roughness: 0.18,
    metalness: 0.22
  });
  const pearlCount = 13;
  for (let i = 0; i < pearlCount; i++) {
    const angle = -Math.PI * 0.42 + (i / (pearlCount - 1)) * Math.PI * 0.84;
    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), pearlMat);
    pearl.position.set(
      Math.sin(angle) * 0.088,
      0.405 - Math.cos(angle) * 0.032,
      0.048 + Math.cos(angle) * 0.072
    );
    torsoPivot.add(pearl);
  }

  // Styled auburn bob hair
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x642e20, roughness: 0.62 });
  const bobCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.148, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  bobCap.position.set(0, 0.112, -0.008);
  headPivot.add(bobCap);

  // Bob side curtains framing face
  for (const side of [-1, 1]) {
    const sideBob = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.11, 6, 10), hairMat);
    sideBob.position.set(side * 0.115, 0.068, -0.008);
    sideBob.rotation.z = side * -0.14;
    headPivot.add(sideBob);

    // Small pearl earrings
    const earring = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), pearlMat);
    earring.position.set(side * 0.128, 0.068, 0.005);
    headPivot.add(earring);
  }

  // Side-swept bangs
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.06), hairMat);
  bangs.position.set(0.025, 0.188, 0.095);
  bangs.rotation.set(0.25, 0.08, -0.22);
  headPivot.add(bangs);

  // Wine Glass in Right Hand
  const wineGroup = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xeef6ff,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.42
  });
  const wineMat = new THREE.MeshStandardMaterial({
    color: 0x6b0f1a,
    roughness: 0.12,
    metalness: 0.08
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.006, 12), glassMat);
  base.position.y = -0.07;
  wineGroup.add(base);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.085, 8), glassMat);
  stem.position.y = -0.025;
  wineGroup.add(stem);

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 14, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65),
    glassMat
  );
  bowl.position.y = 0.045;
  bowl.scale.set(0.9, 1.25, 0.9);
  wineGroup.add(bowl);

  const wineFill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.022, 0.038, 12),
    wineMat
  );
  wineFill.position.y = 0.032;
  wineGroup.add(wineFill);

  wineGroup.position.set(0, 0.05, 0.03);
  rightArm.propMount.add(wineGroup);
  rig.parts.wineGlass = wineGroup;

  // Group chat smartphone in Left Hand
  const phoneGroup = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.115, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xb78b7d, roughness: 0.35, metalness: 0.6 })
  );
  phoneGroup.add(phoneBody);
  const phoneTex = createPhoneScreenTexture('#c084fc', 'FAM CHAT');
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.055, 0.102),
    new THREE.MeshStandardMaterial({
      map: phoneTex,
      emissive: 0xc084fc,
      emissiveMap: phoneTex,
      emissiveIntensity: 0.7
    })
  );
  phoneScreen.position.z = 0.006;
  phoneGroup.add(phoneScreen);
  phoneGroup.rotation.set(-0.5, 0.25, 0.1);
  leftArm.propMount.add(phoneGroup);

  enableShadows(rig.root, true, true);
  rig.hitbox.castShadow = false;
  rig.hitbox.receiveShadow = false;
  return rig;
}

/**
 * 3. COUSIN JAKE — Dark gaming hoodie, headphones around neck, slouching, tapping phone/controller.
 */
export function createCousinJake() {
  const hoodieTex = createKnitTexture('#222731', '#1b2029', '#2b3240');
  const rig = buildSeatedHumanoid({
    id: 'char_jake',
    name: 'Cousin Jake',
    skinColor: 0xebc5a8,
    torsoColor: 0x222731,
    torsoMap: hoodieTex,
    sleeveMap: hoodieTex,
    pantsColor: 0x1a1d24,
    shoeColor: 0x181c22,
    eyeColor: 0x3b4e66,
    browColor: 0x241d18,
    torsoScale: [0.96, 0.98, 0.96],
    headScale: 0.98,
    shoulderWidth: 0.20,
    slouch: 0.15
  });

  const { headPivot, torsoPivot, leftArm } = rig.parts;

  // Hoodie bunched hood behind neck & neon drawstring accents
  const hoodMat = new THREE.MeshStandardMaterial({ map: hoodieTex, roughness: 0.85 });
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.038, 8, 16), hoodMat);
  hood.position.set(0, 0.42, -0.03);
  hood.rotation.x = Math.PI / 2 - 0.25;
  torsoPivot.add(hood);

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0891b2,
    emissiveIntensity: 0.45,
    roughness: 0.4
  });
  for (const side of [-1, 1]) {
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), accentMat);
    string.position.set(side * 0.045, 0.31, 0.135);
    torsoPivot.add(string);
  }

  // Gaming Headphones resting around neck
  const hpBandMat = new THREE.MeshStandardMaterial({ color: 0x11151d, roughness: 0.35, metalness: 0.5 });
  const hpRingMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.9
  });

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.015, 8, 18, Math.PI * 1.25), hpBandMat);
  band.position.set(0, 0.425, 0.015);
  band.rotation.set(Math.PI / 2 + 0.18, 0, Math.PI * 0.88);
  torsoPivot.add(band);

  for (const side of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.032, 12), hpBandMat);
    cup.position.set(side * 0.092, 0.415, 0.085);
    cup.rotation.z = Math.PI / 2;
    cup.rotation.y = side * 0.35;
    torsoPivot.add(cup);

    const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0045, 6, 16), hpRingMat);
    ledRing.position.set(side * 0.106, 0.415, 0.088);
    ledRing.rotation.y = Math.PI / 2 + side * 0.35;
    torsoPivot.add(ledRing);
  }

  // Messy tousled dark hair
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.85 });
  const hairBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.142, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hairMat
  );
  hairBase.position.set(0, 0.115, -0.005);
  headPivot.add(hairBase);

  const tufts = [
    [-0.06, 0.21, 0.08, 0.3, 0.2],
    [0.0, 0.22, 0.09, 0.4, 0.0],
    [0.06, 0.20, 0.08, 0.3, -0.25],
    [-0.03, 0.23, 0.02, -0.1, 0.15],
    [0.05, 0.23, 0.01, -0.15, -0.2]
  ];
  for (const [tx, ty, tz, rx, rz] of tufts) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.085, 7), hairMat);
    tuft.position.set(tx, ty, tz);
    tuft.rotation.set(rx, 0, rz);
    headPivot.add(tuft);
  }

  // Phone held horizontally in gaming grip
  const phoneGroup = new THREE.Group();
  const phoneBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.072, 0.011),
    new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.3, metalness: 0.65 })
  );
  phoneGroup.add(phoneBody);
  const phoneTex = createPhoneScreenTexture('#22d3ee', 'GTA 6 LEAK');
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.122, 0.062),
    new THREE.MeshStandardMaterial({
      map: phoneTex,
      emissive: 0x22d3ee,
      emissiveMap: phoneTex,
      emissiveIntensity: 0.85
    })
  );
  phoneScreen.position.z = 0.0065;
  phoneGroup.add(phoneScreen);
  phoneGroup.position.set(0.07, 0.01, 0.04);
  phoneGroup.rotation.set(-0.65, 0.05, 0);
  leftArm.propMount.add(phoneGroup);

  enableShadows(rig.root, true, true);
  rig.hitbox.castShadow = false;
  rig.hitbox.receiveShadow = false;
  return rig;
}

/**
 * 4. GRANDMA — Warm knit sweater, silver bun hair, round gold glasses, dignified posture & knowing smirk.
 */
export function createGrandma() {
  const sweaterTex = createKnitTexture('#cbb8a0', '#b59f85', '#dfd2c0');
  const rig = buildSeatedHumanoid({
    id: 'char_grandma',
    name: 'Grandma',
    skinColor: 0xeac7b1,
    torsoColor: 0xcbb8a0,
    torsoMap: sweaterTex,
    sleeveMap: sweaterTex,
    pantsColor: 0x4c4452,
    shoeColor: 0x3b2d26,
    eyeColor: 0x526470,
    browColor: 0xbcbcc4,
    lipColor: 0xb67074,
    torsoScale: [0.90, 0.93, 0.92],
    headScale: 0.95,
    shoulderWidth: 0.185,
    slouch: -0.02
  });

  const { headPivot, torsoPivot } = rig.parts;

  // Cozy shawl collar
  const shawlMat = new THREE.MeshStandardMaterial({ map: sweaterTex, roughness: 0.9 });
  const shawl = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 8, 16), shawlMat);
  shawl.position.set(0, 0.415, 0.01);
  shawl.rotation.x = Math.PI / 2 + 0.12;
  torsoPivot.add(shawl);

  // Silver hair + neat bun at back
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xd9dce2, roughness: 0.68 });
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.144, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
    silverMat
  );
  hairCap.position.set(0, 0.112, -0.008);
  headPivot.add(hairCap);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), silverMat);
  bun.position.set(0, 0.175, -0.145);
  headPivot.add(bun);

  // Hairpin accent in bun
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 6), pinMat);
  pin.position.set(0, 0.185, -0.145);
  pin.rotation.z = Math.PI / 2 - 0.35;
  headPivot.add(pin);

  // Round Gold-Wire Glasses
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xe6f4ff,
    roughness: 0.06,
    metalness: 0.15,
    transparent: true,
    opacity: 0.25
  });

  for (const side of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0038, 8, 20), frameMat);
    rim.position.set(side * 0.048, 0.114, 0.136);
    headPivot.add(rim);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.029, 16), lensMat);
    lens.position.set(side * 0.048, 0.114, 0.136);
    headPivot.add(lens);

    const templeArm = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.12, 6), frameMat);
    templeArm.position.set(side * 0.088, 0.114, 0.08);
    templeArm.rotation.x = Math.PI / 2;
    templeArm.rotation.z = side * -0.12;
    headPivot.add(templeArm);
  }

  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.036, 6), frameMat);
  bridge.position.set(0, 0.116, 0.138);
  bridge.rotation.z = Math.PI / 2;
  headPivot.add(bridge);

  enableShadows(rig.root, true, true);
  rig.hitbox.castShadow = false;
  rig.hitbox.receiveShadow = false;
  return rig;
}

/**
 * 5. DAD — Argyle sweater vest over collared shirt, tired eyes, cloth napkin & carving fork.
 */
export function createDad() {
  const argyleTex = createArgyleTexture();
  const rig = buildSeatedHumanoid({
    id: 'char_dad',
    name: 'Dad',
    skinColor: 0xe5b898,
    torsoColor: 0x25384d,
    torsoMap: argyleTex,
    sleeveColor: 0xdbe6f0, // crisp light-blue button-down sleeves
    pantsColor: 0x5c5346,  // dad khakis
    eyeColor: 0x4b3b2d,
    browColor: 0x4f433b,
    torsoScale: [1.06, 1.04, 1.02],
    shoulderWidth: 0.215,
    slouch: 0.04,
    tiredEyes: true
  });

  const { headPivot, torsoPivot, leftArm, rightArm } = rig.parts;

  // Crisp shirt collar peeking out of sweater vest
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xeaf1f8, roughness: 0.72 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 16), collarMat);
  collar.position.set(0, 0.425, 0.015);
  collar.rotation.x = Math.PI / 2 + 0.15;
  torsoPivot.add(collar);

  // Short neat graying-brown hair
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x564940, roughness: 0.88 });
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.141, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    hairMat
  );
  hairCap.position.set(0, 0.114, -0.01);
  headPivot.add(hairCap);

  // Cloth Napkin in Left Hand
  const napkinMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.92, side: THREE.DoubleSide });
  const napkin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.12), napkinMat);
  napkin.position.set(0, 0.01, 0.03);
  napkin.rotation.set(0.35, 0.2, 0.15);
  leftArm.propMount.add(napkin);

  // Carving Fork in Right Hand
  const forkGroup = new THREE.Group();
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.65 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd8dee6, roughness: 0.22, metalness: 0.9 });

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.11, 8), handleMat);
  handle.position.y = -0.02;
  forkGroup.add(handle);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.10, 8), metalMat);
  shaft.position.y = 0.08;
  forkGroup.add(shaft);

  for (const sx of [-0.012, 0.012]) {
    const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0015, 0.08, 6), metalMat);
    tine.position.set(sx, 0.16, 0);
    forkGroup.add(tine);
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.008), metalMat);
  cross.position.set(0, 0.125, 0);
  forkGroup.add(cross);

  forkGroup.position.set(0, 0.02, 0.03);
  forkGroup.rotation.set(0.65, 0, -0.2);
  rightArm.propMount.add(forkGroup);
  rig.parts.carvingFork = forkGroup;

  enableShadows(rig.root, true, true);
  rig.hitbox.castShadow = false;
  rig.hitbox.receiveShadow = false;
  return rig;
}

/**
 * 6. DINNER.AI HOLOGRAM — Floating translucent geometric core + gyro rings + expressive holographic face ring
 * hovering above the smart speaker at (0, 1.6, -3.7).
 */
export function createDinnerAIHologram() {
  const id = 'char_dinner_ai';
  const root = new THREE.Group();
  root.name = id;
  root.userData.interactableId = id;

  const holoGroup = new THREE.Group();
  root.add(holoGroup);

  const cyan = new THREE.Color(0x22d3ee);

  const coreMat = new THREE.MeshStandardMaterial({
    color: cyan.clone(),
    emissive: cyan.clone(),
    emissiveIntensity: 1.35,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.72,
    flatShading: true
  });

  const wireMat = new THREE.MeshBasicMaterial({
    color: cyan.clone(),
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: cyan.clone(),
    emissive: cyan.clone(),
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85
  });

  const faceMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });

  // Inner geometric icosahedron core
  const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.20, 1), coreMat);
  holoGroup.add(coreMesh);

  const coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(0.235, 1), wireMat);
  holoGroup.add(coreWire);

  // Outer & Inner Gyroscopic Rings
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.012, 10, 48), ringMat);
  holoGroup.add(outerRing);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.009, 8, 40), ringMat);
  midRing.rotation.x = Math.PI / 3;
  holoGroup.add(midRing);

  const faceRing = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.01, 10, 40), ringMat);
  faceRing.position.z = 0.06;
  holoGroup.add(faceRing);

  // Expressive Holographic Face Overlay (Eyes + Brows + Voice Waveform Bars)
  const faceGroup = new THREE.Group();
  faceGroup.position.set(0, 0, 0.245);
  holoGroup.add(faceGroup);

  const leftEye = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.028, 4, 8), faceMat);
  leftEye.position.set(-0.075, 0.045, 0);
  faceGroup.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.028, 4, 8), faceMat);
  rightEye.position.set(0.075, 0.045, 0);
  faceGroup.add(rightEye);

  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.012, 0.008), faceMat);
  leftBrow.position.set(-0.075, 0.095, 0.005);
  faceGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.012, 0.008), faceMat);
  rightBrow.position.set(0.075, 0.095, 0.005);
  faceGroup.add(rightBrow);

  // 7 Voice Waveform Bars
  const voiceBars = [];
  for (let i = 0; i < 7; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.03, 0.008), faceMat);
    bar.position.set((i - 3) * 0.032, -0.06, 0);
    faceGroup.add(bar);
    voiceBars.push(bar);
  }

  // Projection beam cone reaching down toward smart speaker
  const beamMat = new THREE.MeshBasicMaterial({
    color: cyan.clone(),
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 24, 1, true), beamMat);
  beam.position.set(0, -0.45, 0);
  beam.rotation.x = Math.PI;
  root.add(beam);

  // Orbiting data nodes
  const orbitGroup = new THREE.Group();
  holoGroup.add(orbitGroup);
  const nodeGeo = new THREE.OctahedronGeometry(0.022, 0);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const node = new THREE.Mesh(nodeGeo, faceMat);
    node.position.set(Math.cos(angle) * 0.42, Math.sin(angle * 2) * 0.12, Math.sin(angle) * 0.42);
    orbitGroup.add(node);
  }

  // Subtle Hologram PointLight
  const holoLight = new THREE.PointLight(0x22d3ee, 1.1, 3.8, 1.8);
  holoLight.position.set(0, 0, 0.15);
  holoGroup.add(holoLight);

  // Invisible raycast hitbox
  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitbox.name = `${id}_hitbox`;
  hitbox.userData.interactableId = id;
  root.add(hitbox);

  const highlightMeshes = [coreMesh, outerRing, faceRing];
  for (const m of highlightMeshes) {
    m.userData.interactableId = id;
  }

  return {
    id,
    name: 'DINNER.AI',
    isAI: true,
    root,
    hitbox,
    highlightMeshes,
    parts: {
      holoGroup,
      coreMesh,
      coreWire,
      outerRing,
      midRing,
      faceRing,
      faceGroup,
      leftEye,
      rightEye,
      leftBrow,
      rightBrow,
      voiceBars,
      beam,
      orbitGroup,
      holoLight,
      materials: { coreMat, wireMat, ringMat, beamMat, faceMat }
    }
  };
}
