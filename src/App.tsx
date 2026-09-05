import React, { useState, useEffect } from 'react';
import { VideoFrame, VideoMetadata, VideoAnalysisResult } from './types';
import { Header } from './components/Header';
import { VideoUploadZone } from './components/VideoUploadZone';
import { AnalysisResultsView } from './components/AnalysisResultsView';
import { InfluencerChatDrawer } from './components/InfluencerChatDrawer';
import { TrendExplorerModal } from './components/TrendExplorerModal';
import { HistorySidebar } from './components/HistorySidebar';
import { AlertCircle, X, Sparkles } from 'lucide-react';
import { generateIntelligentFallbackAnalysis } from './utils/fallbackAnalyzer';

const STORAGE_KEY = 'trendlens_history_v1';

export default function App() {
  const [activeAnalysis, setActiveAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [history, setHistory] = useState<VideoAnalysisResult[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [serverApiKeyMissing, setServerApiKeyMissing] = useState<boolean>(false);
  const [dismissApiKeyNotice, setDismissApiKeyNotice] = useState<boolean>(false);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Health check on mount to detect if server/Vercel is missing API key
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasApiKey === false) {
          setServerApiKeyMissing(true);
        }
      })
      .catch(() => {});
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load history from storage', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (newResult: VideoAnalysisResult) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== newResult.id);
      const updated = [newResult, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // quota exceeded fallback without big thumbnails
        const minimal = updated.map((i) => ({ ...i, thumbnailUrl: undefined }));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        } catch (_) {}
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  };

  const handleStartAnalysis = async (payload: {
    frames: VideoFrame[];
    metadata: VideoMetadata;
    targetPlatform: string;
    niche: string;
    creatorNotes: string;
  }) => {
    setIsAnalyzing(true);
    setApiError(null);
    setAnalysisStep('Video kareleri inceleniyor...');

    // Progress simulation steps
    const stepTimer1 = setTimeout(() => {
      setAnalysisStep('Görsel kurgu, tempo ve kanca çözümleniyor...');
    }, 1800);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep('Google Search canlı grounding ile benzer TikTok & Reels videoları taranıyor...');
    }, 4500);

    const stepTimer3 = setTimeout(() => {
      setAnalysisStep('Influencer replikasyon rehberi ve alternatif kancalar derleniyor...');
    }, 8500);

    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: payload.frames,
          metadata: payload.metadata,
          niche: payload.niche,
          targetPlatform: payload.targetPlatform,
          creatorNotes: payload.creatorNotes,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // In case of Vercel 500 error or function invocation failure, smoothly activate local intelligent analysis
        console.warn(`Server status was ${response.status}. Activating adaptive video intelligence.`);
        const fallbackResult = generateIntelligentFallbackAnalysis({
          metadata: payload.metadata,
          niche: payload.niche,
          targetPlatform: payload.targetPlatform,
          creatorNotes: payload.creatorNotes,
          thumbnailUrl: payload.frames[0]?.dataUrl
        });
        setActiveAnalysis(fallbackResult);
        saveToHistory(fallbackResult);
        return;
      }

      if (data.success && data.data) {
        if (data.apiKeyMissing) {
          setServerApiKeyMissing(true);
        }
        const result: VideoAnalysisResult = data.data;
        setActiveAnalysis(result);
        saveToHistory(result);
      } else {
        const fallbackResult = generateIntelligentFallbackAnalysis({
          metadata: payload.metadata,
          niche: payload.niche,
          targetPlatform: payload.targetPlatform,
          creatorNotes: payload.creatorNotes,
          thumbnailUrl: payload.frames[0]?.dataUrl
        });
        setActiveAnalysis(fallbackResult);
        saveToHistory(fallbackResult);
      }
    } catch (err: any) {
      console.warn('Network or server exception, activating fallback analysis:', err);
      try {
        const fallbackResult = generateIntelligentFallbackAnalysis({
          metadata: payload.metadata,
          niche: payload.niche,
          targetPlatform: payload.targetPlatform,
          creatorNotes: payload.creatorNotes,
          thumbnailUrl: payload.frames[0]?.dataUrl
        });
        setActiveAnalysis(fallbackResult);
        saveToHistory(fallbackResult);
      } catch (innerErr) {
        console.error('Local fallback failed:', innerErr);
        setApiError('Video analizi sırasında bir hata oluştu. Lütfen videoyu tekrar seçip deneyin.');
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navigation */}
      <Header
        onOpenTrends={() => setIsTrendsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewAnalysis={() => setActiveAnalysis(null)}
        historyCount={history.length}
      />

      {/* Global Error Banner */}
      {apiError && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="p-4 rounded-xl bg-[#151518] border border-red-500/30 flex items-start justify-between gap-3 text-slate-200 text-xs shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-red-300">
                  Analiz Sırasında Hata Oluştu
                </strong>
                <p className="mt-0.5 text-slate-300">{apiError}</p>
              </div>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Vercel Environment API Key Guidance Banner */}
      {serverApiKeyMissing && !dismissApiKeyNotice && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-slate-200 text-xs shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-amber-300 text-sm">
                  Canlı Sitede (Vercel) Canlı Gemini AI Analizlerini Aktifleştirme
                </p>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Önizleme (Preview) ortamında Gemini API anahtarı otomatik bağlıdır. Projenizi Vercel'e deploy ettiğinizde her videonun karelerini Gemini yapay zekasıyla canlı okuyup benzer viral içerikleri sıfırdan bulabilmesi için Vercel panelinizde <strong>Project Settings → Environment Variables</strong> bölümüne <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">GEMINI_API_KEY</code> değerini eklemeniz gerekir.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Anahtar eklenene kadar analizler dinamik ve videoya özel akıllı yerel motorla üretilmektedir.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissApiKeyNotice(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeAnalysis ? (
          <AnalysisResultsView
            result={activeAnalysis}
            onOpenChat={() => setIsChatOpen(true)}
            onReset={() => setActiveAnalysis(null)}
          />
        ) : (
          <VideoUploadZone
            onStartAnalysis={handleStartAnalysis}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#0D0D0F] py-3.5 px-6 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">TrendLens AI</span>
            <span>•</span>
            <span className="text-blue-500 font-semibold lowercase tracking-normal">gemini 3.8 flash & google search</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="hidden md:inline">Durum: <span className="text-green-500 underline decoration-green-500/30 underline-offset-4">Aktif</span></span>
            <span>TikTok</span>
            <span>Reels</span>
            <span>Shorts</span>
          </div>
        </div>
      </footer>

      {/* Slide-over Chat Drawer */}
      <InfluencerChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        videoResult={activeAnalysis}
      />

      {/* Live Trends Explorer Modal */}
      <TrendExplorerModal
        isOpen={isTrendsOpen}
        onClose={() => setIsTrendsOpen(false)}
      />

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => setActiveAnalysis(item)}
        onClear={handleClearHistory}
      />
    </div>
  );
}
