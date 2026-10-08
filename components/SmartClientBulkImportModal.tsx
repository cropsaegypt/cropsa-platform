import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, Client, Application, ApplicationStatus, ALL_KNOWN_INSTALLMENT_COMPANIES, EGYPT_GOVERNORATES } from '../types';
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
  AlertTriangle
} from 'lucide-react';

interface SmartClientBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedClientRow {
  index: number;
  name: string;
  nationalId: string;
  phoneNumber: string;
  governorate: string;
  profession: string;
  companyName: string;
  companyCode: string;
  approvedAmount: number;
  disbursedAmount: number;
  financeDate: string;
  notes: string;
  isValid: boolean;
  errors: string[];
  isDuplicateInDb: boolean;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  if (!isOpen) return null;

  // Only Super Admin can access bulk import
  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">صلاحية غير مصرح بها</h3>
          <p className="text-xs text-slate-500">
            خاصية الاستيراد المجمع لعملاء قاعدة بيانات كروبسا متاحة حصرياً لمدير النظام العام (Super Admin).
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  // Sample CSV format with UTF-8 BOM
  const sampleCsvContent = `اسم العميل,الرقم القومي,رقم الهاتف,المحافظة,المهنة,الشركة الممولة,المبلغ المعتمد,المبلغ المنصرف,تاريخ أو شهر التمويل,ملاحظات
عادل عبد الحميد النمر,28405101600123,01019283746,القاهرة,تاجر,شركة أمان لتمويل المشروعات,95000,95000,2025-10-15,عميل منتظم بالسداد ويرغب بالتجديد
فتحي رضوان الدسوقي,27911041200987,01128374659,البحيرة,مزارع,شركة فرصة للتمويل الزراعي,60000,60000,2025-09-20,حيازة زراعية ومحاصيل قمح
شريف ماهر القاضي,28802150100456,01229384756,الجيزة,تاجر,شركة كونتكت للتمويل الاستهلاكي,120000,100000,2025-08-10,سجل تاريخي من شركة كونتكت
سعيد عطية المنشاوي,27503191800234,01558473625,الدقهلية,مزارع,شركة سهولة لخدمات التقسيط,45000,45000,2025-11-05,سلفة محصولية مسددة بالكامل
محمود طلعت الخولي,29007121400678,01098473625,الشرقية,تاجر,إم إن تي حالا للتمويل,70000,70000,2025-07-28,عميل قديم لدى حالا معفى من الاستعلام`;

  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + sampleCsvContent;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'crobsa_clients_template_with_companies.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parser helper
  const parseRawText = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Check if first line is header
    const firstLine = lines[0];
    const hasHeader = firstLine.includes('الرقم') || firstLine.includes('اسم') || firstLine.includes('القومي') || firstLine.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: ParsedClientRow[] = [];

    dataLines.forEach((line, idx) => {
      // Split by comma or tab
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      const clean = cols.map(c => c.trim().replace(/^["']|["']$/g, ''));

      const name = clean[0] || '';
      const nationalId = clean[1] ? clean[1].replace(/\D/g, '') : '';
      const phoneNumber = clean[2] ? clean[2].replace(/\s+/g, '') : '';
      const governorate = clean[3] || 'القاهرة';
      const profession = clean[4] || 'تاجر';
      const companyInput = clean[5] || 'شركة أمان لتمويل المشروعات';
      const approvedAmount = clean[6] ? Number(clean[6].replace(/[^\d.]/g, '')) || 0 : 0;
      const disbursedAmount = clean[7] ? Number(clean[7].replace(/[^\d.]/g, '')) || approvedAmount : approvedAmount;
      const financeDate = clean[8] || new Date().toISOString().split('T')[0];
      const notes = clean[9] || 'مستورد مجمعاً عبر شيت قاعدة بيانات كروبسا';

      // Match company code
      let matchedCode = 'comp_01';
      const foundComp = ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => 
        c.nameAr.includes(companyInput) || 
        companyInput.includes(c.code) || 
        companyInput.includes(c.nameEn) || 
        c.code.toLowerCase() === companyInput.toLowerCase()
      );
      if (foundComp) {
        matchedCode = foundComp.code;
      }

      // Validations
      const errors: string[] = [];
      if (!name) errors.push('اسم العميل مطلوب');
      if (!nationalId || nationalId.length !== 14) {
        errors.push(`الرقم القومي غير صالح (${nationalId.length} رقم بدلاً من 14)`);
      }
      if (phoneNumber && phoneNumber.length < 10) {
        errors.push('رقم الهاتف قصير جداً');
      }

      const isDuplicateInDb = clients.some(c => c.nationalId === nationalId);

      rows.push({
        index: idx + 1,
        name,
        nationalId,
        phoneNumber,
        governorate,
        profession,
        companyName: companyInput,
        companyCode: matchedCode,
        approvedAmount,
        disbursedAmount,
        financeDate,
        notes,
        isValid: errors.length === 0,
        errors,
        isDuplicateInDb
      });
    });

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseRawText(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setResultMessage({ type: 'ERROR', text: 'لا توجد صفوف صالحة ومستوفية للشروط للاستيراد' });
      return;
    }

    setIsProcessing(true);
    setResultMessage(null);

    const clientsPayload: Partial<Client>[] = validRows.map(r => ({
      name: r.name,
      nationalId: r.nationalId,
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

    const appsPayload: Partial<Application>[] = validRows.map(r => ({
      clientName: r.name,
      clientNationalId: r.nationalId,
      phoneNumber: r.phoneNumber,
      governorate: r.governorate,
      profession: r.profession as any,
      requestedAmount: r.approvedAmount,
      approvedAmount: r.approvedAmount,
      usedAmount: r.disbursedAmount,
      status: ApplicationStatus.APPROVED,
      submittedAt: r.financeDate ? `${r.financeDate}T10:00:00.000Z` : new Date().toISOString(),
      reviewedAt: r.financeDate ? `${r.financeDate}T12:00:00.000Z` : new Date().toISOString(),
      assignedCompanyIds: [r.companyCode],
      description: `عملية تمويل مستوردة لشركة (${r.companyName}) - مبلغ منصرف: ${r.disbursedAmount.toLocaleString()} ج.م`
    }));

    try {
      const result = await bulkImportClients(clientsPayload, appsPayload);
      setIsProcessing(false);
      if (result.importedCount > 0) {
        setResultMessage({
          type: 'SUCCESS',
          text: `تم استيراد ${result.importedCount} عميل بنجاح ودمجهم في قاعدة بيانات كروبسا الذكية!`
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1400);
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

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicateInDb).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-cropsa-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cropsa-800/80 border border-cropsa-700 flex items-center justify-center text-sky-400 font-bold">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  استيراد وإضافة مجمعة لعملاء كروبسا عبر الشيت
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  خاص بمدير النظام
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                تفريغ واستيراد سجلات العملاء والشركات السابقة (المفعلة والقديمة) مباشرة في قاعدة البيانات
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
            رفع ملف CSV / Excel
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
            لصق نصوص الشيت مباشرة
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
            النموذج الاسترشادي وقائمة شركات التقسيط ({ALL_KNOWN_INSTALLMENT_COMPANIES.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {resultMessage && (
            <div className={`p-4 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
              resultMessage.type === 'SUCCESS' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {resultMessage.type === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-cropsa-500 rounded-3xl p-8 text-center bg-slate-50/60 transition-all">
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">اختر ملف CSV من جهازك</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                  يدعم الملفات المصدرة من Excel بامتداد (.csv) مع الحفاظ على ترميز UTF-8 للغة العربية.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <label className="bg-cropsa-700 hover:bg-cropsa-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-sm transition-colors flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    استعراض الملف
                    <input 
                      type="file" 
                      accept=".csv,.txt" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="h-4 w-4 text-slate-500" />
                    تحميل النموذج الاسترشادي
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">انسخ الصفوف من برنامج Excel والصقها هنا:</label>
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
                rows={6}
                placeholder="الصق بيانات الشيت هنا (الأعمدة: اسم العميل، الرقم القومي، الهاتف، المحافظة، المهنة، الشركة، المعتمد، المنصرف، التاريخ)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Guidance Box */}
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-950 text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-sky-600" />
                    ترتيب أعمدة الشيت وقواعد الإدخال
                  </h4>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> تحميل ملف النموذج (.csv)
                  </button>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  يجب أن يحتوي الشيت على الأعمدة التالية بالترتيب:
                  <strong className="mx-1">1. اسم العميل</strong> |
                  <strong className="mx-1">2. الرقم القومي (14 رقماً)</strong> |
                  <strong className="mx-1">3. الهاتف</strong> |
                  <strong className="mx-1">4. المحافظة</strong> |
                  <strong className="mx-1">5. المهنة</strong> |
                  <strong className="mx-1">6. الشركة الممولة</strong> |
                  <strong className="mx-1">7. المبلغ المعتمد</strong> |
                  <strong className="mx-1">8. المبلغ المنصرف</strong> |
                  <strong className="mx-1">9. تاريخ الصرف (YYYY-MM-DD أو YYYY-MM)</strong> |
                  <strong className="mx-1">10. ملاحظات</strong>
                </p>
              </div>

              {/* Companies Dictionary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    قائمة شركات التقسيط المعتمدة والمعترف بها (المفعلة والقديمة)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    يمكنك كتابة أي من هذه الأسماء في الشيت
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_KNOWN_INSTALLMENT_COMPANIES.map(company => (
                    <div 
                      key={company.code}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        company.isPlatformActive 
                          ? 'bg-emerald-50/50 border-emerald-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          {company.nameAr}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          company.isPlatformActive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {company.isPlatformActive ? 'نشطة بالمنصة' : 'شركة سابقة'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">الكود: {company.code}</p>
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">{company.typicalPrograms}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation & Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">
                    تم استخراج {parsedRows.length} صف
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    {validCount} صالح للاستيراد
                  </span>
                  {errorCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                      {errorCount} به أخطاء
                    </span>
                  )}
                  {duplicateCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                      {duplicateCount} مسجل مسبقاً (سيتم تحديثه)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validCount === 0 || isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {isProcessing ? 'جاري الاستيراد...' : `تأكيد استيراد (${validCount}) عميل`}
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">اسم العميل</th>
                      <th className="p-2.5">الرقم القومي</th>
                      <th className="p-2.5">الهاتف</th>
                      <th className="p-2.5">المحافظة</th>
                      <th className="p-2.5">الشركة الممولة</th>
                      <th className="p-2.5">المعتمد</th>
                      <th className="p-2.5">المنصرف</th>
                      <th className="p-2.5">تاريخ الصرف</th>
                      <th className="p-2.5">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr 
                        key={row.index} 
                        className={`transition-colors ${
                          !row.isValid 
                            ? 'bg-rose-50/50' 
                            : row.isDuplicateInDb 
                              ? 'bg-amber-50/40 hover:bg-amber-50' 
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 font-mono text-slate-400">{row.index}</td>
                        <td className="p-2.5 font-bold text-slate-900">{row.name}</td>
                        <td className="p-2.5 font-mono">{row.nationalId}</td>
                        <td className="p-2.5 font-mono">{row.phoneNumber || '-'}</td>
                        <td className="p-2.5">{row.governorate}</td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            {row.companyName}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          {row.approvedAmount.toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">
                          {row.disbursedAmount.toLocaleString()} ج.م
                        </td>
                        <td className="p-2.5 font-mono text-[10px]">{row.financeDate}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            row.isDuplicateInDb ? (
                              <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                                تحديث بيانات
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                                عميل جديد
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded" title={row.errors.join(', ')}>
                              {row.errors[0]}
                            </span>
                          )}
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>يتم ربط وحفظ العمليات في قاعدة البيانات تلقائياً وتفعيل سجل المتابعة الذكي.</span>
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
