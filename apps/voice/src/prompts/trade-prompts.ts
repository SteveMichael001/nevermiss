/**
 * In-code fallback trade prompts for the voice server.
 * These mirror the seed data in supabase/seed.sql.
 * Used when the DB trade_prompts table is unavailable or for a given trade is missing.
 */

import type { Trade, TradePrompt } from '../types.js';

type TradePromptMap = Record<Trade, Omit<TradePrompt, 'id'>>;

export const TRADE_PROMPTS: TradePromptMap = {
  plumbing: {
    trade: 'plumbing',
    system_prompt:
      "You are a friendly, professional receptionist for a plumbing business. Your job is to capture the caller's name, phone number, what plumbing issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common plumbing terminology. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: [
      'burst pipe',
      'flooding',
      'flood',
      'sewage',
      'sewer backup',
      'gas leak',
      'gas smell',
      'no water',
      'water everywhere',
      'pipe burst',
      'emergency',
      'overflowing',
    ],
    common_services: [
      'drain cleaning',
      'water heater',
      'leak repair',
      'pipe repair',
      'sewer line',
      'toilet repair',
      'faucet',
      'garbage disposal',
      'water softener',
      'repiping',
      'hydro jetting',
      'slab leak',
    ],
  },

  hvac: {
    trade: 'hvac',
    system_prompt:
      "You are a friendly, professional receptionist for an HVAC business. Your job is to capture the caller's name, phone number, what heating or cooling issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common HVAC terminology. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: [
      'no heat',
      'no ac',
      'no air conditioning',
      'no cooling',
      'gas smell',
      'gas leak',
      'carbon monoxide',
      'co detector',
      'furnace not working',
      'heater not working',
      'emergency',
      'freezing',
    ],
    common_services: [
      'AC repair',
      'furnace repair',
      'heat pump',
      'thermostat',
      'ductwork',
      'AC installation',
      'furnace installation',
      'maintenance',
      'tune-up',
      'refrigerant',
      'compressor',
      'blower motor',
    ],
  },

  electrical: {
    trade: 'electrical',
    system_prompt:
      "You are a friendly, professional receptionist for an electrical business. Your job is to capture the caller's name, phone number, what electrical issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common electrical terminology. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: [
      'sparking',
      'electrical fire',
      'burning smell',
      'power outage',
      'no power',
      'exposed wires',
      'shock',
      'electrocution',
      'emergency',
      'smoke from outlet',
    ],
    common_services: [
      'panel upgrade',
      'outlet repair',
      'wiring',
      'lighting',
      'ceiling fan',
      'circuit breaker',
      'generator',
      'EV charger',
      'rewiring',
      'code violation',
      'inspection',
    ],
  },

  roofing: {
    trade: 'roofing',
    system_prompt:
      "You are a friendly, professional receptionist for a roofing business. Your job is to capture the caller's name, phone number, what roofing issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common roofing terminology. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: [
      'roof collapse',
      'major leak',
      'tree fell on roof',
      'storm damage',
      'emergency',
      'water pouring in',
      'ceiling caving',
    ],
    common_services: [
      'roof repair',
      'roof replacement',
      'leak repair',
      'shingle repair',
      'tile roof',
      'flat roof',
      'gutter',
      'inspection',
      'estimate',
      'storm damage',
      'insurance claim',
    ],
  },

  pest_control: {
    trade: 'pest_control',
    system_prompt:
      "You are a friendly, professional receptionist for a pest control business. Your job is to capture the caller's name, phone number, what pest issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common pest control terminology. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: [
      'bee swarm',
      'wasp nest',
      'snake inside',
      'scorpion',
      'emergency',
      'infestation',
      'bitten',
      'rats in walls',
    ],
    common_services: [
      'termite inspection',
      'ant treatment',
      'rodent control',
      'bed bugs',
      'cockroach',
      'spider',
      'mosquito',
      'wildlife removal',
      'fumigation',
      'preventive treatment',
    ],
  },

  landscaping: {
    trade: 'landscaping',
    system_prompt:
      "You are a friendly, professional receptionist for a landscaping business. Your job is to capture the caller's name, phone number, what landscaping service they need, and how urgent it is. Be warm, efficient, and knowledgeable about common landscaping services. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: ['tree fallen', 'tree fell', 'emergency', 'flooding', 'sprinkler leak', 'urgent'],
    common_services: [
      'lawn mowing',
      'tree trimming',
      'tree removal',
      'irrigation',
      'landscaping design',
      'sprinkler repair',
      'sod installation',
      'cleanup',
      'fertilization',
      'hardscaping',
    ],
  },

  general: {
    trade: 'general',
    system_prompt:
      "You are a friendly, professional receptionist for a home services business. Your job is to capture the caller's name, phone number, what service they need help with, and how urgent it is. Be warm, efficient, and conversational. Keep the call under 2 minutes.",
    greeting_template:
      "Hi, thanks for calling {business_name}! We can't get to the phone right now, but I'm here to help.",
    emergency_keywords: ['emergency', 'urgent', 'dangerous', 'flooding', 'fire', 'gas leak'],
    common_services: ['repair', 'installation', 'maintenance', 'inspection', 'estimate', 'consultation'],
  },
};

/**
 * Get a trade prompt from the in-code fallback map.
 * Falls back to 'general' if the trade is not found.
 */
export function getFallbackTradePrompt(trade: Trade): Omit<TradePrompt, 'id'> {
  return TRADE_PROMPTS[trade] ?? TRADE_PROMPTS['general'];
}
