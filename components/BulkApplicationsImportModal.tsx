import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Building2, 
  Layers, 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Phone, 
  MapPin, 
  Search, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../context/Store';
import { ApplicationStatus, STATUS_ARABIC, Role } from '../types';
import { exportApplicationsToExcel, generateApplicationsSampleTemplate } from '../utils/applicationExcel';

interface ParsedAppRow {
  id: string;
  appId?: string;
  isUpdate: boolean;
  clientName: string;
  clientNationalId: string;
  phoneNumber: string;
  whatsappNumber: string;
  governorate: string;
  profession: string;
  requestedAmount: number;
  approvedAmount: number;
  durationMonths: number;
  companyId: string;
  companyName: string;
  programId: string;
  programName: string;
  status: ApplicationStatus;
  submittedAt: string; // YYYY-MM-DD
  lastStageDate: string; // YYYY-MM-DD
  description: string;
  isMissingNid: boolean;
  rejectionReason?: string;
  salesmanName?: string;
}

interface BulkApplicationsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkApplicationsImportModal: React.FC<BulkApplicationsImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    currentUser, 
    companies, 
    financingPrograms, 
    applications,
    bulkImportApplications, 
    addAuditLog 
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAppRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ count: number; updatedCount: number; errors: string[] } | null>(null);

  // Global Defaults for the entire batch
  const [globalCompanyId, setGlobalCompanyId] = useState<string>(companies[0]?.id || '');
  const globalCompanyPrograms = useMemo(() => {
    return (financingPrograms || []).filter(p => p.companyId === globalCompanyId && p.active !== false);
  }, [financingPrograms, globalCompanyId]);

  const [globalProgramId, setGlobalProgramId] = useState<string>('');
  const [globalStatus, setGlobalStatus] = useState<ApplicationStatus>(ApplicationStatus.APPROVED);
  const [globalSubmittedAt, setGlobalSubmittedAt] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // Default to 2 months ago
    return d.toISOString().split('T')[0];
  });
  const [globalLastStageDate, setGlobalLastStageDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });

  // When globalCompanyId changes, update globalProgramId default
  React.useEffect(() => {
    if (globalCompanyPrograms.length > 0) {
      setGlobalProgramId(globalCompanyPrograms[0].id);
    } else {
      setGlobalProgramId('');
    }
  }, [globalCompanyPrograms]);

  if (!isOpen) return null;

  // Smart Date Parser
  const parseSmartDateStr = (val: any, fallbackStr: string): string => {
    if (!val) return fallbackStr;
    if (typeof val === 'number' && val > 20000 && val < 60000) {
      try {
        const dateObj = new Date((val - 25569) * 86400 * 1000);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        // fallback
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const parts = str.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return fallbackStr;
  };

  // Smart Amount Parser
  const parseSmartAmount = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') {
      if (isNaN(val)) return 0;
      if (val > 0 && val <= 500) return val * 1000;
      return Math.round(val);
    }
    let str = String(val).trim();
    if (!str) return 0;
    const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    arabicDigits.forEach((d, i) => {
      str = str.replace(new RegExp(d, 'g'), String(i));
    });
    const isK = str.toLowerCase().includes('k') || str.includes('ألف') || str.includes('الف');
    str = str.replace(/[^\d.,]/g, '');
    if (/^\d{1,3}(\.\d{3})+$/.test(str) || /^\d+\.\d{3}$/.test(str)) {
      str = str.replace(/\./g, '');
    } else if (/^\d{1,3}(,\d{3})+$/.test(str) || /^\d+,\d{3}$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/,/g, '');
    }
    let num = parseFloat(str) || 0;
    if (isK) num *= 1000;
    if (num > 0 && num <= 500) num *= 1000;
    return Math.round(num);
  };

  // Smart Status Parser
  const parseSmartStatus = (val: any): ApplicationStatus => {
    if (!val) return ApplicationStatus.APPROVED;
    const clean = String(val).trim().toLowerCase();
    if (clean.includes('صرف') || clean.includes('تحويل') || clean.includes('transferred')) return ApplicationStatus.AMOUNT_TRANSFERRED;
    if (clean.includes('موافق') || clean.includes('معتمد') || clean.includes('approved')) return ApplicationStatus.APPROVED;
    if (clean.includes('رفض') || clean.includes('مرفوض') || clean.includes('rejected')) return ApplicationStatus.REJECTED;
    if (clean.includes('عقد') || clean.includes('توقيع') || clean.includes('contract')) return ApplicationStatus.CONTRACT_SIGNING;
    if (clean.includes('ميداني') || clean.includes('استعلام') || clean.includes('investigation') || clean.includes('field')) return ApplicationStatus.FIELD_INVESTIGATION;
    if (clean.includes('سكور') || clean.includes('iscore') || clean.includes('i-score')) return ApplicationStatus.ISCORE_CHECK;
    if (clean.includes('إضافية') || clean.includes('اضافيه') || clean.includes('additional')) return ApplicationStatus.ADDITIONAL_PAPERS;
    if (clean.includes('أوراق') || clean.includes('اوراق') || clean.includes('paper') || clean.includes('مراجعة')) return ApplicationStatus.PAPER_REVIEW;
    if (clean.includes('مستلم') || clean.includes('جديد') || clean.includes('received') || clean.includes('submitted')) return ApplicationStatus.RECEIVED;
    if (clean.includes('أدمن') || clean.includes('admin')) return ApplicationStatus.PENDING_ADMIN;
    return ApplicationStatus.APPROVED;
  };

  // Find matching company
  const matchCompany = (input: string): { id: string; name: string } => {
    if (!input || !input.trim()) {
      const def = companies.find(c => c.id === globalCompanyId) || companies[0];
      return { id: def?.id || 'comp_01', name: def?.name || 'شركة التقسيط' };
    }
    const clean = input.trim().toLowerCase();
    const found = companies.find(c => 
      c.name.toLowerCase().includes(clean) || 
      clean.includes(c.name.toLowerCase()) || 
      c.code.toLowerCase() === clean
    );
    if (found) return { id: found.id, name: found.name };
    const def = companies.find(c => c.id === globalCompanyId) || companies[0];
    return { id: def?.id || 'comp_01', name: def?.name || 'شركة التقسيط' };
  };

  // Find matching program for company
  const matchProgram = (companyId: string, programInput: string): { id: string; name: string } => {
    const compPrograms = (financingPrograms || []).filter(p => p.companyId === companyId);
    if (!programInput || !programInput.trim()) {
      if (compPrograms.length > 0) return { id: compPrograms[0].id, name: compPrograms[0].name };
      return { id: 'default_prg', name: 'البرنامج المباشر الافتراضي' };
    }
    const clean = programInput.trim().toLowerCase();
    const found = compPrograms.find(p => 
      p.name.toLowerCase().includes(clean) || 
      clean.includes(p.name.toLowerCase()) || 
      p.code?.toLowerCase() === clean
    );
    if (found) return { id: found.id, name: found.name };
    if (compPrograms.length > 0) return { id: compPrograms[0].id, name: compPrograms[0].name };
    return { id: 'default_prg', name: programInput.trim() };
  };

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          alert('الملف المرفوع فارغ ولا يحتوي على صفوف بيانات.');
          return;
        }

        const rows: ParsedAppRow[] = [];

        rawJson.forEach((row, idx) => {
          // Normalize column names
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.trim().toLowerCase()
              .replace(/[\s\-_()]/g, '')
              .replace(/أ|إ|آ/g, 'ا')
              .replace(/ة/g, 'ه');
            normalized[cleanKey] = row[k];
          });

          // Detect Application ID (for updating existing cases)
          const rawAppId = String(
            normalized['رقمالطلبid'] || normalized['رقمالطلب'] || normalized['كودالطلب'] || 
            normalized['رقمالحاله'] || normalized['id'] || normalized['appid'] || 
            normalized['applicationid'] || ''
          ).trim();

          const existingApp = rawAppId ? applications.find(a => a.id === rawAppId) : undefined;
          const isUpdate = Boolean(existingApp);
          const appId = rawAppId || undefined;

          const clientName = String(
            normalized['اسمالعميل'] || normalized['العميل'] || normalized['الاسم'] || 
            normalized['clientname'] || normalized['name'] || existingApp?.clientName || ''
          ).trim();

          if (!clientName) return; // Skip empty name rows

          const rawNid = String(
            normalized['الرقمالقومي'] || normalized['القومي'] || normalized['بطاقه'] || 
            normalized['nationalid'] || normalized['nid'] || existingApp?.clientNationalId || ''
          ).replace(/\D/g, '');

          const isMissingNid = !rawNid || rawNid.length !== 14;
          const finalNid = isMissingNid ? '' : rawNid;

          const phone = String(
            normalized['رقمموبايل'] || normalized['الهاتف'] || normalized['الموبايل'] || 
            normalized['تليفون'] || normalized['phone'] || normalized['mobile'] || 
            normalized['رقمPhone'] || existingApp?.phoneNumber || ''
          ).trim();

          const whatsapp = String(
            normalized['الواتساب'] || normalized['واتساب'] || normalized['whatsapp'] || 
            normalized['رقمwhatsapp'] || existingApp?.whatsappNumber || phone
          ).trim();

          const gov = String(
            normalized['المحافظه'] || normalized['محافظه'] || normalized['governorate'] || 
            existingApp?.governorate || 'القاهرة'
          ).trim();

          const profession = String(
            normalized['المهنه'] || normalized['الوظيفه'] || normalized['النشاط'] || 
            normalized['profession'] || existingApp?.profession || 'تاجر'
          ).trim();

          const description = String(
            normalized['ملاحظات'] || normalized['وصف'] || normalized['ملاحظاتوتفاصيل'] || 
            normalized['notes'] || normalized['description'] || existingApp?.description || 'طلب تقسيط مستورد عبر شيت إكسيل'
          ).trim();

          const rejectionReason = String(
            normalized['سببالرفض'] || normalized['سببالرفضانوcolumn'] || normalized['سببالرفضانوجد'] || 
            normalized['rejectionreason'] || existingApp?.rejectionReason || ''
          ).trim();

          const salesmanName = String(
            normalized['اسمالمندوب'] || normalized['المندوب'] || normalized['المبيعات'] || 
            normalized['salesman'] || normalized['salesmanname'] || existingApp?.salesmanName || ''
          ).trim();

          const requestedAmount = parseSmartAmount(
            normalized['المبلغالمطلوبجنيه'] || normalized['المبلغالمطلوب'] || normalized['مبلغالطلب'] || 
            normalized['المطلوب'] || normalized['requestedamount'] || normalized['amount'] || 
            existingApp?.requestedAmount || 50000
          );

          // Status matching
          const statusRaw = String(
            normalized['حالهالطلب'] || normalized['الحاله'] || normalized['المرحله'] || 
            normalized['status'] || normalized['stage'] || ''
          );
          const status = statusRaw ? parseSmartStatus(statusRaw) : (existingApp?.status || ApplicationStatus.APPROVED);

          const isApprovedStatus = status === ApplicationStatus.APPROVED || 
                                   status === ApplicationStatus.CONTRACT_SIGNING || 
                                   status === ApplicationStatus.AMOUNT_TRANSFERRED;

          const rawApprovedStr = normalized['المبلغالمعتمدجنيه'] || normalized['المبلغالمعتمد'] || 
                                normalized['المعتمد'] || normalized['مبلغالتمويل'] || normalized['approvedamount'];
          
          const approvedAmount = rawApprovedStr 
            ? parseSmartAmount(rawApprovedStr) 
            : (existingApp?.approvedAmount !== undefined ? existingApp.approvedAmount : (isApprovedStatus ? requestedAmount : 0));

          let durationMonths = parseInt(String(
            normalized['مدهالتقسيطشهور'] || normalized['المده'] || normalized['مدهالتقسيط'] || 
            normalized['الشهور'] || normalized['duration'] || normalized['months'] || 
            existingApp?.durationMonths || ''
          ));

          if (!durationMonths || isNaN(durationMonths)) {
            const durationMatch = description.match(/(?:على|خلال|لمدة|مدة)\s*(\d+)\s*(?:شهر|شهور|أشهر|months?)/i) || 
                                  description.match(/(\d+)\s*(?:شهر|شهور|أشهر)/i);
            if (durationMatch) {
              durationMonths = parseInt(durationMatch[1], 10);
            } else {
              durationMonths = existingApp?.durationMonths || 12;
            }
          }

          // Company matching
          const companyRaw = String(
            normalized['شركهالتمويل'] || normalized['الشركه'] || normalized['البنك'] || 
            normalized['اسمبانك'] || normalized['company'] || normalized['bank'] || 
            existingApp?.companyName || ''
          ).trim();
          const matchedComp = matchCompany(companyRaw);

          // Program matching
          const programRaw = String(
            normalized['البرنامجالتمويلي'] || normalized['البرنامج'] || normalized['نوعالبرنامج'] || 
            normalized['program'] || existingApp?.selectedProgramName || ''
          ).trim();
          const matchedProg = matchProgram(matchedComp.id, programRaw);

          // Submitted date (دخل من امتي)
          const submittedRaw = normalized['تاريخالتقديم'] || normalized['تاريخالدخول'] || 
                              normalized['تاريخالطلب'] || normalized['submittedat'] || normalized['date'] || 
                              existingApp?.submittedAt;
          const submittedAt = parseSmartDateStr(submittedRaw, globalSubmittedAt);

          // Last stage date (واخر مرحلة كانت يوم كام)
          const lastStageRaw = normalized['تاريخاخرمرحله'] || normalized['تاريخالتحديث'] || 
                              normalized['تاريخالموافقه'] || normalized['laststagedate'] || normalized['updatedat'] || 
                              existingApp?.lastStageDate;
          const lastStageDate = parseSmartDateStr(lastStageRaw, globalLastStageDate);

          rows.push({
            id: `row_${Date.now()}_${idx}`,
            appId,
            isUpdate,
            clientName,
            clientNationalId: finalNid,
            phoneNumber: phone,
            whatsappNumber: whatsapp,
            governorate: gov,
            profession,
            requestedAmount,
            approvedAmount,
            durationMonths,
            companyId: matchedComp.id,
            companyName: matchedComp.name,
            programId: matchedProg.id,
            programName: matchedProg.name,
            status,
            submittedAt,
            lastStageDate,
            description,
            isMissingNid,
            rejectionReason: rejectionReason || existingApp?.rejectionReason,
            salesmanName: salesmanName || existingApp?.salesmanName
          });
        });

        setParsedRows(rows);
        setImportSummary(null);
      } catch (err) {
        console.error('Failed to parse excel file:', err);
        alert('حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من سلامة تنسيق الملف.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Download Sample Excel Template & Reference Guide
  const handleDownloadTemplate = () => {
    generateApplicationsSampleTemplate(companies, financingPrograms);
  };

  // Export current live applications to Excel
  const handleExportCurrentApplications = () => {
    exportApplicationsToExcel(applications, 'كافة_حالات_التقسيط_الحالية');
  };

  // Apply Global Defaults to All Rows
  const handleApplyGlobalToAll = () => {
    if (parsedRows.length === 0) return;
    const targetComp = companies.find(c => c.id === globalCompanyId);
    const targetProg = globalCompanyPrograms.find(p => p.id === globalProgramId) || globalCompanyPrograms[0];

    setParsedRows(prev => prev.map(row => ({
      ...row,
      companyId: globalCompanyId,
      companyName: targetComp?.name || row.companyName,
      programId: targetProg?.id || row.programId,
      programName: targetProg?.name || row.programName,
      status: globalStatus,
      submittedAt: globalSubmittedAt,
      lastStageDate: globalLastStageDate
    })));
  };

  // Update a single row field
  const handleUpdateRow = (rowId: string, field: keyof ParsedAppRow, value: any) => {
    setParsedRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      if (field === 'companyId') {
        const comp = companies.find(c => c.id === value);
        const compProgs = (financingPrograms || []).filter(p => p.companyId === value && p.active !== false);
        return {
          ...r,
          companyId: value,
          companyName: comp?.name || r.companyName,
          programId: compProgs[0]?.id || '',
          programName: compProgs[0]?.name || 'البرنامج المباشر'
        };
      }
      if (field === 'programId') {
        const prog = (financingPrograms || []).find(p => p.id === value);
        return {
          ...r,
          programId: value,
          programName: prog?.name || r.programName
        };
      }
      return { ...r, [field]: value };
    }));
  };

  // Remove a single row
  const handleDeleteRow = (rowId: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Execute Bulk Save into Database
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setImportSummary(null);

    try {
      const items = parsedRows.map(row => {
        const prog = (financingPrograms || []).find(p => p.id === row.programId);
        return {
          client: {
            name: row.clientName,
            nationalId: row.clientNationalId || undefined,
            phoneNumber: row.phoneNumber,
            governorate: row.governorate,
            profession: row.profession as any
          },
          application: {
            id: row.appId,
            clientName: row.clientName,
            clientNationalId: row.clientNationalId || undefined,
            phoneNumber: row.phoneNumber,
            whatsappNumber: row.whatsappNumber,
            governorate: row.governorate,
            profession: row.profession as any,
            requestedAmount: row.requestedAmount,
            approvedAmount: row.approvedAmount,
            durationMonths: row.durationMonths,
            status: row.status,
            submittedAt: row.submittedAt ? `${row.submittedAt}T10:00:00.000Z` : new Date().toISOString(),
            lastStageDate: row.lastStageDate ? `${row.lastStageDate}T12:00:00.000Z` : new Date().toISOString(),
            companyId: row.companyId,
            companyName: row.companyName,
            assignedCompanyIds: [row.companyId],
            selectedProgramId: row.programId,
            selectedProgramName: row.programName,
            programInterestRate: prog?.interestRate || 0,
            programAdminFeePercent: prog?.adminFeePercent || 2.5,
            salesmanName: row.salesmanName,
            rejectionReason: row.rejectionReason,
            description: row.description
          }
        };
      });

      const res = await bulkImportApplications(items);
      setImportSummary({ count: res.importedCount, updatedCount: res.updatedCount, errors: res.errors });

      if (res.importedCount > 0 || res.updatedCount > 0) {
        setParsedRows([]);
      }
    } catch (err) {
      console.error('Failed to execute bulk import of applications:', err);
      alert('حدث خطأ أثناء حفظ طلبات التقسيط المجمعة.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return parsedRows;
    const term = searchTerm.toLowerCase();
    return parsedRows.filter(r => 
      r.clientName.toLowerCase().includes(term) ||
      r.clientNationalId.includes(term) ||
      r.phoneNumber.includes(term) ||
      r.companyName.toLowerCase().includes(term) ||
      r.programName.toLowerCase().includes(term) ||
      (r.appId && r.appId.toLowerCase().includes(term))
    );
  }, [parsedRows, searchTerm]);

  // Totals
  const totalRequested = useMemo(() => parsedRows.reduce((sum, r) => sum + (Number(r.requestedAmount) || 0), 0), [parsedRows]);
  const totalApproved = useMemo(() => parsedRows.reduce((sum, r) => sum + (Number(r.approvedAmount) || 0), 0), [parsedRows]);
  const updateCasesCount = useMemo(() => parsedRows.filter(r => r.isUpdate).length, [parsedRows]);
  const newCasesCount = useMemo(() => parsedRows.filter(r => !r.isUpdate).length, [parsedRows]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-lg">
                  استيراد وتحديث طلبات التقسيط مجمعة (شيت إكسيل)
                </h3>
                <span className="text-[10px] font-bold bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-full border border-sky-200">
                  إضافة طلبات جديدة + تحديث الحالات القائمة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك تحميل ملف الحالات الحالي وتعديله ثم إعادة رفعه، أو تحميل النموذج الاسترشادي لإضافة طلبات جديدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCurrentApplications}
              className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="تحميل شيت إكسيل يحتوي على كافة الحالات المسجلة حالياً لتعديلها وإعادة رفعها"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>تحميل الحالات الحالية (Excel)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="تحميل شيت نموذج استرشادي فارغ مع أمثلة ودليل تفصيلي"
            >
              <FileSpreadsheet className="h-4 w-4 text-sky-600" />
              <span>النموذج الاسترشادي والدليل (.xlsx)</span>
            </button>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          
          {/* Success Summary Toast */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h4 className="font-bold text-emerald-950 text-sm">
                  تمت معالجة وحفظ البيانات بنجاح في المنظومة وقاعدة البيانات السحابية!
                </h4>
                <div className="flex items-center gap-3 text-emerald-800 text-xs flex-wrap font-medium pt-0.5">
                  {importSummary.count > 0 && (
                    <span className="bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-emerald-950">
                      ➕ طلبات جديدة أُضيفت: <strong className="font-black">{importSummary.count}</strong>
                    </span>
                  )}
                  {importSummary.updatedCount > 0 && (
                    <span className="bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300 font-bold text-amber-950">
                      🔄 حالات قائمة تم تحديثها: <strong className="font-black">{importSummary.updatedCount}</strong>
                    </span>
                  )}
                </div>
                <p className="text-emerald-800 text-xs pt-0.5">
                  تم توثيق التحديثات والتواريخ والمبالغ في سجل العمليات السحابي، وستظهر فوراً في جدول الحالات.
                </p>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2 text-rose-700 text-[11px] space-y-0.5">
                    {importSummary.errors.map((err, eIdx) => (
                      <p key={eIdx}>⚠️ {err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Dropzone / Button if empty */}
          {parsedRows.length === 0 && !importSummary && (
            <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-3xl p-8 sm:p-12 text-center bg-slate-50/50 hover:bg-sky-50/20 transition-all flex flex-col items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="h-16 w-16 rounded-3xl bg-sky-100/70 text-sky-700 flex items-center justify-center shadow-xs">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base">
                  اختر أو اسحب ملف شيت طلبات التقسيط (Excel / CSV)
                </h4>
                <p className="text-slate-500 text-xs mt-1 max-w-lg mx-auto">
                  يدعم صيغ Excel (.xlsx, .xls) و CSV. إذا كان الملف يحتوي على عمود (رقم الطلب) فسيتم تحديث الحالات القائمة مباشرة، وإذا كان العمود فارغاً فسيتم تسجيل طلبات جديدة بالمنظومة.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2 transition-colors text-xs cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>رفع ملف الإكسيل الآن</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCurrentApplications}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold transition-colors text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="تحميل جميع الحالات الحالية للتعديل"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>تحميل الحالات الحالية للتعديل (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-sky-600" />
                  <span>تحميل النموذج الاسترشادي والدليل</span>
                </button>
              </div>
            </div>
          )}

          {/* Loaded Rows Configuration Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* Batch Configuration Header (التعيين الموحد للدفعة) */}
              <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600" />
                    <span className="font-black text-sky-950 text-xs">
                      إعدادات التعيين الموحد للدفعة (تطبيق سريع على كل الأسطر المستوردة):
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyGlobalToAll}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>تطبيق هذه الإعدادات على جميع الأسطر</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Target Company / Bank */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-sky-600" />
                      <span>الشركة / البنك الممول:</span>
                    </label>
                    <select
                      value={globalCompanyId}
                      onChange={e => setGlobalCompanyId(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Financing Program */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-sky-600" />
                      <span>البرنامج التمويلي:</span>
                    </label>
                    <select
                      value={globalProgramId}
                      onChange={e => setGlobalProgramId(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    >
                      {globalCompanyPrograms.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.interestRate || 0}% فائدة)
                        </option>
                      ))}
                      {globalCompanyPrograms.length === 0 && (
                        <option value="">برنامج مباشر افتراضي للشركة</option>
                      )}
                    </select>
                  </div>

                  {/* Initial Stage / Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sky-600" />
                      <span>مرحلة الطلب الحالية:</span>
                    </label>
                    <select
                      value={globalStatus}
                      onChange={e => setGlobalStatus(e.target.value as ApplicationStatus)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    >
                      <option value={ApplicationStatus.APPROVED}>طلب معتمد (Approved)</option>
                      <option value={ApplicationStatus.AMOUNT_TRANSFERRED}>تم تحويل المبلغ (Transferred)</option>
                      <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع عقود (Contract Signing)</option>
                      <option value={ApplicationStatus.FIELD_INVESTIGATION}>الاستعلام الميداني (Investigation)</option>
                      <option value={ApplicationStatus.ISCORE_CHECK}>استعلام I-Score</option>
                      <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة الأوراق (Paper Review)</option>
                      <option value={ApplicationStatus.RECEIVED}>طلب مستلم جديد</option>
                      <option value={ApplicationStatus.REJECTED}>مرفوض (Rejected)</option>
                    </select>
                  </div>

                  {/* Submitted Date (دخل من امتي) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-sky-600" />
                      <span>تاريخ دخول الطلب:</span>
                    </label>
                    <input
                      type="date"
                      value={globalSubmittedAt}
                      onChange={e => setGlobalSubmittedAt(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Last Stage Date (يوم كام كانت آخر مرحلة) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>تاريخ آخر مرحلة:</span>
                    </label>
                    <input
                      type="date"
                      value={globalLastStageDate}
                      onChange={e => setGlobalLastStageDate(e.target.value)}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Bar & Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-700 text-xs">
                    إجمالي الصفوف: <strong className="text-slate-950 font-black">{parsedRows.length}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                    🔄 حالات للتحديث: <strong>{updateCasesCount}</strong>
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    ✨ طلبات جديدة: <strong>{newCasesCount}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-slate-700 text-xs">
                    إجمالي المطلوب: <strong className="text-sky-700 font-mono font-black">{totalRequested.toLocaleString()} ج.م</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-slate-700 text-xs">
                    إجمالي المعتمد: <strong className="text-emerald-700 font-mono font-black">{totalApproved.toLocaleString()} ج.م</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث في الطلبات المستوردة..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تريد إلغاء وإفراغ هذه القائمة وإعادة الرفع من جديد؟')) {
                        setParsedRows([]);
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="إفراغ القائمة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Table of Parsed Applications */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96">
                <table className="w-full text-right text-[11px] whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="p-2.5 text-center">#</th>
                      <th className="p-2.5 text-center">العملية</th>
                      <th className="p-2.5">العميل</th>
                      <th className="p-2.5">الرقم القومي</th>
                      <th className="p-2.5">الهاتف</th>
                      <th className="p-2.5">المحافظة</th>
                      <th className="p-2.5">المبلغ المطلوب</th>
                      <th className="p-2.5">المبلغ المعتمد</th>
                      <th className="p-2.5">الشركة / البنك</th>
                      <th className="p-2.5">البرنامج التمويلي</th>
                      <th className="p-2.5">مرحلة الطلب</th>
                      <th className="p-2.5">تاريخ الدخول</th>
                      <th className="p-2.5">تاريخ آخر مرحلة</th>
                      <th className="p-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row, idx) => {
                      const rowCompPrograms = (financingPrograms || []).filter(p => p.companyId === row.companyId && p.active !== false);

                      return (
                        <tr key={row.id} className={`transition-colors ${row.isUpdate ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-sky-50/40'}`}>
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          
                          {/* Operation type badge */}
                          <td className="p-2 text-center">
                            {row.isUpdate ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg font-black text-[10px]" title={`سيتم تحديث الطلب القائم رقم: ${row.appId}`}>
                                <RefreshCw className="h-2.5 w-2.5 text-amber-700 animate-spin" />
                                <span>تحديث</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg font-black text-[10px]">
                                <span>جديد +</span>
                              </span>
                            )}
                          </td>

                          {/* Client Name */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.clientName}
                              onChange={e => handleUpdateRow(row.id, 'clientName', e.target.value)}
                              className="w-36 p-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:border-sky-500"
                            />
                          </td>

                          {/* National ID */}
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="مؤقت / غير متوفر"
                                value={row.clientNationalId}
                                onChange={e => handleUpdateRow(row.id, 'clientNationalId', e.target.value)}
                                className={`w-32 p-1.5 text-xs font-mono rounded-lg border ${
                                  !row.clientNationalId ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200'
                                }`}
                              />
                              {!row.clientNationalId && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">مؤقت</span>
                              )}
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.phoneNumber}
                              onChange={e => handleUpdateRow(row.id, 'phoneNumber', e.target.value)}
                              className="w-28 p-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                            />
                          </td>

                          {/* Governorate */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.governorate}
                              onChange={e => handleUpdateRow(row.id, 'governorate', e.target.value)}
                              className="w-20 p-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                            />
                          </td>

                          {/* Requested Amount */}
                          <td className="p-2">
                            <input
                              type="number"
                              value={row.requestedAmount}
                              onChange={e => handleUpdateRow(row.id, 'requestedAmount', Number(e.target.value))}
                              className="w-24 p-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                            />
                          </td>

                          {/* Approved Amount */}
                          <td className="p-2">
                            <input
                              type="number"
                              value={row.approvedAmount}
                              onChange={e => handleUpdateRow(row.id, 'approvedAmount', Number(e.target.value))}
                              className="w-24 p-1.5 text-xs font-mono font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg"
                            />
                          </td>

                          {/* Target Company */}
                          <td className="p-2">
                            <select
                              value={row.companyId}
                              onChange={e => handleUpdateRow(row.id, 'companyId', e.target.value)}
                              className="w-36 p-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:border-sky-500"
                            >
                              {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Financing Program */}
                          <td className="p-2">
                            <select
                              value={row.programId}
                              onChange={e => handleUpdateRow(row.id, 'programId', e.target.value)}
                              className="w-40 p-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:border-sky-500"
                            >
                              {rowCompPrograms.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                              {rowCompPrograms.length === 0 && (
                                <option value="">برنامج مباشر افتراضي</option>
                              )}
                            </select>
                          </td>

                          {/* Status / Stage */}
                          <td className="p-2">
                            <select
                              value={row.status}
                              onChange={e => handleUpdateRow(row.id, 'status', e.target.value as ApplicationStatus)}
                              className="w-36 p-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg"
                            >
                              <option value={ApplicationStatus.APPROVED}>طلب معتمد (Approved)</option>
                              <option value={ApplicationStatus.AMOUNT_TRANSFERRED}>تم تحويل المبلغ (Transferred)</option>
                              <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع عقود (Contract)</option>
                              <option value={ApplicationStatus.FIELD_INVESTIGATION}>الاستعلام الميداني</option>
                              <option value={ApplicationStatus.ISCORE_CHECK}>استعلام I-Score</option>
                              <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة الأوراق</option>
                              <option value={ApplicationStatus.RECEIVED}>طلب مستلم جديد</option>
                              <option value={ApplicationStatus.REJECTED}>مرفوض (Rejected)</option>
                            </select>
                          </td>

                          {/* Submitted At (دخل من امتي) */}
                          <td className="p-2">
                            <input
                              type="date"
                              value={row.submittedAt}
                              onChange={e => handleUpdateRow(row.id, 'submittedAt', e.target.value)}
                              className="p-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                            />
                          </td>

                          {/* Last Stage Date (واخر مرحلة كانت يوم كام) */}
                          <td className="p-2">
                            <input
                              type="date"
                              value={row.lastStageDate}
                              onChange={e => handleUpdateRow(row.id, 'lastStageDate', e.target.value)}
                              className="p-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                            />
                          </td>

                          {/* Actions */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف هذا الصف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            {parsedRows.length > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {isProcessing 
                    ? 'جاري حفظ ومزامنة البيانات سحابياً...' 
                    : `تأكيد وحفظ (${parsedRows.length}) سجل [${newCasesCount} جديد + ${updateCasesCount} تحديث]`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

