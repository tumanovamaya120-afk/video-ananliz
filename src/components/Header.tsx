import React from 'react';
import { Sparkles, Compass, History, Globe2, Video } from 'lucide-react';

interface HeaderProps {
  onOpenTrends: () => void;
  onOpenHistory: () => void;
  onNewAnalysis: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTrends,
  onOpenHistory,
  onNewAnalysis,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0D0D0F]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onNewAnalysis}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.4)] transition-transform group-hover:scale-105">
            <div className="w-3.5 h-3.5 bg-white rounded-[2px] rotate-45"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                TrendLens<span className="text-blue-500">.</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                Influencer AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Video Analiz & Benzer İçerik Keşfi
            </p>
          </div>
        </div>

        {/* Live Grounding Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Canlı:</span>
          <span className="text-slate-200 font-medium flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-blue-400" />
            Google Search Grounding
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenTrends}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-colors"
            title="Trendleri Araştır"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Trend Keşfi</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-colors"
            title="Geçmiş Analizler"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Geçmiş</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yeni Video</span>
          </button>
        </div>
      </div>
    </header>
  );
};
