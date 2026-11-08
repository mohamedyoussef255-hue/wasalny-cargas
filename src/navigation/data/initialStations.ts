import { Station } from "../types";
import { getAllGeoJsonStations } from "../../services/cargasGeoJsonService";

/**
 * قاعدة بيانات محطات كارجاس المعتمدة (352 محطة ومركز تحويل وفحص أسطوانات)
 * مدمجة محلياً كملف GeoJSON فائق السرعة يلغي استعلامات الخادم ويعمل أوفلاين
 * مبنية على محرك الخرائط المفتوح المصدر Leaflet.js والملاحة المباشرة عبر Deep Linking
 */
export const INITIAL_CARGAS_STATIONS: Station[] = getAllGeoJsonStations();

export const INITIAL_STATIONS = INITIAL_CARGAS_STATIONS;
