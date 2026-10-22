import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { ApplicationForm } from '../components/ApplicationForm';
import { BulkApplicationsImportModal } from '../components/BulkApplicationsImportModal';
import { FileSpreadsheet } from 'lucide-react';

export const NewApplication: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { createApplication, currentUser, users } = useStore();
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleSubmit = (data: any) => {
    createApplication({
        ...data,
        assignedToCompanyId: data.assignedCompanyIds?.[0]
    });
    onSuccess();
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">إنشاء طلب تقسيط جديد</h2>
            <p className="text-gray-500 mt-1">يرجى ملء جميع البيانات المطلوبة بدقة</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>رفع طلبات مجمعة (شيت إكسيل بالك)</span>
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
            <ApplicationForm 
                onSubmit={handleSubmit} 
                users={users} 
                currentUserRole={currentUser?.role!} 
            />
        </div>
      </div>

      {showBulkModal && (
        <BulkApplicationsImportModal
          isOpen={showBulkModal}
          onClose={() => {
            setShowBulkModal(false);
          }}
        />
      )}
    </div>
  );
};
