import React from 'react';
import { SimilarVideoContent } from '../types';
import { ExternalLink, Flame, Sparkles, TrendingUp, Video } from 'lucide-react';

interface SimilarContentCardProps {
  content: SimilarVideoContent;
}

export const SimilarContentCard: React.FC<SimilarContentCardProps> = ({ content }) => {
  // Match score badge
  const getMatchBadge = (score: number) => {
    if (score >= 90) {
      return 'bg-green-500 text-black';
    }
    if (score >= 80) {
      return 'bg-yellow-500 text-black';
    }
    return 'bg-blue-500 text-black';
  };

  // Generate a fallback search URL if direct URL is not provided
  const searchUrl = content.url && content.url.startsWith('http')
    ? content.url
    : `https://www.google.com/search?q=${encodeURIComponent(`${content.platform} ${content.title} ${content.creatorOrChannel || ''}`)}`;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#151518] p-5 hover:border-white/15 transition-all duration-200">
      <div>
        {/* Header: Platform & Match Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 border border-white/5 rounded">
            {content.platform}
          </span>

          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getMatchBadge(content.similarityScore)}`}>
            %{content.similarityScore} EŞLEŞME
          </div>
        </div>

        {/* Title & Creator */}
        <h4 className="font-semibold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors">
          {content.title}
        </h4>
        
        {content.creatorOrChannel && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Video className="w-3.5 h-3.5 text-slate-600" />
            {content.creatorOrChannel}
          </p>
        )}

        {/* Content Angle */}
        {content.contentAngle && (
          <div className="mt-2.5 inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            Açı: {content.contentAngle}
          </div>
        )}

        {/* Why Similar & Viral Secret */}
        <div className="mt-3.5 space-y-2 text-xs">
          <div className="p-3 rounded-lg bg-[#0D0D0F] border border-white/5">
            <p className="text-slate-400 font-bold mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider">
              Neden Benziyor?
            </p>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {content.whySimilar}
            </p>
          </div>

          {/* Viral Factor */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 font-bold mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <Flame className="w-3 h-3 text-blue-400" />
              Viral Olma Sırrı
            </p>
            <p className="text-slate-200 leading-relaxed font-normal text-[11px]">
              {content.viralFactor}
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Estimated Impact & Search / View Link */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-green-400" />
          {content.estimatedViewsOrImpact || 'Yüksek Etkileşim Trendi'}
        </span>

        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-colors"
        >
          <span>İçeriği İncele</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>
    </div>
  );
};
