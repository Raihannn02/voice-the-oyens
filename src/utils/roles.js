// Sistem Role & Permission untuk Voice The Oyens.
// Karena aplikasi berjalan sepenuhnya peer-to-peer (tanpa backend),
// konfigurasi role disimpan lokal di browser dan disebarkan ke kawan via P2P.

export const OWNER_NAME = 'HansWY';

const CUSTOM_ROLES_KEY = 'voice_the_oyens_custom_roles';
const ASSIGNMENTS_KEY = 'voice_the_oyens_role_assignments';

export const PERMISSION_LABELS = {
  manageChannels: 'Kelola Channel',
  manageRoles: 'Kelola Role',
  manageMessages: 'Kelola Pesan',
  kickMembers: 'Tendang Anggota',
};

export const BUILTIN_ROLES = [
  {
    id: 'owner',
    name: 'Owner',
    color: '#f59e0b',
    emoji: '👑',
    builtin: true,
    description: 'Pemilik server, akses penuh',
    permissions: ['manageChannels', 'manageRoles', 'manageMessages', 'kickMembers'],
  },
  {
    id: 'admin',
    name: 'Admin',
    color: '#ef4444',
    emoji: '🛡️',
    builtin: true,
    description: 'Administrator server',
    permissions: ['manageChannels', 'manageMessages'],
  },
  {
    id: 'moderator',
    name: 'Moderator',
    color: '#3b82f6',
    emoji: '🔨',
    builtin: true,
    description: 'Menjaga ketertiban obrolan',
    permissions: ['manageMessages'],
  },
  {
    id: 'member',
    name: 'Member',
    color: '#949ba4',
    emoji: '🐱',
    builtin: true,
    description: 'Anggota biasa',
    permissions: [],
  },
];

export const OWNER_ROLE = BUILTIN_ROLES[0];
export const MEMBER_ROLE = BUILTIN_ROLES[3];

export const ROLE_COLOR_PRESETS = [
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f97316',
  '#64748b',
];

export const ROLE_EMOJI_PRESETS = ['👑', '🛡️', '🔨', '⭐', '🐱', '🔥', '💎', '🚀', '🎮', '🎧', '🍕', '🍀'];

export function isOwnerName(name) {
  return String(name || '').trim().toLowerCase() === OWNER_NAME.trim().toLowerCase();
}

export function isOwner(profile) {
  return isOwnerName(profile?.name);
}

export function isDisplayableRole(role) {
  return !!role && role.id !== 'member';
}

export function getCustomRoles() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Failed to read custom roles', err);
  }
  return [];
}

export function saveCustomRoles(roles) {
  try {
    localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(roles || []));
  } catch (err) {
    console.error('Failed to save custom roles', err);
  }
}

export function getRoleAssignments() {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Failed to read role assignments', err);
  }
  return {};
}

export function saveRoleAssignments(map) {
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(map || {}));
  } catch (err) {
    console.error('Failed to save role assignments', err);
  }
}

export function getAllRoles(customRoles = getCustomRoles()) {
  return [...BUILTIN_ROLES, ...(customRoles || [])];
}

export function getRoleById(id, customRoles) {
  if (!id) return null;
  return getAllRoles(customRoles).find((r) => r.id === id) || null;
}

export function roleHasPermission(role, permission) {
  return Array.isArray(role?.permissions) && role.permissions.includes(permission);
}

export function getMemberKey(member) {
  if (!member) return null;
  if (member.id) return member.id;
  const name = String(member.name || '').trim().toLowerCase();
  return name ? `name:${name}` : null;
}

// Normalisasi data role yang datang dari kawan via P2P agar aman dirender.
export function sanitizeRole(role) {
  if (!role) return null;
  return {
    id: String(role.id || 'custom').slice(0, 40),
    name: String(role.name || 'Role').slice(0, 20),
    color: /^#[0-9a-fA-F]{6}$/.test(role.color) ? role.color : '#949ba4',
    emoji: String(role.emoji || '⭐').slice(0, 4),
    permissions: Array.isArray(role.permissions)
      ? role.permissions.filter((p) => p in PERMISSION_LABELS)
      : [],
    builtin: !!role.builtin,
  };
}

// Role efektif dari seorang anggota (hanya untuk keperluan tampilan & izin lokal).
export function resolveRole({ isOwnerUser, profileRole, assignedRoleId, customRoles }) {
  if (isOwnerUser) return OWNER_ROLE;
  if (profileRole && (profileRole.id || profileRole.name)) {
    return getRoleById(profileRole.id, customRoles) || sanitizeRole(profileRole);
  }
  return getRoleById(assignedRoleId, customRoles) || MEMBER_ROLE;
}
