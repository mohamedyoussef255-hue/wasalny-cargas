import fs from 'fs';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE = 'ar-EG-ShakirNeural';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'sounds');

const PROMPTS = {
  // دورة حياة المسار
  "route_start": "تم بدء المسار.. توجه نحو الوجهة المحددة.",
  "rerouting": "جاري إعادة حساب المسار.",
  "destination_arrived": "حمد الله على السلامة، لقد وصلت إلى وجهتك.",

  // المناورات الفورية
  "turn_right_now": "اتجه يميناً الآن.",
  "turn_left_now": "اتجه يساراً الآن.",
  "u_turn": "قم بالدوران للخلف بأمان.",

  // مسافات التحذير
  "turn_right_100m": "بعد مائة متر، اتجه يميناً.",
  "turn_left_100m": "بعد مائة متر، اتجه يساراً.",
  "turn_right_500m": "بعد خمسمائة متر، اتجه يميناً.",
  "turn_left_500m": "بعد خمسمائة متر، اتجه يساراً.",

  // مسارات وميادين
  "keep_right": "الزم المسار الأيمن.",
  "keep_left": "الزم المسار الأيسر.",
  "continue_straight": "استمر للأمام مباشرة على نفس الطريق.",
  "roundabout_first_exit": "ادخل الميدان واسلك المخرج الأول.",

  // محطات كارجاس (Cargas)
  "cargas_approaching": "محطة كارجاس على بعد خمسمائة متر.",
  "cargas_nearby": "محطة كارجاس على يمينك بعد مائتي متر.",
  "cargas_arrived": "لقد وصلت إلى محطة كارجاس.. تمون بالسلامة إن شاء الله."
};

async function generateFile(tts, key, text) {
  const filePath = path.join(OUTPUT_DIR, `${key}.mp3`);
  return new Promise((resolve, reject) => {
    try {
      const { audioStream } = tts.toStream(text, { rate: '+4%' });
      const ws = fs.createWriteStream(filePath);
      audioStream.pipe(ws);
      ws.on('finish', () => {
        const size = fs.statSync(filePath).size;
        console.log(`✓ ${key}.mp3 (${size} bytes)`);
        resolve();
      });
      audioStream.on('error', (err) => {
        ws.destroy();
        reject(err);
      });
      ws.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('جاري تهيئة محرك Microsoft Edge TTS للصوت البشري المصري (شاكر)...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const [key, text] of Object.entries(PROMPTS)) {
    try {
      await generateFile(tts, key, text);
    } catch (e) {
      console.error(`خطأ في توليد ${key}:`, e);
    }
  }

  console.log('اكتمل توليد كافة الملفات الصوتية بنجاح!');
  process.exit(0);
}

main().catch((err) => {
  console.error('فشل رئيسي في التوليد:', err);
  process.exit(1);
});
