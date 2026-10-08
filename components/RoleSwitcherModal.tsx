import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, User } from '../types';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Shield, 
  CreditCard, 
  ShoppingBag,
  ArrowLeftRight
} from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { currentUser, users, login, companies, branches, language } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'ADMIN' | 'COMPANY' | 'PARTNERS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || currentUser?.role !== Role.SUPER_ADMIN) return null;

  const roleMeta: Record<string, { label: string; badgeColor: string; icon: any }> = {
    [Role.SUPER_ADMIN]: {
      label: 'مدير النظام العام',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: ShieldCheck
    },
    [Role.ADMIN]: {
      label: 'مسؤول العمليات والاعتمادات',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Shield
    },
    [Role.INSTALLMENT_COMPANY]: {
      label: 'المدير التنفيذي لشركة التقسيط',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Building2
    },
    [Role.BRANCH_MANAGER]: {
      label: 'مدير فرع شركة التقسيط',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      icon: MapPin
    },
    [Role.COMPANY_EMPLOYEE]: {
      label: 'موظف دراسة وفحص ائتماني',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: Briefcase
    },
    [Role.SUPPLIER]: {
      label: 'مورد معتمد / تاجر',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ShoppingBag
    },
    [Role.SALESMAN]: {
      label: 'موظف البيع (رافع الطلبات)',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Users
    }
  };

  const getCompanyDetails = (u: User) => {
    if (u.companyId) {
      const comp = companies.find(c => c.id === u.companyId);
      return comp ? comp.name : 'شركة تقسيط معتمدة';
    }
    if (u.role === Role.SUPER_ADMIN || u.role === Role.ADMIN) {
      return 'منظومة كروبسا مصر الرئيسية';
    }
    if (u.role === Role.SUPPLIER || u.role === Role.SALESMAN) {
      return 'شبكة التجار والموردين';
    }
    return 'غير محدد';
  };

  const getScopeDescription = (u: User) => {
    switch (u.role) {
      case Role.SUPER_ADMIN:
        return 'إشراف كامل وشامل على كل شركات التقسيط، الفروع، العمليات، والمحفظة المالية والرقابة.';
      case Role.ADMIN:
        return 'مراجعة وتوجيه طلبات التمويل بين الشركات، فحص الاستعلامات واعتماد مستندات العملاء.';
      case Role.INSTALLMENT_COMPANY:
        return 'إدارة شاملة لشركة التقسيط (الفروع، فريق العمل، نسب القبول، الشروط، والتحصيلات).';
      case Role.BRANCH_MANAGER:
        return `إدارة طلبات وموظفي الفرع (${u.branchName || 'الفرع الرئيسي'}) ومتابعة الأداء الجغرافي والتحصيل.`;
      case Role.COMPANY_EMPLOYEE:
        return `فحص طلبات التمويل المسندة ومراجعة المستندات وتشغيل حاسبة الائتمان بالذكاء الاصطناعي.`;
      case Role.SUPPLIER:
        return 'تقديم طلبات التقسيط للمشترين والمزارعين ومتابعة الأرباح وطلب سحب الأرصدة.';
      case Role.SALESMAN:
        return 'موظف البيع المختص برفع طلبات التقسيط والمستندات والتحقق من اشتراطات برامج شركات التقسيط.';
      default:
        return '';
    }
  };

  const filteredUsers = users.filter(u => {
    if (selectedCategory === 'ADMIN') {
      if (u.role !== Role.SUPER_ADMIN && u.role !== Role.ADMIN) return false;
    } else if (selectedCategory === 'COMPANY') {
      if (
        u.role !== Role.INSTALLMENT_COMPANY && 
        u.role !== Role.BRANCH_MANAGER && 
        u.role !== Role.COMPANY_EMPLOYEE
      ) return false;
    } else if (selectedCategory === 'PARTNERS') {
      if (u.role !== Role.SUPPLIER && u.role !== Role.SALESMAN) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(term);
      const usernameMatch = u.username?.toLowerCase().includes(term);
      const branchMatch = u.branchName?.toLowerCase().includes(term);
      const govMatch = u.governorate?.toLowerCase().includes(term);
      return nameMatch || usernameMatch || branchMatch || govMatch;
    }

    return true;
  });

  const handleSwitchUser = async (u: User) => {
    await login(u.username || u.email, 'password');
    onClose();

    // Auto-navigate to appropriate home page
    if (u.role === Role.INSTALLMENT_COMPANY || u.role === Role.BRANCH_MANAGER) {
      onNavigate('company-dashboard');
    } else if (u.role === Role.COMPANY_EMPLOYEE) {
      onNavigate('company-portal');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" 
        dir="rtl"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-crobsa-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
              <ArrowLeftRight className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>تبديل الأدوار وتجربة حسابات المنظومة</span>
                <span className="text-xs font-normal bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                  فصل الصلاحيات الكامل
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                يمكنك التبديل الفوري بين مدير المنصة، شركة التقسيط، مدير الفرع، موظف الائتمان، والموردين لرؤية الصلاحيات بدقة.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl transition-all ${
                selectedCategory === 'ALL' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كافة الحسابات ({users.length})
            </button>
            <button
              onClick={() => setSelectedCategory('ADMIN')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl transition-all ${
                selectedCategory === 'ADMIN' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              إدارة المنصة (2)
            </button>
            <button
              onClick={() => setSelectedCategory('COMPANY')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl transition-all ${
                selectedCategory === 'COMPANY' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              شركات التقسيط والفروع
            </button>
            <button
              onClick={() => setSelectedCategory('PARTNERS')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl transition-all ${
                selectedCategory === 'PARTNERS' 
                  ? 'bg-white text-amber-700 shadow-sm' 
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              الموردون والمناديب
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="ابحث بالاسم، الفرع، أو المحافظة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map(u => {
            const isCurrent = currentUser?.id === u.id;
            const meta = roleMeta[u.role] || { label: u.role, badgeColor: 'bg-slate-100 text-slate-800', icon: Users };
            const Icon = meta.icon;
            const companyName = getCompanyDetails(u);
            const scopeDesc = getScopeDescription(u);

            return (
              <div 
                key={u.id}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Role Badge & Current Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.badgeColor}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{meta.label}</span>
                    </span>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                        <span>أنت مسجل بهذا الحساب حالياً</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        @{u.username}
                      </span>
                    )}
                  </div>

                  {/* User Name & Details */}
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                      isCurrent 
                        ? 'bg-sky-600 text-white shadow-sky-500/30' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {u.name}
                      </h3>
                      
                      {/* Affiliation info */}
                      <div className="mt-1 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{companyName}</span>
                        </div>

                        {(u.branchName || u.governorate) && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>
                              {u.branchName || ''} {u.governorate ? `(${u.governorate})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scope Description */}
                  <div className="mt-3 bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                    {scopeDesc}
                  </div>
                </div>

                {/* Switch Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-medium">
                    كلمة المرور الافتراضية: <span className="font-mono text-slate-600">password</span>
                  </div>

                  {isCurrent ? (
                    <span className="text-xs font-bold text-sky-700 bg-sky-100 px-3 py-1.5 rounded-xl">
                      الحساب النشط ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchUser(u)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-sky-600 transition-colors shadow-sm"
                    >
                      <span>تبديل لهذا الحساب</span>
                      <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <span>يتم ضبط واجهات النظام والقوائم الجانبية تلقائياً بحسب الدور والصلاحيات الممنوحة لكل حساب.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
