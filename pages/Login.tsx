import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  ShieldAlert,
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PasswordRecoveryModal } from '../components/PasswordRecoveryModal';

export const Login: React.FC = () => {
  const { 
    login, 
    systemBranding, 
    language, 
    toggleLanguage,
    sessionWarning,
    clearSessionWarning 
  } = useStore();

  const isAr = language === 'ar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Branding parameters with Cropsa Defaults
  const platformName = systemBranding?.platformName || 'Cropsa egypt';
  const logoUrl = systemBranding?.logoUrl;
  const loginHeadline = systemBranding?.loginHeadline || (isAr ? 'منصة كروبسا للتمويل والتقسيط الذكي' : 'Cropsa Smart Financing & Installment Platform');
  const loginSubheadline = systemBranding?.loginSubheadline || (isAr ? 'المنظومة الرقمية الرائدة لربط الموردين بشركات التمويل والمزارعين والتجار في مصر' : 'Enterprise digital platform connecting suppliers, financing companies, and clients');
  const loginBannerUrl = systemBranding?.loginBannerUrl;
  const themeColor = systemBranding?.themeColor || '#10b981';
  const loginBgStyle = systemBranding?.loginBgStyle || 'emerald-dark';
  const loginBgColor = systemBranding?.loginBgColor;
  const loginCardStyle = systemBranding?.loginCardStyle || 'cropsa-card';
  const loginInputStyle = systemBranding?.loginInputStyle || 'cropsa-bright';
  const fontFamily = systemBranding?.fontFamily || 'Cairo';
  const loginFooterText = systemBranding?.loginFooterText || (isAr ? 'منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة' : 'Cropsa Egypt Enterprise Core © 2026 | All Rights Reserved');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login(identifier, password);
      if (!success) {
        setError(
          isAr 
            ? 'بيانات الدخول غير صحيحة، يرجى التحقق من اسم المستخدم أو البريد وكلمة المرور' 
            : 'Invalid credentials. Please verify your username/email and password'
        );
      }
    } catch (err) {
      setError(
        isAr 
          ? 'حدث خطأ غير متوقع أثناء تسجيل الدخول، يرجى المحاولة لاحقاً' 
          : 'An unexpected error occurred during login. Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulRecoveryLogin = async (recoveredId: string, recoveredPass: string) => {
    setIdentifier(recoveredId);
    setPassword(recoveredPass);
    setError('');
    setLoading(true);
    try {
      await login(recoveredId, recoveredPass);
    } catch (e) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  // Compute container background style
  const getContainerBgClasses = () => {
    switch (loginBgStyle) {
      case 'dark-slate':
        return 'bg-slate-950 text-slate-100';
      case 'navy-blue':
        return 'bg-slate-900 text-sky-100';
      case 'luxury-dark':
        return 'bg-stone-950 text-purple-100';
      case 'minimal-light':
        return 'bg-slate-100 text-slate-800';
      case 'emerald-dark':
      default:
        // High contrast luxury emerald dark background
        return 'bg-gradient-to-br from-[#031d12] via-[#06291a] to-[#01140b] text-slate-100';
    }
  };

  // Compute card appearance
  const getCardClasses = () => {
    switch (loginCardStyle) {
      case 'cropsa-card':
        return 'bg-[#0b271a]/90 backdrop-blur-2xl border-2 border-emerald-500/40 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/20';
      case 'clean-white':
        return 'bg-white text-slate-900 border border-slate-200 shadow-2xl';
      case 'solid-dark':
        return 'bg-slate-900/95 text-white border border-slate-800 shadow-2xl';
      case 'glass':
      default:
        return 'bg-slate-900/85 backdrop-blur-xl border border-white/10 text-white shadow-2xl';
    }
  };

  const isLightCard = loginCardStyle === 'clean-white';

  // Compute input box style for user and password fields to stand out clearly with Cropsa identity
  const getInputClasses = () => {
    switch (loginInputStyle) {
      case 'clean-white':
        return 'bg-white border-2 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 shadow-md';
      case 'cropsa-emerald-dark':
        return 'bg-[#02180d] border-2 border-emerald-500/60 text-emerald-100 placeholder:text-emerald-300/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/30 focus:bg-[#032212] shadow-inner';
      case 'glass-outline':
        return 'bg-slate-900/60 border-2 border-emerald-500/40 text-white placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/25';
      case 'cropsa-bright':
      default:
        // Distinct, crisp, high-visibility Cropsa bright input card
        return 'bg-[#f8fafc] border-2 border-emerald-400 text-slate-900 placeholder:text-slate-400 font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.15)] focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/30';
    }
  };

  const isBrightInput = loginInputStyle === 'cropsa-bright' || loginInputStyle === 'clean-white';

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white overflow-hidden ${getContainerBgClasses()}`}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: loginBgStyle === 'custom' && loginBgColor ? loginBgColor : undefined,
        fontFamily: fontFamily || 'inherit'
      }}
    >
      {/* Background Banner Image if available */}
      {Boolean(loginBannerUrl?.trim()) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img 
            src={loginBannerUrl} 
            alt="Platform Banner" 
            className="w-full h-full object-cover opacity-20 filter blur-[0.5px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#02180d]/95 via-[#06291a]/80 to-[#02180d]/90" />
        </div>
      )}

      {/* Ambient Lighting Orbs with Cropsa Green Accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: themeColor || '#10b981' }} 
        />
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ backgroundColor: '#059669' }} 
        />
        {/* Subtle geometric grid background pattern for Cropsa tech identity */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Language Toggle */}
      <div className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} z-20 flex items-center gap-2`}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-950 text-slate-200 hover:text-white border border-emerald-500/40 text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer"
          title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Main Login Card - Optimized for Mobile & Desktop */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Session Invalidation Warning Alert */}
        {sessionWarning && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-950/90 border border-amber-500/60 text-amber-200 text-xs font-medium flex items-start justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{sessionWarning}</p>
            </div>
            <button 
              type="button"
              onClick={clearSessionWarning}
              className="text-amber-400 hover:text-white shrink-0 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={`p-6 sm:p-10 rounded-3xl space-y-6 transition-all ${getCardClasses()}`}>
          
          {/* Brand Header */}
          <div className="space-y-3 text-center">
            <div 
              className="h-16 w-16 mx-auto rounded-2xl p-2.5 shadow-2xl border-2 border-emerald-400/50 bg-[#06331e] flex items-center justify-center transition-transform hover:scale-105"
            >
              {Boolean(logoUrl?.trim()) ? (
                <img src={logoUrl} alt={platformName} className="h-full w-full object-contain filter drop-shadow" />
              ) : (
                <span className="font-black text-2xl text-emerald-400">C</span>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mb-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Cropsa FinTech Core</span>
              </div>
              <h1 className={`text-2xl font-black tracking-tight ${isLightCard ? 'text-slate-900' : 'text-white'}`}>
                {platformName}
              </h1>
              <p className={`text-xs mt-1.5 font-medium leading-relaxed ${isLightCard ? 'text-slate-600' : 'text-emerald-100/90'}`}>
                {loginHeadline}
              </p>
              {loginSubheadline && (
                <p className={`text-[11px] mt-1 line-clamp-2 ${isLightCard ? 'text-slate-500' : 'text-slate-300/80'}`}>
                  {loginSubheadline}
                </p>
              )}
            </div>
          </div>

          {/* Clean Modern Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Email field with clear high-contrast box */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${isLightCard ? 'text-slate-800' : 'text-emerald-200'}`}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  {isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLightCard ? 'bg-slate-100 text-slate-600' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'}`}>
                  User ID
                </span>
              </label>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 ${isBrightInput ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  className={`block w-full ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3.5 rounded-xl transition-all text-xs font-bold font-mono focus:outline-none ${getInputClasses()}`}
                  placeholder={isAr ? "مثال: superadmin أو aman_manager أو البريد" : "e.g. superadmin or aman_manager"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password field with clear high-contrast box */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 flex items-center justify-between ${isLightCard ? 'text-slate-800' : 'text-emerald-200'}`}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  {isAr ? 'كلمة المرور' : 'Password'}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isLightCard ? 'bg-slate-100 text-slate-600' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'}`}>
                  Secret
                </span>
              </label>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 ${isBrightInput ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`block w-full ${isAr ? 'pr-10 pl-11' : 'pl-10 pr-11'} py-3.5 rounded-xl transition-all text-xs font-mono font-bold focus:outline-none ${getInputClasses()}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className={`absolute inset-y-0 ${isAr ? 'left-0 pl-3.5' : 'right-0 pr-3.5'} flex items-center z-10 transition-colors cursor-pointer ${isBrightInput ? 'text-slate-500 hover:text-emerald-700' : 'text-emerald-400 hover:text-white'}`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot password trigger */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3 text-emerald-400" />
                  <span>{isAr ? 'نسيت كلمة المرور؟ استعادة فورية عبر رمز OTP' : 'Forgot Password? Recover via OTP'}</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-rose-950/90 text-rose-200 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-600/80 animate-in fade-in shadow-md">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button with Cropsa Emerald styling */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white font-black py-3.5 rounded-xl transition-all shadow-xl hover:shadow-emerald-500/25 disabled:opacity-60 text-xs gap-2 cursor-pointer mt-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40"
              style={{ backgroundColor: themeColor || '#10b981' }}
            >
              {loading ? (
                <span>{isAr ? 'جاري التحقق والاتصال بالمنظومة...' : 'Authenticating...'}</span>
              ) : (
                <>
                  <span>{isAr ? 'تسجيل الدخول إلى منظومة كروبسا' : 'Sign In to Cropsa Platform'}</span>
                  <ArrowLeft className={`h-4 w-4 ${isAr ? '' : 'rotate-180'}`} />
                </>
              )}
            </button>
          </form>

          {/* Clean minimal footer */}
          <div className={`pt-4 border-t text-center text-[11px] ${isLightCard ? 'border-slate-200 text-slate-500' : 'border-emerald-500/20 text-emerald-200/60'}`}>
            <span>{loginFooterText}</span>
          </div>

        </div>
      </div>

      {/* Password Recovery Modal with Full OTP Flow */}
      <PasswordRecoveryModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccessLogin={handleSuccessfulRecoveryLogin}
      />
    </div>
  );
};
