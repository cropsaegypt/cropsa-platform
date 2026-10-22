import React, { useState, useEffect, useMemo } from 'react';
import { Role, Application, ApplicationDocument, ProgramDocumentItem } from '../types';
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
  CheckCircle2,
  Eye,
  Download,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { InternalDocViewerModal } from './InternalDocViewerModal';

export interface FormAttachedDoc {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

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
    initialData?.companyId || initialData?.assignedCompanyIds?.[0] || companies[0]?.id || ''
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(() => {
    if (initialData?.assignedCompanyIds && initialData.assignedCompanyIds.length > 0) {
      return initialData.assignedCompanyIds;
    }
    const defaultId = initialData?.companyId || companies[0]?.id;
    return defaultId ? [defaultId] : [];
  });
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    initialData?.selectedProgramId || ''
  );

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  const handlePrimaryCompanyChange = (newCompId: string) => {
    setSelectedCompanyId(newCompId);
    setSelectedCompanyIds(prev => prev.includes(newCompId) ? prev : [newCompId, ...prev]);
    const compPrograms = (financingPrograms || []).filter(p => p.companyId === newCompId && p.active !== false);
    if (compPrograms.length > 0) {
      setSelectedProgramId(compPrograms[0].id);
    } else {
      const comp = companies.find(c => c.id === newCompId);
      if (comp?.financingPrograms && comp.financingPrograms.length > 0) {
        setSelectedProgramId(comp.financingPrograms[0].id);
      } else {
        setSelectedProgramId('');
      }
    }
  };

  const handleToggleMultiCompany = (id: string) => {
    setSelectedCompanyIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter(cId => cId !== id);
        if (selectedCompanyId === id) {
          setSelectedCompanyId(filtered[0]);
        }
        return filtered;
      } else {
        return [...prev, id];
      }
    });
  };

  // Available programs for the selected installment company
  const availablePrograms = useMemo(() => {
    const fromProgramsState = (financingPrograms || []).filter(
      p => p.companyId === selectedCompanyId && p.active !== false
    );
    if (fromProgramsState.length > 0) return fromProgramsState;
    return (selectedCompany?.financingPrograms || []).filter(p => p.active !== false);
  }, [financingPrograms, selectedCompanyId, selectedCompany]);

  const selectedProgram = availablePrograms.find(p => p.id === selectedProgramId) || availablePrograms[0];

  // Dynamic Program Document Items for the selected company and financing program
  const programDocsConfig = useMemo<ProgramDocumentItem[]>(() => {
    if (selectedProgram) {
      if (selectedProgram.documentsConfig && selectedProgram.documentsConfig.length > 0) {
        return selectedProgram.documentsConfig;
      }
      if (selectedProgram.requiredDocuments && selectedProgram.requiredDocuments.length > 0) {
        return selectedProgram.requiredDocuments.map((doc, idx) => ({
          id: `pdoc_${idx}`,
          name: doc,
          isRequired: idx === 0 // first is mandatory by default if unconfigured
        }));
      }
    }
    if (selectedCompany?.requiredDocumentsList && selectedCompany.requiredDocumentsList.length > 0) {
      return selectedCompany.requiredDocumentsList.map((doc, idx) => ({
        id: `cdoc_${idx}`,
        name: doc,
        isRequired: idx === 0
      }));
    }
    return [
      { id: 'def_1', name: 'أصل وصورة بطاقة الرقم القومي سارية للمشتري والضامن', isRequired: true },
      { id: 'def_2', name: 'إيصال مرافق حديث لمحل السكن (كهرباء / غاز / مياه)', isRequired: false },
      { id: 'def_3', name: 'استعلام I-Score ائتماني غير مدرج في القوائم السلبية', isRequired: false }
    ];
  }, [selectedProgram, selectedCompany]);

  const requiredDocsForSelection = useMemo(() => {
    return programDocsConfig.map(d => d.name);
  }, [programDocsConfig]);

  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Real file attachments state
  const [attachedDocs, setAttachedDocs] = useState<FormAttachedDoc[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url?: string; size?: string; type?: string } | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('OTHER');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  const handleFileSelected = (file: File, docTitle: string, docType: string = 'OTHER') => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 15 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeStr = formatFileSize(file.size);
      setAttachedDocs(prev => {
        const filtered = prev.filter(d => d.name !== docTitle);
        return [
          ...filtered,
          {
            id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: docTitle,
            type: docType,
            fileName: file.name,
            fileSize: sizeStr,
            fileUrl: dataUrl,
            uploadedAt: new Date().toISOString()
          }
        ];
      });
    };
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docTitle: string) => {
    setAttachedDocs(prev => prev.filter(d => d.name !== docTitle));
  };

  const handleDownloadDoc = (doc: FormAttachedDoc) => {
    if (!doc.fileUrl) return;
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName || `${doc.name}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleAddCustomAttachment = () => {
    if (!newDocFile) {
      alert('يرجى اختيار ملف من جهازك أولاً.');
      return;
    }
    const title = newDocTitle.trim() || newDocFile.name.replace(/\.[^/.]+$/, "");
    handleFileSelected(newDocFile, title, newDocType);
    setNewDocFile(null);
    setNewDocTitle('');
    setNewDocType('OTHER');
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
          if (initialData.assignedCompanyIds && initialData.assignedCompanyIds.length > 0) {
            setSelectedCompanyIds(initialData.assignedCompanyIds);
            setSelectedCompanyId(initialData.assignedCompanyIds[0]);
          } else if (initialData.companyId) {
            setSelectedCompanyIds([initialData.companyId]);
            setSelectedCompanyId(initialData.companyId);
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
          if (initialData.documents && initialData.documents.length > 0) {
            setAttachedDocs(initialData.documents.map(d => ({
              id: d.id,
              name: d.name,
              type: d.type,
              fileName: d.fileName || d.name,
              fileSize: d.fileSize || (d as any).size || '1.2 MB',
              fileUrl: d.fileUrl || (d as any).url || '',
              uploadedAt: d.uploadedAt || new Date().toISOString()
            })));
          }
      }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDocs: ApplicationDocument[] = attachedDocs.map((doc, idx) => ({
      id: doc.id || `doc_init_${Date.now()}_${idx}`,
      name: doc.name,
      type: doc.type as any,
      fileName: doc.fileName || `${doc.name}.pdf`,
      fileUrl: doc.fileUrl,
      url: doc.fileUrl,
      size: doc.fileSize,
      fileSize: doc.fileSize,
      uploadedBy: currentUserRole === Role.SALESMAN ? 'salesman' : 'admin',
      uploadedByName: formData.clientName,
      uploadedAt: doc.uploadedAt || new Date().toISOString()
    }));

    // Validate Mandatory Documents configured for the selected program
    const missingMandatoryDocs = programDocsConfig.filter(docConfig => 
      docConfig.isRequired && !attachedDocs.some(att => 
        att.name === docConfig.name || 
        att.name.includes(docConfig.name) || 
        docConfig.name.includes(att.name)
      )
    );

    if (missingMandatoryDocs.length > 0) {
      const confirmProceed = window.confirm(
        `تنبيه هـام بشأن المستندات الإلزامية:\n` +
        `هناك مستندات محددة كـ (إلزامية *) في هذا البرنامج ولم يتم رفعها بعد:\n\n` +
        missingMandatoryDocs.map((d, i) => `${i + 1}. ${d.name}`).join('\n') +
        `\n\nهل ترغب في المتابعة وإرسال الطلب على أية حال أم استكمال رفع الملفات الإلزامية أولاً؟`
      );
      if (!confirmProceed) {
        return;
      }
    }

    const assignedCompanyNames = selectedCompanyIds
      .map(id => companies.find(c => c.id === id)?.name)
      .filter((name): name is string => Boolean(name));

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
      companyId: selectedCompanyId,
      companyName: selectedCompany?.name,
      assignedCompanyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : (selectedCompanyId ? [selectedCompanyId] : []),
      assignedCompanyNames,
      selectedProgramId: selectedProgram?.id,
      selectedProgramName: selectedProgram?.name,
      programInterestRate: selectedProgram?.interestRate,
      programAdminFeePercent: selectedProgram?.adminFeePercent,
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
              onChange={e => handlePrimaryCompanyChange(e.target.value)}
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
                    {p.name} (حد ائتماني {p.maxAmount?.toLocaleString()} ج.م - مدة {p.durationMonths} شهر - فائدة {p.interestRate || 0}%)
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
                  الحد الائتماني: {selectedProgram.maxAmount?.toLocaleString()} ج.م
                </span>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                  المدة القصوى: {selectedProgram.durationMonths} شهر
                </span>
                <span className="text-[11px] font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-lg border border-sky-200">
                  فائدة البرنامج: {selectedProgram.interestRate ? `${selectedProgram.interestRate}%` : '0%'}
                </span>
                <span className="text-[11px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-lg border border-indigo-200">
                  المصاريف: {selectedProgram.adminFeePercent || 2.5}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Company Parallel Dispatch (إرسال لأكثر من شركة في نفس الوقت) */}
        {companies.length > 1 && (
          <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 rounded-2xl border border-sky-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  إرسال الطلب لأكثر من شركة في نفس الوقت (توزيع متوازي سريع):
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكنك تحديد شركات إضافية لتصلها نسخة فورية من الطلب ومستنداته لزيادة فرصة الموافقة وسرعة الاعتماد.
                </p>
              </div>
              <span className="text-[11px] font-black text-sky-800 bg-sky-100/90 border border-sky-300 px-2.5 py-1 rounded-xl self-start sm:self-auto shrink-0">
                محدد: {selectedCompanyIds.length} من {companies.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {companies.map(c => {
                const isSelected = selectedCompanyIds.includes(c.id);
                const isPrimary = c.id === selectedCompanyId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleMultiCompany(c.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                      isSelected
                        ? isPrimary
                          ? 'bg-sky-600 text-white border-sky-700 ring-2 ring-sky-300'
                          : 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded text-sky-600 pointer-events-none w-3.5 h-3.5 accent-white"
                    />
                    <span>{c.name}</span>
                    {isPrimary && (
                      <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-black border border-white/30">
                        الرئيسية ⭐
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-full">
              {attachedDocs.length} من {programDocsConfig.length} مستندات متوفرة
            </span>
            <span className="text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-full">
              {programDocsConfig.filter(d => d.isRequired).length} أوراق إلزامية *
            </span>
          </div>
        </div>

        {/* Dynamic Required Documents Slots per Company and Program */}
        <div className="space-y-3">
          <p className="text-xs text-slate-600 font-bold">
            بناءً على اختيار شركة <span className="text-sky-700 underline font-black">{selectedCompany?.name}</span>{' '}
            {selectedProgram ? (
              <>وبرنامج <span className="text-emerald-700 underline font-black">{selectedProgram.name}</span> (حد ائتماني {selectedProgram.maxAmount?.toLocaleString()} ج.م - فائدة {selectedProgram.interestRate || 0}%):</>
            ) : (
              <>والحد الائتماني للشركة:</>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {programDocsConfig.map((docItem, idx) => {
              const docTitle = docItem.name;
              const attachedItem = attachedDocs.find(d => d.name === docTitle || d.name.includes(docTitle) || docTitle.includes(d.name));
              const isAttached = !!attachedItem;
              const isImage = attachedItem?.fileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachedItem?.fileName || '');
              const isPdf = attachedItem?.fileUrl.startsWith('data:application/pdf') || attachedItem?.fileName?.toLowerCase().endsWith('.pdf');
              const inputId = `file-input-slot-${idx}`;

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isAttached 
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/40 shadow-xs' 
                      : docItem.isRequired
                        ? 'bg-rose-50/30 hover:bg-rose-50/60 border-rose-200 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                  }`}
                >
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelected(file, docTitle, 'REQUIRED_KYC');
                      }
                      e.target.value = '';
                    }}
                  />

                  {/* Header of slot */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          خانة #{idx + 1}
                        </span>
                        {docItem.isRequired ? (
                          <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>إلزامي * (مطلوب رفعه)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            اختياري
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">
                        {docTitle}
                      </h4>
                    </div>

                    <div>
                      {isAttached ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>تم الرفع بنجاح</span>
                        </span>
                      ) : docItem.isRequired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full shrink-0">
                          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                          <span>بانتظار الرفع الإلزامي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shrink-0">
                          <span>اختياري (غير ملزم)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content area: if attached, show preview thumbnail & actions; else show drag/upload area */}
                  {isAttached ? (
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImage ? (
                          <img 
                            src={attachedItem.fileUrl} 
                            alt={attachedItem.name} 
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0 cursor-pointer hover:opacity-90"
                            onClick={() => setPreviewDoc({
                              name: attachedItem.name,
                              url: attachedItem.fileUrl,
                              size: attachedItem.fileSize,
                              type: 'image/jpeg'
                            })} 
                          />
                        ) : (
                          <div 
                            onClick={() => setPreviewDoc({
                              name: attachedItem.name,
                              url: attachedItem.fileUrl,
                              size: attachedItem.fileSize,
                              type: 'application/pdf'
                            })}
                            className="h-12 w-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:bg-rose-100"
                          >
                            <FileText className="h-5 w-5" />
                            <span className="text-[8px] font-bold uppercase font-mono">PDF</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={attachedItem.fileName}>
                            {attachedItem.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            الحجم: {attachedItem.fileSize}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({
                            name: attachedItem.name,
                            url: attachedItem.fileUrl,
                            size: attachedItem.fileSize,
                            type: isPdf ? 'application/pdf' : 'image/jpeg'
                          })}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-sky-200 transition-colors cursor-pointer"
                          title="معاينة المستند"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">معاينة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(attachedItem)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="تحميل الملف"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <label
                          htmlFor={inputId}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="استبدال بملف آخر"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(docTitle)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="حذف الملف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor={inputId}
                      className="border-2 border-dashed border-slate-300 hover:border-cropsa-500 hover:bg-cropsa-50/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group"
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-cropsa-100 text-slate-500 group-hover:text-cropsa-700 flex items-center justify-center transition-colors">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-cropsa-800">
                        اضغط لاختيار الملف أو اسحبه هنا
                      </span>
                      <span className="text-[10px] text-slate-400">
                        الصور (JPG, PNG, WEBP) أو ملفات (PDF) بحد أقصى 15MB
                      </span>
                    </label>
                  )}
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
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <input
              type="text"
              placeholder="وصف أو مسمى المستند (مثال: شيكات ضمان، عقد إيجار المحل، كشف حساب)"
              value={newDocTitle}
              onChange={e => setNewDocTitle(e.target.value)}
              className="sm:col-span-5 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 font-medium"
            />
            
            <select
              value={newDocType}
              onChange={e => setNewDocType(e.target.value)}
              className="sm:col-span-3 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 font-medium"
            >
              <option value="NATIONAL_ID">رقم قومي</option>
              <option value="UTILITY_BILL">إيصال مرافق</option>
              <option value="FARM_PROOF">حيازة / كارت فلاح</option>
              <option value="INCOME_PROOF">إثبات دخل</option>
              <option value="CONTRACT">عقود وشيكات</option>
              <option value="OTHER">أخرى</option>
            </select>

            <div className="sm:col-span-4 flex items-center gap-2">
              <input
                id="extra-doc-input"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setNewDocFile(file);
                    if (!newDocTitle) {
                      setNewDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }
                }}
              />
              <label
                htmlFor="extra-doc-input"
                className="flex-1 text-center truncate bg-white hover:bg-slate-100 border border-slate-300 p-2.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                title={newDocFile ? newDocFile.name : 'اختر ملفاً'}
              >
                {newDocFile ? `📎 ${newDocFile.name}` : '📁 اختيار ملف...'}
              </label>

              <button
                type="button"
                onClick={handleAddCustomAttachment}
                disabled={!newDocFile}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>إرفاق</span>
              </button>
            </div>
          </div>

          {/* Attached items list for custom documents */}
          {attachedDocs.filter(d => !requiredDocsForSelection.some(req => req === d.name || req.includes(d.name) || d.name.includes(req))).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <p className="text-[11px] font-bold text-slate-500">المستندات الإضافية المرفوعة:</p>
              {attachedDocs
                .filter(d => !requiredDocsForSelection.some(req => req === d.name || req.includes(d.name) || d.name.includes(req)))
                .map((doc, idx) => {
                  const isImg = doc.fileUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.fileName || '');
                  const isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileName?.toLowerCase().endsWith('.pdf');
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 px-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImg ? (
                          <img src={doc.fileUrl} alt={doc.name} className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {doc.fileName} • {doc.fileSize}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({
                            name: doc.name,
                            url: doc.fileUrl,
                            size: doc.fileSize,
                            type: isPdf ? 'application/pdf' : 'image/jpeg'
                          })}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="معاينة"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="تحميل"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
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

      {/* Real-time document preview modal within form */}
      {previewDoc && (
        <InternalDocViewerModal
          document={previewDoc}
          clientName={formData.clientName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </form>
  );
};
