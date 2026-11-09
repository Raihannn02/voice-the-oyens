import React, { useState } from 'react';
import {
  Volume2,
  Hash,
  Mic,
  MicOff,
  Headphones,
  Settings,
  PhoneOff,
  Radio,
  Share2,
  Check,
  Sparkles,
  Plus,
  X,
  Pencil,
  Trash,
  Users,
  Crown,
  Info,
} from 'lucide-react';
import RoleBadge from './RoleBadge';
import { isDisplayableRole } from '../utils/roles';

export default function Sidebar({
  profile,
  activeTextChannel,
  setActiveTextChannel,
  activeVoiceChannel,
  joinVoiceChannel,
  leaveVoiceChannel,
  isMuted,
  toggleMute,
  isDeafened,
  toggleDeafen,
  openSettings,
  peers,
  isSpeaking,
  isMobileOpen,
  closeMobileSidebar,
  textChannels,
  voiceChannels,
  canManageChannels,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
  onOpenMembers,
  memberCount,
  selfRole,
}) {
  const [copied, setCopied] = useState(false);
  const [channelModal, setChannelModal] = useState(null); // { mode, type, id?, name, description }
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name }

  const isOwnerProfile = selfRole?.id === 'owner';

  const copyInvite = () => {
    const url =
      window.location.origin + window.location.pathname + `?room=${activeVoiceChannel || 'voice-utama'}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openCreateChannel = (type) => {
    setChannelModal({ mode: 'create', type, name: '', description: '' });
  };

  const openEditChannel = (type, ch) => {
    setChannelModal({
      mode: 'edit',
      type,
      id: ch.id,
      name: ch.name,
      description: (type === 'voice' ? ch.desc : ch.topic) || '',
    });
  };

  const submitChannel = (e) => {
    e.preventDefault();
    if (!channelModal) return;
    const name = channelModal.name.trim();
    if (!name) return;

    if (channelModal.mode === 'create') {
      const created = onCreateChannel({
        type: channelModal.type,
        name,
        description: channelModal.description.trim(),
      });
      if (created) {
        if (channelModal.type === 'voice') joinVoiceChannel(created.id);
        else setActiveTextChannel(created.id);
      }
    } else {
      onUpdateChannel(
        channelModal.type,
        channelModal.id,
        channelModal.type === 'voice'
          ? { name, desc: channelModal.description.trim() }
          : { name, topic: channelModal.description.trim() }
      );
    }
    setChannelModal(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteChannel(deleteTarget.type, deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const connectedPeersList = Array.from(peers.entries());

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`w-64 bg-[#2b2d31] flex flex-col h-full border-r border-[#1f2023] shrink-0 select-none transition-transform duration-200 z-40 fixed md:static inset-y-0 left-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Server Header */}
        <div className="h-14 px-3 border-b border-[#1f2023] flex items-center justify-between shadow-xs bg-[#2b2d31]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-lg shadow-md shadow-orange-500/20 shrink-0">
              🐱
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                The Oyens
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              </h1>
              <p className="text-[11px] text-[#949ba4] truncate flex items-center gap-1">
                {isOwnerProfile ? (
                  <>
                    <Crown className="w-3 h-3 text-amber-400" /> Owner Panel
                  </>
                ) : (
                  'Voice & ShareScreen'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onOpenMembers}
              title="Anggota & Role"
              className="relative p-1.5 rounded-md hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                {memberCount}
              </span>
            </button>
            <button
              onClick={copyInvite}
              title="Salin Link Invite Room"
              className="p-1.5 rounded-md hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={closeMobileSidebar}
              className="p-1.5 rounded-md hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channels Scroll Area */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Text Channels Category */}
          <div>
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
              <span>Text Channels</span>
              {canManageChannels && (
                <button
                  onClick={() => openCreateChannel('text')}
                  title="Tambah Text Channel"
                  className="hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {textChannels.map((ch) => {
                const isActive = activeTextChannel === ch.id;
                return (
                  <div key={ch.id} className="relative group/ch">
                    <button
                      onClick={() => {
                        setActiveTextChannel(ch.id);
                        closeMobileSidebar?.();
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        canManageChannels ? 'pr-14' : ''
                      } ${
                        isActive
                          ? 'bg-[#404249] text-white'
                          : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                      <span className="truncate">{ch.name}</span>
                    </button>
                    {canManageChannels && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/ch:flex items-center gap-0.5 rounded-md bg-[#2b2d31]/95 pl-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChannel('text', ch);
                          }}
                          title="Edit channel"
                          className="p-1 rounded hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ type: 'text', id: ch.id, name: ch.name });
                          }}
                          title="Hapus channel"
                          className="p-1 rounded hover:bg-red-500/20 text-[#b5bac1] hover:text-red-400 transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Channels Category */}
          <div>
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
              <span>Voice & Screen</span>
              {canManageChannels && (
                <button
                  onClick={() => openCreateChannel('voice')}
                  title="Tambah Voice Channel"
                  className="hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              {voiceChannels.map((vc) => {
                const isConnected = activeVoiceChannel === vc.id;
                return (
                  <div key={vc.id} className="space-y-0.5">
                    <div className="relative group/vc">
                      <button
                        onClick={() => {
                          if (!isConnected) {
                            joinVoiceChannel(vc.id);
                          }
                          closeMobileSidebar?.();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          canManageChannels ? 'pr-14' : ''
                        } ${
                          isConnected
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Volume2
                            className={`w-4 h-4 shrink-0 ${
                              isConnected ? 'text-orange-400' : 'text-[#80848e]'
                            }`}
                          />
                          <span className="truncate">{vc.name}</span>
                        </div>
                        {isConnected && (
                          <span className="flex h-2 w-2 relative shrink-0 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </button>
                      {canManageChannels && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/vc:flex items-center gap-0.5 rounded-md bg-[#2b2d31]/95 pl-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditChannel('voice', vc);
                            }}
                            title="Edit channel"
                            className="p-1 rounded hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ type: 'voice', id: vc.id, name: vc.name });
                            }}
                            title="Hapus channel"
                            className="p-1 rounded hover:bg-red-500/20 text-[#b5bac1] hover:text-red-400 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Connected Users in this Voice Channel */}
                    {isConnected && (
                      <div className="pl-5 pr-2 py-1 space-y-1">
                        {/* Self */}
                        <div className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-[#35373c]/50 text-xs text-[#dbdee1]">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-tr ${profile.bg} flex items-center justify-center text-[11px] border ${
                              isSpeaking ? 'speaking-ring' : 'border-transparent'
                            }`}
                          >
                            {profile.emoji}
                          </div>
                          <span className="truncate font-medium">{profile.name} (Anda)</span>
                          <span className="ml-auto flex items-center gap-1 shrink-0">
                            {isDisplayableRole(selfRole) && <RoleBadge role={selfRole} />}
                            {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                          </span>
                        </div>

                        {/* Remote Peers */}
                        {connectedPeersList.map(([peerId, p]) => (
                          <div
                            key={peerId}
                            className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-[#35373c]/50 text-xs text-[#dbdee1]"
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${
                                p.profile?.bg || 'from-gray-600 to-gray-700'
                              } flex items-center justify-center text-[11px] border ${
                                p.isSpeaking ? 'speaking-ring' : 'border-transparent'
                              }`}
                            >
                              {p.profile?.emoji || '🐱'}
                            </div>
                            <span className="truncate">{p.profile?.name || 'Oyen Guest'}</span>
                            <span className="ml-auto flex items-center gap-1 shrink-0">
                              {isDisplayableRole(p.profile?.role) && (
                                <RoleBadge role={p.profile.role} />
                              )}
                              {p.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Voice Connected Pill */}
        {activeVoiceChannel && (
          <div className="bg-[#232428] px-3 py-2 border-t border-[#1f2023] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-4 h-4 text-green-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  Voice Connected
                </div>
                <div className="text-[11px] text-[#949ba4] truncate max-w-[120px]">
                  {voiceChannels.find((v) => v.id === activeVoiceChannel)?.name || activeVoiceChannel}
                </div>
              </div>
            </div>
            <button
              onClick={leaveVoiceChannel}
              title="Putus Suara"
              className="p-1.5 rounded-md hover:bg-red-500/20 text-[#b5bac1] hover:text-red-400 transition-colors shrink-0"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Footer */}
        <div className="h-[56px] bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
          <div
            onClick={openSettings}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-[#35373c] cursor-pointer flex-1 min-w-0 mr-1"
          >
            <div className="relative shrink-0">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${profile.bg} flex items-center justify-center text-sm shadow-inner`}
              >
                {profile.emoji}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#232428] rounded-full"></span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                {isOwnerProfile && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                <span className="truncate">{profile.name}</span>
              </div>
              <div className="mt-0.5">
                {isDisplayableRole(selfRole) ? (
                  <RoleBadge role={selfRole} />
                ) : (
                  <span className="text-[10px] text-[#949ba4] truncate">{profile.tag}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
              className={`p-1.5 rounded-md transition-colors ${
                isMuted
                  ? 'text-red-400 hover:bg-red-500/20'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleDeafen}
              title={isDeafened ? 'Nyalakan Audio' : 'Deafen (Matikan Suara Semua)'}
              className={`p-1.5 rounded-md transition-colors ${
                isDeafened
                  ? 'text-red-400 hover:bg-red-500/20'
                  : 'text-[#b5bac1] hover:bg-[#35373c] hover:text-white'
              }`}
            >
              <Headphones className={`w-4 h-4 ${isDeafened ? 'line-through text-red-400' : ''}`} />
            </button>

            <button
              onClick={openSettings}
              title="Pengaturan"
              className="p-1.5 rounded-md text-[#b5bac1] hover:bg-[#35373c] hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Channel Create / Edit Modal */}
      {channelModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setChannelModal(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitChannel}
            className="modal-pop bg-[#313338] w-full max-w-sm rounded-2xl border border-[#1f2023] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {channelModal.mode === 'create' ? 'Buat Channel Baru' : 'Edit Channel'}
              </h3>
              <button
                type="button"
                onClick={() => setChannelModal(null)}
                className="text-[#949ba4] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {channelModal.mode === 'create' && (
              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] uppercase mb-1">
                  Tipe Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannelModal((p) => ({ ...p, type: 'voice' }))}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      channelModal.type === 'voice'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-[#2b2d31] bg-[#1e1f22] text-[#949ba4]'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelModal((p) => ({ ...p, type: 'text' }))}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      channelModal.type === 'text'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-[#2b2d31] bg-[#1e1f22] text-[#949ba4]'
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    Text
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] uppercase mb-1">
                Nama Channel
              </label>
              <input
                type="text"
                value={channelModal.name}
                onChange={(e) => setChannelModal((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: oyen-santai"
                autoFocus
                className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] uppercase mb-1">
                {channelModal.type === 'voice' ? 'Deskripsi' : 'Topik'}
              </label>
              <input
                type="text"
                value={channelModal.description}
                onChange={(e) => setChannelModal((p) => ({ ...p, description: e.target.value }))}
                placeholder="Opsional..."
                className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChannelModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b5bac1] hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!channelModal.name.trim()}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md"
              >
                {channelModal.mode === 'create' ? 'Buat Channel' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-pop bg-[#313338] w-full max-w-sm rounded-2xl border border-[#1f2023] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hapus Channel?</h3>
                <p className="text-xs text-[#949ba4] mt-1">
                  Channel{' '}
                  <span className="text-[#dbdee1] font-semibold">
                    {deleteTarget.type === 'text' ? '#' : '🔊'} {deleteTarget.name}
                  </span>{' '}
                  akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            {((deleteTarget.type === 'text' ? textChannels : voiceChannels) || []).length <= 1 && (
              <div className="flex items-start gap-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Minimal harus tersisa 1 channel {deleteTarget.type === 'text' ? 'text' : 'voice'}.
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b5bac1] hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
