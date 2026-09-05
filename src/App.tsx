import React, { useState, useEffect } from 'react';
import { VideoFrame, VideoMetadata, VideoAnalysisResult } from './types';
import { Header } from './components/Header';
import { VideoUploadZone } from './components/VideoUploadZone';
import { AnalysisResultsView } from './components/AnalysisResultsView';
import { InfluencerChatDrawer } from './components/InfluencerChatDrawer';
import { TrendExplorerModal } from './components/TrendExplorerModal';
import { HistorySidebar } from './components/HistorySidebar';
import { AlertCircle, X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'trendlens_history_v1';

export default function App() {
  const [activeAnalysis, setActiveAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [history, setHistory] = useState<VideoAnalysisResult[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTrendsOpen, setIsTrendsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        if (!response.ok) {
          if (response.status === 404 || rawText.includes('The page could not be found') || rawText.includes('NOT_FOUND')) {
            throw new Error('Vercel API yönlendirme hatası (404): Vercel sunucusuz fonksiyonları yapılandırılıyor olabilir. Lütfen projenin güncel halini (vercel.json ve api/index.ts) Vercel\'e aktardığınızdan ve Vercel Settings > Environment Variables bölümüne GEMINI_API_KEY eklediğinizden emin olun.');
          }
          throw new Error(`Sunucu hatası (${response.status}): ${rawText.slice(0, 100)}`);
        }
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error('Sunucudan geçerli bir JSON formatında yanıt alınamadı.');
        }
      }

      if (data.success && data.data) {
        const result: VideoAnalysisResult = data.data;
        setActiveAnalysis(result);
        saveToHistory(result);
      } else {
        throw new Error(data.error || 'Video analizi tamamlanamadı.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      let message = err?.message || 'Video analizi sırasında bir bağlantı veya işleme hatası oluştu. Lütfen tekrar deneyin.';
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
        message = 'Gemini API istek/kota limiti aşıldı. Lütfen kısa bir süre bekleyip tekrar deneyin.';
      }
      setApiError(message);
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
