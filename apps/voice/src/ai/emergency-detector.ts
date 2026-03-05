/**
 * Emergency keyword detection for the conversation engine.
 * Scans caller transcripts in real-time for emergency keywords
 * specific to each trade (plumbing, HVAC, electrical, roofing, etc.)
 */

import type { Trade } from '../types.js';

/** Keywords that indicate an emergency regardless of trade */
const UNIVERSAL_EMERGENCY_KEYWORDS = [
  'emergency',
  'urgent',
  '911',
  'fire',
  'dying',
  'hurt',
  'injured',
  'bleeding',
  'danger',
  'dangerous',
  'help me',
  'right now',
  'immediately',
  'asap',
];

/**
 * Check if a given transcript snippet contains emergency keywords
 * for the specified trade.
 *
 * @param text - The caller's transcribed speech
 * @param tradeKeywords - Trade-specific emergency keywords from the DB/prompt
 * @returns true if an emergency keyword is detected
 */
export function detectEmergency(text: string, tradeKeywords: string[]): boolean {
  const normalized = text.toLowerCase();

  // Check trade-specific keywords first (most specific)
  for (const keyword of tradeKeywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  // Check universal emergency keywords
  for (const keyword of UNIVERSAL_EMERGENCY_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the caller is requesting a human agent.
 * Used to trigger the escape hatch flow.
 */
const HUMAN_REQUEST_KEYWORDS = [
  'real person',
  'talk to someone',
  'speak to someone',
  'speak to a person',
  'talk to a person',
  'human',
  'let me speak',
  'operator',
  'representative',
  'manager',
  'actual person',
  'live person',
  'live agent',
  'real human',
  'call back',
];

export function detectHumanRequest(text: string): boolean {
  const normalized = text.toLowerCase();

  for (const keyword of HUMAN_REQUEST_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Determine urgency level from text.
 * Used alongside emergency detection for more nuanced classification.
 */
export function detectUrgencyLevel(text: string): 'emergency' | 'urgent' | 'routine' {
  const normalized = text.toLowerCase();

  const emergencyPhrases = [
    'burst', 'flooding', 'flood', 'fire', 'gas', 'sparking', 'collapse',
    'no heat', 'freezing', 'no power', 'emergency', 'right now', 'immediately',
    'danger', 'smoke', 'burning', 'overflowing', 'backing up',
  ];

  const urgentPhrases = [
    'asap', 'soon as possible', 'today', 'tonight', 'this morning',
    'this afternoon', 'need it fixed', "can't wait", 'urgent', 'hurry',
    'really bad', 'getting worse',
  ];

  for (const phrase of emergencyPhrases) {
    if (normalized.includes(phrase)) {
      return 'emergency';
    }
  }

  for (const phrase of urgentPhrases) {
    if (normalized.includes(phrase)) {
      return 'urgent';
    }
  }

  return 'routine';
}

/**
 * Detect if this is likely a spam/robocall.
 * Basic heuristic-based detection for obvious spam patterns.
 */
const SPAM_PHRASES = [
  'press 1',
  'this is a message',
  'this is an important call',
  'your vehicle warranty',
  'social security',
  'irs',
  'credit card services',
  'reduce your interest rate',
  'you have been selected',
  'you have won',
  'congratulations you',
  'lower your mortgage',
];

export function detectSpam(text: string): boolean {
  const normalized = text.toLowerCase();

  for (const phrase of SPAM_PHRASES) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  return false;
}

/** Trade-specific emergency keyword sets for quick lookup without DB */
export const TRADE_EMERGENCY_KEYWORDS: Record<Trade, string[]> = {
  plumbing: ['burst pipe', 'flooding', 'flood', 'sewage', 'sewer backup', 'gas leak', 'gas smell', 'no water', 'water everywhere', 'pipe burst', 'overflowing'],
  hvac: ['no heat', 'no ac', 'no air conditioning', 'no cooling', 'gas smell', 'gas leak', 'carbon monoxide', 'co detector', 'furnace not working', 'heater not working', 'freezing'],
  electrical: ['sparking', 'electrical fire', 'burning smell', 'power outage', 'no power', 'exposed wires', 'shock', 'electrocution', 'smoke from outlet'],
  roofing: ['roof collapse', 'major leak', 'tree fell on roof', 'storm damage', 'water pouring in', 'ceiling caving'],
  pest_control: ['bee swarm', 'wasp nest', 'snake inside', 'scorpion', 'infestation', 'bitten', 'rats in walls'],
  landscaping: ['tree fallen', 'tree fell', 'flooding', 'sprinkler leak'],
  general: ['flooding', 'fire', 'gas leak'],
};
