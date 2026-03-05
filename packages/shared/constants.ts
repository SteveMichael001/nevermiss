export const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'general', label: 'General / Other' },
] as const;

export const URGENCY_LABELS = {
  emergency: { label: 'Emergency', color: 'red', emoji: '🔴' },
  urgent: { label: 'Urgent', color: 'yellow', emoji: '🟡' },
  routine: { label: 'Routine', color: 'green', emoji: '🟢' },
  unknown: { label: 'Unknown', color: 'gray', emoji: '⚪' },
} as const;

export const LEAD_STATUS_LABELS = {
  new: { label: 'New', color: 'blue' },
  called_back: { label: 'Called Back', color: 'yellow' },
  booked: { label: 'Booked', color: 'green' },
  lost: { label: 'Lost', color: 'gray' },
} as const;

export const MAX_CALL_DURATION_SECONDS = 180;
export const CALL_WRAP_UP_SECONDS = 150; // 2:30 - start wrapping up

export const SUBSCRIPTION_PRICE_MONTHLY = 250;
export const TRIAL_DAYS = 14;

export const CALLS_PER_PAGE = 25;

export const HUMAN_REQUEST_KEYWORDS = [
  'real person',
  'talk to someone',
  'speak to someone',
  'human',
  'let me speak',
  'talk to a person',
  'real human',
  'operator',
  'representative',
];

export const CONSENT_DISCLOSURE = 'This call may be recorded for quality purposes.';
