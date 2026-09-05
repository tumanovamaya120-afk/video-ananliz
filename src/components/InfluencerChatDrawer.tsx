import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, VideoAnalysisResult } from '../types';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Check,
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InfluencerChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoResult: VideoAnalysisResult | null;
}

export const InfluencerChatDrawer: React.FC<InfluencerChatDrawerProps> = ({
  isOpen,
  onClose,
  videoResult,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Merhaba! Ben senin Influencer İçerik Koçunum. Yüklediğin videoyu ve internetteki benzerlerini inceledim. Bu videonun kurgusu, kancası, alternatif senaryoları veya sponsorluk fikirleri hakkında bana dilediğini sorabilirsin!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Bu videonun kurgusunu 15 saniyeye göre adım adım uyarla.',
    'TikTok algoritması için 3 farklı merak uyandırıcı hook yaz.',
    'Bu video formatına uygun 3 marka sponsorluğu fikri ver.',
    'Yorumlarda tartışma çıkaracak bir kapanış sorusu öner.'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          videoContext: videoResult,
        }),
      });

      const data = await response.json();
      if (data.success && data.text) {
        const assistantMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Cevap alınamadı');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Üzgünüm, yanıt oluşturulurken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#0A0A0B] border-l border-white/5 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#0D0D0F]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  AI Influencer Stratejisti
                </h3>
                <p className="text-[11px] text-slate-500">
                  {videoResult ? `${videoResult.videoTitle.substring(0, 26)}...` : 'Video İçerik Asistanı'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-3 border-b border-white/5 bg-[#151518]/50 overflow-x-auto no-scrollbar flex gap-2">
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="px-2.5 py-1.5 rounded-lg bg-[#0D0D0F] hover:bg-white/5 border border-white/5 text-[11px] text-slate-300 hover:text-blue-400 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1"
              >
                <Lightbulb className="w-3 h-3 text-blue-400" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-[#151518] border border-white/5 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <div className="markdown-body space-y-2 text-slate-200 prose prose-invert prose-xs">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <span
                    className={`block text-[9px] mt-1.5 font-mono ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                <span>Stratejist düşünüyor ve araştırıyor...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/5 bg-[#0D0D0F]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Örn: Bu videoya alternatif 3 kanca yaz..."
                disabled={isSending}
                className="flex-1 bg-[#151518] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
