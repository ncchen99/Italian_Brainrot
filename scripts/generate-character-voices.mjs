/**
 * Generates the character intro voice-overs with the ElevenLabs TTS API.
 *
 * The dialogue text is taken straight from the locale files, so the audio can
 * never drift away from what the typewriter effect prints on screen.
 *
 * Usage:
 *   node scripts/generate-character-voices.mjs                 # missing files only
 *   node scripts/generate-character-voices.mjs --lang ar        # one language
 *   node scripts/generate-character-voices.mjs --force          # regenerate everything
 *   node scripts/generate-character-voices.mjs --list-voices    # probe usable voices
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const localesDir = path.join(projectRoot, 'app', 'src', 'locales');
const outputRoot = path.join(projectRoot, 'assets', 'intro_audio');

const API_BASE = 'https://api.elevenlabs.io/v1';

// eleven_multilingual_v2 is the highest quality model that covers both English
// and Arabic. flash/turbo v2.5 are faster but noticeably flatter, and this audio
// is baked in once rather than streamed.
const MODEL_ID = 'eleven_multilingual_v2';

// Voice cast. Every character gets a distinct voice, and the same voice carries
// across languages so a character still sounds like themselves after a switch.
// Voice settings are tuned per personality: low stability = more emotional swing.
const CAST = [
  {
    id: 'level1',
    slug: 'cappuccino-assassino',
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    voiceName: 'Callum',
    persona: 'hoarse, conspiratorial shadow assassin',
    settings: { stability: 0.35, similarity_boost: 0.8, style: 0.55 },
  },
  {
    id: 'level2',
    slug: 'ballerina-cappuccina',
    voiceId: 'cgSgspJ2msm6clMCkdW9',
    voiceName: 'Jessica',
    persona: 'bratty, melodramatic ballerina',
    settings: { stability: 0.3, similarity_boost: 0.75, style: 0.6 },
  },
  {
    id: 'level3',
    slug: 'brr-brr-patapim',
    voiceId: 'bIHbv24MWmeRgasZH58o',
    voiceName: 'Will',
    persona: 'flustered, pleading goofball',
    settings: { stability: 0.35, similarity_boost: 0.75, style: 0.5 },
  },
  {
    id: 'level4',
    slug: 'bombardilo-crocodilo',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    voiceName: 'Adam',
    persona: 'gloating crocodile bomber',
    settings: { stability: 0.4, similarity_boost: 0.8, style: 0.6 },
  },
  {
    id: 'level5',
    slug: 'lirili-larila',
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    voiceName: 'Lily',
    persona: 'parched, weary desert wanderer',
    settings: { stability: 0.4, similarity_boost: 0.75, style: 0.45 },
  },
  {
    id: 'level6',
    slug: 'tung-tung-tung-sahur',
    voiceId: 'pqHfZKP75CvOlQylNhV4',
    voiceName: 'Bill',
    persona: 'heavy, earnest wooden gorilla',
    settings: { stability: 0.5, similarity_boost: 0.8, style: 0.35 },
  },
  {
    id: 'level7',
    slug: 'tralalero-tralala',
    voiceId: 'SOYHLrjzK2X1ezoPC6cr',
    voiceName: 'Harry',
    persona: 'hyped-up, furious sneakerhead shark',
    settings: { stability: 0.28, similarity_boost: 0.75, style: 0.7 },
  },
];

const LANGUAGES = ['en', 'ar'];

function loadApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();

  const envPath = path.join(projectRoot, 'app', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('ELEVENLABS_API_KEY not set and app/.env not found.');
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() !== 'ELEVENLABS_API_KEY') continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }

  throw new Error('ELEVENLABS_API_KEY not found in app/.env.');
}

function parseArgs(argv) {
  const args = { force: false, listVoices: false, langs: LANGUAGES };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') args.force = true;
    else if (arg === '--list-voices') args.listVoices = true;
    else if (arg === '--lang') args.langs = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const unknown = args.langs.filter((lang) => !LANGUAGES.includes(lang));
  if (unknown.length) throw new Error(`Unsupported language(s): ${unknown.join(', ')}`);
  return args;
}

function readIntroTexts(lang) {
  const file = path.join(localesDir, `${lang}.json`);
  const locale = JSON.parse(fs.readFileSync(file, 'utf8'));
  const texts = {};
  for (const character of CAST) {
    const raw = locale?.intro?.[`${character.id}_text`];
    if (!raw) throw new Error(`Missing intro.${character.id}_text in ${lang}.json`);
    // Locale strings may carry markup for the UI; the TTS engine should not read it aloud.
    texts[character.id] = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return texts;
}

async function synthesize(apiKey, character, text) {
  const response = await fetch(`${API_BASE}/text-to-speech/${character.voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { ...character.settings, use_speaker_boost: true },
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed for ${character.slug} (${response.status}): ${await response.text()}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Lists the voices on the account and probes each one, because being listed is
 * not the same as being usable: `professional` (voice library) entries return
 * 402 on a free plan even once added to the account, while `premade` ones work.
 */
async function listVoices(apiKey) {
  const response = await fetch(`${API_BASE.replace('/v1', '/v2')}/voices?page_size=100`, {
    headers: { 'xi-api-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`Could not list voices (${response.status}): ${await response.text()}`);
  }

  const { voices = [] } = await response.json();
  console.log(`${voices.length} voices on this account. Probing which ones the plan allows...\n`);

  const usable = [];
  for (const voice of voices) {
    const probe = await fetch(`${API_BASE}/text-to-speech/${voice.voice_id}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hi.', model_id: MODEL_ID }),
    });
    await probe.arrayBuffer();
    if (probe.ok) usable.push(voice);

    const labels = voice.labels || {};
    const traits = [labels.language, labels.gender, labels.age, labels.accent, labels.descriptive]
      .filter(Boolean)
      .join(', ');
    console.log(
      `  ${probe.ok ? '✓' : '✗'} ${voice.voice_id}  ${String(voice.category).padEnd(12)} ` +
      `${voice.name.slice(0, 38).padEnd(38)} ${traits}`
    );
  }

  console.log(`\n${usable.length}/${voices.length} usable via API.`);
  const blocked = voices.length - usable.length;
  if (blocked > 0) {
    console.log(
      `${blocked} blocked — voice-library voices need a paid plan, even after adding them to the account.`
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = loadApiKey();

  if (args.listVoices) {
    await listVoices(apiKey);
    return;
  }

  let generated = 0;
  let skipped = 0;

  for (const lang of args.langs) {
    const texts = readIntroTexts(lang);
    const outputDir = path.join(outputRoot, lang);
    fs.mkdirSync(outputDir, { recursive: true });

    for (const character of CAST) {
      const outputPath = path.join(outputDir, `${character.slug}.mp3`);
      if (fs.existsSync(outputPath) && !args.force) {
        console.log(`skip  ${lang}/${character.slug}.mp3 (exists)`);
        skipped += 1;
        continue;
      }

      const text = texts[character.id];
      const audio = await synthesize(apiKey, character, text);
      fs.writeFileSync(outputPath, audio);
      generated += 1;
      console.log(
        `write ${lang}/${character.slug}.mp3  ${character.voiceName.padEnd(8)} ` +
        `${String(text.length).padStart(4)} chars  ${(audio.length / 1024).toFixed(0)} KB`
      );
    }
  }

  console.log(`\nDone. ${generated} generated, ${skipped} skipped.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
