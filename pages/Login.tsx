import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  ShieldAlert, 
  X, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  Leaf
} from 'lucide-react';
import { PasswordRecoveryModal } from '../components/PasswordRecoveryModal';
import { getLockoutStatus, recordFailedLogin, clearFailedLogin, sanitizeInput } from '../utils/security';

export const Login: React.FC = () => {
  const { 
    login, 
    systemBranding, 
    language, 
    toggleLanguage,
    setLanguage,
    sessionWarning,
    clearSessionWarning 
  } = useStore();

  // Ensure default language is Arabic ('ar') on login page if not explicitly set
  useEffect(() => {
    const savedLang = localStorage.getItem('crobsa_lang');
    if (!savedLang && language !== 'ar') {
      setLanguage('ar');
    }
  }, [language, setLanguage]);

  const isAr = language === 'ar';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Platform branding configuration
  const platformName = systemBranding?.platformName || 'Cropsa egypt';
  const logoUrl = systemBranding?.logoUrl;
  const loginHeadline = systemBranding?.loginHeadline || (isAr ? 'منصة كروبسا للتمويل والتقسيط الذكي' : 'Cropsa Smart Financing & Installment Platform');
  const loginSubheadline = systemBranding?.loginSubheadline || (isAr ? 'المنظومة الرقمية الرائدة لربط الموردين وشركات التمويل والتجار في مصر' : 'Enterprise digital platform connecting suppliers, financing companies, and merchants');
  const loginBannerUrl = systemBranding?.loginBannerUrl;
  const fontFamily = systemBranding?.fontFamily || 'Cairo';
  const loginFooterText = systemBranding?.loginFooterText || (isAr ? 'منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة' : 'Cropsa Egypt Enterprise Core © 2026 | All Rights Reserved');

  // Background fallback & dynamic dimming level from settings
  const defaultCropsaBackground = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&auto=format&fit=crop&q=85';
  const currentBgUrl = loginBannerUrl?.trim() || defaultCropsaBackground;
  const dimmingLevel = typeof systemBranding?.loginBannerDimming === 'number' 
    ? systemBranding.loginBannerDimming 
    : 70;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = sanitizeInput(identifier.trim());
    if (!cleanId) {
      setError(isAr ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' : 'Please enter your username or email');
      return;
    }

    // 1. Check Brute-Force Rate Limiting Lockout
    const lockout = getLockoutStatus(cleanId);
    if (lockout.isLocked) {
      const waitMin = Math.ceil(lockout.remainingSeconds / 60);
      setError(
        isAr 
          ? `تم قفل الحساب مؤقتاً لحمايتك بسبب تكرار محاولات الدخول الخاطئة. يرجى الانتظار (${waitMin}) دقيقة ثم المحاولة مجدداً.`
          : `Account is temporarily locked due to multiple failed login attempts. Please wait (${waitMin}) minutes.`
      );
      return;
    }

    setLoading(true);
    try {
      const success = await login(cleanId, password);
      if (success) {
        clearFailedLogin(cleanId);
      } else {
        const failureStatus = recordFailedLogin(cleanId);
        if (failureStatus.isLocked) {
          const waitMin = Math.ceil(failureStatus.remainingSeconds / 60);
          setError(
            isAr 
              ? `تم تجاوز الحد الأقصى للمحاولات الخاطئة. تم قفل الحساب مؤقتاً لمدة (${waitMin}) دقيقة لحماية الحساب.`
              : `Maximum failed attempts reached. Account locked for (${waitMin}) minutes.`
          );
        } else {
          setError(
            isAr 
              ? `بيانات الدخول غير صحيحة. متبقي (${failureStatus.attemptsLeft}) محاولات قبل قفل الحساب مؤقتاً.`
              : `Invalid credentials. (${failureStatus.attemptsLeft}) attempts remaining before temporary lockout.`
          );
        }
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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 relative selection:bg-[#0fa968] selection:text-white overflow-x-hidden bg-[#2d3439]"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: fontFamily || 'Cairo, sans-serif' }}
    >
      {/* ===================== Dynamic Background Layers ===================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* The Configured Background Image */}
        <img 
          src={currentBgUrl} 
          alt="Cropsa Environment Background" 
          className="w-full h-full object-cover object-center scale-105 filter saturate-110 transition-all duration-700"
        />

        {/* Soft Dimming Overlay with Dynamic Dimming Opacity */}
        <div 
          className="absolute inset-0 bg-[#1e252a] backdrop-blur-[1.5px] transition-all duration-300"
          style={{ opacity: dimmingLevel / 100 }}
        />
        
        {/* Ambient Emerald Aura */}
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full blur-[140px] opacity-25 bg-[#146337]" />
        <div className="absolute -bottom-32 -right-32 w-[36rem] h-[36rem] rounded-full blur-[140px] opacity-20 bg-[#0fa968]" />
      </div>

      {/* ===================== Top Floating Navigation Bar ===================== */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between pointer-events-none">
        
        {/* SSL Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-white/30 text-slate-800 text-xs font-bold backdrop-blur-md shadow-xs pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0fa968] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0fa968]"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-[#146337]" />
          <span>{isAr ? 'بوابة مشفرة 256-bit' : '256-bit SSL'}</span>
        </div>

        {/* Language Toggle Button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-[#146337] border border-white/30 text-xs font-bold backdrop-blur-md transition-all shadow-xs hover:shadow-md cursor-pointer pointer-events-auto active:scale-95"
          title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="h-3.5 w-3.5 text-[#146337]" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* ===================== Main Login Card ===================== */}
      <div className="w-full max-w-[880px] mx-auto relative z-10 my-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Session Warning Alert */}
        {sessionWarning && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{sessionWarning}</p>
            </div>
            <button 
              type="button"
              onClick={clearSessionWarning}
              className="text-amber-600 hover:text-amber-900 shrink-0 p-1 cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* The Split Card Box */}
        <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white shadow-[0_25px_80px_-15px_rgba(0,0,0,0.65),0_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col md:flex-row border border-white/40">
          
          {/* ===================== GREEN WELCOME BANNER ===================== */}
          <div className="relative md:w-5/12 bg-[#146337] text-white p-7 sm:p-9 flex flex-col justify-between items-center text-center overflow-hidden min-h-[260px] md:min-h-[480px] shrink-0">
            
            {/* Subtle Wave Backdrop Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-emerald-300/20 blur-3xl" />
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 350 550" fill="none" preserveAspectRatio="none">
                <path d="M0,0 C120,60 160,200 130,380 C110,480 30,520 0,550 Z" fill="white" fillOpacity="0.07" />
                <circle cx="310" cy="70" r="140" fill="white" fillOpacity="0.05" />
              </svg>
            </div>

            {/* Circular Emblem with Enlarged & Crystal-Clear Logo */}
            <div className="relative z-10 pt-2 flex flex-col items-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow-xl flex items-center justify-center p-3 text-[#146337] mb-3 border-2 border-emerald-100/50 transition-transform hover:scale-105 duration-300">
                {Boolean(logoUrl?.trim()) ? (
                  <img 
                    src={logoUrl} 
                    alt={platformName} 
                    className="h-full w-full object-contain filter drop-shadow scale-105" 
                  />
                ) : (
                  <Leaf className="w-14 h-14 sm:w-16 sm:h-16 text-[#146337] stroke-[2.2]" />
                )}
              </div>
              <p className="text-sm sm:text-base font-black tracking-wider text-emerald-100 uppercase drop-shadow-xs">
                {platformName}
              </p>
            </div>

            {/* Central Welcome Message */}
            <div className="relative z-10 my-3 space-y-2 max-w-xs px-2">
              <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-white leading-tight">
                {isAr ? 'مرحباً بك مجدداً!' : 'Welcome Back!'}
              </h2>
              <p className="text-xs sm:text-[13px] text-emerald-100/90 font-medium leading-relaxed">
                {isAr 
                  ? 'منظومة كروبسا الرقمية للتمويل والتقسيط الزراعي والتجاري' 
                  : 'To stay connected with us please login with your personal info'}
              </p>
            </div>

            {/* Bottom Status Badge */}
            <div className="relative z-10 pb-1">
              <div className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-white/30 text-white/90 text-xs font-bold tracking-wide backdrop-blur-xs">
                <Sparkles className="h-3 w-3 text-emerald-200" />
                <span>{isAr ? 'بوابة المنظومة المعتمدة' : 'Authorized Portal'}</span>
              </div>
            </div>
          </div>

          {/* ===================== WHITE FORM CONTAINER ===================== */}
          <div className="md:w-7/12 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative flex-1">
            
            {/* Header: "welcome" in lowercase bold */}
            <div className="text-center md:text-start mb-6">
              <h1 className="text-3xl sm:text-4xl font-black text-[#146337] tracking-tight leading-tight">
                {isAr ? 'أهلاً بك' : 'welcome'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                {isAr ? 'سجّل الدخول إلى حسابك للمتابعة' : 'Login in to your account to continue'}
              </p>
            </div>

            {/* The Login Form with Exact Spacing & NO Text Overlap */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username / Email Pill Input */}
              <div className="space-y-1">
                <div className="relative group">
                  {/* Icon positioned with fixed clearance */}
                  <div className={`absolute inset-y-0 ${isAr ? 'right-4' : 'left-4'} flex items-center pointer-events-none z-10 text-[#146337] group-focus-within:text-[#0fa968] transition-colors`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  
                  {/* Input with strict generous padding: 48px on icon side, 16px on opposite side */}
                  <input
                    type="text"
                    required
                    autoFocus
                    dir={isAr ? 'rtl' : 'ltr'}
                    style={{
                      paddingRight: isAr ? '48px' : '16px',
                      paddingLeft: isAr ? '16px' : '48px',
                    }}
                    className="block w-full py-3.5 sm:py-4 rounded-full bg-[#dcefe3] hover:bg-[#d4ebd9] focus:bg-[#eaf7ef] border-2 border-transparent focus:border-[#146337] focus:ring-4 focus:ring-[#146337]/15 text-slate-900 placeholder-[#587c65] text-xs sm:text-sm font-semibold transition-all duration-200 outline-none"
                    placeholder={isAr ? "اسم المستخدم أو البريد الإلكتروني..." : "Email or username..."}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Pill Input */}
              <div className="space-y-1">
                <div className="relative group">
                  {/* Lock Icon */}
                  <div className={`absolute inset-y-0 ${isAr ? 'right-4' : 'left-4'} flex items-center pointer-events-none z-10 text-[#146337] group-focus-within:text-[#0fa968] transition-colors`}>
                    <Lock className="h-5 w-5" />
                  </div>

                  {/* Input with strict 48px padding on BOTH sides so text NEVER touches either icon */}
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    dir={isAr ? 'rtl' : 'ltr'}
                    style={{
                      paddingRight: '48px',
                      paddingLeft: '48px',
                    }}
                    className="block w-full py-3.5 sm:py-4 rounded-full bg-[#dcefe3] hover:bg-[#d4ebd9] focus:bg-[#eaf7ef] border-2 border-transparent focus:border-[#146337] focus:ring-4 focus:ring-[#146337]/15 text-slate-900 placeholder-[#587c65] text-xs sm:text-sm font-semibold transition-all duration-200 outline-none"
                    placeholder={isAr ? "كلمة المرور..." : "Password..."}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {/* Eye Toggle Button */}
                  <button 
                    type="button"
                    className={`absolute inset-y-0 ${isAr ? 'left-4' : 'right-4'} flex items-center z-10 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer`}
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-center md:justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-bold text-slate-500 hover:text-[#146337] hover:underline transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#146337]" />
                    <span>{isAr ? 'هل نسيت كلمة المرور؟' : 'Forgot your password?'}</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-rose-50 text-rose-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-200 animate-in fade-in shadow-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Solid Green Capsule Button (Exact Pinterest Vector Match) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group flex items-center justify-center text-white font-black py-3.5 sm:py-4 px-8 rounded-full bg-[#0fa968] hover:bg-[#0c8e57] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[#0fa968]/30 disabled:opacity-60 text-sm sm:text-base uppercase tracking-wider cursor-pointer border border-[#0fa968]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isAr ? 'جاري التحقق...' : 'Authenticating...'}</span>
                    </div>
                  ) : (
                    <span>{isAr ? 'تسجيل الدخول' : 'LOG IN'}</span>
                  )}
                </button>
              </div>

              {/* Scope Constraint Note: NO public registration as requested */}
              <div className="pt-2 text-center">
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  {isAr 
                    ? 'الحسابات مخصصة لمديري وموظفي المنظومة والشركاء المعتمدين' 
                    : 'Accounts are centrally authorized for partners and personnel'}
                </p>
              </div>
            </form>

          </div>

        </div>

        {/* Bottom Platform Trust Footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-emerald-200/60 font-medium">
            {loginFooterText}
          </p>
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
