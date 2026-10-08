import React, { useMemo, useState } from 'react';
import { useStore } from '../context/Store';
import { Role, ApplicationStatus, STATUS_ARABIC, Client } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Wallet, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Trophy, 
  PlusCircle, 
  Search, 
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Building2,
  UserPlus,
  Zap,
  MapPin,
  Phone,
  X,
  CreditCard,
  AlertCircle,
  Check
} from 'lucide-react';
import { ClientSolvencyGauge } from '../components/ClientSolvencyGauge';
import { ComprehensiveAnalyticsSection } from '../components/ComprehensiveAnalyticsSection';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#f43f5e'];

const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, subtext }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs transition-all hover:border-slate-300">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">{value}</p>
        {subtext && <p className="text-[11px] text-slate-400 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { currentUser, applications, users, clients, branches, addClient, setNavigation } = useStore();

  // Quick Action Dialogs State
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditSearchQuery, setCreditSearchQuery] = useState('');
  const [selectedCreditClient, setSelectedCreditClient] = useState<Client | null>(null);

  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    nationalId: '',
    phoneNumber: '',
    governorate: 'القاهرة',
    profession: 'MERCHANT' as any
  });
  const [addClientSubmitting, setAddClientSubmitting] = useState(false);
  const [addClientSuccessMessage, setAddClientSuccessMessage] = useState<string | null>(null);
  const [addClientError, setAddClientError] = useState('');

  const stats = useMemo(() => {
    if (!currentUser) return null;

    let myApps = applications;
    if (currentUser.role === Role.SUPPLIER || currentUser.role === Role.SALESMAN) {
      myApps = applications.filter(app => app.submittedBy === currentUser.id);
    } else if (currentUser.role === Role.INSTALLMENT_COMPANY) {
      myApps = applications.filter(app => app.assignedCompanyIds.includes(currentUser.id));
    } else if (currentUser.role === Role.BRANCH_MANAGER) {
      myApps = applications.filter(app => app.assignedBranchId === currentUser.branchId);
    }

    const total = myApps.length;
    const pending = myApps.filter(a => [ApplicationStatus.PENDING_ADMIN, ApplicationStatus.PENDING_REVIEW, ApplicationStatus.RECEIVED].includes(a.status)).length;
    const approved = myApps.filter(a => a.status === ApplicationStatus.APPROVED).length;
    const rejected = myApps.filter(a => a.status === ApplicationStatus.REJECTED).length;
    
    const approvedAmount = myApps.reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);
    const usedAmount = myApps.reduce((acc, curr) => acc + (curr.usedAmount || 0), 0);
    const availableBalance = approvedAmount - usedAmount;

    // Trend data
    const trendData = [
      { name: 'السبت', apps: 4 },
      { name: 'الأحد', apps: 7 },
      { name: 'الاثنين', apps: 5 },
      { name: 'الثلاثاء', apps: 10 },
      { name: 'الأربعاء', apps: total > 10 ? total - 5 : 2 },
      { name: 'الخميس', apps: total },
    ];

    // Ranking Data for Super Admin
    let rankingData: any[] = [];
    if (currentUser.role === Role.SUPER_ADMIN) {
      rankingData = users
        .filter(u => u.role === Role.SUPPLIER || u.role === Role.SALESMAN)
        .map(u => {
           const userApps = applications.filter(app => app.submittedBy === u.id);
           return {
             id: u.id,
             name: u.name,
             role: u.role,
             totalApps: userApps.length,
             approvedApps: userApps.filter(a => a.status === ApplicationStatus.APPROVED).length,
             totalVolume: userApps.reduce((sum, a) => sum + (a.approvedAmount || 0), 0)
           };
        })
        .sort((a, b) => b.totalApps - a.totalApps);
    }

    // Recent 5 applications
    const recentApps = [...myApps]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);

    return { total, pending, approved, rejected, approvedAmount, usedAmount, availableBalance, myApps, trendData, rankingData, recentApps };
  }, [currentUser, applications, users]);

  if (!stats) return <div className="p-8 text-center text-slate-400 text-sm">جاري التحميل...</div>;

  const chartData = [
    { name: 'قيد الانتظار', value: stats.pending },
    { name: 'مقبول', value: stats.approved },
    { name: 'مرفوض', value: stats.rejected },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Live Status Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              أهلاً بك، {currentUser?.name}
            </h1>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {currentUser?.role === Role.SUPER_ADMIN ? 'الإدارة العامة للمنظومة' :
               currentUser?.role === Role.ADMIN ? 'مدير العمليات' :
               currentUser?.role === Role.INSTALLMENT_COMPANY ? 'إدارة شركة التقسيط' :
               currentUser?.role === Role.BRANCH_MANAGER ? 'مدير الفرع' :
               currentUser?.role === Role.SALESMAN ? 'مسؤول المبيعات' : 'شريك معتمد'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مؤشرات الأداء المالي، حجم الطلبات، ومتابعة المعاملات الائتمانية اللحظية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <button
            onClick={() => setNavigation({ page: 'new-application' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>طلب تقسيط جديد</span>
          </button>

          <button
            onClick={() => setNavigation({ page: 'clients' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4 text-slate-500" />
            <span>سجل العملاء</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard 
          title="إجمالي الطلبات" 
          value={stats.total} 
          icon={FileText} 
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          subtext="إجمالي المعاملات المسجلة"
        />
        <StatCard 
          title="قيد المراجعة والإسناد" 
          value={stats.pending} 
          icon={Clock} 
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subtext="تتطلب دراسة أو إسناد"
        />
        <StatCard 
          title="تمت الموافقة والاعتماد" 
          value={stats.approved} 
          icon={CheckCircle2} 
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtext={`المعتمد: ${stats.approvedAmount.toLocaleString()} ج.م`}
        />
        <StatCard 
          title="المبلغ المصروف فعلياً" 
          value={`${stats.usedAmount.toLocaleString()} ج.م`} 
          icon={Wallet} 
          iconBg="bg-indigo-50"
          iconColor="text-indigo-700"
          subtext={`نسبة الصرف: ${stats.approvedAmount > 0 ? Math.round((stats.usedAmount / stats.approvedAmount) * 100) : 0}%`}
        />
        <StatCard 
          title="تم الرفض" 
          value={stats.rejected} 
          icon={XCircle} 
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          subtext="ملفات غير مستوفية"
        />
      </div>

      {/* Super Admin Ranking Table */}
      {currentUser?.role === Role.SUPER_ADMIN && stats.rankingData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>ترتيب الموردين والمناديب الأكثر نشاطاً</span>
          </h3>
          <div className="overflow-x-auto">
             <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/60">
                   <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">الاسم</th>
                      <th className="px-4 py-2.5">الدور</th>
                      <th className="px-4 py-2.5">إجمالي الطلبات</th>
                      <th className="px-4 py-2.5">المقبولة</th>
                      <th className="px-4 py-2.5">حجم التمويل (ج.م)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {stats.rankingData.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                         <td className="px-4 py-3 font-bold text-slate-900">#{idx + 1}</td>
                         <td className="px-4 py-3 font-semibold text-slate-800">{user.name}</td>
                         <td className="px-4 py-3 text-slate-500">{user.role === Role.SUPPLIER ? 'مورد' : 'مندوب'}</td>
                         <td className="px-4 py-3 font-bold text-sky-600 tabular-nums">{user.totalApps}</td>
                         <td className="px-4 py-3 text-emerald-600 font-medium tabular-nums">{user.approvedApps}</td>
                         <td className="px-4 py-3 font-mono font-medium text-slate-700 tabular-nums">{user.totalVolume.toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Recent Applications Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">أحدث طلبات التمويل</h3>
            <p className="text-[11px] text-slate-500">آخر المعاملات والملفات التي تم تسجيلها مؤخراً</p>
          </div>
          <button
            onClick={() => setNavigation({ page: 'applications' })}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>عرض كل الطلبات</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {stats.recentApps.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            لا توجد طلبات مسجلة حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-2.5">رقم الطلب</th>
                  <th className="px-4 py-2.5">العميل</th>
                  <th className="px-4 py-2.5">المبلغ المطلوب</th>
                  <th className="px-4 py-2.5">الحالة</th>
                  <th className="px-4 py-2.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentApps.map(app => (
                  <tr 
                    key={app.id} 
                    onClick={() => setNavigation({ page: 'applications', resourceId: app.id })}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 font-bold">{app.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{app.clientName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{app.clientNationalId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 tabular-nums">
                      {app.requestedAmount.toLocaleString()} ج.م
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {STATUS_ARABIC[app.status] || app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(app.submittedAt).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                <span>معدل الطلبات الأسبوعي</span>
              </h3>
              <p className="text-[11px] text-slate-400">توزيع المعاملات على مدار أيام الأسبوع</p>
            </div>
          </div>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="apps" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">توزيع الحالات</h3>
            <p className="text-[11px] text-slate-400">نسبة الموافقات والمراجعات</p>
          </div>
          <div className="h-48 flex justify-center items-center my-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2 border-t border-slate-100 text-xs">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-slate-600 text-[11px] font-medium">
                <span className="w-2.5 h-2.5 rounded-full ml-1.5" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name}: <strong className="font-mono text-slate-800">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: CHECK CLIENT CREDIT (فحص واستعلام الجدارة الائتمانية) */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>فحص واستعلام الجدارة الائتمانية</span>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      I-Score & Solvency
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    استعلام فوري عن التقييم الائتماني والحدود التمويلية للعملاء بالرقم القومي
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreditModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرقم القومي المكون من 14 رقم..."
                  value={creditSearchQuery}
                  onChange={e => setCreditSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Quick Pick Clients */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none text-xs">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">نماذج سريعة:</span>
                {clients.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCreditClient(c);
                      setCreditSearchQuery('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                      selectedCreditClient?.id === c.id 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(() => {
                const targetClient = creditSearchQuery.trim()
                  ? clients.find(c => 
                      c.name.toLowerCase().includes(creditSearchQuery.toLowerCase()) || 
                      c.nationalId?.includes(creditSearchQuery.trim())
                    ) || selectedCreditClient
                  : selectedCreditClient;

                if (!targetClient) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      لم يتم العثور على عميل يطابق البحث. يرجى إدخال اسم العميل أو رقمه القومي.
                    </div>
                  );
                }

                const apps = applications.filter(a => a.clientNationalId === targetClient.nationalId);
                const approvedApps = apps.filter(a => a.status === ApplicationStatus.APPROVED);
                const totalApproved = approvedApps.reduce((sum, a) => sum + (a.approvedAmount || 0), 0) || targetClient.totalApprovedAmount || 85000;
                const totalUsed = approvedApps.reduce((sum, a) => sum + (a.usedAmount || 0), 0) || 0;
                const available = Math.max(0, totalApproved - totalUsed);

                return (
                  <div className="space-y-4">
                    {/* Client Identity Summary */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{targetClient.name}</span>
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            {targetClient.creditRating ? `تصنيف ائتماني ${targetClient.creditRating}` : 'A+ تصنيف ممتاز'}
                          </span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-mono">
                          <span>الرقم القومي: <strong className="text-slate-700">{targetClient.nationalId}</strong></span>
                          <span>الهاتف: <strong className="text-slate-700" dir="ltr">{targetClient.phoneNumber}</strong></span>
                          <span className="font-sans">المحافظة: <strong className="text-slate-700">{targetClient.governorate || 'القاهرة'}</strong></span>
                        </div>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-slate-400 block font-sans">الرصيد التمويلي المتاح</span>
                        <span className="text-base font-black text-emerald-600 block">
                          {available.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Gauge Display */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <ClientSolvencyGauge
                        score={targetClient.aiSolvencyScore || 85}
                        riskTier={targetClient.aiRiskTier || 'LOW'}
                        suggestedLimit={targetClient.aiSuggestedLimit || 120000}
                        monthlyIncome={targetClient.monthlyIncome || 22000}
                        monthlyObligations={targetClient.monthlyObligations || 4500}
                        summary={targetClient.aiSolvencySummary || 'سجل ائتماني ممتاز، انتظام مستمر في سداد الالتزامات السابقة، مخاطر ائتمانية منخفضة للغاية.'}
                        clientName={targetClient.name}
                      />
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreditModal(false);
                          setNavigation({ page: 'new-application' });
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>تقديم طلب تقسيط لهذا العميل الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreditModal(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW CLIENT (إضافة عميل جديد) */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                  <UserPlus className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>إضافة وتسجيل عميل جديد</span>
                    <span className="text-[10px] bg-purple-400/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                      New Client
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    تسجيل بيانات العميل بالرقم القومي لتمكينه من برامج التقسيط
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddClientModal(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            {addClientSuccessMessage ? (
              <div className="p-6 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {addClientSuccessMessage}
                </h4>
                <p className="text-xs text-slate-500">
                  تم حفظ بيانات العميل في قاعدة البيانات المركزية وأصبح مؤهلاً لتقديم طلبات التمويل والتقسيط فوراً.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientModal(false);
                      setNavigation({ page: 'new-application' });
                    }}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>تقديم طلب تقسيط للعميل الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newClientData.name.trim() || !newClientData.nationalId.trim()) {
                    setAddClientError('يرجى ملء اسم العميل والرقم القومي بشكل صحيح');
                    return;
                  }
                  if (newClientData.nationalId.trim().length !== 14) {
                    setAddClientError('الرقم القومي يجب أن يتكون من 14 رقماً');
                    return;
                  }
                  setAddClientSubmitting(true);
                  setAddClientError('');
                  try {
                    await addClient({
                      name: newClientData.name.trim(),
                      nationalId: newClientData.nationalId.trim(),
                      phoneNumber: newClientData.phoneNumber.trim() || '01000000000',
                      governorate: newClientData.governorate,
                      profession: newClientData.profession
                    });
                    setAddClientSuccessMessage(`تم تسجيل العميل (${newClientData.name}) بنجاح`);
                  } catch (err) {
                    setAddClientError('حدث خطأ أثناء حفظ بيانات العميل');
                  } finally {
                    setAddClientSubmitting(false);
                  }
                }}
                className="p-6 space-y-4 overflow-y-auto"
              >
                {addClientError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{addClientError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    اسم العميل بالكامل رباعياً <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمود عبد الله السيد خليل"
                    value={newClientData.name}
                    onChange={e => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    الرقم القومي (14 رقماً) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="29801010101234"
                    value={newClientData.nationalId}
                    onChange={e => setNewClientData(prev => ({ ...prev, nationalId: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      رقم الهاتف / الواتساب
                    </label>
                    <input
                      type="tel"
                      placeholder="01012345678"
                      value={newClientData.phoneNumber}
                      onChange={e => setNewClientData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      المحافظة
                    </label>
                    <select
                      value={newClientData.governorate}
                      onChange={e => setNewClientData(prev => ({ ...prev, governorate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {['القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الغربية', 'الدقهلية', 'الشرقية', 'المنوفية', 'القليوبية', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'].map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    طبيعة النشاط أو المهنة
                  </label>
                  <select
                    value={newClientData.profession}
                    onChange={e => setNewClientData(prev => ({ ...prev, profession: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="MERCHANT">تاجر / صاحب محل تجاري</option>
                    <option value="FARMER">مزارع / صاحب حيازة زراعية</option>
                    <option value="EQUIPMENT_OWNER">مالك معدات وآلات زراعية</option>
                    <option value="FARM_OWNER">صاحب مزرعة أو مشروع داجني/حيواني</option>
                    <option value="EMPLOYEE">موظف قطاع عام أو خاص</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={addClientSubmitting}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{addClientSubmitting ? 'جاري الحفظ...' : 'تأكيد إضافة العميل'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
