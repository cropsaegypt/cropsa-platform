import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { 
  ALL_KNOWN_INSTALLMENT_COMPANIES, 
  EGYPT_GOVERNORATES 
} from '../types';
import { 
  UserPlus, 
  X, 
  Check, 
  Building2, 
  MapPin, 
  Phone, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface SmartAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SmartAddClientModal: React.FC<SmartAddClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addClient, companies, currentUser } = useStore();

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [profession, setProfession] = useState('تاجر');
  const [companyCode, setCompanyCode] = useState('comp_01');
  const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
  const [disbursedAmount, setDisbursedAmount] = useState<number | ''>('');
  const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNatId = nationalId.trim().replace(/\D/g, '');
    if (cleanNatId.length !== 14) {
      setError('الرقم القومي يجب أن يتكون من 14 رقماً بدقة');
      return;
    }

    if (!name.trim()) {
      setError('يرجى كتابة اسم العميل كاملاً');
      return;
    }

    setIsSubmitting(true);

    const matchedComp = ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === companyCode);
    const companyTitle = matchedComp?.nameAr || companies.find(c => c.id === companyCode)?.name || 'شركة أمان للتقسيط';

    const numApproved = Number(approvedAmount) || 0;
    const numDisbursed = Number(disbursedAmount) || numApproved;

    try {
      await addClient({
        name: name.trim(),
        nationalId: cleanNatId,
        phoneNumber: phoneNumber.trim(),
        governorate,
        profession,
        totalApprovedAmount: numApproved,
        disbursedAmount: numDisbursed,
        companyName: companyTitle,
        lastFinanceDate: financeDate,
        notes: notes || 'تمت الإضافة عبر شاشة إدخال العملاء',
        manualEntry: {
          installmentCompanyId: companyCode,
          companyName: companyTitle,
          approvedAmount: numApproved,
          disbursedAmount: numDisbursed,
          approvalDate: financeDate,
          lastWithdrawalDate: financeDate,
          documentLink,
          notes
        }
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات العميل');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-cropsa-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cropsa-800/80 border border-cropsa-700 flex items-center justify-center text-sky-400 font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                إضافة عميل جديد لقاعدة بيانات كروبسا
              </h2>
              <p className="text-[11px] text-sky-200/80">
                تسجيل العميل وربط تاريخه التمويلي السابقة وسجل الشركات المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">اسم العميل بالكامل *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: أحمد عبد الله المحمدي"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الرقم القومي (14 رقماً) *</label>
              <input
                type="text"
                required
                maxLength={14}
                value={nationalId}
                onChange={e => setNationalId(e.target.value)}
                placeholder="28405101600123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم الهاتف / الواتساب</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المحافظة</label>
              <select
                value={governorate}
                onChange={e => setGovernorate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              >
                {EGYPT_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المهنة / النشاط</label>
              <input
                type="text"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                placeholder="تاجر، مزارع، موظف، مقاول..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">الشركة الممولة (سواء حالية أو سابقة)</label>
              <select
                value={companyCode}
                onChange={e => setCompanyCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              >
                <optgroup label="الشركات النشطة بالمنصة">
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="شركات التقسيط والجهات السابقة / الخارجية">
                  {ALL_KNOWN_INSTALLMENT_COMPANIES.filter(c => !c.isPlatformActive).map(c => (
                    <option key={c.code} value={c.code}>{c.nameAr}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">إجمالي التمويل المعتمد (ج.م)</label>
              <input
                type="number"
                value={approvedAmount}
                onChange={e => setApprovedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 50000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ المنصرف / المستخدم (ج.م)</label>
              <input
                type="number"
                value={disbursedAmount}
                onChange={e => setDisbursedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="اتركه فارغاً إن كان مساوياً للمعتمد"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">تاريخ / شهر الصرف والتمويل</label>
              <input
                type="date"
                value={financeDate}
                onChange={e => setFinanceDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">رابط المستندات (Drive / Cloud)</label>
              <input
                type="url"
                value={documentLink}
                onChange={e => setDocumentLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">ملاحظات وسجل العميل</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="اكتب أي تفاصيل إضافية عن نشاط العميل أو سجل السداد..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-cropsa-700 hover:bg-cropsa-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ العميل في قاعدة البيانات'}</span>
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
  );
};
