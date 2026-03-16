const SCAN_CODE_ROUTES = {
  // 7 character levels
  'IBR-2026-L1-CAPU-9X2K': '/intro/level1',
  'IBR-2026-L2-BALL-4M7Q': '/intro/level2',
  'IBR-2026-L3-PATA-8R1D': '/intro/level3',
  'IBR-2026-L4-BOMB-2V6N': '/intro/level4',
  'IBR-2026-L5-LIRI-7H3P': '/intro/level5',
  'IBR-2026-L6-TUNG-5C8W': '/intro/level6',
  'IBR-2026-L7-TRAL-1J9F': '/intro/level7',
  // level 8: synthesizer
  'IBR-2026-L8-SYNT-3T4Y': '/synthesis',
};

const SCAN_CODE_ALIASES = {
  '1': 'IBR-2026-L1-CAPU-9X2K',
  '2': 'IBR-2026-L2-BALL-4M7Q',
  '3': 'IBR-2026-L3-PATA-8R1D',
  '4': 'IBR-2026-L4-BOMB-2V6N',
  '5': 'IBR-2026-L5-LIRI-7H3P',
  '6': 'IBR-2026-L6-TUNG-5C8W',
  '7': 'IBR-2026-L7-TRAL-1J9F',
  '8': 'IBR-2026-L8-SYNT-3T4Y',
};

export const SCAN_CODE_LIST = [
  { stage: 'Level 1', character: 'Cappuccino Assassino', code: 'IBR-2026-L1-CAPU-9X2K', route: '/intro/level1' },
  { stage: 'Level 2', character: 'Ballerina Cappuccina', code: 'IBR-2026-L2-BALL-4M7Q', route: '/intro/level2' },
  { stage: 'Level 3', character: 'Brr Brr Patapim', code: 'IBR-2026-L3-PATA-8R1D', route: '/intro/level3' },
  { stage: 'Level 4', character: 'Bombardilo Crocodilo', code: 'IBR-2026-L4-BOMB-2V6N', route: '/intro/level4' },
  { stage: 'Level 5', character: 'Lirili Larila', code: 'IBR-2026-L5-LIRI-7H3P', route: '/intro/level5' },
  { stage: 'Level 6', character: 'Tung Tung Tung Sahur', code: 'IBR-2026-L6-TUNG-5C8W', route: '/intro/level6' },
  { stage: 'Level 7', character: 'Tralalero Tralala', code: 'IBR-2026-L7-TRAL-1J9F', route: '/intro/level7' },
  { stage: 'Synthesis', character: 'Synthesis Station', code: 'IBR-2026-L8-SYNT-3T4Y', route: '/synthesis' },
];

export function getRouteByScanCode(rawCode) {
  const normalized = String(rawCode || '').trim().toUpperCase();
  if (!normalized) return null;

  const expandedCode = SCAN_CODE_ALIASES[normalized] || normalized;
  return SCAN_CODE_ROUTES[expandedCode] || null;
}
