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
  ChevronDown,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';

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

export const TEXT_CHANNELS = DEFAULT_TEXT_CHANNELS;
export const VOICE_CHANNELS = DEFAULT_VOICE_CHANNELS;

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
}) {
  const [copied, setCopied] = useState(false);
  const [textChannels, setTextChannels] = useState(DEFAULT_TEXT_CHANNELS);
  const [voiceChannels, setVoiceChannels] = useState(DEFAULT_VOICE_CHANNELS);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelType, setNewChannelType] = useState('voice'); // 'voice' or 'text'
  const [newChannelName, setNewChannelName] = useState('');

  const copyInvite = () => {
    const url = window.location.origin + window.location.pathname + `?room=${activeVoiceChannel || 'voice-utama'}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const id = newChannelName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24) || 'channel-' + Date.now();
    const name = newChannelName.trim();

    if (newChannelType === 'voice') {
      const updated = [...voiceChannels, { id, name, desc: 'Custom Voice Room' }];
      setVoiceChannels(updated);
      joinVoiceChannel(id);
    } else {
      const updated = [...textChannels, { id, name, topic: 'Custom Text Channel' }];
      setTextChannels(updated);
      setActiveTextChannel(id);
    }

    setNewChannelName('');
    setShowAddChannelModal(false);
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
        <div className="h-14 px-4 border-b border-[#1f2023] flex items-center justify-between shadow-xs bg-[#2b2d31] hover:bg-[#35373c] transition-colors cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              🐱
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                The Oyens
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              </h1>
              <p className="text-[11px] text-[#949ba4]">Voice & ShareScreen</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyInvite();
              }}
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
              <button
                onClick={() => {
                  setNewChannelType('text');
                  setShowAddChannelModal(true);
                }}
                title="Tambah Text Channel"
                className="hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {textChannels.map((ch) => {
                const isActive = activeTextChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveTextChannel(ch.id);
                      closeMobileSidebar?.();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#404249] text-white'
                        : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Channels Category */}
          <div>
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-[#949ba4] tracking-wider uppercase mb-1">
              <span>Voice & Screen Channels</span>
              <button
                onClick={() => {
                  setNewChannelType('voice');
                  setShowAddChannelModal(true);
                }}
                title="Tambah Voice Channel"
                className="hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {voiceChannels.map((vc) => {
                const isConnected = activeVoiceChannel === vc.id;
                return (
                  <div key={vc.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        if (!isConnected) {
                          joinVoiceChannel(vc.id);
                        }
                        closeMobileSidebar?.();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isConnected
                          ? 'bg-orange-500/15 text-orange-400'
                          : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Volume2 className={`w-4 h-4 shrink-0 ${isConnected ? 'text-orange-400' : 'text-[#80848e]'}`} />
                        <span className="truncate">{vc.name}</span>
                      </div>
                      {isConnected && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                    </button>

                    {/* Connected Users in this Voice Channel */}
                    {isConnected && (
                      <div className="pl-6 pr-2 py-1 space-y-1">
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
                          {isMuted && <MicOff className="w-3 h-3 text-red-400 ml-auto shrink-0" />}
                        </div>

                        {/* Remote Peers */}
                        {connectedPeersList.map(([peerId, p]) => (
                          <div
                            key={peerId}
                            className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-[#35373c]/50 text-xs text-[#dbdee1]"
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-tr ${p.profile?.bg || 'from-gray-600 to-gray-700'} flex items-center justify-center text-[11px] border ${
                                p.isSpeaking ? 'speaking-ring' : 'border-transparent'
                              }`}
                            >
                              {p.profile?.emoji || '🐱'}
                            </div>
                            <span className="truncate">{p.profile?.name || 'Oyen Guest'}</span>
                            {p.isMuted && <MicOff className="w-3 h-3 text-red-400 ml-auto shrink-0" />}
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

        {/* Voice Connected Pill (Bottom Above Profile) */}
        {activeVoiceChannel && (
          <div className="bg-[#232428] px-3 py-2 border-t border-[#1f2023] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400 animate-pulse" />
              <div>
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
              className="p-1.5 rounded-md hover:bg-red-500/20 text-[#b5bac1] hover:text-red-400 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Footer (Discord Bottom Bar) */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between border-t border-[#1f2023]">
          {/* User Info */}
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
              <div className="text-xs font-semibold text-white truncate">{profile.name}</div>
              <div className="text-[10px] text-[#949ba4] truncate">{profile.tag}</div>
            </div>
          </div>

          {/* Quick Action Buttons */}
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

      {/* Add Custom Channel Modal */}
      {showAddChannelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChannel}
            className="bg-[#313338] w-full max-w-sm rounded-2xl border border-[#1f2023] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Buat Channel Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="text-[#949ba4] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] uppercase mb-1">
                Tipe Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewChannelType('voice')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    newChannelType === 'voice'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-[#2b2d31] bg-[#1e1f22] text-[#949ba4]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  Voice
                </button>
                <button
                  type="button"
                  onClick={() => setNewChannelType('text')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    newChannelType === 'text'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-[#2b2d31] bg-[#1e1f22] text-[#949ba4]'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  Text
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] uppercase mb-1">
                Nama Channel
              </label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Contoh: oyen-santai"
                autoFocus
                className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddChannelModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#b5bac1] hover:text-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!newChannelName.trim()}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md"
              >
                Buat Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
