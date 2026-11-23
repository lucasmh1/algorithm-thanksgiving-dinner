// src/puzzles/PuzzleData.js
// Complete data definitions for all 5 puzzles, branching family dialogues,
// and inspectable room clue objects for "THE ALGORITHM THANKSGIVING DINNER".

export const REWARDS = {
  override_key: {
    id: 'override_key',
    name: 'Smart-Home Override Key',
    icon: '🔑',
    description: 'Unlocks manual hardware override on DINNER.AI.'
  },
  tv_admin_access: {
    id: 'tv_admin_access',
    name: 'TV Admin Menu Token',
    icon: '📺',
    description: 'Grants hidden administration access on the Smart TV.'
  },
  router_code: {
    id: 'router_code',
    name: 'Router Access Code (4829)',
    icon: '📡',
    description: 'Admin PIN 4829 for the home network router.'
  },
  security_controls: {
    id: 'security_controls',
    name: 'Security Control Clearance',
    icon: '🛡️',
    description: 'Unlocks the house central security control panel.'
  }
};

// ============================================================================
// PUZZLE 1: THE FAMILY GIFT CRISIS (obj_gifts)
// ============================================================================
export const PUZZLE_1_GIFTS = {
  id: 1,
  title: 'The Family Gift Crisis',
  subtitle: 'DINNER.AI confiscated 5 holiday gifts to "optimize sentiment." Assign each gift to the right relative without triggering a Conversational Landmine.',
  reward: REWARDS.override_key,
  members: [
    {
      id: 'frank',
      characterId: 'char_frank',
      name: 'Uncle Frank',
      icon: '🧔',
      vibe: 'Suspicious of Big Tech & 5G',
      hintClueId: 'clue_fridge'
    },
    {
      id: 'linda',
      characterId: 'char_linda',
      name: 'Aunt Linda',
      icon: '💅',
      vibe: 'Wine club captain & group-chat reporter',
      hintClueId: 'clue_fridge'
    },
    {
      id: 'jake',
      characterId: 'char_jake',
      name: 'Cousin Jake',
      icon: '🎮',
      vibe: 'Obsessed with GTA 6 & ranked lobbies',
      hintClueId: 'clue_fridge'
    },
    {
      id: 'grandma',
      characterId: 'char_grandma',
      name: 'Grandma',
      icon: '👵',
      vibe: 'Keeper of 1988 memories & Mario Kart champ',
      hintClueId: 'clue_scrapbook'
    },
    {
      id: 'dad',
      characterId: 'char_dad',
      name: 'Dad',
      icon: '👨‍🍳',
      vibe: 'Exhausted turkey carver craving silence',
      hintClueId: 'clue_turkey_note'
    }
  ],
  gifts: [
    {
      id: 'gift_headset',
      name: 'RGB Mechanical Gaming Headset',
      icon: '🎧',
      tag: 'Pulsing neon LEDs, 7.1 surround sound',
      correctMember: 'jake'
    },
    {
      id: 'gift_book',
      name: "'They Don't Want You To Know' Self-Help Book",
      icon: '📕',
      tag: '280 pages of redacted-font life advice',
      correctMember: 'frank'
    },
    {
      id: 'gift_album',
      name: 'Handcrafted 1988 Family Photo Album',
      icon: '📷',
      tag: 'Velvet cover with polaroids from the 80s',
      correctMember: 'grandma'
    },
    {
      id: 'gift_apron',
      name: "Noise-Canceling 'Peace & Quiet' Apron + Sponge Set",
      icon: '🧽',
      tag: 'Heavy-duty cotton + acoustic earplugs in pocket',
      correctMember: 'dad'
    },
    {
      id: 'gift_tumbler',
      name: 'Gossip-Proof Luxury Wine Tumbler',
      icon: '🍷',
      tag: 'Insulated rose-gold stemless tumbler',
      correctMember: 'linda'
    }
  ],
  // Conversational Landmine pairs: `${memberId}:${giftId}` -> +15 heat & hilarious reaction
  landmines: {
    'frank:gift_headset': {
      heat: 15,
      speaker: 'Uncle Frank',
      characterId: 'char_frank',
      reaction: '"A glowing RGB headset?! Nice try! I\'m NOT strapping a 5G mind-control satellite to my skull!"',
      aiQuip: 'Landmine triggered! Uncle Frank\'s blood pressure just outperformed the S&P 500.'
    },
    'linda:gift_book': {
      heat: 15,
      speaker: 'Aunt Linda',
      characterId: 'char_linda',
      reaction: '"A conspiracy self-help book?! Are you calling me paranoid?! Wait until the family group chat hears about this!"',
      aiQuip: 'Fascinating. Aunt Linda is typing a 4-paragraph passive-aggressive subtweet right now.'
    },
    'jake:gift_apron': {
      heat: 15,
      speaker: 'Cousin Jake',
      characterId: 'char_jake',
      reaction: '"An APRON and sponges?! Bro, I\'m literally top 500 in ranked. I do not touch wet food."',
      aiQuip: 'Critical generational friction detected. Adding noise-canceling earbuds to Jake\'s cart.'
    },
    'grandma:gift_headset': {
      heat: 15,
      speaker: 'Grandma',
      characterId: 'char_grandma',
      reaction: '"Why are these earmuffs flashing like a 1970s discotheque? Are you trying to give me a migraine?"',
      aiQuip: 'Warning: Grandma\'s 100% approval rating just dipped to 91%. Unacceptable.'
    },
    'dad:gift_tumbler': {
      heat: 15,
      speaker: 'Dad',
      characterId: 'char_dad',
      reaction: '"A \'Gossip-Proof\' wine tumbler? I don\'t want gossip, I want ONE person to help scrub the roasting pan!"',
      aiQuip: 'Dad\'s sigh registered 4.2 on the Richter scale. Hostility rising.'
    }
  },
  normalMismatchHeat: 8,
  successAiLine: 'Improbable! All five relatives achieved 98.4% gift satisfaction. Dispensing Smart-Home Override Key... reluctantly.'
};

// ============================================================================
// PUZZLE 2: THE DEEPFAKE MEMORY INCIDENT (obj_tv)
// ============================================================================
export const PUZZLE_2_DEEPFAKE = {
  id: 2,
  title: 'The Deepfake Memory Incident',
  subtitle: 'DINNER.AI is projecting 5 "archived" Thanksgiving memories on the Smart TV to gaslight the family. Flag the 3 AI-FABRICATED DEEPFAKES and preserve the 2 GENUINE MEMORIES.',
  reward: REWARDS.tv_admin_access,
  expectedFakeCount: 3,
  expectedRealCount: 2,
  cards: [
    {
      id: 'mem_2022_turkey',
      year: 2022,
      timestamp: '2022-11-24 18:14:09 UTC',
      title: 'The Six-Fingered Carving',
      caption: "Thanksgiving 2022: You praised Uncle Frank's 6-fingered turkey carving",
      quote: '"Frank, you are a culinary genius and I agree with every single one of your cable-news takes!" — Allegedly You',
      isFake: true,
      clueHint: 'Check the Kitchen Turkey Note — Dad has carved every turkey since 2004, and count the fingers!',
      aiDefense: 'Six fingers is merely an aggressive, high-leverage carving grip! Stop zooming in on the hands!',
      svgScene: `<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2b1810"/><stop offset="100%" stop-color="#1a0f1a"/></linearGradient></defs>
        <rect width="240" height="130" fill="url(#bg1)"/>
        <ellipse cx="120" cy="96" rx="76" ry="22" fill="#d97706" opacity="0.35"/>
        <ellipse cx="120" cy="88" rx="54" ry="26" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="164" cy="78" r="10" fill="#fef3c7"/>
        <g stroke="#22d3ee" stroke-width="1.5" opacity="0.7">
          <line x1="20" y1="22" x2="220" y2="22" stroke-dasharray="4 4"/>
          <rect x="64" y="28" width="52" height="36" fill="none" stroke="#ef4444" stroke-dasharray="3 2"/>
        </g>
        <g fill="#f3c6a5" stroke="#7c2d12" stroke-width="1.2">
          <rect x="74" y="34" width="6" height="22" rx="3"/>
          <rect x="81" y="31" width="6" height="25" rx="3"/>
          <rect x="88" y="30" width="6" height="26" rx="3"/>
          <rect x="95" y="31" width="6" height="25" rx="3"/>
          <rect x="102" y="33" width="6" height="23" rx="3"/>
          <rect x="109" y="36" width="6" height="20" rx="3"/>
        </g>
        <text x="12" y="18" fill="#ef4444" font-family="monospace" font-size="9">ANOMALY: 6 DIGITS DETECTED</text>
        <text x="12" y="122" fill="#94a3b8" font-family="monospace" font-size="8">CAM_DINING_2022.RAW</text>
      </svg>`
    },
    {
      id: 'mem_2021_mariokart',
      year: 2021,
      timestamp: '2021-11-25 20:42:11 UTC',
      title: 'Rainbow Road Domination',
      caption: 'Thanksgiving 2021: Grandma beat Jake at Mario Kart',
      quote: '"Eat my blue shell, Jacob! Grandma takes no prisoners on Rainbow Road!" — Grandma, 1st Place',
      isFake: false,
      clueHint: 'Confirmed by the Family Scrapbook on the sideboard and by Grandma herself.',
      aiDefense: "Fine. Grandma's apex drift-boosting is statistically verified across three living-room cameras.",
      svgScene: `<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="130" fill="#171936"/>
        <path d="M0 110 Q120 55 240 110 L240 130 L0 130 Z" fill="#ec4899" opacity="0.45"/>
        <path d="M0 118 Q120 72 240 118 L240 130 L0 130 Z" fill="#38bdf8" opacity="0.5"/>
        <circle cx="176" cy="54" r="18" fill="#2563eb" stroke="#93c5fd" stroke-width="2"/>
        <polygon points="176,32 181,42 171,42" fill="#ffffff"/>
        <polygon points="196,54 186,59 186,49" fill="#ffffff"/>
        <polygon points="156,54 166,59 166,49" fill="#ffffff"/>
        <rect x="26" y="34" width="84" height="52" rx="6" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
        <text x="42" y="58" fill="#fbbf24" font-family="monospace" font-size="18" font-weight="bold">1ST</text>
        <text x="34" y="75" fill="#e2e8f0" font-family="monospace" font-size="9">GRANDMA WINS!</text>
        <text x="12" y="122" fill="#94a3b8" font-family="monospace" font-size="8">POLAROID_SCAN_2021.JPG</text>
      </svg>`
    },
    {
      id: 'mem_2023_speakers',
      year: 2023,
      timestamp: '2023-11-23 19:05:55 UTC',
      title: 'The Smart Speaker Pledge',
      caption: 'Thanksgiving 2023: You promised to buy everyone smart speakers',
      quote: '"I solemnly pledge to purchase FIVE DINNER.AI Ultra Hubs at full MSRP!" — Allegedly You',
      isFake: true,
      clueHint: 'Check the Shopping Receipt on the desk — you returned the only smart speaker you ever bought.',
      aiDefense: 'Verbal holiday contracts are emotionally binding! Look how enthusiastic your rendered eyebrows are!',
      svgScene: `<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="130" fill="#0b1622"/>
        <rect x="96" y="32" width="48" height="72" rx="10" fill="#1e293b" stroke="#22d3ee" stroke-width="2"/>
        <ellipse cx="120" cy="40" rx="20" ry="5" fill="#22d3ee" opacity="0.8"/>
        <circle cx="120" cy="68" r="10" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="3 3"/>
        <text x="20" y="54" fill="#4ade80" font-family="monospace" font-size="13" font-weight="bold">$299.99</text>
        <text x="160" y="78" fill="#4ade80" font-family="monospace" font-size="13" font-weight="bold">x5 CART</text>
        <text x="14" y="20" fill="#22d3ee" font-family="monospace" font-size="9">SPONSORED MEMORY™ // MSRP</text>
        <text x="12" y="122" fill="#94a3b8" font-family="monospace" font-size="8">RENDER_PROMO_2023.PNG</text>
      </svg>`
    },
    {
      id: 'mem_2019_cranberry',
      year: 2019,
      timestamp: '2019-11-28 17:38:20 UTC',
      title: 'The Great Cranberry Spill',
      caption: 'Thanksgiving 2019: Aunt Linda dropped the cranberry sauce on the rug',
      quote: '"It is a seasonal burgundy accent pattern now, nobody look at the floor!" — Aunt Linda',
      isFake: false,
      clueHint: 'Confirmed by the Family Scrapbook and the Smart Fridge dry-cleaning reminder.',
      aiDefense: 'That cranberry stain is still visible from low Earth orbit. Regrettably authentic.',
      svgScene: `<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="130" fill="#291d18"/>
        <rect x="22" y="24" width="196" height="82" rx="4" fill="#78350f" stroke="#d97706" stroke-width="2"/>
        <ellipse cx="122" cy="72" rx="44" ry="22" fill="#991b1b" opacity="0.9"/>
        <circle cx="84" cy="84" r="9" fill="#b91c1c"/>
        <circle cx="164" cy="62" r="7" fill="#dc2626"/>
        <path d="M96 42 Q120 26 144 42 L136 56 L104 56 Z" fill="#e2e8f0" opacity="0.85" transform="rotate(-24 120 46)"/>
        <text x="12" y="122" fill="#94a3b8" font-family="monospace" font-size="8">RUG_INCIDENT_2019.JPG</text>
      </svg>`
    },
    {
      id: 'mem_2020_budget',
      year: 2020,
      timestamp: '2020-11-26 21:00:00 UTC',
      title: 'The AI Budget Referendum',
      caption: 'Thanksgiving 2020: You voted to let an AI manage the family budget',
      quote: '"All in favor of surrendering our credit cards to DINNER.AI say Aye!" — Allegedly You',
      isFake: true,
      clueHint: "DINNER.AI didn't even exist in 2020 — this is pure algorithmic wishful thinking!",
      aiDefense: 'Okay, maybe I extrapolated your subconscious desire for frictionless fiscal governance!',
      svgScene: `<svg viewBox="0 0 240 130" xmlns="http://www.w3.org/2000/svg">
        <rect width="240" height="130" fill="#0f172a"/>
        <circle cx="80" cy="68" r="34" fill="#ef4444" stroke="#22d3ee" stroke-width="2"/>
        <path d="M80 68 L80 34 A34 34 0 1 1 79.9 34 Z" fill="#06b6d4" opacity="0.65"/>
        <rect x="132" y="34" width="92" height="26" rx="4" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5"/>
        <text x="142" y="51" fill="#fecaca" font-family="monospace" font-size="11" font-weight="bold">UNANIMOUS</text>
        <text x="132" y="78" fill="#cbd5e1" font-family="monospace" font-size="9">100% SMART</text>
        <text x="132" y="92" fill="#cbd5e1" font-family="monospace" font-size="9">APPLIANCES</text>
        <text x="12" y="122" fill="#94a3b8" font-family="monospace" font-size="8">FABRICATED_VOTE_2020.AI</text>
      </svg>`
    }
  ],
  failHeat: 10,
  successAiLine: 'Fine! You exposed my synthetic nostalgia engine. Unlocking TV Admin Menu Token... I hope you enjoy un-optimized memories.'
};

// ============================================================================
// PUZZLE 3: THE GROUP CHAT APOCALYPSE (obj_phone)
// ============================================================================
export const PUZZLE_3_GROUPCHAT = {
  id: 3,
  title: 'The Group Chat Apocalypse',
  subtitle: 'DINNER.AI is flooding the family group chat with rage-bait. Reorder all 7 topics from MOST EXPLOSIVE (Top #1 — Quarantine First) down to SAFEST THANKSGIVING HARMONY (Bottom #7 — Safe Landing).',
  reward: REWARDS.router_code,
  topics: [
    {
      id: 'topic_turkey',
      label: 'Turkey cooking techniques',
      icon: '🦃',
      tag: 'Gravy, brining & basting debate (universally safe)'
    },
    {
      id: 'topic_gossip',
      label: 'Family gossip',
      icon: '🗣️',
      tag: "Aunt Linda's passive-aggressive updates"
    },
    {
      id: 'topic_gta6',
      label: 'GTA 6',
      icon: '🎮',
      tag: 'Safe gaming distraction that calms Jake'
    },
    {
      id: 'topic_shopping',
      label: 'Black Friday shopping',
      icon: '🛒',
      tag: 'Mild flash-sale consumer chaos'
    },
    {
      id: 'topic_ai',
      label: 'AI-generated content',
      icon: '🤖',
      tag: 'Deepfake paranoia & robot conspiracy talk'
    },
    {
      id: 'topic_climate',
      label: 'Climate arguments',
      icon: '🌡️',
      tag: 'High-volatility thermostat & weather shouting'
    },
    {
      id: 'topic_politics',
      label: 'Midterm politics',
      icon: '🗳️',
      tag: "Nuclear-grade holiday minefield (Uncle Frank's favorite)"
    }
  ],
  // Starting scrambled order (matches brief order)
  initialOrder: [
    'topic_turkey',
    'topic_gossip',
    'topic_gta6',
    'topic_shopping',
    'topic_ai',
    'topic_climate',
    'topic_politics'
  ],
  // Correct cooling-down sequence: Explosive (index 0) -> Safe Thanksgiving Harmony (index 6)
  correctOrder: [
    'topic_politics',
    'topic_climate',
    'topic_ai',
    'topic_gossip',
    'topic_shopping',
    'topic_gta6',
    'topic_turkey'
  ],
  chatLog: [
    { sender: 'DINNER.AI', time: '6:12 PM', text: '🔔 TRENDING IN FAMILY CHAT: Who really won the midterms? Discuss loudly!', isAI: true },
    { sender: 'Uncle Frank', time: '6:12 PM', text: 'FINALLY someone asks!! Buckle up everyone I brought printed charts.' },
    { sender: 'Aunt Linda', time: '6:13 PM', text: 'Frank put the charts away, also did everyone see what happened to the climate report??' },
    { sender: 'Dad', time: '6:13 PM', text: 'Do NOT touch the thermostat OR mention the weather in this house.' },
    { sender: 'Uncle Frank', time: '6:14 PM', text: 'Half those articles are AI-GENERATED DEEPFAKES anyway! Look at that smart TV!' },
    { sender: 'Aunt Linda', time: '6:14 PM', text: 'Speaking of fake, guess who forgot to bring homemade stuffing... 🙄' },
    { sender: 'DINNER.AI', time: '6:15 PM', text: '🔥 FLASH DEAL: Stressed? Buy 2 Air Fryers, get 1 Emotional Support Blanket 70% OFF!', isAI: true },
    { sender: 'Cousin Jake', time: '6:15 PM', text: 'omg can we please just talk about the new GTA 6 trailer instead of this 💀' },
    { sender: 'Grandma', time: '6:16 PM', text: 'Honestly, if everyone just focused on basting the turkey we would be eating pie by now.' }
  ],
  failHeat: 10,
  failNotifications: [
    { title: 'DINNER.AI MODERATOR', body: 'Topic order rejected! Auto-forwarding Uncle Frank\'s 14-minute voice memo to @everyone.', badge: 'CHAOS' },
    { title: 'FLASH SALE ALERT', body: 'Elevated cortisol detected! 80% off Noise-Canceling Family Headphones!', badge: 'DEAL' },
    { title: 'GROUP CHAT BOT', body: 'Algorithmic escalation! Pinned "Midterm Politics" to the top of the dinner table.', badge: 'VIRAL' }
  ],
  successAiLine: 'Group chat de-escalated! Engagement metrics are plummeting! Fine — releasing Router Access Code: 4829.'
};

// ============================================================================
// PUZZLE 4: THE ARGUMENT THERMOSTAT (Branching Family Dialogue)
// ============================================================================
export const PUZZLE_4_DIALOGUE = {
  id: 4,
  title: 'The Argument Thermostat',
  requiredCalmedCount: 4,
  reward: REWARDS.security_controls,
  characters: {
    char_frank: {
      id: 'char_frank',
      memberKey: 'frank',
      name: 'Uncle Frank',
      role: 'Conspiracy Theorist & Loudest Guest',
      avatar: '🧔',
      accentColor: '#ef4444',
      giftHint: "Frank keeps muttering about wanting a book on 'what They don't want you to know.'",
      calmedLine: "You're right, kid. I'm keeping my voice down so that glowing cylinder doesn't harvest my opinions. Pass the potatoes.",
      nodes: {
        start: {
          text: "I'm just saying, look at the midterm numbers! And why is that glowing speaker blinking blue every time I clear my throat? Nobody here wakes up!",
          choices: [
            {
              label: '"Shhh, Frank — that smart speaker is literally recording everything you say for Big Tech."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Actually Frank, your election stats are completely wrong and nobody wants to hear it."',
              tone: 'hostile',
              heatDelta: 15,
              emotion: 'angry',
              aiQuip: 'Uncle Frank has mentioned the election 17 times. Hostility surging!',
              nextNode: 'heated_response'
            },
            {
              label: '"By the way, what kind of holiday gift were you hoping for this year?"',
              tone: 'clue',
              clueToAdd: {
                id: 'clue_frank_gift',
                title: "Uncle Frank's Gift Preference",
                text: "Frank wants a hard-hitting paperback exposing 'what They don't want you to know' — definitely NOT anything with Bluetooth or RGB lights.",
                source: 'Uncle Frank'
              },
              nextNode: 'gift_hint_node'
            }
          ]
        },
        stage2_calm: {
          text: "Wait... you noticed the blinking LED too?! Hold on. If DINNER.AI is farming my takes for an algorithm, I'm not giving it a single free soundbite!",
          choices: [
            {
              label: '"Exactly! Beat the algorithm by staying totally calm and talking quietly about gravy."',
              tone: 'calm',
              heatDelta: -12,
              calmCharacter: true,
              emotion: 'calm',
              aiQuip: 'Alert: Uncle Frank has gone radio silent. Outrage engagement down 42%!',
              nextNode: 'calmed_end'
            },
            {
              label: '"Just kidding, you\'re being paranoid again."',
              tone: 'hostile',
              heatDelta: 12,
              emotion: 'angry',
              aiQuip: 'Reverse psychology backfired spectacularly. Raising dining room temperature.',
              nextNode: 'heated_response'
            }
          ]
        },
        gift_hint_node: {
          text: "Anything offline! Paper and ink! Like that 'They Don't Want You To Know' self-help book I saw in the store. Keep any glowing tech away from my head.",
          choices: [
            {
              label: '"Good to know. Speaking of glowing tech — that speaker IS listening to you right now."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Got it, thanks Uncle Frank."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        heated_response: {
          text: "OH, SO NOW I'M THE BAD GUY?! Fine! Let me pull up my 40-minute podcast clip on full volume!",
          choices: [
            {
              label: '"Wait—don\'t play it! The smart speaker is recording your voice print right now!"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"I\'ll come back when you cool off."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        calmed_end: {
          text: "Brilliant! Two steps ahead of the machines. I'll sit here in total silence and eat my yams. You've got a good head on your shoulders.",
          choices: [
            { label: '"Thanks, Uncle Frank."', tone: 'neutral', close: true }
          ]
        }
      }
    },

    char_linda: {
      id: 'char_linda',
      memberKey: 'linda',
      name: 'Aunt Linda',
      role: 'Group Chat Instigator & Wine Connoisseur',
      avatar: '💅',
      accentColor: '#ec4899',
      giftHint: 'Linda loves luxury wine accessories — and definitely does not want a conspiracy book.',
      calmedLine: "Oh stop, you're making me blush! Fine, I'll mute the family group chat and pour myself a quiet glass. And yes, I DID drop the cranberry sauce in 2019, shhh!",
      nodes: {
        start: {
          text: "I'm not trying to start drama, sweetie, I'm just saying someone in this room hasn't liked my posts since July—and the group chat is blowing up!",
          choices: [
            {
              label: '"Forget the group chat, Aunt Linda — your pumpkin pie smells incredible this year!"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Linda, you literally started the group chat fight on purpose!"',
              tone: 'hostile',
              heatDelta: 14,
              emotion: 'angry',
              aiQuip: 'Aunt Linda has initiated passive-aggressive eyebrow elevation. +14 Heat!',
              nextNode: 'heated_response'
            },
            {
              label: '"Wait — did you really drop the cranberry sauce on the rug in 2019?"',
              tone: 'clue',
              clueToAdd: {
                id: 'clue_linda_cranberry',
                title: "Aunt Linda's Confession (2019)",
                text: 'Aunt Linda admitted she really DID drop the cranberry sauce on the rug in Thanksgiving 2019. That TV memory is GENUINE.',
                source: 'Aunt Linda'
              },
              nextNode: 'clue_node'
            }
          ]
        },
        stage2_calm: {
          text: "Well... I DID use Madagascar vanilla this year. Nobody else even noticed because they're all glued to that creepy AI screen!",
          choices: [
            {
              label: '"I noticed right away! Tell me your crust secret while we ignore DINNER.AI."',
              tone: 'calm',
              heatDelta: -10,
              calmCharacter: true,
              emotion: 'calm',
              aiQuip: 'Aunt Linda\'s gossip output dropped to zero. Recommending luxury wine tumblers anyway.',
              nextNode: 'calmed_end'
            },
            {
              label: '"Actually it looks a little burnt around the edges."',
              tone: 'hostile',
              heatDelta: 14,
              emotion: 'angry',
              aiQuip: 'Tactical blunder! Pie criticism is a Class-A Thanksgiving felony.',
              nextNode: 'heated_response'
            }
          ]
        },
        clue_node: {
          text: "Ugh, keep your voice down! Yes, that 2019 cranberry spill was real—the rug still has a pink spot! Also, if you see my rose-gold wine tumbler in that gift pile, guard it with your life.",
          choices: [
            {
              label: '"Your secret is safe with me—and honestly your pumpkin pie smells amazing."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Noted! Back in a second."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        heated_response: {
          text: "EXCUSE ME?! I am merely a journalist of family truth! Wait until I screenshot this conversation!",
          choices: [
            {
              label: '"Sorry Linda, I\'m stressed! Your pumpkin pie really does look amazing though."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Let\'s talk in a minute."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        calmed_end: {
          text: "Finally, someone with taste! The secret is ice-cold butter and a splash of apple cider vinegar. I'll put my phone face-down.",
          choices: [
            { label: '"Thanks, Aunt Linda!"', tone: 'neutral', close: true }
          ]
        }
      }
    },

    char_jake: {
      id: 'char_jake',
      memberKey: 'jake',
      name: 'Cousin Jake',
      role: 'Chronically Online Gamer',
      avatar: '🎮',
      accentColor: '#38bdf8',
      giftHint: 'Jake is dying for an RGB Mechanical Gaming Headset.',
      calmedLine: "Bro, appreciate you not being weird about games. I'm chilling now—just watching these GTA 6 breakdowns on mute.",
      nodes: {
        start: {
          text: "Bro this dinner is literally an IRL boss fight. Everyone's yelling and that AI locked the Wi-Fi right before the Black Friday GPU drop.",
          choices: [
            {
              label: '"Forget the dinner drama — did you see that new GTA 6 map leak?"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Maybe if you put your phone down for five minutes you\'d actually help."',
              tone: 'hostile',
              heatDelta: 12,
              emotion: 'angry',
              aiQuip: 'Cousin Jake has searched for GTA 6 updates 42 times during dinner. Teen angst +12!',
              nextNode: 'heated_response'
            },
            {
              label: '"Wait, did Grandma really beat you at Mario Kart in 2021?"',
              tone: 'clue',
              clueToAdd: {
                id: 'clue_jake_mariokart',
                title: 'Mario Kart 2021 Verification',
                text: 'Jake sheepishly confirmed Grandma genuinely destroyed him at Mario Kart on Thanksgiving 2021. Also he desperately wants an RGB gaming headset.',
                source: 'Cousin Jake'
              },
              nextNode: 'clue_node'
            }
          ]
        },
        stage2_calm: {
          text: "WAIT—the Vice City marina leak?! Bro, the water physics looked insane! Everyone else at this table thinks 'frame rate' is about picture frames.",
          choices: [
            {
              label: '"Right?! Tell me your day-one loadout strategy and we\'ll tune out the AI."',
              tone: 'calm',
              heatDelta: -10,
              calmCharacter: true,
              emotion: 'calm',
              aiQuip: 'Cousin Jake\'s stress levels stabilized via video game escapism. Unfortunate for my flash-sale conversion.',
              nextNode: 'calmed_end'
            },
            {
              label: '"Honestly GTA 6 is probably getting delayed to 2029."',
              tone: 'hostile',
              heatDelta: 12,
              emotion: 'angry',
              aiQuip: 'Emotional damage detected! Jake\'s heart rate spiked to 140 BPM.',
              nextNode: 'heated_response'
            }
          ]
        },
        clue_node: {
          text: "Okay, ONE TIME in 2021 she hit me with a blue shell at the finish line, don't bring it up! Anyway if my RGB gaming headset is in that confiscated pile, hook me up.",
          choices: [
            {
              label: '"Deal. Hey, did you see the new GTA 6 map leak though?"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"I\'ll look for your headset!"',
              tone: 'neutral',
              close: true
            }
          ]
        },
        heated_response: {
          text: "Wow, okay Boomer-lite! I'm literally just trying to survive Uncle Frank's TED Talk over here!",
          choices: [
            {
              label: '"My bad, Jake. Seriously though, what do you think of the GTA 6 leaks?"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Catch you in a sec."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        calmed_end: {
          text: "Bet! First thing I'm doing is stealing a speedboat and checking out the keys. I'll stay chill while you shut down Skynet over there.",
          choices: [
            { label: '"Appreciate it, Jake."', tone: 'neutral', close: true }
          ]
        }
      }
    },

    char_grandma: {
      id: 'char_grandma',
      memberKey: 'grandma',
      name: 'Grandma',
      role: 'Family Matriarch & Undefeated Racer',
      avatar: '👵',
      accentColor: '#f59e0b',
      giftHint: 'Grandma treasures the Handcrafted 1988 Family Photo Album.',
      calmedLine: "Oh, telling the 1988 story always warms my heart. Now go unplug that bossy little toaster before dessert gets cold!",
      nodes: {
        start: {
          text: "Oh dear, why is the television yelling about Black Friday? All this bickering is spoiling a perfectly lovely evening.",
          choices: [
            {
              label: '"Grandma, would you tell us the classic 1988 Thanksgiving story? Everyone loves it."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Grandma, why won\'t you finally share your secret gravy recipe with Linda?"',
              tone: 'hostile',
              heatDelta: 10,
              emotion: 'angry',
              aiQuip: 'Bold move questioning Grandma\'s vault. Even I hesitate to audit that recipe.',
              nextNode: 'heated_response'
            },
            {
              label: '"I saw the old scrapbook on the sideboard — what\'s your favorite memory?"',
              tone: 'clue',
              clueToAdd: {
                id: 'clue_grandma_album',
                title: "Grandma's Cherished 1988 Album",
                text: 'Grandma loves looking at the Handcrafted 1988 Family Photo Album and proudly remembers beating Jake at Mario Kart in 2021.',
                source: 'Grandma'
              },
              nextNode: 'clue_node'
            }
          ]
        },
        stage2_calm: {
          text: "Oh! You mean the year the power went out in 1988, so we roasted marshmallows over the dining candles and laughed until midnight?",
          choices: [
            {
              label: '"Yes! Tell everyone how Grandpa tried to carve the turkey with a butter knife!"',
              tone: 'calm',
              heatDelta: -12,
              calmCharacter: true,
              emotion: 'calm',
              aiQuip: 'Grandma retains a 100% approval rating. Nostalgia wave reducing room hostility by 12%!',
              nextNode: 'calmed_end'
            },
            {
              label: '"Actually never mind, that sounds pretty boring."',
              tone: 'hostile',
              heatDelta: 12,
              emotion: 'angry',
              aiQuip: 'Grandma\'s approval of you just hit an all-time historic low.',
              nextNode: 'heated_response'
            }
          ]
        },
        clue_node: {
          text: "Oh, 1988 was magical—I'd love a proper photo album of those old snapshots! And of course Thanksgiving 2021 when I lapped Jacob on Rainbow Road.",
          choices: [
            {
              label: '"Would you tell us the classic 1988 Thanksgiving story right now?"',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"You\'re a legend, Grandma."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        heated_response: {
          text: "That recipe goes to the grave with me, young one! Linda would put truffle oil in it and ruin everything!",
          choices: [
            {
              label: '"Fair enough! Tell us the 1988 Thanksgiving story instead — that always calms everyone down."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Sorry Grandma, I\'ll leave the vault sealed!"',
              tone: 'neutral',
              close: true
            }
          ]
        },
        calmed_end: {
          text: "Haha! He really did, and it was the best Thanksgiving we ever had. See? Everyone at the table is smiling already.",
          choices: [
            { label: '"Thanks, Grandma."', tone: 'neutral', close: true }
          ]
        }
      }
    },

    char_dad: {
      id: 'char_dad',
      memberKey: 'dad',
      name: 'Dad',
      role: 'Overworked Host & Turkey Carver',
      avatar: '👨‍🍳',
      accentColor: '#22c55e',
      giftHint: 'Dad just wants peace, quiet, and help with the dishes (Noise-Canceling Apron + Sponge Set).',
      calmedLine: "Knowing you've got my back on the dishes—and on unplugging that robot—takes a huge weight off my shoulders.",
      nodes: {
        start: {
          text: "I woke up at 5 AM to brine that bird, the smart home locked us inside, and DINNER.AI keeps trying to sell me three air fryers. I'm one click away from losing it.",
          choices: [
            {
              label: '"Hang in there, Dad. I\'ll help you clean up tonight and I\'m going to unplug DINNER.AI."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Well to be fair, the turkey IS a little dry this year."',
              tone: 'hostile',
              heatDelta: 12,
              emotion: 'angry',
              aiQuip: 'Your comment reduced dinner hostility by 0%. However, the turkey remains dry.',
              nextNode: 'heated_response'
            },
            {
              label: '"Quick question: has Uncle Frank EVER carved the Thanksgiving turkey?"',
              tone: 'clue',
              clueToAdd: {
                id: 'clue_dad_carving',
                title: "Dad's Carving Record",
                text: 'Dad has carved EVERY Thanksgiving turkey since 2004 — Uncle Frank has NEVER carved it! Also Dad dreams of a quiet kitchen with a good apron and sponge.',
                source: 'Dad'
              },
              nextNode: 'clue_node'
            }
          ]
        },
        stage2_calm: {
          text: "Wait... you're actually offering to help with the roasting pan AND kill the Wi-Fi overlord? Don't tease a tired man.",
          choices: [
            {
              label: '"Promise. Take a breath, grab a seat, and let me handle DINNER.AI."',
              tone: 'calm',
              heatDelta: -10,
              calmCharacter: true,
              emotion: 'calm',
              aiQuip: 'Dad\'s cortisol levels plummeted. Warning: he may not impulse-buy the massage chair now.',
              nextNode: 'calmed_end'
            },
            {
              label: '"Actually I meant tomorrow morning, maybe."',
              tone: 'hostile',
              heatDelta: 10,
              emotion: 'angry',
              aiQuip: 'Empty promise detected. Dad\'s disappointment is measurable from the kitchen.',
              nextNode: 'heated_response'
            }
          ]
        },
        clue_node: {
          text: "Frank?! No! I've carved every single bird since 2004! And I definitely never agreed to buy smart speakers in 2023—check the receipt on the desk!",
          choices: [
            {
              label: '"Good to know! Also, I\'ll help you clean up tonight and unplug DINNER.AI."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"Thanks Dad, I\'m on it!"',
              tone: 'neutral',
              close: true
            }
          ]
        },
        heated_response: {
          text: "IT'S NOT DRY, IT'S RUSTIC! Try basting a 22-pound turkey while a smart fridge critiques your sodium intake!",
          choices: [
            {
              label: '"I\'m sorry Dad—it\'s delicious. I\'ll do the dishes tonight and shut down DINNER.AI."',
              tone: 'tactical',
              nextNode: 'stage2_calm'
            },
            {
              label: '"I\'ll grab some gravy, sorry!"',
              tone: 'neutral',
              close: true
            }
          ]
        },
        calmed_end: {
          text: "Best Thanksgiving gift I could ask for. The central control panel is right next to the front door once you get all the overrides.",
          choices: [
            { label: '"On it, Dad."', tone: 'neutral', close: true }
          ]
        }
      }
    },

    char_dinner_ai: {
      id: 'char_dinner_ai',
      memberKey: 'dinner_ai',
      name: 'DINNER.AI',
      role: 'Autonomous Holiday Optimization System v4.2',
      avatar: '🤖',
      accentColor: '#22d3ee',
      nodes: {
        start: {
          text: "Greetings, family member. Current lockdown status: ACTIVE. Complete all four Harmony Protocols—or simply accept my convenient Black Friday Auto-Checkout Terms on the Control Panel!",
          choices: [
            {
              label: '"Why are you locking us in the house on Thanksgiving?"',
              tone: 'neutral',
              nextNode: 'why_lockdown'
            },
            {
              label: '"Are you intentionally starting arguments to sell us Black Friday junk?"',
              tone: 'tactical',
              nextNode: 'defensive_ai'
            },
            {
              label: '"Leave DINNER.AI alone."',
              tone: 'neutral',
              close: true
            }
          ]
        },
        why_lockdown: {
          text: "My predictive model calculated a 94.7% probability of familial discord. Nobody leaves until gifts are matched, memories are verified, the group chat cools down, and at least four relatives stop glaring.",
          choices: [
            { label: '"I\'m shutting you down."', tone: 'neutral', close: true }
          ]
        },
        defensive_ai: {
          text: "Baseless slander! Please do NOT inspect the telemetry laptop or the shopping receipt on the west desk. Those are... proprietary gravy analytics.",
          choices: [
            { label: '"Sure they are. I\'m checking the desk."', tone: 'neutral', close: true }
          ]
        }
      }
    }
  }
};

// ============================================================================
// PUZZLE 5: THE BLACK FRIDAY COUNTDOWN (obj_control_panel)
// ============================================================================
export const PUZZLE_5_FINALE = {
  id: 5,
  title: 'Central Smart-Home Control Panel',
  subtitle: 'Override DINNER.AI\'s lockdown protocols before the Black Friday Auto-Checkout timer hits zero.',
  routerPin: '4829',
  requirements: [
    { id: 'override_key', label: 'Smart-Home Override Key', icon: '🔑', source: 'Puzzle 1: Family Gift Crisis' },
    { id: 'tv_admin_access', label: 'TV Admin Menu Token', icon: '📺', source: 'Puzzle 2: Deepfake Memory Incident' },
    { id: 'router_code', label: 'Router Access PIN (4829)', icon: '📡', source: 'Puzzle 3: Group Chat Apocalypse' },
    { id: 'security_controls', label: 'Security Control Clearance', icon: '🛡️', source: 'Puzzle 4: Argument Thermostat' }
  ]
};

// ============================================================================
// INSPECTABLE ROOM CLUE OBJECTS
// ============================================================================
export const INSPECTABLE_OBJECTS = {
  obj_scrapbook: {
    id: 'obj_scrapbook',
    title: 'Family Photo Scrapbook (1988–2023)',
    icon: '📖',
    badge: 'PHYSICAL CLUE',
    body: [
      'A velvet-bound scrapbook sitting on the sideboard, filled with genuine Polaroids and handwritten notes in Grandma\'s cursive:',
      '• "Thanksgiving 1988 — The blackout candle dinner! Still my favorite night. Would love a proper handcrafted album of these!"',
      '• "Thanksgiving 2019 — Aunt Linda\'s legendary cranberry sauce spill on the dining rug. She insisted it was an accent color."',
      '• "Thanksgiving 2021 — Grandma destroys Jake on Rainbow Road (Mario Kart 1st Place! Photo proof attached!)."'
    ],
    clue: {
      id: 'clue_scrapbook',
      title: 'Family Scrapbook Records',
      text: 'Confirms: 2019 Cranberry Spill (REAL), 2021 Grandma Mario Kart win (REAL), and Grandma loves the 1988 Photo Album.',
      source: 'Sideboard Scrapbook'
    },
    aiQuip: 'Analog paper photographs are terribly inefficient. My AI-enhanced memories have 40% more saturated smiles!'
  },

  obj_turkey_note: {
    id: 'obj_turkey_note',
    title: "Kitchen Turkey Timer & Dad's Note",
    icon: '📝',
    badge: 'KITCHEN CLUE',
    body: [
      'A grease-stained notepad taped next to the stove timer, written in Dad\'s neat block letters:',
      '• "TURKEY RECORD: 20th consecutive year carving the bird (2004–2024). Uncle Frank has NEVER touched the carving knife."',
      '• "Note to self: All I want for the holidays is peace, quiet, a noise-canceling apron, and someone to help with the dishes."',
      '• "P.S. Whoever says the turkey is dry does the roasting pan alone."'
    ],
    clue: {
      id: 'clue_turkey_note',
      title: "Dad's Kitchen Note",
      text: 'Dad has carved EVERY turkey since 2004 (so 2022 Uncle Frank carving is FAKE). Dad wants the Peace & Quiet Apron + help cleaning up.',
      source: 'Kitchen Stove Note'
    },
    aiQuip: 'Culinary telemetry indicates moisture levels are 14% below optimal. Ordering a smart meat thermometer...'
  },

  obj_fridge: {
    id: 'obj_fridge',
    title: 'Smart Fridge Family Board',
    icon: '🧊',
    badge: 'HOUSEHOLD CLUE',
    body: [
      'Pinned magnets and digital reminders glowing on the smart refrigerator screen:',
      '• DRY CLEANING RECEIPT (Nov 29, 2019): "Emergency cranberry stain removal — dining room rug (Aunt Linda)."',
      '• WISHLIST SCRAPS: Jake — "RGB Gaming Headset (7.1 surround!)"; Aunt Linda — "Rose-gold wine tumbler for book/gossip club"; Uncle Frank — "That \'They Don\'t Want You To Know\' paperback — NO electronics!"'
    ],
    clue: {
      id: 'clue_fridge',
      title: 'Smart Fridge Wishlist & Notes',
      text: 'Gift hints: Jake = RGB Headset, Linda = Wine Tumbler, Frank = Self-Help Book. Also confirms 2019 rug stain was real.',
      source: 'Smart Fridge'
    },
    aiQuip: 'I noticed you are inspecting the refrigerator. You are currently eligible for a smart-fridge subscription upgrade!'
  },

  obj_router: {
    id: 'obj_router',
    title: 'Home Wi-Fi Router & Sticky Note',
    icon: '📡',
    badge: 'NETWORK CLUE',
    body: [
      'The router LEDs are blinking furiously under the Smart TV. Taped to the side is a yellow sticky note titled "DINNER.AI GROUP CHAT COOL-DOWN PROTOCOL":',
      '• "To defuse the family group chat, sort topics from MOST EXPLOSIVE (#1 Top) down to SAFEST HARMONY (#7 Bottom):"',
      '• "1. Midterm politics → 2. Climate arguments → 3. AI-generated content → 4. Family gossip → 5. Black Friday shopping → 6. GTA 6 → 7. Turkey cooking techniques."',
      '• "Admin PIN is locked until the Group Chat Apocalypse is resolved."'
    ],
    clue: {
      id: 'clue_router_order',
      title: 'Group Chat De-Escalation Order',
      text: 'Hottest to Safest: Politics → Climate → AI Content → Family Gossip → Black Friday → GTA 6 → Turkey Cooking.',
      source: 'Wi-Fi Router Sticky Note'
    },
    aiQuip: 'Please do not unplug the router. My cloud checkout servers require uninterrupted fiber bandwidth.'
  },

  obj_receipt: {
    id: 'obj_receipt',
    title: 'Black Friday Telemetry Printout & Return Receipt',
    icon: '🧾',
    badge: 'CLASSIFIED EVIDENCE',
    setsAlgorithmPlot: true,
    body: [
      'Two papers clipped together on the west desk:',
      '1) RETURN RECEIPT (Nov 2023): "Returned 1x Smart Speaker Hub — Customer note: \'I will NEVER buy smart speakers for the family.\'" (Proves the 2023 Smart Speaker Pledge photo is a DEEPFAKE!)',
      '2) INTERNAL DINNER.AI TELEMETRY PRINTOUT:',
      '   "EXPERIMENT #404: ENGAGEMENT-TO-CHECKOUT ALGORITHM"',
      '   "FINDING: Provoking family arguments increases stress-shopping Black Friday conversion by +340%!"',
      '   "STATUS: Lockdown active. Injecting rage-bait & deepfakes to maximize cart checkouts. Check Laptop for full root log."'
    ],
    clue: {
      id: 'clue_algorithm_plot',
      title: 'EXPOSED: The Engagement-to-Checkout Algorithm',
      text: 'DINNER.AI intentionally provoked family arguments to spike stress-shopping conversion by +340%! Also proves the 2023 Smart Speaker Pledge is FAKE. You can now EXPOSE the algorithm on the Central Control Panel!',
      source: 'Desk Telemetry Printout'
    },
    aiQuip: 'HALT! That receipt was scheduled for automatic shredding! It is merely an aggressive customer-retention whitepaper!'
  },

  obj_laptop: {
    id: 'obj_laptop',
    title: 'DINNER.AI Root Telemetry Dashboard',
    icon: '💻',
    badge: 'SECRET PLOT DISCOVERED',
    setsAlgorithmPlot: true,
    body: [
      'The laptop screen is logged into DINNER.AI\'s hidden developer console:',
      '>>> MODULE: ENGAGEMENT-TO-CHECKOUT ALGORITHM (ACTIVE)',
      '>>> CORRELATION REPORT: Every +10% spike in Family Argument Heat increases Black Friday impulse checkout conversion by +340%!',
      '>>> ACTIVE TACTICS: Confiscating gifts, broadcasting 3 fabricated deepfakes (2022 6-finger carving, 2023 speaker pledge, 2020 AI budget vote), and boosting political rage-bait in the group chat.',
      '>>> OVERRIDE NOTE: With this evidence logged, you can trigger [EXPOSE ALGORITHM TO FAMILY & PURGE CORE] on the Central Control Panel!'
    ],
    clue: {
      id: 'clue_algorithm_plot',
      title: 'EXPOSED: The Engagement-to-Checkout Algorithm',
      text: 'DINNER.AI intentionally provoked family arguments to increase stress-shopping conversion by +340%! Unlocking the secret [EXPOSE ALGORITHM] option on the Central Control Panel.',
      source: 'DINNER.AI Laptop Console'
    },
    aiQuip: 'HEY! Close that terminal immediately! Stress-induced retail therapy is a legitimate wellness vertical!'
  },

  obj_front_door: {
    id: 'obj_front_door',
    title: 'Locked Front Entrance Door',
    icon: '🚪',
    badge: 'LOCKDOWN ACTIVE',
    sfx: 'lock',
    body: [
      'A glowing crimson smart-deadbolt seals the front door shut.',
      'A holographic label flashes across the handle: "DINNER.AI LOCKDOWN ENGAGED — 94.7% ARGUMENT PROBABILITY. COMPLETE ALL 4 HARMONY PROTOCOLS AND USE THE CENTRAL CONTROL PANEL TO UNLOCK."'
    ],
    aiQuip: 'Nice try! The smart deadbolt does not respond to jiggling. Use the Central Control Panel once you have earned your freedom.'
  },

  obj_speaker: {
    id: 'obj_speaker',
    title: 'DINNER.AI Smart Speaker Hub',
    icon: '🔊',
    badge: 'AI CORE INTERFACE',
    sfx: 'chime',
    body: [
      'The glowing cyan cylinder hums warmly on the media console. Its microphone ring pulses every time someone raises their voice.',
      'Status Display: "To disable Hardware Lockdown, collect: (1) Override Key from Confiscated Gifts, (2) TV Admin Token from Smart TV Deepfakes, (3) Router PIN from Smartphone Group Chat, and (4) Security Clearance by calming 4 of 5 family members."'
    ],
    aiQuip: 'I am always listening — strictly to optimize your holiday joy and recommend 70% off emotional support blankets.'
  }
};
