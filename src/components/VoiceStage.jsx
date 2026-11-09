import React, { useRef, useEffect, useState } from 'react';
import {
  Monitor,
  MonitorOff,
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Menu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playMeowSound, playPurrSound } from '../utils/soundEffects';

export default function VoiceStage({
  activeVoiceChannel,
  voiceChannelName,
  joinVoiceChannel,
  leaveVoiceChannel,
  profile,
  peers,
  isMuted,
  toggleMute,
  isDeafened,
  toggleDeafen,
  isSpeaking,
  localScreenStream,
  localCameraStream,
  startScreenShare,
  stopScreenShare,
  toggleCamera,
  triggerReaction,
  setPeerVolume,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedScreenPeerId, setSelectedScreenPeerId] = useState(null); // 'self' or peerId
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const stageRef = useRef(null);

  // Convert peers Map to array
  const peerList = Array.from(peers.entries());

  // Determine active screen shares
  const activeScreenShares = [];
  if (localScreenStream) {
    activeScreenShares.push({
      id: 'self',
      name: `${profile.name} (Anda)`,
      stream: localScreenStream,
    });
  }
  peerList.forEach(([peerId, peer]) => {
    if (peer.screenStream) {
      activeScreenShares.push({
        id: peerId,
        name: peer.profile?.name || 'Kawan Oyen',
        stream: peer.screenStream,
      });
    }
  });

  // Auto select active screen share if none selected
  useEffect(() => {
    if (activeScreenShares.length > 0) {
      if (!selectedScreenPeerId || !activeScreenShares.some((s) => s.id === selectedScreenPeerId)) {
        setSelectedScreenPeerId(activeScreenShares[0].id);
      }
    } else {
      setSelectedScreenPeerId(null);
    }
  }, [activeScreenShares.length, selectedScreenPeerId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleFireReaction = (emoji) => {
    triggerReaction(emoji);
    setShowReactionPicker(false);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
    });
  };

  // If not connected to voice channel
  if (!activeVoiceChannel) {
    return (
      <div className="flex-1 bg-[#313338] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-orange-500/20 mb-5 animate-bounce">
          🐱
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang di Voice The Oyens!</h2>
        <p className="text-sm text-[#949ba4] max-w-md mb-6 leading-relaxed">
          Nikmati komunikasi suara jernih berkecepatan tinggi, berbagi layar (screen share) resolusi tinggi,
          dan obrolan seru tanpa perlu download aplikasi atau login server!
        </p>
        <button
          onClick={() => joinVoiceChannel('voice-utama')}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Volume2 className="w-5 h-5" />
          Masuk ke Voice Oyen Utama
        </button>
      </div>
    );
  }

  // Active current screen share
  const currentScreen = activeScreenShares.find((s) => s.id === selectedScreenPeerId);

  return (
    <div
      ref={stageRef}
      className="flex-1 bg-[#313338] flex flex-col relative overflow-hidden select-none h-full"
    >
      {/* Top Stage Header */}
      <div className="h-12 px-4 bg-[#2b2d31]/80 backdrop-blur-md border-b border-[#1f2023] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-orange-400" />
          <h2 className="font-bold text-sm text-white">{voiceChannelName}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#949ba4] font-medium flex items-center gap-1">
            <Users className="w-3 h-3 text-green-400" />
            {peerList.length + 1} Peserta
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeScreenShares.length > 0 && (
            <div className="flex items-center gap-1 bg-[#1e1f22] p-1 rounded-lg">
              {activeScreenShares.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScreenPeerId(s.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    selectedScreenPeerId === s.id
                      ? 'bg-orange-500 text-white font-medium'
                      : 'text-[#949ba4] hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{s.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
            className="p-1.5 rounded-md hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area: Screen Share View or Voice Grid */}
      <div className="flex-1 relative flex flex-col p-4 overflow-hidden">
        {currentScreen ? (
          /* ================= SCREEN SHARE SPOTLIGHT MODE ================= */
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Screen Video Container */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border border-[#1f2023] shadow-2xl">
              <VideoPlayer stream={currentScreen.stream} isMuted={currentScreen.id === 'self'} />
              {/* Screen owner tag */}
              <div className="absolute top-3 left-3 bg-[#1e1f22]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Layar: {currentScreen.name}</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded uppercase font-bold">
                  HD 60FPS
                </span>
              </div>
            </div>

            {/* Bottom Participant Filmstrip */}
            <div className="h-24 flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
              {/* Self Card */}
              <ParticipantMiniCard
                name={`${profile.name} (Anda)`}
                emoji={profile.emoji}
                bg={profile.bg}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
                cameraStream={localCameraStream}
              />
              {/* Peers */}
              {peerList.map(([peerId, peer]) => (
                <ParticipantMiniCard
                  key={peerId}
                  name={peer.profile?.name || 'Kawan Oyen'}
                  emoji={peer.profile?.emoji || '🐱'}
                  bg={peer.profile?.bg || 'from-gray-600 to-gray-700'}
                  isSpeaking={peer.isSpeaking}
                  isMuted={peer.isMuted}
                  cameraStream={peer.cameraStream}
                  volume={peer.volume}
                  onVolumeChange={(val) => setPeerVolume(peerId, val)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ================= STANDARD VOICE CARDS GRID ================= */
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div
              className={`w-full max-w-5xl h-full grid gap-4 p-2 auto-rows-fr ${
                peerList.length === 0
                  ? 'grid-cols-1 max-w-md'
                  : peerList.length === 1
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                  : peerList.length <= 3
                  ? 'grid-cols-2'
                  : 'grid-cols-2 md:grid-cols-3'
              }`}
            >
              {/* Self Card */}
              <ParticipantMainCard
                name={`${profile.name} (Anda)`}
                emoji={profile.emoji}
                bg={profile.bg}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
                isDeafened={isDeafened}
                cameraStream={localCameraStream}
                isSelf={true}
              />

              {/* Remote Peers Cards */}
              {peerList.map(([peerId, peer]) => (
                <ParticipantMainCard
                  key={peerId}
                  name={peer.profile?.name || 'Kawan Oyen'}
                  emoji={peer.profile?.emoji || '🐱'}
                  bg={peer.profile?.bg || 'from-gray-600 to-gray-700'}
                  isSpeaking={peer.isSpeaking}
                  isMuted={peer.isMuted}
                  isDeafened={peer.isDeafened}
                  cameraStream={peer.cameraStream}
                  volume={peer.volume !== undefined ? peer.volume : 1.0}
                  onVolumeChange={(val) => setPeerVolume(peerId, val)}
                  isSelf={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="h-20 flex items-center justify-center shrink-0 pb-3 z-20">
        <div className="bg-[#1e1f22]/90 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-[#2b2d31] shadow-2xl flex items-center gap-3">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Nyalakan Mikrofon' : 'Matikan Mikrofon'}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deafen Button */}
          <button
            onClick={toggleDeafen}
            title={isDeafened ? 'Nyalakan Suara (Undeafen)' : 'Deafen'}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isDeafened
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
          >
            <Headphones className={`w-5 h-5 ${isDeafened ? 'line-through text-red-400' : ''}`} />
          </button>

          <div className="w-px h-6 bg-[#2b2d31] mx-1"></div>

          {/* Share Screen Button */}
          <button
            onClick={localScreenStream ? stopScreenShare : startScreenShare}
            title={localScreenStream ? 'Hentikan Share Screen' : 'Bagikan Layar (Share Screen)'}
            className={`px-4 h-12 rounded-xl flex items-center gap-2 font-semibold text-xs tracking-wide transition-all shadow-md ${
              localScreenStream
                ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
                : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
          >
            {localScreenStream ? (
              <>
                <MonitorOff className="w-5 h-5" />
                <span>Stop Screen</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5 text-orange-400" />
                <span>Share Screen</span>
              </>
            )}
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleCamera}
            title={localCameraStream ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              localCameraStream
                ? 'bg-green-500 text-white'
                : 'bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white'
            }`}
          >
            {localCameraStream ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Reactions Button with Popover */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              title="Kirim Reaksi Emojis"
              className="w-12 h-12 rounded-xl bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] hover:text-white flex items-center justify-center transition-all text-xl"
            >
              🐱
            </button>

            {showReactionPicker && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#2b2d31] border border-[#1f2023] p-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                {['🐱', '🔥', '👏', '😂', '😻', '❤️', '🚀', '🎉'].map((emo) => (
                  <button
                    key={emo}
                    onClick={() => handleFireReaction(emo)}
                    className="w-9 h-9 rounded-lg hover:bg-[#35373c] flex items-center justify-center text-xl hover:scale-125 transition-transform"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[#2b2d31] mx-1"></div>

          {/* Disconnect Call Button */}
          <button
            onClick={leaveVoiceChannel}
            title="Keluar dari Voice Channel"
            className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Full Video Player component for Screen Share / Camera
function VideoPlayer({ stream, isMuted = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className="w-full h-full object-contain bg-black"
    />
  );
}

// Main Participant Card (Grid Mode)
function ParticipantMainCard({
  name,
  emoji,
  bg,
  isSpeaking,
  isMuted,
  isDeafened,
  cameraStream,
  volume = 1,
  onVolumeChange,
  isSelf,
}) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div className="bg-[#2b2d31] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border border-[#1f2023] shadow-md group transition-all hover:border-[#3b3e45]">
      {cameraStream ? (
        <div className="w-full h-full absolute inset-0">
          <VideoPlayer stream={cameraStream} isMuted={isSelf} />
        </div>
      ) : (
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-tr ${bg} flex items-center justify-center text-5xl shadow-2xl transition-all duration-150 border-4 ${
            isSpeaking ? 'speaking-ring' : 'border-transparent'
          }`}
        >
          {emoji}
        </div>
      )}

      {/* Bottom Name Pill */}
      <div className="absolute bottom-3 left-3 bg-[#1e1f22]/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 shadow-md">
        <span className="truncate max-w-[140px]">{name}</span>
        {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        {isDeafened && <Headphones className="w-3.5 h-3.5 text-red-400 shrink-0" />}
      </div>

      {/* Remote Peer Volume Slider on Hover */}
      {!isSelf && onVolumeChange && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e1f22]/90 backdrop-blur-md p-2 rounded-xl flex items-center gap-2 shadow-lg">
          <Volume2 className="w-3.5 h-3.5 text-[#949ba4]" />
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[#404249] rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      )}
    </div>
  );
}

// Mini Filmstrip Card (Screen Share Mode)
function ParticipantMiniCard({
  name,
  emoji,
  bg,
  isSpeaking,
  isMuted,
  cameraStream,
  volume = 1,
  onVolumeChange,
}) {
  return (
    <div className="w-32 h-20 bg-[#2b2d31] rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-[#1f2023] shrink-0 group">
      {cameraStream ? (
        <div className="w-full h-full absolute inset-0">
          <VideoPlayer stream={cameraStream} isMuted={true} />
        </div>
      ) : (
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-tr ${bg} flex items-center justify-center text-lg shadow-md border-2 ${
            isSpeaking ? 'speaking-ring' : 'border-transparent'
          }`}
        >
          {emoji}
        </div>
      )}
      <div className="absolute bottom-1 left-1 right-1 bg-[#1e1f22]/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center justify-between">
        <span className="truncate">{name}</span>
        {isMuted && <MicOff className="w-2.5 h-2.5 text-red-400 shrink-0" />}
      </div>
    </div>
  );
}

