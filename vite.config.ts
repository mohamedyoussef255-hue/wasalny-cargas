import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';
import { GoogleGenAI } from '@google/genai';

function aiExtractionPlugin(): Plugin {
  return {
    name: 'ai-station-extraction-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/ai/extract-station-data' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');

            try {
              const payload = JSON.parse(body || '{}');
              const { text, image, mimeType, fileName } = payload;

              const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({
                  success: false,
                  error: 'NO_API_KEY',
                  message: 'Gemini API Key is not configured in server environment.'
                }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  },
                },
              });

              const systemInstruction = `أنت خبير ذكاء اصطناعي متخصص في تحليل واستخراج بيانات محطات الغاز الطبيعي ومراكز الخدمات (كارجاس - مصر).
المطلوب استخراج كافة المحطات والمواقع ومراكز الخدمة بدقة متناهية من الملف المرفق (سواء وورد أو إكسيل أو صورة مستند/جدول/لافتة).
قم بإرجاع مصفوفة JSON صالحة فقط على النمط التالي:
[
  {
    "name": "اسم المحطة أو المركز (مثال: محطة كارجاس مصدق 1، مركز تحويل وصيانة ألماظة)",
    "company": "كارجاس",
    "facilityType": "station",
    "address": "العنوان بالتفصيل والمنطقة والمحافظة",
    "lat": 30.0638,
    "lng": 31.3325,
    "cng": true,
    "conversionCenter": false,
    "oilCenter": false,
    "cylinderInspection": false,
    "canopyOil": false,
    "comingSoon2027": false,
    "workingHours": "24 ساعة",
    "services": ["تموين غاز طبيعي مضغوط (كارجاس)"]
  }
]
قواعد استخراج إلزامية:
1. تسكين الأنشطة بدقة تامة:
   - "تحويل وصيانة" أو "تحويل غاز" => conversionCenter: true, facilityType: "conversion_center"
   - "فحص واختبار أسطوانات" أو "فحص أسطوانات" => cylinderInspection: true, facilityType: "cylinder_testing"
   - "مركز زيوت معتمد" أو "مراكز زيوت" => oilCenter: true, facilityType: "oil_center"
   - "زيوت أسفل المظلة" أو "غيار زيت سريع" => canopyOil: true
   - "تموين غاز" أو "محطة تموين" => cng: true, facilityType: "station"
   - "قريباً 2027" أو "تحت الإنشاء" أو "2027" => comingSoon2027: true
2. تسكين العنوان في مكانه المخصص 'address' بدقة متناهية.
3. إذا لم تكن الإحداثيات (lat, lng) موجودة صراحة في الملف، قم بتوليد إحداثيات تقريبية داخل جمهورية مصر العربية متناسبة مع المدينة/المنطقة (القاهرة والجيزة 30.0/31.2، الإسكندرية 31.2/29.9، الدلتا 30.5-31.0، الصعيد 26.0-28.0).
4. أرجع فقط JSON Array صالح بدون أي نصوص تمهيدية أو markdown زائد.`;

              let contents: any;
              if (image) {
                const cleanBase64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
                contents = {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: cleanBase64,
                      },
                    },
                    {
                      text: `${systemInstruction}\n\nاسم الملف: ${fileName || 'document.png'}\nبيانات أو نصوص إضافية: ${text || ''}`,
                    },
                  ],
                };
              } else {
                contents = `${systemInstruction}\n\nاسم الملف: ${fileName || 'data.xlsx'}\nمحتوى النص أو الجدول المستخرج:\n${text || ''}`;
              }

              const aiResponse = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents,
              });

              const rawText = aiResponse.text || '';
              let jsonStr = rawText.trim();
              if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
              } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
              }

              const jsonStart = jsonStr.indexOf('[');
              const jsonEnd = jsonStr.lastIndexOf(']');
              if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
              }

              const parsedStations = JSON.parse(jsonStr);

              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                count: Array.isArray(parsedStations) ? parsedStations.length : 0,
                stations: parsedStations,
                model: 'gemini-3.8-flash',
              }));
            } catch (err: any) {
              console.error('AI Extraction Error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({
                success: false,
                error: 'AI_EXTRACTION_FAILED',
                message: err.message || 'Failed to extract station data using Gemini AI.',
              }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

function scadaWebhookPlugin(): Plugin {
  return {
    name: 'scada-webhook-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/scada/complete-transaction' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              
              if (!payload.api_key || !payload.station_id || !payload.hose_id || !payload.volume_m3) {
                res.statusCode = 400;
                res.end(JSON.stringify({
                  success: false,
                  error: 'MISSING_FIELDS',
                  message: 'Missing required fields: api_key, station_id, hose_id, volume_m3, transaction_id'
                }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'SCADA webhook received successfully by Cargas endpoint',
                received: {
                  station_id: payload.station_id,
                  hose_id: payload.hose_id,
                  volume_m3: payload.volume_m3,
                  transaction_id: payload.transaction_id,
                  timestamp: new Date().toISOString()
                }
              }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'INVALID_JSON', message: 'Failed to parse JSON body' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

function codebaseSyncPlugin(): Plugin {
  return {
    name: 'codebase-sync-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/admin/sync-codebase' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');

            try {
              const payload = JSON.parse(body || '{}');
              const { navStations, stationLocations, config, rewards, crew, mapFilters, logoUrl } = payload;

              let cleanLogoUrl = logoUrl || config?.stationLogoUrl || '';
              const assetsDir = path.resolve(__dirname, 'public/assets');
              const publicDir = path.resolve(__dirname, 'public');
              const masterPngPath = path.join(assetsDir, 'cargas-master-logo.png');

              if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
              }

              // حفظ اللوجو على القرص إذا كان base64
              if (cleanLogoUrl && cleanLogoUrl.startsWith('data:image/')) {
                try {
                  const match = cleanLogoUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
                  if (match) {
                    const ext = match[1].includes('svg') ? 'svg' : match[1].includes('jpeg') ? 'jpg' : 'png';
                    const base64Data = match[2];
                    const filename = `cargas-master-logo.${ext}`;
                    const targetLogoPath = path.join(assetsDir, filename);
                    fs.writeFileSync(targetLogoPath, Buffer.from(base64Data, 'base64'));
                    cleanLogoUrl = `/assets/${filename}`;

                    // أيضاً تحديث ومزامنة public/cargas-logo.png و public/cargas-logo.svg بنفس الشعار تماماً
                    const publicLogoPng = path.join(publicDir, 'cargas-logo.png');
                    fs.writeFileSync(publicLogoPng, Buffer.from(base64Data, 'base64'));

                    const publicLogoSvg = path.join(publicDir, 'cargas-logo.svg');
                    const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">\n  <image href="data:image/${ext};base64,${base64Data}" width="256" height="256" preserveAspectRatio="xMidYMid meet" />\n</svg>`;
                    fs.writeFileSync(publicLogoSvg, svgWrapper, 'utf-8');
                  }
                } catch (logoErr) {
                  console.error('Failed to save master logo to disk:', logoErr);
                }
              } else if (!cleanLogoUrl || cleanLogoUrl === '/cargas-logo.svg') {
                if (fs.existsSync(masterPngPath)) {
                  cleanLogoUrl = '/assets/cargas-master-logo.png';
                }
              }

              if (!cleanLogoUrl && fs.existsSync(masterPngPath)) {
                cleanLogoUrl = '/assets/cargas-master-logo.png';
              }

              // تحديث إعدادات اللوجو المعتمدة وتثبيت اسم وعنوان "كارجاس - طريقنا واحد"
              const cleanConfig = config ? { ...config } : {};
              cleanConfig.appName = 'كارجاس - طريقنا واحد';
              cleanConfig.appTitle = 'كارجاس - طريقنا واحد';
              cleanConfig.appSubtitle = cleanConfig.appSubtitle || 'برنامج الولاء الذكي وملاحة المحطات • شركة غاز السيارات (كارجاس)';
              cleanConfig.stationLogoUrl = cleanLogoUrl || '/assets/cargas-master-logo.png';
              cleanConfig.appLogoUrl = cleanLogoUrl || '/assets/cargas-master-logo.png';
              cleanConfig.customAppLogoUrl = cleanLogoUrl || '/assets/cargas-master-logo.png';
              if (cleanConfig.wasalnyConfig) {
                cleanConfig.wasalnyConfig.stationUnifiedLogoUrl = cleanLogoUrl || '/assets/cargas-master-logo.png';
                cleanConfig.wasalnyConfig.wasalnyLogoUrl = cleanLogoUrl || '/assets/cargas-master-logo.png';
              }

              // تثبيت وتحديث محطات الخريطة في src/navigation/data/initialStations.ts
              const initialStationsFilePath = path.resolve(__dirname, 'src/navigation/data/initialStations.ts');
              let cleanNavStations: any[] = [];
              if (Array.isArray(navStations) && navStations.length > 0) {
                cleanNavStations = navStations.map((st: any) => ({
                  ...st,
                  customLogoUrl: (st.customLogoUrl && st.customLogoUrl.length > 500 && st.customLogoUrl.startsWith('data:'))
                    ? (cleanLogoUrl || undefined)
                    : (st.customLogoUrl || cleanLogoUrl || '/assets/cargas-master-logo.png'),
                }));

                const initialStationsContent = `import { Station } from '../types';\n\n/**\n * محطات كارجاس المعتمدة الافتراضية (${cleanNavStations.length} محطة)\n * تم تثبيتها وحفظها مباشرة من لوحة تحكم مدير النظام (المطور محمد عبد الرحمن يوسف)\n * جاهزة للرفع على GitHub والعمل على Vercel بدون أي فقد\n */\nexport const INITIAL_CARGAS_STATIONS: Station[] = ${JSON.stringify(cleanNavStations, null, 2)};\n`;
                fs.writeFileSync(initialStationsFilePath, initialStationsContent, 'utf-8');
              }

              // معالجة محطات جدول الإدارة
              let cleanLocations: any[] = [];
              if (Array.isArray(stationLocations) && stationLocations.length > 0) {
                cleanLocations = stationLocations.map((st: any) => ({
                  ...st,
                  customLogoUrl: (st.customLogoUrl && st.customLogoUrl.length > 500 && st.customLogoUrl.startsWith('data:'))
                    ? (cleanLogoUrl || undefined)
                    : (st.customLogoUrl || cleanLogoUrl || '/assets/cargas-master-logo.png'),
                }));
              } else if (cleanNavStations.length > 0) {
                cleanLocations = cleanNavStations;
              }

              // تثبيت وتعميم كافة التعديلات في src/services/customInitialData.ts
              const customDataFilePath = path.resolve(__dirname, 'src/services/customInitialData.ts');
              const customDataContent = `import {
  AppConfig,
  CargasStationLocation,
  RewardItem,
  TechnicianCrewMember,
  MapFacilityFilterItem,
} from '../types';

/**
 * ملف البيانات الأساسية الشاملة المعتمدة لكامل التطبيق (المطور محمد عبد الرحمن يوسف)
 * تم تثبيتها واعتمادها بتاريخ: ${new Date().toISOString()}
 * تظل ثابتة لجميع المستخدمين والزوار الجدد على GitHub و Vercel
 */
export const COMMITTED_CUSTOM_CONFIG: Partial<AppConfig> | null = ${JSON.stringify(cleanConfig, null, 2)};

export const COMMITTED_CUSTOM_STATIONS_LOCATIONS: CargasStationLocation[] | null = ${cleanLocations.length > 0 ? JSON.stringify(cleanLocations, null, 2) : 'null'};

export const COMMITTED_MASTER_LOGO: string | null = ${JSON.stringify(cleanLogoUrl || '/assets/cargas-master-logo.png')};

export const COMMITTED_REWARDS: RewardItem[] | null = ${rewards && rewards.length > 0 ? JSON.stringify(rewards, null, 2) : 'null'};

export const COMMITTED_CREW: TechnicianCrewMember[] | null = ${crew && crew.length > 0 ? JSON.stringify(crew, null, 2) : 'null'};

export const COMMITTED_MAP_FILTERS: MapFacilityFilterItem[] | null = ${mapFilters && mapFilters.length > 0 ? JSON.stringify(mapFilters, null, 2) : 'null'};
`;
              fs.writeFileSync(customDataFilePath, customDataContent, 'utf-8');

              // حفظ نسخة احتياطية عامة في public/assets/cargas-system-snapshot.json
              try {
                const snapshotPath = path.resolve(__dirname, 'public/assets/cargas-system-snapshot.json');
                fs.writeFileSync(
                  snapshotPath,
                  JSON.stringify(
                    {
                      timestamp: new Date().toISOString(),
                      developer: 'محمد عبد الرحمن يوسف',
                      company: 'شركة عزوتي للبرمجيات وتكنولوجيا المعلومات',
                      stationsCount: cleanNavStations.length,
                      stations: cleanNavStations,
                      locations: cleanLocations,
                      config: cleanConfig,
                      rewards: rewards || [],
                      crew: crew || [],
                      mapFilters: mapFilters || [],
                    },
                    null,
                    2
                  ),
                  'utf-8'
                );
              } catch (snapErr) {
                console.error('Failed to save snapshot JSON:', snapErr);
              }

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'تم حفظ واعتماد كافة التعديلات في كود التطبيق الأساسي بنجاح!',
                  stationCount: cleanNavStations.length,
                  logoUrl: cleanLogoUrl,
                  timestamp: new Date().toISOString(),
                })
              );
            } catch (err: any) {
              console.error('Sync codebase error:', err);
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'SYNC_FAILED',
                  message: err.message || 'فشلت عملية حفظ التعديلات في كود المشروع',
                })
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), scadaWebhookPlugin(), aiExtractionPlugin(), codebaseSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

