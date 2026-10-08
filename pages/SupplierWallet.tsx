import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { ApplicationStatus, Role } from '../types';
import { Wallet, TrendingDown, Users, CreditCard, DollarSign } from 'lucide-react';

export const SupplierWallet: React.FC = () => {
  const { currentUser, applications, requestWithdrawal } = useStore();
  const [withdrawalModal, setWithdrawalModal] = useState<{ appId: string; maxAmount: number; clientName: string } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');

  if (!currentUser || currentUser.role !== Role.SUPPLIER) return <div>Access Denied</div>;

  // Calculate Customer Wallet (Sum of available funds from approved apps)
  const myApprovedApps = applications.filter(
    app => app.submittedBy === currentUser.id && app.status === ApplicationStatus.APPROVED
  );

  const customerWalletTotal = myApprovedApps.reduce((acc, app) => acc + ((app.approvedAmount || 0) - app.usedAmount), 0);

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawalModal) {
      requestWithdrawal(withdrawalModal.appId, Number(withdrawAmount), withdrawNote);
      setWithdrawalModal(null);
      setWithdrawAmount('');
      setWithdrawNote('');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">المحفظة المالية</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cropsa Wallet */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm font-medium">محفظة كروبسا (حد ائتماني)</p>
              <h3 className="text-3xl font-bold mt-1">{currentUser.walletBalance?.toLocaleString() || 0} ج.م</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-300" />
            </div>
          </div>
          <p className="text-xs text-slate-400 bg-slate-800/50 inline-block px-3 py-1 rounded-full border border-slate-700">
            رصيد متاح لإضافة طلبات جديدة
          </p>
        </div>

        {/* Customer Wallet */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">محفظة العملاء (أرصدة متاحة)</p>
              <h3 className="text-3xl font-bold mt-1">{customerWalletTotal.toLocaleString()} ج.م</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Users className="h-6 w-6 text-emerald-200" />
            </div>
          </div>
          <p className="text-xs text-emerald-100/80 bg-emerald-800/30 inline-block px-3 py-1 rounded-full border border-emerald-500/30">
            إجمالي الأموال المتاحة للسحب من العملاء
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center">
            <DollarSign className="h-5 w-5 ml-2 text-emerald-600" />
            أرصدة العملاء المتاحة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">العميل</th>
                <th className="px-6 py-4">الرقم القومي</th>
                <th className="px-6 py-4">المبلغ المعتمد</th>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">المتاح للسحب</th>
                <th className="px-6 py-4">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myApprovedApps.map(app => {
                const available = (app.approvedAmount || 0) - app.usedAmount;
                if (available <= 0) return null; // Hide exhausted apps
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{app.clientName}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{app.clientNationalId}</td>
                    <td className="px-6 py-4 text-gray-900">{app.approvedAmount?.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 text-red-500">{app.usedAmount.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{available.toLocaleString()} ج.م</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setWithdrawalModal({ appId: app.id, maxAmount: available, clientName: app.clientName })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center transition-colors"
                      >
                        <TrendingDown className="h-3 w-3 ml-1" /> سحب
                      </button>
                    </td>
                  </tr>
                );
              })}
              {myApprovedApps.filter(a => ((a.approvedAmount || 0) - a.usedAmount) > 0).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">لا توجد أرصدة متاحة للسحب حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {withdrawalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">طلب سحب رصيد</h3>
            <p className="text-sm text-gray-500 mb-6">العميل: <span className="font-bold text-gray-800">{withdrawalModal.clientName}</span></p>
            
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المطلوب</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    max={withdrawalModal.maxAmount}
                    className="w-full border rounded-lg px-3 py-2 pl-12"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">ج.م</span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">الحد الأقصى: {withdrawalModal.maxAmount.toLocaleString()} ج.م</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات / الغرض</label>
                <textarea 
                  required 
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  value={withdrawNote}
                  onChange={e => setWithdrawNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setWithdrawalModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-bold"
                >
                  تأكيد الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
