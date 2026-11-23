import * as THREE from 'three';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const MAX_INTERACT_DISTANCE = 4.2;
const CENTER_NDC = new THREE.Vector2(0, 0);
const HIGHLIGHT_COLOR = new THREE.Color(0x38bdf8);

export class InteractionSystem {
  /**
   * @param {THREE.Camera} camera
   * @param {HTMLElement} domElement
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = MAX_INTERACT_DISTANCE;

    this.interactables = [];
    this._raycastTargets = [];
    this._objectToItem = new WeakMap();

    this.currentTarget = null;
    this._savedEmissives = new Map(); // Material -> { emissive: Color, intensity: number }
    this._pulseTime = 0;

    this._bindEvents();
  }

  _bindEvents() {
    this._onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'KeyE' && gameState.phase === 'playing' && this.currentTarget) {
        e.preventDefault();
        this._triggerCurrent();
      }
    };

    this._onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (gameState.phase !== 'playing') return;
      // Left-click triggers interaction when pointer is locked and hovering an interactable
      if (document.pointerLockElement === this.domElement && this.currentTarget) {
        this._triggerCurrent();
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    if (this.domElement) {
      this.domElement.addEventListener('mousedown', this._onMouseDown);
    }
  }

  /**
   * @param {Array<{ id: string, mesh: THREE.Object3D, label: string, type: string, highlightMeshes?: THREE.Object3D[] }>} list
   */
  setInteractables(list) {
    this._clearHighlight();
    if (this.currentTarget) {
      this.currentTarget = null;
      eventBus.emit('interact:hover', null);
    }

    this.interactables = Array.isArray(list) ? list : [];
    this._raycastTargets = [];
    this._objectToItem = new WeakMap();

    for (const item of this.interactables) {
      if (!item || !item.mesh) continue;
      this._raycastTargets.push(item.mesh);
      this._objectToItem.set(item.mesh, item);
      item.mesh.traverse((child) => {
        this._objectToItem.set(child, item);
      });
      if (Array.isArray(item.highlightMeshes)) {
        for (const hm of item.highlightMeshes) {
          if (hm) {
            this._objectToItem.set(hm, item);
          }
        }
      }
    }
  }

  _triggerCurrent() {
    const target = this.currentTarget;
    if (!target) return;

    eventBus.emit('audio:sfx', { name: 'click' });
    eventBus.emit('interact:trigger', {
      id: target.id,
      label: target.label,
      type: target.type,
    });
  }

  _applyHighlight(item) {
    this._clearHighlight();
    if (!item) return;

    const meshes = [];
    if (Array.isArray(item.highlightMeshes) && item.highlightMeshes.length > 0) {
      for (const obj of item.highlightMeshes) {
        if (!obj) continue;
        if (obj.isMesh) {
          meshes.push(obj);
        } else if (typeof obj.traverse === 'function') {
          obj.traverse((child) => {
            if (child.isMesh) meshes.push(child);
          });
        }
      }
    } else if (item.mesh) {
      item.mesh.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
    }

    for (const mesh of meshes) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat || !mat.emissive || this._savedEmissives.has(mat)) continue;
        this._savedEmissives.set(mat, {
          emissive: mat.emissive.clone(),
          intensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 1,
        });
      }
    }
    this._pulseTime = 0;
  }

  _updateHighlightPulse(dt) {
    if (this._savedEmissives.size === 0) return;

    this._pulseTime += dt;
    const pulse = 0.22 + 0.14 * Math.sin(this._pulseTime * 5.2);

    for (const [mat, orig] of this._savedEmissives.entries()) {
      mat.emissive.copy(orig.emissive).lerp(HIGHLIGHT_COLOR, 0.45);
      if (typeof mat.emissiveIntensity === 'number') {
        mat.emissiveIntensity = Math.max(orig.intensity, 0.1) + pulse;
      }
    }
  }

  _clearHighlight() {
    for (const [mat, orig] of this._savedEmissives.entries()) {
      if (mat && mat.emissive) {
        mat.emissive.copy(orig.emissive);
        if (typeof mat.emissiveIntensity === 'number') {
          mat.emissiveIntensity = orig.intensity;
        }
      }
    }
    this._savedEmissives.clear();
  }

  _findItemFromHit(object) {
    let curr = object;
    while (curr) {
      const item = this._objectToItem.get(curr);
      if (item) return item;
      curr = curr.parent;
    }
    return null;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (gameState.phase !== 'playing') {
      if (this.currentTarget) {
        this._clearHighlight();
        this.currentTarget = null;
        eventBus.emit('interact:hover', null);
      }
      return;
    }

    let hitItem = null;
    if (this._raycastTargets.length > 0) {
      this.raycaster.setFromCamera(CENTER_NDC, this.camera);
      const hits = this.raycaster.intersectObjects(this._raycastTargets, true);
      for (let i = 0; i < hits.length; i++) {
        if (hits[i].distance > MAX_INTERACT_DISTANCE) break;
        const candidate = this._findItemFromHit(hits[i].object);
        if (candidate) {
          hitItem = candidate;
          break;
        }
      }
    }

    if (hitItem !== this.currentTarget) {
      this.currentTarget = hitItem;
      if (hitItem) {
        this._applyHighlight(hitItem);
        eventBus.emit('audio:sfx', { name: 'hover' });
        eventBus.emit('interact:hover', {
          id: hitItem.id,
          label: hitItem.label,
          type: hitItem.type,
        });
      } else {
        this._clearHighlight();
        eventBus.emit('interact:hover', null);
      }
    }

    if (this.currentTarget) {
      this._updateHighlightPulse(dt);
    }
  }

  dispose() {
    this._clearHighlight();
    this.currentTarget = null;
    window.removeEventListener('keydown', this._onKeyDown);
    if (this.domElement) {
      this.domElement.removeEventListener('mousedown', this._onMouseDown);
    }
  }
}
