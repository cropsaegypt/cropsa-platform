import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Compass, 
  Building2, 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  MessageSquare, 
  Users, 
  Wallet, 
  Calculator, 
  ShieldCheck, 
  Settings, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { User, Role, InstallmentCompanyStaffRole } from '../types';

interface PortalOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

interface TourStep {
  title: string;
  badge: string;
  description: string;
  tips: string[];
  icon: any;
  color: string;
}

export const PortalOnboardingTour: React.FC<PortalOnboardingTourProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const isCompanyUser = currentUser.role === Role.INSTALLMENT_COMPANY || 
                        currentUser.role === Role.BRANCH_MANAGER || 
                        currentUser.role === Role.COMPANY_EMPLOYEE;

  const isMerchantUser = currentUser.role === Role.SUPPLIER || 
                         currentUser.role === Role.SALESMAN;

  // Build steps based on role
  let steps: TourStep[] = [];

  if (isCompanyUser) {
    steps = [
      {
        title: 'مرحباً بك في بورتال شركة التقسيط الذكي',
        badge: 'بداية الرحلة',
        description: 'صُممت هذه المنظومة خصيصاً لتمكين شركتك وفروعك من إدارة وفحص طلبات التقسيط المباشرة بأعلى سرعة وكفاءة، وربط كافة الفروع ومسؤولي الائتمان تحت مظلة رقمية موحدة.',
        tips: [
          'يمكنك الوصول لكافة أقسام البورتال من الشريط الجانبي في أي وقت.',
          'تحديثات البيانات وحالات الطلبات تتزامن سحابياً وفورياً على جميع الأجهزة.'
        ],
        icon: Building2,
        color: 'from-sky-700 to-indigo-900'
      },
      {
        title: 'لوحة المتابعة الشاملة (Overview Dashboard)',
        badge: 'الإحصائيات الحية',
        description: 'تمنحك نظرة بانورامية فورية على سقف التمويل المتاح والمستخدم، إجمالي الطلبات الواردة، نسب القبول والرفض، ومخططات زمنية لتحصيلات الأقساط الشهرية.',
        tips: [
          'متابعة حركة السيولة والرصيد المستخدم من السقف لحظة بلحظة.',
          'تقارير توزيع الطلبات حسب المحافظات والفروع الأكثر نشاطاً.'
        ],
        icon: LayoutDashboard,
        color: 'from-emerald-700 to-teal-900'
      },
      {
        title: 'فحص ودراسة طلبات التقسيط (Credit Review)',
        badge: 'قلب المنظومة',
        description: 'مركز دراسة الائتمان لفحص مستندات المشتري والضامن، الاستعلام الائتماني I-Score، اتخاذ قرارات الموافقة، الرفض، أو طلب أوراق إضافية، وتوجيه المعاملات للفروع.',
        tips: [
          'فحص صور البطاقات وإيصالات المرافق وعقود العمل بسهولة.',
          'إمكانية الاستعانة بالتحليل الائتماني الذكي لتقدير درجة المخاطر.'
        ],
        icon: FileText,
        color: 'from-blue-700 to-indigo-950'
      },
      {
        title: 'إدارة الفروع ويوزرات الدخول (Branches & Passwords)',
        badge: 'التوسع والانتشار',
        description: 'استعراض كافة فروع شركتك، وإمكانية رفع شيت إكسيل لكافة الفروع بنمط الأسماء فقط، حيث يقوم النظام بتوليد اسم مستخدم وكلمة مرور لكل فرع تلقائياً مع إمكانية تعديلها بسهولة.',
        tips: [
          'لكل فرع حساب دخول مستقل (اسم مستخدم وباسورد بصيغة [كود الفرع]@2026).',
          'يمكنك نسخ بيانات دخول كافة الفروع أو تعديل باسورد أي فرع بنقرة واحدة.'
        ],
        icon: MapPin,
        color: 'from-purple-700 to-slate-900'
      },
      {
        title: 'الربط الخارجي والمراسلات (WhatsApp & Email)',
        badge: 'القنوات المباشرة',
        description: 'إذا كانت شركتك تعتمد على استقبال ملفات التقسيط عبر واتساب أو إيميل IMAP الرسمي، يمكنك إرسال ملفات العملاء ونماذج الاستعجال وروابط جوجل درايف مباشرة من داخل المنظومة.',
        tips: [
          'فتح محادثة واتساب الرسمية للشركة بنص الاستعجال الجاهز بنقرة زر.',
          'إرسال إيميلات رسمية مشفرة بملفات الائتمان ومتابعة الردود.'
        ],
        icon: MessageSquare,
        color: 'from-emerald-800 to-indigo-950'
      },
      {
        title: 'قاعدة بيانات العملاء ومتابعة التحصيل (Collections)',
        badge: 'إدارة المخاطر',
        description: 'أرشيف رقمي آمن لكافة العملاء الممولين، مع البحث الذكي وسجلات الأقساط المستحقة والمتأخرات، ومتابعة حالات السداد للحفاظ على جودة المحفظة التمويلية.',
        tips: [
          'تنبيهات تلقائية للعملاء المؤهلين لتجديد التمويل بعد 3 أشهر.',
          'تسجيل ملاحظات التحصيل والمتابعة الميدانية للعملاء المتعثرين.'
        ],
        icon: Users,
        color: 'from-amber-700 to-slate-900'
      }
    ];
  } else if (isMerchantUser) {
    steps = [
      {
        title: 'مرحباً بك في منصة كروبسا مصر للتجار والموردين',
        badge: 'بوابة المبيعات',
        description: 'بوابتك الرقمية المباشرة لتقديم خدمات البيع بالتقسيط لعملائك عبر أكبر شركات التمويل والاستهلاك في مصر، وزيادة مبيعاتك فورياً بدون أية مخاطر تحصيل.',
        tips: [
          'تحصل على موافقات ائتمانية سريعة لعملائك ومزارعيك.',
          'تحويل قيمة المبيعات والعمولات مباشرة إلى محفظتك.'
        ],
        icon: Building2,
        color: 'from-emerald-700 to-teal-900'
      },
      {
        title: 'تقديم طلب تقسيط جديد (New Application)',
        badge: 'رفع الطلبات',
        description: 'خطوات ميسرة لتسجيل بيانات العميل، إدخال بيانات الضامن، ورفع صور بطاقة الرقم القومي وإيصال المرافق من الهاتف أو الكمبيوتر في دقائق معدودة.',
        tips: [
          'المنظومة تدعم ضغط الصور تلقائياً لسرعة الرفع من الهاتف المحمول.',
          'التحقق التلقائي من صحة أرقام بطاقات الرقم القومي المصري.'
        ],
        icon: FileText,
        color: 'from-sky-700 to-indigo-900'
      },
      {
        title: 'حاسبة الأقساط والعمولات الذكية (Calculator)',
        badge: 'الشفافية المالية',
        description: 'احسب لعميلك القسط الشهري بدقة، واختر مدة التقسيط الأنسب (من 6 إلى 36 شهراً)، مع معرفة قيمة العمولة المستحقة لمتجرك مسبقاً قبل إرسال الطلب.',
        tips: [
          'مقارنة خطط التمويل بين الشركات والبرامج التمويلية المتاحة.',
          'إمكانية طباعة أو مشاركة جدول الأقساط مع العميل.'
        ],
        icon: Calculator,
        color: 'from-purple-700 to-indigo-950'
      },
      {
        title: 'محفظة الأرباح وسحب المستحقات (Wallet & Payouts)',
        badge: 'أرباحك المباشرة',
        description: 'تابع رصيد عمولاتك وأرباحك المتراكمة من المعاملات المكتملة، واطلب سحب أرباحك في أي وقت لحسابك البنكي أو محفظتك الإلكترونية (فودافون كاش، إنستاباي، إلخ).',
        tips: [
          'إشعارات فورية عند الموافقة على الطلب وإضافة العمولة لرصيدك.',
          'سجل مالي مفصل بكافة التحويلات وطلبات السحب السابقة.'
        ],
        icon: Wallet,
        color: 'from-amber-700 to-slate-900'
      }
    ];
  } else {
    // Admin / Super Admin
    steps = [
      {
        title: 'المركز القيادي لمنظومة كروبسا مصر',
        badge: 'الإدارة العليا',
        description: 'لوحة التحكم المركزية لإدارة كافة أطراف المنظومة: شركات التقسيط الشريكة، شبكة الموردين والتجار، السيولة التمويلية، والسياسات الائتمانية.',
        tips: [
          'متابعة مؤشرات الأداء الكلي وحجم المعاملات المالي اليومي.',
          'إدارة صلاحيات المستخدمين والتحكم في إعدادات المنظومة.'
        ],
        icon: ShieldCheck,
        color: 'from-slate-900 via-crobsa-950 to-slate-900'
      },
      {
        title: 'إدارة شركات التقسيط والفروع والشيتات',
        badge: 'الشراكات والفروع',
        description: 'تسجيل وتعديل وحذف شركات التقسيط، تعيين الأسقف والعمولات، وإدارة فروع الشركات ورفع الشيتات المجمعة مع توليد الحسابات التلقائية.',
        tips: [
          'إمكانية تعديل كافة بيانات الشركة وقنوات الاستقبال في أي وقت.',
          'رفع الفروع بنمط الأسماء فقط مع توليد كلمات المرور التلقائية.'
        ],
        icon: Building2,
        color: 'from-sky-800 to-indigo-950'
      },
      {
        title: 'هوية المنظومة وإعادة ضبط المصنع (Cropsa Settings)',
        badge: 'التخصيص والأمان',
        description: 'تخصيص كامل لألوان وشعار كروبسا، إعدادات خادم البريد SMTP الرسمي، وأداة تصفير البيانات التجريبية المحمية بكلمة المرور لتسليم المنظومة جاهزة للإنتاج.',
        tips: [
          'تصفير البيانات التجريبية بكلمة المرور Cropsa@015252505111.',
          'التحكم في موضع غلاف الشركات وصور تسجيل الدخول.'
        ],
        icon: Settings,
        color: 'from-emerald-800 to-slate-950'
      }
    ];
  }

  const step = steps[currentStepIndex] || steps[0];
  const StepIcon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleFinish = () => {
    try {
      localStorage.setItem(`cropsa_tour_completed_${currentUser.id}`, 'true');
    } catch {}
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-4 flex flex-col">
        
        {/* Tour Header Banner */}
        <div className={`bg-gradient-to-r ${step.color} text-white p-6 sm:p-7 relative overflow-hidden shrink-0 transition-all duration-300`}>
          {/* Background Decorative Rings */}
          <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-10 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
                <StepIcon className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block mb-1 border border-white/10">
                  {step.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title="تخطي الجولة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar & Counter */}
          <div className="mt-6 flex items-center justify-between text-xs font-bold text-white/80">
            <span>الخطوة {currentStepIndex + 1} من {steps.length}</span>
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex 
                      ? 'w-6 bg-white' 
                      : i < currentStepIndex 
                      ? 'w-2 bg-white/60' 
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tour Content */}
        <div className="p-6 sm:p-7 space-y-5 overflow-y-auto">
          <p className="text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            {step.description}
          </p>

          <div className="space-y-2">
            <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-crobsa-700" />
              <span>أهم الملاحظات والنصائح السريعة:</span>
            </span>
            <div className="space-y-2">
              {step.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tour Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1"
          >
            تخطي الجولة (Skip)
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
                <span>السابق</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>{isLast ? 'إنهاء والبدء في العمل' : 'التالي'}</span>
              {!isLast ? <ChevronLeft className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
