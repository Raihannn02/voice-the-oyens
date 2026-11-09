// Presets and local persistence for User Profiles

export const OYEN_AVATARS = [
  { id: 'cat-barbar', emoji: '🐱', name: 'Oyen Barbar', bg: 'from-orange-500 to-amber-600' },
  { id: 'cat-tiger', emoji: '🐯', name: 'Oyen Belang', bg: 'from-amber-600 to-yellow-600' },
  { id: 'cat-cool', emoji: '😼', name: 'Oyen Cool', bg: 'from-orange-600 to-red-600' },
  { id: 'cat-love', emoji: '😻', name: 'Oyen Bucin', bg: 'from-pink-500 to-rose-600' },
  { id: 'cat-sunglasses', emoji: '😎', name: 'Oyen Bos', bg: 'from-yellow-500 to-amber-700' },
  { id: 'cat-coder', emoji: '🧑‍💻', name: 'Oyen Koding', bg: 'from-blue-500 to-indigo-600' },
  { id: 'cat-music', emoji: '🎧', name: 'Oyen DJ', bg: 'from-purple-500 to-indigo-700' },
  { id: 'cat-gamer', emoji: '🎮', name: 'Oyen Mabar', bg: 'from-emerald-500 to-teal-700' },
];

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem('voice_the_oyens_profile');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse stored profile', err);
  }

  // Generate random default
  const randAvatar = OYEN_AVATARS[Math.floor(Math.random() * OYEN_AVATARS.length)];
  const randTag = Math.floor(1000 + Math.random() * 9000);
  const newProfile = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    name: `${randAvatar.name.split(' ')[1]}_${randTag}`,
    avatarId: randAvatar.id,
    emoji: randAvatar.emoji,
    bg: randAvatar.bg,
    tag: `#${randTag}`,
  };

  try {
    localStorage.setItem('voice_the_oyens_profile', JSON.stringify(newProfile));
  } catch {}

  return newProfile;
}

export function saveProfile(profile) {
  try {
    localStorage.setItem('voice_the_oyens_profile', JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}
