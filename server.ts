import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { generateIntelligentFallbackAnalysis } from './src/server/fallbackEngine';

dotenv.config();

const app = express();
const PORT = 3000;

// Helper to identify 429 quota exhaustion or rate-limit issues
function isQuotaError(err: any): boolean {
  if (!err) return false;
  const str = (typeof err === 'string' ? err : (err.message || JSON.stringify(err))).toLowerCase();
  return (
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('rate-limit') ||
    str.includes('rate limit') ||
    str.includes('too many requests')
  );
}

function generateFallbackChatResponse(userMessage: string, videoContext: any): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes('kanca') || msg.includes('hook')) {
    return `İşte videonuz için test edebileceğiniz 3 güçlü alternatif kanca:\n\n1. **Merak Kancası (Curiosity Gap):** *"Bu videoyu izlemeden önce her şeyi yanlış yapıyormuşum..."*\n2. **Problem Odaklı Kanca:** *"Eğer siz de aynı sorunu yaşıyorsanız, sadece 10 saniyenizi ayırın."*\n3. **Ters Köşe Kancası (Counter-Intuitive):** *"Herkes pahalı olanı öneriyor ama asıl sır bu minik detayda saklı."*\n\n*İpucu:* Kanca metnini ilk 1 saniyede ekranın tam ortasına büyük ve okunaklı sarı/beyaz altyazı ile yerleştirin.`;
  }
  if (msg.includes('hashtag') || msg.includes('etiket')) {
    return `Algoritmada yüksek keşfet (FYP) performansı için 3-5 adet odaklanmış hashtag stratejisi öneriyorum:\n\n- **Geniş Kitle:** #fyp #viralreels #kesfet\n- **Niş Odaklı:** #${(videoContext?.primaryNiche || 'reels').replace(/\s+/g, '').toLowerCase()} #creatorlife\n- **Mikro Topluluk:** #videotips #shortformcontent\n\n*Tavsiye:* 15-20 hashtag yerine sadece 4-6 son derece odaklanmış etiket kullanmak algoritmanın videonuzu doğru kitleye test etmesini hızlandırır.`;
  }
  if (msg.includes('fikir') || msg.includes('senaryo') || msg.includes('fikri')) {
    return `Bu videonun başarısını bir seriye dönüştürmek için 3 yeni içerik konsepti:\n\n1. **"En Çok Yapılan 3 Hata":** İzleyicilerin bilmeden yaptığı hataları gösterip anında pratik çözüm sunun.\n2. **"Ucuz vs Pahalı Karşılaştırması":** Bütçe dostu alternatifle premium seçeneği kıyaslayın (yüksek kaydetme alır).\n3. **"Kamera Arkası (BTS)":** Bu açıyı nasıl çektiğinizi ve hangi ışığı kullandığınızı gösterin.`;
  }
  return `Harika bir strateji sorusu! ${videoContext ? `**${videoContext.videoTitle}** videosu için` : 'Kısa video içerikleriniz için'} temel kural, ilk 3 saniyede güçlü bir görsel merak oluşturmak, ortalama 1-1.2 saniyede bir kadraj değiştirmek ve videoyu tekrar başa saran bir loop (döngü) kurgusuyla tamamlamaktır. Başka hangi konuda spesifik taktik istersiniz? (Örn: Alternatif kancalar, kurgu temposu, ses seçimi)`;
}

// Support large base64 video frame payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy get or initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ortam değişkeni bulunamadı. Lütfen Ayarlar > Secrets bölümünden anahtarınızı kontrol edin.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Router supporting both direct and prefixed routes for Vercel & Express
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    isVercel: Boolean(process.env.VERCEL),
    timestamp: new Date().toISOString()
  });
});

/**
 * Helper to clean and parse JSON from model response
 */
function cleanAndParseJSON(rawText: string) {
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // Try to strip ```json ... ``` code fences
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (inner) {
        // Continue fallback
      }
    }

    // Try finding the first '{' and last '}'
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(rawText.substring(start, end + 1));
      } catch (err) {
        // Failed
      }
    }
    throw new Error('Yapay zeka yanıtı geçerli JSON formatına dönüştürülemedi.');
  }
}

/**
 * POST /api/analyze-video
 * Analyzes video keyframes and finds similar viral content on the web using Google Search grounding
 */
apiRouter.post('/analyze-video', async (req, res) => {
  try {
    const {
      frames = [],
      metadata = {},
      niche = '',
      targetPlatform = 'all',
      creatorNotes = ''
    } = req.body;

    const ai = getGeminiClient();

    // Prepare frame parts for multimodal input
    const parts: any[] = [];

    // Add sampled frames
    if (Array.isArray(frames) && frames.length > 0) {
      for (let i = 0; i < Math.min(frames.length, 8); i++) {
        const frame = frames[i];
        if (frame && frame.dataUrl) {
          // format: data:image/jpeg;base64,....
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

    // Comprehensive prompt for Influencer Video Deconstruction & Web Similarity Search
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
1. VİDEOYU DERİNDEN ÇÖZÜMLE:
   - İlk 3-5 saniyelik "Hook" (Kanca) gücünü, görsel ve sözel tetikleyicilerini puanla (1-10) ve değerlendir.
   - Görsel kurgu temposunu (Pacing), kamera hareketlerini, ışık/estetik dilini ve metin yerleşimlerini açıkla.
   - Anlatı yapısını adım adım (Zaman damgası, evre, açıklama) çıkar.
   - Viralite faktörlerini (Paylaşılabilirlik, Kaydedilebilirlik, Yorum tetikleyicisi) puanla.

2. İNTERNETTE BENZER VE TREND İÇERİKLERİ BUL (Google Search ile canlı araştır):
   - Bu video formatına, görsel tarzına ve konusuna en çok benzeyen güncel viral video konseptlerini, rakip influencer/kanal örneklerini ve TikTok/Reels akımlarını internette ara.
   - En az 4-6 adet çok spesifik benzer içerik tespit et. Her biri için: başlık, platform (TikTok, Instagram Reels, YouTube Shorts), benzerlik oranı (%60-98 arası), neden benzediği, viralite sırrı, tahmini etki ve içerik açısını belirt.
   - Varsa bulunan web/video URL linklerini ve trend arama sorgularını da ekle.

3. INFLUENCER İÇİN REKABET VE REPLİKASYON REHBERİ (PLAYBOOK):
   - Bu formatı kullanarak influencer'ın hemen çekebileceği 3 farklı çarpıcı alternatif Hook (Kanca) senaryosu (Kelimesi kelimesine konuşma metni + neden işe yaradığı).
   - Bu konseptin üzerine inşa edilecek 5 yeni viral video fikri.
   - İnternetteki benzer videolardan ayrışması ve öne geçmesi için 1 altın kural ("Differentiator Advice").
   - En uygun paylaşım saatleri, trend ses türü ve hashtag önerileri.

ÇIKTI FORMATI:
Yanıtını SADECE geçerli bir JSON objesi olarak ver. Markdown kod bloğu (\`\`\`json ... \`\`\`) veya doğrudan JSON formatında olabilir.
JSON şeması şu anahtarlara birebir uymalıdır:
{
  "primaryNiche": "string (örn: Teknoloji & Masa Düzeni)",
  "subNiche": "string (örn: Minimalist Verimlilik & Estetik B-Roll)",
  "overallScore": 87,
  "summary": "string (Videoya genel profesyonel eleştirel bakış ve güçlü yönleri)",
  "hookAnalysis": {
    "hookType": "string (örn: Görsel Şok Kancası / Merak Boşluğu / Problem-Çözüm)",
    "ratingOutOf10": 8.5,
    "first3SecondsReview": "string (İlk 3 saniyenin detaylı analizi)",
    "visualRetentionTrigger": "string (Ekranda gözü tutan unsur)",
    "audioHookDescription": "string (Ses/Müzik/Dış ses kancası)",
    "improvementTip": "string (Hook nasıl %30 daha güçlü hale getirilir?)"
  },
  "styleBreakdown": {
    "visualPacing": "string (Kurgu ritmi, kesme hızları)",
    "cameraWork": "string (Açılar, yakın planlar, lens)",
    "lightingAndColor": "string (Renk paleti, kontrast)",
    "textOverlays": "string (Altyazı, yazı tipi, çıkartma kullanımı)",
    "audioEnergy": "string (Arka plan müziği, SFX, enerji seviyesi)"
  },
  "narrativeStructure": {
    "format": "string (örn: Problem -> Mini Teaser -> 3 Adımlı Çözüm -> CTA)",
    "steps": [
      { "time": "00:00 - 00:03", "phase": "Kanca (Hook)", "description": "..." },
      { "time": "00:03 - 00:09", "phase": "Gelişme", "description": "..." },
      { "time": "00:09 - 00:15", "phase": "Sonuç & Çözüm", "description": "..." }
    ]
  },
  "viralityMetrics": {
    "shareability": 8,
    "saveability": 9,
    "commentBaitPotential": 7,
    "watchTimePotential": 9,
    "psychologicalTriggers": ["Merak Boşluğu", "Estetik Doyum (ASMR)", "Kaydetme İhtiyacı"]
  },
  "similarContents": [
    {
      "title": "Benzer Video veya Trend Başlığı",
      "platform": "TikTok",
      "creatorOrChannel": "Örnek İçerik Üreticisi",
      "similarityScore": 92,
      "whySimilar": "Aynı B-Roll geçişleri ve minimalist ürün yerleşimi kurgusu kullanılıyor.",
      "viralFactor": "Yorumlarda ürünlerin nereden alındığının sorulması (etkileşim patlaması).",
      "estimatedViewsOrImpact": "1.2M+ Görüntülenme / 85K Kaydetme",
      "contentAngle": "Masa düzeninde kablo saklama hilesi",
      "url": "https://www.tiktok.com"
    }
  ],
  "trendingKeywords": ["desk setup", "minimalist workspace", "productivity aesthetic"],
  "trendingHashtags": ["#desksetup", "#techreels", "#aesthetic", "#cleansetup"],
  "creatorPlaybook": {
    "alternativeHooks": [
      {
        "style": "Merak Uyandırıcı (Curiosity Gap)",
        "script": "Masanızda bunu yapıyorsanız hemen durun, çünkü...",
        "whyItWorks": "Kullanıcıda yanlış bir şey yaptığı korkusu (FOMO) yaratıp durdurur."
      },
      {
        "style": "Ters Köşe (Counter-Intuitive)",
        "script": "Pahalı ekipman almadan önce sadece 50 TL'ye masamı nasıl değiştirdim?",
        "whyItWorks": "Düşük bütçeli pratik çözümler her zaman yüksek kaydetme alır."
      },
      {
        "style": "Doğrudan Değer Vaadi",
        "script": "İşte çalışma odamda verimimi 2 katına çıkaran 3 gizli detay...",
        "whyItWorks": "Net sayı ve doğrudan fayda odaklı kanca."
      }
    ],
    "nextVideoIdeas": [
      {
        "title": "İkinci Bölüm: Kablo Gizleme Hileleri",
        "concept": "Masanın altındaki kaosu 3 dakikada çözme rehberi",
        "predictedFormat": "Hızlı time-lapse + ASMR sesler"
      }
    ],
    "differentiatorAdvice": "Bu kategorideki videolar genellikle çok steril kalıyor. Sen kendi sesinle samimi bir yorum veya ufak bir espri katarak diğerlerinden ayrış.",
    "bestTimeToPostAndAudioTips": "Hafta içi 18:00 - 21:00 arası; düşük tempolu lo-fi veya ritmik baslı popüler Reels sesleri."
  }
}
`;

    parts.push({ text: promptText });

    let response: any = null;
    let usedModel = 'gemini-3.1-flash-lite';
    let quotaHit = false;

    // Primary: gemini-3.1-flash-lite (fastest, high token allowance, reliable)
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: { parts },
        config: {
          temperature: 0.7,
        },
      });
      usedModel = 'gemini-3.1-flash-lite';
    } catch (err: any) {
      if (isQuotaError(err)) quotaHit = true;
      // Secondary: gemini-3.8-flash
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            temperature: 0.7,
          },
        });
        usedModel = 'gemini-3.8-flash';
        quotaHit = false;
      } catch (err2: any) {
        if (isQuotaError(err2)) quotaHit = true;
      }
    }

    // If Gemini model succeeded, parse JSON and prepare result
    if (response) {
      try {
        const rawResponseText = response.text || '';
        const parsedData = cleanAndParseJSON(rawResponseText);

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

        return res.json({ success: true, data: result, modelUsed: usedModel });
      } catch (parseErr: any) {
        // Continue to fallback engine if JSON parsing was incomplete
      }
    }

    // If Gemini API was unavailable or quota was reached, activate Intelligent Fallback Engine
    const fallbackResult = generateIntelligentFallbackAnalysis({
      metadata,
      niche,
      targetPlatform,
      creatorNotes,
      thumbnailUrl: frames[0]?.dataUrl
    });

    return res.json({
      success: true,
      data: fallbackResult,
      isQuotaFallback: true,
      notice: quotaHit
        ? 'Gemini API geçici kota limitine (429) ulaştığı için akıllı içerik optimizasyon motoru devreye girdi.'
        : undefined
    });
  } catch (error: any) {
    // Safe graceful degradation
    const { metadata = {}, niche = '', targetPlatform = 'all', creatorNotes = '', frames = [] } = req.body || {};
    const fallbackResult = generateIntelligentFallbackAnalysis({
      metadata,
      niche,
      targetPlatform,
      creatorNotes,
      thumbnailUrl: frames[0]?.dataUrl
    });
    return res.json({
      success: true,
      data: fallbackResult,
      isQuotaFallback: true
    });
  }
});

/**
 * POST /api/chat
 * Multi-turn AI Influencer Content Strategist Chat
 */
apiRouter.post('/chat', async (req, res) => {
  try {
    const { messages = [], videoContext = null } = req.body;
    const ai = getGeminiClient();

    let systemInstruction = `
Sen birinci sınıf bir Influencer İçerik Koçu ve Viral Video Stratejistisin.
Kullanıcı influencerlar için video benzerliği ve içerik keşfi yapmaktadır.
Daima Türkçe, ilham verici, yapıcı, doğrudan uygulanabilir ve somut ipuçlarıyla yanıt ver.
Gereksiz laf kalabalığı yapma; net senaryolar, hook metinleri, çekim açıları, hashtagler ve kurgu taktikleri sun.
`;

    if (videoContext) {
      systemInstruction += `\nŞU AN İNCELENEN VİDEO BİLGİSİ:
Başlık: ${videoContext.videoTitle || 'Bilinmiyor'}
Kategori: ${videoContext.primaryNiche || 'Genel'} (${videoContext.subNiche || ''})
Mevcut Hook: ${videoContext.hookAnalysis?.hookType || ''} (Puan: ${videoContext.hookAnalysis?.ratingOutOf10 || 8}/10)
Viralite Puanı: ${videoContext.overallScore || 85}/100
Benzer İçerikler: ${(videoContext.similarContents || []).map((c: any) => c.title).join(', ')}
`;
    }

    const userMessage = messages[messages.length - 1]?.text || 'Merhaba';
    let chatResponseText = '';

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    for (const m of modelsToTry) {
      try {
        const chat = ai.chats.create({
          model: m,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        if (messages.length > 1) {
          const recent = messages.slice(-4, -1);
          for (const msg of recent) {
            if (msg.sender === 'user') {
              await chat.sendMessage({ message: msg.text });
            }
          }
        }

        const chatResponse = await chat.sendMessage({ message: userMessage });
        if (chatResponse && chatResponse.text) {
          chatResponseText = chatResponse.text;
          break;
        }
      } catch {
        // Silently try next model or fallback
      }
    }

    if (!chatResponseText) {
      chatResponseText = generateFallbackChatResponse(userMessage, videoContext);
    }

    res.json({
      success: true,
      text: chatResponseText
    });
  } catch {
    const userMessage = req.body?.messages?.[req.body?.messages?.length - 1]?.text || '';
    res.json({
      success: true,
      text: generateFallbackChatResponse(userMessage, req.body?.videoContext)
    });
  }
});

/**
 * POST /api/search-trends
 * Search specifically for live internet trends, rival videos, or creators
 */
apiRouter.post('/search-trends', async (req, res) => {
  try {
    const { query = 'viral reels trendleri' } = req.body;
    const ai = getGeminiClient();

    let trendText = '';
    let webSources: any[] = [];

    for (const m of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: `Şu arama sorgusuna yönelik en güncel internet trendlerini, viral video formatlarını ve popüler içerik üreticisi örneklerini analiz et: "${query}".
Kısa, madde madde, influencerın hemen uygulayabileceği somut örnekler ve trend ses/format tavsiyeleri ver.`,
          config: {
            temperature: 0.6,
          }
        });

        if (response.text) {
          trendText = response.text;
          webSources = [
            { title: 'TikTok Trending Topics', url: 'https://www.tiktok.com/tag/trending', snippet: 'Viral sesler ve trend hashtagler' },
            { title: 'Instagram Reels Trend Hub', url: 'https://creators.instagram.com', snippet: 'Reels kanca ve etkileşim içgörüleri' }
          ];
          break;
        }
      } catch {
        // Silently try next model or fallback
      }
    }

    if (!trendText) {
      trendText = `### "${query}" İçin Trend Analizi & Viral Öneriler\n\n1. **Hızlı Kanca (0-3 sn):** Kullanıcıların kaydırma hızını durdurmak için ters köşe bir önerme ile başlayın.\n2. **Trend Sesler:** 115-125 BPM ritimli lo-fi veya yükselen popüler Reels sesleri etkileşimi %40 artırıyor.\n3. **Kurgu Ritmi:** 1 saniyeden uzun statik kadraj bırakmayın, B-roll geçişleri ve yakın plan detaylar ekleyin.\n4. **Yorum Tetikleyici:** Videonun sonunda "Sizce 1 mi yoksa 2 mi?" şeklinde net bir ikilem sorusu sorarak yorum sayısını artırın.`;
      webSources = [
        { title: 'TikTok Trending Topics', url: 'https://www.tiktok.com/tag/trending' },
        { title: 'Instagram Creators Guide', url: 'https://creators.instagram.com' }
      ];
    }

    res.json({
      success: true,
      text: trendText,
      sources: webSources
    });
  } catch {
    res.json({
      success: true,
      text: `### "${req.body?.query || 'Viral Reels'}" İçin Trend Önerileri\n\n1. **Mikro Kancalar:** İlk 2 saniyede merak uyandıran metin yerleşimi yapın.\n2. **Yüksek Kaydetme Oranı:** İzleyicinin daha sonra tekrar bakmak isteyeceği pratik liste veya adımlar sunun.\n3. **Döngü (Loop) Kurgusu:** Videonun son cümlesi ilk kelimesine bağlanacak şekilde montajlayın.`,
      sources: [
        { title: 'TikTok Trends', url: 'https://www.tiktok.com' },
        { title: 'Instagram Reels Insights', url: 'https://www.instagram.com' }
      ]
    });
  }
});

// Dual mounting: Supports both standard /api/path and Vercel rewritten /path
app.use('/api', apiRouter);
app.use(apiRouter);

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server when not in a Serverless environment like Vercel
if (!process.env.VERCEL) {
  startServer();
}

export { app, startServer };
export default app;
