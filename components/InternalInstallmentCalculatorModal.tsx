import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  Calculator, 
  X, 
  CheckSquare, 
  Square, 
  Building2, 
  Percent, 
  Coins, 
  Calendar, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

interface InternalInstallmentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCalculation?: (calcData: {
    amount: number;
    duration: number;
    monthly: number;
    companyId: string;
    programId: string;
    financeType: 'INSTALLMENT' | 'DEFERRED';
  }) => void;
}

const COMMON_DOCS = [
  { id: 'nid', label: 'أصل وصورة بطاقة الرقم القومي سارية (المشتري + الضامن)', defaultChecked: true },
  { id: 'util', label: 'إيصال مرافق حديث لا يتجاوز 3 شهور (كهرباء / غاز / مياه)', defaultChecked: true },
  { id: 'iscore', label: 'تقرير استعلام I-Score سليم وخالٍ من القوائم السلبية', defaultChecked: false },
  { id: 'income', label: 'مفردات مرتب حديثة أو سجل تجاري سارٍ وبطاقة ضريبية', defaultChecked: false },
  { id: 'contract', label: 'عقد إيجار موثق أو عقد ملكية محل السكن والنشاط', defaultChecked: false },
  { id: 'checks', label: 'دفتر شيكات بنكية / إيصالات أمانة جاهزة للتوقيع', defaultChecked: false }
];

export const InternalInstallmentCalculatorModal: React.FC<InternalInstallmentCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyCalculation
}) => {
  const { companies, financingPrograms } = useStore();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  
  const [calcType, setCalcType] = useState<'INSTALLMENT' | 'DEFERRED'>('INSTALLMENT');
  const [requestedAmount, setRequestedAmount] = useState<number>(50000);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [deferredTerm, setDeferredTerm] = useState<3 | 4 | 5 | 6>(3);
  const [customInterestRate, setCustomInterestRate] = useState<number | ''>('');
  const [customAdminFee, setCustomAdminFee] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Checklist for required papers
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    COMMON_DOCS.forEach(d => { init[d.id] = d.defaultChecked; });
    return init;
  });

  const [copied, setCopied] = useState(false);

  // Selected company
  const company = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Available programs for company
  const availablePrograms = useMemo(() => {
    const storePrograms = (financingPrograms || []).filter(p => p.companyId === selectedCompanyId && p.active !== false);
    if (storePrograms.length > 0) return storePrograms;
    return (company?.financingPrograms || []).filter(p => p.active !== false);
  }, [financingPrograms, selectedCompanyId, company]);

  const activeProgram = availablePrograms.find(p => p.id === selectedProgramId) || availablePrograms[0];

  // Effective interest & admin rates
  const effectiveInterestRate = typeof customInterestRate === 'number' 
    ? customInterestRate 
    : (activeProgram?.interestRate ?? 18);

  const effectiveAdminFee = typeof customAdminFee === 'number' 
    ? customAdminFee 
    : (activeProgram?.adminFeePercent ?? 2.5);

  // Calculations
  const netAmount = Math.max(0, requestedAmount - downPayment);
  const discountAmount = netAmount * (discountPercent / 100);
  const financedBase = Math.max(0, netAmount - discountAmount);

  // Installment mode calculation
  const totalInterestInstallment = financedBase * (effectiveInterestRate / 100) * (durationMonths / 12);
  const adminFeeAmount = financedBase * (effectiveAdminFee / 100);
  const totalPayableInstallment = financedBase + totalInterestInstallment + adminFeeAmount;
  const monthlyInstallment = durationMonths > 0 ? Math.round(totalPayableInstallment / durationMonths) : 0;

  // Deferred mode calculations (3, 4, 5, 6 months)
  const deferredOptions = useMemo(() => {
    const terms: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
    return terms.map(term => {
      // Deferred monthly rate typically indexed or slightly subsidized for short term
      const termInterest = financedBase * (effectiveInterestRate / 100) * (term / 12);
      const totalDue = Math.round(financedBase + termInterest + adminFeeAmount);
      const monthlyEquivalent = Math.round(totalDue / term);
      return {
        term,
        interest: Math.round(termInterest),
        totalDue,
        monthlyEquivalent,
        isSelected: deferredTerm === term
      };
    });
  }, [financedBase, effectiveInterestRate, adminFeeAmount, deferredTerm]);

  const activeDeferred = deferredOptions.find(d => d.term === deferredTerm) || deferredOptions[0];

  // Document checklist completion
  const checkedDocsCount = Object.values(checkedDocs).filter(Boolean).length;
  const totalDocsCount = COMMON_DOCS.length;
  const docsCompletionPercent = Math.round((checkedDocsCount / totalDocsCount) * 100);

  const handleToggleDoc = (id: string) => {
    setCheckedDocs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = () => {
    const summaryText = `
*حسبة التمويل والتقسيط - ${company?.name || 'المنصة'}*
----------------------------------------
- المبلغ المطلوب: ${requestedAmount.toLocaleString()} ج.م
${downPayment > 0 ? `- المقدم المدفوع: ${downPayment.toLocaleString()} ج.م\n` : ''}${discountPercent > 0 ? `- خصم الشركة: ${discountPercent}%\n` : ''}- نوع السداد: ${calcType === 'INSTALLMENT' ? `تقسيط شهري على ${durationMonths} شهر` : `أجل لمدة ${deferredTerm} شهور`}
${calcType === 'INSTALLMENT' ? `- القسط الشهري: ${monthlyInstallment.toLocaleString()} ج.م / شهر\n- إجمالي المبلغ المستحق: ${Math.round(totalPayableInstallment).toLocaleString()} ج.م` : `- إجمالي المستحق بنهاية الأجل: ${activeDeferred.totalDue.toLocaleString()} ج.م\n- ما يعادل شهرياً: ${activeDeferred.monthlyEquivalent.toLocaleString()} ج.م`}
- نسبة الفائدة: ${effectiveInterestRate}%
- المصاريف الإدارية: ${effectiveAdminFee}%
----------------------------------------
حالة الأوراق: ${checkedDocsCount} من ${totalDocsCount} مستندات جاهزة.
`.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">حاسبة التقسيط والأجل الداخلية للموظفة</h2>
              <p className="text-xs text-sky-100 font-medium mt-0.5">
                حساب فوري للأقساط ومستندات العميل مع فترات الأجل (3، 4، 5، 6 شهور) وخصومات الشركات
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[82vh] overflow-y-auto">
          {/* Left Column: Form & Checklist (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Mode Selector: Installment vs Deferred */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCalcType('INSTALLMENT')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  calcType === 'INSTALLMENT'
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>نظام التقسيط الشهري المنتظم</span>
              </button>
              <button
                type="button"
                onClick={() => setCalcType('DEFERRED')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  calcType === 'DEFERRED'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>نظام البيع الآجل (3 - 6 شهور)</span>
              </button>
            </div>

            {/* 2. Company & Program Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>شركة التمويل</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={e => {
                    setSelectedCompanyId(e.target.value);
                    const progs = (financingPrograms || []).filter(p => p.companyId === e.target.value && p.active !== false);
                    if (progs.length > 0) setSelectedProgramId(progs[0].id);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>البرنامج التمويلي</span>
                </label>
                <select
                  value={selectedProgramId}
                  onChange={e => setSelectedProgramId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {availablePrograms.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.interestRate || 0}% فائدة)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Financial Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>المبلغ الإجمالي للسلعة (ج.م) *</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={requestedAmount || ''}
                  onChange={e => setRequestedAmount(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  <span>المقدم النقدي المدفوع (ج.م)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={downPayment || ''}
                  onChange={e => setDownPayment(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="0"
                />
              </div>

              {calcType === 'INSTALLMENT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>مدة التقسيط بالشهور</span>
                  </label>
                  <select
                    value={durationMonths}
                    onChange={e => setDurationMonths(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {[3, 6, 9, 12, 18, 24, 30, 36, 48, 60].map(m => (
                      <option key={m} value={m}>{m} شهر ({m >= 12 ? `${m / 12} سنة` : ''})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>فترة الأجل المحددة *</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([3, 4, 5, 6] as const).map(term => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setDeferredTerm(term)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          deferredTerm === term
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {term} شهور
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-rose-500" />
                  <span>خصم الشركة الترويجي (%)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={discountPercent || ''}
                  onChange={e => setDiscountPercent(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Interest & Fees Adjusters */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  فائدة البرنامج: <span className="text-sky-600 font-black">{effectiveInterestRate}%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`تعديل يدوي (${activeProgram?.interestRate || 18}%)`}
                  value={customInterestRate}
                  onChange={e => setCustomInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  مصاريف إدارية: <span className="text-indigo-600 font-black">{effectiveAdminFee}%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder={`تعديل يدوي (${activeProgram?.adminFeePercent || 2.5}%)`}
                  value={customAdminFee}
                  onChange={e => setCustomAdminFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* 4. Document Checklist (اعلم فيها على ورقة) */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-xs font-black text-slate-800">
                    قائمة مستندات وأوراق العميل المطلوبة (متابعة الموظفة):
                  </span>
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  docsCompletionPercent === 100 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  جاهز: {checkedDocsCount} من {totalDocsCount} ({docsCompletionPercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full transition-all duration-300 ${
                    docsCompletionPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${docsCompletionPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {COMMON_DOCS.map(doc => {
                  const isChecked = !!checkedDocs[doc.id];
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleToggleDoc(doc.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border text-right ${
                        isChecked
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{doc.label}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md ${
                        isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isChecked ? 'مستوفى ✓' : 'مطلوب'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Results & Comparisons (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Primary Calculation Result Card */}
            <div className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden ${
              calcType === 'INSTALLMENT' 
                ? 'bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800'
                : 'bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900'
            }`}>
              <div className="absolute -top-12 -left-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-wide text-white/80 uppercase">
                  {calcType === 'INSTALLMENT' ? 'القسط الشهري المستحق' : `المستحق بنظام الأجل (${deferredTerm} شهور)`}
                </span>
                <span className="text-[11px] font-black bg-white/20 px-2.5 py-1 rounded-full border border-white/20">
                  {company?.name}
                </span>
              </div>

              {calcType === 'INSTALLMENT' ? (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black tracking-tight">
                      {monthlyInstallment.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-white/80">ج.م / شهرياً</span>
                  </div>
                  <p className="text-xs text-white/70">
                    لمدة {durationMonths} شهر بفائدة سنوية {effectiveInterestRate}%
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black tracking-tight">
                      {activeDeferred.totalDue.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-white/80">ج.م دفعة واحدة</span>
                  </div>
                  <p className="text-xs text-white/70">
                    أو ما يعادل <span className="font-black text-amber-300">{activeDeferred.monthlyEquivalent.toLocaleString()} ج.م / شهر</span> لمدة {deferredTerm} شهور
                  </p>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="mt-5 pt-4 border-t border-white/20 space-y-2 text-xs">
                <div className="flex justify-between text-white/80">
                  <span>المبلغ بعد المقدم والخصم:</span>
                  <span className="font-mono font-bold">{Math.round(financedBase).toLocaleString()} ج.م</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>قيمة خصم الشركة ({discountPercent}%):</span>
                    <span className="font-mono font-bold">-{Math.round(discountAmount).toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>إجمالي أرباح التمويل:</span>
                  <span className="font-mono font-bold">
                    {calcType === 'INSTALLMENT' 
                      ? Math.round(totalInterestInstallment).toLocaleString() 
                      : activeDeferred.interest.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>المصاريف الإدارية ({effectiveAdminFee}%):</span>
                  <span className="font-mono font-bold">{Math.round(adminFeeAmount).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-white/20">
                  <span>إجمالي المبلغ المطلوب سداده:</span>
                  <span className="font-mono">
                    {calcType === 'INSTALLMENT' 
                      ? Math.round(totalPayableInstallment).toLocaleString() 
                      : activeDeferred.totalDue.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Deferred Comparison Table (3, 4, 5, 6 شهور) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  مقارنة فترات الأجل المتاحة (3 - 4 - 5 - 6 شهور):
                </span>
                <span className="text-[10px] text-slate-500 font-bold">سداد أجل</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {deferredOptions.map(opt => (
                  <button
                    key={opt.term}
                    type="button"
                    onClick={() => {
                      setCalcType('DEFERRED');
                      setDeferredTerm(opt.term);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      deferredTerm === opt.term && calcType === 'DEFERRED'
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800">{opt.term} شهور</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        أرباح {opt.interest.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {opt.totalDue.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م كلي</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                      قسط {opt.monthlyEquivalent.toLocaleString()} ج.م / شهر
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ الحسبة للواتساب بنجاح!' : 'نسخ تفاصيل الحسبة للعميل في واتساب 📋'}</span>
              </button>

              {onApplyCalculation && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyCalculation({
                      amount: financedBase,
                      duration: calcType === 'INSTALLMENT' ? durationMonths : deferredTerm,
                      monthly: calcType === 'INSTALLMENT' ? monthlyInstallment : activeDeferred.monthlyEquivalent,
                      companyId: selectedCompanyId,
                      programId: selectedProgramId,
                      financeType: calcType
                    });
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>تطبيق الحسبة وإنشاء طلب تقسيط جديد 🚀</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
