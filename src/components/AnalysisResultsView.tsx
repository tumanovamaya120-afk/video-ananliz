import React, { useState } from 'react';
import { VideoAnalysisResult } from '../types';
import { SimilarContentCard } from './SimilarContentCard';
import {
  Sparkles,
  Flame,
  Globe,
  Film,
  Zap,
  Clock,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Share2,
  Lightbulb,
  Bookmark,
  Target,
  Layers,
  FileText
} from 'lucide-react';

interface AnalysisResultsViewProps {
  result: VideoAnalysisResult;
  onOpenChat: () => void;
  onReset: () => void;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  result,
  onOpenChat,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'similar' | 'hook' | 'playbook'>('similar');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (score >= 70) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar Summary Header */}
      <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {result.thumbnailUrl && (
              <img
                src={result.thumbnailUrl}
                alt={result.videoTitle}
                className="w-16 h-20 rounded-xl object-cover border border-white/10 shadow-md flex-shrink-0"
              />
            )}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {result.primaryNiche}
                </span>
                {result.subNiche && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                    {result.subNiche}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  {result.videoDuration}s Video
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {result.videoTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Viral Score Card & Chat Trigger */}
          <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
            <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(result.overallScore)}`}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Viralite Skoru
              </span>
              <span className="text-2xl font-black">
                {result.overallScore}<span className="text-xs font-normal">/100</span>
              </span>
            </div>

            <button
              onClick={onOpenChat}
              className="px-4 py-2.5 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI İçerik Danışmanı</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('similar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'similar'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>İnternetteki Benzer Videolar & Trendler ({result.similarContents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('hook')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'hook'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hook & Kurgu Analizi</span>
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'playbook'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Replikasyon & Rakip Aşma Rehberi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SIMILAR CONTENTS & LIVE WEB GROUNDING */}
      {activeTab === 'similar' && (
        <div className="space-y-6">
          {/* Section Description */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-blue-400" />
                Google Arama ile Tespit Edilen Benzer Viral İçerikler
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Videonuzun formatı, temposu ve kurgusuna benzeyen güncel TikTok, Reels ve Shorts örnekleri
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Canlı Search Grounding
            </span>
          </div>

          {/* Similar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.similarContents?.map((content, idx) => (
              <SimilarContentCard key={idx} content={content} />
            ))}
          </div>

          {/* Real Web Grounding Sources */}
          {result.webGroundingSources && result.webGroundingSources.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#151518] p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Google Arama ile Doğrulanan Canlı Web ve Sosyal Medya Kaynakları
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {result.webGroundingSources.map((source, sIdx) => (
                  <a
                    key={sIdx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-[#0D0D0F] border border-white/5 hover:border-white/15 transition-colors flex items-start justify-between gap-2 group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                        {source.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {source.url}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Trending Hashtags & Keywords */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  Önerilen Trend Hashtagler
                </h4>
                <button
                  onClick={() => copyToClipboard(result.trendingHashtags.join(' '), 'hashtags')}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedText === 'hashtags' ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Hepsini Kopyala</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.trendingHashtags?.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded-md bg-[#0D0D0F] border border-white/10 text-xs font-medium text-blue-300 hover:border-blue-500/40 cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Algoritma Arama Terimleri (SEO Keywords)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.trendingKeywords?.map((kw, kIdx) => (
                  <span
                    key={kIdx}
                    className="px-2.5 py-1 rounded-md bg-[#0D0D0F] border border-white/10 text-xs font-medium text-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOOK & EDITING ANALYSIS */}
      {activeTab === 'hook' && (
        <div className="space-y-6">
          {/* Hook Deconstruction Card */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  İlk 3 Saniye & Kanca (Hook) Röntgeni
                </h3>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-bold">
                Hook Skoru: {result.hookAnalysis.ratingOutOf10}/10
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0D0D0F] border border-white/10 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kanca Türü
                </span>
                <p className="font-semibold text-white text-sm">
                  {result.hookAnalysis.hookType}
                </p>
                <p className="text-slate-300 leading-relaxed pt-1">
                  {result.hookAnalysis.first3SecondsReview}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0D0D0F] border border-white/10 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Gözü Ekranda Tutan Görsel Unsur
                  </span>
                  <p className="text-slate-200 mt-0.5">
                    {result.hookAnalysis.visualRetentionTrigger}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ses / Dış Ses Kancası
                  </span>
                  <p className="text-slate-200 mt-0.5">
                    {result.hookAnalysis.audioHookDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Improvement Tip */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                Hook'u %30 Daha Güçlü Yapma İpucu
              </span>
              <p className="text-slate-200 leading-relaxed">
                {result.hookAnalysis.improvementTip}
              </p>
            </div>
          </div>

          {/* Style & Editing Breakdown */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-blue-400" />
              Kurgu, Ritim & Görsel Dil Analizi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-slate-400 font-bold block mb-1">Kurgu Temposu (Pacing)</span>
                <p className="text-slate-200 leading-relaxed">{result.styleBreakdown.visualPacing}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-slate-400 font-bold block mb-1">Kamera & Açı</span>
                <p className="text-slate-200 leading-relaxed">{result.styleBreakdown.cameraWork}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-slate-400 font-bold block mb-1">Işık & Renk Dili</span>
                <p className="text-slate-200 leading-relaxed">{result.styleBreakdown.lightingAndColor}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-slate-400 font-bold block mb-1">Altyazı & Metin</span>
                <p className="text-slate-200 leading-relaxed">{result.styleBreakdown.textOverlays}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10 sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Ses & Enerji Seviyesi</span>
                <p className="text-slate-200 leading-relaxed">{result.styleBreakdown.audioEnergy}</p>
              </div>
            </div>
          </div>

          {/* Narrative Timeline */}
          {result.narrativeStructure && (
            <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Zaman Çizelgesi & Anlatı Akışı
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Format: {result.narrativeStructure.format}
                </span>
              </div>

              <div className="space-y-3">
                {result.narrativeStructure.steps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded bg-white/5 text-blue-300 font-mono font-bold text-[11px] border border-white/10">
                        {step.time}
                      </span>
                      <span className="font-bold text-slate-200">
                        {step.phase}
                      </span>
                    </div>
                    <p className="text-slate-300 sm:text-right max-w-xl">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Virality Factors Grid */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Viralite ve Etkileşim Tetikleyicileri
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Paylaşılabilirlik</span>
                <span className="text-xl font-extrabold text-blue-400">{result.viralityMetrics.shareability}/10</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kaydedilebilirlik</span>
                <span className="text-xl font-extrabold text-blue-400">{result.viralityMetrics.saveability}/10</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Yorum Potansiyeli</span>
                <span className="text-xl font-extrabold text-yellow-400">{result.viralityMetrics.commentBaitPotential}/10</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0D0D0F] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">İzlenme Süresi</span>
                <span className="text-xl font-extrabold text-green-400">{result.viralityMetrics.watchTimePotential}/10</span>
              </div>
            </div>

            {result.viralityMetrics.psychologicalTriggers && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">Psikolojik Tetikleyiciler:</span>
                {result.viralityMetrics.psychologicalTriggers.map((trig, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded-md bg-[#0D0D0F] border border-white/10 text-xs font-medium text-slate-200"
                  >
                    {trig}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: INFLUENCER REPLICATION PLAYBOOK */}
      {activeTab === 'playbook' && (
        <div className="space-y-6">
          {/* Stand Out / Differentiator Factor */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 space-y-2">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              İnternetteki Benzerlerinden Sıyrılma Kuralı (Differentiator Factor)
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {result.creatorPlaybook.differentiatorAdvice}
            </p>
          </div>

          {/* Alternative Hook Scripts */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Hemen Çekebileceğiniz 3 Alternatif Viral Kanca Senaryosu
            </h3>
            <p className="text-xs text-slate-400">
              Bu videoyu veya seriyi çekerken kameraya söyleyebileceğiniz hazır açılış cümleleri
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {result.creatorPlaybook.alternativeHooks?.map((hook, hIdx) => (
                <div
                  key={hIdx}
                  className="p-4 rounded-xl bg-[#0D0D0F] border border-white/10 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {hook.style}
                    </span>
                    <blockquote className="text-xs font-semibold text-white italic border-l-2 border-blue-500 pl-2.5 py-0.5">
                      "{hook.script}"
                    </blockquote>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      <strong className="text-slate-300">Neden Tutar:</strong> {hook.whyItWorks}
                    </p>
                  </div>

                  <button
                    onClick={() => copyToClipboard(hook.script, `hook-${hIdx}`)}
                    className="self-end text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 pt-1"
                  >
                    {copiedText === `hook-${hIdx}` ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Metni Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Next 5 Video Ideas */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-400" />
              Bu Formattan Türetebileceğiniz 5 Yeni Video Fikri
            </h3>
            <p className="text-xs text-slate-400">
              Bu videonun yakaladığı etkileşimi seriye dönüştürmek için sonraki içerik planı
            </p>

            <div className="space-y-3 pt-2">
              {result.creatorPlaybook.nextVideoIdeas?.map((idea, iIdx) => (
                <div
                  key={iIdx}
                  className="p-4 rounded-xl bg-[#0D0D0F] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px]">
                        {iIdx + 1}
                      </span>
                      <h4 className="font-bold text-white text-sm">
                        {idea.title}
                      </h4>
                    </div>
                    <p className="text-slate-300 pl-7">
                      {idea.concept}
                    </p>
                  </div>

                  <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-white/5 text-slate-300 text-[11px] font-medium border border-white/10 whitespace-nowrap">
                    {idea.predictedFormat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Posting Time & Audio Tips */}
          <div className="p-4 rounded-xl bg-[#151518] border border-white/5 flex items-center gap-3 text-xs text-slate-300">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">
                Paylaşım Zamanlaması ve Trend Ses Rehberi:
              </span>
              <span>{result.creatorPlaybook.bestTimeToPostAndAudioTips}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
        >
          Farklı Video Yükle
        </button>

        <button
          onClick={onOpenChat}
          className="px-5 py-2.5 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Bu Video Hakkında AI ile Konuş</span>
        </button>
      </div>
    </div>
  );
};
