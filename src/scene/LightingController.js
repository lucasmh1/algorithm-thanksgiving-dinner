import * as THREE from 'three';

const COLOR_WARM_CHANDELIER = new THREE.Color(0xffc982);
const COLOR_TENSE_CHANDELIER = new THREE.Color(0xd8c6b8);
const COLOR_ALARM_CHANDELIER = new THREE.Color(0xff7a5c);

const COLOR_AI_CYAN = new THREE.Color(0x00e5ff);
const COLOR_AI_AMBER = new THREE.Color(0xffa726);
const COLOR_AI_CRIMSON = new THREE.Color(0xff1e42);

const COLOR_AMB_WARM = new THREE.Color(0x523c2d);
const COLOR_AMB_COOL = new THREE.Color(0x283548);
const COLOR_AMB_HIGH = new THREE.Color(0x3a141c);

const COLOR_MOON = new THREE.Color(0x6e8ec4);
const COLOR_LIGHTNING = new THREE.Color(0xdbeafe);

export class LightingController {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'LightingRig';
    this.scene.add(this.group);

    this.smoothHeat = 18;
    this.lightningFlash = 0;
    this._nextLightning = 4.0;
    this._tempColor = new THREE.Color();

    // Atmospheric backdrop & subtle warm-dark fog
    this.scene.background = new THREE.Color(0x090c14);
    this.scene.fog = new THREE.FogExp2(0x130e10, 0.022);

    // 1. Hemisphere bounce (warm plaster ceiling / rich wood floor)
    this.hemiLight = new THREE.HemisphereLight(0xffe4c4, 0x382518, 0.65);
    this.group.add(this.hemiLight);

    // 2. Subtle ambient fill so corners stay readable
    this.ambientLight = new THREE.AmbientLight(COLOR_AMB_WARM, 0.55);
    this.group.add(this.ambientLight);

    // 3. Warm Dining Chandelier (Primary shadow caster)
    this.chandelierLight = new THREE.PointLight(COLOR_WARM_CHANDELIER, 24, 16, 1.55);
    this.chandelierLight.position.set(0, 2.7, 0);
    this.chandelierLight.castShadow = true;
    this.chandelierLight.shadow.mapSize.set(1024, 1024);
    this.chandelierLight.shadow.bias = -0.0012;
    this.chandelierLight.shadow.normalBias = 0.02;
    this.chandelierLight.shadow.camera.near = 0.25;
    this.chandelierLight.shadow.camera.far = 14;
    this.group.add(this.chandelierLight);

    // 4. Dining Table Candles warm glow
    this.candleLight = new THREE.PointLight(0xff9b3d, 5.5, 6.2, 1.8);
    this.candleLight.position.set(0, 1.12, 0);
    this.group.add(this.candleLight);

    // 5. Kitchen warm-fluorescent overhead + under-cabinet fill
    this.kitchenLight = new THREE.PointLight(0xfff1d6, 14, 11, 1.6);
    this.kitchenLight.position.set(7.4, 2.8, -1.9);
    this.group.add(this.kitchenLight);

    // 6. Cool Cyan AI Hologram Rim Light (above smart speaker on North console)
    this.aiRimLight = new THREE.PointLight(COLOR_AI_CYAN, 7.5, 8.5, 1.7);
    this.aiRimLight.position.set(0, 1.65, -3.55);
    this.group.add(this.aiRimLight);

    // 7. Smart TV screen spill
    this.tvLight = new THREE.PointLight(0x28b8ff, 3.2, 6.5, 1.8);
    this.tvLight.position.set(0, 1.95, -4.0);
    this.group.add(this.tvLight);

    // 8. Moonlight / Storm Window Light from West-South windows
    this.moonLight = new THREE.DirectionalLight(COLOR_MOON, 0.75);
    this.moonLight.position.set(-9, 5.5, 4.5);
    this.group.add(this.moonLight);

    // 9. Red Emergency Warning Lights (front door & north corners — activate at high heat)
    this.emergencyDoorLight = new THREE.PointLight(0xff1a35, 0, 7.5, 1.7);
    this.emergencyDoorLight.position.set(-1.1, 2.35, 4.15);
    this.group.add(this.emergencyDoorLight);

    this.emergencyNorthLight = new THREE.PointLight(0xff1a35, 0, 9.0, 1.7);
    this.emergencyNorthLight.position.set(3.2, 2.6, -3.6);
    this.group.add(this.emergencyNorthLight);

    // 10. Subtle warm sideboard accent light so gifts & scrapbook pop
    this.sideboardLight = new THREE.PointLight(0xffbe7a, 3.5, 5.5, 1.8);
    this.sideboardLight.position.set(4.5, 1.85, 2.2);
    this.group.add(this.sideboardLight);

    // 11. Subtle desk lamp light over the laptop & receipt
    this.deskLight = new THREE.PointLight(0xffd296, 3.2, 4.5, 1.8);
    this.deskLight.position.set(-4.6, 1.45, -0.2);
    this.group.add(this.deskLight);
  }

  update(dt, time, heat = 18) {
    const clampedHeat = Math.max(0, Math.min(100, heat));
    this.smoothHeat += (clampedHeat - this.smoothHeat) * Math.min(1, dt * 3.0);
    const h = this.smoothHeat;

    // Normalized band factors
    const medT = THREE.MathUtils.clamp((h - 35) / 35, 0, 1);
    const highT = THREE.MathUtils.clamp((h - 70) / 30, 0, 1);

    // 1. Candle organic multi-sine flicker
    const candleFlicker =
      Math.sin(time * 9.3) * 0.12 +
      Math.sin(time * 17.7 + 1.1) * 0.08 +
      Math.sin(time * 27.1 + 2.4) * 0.04;
    this.candleLight.intensity = (5.4 - highT * 1.4) * (1 + candleFlicker);

    // 2. Chandelier color & tension flicker
    if (h <= 35) {
      this.chandelierLight.color.copy(COLOR_WARM_CHANDELIER);
      this.chandelierLight.intensity = 24 + Math.sin(time * 1.8) * 0.4;
    } else if (h <= 70) {
      this.chandelierLight.color.copy(COLOR_WARM_CHANDELIER).lerp(COLOR_TENSE_CHANDELIER, medT * 0.65);
      // Subtle occasional electrical dip
      const dip = Math.sin(time * 13.7) * Math.sin(time * 3.1) > 0.88 ? 0.72 : 1.0;
      this.chandelierLight.intensity = (23 - medT * 4.5) * dip;
    } else {
      this.chandelierLight.color.copy(COLOR_TENSE_CHANDELIER).lerp(COLOR_ALARM_CHANDELIER, highT * 0.75);
      const hardFlicker = Math.sin(time * 23.0) * Math.sin(time * 7.3) > 0.72 ? 0.45 : 1.0;
      this.chandelierLight.intensity = (17.5 - highT * 6.0) * hardFlicker;
    }

    // 3. Ambient & Hemisphere shift
    if (h <= 70) {
      this.ambientLight.color.copy(COLOR_AMB_WARM).lerp(COLOR_AMB_COOL, medT * 0.75);
      this.hemiLight.intensity = 0.65 - medT * 0.14;
    } else {
      this.ambientLight.color.copy(COLOR_AMB_COOL).lerp(COLOR_AMB_HIGH, highT * 0.85);
      this.hemiLight.intensity = 0.51 - highT * 0.15;
    }

    // 4. AI Hologram Rim Light & TV Spill
    const aiPulseSpeed = 2.2 + medT * 3.2 + highT * 5.0;
    const aiPulse = 0.82 + Math.sin(time * aiPulseSpeed) * 0.22;
    if (h <= 70) {
      this.aiRimLight.color.copy(COLOR_AI_CYAN).lerp(COLOR_AI_AMBER, medT * 0.7);
    } else {
      this.aiRimLight.color.copy(COLOR_AI_AMBER).lerp(COLOR_AI_CRIMSON, highT);
    }
    this.aiRimLight.intensity = (7.2 + highT * 4.5) * aiPulse;
    this.tvLight.color.copy(this.aiRimLight.color);
    this.tvLight.intensity = (3.0 + highT * 1.8) * (0.9 + Math.sin(time * 4.1) * 0.1);

    // 5. Emergency Warning Lights (pulsing red at high heat, subtle glow on door lock always)
    const emergencyPulse = 0.5 + 0.5 * Math.sin(time * (4.5 + highT * 5.5));
    const doorBase = 1.1; // Always subtle red lock glow near front door
    this.emergencyDoorLight.intensity = doorBase + medT * 1.2 + highT * 11.0 * emergencyPulse;
    this.emergencyNorthLight.intensity = highT * 9.5 * (1.0 - emergencyPulse * 0.75);

    // 6. Kitchen light subtle fluorescent hum at medium/high heat
    const kitchenDip = h > 55 && Math.sin(time * 31.0) > 0.94 ? 0.65 : 1.0;
    this.kitchenLight.intensity = (14.0 - highT * 2.5) * kitchenDip;

    // 7. Storm / Lightning flashes outside windows at high heat (> 70)
    if (h > 70) {
      this._nextLightning -= dt;
      if (this._nextLightning <= 0) {
        this.lightningFlash = 1.0;
        this._nextLightning = 3.2 + Math.random() * 5.5;
      }
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3.6);
    }

    this.moonLight.color.copy(COLOR_MOON).lerp(COLOR_LIGHTNING, this.lightningFlash);
    this.moonLight.intensity = 0.75 + this.lightningFlash * 3.8;

    // Subtle fog tint shift
    if (this.scene.fog) {
      this._tempColor.setHex(0x130e10).lerp(new THREE.Color(0x1e090e), highT * 0.75);
      this.scene.fog.color.copy(this._tempColor);
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((obj) => {
      if (obj.isLight && obj.shadow && obj.shadow.map) {
        obj.shadow.map.dispose();
      }
    });
  }
}
