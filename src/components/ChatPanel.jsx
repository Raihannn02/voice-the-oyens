import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  Smile,
  Image as ImageIcon,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import RoleBadge from './RoleBadge';
import { isDisplayableRole } from '../utils/roles';

const COMMON_EMOJIS = ['🐱', '😹', '🔥', '👍', '❤️', '🎮', '✨', '😂', '💀', '🎉'];

export default function ChatPanel({
  activeTextChannel,
  messages,
  sendMessage,
  isOpen,
  toggleOpen,
}) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Filter messages for active channel
  const channelMessages = messages.filter(
    (m) => m.channelId === activeTextChannel || !m.channelId
  );

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    sendMessage(inputText.trim(), activeTextChannel, selectedImage);
    setInputText('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB untuk kelancaran P2P');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        title="Buka Chat"
        className="w-10 bg-[#2b2d31] hover:bg-[#35373c] border-l border-[#1f2023] flex flex-col items-center justify-center gap-2 text-[#949ba4] hover:text-white transition-colors"
      >
        <Hash className="w-5 h-5 text-orange-400" />
        <span className="[writing-mode:vertical-rl] text-xs font-semibold tracking-wider uppercase">
          Buka Chat
        </span>
      </button>
    );
  }

  return (
    <div className="w-80 md:w-96 bg-[#2b2d31] flex flex-col h-full border-l border-[#1f2023] shrink-0 select-none">
      {/* Chat Header */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shadow-xs bg-[#2b2d31]">
        <div className="flex items-center gap-2 truncate">
          <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
          <span className="font-bold text-sm text-white truncate">{activeTextChannel}</span>
        </div>
        <button
          onClick={toggleOpen}
          title="Tutup Chat"
          className="p-1.5 rounded-md hover:bg-[#404249] text-[#b5bac1] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Welcome message in channel */}
        <div className="py-4 border-b border-[#35373c]/50 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-2 text-2xl">
            #
          </div>
          <h3 className="font-bold text-white text-base">Selamat Datang di #{activeTextChannel}!</h3>
          <p className="text-xs text-[#949ba4] mt-1">
            Ini adalah awal dari obrolan channel #{activeTextChannel}.
          </p>
        </div>

        {channelMessages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 group">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${
                msg.bg || 'from-orange-500 to-amber-600'
              } flex items-center justify-center text-base shrink-0 shadow-sm`}
            >
              {msg.avatar || '🐱'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-xs text-white hover:underline cursor-pointer">
                  {msg.sender}
                </span>
                {isDisplayableRole(msg.role) && <RoleBadge role={msg.role} />}
                <span className="text-[10px] text-[#949ba4]">{msg.time}</span>
              </div>
              {msg.text && (
                <p className="text-sm text-[#dbdee1] mt-0.5 break-words select-text leading-relaxed">
                  {msg.text}
                </p>
              )}
              {msg.image && (
                <div className="mt-2 rounded-xl overflow-hidden max-w-[240px] border border-[#1f2023] shadow-md">
                  <img
                    src={msg.image}
                    alt="Uploaded attachment"
                    className="w-full h-auto object-cover max-h-60"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview if selected */}
      {selectedImage && (
        <div className="px-4 py-2 bg-[#232428] border-t border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-10 h-10 object-cover rounded-lg border border-[#35373c]"
            />
            <span className="text-xs text-[#dbdee1]">Gambar siap dikirim</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-md hover:bg-[#404249] text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="px-4 py-2 bg-[#232428] border-t border-[#1f2023] flex items-center gap-2 overflow-x-auto">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText((prev) => prev + emoji)}
              className="p-1.5 hover:bg-[#35373c] rounded-lg text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Footer */}
      <form onSubmit={handleSend} className="p-3 bg-[#2b2d31]">
        <div className="bg-[#383a40] rounded-xl px-3 py-2 flex items-center gap-2 border border-transparent focus-within:border-orange-500/50 transition-colors">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Kirim Gambar"
            className="p-1 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#404249] transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Kirim pesan ke #${activeTextChannel}...`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emoji"
            className="p-1 rounded-md text-[#b5bac1] hover:text-white hover:bg-[#404249] transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim() && !selectedImage}
            title="Kirim (Enter)"
            className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

