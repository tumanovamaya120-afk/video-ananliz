import React, { useState } from 'react';
import { X, Search, Sparkles, Globe, ExternalLink, Flame, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GroundingSource } from '../types';

interface TrendExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrendExplorerModal: React.FC<TrendExplorerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('minimalist desk setup reels trendleri');
  const [isSearching, setIsSearching] = useState(false);
  const [resultsText, setResultsText] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);

  const sampleKeywords = [
    'minimalist desk setup reels',
    'quick protein recipe tiktok',
    'morning routine vlog aesthetic',
    'fitness 30 day challenge shorts',
    'streetwear outfit transition trend'
  ];

  if (!isOpen) return null;

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() || isSearching) return;

    setIsSearching(true);
    setResultsText(null);
    setSources([]);

    try {
      const res = await fetch('/api/search-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { success: false, text: null };
        }
      }
      if (data.success) {
        setResultsText(data.text);
        setSources(data.sources || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#0D0D0F]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Canlı İnternet Trend Keşfi
              </h3>
              <p className="text-[11px] text-slate-500">
                Google Search destekli gerçek zamanlı TikTok & Reels trend radarı
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

        {/* Search Input & Chips */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-[#151518]/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Örn: 2025/2026 fitness reels trendleri..."
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSearching ? 'Aranıyor...' : 'Trendleri Bul'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">
              Popüler Aramalar:
            </span>
            {sampleKeywords.map((k, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(k);
                  handleSearch(k);
                }}
                className="px-2 py-1 rounded-md bg-[#0D0D0F] hover:bg-white/5 border border-white/5 text-[10px] text-slate-300 hover:text-blue-400 transition-colors whitespace-nowrap"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isSearching && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-300 font-medium">
                Google Search ile internetteki güncel trendler taranıyor...
              </p>
            </div>
          )}

          {!isSearching && resultsText && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#151518] border border-white/5 text-xs text-slate-200 leading-relaxed prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{resultsText}</ReactMarkdown>
              </div>

              {sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Doğrulanan Web Kaynakları ({sources.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sources.map((s, sIdx) => (
                      <a
                        key={sIdx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-[#0D0D0F] border border-white/5 hover:border-white/15 flex items-center justify-between text-xs group transition-colors"
                      >
                        <span className="truncate text-slate-300 group-hover:text-blue-400">
                          {s.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 flex-shrink-0 ml-1.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isSearching && !resultsText && (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
              <p className="font-medium text-slate-300">Merak ettiğiniz niş veya video türünü aratın</p>
              <p className="text-[11px]">Canlı trendler, popüler formatlar ve müzik tavsiyeleri listelenecektir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
