import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, Application, ApplicationStatus, Client } from '../types';
import { 
  Calculator, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Sparkles, 
  Search, 
  Clock, 
  DollarSign, 
  User, 
  Calendar, 
  ArrowRight, 
  Check, 
  HelpCircle,
  ExternalLink,
  Percent,
  Download,
  Building2,
  RefreshCw
} from 'lucide-react';

interface SmartCreditCalculatorProps {
  onBack?: () => void;
  onApplyToApplication?: (appId: string, approvedAmount: number, note: string) => Promise<void>;
  preSelectedClientId?: string;
  preSelectedAppId?: string;
}

export const SmartCreditCalculator: React.FC<SmartCreditCalculatorProps> = ({
  onBack,
  onApplyToApplication,
  preSelectedClientId,
  preSelectedAppId
}) => {
  const { 
    currentUser, 
    clients, 
    applications, 
    companies, 
    currentCompany, 
    clientRequests,
    updateApplication,
    addAuditLog 
  } = useStore();

  const isCompanyAdmin = currentUser?.role === Role.INSTALLMENT_COMPANY || 
                         currentUser?.role === Role.SUPER_ADMIN || 
                         currentUser?.role === Role.ADMIN;
  
  const companyId = currentCompany?.id || currentUser?.companyId || 'comp_01';
  const companyName = currentCompany?.name || 'شركة التقسيط المعتمدة';

  // Security Check: strictly prohibited for Branch Managers and Branch Staff
  const isBranchUser = currentUser?.role === Role.BRANCH_MANAGER || 
                       currentUser?.role === Role.COMPANY_EMPLOYEE;

  if (isBranchUser) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 shadow-sm" dir="rtl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">صلاحية محجوبة لفروع الشركة</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          حاسبة الائتمان والتقييم المتقدم مخصصة حصرياً للمدير العام لشركة التقسيط ومدير النظام (كروبسا)، وليست متاحة لمستوى الفروع.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            العودة للرئيسية
          </button>
        )}
      </div>
    );
  }

  // 1. FILTER ELIGIBLE CLIENTS:
  // Must be in the company's own database OR pre-approved and converted from Cropsa database
  const eligibleClients = useMemo(() => {
    return clients.filter(client => {
      if (!client) return false;
      // Super Admin can inspect all clients
      if (currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) return true;

      // 1. Client already in this company's database
      const inCompanyDb = client.authorizedCompanies?.includes(companyId);
      // 2. Client has applications assigned to this company
      const hasCompanyApp = applications.some(a => 
        (a.clientNationalId === client.nationalId || a.clientId === client.id) &&
        (a.assignedCompanyIds?.includes(companyId) || a.assignedCompanyIds?.includes(currentUser?.id || ''))
      );
      // 3. Client pre-approved and transferred from Cropsa central database
      const preApprovedAndTransferred = clientRequests.some(r => 
        (r.clientId === client.id || r.clientNationalId === client.nationalId) &&
        r.companyId === companyId &&
        r.status === 'APPROVED'
      );

      return inCompanyDb || hasCompanyApp || preApprovedAndTransferred;
    });
  }, [clients, applications, clientRequests, companyId, currentUser]);

  // Client Selection State
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (preSelectedClientId && eligibleClients.some(c => c.id === preSelectedClientId)) {
      return preSelectedClientId;
    }
    return eligibleClients[0]?.id || '';
  });

  const selectedClient = useMemo(() => {
    return eligibleClients.find(c => c.id === selectedClientId) || eligibleClients[0] || null;
  }, [eligibleClients, selectedClientId]);

  // Associated Application for this client (if any)
  const clientApp = useMemo(() => {
    if (!selectedClient) return null;
    if (preSelectedAppId) {
      const found = applications.find(a => a.id === preSelectedAppId);
      if (found) return found;
    }
    // Find active or recent application for this client assigned to this company
    return applications.find(a => 
      (a.clientNationalId === selectedClient.nationalId || a.clientId === selectedClient.id) &&
      (currentUser?.role === Role.SUPER_ADMIN || a.assignedCompanyIds?.includes(companyId))
    ) || applications.find(a => a.clientNationalId === selectedClient.nationalId) || null;
  }, [applications, selectedClient, preSelectedAppId, companyId, currentUser]);

  // Finance Calculator Inputs (synced with client & app)
  const [requestedAmount, setRequestedAmount] = useState<number>(() => {
    return clientApp?.requestedAmount || selectedClient?.approvedLimit || 75000;
  });

  const [durationMonths, setDurationMonths] = useState<number>(() => {
    return clientApp?.durationMonths || 12;
  });

  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => {
    return selectedClient?.monthlyIncome || 18000;
  });

  const [annualInterestRate, setAnnualInterestRate] = useState<number>(22); // 22% annual rate
  const [existingDebtObligations, setExistingDebtObligations] = useState<number>(0); // Existing installments

  // Synced when selected client changes
  React.useEffect(() => {
    if (selectedClient) {
      if (selectedClient.monthlyIncome) {
        setMonthlyIncome(selectedClient.monthlyIncome);
      }
      if (clientApp) {
        if (clientApp.requestedAmount) setRequestedAmount(clientApp.requestedAmount);
        if (clientApp.durationMonths) setDurationMonths(clientApp.durationMonths);
      }
    }
  }, [selectedClient, clientApp]);

  // Filtered client list for selector
  const searchedClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return eligibleClients;
    const q = clientSearchQuery.toLowerCase().trim();
    return eligibleClients.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.nationalId.includes(q) ||
      (c.phoneNumber && c.phoneNumber.includes(q)) ||
      c.governorate.toLowerCase().includes(q)
    );
  }, [eligibleClients, clientSearchQuery]);

  // 2. DOCUMENT CHECKLIST VERIFICATION (الورق المرفوع في الحالة نفسه):
  const uploadedDocs = clientApp?.documents || [];
  const hasAppDocLink = Boolean(clientApp?.documentLink);

  const documentChecklist = useMemo(() => {
    // Standard mandatory documents required by consumer finance regulations:
    return [
      {
        id: 'national_id',
        title: 'بطاقة الرقم القومي سارية (وجه وظهر)',
        category: 'MANDATORY',
        present: uploadedDocs.some(d => d.type === 'NATIONAL_ID' || d.name.includes('بطاقة') || d.name.includes('الرقم القومي')) || Boolean(selectedClient?.nationalId),
        weight: 30,
        note: 'إلزامية للتأكد من هوية العميل والسن القانوني وعدم وجود مانع ائتماني'
      },
      {
        id: 'utility_receipt',
        title: 'إيصال مرافق حديث (كهرباء / مياه / غاز)',
        category: 'MANDATORY',
        present: uploadedDocs.some(d => d.type === 'UTILITY_BILL' || d.name.includes('مرافق') || d.name.includes('كهرباء') || d.name.includes('إيصال')) || hasAppDocLink,
        weight: 20,
        note: 'إثبات محل الإقامة السكني الدائم للعميل'
      },
      {
        id: 'activity_proof',
        title: 'إثبات النشاط (حيازة زراعية / سجل تجاري / بطاقة ضريبية)',
        category: 'MANDATORY',
        present: uploadedDocs.some(d => d.type === 'COMMERCIAL_REG' || d.type === 'LAND_DEED' || d.name.includes('سجل') || d.name.includes('حيازة') || d.name.includes('نشاط')) || (selectedClient?.profession === 'FARMER' || selectedClient?.profession === 'MERCHANT'),
        weight: 25,
        note: 'مصدر الدخل التشغيلي والقدرة على توليد السيولة النقدية'
      },
      {
        id: 'income_proof',
        title: 'كشف حساب بنكي أو إيصال صرف / توريد محصول حديث',
        category: 'SUPPORTING',
        present: uploadedDocs.some(d => d.type === 'INCOME_PROOF' || d.type === 'TAX_CARD' || d.name.includes('كشف') || d.name.includes('صرف') || d.name.includes('دخل')) || Boolean(clientApp?.hasRecentReceipt),
        weight: 15,
        note: 'إثبات حجم المعاملات النقدية السابقة وتدفقات السداد'
      },
      {
        id: 'guarantor_form',
        title: 'إقرار وتوقيع الضامن (أو ضمانة عينية)',
        category: 'SUPPORTING',
        present: uploadedDocs.some(d => d.type === 'GUARANTOR_ID' || d.name.includes('ضامن') || d.name.includes('إقرار')),
        weight: 10,
        note: 'تغطية مخاطر التعثر للمبالغ التي تتجاوز 100,000 ج.م'
      }
    ];
  }, [uploadedDocs, hasAppDocLink, selectedClient, clientApp]);

  // Document Completeness Calculation
  const docScore = useMemo(() => {
    let score = 0;
    documentChecklist.forEach(item => {
      if (item.present) score += item.weight;
    });
    return score;
  }, [documentChecklist]);

  const missingMandatoryDocs = useMemo(() => {
    return documentChecklist.filter(d => d.category === 'MANDATORY' && !d.present);
  }, [documentChecklist]);

  // 3. CREDIT & FINANCIAL CALCULATIONS:
  const monthlyRate = (annualInterestRate / 100) / 12;
  const totalInterest = requestedAmount * (annualInterestRate / 100) * (durationMonths / 12);
  const totalRepayment = requestedAmount + totalInterest;
  const monthlyInstallment = durationMonths > 0 ? Math.round(totalRepayment / durationMonths) : 0;

  // Debt Burden Ratio (DBR)
  const totalMonthlyCommitment = monthlyInstallment + existingDebtObligations;
  const dbrPercent = monthlyIncome > 0 ? Math.round((totalMonthlyCommitment / monthlyIncome) * 100) : 100;

  // 4. ELIGIBILITY DECISION ENGINE (يعرف العميل ده ينفع ولا):
  const evaluationDecision = useMemo(() => {
    const reasons: string[] = [];
    const recommendations: string[] = [];

    let isApproved = false;
    let isConditional = false;
    let isRejected = false;

    // Check 1: Mandatory Documents
    if (missingMandatoryDocs.length > 0) {
      isRejected = true;
      reasons.push(`نقص في المستندات الإلزامية: ${missingMandatoryDocs.map(m => m.title).join('، ')}.`);
      recommendations.push('يجب استيفاء الورق المفقود في ملف الحالة أولاً قبل الاعتماد.');
    }

    // Check 2: Debt Burden Ratio (DBR)
    // FRA Consumer Finance guideline: Max DBR is generally 50%
    if (dbrPercent > 55) {
      isRejected = true;
      reasons.push(`نسبة عبء الدين مرتفعة جداً (${dbrPercent}%) وتتجاوز الحد الرقابي الأقصى (50%). القسط الشهري (${monthlyInstallment.toLocaleString()} ج.م) يلتهم أكثر من نصف الدخل (${monthlyIncome.toLocaleString()} ج.م).`);
      
      // Propose duration extension:
      const suggestedLongerMonths = durationMonths < 36 ? Math.min(36, durationMonths + 12) : 36;
      const longerInstallment = Math.round((requestedAmount * (1 + (annualInterestRate / 100) * (suggestedLongerMonths / 12))) / suggestedLongerMonths);
      const longerDbr = Math.round((longerInstallment / monthlyIncome) * 100);

      if (longerDbr <= 50) {
        recommendations.push(`تمديد مدة السداد إلى ${suggestedLongerMonths} شهراً لتخفيض القسط إلى ${longerInstallment.toLocaleString()} ج.م (DBR: ${longerDbr}%).`);
      } else {
        const affordableAmount = Math.round((monthlyIncome * 0.45 * durationMonths) / (1 + (annualInterestRate / 100) * (durationMonths / 12)));
        recommendations.push(`تخفيض مبلغ التمويل المطلوب إلى ${affordableAmount.toLocaleString()} ج.م ليتناسب مع دخل العميل.`);
      }
    } else if (dbrPercent > 42 && dbrPercent <= 55) {
      if (!isRejected) {
        isConditional = true;
        reasons.push(`نسبة عبء الدين مقبولة ولكنها قريبة من السقف الائتماني (${dbrPercent}% من الدخل الشهري).`);
        recommendations.push('طلب ضامن ذو دخل ثابت (موظف أو صاحب نشاط) لتغطية المخاطر.');
        recommendations.push('الحصول على شيكات بنكية أو كمبيالات ضمان على إجمالي الأقساط.');
      }
    } else {
      if (!isRejected) {
        isApproved = true;
        reasons.push(`نسبة عبء الدين ممتازة ومريحة جداً (${dbrPercent}%) وتترك للعميل فائضاً نقدياً كافياً.`);
        reasons.push(`الملف الورقي مستوفى بنسبة ${docScore}%.`);
      }
    }

    // Max Suggested Credit Limit
    const maxSafeMonthly = monthlyIncome * 0.45;
    const maxCreditLimit = Math.round((maxSafeMonthly * durationMonths) / (1 + (annualInterestRate / 100) * (durationMonths / 12)));

    let status: 'APPROVED' | 'CONDITIONAL' | 'REJECTED' = 'APPROVED';
    if (isRejected) status = 'REJECTED';
    else if (isConditional) status = 'CONDITIONAL';

    return {
      status,
      reasons,
      recommendations,
      maxCreditLimit: Math.max(20000, maxCreditLimit),
      docScore
    };
  }, [dbrPercent, missingMandatoryDocs, monthlyInstallment, monthlyIncome, durationMonths, requestedAmount, annualInterestRate, docScore]);

  // Action: Apply Decision to Application
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  const handleApplyDecision = async () => {
    if (!clientApp) return;
    setIsApplying(true);
    setApplySuccessMessage(null);

    try {
      const newStatus = evaluationDecision.status === 'APPROVED' 
        ? ApplicationStatus.APPROVED 
        : evaluationDecision.status === 'CONDITIONAL' 
        ? ApplicationStatus.PAPER_REVIEW 
        : ApplicationStatus.REJECTED;

      const reviewNote = `تقييم حاسبة الائتمان الذكية (${companyName}): ` +
        `النتيجة: ${evaluationDecision.status === 'APPROVED' ? 'موافق عليه' : evaluationDecision.status === 'CONDITIONAL' ? 'موافقة مشروطة بضمانات' : 'غير مؤهل'}. ` +
        `المدة: ${durationMonths} شهر، القسط: ${monthlyInstallment.toLocaleString()} ج.م، نسبة عبء الدين: ${dbrPercent}%، استيفاء الأوراق: ${docScore}%. ` +
        evaluationDecision.reasons.join(' ');

      if (onApplyToApplication) {
        await onApplyToApplication(clientApp.id, evaluationDecision.status === 'APPROVED' ? requestedAmount : (clientApp.approvedAmount || 0), reviewNote);
      } else {
        await updateApplication(clientApp.id, {
          status: newStatus,
          approvedAmount: evaluationDecision.status === 'APPROVED' ? requestedAmount : clientApp.approvedAmount,
          reviewNote
        });
      }

      addAuditLog(
        'CREDIT_CALCULATOR_EVALUATION', 
        `Evaluated client ${selectedClient?.name} for amount ${requestedAmount} over ${durationMonths} months: ${evaluationDecision.status}`, 
        clientApp.id
      );

      setApplySuccessMessage('تم تطبيق نتيجة التقييم واعتمادها على ملف الطلب بنجاح.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-cropsa-800 text-white flex items-center justify-center shadow-md">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                حاسبة الائتمان والتقييم الذكي للجدارة
              </h1>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                خاص بإدارة شركة التقسيط
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              التحقق الفوري من أهلية العميل بناءً على مدة التمويل والأوراق والمستندات المرفوعة في ملف الحالة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-left md:text-right px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 block font-semibold">الجهة المقيمة:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              {companyName}
            </span>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>رجوع</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Client Selector & Docs (Right) + Financial Simulation & Output (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Client Selection & Uploaded Documents Verification (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* STEP 1: Client Selector Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                <span>اختيار العميل من قاعدة البيانات المعتمدة</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                {eligibleClients.length} عميل متاح
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تتيح الحاسبة دراسة العملاء المسجلين في قاعدة بيانات شركتك أو العملاء الذين تمت الموافقة المسبقة عليهم وتحويلهم من قاعدة كروبسا المركزية.
            </p>

            {/* Client Search Field */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={clientSearchQuery}
                onChange={e => setClientSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الرقم القومي، أو الهاتف..."
                className="w-full text-xs border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/60"
              />
            </div>

            {/* Client Cards Dropdown / List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {searchedClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  لا يوجد عملاء يطابقون البحث في قاعدة بيانات شركتك
                </div>
              ) : (
                searchedClients.map(c => {
                  const isSelected = selectedClientId === c.id;
                  const isPreApproved = clientRequests.some(r => r.clientId === c.id && r.status === 'APPROVED');
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                          {isPreApproved ? (
                            <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded-md">
                              محول من كروبسا
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                              بقاعدة الشركة
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{c.nationalId}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-sans">{c.governorate}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left">
                        <span className="text-[10px] text-slate-400 block font-semibold">الدخل:</span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          {(c.monthlyIncome || 18000).toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Client Summary Card */}
            {selectedClient && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">الملف المختار للدراسة:</span>
                  <span className="text-[11px] text-emerald-800 font-black bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
                    ID: {selectedClient.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">المهنة والنشاط:</span>
                    <strong className="text-slate-900 font-bold">
                      {selectedClient.profession === 'FARMER' ? 'مزارع / حيازة زراعية' :
                       selectedClient.profession === 'MERCHANT' ? 'تاجر / سجل تجاري' :
                       selectedClient.profession === 'EQUIPMENT_OWNER' ? 'مالك معدات وآلات' : 'موظف / نشاط حر'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">الطلب المرتبط:</span>
                    <strong className="text-sky-700 font-bold font-mono">
                      {clientApp ? clientApp.id : 'لا يوجد طلب حالي'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: CASE UPLOADED DOCUMENTS VERIFICATION (الورق المرفوع في الحالة نفسه) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <span>فحص الورق والمستندات المرفوعة في الحالة</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  التحقق من كفاية وصلاحية الأوراق المقدمة في ملف الطلب
                </p>
              </div>

              <div className="text-center px-3 py-1 rounded-xl bg-slate-100 font-bold">
                <span className="text-[10px] text-slate-400 block">اكتمال الورق</span>
                <span className={`text-xs font-black ${docScore >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {docScore}%
                </span>
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div className="space-y-2.5">
              {documentChecklist.map(doc => (
                <div 
                  key={doc.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    doc.present 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : doc.category === 'MANDATORY' 
                      ? 'border-rose-200 bg-rose-50/40' 
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {doc.present ? (
                        <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                          doc.category === 'MANDATORY' ? 'bg-rose-600 text-white' : 'bg-slate-300 text-white'
                        }`}>
                          <XCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                        {doc.category === 'MANDATORY' && (
                          <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-1.5 py-0.2 rounded-md">
                            إلزامي
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {doc.note}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-left">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                      doc.present 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : doc.category === 'MANDATORY' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {doc.present ? 'مرفوع ومستوفى' : 'غير مرفوع'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Warning if Missing */}
            {missingMandatoryDocs.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>تنبيه ائتماني: مستندات إلزامية ناقصة!</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  الملف ينقصه {missingMandatoryDocs.length} مستند إلزامي. لا يمكن منح موافقة نهائية بدون استيفاء هذه الأوراق في الحالة.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Financial Terms Simulator & Decision Verdict (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 3: Financial Parameters Simulator */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="h-5 w-5 text-emerald-600" />
                <span>محاكي شروط التمويل والمدة (Finance Terms)</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                تعديل المدة والمبلغ لحساب القسط فورياً
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Requested Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  مبلغ التمويل المطلوب (ج.م):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(Number(e.target.value))}
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>الحد الأدنى: 10,000</span>
                  <span>الحد الأقصى: 500,000</span>
                </div>
              </div>

              {/* Verified Monthly Income */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  الدخل الشهري المثبت للعميل (ج.م):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="3000"
                    max="500000"
                    step="1000"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(Number(e.target.value))}
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">ج.م</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>من واقع السجل/الحيازة/كشف الحساب</span>
                </div>
              </div>
            </div>

            {/* DURATION / TERM SELECTOR (بناءً على المدة) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  مدة التمويل المطلوبة (فترة السداد بالأشهر):
                </label>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-mono">
                  {durationMonths} شهراً ({Math.round((durationMonths / 12) * 10) / 10} سنة)
                </span>
              </div>

              {/* Duration Buttons Presets */}
              <div className="grid grid-cols-5 gap-2">
                {[6, 12, 18, 24, 36].map(months => {
                  const isSelected = durationMonths === months;
                  return (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setDurationMonths(months)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all border ${
                        isSelected 
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{months} شهر</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Rates (Interest & Existing Debts) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  معدل الفائدة السنوي (%):
                </label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  step="0.5"
                  value={annualInterestRate}
                  onChange={e => setAnnualInterestRate(Number(e.target.value))}
                  className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  أقساط والتزامات شهرية سابقة على العميل (إن وجدت):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="500"
                  value={existingDebtObligations}
                  onChange={e => setExistingDebtObligations(Number(e.target.value))}
                  placeholder="0 ج.م"
                  className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Financial Summary Ribbon */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900 text-white rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 block">القسط الشهري التقديري</span>
                <span className="text-lg font-black text-white font-mono">
                  {monthlyInstallment.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mr-1">ج.م/شهر</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">نسبة عبء الدين (DBR)</span>
                <span className={`text-lg font-black font-mono ${
                  dbrPercent <= 42 ? 'text-emerald-400' : dbrPercent <= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {dbrPercent}%
                </span>
                <span className="text-[10px] text-slate-400 mr-1">من الدخل</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">إجمالي السداد مع الفائدة</span>
                <span className="text-lg font-black text-white font-mono">
                  {totalRepayment.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
              </div>
            </div>
          </div>

          {/* STEP 4: CREDIT EVALUATION VERDICT CARD (يعرف العميل ده ينفع ولا) */}
          <div className={`rounded-3xl p-6 border shadow-lg space-y-5 transition-all ${
            evaluationDecision.status === 'APPROVED' 
              ? 'bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 text-white border-emerald-500/40' 
              : evaluationDecision.status === 'CONDITIONAL'
              ? 'bg-gradient-to-br from-amber-950 via-slate-950 to-amber-950 text-white border-amber-500/40'
              : 'bg-gradient-to-br from-rose-950 via-slate-950 to-rose-950 text-white border-rose-500/40'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] text-slate-300 font-semibold block">
                  نتيجة التقييم النهائي لطلب التمويل:
                </span>
                <h3 className="text-2xl font-black tracking-tight mt-0.5 flex items-center gap-2">
                  {evaluationDecision.status === 'APPROVED' && (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">مؤهل للتمويل (موافقة معتمدة) ✓</span>
                    </>
                  )}
                  {evaluationDecision.status === 'CONDITIONAL' && (
                    <>
                      <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
                      <span className="text-amber-300">مؤهل بشروط وضمانات إضافية</span>
                    </>
                  )}
                  {evaluationDecision.status === 'REJECTED' && (
                    <>
                      <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                      <span className="text-rose-300">غير مؤهل للتمويل حالياً (مرفوض)</span>
                    </>
                  )}
                </h3>
              </div>

              {/* Safe Limit Badge */}
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 text-left sm:text-right">
                <span className="text-[10px] text-slate-300 block">أقصى حد ائتماني آمن:</span>
                <span className="text-base font-black text-white font-mono">
                  {evaluationDecision.maxCreditLimit.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Reasons & Evaluation Narrative */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <strong className="text-slate-300 block mb-1">أسباب ومبررات التقييم:</strong>
                <ul className="space-y-1.5">
                  {evaluationDecision.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {evaluationDecision.recommendations.length > 0 && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                  <strong className="text-amber-300 block mb-1">توصيات موجه الائتمان:</strong>
                  <ul className="space-y-1">
                    {evaluationDecision.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-200">
                        <span className="text-amber-400 font-bold shrink-0">←</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions Toolbar */}
            {applySuccessMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{applySuccessMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {clientApp && (
                <button
                  type="button"
                  onClick={handleApplyDecision}
                  disabled={isApplying}
                  className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-cropsa-700 hover:from-emerald-500 hover:to-cropsa-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isApplying ? 'جاري الاعتماد...' : 'اعتماد التقييم وتحديث حالة الطلب في المنظومة'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full sm:w-auto px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>طباعة / تصدير التقرير</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
