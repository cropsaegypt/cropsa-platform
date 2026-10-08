import React from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { Check, X, Clock, Banknote } from 'lucide-react';

export const Withdrawals: React.FC = () => {
  const { withdrawalRequests, users, approveWithdrawal, rejectWithdrawal, currentUser } = useStore();

  if (currentUser?.role !== Role.SUPER_ADMIN) return <div>Access Denied</div>;

  const getUserName = (id: string) => {
     const user = users.find(u => u.id === id);
     return user ? `${user.name} (${user.role})` : id;
  };

  const pendingRequests = withdrawalRequests.filter(w => w.status === 'PENDING');
  const historyRequests = withdrawalRequests.filter(w => w.status !== 'PENDING');

  return (
    <div className="space-y-8">
      <div>
         <h2 className="text-2xl font-bold text-gray-900 mb-4">طلبات السحب المعلقة</h2>
         {pendingRequests.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
               لا توجد طلبات سحب معلقة حالياً.
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-sm text-gray-500">مقدم الطلب</p>
                           <p className="font-bold text-gray-900">{getUserName(req.userId)}</p>
                        </div>
                        <Banknote className="h-6 w-6 text-gray-300" />
                     </div>
                     <div className="mb-6">
                        <p className="text-sm text-gray-500">المبلغ المطلوب</p>
                        <p className="text-3xl font-bold text-blue-600">{req.amount.toLocaleString()} ج.م</p>
                     </div>
                     <div className="flex gap-2">
                        <button 
                           onClick={() => approveWithdrawal(req.id)}
                           className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 flex justify-center items-center"
                        >
                           <Check className="h-4 w-4 ml-2" /> موافقة
                        </button>
                        <button 
                           onClick={() => rejectWithdrawal(req.id)}
                           className="flex-1 bg-white text-red-600 border border-red-200 py-2 rounded-lg font-medium hover:bg-red-50 flex justify-center items-center"
                        >
                           <X className="h-4 w-4 ml-2" /> رفض
                        </button>
                     </div>
                     <div className="mt-3 text-xs text-gray-400 font-sans text-left" dir="ltr">
                        {new Date(req.requestedAt).toLocaleString('en-US')}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>

      <div>
         <h2 className="text-xl font-bold text-gray-900 mb-4">سجل العمليات السابقة</h2>
         <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-right">
               <thead className="bg-gray-50 text-gray-500">
                  <tr>
                     <th className="px-6 py-3">المعرف</th>
                     <th className="px-6 py-3">المستخدم</th>
                     <th className="px-6 py-3">المبلغ</th>
                     <th className="px-6 py-3">الحالة</th>
                     <th className="px-6 py-3">تاريخ الإجراء</th>
                     <th className="px-6 py-3">بواسطة</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {historyRequests.map(req => (
                     <tr key={req.id}>
                        <td className="px-6 py-4 font-mono text-gray-400">{req.id}</td>
                        <td className="px-6 py-4">{getUserName(req.userId)}</td>
                        <td className="px-6 py-4 font-bold">{req.amount.toLocaleString()} ج.م</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {req.status === 'APPROVED' ? 'تمت الموافقة' : 'مرفوض'}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-sans text-xs text-left" dir="ltr">
                           {req.actionedAt ? new Date(req.actionedAt).toLocaleString('en-US') : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs">{users.find(u => u.id === req.actionedBy)?.name || '-'}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
