// Penyimpanan daftar channel (persisten di browser).

const CHANNELS_KEY = 'voice_the_oyens_channels';

export const DEFAULT_TEXT_CHANNELS = [
  { id: 'ngobrol-santai', name: 'ngobrol-santai', topic: 'Tempat santai para oyen' },
  { id: 'share-meme', name: 'share-meme', topic: 'Bagi-bagi meme & gambar lucu' },
  { id: 'bot-perintah', name: 'bot-perintah', topic: 'Command dan info server' },
];

export const DEFAULT_VOICE_CHANNELS = [
  { id: 'voice-utama', name: 'Voice Oyen Utama', desc: 'Ruang ngobrol utama' },
  { id: 'ruang-mabar', name: 'Ruang Mabar Gaming', desc: 'Squad & party game' },
  { id: 'stage-nonton', name: 'Stage Nonton Bareng', desc: 'Screen share & streaming' },
];

export function loadChannels() {
  try {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.text) && Array.isArray(parsed?.voice)) {
        return {
          text: parsed.text.length ? parsed.text : DEFAULT_TEXT_CHANNELS,
          voice: parsed.voice,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load channels', err);
  }
  return { text: DEFAULT_TEXT_CHANNELS, voice: DEFAULT_VOICE_CHANNELS };
}

export function saveChannels(channels) {
  try {
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
  } catch (err) {
    console.error('Failed to save channels', err);
  }
}

export function slugifyChannel(name, fallbackPrefix = 'channel') {
  const id = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return id || `${fallbackPrefix}-${Date.now().toString(36)}`;
}

export function makeUniqueChannelId(baseId, pool) {
  let id = baseId;
  let n = 2;
  const taken = new Set((pool || []).map((c) => c.id));
  while (taken.has(id)) {
    id = `${baseId}-${n}`;
    n += 1;
  }
  return id;
}
