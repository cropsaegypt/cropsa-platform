import React, { useState } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { SystemBranding } from '../types';

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
  const { systemBranding, updateBranding } = useStore();

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

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        fontFamily
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update branding:', err);
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-2xl font-black text-white">إعدادات وهوية المنظومة وصفحة تسجيل الدخول</h1>
            <p className="text-xs text-slate-300 mt-1">
              تخصيص كامل لألوان كروبسا، مربعات اسم المستخدم وكلمة المرور، النصوص، الخلفيات، والشعار مع معاينة حية
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>تم حفظ التعديلات ونشرها وتحديث الفايربيز بنجاح!</span>
          </div>
        )}
      </div>

      {/* Main Grid: Settings Form & Live Preview */}
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
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">صورة الغلاف لصفحة تسجيل الدخول (Login Banner)</label>
                <input
                  type="text"
                  value={loginBannerUrl}
                  onChange={e => setLoginBannerUrl(e.target.value)}
                  placeholder="رابط صورة الغلاف..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {PRESET_BANNERS.map((b, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLoginBannerUrl(b.url)}
                      className={`h-16 rounded-xl border-2 overflow-hidden relative cursor-pointer ${
                        loginBannerUrl === b.url ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={b.url} alt={b.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-950/50 text-white text-[9px] font-bold flex items-center justify-center p-1 text-center">
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
                يتم مزامنة كافة التغييرات وحفظها فوراً في قاعدة بيانات فايربيز (Firestore)
              </span>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {saving ? 'جاري الحفظ في فايربيز...' : 'حفظ التعديلات وتطبيق الهوية فوراً'}
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
    </div>
  );
};
