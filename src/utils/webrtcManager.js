import { joinRoom, selfId } from '@trystero-p2p/torrent';

const APP_ID = 'voice-the-oyens-p2p-v1';

export class VoiceManager {
  constructor(roomId, profile, callbacks) {
    this.roomId = roomId;
    this.profile = profile;
    this.callbacks = callbacks;
    this.selfId = selfId;

    this.room = null;
    this.localAudioStream = null;
    this.screenStream = null;
    this.cameraStream = null;

    this.isMuted = false;
    this.isDeafened = false;
    this.isSpeaking = false;

    // Web Audio Volume detection
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.animFrameId = null;

    // Peer tracking
    this.peers = new Map(); // peerId -> { profile, audioStream, screenStream, cameraStream, isSpeaking, volume: 1 }
    this.audioElements = new Map(); // peerId -> HTMLAudioElement

    this.init();
  }

  async init() {
    try {
      this.room = joinRoom(
        {
          appId: APP_ID,
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
            ],
          },
        },
        this.roomId
      );

      // Actions
      const [sendPresence, getPresence] = this.room.makeAction('presence');
      const [sendChat, getChat] = this.room.makeAction('chat');
      const [sendReaction, getReaction] = this.room.makeAction('reaction');
      const [sendStreamType, getStreamType] = this.room.makeAction('streamType');

      this.sendPresence = sendPresence;
      this.sendChat = sendChat;
      this.sendReaction = sendReaction;
      this.sendStreamType = sendStreamType;

      // Handle presence updates
      getPresence((data, peerId) => {
        const existing = this.peers.get(peerId) || {};
        this.peers.set(peerId, { ...existing, ...data });
        this.notifyPeersChanged();
      });

      // Handle incoming chat
      getChat((message, peerId) => {
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage(message, peerId);
        }
      });

      // Handle emoji reactions
      getReaction((reaction, peerId) => {
        if (this.callbacks.onReaction) {
          this.callbacks.onReaction(reaction, peerId);
        }
      });

      // Handle stream metadata info
      getStreamType((meta, peerId) => {
        const peer = this.peers.get(peerId) || {};
        if (meta.type === 'screen') {
          peer.hasScreenShare = meta.active;
        } else if (meta.type === 'camera') {
          peer.hasCamera = meta.active;
        }
        this.peers.set(peerId, peer);
        this.notifyPeersChanged();
      });

      // Handle peer connect/disconnect
      this.room.onPeerJoin((peerId) => {
        console.log('[Trystero] Peer joined:', peerId);
        this.broadcastPresence();

        // If we have active streams, share with newcomer
        if (this.localAudioStream) {
          this.room.addStream(this.localAudioStream, peerId);
        }
        if (this.screenStream) {
          this.room.addStream(this.screenStream, peerId);
          this.sendStreamType({ type: 'screen', active: true }, peerId);
        }
        if (this.cameraStream) {
          this.room.addStream(this.cameraStream, peerId);
          this.sendStreamType({ type: 'camera', active: true }, peerId);
        }

        if (this.callbacks.onPeerJoin) {
          this.callbacks.onPeerJoin(peerId);
        }
      });

      this.room.onPeerLeave((peerId) => {
        console.log('[Trystero] Peer left:', peerId);
        this.cleanupPeer(peerId);
        if (this.callbacks.onPeerLeave) {
          this.callbacks.onPeerLeave(peerId);
        }
      });

      // Handle incoming media streams
      this.room.onStream((stream, peerId, metadata) => {
        console.log('[Trystero] Stream received from:', peerId, stream.getTracks());
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        const peer = this.peers.get(peerId) || { profile: {} };

        if (hasVideo) {
          // Determine if screen or camera by track or meta
          const videoTrack = stream.getVideoTracks()[0];
          const isScreen = videoTrack.label?.toLowerCase().includes('screen') ||
                           videoTrack.label?.toLowerCase().includes('display') ||
                           videoTrack.label?.toLowerCase().includes('window') ||
                           peer.hasScreenShare;

          if (isScreen) {
            peer.screenStream = stream;
            peer.hasScreenShare = true;
          } else {
            peer.cameraStream = stream;
            peer.hasCamera = true;
          }
        }

        if (hasAudio) {
          peer.audioStream = stream;
          this.playRemoteAudio(peerId, stream);
        }

        this.peers.set(peerId, peer);
        this.notifyPeersChanged();
      });

      // Start local audio capture
      await this.startLocalAudio();

      // Announce self
      this.broadcastPresence();
    } catch (err) {
      console.error('[Trystero] Init failed:', err);
      if (this.callbacks.onError) {
        this.callbacks.onError(err);
      }
    }
  }

  async startLocalAudio(deviceId = null) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        video: false,
      };

      this.localAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Setup volume analyser for speaking detection
      this.setupAudioAnalyser(this.localAudioStream);

      // Add stream to all connected peers
      if (this.room) {
        this.room.addStream(this.localAudioStream);
      }

      if (this.callbacks.onLocalAudioReady) {
        this.callbacks.onLocalAudioReady(this.localAudioStream);
      }
    } catch (err) {
      console.warn('Microphone access denied or error:', err);
      if (this.callbacks.onError) {
        this.callbacks.onError(new Error('Gagal mengakses mikrofon. Pastikan izin mikrofon diberikan.'));
      }
    }
  }

  setupAudioAnalyser(stream) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      let speakingFrames = 0;

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(buffer);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const isCurrentlySpeaking = avg > 14 && !this.isMuted;

        if (isCurrentlySpeaking) {
          speakingFrames = Math.min(speakingFrames + 1, 10);
        } else {
          speakingFrames = Math.max(speakingFrames - 1, 0);
        }

        const nextSpeaking = speakingFrames > 2;
        if (nextSpeaking !== this.isSpeaking) {
          this.isSpeaking = nextSpeaking;
          if (this.callbacks.onSpeakingChange) {
            this.callbacks.onSpeakingChange(this.isSpeaking);
          }
          this.broadcastPresence();
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      this.animFrameId = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('AudioContext volume detector failed:', err);
    }
  }

  playRemoteAudio(peerId, stream) {
    let audio = this.audioElements.get(peerId);
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      audio.playsInline = true;
      this.audioElements.set(peerId, audio);
    }
    audio.srcObject = stream;
    audio.muted = this.isDeafened;
    const peer = this.peers.get(peerId);
    audio.volume = peer?.volume !== undefined ? peer.volume : 1.0;
    audio.play().catch((err) => console.log('Audio autoplay prevented:', err));
  }

  setPeerVolume(peerId, volume) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.volume = Math.max(0, Math.min(2, volume));
      this.peers.set(peerId, peer);
      const audio = this.audioElements.get(peerId);
      if (audio) {
        audio.volume = Math.min(1, peer.volume);
      }
      this.notifyPeersChanged();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
    if (this.isMuted) {
      this.isSpeaking = false;
      if (this.callbacks.onSpeakingChange) {
        this.callbacks.onSpeakingChange(false);
      }
    }
    this.broadcastPresence();
    return this.isMuted;
  }

  toggleDeafen() {
    this.isDeafened = !this.isDeafened;
    // Mute all remote audio
    this.audioElements.forEach((audio) => {
      audio.muted = this.isDeafened;
    });
    // Auto mute mic when deafened
    if (this.isDeafened && !this.isMuted) {
      this.toggleMute();
    }
    this.broadcastPresence();
    return this.isDeafened;
  }

  async startScreenShare() {
    try {
      if (this.screenStream) {
        this.stopScreenShare();
        return false;
      }

      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true, // capture system audio if supported
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      if (this.room) {
        this.room.addStream(this.screenStream);
        this.sendStreamType({ type: 'screen', active: true });
      }

      this.broadcastPresence();
      if (this.callbacks.onLocalScreenReady) {
        this.callbacks.onLocalScreenReady(this.screenStream);
      }
      return true;
    } catch (err) {
      console.warn('Screen share canceled or error:', err);
      return false;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      if (this.room) {
        this.room.removeStream(this.screenStream);
        this.sendStreamType({ type: 'screen', active: false });
      }
      this.screenStream = null;
      this.broadcastPresence();
      if (this.callbacks.onLocalScreenReady) {
        this.callbacks.onLocalScreenReady(null);
      }
    }
  }

  async toggleCamera() {
    try {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach((t) => t.stop());
        if (this.room) {
          this.room.removeStream(this.cameraStream);
          this.sendStreamType({ type: 'camera', active: false });
        }
        this.cameraStream = null;
        this.broadcastPresence();
        if (this.callbacks.onLocalCameraReady) {
          this.callbacks.onLocalCameraReady(null);
        }
        return false;
      }

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });

      const videoTrack = this.cameraStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        this.toggleCamera();
      };

      if (this.room) {
        this.room.addStream(this.cameraStream);
        this.sendStreamType({ type: 'camera', active: true });
      }

      this.broadcastPresence();
      if (this.callbacks.onLocalCameraReady) {
        this.callbacks.onLocalCameraReady(this.cameraStream);
      }
      return true;
    } catch (err) {
      console.warn('Camera error:', err);
      return false;
    }
  }

  sendChatMessage(text, channelId = 'general', image = null) {
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      sender: this.profile.name,
      avatar: this.profile.emoji,
      bg: this.profile.bg,
      channelId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image,
      isSelf: false,
    };

    if (this.sendChat) {
      this.sendChat(msg);
    }
    return { ...msg, isSelf: true };
  }

  triggerReaction(emoji) {
    if (this.sendReaction) {
      this.sendReaction({ emoji, sender: this.profile.name });
    }
    if (this.callbacks.onReaction) {
      this.callbacks.onReaction({ emoji, sender: this.profile.name, isSelf: true });
    }
  }

  broadcastPresence() {
    if (!this.sendPresence) return;
    this.sendPresence({
      id: this.selfId,
      profile: this.profile,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: this.isSpeaking,
      isScreenSharing: !!this.screenStream,
      isCameraOn: !!this.cameraStream,
    });
  }

  updateProfile(newProfile) {
    this.profile = newProfile;
    this.broadcastPresence();
  }

  cleanupPeer(peerId) {
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      this.audioElements.delete(peerId);
    }
    this.peers.delete(peerId);
    this.notifyPeersChanged();
  }

  notifyPeersChanged() {
    if (this.callbacks.onPeersUpdate) {
      this.callbacks.onPeersUpdate(new Map(this.peers));
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }

    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((t) => t.stop());
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
    }

    this.audioElements.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
    });
    this.audioElements.clear();

    if (this.room) {
      this.room.leave();
    }
  }
}

