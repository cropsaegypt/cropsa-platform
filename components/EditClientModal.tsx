import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Client, EGYPT_GOVERNORATES } from '../types';
import { 
  X, 
  Save, 
  User, 
  Phone, 
  CreditCard, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ client, isOpen, onClose }) => {
  const { updateClient } = useStore();

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [profession, setProfession] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [disbursedAmount, setDisbursedAmount] = useState<number>(0);
  const [creditRating, setCreditRating] = useState('A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setNationalId(client.nationalId || '');
      setPhoneNumber(client.phoneNumber || '');
      setGovernorate(client.governorate || 'القاهرة');
      setProfession(client.profession || '');
      setApprovedAmount(client.totalApprovedAmount || client.manualEntry?.approvedAmount || 0);
      setDisbursedAmount(client.disbursedAmount || client.manualEntry?.disbursedAmount || 0);
      setCreditRating(String(client.creditRating || 'A'));
      setError('');
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (nationalId.length !== 14) {
      setError('الرقم القومي يجب أن يتكون من 14 رقماً');
      return;
    }

    setLoading(true);
    try {
      await updateClient(client.id, {
        name: name.trim(),
        nationalId: nationalId.trim(),
        phoneNumber: phoneNumber.trim(),
        governorate,
        profession: profession.trim(),
        totalApprovedAmount: Number(approvedAmount) || 0,
        disbursedAmount: Number(disbursedAmount) || 0,
        creditRating
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">تعديل بيانات العميل</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">معرف العميل: {client.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>اسم العميل الرباعي</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="محمد أحمد عبد الرحمن..."
                />
                <User className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* National ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>الرقم القومي (14 رقم)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="2980101..."
                />
                <CreditCard className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>رقم الهاتف</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="01012345678"
                />
                <Phone className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Governorate */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">المحافظة</label>
              <div className="relative">
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                >
                  {EGYPT_GOVERNORATES.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
                <MapPin className="h-4 w-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Profession */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">المهنة أو النشاط</label>
              <div className="relative">
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  placeholder="تاجر تجزئة / مهندس زراعي..."
                />
                <Briefcase className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Approved Limit */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">الحد الائتماني المعتمد (ج.م)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <DollarSign className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Disbursed Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">المبلغ المنصرف (ج.م)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={disbursedAmount}
                  onChange={(e) => setDisbursedAmount(Number(e.target.value))}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <DollarSign className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Credit Rating */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">التقييم الائتماني</label>
              <select
                value={creditRating}
                onChange={(e) => setCreditRating(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
              >
                <option value="A+">A+ (ممتاز جداً)</option>
                <option value="A">A (ممتاز)</option>
                <option value="B">B (جيد جداً)</option>
                <option value="C">C (متوسط)</option>
                <option value="D">D (مرتفع المخاطر)</option>
              </select>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
