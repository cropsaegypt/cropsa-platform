import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '../context/Store';
import { 
  Role, 
  Client, 
  Application, 
  ApplicationStatus, 
  ALL_KNOWN_INSTALLMENT_COMPANIES, 
  EGYPT_GOVERNORATES 
} from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ClipboardPaste, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Info,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Filter,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  HelpCircle,
  Eye,
  TrendingUp,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface SmartClientBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ParsedClientRow {
  index: number;
  id: string;
  selected: boolean;
  name: string;
  nationalId: string;
  hasMissingNationalId: boolean;
  temporaryNationalId: string;
  phoneNumber: string;
  governorate: string;
  profession: string;
  companyName: string;
  companyCode: string;
  approvedAmount: number;
  disbursedAmount: number;
  financeDate: string;
  notes: string;
  isValid: boolean; // false only if basic name is missing
  warnings: string[];
  errors: string[];
  isDuplicateInDb: boolean;
  isDelinquent: boolean;
  daysElapsed: number;
  monthsElapsed: number;
  renewalClassification: 'ELIGIBLE' | 'RECENT_ACTIVE' | 'DELINQUENT' | 'NEEDS_DATA' | 'NEW_CLIENT';
  suggestedRenewalLimit: number;
  renewalBadgeText: string;
}

export const SmartClientBulkImportModal: React.FC<SmartClientBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, clients, bulkImportClients } = useStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide'>('upload');
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedClientRow[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ELIGIBLE' | 'WARNINGS' | 'DELINQUENT' | 'DUPLICATES' | 'ERRORS'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  if (!isOpen) return null;

  // Permission check
  const isAllowed = currentUser?.role === Role.SUPER_ADMIN || 
                    currentUser?.role === Role.ADMIN || 
                    currentUser?.role === Role.INSTALLMENT_COMPANY ||
                    currentUser?.role === Role.BRANCH_MANAGER;

  if (!isAllowed) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">صلاحية غير مصرح بها</h3>
          <p className="text-xs text-slate-500">
            خاصية الاستيراد والتحليل المجمع لقاعدة بيانات العملاء مخصصة لمدير النظام ومسؤولي الشركات.
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  // Sample CSV format with UTF-8 BOM
  const sampleCsvContent = `اسم العميل,الرقم القومي,رقم الهاتف,المحافظة,المهنة,الشركة الممولة,المبلغ المعتمد,المبلغ المنصرف,تاريخ التمويل,ملاحظات
عادل عبد الحميد النمر,28405101600123,01019283746,القاهرة,تاجر,شركة أمان لتمويل المشروعات,95000,95000,2025-10-15,عميل منتظم بالسداد ويرغب بالتجديد
فتحي رضوان الدسوقي,,01128374659,البحيرة,مزارع,شركة فرصة للتمويل الزراعي,60000,60000,2025-09-20,عميل بدون رقم قومي مؤقتاً مستوفي المحاصيل
شريف ماهر القاضي,28802150100456,01229384756,الجيزة,تاجر,شركة كونتكت للتمويل الاستهلاكي,120000,100000,2026-03-10,تمويل حديث نشط
سعيد عطية المنشاوي,,01558473625,الدقهلية,مزارع,شركة سهولة لخدمات التقسيط,45000,45000,2025-07-05,سلفة محصولية قديمة مسددة
محمود طلعت الخولي,29007121400678,01098473625,الشرقية,تاجر,إم إن تي حالا للتمويل,70000,70000,2025-07-28,عميل قديم لدى حالا معفى من الاستعلام
إبراهيم سلامة عبد ربه,27608221500345,01209384756,الإسكندرية,مقاول,شركة فاليو لخدمات التمويل,150000,150000,2025-06-12,تأخر شيكات وشبهة تعثر ائتماني`;

  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + sampleCsvContent;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'crobsa_clients_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to match company code from input name
  const matchCompanyCode = (companyInput: string): { code: string; nameAr: string } => {
    if (!companyInput) return { code: 'comp_01', nameAr: 'شركة أمان لتمويل المشروعات والتقسيط' };
    const clean = companyInput.trim().toLowerCase();
    const found = ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => 
      c.nameAr.toLowerCase().includes(clean) || 
      clean.includes(c.nameAr.toLowerCase()) || 
      c.code.toLowerCase() === clean ||
      c.nameEn.toLowerCase().includes(clean)
    );
    if (found) {
      return { code: found.code, nameAr: found.nameAr };
    }
    return { code: 'comp_01', nameAr: companyInput };
  };

  // Smart Currency & Amount Parser (handles "50,000", "40.000", "40 ألف", "40" in thousands, etc.)
  const parseSmartAmount = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') {
      if (isNaN(val)) return 0;
      // Auto-detect numbers entered in thousands (e.g. 40, 50, 60): no loan in Egypt is 40 or 60 EGP
      if (val > 0 && val <= 500) return val * 1000;
      return Math.round(val);
    }
    let str = String(val).trim();
    if (!str) return 0;

    // Convert Arabic numbers: ٠١٢٣٤٥٦٧٨٩ -> 0123456789
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    arabicDigits.forEach((d, i) => {
      str = str.replace(new RegExp(d, 'g'), String(i));
    });

    const isK = str.toLowerCase().includes('k') || str.includes('ألف') || str.includes('الف');

    // Strip out currency words (ج.م, جنيه, LE, EGP, إلخ) keeping digits, dot and comma
    str = str.replace(/[^\d.,]/g, '');

    // Handle dot vs comma as thousands separator (e.g. 40.000 or 50,000 or 1.500.000)
    if (/^\d{1,3}(\.\d{3})+$/.test(str) || /^\d+\.\d{3}$/.test(str)) {
      str = str.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(str) || /^\d+,\d{3}$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/,/g, '');
    }

    let num = parseFloat(str) || 0;
    if (isK) num *= 1000;

    // Auto-detect numbers entered in thousands (40 => 40,000, 60 => 60,000)
    if (num > 0 && num <= 500) {
      num *= 1000;
    }

    return Math.round(num);
  };

  // Smart Date Parser (handles Egyptian DD/MM/YYYY, Excel serial dates, "00", ancient years like 2023, etc.)
  const parseSmartDate = (val: any): { dateStr: string; daysElapsed: number; monthsElapsed: number; isAncient: boolean } => {
    const now = Date.now();
    if (val === undefined || val === null) {
      return { dateStr: '2023-01-01', daysElapsed: 1200, monthsElapsed: 40, isAncient: true };
    }

    // Handle Excel Serial Number (e.g. 45231)
    if (typeof val === 'number' && val > 20000 && val < 60000) {
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      const yyyy = jsDate.getFullYear();
      const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
      const dd = String(jsDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const days = Math.max(0, Math.floor((now - jsDate.getTime()) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: Math.floor(days / 30), isAncient: days >= 90 };
    }

    let str = String(val).trim();
    // Handle empty, "00", "0", "-", or placeholder (historical cases from long ago)
    if (!str || str === '0' || str === '00' || str === '-' || str.startsWith('00/') || str.startsWith('00-')) {
      return { dateStr: '2023-01-01', daysElapsed: 1200, monthsElapsed: 40, isAncient: true };
    }

    // Handle Egyptian format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      const dateStr = `${year}-${month}-${day}`;
      const timestamp = new Date(dateStr).getTime();
      const days = Math.max(0, Math.floor((now - timestamp) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: Math.floor(days / 30), isAncient: days >= 90 };
    }

    // Handle YYYY/MM/DD or YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timestamp = new Date(dateStr).getTime();
      const days = Math.max(0, Math.floor((now - timestamp) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: Math.floor(days / 30), isAncient: days >= 90 };
    }

    // Handle isolated 1 or 2 digit number (e.g. "40", "60", duration in months)
    // NEVER pass 2-digit numbers to new Date() because JS interprets "40" as future year 2040 and "60" as 1960!
    if (/^\d{1,2}$/.test(str)) {
      const months = Math.max(3, parseInt(str, 10)); // e.g. 40 months or 60 months
      const historicalTime = now - (months * 30 * 86400 * 1000);
      const jsDate = new Date(historicalTime);
      const yyyy = Math.min(new Date().getFullYear() - 1, jsDate.getFullYear());
      const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
      const dd = String(jsDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const days = Math.max(90, Math.floor((now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: months, isAncient: true };
    }

    // Handle Year only like "2023", "2022", "2024"
    if (/^(19\d\d|20\d\d)$/.test(str)) {
      let yyyy = parseInt(str, 10);
      if (yyyy > new Date().getFullYear()) yyyy = 2023; // Guard against future years
      const dateStr = `${yyyy}-01-01`;
      const timestamp = new Date(dateStr).getTime();
      const days = Math.max(0, Math.floor((now - timestamp) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: Math.floor(days / 30), isAncient: days >= 90 };
    }

    // Fallback to JS Date parse with strict guard against future dates like 2040 or ancient years like 1960
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      let yyyy = parsed.getFullYear();
      // Guard: loan cannot be in the future (like 2040) or ancient history (like 1960)
      if (yyyy > new Date().getFullYear() || yyyy < 2000) {
        yyyy = 2023;
      }
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const days = Math.max(90, Math.floor((now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
      return { dateStr, daysElapsed: days, monthsElapsed: Math.floor(days / 30), isAncient: days >= 90 };
    }

    return { dateStr: '2023-01-01', daysElapsed: 1200, monthsElapsed: 40, isAncient: true };
  };

  // Core Analytical Engine for a single row
  const analyzeClientRow = (
    name: string,
    rawNationalId: string,
    phoneNumber: string,
    governorate: string,
    profession: string,
    companyInput: string,
    approvedAmount: number,
    disbursedAmount: number,
    financeDateInput: string,
    notes: string,
    idx: number
  ): ParsedClientRow => {
    const cleanName = name.trim();
    const cleanNid = rawNationalId ? String(rawNationalId).replace(/\D/g, '') : '';
    const cleanPhone = phoneNumber ? String(phoneNumber).replace(/\s+/g, '') : '';
    const cleanGov = governorate.trim() || 'القاهرة';
    const cleanProf = profession.trim() || 'تاجر';
    const { code: matchedCode, nameAr: matchedCompanyName } = matchCompanyCode(companyInput);

    const hasMissingNationalId = !cleanNid || cleanNid.length !== 14;
    const tempNid = `TEMP-NID-${Date.now().toString().slice(-5)}-${idx + 1}`;

    // Smart Dates & elapsed calculation
    const parsedDate = parseSmartDate(financeDateInput);
    const validDateStr = parsedDate.dateStr;
    const daysElapsed = parsedDate.daysElapsed;
    const monthsElapsed = parsedDate.monthsElapsed;

    // Delinquency check based on notes & negative markers
    const notesLower = (notes || '').toLowerCase();
    const isDelinquent = notesLower.includes('تعثر') || 
                         notesLower.includes('رفض') || 
                         notesLower.includes('شيك') || 
                         notesLower.includes('قضية') || 
                         notesLower.includes('اي سكور') || 
                         notesLower.includes('ايسكور') || 
                         notesLower.includes('متأخر') || 
                         notesLower.includes('delinquent') || 
                         notesLower.includes('blacklist');

    // Duplicate detection in DB
    let isDuplicateInDb = false;
    if (!hasMissingNationalId) {
      isDuplicateInDb = clients.some(c => c.nationalId === cleanNid);
    } else if (cleanPhone && cleanPhone.length >= 10) {
      isDuplicateInDb = clients.some(c => c.name.toLowerCase() === cleanName.toLowerCase() && c.phoneNumber === cleanPhone);
    } else {
      isDuplicateInDb = clients.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
    }

    // Errors & Warnings
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!cleanName) {
      errors.push('اسم العميل مطلوب');
    }

    if (hasMissingNationalId) {
      warnings.push(!cleanNid ? 'بدون رقم قومي (سيتم إنشاء رقم مرجعي مؤقت)' : `الرقم القومي غير مكتمل (${cleanNid.length} أرقام بدلاً من 14)`);
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      warnings.push('رقم الهاتف قصير أو غير متوفر');
    }

    if (approvedAmount <= 0 && disbursedAmount <= 0) {
      warnings.push('قيمة التمويل صفرية');
    }

    if (isDelinquent) {
      warnings.push('تنبيه: ملاحظات تعثر أو شيكات مسجلة على العميل');
    }

    // Renewal Classification:
    // Any case financed >= 3 months ago (or from ancient dates) qualifies for renewal!
    // This applies whether they have a national ID or temporary ID.
    let renewalClassification: 'ELIGIBLE' | 'RECENT_ACTIVE' | 'DELINQUENT' | 'NEEDS_DATA' | 'NEW_CLIENT' = 'NEW_CLIENT';
    let suggestedRenewalLimit = Math.round((approvedAmount || disbursedAmount || 50000) * 1.35);
    let renewalBadgeText = '🌱 عميل جديد';

    if (isDelinquent) {
      renewalClassification = 'DELINQUENT';
      renewalBadgeText = '⛔ غير مؤهل (تنبيه تعثر ومخاطر)';
      suggestedRenewalLimit = 0;
    } else if (disbursedAmount > 0 || approvedAmount > 0 || parsedDate.isAncient) {
      if (daysElapsed >= 90 || monthsElapsed >= 3 || parsedDate.isAncient) {
        renewalClassification = 'ELIGIBLE';
        renewalBadgeText = hasMissingNationalId
          ? `✨ مؤهل للتجديد (استوفى ${monthsElapsed} شهراً - برقم مؤقت)`
          : `✨ مؤهل للتجديد (استوفى ${monthsElapsed} شهراً)`;
      } else {
        renewalClassification = 'RECENT_ACTIVE';
        renewalBadgeText = `⚡ تمويل حديث (متبقي ${Math.max(0, 90 - daysElapsed)} يوماً)`;
        suggestedRenewalLimit = approvedAmount || disbursedAmount;
      }
    } else if (hasMissingNationalId) {
      renewalClassification = 'NEEDS_DATA';
      renewalBadgeText = '📋 بحاجة لاستكمال الرقم القومي';
    }

    return {
      index: idx + 1,
      id: `row_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      selected: errors.length === 0, // Auto-select all rows unless fatal error (missing name)
      name: cleanName,
      nationalId: cleanNid,
      hasMissingNationalId,
      temporaryNationalId: tempNid,
      phoneNumber: cleanPhone,
      governorate: cleanGov,
      profession: cleanProf,
      companyName: matchedCompanyName,
      companyCode: matchedCode,
      approvedAmount,
      disbursedAmount,
      financeDate: validDateStr,
      notes: notes || (hasMissingNationalId ? 'تم الاستيراد بدون رقم قومي مؤقتاً' : 'مستورد من شيت مجمع'),
      isValid: errors.length === 0,
      warnings,
      errors,
      isDuplicateInDb,
      isDelinquent,
      daysElapsed,
      monthsElapsed,
      renewalClassification,
      suggestedRenewalLimit,
      renewalBadgeText
    };
  };

  // Parse 2D Table Data (from SheetJS / XLSX or TSV)
  const parse2DData = (rawRows: any[][]) => {
    if (!rawRows || rawRows.length === 0) {
      setParsedRows([]);
      return;
    }

    // Filter empty rows
    const cleanedRows = rawRows.filter(r => r && r.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''));
    if (cleanedRows.length === 0) return;

    // Detect header mapping with strict priorities
    let headerRowIdx = -1;
    let nameIdx = -1;
    let nidIdx = -1;
    let phoneIdx = -1;
    let govIdx = -1;
    let profIdx = -1;
    let compIdx = -1;
    let apprIdx = -1;
    let disbIdx = -1;
    let generalAmountIdx = -1;
    let dateIdx = -1;
    let notesIdx = -1;

    // Try finding header row
    for (let r = 0; r < Math.min(cleanedRows.length, 5); r++) {
      const rowStr = cleanedRows[r].map(c => String(c || '').toLowerCase()).join(' ');
      if (rowStr.includes('اسم') || rowStr.includes('قومي') || rowStr.includes('name') || rowStr.includes('هاتف') || rowStr.includes('مبلغ') || rowStr.includes('تمويل')) {
        headerRowIdx = r;
        cleanedRows[r].forEach((headerCell, colIdx) => {
          const str = String(headerCell || '').toLowerCase().trim();
          if (!str) return;

          // 1. Name
          if ((str.includes('اسم') || str.includes('name') || str.includes('عميل') || str.includes('تاجر')) && !str.includes('شرك') && !str.includes('فرع') && !str.includes('موظف')) {
            if (nameIdx === -1) nameIdx = colIdx;
          }
          // 2. National ID
          else if (str.includes('قومي') || str.includes('بطاق') || str.includes('nid') || str.includes('national') || str.includes('هوية')) {
            if (nidIdx === -1) nidIdx = colIdx;
          }
          // 3. Phone
          else if (str.includes('هاتف') || str.includes('موبا') || str.includes('تليف') || str.includes('phone') || str.includes('mobile') || str.includes('واتس')) {
            if (phoneIdx === -1) phoneIdx = colIdx;
          }
          // 4. Governorate / City
          else if (str.includes('محافظ') || str.includes('gov') || str.includes('مدين') || str.includes('city') || str.includes('عنوان')) {
            if (govIdx === -1) govIdx = colIdx;
          }
          // 5. Profession
          else if (str.includes('مهن') || str.includes('عمل') || str.includes('وظي') || str.includes('job') || str.includes('prof') || str.includes('نشاط')) {
            if (profIdx === -1) profIdx = colIdx;
          }
          // 6. Company
          else if (str.includes('شرك') || str.includes('ممول') || str.includes('comp') || str.includes('جهة') || str.includes('بنك')) {
            if (compIdx === -1) compIdx = colIdx;
          }
          // 7. DATE (CRITICAL: Must match before amounts so "تاريخ التمويل" is NOT parsed as amount, but NOT duration columns like "المدة بالشهور"!)
          else if ((str.includes('تاريخ') || str.includes('date') || str.includes('منح') || (str.includes('شهر') && !str.includes('مدة') && !str.includes('عدد') && !str.includes('قسط') && !str.includes('أقساط')) || str.includes('يوم') || str.includes('سنة') || str.includes('عام')) && !str.includes('مدة') && !str.includes('عدد') && !str.includes('قسط')) {
            if (dateIdx === -1) dateIdx = colIdx;
          }
          // 8. Approved Amount
          else if ((str.includes('معتمد') || str.includes('appr') || str.includes('سقف') || str.includes('حد ائتمان')) && !str.includes('تاريخ')) {
            if (apprIdx === -1) apprIdx = colIdx;
          }
          // 9. Disbursed Amount
          else if ((str.includes('منصرف') || str.includes('مسحوب') || str.includes('disb') || str.includes('صرف') || str.includes('مصروف')) && !str.includes('تاريخ')) {
            if (disbIdx === -1) disbIdx = colIdx;
          }
          // 10. General Amount (e.g. "مبلغ التمويل", "قيمة التمويل", "المبلغ")
          else if ((str.includes('مبلغ') || str.includes('تمويل') || str.includes('قيمة') || str.includes('amount')) && !str.includes('تاريخ') && !str.includes('شرك')) {
            if (generalAmountIdx === -1) generalAmountIdx = colIdx;
          }
          // 11. Notes
          else if (str.includes('ملاحظ') || str.includes('بيان') || str.includes('note') || str.includes('وصف') || str.includes('تعليق')) {
            if (notesIdx === -1) notesIdx = colIdx;
          }
        });
        break;
      }
    }

    // Resolve general amounts if specific approved/disbursed were not separated
    if (apprIdx === -1 && generalAmountIdx !== -1) apprIdx = generalAmountIdx;
    if (disbIdx === -1 && generalAmountIdx !== -1) disbIdx = generalAmountIdx;
    if (apprIdx === -1 && disbIdx !== -1) apprIdx = disbIdx;
    if (disbIdx === -1 && apprIdx !== -1) disbIdx = apprIdx;

    // Fallbacks if no header detected
    if (nameIdx === -1) nameIdx = 0;
    if (nidIdx === -1) nidIdx = 1;
    if (phoneIdx === -1) phoneIdx = 2;
    if (govIdx === -1) govIdx = 3;
    if (profIdx === -1) profIdx = 4;
    if (compIdx === -1) compIdx = 5;
    if (apprIdx === -1) apprIdx = 6;
    if (disbIdx === -1) disbIdx = 7;
    if (dateIdx === -1) dateIdx = 8;
    if (notesIdx === -1) notesIdx = 9;

    const dataRows = headerRowIdx >= 0 ? cleanedRows.slice(headerRowIdx + 1) : cleanedRows;
    const finalParsed: ParsedClientRow[] = [];

    dataRows.forEach((row, idx) => {
      const name = String(row[nameIdx] || '').trim();
      if (!name) return; // Skip rows without name

      const nationalId = String(row[nidIdx] || '').trim();
      const phoneNumber = String(row[phoneIdx] || '').trim();
      const governorate = String(row[govIdx] || 'القاهرة').trim();
      const profession = String(row[profIdx] || 'تاجر').trim();
      const companyName = String(row[compIdx] || 'شركة أمان لتمويل المشروعات').trim();
      
      const approvedAmount = parseSmartAmount(row[apprIdx]);
      const disbursedAmount = parseSmartAmount(row[disbIdx]) || approvedAmount;
      const financeDate = String(row[dateIdx] || '').trim();
      const notes = String(row[notesIdx] || '').trim();

      const analyzed = analyzeClientRow(
        name,
        nationalId,
        phoneNumber,
        governorate,
        profession,
        companyName,
        approvedAmount,
        disbursedAmount,
        financeDate,
        notes,
        idx
      );
      finalParsed.push(analyzed);
    });

    setParsedRows(finalParsed);
    setResultMessage(null);
  };

  // Text parser for pasted CSV / TSV
  const parseRawText = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    const table: any[][] = lines.map(line => {
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      return cols.map(c => c.trim().replace(/^["']|["']$/g, ''));
    });
    parse2DData(table);
  };

  // Excel / CSV file upload handler using SheetJS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isBinaryExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isBinaryExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonTable = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }) as any[][];
          parse2DData(jsonTable);
        } catch (err: any) {
          console.error('Error parsing binary Excel file:', err);
          setResultMessage({ type: 'ERROR', text: 'تعذر قراءة ملف Excel، يرجى التأكد من سلامة الملف أو حفظه كـ CSV.' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          parseRawText(content);
        } catch (err) {
          setResultMessage({ type: 'ERROR', text: 'تعذر قراءة ملف النصوص/CSV.' });
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  // Row selection toggle
  const toggleRowSelect = (id: string) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleSelectAll = (select: boolean) => {
    setParsedRows(prev => prev.map(r => r.isValid ? { ...r, selected: select } : r));
  };

  const handleSelectOnlyEligible = () => {
    setParsedRows(prev => prev.map(r => ({
      ...r,
      selected: r.isValid && r.renewalClassification === 'ELIGIBLE'
    })));
  };

  const handleSelectCleanOnly = () => {
    setParsedRows(prev => prev.map(r => ({
      ...r,
      selected: r.isValid && !r.hasMissingNationalId && !r.isDelinquent
    })));
  };

  // Inline cell editor
  const handleUpdateRowCell = (id: string, field: keyof ParsedClientRow, value: any) => {
    setParsedRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Re-run analysis for updated values
      return analyzeClientRow(
        updated.name,
        updated.nationalId,
        updated.phoneNumber,
        updated.governorate,
        updated.profession,
        updated.companyName,
        updated.approvedAmount,
        updated.disbursedAmount,
        updated.financeDate,
        updated.notes,
        r.index - 1
      );
    }));
  };

  // Quick helper to multiply any amounts <= 500 by 1,000 (if entered in thousands like 40 => 40,000)
  const handleMultiplySmallAmounts = () => {
    setParsedRows(prev => prev.map(r => {
      let appr = r.approvedAmount;
      let disb = r.disbursedAmount;
      if (appr > 0 && appr <= 500) appr *= 1000;
      if (disb > 0 && disb <= 500) disb *= 1000;
      return analyzeClientRow(
        r.name,
        r.nationalId,
        r.phoneNumber,
        r.governorate,
        r.profession,
        r.companyName,
        appr,
        disb,
        r.financeDate,
        r.notes,
        r.index - 1
      );
    }));
  };

  // Quick helper to make approved amount match disbursed amount
  const handleSyncApprovedToDisbursed = () => {
    setParsedRows(prev => prev.map(r => {
      const amt = r.disbursedAmount || r.approvedAmount;
      return analyzeClientRow(
        r.name,
        r.nationalId,
        r.phoneNumber,
        r.governorate,
        r.profession,
        r.companyName,
        amt,
        amt,
        r.financeDate,
        r.notes,
        r.index - 1
      );
    }));
  };

  // Final submission
  const handleConfirmImport = async (importOnlyClean = false) => {
    let rowsToImport = parsedRows.filter(r => r.selected && r.isValid);
    if (importOnlyClean) {
      rowsToImport = rowsToImport.filter(r => !r.hasMissingNationalId && !r.isDelinquent);
    }

    if (rowsToImport.length === 0) {
      setResultMessage({ type: 'ERROR', text: 'لا توجد صفوف محددة وصالحة للاستيراد.' });
      return;
    }

    setIsProcessing(true);
    setResultMessage(null);

    const clientsPayload: Partial<Client>[] = rowsToImport.map(r => ({
      name: r.name,
      nationalId: r.hasMissingNationalId ? r.temporaryNationalId : r.nationalId,
      hasMissingNationalId: r.hasMissingNationalId,
      temporaryNationalId: r.hasMissingNationalId ? r.temporaryNationalId : undefined,
      renewalClassification: r.renewalClassification,
      renewalEligibleMonths: r.monthsElapsed,
      suggestedRenewalLimit: r.suggestedRenewalLimit,
      renewalNotes: r.renewalBadgeText,
      phoneNumber: r.phoneNumber,
      governorate: r.governorate,
      profession: r.profession,
      totalApprovedAmount: r.approvedAmount,
      disbursedAmount: r.disbursedAmount,
      companyName: r.companyName,
      lastFinanceDate: r.financeDate,
      isHistoricalOnly: true,
      notes: r.notes,
      manualEntry: {
        installmentCompanyId: r.companyCode,
        companyName: r.companyName,
        approvedAmount: r.approvedAmount,
        disbursedAmount: r.disbursedAmount,
        approvalDate: r.financeDate,
        lastWithdrawalDate: r.financeDate,
        notes: r.notes
      }
    }));

    const appsPayload: Partial<Application>[] = rowsToImport.map(r => ({
      clientName: r.name,
      clientNationalId: r.hasMissingNationalId ? r.temporaryNationalId : r.nationalId,
      phoneNumber: r.phoneNumber,
      governorate: r.governorate,
      profession: r.profession as any,
      requestedAmount: r.approvedAmount || r.disbursedAmount,
      approvedAmount: r.approvedAmount || r.disbursedAmount,
      usedAmount: r.disbursedAmount,
      status: ApplicationStatus.APPROVED,
      submittedAt: r.financeDate ? `${r.financeDate}T10:00:00.000Z` : new Date().toISOString(),
      reviewedAt: r.financeDate ? `${r.financeDate}T12:00:00.000Z` : new Date().toISOString(),
      assignedCompanyIds: [r.companyCode],
      description: `سجل تمويل تاريخي مستورد (${r.companyName}) - مبلغ: ${r.disbursedAmount.toLocaleString()} ج.م`
    }));

    try {
      const result = await bulkImportClients(clientsPayload, appsPayload);
      setIsProcessing(false);
      if (result.importedCount > 0) {
        setResultMessage({
          type: 'SUCCESS',
          text: `تم استيراد واعتماد ${result.importedCount} عميل بنجاح في قاعدة البيانات وتحديث تصنيفات التجديد والأهلية الائتمانية!`
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setResultMessage({
          type: 'ERROR',
          text: result.errors.join(' | ') || 'حدث خطأ أثناء حفظ السجلات'
        });
      }
    } catch (err: any) {
      setIsProcessing(false);
      setResultMessage({ type: 'ERROR', text: err.message || 'فشل الاستيراد' });
    }
  };

  // Aggregate stats from parsed rows
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const selectedCount = parsedRows.filter(r => r.selected).length;
    const eligibleCount = parsedRows.filter(r => r.renewalClassification === 'ELIGIBLE').length;
    const recentCount = parsedRows.filter(r => r.renewalClassification === 'RECENT_ACTIVE').length;
    const missingNidCount = parsedRows.filter(r => r.hasMissingNationalId).length;
    const delinquentCount = parsedRows.filter(r => r.isDelinquent).length;
    const duplicateCount = parsedRows.filter(r => r.isDuplicateInDb).length;
    const errorCount = parsedRows.filter(r => !r.isValid).length;

    return {
      total,
      selectedCount,
      eligibleCount,
      recentCount,
      missingNidCount,
      delinquentCount,
      duplicateCount,
      errorCount
    };
  }, [parsedRows]);

  // Filtered rows for the preview table
  const displayedRows = useMemo(() => {
    return parsedRows.filter(r => {
      if (filterMode === 'ELIGIBLE') return r.renewalClassification === 'ELIGIBLE';
      if (filterMode === 'WARNINGS') return r.hasMissingNationalId || r.warnings.length > 0;
      if (filterMode === 'DELINQUENT') return r.isDelinquent;
      if (filterMode === 'DUPLICATES') return r.isDuplicateInDb;
      if (filterMode === 'ERRORS') return !r.isValid;
      return true;
    });
  }, [parsedRows, filterMode]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-cropsa-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cropsa-800/80 border border-cropsa-700 flex items-center justify-center text-sky-400 font-bold shadow-inner">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  المحلل الذكي واستيراد شيت العملاء المجمع
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  تحليل ذكي وقبول مرن
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                يقبل ملفات Excel (.xlsx) و CSV حتى لو بدون رقم قومي، مع فحص الأخطاء، فرز الحالات، وتصنيف الأهلية للتجديد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-cropsa-600 text-cropsa-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            رفع ملف Excel / CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-cropsa-600 text-cropsa-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            لصق بيانات من Excel مباشرة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'guide'
                ? 'border-cropsa-600 text-cropsa-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Info className="h-4 w-4" />
            دليل الشيت وقائمة شركات التقسيط ({ALL_KNOWN_INSTALLMENT_COMPANIES.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {resultMessage && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in shadow-xs ${
              resultMessage.type === 'SUCCESS' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              {resultMessage.type === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-sky-300 hover:border-cropsa-600 rounded-3xl p-8 text-center bg-linear-to-b from-sky-50/50 to-slate-50/80 transition-all">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-700 mx-auto mb-3 shadow-xs">
                  <FileSpreadsheet className="h-7 w-7" />
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">اختر أو اسحب ملف Excel (.xlsx / .xls) أو CSV</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-lg mx-auto leading-relaxed">
                  يقبل النظام الشيت حتى لو كان الرقم القومي غير موجود لبعض العملاء، حيث سيتم قبولهم وتحليلهم وفرز من هو مؤهل للتجديد أو به تنبيهات.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="bg-cropsa-700 hover:bg-cropsa-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    استعراض ملف من الجهاز
                    <input 
                      type="file" 
                      accept=".xlsx,.xls,.csv,.tsv,.txt" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="h-4 w-4 text-slate-500" />
                    تحميل نموذج شيت تجريبي (.csv)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ClipboardPaste className="h-4 w-4 text-cropsa-600" />
                  انسخ الصفوف من برنامج Excel والصقها هنا مباشرة:
                </label>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="text-cropsa-700 hover:text-cropsa-900 text-xs font-bold flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> تحميل النموذج الجاهز
                </button>
              </div>
              <textarea
                value={pasteData}
                onChange={e => {
                  setPasteData(e.target.value);
                  parseRawText(e.target.value);
                }}
                rows={5}
                placeholder="الصق خلايا الشيت هنا (الأعمدة: اسم العميل، الرقم القومي، الهاتف، المحافظة، المهنة، الشركة، المعتمد، المنصرف، تاريخ التمويل، ملاحظات)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500 shadow-inner"
              />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-950 text-xs sm:text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-sky-600" />
                    أعمدة الشيت المدعومة وقواعد التحليل الذكي
                  </h4>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> تحميل ملف النموذج
                  </button>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed">
                  الأعمدة بالترتيب:
                  <strong className="mx-1">1. اسم العميل</strong> |
                  <strong className="mx-1">2. الرقم القومي (اختياري، إن وجد)</strong> |
                  <strong className="mx-1">3. الهاتف</strong> |
                  <strong className="mx-1">4. المحافظة</strong> |
                  <strong className="mx-1">5. المهنة</strong> |
                  <strong className="mx-1">6. الشركة الممولة</strong> |
                  <strong className="mx-1">7. المبلغ المعتمد</strong> |
                  <strong className="mx-1">8. المبلغ المنصرف</strong> |
                  <strong className="mx-1">9. تاريخ الصرف</strong> |
                  <strong className="mx-1">10. ملاحظات</strong>
                </p>
                <div className="text-[11px] text-sky-800 bg-white/70 p-2.5 rounded-xl border border-sky-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>ميزة التجديد التلقائي:</strong> إذا كان تاريخ التمويل منقضياً عليه 3 أشهر فأكثر، يصنفه النظام تلقائياً كـ <strong>مؤهل للتجديد</strong> ويقترح له حداً ائتمانياً إضافياً فور استيراده!
                  </span>
                </div>
              </div>

              {/* Companies dictionary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  شركات التمويل والتقسيط المدعومة والمعترف بها تلقائياً:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ALL_KNOWN_INSTALLMENT_COMPANIES.slice(0, 16).map(company => (
                    <div key={company.code} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                      <span className="font-bold text-[11px] text-slate-800 block truncate">{company.nameAr}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{company.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Dashboard & Results */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2">
              
              {/* Intelligence Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold">إجمالي المستخرج</div>
                  <div className="text-xl font-black font-mono">{stats.total}</div>
                  <div className="text-[9px] text-sky-300">محدد: {stats.selectedCount}</div>
                </div>

                <div 
                  onClick={() => setFilterMode('ELIGIBLE')}
                  className={`p-3 rounded-2xl space-y-0.5 cursor-pointer transition-all border ${
                    filterMode === 'ELIGIBLE' ? 'bg-amber-100 border-amber-400 shadow-xs' : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
                  }`}
                >
                  <div className="text-[10px] text-amber-900 font-bold flex items-center justify-between">
                    <span>✨ مؤهل للتجديد</span>
                    <Sparkles className="h-3 w-3 text-amber-600" />
                  </div>
                  <div className="text-xl font-black font-mono text-amber-950">{stats.eligibleCount}</div>
                  <div className="text-[9px] text-amber-700">استوفى 3+ أشهر</div>
                </div>

                <div 
                  onClick={() => setFilterMode('WARNINGS')}
                  className={`p-3 rounded-2xl space-y-0.5 cursor-pointer transition-all border ${
                    filterMode === 'WARNINGS' ? 'bg-orange-100 border-orange-400 shadow-xs' : 'bg-orange-50/70 border-orange-200 hover:bg-orange-100/60'
                  }`}
                >
                  <div className="text-[10px] text-orange-900 font-bold flex items-center justify-between">
                    <span>⚠️ بدون رقم قومي</span>
                    <HelpCircle className="h-3 w-3 text-orange-600" />
                  </div>
                  <div className="text-xl font-black font-mono text-orange-950">{stats.missingNidCount}</div>
                  <div className="text-[9px] text-orange-700">يُقبل برقم مؤقت</div>
                </div>

                <div 
                  onClick={() => setFilterMode('DELINQUENT')}
                  className={`p-3 rounded-2xl space-y-0.5 cursor-pointer transition-all border ${
                    filterMode === 'DELINQUENT' ? 'bg-rose-100 border-rose-400 shadow-xs' : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
                  }`}
                >
                  <div className="text-[10px] text-rose-900 font-bold flex items-center justify-between">
                    <span>⛔ تنبيهات تعثر</span>
                    <ShieldAlert className="h-3 w-3 text-rose-600" />
                  </div>
                  <div className="text-xl font-black font-mono text-rose-950">{stats.delinquentCount}</div>
                  <div className="text-[9px] text-rose-700">شيكات أو قضايا</div>
                </div>

                <div 
                  onClick={() => setFilterMode('DUPLICATES')}
                  className={`p-3 rounded-2xl space-y-0.5 cursor-pointer transition-all border ${
                    filterMode === 'DUPLICATES' ? 'bg-sky-100 border-sky-400 shadow-xs' : 'bg-sky-50/70 border-sky-200 hover:bg-sky-100/60'
                  }`}
                >
                  <div className="text-[10px] text-sky-900 font-bold flex items-center justify-between">
                    <span>🔄 مسجل مسبقاً</span>
                    <RefreshCw className="h-3 w-3 text-sky-600" />
                  </div>
                  <div className="text-xl font-black font-mono text-sky-950">{stats.duplicateCount}</div>
                  <div className="text-[9px] text-sky-700">سيتم تحديث بياناته</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-0.5">
                  <div className="text-[10px] text-emerald-900 font-bold flex items-center justify-between">
                    <span>⚡ تمويل حديث</span>
                    <Clock className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-950">{stats.recentCount}</div>
                  <div className="text-[9px] text-emerald-700">خلال آخر 90 يوم</div>
                </div>
              </div>

              {/* User Decision Box & Selection Actions */}
              <div className="bg-slate-100/90 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">تحديد السجلات:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                  >
                    تحديد الكل ({stats.total})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectOnlyEligible}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 transition-colors"
                  >
                    ✨ المؤهلين للتجديد فقط ({stats.eligibleCount})
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectCleanOnly}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-900 transition-colors"
                  >
                    المكتملين برقم قومي فقط ({stats.total - stats.missingNidCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-500 transition-colors"
                  >
                    إلغاء التحديد
                  </button>

                  <div className="flex items-center gap-1.5 mr-auto">
                    <button
                      type="button"
                      onClick={handleMultiplySmallAmounts}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-[10px] font-bold text-sky-800 transition-colors"
                      title="ضرب أي مبالغ صغيرة (أقل من 500) في 1,000 إذا تم إدخالها بالآلاف"
                    >
                      💡 تصحيح الآلاف (×1,000 للمبالغ الصغيرة)
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncApprovedToDisbursed}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                      title="مساواة المعتمد بالمنصرف لجميع السجلات"
                    >
                      🔄 مساواة المعتمد بالمنصرف
                    </button>
                  </div>
                </div>

                {/* Import Confirmation Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {stats.missingNidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleConfirmImport(true)}
                      disabled={isProcessing || (stats.total - stats.missingNidCount === 0)}
                      className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all shadow-xs"
                      title="استيراد السجلات التي تملك رقماً قومياً صالحاً فقط"
                    >
                      استيراد المكتمل فقط ({stats.total - stats.missingNidCount})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleConfirmImport(false)}
                    disabled={stats.selectedCount === 0 || isProcessing}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all"
                  >
                    <Check className="h-4 w-4" />
                    <span>{isProcessing ? 'جاري الاستيراد والتصنيف...' : `تأكيد وقبول استيراد (${stats.selectedCount}) عميل`}</span>
                  </button>
                </div>
              </div>

              {/* Warning Notice about Missing National IDs */}
              {stats.missingNidCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-orange-950 animate-in fade-in">
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold mb-0.5">
                      يوجد ({stats.missingNidCount}) عميل بدون رقم قومي أو بأرقام غير مكتملة
                    </h5>
                    <p className="text-orange-900 leading-relaxed text-[11px]">
                      النظام مهيأ لقبولهم فوراً برقم مرجعي مؤقت وإدخالهم في قاعدة البيانات، مع إمكانية تحديث بطاقاتهم لاحقاً بنقرة واحدة من صفحة العملاء. يمكنك مراجعتهم أو تعديلهم في الجدول أدناه قبل الاستيراد.
                    </p>
                  </div>
                </div>
              )}

              {/* Filter Tabs on Table */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-500 ml-1">عرض:</span>
                  <button
                    type="button"
                    onClick={() => setFilterMode('ALL')}
                    className={`px-3 py-1 rounded-xl transition-all ${filterMode === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    الكل ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('ELIGIBLE')}
                    className={`px-3 py-1 rounded-xl transition-all ${filterMode === 'ELIGIBLE' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'}`}
                  >
                    ✨ مؤهل للتجديد ({stats.eligibleCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('WARNINGS')}
                    className={`px-3 py-1 rounded-xl transition-all ${filterMode === 'WARNINGS' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-900 hover:bg-orange-200'}`}
                  >
                    ⚠️ بدون رقم قومي ({stats.missingNidCount})
                  </button>
                  {stats.delinquentCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('DELINQUENT')}
                      className={`px-3 py-1 rounded-xl transition-all ${filterMode === 'DELINQUENT' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-900 hover:bg-rose-200'}`}
                    >
                      ⛔ تعثر ومخاطر ({stats.delinquentCount})
                    </button>
                  )}
                  {stats.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('DUPLICATES')}
                      className={`px-3 py-1 rounded-xl transition-all ${filterMode === 'DUPLICATES' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-900 hover:bg-sky-200'}`}
                    >
                      🔄 مكرر بالقاعدة ({stats.duplicateCount})
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 font-bold">
                  يمكنك النقر على أي خلية لتعديلها مباشرة قبل الحفظ
                </span>
              </div>

              {/* Interactive Table with Inline Editing */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto shadow-inner">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 sticky top-0 font-bold z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={stats.selectedCount === stats.total && stats.total > 0}
                          onChange={e => handleSelectAll(e.target.checked)}
                          className="rounded text-cropsa-600 focus:ring-cropsa-500"
                        />
                      </th>
                      <th className="p-2.5">اسم العميل</th>
                      <th className="p-2.5">الرقم القومي</th>
                      <th className="p-2.5">الهاتف</th>
                      <th className="p-2.5">المحافظة</th>
                      <th className="p-2.5">الشركة الممولة</th>
                      <th className="p-2.5">المعتمد</th>
                      <th className="p-2.5">المنصرف</th>
                      <th className="p-2.5">تاريخ التمويل</th>
                      <th className="p-2.5">تحليل الحالة وتصنيف التجديد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRows.map((row) => (
                      <tr 
                        key={row.id} 
                        className={`transition-colors ${
                          !row.selected 
                            ? 'opacity-40 bg-slate-50' 
                            : row.isDelinquent 
                              ? 'bg-rose-50/50 hover:bg-rose-50' 
                              : row.hasMissingNationalId 
                                ? 'bg-orange-50/40 hover:bg-orange-50' 
                                : row.renewalClassification === 'ELIGIBLE' 
                                  ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                                  : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRowSelect(row.id)}
                            className="rounded text-cropsa-600 focus:ring-cropsa-500 cursor-pointer"
                          />
                        </td>

                        {/* Name (editable) */}
                        <td className="p-2.5 font-bold text-slate-900">
                          <input
                            type="text"
                            value={row.name}
                            onChange={e => handleUpdateRowCell(row.id, 'name', e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-bold w-full"
                          />
                        </td>

                        {/* National ID (editable) */}
                        <td className="p-2.5 font-mono">
                          {row.hasMissingNationalId ? (
                            <div className="space-y-0.5">
                              <input
                                type="text"
                                placeholder="أدخل الرقم القومي إن وجد..."
                                value={row.nationalId}
                                onChange={e => handleUpdateRowCell(row.id, 'nationalId', e.target.value)}
                                className="bg-orange-100/60 hover:bg-white focus:bg-white border border-orange-300 rounded px-1.5 py-0.5 text-[11px] text-orange-950 outline-none w-36 font-mono"
                              />
                              <span className="block text-[9px] text-orange-700 font-bold">مؤقت: {row.temporaryNationalId}</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={row.nationalId}
                              onChange={e => handleUpdateRowCell(row.id, 'nationalId', e.target.value)}
                              className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-mono text-[11px] w-32"
                            />
                          )}
                        </td>

                        {/* Phone */}
                        <td className="p-2.5 font-mono">
                          <input
                            type="text"
                            value={row.phoneNumber}
                            placeholder="الهاتف..."
                            onChange={e => handleUpdateRowCell(row.id, 'phoneNumber', e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-mono text-[11px] w-28"
                          />
                        </td>

                        {/* Governorate */}
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.governorate}
                            onChange={e => handleUpdateRowCell(row.id, 'governorate', e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none text-[11px] w-20"
                          />
                        </td>

                        {/* Company */}
                        <td className="p-2.5">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold text-[10px] block truncate max-w-[130px]" title={row.companyName}>
                            {row.companyName}
                          </span>
                        </td>

                        {/* Approved Amount (editable) */}
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          <input
                            type="text"
                            value={row.approvedAmount ? row.approvedAmount.toLocaleString() : '0'}
                            onChange={e => {
                              const val = parseSmartAmount(e.target.value);
                              handleUpdateRowCell(row.id, 'approvedAmount', val);
                            }}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-mono text-[11px] w-24 text-slate-900 font-bold"
                          />
                        </td>

                        {/* Disbursed Amount (editable) */}
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          <input
                            type="text"
                            value={row.disbursedAmount ? row.disbursedAmount.toLocaleString() : '0'}
                            onChange={e => {
                              const val = parseSmartAmount(e.target.value);
                              handleUpdateRowCell(row.id, 'disbursedAmount', val);
                            }}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-mono text-[11px] w-24 text-emerald-700 font-bold"
                          />
                        </td>

                        {/* Date */}
                        <td className="p-2.5 font-mono text-[10px] text-slate-500">
                          <input
                            type="text"
                            value={row.financeDate}
                            placeholder="YYYY-MM-DD"
                            onChange={e => handleUpdateRowCell(row.id, 'financeDate', e.target.value)}
                            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-cropsa-500 px-1 py-0.5 rounded outline-none font-mono text-[10px] w-24"
                          />
                        </td>

                        {/* Intelligence Status & Renewal Badge */}
                        <td className="p-2.5">
                          <div className="space-y-1">
                            {row.renewalClassification === 'ELIGIBLE' && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1 shadow-2xs">
                                <Sparkles className="h-3 w-3 text-amber-600" />
                                {row.renewalBadgeText}
                              </span>
                            )}
                            {row.renewalClassification === 'RECENT_ACTIVE' && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-600" />
                                {row.renewalBadgeText}
                              </span>
                            )}
                            {row.renewalClassification === 'DELINQUENT' && (
                              <span className="bg-rose-100 text-rose-900 border border-rose-300 font-black px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                {row.renewalBadgeText}
                              </span>
                            )}
                            {row.renewalClassification === 'NEEDS_DATA' && (
                              <span className="bg-orange-100 text-orange-900 border border-orange-300 font-bold px-2 py-0.5 rounded-lg text-[10px] inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-orange-600" />
                                بدون رقم قومي (مؤقت)
                              </span>
                            )}
                            {row.renewalClassification === 'NEW_CLIENT' && (
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-lg text-[10px] inline-block">
                                عميل جديد
                              </span>
                            )}

                            {/* Duplicate notification */}
                            {row.isDuplicateInDb && (
                              <span className="block text-[9px] text-sky-700 font-bold">
                                🔄 تحديث عميل مسجل
                              </span>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              يتم حفظ السجلات وتفعيل مسار التجديد والمتابعة اللحظية وتصنيف العملاء آلياً في قاعدة البيانات السحابية.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
