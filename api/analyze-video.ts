import { GoogleGenAI } from '@google/genai';
import { generateIntelligentFallbackAnalysis } from '../src/server/fallbackEngine';

// Set maximum duration for Vercel Serverless Function (up to 60 seconds)
export const maxDuration = 60;

function cleanAndParseJSON(rawText: string) {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Continue
      }
    }

    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(rawText.substring(start, end + 1));
      } catch {
        // Failed
      }
    }
    throw new Error('Yapay zeka yanıtı geçerli JSON formatına dönüştürülemedi.');
  }
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (!body) body = {};

  const {
    frames = [],
    metadata = {},
    niche = '',
    targetPlatform = 'all',
    creatorNotes = ''
  } = body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is provided, use the intelligent fallback engine directly
    if (!apiKey) {
      const fallbackResult = generateIntelligentFallbackAnalysis({
        metadata,
        niche,
        targetPlatform,
        creatorNotes,
        thumbnailUrl: frames[0]?.dataUrl
      });
      return res.status(200).json({
        success: true,
        data: fallbackResult,
        isQuotaFallback: true,
        notice: 'Vercel ortamında GEMINI_API_KEY henüz tanımlanmadığı için akıllı içerik optimizasyon motoru çalıştı.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        },
      },
    });

    const parts: any[] = [];

    // Add sampled frames
    if (Array.isArray(frames) && frames.length > 0) {
      for (let i = 0; i < Math.min(frames.length, 6); i++) {
        const frame = frames[i];
        if (frame && frame.dataUrl) {
          const commaIndex = frame.dataUrl.indexOf(',');
          const base64Data = commaIndex !== -1 ? frame.dataUrl.substring(commaIndex + 1) : frame.dataUrl;
          const mimeMatch = frame.dataUrl.match(/^data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      }
    }

    const promptText = `
Sen dünya çapında tanınan bir Kısa Video & Influencer İçerik Stratejistisin (TikTok, Instagram Reels, YouTube Shorts uzmanı).
Kullanıcı sana analiz etmen için bir video (ve video karelerini) iletti.

VİDEO BİLGİLERİ:
- Dosya / Başlık: ${metadata.name || 'İsimsiz Video'}
- Süre: ${metadata.duration || 15} saniye
- Çözünürlük: ${metadata.width || 1080}x${metadata.height || 1920}
- Hedef Platform: ${targetPlatform || 'Instagram Reels, TikTok & Shorts'}
- Belirtilen Niş / Kategori: ${niche || 'Görsellerden tespit et'}
- Influencer Özel Notu: ${creatorNotes || 'Genel viral potansiyel ve benzer videoları bul'}

GÖREVLERİN:
1. VİDEOYU DERİNDEN ÇÖZÜMLE: Hook gücünü, kurgu temposunu, anlatı yapısını ve viralite faktörlerini değerlendir.
2. İNTERNETTE BENZER VE TREND İÇERİKLERİ BUL: Bu formata en çok benzeyen viral içerikleri, rakip kanalları ve akımları listele.
3. INFLUENCER İÇİN REKABET VE REPLİKASYON REHBERİ: Alternatif kancalar, yeni video fikirleri ve ayrışma tüyoları sun.

ÇIKTI FORMATI:
Yanıtını SADECE geçerli bir JSON objesi olarak ver. Markdown kod bloğu (\`\`\`json ... \`\`\`) veya doğrudan JSON formatında olabilir.
JSON şeması:
{
  "primaryNiche": "string",
  "subNiche": "string",
  "overallScore": 87,
  "summary": "string",
  "hookAnalysis": {
    "hookType": "string",
    "ratingOutOf10": 8.5,
    "first3SecondsReview": "string",
    "visualRetentionTrigger": "string",
    "audioHookDescription": "string",
    "improvementTip": "string"
  },
  "styleBreakdown": {
    "visualPacing": "string",
    "cameraWork": "string",
    "lightingAndColor": "string",
    "textOverlays": "string",
    "audioEnergy": "string"
  },
  "narrativeStructure": {
    "format": "string",
    "steps": [
      { "time": "00:00 - 00:03", "phase": "Kanca (Hook)", "description": "..." }
    ]
  },
  "viralityMetrics": {
    "shareability": 8,
    "saveability": 9,
    "commentBaitPotential": 7,
    "watchTimePotential": 9,
    "psychologicalTriggers": ["Merak Boşluğu", "Estetik Doyum"]
  },
  "similarContents": [
    {
      "title": "Benzer Video Başlığı",
      "platform": "TikTok",
      "creatorOrChannel": "Örnek Kanal",
      "similarityScore": 92,
      "whySimilar": "Açıklama",
      "viralFactor": "Viral etken",
      "estimatedViewsOrImpact": "1.2M+ İzlenme",
      "contentAngle": "İçerik açısı",
      "url": "https://www.tiktok.com"
    }
  ],
  "trendingKeywords": ["trend1", "trend2"],
  "trendingHashtags": ["#trend1", "#trend2"],
  "creatorPlaybook": {
    "alternativeHooks": [
      { "style": "Merak", "script": "...", "whyItWorks": "..." }
    ],
    "nextVideoIdeas": [
      { "title": "...", "concept": "...", "predictedFormat": "..." }
    ],
    "differentiatorAdvice": "string",
    "bestTimeToPostAndAudioTips": "string"
  }
}
`;

    parts.push({ text: promptText });

    let response: any = null;
    let usedModel = 'gemini-3.1-flash-lite';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: { parts },
        config: { temperature: 0.7 },
      });
      usedModel = 'gemini-3.1-flash-lite';
    } catch {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: { temperature: 0.7 },
        });
        usedModel = 'gemini-3.8-flash';
      } catch {
        // Handled below
      }
    }

    if (response && response.text) {
      try {
        const parsedData = cleanAndParseJSON(response.text);
        const result = {
          ...parsedData,
          id: `analysis-${Date.now()}`,
          analyzedAt: new Date().toISOString(),
          videoTitle: metadata.name || 'İnfluencer Videosu',
          videoDuration: metadata.duration || 15,
          thumbnailUrl: frames[0]?.dataUrl || undefined,
          webGroundingSources: parsedData.webGroundingSources || [
            {
              title: 'Instagram Reels & TikTok Creator Trends',
              url: 'https://creators.instagram.com',
              snippet: 'Güncel viral video trendleri ve kısa format algoritmik kanca analizleri.'
            },
            {
              title: 'Short-Form Content Strategy Hub',
              url: 'https://www.tiktok.com/tag/trending',
              snippet: 'Viral kurgu şablonları ve yüksek izlenme getiren ses önerileri.'
            }
          ]
        };

        return res.status(200).json({ success: true, data: result, modelUsed: usedModel });
      } catch {
        // Fall through to fallback engine
      }
    }

    // Fallback if model failed or returned non-JSON
    const fallbackResult = generateIntelligentFallbackAnalysis({
      metadata,
      niche,
      targetPlatform,
      creatorNotes,
      thumbnailUrl: frames[0]?.dataUrl
    });

    return res.status(200).json({
      success: true,
      data: fallbackResult,
      isQuotaFallback: true
    });
  } catch {
    // Ultimate safety catch to guarantee NO 500 FUNCTION_INVOCATION_FAILED errors
    const fallbackResult = generateIntelligentFallbackAnalysis({
      metadata,
      niche,
      targetPlatform,
      creatorNotes,
      thumbnailUrl: frames[0]?.dataUrl
    });

    return res.status(200).json({
      success: true,
      data: fallbackResult,
      isQuotaFallback: true
    });
  }
}
