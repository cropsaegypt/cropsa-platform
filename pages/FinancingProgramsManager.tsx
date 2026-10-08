import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  FinancingProgram, 
  ApplicationQuestion, 
  Role 
} from '../types';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  FileText, 
  HelpCircle, 
  AlertCircle,
  Filter,
  Search,
  Check,
  Calendar,
  DollarSign,
  Briefcase,
  Paperclip,
  Percent,
  ListPlus,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const STANDARD_DOCUMENT_PRESETS = [
  'أصل وصورة بطاقة الرقم القومي سارية للمشتري والضامن',
  'إيصال مرافق حديث لمحل السكن (كهرباء / غاز / مياه)',
  'حيازة زراعية مميكنة أو كارت فلاح سارٍ',
  'كشف حساب بنكي لآخر 6 أشهر أو إثبات دخل معتمد',
  'مفردات مرتب معتمدة أو خطاب جهة العمل',
  'سجل تجاري وبطاقة ضريبية سارية (للتجار وأصحاب الأنشطة)',
  'عقد إيجار أو ملكية مقر النشاط / المسكن',
  'استعلام I-Score ائتماني غير مدرج في القوائم السلبية',
  'شيكات بنكية مؤجلة الدفع لأقساط التمويل'
];

export interface FinancingProgramsManagerProps {
  initialTab?: 'PROGRAMS' | 'QUESTIONS';
}

export const FinancingProgramsManager: React.FC<FinancingProgramsManagerProps> = ({ initialTab = 'PROGRAMS' }) => {
  const { 
    currentUser, 
    companies, 
    financingPrograms, 
    addFinancingProgram, 
    updateFinancingProgram, 
    deleteFinancingProgram,
    applicationQuestions,
    addApplicationQuestion,
    updateApplicationQuestion,
    deleteApplicationQuestion,
    language 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'QUESTIONS'>(initialTab);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Program Modal State
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<FinancingProgram | null>(null);
  const [customDocInput, setCustomDocInput] = useState('');

  // Delete Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'PROGRAM' | 'QUESTION';
    id: string;
    name: string;
  } | null>(null);

  const [programForm, setProgramForm] = useState<{
    name: string;
    code: string;
    companyId: string;
    maxAmount: number;
    minAmount: number;
    durationMonths: number;
    interestRate: number;
    downPaymentPercent: number;
    adminFeePercent: number;
    requiredDocuments: string[];
    questionIds: string[];
    description: string;
    active: boolean;
  }>({
    name: '',
    code: '',
    companyId: companies[0]?.id || '',
    maxAmount: 100000,
    minAmount: 5000,
    durationMonths: 12,
    interestRate: 0,
    downPaymentPercent: 0,
    adminFeePercent: 2.5,
    requiredDocuments: [STANDARD_DOCUMENT_PRESETS[0], STANDARD_DOCUMENT_PRESETS[1]],
    questionIds: [],
    description: '',
    active: true
  });

  // Question Modal State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    labelAr: string;
    labelEn: string;
    type: 'text' | 'number' | 'select' | 'yes_no';
    category: 'AGRICULTURAL' | 'FINANCIAL' | 'ASSETS' | 'GENERAL';
    required: boolean;
    optionsText: string;
    programIds: string[];
    description?: string;
  }>({
    labelAr: '',
    labelEn: '',
    type: 'text',
    category: 'AGRICULTURAL',
    required: true,
    optionsText: '',
    programIds: []
  });

  // Access Control: Super Admin and Admin only
  if (currentUser?.role !== Role.SUPER_ADMIN && currentUser?.role !== Role.ADMIN) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center" dir="rtl">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-xl font-black text-amber-900">هذه الصفحة مخصصة لإدارة المنظومة (Super Admin / Admin)</h2>
          <p className="text-xs text-amber-700 mt-2">لا تملك الصلاحيات الإدارية لتعديل برامج التمويل والشروط الائتمانية.</p>
        </div>
      </div>
    );
  }

  // Filtered Programs
  const filteredPrograms = useMemo(() => {
    return financingPrograms.filter(prog => {
      if (selectedCompanyFilter !== 'ALL' && prog.companyId !== selectedCompanyFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = prog.name?.toLowerCase().includes(term);
        const matchCompany = prog.companyName?.toLowerCase().includes(term);
        const matchCode = prog.code?.toLowerCase().includes(term);
        if (!matchName && !matchCompany && !matchCode) return false;
      }
      return true;
    });
  }, [financingPrograms, selectedCompanyFilter, searchTerm]);

  // Handle open add program modal
  const handleOpenAddProgram = () => {
    setEditingProgram(null);
    setProgramForm({
      name: '',
      code: `PRG-${Date.now().toString().slice(-4)}`,
      companyId: selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : (companies[0]?.id || ''),
      maxAmount: 150000,
      minAmount: 10000,
      durationMonths: 24,
      interestRate: 0,
      downPaymentPercent: 0,
      adminFeePercent: 2.5,
      requiredDocuments: [STANDARD_DOCUMENT_PRESETS[0], STANDARD_DOCUMENT_PRESETS[1]],
      questionIds: applicationQuestions.map(q => q.id),
      description: '',
      active: true
    });
    setCustomDocInput('');
    setShowProgramModal(true);
  };

  // Handle open edit program modal
  const handleOpenEditProgram = (prog: FinancingProgram) => {
    setEditingProgram(prog);
    setProgramForm({
      name: prog.name,
      code: prog.code || `PRG-${prog.id.slice(-4)}`,
      companyId: prog.companyId,
      maxAmount: prog.maxAmount,
      minAmount: prog.minAmount || 5000,
      durationMonths: prog.durationMonths,
      interestRate: prog.interestRate || 0,
      downPaymentPercent: prog.downPaymentPercent || 0,
      adminFeePercent: prog.adminFeePercent || 2.5,
      requiredDocuments: prog.requiredDocuments || [],
      questionIds: prog.questionIds || [],
      description: prog.description || '',
      active: prog.active !== undefined ? prog.active : true
    });
    setCustomDocInput('');
    setShowProgramModal(true);
  };

  // Toggle Document in Program Form
  const handleToggleDoc = (docTitle: string) => {
    setProgramForm(prev => {
      const exists = prev.requiredDocuments.includes(docTitle);
      return {
        ...prev,
        requiredDocuments: exists 
          ? prev.requiredDocuments.filter(d => d !== docTitle)
          : [...prev.requiredDocuments, docTitle]
      };
    });
  };

  // Add Custom Document to Program Form
  const handleAddCustomDoc = () => {
    if (!customDocInput.trim()) return;
    const cleanDoc = customDocInput.trim();
    if (!programForm.requiredDocuments.includes(cleanDoc)) {
      setProgramForm(prev => ({
        ...prev,
        requiredDocuments: [...prev.requiredDocuments, cleanDoc]
      }));
    }
    setCustomDocInput('');
  };

  // Toggle Question Link in Program Form
  const handleToggleQuestionInProgram = (questionId: string) => {
    setProgramForm(prev => {
      const exists = prev.questionIds.includes(questionId);
      return {
        ...prev,
        questionIds: exists
          ? prev.questionIds.filter(qId => qId !== questionId)
          : [...prev.questionIds, questionId]
      };
    });
  };

  // Submit Program
  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.name.trim() || !programForm.companyId) return;

    if (editingProgram) {
      await updateFinancingProgram(editingProgram.id, programForm);
    } else {
      await addFinancingProgram(programForm);
    }
    setShowProgramModal(false);
  };

  // Question Form Handlers
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      labelAr: '',
      labelEn: '',
      type: 'text',
      category: 'AGRICULTURAL',
      required: true,
      optionsText: '',
      programIds: []
    });
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestion = (q: ApplicationQuestion) => {
    setEditingQuestion(q);
    setQuestionForm({
      labelAr: q.labelAr,
      labelEn: q.labelEn || '',
      type: q.type as any,
      category: (q.category as any) || 'AGRICULTURAL',
      required: q.required,
      optionsText: q.options ? q.options.join('\n') : '',
      programIds: q.programIds || [],
      description: q.description || ''
    });
    setShowQuestionModal(true);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.labelAr.trim()) return;

    const parsedOptions = questionForm.type === 'select'
      ? questionForm.optionsText.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined;

    const payload: Partial<ApplicationQuestion> = {
      labelAr: questionForm.labelAr.trim(),
      labelEn: questionForm.labelEn.trim(),
      type: questionForm.type,
      category: questionForm.category,
      required: questionForm.required,
      options: parsedOptions,
      programIds: questionForm.programIds,
      description: questionForm.description
    };

    if (editingQuestion) {
      await updateApplicationQuestion(editingQuestion.id, payload);
    } else {
      await addApplicationQuestion(payload);
    }
    setShowQuestionModal(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-sky-600" />
            <span>إدارة برامج التمويل والشروط الائتمانية</span>
            <span className="text-xs bg-sky-100 text-sky-900 font-bold px-3 py-1 rounded-full border border-sky-300">
              {financingPrograms.length} برنامج معتمد
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ربط برامج التمويل بشركات التقسيط، تحديد الحدود الائتمانية والمدد، واختيار الأوراق والأسئلة المطلوبة لكل برنامج لتظهر للموظف أثناء رفع الطلب.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddProgram}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-crobsa-700 hover:from-sky-700 hover:to-crobsa-800 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة برنامج تمويلي جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي برامج التمويل</span>
          <span className="text-2xl font-black text-sky-900">{financingPrograms.length}</span>
          <span className="text-[10px] text-slate-500 block">موزعة على شركات التقسيط</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">شركات التقسيط المرتبطة</span>
          <span className="text-2xl font-black text-slate-900">{companies.length}</span>
          <span className="text-[10px] text-slate-500 block">جهات تمويل استهلاكي معتمدة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">أسئلة استبيان التمويل</span>
          <span className="text-2xl font-black text-purple-900">{applicationQuestions.length}</span>
          <span className="text-[10px] text-slate-500 block">أسئلة جدارة ونشاط وميداني</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 block">أعلى حد ائتماني مسجل</span>
          <span className="text-2xl font-black text-emerald-800">
            {Math.max(...financingPrograms.map(p => p.maxAmount || 0), 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block">جنيه مصري</span>
        </div>
      </div>

      {/* Navigation Tabs (Programs vs Questionnaire Bank) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('PROGRAMS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PROGRAMS'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>برامج التمويل والورق المطلوب ({filteredPrograms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('QUESTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'QUESTIONS'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>بنك أسئلة الاستبيان الائتماني المدمج ({applicationQuestions.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCING PROGRAMS & REQUIRED PAPERS */}
      {/* ========================================================================= */}
      {activeTab === 'PROGRAMS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Company Filter */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={selectedCompanyFilter}
                  onChange={e => setSelectedCompanyFilter(e.target.value)}
                  className="text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="ALL">جميع شركات التقسيط ({companies.length})</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم البرنامج، كود التمويل، أو الشركة..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium shrink-0">
              عرض {filteredPrograms.length} من أصل {financingPrograms.length} برامج
            </span>
          </div>

          {/* Programs Grid */}
          {filteredPrograms.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Layers className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">لا توجد برامج تمويلية مطابقة</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                لم يتم العثور على أي برامج مطابقة لخيارات التصفية الحالية. يمكنك إضافة برنامج جديد بالضغط على الزر أعلاه.
              </p>
              <button
                onClick={handleOpenAddProgram}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700"
              >
                إضافة أول برنامج
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPrograms.map(prog => {
                const linkedCompany = companies.find(c => c.id === prog.companyId);
                const linkedQuestions = applicationQuestions.filter(q => 
                  prog.questionIds?.includes(q.id) || (q.programIds && q.programIds.includes(prog.id))
                );

                return (
                  <div 
                    key={prog.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Card Top: Company Badge & Program Name */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{linkedCompany?.name || prog.companyName || 'شركة تقسيط'}</span>
                            </span>
                            {prog.code && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {prog.code}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prog.active !== false ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {prog.active !== false ? 'نشط ومتاح للرفع' : 'معطل مؤقتاً'}
                            </span>
                          </div>

                          <h3 className="text-base font-black text-slate-900">
                            {prog.name}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditProgram(prog)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="تعديل البرنامج"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({
                                type: 'PROGRAM',
                                id: prog.id,
                                name: prog.name
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف البرنامج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {prog.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {prog.description}
                        </p>
                      )}

                      {/* Specs Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الحد الائتماني الأقصى</span>
                          <strong className="text-slate-900 font-black text-sm">{prog.maxAmount?.toLocaleString()} ج.م</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">المدة القصوى</span>
                          <strong className="text-slate-900 font-bold">{prog.durationMonths} شهر</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">المقدم / الرسوم الإدارية</span>
                          <strong className="text-slate-700 font-bold">
                            {prog.downPaymentPercent || 0}% مقدم / {prog.adminFeePercent || 2.5}% مصاريف
                          </strong>
                        </div>
                      </div>

                      {/* Required Documents Section */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5 text-sky-600" />
                            <span>الأوراق والمستندات المطلوبة للبرنامج ({prog.requiredDocuments?.length || 0}):</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                          {prog.requiredDocuments && prog.requiredDocuments.length > 0 ? (
                            prog.requiredDocuments.map((doc, dIdx) => (
                              <span 
                                key={dIdx} 
                                className="text-[10px] bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded-lg font-medium shadow-2xs"
                              >
                                • {doc}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">لا توجد أوراق مخصصة؛ يطبق الورق العام للشركة.</span>
                          )}
                        </div>
                      </div>

                      {/* Questionnaire Link Preview */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                            <span>الأسئلة والاستبيان الميداني المرتبط:</span>
                          </span>
                          <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-[10px]">
                            {linkedQuestions.length > 0 ? `${linkedQuestions.length} أسئلة مرتبطة` : 'أسئلة الاستبيان العام'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        يظهر تلقائياً لموظف البيع عند رفع الطلب
                      </span>
                      <button
                        onClick={() => handleOpenEditProgram(prog)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        تعديل الشروط والأوراق ←
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLICATION QUESTIONNAIRE BANK (أسئلة الاستبيان المدمجة) */}
      {/* ========================================================================= */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">بنك أسئلة الاستبيان الائتماني والنشاط</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديد الأسئلة التي يجيب عليها موظف البيع أو العميل، وربط كل سؤال ببرامج تمويل محددة أو جعله عاماً لكل البرامج.
              </p>
            </div>
            <button
              onClick={handleOpenAddQuestion}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة سؤال جديد للبنك</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicationQuestions.map(q => {
              return (
                <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          q.required ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {q.required ? 'إجباري' : 'اختياري'}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                          {q.type === 'text' ? 'نص حر' :
                           q.type === 'number' ? 'رقمي' :
                           q.type === 'select' ? 'خيارات' : 'نعم / لا'}
                        </span>
                        <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                          {q.category === 'AGRICULTURAL' || q.category === 'FARMING' ? 'نشاط زراعي' :
                           q.category === 'FINANCIAL' ? 'مالي وائتماني' :
                           q.category === 'ASSETS' ? 'أصول وضمانات' : 'عام'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{q.labelAr}</h4>
                      {q.labelEn && <p className="text-[11px] text-slate-400 font-mono">{q.labelEn}</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({
                            type: 'QUESTION',
                            id: q.id,
                            name: q.labelAr
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {q.type === 'select' && q.options && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">الخيارات المتاحة:</span>
                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <span key={i} className="text-[10px] bg-white border px-2 py-0.5 rounded text-slate-700">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {q.programIds && q.programIds.length > 0 
                        ? `مرتبط بـ (${q.programIds.length}) برامج محددة` 
                        : 'مطبق على جميع برامج التمويل العامة'}
                    </span>
                    <span className="font-mono text-[10px]">#{q.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FINANCING PROGRAM */}
      {/* ========================================================================= */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-sky-600" />
                  <span>{editingProgram ? 'تعديل بيانات برنامج التمويل' : 'إضافة برنامج تمويلي جديد'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ربط البرنامج بشركة التقسيط، ضبط السقف الائتماني، وتحديد الأوراق والأسئلة المطلوبة للعميل.
                </p>
              </div>
              <button 
                onClick={() => setShowProgramModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitProgram} className="space-y-5 text-xs max-h-[75vh] overflow-y-auto scrollbar-thin px-1">
              {/* Company & Program Basic Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-sky-600" />
                    <span>شركة التقسيط التابع لها البرنامج *</span>
                  </label>
                  <select
                    required
                    value={programForm.companyId}
                    onChange={e => setProgramForm({ ...programForm, companyId: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم البرنامج التمويلي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: برنامج التمويل الزراعي السريع"
                    value={programForm.name}
                    onChange={e => setProgramForm({ ...programForm, name: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Code, Limits & Tenure */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود البرنامج</label>
                  <input
                    type="text"
                    placeholder="PRG-AGRI"
                    value={programForm.code}
                    onChange={e => setProgramForm({ ...programForm, code: e.target.value })}
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأقصى (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={programForm.maxAmount}
                    onChange={e => setProgramForm({ ...programForm, maxAmount: Number(e.target.value) })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأدنى (ج.م)</label>
                  <input
                    type="number"
                    value={programForm.minAmount}
                    onChange={e => setProgramForm({ ...programForm, minAmount: Number(e.target.value) })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدة القصوى (شهور) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={programForm.durationMonths}
                    onChange={e => setProgramForm({ ...programForm, durationMonths: Number(e.target.value) })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Down Payment & Admin Fees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نسبة المقدم المطلوب (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={programForm.downPaymentPercent}
                    onChange={e => setProgramForm({ ...programForm, downPaymentPercent: Number(e.target.value) })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المصاريف الإدارية (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={programForm.adminFeePercent}
                    onChange={e => setProgramForm({ ...programForm, adminFeePercent: Number(e.target.value) })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة البرنامج</label>
                  <select
                    value={programForm.active ? 'YES' : 'NO'}
                    onChange={e => setProgramForm({ ...programForm, active: e.target.value === 'YES' })}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="YES">مفعل ومتاح في نماذج التقديم</option>
                    <option value="NO">معطل مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف وشروط البرنامج</label>
                <textarea
                  rows={2}
                  placeholder="اكتب شروط الاستحقاق وملاحظات الفحص الائتماني..."
                  value={programForm.description}
                  onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* ======================================================= */}
              {/* SECTION: REQUIRED DOCUMENTS PICKER (اختيار الأوراق المطلوبة) */}
              {/* ======================================================= */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-sky-600" />
                    <span>الأوراق والمستندات المطلوبة لهذا البرنامج ({programForm.requiredDocuments.length}) *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProgramForm(prev => ({ ...prev, requiredDocuments: Array.from(new Set([...prev.requiredDocuments, ...STANDARD_DOCUMENT_PRESETS])) }))}
                      className="text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded font-bold border border-sky-200"
                    >
                      تحديد جميع الأوراق
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgramForm(prev => ({ ...prev, requiredDocuments: [] }))}
                      className="text-[10px] text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-2 py-0.5 rounded font-bold border border-slate-200"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                {/* Preset Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
                  {STANDARD_DOCUMENT_PRESETS.map((presetDoc, pIdx) => {
                    const selected = programForm.requiredDocuments.includes(presetDoc);
                    return (
                      <label 
                        key={pIdx}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all text-xs ${
                          selected 
                            ? 'bg-white border-sky-300 text-sky-950 font-bold shadow-2xs' 
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleToggleDoc(presetDoc)}
                          className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span className="leading-tight">{presetDoc}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Doc Adder */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="إضافة مستند أو ورقة خاصة أخرى (مثال: بوليصة تأمين مواشي، إيصال سداد رسوم)..."
                    value={customDocInput}
                    onChange={e => setCustomDocInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDoc}
                    disabled={!customDocInput.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                  >
                    إضافة للقائمة
                  </button>
                </div>
              </div>

              {/* ======================================================= */}
              {/* SECTION: LINK QUESTIONNAIRE QUESTIONS (ربط أسئلة الاستبيان) */}
              {/* ======================================================= */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    <span>أسئلة الاستبيان الائتماني المرتبطة بهذا البرنامج ({programForm.questionIds.length})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProgramForm(prev => ({ ...prev, questionIds: applicationQuestions.map(q => q.id) }))}
                      className="text-[10px] text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded font-bold border border-purple-200"
                    >
                      تحديد كل الأسئلة
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgramForm(prev => ({ ...prev, questionIds: [] }))}
                      className="text-[10px] text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-2 py-0.5 rounded font-bold border border-slate-200"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin p-3 bg-purple-50/40 rounded-2xl border border-purple-100">
                  {applicationQuestions.map(q => {
                    const isChecked = programForm.questionIds.includes(q.id);
                    return (
                      <label 
                        key={q.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all text-xs ${
                          isChecked 
                            ? 'bg-white border-purple-300 text-purple-950 font-bold shadow-2xs' 
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleQuestionInProgram(q.id)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="leading-tight">
                          <span className="block">{q.labelAr}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({q.category === 'AGRICULTURAL' ? 'زراعي' : q.category === 'FINANCIAL' ? 'مالي' : 'عام'} • {q.required ? 'إلزامي' : 'اختياري'})
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProgramModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md"
                >
                  {editingProgram ? 'حفظ التعديلات' : 'حفظ ونشر البرنامج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT QUESTION IN QUESTIONNAIRE BANK */}
      {/* ========================================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-600" />
                <span>{editingQuestion ? 'تعديل سؤال في بنك الاستبيان' : 'إضافة سؤال استبيان جديد'}</span>
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نص السؤال (بالعربي) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ما هي المساحة المنزرعة بالفدان؟"
                  value={questionForm.labelAr}
                  onChange={e => setQuestionForm({ ...questionForm, labelAr: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نص السؤال (بالإنجليزي - اختياري)</label>
                <input
                  type="text"
                  placeholder="e.g. Cultivated Area in Feddans"
                  value={questionForm.labelEn}
                  onChange={e => setQuestionForm({ ...questionForm, labelEn: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الإجابة *</label>
                  <select
                    value={questionForm.type}
                    onChange={e => setQuestionForm({ ...questionForm, type: e.target.value as any })}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="text">نص حر</option>
                    <option value="number">رقمي</option>
                    <option value="select">قائمة خيارات متعددة</option>
                    <option value="yes_no">نعم / لا</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف *</label>
                  <select
                    value={questionForm.category}
                    onChange={e => setQuestionForm({ ...questionForm, category: e.target.value as any })}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="AGRICULTURAL">نشاط زراعي ومحاصيل</option>
                    <option value="FINANCIAL">مالي وملاءة</option>
                    <option value="ASSETS">أصول وضمانات</option>
                    <option value="GENERAL">عام</option>
                  </select>
                </div>
              </div>

              {questionForm.type === 'select' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الخيارات (خيار في كل سطر) *</label>
                  <textarea
                    rows={3}
                    placeholder="خيار 1&#10;خيار 2&#10;خيار 3"
                    value={questionForm.optionsText}
                    onChange={e => setQuestionForm({ ...questionForm, optionsText: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_checkbox"
                  checked={questionForm.required}
                  onChange={e => setQuestionForm({ ...questionForm, required: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="req_checkbox" className="font-bold text-slate-700 cursor-pointer select-none">
                  إلزام موظف البيع بالإجابة على هذا السؤال لرفع الطلب
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
                >
                  حفظ السؤال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation In-App Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                تأكيد الحذف النهائي
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من رغبتك في حذف{' '}
                <span className="font-bold text-slate-800">"{itemToDelete.name}"</span>؟
              </p>
              <p className="text-[11px] text-rose-600 mt-1">
                {itemToDelete.type === 'PROGRAM'
                  ? 'سيتم حذف البرنامج التمويلي وإلغاء ظهوره في نماذج التقديم.'
                  : 'سيتم حذف السؤال من بنك أسئلة الاستبيان.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex-1"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (itemToDelete.type === 'PROGRAM') {
                    await deleteFinancingProgram(itemToDelete.id);
                  } else {
                    await deleteApplicationQuestion(itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
                className="px-4 py-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex-1 shadow-md shadow-rose-600/20"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
