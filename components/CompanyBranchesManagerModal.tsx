import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/Store';
import { InstallmentCompany, CompanyBranch, EGYPT_GOVERNORATES } from '../types';
import { generateBranchCredentials, matchGovernorate } from '../utils/branchCredentials';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Phone, 
  User, 
  Sparkles, 
  ClipboardPaste,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Zap
} from 'lucide-react';

interface CompanyBranchesManagerModalProps {
  company: InstallmentCompany;
  onClose: () => void;
  initialTab?: 'list' | 'add' | 'excel';
}

interface ParsedBranchItem {
  id: string;
  name: string;
  governorate: string;
  address: string;
  phone: string;
  managerName: string;
  username: string;
  password: string;
  isValid: boolean;
  errors: string[];
}

export const CompanyBranchesManagerModal: React.FC<CompanyBranchesManagerModalProps> = ({
  company,
  onClose,
  initialTab = 'list'
}) => {
  const { 
    branches, 
    createBranch, 
    updateBranch, 
    deleteBranch, 
    bulkImportCompanyBranches,
    updateBranchPassword,
    language 
  } = useStore();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'excel'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [govFilter, setGovFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');

  // Password & Credentials State
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [changingPassBranchId, setChangingPassBranchId] = useState<string | null>(null);
  const [newPassInput, setNewPassInput] = useState('');
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  const toggleRevealPassword = (branchId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Filter company branches
  const compBranches = useMemo(() => {
    return branches.filter(b => b.companyId === company.id);
  }, [branches, company.id]);

  const filteredBranches = useMemo(() => {
    return compBranches.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (b.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (b.managerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (b.phone || '').includes(searchTerm);
      const matchesGov = govFilter === 'ALL' || b.governorate === govFilter;
      return matchesSearch && matchesGov;
    });
  }, [compBranches, searchTerm, govFilter]);

  // Add Branch Form State
  const [newBranch, setNewBranch] = useState({
    name: '',
    governorate: company.allowedGovernorates?.[0] || 'القاهرة',
    address: '',
    phone: '',
    managerName: ''
  });
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);

  // Edit Branch State
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchForm, setEditingBranchForm] = useState({
    name: '',
    governorate: 'القاهرة',
    address: '',
    phone: '',
    managerName: ''
  });

  const handleStartEdit = (b: CompanyBranch) => {
    setEditingBranchId(b.id);
    setEditingBranchForm({
      name: b.name,
      governorate: b.governorate,
      address: b.address || '',
      phone: b.phone || '',
      managerName: b.managerName || ''
    });
  };

  const handleSaveEdit = async (branchId: string) => {
    if (!editingBranchForm.name.trim()) {
      alert(isAr ? 'يرجى إدخال اسم الفرع' : 'Branch name is required');
      return;
    }
    try {
      await updateBranch(branchId, {
        name: editingBranchForm.name.trim(),
        governorate: editingBranchForm.governorate,
        address: editingBranchForm.address.trim(),
        phone: editingBranchForm.phone.trim(),
        managerName: editingBranchForm.managerName.trim()
      });
      setEditingBranchId(null);
      showToast(isAr ? 'تم تحديث بيانات الفرع بنجاح' : 'Branch updated successfully');
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء تعديل الفرع' : 'Error updating branch');
    }
  };

  const handleDelete = async (b: CompanyBranch) => {
    if (!confirm(isAr ? `هل أنت متأكد من حذف فرع "${b.name}"؟` : `Are you sure you want to delete branch "${b.name}"?`)) return;
    try {
      await deleteBranch(b.id);
      showToast(isAr ? 'تم حذف الفرع بنجاح' : 'Branch deleted successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (b: CompanyBranch) => {
    try {
      const newActive = b.active === false ? true : false;
      await updateBranch(b.id, { active: newActive });
      showToast(newActive ? (isAr ? 'تم تفعيل الفرع' : 'Branch activated') : (isAr ? 'تم تعطيل الفرع' : 'Branch deactivated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSingleBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) {
      alert(isAr ? 'يرجى إدخال اسم الفرع' : 'Branch name is required');
      return;
    }

    setIsSubmittingBranch(true);
    try {
      await createBranch({
        companyId: company.id,
        name: newBranch.name.trim(),
        governorate: newBranch.governorate,
        address: newBranch.address.trim(),
        phone: newBranch.phone.trim(),
        managerName: newBranch.managerName.trim(),
        active: true
      });
      setNewBranch({
        name: '',
        governorate: company.allowedGovernorates?.[0] || 'القاهرة',
        address: '',
        phone: '',
        managerName: ''
      });
      setActiveTab('list');
      showToast(isAr ? 'تمت إضافة الفرع الجديد بنجاح' : 'New branch added successfully');
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء إضافة الفرع' : 'Error creating branch');
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  // =========================================================================
  // EXCEL & CSV BULK IMPORT LOGIC
  // =========================================================================
  const [excelMethod, setExcelMethod] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedBranches, setParsedBranches] = useState<ParsedBranchItem[]>([]);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample CSV contents (Full vs Simple Mode)
  const fullSampleCsvContent = `اسم الفرع,المحافظة,عنوان الفرع,هاتف الفرع,اسم مدير الفرع
فرع التجمع الخامس,القاهرة,شارع التسعين الشمالي مبنى 45,0228100100,محمد عبد الرحمن
فرع المهندسين,الجيزة,شارع جامعة الدول العربية 12,0237400200,ياسر الشناوي
فرع سموحة,الإسكندرية,ميدان فيكتور عمانويل برج الأطباء,034200300,خالد السعدني
فرع المنصورة,الدقهلية,شارع الجمهورية أمام الجامعة,0502200400,طارق النجار
فرع طنطا,الغربية,شارع الجيش بجوار المحطة,0403300600,سامح الشربيني
فرع الزقازيق,الشرقية,شارع وادي النيل برج السلام,0552300500,عمرو عبد العظيم`;

  const simpleSampleCsvContent = `اسم الفرع,المحافظة
فرع التجمع الخامس,القاهرة
فرع المهندسين,الجيزة
فرع سموحة,الإسكندرية
فرع المنصورة,الدقهلية
فرع طنطا,الغربية
فرع الزقازيق,الشرقية
فرع أسيوط,أسيوط
فرع سوهاج,سوهاج`;

  const activeSampleCsvContent = isSimpleMode ? simpleSampleCsvContent : fullSampleCsvContent;

  // Download official CSV template
  const handleDownloadSampleCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + activeSampleCsvContent;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `نموذج_استيراد_فروع_${isSimpleMode ? 'اسماء_ومحافظات_' : 'شامل_'}${company.code || 'company'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isAr ? 'تم تنزيل النموذج الاسترشادي بنجاح' : 'Template downloaded');
  };

  // Load demo branches into preview
  const handleLoadDemoBranches = () => {
    parseRawText(activeSampleCsvContent, isSimpleMode);
    showToast(isAr ? 'تم ملء بيانات النموذج الاسترشادي للتجربة' : 'Demo data loaded');
  };

  // Parser helper (handles comma, tab, newline separated rows, and Simple Mode)
  const parseRawText = (rawText: string, simpleModeOverride?: boolean) => {
    const useSimple = simpleModeOverride !== undefined ? simpleModeOverride : isSimpleMode;
    const lines = rawText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedBranches([]);
      return;
    }

    const items: ParsedBranchItem[] = [];
    
    // Check if first line is a header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('اسم') || firstLineLower.includes('branch') || firstLineLower.includes('محافظة');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const defaultGov = company.allowedGovernorates?.[0] || 'القاهرة';

    dataLines.forEach((line, idx) => {
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      } else {
        parts = [line.trim()];
      }

      const branchName = parts[0] || '';
      const rawGov = parts[1] || '';
      let governorate = defaultGov;
      const address = (!useSimple && parts[2]) ? parts[2] : '';
      const phone = (!useSimple && parts[3]) ? parts[3] : '';
      const managerName = (!useSimple && parts[4]) ? parts[4] : '';

      const errors: string[] = [];
      if (!branchName.trim()) {
        errors.push(isAr ? 'اسم الفرع مفقود' : 'Branch name missing');
      }

      // Check governorate in both modes
      if (rawGov.trim()) {
        const matchedGov = matchGovernorate(rawGov);
        if (matchedGov) {
          governorate = matchedGov;
        } else {
          errors.push(isAr ? `المحافظة غير معروفة: "${rawGov}"` : `Unknown governorate: ${rawGov}`);
        }
      } else {
        governorate = defaultGov;
      }

      // Generate credentials automatically from system
      const creds = generateBranchCredentials(branchName || `فرع ${idx + 1}`, company.code || 'comp', idx + 1);
      const username = (!useSimple && parts[5]?.trim()) ? parts[5].trim() : creds.username;
      const password = (!useSimple && parts[6]?.trim()) ? parts[6].trim() : creds.password;

      items.push({
        id: `parsed_${Date.now()}_${idx}`,
        name: branchName,
        governorate: governorate || defaultGov,
        address,
        phone,
        managerName,
        username,
        password,
        isValid: errors.length === 0,
        errors
      });
    });

    setParsedBranches(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseRawText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const validParsedBranchesCount = parsedBranches.filter(b => b.isValid).length;

  const handleExecuteImport = async () => {
    const validOnes = parsedBranches.filter(b => b.isValid);
    if (validOnes.length === 0) {
      alert(isAr ? 'لا توجد فروع صالحة للاستيراد في الشيت' : 'No valid branches to import');
      return;
    }

    setIsImportingExcel(true);
    try {
      const res = await bulkImportCompanyBranches(
        company.id,
        validOnes.map(b => ({
          name: b.name,
          governorate: b.governorate,
          address: b.address,
          phone: b.phone,
          managerName: b.managerName,
          username: b.username,
          password: b.password,
          active: true
        }))
      );

      setParsedBranches([]);
      setPasteContent('');
      setActiveTab('list');
      showToast(isAr ? `تم بنجاح استيراد ${res.count} فرع وتوليد حسابات الدخول وحفظها في قاعدة البيانات` : `Successfully imported ${res.count} branches with login accounts`);
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء استيراد الفروع' : 'Error importing branches');
    } finally {
      setIsImportingExcel(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {Boolean(company.logo?.trim()) ? (
              <img 
                src={company.logo} 
                alt={company.name} 
                className="h-12 w-12 rounded-2xl object-contain p-1 border border-white/20 bg-white"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                <Building2 className="h-6 w-6 text-sky-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{company.name}</h2>
                <span className="font-mono text-xs text-sky-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                  {company.code}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                إدارة الفروع الإقليمية، التعديل المباشر، ورفع الشيت الاسترشادي (Excel / CSV)
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-crobsa-700 text-crobsa-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>فروع الشركة الحالية</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === 'list' ? 'bg-crobsa-100 text-crobsa-900' : 'bg-slate-200 text-slate-700'
            }`}>
              {compBranches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'border-crobsa-700 text-crobsa-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>إضافة فرع جديد يدوياً</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'excel'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>رفع شيت إكسيل / CSV مجمع</span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              الأسهل
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ================================================================= */}
          {/* TAB 1: BRANCHES LIST & INLINE EDITING */}
          {/* ================================================================= */}
          {activeTab === 'list' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Filter and Search */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <Search className="h-4 w-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم الفرع، العنوان، المدير، أو الهاتف..."
                    className="w-full text-xs border border-slate-200 rounded-xl pr-9 pl-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-crobsa-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={govFilter}
                    onChange={e => setGovFilter(e.target.value)}
                    className="w-full sm:w-auto text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-crobsa-500 cursor-pointer"
                  >
                    <option value="ALL">جميع المحافظات ({compBranches.length})</option>
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>
                        {gov} ({compBranches.filter(b => b.governorate === gov).length})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setActiveTab('excel')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5 text-emerald-600" />
                    <span>رفع شيت</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="px-3.5 py-2 rounded-xl bg-crobsa-700 text-white hover:bg-crobsa-800 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة فرع</span>
                  </button>
                </div>
              </div>

              {/* Branches Grid / List */}
              {filteredBranches.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">
                    {compBranches.length === 0 ? 'لا توجد فروع مسجلة لهذه الشركة بعد' : 'لا توجد نتائج تطابق معايير البحث'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    يمكنك إضافة الفروع يدوياً واحداً تلو الآخر، أو رفع شيت إكسيل مجمع بكافة الفروع بنقرة واحدة.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('excel')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>رفع شيت إكسيل بالفروع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('add')}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>إضافة فرع يدوي</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBranches.map(branch => {
                    const isEditing = editingBranchId === branch.id;

                    return (
                      <div 
                        key={branch.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isEditing 
                            ? 'bg-sky-50/50 border-sky-300 ring-2 ring-sky-200' 
                            : branch.active === false 
                            ? 'bg-slate-50/70 border-slate-200 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {isEditing ? (
                          /* Inline Edit Mode */
                          <div className="space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                              <span className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                                <Edit3 className="h-4 w-4 text-sky-600" />
                                <span>تعديل بيانات الفرع: {branch.name}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(branch.id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>حفظ التعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingBranchId(null)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الفرع *</label>
                                <input
                                  type="text"
                                  value={editingBranchForm.name}
                                  onChange={e => setEditingBranchForm({ ...editingBranchForm, name: e.target.value })}
                                  className="w-full text-xs border border-sky-300 rounded-xl px-3 py-2 bg-white font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">المحافظة *</label>
                                <select
                                  value={editingBranchForm.governorate}
                                  onChange={e => setEditingBranchForm({ ...editingBranchForm, governorate: e.target.value })}
                                  className="w-full text-xs border border-sky-300 rounded-xl px-3 py-2 bg-white font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                >
                                  {EGYPT_GOVERNORATES.map(gov => (
                                    <option key={gov} value={gov}>{gov}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">هاتف الفرع</label>
                                <input
                                  type="text"
                                  value={editingBranchForm.phone}
                                  onChange={e => setEditingBranchForm({ ...editingBranchForm, phone: e.target.value })}
                                  className="w-full text-xs border border-sky-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
                                <input
                                  type="text"
                                  value={editingBranchForm.address}
                                  onChange={e => setEditingBranchForm({ ...editingBranchForm, address: e.target.value })}
                                  className="w-full text-xs border border-sky-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم مدير الفرع</label>
                                <input
                                  type="text"
                                  value={editingBranchForm.managerName}
                                  onChange={e => setEditingBranchForm({ ...editingBranchForm, managerName: e.target.value })}
                                  className="w-full text-xs border border-sky-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-sm">{branch.name}</h4>
                                <span className="text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-sky-600" />
                                  <span>{branch.governorate}</span>
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  branch.active !== false 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {branch.active !== false ? 'مفعل' : 'معطل'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 flex items-center gap-4 flex-wrap pt-0.5">
                                {branch.address && (
                                  <span>العنوان: <span className="text-slate-800 font-medium">{branch.address}</span></span>
                                )}
                                {branch.phone && (
                                  <span className="flex items-center gap-1 text-slate-700">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <span className="font-mono">{branch.phone}</span>
                                  </span>
                                )}
                                {branch.managerName && (
                                  <span className="flex items-center gap-1 text-slate-700">
                                    <User className="h-3 w-3 text-slate-400" />
                                    <span>المدير: {branch.managerName}</span>
                                  </span>
                                )}
                              </p>

                              {/* Branch User & Password Credentials Box */}
                              <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-4 flex-wrap">
                                  {/* Username */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">اسم المستخدم:</span>
                                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">
                                      {branch.username || `${company.code?.toLowerCase() || 'co'}_${branch.id.slice(-4)}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(branch.username || `${company.code?.toLowerCase() || 'co'}_${branch.id.slice(-4)}`);
                                        showToast(isAr ? 'تم نسخ اسم المستخدم' : 'Username copied');
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                      title="نسخ اسم المستخدم"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Password */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-medium">كلمة المرور:</span>
                                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                                      {revealedPasswords[branch.id] 
                                        ? (branch.password || `${(company.code || 'brn').toLowerCase().slice(0, 3)}@2026`) 
                                        : '••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRevealPassword(branch.id)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                      title={revealedPasswords[branch.id] ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                    >
                                      {revealedPasswords[branch.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(branch.password || `${(company.code || 'brn').toLowerCase().slice(0, 3)}@2026`);
                                        showToast(isAr ? 'تم نسخ كلمة المرور' : 'Password copied');
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                      title="نسخ كلمة المرور"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Quick Change Password Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChangingPassBranchId(changingPassBranchId === branch.id ? null : branch.id);
                                    setNewPassInput(branch.password || `${(company.code || 'brn').toLowerCase().slice(0, 3)}@2026`);
                                  }}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors"
                                >
                                  <KeyRound className="h-3 w-3" />
                                  <span>تعديل الباسورد</span>
                                </button>
                              </div>

                              {/* Inline Password Edit Row */}
                              {changingPassBranchId === branch.id && (
                                <div className="mt-2 p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 flex items-center justify-between gap-3 animate-in fade-in">
                                  <div className="flex items-center gap-2 flex-1">
                                    <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                                    <span className="text-xs font-bold text-indigo-950 shrink-0">باسورد جديد للفرع:</span>
                                    <input
                                      type="text"
                                      value={newPassInput}
                                      onChange={e => setNewPassInput(e.target.value)}
                                      placeholder="مثال: tag@2026"
                                      className="text-xs bg-white border border-indigo-300 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 flex-1 max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!newPassInput.trim()) return;
                                        await updateBranchPassword(branch.id, newPassInput.trim());
                                        setChangingPassBranchId(null);
                                        showToast(isAr ? 'تم تحديث كلمة مرور الفرع بنجاح' : 'Branch password updated');
                                      }}
                                      className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setChangingPassBranchId(null)}
                                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Branch Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(branch)}
                                className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-colors ${
                                  branch.active !== false
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                                title={branch.active !== false ? 'تعطيل الفرع مؤقتاً' : 'إعادة تفعيل الفرع'}
                              >
                                {branch.active !== false ? 'تعطيل' : 'تفعيل'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(branch)}
                                className="p-2 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 transition-colors"
                                title="تعديل بيانات الفرع"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(branch)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                                title="حذف هذا الفرع"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: ADD SINGLE BRANCH MANUALLY */}
          {/* ================================================================= */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateSingleBranch} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-5 animate-in fade-in">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Plus className="h-5 w-5 text-crobsa-700" />
                  <span>إضافة فرع جديد لشركة {company.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أدخل بيانات الفرع الجغرافي ليتم توجيه طلبات التمويل والمندوبين عليه تلقائياً
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">اسم الفرع *</label>
                  <input
                    type="text"
                    required
                    value={newBranch.name}
                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="مثال: فرع التجمع الخامس"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">المحافظة *</label>
                  <select
                    value={newBranch.governorate}
                    onChange={e => setNewBranch({ ...newBranch, governorate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none cursor-pointer"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">هاتف الفرع</label>
                  <input
                    type="text"
                    value={newBranch.phone}
                    onChange={e => setNewBranch({ ...newBranch, phone: e.target.value })}
                    placeholder="مثال: 0228100100 أو 01011122233"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white font-mono focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">اسم مدير الفرع المسؤول</label>
                  <input
                    type="text"
                    value={newBranch.managerName}
                    onChange={e => setNewBranch({ ...newBranch, managerName: e.target.value })}
                    placeholder="مثال: أستاذ محمد عبد الرحمن"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    value={newBranch.address}
                    onChange={e => setNewBranch({ ...newBranch, address: e.target.value })}
                    placeholder="مثال: شارع التسعين الشمالي - مول النرجس - الدور الثاني"
                    className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBranch}
                  className="px-6 py-2.5 rounded-xl bg-crobsa-700 hover:bg-crobsa-800 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSubmittingBranch ? 'جاري الحفظ...' : 'حفظ وإضافة الفرع'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 3: EXCEL & CSV BULK IMPORT (WITH SAMPLE TEMPLATE) */}
          {/* ================================================================= */}
          {activeTab === 'excel' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top Guide Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 rounded-3xl border border-emerald-800/40 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>الاستيراد السريع للفروع من شيت إكسيل أو CSV</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      ارفع شيت بجميع فروع الشركة مع التحقق التلقائي
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      حمل النموذج الاسترشادي، املأ أسماء الفروع والمحافظات، وارفع الملف ليتم تسجيل كافة الفروع في قاعدة بيانات الشركة وحفظها مباشرة.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      <span>تحميل النموذج الاسترشادي (.csv)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadDemoBranches}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="ملء 6 فروع نموذجية للتجربة السريعة"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>تجربة بيانات استرشادية فوراً</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Mode Switcher (نمط الأسماء والمحافظات vs النمط الشامل) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>تحديد نمط الاستيراد المطلوب:</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isSimpleMode 
                      ? 'نمط الأسماء والمحافظات فقط: أدخل اسم الفرع والمحافظة، وسيقوم النظام فوراً بتوليد يوزر وباسورد تلقائياً لكل فرع وربطه بمحافظته لتوجيه طلبات التقسيط عليه.' 
                      : 'النمط الشامل: يتضمن اسم الفرع والمحافظة وعنوان الفرع ورقم الهاتف واسم المدير، مع توليد يوزر وباسورد من النظام تلقائياً.'}
                  </p>
                </div>

                <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold shrink-0 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => { setIsSimpleMode(false); setParsedBranches([]); }}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      !isSimpleMode 
                        ? 'bg-slate-900 text-white shadow-xs font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    النمط الشامل (كامل التفاصيل)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSimpleMode(true); setParsedBranches([]); }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      isSimpleMode 
                        ? 'bg-emerald-600 text-white shadow-xs font-black' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="h-3 w-3" />
                    <span>نمط الأسماء والمحافظات فقط</span>
                  </button>
                </div>
              </div>

              {/* Input Method Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setExcelMethod('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    excelMethod === 'upload'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  رفع ملف (.csv / .xlsx / .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setExcelMethod('paste')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    excelMethod === 'paste'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  لصق مباشر من جدول إكسيل (Copy & Paste)
                </button>
              </div>

              {/* Upload Dropzone */}
              {excelMethod === 'upload' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <FileSpreadsheet className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      انقر لاختيار ملف الشيت من جهازك أو اسحبه وأفلته هنا
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      يدعم صيغ ملفات CSV و Text بترميز UTF-8 القياسي
                    </p>
                  </div>
                </div>
              ) : (
                /* Paste Textarea */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">الصق محتوى جدول الإكسيل هنا مباشرة:</label>
                    <button
                      type="button"
                      onClick={() => parseRawText(pasteContent)}
                      disabled={!pasteContent.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold"
                    >
                      معاينة البيانات
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pasteContent}
                    onChange={e => {
                      setPasteContent(e.target.value);
                      parseRawText(e.target.value);
                    }}
                    placeholder={isSimpleMode 
                      ? `انسخ الفروع والمحافظات والصقها هنا...\nمثال:\nفرع التجمع الخامس\tالقاهرة\nفرع المهندسين\tالجيزة\nفرع سموحة\tالإسكندرية`
                      : `انسخ صفوف الفروع من برنامج إكسيل والصقها هنا...\nمثال:\nاسم الفرع\tالمحافظة\tالعنوان\tالهاتف\tاسم المدير`
                    }
                    className="w-full text-xs font-mono border border-slate-200 rounded-2xl p-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Live Preview Table of Parsed Branches */}
              {parsedBranches.length > 0 && (
                <div className="space-y-3 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>معاينة الفروع المقروءة من الشيت ({parsedBranches.length} فرع)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>جاهز للاستيراد: <strong className="font-bold text-emerald-700">{validParsedBranchesCount}</strong></span>
                        <span>• بها ملاحظات: <strong className="font-bold text-rose-600">{parsedBranches.length - validParsedBranchesCount}</strong></span>
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 text-[11px]">
                          ⚡ يقوم النظام بتوليد اسم مستخدم وباسورد تلقائياً لكل فرع ([كود]@2026)
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={validParsedBranchesCount === 0 || isImportingExcel}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
                    >
                      <Check className="h-4 w-4" />
                      <span>{isImportingExcel ? 'جاري الاستيراد...' : `اعتماد واستيراد (${validParsedBranchesCount}) فرع فوراً`}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-72 border border-slate-100 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">اسم الفرع</th>
                          <th className="p-2.5">المحافظة</th>
                          <th className="p-2.5">اسم المستخدم (تلقائي)</th>
                          <th className="p-2.5">كلمة المرور (تلقائي)</th>
                          {!isSimpleMode && <th className="p-2.5">العنوان</th>}
                          {!isSimpleMode && <th className="p-2.5">الهاتف</th>}
                          {!isSimpleMode && <th className="p-2.5">المدير</th>}
                          <th className="p-2.5">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedBranches.map((item, index) => (
                          <tr key={item.id} className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="p-2.5 font-mono text-slate-400">{index + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.name || '—'}</td>
                            <td className="p-2.5 font-medium text-slate-700">
                              <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-bold">
                                {item.governorate}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-all">
                                {item.username}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                                {item.password}
                              </span>
                            </td>
                            {!isSimpleMode && <td className="p-2.5 text-slate-600 truncate max-w-xs">{item.address || '—'}</td>}
                            {!isSimpleMode && <td className="p-2.5 font-mono text-slate-600">{item.phone || '—'}</td>}
                            {!isSimpleMode && <td className="p-2.5 text-slate-600">{item.managerName || '—'}</td>}
                            <td className="p-2.5">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Check className="h-3 w-3" />
                                  <span>صالح</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" title={item.errors.join(' • ')}>
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{item.errors[0]}</span>
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
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            إجمالي فروع {company.name}: <span className="font-bold text-slate-900">{compBranches.length} فرع مسجل</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
