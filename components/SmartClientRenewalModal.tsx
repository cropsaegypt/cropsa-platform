import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  Client, 
  Application, 
  RenewalAiAnalysisResult, 
  ALL_KNOWN_INSTALLMENT_COMPANIES 
} from '../types';
import { runClientRenewalAiAnalysis } from '../services/gemini';
import { 
  RefreshCw, 
  X, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface SmartClientRenewalModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SmartClientRenewalModal: React.FC<SmartClientRenewalModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { applications, companies, renewInstallment, currentUser } = useStore();

  const clientApps = useMemo(() => {
    return applications.filter(a => a.clientNationalId === client.nationalId);
  }, [applications, client.nationalId]);

  // Calculate elapsed time from last finance
  const lastFinanceDateStr = client.lastFinanceDate || client.manualEntry?.lastWithdrawalDate || client.manualEntry?.approvalDate || client.addedAt;
  const daysElapsed = Math.max(1, Math.floor((Date.now() - new Date(lastFinanceDateStr).getTime()) / (1000 * 60 * 60 * 24)));
  const monthsElapsed = Math.max(1, Math.floor(daysElapsed / 30));
  const isEligibleByTime = daysElapsed >= 90;

  // Form states
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('comp_01');
  const [customCompanyName, setCustomCompanyName] = useState<string>('');
  const [requestedAmount, setRequestedAmount] = useState<number>(
    client.totalApprovedAmount ? Math.round(client.totalApprovedAmount * 1.3) : 50000
  );
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [renewalNotes, setRenewalNotes] = useState<string>('');

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<RenewalAiAnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  if (!isOpen) return null;

  // Companies list (active + historical)
  const availableCompanies = companies.map(c => ({ id: c.id, name: c.name }));

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const result = await runClientRenewalAiAnalysis({
        client,
        previousApps: clientApps,
        requestedAmount: requestedAmount > 0 ? requestedAmount : undefined,
        selectedCompanyId,
        availableCompanies
      });
      setAiResult(result);
    } catch (e: any) {
      console.warn('AI analysis error:', e);
      setFeedback({ type: 'ERROR', text: 'تعذر اكتمال التحليل الآلي، يرجى المحاولة لاحقاً.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAiRecommendations = () => {
    if (!aiResult) return;
    setRequestedAmount(aiResult.recommendedAmount);
    setDurationMonths(aiResult.recommendedDurationMonths || 12);
    if (aiResult.bestCompanyId) {
      setSelectedCompanyId(aiResult.bestCompanyId);
      setCustomCompanyName(aiResult.bestCompanyName);
    }
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedAmount <= 0) {
      setFeedback({ type: 'ERROR', text: 'يرجى إدخال مبلغ تجديد صالح' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const targetCompanyName = customCompanyName || 
      companies.find(c => c.id === selectedCompanyId)?.name || 
      ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === selectedCompanyId)?.nameAr || 
      'شركة أمان للتمويل والتقسيط';

    try {
      await renewInstallment(client.id, requestedAmount, selectedCompanyId, {
        companyName: targetCompanyName,
        aiAnalysis: aiResult,
        notes: renewalNotes,
        durationMonths
      });

      setFeedback({
        type: 'SUCCESS',
        text: `تم إنشاء وتوجيه طلب تجديد التمويل بنجاح بمبلغ ${requestedAmount.toLocaleString()} ج.م!`
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1300);
    } catch (err: any) {
      setFeedback({ type: 'ERROR', text: err.message || 'حدث خطأ أثناء إرسال طلب التجديد' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-cropsa-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cropsa-800/80 border border-cropsa-700 flex items-center justify-center text-sky-400 font-bold">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  تجديد التمويل الذكي واختيار الشركة
                </h2>
                {isEligibleByTime ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    مؤهل للتجديد (مر {monthsElapsed} أشهر)
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                    مر {monthsElapsed} شهر ({daysElapsed} يوماً)
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                العميل: <strong className="text-white">{client.name}</strong> • الرقم القومي: {client.nationalId} • {client.governorate || 'القاهرة'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {feedback && (
            <div className={`p-4 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
              feedback.type === 'SUCCESS' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedback.type === 'SUCCESS' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Quick Client Portfolio Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">التمويل السابق المعتمد</span>
              <span className="font-bold text-slate-900 font-mono text-sm mt-0.5 block">
                {(client.totalApprovedAmount || client.manualEntry?.approvedAmount || 0).toLocaleString()} ج.م
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">الشركة الممولة السابقة</span>
              <span className="font-bold text-slate-800 mt-0.5 block truncate">
                {client.companyName || client.manualEntry?.companyName || 'شركة أمان للتقسيط'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">تاريخ آخر معاملة</span>
              <span className="font-mono text-slate-700 mt-0.5 block" dir="ltr">
                {lastFinanceDateStr ? new Date(lastFinanceDateStr).toLocaleDateString('ar-EG') : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">الفترة المنقضية</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">
                {monthsElapsed} أشهر ({daysElapsed} يوم)
              </span>
            </div>
          </div>

          {/* AI Analysis Trigger Bar */}
          <div className="bg-linear-to-r from-purple-50 via-sky-50 to-emerald-50 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  دراسة الأهلية وصياغة قصة العميل بالذكاء الاصطناعي (Gemini AI)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  تحليل سلوك السداد، حساب السقف التمويلي المقترح، ومطابقة أفضل شركة تقسيط مناسبة لقطاعه
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {isAnalyzing ? 'جاري الفحص والتحليل...' : 'تشغيل تحليل الذكاء الاصطناعي'}
            </button>
          </div>

          {/* AI Result Card */}
          {aiResult && (
            <div className="bg-purple-950/5 border border-purple-200 rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex flex-col items-center justify-center font-bold text-sm">
                    <span>{aiResult.score}</span>
                    <span className="text-[8px] opacity-80">/ 100</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">مؤشر الجدارة الائتمانية للتجديد</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        aiResult.riskTier === 'LOW' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : aiResult.riskTier === 'MODERATE' 
                            ? 'bg-sky-100 text-sky-800' 
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        مخاطر: {aiResult.riskTier === 'LOW' ? 'منخفضة' : aiResult.riskTier === 'MODERATE' ? 'معتدلة' : 'مرتفعة'}
                      </span>
                    </div>
                    <p className="text-xs text-purple-900 font-bold mt-0.5">
                      السقف التمويلي المقترح: <span className="font-mono text-emerald-700 text-sm">{aiResult.recommendedAmount.toLocaleString()} ج.م</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyAiRecommendations}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  تطبيق التوصيات في النموذج
                </button>
              </div>

              {/* Best Company Match */}
              <div className="bg-white p-3.5 rounded-2xl border border-purple-100 flex items-start gap-2.5">
                <Building2 className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    الشركة الأنسب الموصى بها: <span className="text-purple-700">{aiResult.bestCompanyName}</span>
                  </p>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    {aiResult.companyMatchingReason}
                  </p>
                </div>
              </div>

              {/* AI Narrative Story */}
              <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  <span>قصة العميل الائتمانية والتحليل الشامل:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100 font-sans">
                  {aiResult.clientStory}
                </p>
              </div>

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                  <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> نقاط القوة والانتظام:
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    {aiResult.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-600">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-100">
                  <p className="font-bold text-sky-900 mb-1 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-sky-600" /> التوصيات التنفيذية:
                  </p>
                  <ul className="space-y-1 text-slate-700 text-[11px]">
                    {aiResult.recommendations.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-sky-600">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Renewal Form */}
          <form onSubmit={handleSubmitRenewal} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Select Company (Active or Historical) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>الشركة التمويلية الموجه إليها الطلب:</span>
                  <span className="text-[10px] text-purple-700">يمكنك اختيار أي شركة</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={e => {
                    setSelectedCompanyId(e.target.value);
                    const found = ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === e.target.value);
                    if (found) {
                      setCustomCompanyName(found.nameAr);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cropsa-500 focus:outline-none"
                >
                  <optgroup label="الشركات النشطة على المنصة حالياً">
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="شركات التقسيط والجهات السابقة / الخارجية">
                    {ALL_KNOWN_INSTALLMENT_COMPANIES.filter(c => !c.isPlatformActive).map(c => (
                      <option key={c.code} value={c.code}>
                        {c.nameAr}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Requested Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مبلغ التجديد المطلوب (ج.م):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={5000}
                    step={1000}
                    value={requestedAmount || ''}
                    onChange={e => setRequestedAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pr-8 text-xs font-bold text-slate-900 font-mono focus:ring-2 focus:ring-cropsa-500 focus:outline-none"
                    placeholder="مثال: 75000"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Duration Months */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  مدة التجديد المقترحة:
                </label>
                <select
                  value={durationMonths}
                  onChange={e => setDurationMonths(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cropsa-500 focus:outline-none"
                >
                  <option value={6}>6 أشهر</option>
                  <option value={12}>12 شهراً (سنة)</option>
                  <option value={18}>18 شهراً</option>
                  <option value={24}>24 شهراً (سنتان)</option>
                  <option value={36}>36 شهراً (3 سنوات)</option>
                </select>
              </div>

              {/* Purpose / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات وموجبات التجديد:
                </label>
                <input
                  type="text"
                  value={renewalNotes}
                  onChange={e => setRenewalNotes(e.target.value)}
                  placeholder="مثال: تجديد تمويل بضائع بعد التزام 100% في الدورة السابقة"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-cropsa-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-cropsa-700 hover:bg-cropsa-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'جاري إنشاء طلب التجديد...' : 'تأكيد إرسال طلب التجديد'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                إلغاء
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
