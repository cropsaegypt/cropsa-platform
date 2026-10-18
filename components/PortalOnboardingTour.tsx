import React, { useState, useEffect } from 'react';
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
  Clock,
  ExternalLink,
  Layers,
  Store,
  PieChart,
  BarChart3
} from 'lucide-react';
import { User, Role, InstallmentCompanyStaffRole } from '../types';

export interface PortalOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onNavigate?: (page: string) => void;
}

interface TourStep {
  title: string;
  badge: string;
  targetPage?: string;
  targetTabLabel?: string;
  description: string;
  tips: string[];
  icon: any;
  color: string;
}

export const PortalOnboardingTour: React.FC<PortalOnboardingTourProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigate
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
        title: 'لوحة المؤشرات والرقابة العامة',
        badge: 'المركز المالي للشركة',
        targetPage: 'company-dashboard',
        targetTabLabel: 'لوحة المؤشرات العامة',
        description: 'شاشة المتابعة المركزية التي تعرض سقف التمويل الائتماني المتاح والمستهلك، إجمالي الطلبات الواردة، نسب القبول والرفض، ومخططات زمنية لمعدلات الأداء والتحصيلات الشهرية بدقة لحظية.',
        tips: [
          'متابعة حركة السيولة والرصيد المستخدم من سقف التمويل لحظة بلحظة.',
          'تقارير توزيع الطلبات بحسب محافظات الجمهورية والفروع الأكثر طلباً ونشاطاً.',
          'الاطلاع على ملخص التحصيلات الشهرية المتوقعة والمسددة.'
        ],
        icon: LayoutDashboard,
        color: 'from-sky-700 via-indigo-900 to-slate-950'
      },
      {
        title: 'فحص ومراجعة طلبات التقسيط الواردة',
        badge: 'دراسة الائتمان والمخاطر',
        targetPage: 'company-portal',
        targetTabLabel: 'طلبات وحالات التمويل',
        description: 'صندوق الوارد المالي لاستقبال طلبات التقسيط الجديدة من الموردين والتجار. يمكنك هنا فحص مستندات العميل والضامن، الاستعلام الائتماني، إسناد المعاملة لمسؤول ائتمان معين أو فرع محدد، واتخاذ القرار (موافقة، رفض، أو طلب استيفاء أوراق).',
        tips: [
          'فحص صور بطاقات الرقم القومي وإيصالات المرافق وعقود العمل والتحقق منها.',
          'إسناد المعاملات بضغطة زر إلى الفرع المختص أو مسؤول الائتمان الميداني.',
          'تحديث فوري لقرار الائتمان مع إشعار التاجر بحالة الطلب تلقائياً.'
        ],
        icon: FileText,
        color: 'from-blue-700 via-indigo-950 to-slate-900'
      },
      {
        title: 'متابعة المعاملات والحالات قيد التنفيذ',
        badge: 'التنفيذ والتحصيل',
        targetPage: 'company-portal:followup',
        targetTabLabel: 'متابعة الحالات قيد التنفيذ',
        description: 'الجدول الزمني الميداني لمتابعة الطلبات المعتمدة التي يجري توقيع عقودها أو استعلامها الميداني أو تحويل مبالغها للتجار. يتيح لك مراقبة سرعة إنجاز كل خطوة والتواصل المباشر مع العميل أو التاجر دون تأخير.',
        tips: [
          'جدول زمني يوثق كل مرحلة من مراحل المعاملة مع اسم الموظف المسؤول وتوقيتها.',
          'تنبيهات فورية بالمعاملات التي تتطلب إجراءات سريعة لتجنب تعطل العميل.',
          'تأكيد تحويل المبالغ للموردين وإشعارهم بانتهاء دورة التمويل بنجاح.'
        ],
        icon: CheckCircle2,
        color: 'from-emerald-700 via-teal-900 to-slate-950'
      },
      {
        title: 'إدارة الفروع ورفع الشيت المجمع',
        badge: 'الفروع والانتشار',
        targetPage: 'company-branches',
        targetTabLabel: 'فروع الشركة',
        description: 'إدارة شبكة فروع شركتكم في مختلف محافظات مصر. يمكنك إضافة فرع يدوياً أو رفع شيت إكسيل لكافة الفروع بنمط الأسماء فقط، حيث يقوم النظام بتوليد اسم مستخدم وكلمة مرور لكل فرع تلقائياً مع إمكانية تعديلها أو حذف الفرع في أي وقت.',
        tips: [
          'رفع شيت إكسيل (CSV) لكافة الفروع دفعة واحدة بنموذج استرشادي ميسر.',
          'توليد اسم مستخدم وكلمة مرور تلقائية لكل فرع (بصيغة [كود الفرع]@2026) قابلة للتعديل والنسخ بنقرة واحدة.',
          'إمكانية تعديل بيانات أي فرع أو حذفه بسهولة مع الحفاظ على تزامن الفروع سحابياً.'
        ],
        icon: MapPin,
        color: 'from-purple-700 via-slate-900 to-indigo-950'
      },
      {
        title: 'فريق العمل ومصفوفة أداء مسؤولي الائتمان',
        badge: 'الكوادر والخصوصية',
        targetPage: 'company-staff',
        targetTabLabel: 'فريق العمل والائتمان',
        description: 'قسم خاص وحصري بموظفي شركتكم ومسؤولي الائتمان التابعين لكم فقط مع خصوصية تامة. يمكنك هنا تعيين موظفين جدد وتحديد صلاحياتهم وكلمات مرورهم، ومتابعة مصفوفة الأداء ومعدل سرعة البت في الطلبات لكل موظف.',
        tips: [
          'إضافة مسؤولي الائتمان وتحديد صلاحياتهم الحصرية (فحص الطلبات، دراسة المخاطر، التحصيل).',
          'مصفوفة إحصائية لقياس عدد الطلبات المنجزة وسرعة استجابة مسؤولي الائتمان بالشركة.',
          'تعديل كلمات مرور وحسابات الموظفين مباشرة عند الحاجة.'
        ],
        icon: Users,
        color: 'from-amber-700 via-rose-950 to-slate-900'
      },
      {
        title: 'لوحة التقارير المتقدمة والتحليلات البيانية',
        badge: 'التحليلات ودعم القرار',
        targetPage: 'company-reports',
        targetTabLabel: 'التقارير والأداء',
        description: 'منصة تحليلات مالية متطورة تدعم اتخاذ القرارات الاستراتيجية لشركتكم. تتضمن رسوماً بيانية تفاعلية متعددة لحجم التمويل والتحصيلات وأداء الفروع، مع بقاء كافة البيانات السابقة متاحة دون أرشفة لمتابعة الأداء التاريخي كاملاً.',
        tips: [
          'شارتات بيانية متقدمة لتوزيع التمويل حسب الشهور والسلع والفروع الأكثر طلباً.',
          'البيانات التاريخية تبقى متاحة بالكامل دائماً للمقارنة والتحليل دون أرشفة.',
          'تصدير التقارير الإحصائية والمالية لدعم اجتماعات الإدارة ومراجعة السياسات.'
        ],
        icon: BarChart3,
        color: 'from-cyan-700 via-blue-950 to-slate-950'
      },
      {
        title: 'إعدادات هوية الشركة وضبط الغلاف وكلمات المرور',
        badge: 'الهوية والأمان',
        targetPage: 'company-settings',
        targetTabLabel: 'إعدادات الشركة وكلمات المرور',
        description: 'تخصيص الهوية البصرية لشركتكم: رفع اللوجو وصورة الغلاف (Cover) مع إمكانية تحريكها وسحبها بالماوس مباشرة في أي اتجاه لتحديد الجزء الظاهر بدقة، بالإضافة لتعديل اسم المستخدم وكلمة المرور للمدير العام في نفس المكان.',
        tips: [
          'سحب صورة الغلاف بالماوس أو اللمس مباشرة في أي اتجاه مع معاينة حية ومطابقة للبورتال.',
          'تعديل اسم المستخدم وكلمة المرور الخاصة بحساب مدير الشركة بسهولة وسرعة.',
          'تحديد قنوات الاستقبال الرسمية للطلبات (عبر البورتال، الواتساب الرسمي، أو الإيميل).'
        ],
        icon: Settings,
        color: 'from-emerald-800 via-slate-900 to-indigo-950'
      }
    ];
  } else if (isMerchantUser) {
    steps = [
      {
        title: 'لوحة تحكم التاجر والمبيعات',
        badge: 'بوابة المبيعات',
        targetPage: 'dashboard',
        targetTabLabel: 'الرئيسية',
        description: 'بوابتك الرقمية المباشرة لتقديم خدمات البيع بالتقسيط لعملائك ومزارعيك عبر أكبر شركات التمويل والاستهلاك المعتمدة في مصر، وزيادة مبيعاتك فورياً بدون أي مخاطر ائتمانية.',
        tips: [
          'الحصول على موافقات ائتمانية سريعة لعملائك.',
          'تحويل قيمة المبيعات والأرباح مباشرة إلى محفظتك المالية.'
        ],
        icon: Building2,
        color: 'from-emerald-700 to-teal-900'
      },
      {
        title: 'تقديم طلب تقسيط جديد وفحص المستندات',
        badge: 'رفع المعاملات',
        targetPage: 'new-application',
        targetTabLabel: 'طلب تقسيط جديد',
        description: 'خطوات رقمية ميسرة لتسجيل بيانات العميل والضامن ورفع صور بطاقة الرقم القومي وإيصال المرافق من الموبايل أو الكمبيوتر في دقائق معدودة.',
        tips: [
          'النظام يدعم ضغط الصور تلقائياً لسرعة الرفع من الهاتف المحمول.',
          'التحقق التلقائي الذكي من صحة أرقام بطاقات الرقم القومي المصري.'
        ],
        icon: FileText,
        color: 'from-sky-700 to-indigo-900'
      },
      {
        title: 'حاسبة الأقساط والعمولات الفورية',
        badge: 'الشفافية المالية',
        targetPage: 'calculator',
        targetTabLabel: 'حاسبة الأقساط',
        description: 'احسب لعميلك القسط الشهري بدقة، واختر مدة التقسيط الأنسب (من 6 إلى 36 شهراً)، مع معرفة قيمة العمولة المستحقة لمتجرك مسبقاً قبل إرسال الطلب.',
        tips: [
          'مقارنة خطط التمويل بين شركات التقسيط والبرامج المتاحة.',
          'طباعة ومشاركة جدول الأقساط مع العميل بكل شفافية.'
        ],
        icon: Calculator,
        color: 'from-purple-700 to-indigo-950'
      },
      {
        title: 'محفظة الأرباح وسحب المستحقات المالية',
        badge: 'أرباحك المباشرة',
        targetPage: 'wallet',
        targetTabLabel: 'محفظة الأرباح',
        description: 'تابع رصيد عمولاتك وأرباحك المتراكمة من المعاملات المعتمدة، واطلب سحب أرباحك في أي وقت لحسابك البنكي أو محفظتك الإلكترونية (فودافون كاش، إنستاباي، إلخ).',
        tips: [
          'إشعارات فورية عند الموافقة على الطلب وإضافة العمولة لرصيد محفظتك.',
          'سجل مالي دقيق ومفصل بكافة التحويلات وطلبات السحب المنفذة.'
        ],
        icon: Wallet,
        color: 'from-amber-700 to-slate-900'
      }
    ];
  } else {
    // Admin / Super Admin
    steps = [
      {
        title: 'المركز القيادي لإدارة المنظومة',
        badge: 'الإدارة المركزية',
        targetPage: 'dashboard',
        targetTabLabel: 'لوحة القيادة',
        description: 'لوحة التحكم المركزية لإدارة كافة أطراف المنظومة: شركات التقسيط الشريكة، شبكة الموردين والتجار، السيولة التمويلية، والسياسات الائتمانية.',
        tips: [
          'متابعة مؤشرات الأداء الكلي وحجم المعاملات المالي اليومي لمنصة كروبسا.',
          'مراقبة نمو المحفظة التمويلية ونسب الموافقة والتعثر اللحظية.'
        ],
        icon: ShieldCheck,
        color: 'from-slate-900 via-crobsa-950 to-slate-900'
      },
      {
        title: 'إدارة شركات التقسيط الشريكة',
        badge: 'الشركات والأسقف',
        targetPage: 'companies',
        targetTabLabel: 'شركات التقسيط المعتمدة',
        description: 'إضافة وتعديل وحذف شركات التقسيط، تعيين الأسقف الائتمانية، ونسب العمولات، وتعديل اسم المستخدم وكلمة المرور لحساب مدير الشركة في نفس المكان.',
        tips: [
          'تعديل فوري لحساب وباسورد مدير كل شركة تقسيط من نفس نافذة التعديل.',
          'ضبط صورة الغلاف وموضعها بالسحب المباشر بالفأرة.',
          'إدارة الفروع والشيتات التلقائية لكل شركة.'
        ],
        icon: Building2,
        color: 'from-sky-800 to-indigo-950'
      },
      {
        title: 'إدارة شبكة الموردين والتجار المعتمدين',
        badge: 'الموردين والتجار',
        targetPage: 'suppliers',
        targetTabLabel: 'شبكة الموردين والتجار',
        description: 'لوحة متكاملة لمدير النظام للتحكم في الموردين والتجار: إضافة مورد جديد، تعيين بيانات الدخول (اسم مستخدم وكلمة مرور)، متابعة وتعديل أرصدة المحافظ، ونسب العمولات والتحكم الكامل.',
        tips: [
          'إضافة مورد وتحديد حسابه وكلمة مروره ونسبة عمولته ورصيده الافتتاحي.',
          'تعديل أرصدة المحافظ أو إعادة تعيين كلمات المرور فورياً.',
          'متابعة حجم مبيعات كل مورد والمعاملات المرتبطة به.'
        ],
        icon: Store,
        color: 'from-amber-700 to-indigo-950'
      },
      {
        title: 'برامج التمويل والخطط الاستهلاكية',
        badge: 'البرامج التمويلية',
        targetPage: 'financing-programs',
        targetTabLabel: 'برامج التمويل',
        description: 'تصميم وإطلاق برامج التمويل المخصصة للمزارعين ورواد الأعمال مع تخصيص شروط الفائدة والدفعات المقدمة وسنوات السداد.',
        tips: [
          'تحديد فترات السداد والفوائد لكل منتج تمويلي.',
          'ربط البرامج بالشركات التمويلية المؤهلة.'
        ],
        icon: Layers,
        color: 'from-purple-800 to-slate-950'
      },
      {
        title: 'إعدادات النظام والأمان وتصفير البيانات التجريبية',
        badge: 'الأمان والتخصيص',
        targetPage: 'settings',
        targetTabLabel: 'إعدادات المنظومة',
        description: 'تخصيص كامل لهوية المنظومة، إعدادات خادم البريد SMTP، وميزة تصفير البيانات التجريبية المحمية بكلمة المرور لتسليم المنظومة جاهزة للإنتاج.',
        tips: [
          'تصفير البيانات التجريبية بكلمة المرور Cropsa@015252505111.',
          'التحكم في هوية المنصة وحماية الحسابات من أي محاولات وصول غير مصرح بها.'
        ],
        icon: Settings,
        color: 'from-emerald-800 to-slate-950'
      }
    ];
  }

  // Active step synchronization
  const step = steps[currentStepIndex] || steps[0];
  const StepIcon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  // Whenever step changes, navigate to the target tab in real time!
  useEffect(() => {
    if (isOpen && step?.targetPage && onNavigate) {
      onNavigate(step.targetPage);
    }
  }, [isOpen, currentStepIndex, step?.targetPage, onNavigate]);

  if (!isOpen) return null;

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
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (steps[nextIndex]?.targetPage && onNavigate) {
        onNavigate(steps[nextIndex].targetPage!);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (steps[prevIndex]?.targetPage && onNavigate) {
        onNavigate(steps[prevIndex].targetPage!);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-2 flex flex-col max-h-[92vh]">
        
        {/* Tour Header Banner */}
        <div className={`bg-gradient-to-r ${step.color} text-white p-5 sm:p-6 relative overflow-hidden shrink-0 transition-all duration-300`}>
          {/* Background Decorative Rings */}
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-10 -top-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg">
                <StepIcon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block border border-white/10">
                    {step.badge}
                  </span>
                  {step.targetTabLabel && (
                    <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                      <span>التاب المباشر:</span>
                      <span>{step.targetTabLabel}</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title="تخطي الجولة"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar & Counter */}
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-white/80">
            <span>الخطوة {currentStepIndex + 1} من {steps.length}</span>
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(i);
                    if (steps[i]?.targetPage && onNavigate) {
                      onNavigate(steps[i].targetPage!);
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex 
                      ? 'w-6 bg-white' 
                      : i < currentStepIndex 
                      ? 'w-2 bg-white/60 hover:bg-white' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`انتقل للخطوة ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tour Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {step.description}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-crobsa-700" />
              <span>أهم المميزات والتفاصيل داخل هذا القسم:</span>
            </span>
            <div className="space-y-2">
              {step.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-100 shadow-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tour Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
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
