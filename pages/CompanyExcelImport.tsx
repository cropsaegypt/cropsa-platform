import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { InstallmentCompanyStaffRole, Role, EGYPT_GOVERNORATES } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  KeyRound, 
  ArrowRight, 
  Check, 
  X, 
  ClipboardPaste, 
  Copy, 
  Printer, 
  ShieldCheck, 
  Phone, 
  UserCheck, 
  MapPin,
  ExternalLink
} from 'lucide-react';

interface ParsedBranchRow {
  id: string;
  branchName: string;
  governorate: string;
  address: string;
  branchPhone: string;
  managerName: string;
  managerUsername: string;
  managerPassword: string;
  managerPhone: string;
  isValid: boolean;
  validationErrors: string[];
}

interface CreatedBranchCredential {
  branchName: string;
  governorate: string;
  managerName: string;
  managerUsername: string;
  managerPassword: string;
  managerPhone: string;
  branchPhone: string;
}

export const CompanyExcelImport: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { 
    currentUser, 
    currentCompany, 
    bulkImportBranchesAndStaff, 
    language,
    setNavigation 
  } = useStore();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'guide'>('upload');
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedBranchRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedBranchCredential[] | null>(null);

  // Simplified CSV Template content: ONLY BRANCHES AND THEIR MANAGER PASSWORDS
  const sampleCsvContent = `اسم الفرع,المحافظة,عنوان الفرع,هاتف الفرع,اسم مدير الفرع,اسم مستخدم المدير,كلمة مرور الفرع,هاتف المدير
فرع التجمع الخامس,القاهرة,شارع التسعين الشمالي مبنى 45,0228100100,محمد عبد الرحمن,bm_tagamoa,pass2026,01011122233
فرع المهندسين,الجيزة,شارع جامعة الدول العربية 12,0237400200,ياسر الشناوي,bm_mohandessin,pass2026,01222233344
فرع سموحة,الإسكندرية,ميدان فيكتور عمانويل برج الأطباء,034200300,خالد السعدني,bm_alex,pass2026,01555566677
فرع المنصورة,الدقهلية,شارع الجمهورية أمام الجامعة,0502200400,طارق النجار,bm_mansoura,pass2026,01033344455
فرع الزقازيق,الشرقية,شارع وادي النيل برج السلام,0552300500,عمرو عبد العظيم,bm_zagazig,pass2026,01144455566
فرع طنطا,الغربية,شارع الجيش بجوار المحطة,0403300600,سامح الشربيني,bm_tanta,pass2026,01088776655`;

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + sampleCsvContent;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `نموذج_استيراد_الفروع_كروبسا_${currentCompany?.code || 'partner'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Demo Data for fast testing
  const handleLoadDemoData = () => {
    parseCsvString(sampleCsvContent);
  };

  // Parser helper
  const parseCsvString = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return;

    const rows: ParsedBranchRow[] = [];
    const dataLines = lines.slice(1); // skip headers

    dataLines.forEach((line, index) => {
      const delimiter = line.includes('\t') ? '\t' : ',';
      const cols = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());

      const branchName = cols[0] || `فرع جديد ${index + 1}`;
      const governorate = cols[1] || 'القاهرة';
      const address = cols[2] || '';
      const branchPhone = cols[3] || '';
      const managerName = cols[4] || `مدير ${branchName}`;
      const managerUsername = cols[5] || `bm_${index + 1}`;
      const managerPassword = cols[6] || 'pass2026';
      const managerPhone = cols[7] || '';

      const errors: string[] = [];
      if (!branchName) errors.push('اسم الفرع مطلوب');
      if (!governorate) errors.push('المحافظة مطلوبة');
      if (!managerUsername) errors.push('اسم مستخدم مدير الفرع مطلوب');
      if (!managerPassword) errors.push('كلمة مرور الفرع مطلوبة');

      rows.push({
        id: `row_${index}`,
        branchName,
        governorate,
        address,
        branchPhone,
        managerName,
        managerUsername,
        managerPassword,
        managerPhone,
        isValid: errors.length === 0,
        validationErrors: errors
      });
    });

    setParsedRows(rows);
    setCreatedCredentials(null);
  };

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        parseCsvString(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Handle paste submission
  const handleProcessPastedData = () => {
    if (!pasteData.trim()) return;
    parseCsvString(pasteData);
  };

  // Summaries
  const summary = useMemo(() => {
    const uniqueBranches = new Set<string>();
    const uniqueManagers = new Set<string>();

    parsedRows.forEach(r => {
      if (r.branchName) uniqueBranches.add(r.branchName);
      if (r.managerUsername) uniqueManagers.add(r.managerUsername);
    });

    const validCount = parsedRows.filter(r => r.isValid).length;
    const invalidCount = parsedRows.length - validCount;

    return {
      branchesCount: uniqueBranches.size,
      managersCount: uniqueManagers.size,
      totalRows: parsedRows.length,
      validCount,
      invalidCount
    };
  }, [parsedRows]);

  // Execute Bulk Import: BRANCHES ONLY + BRANCH MANAGERS
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    try {
      const branchMap: Record<string, {
        name: string;
        governorate: string;
        address: string;
        phone: string;
        managerName?: string;
      }> = {};

      const credentialsList: CreatedBranchCredential[] = [];

      parsedRows.forEach(r => {
        if (!branchMap[r.branchName]) {
          branchMap[r.branchName] = {
            name: r.branchName,
            governorate: r.governorate,
            address: r.address,
            phone: r.branchPhone,
            managerName: r.managerName
          };
        }

        credentialsList.push({
          branchName: r.branchName,
          governorate: r.governorate,
          managerName: r.managerName || `مدير ${r.branchName}`,
          managerUsername: r.managerUsername,
          managerPassword: r.managerPassword,
          managerPhone: r.managerPhone,
          branchPhone: r.branchPhone
        });
      });

      // Prepare manager accounts
      const staffList = credentialsList.map(c => ({
        name: c.managerName,
        username: c.managerUsername,
        password: c.managerPassword,
        role: InstallmentCompanyStaffRole.BRANCH_MANAGER,
        branchName: c.branchName,
        governorate: c.governorate,
        phone: c.managerPhone,
        permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'manage_staff', 'followup_cases']
      }));

      await bulkImportBranchesAndStaff({
        branches: Object.values(branchMap),
        staff: staffList
      });

      setCreatedCredentials(credentialsList);
      setParsedRows([]);
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  // Copy branch login details
  const handleCopyCredentials = (cred: CreatedBranchCredential, idx: number) => {
    const text = `بيانات تسجيل دخول (${cred.branchName}):\nاسم المستخدم: ${cred.managerUsername}\nكلمة المرور: ${cred.managerPassword}\nالمحافظة: ${cred.governorate}\nمنصة كروبسا للتمويل والتقسيط`;
    navigator.clipboard.writeText(text);
    setCopiedId(String(idx));
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Sleek, Modern Page Header (No heavy photo banner) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isAr ? 'استيراد الفروع من ملف Excel' : 'Import Branches from Excel'}
              </h1>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                {isAr ? 'كفروع فقط' : 'Branches Only'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAr 
                ? 'استيراد الفروع وتعيين كلمة مرور لكل فرع ليتمكن مدير الفرع من تسجيل الدخول وإنشاء حسابات موظفيه بنفسه.' 
                : 'Import branches and assign passwords so branch managers can log in and create their own team accounts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{isAr ? 'العودة للوحة الشركة' : 'Back to Dashboard'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-300" />
            <span>{isAr ? 'تحميل نموذج Excel (CSV)' : 'Download Template'}</span>
          </button>
        </div>
      </div>

      {/* Concept Architecture Notice (بسيط ومباشر) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            {isAr ? 'آلية العمل البسيطة والمودرن:' : 'Simple & Modern Workflow:'}
          </p>
          <p>
            {isAr 
              ? 'تتم إضافة الفروع فقط عبر هذا الملف. يتم إنشاء حساب لمدير كل فرع بكلمة المرور المحددة. بمجرد استلام مدير الفرع لحسابه، يقوم بالدخول على المنصة وإنشاء حسابات مسؤولي الائتمان والمحصلين التابعين لفرعه مباشرة.' 
              : 'Only branches and their managers are imported. Managers receive initial passwords, log in, and create their own branch staff directly.'}
          </p>
        </div>
      </div>

      {/* Success Result Credentials Sheet (كشف تسليم كلمات المرور للفروع) */}
      {createdCredentials && (
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'تم استيراد الفروع وتوليد حسابات مديري الفروع بنجاح!' : 'Branches & Manager Accounts Created Successfully!'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr 
                    ? `تم تفعيل ${createdCredentials.length} فرع. يمكنك الآن نسخ بيانات الدخول وإرسالها لكل مدير فرع.` 
                    : `${createdCredentials.length} branches ready. You can copy the credentials below to send to each branch manager.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{isAr ? 'طباعة الكشف' : 'Print'}</span>
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <span>{isAr ? 'عرض الفروع في اللوحة' : 'View Branches'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Credentials Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-semibold">اسم الفرع</th>
                  <th className="p-3 font-semibold">المحافظة</th>
                  <th className="p-3 font-semibold">اسم مدير الفرع</th>
                  <th className="p-3 font-semibold">اسم المستخدم</th>
                  <th className="p-3 font-semibold">كلمة المرور</th>
                  <th className="p-3 font-semibold text-center">إجراء التسليم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {createdCredentials.map((cred, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{cred.branchName}</td>
                    <td className="p-3 text-slate-600">{cred.governorate}</td>
                    <td className="p-3 text-slate-800">{cred.managerName}</td>
                    <td className="p-3 font-mono text-slate-900 font-bold bg-slate-50/50">{cred.managerUsername}</td>
                    <td className="p-3 font-mono text-emerald-800 font-bold bg-emerald-50/50">{cred.managerPassword}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(cred, idx)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          copiedId === String(idx)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="نسخ بيانات الدخول للفرع لإرسالها بالواتساب أو رسالة نصية"
                      >
                        {copiedId === String(idx) ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>نسخ البيانات</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Import Work Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Method Switcher Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>{isAr ? 'رفع ملف (CSV / Excel)' : 'Upload File'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            <span>{isAr ? 'لصق مباشر من جدول Excel' : 'Paste Table Data'}</span>
          </button>

          <div className="mr-auto">
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 bg-white"
            >
              {isAr ? 'تجربة سريعة ببيانات استرشادية' : 'Load Demo Branches'}
            </button>
          </div>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="p-8">
            <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
              <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-7 w-7 text-slate-700" />
              </div>
              <p className="font-bold text-sm text-slate-800">
                {isAr ? 'اسحب ملف الفروع هنا أو اضغط للاختيار من جهازك' : 'Drop your branches file here, or browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'يدعم ملفات CSV أو ملفات Excel المحفوظة بصيغة CSV (ترميز UTF-8)' : 'Supports CSV with UTF-8 encoding'}
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab 2: Direct Paste */}
        {activeTab === 'paste' && (
          <div className="p-6 space-y-3">
            <p className="text-xs text-slate-600">
              {isAr 
                ? 'انسخ الصفوف مباشرة من ملف Excel والصقها هنا، ثم اضغط على زر المعالجة:' 
                : 'Copy rows directly from Excel and paste here, then click Process:'}
            </p>
            <textarea
              rows={6}
              value={pasteData}
              onChange={e => setPasteData(e.target.value)}
              placeholder="اسم الفرع	المحافظة	العنوان	هاتف الفرع	مدير الفرع	اسم المستخدم	كلمة المرور	هاتف المدير..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={handleProcessPastedData}
              disabled={!pasteData.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
            >
              {isAr ? 'معالجة ومراجعة البيانات الملصوقة' : 'Process Pasted Data'}
            </button>
          </div>
        )}
      </div>

      {/* Parsed Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{isAr ? 'معاينة الفروع قبل الاعتماد' : 'Preview Branches'}</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  {parsedRows.length} {isAr ? 'فرع' : 'branches'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr 
                  ? 'تحقق من صحة الفروع وأسماء المستخدمين وكلمات المرور المحددة لمديري الفروع.' 
                  : 'Verify branch names, governorates, and manager credentials before saving.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setParsedRows([])}
                className="px-3 py-2 text-xs font-medium rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isAr ? 'إلغاء وتفريغ' : 'Clear'}
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || summary.invalidCount > 0}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {importing ? (
                  <span>{isAr ? 'جارِ اعتماد وتفعيل الفروع...' : 'Importing...'}</span>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{isAr ? `تفعيل واستيراد (${summary.branchesCount}) فروع معتمدة` : `Import ${summary.branchesCount} Branches`}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3 font-semibold">اسم الفرع</th>
                  <th className="p-3 font-semibold">المحافظة</th>
                  <th className="p-3 font-semibold">العنوان</th>
                  <th className="p-3 font-semibold">مدير الفرع</th>
                  <th className="p-3 font-semibold">اسم مستخدم المدير</th>
                  <th className="p-3 font-semibold">كلمة المرور</th>
                  <th className="p-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {parsedRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{r.branchName}</td>
                    <td className="p-3 text-slate-600">{r.governorate}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{r.address || '—'}</td>
                    <td className="p-3 text-slate-800">{r.managerName || '—'}</td>
                    <td className="p-3 font-mono text-slate-800 font-bold bg-slate-50/40">{r.managerUsername}</td>
                    <td className="p-3 font-mono text-emerald-800 font-bold bg-emerald-50/40">{r.managerPassword}</td>
                    <td className="p-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="h-3 w-3" />
                          <span>جاهز للاعتماد</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded" title={r.validationErrors.join(', ')}>
                          <X className="h-3 w-3" />
                          <span>{r.validationErrors[0]}</span>
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
  );
};
