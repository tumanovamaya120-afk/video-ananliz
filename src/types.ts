export interface VideoFrame {
  timestamp: number;
  dataUrl: string; // base64 data url
}

export interface VideoMetadata {
  name: string;
  duration: number;
  width: number;
  height: number;
  sizeFormatted: string;
  targetPlatform?: 'all' | 'reels' | 'tiktok' | 'shorts';
  niche?: string;
  creatorNotes?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface SimilarVideoContent {
  title: string;
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts' | 'Web / General';
  creatorOrChannel?: string;
  similarityScore: number; // 0-100
  whySimilar: string;
  viralFactor: string;
  estimatedViewsOrImpact?: string;
  contentAngle: string;
  url?: string;
}

export interface VideoHookAnalysis {
  hookType: string;
  ratingOutOf10: number;
  first3SecondsReview: string;
  visualRetentionTrigger: string;
  audioHookDescription: string;
  improvementTip: string;
}

export interface VideoAnalysisResult {
  id: string;
  analyzedAt: string;
  videoTitle: string;
  videoDuration: number;
  thumbnailUrl?: string;
  primaryNiche: string;
  subNiche: string;
  overallScore: number; // 1-100
  summary: string;
  
  hookAnalysis: VideoHookAnalysis;
  
  styleBreakdown: {
    visualPacing: string;
    cameraWork: string;
    lightingAndColor: string;
    textOverlays: string;
    audioEnergy: string;
  };

  narrativeStructure: {
    format: string;
    steps: { time: string; phase: string; description: string }[];
  };

  viralityMetrics: {
    shareability: number; // 1-10
    saveability: number; // 1-10
    commentBaitPotential: number; // 1-10
    watchTimePotential: number; // 1-10
    psychologicalTriggers: string[];
  };

  similarContents: SimilarVideoContent[];
  webGroundingSources: GroundingSource[];
  trendingKeywords: string[];
  trendingHashtags: string[];

  creatorPlaybook: {
    alternativeHooks: {
      style: string;
      script: string;
      whyItWorks: string;
    }[];
    nextVideoIdeas: {
      title: string;
      concept: string;
      predictedFormat: string;
    }[];
    differentiatorAdvice: string;
    bestTimeToPostAndAudioTips: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SampleVideo {
  id: string;
  title: string;
  niche: string;
  duration: number;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: '9:16' | '16:9';
  tag: string;
}
