import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { InstallmentCompany, User, Role, InstallmentCompanyStaffRole, EGYPT_GOVERNORATES, CompanyReceivingChannel } from '../types';
import { compressImage } from '../utils/imageCompression';
import { 
  X, 
  Building2, 
  Lock, 
  Users, 
  Image as ImageIcon, 
  Camera, 
  Check, 
  Save, 
  Plus, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Phone, 
  Mail, 
  FileText,
  KeyRound,
  Trash2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  MapPin,
  FileSpreadsheet,
  ExternalLink,
  Crop
} from 'lucide-react';
import { CompanyBranchesManagerModal } from './CompanyBranchesManagerModal';
import { CompanyCoverCropperModal } from './CompanyCoverCropperModal';

interface CompanyProfileSettingsModalProps {
  company: InstallmentCompany;
  onClose: () => void;
}

const COVER_PRESETS = [
  {
    name: 'تدرج كحلي راقي',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
  },
  {
    name: 'تدرج نيلي مؤسسي',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
  },
  {
    name: 'تدرج زمردي مالي',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
  },
  {
    name: 'تدرج أردوازي احترافي',
    gradient: 'linear-gradient(135deg, #18181b 0%, #334155 100%)'
  }
];

export const CompanyProfileSettingsModal: React.FC<CompanyProfileSettingsModalProps> = ({
  company,
  onClose
}) => {
  const { 
    currentUser, 
    updateCompany, 
    updateCompanyAdminCredentials,
    changePassword, 
    createCompanyStaff, 
    updateStaffPassword,
    branches, 
    users, 
    language 
  } = useStore();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'info' | 'branding' | 'branches' | 'password' | 'staff'>('info');
  const [showBranchesModal, setShowBranchesModal] = useState(false);
  const [branchesModalInitialTab, setBranchesModalInitialTab] = useState<'list' | 'add' | 'excel'>('list');

  // Company Details Form
  const [companyName, setCompanyName] = useState(company.name || '');
  const [companyNameEn, setCompanyNameEn] = useState(company.nameEn || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [commercialRegister, setCommercialRegister] = useState(company.commercialRegister || '');
  const [taxNumber, setTaxNumber] = useState(company.taxNumber || '');
  const [fraLicense, setFraLicense] = useState(company.fraLicense || '');
  const [receivingChannel, setReceivingChannel] = useState<CompanyReceivingChannel>(company.receivingChannel || 'PORTAL');
  const [whatsappNumber, setWhatsappNumber] = useState(company.whatsappNumber || '');
  const [dispatchEmail, setDispatchEmail] = useState(company.dispatchEmail || '');
  const [contactPersonName, setContactPersonName] = useState(company.contactPersonName || '');

  // Branding Form
  const [logo, setLogo] = useState(company.logo || '');
  const [coverImage, setCoverImage] = useState(company.coverImage || '');
  const [coverPosition, setCoverPosition] = useState(company.coverPosition || '50% 50%');
  const [showCropperModal, setShowCropperModal] = useState(false);

  // Director Account & Password Form
  const companyAdminUser = users.find(u => 
    u.companyId === company.id && 
    (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)
  );
  const resolvedInitialUsername = companyAdminUser?.username || companyAdminUser?.email || company.adminUsername || company.adminEmail || '';
  const [directorUsername, setDirectorUsername] = useState(resolvedInitialUsername);

  useEffect(() => {
    const liveAdmin = users.find(u => 
      u.companyId === company.id && 
      (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)
    );
    const liveUsername = liveAdmin?.username || liveAdmin?.email || company.adminUsername || company.adminEmail || '';
    if (liveUsername && !directorUsername) {
      setDirectorUsername(liveUsername);
    }
  }, [users, company]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Staff creation form
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<InstallmentCompanyStaffRole>(InstallmentCompanyStaffRole.CREDIT_OFFICER);
  const [staffGov, setStaffGov] = useState('القاهرة');
  const [staffBranchId, setStaffBranchId] = useState(branches.find(b => b.companyId === company.id)?.id || '');
  const [staffPhone, setStaffPhone] = useState('');

  // Editing existing staff password state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffPassInput, setEditStaffPassInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter company branches & staff
  const companyBranches = branches.filter(b => b.companyId === company.id);
  const companyStaff = users.filter(u => u.companyId === company.id);

  // Save company info
  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompany(company.id, {
        name: companyName,
        nameEn: companyNameEn,
        phone,
        email,
        receivingChannel,
        whatsappNumber,
        dispatchEmail,
        contactPersonName,
        commercialRegister,
        taxNumber,
        fraLicense
      });
      setSaveSuccessMsg(isAr ? 'تم حفظ بيانات الشركة بنجاح' : 'Company info saved successfully');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Save branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompany(company.id, {
        logo,
        coverImage,
        coverPosition
      });
      setSaveSuccessMsg(isAr ? 'تم تحديث لوجو وكافر الشركة بنجاح' : 'Logo & Cover updated');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // File upload for branding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file, {
          maxWidth: type === 'logo' ? 400 : 1200,
          maxHeight: type === 'logo' ? 400 : 600,
          quality: 0.8
        });
        if (type === 'logo') setLogo(compressed);
        else setCoverImage(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            if (type === 'logo') setLogo(reader.result);
            else setCoverImage(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Image upload compression warning:', err);
    }
  };

  // Change Director username and/or password
  const handleChangeDirectorCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!directorUsername.trim()) {
      setPasswordError(isAr ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني للحساب' : 'Please enter a username or email for the account');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setPasswordError(isAr ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      if (updateCompanyAdminCredentials) {
        await updateCompanyAdminCredentials(company.id, {
          username: directorUsername.trim(),
          email: directorUsername.trim().includes('@') ? directorUsername.trim() : undefined,
          password: newPassword ? newPassword : undefined
        });
      }
      if (newPassword && currentUser?.id === companyAdminUser?.id) {
        await changePassword(newPassword);
      }
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      setPasswordError(isAr ? 'حدث خطأ أثناء تحديث بيانات الحساب' : 'Error updating account credentials');
    } finally {
      setSaving(false);
    }
  };

  // Create staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffUsername || !staffPassword) return;

    setSaving(true);
    try {
      const branch = companyBranches.find(b => b.id === staffBranchId) || companyBranches[0];
      await createCompanyStaff({
        name: staffName,
        username: staffUsername,
        password: staffPassword,
        staffRole,
        governorate: staffGov,
        branchId: branch?.id || 'br_01',
        branchName: branch?.name || 'الفرع الرئيسي',
        phone: staffPhone,
        permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps']
      });

      setStaffName('');
      setStaffUsername('');
      setStaffPassword('');
      setStaffPhone('');
      setSaveSuccessMsg(isAr ? 'تم تعيين الموظف وحفظ كلمة المرور الخاصة به بنجاح' : 'Staff created');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Update staff password
  const handleSaveStaffPassword = async (userId: string) => {
    if (!editStaffPassInput.trim()) return;
    try {
      await updateStaffPassword(userId, editStaffPassInput.trim());
      setEditingStaffId(null);
      setEditStaffPassInput('');
      setSaveSuccessMsg(isAr ? 'تم تعديل كلمة مرور الموظف بنجاح' : 'Staff password updated');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Building2 className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-black">{isAr ? 'إعدادات ملف شركة التقسيط وكلمات المرور' : 'Company Profile & Security'}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{company.name} ({company.code})</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Toast Notification */}
        {saveSuccessMsg && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 shrink-0 overflow-x-auto">
          {[
            { id: 'info', label: isAr ? 'الملف والبيانات' : 'Company Info', icon: Building2 },
            { id: 'branding', label: isAr ? 'اللوجو والكافر' : 'Logo & Cover', icon: ImageIcon },
            { id: 'branches', label: isAr ? 'الفروع وشيت الإكسيل' : 'Branches & Excel', icon: MapPin, count: companyBranches.length },
            { id: 'password', label: isAr ? 'حساب وباسورد المدير' : 'Director Account & Password', icon: KeyRound },
            { id: 'staff', label: isAr ? 'الموظفين وكلمات مرورهم' : 'Staff & Passwords', icon: Users, count: companyStaff.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                  isActive 
                    ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl font-black shadow-sm' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: COMPANY INFO */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveCompanyInfo} className="space-y-4 max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-4">{isAr ? 'البيانات الأساسية والتراخيص الرسمية' : 'Basic Company Information'}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'اسم الشركة (بالعربية)' : 'Company Name (Ar)'}</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'اسم الشركة (بالإنجليزية)' : 'Company Name (En)'}</label>
                  <input
                    type="text"
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'هاتف التواصل الرئيسي' : 'Main Phone'}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني الرسمي' : 'Official Email'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'رقم السجل التجاري' : 'Commercial Register'}</label>
                  <input
                    type="text"
                    value={commercialRegister}
                    onChange={(e) => setCommercialRegister(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'رقم البطاقة الضريبية' : 'Tax Card Number'}</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'ترخيص هيئة الرقابة المالية (FRA)' : 'FRA License'}</label>
                <input
                  type="text"
                  value={fraLicense}
                  onChange={(e) => setFraLicense(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold text-emerald-800"
                />
              </div>

              {/* Receiving Channel Section */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'قناة استقبال طلبات التمويل والمراسلات:' : 'Application Receiving Channel:'}</span>
                  </label>
                  <select
                    value={receivingChannel}
                    onChange={(e) => setReceivingChannel(e.target.value as CompanyReceivingChannel)}
                    className="w-full p-2.5 text-xs font-bold bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PORTAL">🌐 داخل بوابة المنصة فقط (Internal Portal)</option>
                    <option value="WHATSAPP">📲 خارج البورتال - عبر رسائل الواتساب المباشرة (WhatsApp Only)</option>
                    <option value="EMAIL">📧 خارج البورتال - عبر البريد الإلكتروني الرسمي (Email Only)</option>
                    <option value="WHATSAPP_AND_EMAIL">🔄 خارج البورتال - واتساب وبريد إلكتروني معاً (WhatsApp & Email)</option>
                  </select>
                </div>

                {receivingChannel !== 'PORTAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'رقم هاتف الواتساب:' : 'WhatsApp Number:'}
                      </label>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="01012345678"
                        className="w-full p-2 text-xs bg-white border border-emerald-300 rounded-lg font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'بريد استقبال الطلبات:' : 'Dispatch Email:'}
                      </label>
                      <input
                        type="email"
                        value={dispatchEmail}
                        onChange={(e) => setDispatchEmail(e.target.value)}
                        placeholder="credit@company.eg"
                        className="w-full p-2 text-xs bg-white border border-emerald-300 rounded-lg font-mono"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'مسؤول التواصل / الائتمان:' : 'Contact Person:'}
                      </label>
                      <input
                        type="text"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder="أ. أحمد ممدوح"
                        className="w-full p-2 text-xs bg-white border border-emerald-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BRANDING (LOGO & COVER) */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBranding} className="space-y-6 max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">{isAr ? 'تخصيص غلاف الشركة (الكافر) والشعار (اللوجو)' : 'Logo & Cover Image Customization'}</h3>

              {/* Live Preview Card */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md relative">
                <div 
                  className="h-40 w-full bg-cover relative"
                  style={{ 
                    backgroundImage: coverImage?.trim() ? `url(${coverImage})` : undefined,
                    backgroundPosition: coverPosition || '50% 50%'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
                  
                  {/* Action buttons overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCropperModal(true)}
                      className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/20 transition-all shadow-md cursor-pointer"
                      title="تحديد الجزء الظاهر من الغلاف"
                    >
                      <Crop className="h-3.5 w-3.5 text-white" />
                      <span>{isAr ? 'ضبط موضع الكافر' : 'Adjust Focus'}</span>
                    </button>

                    <label className="bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md cursor-pointer flex items-center gap-1.5 border border-white/20 transition-all">
                      <Camera className="h-3.5 w-3.5 text-sky-400" />
                      <span>{isAr ? 'رفع غلاف مخصص' : 'Upload Cover'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3 -mt-10 relative z-10">
                    <div className="h-16 w-16 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-white flex items-center justify-center relative group">
                      {Boolean(logo?.trim()) ? (
                        <img src={logo} alt="Logo" className="h-full w-full object-contain rounded-xl" />
                      ) : (
                        <Building2 className="h-8 w-8 text-slate-400" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white cursor-pointer transition-opacity">
                        <Camera className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                      </label>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{companyName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{company.code}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{isAr ? 'أو اختر غلافاً من النماذج الراقية الجاهزة:' : 'Choose from presets:'}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COVER_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverImage(preset.gradient)}
                      className={`h-20 rounded-xl overflow-hidden border-2 relative transition-all ${
                        coverImage === preset.gradient ? 'border-sky-500 ring-2 ring-sky-300' : 'border-slate-200'
                      }`}
                    >
                      <div className="w-full h-full" style={{ background: preset.gradient }} />
                      <div className="absolute inset-0 bg-black/30 flex items-end p-1.5 text-[10px] text-white font-bold">
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image Links Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'رابط لوجو الشركة (URL)' : 'Logo Image URL'}</label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'رابط غلاف الشركة (URL)' : 'Cover Image URL'}</label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'اعتماد اللوجو والكافر' : 'Save Branding')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: BRANCHES & EXCEL SPREADSHEET */}
          {activeTab === 'branches' && (
            <div className="space-y-6">
              {/* Branch Stats & Quick Action Bar */}
              <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-sky-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400 border border-white/10">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {isAr ? 'فروع الشركة وشيت الإكسيل المجمع' : 'Company Branches & Bulk Excel'}
                    </h3>
                    <p className="text-xs text-sky-200 mt-0.5">
                      {isAr 
                        ? `مسجل حالياً ${companyBranches.length} فروع في ${Array.from(new Set(companyBranches.map(b => b.governorate))).length} محافظات`
                        : `${companyBranches.length} branches registered across ${Array.from(new Set(companyBranches.map(b => b.governorate))).length} governorates`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setBranchesModalInitialTab('excel');
                      setShowBranchesModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{isAr ? 'رفع شيت إكسيل الفروع (CSV)' : 'Import Excel Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBranchesModalInitialTab('add');
                      setShowBranchesModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAr ? 'إضافة فرع جديد' : 'Add Branch'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBranchesModalInitialTab('list');
                      setShowBranchesModal(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{isAr ? 'الإدارة الموسعة' : 'Advanced Manager'}</span>
                  </button>
                </div>
              </div>

              {/* Branches Quick Grid */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-sky-600" />
                    <span>{isAr ? 'قائمة الفروع التابعة للشركة' : 'Registered Branches'}</span>
                    <span className="text-[11px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      {companyBranches.length}
                    </span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      setBranchesModalInitialTab('list');
                      setShowBranchesModal(true);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                  >
                    <span>{isAr ? 'تعديل أو حذف الفروع' : 'Edit or Delete Branches'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                {companyBranches.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">
                      {isAr ? 'لا توجد فروع مسجلة لهذه الشركة حتى الآن' : 'No branches registered yet for this company'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isAr ? 'يمكنك رفع شيت الفروع كاملاً دفعة واحدة أو إضافتها يدوياً' : 'You can upload an Excel sheet or add them manually'}
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setBranchesModalInitialTab('excel');
                          setShowBranchesModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>{isAr ? 'رفع شيت إكسيل (CSV)' : 'Upload Excel Sheet'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBranchesModalInitialTab('add');
                          setShowBranchesModal(true);
                        }}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{isAr ? 'إضافة فرع يدوي' : 'Add Branch'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {companyBranches.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-sky-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h5 className="font-bold text-xs text-slate-900">{b.name}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 shrink-0">
                              {b.governorate}
                            </span>
                          </div>
                          {b.address && (
                            <p className="text-[11px] text-slate-500 mb-1 flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{b.address}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                            {b.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {b.phone}
                              </span>
                            )}
                            {b.managerName && (
                              <span className="text-slate-600">
                                مدير الفرع: {b.managerName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            b.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {b.status === 'ACTIVE' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setBranchesModalInitialTab('list');
                              setShowBranchesModal(true);
                            }}
                            className="text-sky-600 hover:text-sky-800 font-bold"
                          >
                            {isAr ? 'تعديل التفاصيل' : 'Edit Details'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DIRECTOR CREDENTIALS (USERNAME & PASSWORD) */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangeDirectorCredentials} className="space-y-4 max-w-lg bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="text-sm font-black text-slate-900">{isAr ? 'بيانات حساب المدير العام (اسم المستخدم وكلمة المرور)' : 'Director Account & Password'}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr ? 'يمكنك تعديل اسم المستخدم / البريد الإلكتروني وكلمة المرور لحساب مدير الشركة من هنا مباشرة' : 'You can modify the username / email and password for the company administrator account directly from here'}
                </p>
              </div>
              
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {isAr ? 'تم تحديث بيانات حساب مدير الشركة بنجاح!' : 'Director credentials updated successfully!'}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اسم المستخدم / البريد الإلكتروني للدخول' : 'Username / Login Email'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={directorUsername}
                    onChange={(e) => setDirectorUsername(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAr ? 'يستخدم هذا البريد أو الاسم لتسجيل الدخول إلى بورتال الشركة واستعادة الحساب' : 'Used to log into the company portal and for password recovery'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور الجديدة (اختياري - اتركها فارغة إذا لم ترغب بالتعديل)' : 'New Password (optional - leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              {newPassword && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'} <span className="text-rose-500">*</span></label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="******"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    required={Boolean(newPassword)}
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Lock className="h-4 w-4 text-sky-400" />
                  <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ بيانات الحساب' : 'Save Credentials')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: STAFF & PASSWORDS MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              
              {/* Add New Staff Form */}
              <form onSubmit={handleCreateStaff} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Users className="h-4 w-4 text-sky-600" />
                  <h3 className="text-sm font-black text-slate-900">{isAr ? 'تعيين موظف جديد وتحديد كلمة المرور الخاصة به' : 'Assign New Staff & Set Password'}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'اسم الموظف الكامل' : 'Full Name'}</label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="أحمد علي"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'اسم المستخدم (لتسجيل الدخول)' : 'Username'}</label>
                    <input
                      type="text"
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      placeholder="ahmed_credit"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'كلمة مرور الموظف (Password)' : 'Staff Password'}</label>
                    <input
                      type="text"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="pass1234"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'المسمى الوظيفي' : 'Role'}</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as any)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value={InstallmentCompanyStaffRole.CREDIT_OFFICER}>مسؤول دراسة ائتمانية ومخاطر</option>
                      <option value={InstallmentCompanyStaffRole.BRANCH_MANAGER}>مدير فرع</option>
                      <option value={InstallmentCompanyStaffRole.COLLECTION_AGENT}>مسؤول تحصيل ومتأخرات</option>
                      <option value={InstallmentCompanyStaffRole.COMPANY_EMPLOYEE}>موظف تقسيط عام</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'المحافظة' : 'Governorate'}</label>
                    <select
                      value={staffGov}
                      onChange={(e) => setStaffGov(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {EGYPT_GOVERNORATES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isAr ? 'الفرع المسند إليه' : 'Assigned Branch'}</label>
                    <select
                      value={staffBranchId}
                      onChange={(e) => setStaffBranchId(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {companyBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.governorate})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{isAr ? 'إضافة الموظف واعتماد حسابه' : 'Add Staff Member'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Staff List with Direct Password Change */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900">{isAr ? 'الموظفون الحاليون وإدارة كلمات مرورهم المباشرة' : 'Current Staff & Passwords'}</h4>
                  <span className="text-xs text-slate-500 font-bold">{companyStaff.length} {isAr ? 'موظف مسجل' : 'staff'}</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {companyStaff.map(member => (
                    <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-sm text-slate-700">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-slate-900">{member.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {member.staffRole || member.role}
                            </span>
                            {member.branchName && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                                {member.branchName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                            <span>User: <strong className="text-slate-700 font-bold">{member.username || member.email}</strong></span>
                            <span>•</span>
                            <span>Pass: <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded font-mono font-bold">{member.password || '******'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Password Quick Update Form */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {editingStaffId === member.id ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in">
                            <input
                              type="text"
                              value={editStaffPassInput}
                              onChange={(e) => setEditStaffPassInput(e.target.value)}
                              placeholder={isAr ? 'الباسورد الجديد' : 'New pass'}
                              className="w-32 p-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStaffPassword(member.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              title="حفظ الباسورد الجديد"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffId(null)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffId(member.id);
                              setEditStaffPassInput(member.password || '');
                            }}
                            className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            <span>{isAr ? 'تغيير الباسورد' : 'Change Pass'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Embedded Branches & Excel Manager Modal */}
      {showBranchesModal && (
        <CompanyBranchesManagerModal
          company={company}
          onClose={() => setShowBranchesModal(false)}
          initialTab={branchesModalInitialTab}
        />
      )}

      {/* Embedded Cover Focal Point Cropper Modal */}
      {showCropperModal && (
        <CompanyCoverCropperModal
          isOpen={showCropperModal}
          onClose={() => setShowCropperModal(false)}
          coverImageUrl={coverImage?.trim() || company.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80'}
          currentPosition={coverPosition}
          companyName={companyName}
          companyLogo={logo}
          onSave={async (newPos) => {
            setCoverPosition(newPos);
            await updateCompany(company.id, { coverPosition: newPos });
            setShowCropperModal(false);
            setSaveSuccessMsg(isAr ? 'تم ضبط وحفظ موضع الكافر بنجاح' : 'Cover position saved');
            setTimeout(() => setSaveSuccessMsg(''), 3000);
          }}
        />
      )}
    </div>
  );
};
