import { GoogleGenAI } from '@google/genai';
import { generateIntelligentFallbackAnalysis } from '../src/server/fallbackEngine';

// Vercel Serverless Function Configuration
export const maxDuration = 60;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Safe JSON parser for AI outputs
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

    // If no API key is provided, use the adaptive fallback engine directly
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
      for (let i = 0; i < Math.min(frames.length, 4); i++) {
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
Sen dünya çapında tanınan uzman bir Kısa Video & Influencer İçerik Stratejistisin (TikTok, Instagram Reels, YouTube Shorts uzmanı).
Kullanıcı sana analiz etmen için gerçek bir video ve bu videodan çıkarılmış zaman damgalı kareleri (ekran görüntülerini) iletti.

VİDEO BİLGİLERİ:
- Dosya / Başlık: ${metadata.name || 'Özgün Video'}
- Süre: ${metadata.duration || 15} saniye
- Çözünürlük: ${metadata.width || 1080}x${metadata.height || 1920}
- Hedef Platform: ${targetPlatform || 'Instagram Reels, TikTok & Shorts'}
- Belirtilen Niş / Kategori: ${niche || 'Video karelerinden doğrudan tespit et'}
- Influencer Özel Notu: ${creatorNotes || 'Bu videonun konusuna ve kurgu stiline özel analiz yap'}

KRİTİK TALİMAT - VİDEOYU GÖREREK ANALİZ ET:
1. Sana verilen görsel kareleri dikkatle incele. Videoda ne görüyorsun? İnsanlar, mimikler, eylemler, ortam, nesneler, metinler neler?
2. Konu neyse (Örnekler: Yemek tarifi, spor/fitness, dans, sokak röportajı, seyahat, komedi, oyun, araba, moda/makyaj, eğitim, iş/girişimcilik, evcil hayvan, vlog vb.) %100 O KONUYA ÖZEL analiz yap.
3. KESİNLİKLE sabit veya ezbere şablon (örn. masa düzeni, kablo gizleme) üretme! Her video farklıdır ve kendine has viral benzerleri vardır.
4. "similarContents" listesinde, internette bu konseptteki gerçek viral video formatlarını ve popüler rakip hesap/kanal örneklerini listele.

GÖREVLERİN:
1. VİDEOYU DERİNDEN ÇÖZÜMLE: Hook gücünü, kurgu temposunu, anlatı yapısını ve viralite faktörlerini değerlendir.
2. İNTERNETTE BENZER VE TREND İÇERİKLERİ BUL: Bu formata en çok benzeyen viral içerikleri, rakip kanalları ve akımları listele.
3. INFLUENCER İÇİN REKABET VE REPLİKASYON REHBERİ: Alternatif kancalar, yeni video fikirleri ve ayrışma tüyoları sun.

ÇIKTI FORMATI:
Yanıtını SADECE geçerli bir JSON objesi olarak ver. Markdown kod bloğu (\`\`\`json ... \`\`\`) veya doğrudan JSON formatında olabilir.
JSON şeması:
{
  "primaryNiche": "Videodan tespit edilen ana niş (Örn: Yemek & Gastronomi, Fitness, Eğlence & Vlog, vb.)",
  "subNiche": "Videodan tespit edilen alt niş",
  "overallScore": 87,
  "summary": "Bu videonun karelerine ve içeriğine özel profesyonel analiz...",
  "hookAnalysis": {
    "hookType": "Kanca türü",
    "ratingOutOf10": 8.5,
    "first3SecondsReview": "İlk 3 saniye incelemesi",
    "visualRetentionTrigger": "Görsel tutucu öge",
    "audioHookDescription": "İşitsel kanca",
    "improvementTip": "Geliştirme tavsiyesi"
  },
  "styleBreakdown": {
    "visualPacing": "Kurgu temposu",
    "cameraWork": "Kamera dili",
    "lightingAndColor": "Renk & ışık",
    "textOverlays": "Metin kullanımı",
    "audioEnergy": "Ses enerjisi"
  },
  "narrativeStructure": {
    "format": "Anlatı formatı",
    "steps": [
      { "time": "00:00 - 00:03", "phase": "Kanca (Hook)", "description": "..." },
      { "time": "00:03 - 00:09", "phase": "Gelişme", "description": "..." },
      { "time": "00:09 - 00:15", "phase": "Sonuç & CTA", "description": "..." }
    ]
  },
  "viralityMetrics": {
    "shareability": 8,
    "saveability": 9,
    "commentBaitPotential": 7,
    "watchTimePotential": 9,
    "psychologicalTriggers": ["Merak Boşluğu", "Görsel Doyum"]
  },
  "similarContents": [
    {
      "title": "Videoyla doğrudan ilişkili benzer viral içerik başlığı",
      "platform": "Instagram Reels",
      "creatorOrChannel": "Örnek kanal",
      "similarityScore": 92,
      "whySimilar": "Bu video ile benzerliği",
      "viralFactor": "Viral etken",
      "estimatedViewsOrImpact": "1.5M+ İzlenme",
      "contentAngle": "İçerik açısı",
      "url": "https://www.instagram.com/reels"
    }
  ],
  "trendingKeywords": ["kelime1", "kelime2"],
  "trendingHashtags": ["#hashtag1", "#hashtag2"],
  "creatorPlaybook": {
    "alternativeHooks": [
      { "style": "Merak Boşluğu", "script": "...", "whyItWorks": "..." }
    ],
    "nextVideoIdeas": [
      { "title": "...", "concept": "...", "predictedFormat": "..." }
    ],
    "differentiatorAdvice": "Ayrışma tavsiyesi",
    "bestTimeToPostAndAudioTips": "Paylaşım saatleri & ses"
  }
}
`;

    parts.push({ text: promptText });

    let response: any = null;
    let usedModel = 'gemini-3.8-flash';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: { temperature: 0.7 },
      });
      usedModel = 'gemini-3.8-flash';
    } catch {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: { parts },
          config: { temperature: 0.7 },
        });
        usedModel = 'gemini-flash-latest';
      } catch {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: { parts },
            config: { temperature: 0.7 },
          });
          usedModel = 'gemini-3.1-flash-lite';
        } catch {
          // Handled by fallback below
        }
      }
    }

    if (response && response.text) {
      try {
        const parsedData = cleanAndParseJSON(response.text);
        const result = {
          ...parsedData,
          id: `analysis-${Date.now()}`,
          analyzedAt: new Date().toISOString(),
          videoTitle: metadata.name || 'Özgün Video',
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

    // Adaptive fallback if model failed or returned non-JSON
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
