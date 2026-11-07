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

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('جاري الاتصال بخدمة Microsoft Edge TTS لتوليد صوت شاكر المصري ar-EG-ShakirNeural...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const [key, text] of Object.entries(PROMPTS)) {
    const filePath = path.join(OUTPUT_DIR, `${key}.mp3`);
    try {
      console.log(`توليد [${key}]: ${text}`);
      const readable = tts.toStream(text, { rate: '+4%' });
      const writeStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        readable.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      console.log(`✓ تم إنشاء ${key}.mp3 (${fs.statSync(filePath).size} bytes)`);
    } catch (err) {
      console.error(`خطأ في توليد ${key}:`, err);
    }
  }

  console.log(`\nتم إنشاء كافة ملفات الصوت البشري المصري بنجاح داخل: ${OUTPUT_DIR}`);
}

main().catch(console.error);
