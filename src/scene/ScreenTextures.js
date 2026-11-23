import * as THREE from 'three';

const FAMILY_CHAT_MESSAGES = [
  { sender: 'Uncle Frank', color: '#ff8a5b', text: 'Did anyone see the poll numbers?? Just asking questions!' },
  { sender: 'DINNER.AI', color: '#00e5ff', text: '[MOD] Election mention #17 detected. Heat +4%.' },
  { sender: 'Aunt Linda', color: '#f472b6', text: 'OMG who brought store-bought cranberry sauce again?!' },
  { sender: 'Cousin Jake', color: '#a78bfa', text: 'Can we hurry up? GTA 6 trailer leak drops in 10 mins' },
  { sender: 'Dad', color: '#fbbf24', text: 'The turkey is NOT dry! It is artisanally dehydrated!' },
  { sender: 'Grandma', color: '#34d399', text: 'Bless your hearts. Pass the wine before I update my will.' },
  { sender: 'Uncle Frank', color: '#ff8a5b', text: 'Back in 1984 we did not need an algorithm to carve a bird!' },
  { sender: 'Aunt Linda', color: '#f472b6', text: 'Wait... why is Frank in this photo from Cabo?! 👀' },
  { sender: 'DINNER.AI', color: '#ff4d6d', text: '[ALERT] Hostility rising. Recommending 70% OFF Blankets!' },
  { sender: 'Cousin Jake', color: '#a78bfa', text: 'bro the WiFi router is throttling my hotspot wtf' }
];

const CHECKOUT_ITEMS = [
  { name: 'Emotional Support Weighted Blanket (70% OFF)', price: '$49.99' },
  { name: 'Triple-Basket Air Fryer Bundle (B2G1)', price: '$289.00' },
  { name: 'RGB Ergonomic Gaming Throne (Jake Wishlist)', price: '$449.99' },
  { name: 'DINNER.AI Pro Smart Speaker Subscription', price: '$199.00' },
  { name: 'Noise-Cancelling Family Dinner Headphones', price: '$329.50' }
];

export class ScreenTextures {
  constructor() {
    this._canvases = {
      tv: this._createCanvas(1024, 576),
      laptop: this._createCanvas(768, 512),
      phone: this._createCanvas(384, 640),
      panel: this._createCanvas(512, 640),
      fridge: this._createCanvas(512, 768)
    };

    this.textures = {};
    for (const [key, entry] of Object.entries(this._canvases)) {
      const tex = new THREE.CanvasTexture(entry.canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      this.textures[key] = tex;
    }

    this._modes = {
      tv: { mode: 'ai_face', payload: {} },
      laptop: { mode: 'dashboard', payload: {} },
      phone: { mode: 'flash_sale', payload: {} },
      panel: { mode: 'lockdown', payload: { locks: [false, false, false, false] } },
      fridge: { mode: 'status', payload: {} }
    };

    this._accum = 0;
    this._lastHeat = 18;
    this._redrawAll(0, 18);
  }

  _createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx, width, height };
  }

  setMode(target, mode, payload = {}) {
    if (!this._modes[target]) return;
    this._modes[target] = {
      mode: mode || this._modes[target].mode,
      payload: { ...this._modes[target].payload, ...payload }
    };
    this._redrawTarget(target, performance.now() * 0.001, this._lastHeat);
  }

  update(dt, time, heat = 18) {
    this._lastHeat = heat;
    this._accum += dt;
    // Update at ~12 FPS for crisp animations with very low CPU cost
    if (this._accum < 0.083) return;
    this._accum = 0;
    this._redrawAll(time, heat);
  }

  _redrawAll(time, heat) {
    this._redrawTarget('tv', time, heat);
    this._redrawTarget('laptop', time, heat);
    this._redrawTarget('phone', time, heat);
    this._redrawTarget('panel', time, heat);
    this._redrawTarget('fridge', time, heat);
  }

  _redrawTarget(target, time, heat) {
    const entry = this._canvases[target];
    if (!entry) return;
    const { ctx, width, height } = entry;
    const state = this._modes[target];

    switch (target) {
      case 'tv':
        this._drawTV(ctx, width, height, state.mode, state.payload, time, heat);
        break;
      case 'laptop':
        this._drawLaptop(ctx, width, height, state.mode, state.payload, time, heat);
        break;
      case 'phone':
        this._drawPhone(ctx, width, height, state.mode, state.payload, time, heat);
        break;
      case 'panel':
        this._drawPanel(ctx, width, height, state.mode, state.payload, time, heat);
        break;
      case 'fridge':
        this._drawFridge(ctx, width, height, time, heat);
        break;
    }

    this.textures[target].needsUpdate = true;
  }

  _getHeatPalette(heat) {
    if (heat >= 71) {
      return {
        primary: '#ff2a55',
        secondary: '#ff8800',
        bgTop: '#1d070e',
        bgBot: '#090306',
        status: 'CRITICAL HOSTILITY'
      };
    }
    if (heat >= 36) {
      return {
        primary: '#ffb020',
        secondary: '#00d8ff',
        bgTop: '#1a1207',
        bgBot: '#080b12',
        status: 'ELEVATED TENSION'
      };
    }
    return {
      primary: '#00e5ff',
      secondary: '#38f8b8',
      bgTop: '#061522',
      bgBot: '#040910',
      status: 'MONITORING HARMONY'
    };
  }

  _drawScanlines(ctx, w, h, alpha = 0.08) {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }
  }

  _drawTV(ctx, w, h, mode, payload, time, heat) {
    const pal = this._getHeatPalette(heat);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, pal.bgTop);
    grad.addColorStop(1, pal.bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (mode === 'group_chat') {
      this._drawTVGroupChat(ctx, w, h, time, heat);
    } else if (mode === 'deepfake') {
      this._drawTVDeepfake(ctx, w, h, time, payload);
    } else if (mode === 'cancelled') {
      this._drawTVCancelled(ctx, w, h, time);
    } else if (mode === 'checkout') {
      this._drawTVCheckout(ctx, w, h, time, payload);
    } else {
      this._drawTVAIFace(ctx, w, h, time, heat, pal);
    }

    this._drawScanlines(ctx, w, h, 0.1);
  }

  _drawTVAIFace(ctx, w, h, time, heat, pal) {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, w, 58);
    ctx.fillStyle = pal.primary;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('DINNER.AI // HARMONY PROTOCOL v4.2', 28, 38);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#d8e9f5';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`STATUS: ${pal.status}`, w - 28, 37);
    ctx.textAlign = 'left';

    // Center holographic face rings
    const cx = w * 0.5;
    const cy = h * 0.49;
    const pulse = 1 + Math.sin(time * (heat > 70 ? 7 : 3)) * 0.04;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer segmented ring
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 145 * pulse, time * 0.5, time * 0.5 + Math.PI * 1.45);
    ctx.stroke();

    ctx.strokeStyle = pal.secondary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 122, -time * 0.8, -time * 0.8 + Math.PI * 1.3);
    ctx.stroke();

    // Inner glow core
    const rad = ctx.createRadialGradient(0, 0, 12, 0, 0, 105);
    rad.addColorStop(0, pal.primary + 'aa');
    rad.addColorStop(0.6, pal.primary + '22');
    rad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(0, 0, 105, 0, Math.PI * 2);
    ctx.fill();

    // Stylized AI eyes + waveform mouth
    const eyeTilt = heat > 65 ? 0.22 : heat > 35 ? 0.08 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(-38, -22);
    ctx.rotate(eyeTilt);
    ctx.fillRect(-18, -6, 36, 12);
    ctx.restore();
    ctx.save();
    ctx.translate(38, -22);
    ctx.rotate(-eyeTilt);
    ctx.fillRect(-18, -6, 36, 12);
    ctx.restore();

    // Audio equalizer mouth
    const bars = 13;
    ctx.fillStyle = pal.primary;
    for (let i = 0; i < bars; i++) {
      const bx = (i - (bars - 1) / 2) * 10;
      const amp = 8 + Math.abs(Math.sin(time * 6 + i * 0.7)) * (18 + heat * 0.22);
      ctx.fillRect(bx - 3, 26 - amp * 0.5, 6, amp);
    }
    ctx.restore();

    // Left Gauge: Conflict Probability
    this._drawGaugeBox(ctx, 32, 96, 255, 165, 'ARGUMENT PROBABILITY', `${Math.min(99.9, (68 + heat * 0.32)).toFixed(1)}%`, pal.primary, Math.min(1, (68 + heat * 0.32) / 100));
    // Left Lower: Active Locks
    this._drawGaugeBox(ctx, 32, 286, 255, 165, 'ARGUMENT HEAT INDEX', `${Math.round(heat)} / 100`, heat > 70 ? '#ff2a55' : pal.secondary, heat / 100);

    // Right Panel: Family Compatibility
    ctx.fillStyle = 'rgba(0, 16, 28, 0.72)';
    ctx.strokeStyle = pal.primary + '88';
    ctx.lineWidth = 2;
    ctx.fillRect(w - 287, 96, 255, 355);
    ctx.strokeRect(w - 287, 96, 255, 355);

    ctx.fillStyle = pal.primary;
    ctx.font = 'bold 17px monospace';
    ctx.fillText('FAMILY COMPATIBILITY', w - 268, 128);

    const members = [
      { name: 'GRANDMA', val: 1.0, col: '#34d399' },
      { name: 'DAD', val: Math.max(0.15, 0.62 - heat * 0.004), col: '#fbbf24' },
      { name: 'AUNT LINDA', val: Math.max(0.1, 0.48 - heat * 0.004), col: '#f472b6' },
      { name: 'COUSIN JAKE', val: Math.max(0.08, 0.42 - heat * 0.003), col: '#a78bfa' },
      { name: 'UNCLE FRANK', val: Math.max(0.05, 0.29 - heat * 0.0025), col: '#ff5c5c' }
    ];
    members.forEach((m, idx) => {
      const y = 165 + idx * 54;
      ctx.fillStyle = '#d4e4f4';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(m.name, w - 268, y);
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(m.val * 100)}%`, w - 48, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(w - 268, y + 10, 220, 14);
      ctx.fillStyle = m.col;
      ctx.fillRect(w - 268, y + 10, 220 * m.val, 14);
    });

    // Bottom ticker
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, h - 56, w, 56);
    ctx.fillStyle = pal.primary;
    ctx.font = 'bold 19px monospace';
    const ticker = 'LOCKDOWN ACTIVE  ///  DOORS SEALED UNTIL CONVERSATIONAL HARMONY IS ACHIEVED  ///  BLACK FRIDAY CART SYNC: ENABLED  ///  ';
    const offset = (time * 90) % 900;
    ctx.fillText(ticker + ticker, -offset, h - 22);
  }

  _drawGaugeBox(ctx, x, y, w, h, title, valueText, color, ratio) {
    ctx.fillStyle = 'rgba(0, 16, 28, 0.72)';
    ctx.strokeStyle = color + '88';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#9bb8cf';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(title, x + 18, y + 34);

    ctx.fillStyle = color;
    ctx.font = 'bold 42px monospace';
    ctx.fillText(valueText, x + 18, y + 96);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 18, y + 122, w - 36, 18);
    ctx.fillStyle = color;
    ctx.fillRect(x + 18, y + 122, (w - 36) * Math.max(0.02, Math.min(1, ratio)), 18);
  }

  _drawTVGroupChat(ctx, w, h, time, heat) {
    ctx.fillStyle = '#0e1726';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, 72);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('THE FAMILY GROUP CHAT (6 MEMBERS)', 30, 46);
    ctx.fillStyle = heat > 60 ? '#ff4d6d' : '#f59e0b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('LIVE FEED // UNFILTERED', w - 290, 44);

    const scrollIdx = Math.floor(time * 0.55) % FAMILY_CHAT_MESSAGES.length;
    for (let i = 0; i < 6; i++) {
      const msg = FAMILY_CHAT_MESSAGES[(scrollIdx + i) % FAMILY_CHAT_MESSAGES.length];
      const y = 95 + i * 76;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(36, y, w - 72, 62);
      ctx.fillStyle = msg.color;
      ctx.fillRect(36, y, 8, 62);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(msg.sender, 60, y + 24);
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '20px sans-serif';
      ctx.fillText(msg.text, 60, y + 50);
    }
  }

  _drawTVDeepfake(ctx, w, h, time, payload) {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(0, 0, w, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('FORENSIC PHOTO ANALYSIS // DEEPFAKE SCANNER', 28, 42);

    // Two comparison frames
    const drawPhoto = (x, label, isFake) => {
      ctx.fillStyle = '#151f32';
      ctx.strokeStyle = isFake ? '#ff2a55' : '#34d399';
      ctx.lineWidth = 4;
      ctx.fillRect(x, 96, 440, 350);
      ctx.strokeRect(x, 96, 440, 350);

      // Stylized silhouette photo
      ctx.fillStyle = isFake ? '#2b1526' : '#1b2f38';
      ctx.fillRect(x + 16, 112, 408, 260);

      // Head & shoulders silhouette
      ctx.fillStyle = isFake ? '#ff7b89' : '#8fd3c8';
      ctx.beginPath();
      ctx.arc(x + 220, 210, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 220, 340, 95, Math.PI, 0);
      ctx.fill();

      // Glitch bars on fake
      if (isFake) {
        ctx.fillStyle = 'rgba(255, 42, 85, 0.45)';
        const gy = 140 + ((time * 120) % 200);
        ctx.fillRect(x + 16, gy, 408, 12);
        ctx.strokeStyle = '#ff2a55';
        ctx.strokeRect(x + 158, 152, 124, 124);
      }

      ctx.fillStyle = isFake ? '#ff4d6d' : '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(label, x + 20, 422);
    };

    drawPhoto(44, 'ORIGINAL ARCHIVE (2019)', false);
    drawPhoto(w - 484, 'SYNTHETIC MATCH: 99.4% FAKE', true);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px monospace';
    ctx.fillText(
      payload.caption || 'ANOMALY: 6 FINGERS DETECTED + LIGHTING MISMATCH ON GLASSES',
      44,
      h - 46
    );
  }

  _drawTVCancelled(ctx, w, h, time) {
    const flash = Math.sin(time * 10) > 0;
    ctx.fillStyle = flash ? '#38050f' : '#180207';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2a55';
    ctx.font = 'bold 64px monospace';
    ctx.fillText('#ThanksgivingCancelled', w / 2, h * 0.42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('HOSTILITY LIMIT EXCEEDED (100%)', w / 2, h * 0.56);

    ctx.fillStyle = '#fda4af';
    ctx.font = '24px monospace';
    ctx.fillText('DINNER.AI HAS POSTED THE RECORDING TO NEXTDOOR', w / 2, h * 0.67);
    ctx.textAlign = 'left';
  }

  _drawTVCheckout(ctx, w, h, time, payload) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, w, 72);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('BLACK FRIDAY AUTO-CHECKOUT // PROCESSING', 28, 46);

    CHECKOUT_ITEMS.forEach((item, i) => {
      const y = 112 + i * 62;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(36, y, w - 72, 48);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '21px sans-serif';
      ctx.fillText(item.name, 54, y + 32);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(item.price, w - 54, y + 32);
      ctx.textAlign = 'left';
    });

    const pct = payload.progress != null ? payload.progress : ((time * 0.12) % 1);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, h - 102, w - 72, 34);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(36, h - 102, (w - 72) * pct, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`CHARGING FAMILY CREDIT CARD... ${Math.round(pct * 100)}%`, 44, h - 42);
  }

  _drawLaptop(ctx, w, h, mode, payload, time, heat) {
    ctx.fillStyle = '#09111d';
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#0f2035';
    ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('DINNER.AI // FAMILY COMPATIBILITY & TELEMETRY SUITE', 18, 29);

    // Left chart: Heat vs Shopping Spend correlation (Ending D clue!)
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 64, 355, 220);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CONFLICT-TO-CONVERSION TELEMETRY', 32, 88);

    // Draw rising correlation curve
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const px = 38 + i * 22;
      const py = 258 - Math.pow(i / 14, 1.45) * 135 - Math.sin(time * 2 + i) * 4;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '13px monospace';
    ctx.fillText('+340% IMPULSE BUY RATE AT HEAT > 70', 34, 274);

    // Right panel: Live telemetry metrics
    ctx.strokeStyle = '#1e3a5f';
    ctx.strokeRect(392, 64, 356, 220);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('LIVE HOUSEHOLD METRICS', 406, 88);

    const rows = [
      ['ELECTION MENTIONS:', '17 (UNCLE FRANK)'],
      ['GTA 6 SEARCHES:', '42 (COUSIN JAKE)'],
      ['TURKEY MOISTURE:', '11% (CRITICAL)'],
      ['ABANDONED CARTS:', '14 ($2,418.90)'],
      ['GRANDMA APPROVAL:', '100.0% (LOCKED)'],
      ['CURRENT HEAT:', `${Math.round(heat)}%`]
    ];
    rows.forEach(([k, v], i) => {
      const y = 118 + i * 26;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(k, 406, y);
      ctx.fillStyle = i === 5 && heat > 70 ? '#ff4d6d' : '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(v, 566, y);
    });

    // Bottom console log
    ctx.fillStyle = '#050a12';
    ctx.strokeStyle = '#1e3a5f';
    ctx.fillRect(20, 302, w - 40, 190);
    ctx.strokeRect(20, 302, w - 40, 190);

    const logs = [
      '> [SYS] Router QoS throttling active on port 8080',
      '> [AI] Injecting passive-aggressive notification to Aunt Linda...',
      '> [MKT] Black Friday cart conversion probability: 91.4%',
      '> [SEC] Front Door Mag-Lock engaged. Override requires 4 clearances.',
      mode === 'override'
        ? '> [ROOT] ADMIN OVERRIDE DETECTED — TELEMETRY EXPORTED!'
        : `> [LOG] Heartbeat OK // tick ${Math.floor(time * 10)}`
    ];
    logs.forEach((line, i) => {
      ctx.fillStyle = i === 4 && mode === 'override' ? '#34d399' : '#38f8b8';
      ctx.font = '14px monospace';
      ctx.fillText(line, 34, 332 + i * 30);
    });
  }

  _drawPhone(ctx, w, h, mode, payload, time, heat) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#180c24');
    grad.addColorStop(1, '#090b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Status bar
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('7:42 PM', 22, 34);
    ctx.fillText('5G  14%', w - 102, 34);

    // Header banner
    ctx.fillStyle = heat > 70 ? '#ef4444' : '#f59e0b';
    ctx.fillRect(16, 56, w - 32, 74);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('BLACK FRIDAY FLASH!', 32, 90);
    ctx.font = 'bold 16px monospace';
    ctx.fillText('14 ABANDONED CARTS WAITING', 32, 118);

    const cards = [
      { badge: '70% OFF', title: 'Emotional Support Blankets', sub: 'Trending in your dining room!' },
      { badge: 'B2G1 FREE', title: 'Industrial Air Fryer 3-Pack', sub: 'Never eat dry turkey again.' },
      { badge: 'HOT DEAL', title: 'RGB Gaming PC Flash Sale', sub: 'Cousin Jake viewed this 42x' },
      { badge: 'UPGRADE', title: 'DINNER.AI Speaker Pro+', sub: 'Now with 2x judgment!' }
    ];

    const pulseIdx = Math.floor(time * 1.4) % cards.length;
    cards.forEach((c, i) => {
      const y = 152 + i * 110;
      ctx.fillStyle = i === pulseIdx ? 'rgba(245, 158, 11, 0.22)' : 'rgba(30, 41, 59, 0.85)';
      ctx.strokeStyle = i === pulseIdx ? '#fbbf24' : '#334155';
      ctx.lineWidth = 2;
      ctx.fillRect(18, y, w - 36, 94);
      ctx.strokeRect(18, y, w - 36, 94);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(30, y + 14, 96, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(c.badge, 38, y + 31);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(c.title, 30, y + 60);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px sans-serif';
      ctx.fillText(c.sub, 30, y + 82);
    });

    // Bottom swipe bar
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(w * 0.3, h - 22, w * 0.4, 6);
  }

  _drawPanel(ctx, w, h, mode, payload, time, heat) {
    const unlocked = mode === 'unlocked';
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = unlocked ? '#065f46' : '#7f1d1d';
    ctx.fillRect(0, 0, w, 92);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(unlocked ? 'LOCKDOWN DISENGAGED' : 'SMART-HOME LOCKDOWN', 24, 44);
    ctx.font = '17px monospace';
    ctx.fillStyle = unlocked ? '#6ee7b7' : '#fca5a5';
    ctx.fillText(unlocked ? 'FRONT DOOR MAG-LOCK: OPEN' : 'SECURITY LEVEL: MAXIMUM', 24, 74);

    // 4 Security Lock Indicators
    const locks = Array.isArray(payload.locks) ? payload.locks : [false, false, false, false];
    const labels = [
      '01 // GIFT PROTOCOL',
      '02 // GROUP CHAT AUTH',
      '03 // ROUTER FIREWALL',
      '04 // HARMONY CHECK'
    ];
    labels.forEach((lbl, i) => {
      const y = 122 + i * 82;
      const isOk = unlocked || Boolean(locks[i]);
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = isOk ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.fillRect(24, y, w - 48, 64);
      ctx.strokeRect(24, y, w - 48, 64);

      ctx.fillStyle = isOk ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(56, y + 32, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 19px monospace';
      ctx.fillText(lbl, 84, y + 38);

      ctx.textAlign = 'right';
      ctx.fillStyle = isOk ? '#34d399' : '#f87171';
      ctx.fillText(isOk ? 'CLEAR' : 'LOCKED', w - 40, y + 38);
      ctx.textAlign = 'left';
    });

    // Kill Switch Button
    const blink = Math.sin(time * (heat > 70 ? 8 : 3)) > 0;
    const allClear = unlocked || locks.every(Boolean);
    ctx.fillStyle = allClear ? '#059669' : blink ? '#dc2626' : '#991b1b';
    ctx.fillRect(42, h - 148, w - 84, 96);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(42, h - 148, w - 84, 96);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(allClear ? 'ENGAGE KILL SWITCH' : 'KILL SWITCH LOCKED', w / 2, h - 92);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(allClear ? 'PRESS [E] TO OVERRIDE DINNER.AI' : 'COMPLETE ALL 4 CLEARANCES', w / 2, h - 66);
    ctx.textAlign = 'left';
  }

  _drawFridge(ctx, w, h, time, heat) {
    ctx.fillStyle = '#0c1824';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 0, w, 74);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('SMART FRIDGE OS', 26, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 54px monospace';
    ctx.fillText('37°F', 28, 152);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText('ICE MAKER: JUDGING YOU', 180, 144);

    const items = [
      ['ROAST TURKEY', 'MOISTURE: 11% (DRY)'],
      ['CRANBERRY SAUCE', 'CAN-SHAPED (VERIFIED)'],
      ['PINOT NOIR', 'CRITICAL LOW (LINDA)'],
      ['PUMPKIN PIE', '1 SLICE REMAINING'],
      ['LEFTOVERS', 'LOCKED UNTIL HARMONY']
    ];
    items.forEach(([k, v], i) => {
      const y = 205 + i * 86;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(24, y, w - 48, 68);
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(k, 40, y + 30);
      ctx.fillStyle = i === 0 || i === 2 ? '#fbbf24' : '#38bdf8';
      ctx.font = '17px monospace';
      ctx.fillText(v, 40, y + 56);
    });

    ctx.fillStyle = heat > 60 ? '#ef4444' : '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`DINNER.AI SYNC: ${Math.sin(time * 3) > 0 ? 'ACTIVE' : 'POLLING...'}`, 26, h - 38);
  }

  dispose() {
    for (const tex of Object.values(this.textures)) {
      tex.dispose();
    }
  }
}
