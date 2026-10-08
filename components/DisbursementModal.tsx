import React, { useState } from 'react';
import { Application, Role, InstallmentCompanyStaffRole } from '../types';
import { useStore } from '../context/Store';
import { 
  X, 
  Wallet, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Building2, 
  User, 
  Calendar, 
  FileText,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

interface DisbursementModalProps {
  application: Application;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DisbursementModal: React.FC<DisbursementModalProps> = ({
  application,
  onClose,
  onSuccess
}) => {
  const { currentUser, updateApplication, clients, addNotification } = useStore();

  const approvedLimit = application.approvedAmount || application.requestedAmount || 0;
  const previouslyUsed = application.usedAmount || 0;
  const remainingAvailable = Math.max(0, approvedLimit - previouslyUsed);

  // Form State
  const [disburseAmount, setDisburseAmount] = useState<number>(remainingAvailable);
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CHECK' | 'CASH' | 'WALLET'>('BANK_TRANSFER');
  const [disbursementNotes, setDisbursementNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Determine user role badge
  const isBranchManager = currentUser?.role === Role.BRANCH_MANAGER || 
                          currentUser?.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER;
  const roleLabel = isBranchManager 
    ? `مدير الفرع (${currentUser?.branchName || application.assignedBranchName || 'الفرع المعتمد'})` 
    : 'الإدارة التنفيذية لشركة التقسيط';

  const handleQuickPercent = (percent: number) => {
    const val = Math.round((remainingAvailable * percent) / 100);
    setDisburseAmount(val);
  };

  const handleConfirmDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (disburseAmount <= 0) {
      setErrorMessage('يرجى تحديد مبلغ صالح للصرف أكبر من صفر');
      return;
    }

    if (disburseAmount > remainingAvailable) {
      setErrorMessage(`المبلغ المطلوب صرفه (${disburseAmount.toLocaleString()} ج.م) يتجاوز الحد المتبقي المتاح (${remainingAvailable.toLocaleString()} ج.م)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newUsedAmount = previouslyUsed + disburseAmount;
      const isFullyDisbursed = newUsedAmount >= approvedLimit;
      const nowStr = new Date().toISOString();

      const methodNames: Record<string, string> = {
        BANK_TRANSFER: 'تحويل بنكي / حساب IBAN',
        CHECK: 'شيك بنكي مقبول الدفع',
        CASH: 'صرف نقدي من خزينة الفرع',
        WALLET: 'محفظة إلكترونية'
      };

      const histItem = {
        action: 'AMOUNT_TRANSFERRED',
        timestamp: nowStr,
        performedBy: currentUser?.id || 'STAFF',
        performedByName: `${currentUser?.name} [${roleLabel}]`,
        details: `تم صرف مبلغ ${disburseAmount.toLocaleString()} ج.م للعميل بواسطة [${currentUser?.name} - ${roleLabel}] - طريقة الدفع: ${methodNames[paymentMethod]}${receiptNumber.trim() ? ` - سند/إيصال رقم: ${receiptNumber.trim()}` : ''} - إجمالي المصروف: ${newUsedAmount.toLocaleString()} ج.م من أصل ${approvedLimit.toLocaleString()} ج.م${disbursementNotes.trim() ? ` - ملاحظات: ${disbursementNotes.trim()}` : ''}`
      };

      await updateApplication(application.id, {
        usedAmount: newUsedAmount,
        status: isFullyDisbursed ? ('AMOUNT_TRANSFERRED' as any) : application.status,
        history: [histItem, ...(application.history || [])]
      });

      // Notification to submitter / salesperson
      if (application.submittedBy) {
        addNotification(
          application.submittedBy,
          `تم صرف مبلغ ${disburseAmount.toLocaleString()} ج.م لطلب العميل ${application.clientName} بواسطة ${currentUser?.name} (${roleLabel})`,
          'SUCCESS',
          application.id,
          undefined,
          'APPLICATION'
        );
      }

      setSuccessMessage(`تم تسجيل صرف مبلغ ${disburseAmount.toLocaleString()} ج.م بنجاح!`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to disburse amount:', err);
      setErrorMessage('حدث خطأ أثناء تسجيل عملية الصرف');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
              <Wallet className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>صرف التمويل وتسجيل المبلغ المصروف</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Funds Payout
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تنفيذ وصرف التمويل للعميل من قبل الإدارة أو مدير الفرع المعتمد
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Client & Application Summary Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{application.clientName}</span>
              <span className="font-mono text-slate-500 text-[11px]">({application.clientNationalId || application.id})</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
              {application.profession || 'عميل معتمد'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              الفرع المسؤول: <strong className="text-slate-800">{application.assignedBranchName || 'الفرع الرئيسي'}</strong>
            </span>
            <span className="font-sans">
              المحافظة: <strong className="text-slate-800">{application.governorate || 'القاهرة'}</strong>
            </span>
          </div>

          {/* Officer in Charge */}
          <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-emerald-600" />
              المسؤول عن تسجيل الصرف:
            </span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {currentUser?.name} • {roleLabel}
            </span>
          </div>
        </div>

        {/* Financial Balances Breakdown */}
        <div className="grid grid-cols-3 gap-2.5 p-4 bg-emerald-950 text-white border-b border-emerald-900 text-center font-mono">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-300 block font-sans">المبلغ المعتمد</span>
            <span className="text-sm font-black text-white mt-0.5 block">
              {approvedLimit.toLocaleString()} ج.م
            </span>
          </div>

          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-300 block font-sans">المصروف سابقاً</span>
            <span className="text-sm font-black text-amber-300 mt-0.5 block">
              {previouslyUsed.toLocaleString()} ج.م
            </span>
          </div>

          <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-400/30">
            <span className="text-[10px] text-emerald-300 block font-sans">المتبقي المتاح للصرف</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block">
              {remainingAvailable.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* Form Body */}
        {successMessage ? (
          <div className="p-8 text-center space-y-3 my-auto">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{successMessage}</h4>
            <p className="text-xs text-slate-500">تم تسجيل القيد المالي في سجل المعاملات وتحديث الرصيد التمويلي للعميل فوراً.</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmDisbursement} className="p-5 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Percentage Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  المبلغ المطلوب صرفه حالياً (ج.م) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(100)}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors"
                  >
                    صرف كامل المتبقي (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(50)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    50%
                  </button>
                </div>
              </div>

              <div className="relative">
                <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                <input
                  type="number"
                  min={1}
                  max={remainingAvailable}
                  required
                  value={disburseAmount || ''}
                  onChange={e => setDisburseAmount(Number(e.target.value))}
                  placeholder="أدخل المبلغ المصروف..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-16 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ج.م
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                طريقة وآلية الصرف
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'BANK_TRANSFER', label: 'تحويل بنكي' },
                  { id: 'CHECK', label: 'شيك بنكي' },
                  { id: 'CASH', label: 'خزينة الفرع' },
                  { id: 'WALLET', label: 'محفظة' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number (Check / Transfer order / Receipt) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رقم إيصال الصرف / الشيك / أمر التحويل
              </label>
              <input
                type="text"
                placeholder="مثال: CHK-94021 أو TRF-2024-0012"
                value={receiptNumber}
                onChange={e => setReceiptNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                ملاحظات الصرف والبيان المالي (اختياري)
              </label>
              <textarea
                rows={2}
                placeholder="مثال: تم الصرف للعميل بموجب توقيع السندات والشيكات بحضور مسؤول الائتمان..."
                value={disbursementNotes}
                onChange={e => setDisbursementNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || disburseAmount <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>{isSubmitting ? 'جاري الصرف والتسجيل...' : `تأكيد صرف ${disburseAmount.toLocaleString()} ج.م`}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
