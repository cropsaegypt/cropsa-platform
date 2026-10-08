import React, { useState, useEffect, useMemo } from 'react';
import { Role, Application, ApplicationDocument } from '../types';
import { useStore } from '../context/Store';
import { 
  FileUp, 
  Save, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Receipt,
  HelpCircle,
  Paperclip,
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  Building2,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const GOVERNORATES = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهج"
];

const PROFESSIONS = [
    { id: 'MERCHANT', label: 'تاجر' },
    { id: 'FARMER', label: 'مزارع' },
    { id: 'FARM_OWNER', label: 'صاحب مزرعة' },
    { id: 'EQUIPMENT_OWNER', label: 'معدات وآلات' },
];

interface ApplicationFormProps {
    initialData?: Partial<Application>;
    onSubmit: (data: Partial<Application>) => void;
    users: any[]; // List of users to filter companies
    currentUserRole: Role;
    submitLabel?: string;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ initialData, onSubmit, users, currentUserRole, submitLabel = 'إرسال الطلب' }) => {
  const { applicationQuestions, companies, financingPrograms } = useStore();

  const [formData, setFormData] = useState({
    clientName: '',
    clientNationalId: '',
    phoneNumber: '',
    whatsappNumber: '',
    governorate: GOVERNORATES[0],
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: 'no',
    hasRecentReceipt: 'no',
    hasPreviousInstallmentHistory: 'no',
    recentReceiptAmount: '',
    requestedAmount: '',
    documentLink: '',
    description: '',
    assignedToCompanyId: ''
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    initialData?.assignedCompanyIds?.[0] || companies[0]?.id || ''
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    initialData?.selectedProgramId || ''
  );

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Available programs for the selected installment company
  const availablePrograms = useMemo(() => {
    const fromProgramsState = (financingPrograms || []).filter(
      p => p.companyId === selectedCompanyId && p.active !== false
    );
    if (fromProgramsState.length > 0) return fromProgramsState;
    return (selectedCompany?.financingPrograms || []).filter(p => p.active !== false);
  }, [financingPrograms, selectedCompanyId, selectedCompany]);

  const selectedProgram = availablePrograms.find(p => p.id === selectedProgramId) || availablePrograms[0];

  // Dynamic Required Documents List based on selected company and financing program
  const requiredDocsForSelection = useMemo(() => {
    if (selectedProgram && selectedProgram.requiredDocuments && selectedProgram.requiredDocuments.length > 0) {
      return selectedProgram.requiredDocuments;
    }
    if (selectedCompany && selectedCompany.requiredDocumentsList && selectedCompany.requiredDocumentsList.length > 0) {
      return selectedCompany.requiredDocumentsList;
    }
    return [
      'أصل وصورة بطاقة الرقم القومي سارية',
      'إيصال مرافق حديث لمحل السكن (كهرباء / غاز / مياه)',
      'استعلام I-Score ائتماني غير مدرج في القوائم السلبية'
    ];
  }, [selectedProgram, selectedCompany]);

  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Direct file attachments
  const [attachedDocs, setAttachedDocs] = useState<Array<{ name: string; type: any; size: string }>>([
    { name: 'أصل وصورة بطاقة الرقم القومي سارية', type: 'NATIONAL_ID', size: '1.2 MB' },
    { name: 'إيصال مرافق حديث لمحل السكن (كهرباء / غاز / مياه)', type: 'UTILITY_BILL', size: '850 KB' }
  ]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('OTHER');

  const handleToggleDocSlot = (docName: string) => {
    const exists = attachedDocs.some(d => d.name === docName);
    if (exists) {
      setAttachedDocs(prev => prev.filter(d => d.name !== docName));
    } else {
      setAttachedDocs(prev => [
        ...prev,
        { name: docName, type: 'OTHER', size: '1.4 MB' }
      ]);
    }
  };

  useEffect(() => {
      if (initialData) {
          setFormData({
              clientName: initialData.clientName || '',
              clientNationalId: initialData.clientNationalId || '',
              phoneNumber: initialData.phoneNumber || '',
              whatsappNumber: initialData.whatsappNumber || '',
              governorate: initialData.governorate || GOVERNORATES[0],
              profession: initialData.profession || 'MERCHANT',
              financeType: initialData.financeType || 'INSTALLMENT',
              durationMonths: initialData.durationMonths || 12,
              hasRecentInstallment: initialData.hasRecentInstallment ? 'yes' : 'no',
              hasRecentReceipt: initialData.hasRecentReceipt ? 'yes' : 'no',
              hasPreviousInstallmentHistory: (initialData as any).hasPreviousInstallmentHistory ? 'yes' : 'no',
              recentReceiptAmount: initialData.recentReceiptAmount?.toString() || '',
              requestedAmount: initialData.requestedAmount?.toString() || '',
              documentLink: initialData.documentLink || '',
              description: initialData.description || '',
              assignedToCompanyId: initialData.assignedCompanyIds?.[0] || '' 
          });
          if (initialData.assignedCompanyIds?.[0]) {
            setSelectedCompanyId(initialData.assignedCompanyIds[0]);
          }
          if (initialData.selectedProgramId) {
            setSelectedProgramId(initialData.selectedProgramId);
          }
          if (initialData.customAnswers) {
            setCustomAnswers(initialData.customAnswers);
          }
          if (initialData.isUrgent) {
            setIsUrgent(true);
          }
      }
  }, [initialData]);

  const handleAddAttachment = () => {
    if (!newDocTitle.trim()) return;
    setAttachedDocs(prev => [
      ...prev,
      { name: newDocTitle.trim(), type: newDocType, size: '1.5 MB' }
    ]);
    setNewDocTitle('');
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachedDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDocs: ApplicationDocument[] = attachedDocs.map((doc, idx) => ({
      id: `doc_init_${Date.now()}_${idx}`,
      name: doc.name,
      type: doc.type,
      url: `https://crobsa.com/uploads/${encodeURIComponent(doc.name)}.pdf`,
      size: doc.size,
      uploadedBy: 'system',
      uploadedByName: formData.clientName,
      uploadedAt: new Date().toISOString()
    }));

    onSubmit({
      ...formData,
      // @ts-ignore
      profession: formData.profession,
      // @ts-ignore
      financeType: formData.financeType,
      durationMonths: Number(formData.durationMonths),
      requestedAmount: Number(formData.requestedAmount),
      hasRecentInstallment: formData.hasRecentInstallment === 'yes',
      hasRecentReceipt: formData.hasRecentReceipt === 'yes',
      hasPreviousInstallmentHistory: formData.hasPreviousInstallmentHistory === 'yes', 
      recentReceiptAmount: formData.recentReceiptAmount ? Number(formData.recentReceiptAmount) : undefined,
      assignedCompanyIds: selectedCompanyId ? [selectedCompanyId] : (initialData?.assignedCompanyIds || []),
      selectedProgramId: selectedProgram?.id,
      selectedProgramName: selectedProgram?.name,
      customAnswers,
      isUrgent,
      documents: formattedDocs
    });
  };

  const installmentCompanies = users.filter(u => u.role === Role.INSTALLMENT_COMPANY);
  
  // Dynamic Questionnaire Questions linked to the selected program and general questions
  const activeQuestions = useMemo(() => {
    return applicationQuestions.filter(q => {
      if (!q.active) return false;
      if (selectedProgram) {
        if (selectedProgram.questionIds && selectedProgram.questionIds.length > 0) {
          if (selectedProgram.questionIds.includes(q.id)) return true;
        }
        if (q.programIds && q.programIds.length > 0) {
          return q.programIds.includes(selectedProgram.id);
        }
      }
      return true;
    });
  }, [applicationQuestions, selectedProgram]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Section 1: Client Info */}
      <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">بيانات العميل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم العميل (رباعي)</label>
            <input
                type="text"
                required
                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                value={formData.clientName}
                onChange={e => setFormData({...formData, clientName: e.target.value})}
            />
            </div>
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الرقم القومي</label>
            <input
                type="text"
                required
                maxLength={14}
                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-left"
                value={formData.clientNationalId}
                onChange={e => setFormData({...formData, clientNationalId: e.target.value})}
            />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        required
                        className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الواتساب</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    <input
                        type="text"
                        required
                        className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                        value={formData.whatsappNumber}
                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المحافظة</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
                        value={formData.governorate}
                        onChange={e => setFormData({...formData, governorate: e.target.value})}
                    >
                        {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الفئة / الوظيفة</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
                        value={formData.profession}
                        onChange={e => setFormData({...formData, profession: e.target.value})}
                    >
                        {PROFESSIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                </div>
            </div>
         </div>
      </div>

      {/* Section 2: Finance Details & Company Program Selection */}
      <div className="space-y-5">
        <div className="border-b pb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sky-600" />
            <span>تفاصيل التمويل والشركة والبرنامج الائتماني</span>
          </h3>
          <span className="text-xs bg-sky-50 text-sky-800 px-3 py-1 rounded-full font-bold border border-sky-200">
            تحديد البرنامج التمويلي والسقف الائتماني
          </span>
        </div>

        {/* Company & Financing Program Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-sky-50/60 rounded-2xl border border-sky-100">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-sky-600" />
              <span>شركة التقسيط المعتمدة *</span>
            </label>
            <select
              className="w-full border-slate-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all bg-white text-sm font-bold"
              value={selectedCompanyId}
              onChange={e => {
                const newCompId = e.target.value;
                setSelectedCompanyId(newCompId);
                const comp = companies.find(c => c.id === newCompId);
                if (comp?.financingPrograms && comp.financingPrograms.length > 0) {
                  setSelectedProgramId(comp.financingPrograms[0].id);
                } else {
                  setSelectedProgramId('');
                }
              }}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — سقف عام: {c.creditCeiling?.toLocaleString()} ج.م
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              ترخيص الرقابة المالية: <span className="font-mono">{selectedCompany?.fraLicense || 'معتمد'}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-sky-600" />
              <span>البرنامج التمويلي للشركة والحد الائتماني *</span>
            </label>
            {availablePrograms.length > 0 ? (
              <select
                className="w-full border-slate-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all bg-white text-sm font-bold"
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
              >
                {availablePrograms.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (حد ائتماني حتى {p.maxAmount?.toLocaleString()} ج.م - حتى {p.durationMonths} شهر)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                برنامج التمويل الافتراضي للشركة (سقف حتى {selectedCompany?.creditCeiling?.toLocaleString()} ج.م)
              </div>
            )}
            
            {/* Program Credit Limit Badge */}
            {selectedProgram && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                  الحد الائتماني للبرنامج: {selectedProgram.maxAmount?.toLocaleString()} ج.م
                </span>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                  المدة القصوى: {selectedProgram.durationMonths} شهر
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع التمويل</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="financeType" value="INSTALLMENT" checked={formData.financeType === 'INSTALLMENT'} onChange={e => setFormData({...formData, financeType: 'INSTALLMENT'})} />
                        <span>تقسيط</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="financeType" value="DEFERRED" checked={formData.financeType === 'DEFERRED'} onChange={e => setFormData({...formData, financeType: 'DEFERRED'})} />
                        <span>آجل</span>
                    </label>
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المدة (شهور)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
                        value={formData.durationMonths}
                        onChange={e => setFormData({...formData, durationMonths: Number(e.target.value)})}
                    >
                        {Array.from({length: 22}, (_, i) => i + 3).map(m => (
                            <option key={m} value={m}>{m} شهر</option>
                        ))}
                    </select>
                </div>
             </div>
             <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">المبلغ المطلوب (ج.م) *</label>
                  {selectedProgram && (
                    <span className="text-xs font-bold text-slate-500">
                      الحد الأقصى لهذا البرنامج: {selectedProgram.maxAmount?.toLocaleString()} ج.م
                    </span>
                  )}
                </div>
                <input
                type="number"
                required
                min="1"
                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold text-lg"
                value={formData.requestedAmount}
                onChange={e => setFormData({...formData, requestedAmount: e.target.value})}
                placeholder="مثال: 50000"
                />

                {/* Credit Limit Alert if exceeded */}
                {selectedProgram && Number(formData.requestedAmount) > (selectedProgram.maxAmount || 0) && (
                  <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
                    <Zap className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      تنبيه: المبلغ المطلوب ({Number(formData.requestedAmount).toLocaleString()} ج.م) يتجاوز الحد الائتماني المحدد لبرنامج {selectedProgram.name} ({selectedProgram.maxAmount?.toLocaleString()} ج.م). سيخضع لاستثناء ائتماني خاص.
                    </span>
                  </div>
                )}
             </div>
        </div>
      </div>

      {/* Section 3: History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">السجل الائتماني</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">هل يوجد أقساط حالية؟</label>
               <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="recentInstallment" value="yes" checked={formData.hasRecentInstallment === 'yes'} onChange={e => setFormData({...formData, hasRecentInstallment: 'yes'})} />
                        <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="recentInstallment" value="no" checked={formData.hasRecentInstallment === 'no'} onChange={e => setFormData({...formData, hasRecentInstallment: 'no'})} />
                        <span>لا</span>
                    </label>
               </div>
            </div>
            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">هل قام بالتقسيط سابقاً؟</label>
               <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="hasPreviousInstallment" value="yes" checked={formData.hasPreviousInstallmentHistory === 'yes'} onChange={e => setFormData({...formData, hasPreviousInstallmentHistory: 'yes'})} />
                        <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="hasPreviousInstallment" value="no" checked={formData.hasPreviousInstallmentHistory === 'no'} onChange={e => setFormData({...formData, hasPreviousInstallmentHistory: 'no'})} />
                        <span>لا</span>
                    </label>
               </div>
            </div>
            <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">هل يوجد تعاملات بيع سابقة؟</label>
               <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="recentReceipt" value="yes" checked={formData.hasRecentReceipt === 'yes'} onChange={e => setFormData({...formData, hasRecentReceipt: 'yes'})} />
                        <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-xl w-full hover:bg-gray-50">
                        <input type="radio" name="recentReceipt" value="no" checked={formData.hasRecentReceipt === 'no'} onChange={e => setFormData({...formData, hasRecentReceipt: 'no'})} />
                        <span>لا</span>
                    </label>
               </div>
            </div>
            {formData.hasRecentReceipt === 'yes' && (
                <div className="md:col-span-2 lg:col-span-3 animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-2">قيمة المعاملات السابقة (ج.م)</label>
                    <div className="relative">
                        <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="number"
                            className="w-full border-gray-300 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            value={formData.recentReceiptAmount}
                            onChange={e => setFormData({...formData, recentReceiptAmount: e.target.value})}
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Section 3: Dynamic Application Questions (Managed by Super Admin) */}
      {activeQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-crobsa-700" />
              الاستبيان الائتماني والنشاط (محدد من إدارة كروبسا)
            </h3>
            <span className="text-xs bg-crobsa-50 text-crobsa-800 px-2.5 py-1 rounded-full font-bold">
              {activeQuestions.length} أسئلة معتمدة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
            {activeQuestions.map(q => (
              <div key={q.id} className={q.type === 'select' || q.type === 'text' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  {q.labelAr}
                  {q.required && <span className="text-rose-600 mr-1">*</span>}
                  {q.labelEn && <span className="text-xs text-gray-400 mr-2 font-normal">({q.labelEn})</span>}
                </label>
                {q.description && (
                  <p className="text-xs text-gray-500 mb-2">{q.description}</p>
                )}

                {q.type === 'text' && (
                  <input
                    type="text"
                    required={q.required}
                    value={customAnswers[q.id] || ''}
                    onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                    className="w-full bg-white border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-crobsa-500 focus:outline-none text-sm"
                    placeholder="اكتب الإجابة..."
                  />
                )}

                {q.type === 'number' && (
                  <input
                    type="number"
                    required={q.required}
                    value={customAnswers[q.id] || ''}
                    onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                    className="w-full bg-white border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-crobsa-500 focus:outline-none text-sm"
                    placeholder="0"
                  />
                )}

                {q.type === 'select' && (
                  <select
                    required={q.required}
                    value={customAnswers[q.id] || ''}
                    onChange={e => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                    className="w-full bg-white border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-crobsa-500 focus:outline-none text-sm"
                  >
                    <option value="">-- اختر من القائمة --</option>
                    {q.options?.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === 'yes_no' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 p-3 rounded-xl w-full hover:bg-gray-50 text-sm">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={customAnswers[q.id] === 'نعم'}
                        onChange={() => setCustomAnswers({ ...customAnswers, [q.id]: 'نعم' })}
                      />
                      <span>نعم</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 p-3 rounded-xl w-full hover:bg-gray-50 text-sm">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={customAnswers[q.id] === 'لا'}
                        onChange={() => setCustomAnswers({ ...customAnswers, [q.id]: 'لا' })}
                      />
                      <span>لا</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Direct Documents & Required Paperwork Slots */}
      <div className="space-y-5">
        <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-blue-600" />
            <span>خانات الورق والمستندات المطلوبة (المحددة لبرنامج التقسيط)</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-full">
              {attachedDocs.length} من {requiredDocsForSelection.length} مستندات متوفرة
            </span>
          </div>
        </div>

        {/* Dynamic Required Documents Slots per Company and Program */}
        <div className="space-y-3">
          <p className="text-xs text-slate-600 font-bold">
            بناءً على اختيار شركة <span className="text-sky-700 underline font-black">{selectedCompany?.name}</span>{' '}
            {selectedProgram ? (
              <>وبرنامج <span className="text-emerald-700 underline font-black">{selectedProgram.name}</span> (حد ائتماني {selectedProgram.maxAmount?.toLocaleString()} ج.م):</>
            ) : (
              <>والحد الائتماني للشركة:</>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {requiredDocsForSelection.map((docTitle, idx) => {
              const isAttached = attachedDocs.some(d => d.name === docTitle || d.name.includes(docTitle) || docTitle.includes(d.name));
              const attachedItem = attachedDocs.find(d => d.name === docTitle || d.name.includes(docTitle) || docTitle.includes(d.name));

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isAttached 
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/30 shadow-xs' 
                      : 'bg-amber-50/30 border-amber-300/80 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          خانة #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                          مستند إلزامي
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">
                        {docTitle}
                      </h4>
                    </div>

                    <div>
                      {isAttached ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>تم الإرفاق</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shrink-0">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          <span>مطلوب رفعه</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slot Action Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    {isAttached ? (
                      <>
                        <span className="text-[11px] text-slate-500 font-mono">
                          الملف: {attachedItem?.size || '1.2 MB'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleDocSlot(docTitle)}
                          className="text-rose-600 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>إلغاء الإرفاق</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400">صيغ مدعومة: PDF, JPG, PNG</span>
                        <button
                          type="button"
                          onClick={() => handleToggleDocSlot(docTitle)}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-xs transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>إرفاق هذا المستند الآن</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Custom Attachment Adder for Extra Documents */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-slate-600" />
            <span>إضافة أوراق أو وثائق إضافية غير مذكورة أعلاه (اختياري):</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="وصف المستند الإضافي (مثال: شيكات ضمان، عقد إيجار)"
              value={newDocTitle}
              onChange={e => setNewDocTitle(e.target.value)}
              className="sm:col-span-2 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 font-medium"
            />
            <div className="flex gap-2">
              <select
                value={newDocType}
                onChange={e => setNewDocType(e.target.value)}
                className="text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 flex-1 font-medium"
              >
                <option value="NATIONAL_ID">رقم قومي</option>
                <option value="UTILITY_BILL">إيصال مرافق</option>
                <option value="FARM_PROOF">حيازة / كارت فلاح</option>
                <option value="INCOME_PROOF">إثبات دخل</option>
                <option value="OTHER">أخرى</option>
              </select>
              <button
                type="button"
                onClick={handleAddAttachment}
                disabled={!newDocTitle.trim()}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                إرفاق
              </button>
            </div>
          </div>

          {/* Attached items list */}
          <div className="space-y-2 pt-2">
            {attachedDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 px-3 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">{doc.name}</span>
                  <span className="text-[10px] text-slate-400">({doc.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رابط مجلد Google Drive للمستندات (اختياري)</label>
            <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <FileUp className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="url"
                placeholder="https://drive.google.com/..."
                className="w-full border-gray-300 border rounded-xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-left"
                value={formData.documentLink}
                onChange={e => setFormData({...formData, documentLink: e.target.value})}
            />
            </div>
        </div>

        {/* Urgency Trigger */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={e => setIsUrgent(e.target.checked)}
              className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="text-sm font-black text-amber-900 flex items-center gap-1.5">
                <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                تحديد الطلب كطلب مستعجل (High Urgency)
              </span>
              <p className="text-xs text-amber-700 mt-0.5">
                إرسال إشعار فوري للشركة لفحص الملف بأسرع وقت وتحديد أولويته في قائمة الانتظار.
              </p>
            </div>
          </label>
        </div>

        {/* Show assignment dropdown only for Salesman if not editing existing data, or allow override */}
        {currentUserRole === Role.SALESMAN && !initialData && (
            <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">توصية لشركة محددة (اختياري)</label>
            <select
                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white"
                value={formData.assignedToCompanyId}
                onChange={e => setFormData({...formData, assignedToCompanyId: e.target.value})}
            >
                <option value="">اترك التعيين للأدمن</option>
                {installmentCompanies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            </div>
        )}

        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات / وصف الطلب</label>
            <textarea
            rows={4}
            className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="تفاصيل إضافية..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            />
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center"
        >
          <Save className="ml-2 h-5 w-5" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
