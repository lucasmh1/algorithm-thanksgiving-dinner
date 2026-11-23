import * as THREE from 'three';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const EYE_HEIGHT = 1.65;
const SPAWN_POS = new THREE.Vector3(0, EYE_HEIGHT, 3.2);
const SPAWN_LOOK_TARGET = new THREE.Vector3(0, 1.3, -1.5);

const MOVE_SPEED = 3.2; // m/s
const ACCEL = 14.0;
const DAMPING = 10.0;
const PLAYER_RADIUS = 0.35;
const PLAYER_MIN_Y = 0.1;
const PLAYER_MAX_Y = 1.75;

const PITCH_LIMIT = Math.PI / 2 - 0.12;
const DEFAULT_SENSITIVITY = 0.0022;

// Generous fallback room bounds (allows Dining Room + East Kitchen, prevents escaping world)
const ROOM_BOUNDS = {
  minX: -5.4,
  maxX: 9.2,
  minZ: -4.4,
  maxZ: 4.4,
};

export class PlayerController {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLElement} domElement
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.camera.rotation.order = 'YXZ';

    this.position = SPAWN_POS.clone();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;

    this.sensitivity = DEFAULT_SENSITIVITY;
    this.isLocked = false;
    this._isDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;

    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };

    // Walking head-bob & footstep state
    this._bobPhase = 0;
    this._bobOffsetY = 0;
    this._bobOffsetX = 0;
    this._lastBobSin = 0;
    this._stepCooldown = 0;

    // Reusable scratch vectors
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._wishDir = new THREE.Vector3();

    this._bindEvents();
    this.resetPosition();
  }

  _bindEvents() {
    this._onKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      this._setKey(e.code, true);
    };

    this._onKeyUp = (e) => {
      this._setKey(e.code, false);
    };

    this._onWindowBlur = () => {
      this._clearKeys();
      this._isDragging = false;
    };

    this._onPointerLockChange = () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (!this.isLocked) {
        this._clearKeys();
      }
      eventBus.emit('pointerlock:changed', { locked: this.isLocked });
    };

    this._onPointerLockError = () => {
      // Gracefully fall back to mouse-drag look when pointer lock is blocked (e.g. sandboxed iframe)
      this.isLocked = false;
    };

    this._onMouseDown = (e) => {
      if (gameState.phase !== 'playing') return;

      if (e.button === 0 && !this.isLocked) {
        this.lock();
        // Also allow drag-look immediately in case pointer lock is blocked
        this._isDragging = true;
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
      } else if (e.button === 2) {
        this._isDragging = true;
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
      }
    };

    this._onMouseMove = (e) => {
      if (gameState.phase !== 'playing') return;

      let dx = 0;
      let dy = 0;

      if (this.isLocked) {
        // Clamp extreme browser pointer-lock delta spikes
        dx = THREE.MathUtils.clamp(e.movementX || 0, -120, 120);
        dy = THREE.MathUtils.clamp(e.movementY || 0, -120, 120);
      } else if (this._isDragging) {
        dx = e.clientX - this._lastMouseX;
        dy = e.clientY - this._lastMouseY;
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
      } else {
        return;
      }

      this.yaw -= dx * this.sensitivity;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - dy * this.sensitivity,
        -PITCH_LIMIT,
        PITCH_LIMIT
      );
    };

    this._onMouseUp = () => {
      this._isDragging = false;
    };

    this._onContextMenu = (e) => {
      if (gameState.phase === 'playing') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onWindowBlur);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('pointerlockerror', this._onPointerLockError);
    this.domElement.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    this.domElement.addEventListener('contextmenu', this._onContextMenu);
  }

  _setKey(code, pressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this._keys.forward = pressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this._keys.backward = pressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this._keys.left = pressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this._keys.right = pressed;
        break;
      default:
        break;
    }
  }

  _clearKeys() {
    this._keys.forward = false;
    this._keys.backward = false;
    this._keys.left = false;
    this._keys.right = false;
  }

  lock() {
    if (!this.domElement || typeof this.domElement.requestPointerLock !== 'function') {
      return;
    }
    try {
      const result = this.domElement.requestPointerLock();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          // Pointer lock rejected (e.g. not in user gesture or sandboxed iframe); drag fallback stays active.
        });
      }
    } catch {
      // Fallback to drag look
    }
  }

  unlock() {
    this._isDragging = false;
    this._clearKeys();
    if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
  }

  resetPosition() {
    this.position.copy(SPAWN_POS);
    this.velocity.set(0, 0, 0);
    this._bobPhase = 0;
    this._bobOffsetY = 0;
    this._bobOffsetX = 0;
    this._lastBobSin = 0;
    this._stepCooldown = 0;
    this._clearKeys();

    // Compute yaw & pitch looking from SPAWN_POS toward SPAWN_LOOK_TARGET
    const dx = SPAWN_LOOK_TARGET.x - SPAWN_POS.x;
    const dy = SPAWN_LOOK_TARGET.y - SPAWN_POS.y;
    const dz = SPAWN_LOOK_TARGET.z - SPAWN_POS.z;
    const horizDist = Math.hypot(dx, dz) || 1;

    this.yaw = Math.atan2(-dx, -dz);
    this.pitch = THREE.MathUtils.clamp(Math.atan2(dy, horizDist), -PITCH_LIMIT, PITCH_LIMIT);

    this._syncCamera();
  }

  /**
   * Accepts either a slider multiplier (e.g. 0.2..3.0, where 1.0 = default)
   * or a direct radians-per-pixel value (<= 0.05).
   * @param {number} val
   */
  setSensitivity(val) {
    const num = Number(val);
    if (!Number.isFinite(num) || num <= 0) return;
    if (num <= 0.05) {
      this.sensitivity = THREE.MathUtils.clamp(num, 0.0004, 0.02);
    } else {
      this.sensitivity = THREE.MathUtils.clamp(num * DEFAULT_SENSITIVITY, 0.0005, 0.012);
    }
  }

  /**
   * Check whether a candidate (x, z) collides with any Box3 collider.
   * @param {number} x
   * @param {number} z
   * @param {THREE.Box3[]} colliders
   * @returns {boolean}
   */
  _collidesAt(x, z, colliders) {
    if (
      x - PLAYER_RADIUS < ROOM_BOUNDS.minX ||
      x + PLAYER_RADIUS > ROOM_BOUNDS.maxX ||
      z - PLAYER_RADIUS < ROOM_BOUNDS.minZ ||
      z + PLAYER_RADIUS > ROOM_BOUNDS.maxZ
    ) {
      return true;
    }

    if (!colliders || colliders.length === 0) return false;

    const minX = x - PLAYER_RADIUS;
    const maxX = x + PLAYER_RADIUS;
    const minZ = z - PLAYER_RADIUS;
    const maxZ = z + PLAYER_RADIUS;

    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (!box || !box.min || !box.max) continue;

      if (
        maxX > box.min.x &&
        minX < box.max.x &&
        PLAYER_MAX_Y > box.min.y &&
        PLAYER_MIN_Y < box.max.y &&
        maxZ > box.min.z &&
        minZ < box.max.z
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {number} dt
   * @param {THREE.Box3[]} colliders
   */
  update(dt, colliders = []) {
    const clampedDt = Math.min(dt, 0.1);

    if (gameState.phase !== 'playing') {
      this.velocity.set(0, 0, 0);
      return;
    }

    // Compute horizontal wish direction from yaw
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this._wishDir.set(0, 0, 0);

    if (this._keys.forward) this._wishDir.add(this._forward);
    if (this._keys.backward) this._wishDir.sub(this._forward);
    if (this._keys.right) this._wishDir.add(this._right);
    if (this._keys.left) this._wishDir.sub(this._right);

    if (this._wishDir.lengthSq() > 0) {
      this._wishDir.normalize();
      const targetVx = this._wishDir.x * MOVE_SPEED;
      const targetVz = this._wishDir.z * MOVE_SPEED;
      const blend = 1 - Math.exp(-ACCEL * clampedDt);
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVx, blend);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVz, blend);
    } else {
      const damp = Math.exp(-DAMPING * clampedDt);
      this.velocity.x *= damp;
      this.velocity.z *= damp;
      if (Math.abs(this.velocity.x) < 0.005) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.005) this.velocity.z = 0;
    }

    // Axis-separated sliding AABB collision
    const nextX = this.position.x + this.velocity.x * clampedDt;
    if (!this._collidesAt(nextX, this.position.z, colliders)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0;
    }

    const nextZ = this.position.z + this.velocity.z * clampedDt;
    if (!this._collidesAt(this.position.x, nextZ, colliders)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }

    this.position.y = EYE_HEIGHT;

    // Gentle walking head-bob + soft footsteps
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const speedRatio = Math.min(1, horizSpeed / MOVE_SPEED);
    this._stepCooldown = Math.max(0, this._stepCooldown - clampedDt);

    if (horizSpeed > 0.25) {
      this._bobPhase += clampedDt * (6.2 + speedRatio * 3.0);
      const bobSin = Math.sin(this._bobPhase);
      const targetBobY = bobSin * 0.032 * speedRatio;
      const targetBobX = Math.cos(this._bobPhase * 0.5) * 0.014 * speedRatio;
      this._bobOffsetY = THREE.MathUtils.lerp(this._bobOffsetY, targetBobY, 1 - Math.exp(-14 * clampedDt));
      this._bobOffsetX = THREE.MathUtils.lerp(this._bobOffsetX, targetBobX, 1 - Math.exp(-14 * clampedDt));

      // Trigger subtle footstep near bottom of stride
      if (this._lastBobSin >= -0.7 && bobSin < -0.7 && this._stepCooldown <= 0) {
        this._stepCooldown = 0.38;
        eventBus.emit('audio:sfx', { name: 'step' });
      }
      this._lastBobSin = bobSin;
    } else {
      const relax = 1 - Math.exp(-10 * clampedDt);
      this._bobOffsetY = THREE.MathUtils.lerp(this._bobOffsetY, 0, relax);
      this._bobOffsetX = THREE.MathUtils.lerp(this._bobOffsetX, 0, relax);
      this._lastBobSin = 0;
    }

    this._syncCamera();
  }

  _syncCamera() {
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    this.camera.position.set(
      this.position.x + rightX * this._bobOffsetX,
      this.position.y + this._bobOffsetY,
      this.position.z + rightZ * this._bobOffsetX
    );
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  getPosition() {
    return this.position;
  }

  dispose() {
    this.unlock();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onWindowBlur);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('pointerlockerror', this._onPointerLockError);
    if (this.domElement) {
      this.domElement.removeEventListener('mousedown', this._onMouseDown);
      this.domElement.removeEventListener('contextmenu', this._onContextMenu);
    }
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
  }
}
