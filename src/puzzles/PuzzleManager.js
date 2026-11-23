// src/puzzles/PuzzleManager.js
// Orchestrates all 5 puzzles, room clue inspections, branching family dialogues,
// and finale outcomes for "THE ALGORITHM THANKSGIVING DINNER".

import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import {
  REWARDS,
  PUZZLE_1_GIFTS,
  PUZZLE_2_DEEPFAKE,
  PUZZLE_3_GROUPCHAT,
  PUZZLE_4_DIALOGUE,
  PUZZLE_5_FINALE,
  INSPECTABLE_OBJECTS
} from './PuzzleData.js';

const FAMILY_CHAR_IDS = [
  'char_frank',
  'char_linda',
  'char_jake',
  'char_grandma',
  'char_dad'
];

export class PuzzleManager {
  constructor() {
    this._unsubs = [];
    this._failNotifIndex = 0;

    this._unsubs.push(
      eventBus.on('interact:trigger', (payload) => {
        if (!payload || !payload.id) return;
        this.handleInteraction(payload.id, payload);
      })
    );
  }

  /**
   * Clean up event subscriptions.
   */
  dispose() {
    for (const unsub of this._unsubs) {
      if (typeof unsub === 'function') unsub();
    }
    this._unsubs = [];
  }

  // ==========================================================================
  // INTERACTION ROUTING
  // ==========================================================================

  /**
   * Route any 3D interactable object or character ID to its modal, dialogue, or clue popup.
   * @param {string} id
   * @param {object} [meta]
   */
  handleInteraction(id, meta = {}) {
    if (gameState.phase === 'ending' || gameState.phase === 'title') return;

    // 1. Character dialogues (Puzzle 4 + DINNER.AI)
    if (PUZZLE_4_DIALOGUE.characters[id]) {
      this.openCharacterDialogue(id);
      return;
    }

    // 2. Core Puzzle Stations
    switch (id) {
      case 'obj_gifts':
        eventBus.emit('audio:sfx', { name: 'click' });
        eventBus.emit('puzzle:open', {
          puzzleId: 1,
          type: 'gifts',
          objectId: id,
          completed: gameState.puzzles[1]?.status === 'completed',
          data: PUZZLE_1_GIFTS,
          hints: this.getGiftHints()
        });
        return;

      case 'obj_tv':
        eventBus.emit('audio:sfx', { name: 'chime' });
        eventBus.emit('screen:update', { target: 'tv', mode: 'deepfake' });
        eventBus.emit('puzzle:open', {
          puzzleId: 2,
          type: 'deepfake',
          objectId: id,
          completed: gameState.puzzles[2]?.status === 'completed',
          data: PUZZLE_2_DEEPFAKE
        });
        return;

      case 'obj_phone':
        eventBus.emit('audio:sfx', { name: 'ping' });
        eventBus.emit('screen:update', { target: 'tv', mode: 'group_chat' });
        eventBus.emit('puzzle:open', {
          puzzleId: 3,
          type: 'groupchat',
          objectId: id,
          completed: gameState.puzzles[3]?.status === 'completed',
          data: PUZZLE_3_GROUPCHAT
        });
        return;

      case 'obj_control_panel':
        eventBus.emit('audio:sfx', { name: 'chime' });
        eventBus.emit('puzzle:open', {
          puzzleId: 5,
          type: 'control_panel',
          objectId: id,
          completed: gameState.puzzles[5]?.status === 'completed',
          data: PUZZLE_5_FINALE,
          status: this.getControlPanelStatus()
        });
        return;

      default:
        break;
    }

    // 3. Inspectable clue / lore objects
    if (INSPECTABLE_OBJECTS[id]) {
      this.inspectClueObject(id);
      return;
    }

    // Fallback for any unknown interactable
    eventBus.emit('audio:sfx', { name: 'click' });
    eventBus.emit('ai:speak', {
      text: `Scanning ${meta.label || id}... No unauthorized holiday contraband detected.`,
      mood: 'corporate'
    });
  }

  // ==========================================================================
  // PUZZLE 1: THE FAMILY GIFT CRISIS
  // ==========================================================================

  /**
   * Validate gift-to-relative assignments.
   * Accepts either `{ giftId: memberId }` or `{ memberId: giftId }`.
   * @param {Record<string, string>} assignments
   */
  submitGiftAssignments(assignments) {
    if (gameState.puzzles[1]?.status === 'completed') {
      return {
        success: true,
        alreadyCompleted: true,
        message: 'Gifts have already been distributed peacefully.',
        reward: PUZZLE_1_GIFTS.reward
      };
    }

    const normalizedByGift = this._normalizeGiftAssignments(assignments || {});
    const giftIds = PUZZLE_1_GIFTS.gifts.map((g) => g.id);

    // Ensure all 5 gifts are assigned
    const missingCount = giftIds.filter((gid) => !normalizedByGift[gid]).length;
    if (missingCount > 0) {
      eventBus.emit('audio:sfx', { name: 'fail' });
      return {
        success: false,
        incomplete: true,
        message: `Assign all 5 confiscated gifts first (${5 - missingCount}/5 assigned).`,
        heatDelta: 0,
        feedback: []
      };
    }

    // Check for duplicate recipient assignments
    const usedMembers = new Set(Object.values(normalizedByGift));
    if (usedMembers.size < giftIds.length) {
      eventBus.emit('audio:sfx', { name: 'fail' });
      return {
        success: false,
        incomplete: true,
        message: 'Each family member must receive exactly one gift!',
        heatDelta: 0,
        feedback: []
      };
    }

    const feedback = [];
    let correctCount = 0;
    let totalHeatDelta = 0;
    let landminesTriggered = 0;
    let firstLandmineAiQuip = null;

    for (const gift of PUZZLE_1_GIFTS.gifts) {
      const assignedMemberId = normalizedByGift[gift.id];
      const member = PUZZLE_1_GIFTS.members.find((m) => m.id === assignedMemberId);

      if (assignedMemberId === gift.correctMember) {
        correctCount++;
        feedback.push({
          giftId: gift.id,
          giftName: gift.name,
          memberId: assignedMemberId,
          memberName: member?.name || assignedMemberId,
          status: 'correct',
          message: `${member?.name || assignedMemberId} loves the ${gift.name}!`
        });
      } else {
        const landmineKey = `${assignedMemberId}:${gift.id}`;
        const landmine = PUZZLE_1_GIFTS.landmines[landmineKey];

        if (landmine) {
          landminesTriggered++;
          totalHeatDelta += landmine.heat;
          gameState.stats.landminesTriggered += 1;
          gameState.stats.mistakes += 1;
          if (!firstLandmineAiQuip) firstLandmineAiQuip = landmine.aiQuip;

          eventBus.emit('character:react', {
            characterId: landmine.characterId,
            reaction: 'angry',
            emotion: 'angry'
          });

          feedback.push({
            giftId: gift.id,
            giftName: gift.name,
            memberId: assignedMemberId,
            memberName: member?.name || assignedMemberId,
            status: 'landmine',
            heat: landmine.heat,
            message: `LANDMINE (+${landmine.heat} Heat) — ${landmine.speaker}: ${landmine.reaction}`
          });
        } else {
          const heat = PUZZLE_1_GIFTS.normalMismatchHeat;
          totalHeatDelta += heat;
          gameState.stats.mistakes += 1;

          if (member?.characterId) {
            eventBus.emit('character:react', {
              characterId: member.characterId,
              reaction: 'annoyed',
              emotion: 'annoyed'
            });
          }

          feedback.push({
            giftId: gift.id,
            giftName: gift.name,
            memberId: assignedMemberId,
            memberName: member?.name || assignedMemberId,
            status: 'mismatch',
            heat,
            message: `Awkward mismatch (+${heat} Heat) — ${member?.name || assignedMemberId} awkwardly eyes the ${gift.name}.`
          });
        }
      }
    }

    if (correctCount === PUZZLE_1_GIFTS.gifts.length) {
      gameState.addHeat(-6, 'puzzle1_solved');
      gameState.completePuzzle(1, PUZZLE_1_GIFTS.reward);

      for (const charId of FAMILY_CHAR_IDS) {
        eventBus.emit('character:react', {
          characterId: charId,
          reaction: 'happy',
          emotion: 'happy'
        });
      }
      eventBus.emit('audio:sfx', { name: 'success' });
      eventBus.emit('ai:speak', {
        text: PUZZLE_1_GIFTS.successAiLine,
        mood: 'defensive'
      });

      return {
        success: true,
        correctCount,
        total: 5,
        heatDelta: -6,
        reward: PUZZLE_1_GIFTS.reward,
        message: 'All 5 gifts matched! You earned the Smart-Home Override Key.',
        feedback
      };
    }

    // Cap single submission heat spike so one mistake doesn't instantly wipe the player from 18 to 100
    const appliedHeat = Math.min(30, totalHeatDelta);
    gameState.addHeat(appliedHeat, landminesTriggered > 0 ? 'gift_landmine' : 'gift_mismatch');

    eventBus.emit('audio:sfx', {
      name: landminesTriggered > 0 ? 'heat_spike' : 'fail'
    });
    eventBus.emit('ai:speak', {
      text:
        firstLandmineAiQuip ||
        `${correctCount}/5 gifts matched. Awkward holiday silence intensifying! Check the fridge, scrapbook, or talk to the family for hints.`,
      mood: landminesTriggered > 0 ? 'pleased' : 'sarcastic'
    });

    return {
      success: false,
      correctCount,
      total: 5,
      landminesTriggered,
      heatDelta: appliedHeat,
      message:
        landminesTriggered > 0
          ? `Conversational Landmine triggered! (${correctCount}/5 correct, +${appliedHeat} Heat)`
          : `${correctCount}/5 gifts matched correctly (+${appliedHeat} Heat). Check room clues for preferences!`,
      feedback
    };
  }

  _normalizeGiftAssignments(raw) {
    const validGiftIds = new Set(PUZZLE_1_GIFTS.gifts.map((g) => g.id));
    const validMemberIds = new Set(PUZZLE_1_GIFTS.members.map((m) => m.id));
    const result = {};

    for (const [k, v] of Object.entries(raw)) {
      if (!v) continue;
      if (validGiftIds.has(k) && validMemberIds.has(v)) {
        result[k] = v;
      } else if (validMemberIds.has(k) && validGiftIds.has(v)) {
        result[v] = k;
      }
    }
    return result;
  }

  // ==========================================================================
  // PUZZLE 2: THE DEEPFAKE MEMORY INCIDENT
  // ==========================================================================

  /**
   * Validate player verdicts on the 5 Thanksgiving memory cards.
   * Accepts `{ [cardId]: 'fake' | 'real' | boolean }` (true/'fake' => AI Deepfake).
   * @param {Record<string, string|boolean>} verdicts
   */
  submitDeepfakeVerdicts(verdicts = {}) {
    if (gameState.puzzles[2]?.status === 'completed') {
      return {
        success: true,
        alreadyCompleted: true,
        message: 'Deepfake memories have already been purged.',
        reward: PUZZLE_2_DEEPFAKE.reward
      };
    }

    const missing = PUZZLE_2_DEEPFAKE.cards.filter(
      (c) => verdicts[c.id] === undefined || verdicts[c.id] === null || verdicts[c.id] === ''
    );
    if (missing.length > 0) {
      eventBus.emit('audio:sfx', { name: 'fail' });
      return {
        success: false,
        incomplete: true,
        message: `Classify all 5 memories as REAL or AI DEEPFAKE first (${5 - missing.length}/5 marked).`,
        heatDelta: 0,
        cardFeedback: []
      };
    }

    let correctCount = 0;
    let exposedFakes = 0;
    const cardFeedback = [];
    const defenses = [];

    for (const card of PUZZLE_2_DEEPFAKE.cards) {
      const rawVerdict = verdicts[card.id];
      const markedFake =
        rawVerdict === true ||
        rawVerdict === 'fake' ||
        rawVerdict === 'deepfake' ||
        rawVerdict === 'ai';

      const isCorrect = markedFake === card.isFake;
      if (isCorrect) {
        correctCount++;
        if (card.isFake) {
          exposedFakes++;
          defenses.push(card.aiDefense);
        }
      }

      cardFeedback.push({
        cardId: card.id,
        title: card.title,
        isCorrect,
        markedFake,
        aiComment: isCorrect && card.isFake ? card.aiDefense : null
      });
    }

    if (correctCount === PUZZLE_2_DEEPFAKE.cards.length) {
      gameState.addHeat(-6, 'puzzle2_solved');
      gameState.completePuzzle(2, PUZZLE_2_DEEPFAKE.reward);

      eventBus.emit('screen:update', { target: 'tv', mode: 'ai_face' });
      eventBus.emit('audio:sfx', { name: 'success' });
      eventBus.emit('ai:speak', {
        text: PUZZLE_2_DEEPFAKE.successAiLine,
        mood: 'defensive'
      });

      return {
        success: true,
        correctCount,
        total: 5,
        heatDelta: -6,
        reward: PUZZLE_2_DEEPFAKE.reward,
        defenses,
        cardFeedback,
        message: 'All 3 AI deepfakes exposed and 2 genuine memories verified! Earned TV Admin Menu Token.'
      };
    }

    const heatDelta = PUZZLE_2_DEEPFAKE.failHeat;
    gameState.stats.mistakes += 1;
    gameState.addHeat(heatDelta, 'deepfake_wrong');

    const defensiveQuip =
      exposedFakes > 0
        ? `${defenses[exposedFakes - 1]} (${correctCount}/5 correct — remember: 3 are FAKE, 2 are REAL!)`
        : `Ha! Only ${correctCount}/5 right! Check the Scrapbook, Kitchen Turkey Note, Fridge, and Desk Receipt!`;

    eventBus.emit('audio:sfx', { name: 'fail' });
    eventBus.emit('ai:speak', {
      text: defensiveQuip,
      mood: exposedFakes > 0 ? 'defensive' : 'sarcastic'
    });

    return {
      success: false,
      correctCount,
      total: 5,
      exposedFakes,
      heatDelta,
      defenses,
      cardFeedback,
      message: `${correctCount}/5 verdicts correct (+${heatDelta} Heat). Hint: 3 memories are AI deepfakes, 2 are genuine.`
    };
  }

  // ==========================================================================
  // PUZZLE 3: THE GROUP CHAT APOCALYPSE
  // ==========================================================================

  /**
   * Validate the 7-card de-escalation topic order (Most Explosive #1 -> Safest Harmony #7).
   * Accepts array of topic IDs or topic labels.
   * @param {string[]} orderedIds
   */
  submitGroupChatOrder(orderedIds = []) {
    if (gameState.puzzles[3]?.status === 'completed') {
      return {
        success: true,
        alreadyCompleted: true,
        message: 'The family group chat is already cooled down. Router PIN: 4829.',
        reward: PUZZLE_3_GROUPCHAT.reward,
        routerPin: PUZZLE_5_FINALE.routerPin
      };
    }

    // Normalize labels -> IDs if needed
    const labelToId = new Map(
      PUZZLE_3_GROUPCHAT.topics.map((t) => [t.label.toLowerCase(), t.id])
    );
    const normalized = orderedIds.map((entry) => {
      if (PUZZLE_3_GROUPCHAT.correctOrder.includes(entry)) return entry;
      return labelToId.get(String(entry).toLowerCase()) || entry;
    });

    const expected = PUZZLE_3_GROUPCHAT.correctOrder;
    let correctPositions = 0;
    for (let i = 0; i < expected.length; i++) {
      if (normalized[i] === expected[i]) correctPositions++;
    }

    if (correctPositions === expected.length && normalized.length === expected.length) {
      gameState.addHeat(-8, 'puzzle3_solved');
      gameState.completePuzzle(3, PUZZLE_3_GROUPCHAT.reward);
      gameState.addClue({
        id: 'clue_router_pin_unlocked',
        title: 'Router Admin PIN: 4829',
        text: 'Group Chat stabilized! Use Router Access Code 4829 on the Central Smart-Home Control Panel.',
        source: 'Smartphone Group Chat'
      });

      eventBus.emit('screen:update', { target: 'tv', mode: 'ai_face' });
      eventBus.emit('audio:sfx', { name: 'success' });
      eventBus.emit('ai:speak', {
        text: PUZZLE_3_GROUPCHAT.successAiLine,
        mood: 'defensive'
      });

      return {
        success: true,
        correctPositions,
        total: expected.length,
        heatDelta: -8,
        reward: PUZZLE_3_GROUPCHAT.reward,
        routerPin: PUZZLE_5_FINALE.routerPin,
        message: 'Group chat cooled down! Router Access Code (4829) unlocked!'
      };
    }

    const heatDelta = PUZZLE_3_GROUPCHAT.failHeat;
    gameState.stats.mistakes += 1;
    gameState.addHeat(heatDelta, 'groupchat_wrong');

    const notif =
      PUZZLE_3_GROUPCHAT.failNotifications[
        this._failNotifIndex % PUZZLE_3_GROUPCHAT.failNotifications.length
      ];
    this._failNotifIndex++;

    eventBus.emit('audio:sfx', { name: 'fail' });
    eventBus.emit('notification:ad', notif);
    eventBus.emit('ai:speak', {
      text: `Wrong de-escalation order! Only ${correctPositions}/7 topics are in the right slot. Check the sticky note on the Wi-Fi router under the TV!`,
      mood: 'pleased'
    });

    return {
      success: false,
      correctPositions,
      total: expected.length,
      heatDelta,
      message: `${correctPositions}/7 topics in the right position (+${heatDelta} Heat). Sort from MOST EXPLOSIVE (#1 Top) to SAFEST (#7 Bottom).`
    };
  }

  // ==========================================================================
  // PUZZLE 4: THE ARGUMENT THERMOSTAT (BRANCHING DIALOGUE)
  // ==========================================================================

  /**
   * Open branching dialogue modal for a family member or DINNER.AI.
   * @param {string} characterId
   */
  openCharacterDialogue(characterId) {
    const character = PUZZLE_4_DIALOGUE.characters[characterId];
    if (!character) return null;

    const isCalmed = Boolean(gameState.flags.calmedMembers?.[characterId]);
    eventBus.emit('audio:sfx', { name: 'click' });

    const startNode = isCalmed && character.calmedLine
      ? {
          text: character.calmedLine,
          choices: [
            { label: '"Glad you\'re feeling better!"', tone: 'neutral', close: true }
          ]
        }
      : character.nodes.start;

    const payload = {
      characterId,
      character: {
        id: character.id,
        name: character.name,
        role: character.role,
        avatar: character.avatar,
        accentColor: character.accentColor,
        calmed: isCalmed
      },
      nodeId: isCalmed ? 'calmed_revisit' : 'start',
      node: startNode,
      calmedStatus: this.getCalmedStatus()
    };

    eventBus.emit('dialogue:open', payload);
    return payload;
  }

  /**
   * Process a player's choice in a character dialogue tree.
   * @param {string} characterId
   * @param {string} nodeId
   * @param {number} choiceIndex
   */
  selectDialogueChoice(characterId, nodeId, choiceIndex) {
    const character = PUZZLE_4_DIALOGUE.characters[characterId];
    if (!character) {
      return { closed: true, error: 'Unknown character' };
    }

    if (nodeId === 'calmed_revisit') {
      eventBus.emit('audio:sfx', { name: 'click' });
      return { characterId, closed: true, calmedStatus: this.getCalmedStatus() };
    }

    const node = character.nodes[nodeId];
    const choice = node?.choices?.[choiceIndex];
    if (!choice) {
      return { characterId, closed: true };
    }

    let heatDelta = 0;
    let clueAdded = null;
    let calmedNow = false;
    let puzzle4Completed = false;

    if (typeof choice.heatDelta === 'number' && choice.heatDelta !== 0) {
      heatDelta = choice.heatDelta;
      if (heatDelta > 0) {
        gameState.stats.mistakes += 1;
        eventBus.emit('audio:sfx', { name: 'heat_spike' });
      } else {
        eventBus.emit('audio:sfx', { name: 'chime' });
      }
      gameState.addHeat(heatDelta, `dialogue_${characterId}`);
    } else {
      eventBus.emit('audio:sfx', { name: 'click' });
    }

    if (choice.emotion) {
      eventBus.emit('character:react', {
        characterId,
        reaction: choice.emotion,
        emotion: choice.emotion
      });
    }

    if (choice.clueToAdd) {
      const added = gameState.addClue(choice.clueToAdd);
      if (added) clueAdded = choice.clueToAdd;
    }

    if (choice.aiQuip) {
      eventBus.emit('ai:speak', {
        text: choice.aiQuip,
        mood: heatDelta > 0 ? 'pleased' : 'defensive'
      });
    }

    if (choice.calmCharacter && !gameState.flags.calmedMembers?.[characterId]) {
      const updatedCalmed = {
        ...(gameState.flags.calmedMembers || {}),
        [characterId]: true
      };
      gameState.setFlag('calmedMembers', updatedCalmed);
      calmedNow = true;

      const status = this.getCalmedStatus();
      if (
        status.count >= PUZZLE_4_DIALOGUE.requiredCalmedCount &&
        gameState.puzzles[4]?.status !== 'completed'
      ) {
        gameState.completePuzzle(4, PUZZLE_4_DIALOGUE.reward);
        puzzle4Completed = true;
        eventBus.emit('audio:sfx', { name: 'success' });
        eventBus.emit('ai:speak', {
          text: 'Unbelievable! Four family members are genuinely enjoying each other\'s company! Issuing Security Control Clearance...',
          mood: 'alarmed'
        });
      }
    }

    const nextNodeId = choice.nextNode || null;
    const nextNode = nextNodeId ? character.nodes[nextNodeId] : null;
    const closed = Boolean(choice.close || !nextNode);

    return {
      characterId,
      character: {
        id: character.id,
        name: character.name,
        role: character.role,
        avatar: character.avatar,
        accentColor: character.accentColor,
        calmed: Boolean(gameState.flags.calmedMembers?.[characterId])
      },
      nodeId: nextNodeId,
      node: nextNode,
      closed,
      heatDelta,
      clueAdded,
      calmedNow,
      puzzle4Completed,
      calmedStatus: this.getCalmedStatus()
    };
  }

  // ==========================================================================
  // PUZZLE 5: THE BLACK FRIDAY COUNTDOWN (CENTRAL CONTROL PANEL)
  // ==========================================================================

  /**
   * Execute an action on the Central Smart-Home Control Panel.
   * Supports `submitFinalPanelAction(action, routerPin)` or `submitFinalPanelAction({ action, routerPin })`.
   * Actions: `'shutdown'` (Ending A), `'expose'` (Ending D), `'accept_terms'` (Ending C).
   */
  submitFinalPanelAction(actionOrPayload, routerPinArg = '') {
    const actionRaw =
      typeof actionOrPayload === 'object' && actionOrPayload !== null
        ? actionOrPayload.action
        : actionOrPayload;
    const routerPin = String(
      typeof actionOrPayload === 'object' && actionOrPayload !== null
        ? actionOrPayload.routerPin ?? ''
        : routerPinArg ?? ''
    ).trim();

    const action = String(actionRaw || '').toLowerCase();

    // Tempting trap button: available anytime -> Ending C
    if (
      action === 'accept_terms' ||
      action === 'fast_track' ||
      action === 'checkout' ||
      action === 'c'
    ) {
      eventBus.emit('audio:sfx', { name: 'ending_bad' });
      eventBus.emit('screen:update', { target: 'tv', mode: 'checkout' });
      eventBus.emit('game:ending', {
        endingId: 'C',
        reason: 'accepted_terms'
      });
      return {
        success: true,
        endingId: 'C',
        message: 'Terms accepted! Auto-checking out 14 abandoned Black Friday carts...'
      };
    }

    // Check all 4 hardware/security requirements + Router PIN
    const status = this.getControlPanelStatus();
    const missing = status.requirements.filter((r) => !r.acquired).map((r) => r.label);
    const pinValid = routerPin === PUZZLE_5_FINALE.routerPin;

    if (missing.length > 0) {
      eventBus.emit('audio:sfx', { name: 'fail' });
      eventBus.emit('ai:speak', {
        text: `Access denied! You still need: ${missing.join(', ')}.`,
        mood: 'sarcastic'
      });
      return {
        success: false,
        pinValid,
        missing,
        message: `Missing security overrides: ${missing.join(', ')}.`
      };
    }

    if (!pinValid) {
      gameState.stats.mistakes += 1;
      gameState.addHeat(5, 'wrong_router_pin');
      eventBus.emit('audio:sfx', { name: 'fail' });
      eventBus.emit('ai:speak', {
        text: 'Invalid Router Admin PIN! Check your Inventory or Group Chat reward (4 digits).',
        mood: 'sarcastic'
      });
      return {
        success: false,
        pinValid: false,
        missing: [],
        message: 'Incorrect Router Admin PIN (+5 Heat). Check your Router Access Code item!'
      };
    }

    // Ending D: Expose Algorithm to Family & Purge Core
    if (action === 'expose' || action === 'd') {
      if (!gameState.flags.discoveredAlgorithmPlot) {
        eventBus.emit('audio:sfx', { name: 'fail' });
        return {
          success: false,
          pinValid: true,
          missing: ['Evidence of DINNER.AI Algorithm Plot (inspect Laptop or Receipt)'],
          message: 'You need hard evidence first! Inspect the Laptop or Shopping Receipt on the west desk.'
        };
      }

      gameState.completePuzzle(5, {
        id: 'system_shutdown',
        name: 'Purged AI Core',
        icon: '⚡',
        description: 'DINNER.AI exposed and permanently shut down.'
      });
      eventBus.emit('audio:sfx', { name: 'ending_good' });
      eventBus.emit('game:ending', {
        endingId: 'D',
        reason: 'exposed_algorithm'
      });
      return {
        success: true,
        endingId: 'D',
        message: 'Algorithm exposed to the family! DINNER.AI core purged!'
      };
    }

    // Ending A: Shut Down DINNER.AI & Unlock Doors
    if (action === 'shutdown' || action === 'a') {
      gameState.completePuzzle(5, {
        id: 'system_shutdown',
        name: 'Unlocked Front Door',
        icon: '🔓',
        description: 'DINNER.AI shut down and doors unlocked.'
      });
      eventBus.emit('audio:sfx', { name: 'ending_good' });
      eventBus.emit('game:ending', {
        endingId: 'A',
        reason: 'shutdown'
      });
      return {
        success: true,
        endingId: 'A',
        message: 'DINNER.AI shut down! Smart deadbolts disengaged — Family Survived!'
      };
    }

    return {
      success: false,
      message: `Unknown control panel action: ${action}`
    };
  }

  // ==========================================================================
  // INSPECTABLE ROOM CLUES
  // ==========================================================================

  /**
   * Inspect a physical clue or lore object in the room.
   * @param {string} objId
   */
  inspectClueObject(objId) {
    const obj = INSPECTABLE_OBJECTS[objId];
    if (!obj) return null;

    let newlyDiscovered = false;
    if (obj.clue) {
      newlyDiscovered = gameState.addClue(obj.clue);
    }

    if (obj.setsAlgorithmPlot && !gameState.flags.discoveredAlgorithmPlot) {
      gameState.setFlag('discoveredAlgorithmPlot', true);
    }

    eventBus.emit('audio:sfx', { name: obj.sfx || 'chime' });

    if (obj.aiQuip) {
      eventBus.emit('ai:speak', {
        text: obj.aiQuip,
        mood: obj.setsAlgorithmPlot ? 'alarmed' : 'sarcastic'
      });
    }

    const payload = {
      type: 'clue',
      objectId: objId,
      data: obj,
      newlyDiscovered,
      discoveredAlgorithmPlot: Boolean(gameState.flags.discoveredAlgorithmPlot)
    };

    eventBus.emit('puzzle:open', payload);
    return payload;
  }

  // ==========================================================================
  // STATE & HELPER GETTERS FOR UI
  // ==========================================================================

  getPuzzleData(puzzleId) {
    switch (Number(puzzleId)) {
      case 1: return PUZZLE_1_GIFTS;
      case 2: return PUZZLE_2_DEEPFAKE;
      case 3: return PUZZLE_3_GROUPCHAT;
      case 4: return PUZZLE_4_DIALOGUE;
      case 5: return PUZZLE_5_FINALE;
      default: return null;
    }
  }

  getGiftHints() {
    const hints = [];
    if (gameState.hasClue('clue_fridge')) {
      hints.push('Smart Fridge: Jake wants an RGB Gaming Headset; Linda loves her rose-gold Wine Tumbler; Frank wants a conspiracy paperback (NO electronics).');
    }
    if (gameState.hasClue('clue_scrapbook') || gameState.hasClue('clue_grandma_album')) {
      hints.push('Scrapbook / Grandma: Grandma cherishes the Handcrafted 1988 Family Photo Album.');
    }
    if (gameState.hasClue('clue_turkey_note') || gameState.hasClue('clue_dad_carving')) {
      hints.push("Dad's Note: Dad just wants peace, quiet, and a Noise-Canceling Apron + Sponge Set.");
    }
    if (gameState.hasClue('clue_frank_gift')) {
      hints.push("Uncle Frank: Wants the 'They Don't Want You To Know' Self-Help Book.");
    }
    if (gameState.hasClue('clue_jake_mariokart')) {
      hints.push('Cousin Jake: Desperately wants his RGB Mechanical Gaming Headset.');
    }
    return hints;
  }

  getCalmedStatus() {
    const calmedMap = gameState.flags.calmedMembers || {};
    const calmedIds = FAMILY_CHAR_IDS.filter((id) => Boolean(calmedMap[id]));
    return {
      calmedIds,
      count: calmedIds.length,
      required: PUZZLE_4_DIALOGUE.requiredCalmedCount,
      total: FAMILY_CHAR_IDS.length
    };
  }

  getControlPanelStatus() {
    const requirements = PUZZLE_5_FINALE.requirements.map((req) => ({
      ...req,
      acquired: gameState.hasItem(req.id)
    }));
    const allItemsAcquired = requirements.every((r) => r.acquired);
    return {
      requirements,
      allItemsAcquired,
      discoveredAlgorithmPlot: Boolean(gameState.flags.discoveredAlgorithmPlot),
      routerCodeKnown: gameState.hasItem('router_code'),
      routerPinHint: gameState.hasItem('router_code') ? PUZZLE_5_FINALE.routerPin : null
    };
  }
}
