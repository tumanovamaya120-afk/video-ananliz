import React, { useState, useRef } from 'react';
import { VideoFrame, VideoMetadata } from '../types';
import { extractVideoKeyframes } from '../utils/videoProcessor';
import {
  UploadCloud,
  Film,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Layers,
  ArrowRight,
  FileVideo,
  RefreshCw
} from 'lucide-react';

interface VideoUploadZoneProps {
  onStartAnalysis: (payload: {
    frames: VideoFrame[];
    metadata: VideoMetadata;
    targetPlatform: string;
    niche: string;
    creatorNotes: string;
  }) => void;
  isAnalyzing: boolean;
  analysisStep: string;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  onStartAnalysis,
  isAnalyzing,
  analysisStep,
}) => {
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // User input options - default is empty to let AI analyze frames automatically
  const [targetPlatform, setTargetPlatform] = useState<string>('all');
  const [niche, setNiche] = useState<string>('');
  const [creatorNotes, setCreatorNotes] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleProcessFile = async (file: File) => {
    setIsProcessingVideo(true);
    setSelectedVideoFile(file);

    try {
      // Extract keyframes and video duration/dimensions
      const result = await extractVideoKeyframes(file, 4);
      setFrames(result.frames);
      setPreviewUrl(result.previewUrl);
      setMetadata(result.metadata);
    } catch (err) {
      console.error('Video kareleri ayrıştırılırken hata:', err);
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleProcessFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleProcessFile(file);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleSubmit = () => {
    if (!metadata || frames.length === 0) return;
    onStartAnalysis({
      frames,
      metadata,
      targetPlatform,
      niche: niche.trim(),
      creatorNotes: creatorNotes.trim()
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 pt-2 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Influencer Video Analiz & İçerik Radarı</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Videonuzu Yükleyin, <br className="hidden sm:inline" />
          <span className="text-blue-500">
            İnternetteki Benzerlerini & Trendleri
          </span> Keşfedin
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
          Kısa videonuzun görsel kurgusunu, kanca gücünü ve viral potansiyelini yapay zeka ile çözümler; internetteki benzer viral Reels, TikTok ve Shorts videolarını bularak size özel replikasyon rehberi hazırlar.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Preview & Player (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Video Önizleme
                </span>
              </div>
              {metadata && (
                <span className="text-[11px] font-mono font-medium text-slate-400 bg-[#0D0D0F] px-2 py-0.5 rounded border border-white/10">
                  {metadata.duration}s • {metadata.width}x{metadata.height}
                </span>
              )}
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-[9/14] sm:aspect-[9/13] max-h-[460px] w-full bg-[#0D0D0F] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group shadow-inner">
              {previewUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {/* Play / Pause Overlay Button */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center backdrop-blur-sm transition-all scale-90 group-hover:scale-100 opacity-90 group-hover:opacity-100 shadow-2xl border border-white/20"
                    aria-label="Oynat / Durdur"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-1" />
                    )}
                  </button>
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 bg-[#0D0D0F]/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 border border-white/10 flex items-center gap-1.5 max-w-[80%] truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                    <span className="truncate">{metadata?.name || 'Yüklenen Video'}</span>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="text-center p-8 text-slate-500 cursor-pointer hover:text-slate-400 transition-colors flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300 mb-1">Henüz Video Yüklenmedi</p>
                  <p className="text-xs text-slate-500 max-w-[220px]">
                    Sağdaki alandan bir video dosyası seçin veya buraya tıklayın.
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Keyframes Strip */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Analiz Edilecek Video Kareleri {frames.length > 0 && `(${frames.length})`}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Zaman Damgalı</span>
              </div>

              {isProcessingVideo ? (
                <div className="h-16 flex items-center justify-center text-xs text-slate-400 gap-2 bg-[#0D0D0F] rounded-lg border border-white/5">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Kareler ayrıştırılıyor...</span>
                </div>
              ) : frames.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {frames.map((frame, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-md overflow-hidden bg-[#0D0D0F] border border-white/10 aspect-video group/frame"
                    >
                      <img
                        src={frame.dataUrl}
                        alt={`Kare ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/frame:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-slate-300 px-1 rounded">
                        {frame.timestamp}s
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center text-xs text-slate-500 bg-[#0D0D0F] rounded-lg border border-white/5 border-dashed">
                  Video yüklendiğinde otomatik ayrıştırılacaktır
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Upload Methods & Influencer Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
              selectedVideoFile
                ? 'border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10'
                : 'border-white/15 hover:border-blue-500/60 bg-[#0D0D0F] hover:bg-[#151518]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedVideoFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 mb-3 flex items-center justify-center">
                  <FileVideo className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-white text-sm truncate max-w-md">
                  {selectedVideoFile.name}
                </h3>
                <p className="text-xs text-blue-400 mt-1">
                  Video başarıyla yüklendi ve kareleri ayrıştırıldı
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Farklı Bir Video Yükle</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 text-blue-500 mb-3 mx-auto flex items-center justify-center transition-transform group-hover:scale-110">
                  <UploadCloud className="w-10 h-10" />
                </div>
                <h3 className="font-semibold text-white text-base">
                  Videonuzu buraya sürükleyin veya dosya seçin
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  MP4, MOV, WebM formatlarında kısa video (Önerilen: 5-60 saniye)
                </p>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                  <span>Özgün videonuzun kurgu & benzerlik analizini yapar</span>
                </div>
              </>
            )}
          </div>

          {/* Influencer Analysis Preferences */}
          <div className="rounded-2xl border border-white/5 bg-[#151518] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Analiz Kriterleri (İsteğe Bağlı)
                </span>
              </div>
              <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] font-medium rounded">
                Yapay Zeka Destekli
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Platform */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hedef Platform
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full bg-[#0D0D0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="all">Tümü (Instagram Reels, TikTok, YouTube Shorts)</option>
                  <option value="reels">Instagram Reels Algoritması</option>
                  <option value="tiktok">TikTok Algoritması</option>
                  <option value="shorts">YouTube Shorts Algoritması</option>
                </select>
              </div>

              {/* Creator Niche */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori / Niş (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Boş bırakırsanız yapay zeka videodan tespit eder"
                  className="w-full bg-[#0D0D0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Creator Notes / Objective */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Özel İstek veya Hedef (İsteğe Bağlı)
              </label>
              <textarea
                value={creatorNotes}
                onChange={(e) => setCreatorNotes(e.target.value)}
                placeholder="Örn: Bu videonun kurgusunu 15 saniyeye göre optimize etmek ve rakip popüler Reels hesaplarının ne yaptığını görmek istiyorum."
                rows={2}
                className="w-full bg-[#0D0D0F] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing || isProcessingVideo || !selectedVideoFile}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 group active:scale-[0.99]"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{analysisStep || 'Yapay Zeka & Canlı Arama Çalışıyor...'}</span>
                </>
              ) : !selectedVideoFile ? (
                <>
                  <UploadCloud className="w-4 h-4 text-blue-200" />
                  <span>Lütfen Önce Bir Video Yükleyin</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Videonun Benzerlerini Bul & Analiz Et</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {isAnalyzing && (
              <div className="mt-3 p-4 bg-[#151518] border border-white/5 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">{analysisStep || 'Görsel parmak izi taranıyor...'}</span>
                  <span className="text-blue-400 font-mono font-semibold">Gemini + Canlı Arama</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[80%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
