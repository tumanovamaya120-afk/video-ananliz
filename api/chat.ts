import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

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

export default async function handler(req: any, res: any) {
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

  const { messages = [], videoContext = null } = body;
  const userMessage = messages[messages.length - 1]?.text || 'Merhaba';

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        text: generateFallbackChatResponse(userMessage, videoContext)
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build-vercel' }
      }
    });

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

    let chatResponseText = '';
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const m of modelsToTry) {
      try {
        const chat = ai.chats.create({
          model: m,
          config: { systemInstruction, temperature: 0.7 }
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
        // Try next model
      }
    }

    if (!chatResponseText) {
      chatResponseText = generateFallbackChatResponse(userMessage, videoContext);
    }

    return res.status(200).json({
      success: true,
      text: chatResponseText
    });
  } catch {
    return res.status(200).json({
      success: true,
      text: generateFallbackChatResponse(userMessage, videoContext)
    });
  }
}
