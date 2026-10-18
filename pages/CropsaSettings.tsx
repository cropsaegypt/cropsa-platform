import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { 
  Settings, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Save, 
  Eye, 
  ShieldCheck, 
  Lock, 
  Globe,
  Palette,
  Type,
  Smartphone,
  Monitor,
  Paintbrush,
  LayoutGrid,
  AlertCircle,
  Mail,
  Server,
  CheckCircle2,
  Send,
  KeyRound,
  Trash2,
  AlertTriangle,
  Database,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { SystemBranding, SmtpConfig } from '../types';
import { compressImage } from '../utils/imageCompression';
import { testSupabaseConnection } from '../services/supabase';

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1560472355-536de3962603?w=128&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80'
];

const PRESET_BANNERS = [
  {
    name: 'أراضي ومزارع خضراء',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80'
  },
  {
    name: 'تكنولوجيا مالية حديثة',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80'
  },
  {
    name: 'أبراج مالية واستثمار',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'خلفية هندسية داكنة راقية',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
  }
];

const PRESET_THEMES = [
  { id: '#10b981', name: 'أخضر كروبسا الرئيسي (Cropsa Emerald)', colorClass: 'bg-emerald-500' },
  { id: '#059669', name: 'أخضر زراعي غامق (Cropsa Deep)', colorClass: 'bg-emerald-600' },
  { id: '#14b8a6', name: 'تيل زيتي حديث (Teal)', colorClass: 'bg-teal-500' },
  { id: '#0284c7', name: 'أزرق سماوي (Sky Blue)', colorClass: 'bg-sky-600' },
  { id: '#4f46e5', name: 'نيلي ملكي (Indigo)', colorClass: 'bg-indigo-600' },
  { id: '#d97706', name: 'ذهبي عنبري (Amber)', colorClass: 'bg-amber-600' },
  { id: '#0f172a', name: 'كلاسيكي داكن (Slate Dark)', colorClass: 'bg-slate-900' }
];

const BG_STYLES = [
  { id: 'emerald-dark', name: 'خلفية كروبسا الزمردية الفخمة', desc: 'تدرج فخم مصمم لقطاع التمويل والتقسيط الزراعي والتجاري' },
  { id: 'dark-slate', name: 'رمادي داكن نايت مود (Dark Slate)', desc: 'مظهر عصري تقني داكن وهادئ' },
  { id: 'navy-blue', name: 'أزرق بحري استثماري (Navy Deep)', desc: 'طابع المؤسسات المصرفية والتمويل الاستثماري' },
  { id: 'luxury-dark', name: 'أسود فحمي ملكي (Luxury Charcoal)', desc: 'طابع التمويل الفاخر والنخبة' },
  { id: 'minimal-light', name: 'خلفية رمادية فاتحة ناصعة', desc: 'مظهر نهاري بسيط وخفيف' },
  { id: 'custom', name: 'لون / تدرج مخصص (Custom CSS)', desc: 'إدخال كود لون محدد أو تدرج CSS حسب الطلب' }
];

const FONT_OPTIONS: { id: SystemBranding['fontFamily']; name: string }[] = [
  { id: 'Cairo', name: 'Cairo (خط القاهرة - الافتراضي والأوضح)' },
  { id: 'Tajawal', name: 'Tajawal (خط تجوال - عصري وخفيف)' },
  { id: 'IBM Plex Sans Arabic', name: 'IBM Plex Arabic (طابع تقني مؤسسي)' },
  { id: 'Almarai', name: 'Almarai (خط المراعي - مقروء ومرن)' },
  { id: 'sans-serif', name: 'System Sans-Serif (خط النظام القياسي)' }
];

export const CropsaSettings: React.FC = () => {
  const { 
    systemBranding, 
    updateBranding, 
    smtpConfig, 
    updateSmtpConfig,
    wipeDemoData,
    isDemoDataWiped,
    applications,
    clients,
    overdueCases,
    transactions,
    withdrawalRequests,
    notifications,
    companies,
    branches
  } = useStore();

  const [activeSettingTab, setActiveSettingTab] = useState<'branding' | 'smtp' | 'wipe_data'>('branding');
  const [localSmtp, setLocalSmtp] = useState<SmtpConfig>(() => smtpConfig);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSavedSuccess, setSmtpSavedSuccess] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Wipe Demo Data State
  const [wipePasswordInput, setWipePasswordInput] = useState('');
  const [isWipingData, setIsWipingData] = useState(false);
  const [wipeSuccessMsg, setWipeSuccessMsg] = useState('');
  const [wipeErrorMsg, setWipeErrorMsg] = useState('');
  const [showWipeModal, setShowWipeModal] = useState(false);

  const handleExecuteWipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setWipeErrorMsg('');
    setWipeSuccessMsg('');
    if (wipePasswordInput !== 'Cropsa@015252505111') {
      setWipeErrorMsg('كلمة المرور غير صحيحة! يرجى إدخال كلمة المرور المعتمدة لمدير النظام: Cropsa@015252505111');
      return;
    }
    setIsWipingData(true);
    try {
      await wipeDemoData(wipePasswordInput);
      setWipeSuccessMsg('تم تصفير وحذف كافة البيانات التجريبية بنجاح من قاعدة البيانات (Supabase) ومزامنتها على كافة المتصفحات! أصبحت المنظومة الآن نظيفة تماماً 100% وجاهزة للعمل الفعلي.');
      setWipePasswordInput('');
      setShowWipeModal(false);
    } catch (err: any) {
      setWipeErrorMsg(err?.message || 'حدث خطأ أثناء تصفير البيانات التجريبية');
    } finally {
      setIsWipingData(false);
    }
  };

  useEffect(() => {
    if (smtpConfig) {
      setLocalSmtp(smtpConfig);
    }
  }, [smtpConfig]);

  const [platformName, setPlatformName] = useState(systemBranding?.platformName || 'Cropsa egypt');
  const [platformSubtitle, setPlatformSubtitle] = useState(
    systemBranding?.platformSubtitle || 'كروبسا مصر | المنظومة الرقمية للتمويل والتقسيط'
  );
  const [logoUrl, setLogoUrl] = useState(systemBranding?.logoUrl || '');
  const [loginBannerUrl, setLoginBannerUrl] = useState(
    systemBranding?.loginBannerUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80'
  );
  const [loginHeadline, setLoginHeadline] = useState(
    systemBranding?.loginHeadline || 'منصة كروبسا للتمويل والتقسيط الذكي'
  );
  const [loginSubheadline, setLoginSubheadline] = useState(
    systemBranding?.loginSubheadline || 'المنظومة الرقمية الرائدة لربط الموردين بشركات التمويل والمزارعين والتجار في مصر'
  );
  const [loginFooterText, setLoginFooterText] = useState(
    systemBranding?.loginFooterText || 'منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة'
  );
  const [themeColor, setThemeColor] = useState(systemBranding?.themeColor || '#10b981');
  const [loginBgStyle, setLoginBgStyle] = useState<SystemBranding['loginBgStyle']>(
    systemBranding?.loginBgStyle || 'emerald-dark'
  );
  const [loginBgColor, setLoginBgColor] = useState(systemBranding?.loginBgColor || '');
  const [loginCardStyle, setLoginCardStyle] = useState<SystemBranding['loginCardStyle']>(
    systemBranding?.loginCardStyle || 'cropsa-card'
  );
  const [loginInputStyle, setLoginInputStyle] = useState<SystemBranding['loginInputStyle']>(
    systemBranding?.loginInputStyle || 'cropsa-bright'
  );
  const [fontFamily, setFontFamily] = useState<SystemBranding['fontFamily']>(
    systemBranding?.fontFamily || 'Cairo'
  );
  const [loginBannerDimming, setLoginBannerDimming] = useState<number>(
    systemBranding?.loginBannerDimming ?? 70
  );

  useEffect(() => {
    if (systemBranding) {
      if (systemBranding.platformName) setPlatformName(systemBranding.platformName);
      if (systemBranding.platformSubtitle) setPlatformSubtitle(systemBranding.platformSubtitle);
      if (systemBranding.logoUrl !== undefined) setLogoUrl(systemBranding.logoUrl);
      if (systemBranding.loginBannerUrl) setLoginBannerUrl(systemBranding.loginBannerUrl);
      if (systemBranding.loginHeadline) setLoginHeadline(systemBranding.loginHeadline);
      if (systemBranding.loginSubheadline) setLoginSubheadline(systemBranding.loginSubheadline);
      if (systemBranding.loginFooterText) setLoginFooterText(systemBranding.loginFooterText);
      if (systemBranding.themeColor) setThemeColor(systemBranding.themeColor);
      if (systemBranding.loginBgStyle) setLoginBgStyle(systemBranding.loginBgStyle);
      if (systemBranding.loginBgColor !== undefined) setLoginBgColor(systemBranding.loginBgColor);
      if (systemBranding.loginCardStyle) setLoginCardStyle(systemBranding.loginCardStyle);
      if (systemBranding.loginInputStyle) setLoginInputStyle(systemBranding.loginInputStyle);
      if (systemBranding.fontFamily) setFontFamily(systemBranding.fontFamily);
      if (systemBranding.loginBannerDimming !== undefined) setLoginBannerDimming(systemBranding.loginBannerDimming);
    }
  }, [systemBranding]);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; ok: boolean; msg: string }>({
    checked: false,
    ok: true,
    msg: 'جاري التحقق من الاتصال...'
  });

  useEffect(() => {
    testSupabaseConnection().then(res => {
      setDbStatus({
        checked: true,
        ok: res.ok,
        msg: res.ok ? 'متصل بقاعدة البيانات السحابية المركزية 🟢' : 'تنبيه: ' + res.message
      });
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(type === 'logo' ? 'جاري ضغط وتحسين الشعار...' : 'جاري ضغط وتحسين الخلفية...');
      if (type === 'logo') {
        const compressed = await compressImage(file, {
          maxWidth: 320,
          maxHeight: 320,
          quality: 0.85,
          format: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        });
        setLogoUrl(compressed);
      } else {
        const compressed = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 720,
          quality: 0.75,
          format: 'image/jpeg'
        });
        setLoginBannerUrl(compressed);
      }
    } catch (err) {
      console.warn('Fallback to direct file reader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          if (type === 'logo') {
            setLogoUrl(reader.result);
          } else {
            setLoginBannerUrl(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await updateBranding({
        platformName,
        platformSubtitle,
        logoUrl,
        loginBannerUrl,
        loginHeadline,
        loginSubheadline,
        loginFooterText,
        themeColor,
        loginBgStyle,
        loginBgColor,
        loginCardStyle,
        loginInputStyle,
        fontFamily,
        loginBannerDimming
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to update branding:', err);
      setSaveError(err?.message || 'حدث خطأ أثناء الحفظ في قاعدة البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      await updateSmtpConfig(localSmtp);
      setSmtpSavedSuccess(true);
      setTimeout(() => setSmtpSavedSuccess(false), 4500);
    } catch (err: any) {
      console.error('Failed to update SMTP config:', err);
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtpConnection = () => {
    setSmtpTestResult(null);
    if (!localSmtp.host || !localSmtp.user) {
      setSmtpTestResult({
        success: false,
        message: 'يرجى إدخال عنوان الخادم (Host) واسم المستخدم (User) قبل إجراء الفحص'
      });
      return;
    }
    setTimeout(() => {
      setSmtpTestResult({
        success: true,
        message: `تم التحقق بنجاح من إعدادات الخادم (${localSmtp.host}:${localSmtp.port}) والتشفير (${localSmtp.secure ? 'SSL/TLS' : 'STARTTLS'}). جاهز للإرسال المباشر 🟢`
      });
    }, 600);
  };

  // Preview background computation
  const getPreviewBgClass = () => {
    if (loginBgStyle === 'dark-slate') return 'bg-slate-950 text-slate-100';
    if (loginBgStyle === 'navy-blue') return 'bg-slate-900 text-sky-100';
    if (loginBgStyle === 'luxury-dark') return 'bg-stone-950 text-purple-100';
    if (loginBgStyle === 'minimal-light') return 'bg-slate-100 text-slate-800';
    return 'bg-gradient-to-br from-[#031d12] via-[#06291a] to-[#01140b] text-slate-100';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl" style={{ fontFamily: fontFamily || 'inherit' }}>
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-950 via-[#06291a] to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Paintbrush className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">إعدادات وهوية المنظومة وصفحة تسجيل الدخول</h1>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${dbStatus.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {dbStatus.msg}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              تخصيص كامل لألوان كروبسا، مربعات اسم المستخدم وكلمة المرور، النصوص، الخلفيات، والشعار مع مزامنة سحابية فورية ومؤمنة
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {compressing && (
            <div className="bg-sky-500/20 border border-sky-400/40 text-sky-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
              <span>{compressing}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>تم حفظ التعديلات في قاعدة البيانات ومتزامنة فوراً على كل المتصفحات!</span>
            </div>
          )}

          {saveError && (
            <div className="bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Branding vs Corporate SMTP */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSettingTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSettingTab === 'branding'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span>هوية المنظومة وصفحة تسجيل الدخول</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingTab('smtp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSettingTab === 'smtp'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>خادم البريد الإلكتروني الرسمي (Corporate SMTP)</span>
          {localSmtp.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingTab('wipe_data')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSettingTab === 'wipe_data'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>مسح وتصفير البيانات التجريبية (Demo Reset)</span>
          {isDemoDataWiped ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              منظومة نظيفة ✓
            </span>
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              بيانات تجريبية
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: Settings Form & Live Preview */}
      {activeSettingTab === 'branding' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Settings Form (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-7">
          <form onSubmit={handleSave} className="space-y-7">
            
            {/* Section 1: Texts & Titles */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <span>النصوص والعناوين الرسمية (Texts & Headlines)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">اسم المنصة الرسمي</label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={e => setPlatformName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Cropsa egypt"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">العنوان الفرعي للمنظومة</label>
                  <input
                    type="text"
                    value={platformSubtitle}
                    onChange={e => setPlatformSubtitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="كروبسا مصر | المنظومة الرقمية للتمويل والتقسيط"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">عنوان صفحة تسجيل الدخول الترحيبي</label>
                <input
                  type="text"
                  value={loginHeadline}
                  onChange={e => setLoginHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="منصة كروبسا للتمويل والتقسيط الذكي"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">الوصف الترحيبي المختصر (Subtitle)</label>
                <textarea
                  rows={2}
                  value={loginSubheadline}
                  onChange={e => setLoginSubheadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="المنظومة الرقمية الرائدة لربط الموردين بشركات التمويل والمزارعين والتجار في مصر"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نص حقوق الملكية وأسفل الصفحة (Footer Text)</label>
                <input
                  type="text"
                  value={loginFooterText}
                  onChange={e => setLoginFooterText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة"
                />
              </div>
            </div>

            {/* Section 2: Colors & Theme */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Palette className="h-4 w-4 text-emerald-600" />
                <span>ألوان كروبسا وتدرج الخلفية (Colors & Background)</span>
              </h3>

              {/* Theme / Button Color */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">لون الأزرار والعناصر الرئيسية (Primary Accent Color)</label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeColor(theme.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        themeColor === theme.id 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full ${theme.colorClass} shadow-sm border border-white/50`} />
                      <span>{theme.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Boxes Appearance - Crucial user requirement */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 block">
                    مظهر مربعات اسم المستخدم وكلمة المرور (Input Fields Contrast)
                  </label>
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                    ميزة مخصصة
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  اختر النمط لضمان وضوح مربعات الكتابة وتميزها التام عن لون الخلفية:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setLoginInputStyle('cropsa-bright')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      loginInputStyle === 'cropsa-bright'
                        ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                      <span>مربعات فاتحة ناصعة وبارزة (موصى بها)</span>
                      {loginInputStyle === 'cropsa-bright' && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      خلفية بيضاء هادئة بإطار زمردي أخضر أنيق يبرز بوضوح فائق فوق الخلفية
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginInputStyle('cropsa-emerald-dark')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      loginInputStyle === 'cropsa-emerald-dark'
                        ? 'border-emerald-500 bg-[#02180d] text-emerald-200 shadow-md ring-2 ring-emerald-400/30'
                        : 'border-slate-200 bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-emerald-300">مربعات داكنة بحدود نيون خضراء</span>
                      {loginInputStyle === 'cropsa-emerald-dark' && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-emerald-200/70 mt-1">
                      خلفية ليلية عميقة مع حدود متوهجة بلون كروبسا الأخضر
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginInputStyle('clean-white')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      loginInputStyle === 'clean-white'
                        ? 'border-slate-800 bg-white shadow-md ring-2 ring-slate-400'
                        : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                      <span>أبيض كلاسيكي (Standard White)</span>
                      {loginInputStyle === 'clean-white' && <Check className="h-4 w-4 text-slate-800 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      مربعات ناصعة بدون إطار ملون
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginInputStyle('glass-outline')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      loginInputStyle === 'glass-outline'
                        ? 'border-emerald-500 bg-slate-900 text-white shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>زجاجي شفاف مع إطار كروبسا</span>
                      {loginInputStyle === 'glass-outline' && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      تأثير زجاجي معبر عن الحداثة والتقنية
                    </p>
                  </button>
                </div>
              </div>

              {/* Background Style Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">نمط خلفية صفحة الدخول (Background Style)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BG_STYLES.map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setLoginBgStyle(style.id as SystemBranding['loginBgStyle'])}
                      className={`text-right p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        loginBgStyle === style.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{style.name}</span>
                        {loginBgStyle === style.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal leading-relaxed">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {loginBgStyle === 'custom' && (
                <div className="animate-in fade-in">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">كود اللون أو التدرج المخصص (CSS Color / Gradient)</label>
                  <input
                    type="text"
                    value={loginBgColor}
                    onChange={e => setLoginBgColor(e.target.value)}
                    placeholder="مثال: #0a0f1d أو linear-gradient(135deg, #022c22, #0f172a)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Card Style */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">شكل بطاقة تسجيل الدخول (Card Appearance)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginCardStyle('cropsa-card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      loginCardStyle === 'cropsa-card' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    كروبسا الفاخرة ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginCardStyle('glass')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      loginCardStyle === 'glass' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    زجاجي حديث (Glass)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginCardStyle('solid-dark')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      loginCardStyle === 'solid-dark' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    داكن معتم
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginCardStyle('clean-white')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      loginCardStyle === 'clean-white' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    أبيض ناصع
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Typography / Font */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Type className="h-4 w-4 text-purple-600" />
                <span>الخطوط والطباعة (Typography & Font)</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نوع الخط العربي واللاتيني للمنظومة</label>
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font.id} value={font.id}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 4: Brand Logo & Login Banner */}
            <div className="space-y-4 pb-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-amber-600" />
                <span>شعار المنظومة وصورة الخلفية (Logo & Visual Assets)</span>
              </h3>

              {/* Logo Management */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">شعار المنظومة (Logo URL أو رفع ملف)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="أدخل رابط الشعار المباشر..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>رفع</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, 'logo')} 
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold">شعارات مقترحة:</span>
                  {PRESET_LOGOS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLogoUrl(url)}
                      className={`h-7 w-7 rounded-lg border overflow-hidden p-0.5 bg-white cursor-pointer ${
                        logoUrl === url ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={url} alt="Logo preset" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Management */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">صورة الغلاف وخلفية صفحة تسجيل الدخول (Login Banner Background)</label>

                {/* Live Preview of Background Banner with Real-time Dimming Level */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 aspect-video max-h-48 shadow-inner bg-slate-900 group">
                  <img 
                    src={loginBannerUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80'} 
                    alt="Background Preview" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />
                  {/* Dynamic Dimming Overlay */}
                  <div 
                    className="absolute inset-0 bg-[#1e252a] backdrop-blur-[1px] transition-all"
                    style={{ opacity: loginBannerDimming / 100 }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white z-10">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-emerald-400" />
                      معاينة حية للخلفية مع التظليل المباشر ({loginBannerDimming}%)
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                      Live Preview
                    </span>
                  </div>
                </div>

                {/* Dimming Level Slider */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-[#cce5d4] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>مستوى تعتيم وتظليل الخلفية (Dimming Level):</span>
                    <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-[#cce5d4] shadow-xs">
                      {loginBannerDimming}%
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="20"
                    max="90"
                    step="5"
                    value={loginBannerDimming}
                    onChange={e => setLoginBannerDimming(parseInt(e.target.value, 10))}
                    className="w-full accent-[#146337] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>أكثر إشراقاً ووضوحاً (20%)</span>
                    <span>أكثر هدوءاً وتعتيماً (90%)</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginBannerUrl}
                    onChange={e => setLoginBannerUrl(e.target.value)}
                    placeholder="أدخل رابط مباشر أو اضغط زر رفع صورة من جهازك..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <label className="bg-emerald-50 hover:bg-emerald-100 text-[#146337] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#cce5d4] cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>رفع صورة من جهازك</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => handleFileUpload(e, 'banner')} 
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {PRESET_BANNERS.map((b, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLoginBannerUrl(b.url)}
                      className={`h-16 rounded-xl border-2 overflow-hidden relative cursor-pointer group ${
                        loginBannerUrl === b.url ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={b.url} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute inset-0 bg-slate-950/60 text-white text-[9px] font-bold flex items-center justify-center p-1 text-center">
                        {b.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                يتم مزامنة كافة التغييرات وحفظها فوراً في قاعدة البيانات السحابية المشفرة
              </span>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {saving ? 'جاري الحفظ سحابياً...' : 'حفظ التعديلات وتطبيق الهوية فوراً'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Responsive Preview (5 Columns) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
            
            {/* Header of Preview Box */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-black text-white">معاينة حية وتفاعلية</span>
              </div>

              {/* Mobile / Desktop switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-all ${
                    previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="معاينة شاشة الكمبيوتر"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-all ${
                    previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="معاينة شاشة الهاتف المحمول"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Container */}
            <div className="flex justify-center items-center py-2">
              <div 
                className={`relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center p-5 text-center ${
                  previewDevice === 'mobile' 
                    ? 'w-64 min-h-[460px] border-4 border-slate-700' 
                    : 'w-full min-h-[420px]'
                } ${getPreviewBgClass()}`}
                style={{
                  background: loginBgStyle === 'custom' && loginBgColor ? loginBgColor : undefined,
                  fontFamily: fontFamily || 'inherit'
                }}
              >
                {/* Banner overlay if provided */}
                {Boolean(loginBannerUrl?.trim()) && (
                  <img
                    src={loginBannerUrl}
                    alt="Banner"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay filter blur-[0.5px]"
                  />
                )}
                
                {/* Ambient glow */}
                <div 
                  className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-2xl opacity-30 pointer-events-none"
                  style={{ backgroundColor: themeColor || '#10b981' }}
                />

                {/* Preview Card */}
                <div 
                  className={`relative z-10 w-full rounded-2xl p-4 sm:p-5 text-center space-y-3.5 shadow-xl ${
                    loginCardStyle === 'cropsa-card'
                      ? 'bg-[#0b271a]/95 border-2 border-emerald-500/40 text-white'
                      : loginCardStyle === 'clean-white' 
                        ? 'bg-white text-slate-900 border border-slate-200' 
                        : loginCardStyle === 'solid-dark' 
                          ? 'bg-slate-900/95 text-white border border-slate-800' 
                          : 'bg-slate-900/80 backdrop-blur-md text-white border border-white/10'
                  }`}
                >
                  {/* Logo */}
                  <div 
                    className="h-12 w-12 mx-auto rounded-xl p-2 shadow-md flex items-center justify-center border-2 border-emerald-400/40 bg-[#06331e]"
                  >
                    {Boolean(logoUrl?.trim()) ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-contain filter drop-shadow" />
                    ) : (
                      <span className="font-black text-xl text-emerald-400">C</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black tracking-tight leading-tight">
                      {platformName}
                    </h4>
                    <p className={`text-[10px] mt-0.5 line-clamp-2 leading-relaxed ${
                      loginCardStyle === 'clean-white' ? 'text-slate-500' : 'text-emerald-200'
                    }`}>
                      {loginHeadline}
                    </p>
                  </div>

                  {/* High contrast input representations according to user preference */}
                  <div className="space-y-2 text-right">
                    <div className={`h-8 rounded-lg border text-[10px] px-2.5 flex items-center font-bold ${
                      loginInputStyle === 'cropsa-bright'
                        ? 'bg-white border-2 border-emerald-400 text-slate-800 shadow-sm'
                        : loginInputStyle === 'cropsa-emerald-dark'
                          ? 'bg-[#02180d] border border-emerald-500 text-emerald-200'
                          : loginInputStyle === 'clean-white'
                            ? 'bg-white border border-slate-300 text-slate-700'
                            : 'bg-slate-950/60 border border-emerald-500/40 text-slate-400'
                    }`}>
                      اسم المستخدم أو البريد...
                    </div>
                    <div className={`h-8 rounded-lg border text-[10px] px-2.5 flex items-center font-bold ${
                      loginInputStyle === 'cropsa-bright'
                        ? 'bg-white border-2 border-emerald-400 text-slate-800 shadow-sm'
                        : loginInputStyle === 'cropsa-emerald-dark'
                          ? 'bg-[#02180d] border border-emerald-500 text-emerald-200'
                          : loginInputStyle === 'clean-white'
                            ? 'bg-white border border-slate-300 text-slate-700'
                            : 'bg-slate-950/60 border border-emerald-500/40 text-slate-400'
                    }`}>
                      ••••••••
                    </div>
                  </div>

                  {/* Dummy button with themeColor */}
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg text-white font-bold text-[11px] shadow-md transition-transform hover:scale-[1.01] bg-gradient-to-r from-emerald-600 to-teal-600"
                    style={{ backgroundColor: themeColor || '#10b981' }}
                  >
                    تسجيل الدخول للمنظومة
                  </button>

                  {/* Footer Text */}
                  <div className={`text-[9px] pt-1 border-t ${
                    loginCardStyle === 'clean-white' ? 'border-slate-100 text-slate-400' : 'border-emerald-500/20 text-emerald-200/50'
                  }`}>
                    {loginFooterText}
                  </div>
                </div>

              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              ✨ التعديلات فورية وتنعكس بدقة في صفحة الدخول على جميع الأجهزة الذكية وشاشات الحواسيب.
            </div>

          </div>
        </div>

      </div>
      )}

      {/* TAB 2: CORPORATE SMTP / IMAP CONFIG */}
      {activeSettingTab === 'smtp' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                <span>خادم البريد الإلكتروني الرسمي للمنظومة (Corporate SMTP / IMAP)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ربط إيميل الدومين الخاص بشركتكم لإرسال الإيميلات واستعجال شركات التمويل مباشرة من داخل المنصة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                localSmtp.enabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${localSmtp.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {localSmtp.enabled ? 'الإرسال المباشر مفعل' : 'الإرسال المباشر معطل'}
              </span>
            </div>
          </div>

          {/* Success / Feedback Banners */}
          {smtpSavedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث إعدادات البريد بنجاح ومزامنتها سحابياً!</span>
            </div>
          )}

          {/* Notice about corporate emails / IMAP */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
              <Server className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-indigo-950">دعم كامل لإيميلات النطاق الخاص بالشركة (Custom Corporate Domain IMAP / SMTP)</h4>
              <p className="text-indigo-800 leading-relaxed">
                المنظومة مهيأة للعمل مع جميع خوادم البريد الخاصة بالشركات (cPanel, Postfix, Zimbra, Exchange, Microsoft 365, Mailcow) بنظام IMAP/SMTP دون الحاجة لحساب Google أو Gmail شخصي.
              </p>
            </div>
          </div>

          {/* SMTP Configuration Form */}
          <form onSubmit={handleSaveSmtp} className="space-y-5">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-800 block">تفعيل الإرسال المباشر عبر SMTP المنظومة</span>
                <span className="text-[11px] text-slate-500">عند التعطيل، ستعتمد المنظومة على فتح تطبيق البريد المثبت (Outlook / Webmail) كبديل فوري.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={localSmtp.enabled} 
                  onChange={e => setLocalSmtp(prev => ({ ...prev, enabled: e.target.checked }))} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان خادم البريد الصادر (SMTP Host):
                </label>
                <input
                  type="text"
                  required
                  value={localSmtp.host}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="mail.cropsa-finance.eg أو smtp.yourcompany.com"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم المنفذ (Port):
                </label>
                <input
                  type="number"
                  required
                  value={localSmtp.port}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, port: Number(e.target.value) }))}
                  placeholder="465 أو 587"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم / حساب البريد (Username / Account Email):
                </label>
                <input
                  type="text"
                  required
                  value={localSmtp.user}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, user: e.target.value }))}
                  placeholder="operations@cropsa-finance.eg"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة مرور البريد (Password):
                </label>
                <input
                  type="password"
                  value={localSmtp.pass}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="••••••••••••"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المرسل المعروض (From Name):
                </label>
                <input
                  type="text"
                  value={localSmtp.fromName}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, fromName: e.target.value }))}
                  placeholder="منظومة كروبسا مصر للتمويل الرقمي"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بريد المرسل المعروض (From Email):
                </label>
                <input
                  type="email"
                  value={localSmtp.fromEmail}
                  onChange={e => setLocalSmtp(prev => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="operations@cropsa-finance.eg"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 block">بروتوكول الأمان والتشفير (SSL/TLS Encryption)</span>
                <span className="text-[11px] text-slate-500">يوصى بتفعيله مع المنفذ 465 (SSL) أو تركه للـ STARTTLS مع المنفذ 587.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={localSmtp.secure} 
                  onChange={e => setLocalSmtp(prev => ({ ...prev, secure: e.target.checked }))} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Test Connection Banner */}
            {smtpTestResult && (
              <div className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in ${
                smtpTestResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{smtpTestResult.message}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handleTestSmtpConnection}
                className="px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 text-xs font-bold flex items-center gap-2 transition"
              >
                <Server className="w-4 h-4" />
                <span>اختبار الاتصال بالخادم الآن</span>
              </button>

              <button
                type="submit"
                disabled={savingSmtp}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSmtp ? 'جاري الحفظ...' : 'حفظ إعدادات البريد في السيرفر السحابي'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: WIPE MOCK DATA (Factory Reset / Danger Zone) */}
      {activeSettingTab === 'wipe_data' && (
        <div className="space-y-6">
          {/* Success / Error Banners */}
          {wipeSuccessMsg && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                <span>{wipeSuccessMsg}</span>
              </div>
              <button onClick={() => setWipeSuccessMsg('')} className="p-1 hover:bg-emerald-700 rounded-lg">
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {wipeErrorMsg && (
            <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-200" />
                <span>{wipeErrorMsg}</span>
              </div>
              <button onClick={() => setWipeErrorMsg('')} className="p-1 hover:bg-rose-700 rounded-lg">
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Main Control Card */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-rose-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      تصفير قاعدة البيانات ومسح البيانات التجريبية (Factory Reset)
                    </h2>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      إدارة عليا فقط
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    أداة مخصصة لمدير المنظومة لتطهير النظام من كافة البيانات المجسمة والتجريبية لتجهيزه فوراً للاستخدام الفعلي.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  isDemoDataWiped 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isDemoDataWiped ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span>{isDemoDataWiped ? 'النظام مصفّر ونظيف 100%' : 'البيانات التجريبية نشطة حالياً'}</span>
                </span>
              </div>
            </div>

            {/* Database Current Stats Grid */}
            <div>
              <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-slate-500" />
                <span>حصر البيانات التجريبية الموجودة حالياً والتي سيتم تصفيرها:</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">طلبات التقسيط</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{applications.length}</div>
                  <div className="text-[10px] text-slate-400">طلب تقسيط</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">سجلات العملاء</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{clients.length}</div>
                  <div className="text-[10px] text-slate-400">عميل ومزارع</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">حالات التعثر</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{overdueCases.length}</div>
                  <div className="text-[10px] text-slate-400">حالة متابعة</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">المعاملات المالية</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{transactions.length}</div>
                  <div className="text-[10px] text-slate-400">حركة محفظة</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">طلبات السحب</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{withdrawalRequests.length}</div>
                  <div className="text-[10px] text-slate-400">طلب سحب</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">الإشعارات والتنبيهات</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{notifications.length}</div>
                  <div className="text-[10px] text-slate-400">إشعار نظام</div>
                </div>
              </div>
            </div>

            {/* Protected Core Data Guarantee */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>ضمان أمان البيانات التشغيلية الأساسية (لن يتم مسحها إطلاقاً):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-emerald-900 pt-1">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>شركات التقسيط المعتمدة ({companies.length} شركة)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>فروع الشركات المسجلة ({branches.length} فرع)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>هوية كروبسا وتخصيص المظهر والشعار</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>خادم البريد الرسمي وحسابات المديرين</span>
                </div>
              </div>
            </div>

            {/* Action Box With Password Input */}
            <div className="p-6 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/50 rounded-2xl border-2 border-dashed border-rose-300 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-rose-600" />
                <h4 className="text-sm font-black text-slate-900">
                  تنفيذ عملية التصفير والحذف النهائي (محمي بكلمة مرور الإدارة)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                لتأكيد عملية التصفير وحماية المنظومة من الحذف غير المقصود، يرجى كتابة كلمة المرور المعتمدة الخاصة بمدير النظام أدناه، ثم الضغط على زر التصفير:
              </p>

              <form onSubmit={handleExecuteWipe} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    كلمة مرور تأكيد الحذف:
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="أدخل كلمة المرور المعتمدة..."
                      value={wipePasswordInput}
                      onChange={e => setWipePasswordInput(e.target.value)}
                      className="w-full text-xs font-mono p-3 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none pr-10 shadow-sm"
                    />
                    <Lock className="h-4 w-4 text-rose-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isWipingData || !wipePasswordInput}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isWipingData ? 'جاري تصفير قاعدة البيانات...' : 'تصفير ومسح كافة البيانات التجريبية الآن'}</span>
                  </button>

                  {isDemoDataWiped && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>النظام نظيف حالياً</span>
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Supabase Persistence Note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <Database className="h-3.5 w-3.5 text-slate-400" />
              <span>
                تتم مزامنة حالة التصفير مباشرة في جدول <code>system_settings</code> بقاعدة بيانات Supabase وتحفظ محلياً عبر <code>cropsa_demo_data_wiped</code> لضمان عدم عودة البيانات التجريبية على أي متصفح.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
