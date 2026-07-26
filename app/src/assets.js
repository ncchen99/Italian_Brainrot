export const uiImages = {
  loginBackground: '/assets/images/background1.webp',
  levelBackground: '/assets/images/background2.webp',
  logo: '/assets/images/big-logo.webp',
  burgerVillain: '/assets/images/burger-villain.webp',
  synthesizer: '/assets/images/synthesizer-machine.webp',
  ultimatePizza: '/assets/images/ultimate-margherita-pizza.webp',
  wifiFragments: '/assets/images/wifi-fragments.webp',
  wifiBlue: '/assets/images/wifi-blue.webp',
  wifiRed: '/assets/images/wifi-red.webp',
};

export const ingredientImages = {
  flour: '/assets/images/flour-bag.svg',
  tomato: '/assets/images/tomato.svg',
  water: '/assets/images/water-bottle.svg',
  cheese: '/assets/images/cheese-wheel.svg',
  basil: '/assets/images/basil-leaf.svg',
  premiumFlour: '/assets/images/premium-flour.webp',
  holyTomato: '/assets/images/holy-tomato.webp',
  pureSpringWater: '/assets/images/pure-spring-water.webp',
  richParmesanCheese: '/assets/images/rich-parmesan-cheese.webp',
  magicBasilLeaf: '/assets/images/magic-basil-leaf.webp',
};

export const characterAssets = {
  level1: {
    name: 'Cappuccino Assassino',
    image: '/assets/images/characters/cappuccino-assassino.webp',
    voice: '/assets/sound/characters/cappuccino-assassino/cappuccino-assassino.mp3',
  },
  level2: {
    name: 'Ballerina Cappuccina',
    image: '/assets/images/characters/ballerina-cappuccina.webp',
    voice: '/assets/sound/characters/ballerina-cappuccina/ballerinacappuccina.mp3',
  },
  level3: {
    name: 'Brr Brr Patapim',
    image: '/assets/images/characters/brr-brr-patapim.webp',
    voice: '/assets/sound/characters/brr-brr-patapim/brr-brr-patapim.mp3',
  },
  level4: {
    name: 'Bombardilo Crocodilo',
    image: '/assets/images/characters/bombardilo-crocodilo.webp',
    voice: '/assets/sound/characters/bombardilo-crocodilo/bombardiro.mp3',
  },
  level5: {
    name: 'Lirili Larila',
    image: '/assets/images/characters/lirili-larila.webp',
    voice: '/assets/sound/characters/lirili-larila/lirili-larila.mp3',
  },
  level6: {
    name: 'Tung Tung Tung Sahur',
    image: '/assets/images/characters/tung-tung-tung-sahur.webp',
    voice: '/assets/sound/characters/tung-tung-tung-sahur/tung-tung-tung-sahur.mp3',
  },
  level7: {
    name: 'Tralalero Tralala',
    image: '/assets/images/characters/tralalero-tralala.webp',
    voice: '/assets/sound/characters/tralalero-tralala/tralalero.mp3',
  },
};

// Character intro voice-overs, one recording per language.
// Paths are spelled out literally because Vite can only fingerprint and bundle
// `new URL(...)` assets when the specifier is a static string.
// The en/ and ar/ files are produced by scripts/generate-character-voices.mjs.
const introVoices = {
  'zh-TW': {
    level1: new URL('../../assets/intro_audio/Cappuccino Assassino.mp3', import.meta.url).href,
    level2: new URL('../../assets/intro_audio/Ballerina Cappuccina.mp3', import.meta.url).href,
    level3: new URL('../../assets/intro_audio/Brr Brr Patapim.mp3', import.meta.url).href,
    level4: new URL('../../assets/intro_audio/Bombardilo Crocodilo.mp3', import.meta.url).href,
    level5: new URL('../../assets/intro_audio/Lirili Larila.mp3', import.meta.url).href,
    level6: new URL('../../assets/intro_audio/Tung Tung Tung Sahur.mp3', import.meta.url).href,
    level7: new URL('../../assets/intro_audio/Tralalero Tralala.mp3', import.meta.url).href,
  },
  en: {
    level1: new URL('../../assets/intro_audio/en/cappuccino-assassino.mp3', import.meta.url).href,
    level2: new URL('../../assets/intro_audio/en/ballerina-cappuccina.mp3', import.meta.url).href,
    level3: new URL('../../assets/intro_audio/en/brr-brr-patapim.mp3', import.meta.url).href,
    level4: new URL('../../assets/intro_audio/en/bombardilo-crocodilo.mp3', import.meta.url).href,
    level5: new URL('../../assets/intro_audio/en/lirili-larila.mp3', import.meta.url).href,
    level6: new URL('../../assets/intro_audio/en/tung-tung-tung-sahur.mp3', import.meta.url).href,
    level7: new URL('../../assets/intro_audio/en/tralalero-tralala.mp3', import.meta.url).href,
  },
  ar: {
    level1: new URL('../../assets/intro_audio/ar/cappuccino-assassino.mp3', import.meta.url).href,
    level2: new URL('../../assets/intro_audio/ar/ballerina-cappuccina.mp3', import.meta.url).href,
    level3: new URL('../../assets/intro_audio/ar/brr-brr-patapim.mp3', import.meta.url).href,
    level4: new URL('../../assets/intro_audio/ar/bombardilo-crocodilo.mp3', import.meta.url).href,
    level5: new URL('../../assets/intro_audio/ar/lirili-larila.mp3', import.meta.url).href,
    level6: new URL('../../assets/intro_audio/ar/tung-tung-tung-sahur.mp3', import.meta.url).href,
    level7: new URL('../../assets/intro_audio/ar/tralalero-tralala.mp3', import.meta.url).href,
  },
};

export const INTRO_VOICE_FALLBACK_LANG = 'zh-TW';

/**
 * Resolves the intro voice-over for a character in the requested language.
 * Regional tags collapse to their base language ("en-GB" -> "en") and anything
 * we have not recorded falls back to the original Chinese track.
 */
export function getIntroVoice(characterId, language) {
  const base = String(language || '').split('-')[0];
  const pack =
    introVoices[language] ||
    (base === 'zh' ? introVoices['zh-TW'] : introVoices[base]) ||
    introVoices[INTRO_VOICE_FALLBACK_LANG];
  return pack[characterId] || pack.level1;
}

export const sfx = {
  click: '/assets/sound/sfx/click.mp3',
  success: '/assets/sound/sfx/success.mp3',
  fail: '/assets/sound/sfx/fail.mp3',
  cardReveal: '/assets/sound/sfx/card-reveal.mp3',
  balloonInflate: '/assets/sound/sfx/balloon-inflate.mp3',
  balloonPop: '/assets/sound/sfx/balloon-pop.mp3',
  countdownTick: '/assets/sound/sfx/countdown-tick.mp3',
  confetti: '/assets/sound/sfx/confetti.mp3',
  cooldownBuzz: '/assets/sound/sfx/cooldown-buzz.mp3',
};
