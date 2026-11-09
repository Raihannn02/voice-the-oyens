import React, { useState, useEffect, useRef } from 'react';
import Sidebar, { TEXT_CHANNELS, VOICE_CHANNELS } from './components/Sidebar';
import VoiceStage from './components/VoiceStage';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import { getStoredProfile } from './utils/avatars';
import { VoiceManager } from './utils/webrtcManager';
import {
  playJoinSound,
  playLeaveSound,
  playMuteSound,
  playUnmuteSound,
  playDeafenSound,
  playUndeafenSound,
  playMessageSound,
} from './utils/soundEffects';

export default function App() {
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [activeTextChannel, setActiveTextChannel] = useState(TEXT_CHANNELS[0].id);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);

  const [peers, setPeers] = useState(new Map());
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      text: 'Halo kawan Oyen! Selamat datang di The Oyens. Klik salah satu Voice Channel di sebelah kiri untuk mulai ngobrol dan share screen!',
      sender: 'OyenBot',
      avatar: '🐱',
      bg: 'from-orange-500 to-amber-600',
      channelId: 'ngobrol-santai',
      time: 'Baru saja',
      isSelf: false,
    },
  ]);

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [localCameraStream, setLocalCameraStream] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const voiceManagerRef = useRef(null);

  // Check URL query parameters for auto-joining room (e.g. ?room=ruang-mabar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Find matching voice channel or use custom room
      joinVoiceChannel(roomParam);
    }
  }, []);

  // Join Voice Channel
  const joinVoiceChannel = (channelId) => {
    if (activeVoiceChannel === channelId && voiceManagerRef.current) return;

    // If already in another room, leave first
    if (voiceManagerRef.current) {
      voiceManagerRef.current.destroy();
      voiceManagerRef.current = null;
    }

    setActiveVoiceChannel(channelId);
    playJoinSound();

    const vm = new VoiceManager(channelId, profile, {
      onPeersUpdate: (updatedPeers) => {
        setPeers(updatedPeers);
      },
      onChatMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
        playMessageSound();
      },
      onReaction: (reaction) => {
        triggerFloatingReaction(reaction.emoji);
      },
      onSpeakingChange: (speaking) => {
        setIsSpeaking(speaking);
      },
      onLocalScreenReady: (stream) => {
        setLocalScreenStream(stream);
      },
      onLocalCameraReady: (stream) => {
        setLocalCameraStream(stream);
      },
      onError: (err) => {
        console.error('[VoiceManager Error]:', err);
      },
    });

    voiceManagerRef.current = vm;
  };

  // Leave Voice Channel
  const leaveVoiceChannel = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.destroy();
      voiceManagerRef.current = null;
    }
    setActiveVoiceChannel(null);
    setPeers(new Map());
    setLocalScreenStream(null);
    setLocalCameraStream(null);
    setIsSpeaking(false);
    playLeaveSound();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (voiceManagerRef.current) {
      const nextMuted = voiceManagerRef.current.toggleMute();
      setIsMuted(nextMuted);
      if (nextMuted) playMuteSound();
      else playUnmuteSound();
    } else {
      setIsMuted((prev) => {
        const next = !prev;
        if (next) playMuteSound();
        else playUnmuteSound();
        return next;
      });
    }
  };

  // Toggle Deafen
  const handleToggleDeafen = () => {
    if (voiceManagerRef.current) {
      const nextDeafened = voiceManagerRef.current.toggleDeafen();
      setIsDeafened(nextDeafened);
      if (nextDeafened) {
        setIsMuted(true);
        playDeafenSound();
      } else {
        playUndeafenSound();
      }
    } else {
      setIsDeafened((prev) => {
        const next = !prev;
        if (next) playDeafenSound();
        else playUndeafenSound();
        return next;
      });
    }
  };

  // Screen share handlers
  const handleStartScreenShare = async () => {
    if (!voiceManagerRef.current) {
      // Auto join default channel if not connected
      joinVoiceChannel('voice-utama');
      setTimeout(async () => {
        if (voiceManagerRef.current) {
          await voiceManagerRef.current.startScreenShare();
        }
      }, 500);
      return;
    }
    await voiceManagerRef.current.startScreenShare();
  };

  const handleStopScreenShare = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopScreenShare();
    }
    setLocalScreenStream(null);
  };

  // Camera handler
  const handleToggleCamera = async () => {
    if (!voiceManagerRef.current) {
      joinVoiceChannel('voice-utama');
      setTimeout(async () => {
        if (voiceManagerRef.current) {
          await voiceManagerRef.current.toggleCamera();
        }
      }, 500);
      return;
    }
    await voiceManagerRef.current.toggleCamera();
  };

  // Reaction handler
  const handleTriggerReaction = (emoji) => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.triggerReaction(emoji);
    } else {
      triggerFloatingReaction(emoji);
    }
  };

  const triggerFloatingReaction = (emoji) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; // random 10% to 90%
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  // Peer volume control
  const handleSetPeerVolume = (peerId, volume) => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.setPeerVolume(peerId, volume);
    }
  };

  // Send message
  const handleSendMessage = (text, channelId, image) => {
    if (voiceManagerRef.current) {
      const sentMsg = voiceManagerRef.current.sendChatMessage(text, channelId, image);
      setMessages((prev) => [...prev, sentMsg]);
    } else {
      // Local message when not connected to voice P2P
      const localMsg = {
        id: 'msg_' + Date.now(),
        text,
        sender: profile.name,
        avatar: profile.emoji,
        bg: profile.bg,
        channelId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image,
        isSelf: true,
      };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  // Update profile
  const handleUpdateProfile = (newProfile) => {
    setProfile(newProfile);
    if (voiceManagerRef.current) {
      voiceManagerRef.current.updateProfile(newProfile);
    }
  };

  const activeVoiceName =
    VOICE_CHANNELS.find((v) => v.id === activeVoiceChannel)?.name ||
    activeVoiceChannel ||
    'Tidak Terhubung';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1e1f22] select-none text-[#dbdee1]">
      {/* Left Sidebar */}
      <Sidebar
        profile={profile}
        activeTextChannel={activeTextChannel}
        setActiveTextChannel={setActiveTextChannel}
        activeVoiceChannel={activeVoiceChannel}
        joinVoiceChannel={joinVoiceChannel}
        leaveVoiceChannel={leaveVoiceChannel}
        isMuted={isMuted}
        toggleMute={handleToggleMute}
        isDeafened={isDeafened}
        toggleDeafen={handleToggleDeafen}
        openSettings={() => setIsSettingsOpen(true)}
        peers={peers}
        isSpeaking={isSpeaking}
      />

      {/* Main Stage (Center) */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <VoiceStage
          activeVoiceChannel={activeVoiceChannel}
          voiceChannelName={activeVoiceName}
          joinVoiceChannel={joinVoiceChannel}
          leaveVoiceChannel={leaveVoiceChannel}
          profile={profile}
          peers={peers}
          isMuted={isMuted}
          toggleMute={handleToggleMute}
          isDeafened={isDeafened}
          toggleDeafen={handleToggleDeafen}
          isSpeaking={isSpeaking}
          localScreenStream={localScreenStream}
          localCameraStream={localCameraStream}
          startScreenShare={handleStartScreenShare}
          stopScreenShare={handleStopScreenShare}
          toggleCamera={handleToggleCamera}
          triggerReaction={handleTriggerReaction}
          setPeerVolume={handleSetPeerVolume}
        />
      </main>

      {/* Right Chat Panel */}
      <ChatPanel
        activeTextChannel={activeTextChannel}
        messages={messages}
        sendMessage={handleSendMessage}
        isOpen={isChatOpen}
        toggleOpen={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        isSpeaking={isSpeaking}
      />

      {/* Floating Animated Reaction Emojis */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%`, bottom: '80px' }}
            className="absolute text-4xl floating-reaction drop-shadow-lg"
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
