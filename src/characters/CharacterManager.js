import * as THREE from 'three';
import {
  createDiningChair,
  createUncleFrank,
  createAuntLinda,
  createCousinJake,
  createGrandma,
  createDad,
  createDinnerAIHologram
} from './CharacterFactory.js';

const COLOR_CYAN = new THREE.Color(0x22d3ee);
const COLOR_AMBER = new THREE.Color(0xf59e0b);
const COLOR_CRIMSON = new THREE.Color(0xef4444);

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothEnvelope(progress) {
  // Smooth ease-in (0..0.18), sustain (0.18..0.72), ease-out (0.72..1.0)
  if (progress <= 0 || progress >= 1) return 0;
  if (progress < 0.18) {
    const t = progress / 0.18;
    return t * t * (3 - 2 * t);
  }
  if (progress > 0.72) {
    const t = (1 - progress) / 0.28;
    return t * t * (3 - 2 * t);
  }
  return 1;
}

function wrapAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

/**
 * Creates and manages all 5 seated family members, the player's empty dining chair,
 * and the floating DINNER.AI hologram above the smart speaker.
 */
export function createCharacterManager(scene) {
  const container = new THREE.Group();
  container.name = 'characters_root';
  scene.add(container);

  const characters = {};
  const interactables = [];

  // Seating layout around the dining table at (0, 0, 0) [3.6m x 1.6m, height 0.78m]
  const seatConfigs = [
    {
      id: 'char_dad',
      label: 'Talk to Dad',
      factory: createDad,
      pos: new THREE.Vector3(-2.15, 0, 0),
      rotY: Math.PI / 2, // facing +X
      baseSlouch: 0.04,
      tiredBase: -0.35,
      glanceTargets: [new THREE.Vector3(-0.95, 1.15, -1.15), new THREE.Vector3(2.15, 1.15, 0)]
    },
    {
      id: 'char_grandma',
      label: 'Talk to Grandma',
      factory: createGrandma,
      pos: new THREE.Vector3(2.15, 0, 0),
      rotY: -Math.PI / 2, // facing -X
      baseSlouch: -0.02,
      tiredBase: -0.76,
      glanceTargets: [new THREE.Vector3(-2.15, 1.15, 0), new THREE.Vector3(-0.95, 1.15, -1.15)]
    },
    {
      id: 'char_frank',
      label: 'Talk to Uncle Frank',
      factory: createUncleFrank,
      pos: new THREE.Vector3(-0.95, 0, -1.15),
      rotY: 0, // facing +Z
      baseSlouch: 0.05,
      tiredBase: -0.78,
      glanceTargets: [new THREE.Vector3(0.95, 1.15, -1.15), new THREE.Vector3(-1.0, 1.15, 1.15)]
    },
    {
      id: 'char_linda',
      label: 'Talk to Aunt Linda',
      factory: createAuntLinda,
      pos: new THREE.Vector3(0.95, 0, -1.15),
      rotY: 0, // facing +Z
      baseSlouch: 0.0,
      tiredBase: -0.74,
      glanceTargets: [new THREE.Vector3(-0.95, 1.15, -1.15), new THREE.Vector3(-1.0, 1.15, 1.15)]
    },
    {
      id: 'char_jake',
      label: 'Talk to Cousin Jake',
      factory: createCousinJake,
      pos: new THREE.Vector3(-1.0, 0, 1.15),
      rotY: Math.PI, // facing -Z
      baseSlouch: 0.15,
      tiredBase: -0.62,
      glanceTargets: [new THREE.Vector3(-0.95, 1.15, -1.15), new THREE.Vector3(0, 1.6, -3.7)]
    }
  ];

  // Build 5 family members + their dining chairs
  seatConfigs.forEach((cfg, idx) => {
    const seatGroup = new THREE.Group();
    seatGroup.position.copy(cfg.pos);
    seatGroup.rotation.y = cfg.rotY;
    container.add(seatGroup);

    const chair = createDiningChair();
    seatGroup.add(chair);

    const rig = cfg.factory();
    seatGroup.add(rig.root);

    const state = {
      ...rig,
      seatGroup,
      basePos: cfg.pos.clone(),
      baseRotY: cfg.rotY,
      baseSlouch: cfg.baseSlouch,
      tiredBase: cfg.tiredBase,
      glanceTargets: cfg.glanceTargets,
      phaseOffset: idx * 1.37,
      blinkTimer: 2.0 + idx * 0.85,
      blinkProgress: 0,
      headYaw: 0,
      headPitch: 0,
      headRoll: 0,
      reaction: null // { type, elapsed, duration }
    };

    characters[cfg.id] = state;
    interactables.push({
      id: cfg.id,
      mesh: rig.hitbox,
      label: cfg.label,
      type: 'character',
      highlightMeshes: rig.highlightMeshes
    });
  });

  // Player's empty dining chair at South-East (1.0, 0, 1.15), slightly angled as if just vacated
  const playerChair = createDiningChair();
  playerChair.name = 'player_empty_chair';
  playerChair.position.set(1.0, 0, 1.24);
  playerChair.rotation.y = Math.PI - 0.24;
  container.add(playerChair);

  // DINNER.AI Hologram hovering above the smart speaker at (0, 1.6, -3.7)
  const aiRig = createDinnerAIHologram();
  aiRig.root.position.set(0, 1.6, -3.7);
  container.add(aiRig.root);

  const aiState = {
    ...aiRig,
    basePos: new THREE.Vector3(0, 1.6, -3.7),
    isSpeaking: false,
    speakEnergy: 0,
    currentColor: COLOR_CYAN.clone(),
    reaction: null
  };

  characters['char_dinner_ai'] = aiState;
  interactables.push({
    id: 'char_dinner_ai',
    mesh: aiRig.hitbox,
    label: 'Inspect DINNER.AI Hologram',
    type: 'character',
    highlightMeshes: aiRig.highlightMeshes
  });

  // Reusable scratch vectors to avoid GC churn per frame
  const _worldHead = new THREE.Vector3();
  const _targetColor = new THREE.Color();

  /**
   * Triggers a timed expressive reaction on any character or DINNER.AI.
   * Supported reactions: 'defensive' | 'laugh' | 'shock' | 'annoyed' | 'calm' | 'argue'
   */
  function triggerReaction(characterId, reaction = 'annoyed') {
    const target = characters[characterId];
    if (!target) return;

    const valid = new Set(['defensive', 'laugh', 'shock', 'annoyed', 'calm', 'argue']);
    const type = valid.has(reaction) ? reaction : 'annoyed';
    const durations = {
      defensive: 2.6,
      laugh: 2.5,
      shock: 2.2,
      annoyed: 2.4,
      calm: 2.8,
      argue: 2.7
    };

    target.reaction = {
      type,
      elapsed: 0,
      duration: durations[type] || 2.4
    };
  }

  /**
   * Toggles DINNER.AI speech hologram pulse & voice waveform animation.
   */
  function setAISpeaking(isSpeaking) {
    aiState.isSpeaking = Boolean(isSpeaking);
  }

  /**
   * Applies facial expression parameters to a human character.
   */
  function applyFaceExpression(charState, {
    browRaise = 0,     // -0.014..+0.018
    browFurrow = 0,    // -0.4..+0.55 (positive = angry V, negative = worried/sad)
    mouthCurve = 0,    // -1 (frown) .. +1 (smile)
    mouthOpenAmt = 0,  // 0..1
    pupilX = 0,        // -0.006..+0.006
    pupilY = 0,        // -0.006..+0.007
    eyeSquint = 0      // 0..1
  }) {
    const p = charState.parts;

    // Eyebrows
    p.leftBrow.position.y = 0.148 + browRaise;
    p.rightBrow.position.y = 0.148 + browRaise;
    p.leftBrow.rotation.z = -browFurrow;
    p.rightBrow.rotation.z = browFurrow;

    // Pupils
    p.leftEye.pupilGroup.position.x = pupilX;
    p.leftEye.pupilGroup.position.y = pupilY;
    p.rightEye.pupilGroup.position.x = pupilX;
    p.rightEye.pupilGroup.position.y = pupilY;

    // Eyelids (combine blink, tiredBase, and expression squint)
    const blinkAmt = charState.blinkProgress > 0
      ? Math.sin(charState.blinkProgress * Math.PI)
      : 0;
    const lidAngle = lerp(charState.tiredBase, 0.25, clamp(blinkAmt + eyeSquint * 0.42, 0, 1));
    p.leftEye.eyelid.rotation.x = lidAngle;
    p.rightEye.eyelid.rotation.x = lidAngle;

    // Mouth curve & openness
    const curveAngle = mouthCurve * 0.42;
    p.smileLeft.rotation.z = -curveAngle;
    p.smileRight.rotation.z = curveAngle;
    p.smileLeft.position.y = mouthCurve * 0.005;
    p.smileRight.position.y = mouthCurve * 0.005;

    const openScale = 0.15 + clamp(mouthOpenAmt, 0, 1) * 1.15;
    p.mouthOpen.scale.y = openScale;
    p.mouthBar.position.y = -clamp(mouthOpenAmt, 0, 1) * 0.008;
  }

  /**
   * Updates one human character's procedural idle, gaze, heat-scaled expression, and active reaction.
   */
  function updateHuman(charState, dt, time, heatNorm, playerPos) {
    const t = time + charState.phaseOffset;
    const p = charState.parts;
    const agitation = 0.35 + heatNorm * 1.35;

    // 1. Automatic blinking
    charState.blinkTimer -= dt;
    if (charState.blinkTimer <= 0) {
      charState.blinkProgress += dt / 0.15;
      if (charState.blinkProgress >= 1) {
        charState.blinkProgress = 0;
        charState.blinkTimer = 2.6 + Math.abs(Math.sin(t * 1.7)) * 3.0;
      }
    }

    // 2. Head tracking (look at player if nearby, else glance at arguing relatives)
    let desiredYaw = Math.sin(t * 0.45) * 0.12;
    let desiredPitch = 0.02;
    let desiredRoll = Math.sin(t * 0.32) * 0.03;

    _worldHead.set(charState.basePos.x, 1.15, charState.basePos.z);

    let lookingAtPlayer = false;
    if (playerPos) {
      const dx = playerPos.x - _worldHead.x;
      const dy = (playerPos.y ?? 1.6) - _worldHead.y;
      const dz = playerPos.z - _worldHead.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < 15.0 && distSq > 0.04) {
        const worldAngle = Math.atan2(dx, dz);
        const relYaw = wrapAngle(worldAngle - charState.baseRotY);
        if (Math.abs(relYaw) < 1.25) {
          desiredYaw = clamp(relYaw, -0.82, 0.82);
          desiredPitch = clamp(-Math.atan2(dy, Math.sqrt(distSq)) * 0.55, -0.32, 0.28);
          lookingAtPlayer = true;
        }
      }
    }

    if (!lookingAtPlayer && heatNorm > 0.25 && charState.glanceTargets.length > 0) {
      const targetIdx = Math.floor((t * 0.22) % charState.glanceTargets.length);
      const gt = charState.glanceTargets[targetIdx];
      const worldAngle = Math.atan2(gt.x - _worldHead.x, gt.z - _worldHead.z);
      const relYaw = wrapAngle(worldAngle - charState.baseRotY);
      desiredYaw = clamp(relYaw * 0.72, -0.75, 0.75);
    }

    // 3. Breathing & default torso posture
    const breath = Math.sin(t * (1.7 + heatNorm * 0.9));
    let torsoPitch = charState.baseSlouch + breath * 0.015;
    let torsoYaw = 0;
    let torsoBounceY = 0.06 + breath * 0.005;

    // Default arm poses (seated naturally near table edge)
    let lShoulderX = -0.58, lShoulderZ = 0.14, lElbowX = -0.85;
    let rShoulderX = -0.58, rShoulderZ = -0.14, rElbowX = -0.85;

    // Base heat-driven facial expression
    let browRaise = 0;
    let browFurrow = heatNorm * 0.28;
    let mouthCurve = lerp(0.18, -0.55, heatNorm);
    let mouthOpenAmt = 0.04;
    let pupilX = 0;
    let pupilY = 0;
    let eyeSquint = heatNorm * 0.18;

    // 4. Character-specific idle animations
    switch (charState.id) {
      case 'char_frank': {
        // Left hand holds glowing phone up; right hand gestures conspiratorially / points
        lShoulderX = -0.72 + Math.sin(t * 1.1) * 0.04;
        lShoulderZ = 0.22;
        lElbowX = -1.18 + Math.sin(t * 2.2) * 0.05;

        const gesture = Math.sin(t * (1.8 + heatNorm * 2.4));
        rShoulderX = -0.78 - Math.abs(gesture) * (0.18 + heatNorm * 0.25);
        rShoulderZ = -0.18 - gesture * 0.12;
        rElbowX = -0.95 + gesture * (0.22 + heatNorm * 0.25);

        torsoPitch += heatNorm * 0.09;
        browFurrow = 0.12 + heatNorm * 0.34;
        if (heatNorm > 0.35 && Math.sin(t * 1.3) > 0.2) {
          mouthOpenAmt = 0.15 + Math.abs(Math.sin(t * 6.5)) * 0.35 * heatNorm;
        }
        if (p.phoneScreen && p.phoneScreen.material) {
          p.phoneScreen.material.emissiveIntensity = 0.72 + Math.sin(t * 5.0) * 0.18;
        }
        break;
      }

      case 'char_linda': {
        // Right hand periodically raises wine glass for a classy sip; left hand holds phone
        const sipCycle = (t * 0.14) % 1;
        const sipAmount = sipCycle > 0.72 && sipCycle < 0.94
          ? Math.sin(((sipCycle - 0.72) / 0.22) * Math.PI)
          : 0;

        rShoulderX = -0.68 - sipAmount * 0.42;
        rShoulderZ = -0.18 + sipAmount * 0.24;
        rElbowX = -1.05 - sipAmount * 0.58;

        lShoulderX = -0.64;
        lShoulderZ = 0.20;
        lElbowX = -1.08 + Math.sin(t * 1.5) * 0.04;

        // Expressive gossip brow arch + periodic dramatic eye-roll
        const rollCycle = (t * 0.19) % 1;
        if (rollCycle > 0.55 && rollCycle < 0.75) {
          const rProg = (rollCycle - 0.55) / 0.20;
          pupilY = Math.sin(rProg * Math.PI) * 0.0065;
          pupilX = Math.cos(rProg * Math.PI) * 0.004;
          browRaise = 0.011;
          desiredRoll += Math.sin(rProg * Math.PI) * 0.12;
        } else {
          browRaise = 0.005 * (1 - heatNorm);
        }
        break;
      }

      case 'char_jake': {
        // Slouched over phone, tapping impatiently; faster restless taps as heat rises
        const tapFreq = 4.5 + heatNorm * 5.0;
        lShoulderX = -0.78;
        lShoulderZ = 0.26;
        lElbowX = -1.12 + Math.sin(t * tapFreq) * 0.04;

        rShoulderX = -0.76;
        rShoulderZ = -0.26;
        rElbowX = -1.10 + Math.cos(t * tapFreq * 1.15) * 0.05;

        if (!lookingAtPlayer) {
          desiredPitch = 0.26 + Math.sin(t * 2.2) * 0.04;
        }
        mouthCurve = lerp(-0.08, -0.35, heatNorm);
        browFurrow = 0.08 + heatNorm * 0.18;
        break;
      }

      case 'char_grandma': {
        // Dignified upright posture, gentle calm nods, knowing smirk even at high heat
        lShoulderX = -0.52;
        lShoulderZ = 0.24;
        lElbowX = -0.92;
        rShoulderX = -0.52;
        rShoulderZ = -0.24;
        rElbowX = -0.92;

        desiredPitch += Math.sin(t * 1.15) * 0.06;
        browFurrow = heatNorm * 0.06; // stays remarkably composed
        browRaise = 0.004;
        mouthCurve = lerp(0.55, 0.25, heatNorm); // knowing smirk
        eyeSquint = 0.14;
        break;
      }

      case 'char_dad': {
        // Tired eyes, periodically rubs temple with left hand, exasperated shrugs with carving fork
        const rubCycle = (t * 0.12) % 1;
        const rubAmt = rubCycle > 0.65 && rubCycle < 0.92
          ? Math.sin(((rubCycle - 0.65) / 0.27) * Math.PI)
          : 0;

        lShoulderX = -0.60 - rubAmt * 0.85;
        lShoulderZ = 0.18 - rubAmt * 0.18;
        lElbowX = -0.88 - rubAmt * 0.95;

        const shrug = Math.max(0, Math.sin(t * (0.9 + heatNorm * 1.2))) * (0.2 + heatNorm * 0.55);
        rShoulderX = -0.62 - shrug * 0.22;
        rShoulderZ = -0.20 - shrug * 0.24;
        rElbowX = -0.92 + shrug * 0.18;

        if (rubAmt > 0.2) {
          desiredRoll += Math.sin(t * 6.0) * 0.07 * rubAmt;
          eyeSquint = 0.55 * rubAmt;
        }
        browFurrow = -0.18 - heatNorm * 0.15; // weary worried brows
        mouthCurve = lerp(-0.18, -0.52, heatNorm);
        break;
      }
    }

    // 5. Active Timed Reaction Overlay
    if (charState.reaction) {
      charState.reaction.elapsed += dt;
      const progress = charState.reaction.elapsed / charState.reaction.duration;
      if (progress >= 1) {
        charState.reaction = null;
      } else {
        const w = smoothEnvelope(progress);
        const osc = Math.sin(charState.reaction.elapsed * 12.0);
        const slowOsc = Math.sin(charState.reaction.elapsed * 6.5);

        switch (charState.reaction.type) {
          case 'defensive':
            torsoPitch = lerp(torsoPitch, -0.14, w);
            lShoulderX = lerp(lShoulderX, -1.15, w);
            lShoulderZ = lerp(lShoulderZ, 0.45, w);
            lElbowX = lerp(lElbowX, -1.25, w);
            rShoulderX = lerp(rShoulderX, -1.15, w);
            rShoulderZ = lerp(rShoulderZ, -0.45, w);
            rElbowX = lerp(rElbowX, -1.25, w);
            desiredYaw += slowOsc * 0.35 * w;
            browRaise = lerp(browRaise, 0.012, w);
            browFurrow = lerp(browFurrow, -0.22, w);
            mouthCurve = lerp(mouthCurve, -0.45, w);
            mouthOpenAmt = Math.max(mouthOpenAmt, (0.25 + Math.abs(osc) * 0.4) * w);
            break;

          case 'laugh':
            torsoPitch = lerp(torsoPitch, -0.12 + osc * 0.04, w);
            torsoBounceY += Math.abs(osc) * 0.022 * w;
            desiredPitch = lerp(desiredPitch, -0.22 + osc * 0.06, w);
            browRaise = lerp(browRaise, 0.012, w);
            browFurrow = lerp(browFurrow, -0.05, w);
            mouthCurve = lerp(mouthCurve, 0.95, w);
            mouthOpenAmt = Math.max(mouthOpenAmt, (0.4 + Math.abs(osc) * 0.45) * w);
            eyeSquint = lerp(eyeSquint, 0.65, w);
            break;

          case 'shock':
            torsoPitch = lerp(torsoPitch, -0.20, w);
            desiredPitch = lerp(desiredPitch, -0.14, w);
            lShoulderX = lerp(lShoulderX, -1.28, w);
            rShoulderX = lerp(rShoulderX, -1.28, w);
            lElbowX = lerp(lElbowX, -1.35, w);
            rElbowX = lerp(rElbowX, -1.35, w);
            browRaise = lerp(browRaise, 0.02, w);
            browFurrow = lerp(browFurrow, -0.12, w);
            mouthCurve = lerp(mouthCurve, -0.1, w);
            mouthOpenAmt = lerp(mouthOpenAmt, 0.95, w);
            eyeSquint = 0;
            break;

          case 'annoyed':
            desiredYaw += (0.28 + slowOsc * 0.16) * w;
            desiredRoll += 0.14 * w;
            rShoulderX = lerp(rShoulderX, -0.95, w);
            rShoulderZ = lerp(rShoulderZ, -0.35 + slowOsc * 0.15, w);
            browFurrow = lerp(browFurrow, 0.42, w);
            mouthCurve = lerp(mouthCurve, -0.78, w);
            pupilY = lerp(pupilY, 0.0065, w);
            eyeSquint = lerp(eyeSquint, 0.35, w);
            break;

          case 'calm':
            torsoPitch = lerp(torsoPitch, charState.baseSlouch - 0.02, w);
            desiredPitch += Math.sin(charState.reaction.elapsed * 3.5) * 0.12 * w;
            browRaise = lerp(browRaise, 0.006, w);
            browFurrow = lerp(browFurrow, 0.0, w);
            mouthCurve = lerp(mouthCurve, 0.68, w);
            mouthOpenAmt = lerp(mouthOpenAmt, 0.06, w);
            eyeSquint = lerp(eyeSquint, 0.18, w);
            break;

          case 'argue':
            torsoPitch = lerp(torsoPitch, 0.22, w);
            torsoYaw += slowOsc * 0.08 * w;
            rShoulderX = lerp(rShoulderX, -1.25 - Math.abs(osc) * 0.25, w);
            rShoulderZ = lerp(rShoulderZ, -0.12, w);
            rElbowX = lerp(rElbowX, -0.65 + osc * 0.35, w);
            lShoulderX = lerp(lShoulderX, -0.88, w);
            browFurrow = lerp(browFurrow, 0.52, w);
            mouthCurve = lerp(mouthCurve, -0.72, w);
            mouthOpenAmt = Math.max(mouthOpenAmt, (0.35 + Math.abs(osc) * 0.55) * w);
            break;
        }
      }
    }

    // 6. Smoothly apply transforms
    const damp = clamp(dt * (5.5 + agitation * 1.5), 0.02, 0.35);
    charState.headYaw = lerp(charState.headYaw, desiredYaw, damp);
    charState.headPitch = lerp(charState.headPitch, desiredPitch, damp);
    charState.headRoll = lerp(charState.headRoll, desiredRoll, damp);

    p.headPivot.rotation.set(charState.headPitch, charState.headYaw, charState.headRoll);
    p.torsoPivot.position.y = lerp(p.torsoPivot.position.y, torsoBounceY, damp);
    p.torsoPivot.rotation.x = lerp(p.torsoPivot.rotation.x, torsoPitch, damp);
    p.torsoPivot.rotation.y = lerp(p.torsoPivot.rotation.y, torsoYaw, damp);

    p.leftArm.shoulderPivot.rotation.x = lerp(p.leftArm.shoulderPivot.rotation.x, lShoulderX, damp);
    p.leftArm.shoulderPivot.rotation.z = lerp(p.leftArm.shoulderPivot.rotation.z, lShoulderZ, damp);
    p.leftArm.elbowPivot.rotation.x = lerp(p.leftArm.elbowPivot.rotation.x, lElbowX, damp);

    p.rightArm.shoulderPivot.rotation.x = lerp(p.rightArm.shoulderPivot.rotation.x, rShoulderX, damp);
    p.rightArm.shoulderPivot.rotation.z = lerp(p.rightArm.shoulderPivot.rotation.z, rShoulderZ, damp);
    p.rightArm.elbowPivot.rotation.x = lerp(p.rightArm.elbowPivot.rotation.x, rElbowX, damp);

    applyFaceExpression(charState, {
      browRaise,
      browFurrow,
      mouthCurve,
      mouthOpenAmt,
      pupilX,
      pupilY,
      eyeSquint
    });
  }

  /**
   * Updates DINNER.AI floating hologram: color shifts by heat, gyro spin, speech pulse, and reactions.
   */
  function updateDinnerAI(dt, time, heatNorm, playerPos) {
    const p = aiState.parts;
    const mats = p.materials;

    // Color interpolation: Cyan (0..0.42) -> Amber (0.42..0.75) -> Crimson (0.75..1.0)
    if (heatNorm < 0.45) {
      _targetColor.copy(COLOR_CYAN).lerp(COLOR_AMBER, heatNorm / 0.45);
    } else {
      _targetColor.copy(COLOR_AMBER).lerp(COLOR_CRIMSON, (heatNorm - 0.45) / 0.55);
    }
    aiState.currentColor.lerp(_targetColor, clamp(dt * 3.5, 0.02, 0.25));

    // Smooth speech energy
    const targetSpeak = aiState.isSpeaking ? 1.0 : 0.0;
    aiState.speakEnergy = lerp(aiState.speakEnergy, targetSpeak, clamp(dt * 8.0, 0.05, 0.5));

    // Active AI reaction modifier
    let reactionScale = 1.0;
    let glitchX = 0;
    let spinBoost = 1.0;

    if (aiState.reaction) {
      aiState.reaction.elapsed += dt;
      const prog = aiState.reaction.elapsed / aiState.reaction.duration;
      if (prog >= 1) {
        aiState.reaction = null;
      } else {
        const w = smoothEnvelope(prog);
        if (aiState.reaction.type === 'defensive' || aiState.reaction.type === 'shock') {
          glitchX = Math.sin(time * 55) * 0.035 * w;
          spinBoost = 1 + 2.4 * w;
        } else if (aiState.reaction.type === 'argue') {
          reactionScale = 1 + 0.18 * w;
          spinBoost = 1 + 1.8 * w;
        } else if (aiState.reaction.type === 'laugh') {
          reactionScale = 1 + Math.sin(time * 16) * 0.08 * w;
          spinBoost = 1 + 1.5 * w;
        }
      }
    }

    // Apply color & emissive pulse
    const pulse = 1.0 + Math.sin(time * (3.2 + heatNorm * 4.5)) * 0.15 + aiState.speakEnergy * (0.35 + Math.sin(time * 18) * 0.25);
    mats.coreMat.color.copy(aiState.currentColor);
    mats.coreMat.emissive.copy(aiState.currentColor);
    mats.coreMat.emissiveIntensity = 1.15 * pulse;

    mats.wireMat.color.copy(aiState.currentColor);
    mats.ringMat.color.copy(aiState.currentColor);
    mats.ringMat.emissive.copy(aiState.currentColor);
    mats.ringMat.emissiveIntensity = 1.05 * pulse;

    mats.beamMat.color.copy(aiState.currentColor);
    mats.beamMat.opacity = 0.11 + aiState.speakEnergy * 0.08 + heatNorm * 0.05;

    p.holoLight.color.copy(aiState.currentColor);
    p.holoLight.intensity = 1.0 + heatNorm * 0.6 + aiState.speakEnergy * 0.9;

    // Hovering motion + subtle player yaw tracking
    p.holoGroup.position.y = Math.sin(time * 2.1) * 0.065;
    p.holoGroup.position.x = glitchX;

    if (playerPos) {
      const targetYaw = clamp(
        Math.atan2(playerPos.x - aiState.basePos.x, playerPos.z - aiState.basePos.z),
        -0.75,
        0.75
      );
      p.holoGroup.rotation.y = lerp(p.holoGroup.rotation.y, targetYaw, clamp(dt * 3.5, 0.02, 0.2));
    }

    // Core & gyro rings rotation
    const speed = (0.7 + heatNorm * 1.4 + aiState.speakEnergy * 0.9) * spinBoost;
    p.coreMesh.rotation.y += dt * 0.8 * speed;
    p.coreMesh.rotation.x += dt * 0.45 * speed;
    p.coreWire.rotation.y -= dt * 0.65 * speed;
    p.coreWire.rotation.z += dt * 0.35 * speed;

    const coreScale = (1.0 + aiState.speakEnergy * (0.08 + Math.abs(Math.sin(time * 15)) * 0.08)) * reactionScale;
    p.coreMesh.scale.setScalar(coreScale);
    p.coreWire.scale.setScalar(coreScale * 1.04);

    p.outerRing.rotation.z += dt * 0.55 * speed;
    p.outerRing.rotation.x = Math.sin(time * 0.9) * 0.25;
    p.midRing.rotation.y -= dt * 1.15 * speed;
    p.midRing.rotation.x += dt * 0.6 * speed;
    p.orbitGroup.rotation.y += dt * 0.9 * speed;

    // Holographic brow angle shifts from friendly (0) -> skeptical -> menacing crimson V
    const browAngle = lerp(0.06, -0.42, heatNorm);
    p.leftBrow.rotation.z = browAngle;
    p.rightBrow.rotation.z = -browAngle;

    // Voice waveform bars animate energetically when speaking
    p.voiceBars.forEach((bar, i) => {
      const centerWeight = 1.0 - Math.abs(i - 3) * 0.2;
      const idleH = 0.28 + Math.sin(time * 3.5 + i * 0.7) * 0.12;
      const speakH = 0.55 + Math.abs(Math.sin(time * 16 + i * 1.35)) * 2.2 * centerWeight;
      bar.scale.y = lerp(idleH, speakH, aiState.speakEnergy);
    });
  }

  /**
   * Main per-frame update called from the game loop.
   */
  function update(dt, time, heat = 18, playerPos = null) {
    const safeDt = clamp(dt || 0.016, 0.001, 0.1);
    const safeTime = time ?? 0;
    const heatNorm = clamp((heat ?? 18) / 100, 0, 1);

    for (const cfg of seatConfigs) {
      updateHuman(characters[cfg.id], safeDt, safeTime, heatNorm, playerPos);
    }
    updateDinnerAI(safeDt, safeTime, heatNorm, playerPos);
  }

  /**
   * Disposes all GPU resources and detaches characters from the scene.
   */
  function dispose() {
    const disposedGeos = new Set();
    const disposedMats = new Set();
    const disposedTex = new Set();

    container.traverse((obj) => {
      if (obj.geometry && !disposedGeos.has(obj.geometry)) {
        obj.geometry.dispose();
        disposedGeos.add(obj.geometry);
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (!disposedMats.has(mat)) {
            if (mat.map && !disposedTex.has(mat.map)) {
              mat.map.dispose();
              disposedTex.add(mat.map);
            }
            if (mat.emissiveMap && !disposedTex.has(mat.emissiveMap)) {
              mat.emissiveMap.dispose();
              disposedTex.add(mat.emissiveMap);
            }
            mat.dispose();
            disposedMats.add(mat);
          }
        }
      }
    });

    scene.remove(container);
  }

  return {
    characters,
    interactables,
    triggerReaction,
    setAISpeaking,
    update,
    dispose
  };
}
