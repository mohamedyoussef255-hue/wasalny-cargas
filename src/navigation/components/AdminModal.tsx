import React, { useState, useRef, useEffect } from 'react';
import { Station, AppConfig, CongestionLevel, CargasFacilityType } from '../types';
import { parseKML, parseKMZ, parseCSV, parseGeoJSON, exportStationsToKML, exportStationsToCSV } from '../services/kmlParser';
import { CARGAS_LOGO_SVG } from '../utils/cargasLogo';
import { compressLogoImage, saveStoredCustomLogo } from '../utils/imageCompressor';
import { syncCurrentStateToCodebase, downloadSystemDataBackup } from '../../services/codebaseSyncService';
import { getStationLocations, getAppConfig, getMasterStationMapLogo } from '../../services/storageService';
import { mergeAndDistributeActivities, findMatchingExistingStation } from '../utils/stationActivityMerger';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { 
  Lock, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Download, 
  Bot, 
  Palette, 
  ShieldCheck, 
  FileCode, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Search,
  Sparkles,
  MapPin,
  Save,
  Fuel,
  Sliders,
  Image,
  Layers,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Move,
  Stamp,
  Building2,
  Square,
  Edit2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Camera,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  onSaveStations: (stations: Station[]) => void;
  config: AppConfig;
  onSaveConfig: (config: AppConfig) => void;
  onOpenDragDropTool?: () => void;
  onApplyLogoToAllStations?: (logoUrl: string) => void;
  onOpenKmzModal?: () => void;
  initialAuthenticated?: boolean;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  stations,
  onSaveStations,
  config,
  onSaveConfig,
  onOpenDragDropTool,
  onApplyLogoToAllStations,
  onOpenKmzModal,
  initialAuthenticated = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthenticated);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    if (initialAuthenticated) {
      setIsAuthenticated(true);
    }
  }, [initialAuthenticated, isOpen]);

  const [activeTab, setActiveTab] = useState<'stations' | 'import' | 'ui-customizer' | 'settings'>('stations');

  // Station edit/create state
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Quick Rename state for system admin
  const [quickRenameId, setQuickRenameId] = useState<string | null>(null);
  const [quickRenameName, setQuickRenameName] = useState<string>('');
  const [stationForm, setStationForm] = useState<Partial<Station>>({
    name: '',
    company: 'كارجاس',
    facilityType: 'station',
    address: '',
    lat: 30.0638,
    lng: 31.3325,
    customLogoUrl: '',
    cng: true,
    petrol: true,
    conversionCenter: false,
    oilCenter: false,
    cylinderInspection: true,
    cngNozzles: 8,
    pressureBar: 220,
    congestionLevel: 'low',
    waitTimeMinutes: 4,
    verified: true,
    workingHours: '24 ساعة',
    services: ['تموين غاز طبيعي مضغوط (كارجاس)'],
    notes: ''
  });

  // Import state
  const [pastedData, setPastedData] = useState<string>('');
  const [importType, setImportType] = useState<'kmz' | 'kml' | 'csv' | 'geojson'>('kmz');
  const [importPreview, setImportPreview] = useState<Station[]>([]);
  const [importMessage, setImportMessage] = useState<string>('');
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);
  const [forceCargasOnImport, setForceCargasOnImport] = useState<boolean>(true);

  // Config local form
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Search and filter in station list
  const [adminStationSearch, setAdminStationSearch] = useState<string>('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [formError, setFormError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multi-selection state for stations table
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState<boolean>(false);

  // Multi-selection state for import preview
  const [selectedImportIndices, setSelectedImportIndices] = useState<number[]>([]);

  // Admin Logo File Upload Ref
  const appLogoInputRef = useRef<HTMLInputElement>(null);

  const handleAdminAppLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to optimal web dimensions (256x256 max) so it never overflows localStorage quota
      const compressedLogo = await compressLogoImage(file, 256, 0.9);

      const updatedConfig = {
        ...localConfig,
        customAppLogoUrl: compressedLogo,
        globalStationLogoUrl: compressedLogo
      };

      setLocalConfig(updatedConfig);
      onSaveConfig(updatedConfig);

      saveStoredCustomLogo(compressedLogo);

      if (onApplyLogoToAllStations) {
        onApplyLogoToAllStations(compressedLogo);
      }

      setConfigSuccess('تم رفع اللوجو وحفظه وتثبيته بشكل دائم على التطبيق وكافة المحطات بالخريطة بنجاح!');
      setTimeout(() => setConfigSuccess(null), 4000);
    } catch (err) {
      console.warn('Logo compression error:', err);
      // Fallback to standard FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          saveStoredCustomLogo(result);
          const updatedConfig = {
            ...localConfig,
            customAppLogoUrl: result,
            globalStationLogoUrl: result
          };
          setLocalConfig(updatedConfig);
          onSaveConfig(updatedConfig);
          if (onApplyLogoToAllStations) {
            onApplyLogoToAllStations(result);
          }
          setConfigSuccess('تم رفع اللوجو وحفظه وتطبيقه على لوجو التطبيق وكافة المحطات بالخريطة بنجاح!');
          setTimeout(() => setConfigSuccess(null), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle hiding station from map
  const handleToggleHideStation = (id: string) => {
    const updated = stations.map(s => {
      if (s.id === id) {
        return { ...s, isHidden: !s.isHidden };
      }
      return s;
    });
    onSaveStations(updated);
  };

  // Dropdown for station activities
  const [activeDropdownStationId, setActiveDropdownStationId] = useState<string | null>(null);

  // 1-Click quick toggle for station activities (تموين، تحويل، زيوت، فحص، زيوت مظلة، قريباً 2027)
  const handleToggleStationFacility = (
    id: string,
    facility: 'cng' | 'conversionCenter' | 'oilCenter' | 'cylinderInspection' | 'canopyOil' | 'comingSoon2027'
  ) => {
    const updated = stations.map(s => {
      if (s.id !== id) return s;
      const isNowActive = facility === 'canopyOil'
        ? !(s.canopyOil || s.services?.includes('زيوت أسفل المظلة'))
        : facility === 'comingSoon2027'
        ? !(s.comingSoon2027 || s.services?.includes('قريباً 2027') || s.services?.includes('قريباً'))
        : !s[facility];
      let services = [...(s.services || [])];
      
      if (facility === 'cng') {
        if (isNowActive && !services.includes('تموين غاز طبيعي')) services.push('تموين غاز طبيعي');
        else if (!isNowActive) services = services.filter(x => x !== 'تموين غاز طبيعي');
      }
      if (facility === 'oilCenter') {
        if (isNowActive && !services.includes('مركز زيوت معتمد')) services.push('مركز زيوت معتمد');
        else if (!isNowActive) services = services.filter(x => x !== 'مركز زيوت معتمد');
      }
      if (facility === 'conversionCenter') {
        if (isNowActive && !services.includes('مركز تحويل سيارات معتمد')) services.push('مركز تحويل سيارات معتمد');
        else if (!isNowActive) services = services.filter(x => x !== 'مركز تحويل سيارات معتمد');
      }
      if (facility === 'cylinderInspection') {
        if (isNowActive && !services.includes('فحص واختبار أسطوانات')) services.push('فحص واختبار أسطوانات');
        else if (!isNowActive) services = services.filter(x => x !== 'فحص واختبار أسطوانات');
      }
      if (facility === 'canopyOil') {
        if (isNowActive && !services.includes('زيوت أسفل المظلة')) services.push('زيوت أسفل المظلة');
        else if (!isNowActive) services = services.filter(x => x !== 'زيوت أسفل المظلة');
      }
      if (facility === 'comingSoon2027') {
        if (isNowActive && !services.includes('قريباً 2027')) services.push('قريباً 2027');
        else if (!isNowActive) services = services.filter(x => x !== 'قريباً 2027' && x !== 'قريباً');
      }

      return {
        ...s,
        [facility]: isNowActive,
        canopyOil: facility === 'canopyOil' ? isNowActive : s.canopyOil,
        comingSoon2027: facility === 'comingSoon2027' ? isNowActive : s.comingSoon2027,
        services,
        updatedAt: new Date().toISOString()
      };
    });
    onSaveStations(updated);
  };

  // Stations multi-selection handlers
  const handleToggleSelectStation = (id: string) => {
    setSelectedStationIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllStations = () => {
    const visibleIds = adminFilteredStations.map(s => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedStationIds.includes(id));
    if (allSelected) {
      setSelectedStationIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStationIds(Array.from(new Set([...selectedStationIds, ...visibleIds])));
    }
  };

  const handleBatchHideStations = () => {
    if (selectedStationIds.length === 0) return;
    const set = new Set(selectedStationIds);
    const updated = stations.map(s => set.has(s.id) ? { ...s, isHidden: true } : s);
    onSaveStations(updated);
    setSelectedStationIds([]);
  };

  const handleBatchShowStations = () => {
    if (selectedStationIds.length === 0) return;
    const set = new Set(selectedStationIds);
    const updated = stations.map(s => set.has(s.id) ? { ...s, isHidden: false } : s);
    onSaveStations(updated);
    setSelectedStationIds([]);
  };

  const handleBatchDeleteStations = () => {
    if (selectedStationIds.length === 0) return;
    const set = new Set(selectedStationIds);
    const updated = stations.filter(s => !set.has(s.id));
    onSaveStations(updated);
    setSelectedStationIds([]);
    setIsConfirmingBatchDelete(false);
  };

  const handleBatchApplyLogoToSelected = (logoUrl?: string) => {
    if (selectedStationIds.length === 0) return;
    const set = new Set(selectedStationIds);
    const updated = stations.map(s => set.has(s.id) ? {
      ...s,
      customLogoUrl: logoUrl || undefined,
      company: 'كارجاس'
    } : s);
    onSaveStations(updated);
    setSelectedStationIds([]);
  };

  // Import preview multi-selection handlers
  const handleToggleSelectImport = (idx: number) => {
    setSelectedImportIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllImports = () => {
    if (selectedImportIndices.length === importPreview.length) {
      setSelectedImportIndices([]);
    } else {
      setSelectedImportIndices(importPreview.map((_, i) => i));
    }
  };

  const handleBatchHideImports = () => {
    if (selectedImportIndices.length === 0) return;
    const set = new Set(selectedImportIndices);
    setImportPreview(prev => prev.map((p, i) => set.has(i) ? { ...p, isHidden: true } : p));
    setSelectedImportIndices([]);
  };

  const handleBatchShowImports = () => {
    if (selectedImportIndices.length === 0) return;
    const set = new Set(selectedImportIndices);
    setImportPreview(prev => prev.map((p, i) => set.has(i) ? { ...p, isHidden: false } : p));
    setSelectedImportIndices([]);
  };

  const handleBatchDeleteImports = () => {
    if (selectedImportIndices.length === 0) return;
    const set = new Set(selectedImportIndices);
    setImportPreview(prev => prev.filter((_, i) => !set.has(i)));
    setSelectedImportIndices([]);
  };

  // Bulk apply uploaded logo or Cargas logo to all stations
  const handleBulkApplyLogo = (logoUrl?: string) => {
    if (onApplyLogoToAllStations) {
      onApplyLogoToAllStations(logoUrl || '');
    } else {
      const updated = stations.map(s => ({
        ...s,
        customLogoUrl: logoUrl || undefined
      }));
      onSaveStations(updated);
    }

    // مزامنة تلقائية هادئة في كود المشروع
    try {
      const appCfg = getAppConfig();
      syncCurrentStateToCodebase({
        navStations: stations,
        stationLocations: getStationLocations(),
        config: appCfg,
        logoUrl: logoUrl || getMasterStationMapLogo(),
      }).catch(() => {});
    } catch (e) {}
  };

  const [isSyncingToCodebase, setIsSyncingToCodebase] = useState(false);

  const handleSyncCodebaseFromModal = async () => {
    setIsSyncingToCodebase(true);
    setConfigSuccess(null);
    setConfigError(null);

    try {
      const currentConfig = getAppConfig();
      const currentLocations = getStationLocations();
      const currentMasterLogo = localConfig.customAppLogoUrl || localConfig.globalStationLogoUrl || getMasterStationMapLogo() || currentConfig.stationLogoUrl;

      const result = await syncCurrentStateToCodebase({
        navStations: stations,
        stationLocations: currentLocations,
        config: currentConfig,
        logoUrl: currentMasterLogo,
      });

      if (result.success) {
        setConfigSuccess(`✅ تم حفظ واعتماد كافة المحطات (${stations.length} محطة) واللوجو في ملفات كود المشروع الأساسية بنجاح! جاهزة للنشر على GitHub و Vercel.`);
      } else {
        setConfigError(result.message || 'فشلت عملية حفظ التعديلات في كود المشروع');
      }
    } catch (err: any) {
      setConfigError(err.message || 'حدث خطأ أثناء مزامنة الكود');
    } finally {
      setIsSyncingToCodebase(false);
    }
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === config.adminPassword) {
      setIsAuthenticated(true);
      setAuthError('');
      setLocalConfig({ ...config });
    } else {
      setAuthError('كلمة السر غير صحيحة! كلمة السر الافتراضية هي 0000 ويمكن تعديلها بعد الدخول.');
    }
  };

  // Form Handlers
  const handleOpenAdd = () => {
    setFormError('');
    setEditingStation(null);
    setStationForm({
      name: '',
      company: 'كارجاس',
      facilityType: 'station',
      address: '',
      lat: 30.0638,
      lng: 31.3325,
      customLogoUrl: '',
      cng: true,
      petrol: true,
      conversionCenter: false,
      oilCenter: false,
      cylinderInspection: true,
      canopyOil: false,
      comingSoon2027: false,
      cngNozzles: 8,
      pressureBar: 220,
      congestionLevel: 'low',
      waitTimeMinutes: 4,
      verified: true,
      workingHours: '24 ساعة',
      services: ['تموين غاز طبيعي مضغوط (كارجاس)'],
      notes: ''
    });
    setIsAddingNew(true);
  };

  const handleOpenEdit = (station: Station) => {
    setFormError('');
    setEditingStation(station);
    setStationForm({ ...station });
    setIsAddingNew(true);
  };

  const handleStationLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setStationForm(prev => ({ ...prev, customLogoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.name || !stationForm.lat || !stationForm.lng) {
      setFormError('برجاء كتابة اسم المحطة والإحداثيات (خط العرض والطول) بشكل صحيح!');
      return;
    }
    setFormError('');

    if (editingStation) {
      const updated = stations.map(s => {
        if (s.id === editingStation.id) {
          return {
            ...s,
            ...stationForm,
            facilityType: (stationForm.facilityType || 'station') as CargasFacilityType,
            lat: Number(stationForm.lat),
            lng: Number(stationForm.lng),
            canopyOil: !!stationForm.canopyOil,
            comingSoon2027: !!stationForm.comingSoon2027,
            isHidden: !!stationForm.isHidden,
            updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          } as Station;
        }
        return s;
      });
      onSaveStations(updated);
    } else {
      const newStation: Station = {
        id: `custom-${Date.now()}`,
        name: stationForm.name || 'محطة كارجاس جديدة',
        company: stationForm.company || 'كارجاس',
        facilityType: (stationForm.facilityType || 'station') as CargasFacilityType,
        address: stationForm.address || 'عنوان المحطة',
        lat: Number(stationForm.lat),
        lng: Number(stationForm.lng),
        customLogoUrl: stationForm.customLogoUrl || undefined,
        isHidden: !!stationForm.isHidden,
        cng: stationForm.cng ?? true,
        petrol: stationForm.petrol ?? false,
        conversionCenter: !!stationForm.conversionCenter,
        oilCenter: !!stationForm.oilCenter,
        cylinderInspection: stationForm.cylinderInspection ?? true,
        canopyOil: !!stationForm.canopyOil,
        comingSoon2027: !!stationForm.comingSoon2027,
        cngNozzles: Number(stationForm.cngNozzles || 8),
        pressureBar: Number(stationForm.pressureBar || 220),
        congestionLevel: (stationForm.congestionLevel || 'low') as CongestionLevel,
        waitTimeMinutes: Number(stationForm.waitTimeMinutes || 4),
        verified: stationForm.verified ?? true,
        workingHours: stationForm.workingHours || '24 ساعة',
        services: stationForm.services || ['تموين غاز طبيعي كارجاس'],
        notes: stationForm.notes || '',
        updatedAt: new Date().toISOString().substring(0, 16)
      };
      onSaveStations([newStation, ...stations]);
    }
    setIsAddingNew(false);
    setEditingStation(null);
  };

  const confirmDeleteStation = (id: string) => {
    const filtered = stations.filter(s => s.id !== id);
    onSaveStations(filtered);
    setDeletingId(null);
  };

  const handleSaveQuickRename = (stationId: string) => {
    const trimmed = quickRenameName.trim();
    if (!trimmed) return;
    const updated = stations.map(s => {
      if (s.id === stationId) {
        return {
          ...s,
          name: trimmed,
          updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return s;
    });
    onSaveStations(updated);
    setQuickRenameId(null);
    setQuickRenameName('');
  };

  // AI & File Parsers: Extracting Word (.docx), Excel (.xlsx, .xls), and Images with Gemini 3.8 Flash
  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (!docXml) return '';
      return docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch (e) {
      console.error('Error extracting text from docx', e);
      return '';
    }
  };

  // Convert Arabic numerals (٠-٩) to western digits (0-9)
  const toWesternDigits = (val: string): string => {
    return String(val || '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  };

  // Helper to parse coordinate float from string or number
  const parseCoordValue = (raw: any): number | null => {
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (!raw) return null;
    const str = toWesternDigits(String(raw).trim());
    const match = str.match(/[-+]?[0-9]*\.?[0-9]{3,}/);
    if (match) {
      const num = parseFloat(match[0]);
      if (!isNaN(num) && isFinite(num)) return num;
    }
    return null;
  };

  const extractDataFromExcel = (arrayBuffer: ArrayBuffer): { text: string; rows: any[] } => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let combinedText = '';
      const allExtractedRows: any[] = [];

      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        // 1. Read sheet as raw 2D array of cells
        const raw2D: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (!raw2D || raw2D.length === 0) return;

        // 2. Identify the real header row by scoring rows against known keywords
        let headerRowIdx = -1;
        let maxHeaderScore = 0;

        for (let rIdx = 0; rIdx < Math.min(raw2D.length, 12); rIdx++) {
          const row = raw2D[rIdx];
          if (!Array.isArray(row)) continue;
          let score = 0;
          const joined = row.map(c => String(c || '').toLowerCase()).join(' ');

          if (joined.includes('اسم') || joined.includes('إسم') || joined.includes('محط') || joined.includes('name') || joined.includes('station') || joined.includes('site') || joined.includes('مركز')) score += 5;
          if (joined.includes('lat') || joined.includes('عرض') || joined.includes('lng') || joined.includes('طول') || joined.includes('احداثي') || joined.includes('إحداثي') || joined.includes('latitude') || joined.includes('longitude')) score += 5;
          if (joined.includes('عنوان') || joined.includes('address') || joined.includes('موقع') || joined.includes('محافظ') || joined.includes('منطق') || joined.includes('شارع')) score += 3;
          if (joined.includes('نشاط') || joined.includes('خدم') || joined.includes('تحويل') || joined.includes('زيوت') || joined.includes('فحص') || joined.includes('مظلة') || joined.includes('اسطوان')) score += 4;

          if (score > maxHeaderScore && score >= 4) {
            maxHeaderScore = score;
            headerRowIdx = rIdx;
          }
        }

        // 3. Extract headers and data rows
        let headers: string[] = [];
        let dataRows: any[][] = [];

        if (headerRowIdx >= 0) {
          headers = raw2D[headerRowIdx].map(h => String(h || '').trim());
          dataRows = raw2D.slice(headerRowIdx + 1);
        } else {
          headers = raw2D[0].map((h, i) => String(h || '').trim() || `col_${i}`);
          dataRows = raw2D.slice(1);
        }

        // 4. Map each data row into a clean record
        dataRows.forEach((row) => {
          if (!Array.isArray(row)) return;
          const hasContent = row.some(c => String(c || '').trim().length > 0);
          if (!hasContent) return;

          const record: Record<string, any> = { _rawRow: row, _sheetName: sheetName };
          headers.forEach((h, colIdx) => {
            const key = h || `col_${colIdx}`;
            record[key] = row[colIdx] !== undefined ? row[colIdx] : '';
          });
          allExtractedRows.push(record);
        });

        const csv = XLSX.utils.sheet_to_csv(sheet);
        combinedText += `\n--- ورقة: ${sheetName} ---\n${csv}`;
      });

      return { text: combinedText, rows: allExtractedRows };
    } catch (e) {
      console.error('Error extracting data from excel', e);
      return { text: '', rows: [] };
    }
  };

  const parseExcelRowsLocally = (rows: any[]): Station[] => {
    return rows.map((r, i) => {
      const rawRow: any[] = Array.isArray(r._rawRow) ? r._rawRow : Object.values(r);
      const keys = Object.keys(r).filter(k => k !== '_rawRow' && k !== '_sheetName');

      const findVal = (...keywords: string[]): string => {
        const k = keys.find(key => keywords.some(kw => key.toLowerCase().includes(kw.toLowerCase())));
        return k ? String(r[k] || '').trim() : '';
      };

      // 1. EXTRACT EXACT STATION NAME (يقرأ اسم المحطة كما هو بالجدول تماماً دون تحويله إلى كارجاس 1 أو 2)
      let name = '';

      const nameCandidate = findVal(
        'اسم المحطة',
        'اسم المركز',
        'اسم المحطه',
        'إسم المحطة',
        'المحطة',
        'المحطه',
        'المركز',
        'الفرع',
        'اسم الفرع',
        'اسم الموقع',
        'الموقع',
        'البيان',
        'بيان المحطة',
        'الاسم',
        'الإسم',
        'station_name',
        'station',
        'site_name',
        'site',
        'outlet',
        'name'
      );

      if (nameCandidate && nameCandidate.length >= 2 && !/^\d+$/.test(nameCandidate)) {
        name = nameCandidate;
      }

      // إذا لم يجد اسم في العمود المحدد، يفحص خلايا الصف عن اسم المحطة الفعلي
      if (!name) {
        for (const cell of rawRow) {
          const str = String(cell || '').trim();
          if (str.length >= 3 && !/^\d+$/.test(str)) {
            if (str.includes('محطة') || str.includes('مركز') || str.includes('كارجاس') || str.includes('فرع') || str.includes('منفذ')) {
              name = str;
              break;
            }
          }
        }
      }

      // إذا لم يعثر بعد، يأخذ أول نص غير رقمي صالح
      if (!name) {
        for (const cell of rawRow) {
          const str = String(cell || '').trim();
          if (
            str.length >= 3 &&
            !/^\d+$/.test(str) &&
            !str.includes('http') &&
            !str.includes('نعم') &&
            !str.includes('لا') &&
            !str.includes('ساعة') &&
            !str.includes('القاهرة') &&
            !str.includes('الجيزة') &&
            !str.includes('الإسكندرية')
          ) {
            name = str;
            break;
          }
        }
      }

      // تنظيف أي بادئة ترقيم تسلسلي فقط إن وجدت (مثل: "1- ألماظة" => "ألماظة") مع الحفاظ التام على الاسم
      if (name) {
        name = name.replace(/^\d+[\s\-.)،:]+/, '').trim();
      }

      // في حال تعذر العثور التام على نص، نربطها بالعنوان بدلاً من الترقيم العشوائي
      if (!name) {
        const addrCandidate = findVal('عنوان', 'موقع', 'address', 'المنطقة');
        name = addrCandidate ? `محطة كارجاس (${addrCandidate})` : `محطة كارجاس ${r._sheetName ? `(${r._sheetName})` : ''}`;
      }

      // 2. EXTRACT ADDRESS
      const address = findVal('عنوان', 'address', 'موقع', 'شارع', 'المنطقة', 'المحافظة', 'المدينة', 'city') || 'جمهورية مصر العربية';

      // 3. EXTRACT ACCURATE COORDINATES (LAT / LNG)
      let lat: number | null = null;
      let lng: number | null = null;

      const latCandidate = findVal('lat', 'عرض', 'latitude', 'شمال', 'y');
      const lngCandidate = findVal('lng', 'lon', 'طول', 'longitude', 'شرق', 'x');

      lat = parseCoordValue(latCandidate);
      lng = parseCoordValue(lngCandidate);

      if (!lat || !lng) {
        const combinedCandidate = findVal('إحداثيات', 'احداثيات', 'coords', 'gps', 'coordinates', 'link', 'موقع');
        if (combinedCandidate) {
          const match = toWesternDigits(combinedCandidate).match(/([0-9]{2}\.[0-9]{3,})[,\s/]+([0-9]{2}\.[0-9]{3,})/);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
          }
        }
      }

      if (!lat || !lng) {
        for (const cell of rawRow) {
          const str = toWesternDigits(String(cell || '').trim());
          const match = str.match(/([0-9]{2}\.[0-9]{3,})[,\s/]+([0-9]{2}\.[0-9]{3,})/);
          if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
            break;
          }
        }
      }

      // تصحيح التبديل إن كان خط العرض والطول معكوسين
      if (lat && lng) {
        if (lat > 25 && lat < 37 && lng > 22 && lng < 32) {
          const temp = lat;
          lat = lng;
          lng = temp;
        }
      }

      const finalLat = (lat && lat >= 22 && lat <= 33) ? lat : 30.0638 + (i * 0.004);
      const finalLng = (lng && lng >= 25 && lng <= 37) ? lng : 31.3325 + (i * 0.004);

      // 4. EXTRACT ACTIVITIES & FACILITIES (فحص أسطوانات، زيوت، أسفل المظلة، تحويل وصيانة)
      const allRowText = rawRow.map(c => String(c || '')).join(' ') + ' ' + keys.map(k => `${k}:${r[k]}`).join(' ');

      const hasCylinder =
        (findVal('فحص', 'اسطوان', 'إسطوان', 'cylinder').length > 0 && !findVal('فحص', 'اسطوان', 'إسطوان', 'cylinder').includes('لا')) ||
        allRowText.includes('فحص أسطوانات') ||
        allRowText.includes('فحص اسطوانات') ||
        allRowText.includes('اختبار أسطوانات') ||
        allRowText.includes('فحص الأسطوانات') ||
        allRowText.includes('فحص الاسطوانات');

      const hasOil =
        findVal('مركز زيوت', 'زيوت معتمد', 'زيوت bp', 'زيوت بي بي', 'كاسترول').length > 0 ||
        allRowText.includes('مركز زيوت') ||
        allRowText.includes('زيوت بي بي') ||
        allRowText.includes('زيوت معتمد') ||
        allRowText.includes('كاسترول') ||
        allRowText.includes('oil center');

      const hasCanopy =
        findVal('مظلة', 'مظله', 'أسفل المظلة', 'اسفل المظلة', 'canopy').length > 0 ||
        allRowText.includes('أسفل المظلة') ||
        allRowText.includes('اسفل المظلة') ||
        allRowText.includes('اسفل المظله') ||
        allRowText.includes('تحت المظلة') ||
        allRowText.includes('تحت التندة') ||
        allRowText.includes('canopy');

      const hasConversion =
        findVal('تحويل', 'صيانة', 'صيانه', 'ورشة', 'ورشه', 'conversion').length > 0 ||
        allRowText.includes('تحويل وصيانة') ||
        allRowText.includes('مركز تحويل') ||
        allRowText.includes('ورشة تحويل') ||
        allRowText.includes('صيانة غاز') ||
        findVal('تحويل') === 'true';

      const hasCng = true;
      const hasSoon2027 = allRowText.includes('2027') || allRowText.includes('قريباً') || allRowText.includes('تحت الإنشاء');

      const services: string[] = ['تموين غاز طبيعي مضغوط (كارجاس)'];
      if (hasConversion) services.push('مركز تحويل وصيانة غاز');
      if (hasCylinder) services.push('فحص واختبار أسطوانات');
      if (hasOil) services.push('مركز زيوت معتمد (BP)');
      if (hasCanopy) services.push('زيوت أسفل المظلة');
      if (hasSoon2027) services.push('قريباً 2027');

      let facilityType: CargasFacilityType = 'station';
      if (hasConversion) facilityType = 'conversion_center';
      else if (hasCylinder) facilityType = 'cylinder_testing';
      else if (hasOil) facilityType = 'oil_center';

      return {
        id: `custom-excel-${Date.now()}-${i}`,
        name,
        company: 'كارجاس',
        facilityType,
        address,
        lat: finalLat,
        lng: finalLng,
        cng: hasCng,
        petrol: false,
        conversionCenter: hasConversion,
        oilCenter: hasOil,
        cylinderInspection: hasCylinder,
        canopyOil: hasCanopy,
        comingSoon2027: hasSoon2027,
        cngNozzles: 8,
        pressureBar: 220,
        congestionLevel: 'low',
        waitTimeMinutes: 4,
        verified: true,
        workingHours: '24 ساعة',
        services,
        notes: 'مستخرج باسمه الفعلي وأنشطته من ملف الإكسيل',
        updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
    });
  };

  const parseTextLinesLocally = (text: string): Station[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    const results: Station[] = [];
    lines.forEach((line, i) => {
      if (line.includes('محطة') || line.includes('مركز') || line.includes('كارجاس') || line.includes('تحويل') || line.includes('زيوت') || line.includes('فحص')) {
        const hasConversion = line.includes('تحويل') || line.includes('صيانة');
        const hasCylinder = line.includes('فحص') || line.includes('اسطوان');
        const hasOil = line.includes('مركز زيوت') || line.includes('زيوت معتمد');
        const hasCanopy = line.includes('مظلة') || line.includes('أسفل المظلة');
        const hasSoon2027 = line.includes('2027') || line.includes('قريباً');

        const parts = line.split(/[-–—:|]/);
        const name = parts[0]?.trim() || `محطة كارجاس ${i + 1}`;
        const address = parts[1]?.trim() || 'جمهورية مصر العربية';

        const services: string[] = ['تموين غاز طبيعي مضغوط (كارجاس)'];
        if (hasConversion) services.push('مركز تحويل وصيانة غاز');
        if (hasCylinder) services.push('فحص واختبار أسطوانات');
        if (hasOil) services.push('مركز زيوت معتمد');
        if (hasCanopy) services.push('زيوت أسفل المظلة');
        if (hasSoon2027) services.push('قريباً 2027');

        results.push({
          id: `custom-text-${Date.now()}-${i}`,
          name,
          company: 'كارجاس',
          facilityType: hasConversion ? 'conversion_center' : hasOil ? 'oil_center' : hasCylinder ? 'cylinder_testing' : 'station',
          address,
          lat: 30.0638 + (i * 0.006),
          lng: 31.3325 + (i * 0.006),
          cng: true,
          petrol: false,
          conversionCenter: hasConversion,
          oilCenter: hasOil,
          cylinderInspection: hasCylinder,
          canopyOil: hasCanopy,
          comingSoon2027: hasSoon2027,
          cngNozzles: 8,
          pressureBar: 220,
          congestionLevel: 'low',
          waitTimeMinutes: 4,
          verified: true,
          workingHours: '24 ساعة',
          services,
          notes: 'مستخرج من نص المستند',
          updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });
      }
    });
    return results;
  };

  const callAiStationExtraction = async (payload: { text?: string; image?: string; mimeType?: string; fileName: string; fallbackRows?: any[] }) => {
    setIsImportLoading(true);
    setImportMessage(`🤖 جارِ استدعاء الذكاء الاصطناعي (Gemini 3.8 Flash) لتحليل الملف "${payload.fileName}" واستخلاص المحطات والأنشطة والعناوين وتسكينها...`);

    try {
      const res = await fetch('/api/ai/extract-station-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: payload.text,
          image: payload.image,
          mimeType: payload.mimeType,
          fileName: payload.fileName,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.stations) && data.stations.length > 0) {
        const mapped: Station[] = data.stations.map((st: any, idx: number) => ({
          id: `ai-extracted-${Date.now()}-${idx}`,
          name: st.name || `محطة كارجاس ${idx + 1}`,
          company: 'كارجاس',
          facilityType: (st.facilityType || 'station') as CargasFacilityType,
          address: st.address || 'عنوان معتمد - مصر',
          lat: Number(st.lat) || 30.0638 + (idx * 0.004),
          lng: Number(st.lng) || 31.3325 + (idx * 0.004),
          cng: st.cng ?? true,
          petrol: st.petrol ?? false,
          conversionCenter: !!st.conversionCenter,
          oilCenter: !!st.oilCenter,
          cylinderInspection: st.cylinderInspection ?? true,
          canopyOil: !!st.canopyOil,
          comingSoon2027: !!st.comingSoon2027,
          cngNozzles: Number(st.cngNozzles || 8),
          pressureBar: Number(st.pressureBar || 220),
          congestionLevel: (st.congestionLevel || 'low') as CongestionLevel,
          waitTimeMinutes: Number(st.waitTimeMinutes || 4),
          verified: true,
          workingHours: st.workingHours || '24 ساعة',
          services: Array.isArray(st.services) && st.services.length > 0 ? st.services : ['تموين غاز طبيعي مضغوط (كارجاس)'],
          notes: st.notes || `مستخرج بالذكاء الاصطناعي (Gemini 3.8 Flash) من ${payload.fileName}`,
          updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        }));

        processParsedStations(mapped, `تحليل الذكاء الاصطناعي لملف (${payload.fileName})`);
        setImportMessage(`✨ نجح الذكاء الاصطناعي (Gemini 3.8 Flash) في استخراج ${mapped.length} محطة وتسليم وتسكين الأنشطة والعناوين في أماكنها بدقة!`);
        return;
      } else {
        throw new Error(data.message || 'لم يرجع الذكاء الاصطناعي محطات صالحة');
      }
    } catch (err: any) {
      console.warn('AI endpoint unavailable or returned error, using smart fallback parser:', err);
      if (payload.fallbackRows && payload.fallbackRows.length > 0) {
        const fallbackParsed = parseExcelRowsLocally(payload.fallbackRows);
        if (fallbackParsed.length > 0) {
          processParsedStations(fallbackParsed, `ملف الإكسيل (${payload.fileName})`);
          setImportMessage(`✓ تم استخراج وتسكين ${fallbackParsed.length} محطة بنجاح من شيت الإكسيل.`);
          return;
        }
      }
      if (payload.text) {
        const textParsed = parseTextLinesLocally(payload.text);
        if (textParsed.length > 0) {
          processParsedStations(textParsed, `مستند (${payload.fileName})`);
          setImportMessage(`✓ تم استخراج وتسكين ${textParsed.length} محطة من المستند بنجاح.`);
          return;
        }
      }
      setImportMessage(`تعذر استخراج المحطات من الملف: ${err.message || 'تأكد من احتواء الملف على محطات وعناوين كارجاس واضحة'}`);
    } finally {
      setIsImportLoading(false);
    }
  };

  // Comprehensive File Upload Handler (KMZ, KML, CSV, Word .docx, Excel .xlsx, Images .png/.jpg)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportLoading(true);
    setImportMessage(`جارِ قراءة وتحليل ملف (${file.name})...`);

    try {
      const lowerName = file.name.toLowerCase();

      // 1. Handle Word Documents (.docx, .doc)
      if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const docText = await extractTextFromDocx(arrayBuffer);
        setPastedData(docText);
        setImportType('csv');
        await callAiStationExtraction({ text: docText, fileName: file.name });
      }
      // 2. Handle Excel Files (.xlsx, .xls)
      else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const { text: excelText, rows } = extractDataFromExcel(arrayBuffer);
        setPastedData(excelText);
        setImportType('csv');
        await callAiStationExtraction({ text: excelText, fileName: file.name, fallbackRows: rows });
      }
      // 3. Handle Images (.png, .jpg, .jpeg, .webp)
      else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp')) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          await callAiStationExtraction({
            image: dataUrl,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
      // 4. Handle KMZ (Google Earth zip)
      else if (lowerName.endsWith('.kmz')) {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await parseKMZ(arrayBuffer);
        processParsedStations(parsed, `ملف KMZ (${file.name})`);
      } 
      // 5. Handle KML
      else if (lowerName.endsWith('.kml')) {
        const text = await file.text();
        setPastedData(text);
        setImportType('kml');
        const parsed = parseKML(text);
        processParsedStations(parsed, `ملف KML (${file.name})`);
      }
      // 6. Handle CSV or TXT
      else if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
        const text = await file.text();
        setPastedData(text);
        setImportType('csv');
        const parsed = parseCSV(text);
        if (parsed.length > 0) {
          processParsedStations(parsed, `ملف CSV (${file.name})`);
        } else {
          await callAiStationExtraction({ text, fileName: file.name });
        }
      }
      // 7. Handle GeoJSON / JSON
      else if (lowerName.endsWith('.json') || lowerName.endsWith('.geojson')) {
        const text = await file.text();
        setPastedData(text);
        setImportType('geojson');
        const parsed = parseGeoJSON(text);
        processParsedStations(parsed, `ملف GeoJSON (${file.name})`);
      } else {
        setImportMessage('صيغة الملف غير مدعومة. الصيغ المدعومة هي: Excel (.xlsx, .xls), Word (.docx), Images (.png, .jpg), KMZ, KML, CSV');
      }
    } catch (err: any) {
      console.error(err);
      setImportMessage(`حدث خطأ أثناء معالجة الملف: ${err.message || 'تأكد من سلامة الملف'}`);
    } finally {
      setIsImportLoading(false);
    }
  };

  const processParsedStations = (parsed: Station[], sourceDesc: string) => {
    if (parsed.length === 0) {
      setImportMessage(`لم يتم العثور على أي محطات أو مواقع صالحة داخل ${sourceDesc}. تأكد من احتوائه على إحداثيات (Placemarks).`);
      return;
    }

    const finalParsed = forceCargasOnImport 
      ? parsed.map(s => ({ ...s, company: 'كارجاس' }))
      : parsed;

    setImportPreview(finalParsed);
    setImportMessage(`تم بنجاح استخراج ${finalParsed.length} محطة من ${sourceDesc}! يمكنك مراجعة المعاينة ثم الضغط على "تأكيد وإضافة للخريطة".`);
  };

  const handleParsePastedText = () => {
    if (!pastedData.trim()) {
      setImportMessage('برجاء لصق نص KML أو CSV أو GeoJSON أولاً');
      return;
    }
    let parsed: Station[] = [];
    if (importType === 'kml') parsed = parseKML(pastedData);
    else if (importType === 'csv') parsed = parseCSV(pastedData);
    else parsed = parseGeoJSON(pastedData);

    processParsedStations(parsed, 'النص الملصوق');
  };

  const handleApplyImport = (mode: 'smart_merge' | 'append' | 'replace') => {
    if (importPreview.length === 0) return;
    if (mode === 'replace') {
      onSaveStations(importPreview);
      setImportMessage(`⚠️ تم استبدال جميع المحطات القديمة وإضافة ${importPreview.length} محطة جديدة بنجاح!`);
    } else if (mode === 'smart_merge') {
      const result = mergeAndDistributeActivities(stations, importPreview);
      onSaveStations(result.mergedStations);
      setImportMessage(
        `✅ تم بنجاح توزيع وتحديث الأنشطة على (${result.updatedCount}) محطة قائمة بدون تكرار، وإضافة (${result.addedCount}) محطة جديدة!`
      );
    } else {
      onSaveStations([...importPreview, ...stations]);
      setImportMessage(`تمت إضافة ${importPreview.length} محطة جديدة منفصلة إلى الخريطة!`);
    }
    setImportPreview([]);
    setPastedData('');
  };

  // Password & Settings
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    setConfigSuccess(null);

    if (!newPasswordInput.trim()) {
      setConfigError('برجاء كتابة كلمة السر الجديدة!');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setConfigError('كلمة السر الجديدة غير متطابقة مع التأكيد!');
      return;
    }

    const updated = { ...localConfig, adminPassword: newPasswordInput.trim() };
    setLocalConfig(updated);
    onSaveConfig(updated);
    setConfigSuccess('تم تغيير كلمة سر مدير النظام وحفظها بنجاح! استخدم كلمة السر الجديدة في المرات القادمة.');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
  };

  // Save UI Customizer Settings
  const handleSaveUISettings = () => {
    onSaveConfig(localConfig);
    setConfigSuccess('تم حفظ إعدادات واجهة المستخدم والأيقونات بنجاح! ستظهر التعديلات فوراً للمستخدمين.');
    setTimeout(() => setConfigSuccess(null), 3500);
  };

  // Filtered stations for admin view (search & visibility filter)
  const adminFilteredStations = stations.filter(s => {
    if (visibilityFilter === 'visible' && s.isHidden) return false;
    if (visibilityFilter === 'hidden' && !s.isHidden) return false;

    if (!adminStationSearch.trim()) return true;
    const q = adminStationSearch.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.company.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 md:p-6 shadow-2xl text-white max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400">
                لوحة تحكم مدير النظام الشاملة | كارجاس
              </div>
              <h2 className="text-lg md:text-xl font-black">
                إدارة محطات الغاز الطبيعي وملفات KMZ وواجهة المستخدم
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate: Password Required (Default 0000) */}
        {!isAuthenticated ? (
          <div className="py-12 flex flex-col items-center justify-center max-w-sm mx-auto text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black">دخول مدير النظام</h3>
            <p className="text-xs text-slate-400 mt-2">
              للوصول للوحة التحكم بالكامل لابد من كتابة كلمة السر.
              <br />
              <span className="text-amber-300 font-bold">(كلمة السر الافتراضية: 0000)</span>
            </p>

            <form onSubmit={handleLogin} className="w-full mt-6 space-y-3">
              <div>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="أدخل كلمة السر (مثال: 0000)"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border-2 border-slate-700 text-center text-lg tracking-widest text-white font-mono focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black shadow-lg cursor-pointer transition active:scale-98"
              >
                دخول لوحة الإدارة
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar shrink-0 text-xs md:text-sm font-bold">
              <button
                onClick={() => setActiveTab('stations')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'stations'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Fuel className="w-4 h-4" />
                <span>إدارة المحطات ({stations.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>رفع ملفات KMZ و KML وإكسيل</span>
              </button>

              <button
                onClick={() => setActiveTab('ui-customizer')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'ui-customizer'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>التحكم في الأيقونات وواجهة المستخدم</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>تعديل كلمة السر والأمان</span>
              </button>

              {onOpenDragDropTool && (
                <button
                  onClick={() => {
                    onOpenDragDropTool();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer font-black shrink-0 active:scale-95"
                  title="فتح أداة رفع اللوجو ووضعه بالسحب والإفلات على الخريطة مباشرة"
                >
                  <Move className="w-4 h-4" />
                  <span>أداة السحب والإفلات على الخريطة 📍</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSyncCodebaseFromModal}
                disabled={isSyncingToCodebase}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition flex items-center gap-2 cursor-pointer font-black shrink-0 active:scale-95 border border-indigo-400/50"
                title="تثبيت واعتماد كافة المحطات الحالية (300 محطة) واللوجو والإعدادات في ملفات المشروع الأساسية (GitHub & Vercel Sync)"
              >
                <Save className={`w-4 h-4 ${isSyncingToCodebase ? 'animate-spin' : ''}`} />
                <span>{isSyncingToCodebase ? 'جاري تثبيت الكود...' : '💾 اعتماد بالكود (GitHub & Vercel)'}</span>
              </button>
            </div>

            {/* Notification Feedback */}
            {configSuccess && (
              <div className="my-2 p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in shrink-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{configSuccess}</span>
              </div>
            )}
            {configError && (
              <div className="my-2 p-2.5 bg-rose-950/80 border border-rose-500 text-rose-300 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{configError}</span>
              </div>
            )}

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto min-h-0 pt-3 pr-1">
              {/* TAB 1: STATIONS MANAGEMENT */}
              {activeTab === 'stations' && (
                <div className="space-y-4">
                  {isAddingNew ? (
                    /* Station Form (Create or Edit) */
                    <form onSubmit={handleSaveStation} className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                        <h4 className="font-black text-sm text-emerald-400 flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          <span>{editingStation ? 'تعديل بيانات المحطة' : 'إضافة محطة / مركز جديد'}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => { setIsAddingNew(false); setEditingStation(null); }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          إلغاء
                        </button>
                      </div>

                      {formError && (
                        <div className="p-2 bg-rose-950/80 border border-rose-600 text-rose-300 text-xs rounded-xl font-bold">
                          {formError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/50">
                          <label className="text-xs text-emerald-300 font-black block mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>اسم المحطة (تعديل كامل متاح لمدير النظام):</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">يظهر بالخريطة والصوت</span>
                          </label>
                          <input
                            type="text"
                            value={stationForm.name || ''}
                            onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                            placeholder="مثال: محطة كار جاس - ألماظة / طريق السويس"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/60 text-white text-xs font-black focus:ring-2 focus:ring-emerald-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">الشركة التابعة:</label>
                          <input
                            type="text"
                            value={stationForm.company || 'كارجاس'}
                            onChange={(e) => setStationForm({ ...stationForm, company: e.target.value })}
                            placeholder="كارجاس"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">نوع المنشأة:</label>
                          <select
                            value={stationForm.facilityType || 'station'}
                            onChange={(e) => setStationForm({ ...stationForm, facilityType: e.target.value as CargasFacilityType })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          >
                            <option value="station">محطة تموين غاز طبيعي (CNG)</option>
                            <option value="conversion_center">مركز تحويل وصيانة سيارات كارجاس</option>
                            <option value="oil_center">مركز زيوت كارجاس المعتمدة (BP)</option>
                            <option value="cylinder_testing">مركز فحص واختبار أسطوانات</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">العنوان والموقع بالتفصيل:</label>
                          <input
                            type="text"
                            value={stationForm.address || ''}
                            onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                            placeholder="طريق النصر، بجوار سيتي سنتر، القاهرة"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">خط العرض (Latitude):</label>
                          <input
                            type="number"
                            step="any"
                            value={stationForm.lat ?? ''}
                            onChange={(e) => setStationForm({ ...stationForm, lat: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">خط الطول (Longitude):</label>
                          <input
                            type="number"
                            step="any"
                            value={stationForm.lng ?? ''}
                            onChange={(e) => setStationForm({ ...stationForm, lng: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">حالة الزحام الافتراضية:</label>
                          <select
                            value={stationForm.congestionLevel || 'low'}
                            onChange={(e) => setStationForm({ ...stationForm, congestionLevel: e.target.value as CongestionLevel })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          >
                            <option value="low">رايقة وبدون طوابير (أخضر)</option>
                            <option value="medium">متوسطة (أصفر)</option>
                            <option value="high">زحام وطابور انتظار (أحمر)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">وقت الانتظار المتوقع (بالدقائق):</label>
                          <input
                            type="number"
                            value={stationForm.waitTimeMinutes ?? 4}
                            onChange={(e) => setStationForm({ ...stationForm, waitTimeMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">عدد مسدسات الغاز (Nozzles):</label>
                          <input
                            type="number"
                            value={stationForm.cngNozzles ?? 8}
                            onChange={(e) => setStationForm({ ...stationForm, cngNozzles: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-300 block mb-1">رفع لوجو مخصص للمحطة (اختياري):</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleStationLogoUpload}
                              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                            />
                            {stationForm.customLogoUrl && (
                              <img src={stationForm.customLogoUrl} alt="preview" className="w-8 h-8 rounded-full bg-white object-contain border p-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-700">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.cng ?? true}
                            onChange={(e) => setStationForm({ ...stationForm, cng: e.target.checked })}
                            className="accent-emerald-500 rounded"
                          />
                          <span className="text-emerald-400 font-bold">⛽ تموين غاز طبيعي مضغوط</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.conversionCenter ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, conversionCenter: e.target.checked })}
                            className="accent-amber-500 rounded"
                          />
                          <span className="text-amber-300 font-bold">🛠️ مركز تحويل وصيانة غاز</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.oilCenter ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, oilCenter: e.target.checked })}
                            className="accent-blue-500 rounded"
                          />
                          <span className="text-blue-300 font-bold">🛢️ مركز زيوت معتمد</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.cylinderInspection ?? true}
                            onChange={(e) => setStationForm({ ...stationForm, cylinderInspection: e.target.checked })}
                            className="accent-purple-500 rounded"
                          />
                          <span className="text-purple-300 font-bold">🔍 فحص واختبار أسطوانات</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.canopyOil ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, canopyOil: e.target.checked })}
                            className="accent-teal-500 rounded"
                          />
                          <span className="text-teal-300 font-bold">☂️ زيوت أسفل المظلة</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.comingSoon2027 ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, comingSoon2027: e.target.checked })}
                            className="accent-rose-500 rounded"
                          />
                          <span className="text-rose-300 font-bold">🚀 محطة قريباً 2027</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stationForm.petrol ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, petrol: e.target.checked })}
                            className="accent-slate-500 rounded"
                          />
                          <span>بنزين (92 / 95)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer p-2 rounded-xl bg-rose-950/40 border border-rose-800/80 w-full sm:w-auto">
                          <input
                            type="checkbox"
                            checked={stationForm.isHidden ?? false}
                            onChange={(e) => setStationForm({ ...stationForm, isHidden: e.target.checked })}
                            className="accent-rose-500 rounded"
                          />
                          <span className="text-rose-300 font-black">🚫 إخفاء هذه المحطة من الخريطة وعن المستخدمين</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setIsAddingNew(false); setEditingStation(null); }}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
                        >
                          {editingStation ? 'تحديث وحفظ التعديلات' : 'إضافة المحطة للخريطة'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Stations Table View */
                    <div>
                      {/* Filter Bar & Quick Actions */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-full sm:w-60">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                            <input
                              type="text"
                              value={adminStationSearch}
                              onChange={(e) => setAdminStationSearch(e.target.value)}
                              placeholder="بحث في المحطات..."
                              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                            />
                          </div>

                          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                            <button
                              type="button"
                              onClick={() => setVisibilityFilter('all')}
                              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
                                visibilityFilter === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              الكل ({stations.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setVisibilityFilter('visible')}
                              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
                                visibilityFilter === 'visible' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              المعروضة ({stations.filter(s => !s.isHidden).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setVisibilityFilter('hidden')}
                              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
                                visibilityFilter === 'hidden' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              المخفية ({stations.filter(s => s.isHidden).length})
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={handleSyncCodebaseFromModal}
                            disabled={isSyncingToCodebase}
                            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition"
                            title="تثبيت واعتماد كافة المحطات (300 محطة) واللوجو وتعديلات الأسماء والأنشطة مباشرة في كود المشروع الأساسي (GitHub & Vercel Sync)"
                          >
                            <Save className={`w-3.5 h-3.5 ${isSyncingToCodebase ? 'animate-spin' : ''}`} />
                            <span>{isSyncingToCodebase ? 'جاري الاعتماد...' : '💾 اعتماد بالكود (GitHub & Vercel)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBulkApplyLogo('')}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-200"
                            title="تطبيق واستعادة شعار كارجاس الرسمي الموحد على جميع المحطات"
                          >
                            <Stamp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تطبيق لوجو كارجاس على الكل</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                            <span>إضافة محطة يدوياً</span>
                          </button>
                        </div>
                      </div>

                      {/* Select All Checkbox Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700/80 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-200">
                          <input
                            type="checkbox"
                            checked={adminFilteredStations.length > 0 && adminFilteredStations.every(s => selectedStationIds.includes(s.id))}
                            onChange={handleSelectAllStations}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                          <span>تحديد الكل في هذه القائمة ({adminFilteredStations.length} محطة)</span>
                        </label>

                        {selectedStationIds.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-400">
                              تم اختيار ({selectedStationIds.length}) محطة
                            </span>
                            <button
                              type="button"
                              onClick={() => { setSelectedStationIds([]); setIsConfirmingBatchDelete(false); }}
                              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              إلغاء التحديد
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sticky Batch Action Toolbar (When stations are selected) */}
                      {selectedStationIds.length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-2.5 mb-2.5 animate-in slide-in-from-top-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span className="text-xs font-black text-white">
                              إجراء جماعي على (<span className="text-emerald-300 font-mono text-sm">{selectedStationIds.length}</span>) محطة:
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Batch Show on Map */}
                            <button
                              type="button"
                              onClick={handleBatchShowStations}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
                              title="إظهار المحطات المحددة على الخريطة دفعة واحدة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>إظهار المحددة</span>
                            </button>

                            {/* Batch Hide from Map */}
                            <button
                              type="button"
                              onClick={handleBatchHideStations}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
                              title="إخفاء المحطات المحددة من الخريطة دفعة واحدة"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>إخفاء المحددة</span>
                            </button>

                            {/* Batch Apply Cargas Logo */}
                            <button
                              type="button"
                              onClick={() => handleBatchApplyLogoToSelected('')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
                              title="تطبيق شعار كارجاس على المحطات المحددة"
                            >
                              <Stamp className="w-3.5 h-3.5 text-emerald-400" />
                              <span>لوجو كارجاس للمحددين</span>
                            </button>

                            {/* Batch Delete */}
                            {isConfirmingBatchDelete ? (
                              <div className="flex items-center gap-1.5 bg-rose-950 p-1 rounded-xl border border-rose-600 animate-pulse">
                                <span className="text-[11px] text-rose-300 font-black">تأكيد حذف {selectedStationIds.length}؟</span>
                                <button
                                  type="button"
                                  onClick={handleBatchDeleteStations}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black cursor-pointer"
                                >
                                  تأكيد الحذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsConfirmingBatchDelete(false)}
                                  className="px-2 py-1 text-slate-300 hover:text-white text-xs cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsConfirmingBatchDelete(true)}
                                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
                                title="حذف وإلغاء المحطات المحددة دفعة واحدة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف / إلغاء المحددة</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                        {adminFilteredStations.map(station => {
                          const isSelected = selectedStationIds.includes(station.id);
                          return (
                            <div
                              key={station.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/60 shadow-lg'
                                  : station.isHidden
                                  ? 'bg-slate-900/90 border-rose-900/60 opacity-80'
                                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Row Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectStation(station.id)}
                                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                                  title="تحديد المحطة للعمليات الجماعية"
                                />

                                {/* Multi-select Activities Dropdown (استبدال زر اللوجو بقائمة منسدلة متعددة الاختيارات للأنشطة) */}
                                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveDropdownStationId(
                                        activeDropdownStationId === station.id ? null : station.id
                                      )
                                    }
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-sm cursor-pointer select-none ${
                                      (station.cng || station.conversionCenter || station.oilCenter || station.cylinderInspection || station.canopyOil || station.comingSoon2027 || station.services?.includes('زيوت أسفل المظلة') || station.services?.includes('قريباً 2027'))
                                        ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-emerald-300 border-emerald-500 hover:border-emerald-400 shadow-emerald-950/50'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                                    }`}
                                    title="قائمة منسدلة لاختيار أنشطة وخدمات المحطة (اختيار أكثر من نشاط)"
                                  >
                                    <span className="text-sm">🏷️</span>
                                    <span className="hidden sm:inline text-[11px]">الأنشطة:</span>
                                    <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black">
                                      {
                                        [
                                          station.cng,
                                          station.conversionCenter,
                                          station.oilCenter,
                                          station.cylinderInspection,
                                          station.canopyOil || station.services?.includes('زيوت أسفل المظلة'),
                                          station.comingSoon2027 || station.services?.includes('قريباً 2027'),
                                        ].filter(Boolean).length
                                      }
                                    </span>
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${
                                        activeDropdownStationId === station.id ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>

                                  {/* Dropdown Menu Multi-Select */}
                                  {activeDropdownStationId === station.id && (
                                    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-slate-900 border-2 border-emerald-500 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2.5 animate-in fade-in zoom-in-95">
                                      <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-base">🏷️</span>
                                          <span className="text-xs font-black text-white">
                                            أنشطة المحطة (اختر متعدد):
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveDropdownStationId(null)}
                                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                                          title="إغلاق"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="space-y-1.5 text-xs">
                                        {/* 1. تموين */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.cng
                                            ? 'bg-emerald-950/80 border-emerald-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">⛽</span>
                                            <span>تموين غاز طبيعي</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.cng}
                                            onChange={() => handleToggleStationFacility(station.id, 'cng')}
                                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                          />
                                        </label>

                                        {/* 2. تحويل وصيانة */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.conversionCenter
                                            ? 'bg-amber-950/80 border-amber-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">🛠️</span>
                                            <span>تحويل وصيانة</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.conversionCenter}
                                            onChange={() => handleToggleStationFacility(station.id, 'conversionCenter')}
                                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                                          />
                                        </label>

                                        {/* 3. مراكز زيوت */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.oilCenter
                                            ? 'bg-blue-950/80 border-blue-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">🛢️</span>
                                            <span>مراكز زيوت</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.oilCenter}
                                            onChange={() => handleToggleStationFacility(station.id, 'oilCenter')}
                                            className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                                          />
                                        </label>

                                        {/* 4. مراكز فحص اسطوانات */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.cylinderInspection
                                            ? 'bg-purple-950/80 border-purple-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">🔍</span>
                                            <span>مراكز فحص اسطوانات</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.cylinderInspection}
                                            onChange={() => handleToggleStationFacility(station.id, 'cylinderInspection')}
                                            className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                                          />
                                        </label>

                                        {/* 5. زيوت اسفل المظلة */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.canopyOil || station.services?.includes('زيوت أسفل المظلة')
                                            ? 'bg-teal-950/80 border-teal-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">☂️</span>
                                            <span>زيوت أسفل المظلة</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.canopyOil || !!station.services?.includes('زيوت أسفل المظلة')}
                                            onChange={() => handleToggleStationFacility(station.id, 'canopyOil')}
                                            className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                                          />
                                        </label>

                                        {/* 6. قريباً 2027 */}
                                        <label className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer border ${
                                          station.comingSoon2027 || station.services?.includes('قريباً 2027') || station.services?.includes('قريباً')
                                            ? 'bg-rose-950/80 border-rose-500 text-white font-black'
                                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-300'
                                        }`}>
                                          <span className="flex items-center gap-2">
                                            <span className="text-base">🚀</span>
                                            <span>قريباً 2027</span>
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={!!station.comingSoon2027 || !!station.services?.includes('قريباً 2027') || !!station.services?.includes('قريباً')}
                                            onChange={() => handleToggleStationFacility(station.id, 'comingSoon2027')}
                                            className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                                          />
                                        </label>
                                      </div>

                                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800">
                                        <span className="text-[10px] text-emerald-400 font-bold">
                                          ✓ حفظ فوري ومباشر
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveDropdownStationId(null)}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
                                        >
                                          إغلاق القائمة ✓
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  {quickRenameId === station.id ? (
                                    <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-md py-1" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={quickRenameName}
                                        onChange={(e) => setQuickRenameName(e.target.value)}
                                        placeholder="اكتب اسم المحطة الجديد..."
                                        className="w-full px-2.5 py-1 text-xs font-black rounded-xl bg-slate-950 border-2 border-emerald-500 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveQuickRename(station.id);
                                          if (e.key === 'Escape') setQuickRenameId(null);
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveQuickRename(station.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shrink-0 flex items-center gap-1 shadow-md cursor-pointer"
                                        title="حفظ اسم المحطة الجديد"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>حفظ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setQuickRenameId(null)}
                                        className="p-1 text-slate-400 hover:text-white rounded-lg text-xs shrink-0 cursor-pointer"
                                        title="إلغاء التعديل"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <div className="text-xs md:text-sm font-black text-white truncate">{station.name}</div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickRenameId(station.id);
                                          setQuickRenameName(station.name);
                                        }}
                                        className="p-1 rounded-md text-emerald-400 hover:text-white hover:bg-emerald-600/30 transition cursor-pointer"
                                        title="تعديل اسم المحطة"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 font-bold shrink-0">
                                        {station.company}
                                      </span>
                                      {station.isHidden && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-black shrink-0">
                                          🚫 مخفية من الخريطة
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="text-[11px] text-slate-400 truncate max-w-xs">{station.address}</span>
                                    {/* Facility Badges (1-Click Interactive Toggles) */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'cng')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.cng ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.cng ? 'نشاط الغاز مفعل (اضغط للإلغاء)' : 'اضغط لتفعيل نشاط تموين الغاز'}
                                      >
                                        ⛽ غاز {station.cng ? '✓' : '+'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'conversionCenter')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.conversionCenter ? 'bg-amber-950 text-amber-300 border-amber-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.conversionCenter ? 'مركز تحويل وصيانة مفعل (اضغط للإلغاء)' : 'اضغط لتفعيل مركز تحويل وصيانة'}
                                      >
                                        🛠️ تحويل {station.conversionCenter ? '✓' : '+'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'oilCenter')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.oilCenter ? 'bg-blue-950 text-blue-300 border-blue-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.oilCenter ? 'مركز زيوت معتمد مفعل (اضغط للإلغاء)' : 'اضغط لتفعيل مركز زيوت معتمد'}
                                      >
                                        🛢️ زيوت {station.oilCenter ? '✓' : '+'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'cylinderInspection')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.cylinderInspection ? 'bg-purple-950 text-purple-300 border-purple-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.cylinderInspection ? 'مركز فحص أسطوانات مفعل (اضغط للإلغاء)' : 'اضغط لتفعيل مركز فحص أسطوانات'}
                                      >
                                        🔍 فحص {station.cylinderInspection ? '✓' : '+'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'canopyOil')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.canopyOil || station.services?.includes('زيوت أسفل المظلة') ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.canopyOil || station.services?.includes('زيوت أسفل المظلة') ? 'زيوت أسفل المظلة مفعل (اضغط للإلغاء)' : 'اضغط لتفعيل زيوت أسفل المظلة'}
                                      >
                                        ☂️ مظلة {station.canopyOil || station.services?.includes('زيوت أسفل المظلة') ? '✓' : '+'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStationFacility(station.id, 'comingSoon2027')}
                                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition border cursor-pointer ${
                                          station.comingSoon2027 || station.services?.includes('قريباً 2027') || station.services?.includes('قريباً') ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-100'
                                        }`}
                                        title={station.comingSoon2027 || station.services?.includes('قريباً 2027') ? 'محطة قريباً 2027 مفعل (اضغط للإلغاء)' : 'اضغط لتحديد المحطة قريباً 2027'}
                                      >
                                        🚀 2027 {station.comingSoon2027 || station.services?.includes('قريباً 2027') || station.services?.includes('قريباً') ? '✓' : '+'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Toggle Show/Hide on Map */}
                              <button
                                type="button"
                                onClick={() => handleToggleHideStation(station.id)}
                                className={`p-2 rounded-xl transition cursor-pointer ${
                                  station.isHidden
                                    ? 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-700 shadow-sm'
                                    : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-emerald-600'
                                }`}
                                title={station.isHidden ? 'إظهار المحطة على الخريطة' : 'إخفاء المحطة من الخريطة وعن المستخدمين'}
                              >
                                {station.isHidden ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setQuickRenameId(station.id);
                                  setQuickRenameName(station.name);
                                }}
                                className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-700 text-emerald-300 hover:text-white border border-emerald-600/40 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                                title="تعديل اسم المحطة السريع (مدير النظام)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">تعديل الاسم</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(station)}
                                className="p-2 rounded-xl bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                                title="تعديل بيانات المحطة"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {deletingId === station.id ? (
                                <div className="flex items-center gap-1 bg-rose-950 p-1 rounded-xl border border-rose-600">
                                  <button
                                    type="button"
                                    onClick={() => confirmDeleteStation(station.id)}
                                    className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-black"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(null)}
                                    className="px-1.5 py-1 text-slate-300 text-[10px]"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(station.id)}
                                  className="p-2 rounded-xl bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                                  title="حذف المحطة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: KMZ & KML & EXCEL IMPORT */}
              {activeTab === 'import' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-950/70 to-slate-900 p-4 rounded-2xl border border-emerald-500/40">
                    <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-1">
                      <Upload className="w-4 h-4" />
                      <span>رفع واستيراد ملفات KMZ / KML من Google Earth أو ملفات Excel / CSV</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      يمكنك هنا رفع ملفات <strong>.kmz</strong> التي قمت بإنشائها على Google Earth متضمنة أماكن المحطات واللوجو الخاص بكل محطة! المنظومة ستقوم بفك ضغط الملف واستخراج الإحداثيات وتوزيع اللوجوهات المخصصة على الخريطة تلقائياً.
                    </p>
                  </div>

                  {/* Settings for Import */}
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={forceCargasOnImport}
                        onChange={(e) => setForceCargasOnImport(e.target.checked)}
                        className="accent-emerald-500 rounded"
                      />
                      <span>إدراج المحطات المستوردة تحت اسم وعلامة "كارجاس" تلقائياً</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const csv = exportStationsToCSV(stations);
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `cargas_stations_${Date.now()}.csv`;
                          a.click();
                        }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير CSV</span>
                      </button>

                      <button
                        onClick={() => {
                          const kml = exportStationsToKML(stations);
                          const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `cargas_stations_${Date.now()}.kml`;
                          a.click();
                        }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير KML</span>
                      </button>
                    </div>
                  </div>

                  {/* File Upload Zone (مع دعم الذكاء الاصطناعي لملفات الوورد والإكسيل والصور) */}
                  <div className="border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 rounded-3xl p-6 md:p-8 text-center bg-gradient-to-b from-slate-800/60 via-slate-850/80 to-slate-900/90 hover:bg-slate-800/90 transition shadow-xl">
                    <input
                      type="file"
                      id="fileInput"
                      accept=".kmz,.kml,.csv,.geojson,.json,.txt,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                        <Upload className="w-8 h-8 animate-bounce-slow" />
                      </div>
                      <div className="text-base font-black text-white flex items-center gap-2">
                        <span>اضغط لرفع ملف (وورد، إكسيل، صور، أو KMZ/KML)</span>
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          🤖 ذكاء اصطناعي AI
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 max-w-xl font-light">
                        يقوم الذكاء الاصطناعي <strong className="text-emerald-400 font-bold">(Gemini 3.8 Flash)</strong> بتحليل محتوى الملف واستخلاص المحطات وتسكين الأنشطة بدقة:
                        <br />
                        <span className="text-amber-300 font-medium">🛠️ تحويل وصيانة • 🔍 فحص أسطوانات • 🛢️ مراكز زيوت • ☂️ زيوت أسفل المظلة • 🚀 قريباً 2027</span>
                      </p>

                      {/* File Types Pill Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-bold">
                        <span className="px-3 py-1 rounded-xl bg-blue-950/80 text-blue-300 border border-blue-700/70 flex items-center gap-1.5 shadow-sm">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>وورد Word (.docx)</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 flex items-center gap-1.5 shadow-sm">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>إكسيل Excel (.xlsx / .xls)</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-700/70 flex items-center gap-1.5 shadow-sm">
                          <Camera className="w-3.5 h-3.5 text-purple-400" />
                          <span>صور ومستندات (.png / .jpg)</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-teal-950/80 text-teal-300 border border-teal-700/70 flex items-center gap-1.5 shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-teal-400" />
                          <span>خرائط KMZ و KML و CSV</span>
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Or Paste Raw Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-slate-300 font-bold">أو الصق كود KML أو CSV مباشرة:</span>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setImportType('kml')}
                          className={`px-2 py-0.5 rounded ${importType === 'kml' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                          KML
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportType('csv')}
                          className={`px-2 py-0.5 rounded ${importType === 'csv' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                          CSV
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={pastedData}
                      onChange={(e) => setPastedData(e.target.value)}
                      placeholder="الصق نص KML أو CSV هنا..."
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleParsePastedText}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        تحليل النص المدخل
                      </button>
                    </div>
                  </div>

                  {/* Import Message Feedback */}
                  {importMessage && (
                    <div className="p-3 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{importMessage}</span>
                    </div>
                  )}

                  {/* Import Preview Card */}
                  {importPreview.length > 0 && (
                    <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/70 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-2.5">
                        <div>
                          <div className="text-sm font-black text-emerald-300">
                            معاينة المحطات المستخرجة من الملف ({importPreview.length} محطة)
                          </div>
                          <div className="text-[11px] text-slate-300">
                            يمكنك تعديل الأسماء مباشرة، إخفاء أي محطة غير مرغوبة، أو استبعادها قبل الدمج.
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplyImport('smart_merge')}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 ring-2 ring-emerald-300"
                            title="توزيع الأنشطة (فحص أسطوانات، زيوت، أسفل المظلة، تحويل وصيانة) على المحطات القائمة بدون تكرار المحطة"
                          >
                            <span>🔄</span>
                            <span>دمج وتوزيع الأنشطة (بدون تكرار المحطات)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyImport('append')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                            title="إضافة جميع المحطات كعناصر جديدة منفصلة"
                          >
                            ➕ إضافة كمحطات منفصلة
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyImport('replace')}
                            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                            title="حذف المحطات القديمة واستبدالها بالملف الجديد"
                          >
                            استبدال الكل
                          </button>
                        </div>
                      </div>

                      {/* Quick Bulk Actions for Imported Stations */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setImportPreview(prev => prev.map(p => ({
                                ...p,
                                company: 'كارجاس',
                                customLogoUrl: undefined
                              })));
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Stamp className="w-3.5 h-3.5" />
                            <span>شعار واسم كارجاس للكل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setImportPreview(prev => prev.map(p => {
                                const isCargas = p.name.includes('كارجاس') || p.company.includes('كارجاس');
                                return { ...p, isHidden: !isCargas ? true : p.isHidden };
                              }));
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>إخفاء غير كارجاس</span>
                          </button>
                        </div>

                        {/* Select All Checkbox for Import Preview */}
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                          <input
                            type="checkbox"
                            checked={importPreview.length > 0 && selectedImportIndices.length === importPreview.length}
                            onChange={handleSelectAllImports}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                          <span>تحديد الكل ({importPreview.length})</span>
                        </label>
                      </div>

                      {/* Batch Action Toolbar for Selected Imported Stations */}
                      {selectedImportIndices.length > 0 && (
                        <div className="p-2.5 bg-slate-900 border border-emerald-500/80 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-top-1">
                          <span className="text-xs font-black text-emerald-400">
                            إجراء جماعي على ({selectedImportIndices.length}) محطة بالملف:
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleBatchShowImports}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>إظهار المحددة</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleBatchHideImports}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                            >
                              <EyeOff className="w-3 h-3" />
                              <span>إخفاء المحددة</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleBatchDeleteImports}
                              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>استبعاد / حذف المحددة ({selectedImportIndices.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedImportIndices([])}
                              className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                            >
                              إلغاء التحديد
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {importPreview.map((p, idx) => {
                          const isSelected = selectedImportIndices.includes(idx);
                          return (
                            <div 
                              key={idx} 
                              className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border transition ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400/50'
                                  : p.isHidden 
                                  ? 'bg-slate-950/80 border-rose-900/60 opacity-75' 
                                  : 'bg-slate-900/90 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Item Checkbox */}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectImport(idx)}
                                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                                  title="تحديد المحطة"
                                />

                                {p.customLogoUrl ? (
                                  <img src={p.customLogoUrl} alt="logo" className="w-7 h-7 rounded-full bg-white object-contain border p-0.5 shrink-0" />
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                                )}
                              
                              {/* Editable Name Field */}
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setImportPreview(prev => prev.map((item, i) => i === idx ? { ...item, name: newName } : item));
                                }}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-bold max-w-[200px] sm:max-w-[240px] focus:outline-none focus:border-emerald-500"
                                title="اضغط لتعديل اسم المحطة"
                              />

                              <span className="text-slate-400 text-[10px] truncate max-w-xs hidden md:inline">
                                {p.address}
                              </span>

                              {/* Detected Activity Badges */}
                              <div className="flex flex-wrap items-center gap-1">
                                {p.conversionCenter && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-bold">
                                    🛠️ تحويل وصيانة
                                  </span>
                                )}
                                {p.cylinderInspection && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[9px] font-bold">
                                    🔍 فحص أسطوانات
                                  </span>
                                )}
                                {p.oilCenter && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[9px] font-bold">
                                    🛢️ مراكز زيوت BP
                                  </span>
                                )}
                                {p.canopyOil && (
                                  <span className="px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800 text-[9px] font-bold">
                                    ☂️ أسفل المظلة
                                  </span>
                                )}
                                {findMatchingExistingStation(p, stations) && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-black" title="ستدمج وتوزع الأنشطة على المحطة القائمة بدون تكرار">
                                    🔄 تطابق محطة قائمة
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className="font-mono text-[10px] text-emerald-400 font-bold hidden sm:inline">
                                {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                              </span>

                              {/* Toggle isHidden */}
                              <button
                                type="button"
                                onClick={() => {
                                  setImportPreview(prev => prev.map((item, i) => i === idx ? { ...item, isHidden: !item.isHidden } : item));
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                                  p.isHidden
                                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                                }`}
                                title={p.isHidden ? 'المحطة مخفية (اضغط لإظهارها)' : 'المحطة معروضة (اضغط لإخفائها)'}
                              >
                                {p.isHidden ? (
                                  <>
                                    <EyeOff className="w-3 h-3 text-rose-400" />
                                    <span>مخفية</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-400" />
                                    <span>معروضة</span>
                                  </>
                                )}
                              </button>

                              {/* Delete from Preview */}
                              <button
                                type="button"
                                onClick={() => {
                                  setImportPreview(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white cursor-pointer transition"
                                title="حذف واستبعاد هذه المحطة من الاستيراد"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: UI & ICON CUSTOMIZER (CMS FOR USER PAGES) */}
              {activeTab === 'ui-customizer' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-950/70 to-slate-900 p-4 rounded-2xl border border-emerald-500/40">
                    <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-1">
                      <Sliders className="w-4 h-4" />
                      <span>التحكم الكامل في ظهور الأيقونات والبيانات وتعديل الكلمات في صفحات المستخدمين</span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      يمكنك كمدير للنظام التحكم الكامل فيما يراه المستخدم: إظهار أو إخفاء أي زر، تعديل الكلمات والنصوص الظاهرة على الأزرار، وتحديد قصر المحطات على كارجاس فقط.
                    </p>
                  </div>

                  {/* Cargas Only Mode Switch (Highlight) */}
                  <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/80 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>إظهار مواقع ومحطات "كارجاس" فقط للمستخدمين</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        عند تفعيل هذا الخيار، سيتم حجب أي محطة أخرى تلقائياً ولن يرى الجمهور سوى محطات ومراكز شركة كارجاس المعتمدة.
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={localConfig.cargasOnlyMode}
                        onChange={(e) => setLocalConfig({ ...localConfig, cargasOnlyMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-13 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* ADMIN-ONLY LOGO UPLOAD & APPLICATION SECTION */}
                  <div className="p-4 bg-gradient-to-r from-emerald-900/60 to-slate-900 border-2 border-emerald-500/70 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
                      <div>
                        <div className="font-black text-sm text-white flex items-center gap-2">
                          <Stamp className="w-4 h-4 text-emerald-400" />
                          <span>تخصيص لوجو التطبيق والمحطات بالكامل (خاص بمدير النظام)</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          ارفع صورة اللوجو من جهازك ليتم تطبيقه على لوجو التطبيق وشريط العنوان ودليل الجمهورية وكافة محطات الخريطة فوراً.
                        </div>
                      </div>

                      {localConfig.customAppLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocalConfig(prev => ({
                              ...prev,
                              customAppLogoUrl: undefined,
                              globalStationLogoUrl: undefined
                            }));
                            saveStoredCustomLogo('');
                            if (onApplyLogoToAllStations) {
                              onApplyLogoToAllStations('');
                            }
                            setConfigSuccess('تمت استعادة شعار كارجاس الرسمي للتطبيق وكافة المحطات بنجاح');
                            setTimeout(() => setConfigSuccess(null), 3000);
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer"
                        >
                          استعادة شعار كارجاس الرسمي
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Preview */}
                      <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-emerald-500 shadow-xl shrink-0 flex items-center justify-center overflow-hidden">
                        {localConfig.customAppLogoUrl ? (
                          <img
                            src={localConfig.customAppLogoUrl}
                            alt="Custom Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: CARGAS_LOGO_SVG }} className="w-full h-full" />
                        )}
                      </div>

                      {/* File Upload Controls */}
                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="file"
                          ref={appLogoInputRef}
                          onChange={handleAdminAppLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => appLogoInputRef.current?.click()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition active:scale-95"
                          >
                            <Upload className="w-4 h-4" />
                            <span>رفع لوجو من جهازك (PNG / JPG / SVG)</span>
                          </button>

                          {localConfig.customAppLogoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onApplyLogoToAllStations) {
                                  onApplyLogoToAllStations(localConfig.customAppLogoUrl || '');
                                }
                                setConfigSuccess('تم توقيع وتطبيق اللوجو على جميع محطات الخريطة والتطبيق!');
                                setTimeout(() => setConfigSuccess(null), 3000);
                              }}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/50 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                              <Stamp className="w-3.5 h-3.5" />
                              <span>تطبيق اللوجو المرفوع على كافة المحطات</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {localConfig.customAppLogoUrl 
                            ? '✅ اللوجو المرفوع نشط حالياً ويظهر في أعلى التطبيق وفي دليل الجمهورية وعلامات الخريطة.'
                            : 'ℹ️ يُستخدم حالياً الشعار الرسمي لشركة كارجاس NGV (لهب الغاز والنقاء البيئي).'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MAP FRAME & OUTER APP BACKGROUND CMS (DESIGN CUSTOMIZER) */}
                  <div className="p-4 bg-slate-800/90 border-2 border-emerald-500/60 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <div className="font-black text-sm text-white flex items-center gap-2">
                        <Square className="w-4 h-4 text-emerald-400" />
                        <span>التحكم في إطار الخريطة ولون خلفية التطبيق الخارجية (تصميم الواجهة)</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localConfig.enableMapFrame ?? true}
                          onChange={(e) => setLocalConfig({ ...localConfig, enableMapFrame: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <span>تفعيل إطار الخريطة</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {/* Frame Width */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>سماكة الإطار (الحجم):</span>
                          <span className="text-emerald-400 font-mono font-black">{localConfig.mapFrameWidth ?? 3}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={localConfig.mapFrameWidth ?? 3}
                          onChange={(e) => setLocalConfig({ ...localConfig, mapFrameWidth: parseInt(e.target.value) || 0 })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      {/* Frame Radius */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>شكل الإطار (انحناء الزوايا):</span>
                          <span className="text-emerald-400 font-mono font-black">{localConfig.mapFrameRadius ?? 18}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="36"
                          value={localConfig.mapFrameRadius ?? 18}
                          onChange={(e) => setLocalConfig({ ...localConfig, mapFrameRadius: parseInt(e.target.value) || 0 })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>

                      {/* Frame Style */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                        <div className="text-slate-300 font-bold">شكل ونمط الإطار:</div>
                        <select
                          value={localConfig.mapFrameStyle || 'solid'}
                          onChange={(e) => setLocalConfig({ ...localConfig, mapFrameStyle: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
                        >
                          <option value="solid">خط مصمت كلاسيكي (Solid)</option>
                          <option value="double">خط مزدوج فاخر (Double)</option>
                          <option value="glow">إطار مضيء متوهج (Neon Glow)</option>
                          <option value="dashed">خط متقطع (Dashed)</option>
                        </select>
                      </div>

                      {/* Frame Color */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>لون إطار الخريطة:</span>
                          <div
                            className="w-5 h-5 rounded-full border border-white/50"
                            style={{ backgroundColor: localConfig.mapFrameColor || '#059669' }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={localConfig.mapFrameColor || '#059669'}
                            onChange={(e) => setLocalConfig({ ...localConfig, mapFrameColor: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={localConfig.mapFrameColor || '#059669'}
                            onChange={(e) => setLocalConfig({ ...localConfig, mapFrameColor: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* App Outer Background Color */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>لون خلفية التطبيق خارج الإطار:</span>
                          <div
                            className="w-5 h-5 rounded-full border border-white/50"
                            style={{ backgroundColor: localConfig.appOuterBgColor || '#090d16' }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={localConfig.appOuterBgColor || '#090d16'}
                            onChange={(e) => setLocalConfig({ ...localConfig, appOuterBgColor: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={localConfig.appOuterBgColor || '#090d16'}
                            onChange={(e) => setLocalConfig({ ...localConfig, appOuterBgColor: e.target.value })}
                            className="flex-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Map Frame Margin / Padding */}
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-slate-300 font-bold">
                          <span>هامش الخريطة عن الشاشة:</span>
                          <span className="text-emerald-400 font-mono font-black">{localConfig.mapFramePadding ?? 4}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          value={localConfig.mapFramePadding ?? 4}
                          onChange={(e) => setLocalConfig({ ...localConfig, mapFramePadding: parseInt(e.target.value) || 0 })}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Quick Color Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-slate-400 font-bold">ألوان مقترحة سريعة للإطار والخلفية:</span>
                      <button
                        type="button"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          mapFrameColor: '#059669',
                          appOuterBgColor: '#022c22'
                        })}
                        className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold cursor-pointer"
                      >
                        أخضر كارجاس الزمردي
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          mapFrameColor: '#f59e0b',
                          appOuterBgColor: '#1e1b4b'
                        })}
                        className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold cursor-pointer"
                      >
                        ذهبي ملكي مع كحلي
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          mapFrameColor: '#0ea5e9',
                          appOuterBgColor: '#030712'
                        })}
                        className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500 text-sky-300 font-bold cursor-pointer"
                      >
                        أزرق نيتروجيني عصري
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          mapFrameColor: '#10b981',
                          appOuterBgColor: '#090d16'
                        })}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-bold cursor-pointer"
                      >
                        الوضع الافتراضي الأنيق
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalConfig({
                          ...localConfig,
                          enableMapFrame: true,
                          mapFrameWidth: 2,
                          mapFrameRadius: 12,
                          mapFramePadding: 1,
                          mapFrameColor: '#059669',
                          mapFrameStyle: 'solid',
                          appOuterBgColor: '#090d16'
                        })}
                        className="px-2 py-0.5 rounded bg-teal-950 border border-teal-400 text-teal-200 font-bold cursor-pointer hover:bg-teal-900"
                      >
                        📱 إطار متوافق لشاشات الموبايل
                      </button>
                    </div>
                  </div>

                  {/* UI Buttons & Text Controls Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Nearest Station Button Control */}
                    {/* Nearest Station Button Control */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white">زر "أقرب محطة كارجاس":</span>
                        <input
                          type="checkbox"
                          checked={localConfig.showNearestStationBtn}
                          onChange={(e) => setLocalConfig({ ...localConfig, showNearestStationBtn: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">تعديل النص المكتوب على الزر:</label>
                        <input
                          type="text"
                          value={localConfig.nearestStationBtnText}
                          onChange={(e) => setLocalConfig({ ...localConfig, nearestStationBtnText: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          placeholder="أقرب محطة كارجاس"
                        />
                      </div>
                    </div>

                    {/* Cargas Stations Button Control */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white">زر "محطات كار جاس":</span>
                        <input
                          type="checkbox"
                          checked={localConfig.showNationwideBtn}
                          onChange={(e) => setLocalConfig({ ...localConfig, showNationwideBtn: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">تعديل النص المكتوب على الزر:</label>
                        <input
                          type="text"
                          value={localConfig.nationwideBtnText}
                          onChange={(e) => setLocalConfig({ ...localConfig, nationwideBtnText: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          placeholder="محطات كار جاس"
                        />
                      </div>
                    </div>

                    {/* Voice Commands Button Control */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white">زر "أوامر صوتية":</span>
                        <input
                          type="checkbox"
                          checked={localConfig.showVoiceMicBtn}
                          onChange={(e) => setLocalConfig({ ...localConfig, showVoiceMicBtn: e.target.checked })}
                          className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">تعديل النص المكتوب على الزر:</label>
                        <input
                          type="text"
                          value={localConfig.voiceMicBtnText}
                          onChange={(e) => setLocalConfig({ ...localConfig, voiceMicBtnText: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                          placeholder="أوامر صوتية"
                        />
                      </div>
                    </div>

                    {/* STOP Safety Button */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">زر إرشادات السلامة (نظام STOP):</div>
                        <div className="text-[10px] text-slate-400">إظهار أو إخفاء زر التوعية بإجراءات التموين الآمن</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showStopSafetyBtn}
                        onChange={(e) => setLocalConfig({ ...localConfig, showStopSafetyBtn: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Audio Mute Button */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">أيقونة كتم / تشغيل الصوت:</div>
                        <div className="text-[10px] text-slate-400">تمكين العميل من كتم الصوت أو تشغيله</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showAudioMuteBtn}
                        onChange={(e) => setLocalConfig({ ...localConfig, showAudioMuteBtn: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* GPS Locate Me Floating Button */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">أيقونة تحديد موقعي الحالي (GPS):</div>
                        <div className="text-[10px] text-slate-400">الزر العائم على الخريطة لإعادة التمركز على موقع العميل</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showLocateMeBtn}
                        onChange={(e) => setLocalConfig({ ...localConfig, showLocateMeBtn: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Bottom Drawer */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">قائمة المحطات السفلية (Drawer):</div>
                        <div className="text-[10px] text-slate-400">عرض بطاقات المحطات المرتبة بالأقرب في أسفل الشاشة</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showBottomDrawer}
                        onChange={(e) => setLocalConfig({ ...localConfig, showBottomDrawer: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Crowd Badges */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">مؤشرات حالة الزحام ووقت الانتظار:</div>
                        <div className="text-[10px] text-slate-400">عرض حالة المحطة (رايقة، متوسطة، طابور) للمستخدمين</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showCrowdBadges}
                        onChange={(e) => setLocalConfig({ ...localConfig, showCrowdBadges: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Voice Navigator Visibility */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">زر مرشد الملاحة الصوتي الذكي:</div>
                        <div className="text-[10px] text-slate-400">إظهار أو إخفاء زر المرشد الصوتي السريع للملاحة من شاشة المستخدمين</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.moeinVisibleToUsers}
                        onChange={(e) => setLocalConfig({ ...localConfig, moeinVisibleToUsers: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Clean Map / Hide other POIs like H, restaurants, cafes */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white flex items-center gap-1.5">
                          <EyeOff className="w-4 h-4 text-emerald-400" />
                          <span>إخفاء العلامات الأخرى من الخريطة (مثل H والمطاعم):</span>
                        </div>
                        <div className="text-[10px] text-emerald-300">إخفاء علامات المستشفيات (H) والمطاعم والمحلات التجارية الخارجية للتركيز التام على محطات كار جاس ومسار الملاحة</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.hideOtherPOIs ?? true}
                        onChange={(e) => setLocalConfig({ ...localConfig, hideOtherPOIs: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Facility Filters */}
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                      <div>
                        <div className="font-black text-white">أزرار تصنيفات كارجاس (تحويل / زيوت):</div>
                        <div className="text-[10px] text-slate-400">إظهار أزرار الفلترة السريعة تحت شريط البحث</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localConfig.showFacilityFilters}
                        onChange={(e) => setLocalConfig({ ...localConfig, showFacilityFilters: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Facility Filter Button Labels Customizer */}
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-3 text-xs">
                    <div className="font-black text-white flex items-center justify-between">
                      <span>تخصيص أسماء أزرار الفلترة السريعة (محطات الغاز / التحويل / الزيوت / الفحص):</span>
                      <span className="text-[11px] text-slate-400">يمكنك تعديل أي اسم يظهر للمستخدمين</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[11px] text-emerald-400 font-bold block mb-1">زر محطات التموين بالغاز:</label>
                        <input
                          type="text"
                          value={localConfig.gasFilterText || ''}
                          onChange={(e) => setLocalConfig({ ...localConfig, gasFilterText: e.target.value })}
                          placeholder="محطات الغاز"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-amber-400 font-bold block mb-1">زر مراكز التحويل والصيانة:</label>
                        <input
                          type="text"
                          value={localConfig.conversionFilterText || ''}
                          onChange={(e) => setLocalConfig({ ...localConfig, conversionFilterText: e.target.value })}
                          placeholder="مراكز التحويل والصيانة"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-blue-400 font-bold block mb-1">زر مراكز الزيوت المعتمدة:</label>
                        <input
                          type="text"
                          value={localConfig.oilFilterText || ''}
                          onChange={(e) => setLocalConfig({ ...localConfig, oilFilterText: e.target.value })}
                          placeholder="مراكز الزيوت (BP)"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-purple-400 font-bold block mb-1">زر فحص الأسطوانات:</label>
                        <input
                          type="text"
                          value={localConfig.inspectionFilterText || ''}
                          onChange={(e) => setLocalConfig({ ...localConfig, inspectionFilterText: e.target.value })}
                          placeholder="فحص الأسطوانات"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slogan Customizer (Two Lines) */}
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-2">
                    <label className="font-black text-white block">
                      شعار كارجاس النصي بجوار اللوجو (على سطرين - مثال: "كارجاس \n طريقنا واحد"):
                    </label>
                    <textarea
                      rows={2}
                      value={localConfig.sloganText || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, sloganText: e.target.value })}
                      placeholder={'كارجاس\nطريقنا واحد'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold leading-relaxed"
                    />
                    <div className="text-[10px] text-slate-400">
                      سيظهر الكلام تحت بعضه في سطرين صغيرين وأنيقين لتجنب تداخل الأيقونات.
                    </div>
                  </div>

                  {/* Governorates and Regions Directory CMS Manager */}
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
                      <div>
                        <div className="font-black text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          <span>التحكم في المحافظات والأقاليم وأسماء الأيقونات في دليل الجمهورية:</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          يمكنك تعديل أسماء المحافظات، إضافة مناطق أو أقاليم جديدة، وربط الكلمات الدلالية لكل محافظة.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentGovs = localConfig.customGovernorates || [
                            { id: 'all', label: 'كل المحافظات', keywords: [] },
                            { id: 'cairo_giza', label: 'القاهرة والجيزة', keywords: ['القاهرة', 'الجيزة'] },
                          ];
                          const newId = `gov_${Date.now()}`;
                          const updated = [...currentGovs, { id: newId, label: 'محافظة جديدة', keywords: ['اسم المحافظة'] }];
                          setLocalConfig({ ...localConfig, customGovernorates: updated });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer shrink-0 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة محافظة أو إقليم</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(localConfig.customGovernorates || [
                        { id: 'all', label: 'كل المحافظات', keywords: [] },
                        { id: 'cairo_giza', label: 'القاهرة والجيزة', keywords: ['القاهرة', 'الجيزة', 'مدينة نصر', 'أكتوبر'] },
                        { id: 'alex', label: 'الإسكندرية والساحل', keywords: ['الإسكندرية', 'برج العرب'] },
                        { id: 'canal', label: 'مدن القناة (السويس وبورسعيد والإسماعيلية)', keywords: ['السويس', 'بورسعيد', 'الإسماعيلية'] },
                        { id: 'delta', label: 'الدلتا (الغربية والدقهلية والبحيرة)', keywords: ['طنطا', 'المنصورة', 'دمنهور'] },
                        { id: 'upper_egypt', label: 'الصعيد (بني سويف والمنيا وأسيوط)', keywords: ['بني سويف', 'المنيا', 'العاشر'] }
                      ]).map((gov, gIdx) => (
                        <div key={gov.id || gIdx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">اسم المحافظة / الإقليم الظاهر للمستخدم:</span>
                              <input
                                type="text"
                                value={gov.label}
                                onChange={(e) => {
                                  const list = [...(localConfig.customGovernorates || [])];
                                  list[gIdx] = { ...list[gIdx], label: e.target.value };
                                  setLocalConfig({ ...localConfig, customGovernorates: list });
                                }}
                                className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">كلمات البحث والمطابقة (مفصولة بفواصل):</span>
                              <input
                                type="text"
                                value={(gov.keywords || []).join('، ')}
                                onChange={(e) => {
                                  const list = [...(localConfig.customGovernorates || [])];
                                  const keys = e.target.value.split(/[,،]/).map(k => k.trim()).filter(Boolean);
                                  list[gIdx] = { ...list[gIdx], keywords: keys };
                                  setLocalConfig({ ...localConfig, customGovernorates: list });
                                }}
                                placeholder="مثال: القاهرة، الجيزة، أكتوبر"
                                className="w-full px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>

                          {gov.id !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = (localConfig.customGovernorates || []).filter((_, i) => i !== gIdx);
                                setLocalConfig({ ...localConfig, customGovernorates: list });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
                              title="حذف المحافظة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Header Notice Banner Text */}
                  <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-xs">
                    <label className="font-black text-white block mb-1">
                      شريط تنويهات وإعلانات للمستخدمين في أعلى التطبيق (اختياري):
                    </label>
                    <input
                      type="text"
                      value={localConfig.headerNoticeText || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, headerNoticeText: e.target.value })}
                      placeholder="مثال: مرحباً بكم في تطبيق كارجاس - خصومات خاصة على غيار الزيوت بمركز ألماظة!"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">اتركه فارغاً لإخفاء شريط التنويهات.</span>
                  </div>

                  {/* App Title & Subtitle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                      <label className="font-black text-white block mb-1">عنوان التطبيق الرئيسي:</label>
                      <input
                        type="text"
                        value={localConfig.appTitle}
                        onChange={(e) => setLocalConfig({ ...localConfig, appTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                      />
                    </div>
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                      <label className="font-black text-white block mb-1">العنوان الفرعي:</label>
                      <input
                        type="text"
                        value={localConfig.appSubtitle}
                        onChange={(e) => setLocalConfig({ ...localConfig, appSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveUISettings}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xl flex items-center gap-2 cursor-pointer transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ تعديلات واجهة المستخدم والأيقونات</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PASSWORD & SECURITY SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-md mx-auto space-y-4 py-4">
                  <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 text-xs">
                    <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">تعديل كلمة سر مدير النظام</h4>
                        <p className="text-[11px] text-slate-400">كلمة السر الافتراضية الحالية: <strong className="text-amber-400 font-mono">{config.adminPassword}</strong></p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <div>
                        <label className="text-slate-300 block mb-1 font-bold">كلمة السر الجديدة:</label>
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="اكتب كلمة السر الجديدة"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm tracking-wider"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1 font-bold">تأكيد كلمة السر الجديدة:</label>
                        <input
                          type="password"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="أعد كتابة كلمة السر للتأكيد"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm tracking-wider"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-lg cursor-pointer transition active:scale-98"
                      >
                        حفظ كلمة السر الجديدة
                      </button>
                    </form>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 text-center">
                    طريقة الدخول دائماً: انقر 5 مرات على أيقونة كارجاس أو اضغط على زر قفل الإدارة، واكتب كلمة السر التي قمت بتعيينها.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
