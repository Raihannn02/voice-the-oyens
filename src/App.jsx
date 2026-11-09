import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import VoiceStage from './components/VoiceStage';
import ChatPanel from './components/ChatPanel';
import SettingsModal from './components/SettingsModal';
import MembersRolesModal from './components/MembersRolesModal';
import { getStoredProfile, saveProfile } from './utils/avatars';
import {
  loadChannels,
  saveChannels,
  slugifyChannel,
  makeUniqueChannelId,
} from './utils/channels';
import {
  isOwner,
  isOwnerName,
  getCustomRoles,
  saveCustomRoles,
  getRoleAssignments,
  saveRoleAssignments,
  getAllRoles,
  getRoleById,
  getMemberKey,
  roleHasPermission,
  resolveRole,
  sanitizeRole,
  MEMBER_ROLE,
} from './utils/roles';
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
  const [channels, setChannels] = useState(() => loadChannels());
  const [activeTextChannel, setActiveTextChannel] = useState(
    () => loadChannels().text?.[0]?.id || 'ngobrol-santai'
  );
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);

  const [customRoles, setCustomRoles] = useState(() => getCustomRoles());
  const [assignments, setAssignments] = useState(() => getRoleAssignments());

  const [peers, setPeers] = useState(new Map());
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      text: 'Halo kawan Oyen! Selamat datang di The Oyens. Klik salah satu Voice Channel di sebelah kiri untuk mulai ngobrol dan share screen!',
      sender: 'OyenBot',
      avatar: '🐱',
      bg: 'from-orange-500 to-amber-600',
      role: null,
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
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const voiceManagerRef = useRef(null);
  const profileRef = useRef(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    saveChannels(channels);
  }, [channels]);

  useEffect(() => {
    saveCustomRoles(customRoles);
  }, [customRoles]);

  useEffect(() => {
    saveRoleAssignments(assignments);
  }, [assignments]);

  // ------- Role & permission resolution -------
  const ownerUser = isOwner(profile);
  const selfMemberKey = getMemberKey(profile);
  const selfRole = useMemo(
    () =>
      resolveRole({
        isOwnerUser: ownerUser,
        profileRole: profile.role,
        assignedRoleId: assignments[selfMemberKey]?.roleId,
        customRoles,
      }),
    [ownerUser, profile.role, assignments, selfMemberKey, customRoles]
  );
  const canManageChannels = ownerUser || roleHasPermission(selfRole, 'manageChannels');
  const canManageRoles = ownerUser || roleHasPermission(selfRole, 'manageRoles');
  const allRoles = useMemo(() => getAllRoles(customRoles), [customRoles]);

  const members = useMemo(() => {
    const list = [];

    // Self
    list.push({
      key: selfMemberKey,
      id: profile.id,
      name: profile.name,
      emoji: profile.emoji,
      bg: profile.bg,
      roleId: selfRole.id,
      role: selfRole,
      isSelf: true,
      isOwnerUser: ownerUser,
      online: true,
    });

    // Peers yang sedang terhubung
    peers.forEach((p, peerId) => {
      const mp = p.profile || {};
      const key = getMemberKey(mp) || `peer:${peerId}`;
      if (key === selfMemberKey) return;
      const role = resolveRole({
        isOwnerUser: isOwnerName(mp.name),
        profileRole: mp.role,
        assignedRoleId: assignments[key]?.roleId,
        customRoles,
      });
      list.push({
        key,
        id: mp.id,
        name: mp.name || 'Kawan Oyen',
        emoji: mp.emoji || '🐱',
        bg: mp.bg,
        roleId: role.id,
        role,
        online: true,
        peerId,
      });
    });

    // Anggota yang pernah didaftarkan (sedang offline)
    Object.entries(assignments).forEach(([key, info]) => {
      if (list.some((m) => m.key === key)) return;
      const role = getRoleById(info.roleId, customRoles) || MEMBER_ROLE;
      list.push({
        key,
        id: info.id,
        name: info.name || 'Kawan Oyen',
        emoji: info.emoji || '🐱',
        bg: info.bg,
        roleId: role.id,
        role,
        online: false,
      });
    });

    return list;
  }, [peers, profile, selfMemberKey, selfRole, ownerUser, assignments, customRoles]);

  // ------- Channel management -------
  const handleCreateChannel = ({ type, name, description }) => {
    const clean = String(name || '').trim();
    if (!clean) return null;

    const pool = type === 'voice' ? channels.voice : channels.text;
    const id = makeUniqueChannelId(slugifyChannel(clean), pool);
    const newChannel =
      type === 'voice'
        ? { id, name: clean, desc: description || 'Custom Voice Room' }
        : { id, name: clean, topic: description || 'Custom Text Channel' };

    setChannels((prev) => ({ ...prev, [type]: [...prev[type], newChannel] }));
    return { id, type };
  };

  const handleUpdateChannel = (type, id, patch) => {
    setChannels((prev) => ({
      ...prev,
      [type]: prev[type].map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleDeleteChannel = (type, id) => {
    const remaining = channels[type].filter((c) => c.id !== id);
    if (remaining.length === 0) return; // sisakan minimal 1 channel

    setChannels((prev) => ({ ...prev, [type]: remaining }));
    if (type === 'voice' && activeVoiceChannel === id) {
      leaveVoiceChannel();
    }
    if (type === 'text' && activeTextChannel === id) {
      setActiveTextChannel(remaining[0].id);
    }
  };

  // ------- Role management -------
  const handleCreateRole = ({ name, color, emoji, permissions }) => {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const role = {
      id: 'role_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: clean.slice(0, 20),
      color,
      emoji,
      permissions: permissions || [],
      builtin: false,
      description: 'Role custom',
    };
    setCustomRoles((prev) => [...prev, role]);
    return role;
  };

  const handleUpdateRole = (id, patch) => {
    setCustomRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleDeleteRole = (id) => {
    setCustomRoles((prev) => prev.filter((r) => r.id !== id));
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].roleId === id) next[k] = { ...next[k], roleId: 'member' };
      });
      return next;
    });
  };

  const handleAddMember = (name) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const key = `name:${clean.toLowerCase()}`;
    setAssignments((prev) =>
      prev[key]
        ? prev
        : {
            ...prev,
            [key]: { roleId: 'member', name: clean, emoji: '🐱', bg: 'from-gray-600 to-gray-700' },
          }
    );
  };

  const handleAssignRole = (member, roleId) => {
    setAssignments((prev) => ({
      ...prev,
      [member.key]: {
        roleId,
        id: member.id,
        name: member.name,
        emoji: member.emoji,
        bg: member.bg,
      },
    }));

    if (member.peerId && voiceManagerRef.current) {
      const role = roleId === 'member' ? null : getRoleById(roleId, customRoles) || MEMBER_ROLE;
      voiceManagerRef.current.grantRole(member.peerId, role);
    }
  };

  // ------- Join / Leave Voice -------
  const joinVoiceChannel = (channelId) => {
    if (activeVoiceChannel === channelId && voiceManagerRef.current) return;

    if (voiceManagerRef.current) {
      voiceManagerRef.current.destroy();
      voiceManagerRef.current = null;
    }

    setActiveVoiceChannel(channelId);
    playJoinSound();

    const vm = new VoiceManager(channelId, profileRef.current, {
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
      onRoleGranted: (data) => {
        const nextRole = sanitizeRole(data?.role);
        const nextProfile = { ...profileRef.current, role: nextRole };
        setProfile(nextProfile);
        saveProfile(nextProfile);
        if (voiceManagerRef.current) {
          voiceManagerRef.current.updateProfile(nextProfile);
        }
      },
      onError: (err) => {
        console.error('[VoiceManager Error]:', err);
      },
    });

    voiceManagerRef.current = vm;
  };

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

  // Check URL query parameters for auto-joining room (e.g. ?room=ruang-mabar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      joinVoiceChannel(roomParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const x = Math.random() * 80 + 10;
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
      const localMsg = {
        id: 'msg_' + Date.now(),
        text,
        sender: profile.name,
        avatar: profile.emoji,
        bg: profile.bg,
        role: profile.role || (ownerUser ? selfRole : null),
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
    channels.voice.find((v) => v.id === activeVoiceChannel)?.name ||
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
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
        textChannels={channels.text}
        voiceChannels={channels.voice}
        canManageChannels={canManageChannels}
        onCreateChannel={handleCreateChannel}
        onUpdateChannel={handleUpdateChannel}
        onDeleteChannel={handleDeleteChannel}
        onOpenMembers={() => setIsMembersOpen(true)}
        memberCount={members.length}
        selfRole={selfRole}
      />

      {/* Main Stage (Center) */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="md:hidden absolute top-3 left-3 z-30 p-2 rounded-lg bg-[#2b2d31] text-[#dbdee1] shadow-lg border border-[#1f2023]"
          title="Buka daftar channel"
        >
          <Menu className="w-5 h-5" />
        </button>

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
          selfRole={selfRole}
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
        selfRole={selfRole}
      />

      {/* Members & Roles Modal */}
      <MembersRolesModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        profile={profile}
        selfRole={selfRole}
        members={members}
        roles={allRoles}
        canManageRoles={canManageRoles}
        onAssignRole={handleAssignRole}
        onAddMember={handleAddMember}
        onCreateRole={handleCreateRole}
        onUpdateRole={handleUpdateRole}
        onDeleteRole={handleDeleteRole}
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
