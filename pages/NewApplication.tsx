import React from 'react';
import { useStore } from '../context/Store';
import { ApplicationForm } from '../components/ApplicationForm';

export const NewApplication: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { createApplication, currentUser, users } = useStore();

  const handleSubmit = (data: any) => {
    createApplication({
        ...data,
        assignedToCompanyId: data.assignedCompanyIds?.[0] // Pass first if selected, though form might return array
    });
    onSuccess();
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900">إنشاء طلب تقسيط جديد</h2>
          <p className="text-gray-500 mt-1">يرجى ملء جميع البيانات المطلوبة بدقة</p>
        </div>
        
        <div className="p-8">
            <ApplicationForm 
                onSubmit={handleSubmit} 
                users={users} 
                currentUserRole={currentUser?.role!} 
            />
        </div>
      </div>
    </div>
  );
};
