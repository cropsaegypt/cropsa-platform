import React, { useState, useRef } from 'react';
import { useStore } from '../context/Store';
import { InstallmentCompany, EGYPT_GOVERNORATES, Role, FinancingProgram } from '../types';
import { 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck, 
  MapPin, 
  DollarSign, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  AlertTriangle,
  Lock,
  Percent,
  Trash2,
  Layers,
  Settings2,
  Sparkles,
  Check,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export const CompaniesManagement: React.FC = () => {
  const { 
    currentUser, 
    companies, 
    branches, 
    users, 
    createCompany, 
    updateCompany, 
    t, 
    language 
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<InstallmentCompany | null>(null);

  // Programs & Required Documents Management State
  const [selectedCompanyForPrograms, setSelectedCompanyForPrograms] = useState<InstallmentCompany | null>(null);
  const [editingProgramsList, setEditingProgramsList] = useState<FinancingProgram[]>([]);
  const [editingDocsList, setEditingDocsList] = useState<string[]>([]);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramMaxAmount, setNewProgramMaxAmount] = useState<number>(100000);
  const [newProgramDuration, setNewProgramDuration] = useState<number>(12);
  const [newProgramDocs, setNewProgramDocs] = useState<string[]>([
    'أصل وصورة بطاقة الرقم القومي سارية',
    'إيصال مرافق حديث لمحل السكن'
  ]);
  const [tempProgramDocInput, setTempProgramDocInput] = useState('');
  const [tempGeneralDocInput, setTempGeneralDocInput] = useState('');

  const handleOpenProgramsModal = (company: InstallmentCompany) => {
    setSelectedCompanyForPrograms(company);
    setEditingProgramsList(company.financingPrograms || []);
    setEditingDocsList(company.requiredDocumentsList || []);
    setNewProgramName('');
    setNewProgramMaxAmount(100000);
    setNewProgramDuration(12);
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim()) return;
    const newProg: FinancingProgram = {
      id: `prog_${Date.now()}`,
      name: newProgramName.trim(),
      maxAmount: Number(newProgramMaxAmount),
      durationMonths: Number(newProgramDuration),
      requiredDocuments: [...newProgramDocs]
    };
    setEditingProgramsList(prev => [...prev, newProg]);
    setNewProgramName('');
    setNewProgramMaxAmount(100000);
    setNewProgramDuration(12);
  };

  const handleDeleteProgram = (progId: string) => {
    setEditingProgramsList(prev => prev.filter(p => p.id !== progId));
  };

  const handleAddDocToProgram = () => {
    if (!tempProgramDocInput.trim()) return;
    if (!newProgramDocs.includes(tempProgramDocInput.trim())) {
      setNewProgramDocs(prev => [...prev, tempProgramDocInput.trim()]);
    }
    setTempProgramDocInput('');
  };

  const handleRemoveDocFromProgram = (idx: number) => {
    setNewProgramDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddGeneralDoc = () => {
    if (!tempGeneralDocInput.trim()) return;
    setEditingDocsList(prev => [...prev, tempGeneralDocInput.trim()]);
    setTempGeneralDocInput('');
  };

  const handleRemoveGeneralDoc = (idx: number) => {
    setEditingDocsList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCompanyProgramsAndDocs = async () => {
    if (!selectedCompanyForPrograms) return;
    await updateCompany(selectedCompanyForPrograms.id, {
      requiredDocumentsList: editingDocsList,
      financingPrograms: editingProgramsList
    });
    setSelectedCompanyForPrograms(null);
  };

  // Form State
  const [companyForm, setCompanyForm] = useState({
    name: '',
    nameEn: '',
    code: '',
    logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    email: '',
    phone: '',
    commercialRegister: '',
    taxNumber: '',
    fraLicense: '',
    creditCeiling: 20000000,
    commissionRate: 3.5,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية'],
    requiredDocumentsList: [
      'بطاقة الرقم القومي سارية للمشتري والضامن',
      'إيصال مرافق حديث (كهرباء / غاز / مياه)',
      'استعلام I-Score ائتماني غير مدرج في القوائم السلبية'
    ],
    initialAdminPassword: 'password'
  });

  const [newDocItem, setNewDocItem] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompanyForm(prev => ({ ...prev, [field]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fraLicense.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDocToForm = () => {
    if (!newDocItem.trim()) return;
    setCompanyForm(prev => ({
      ...prev,
      requiredDocumentsList: [...prev.requiredDocumentsList, newDocItem.trim()]
    }));
    setNewDocItem('');
  };

  const handleRemoveDocFromForm = (index: number) => {
    setCompanyForm(prev => ({
      ...prev,
      requiredDocumentsList: prev.requiredDocumentsList.filter((_, i) => i !== index)
    }));
  };

  const handleToggleGov = (gov: string) => {
    setCompanyForm(prev => {
      const exists = prev.allowedGovernorates.includes(gov);
      if (exists) {
        return { ...prev, allowedGovernorates: prev.allowedGovernorates.filter(g => g !== gov) };
      } else {
        return { ...prev, allowedGovernorates: [...prev.allowedGovernorates, gov] };
      }
    });
  };

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.code) return;

    await createCompany({
      name: companyForm.name,
      nameEn: companyForm.nameEn,
      code: companyForm.code.toUpperCase(),
      logo: companyForm.logo,
      coverImage: companyForm.coverImage,
      email: companyForm.email,
      phone: companyForm.phone,
      commercialRegister: companyForm.commercialRegister,
      taxNumber: companyForm.taxNumber,
      fraLicense: companyForm.fraLicense,
      creditCeiling: Number(companyForm.creditCeiling),
      commissionRate: Number(companyForm.commissionRate),
      allowedGovernorates: companyForm.allowedGovernorates,
      requiredDocumentsList: companyForm.requiredDocumentsList,
      status: 'ACTIVE'
    }, companyForm.initialAdminPassword);

    setShowAddCompanyModal(false);
    setCompanyForm({
      name: '',
      nameEn: '',
      code: '',
      logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      email: '',
      phone: '',
      commercialRegister: '',
      taxNumber: '',
      fraLicense: '',
      creditCeiling: 20000000,
      commissionRate: 3.5,
      allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية'],
      requiredDocumentsList: [
        'بطاقة الرقم القومي سارية للمشتري والضامن',
        'إيصال مرافق حديث (كهرباء / غاز / مياه)',
        'استعلام I-Score ائتماني غير مدرج في القوائم السلبية'
      ],
      initialAdminPassword: 'password'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-crobsa-50 text-crobsa-700 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{t('installmentCompanies')}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{language === 'ar' ? 'إدارة الشراكات، رخص الرقابة المالية، الفروع والسياسات التمويلية' : 'Manage partner installment companies, licenses, and limits'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {t('addInstallmentCompany')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={language === 'ar' ? 'البحث باسم الشركة، كود الشراكة، أو رقم رخصة الرقابة المالية...' : 'Search company by name, code or FRA license...'}
          className="w-full text-sm border border-slate-200 rounded-2xl pr-10 pl-4 py-3 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-sm"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => {
          const compBranches = branches.filter(b => b.companyId === company.id);
          const compStaff = users.filter(u => u.companyId === company.id);
          const percentUsed = company.creditCeiling > 0 ? Math.min(100, Math.round((company.usedCredit / company.creditCeiling) * 100)) : 0;

          return (
            <div 
              key={company.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Logo & Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {Boolean(company.logo?.trim()) ? (
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="h-14 w-14 rounded-2xl object-contain p-1 border border-slate-200 shadow-sm bg-white"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl border border-slate-200 shadow-sm bg-white flex items-center justify-center text-slate-400">
                        <Building2 className="h-7 w-7" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{company.name}</h3>
                      <span className="font-mono text-xs text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {company.code}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    company.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {company.status === 'ACTIVE' ? (language === 'ar' ? 'نشطة' : 'Active') : company.status}
                  </span>
                </div>

                {/* Company Details */}
                <div className="space-y-2.5 text-xs text-slate-600 border-t border-b border-slate-100 py-3 my-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('fraLicense')}:</span>
                    <span className="font-mono font-bold text-slate-800">{company.fraLicense}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('commercialRegister')}:</span>
                    <span className="font-mono text-slate-800">{company.commercialRegister}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('commissionRate')}:</span>
                    <span className="font-bold text-sky-700">{company.commissionRate}%</span>
                  </div>

                  {/* Ceiling Utilization Bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">{t('creditCeiling')}</span>
                      <span className="font-bold text-slate-800">{company.usedCredit.toLocaleString()} / {company.creditCeiling.toLocaleString()} {t('egp')}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          percentUsed > 80 ? 'bg-rose-500' : percentUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Allowed Governorates */}
                <div className="mb-4">
                  <span className="text-[11px] text-slate-400 block mb-1 font-semibold">{t('allowedGovernorates')}:</span>
                  <div className="flex flex-wrap gap-1">
                    {company.allowedGovernorates.slice(0, 4).map(gov => (
                      <span key={gov} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {gov}
                      </span>
                    ))}
                    {company.allowedGovernorates.length > 4 && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        +{company.allowedGovernorates.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Programs & Required Documents Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-sky-600" />
                    <span>{company.financingPrograms?.length || 0} برامج تمويلية</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>{company.requiredDocumentsList?.length || 0} مستندات عامة</span>
                  </span>
                </div>
              </div>

              {/* Card Footer: Branches, Staff, Details Modal */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-sky-600" /> {compBranches.length} {language === 'ar' ? 'فروع' : 'Branches'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-purple-600" /> {compStaff.length} {language === 'ar' ? 'موظف' : 'Staff'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenProgramsModal(company)}
                    className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center gap-1"
                    title="تعديل برامج التمويل والورق المطلوب لكل برنامج"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-sky-600" />
                    <span>الورق والبرامج</span>
                  </button>

                  <button
                    onClick={() => setSelectedCompanyForDetails(company)}
                    className="px-3 py-1.5 text-xs font-bold text-crobsa-700 bg-crobsa-50 hover:bg-crobsa-100 rounded-xl transition-colors"
                  >
                    {language === 'ar' ? 'الملف الكامل' : 'View Profile'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD INSTALLMENT COMPANY */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 lg:p-8 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{t('addInstallmentCompany')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{language === 'ar' ? 'تسجيل شركة تقسيط جديدة وتعيين السقف والورق المطلوب وحساب الإدارة' : 'Register a new installment partner company'}</p>
              </div>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم شركة التقسيط (بالعربي)' : 'Company Name (Ar)'} *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="مثال: شركة تمويلي للتقسيط المباشر"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم الشركة (بالإنجليزي)' : 'Company Name (En)'}</label>
                  <input
                    type="text"
                    value={companyForm.nameEn}
                    onChange={e => setCompanyForm({ ...companyForm, nameEn: e.target.value })}
                    placeholder="e.g. Tamweely Consumer Finance"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'كود الشراكة' : 'Company Code'} *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.code}
                    onChange={e => setCompanyForm({ ...companyForm, code: e.target.value })}
                    placeholder="TAM-04"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('fraLicense')} *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.fraLicense}
                    onChange={e => setCompanyForm({ ...companyForm, fraLicense: e.target.value })}
                    placeholder="FRA-FIN-2024-099"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('commissionRate')} (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={companyForm.commissionRate}
                    onChange={e => setCompanyForm({ ...companyForm, commissionRate: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('creditCeiling')} ({t('egp')}) *</label>
                  <input
                    type="number"
                    required
                    value={companyForm.creditCeiling}
                    onChange={e => setCompanyForm({ ...companyForm, creditCeiling: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'نسبة العمولة %' : 'Commission Rate %'} *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={companyForm.commissionRate}
                    onChange={e => setCompanyForm({ ...companyForm, commissionRate: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Logo Upload & Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-crobsa-700" />
                    <span>{language === 'ar' ? 'شعار الشركة (Logo)' : 'Company Logo'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">رفع صورة مباشرة أو رابط</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {companyForm.logo ? (
                      <img src={companyForm.logo} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'logo')}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-crobsa-700" />
                        <span>{language === 'ar' ? 'رفع ملف صورة' : 'Upload Image'}</span>
                      </button>
                      <input
                        type="text"
                        value={companyForm.logo}
                        onChange={e => setCompanyForm({ ...companyForm, logo: e.target.value })}
                        placeholder="أو رابط الصورة..."
                        className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Banner Upload & Preview */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-crobsa-700" />
                    <span>{language === 'ar' ? 'غلاف / كافر الشركة (Cover Banner)' : 'Cover Banner'}</span>
                  </label>
                  <span className="text-[11px] text-slate-400">صورة عريضة للواجهة</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-12 w-20 rounded-xl bg-slate-900 border border-slate-300 overflow-hidden shrink-0 shadow-xs">
                    {companyForm.coverImage ? (
                      <img src={companyForm.coverImage} alt="Cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-500">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'coverImage')}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-crobsa-700" />
                        <span>{language === 'ar' ? 'رفع ملف صورة الغلاف' : 'Upload Cover'}</span>
                      </button>
                      <input
                        type="text"
                        value={companyForm.coverImage}
                        onChange={e => setCompanyForm({ ...companyForm, coverImage: e.target.value })}
                        placeholder="أو رابط صورة الغلاف..."
                        className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('commercialRegister')}</label>
                  <input
                    type="text"
                    value={companyForm.commercialRegister}
                    onChange={e => setCompanyForm({ ...companyForm, commercialRegister: e.target.value })}
                    placeholder="994821"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('taxNumber')}</label>
                  <input
                    type="text"
                    value={companyForm.taxNumber}
                    onChange={e => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                    placeholder="552-192-881"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Initial Admin Password for the company */}
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200">
                <label className="block font-bold text-sky-900 mb-1 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-sky-600" />
                  {language === 'ar' ? 'كلمة مرور حساب المدير العام للشركة' : 'Initial Company Admin Password'} *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.initialAdminPassword}
                  onChange={e => setCompanyForm({ ...companyForm, initialAdminPassword: e.target.value })}
                  placeholder="password"
                  className="w-full text-sm border border-sky-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono bg-white"
                />
                <p className="text-[11px] text-sky-700 mt-1">
                  {language === 'ar' ? 'سيتم إنشاء حساب تلقائي لمدير الشركة باسم مستخدم مشتق من كود الشركة.' : 'An admin account will be generated automatically.'}
                </p>
              </div>

              {/* Allowed Governorates */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('allowedGovernorates')}</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {EGYPT_GOVERNORATES.map(gov => {
                    const selected = companyForm.allowedGovernorates.includes(gov);
                    return (
                      <button
                        type="button"
                        key={gov}
                        onClick={() => handleToggleGov(gov)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          selected 
                            ? 'bg-crobsa-700 text-white border-crobsa-700 font-bold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {gov}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required Documents List for clients */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('requiredDocsList')}</label>
                <div className="space-y-1.5 mb-2">
                  {companyForm.requiredDocumentsList.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-700 font-medium">{doc}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDocFromForm(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocItem}
                    onChange={e => setNewDocItem(e.target.value)}
                    placeholder={language === 'ar' ? 'أضف ورقة أو مستند مطلوب...' : 'Add required doc item...'}
                    className="flex-1 text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocToForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPANY FULL DETAILS */}
      {selectedCompanyForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                {Boolean(selectedCompanyForDetails.logo?.trim()) ? (
                  <img src={selectedCompanyForDetails.logo} alt="" className="h-10 w-10 object-contain rounded-lg border p-0.5" />
                ) : (
                  <div className="h-10 w-10 rounded-lg border p-0.5 flex items-center justify-center text-slate-400 bg-slate-50">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCompanyForDetails.name}</h3>
                  <span className="font-mono text-xs text-sky-600 font-bold">{selectedCompanyForDetails.code}</span>
                </div>
              </div>
              <button onClick={() => setSelectedCompanyForDetails(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p><strong>{t('fraLicense')}:</strong> {selectedCompanyForDetails.fraLicense}</p>
                <p><strong>{t('commercialRegister')}:</strong> {selectedCompanyForDetails.commercialRegister}</p>
                <p><strong>{t('taxNumber')}:</strong> {selectedCompanyForDetails.taxNumber}</p>
                <p><strong>{t('creditCeiling')}:</strong> {selectedCompanyForDetails.creditCeiling.toLocaleString()} {t('egp')}</p>
              </div>

              <div>
                <strong className="block text-slate-800 mb-1">{t('requiredDocsList')}:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {selectedCompanyForDetails.requiredDocumentsList.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCompanyForDetails(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPANY FINANCING PROGRAMS & REQUIRED DOCUMENTS SETTINGS */}
      {selectedCompanyForPrograms && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
                  <Settings2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>إعدادات البرامج التمويلية والورق المطلوب:</span>
                    <span className="text-sky-700">{selectedCompanyForPrograms.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تحديد برامج التقسيط وحدودها الائتمانية والورق المطلوب لكل برنامج ليظهر للموظف أثناء رفع الطلب.
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCompanyForPrograms(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin px-1">
              
              {/* Part 1: Programs List & Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-sky-600" />
                    <span>برامج التمويل والحدود الائتمانية ({editingProgramsList.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    لكل شركة برامج مختلفة بحدود ائتمانية وورق مطلوب مختلف
                  </span>
                </div>

                {/* Existing Programs */}
                {editingProgramsList.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                    لا توجد برامج تمويلية مخصصة مسجلة بعد. يمكنك إضافة أول برنامج أدناه.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingProgramsList.map((prog, idx) => (
                      <div key={prog.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-slate-900 text-xs">{prog.name}</h5>
                              <span className="text-[10px] font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-full border border-sky-200">
                                الحد الائتماني: {prog.maxAmount?.toLocaleString()} ج.م
                              </span>
                              <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                                حتى {prog.durationMonths} شهر
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف هذا البرنامج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Program Documents */}
                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">الورق المطلوب لهذا البرنامج:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {prog.requiredDocuments?.map((doc, dIdx) => (
                              <span key={dIdx} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                • {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Program Form Box */}
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                  <h5 className="font-bold text-sky-950 text-xs flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5 text-sky-600" />
                    <span>إضافة برنامج تمويلي جديد للشركة</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم البرنامج *</label>
                      <input
                        type="text"
                        placeholder="مثال: برنامج المزارعين السريع"
                        value={newProgramName}
                        onChange={e => setNewProgramName(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">الحد الائتماني (ج.م) *</label>
                      <input
                        type="number"
                        min="1000"
                        step="5000"
                        value={newProgramMaxAmount}
                        onChange={e => setNewProgramMaxAmount(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">المدة القصوى (شهور) *</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={newProgramDuration}
                        onChange={e => setNewProgramDuration(Number(e.target.value))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Program Documents Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      الورق المطلوب للبرنامج (يظهر للموظف أثناء رفع الطلب):
                    </label>

                    {/* Quick Preset Doc Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[
                        'أصل وصورة بطاقة الرقم القومي سارية',
                        'إيصال مرافق حديث (كهرباء / غاز / مياه)',
                        'كشف حساب بنكي لآخر 6 أشهر',
                        'حيازة زراعية مميكنة أو كارت فلاح سارٍ',
                        'سجل تجاري وبطاقة ضريبية سارية',
                        'مفردات مرتب معتمدة للموظفين',
                        'عقد إيجار أو ملكية مقر النشاط'
                      ].map(preset => {
                        const isAdded = newProgramDocs.includes(preset);
                        return (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => {
                              if (isAdded) {
                                setNewProgramDocs(prev => prev.filter(d => d !== preset));
                              } else {
                                setNewProgramDocs(prev => [...prev, preset]);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                              isAdded 
                                ? 'bg-sky-600 text-white border-sky-600 font-bold' 
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {isAdded ? '✓ ' : '+ '}
                            {preset}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Doc Adder */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أو اكتب مستنداً مخصصاً إضافياً..."
                        value={tempProgramDocInput}
                        onChange={e => setTempProgramDocInput(e.target.value)}
                        className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddDocToProgram}
                        disabled={!tempProgramDocInput.trim()}
                        className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        إضافة مستند
                      </button>
                    </div>

                    {/* Selected program docs list */}
                    <div className="space-y-1 mt-2">
                      {newProgramDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 px-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                          <span className="text-slate-800 font-medium">{doc}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocFromProgram(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddProgram}
                      disabled={!newProgramName.trim()}
                      className="px-5 py-2 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                    >
                      حفظ وإضافة هذا البرنامج
                    </button>
                  </div>
                </div>
              </div>

              {/* Part 2: General Company Required Documents */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-crobsa-700" />
                  <span>الورق المطلوب العام للشركة (في حال عدم اختيار برنامج محدد)</span>
                </h4>

                <div className="space-y-1.5">
                  {editingDocsList.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-800 font-medium">{doc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGeneralDoc(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="أضف ورقة أو مستند مطلوب عام..."
                    value={tempGeneralDocInput}
                    onChange={e => setTempGeneralDocInput(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddGeneralDoc}
                    disabled={!tempGeneralDocInput.trim()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    إضافة
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                سيتم تحديث البرامج والورق المطلوب ليظهر مباشرة للموظف أثناء ملء الطلب
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForPrograms(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanyProgramsAndDocs}
                  className="px-6 py-2.5 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>حفظ التعديلات للشركة</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
