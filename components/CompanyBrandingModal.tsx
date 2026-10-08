import React, { useState } from 'react';
import { InstallmentCompany } from '../types';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Building2, 
  Sparkles, 
  Save, 
  Check, 
  Eye, 
  FileText, 
  Camera 
} from 'lucide-react';

interface CompanyBrandingModalProps {
  company: InstallmentCompany;
  onSave: (updates: Partial<InstallmentCompany>) => Promise<void>;
  onClose: () => void;
}

const COVER_PRESETS = [
  {
    name: 'أعمال وتمويل عصري',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'تكنولوجيا مالية زرقاء',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'أبراج مالية وإدارية',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80'
  },
  {
    name: 'شراكة واستثمار أخضر',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80'
  }
];

const LOGO_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
];

export const CompanyBrandingModal: React.FC<CompanyBrandingModalProps> = ({
  company,
  onSave,
  onClose
}) => {
  const [logo, setLogo] = useState(company.logo || '');
  const [coverImage, setCoverImage] = useState(
    company.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
  );
  const [name, setName] = useState(company.name || '');
  const [nameEn, setNameEn] = useState(company.nameEn || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (type === 'logo') {
          setLogo(reader.result);
        } else {
          setCoverImage(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        nameEn,
        logo,
        coverImage,
        phone,
        email
      });
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update company branding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-crobsa-950 via-crobsa-900 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">هوية وشعار وغلاف الشركة</h2>
              <p className="text-xs text-sky-200 mt-0.5">
                تخصيص اللوجو الرسمي وصورة الغلاف والمعلومات العامة لـ {company.name}
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">معاينة الغلاف واللوجو الحالية:</label>
            <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-slate-200 shadow-inner group">
              {Boolean(coverImage?.trim()) && (
                <img
                  src={coverImage}
                  alt="Company Cover"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              
              <div className="absolute bottom-4 right-4 flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-xl border-2 border-white/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {Boolean(logo?.trim()) ? (
                    <img
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight drop-shadow-md">{name || company.name}</h3>
                  <p className="text-xs text-sky-200 font-mono drop-shadow">{company.code} • {company.fraLicense}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Logo Settings */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-sky-600" />
                  <span>شعار الشركة الرسمي (Logo)</span>
                </label>
                <label className="cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm">
                  <Upload className="h-3.5 w-3.5 text-sky-600" />
                  <span>رفع صورة شعار</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                placeholder="أو ضع رابط صورة اللوجو هنا..."
                value={logo}
                onChange={e => setLogo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-bold">نماذج سريعة:</span>
                {LOGO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLogo(p)}
                    className="h-7 w-7 rounded-lg border border-slate-200 overflow-hidden hover:scale-110 transition-transform"
                  >
                    <img src={p} alt="Preset" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image Settings */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-crobsa-700" />
                  <span>صورة الغلاف (Cover Banner)</span>
                </label>
                <label className="cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm">
                  <Upload className="h-3.5 w-3.5 text-crobsa-700" />
                  <span>رفع صورة غلاف</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'cover')}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                placeholder="أو ضع رابط صورة الغلاف هنا..."
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold block">أغلفة مقترحة احترافية:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COVER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(p.url)}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        coverImage === p.url ? 'border-sky-600 ring-2 ring-sky-300' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-900/40 text-[9px] text-white font-bold flex items-center justify-center p-1 text-center">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم الشركة (عربي)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم الشركة (English)</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">رقم الهاتف الرسمي</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">البريد الإلكتروني للشركة</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  dir="ltr"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>تم حفظ وتحديث شعار وغلاف الشركة بنجاح!</span>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-crobsa-700 hover:from-sky-500 hover:to-crobsa-600 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
