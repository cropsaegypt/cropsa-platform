import React, { useState, useRef } from 'react';
import { useStore } from '../context/Store';
import { User, Role } from '../types';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const { updateUserProfile, currentCompany, branches, language } = useStore();
  
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested preset avatars for instant selection
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&auto=format&fit=crop&q=80'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(language === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت' : 'Image size must not exceed 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || undefined
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const roleTitleMap: Record<string, string> = {
    [Role.SUPER_ADMIN]: 'مدير النظام العام',
    [Role.ADMIN]: 'مسؤول العمليات والاعتمادات',
    [Role.INSTALLMENT_COMPANY]: 'مدير شركة التقسيط',
    [Role.BRANCH_MANAGER]: 'مدير فرع شركة التقسيط',
    [Role.COMPANY_EMPLOYEE]: 'موظف شركة التقسيط',
    [Role.SUPPLIER]: 'مورد معتمد',
    [Role.SALESMAN]: 'مندوب مبيعات'
  };

  const userBranch = branches.find(b => b.id === user.branchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        
        {/* Header with decorative background */}
        <div className="relative bg-gradient-to-r from-crobsa-950 via-crobsa-900 to-sky-900 p-6 text-white">
          <button 
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-white/10 border-2 border-white/30 overflow-hidden shadow-xl flex items-center justify-center text-2xl font-black text-white">
                {Boolean(avatarPreview?.trim()) ? (
                  <img 
                    src={avatarPreview} 
                    alt={user.name} 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -left-2 p-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl shadow-lg transition-transform group-hover:scale-110"
                title="تغيير الصورة الشخصية"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">{user.name}</h2>
              <p className="text-xs text-sky-200 mt-0.5 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {roleTitleMap[user.role] || user.role}
              </p>
              <span className="text-[11px] font-mono text-slate-300 mt-1 block">
                @{user.username || user.email.split('@')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Preset Photo Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر صورة شخصية سريعة أو ارفع من جهازك:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarPreview(url);
                    setAvatarUrl(url);
                  }}
                  className={`h-11 w-11 rounded-xl overflow-hidden border-2 shrink-0 transition-transform ${
                    avatarUrl === url ? 'border-sky-500 scale-105 shadow-md ring-2 ring-sky-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-3 rounded-xl border border-dashed border-sky-400 bg-sky-50/50 hover:bg-sky-100 text-sky-700 text-xs font-bold shrink-0 flex items-center gap-1 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>رفع ملف</span>
              </button>
            </div>
          </div>

          {/* Direct Avatar Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              أو رابط الصورة المباشر (URL):
            </label>
            <input 
              type="url"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setAvatarPreview(e.target.value);
              }}
              placeholder="https://..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-left"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم الكامل:
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 pl-8 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
                <UserIcon className="h-4 w-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف / واتساب:
              </label>
              <div className="relative">
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full text-xs px-3.5 py-2.5 pl-8 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  dir="ltr"
                />
                <Phone className="h-4 w-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Organizational metadata display */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                البريد الإلكتروني:
              </span>
              <span className="font-mono font-bold text-slate-800" dir="ltr">{user.email}</span>
            </div>

            {(currentCompany || user.companyId) && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  جهة العمل:
                </span>
                <span className="font-bold text-slate-800">{currentCompany?.name || 'شركة تقسيط معتمدة'}</span>
              </div>
            )}

            {(user.branchName || userBranch) && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  الفرع التابع له:
                </span>
                <span className="font-bold text-sky-700">{user.branchName || userBranch?.name}</span>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              تم حفظ وتحديث الملف الشخصي بنجاح!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-crobsa-700 hover:from-sky-500 hover:to-crobsa-600 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
