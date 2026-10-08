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
  Sparkles,
  Building2,
  Users,
  ShoppingBag,
  Zap,
  CheckCircle2
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
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

  // Platform branding configuration
  const platformName = systemBranding?.platformName || 'Cropsa egypt';
  const logoUrl = systemBranding?.logoUrl;
  const loginHeadline = systemBranding?.loginHeadline || (isAr ? 'منصة كروبسا للتمويل والتقسيط الذكي' : 'Cropsa Smart Financing & Installment Platform');
  const loginSubheadline = systemBranding?.loginSubheadline || (isAr ? 'المنظومة الرقمية الرائدة لربط الموردين وشركات التمويل والتجار في مصر' : 'Enterprise digital platform connecting suppliers, financing companies, and merchants');
  const loginBannerUrl = systemBranding?.loginBannerUrl;
  const themeColor = systemBranding?.themeColor || '#10b981';
  const fontFamily = systemBranding?.fontFamily || 'Cairo';
  const loginFooterText = systemBranding?.loginFooterText || (isAr ? 'منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة' : 'Cropsa Egypt Enterprise Core © 2026 | All Rights Reserved');

  // Fast demo presets for testing
  const DEMO_ACCOUNTS = [
    {
      id: 'admin',
      roleKey: 'admin',
      title: isAr ? 'مدير المنظومة' : 'Super Admin',
      username: 'admin',
      pass: 'password',
      icon: ShieldCheck,
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/40 hover:border-purple-400'
    },
    {
      id: 'company',
      roleKey: 'aman_manager',
      title: isAr ? 'شركة أمان للتمويل' : 'Aman Finance',
      username: 'aman_manager',
      pass: 'password',
      icon: Building2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
    },
    {
      id: 'sales',
      roleKey: 'yasser_sales',
      title: isAr ? 'مسؤول المبيعات' : 'Salesman',
      username: 'yasser_sales',
      pass: 'password',
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 hover:border-amber-400'
    },
    {
      id: 'supplier',
      roleKey: 'alsafa_sup',
      title: isAr ? 'مورد معتمد' : 'Supplier',
      username: 'alsafa_sup',
      pass: 'password',
      icon: ShoppingBag,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
    }
  ];

  const handleSelectDemo = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setIdentifier(demo.username);
    setPassword(demo.pass);
    setError('');
    setActiveDemoRole(demo.id);
  };

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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white overflow-hidden bg-[#05130d]"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: fontFamily || 'inherit' }}
    >
      {/* Background Graphic Layers */}
      {Boolean(loginBannerUrl?.trim()) ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img 
            src={loginBannerUrl} 
            alt="Platform Background" 
            className="w-full h-full object-cover opacity-15 filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05130d] via-[#05130d]/85 to-[#05130d]/90" />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)`,
              backgroundSize: '28px 28px'
            }}
          />
        </div>
      )}

      {/* Atmospheric Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[130px] opacity-30 animate-pulse duration-1000"
          style={{ backgroundColor: themeColor || '#10b981' }} 
        />
        <div 
          className="absolute -bottom-32 -right-32 w-[34rem] h-[34rem] rounded-full blur-[130px] opacity-25"
          style={{ backgroundColor: '#0d9488' }} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full blur-[150px] opacity-10 bg-emerald-400 pointer-events-none" />
      </div>

      {/* Top Navigation Bar: Language & Security Badge */}
      <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-sm pointer-events-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>{isAr ? 'بيئة سحابية مشفرة 256-bit' : '256-bit Encrypted Cloud'}</span>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 hover:border-emerald-500/40 text-xs font-bold backdrop-blur-md transition-all shadow-md cursor-pointer pointer-events-auto active:scale-95"
          title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
        >
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <span>{isAr ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-[460px] relative z-10 my-10 animate-in fade-in zoom-in-95 duration-300">
        
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

        {/* The Elevated Ultra-Modern Card */}
        <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-b from-slate-900/90 via-[#062115]/90 to-[#03180f]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.12)] p-6 sm:p-9 space-y-6">
          
          {/* Top Shimmer Gradient Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

          {/* Brand Header */}
          <div className="text-center space-y-3 pt-1">
            {/* Glowing Logo Icon */}
            <div className="relative inline-block">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-40 blur-sm animate-pulse" />
              <div className="relative h-16 w-16 mx-auto rounded-2xl p-2.5 bg-gradient-to-br from-[#0c3822] to-[#041c11] border border-emerald-400/40 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
                {Boolean(logoUrl?.trim()) ? (
                  <img src={logoUrl} alt={platformName} className="h-full w-full object-contain filter drop-shadow" />
                ) : (
                  <div className="font-black text-2xl bg-gradient-to-tr from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                    C
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold mb-2 tracking-wide">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Cropsa FinTech Enterprise Core</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {platformName}
              </h1>
              <p className="text-xs sm:text-sm mt-1.5 font-medium text-emerald-100/90 leading-relaxed">
                {loginHeadline}
              </p>
              {loginSubheadline && (
                <p className="text-[11px] mt-1 text-slate-400 line-clamp-2">
                  {loginSubheadline}
                </p>
              )}
            </div>
          </div>

          {/* Quick Demo Login Chips (بنقرة واحدة للمعاينة) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>{isAr ? 'دخول تجريبي سريع بنقرة واحدة:' : 'Quick Demo Access:'}</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">Demo Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => {
                const IconComponent = demo.icon;
                const isSelected = activeDemoRole === demo.id;
                return (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleSelectDemo(demo)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-right duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/30 shadow-md' 
                        : `bg-slate-900/60 bg-gradient-to-r ${demo.color}`
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-[11px]">{demo.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Username / Email field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <label className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{isAr ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-300 border border-emerald-500/20">
                  User ID
                </span>
              </div>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 text-emerald-400`}>
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  className={`block w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 focus:border-emerald-400 focus:bg-slate-900/90 focus:ring-4 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-xs font-mono font-medium transition-all duration-200 outline-none shadow-inner`}
                  placeholder={isAr ? "مثال: admin أو aman_manager أو البريد" : "e.g. admin or aman_manager"}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setActiveDemoRole(null);
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <label className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-300 border border-emerald-500/20">
                  Secret
                </span>
              </div>
              
              <div className="relative group">
                <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none z-10 text-emerald-400`}>
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className={`block w-full ${isAr ? 'pr-10 pl-11' : 'pl-10 pr-11'} py-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 focus:border-emerald-400 focus:bg-slate-900/90 focus:ring-4 focus:ring-emerald-500/20 text-white placeholder-slate-500 text-xs font-mono font-medium transition-all duration-200 outline-none shadow-inner`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveDemoRole(null);
                  }}
                />
                <button 
                  type="button"
                  className={`absolute inset-y-0 ${isAr ? 'left-0 pl-3.5' : 'right-0 pr-3.5'} flex items-center z-10 text-slate-400 hover:text-white transition-colors cursor-pointer`}
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
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="h-3 w-3 text-emerald-400" />
                  <span>{isAr ? 'نسيت كلمة المرور؟ استعادة فورية عبر رمز OTP' : 'Forgot Password? Recover via OTP'}</span>
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-rose-950/80 text-rose-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 border border-rose-500/60 animate-in fade-in slide-in-from-top-1 shadow-lg">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit Button with Modern Shimmer Gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden flex items-center justify-center text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-600/25 hover:shadow-emerald-500/40 disabled:opacity-60 text-sm gap-2.5 cursor-pointer mt-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] border border-emerald-400/40"
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
          <div className="pt-4 border-t border-emerald-500/15 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Supabase Cloud</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                <span>Vercel Edge</span>
              </span>
              <span>•</span>
              <span>SSL 256-bit</span>
            </div>
            <p className="text-[10px] text-emerald-200/50">
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
