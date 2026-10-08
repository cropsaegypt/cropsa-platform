import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { 
  X, 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw,
  ShieldCheck,
  Clock,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { User } from '../types';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (identifier: string, pass: string) => Promise<void>;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const { 
    language,
    requestPasswordResetOtp, 
    verifyPasswordResetOtp, 
    completePasswordReset 
  } = useStore();

  const isAr = language === 'ar';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState('');
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [maskedTarget, setMaskedTarget] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpArrivedNotification, setOtpArrivedNotification] = useState(false);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  // STEP 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError(isAr ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' : 'Please enter your username or email');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(cleanId);
      if (!res.success || !res.user) {
        setError(res.message);
        setLoading(false);
        return;
      }

      setTargetUser(res.user);
      setMaskedTarget(res.maskedTarget || cleanId);
      setGeneratedOtp(res.otp || '');
      setCooldown(60);
      setStep(2);
      setInputCode('');

      // Show realistic simulated OTP arrival toast after a brief delay (800ms)
      setTimeout(() => {
        setOtpArrivedNotification(true);
      }, 800);
    } catch (err) {
      setError(isAr ? 'حدث خطأ أثناء إرسال رمز التحقق' : 'An error occurred while sending verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || !identifier.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(identifier.trim());
      if (res.success && res.otp) {
        setGeneratedOtp(res.otp);
        setCooldown(60);
        setOtpArrivedNotification(true);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(isAr ? 'تعذر إعادة إرسال الكود' : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!inputCode.trim()) {
      setError(isAr ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code');
      return;
    }

    if (!targetUser) return;

    setLoading(true);
    try {
      const isValid = await verifyPasswordResetOtp(targetUser.id, inputCode.trim());
      if (!isValid) {
        setError(isAr ? 'رمز التحقق غير صحيح أو انتهت صلاحيته' : 'Verification code is invalid or has expired');
        setLoading(false);
        return;
      }
      setStep(3);
    } catch (err) {
      setError(isAr ? 'حدث خطأ أثناء التحقق من الرمز' : 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(isAr ? 'يجب أن تتكون كلمة المرور الجديدة من 6 أحرف أو أرقام على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    if (!targetUser) return;

    setLoading(true);
    try {
      const success = await completePasswordReset(targetUser.id, newPassword);
      if (success) {
        setStep(4);
      } else {
        setError(isAr ? 'فشل تحديث كلمة المرور في قاعدة البيانات' : 'Failed to update password in database');
      }
    } catch (err) {
      setError(isAr ? 'حدث خطأ أثناء حفظ كلمة المرور' : 'An error occurred while saving password');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillOtp = () => {
    if (generatedOtp) {
      setInputCode(generatedOtp);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleImmediateLogin = async () => {
    if (targetUser && newPassword) {
      setLoading(true);
      await onSuccessLogin(targetUser.username || targetUser.email, newPassword);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80 p-6 border-b border-slate-100 relative">
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 ${isAr ? 'left-5' : 'right-5'} p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer`}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
              </h3>
              <p className="text-xs text-emerald-700 font-semibold">
                {step === 1 && (isAr ? 'الخطوة 1: تحديد الحساب المسجل' : 'Step 1: Enter Registered Account')}
                {step === 2 && (isAr ? 'الخطوة 2: التحقق من كود الأمان OTP' : 'Step 2: Verify Security OTP Code')}
                {step === 3 && (isAr ? 'الخطوة 3: تعيين كلمة المرور الجديدة' : 'Step 3: Set New Password')}
                {step === 4 && (isAr ? 'اكتملت الاستعادة بنجاح' : 'Password Reset Completed')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* STEP 1: Enter Username or Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {isAr 
                  ? 'أدخل اسم المستخدم أو البريد الإلكتروني المسجل في منظومة كروبسا لتوليد وإرسال رمز التحقق الفوري (OTP) والبدء في استعادة الحساب.'
                  : 'Enter your registered username or email to generate an instant OTP verification code and start password recovery.'
                }
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'اسم المستخدم أو البريد الإلكتروني *' : 'Username or Email *'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? "مثال: superadmin أو aman_manager أو cairo_credit" : "e.g. superadmin or aman_manager"}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all font-mono`}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق والاتصال...' : 'Connecting...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isAr ? 'إرسال رمز التحقق OTP' : 'Send Verification OTP'}</span>
                      <ArrowLeft className={`h-4 w-4 ${isAr ? '' : 'rotate-180'}`} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter and Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {/* Live Simulated OTP Incoming Banner */}
              {otpArrivedNotification && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      <span>{isAr ? 'إشعار وارد: تم استلام كود OTP' : 'Incoming: OTP Code Received'}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono border border-emerald-300 font-bold">
                      SMS / Email
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200 shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">{isAr ? 'رمز التحقق الصادر:' : 'Issued Code:'}</span>
                      <span className="font-mono text-lg font-black tracking-widest text-emerald-700">
                        {generatedOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutofillOtp}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? (isAr ? 'تم اللصق' : 'Pasted') : (isAr ? 'استخدام الرمز' : 'Autofill')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Destination info */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600">
                <span>{isAr ? 'تم الإرسال إلى:' : 'Sent to:'}</span>
                <span className="font-mono font-bold text-slate-900 text-xs" dir="ltr">{maskedTarget}</span>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  {isAr ? 'أدخل رمز التحقق المكون من 6 أرقام *' : 'Enter 6-digit verification code *'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-black font-mono py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Resend Cooldown Counter */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>{isAr ? 'صلاحية الكود: 5 دقائق' : 'Valid for 5 mins'}</span>
                </span>

                {cooldown > 0 ? (
                  <span className="text-[11px] font-mono text-amber-600 font-bold">
                    {isAr ? `إعادة الإرسال بعد: ${cooldown} ثانية` : `Resend in: ${cooldown}s`}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors cursor-pointer"
                  >
                    {isAr ? 'إعادة إرسال رمز جديد' : 'Resend new code'}
                  </button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading || inputCode.length < 6}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isAr ? 'التحقق ومتابعة التغيير' : 'Verify & Continue'}</span>
                      <ArrowLeft className={`h-4 w-4 ${isAr ? '' : 'rotate-180'}`} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'رجوع' : 'Back'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  {isAr 
                    ? `تم التحقق من هويتك بنجاح لحساب (${targetUser?.name}). يرجى تعيين كلمة المرور الجديدة:`
                    : `Identity verified for (${targetUser?.name}). Please set your new password:`}
                </span>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'كلمة المرور الجديدة *' : 'New Password *'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={isAr ? "6 أحرف أو أرقام على الأقل" : "At least 6 characters"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all placeholder:text-slate-400`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 ${isAr ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-slate-400 hover:text-slate-700 cursor-pointer`}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isAr ? 'تأكيد كلمة المرور الجديدة *' : 'Confirm New Password *'}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isAr ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={isAr ? "أعد كتابة كلمة المرور للتأكيد" : "Retype new password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full ${isAr ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all placeholder:text-slate-400`}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>
                  {loading 
                    ? (isAr ? 'جاري تحديث كلمة المرور في الفايربيز...' : 'Updating password in Firebase...')
                    : (isAr ? 'حفظ وتثبيت كلمة المرور الجديدة' : 'Save & Confirm New Password')}
                </span>
              </button>
            </form>
          )}

          {/* STEP 4: Reset Successful */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password Changed Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                  {isAr 
                    ? `تم تحديث كلمة المرور ومزامنتها على الفايربيز لحساب (${targetUser?.name}). يمكنك الآن تسجيل الدخول مباشرة.`
                    : `Password was updated and synced to Firebase for (${targetUser?.name}). You can now log in immediately.`}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleImmediateLogin}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? 'تسجيل الدخول الفوري بهذا الحساب' : 'Sign In Now With This Account'}</span>
                  <ArrowLeft className={`h-4 w-4 ${isAr ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
