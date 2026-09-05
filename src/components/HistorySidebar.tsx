import React from 'react';
import { VideoAnalysisResult } from '../types';
import { X, Clock, Trash2, ChevronRight, Video, Sparkles } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: VideoAnalysisResult[];
  onSelect: (item: VideoAnalysisResult) => void;
  onClear: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A0A0B] border-l border-white/5 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#0D0D0F]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Geçmiş Analizler
                </h3>
                <p className="text-[11px] text-slate-500">
                  Önceki video incelemeleri ve bulunan benzerler
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

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <Video className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p>Henüz kayıtlı analiz geçmişi yok.</p>
                <p className="text-[11px]">İlk videonuzu analiz ettiğinizde burada saklanacaktır.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-white/5 bg-[#151518] hover:bg-[#1a1a1f] hover:border-white/15 cursor-pointer transition-all flex items-start gap-3 group"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.videoTitle}
                      className="w-12 h-14 rounded-lg object-cover flex-shrink-0 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-lg bg-[#0D0D0F] flex items-center justify-center text-slate-400 flex-shrink-0 border border-white/10">
                      <Video className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">
                        {item.primaryNiche}
                      </span>
                      <span className="text-[10px] font-bold text-green-400">
                        %{item.overallScore}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {item.videoTitle}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>{item.similarContents?.length || 0} Benzer İçerik</span>
                      <span>•</span>
                      <span>{new Date(item.analyzedAt).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 self-center" />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-3 border-t border-white/5 bg-[#0D0D0F] flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">
                {history.length} video kayıtlı
              </span>
              <button
                onClick={onClear}
                className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Geçmişi Temizle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
