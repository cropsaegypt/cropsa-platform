import React from 'react';
import { useStore } from '../context/Store';

export const AuditLogs: React.FC = () => {
  const { auditLogs, users, setNavigation } = useStore();

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  const handleLogClick = (log: any) => {
    if (log.referenceId) {
      setNavigation({ page: 'applications', resourceId: log.referenceId });
    }
  };

  const actionLabels: Record<string, string> = {
    'LOGIN': 'تسجيل دخول',
    'CREATE_APPLICATION': 'إنشاء طلب',
    'ASSIGN_APPLICATION': 'تعيين طلب',
    'ACKNOWLEDGE_APPLICATION': 'استلام طلب',
    'REVIEW_APPLICATION': 'مراجعة طلب',
    'DEDUCT_FUNDS': 'خصم رصيد',
    'CREATE_USER': 'إنشاء مستخدم',
    'PASSWORD_CHANGE': 'تغيير كلمة المرور'
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">سجلات النظام</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">الوقت والتاريخ</th>
              <th className="px-6 py-4">الإجراء</th>
              <th className="px-6 py-4">المستخدم</th>
              <th className="px-6 py-4">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {auditLogs.map(log => (
              <tr 
                key={log.id} 
                className={`hover:bg-gray-50 transition-colors ${log.referenceId ? 'cursor-pointer' : ''}`}
                onClick={() => handleLogClick(log)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-sans text-left" dir="ltr">
                  {new Date(log.timestamp).toLocaleString('en-US', { 
                    year: 'numeric', month: 'numeric', day: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                  })}
                </td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  {actionLabels[log.action] || log.action}
                </td>
                <td className="px-6 py-4 text-blue-600">
                  {getUserName(log.performedBy)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
