import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Sparkles, Check } from 'lucide-react';
import { OYEN_AVATARS, saveProfile } from '../utils/avatars';

export default function SettingsModal({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  isSpeaking,
}) {
  const [name, setName] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(
    OYEN_AVATARS.find((a) => a.id === profile.avatarId) || OYEN_AVATARS[0]
  );
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      // Fetch microphones
      navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
      }).catch(() => {});
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...profile,
      name: name.trim() || profile.name,
      avatarId: selectedAvatar.id,
      emoji: selectedAvatar.emoji,
      bg: selectedAvatar.bg,
    };
    saveProfile(updated);
    onUpdateProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#313338] w-full max-w-lg rounded-2xl border border-[#1f2023] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1f2023] flex items-center justify-between bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-bold text-base text-white">Pengaturan Profil & Audio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#35373c] text-[#b5bac1] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section: Profile Name */}
          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Nama Tampilan (Nickname)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama keren..."
              className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Section: Pick Oyen Avatar */}
          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Pilih Persona Kucing Oyen
            </label>
            <div className="grid grid-cols-4 gap-3">
              {OYEN_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-md shadow-orange-500/10'
                        : 'border-[#2b2d31] bg-[#2b2d31] hover:bg-[#35373c] hover:border-[#404249]'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatar.bg} flex items-center justify-center text-2xl shadow-sm`}
                    >
                      {avatar.emoji}
                    </div>
                    <span className="text-[11px] font-semibold text-[#dbdee1] truncate w-full text-center">
                      {avatar.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Microphone Test & Volume Indicator */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Mic className="w-4 h-4 text-orange-400" />
                Uji Mikrofon & Deteksi Suara
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isSpeaking ? 'bg-green-500/20 text-green-400' : 'bg-[#1e1f22] text-[#949ba4]'
                }`}
              >
                {isSpeaking ? 'Sedang Berbicara' : 'Hening'}
              </span>
            </div>

            {audioDevices.length > 0 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                {audioDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}

            {/* Live Volume Meter Bar */}
            <div className="w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden p-0.5 border border-[#35373c]">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isSpeaking ? 'w-4/5 bg-green-500 shadow-sm shadow-green-500/50' : 'w-2 bg-[#404249]'
                }`}
              ></div>
            </div>
            <p className="text-[11px] text-[#949ba4]">
              Coba berbicara: lingkaran hijau di avatar akan menyala otomatis saat suara Anda terdeteksi.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1f2023] bg-[#2b2d31] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#b5bac1] hover:text-white hover:bg-[#35373c] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30 transition-all hover:scale-105"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

