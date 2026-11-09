import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  Palette,
  Plus,
  Pencil,
  Trash,
  Check,
  Crown,
  KeyRound,
  UserPlus,
  Search,
  Info,
} from 'lucide-react';
import RoleBadge from './RoleBadge';
import {
  PERMISSION_LABELS,
  ROLE_COLOR_PRESETS,
  ROLE_EMOJI_PRESETS,
} from '../utils/roles';

const EMPTY_FORM = {
  name: '',
  color: ROLE_COLOR_PRESETS[0],
  emoji: ROLE_EMOJI_PRESETS[0],
  permissions: [],
};

export default function MembersRolesModal({
  isOpen,
  onClose,
  profile,
  selfRole,
  members,
  roles,
  canManageRoles,
  onAssignRole,
  onAddMember,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}) {
  const [tab, setTab] = useState('members');
  const [search, setSearch] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      setTab('members');
      setSearch('');
      setRoleForm(EMPTY_FORM);
      setEditingRoleId(null);
      setShowRoleForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function resetRoleForm() {
    setRoleForm(EMPTY_FORM);
    setEditingRoleId(null);
    setShowRoleForm(false);
  }

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSubmitRole = (e) => {
    e.preventDefault();
    const clean = roleForm.name.trim();
    if (!clean) return;
    if (editingRoleId) {
      onUpdateRole(editingRoleId, {
        name: clean.slice(0, 20),
        color: roleForm.color,
        emoji: roleForm.emoji,
        permissions: roleForm.permissions,
      });
    } else {
      onCreateRole({
        name: clean.slice(0, 20),
        color: roleForm.color,
        emoji: roleForm.emoji,
        permissions: roleForm.permissions,
      });
    }
    resetRoleForm();
  };

  const handleEditRole = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      color: role.color,
      emoji: role.emoji || ROLE_EMOJI_PRESETS[0],
      permissions: role.permissions || [],
    });
    setShowRoleForm(true);
  };

  const togglePermission = (perm) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    const clean = newMemberName.trim();
    if (!clean) return;
    onAddMember(clean);
    setNewMemberName('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-pop bg-[#313338] w-full max-w-2xl rounded-2xl border border-[#1f2023] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2023] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">Anggota & Role</h3>
              <p className="text-[11px] text-[#949ba4]">
                {members.filter((m) => m.online).length} online · {members.length} total anggota
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={selfRole} size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#35373c] text-[#b5bac1] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 flex items-center gap-2 border-b border-[#1f2023] bg-[#2b2d31]">
          <TabButton active={tab === 'members'} onClick={() => setTab('members')} icon={Users}>
            Anggota
          </TabButton>
          <TabButton active={tab === 'roles'} onClick={() => setTab('roles')} icon={ShieldCheck}>
            Role
          </TabButton>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!canManageRoles && (
            <div className="flex items-start gap-2 text-[11px] text-[#949ba4] bg-[#2b2d31] border border-[#1f2023] rounded-xl px-3 py-2.5">
              <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Hanya <span className="text-orange-400 font-semibold">Owner</span> yang dapat mengelola channel
                dan role. Kamu hanya bisa melihat daftar anggota.
              </span>
            </div>
          )}

          {tab === 'members' ? (
            <>
              {/* Search + Add */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 flex-1 focus-within:border-orange-500/60 transition-colors">
                  <Search className="w-4 h-4 text-[#80848e] shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari anggota..."
                    className="bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none w-full"
                  />
                </div>
                {canManageRoles && (
                  <form onSubmit={handleAddMember} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 focus-within:border-orange-500/60 transition-colors">
                      <UserPlus className="w-4 h-4 text-[#80848e] shrink-0" />
                      <input
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Nama teman..."
                        className="bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none w-32"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMemberName.trim()}
                      className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white transition-colors"
                      title="Tambah teman ke daftar"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* Member list */}
              <div className="space-y-1.5">
                {filteredMembers.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center gap-3 bg-[#2b2d31] border border-[#1f2023] hover:border-[#3b3e45] rounded-xl px-3 py-2.5 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-tr ${
                          m.bg || 'from-gray-600 to-gray-700'
                        } flex items-center justify-center text-base`}
                      >
                        {m.emoji || '🐱'}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
                          m.online ? 'bg-green-500' : 'bg-[#6b7280]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{m.name}</span>
                        {m.isSelf && <span className="text-[10px] text-[#949ba4]">(Anda)</span>}
                        {m.isOwnerUser && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="mt-0.5">
                        <RoleBadge role={m.role} size="xs" />
                      </div>
                    </div>

                    {canManageRoles && !m.isOwnerUser && (
                      <select
                        value={m.roleId || 'member'}
                        onChange={(e) => onAssignRole(m, e.target.value)}
                        className="bg-[#1e1f22] border border-[#2b2d31] rounded-lg px-2 py-1.5 text-xs text-[#dbdee1] focus:outline-none focus:border-orange-500 cursor-pointer max-w-[130px]"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.emoji} {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}

                {filteredMembers.length === 0 && (
                  <p className="text-center text-xs text-[#949ba4] py-6">Tidak ada anggota ditemukan.</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Roles header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#b5bac1] uppercase tracking-wider">
                  <Palette className="w-4 h-4 text-orange-400" />
                  Daftar Role
                </div>
                {canManageRoles && (
                  <button
                    onClick={() => {
                      resetRoleForm();
                      setShowRoleForm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Buat Role
                  </button>
                )}
              </div>

              {/* Role form */}
              {showRoleForm && canManageRoles && (
                <form
                  onSubmit={handleSubmitRole}
                  className="bg-[#2b2d31] border border-orange-500/30 rounded-xl p-4 space-y-3.5"
                >
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    {editingRoleId ? 'Edit Role' : 'Role Baru'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#b5bac1] uppercase mb-1">
                        Nama Role
                      </label>
                      <input
                        value={roleForm.name}
                        onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Contoh: Sultan Oyen"
                        maxLength={20}
                        className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#b5bac1] uppercase mb-1">
                        Ikon Role
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ROLE_EMOJI_PRESETS.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setRoleForm((p) => ({ ...p, emoji: em }))}
                            className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all ${
                              roleForm.emoji === em
                                ? 'border-orange-500 bg-orange-500/15 scale-105'
                                : 'border-[#1f2023] bg-[#1e1f22] hover:border-[#404249]'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#b5bac1] uppercase mb-1">
                      Warna Role
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {ROLE_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            roleForm.color === c
                              ? 'border-white scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                        >
                          {roleForm.color === c && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={roleForm.color}
                        onChange={(e) => setRoleForm((p) => ({ ...p, color: e.target.value }))}
                        className="w-7 h-7 rounded-full bg-transparent border border-[#404249] cursor-pointer"
                        title="Warna kustom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#b5bac1] uppercase mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Izin
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_LABELS).map(([perm, label]) => {
                        const checked = roleForm.permissions.includes(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePermission(perm)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                              checked
                                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                : 'border-[#1f2023] bg-[#1e1f22] text-[#949ba4] hover:border-[#404249]'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                checked ? 'bg-orange-500 border-orange-500' : 'border-[#404249]'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </span>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                    Preview:
                    <RoleBadge role={roleForm} size="sm" />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetRoleForm}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b5bac1] hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!roleForm.name.trim()}
                      className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold"
                    >
                      {editingRoleId ? 'Simpan Role' : 'Tambahkan Role'}
                    </button>
                  </div>
                </form>
              )}

              {/* Roles list */}
              <div className="space-y-1.5">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 bg-[#2b2d31] border border-[#1f2023] rounded-xl px-3 py-2.5"
                  >
                    <RoleBadge role={r} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-[#949ba4] truncate">
                        {r.description || 'Role custom'}
                      </div>
                      {r.permissions?.length > 0 && (
                        <div className="text-[10px] text-[#6b7280] truncate mt-0.5">
                          {r.permissions.map((p) => PERMISSION_LABELS[p]).join(' · ')}
                        </div>
                      )}
                    </div>

                    {r.builtin ? (
                      <span className="text-[10px] font-semibold text-[#6b7280] uppercase shrink-0">
                        Bawaan
                      </span>
                    ) : (
                      canManageRoles && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditRole(r)}
                            title="Edit role"
                            className="p-1.5 rounded-lg hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRole(r.id)}
                            title="Hapus role"
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#b5bac1] hover:text-red-400 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2023] bg-[#2b2d31] flex items-center justify-between">
          <span className="text-[11px] text-[#949ba4]">
            Login sebagai <span className="text-[#dbdee1] font-semibold">{profile.name}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#404249] hover:bg-[#4e5058] text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-orange-500 text-white'
          : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}
