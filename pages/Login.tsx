import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { 
  Lock, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  ShieldAlert, 
  X, 
  KeyRound, 
  ShieldCheck, 
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

  // Platform branding configuration
  const platformName = systemBranding?.platformName || 'Cropsa egypt';
  const logoUrl = systemBranding?.logoUrl;
  const loginHeadline = systemBranding?.loginHeadline || (isAr ? 'منصة كروبسا للتمويل والتقسيط الذكي' : 'Cropsa Smart Financing & Installment Platform');
  const loginSubheadline = systemBranding?.loginSubheadline || (isAr ? 'المنظومة الرقمية الرائدة لربط الموردين وشركات التمويل والتجار في مصر' : 'Enterprise digital platform connecting suppliers, financing companies, and merchants');
  const loginBannerUrl = systemBranding?.loginBannerUrl;
  const themeColor = systemBranding?.themeColor || '#10b981';
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

  // Cropsa Agricultural Identity Background
  const defaultCropsaBackground = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&auto=format&fit=crop&q=85';
  const cropsaBgUrl = loginBannerUrl?.trim() || defaultCropsaBackground;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white overflow-hidden bg-slate-900"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: fontFamily || 'inherit' }}
    >
      {/* Background Graphic Layers: Expressing Cropsa Smart Agricultural Identity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Panoramic lush agricultural crops & green fields */}
        <img 
          src={cropsaBgUrl} 
          alt="Cropsa Smart Agriculture" 
          className="w-full h-full object-cover object-center scale-105 filter brightness-90 saturate-110"
        />
        {/* Modern Agri-FinTech translucent overlay: gives clarity and focus while keeping vibrant green fields visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/45 to-emerald-950/60 backdrop-blur-[1.5px]" />
        
        {/* Subtle geometric dot matrix pattern */}
        <div 
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #10b981 1.2px, transparent 0)',
            backgroundSize: '28px 28px'
          }}
        />

        {/* Ambient Emerald & Teal Lighting */}
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px] opacity-35 bg-emerald-500" />
        <div className="absolute -bottom-32 -right-32 w-[34rem] h-[34rem] rounded-full blur-[140px] opacity-30 bg-teal-400" />
      </div>

      {/* Top Navigation Bar: Language & Security Badge */}
      <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-white/40 text-slate-800 text-xs font-semibold backdrop-blur-md shadow-lg pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isAr ? 'بيئة سحابية مشفرة 256-bit' : '256-bit Encrypted SSL'}</span>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-emerald-700 border border-white/40 text-xs font-bold backdrop-blur-md transition-all shadow-lg hover:shadow-xl cursor-pointer pointer-events-auto active:scale-95"
          title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Subtle Bottom Platform Watermark Badge */}
      <div className="absolute bottom-4 inset-x-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-emerald-300 text-[11px] font-semibold shadow-lg pointer-events-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isAr ? 'منصة كروبسا للتمويل والتقسيط الزراعي والذكي في مصر' : 'Cropsa Smart Agricultural Financing Platform - Egypt'}</span>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-[460px] relative z-10 my-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Session Invalidation Warning Alert */}
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

        {/* Elevated Ultra-Modern Pure White Card */}
        <div className="relative rounded-[28px] overflow-hidden bg-white border border-white/60 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.45),0_0_1px_1px_rgba(255,255,255,0.2)] p-7 sm:p-10 space-y-6">
          
          {/* Top Shimmer Gradient Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Brand Header */}
          <div className="text-center space-y-3 pt-1">
            {/* Glowing Logo Icon */}
            <div className="relative inline-block">
              <div className="relative h-16 w-16 mx-auto rounded-2xl p-2.5 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 ring-4 ring-emerald-50 shadow-xl shadow-emerald-500/20 flex items-center justify-center transition-transform hover:scale-105 duration-200 text-white">
                {Boolean(logoUrl?.trim()) ? (
                  <img src={logoUrl} alt={platformName} className="h-full w-full object-contain filter drop-shadow" />
                ) : (
                  <div className="font-black text-2xl tracking-tight">
                    C
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold mb-2 tracking-wide shadow-xs">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                <span>Cropsa FinTech Enterprise Core</span>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight">
                {platformName}
              </h1>
              <p className="text-xs sm:text-sm mt-1.5 font-bold text-slate-600 leading-relaxed">
                {loginHeadline}
              </p>
              {loginSubheadline && (
                <p className="text-[11px] mt-1 text-slate-400 line-clamp-2 leading-relaxed">
                  {loginSubheadline}
                </p>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Username / Email field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}</span>
                </label>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  User ID
                </span>
              </div>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 text-slate-400 group-focus-within:text-emerald-600 transition-colors`}>
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  className={`block w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 text-slate-900 placeholder-slate-400 text-xs font-mono font-semibold transition-all duration-200 outline-none shadow-xs`}
                  placeholder={isAr ? "مثال: admin أو aman_manager أو البريد" : "e.g. admin or aman_manager"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  Secret
                </span>
              </div>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 text-slate-400 group-focus-within:text-emerald-600 transition-colors`}>
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`block w-full ${isAr ? 'pr-10 pl-11' : 'pl-10 pr-11'} py-3.5 rounded-xl bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 text-slate-900 placeholder-slate-400 text-xs font-mono font-semibold transition-all duration-200 outline-none shadow-xs`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  className={`absolute inset-y-0 ${isAr ? 'left-0 pl-3.5' : 'right-0 pr-3.5'} flex items-center z-10 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot password trigger */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="h-3 w-3 text-emerald-600" />
                  <span>{isAr ? 'نسيت كلمة المرور؟ استعادة فورية عبر رمز OTP' : 'Forgot Password? Recover via OTP'}</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-rose-50 text-rose-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 border border-rose-200 animate-in fade-in slide-in-from-top-1 shadow-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button with Modern Emerald Gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden flex items-center justify-center text-white font-extrabold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 disabled:opacity-60 text-sm gap-2.5 cursor-pointer mt-3 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] border border-emerald-500/30"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isAr ? 'جاري التحقق والاتصال بالمنظومة...' : 'Authenticating...'}</span>
                </div>
              ) : (
                <>
                  <span>{isAr ? 'تسجيل الدخول إلى منظومة كروبسا' : 'Sign In to Cropsa Platform'}</span>
                  {isAr ? (
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </>
              )}
            </button>
          </form>

          {/* Footer info & System Trust */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isAr ? 'بوابة دخول آمنة ومعتمدة للشركات والتجار' : 'Secure Enterprise Authorized Portal'}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {loginFooterText}
            </p>
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
