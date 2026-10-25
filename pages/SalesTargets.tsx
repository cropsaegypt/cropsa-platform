import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  Role, 
  Application, 
  ApplicationStatus, 
  STATUS_ARABIC,
  SalesmanTarget
} from '../types';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  HelpCircle, 
  Award, 
  Briefcase, 
  Edit3, 
  Plus, 
  X, 
  ChevronDown, 
  ExternalLink, 
  Phone, 
  Building2, 
  PieChart, 
  Layers, 
  ArrowUpRight, 
  FileText, 
  ShieldAlert, 
  UserCheck, 
  Percent, 
  Check, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface SalesmanPerformance {
  name: string;
  isRegisteredUser: boolean;
  userRole?: Role;
  totalApps: number;
  totalRequestedAmount: number;
  approvedCount: number;
  totalApprovedAmount: number;
  approvalRate: number;
  activeCount: number;
  activeAmount: number;
  activeStagesMap: Record<string, number>;
  rejectedCount: number;
  rejectedAmount: number;
  rejectionRate: number;
  rejectionsMap: Record<string, { count: number; clients: Application[] }>;
  topRejectionReason: string;
  targetAmount: number;
  targetCount: number;
  isTargetCustomized: boolean;
  targetNotes?: string;
  achievementPercent: number;
  countAchievementPercent: number;
  remainingToTarget: number;
  allApps: Application[];
  rejectedApps: Application[];
  activeApps: Application[];
  approvedApps: Application[];
}

export const SalesTargets: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    users, 
    salesRepresentatives, 
    salesTargets, 
    saveSalesTarget, 
    companies 
  } = useStore();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'ACHIEVEMENT_DESC' | 'APPROVED_AMOUNT_DESC' | 'TOTAL_APPS_DESC' | 'REMAINING_DESC' | 'REJECTION_RATE_DESC'>('ACHIEVEMENT_DESC');

  // Modals state
  const [editingTargetSalesman, setEditingTargetSalesman] = useState<SalesmanTarget | null>(null);
  const [targetAmountInput, setTargetAmountInput] = useState<string>('');
  const [targetCountInput, setTargetCountInput] = useState<string>('');
  const [targetNotesInput, setTargetNotesInput] = useState<string>('');
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const [viewingRejectionsSalesman, setViewingRejectionsSalesman] = useState<SalesmanPerformance | null>(null);
  const [viewingAppsSalesman, setViewingAppsSalesman] = useState<SalesmanPerformance | null>(null);

  // Helper to map user ID to full name
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  // Filter applications by chosen time range
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const dateStr = app.submittedAt || app.createdAt;
      if (!dateStr) return datePreset === 'ALL';
      const appDate = new Date(dateStr);
      const now = new Date();

      if (datePreset === 'THIS_MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return appDate >= startOfMonth;
      }
      if (datePreset === 'LAST_MONTH') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return appDate >= startOfLastMonth && appDate <= endOfLastMonth;
      }
      if (datePreset === 'THIS_QUARTER') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        return appDate >= startOfQuarter;
      }
      if (datePreset === 'THIS_YEAR') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return appDate >= startOfYear;
      }
      if (datePreset === 'CUSTOM') {
        if (dateFrom && appDate < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && appDate > new Date(`${dateTo}T23:59:59`)) return false;
        return true;
      }
      return true;
    });
  }, [applications, datePreset, dateFrom, dateTo]);

  // Build unique list of all salesmen / sales employees
  const allSalesmenPerformance = useMemo<SalesmanPerformance[]>(() => {
    const salesmenNames = new Set<string>();

    // 1. Registered users with salesman / supplier roles
    users.filter(u => u.role === Role.SALESMAN || u.role === Role.SUPPLIER).forEach(u => salesmenNames.add(u.name));

    // 2. Saved sales representatives
    (salesRepresentatives || []).forEach(r => salesmenNames.add(r));

    // 3. Applications with explicit salesmanName or submittedBy
    applications.forEach(a => {
      if (a.salesmanName && a.salesmanName.trim()) {
        salesmenNames.add(a.salesmanName.trim());
      }
      if (a.submittedBy) {
        const name = getUserName(a.submittedBy);
        if (name) salesmenNames.add(name);
      }
    });

    // 4. Any salesman with configured target
    Object.keys(salesTargets || {}).forEach(k => salesmenNames.add(k));

    const list: SalesmanPerformance[] = [];

    salesmenNames.forEach(name => {
      if (!name || !name.trim()) return;

      const registeredUser = users.find(u => u.name === name || u.id === name);
      const isRegistered = Boolean(registeredUser);

      // Applications attributed to this salesman within the filtered applications
      const apps = filteredApplications.filter(a => {
        if (a.salesmanName && a.salesmanName.trim() === name) return true;
        if (a.submittedBy && (a.submittedBy === name || getUserName(a.submittedBy) === name)) return true;
        return false;
      });

      const totalApps = apps.length;
      const totalRequestedAmount = apps.reduce((sum, a) => sum + (Number(a.requestedAmount) || 0), 0);

      // Approved applications
      const approvedApps = apps.filter(a => 
        a.status === ApplicationStatus.APPROVED || 
        a.status === ApplicationStatus.AMOUNT_TRANSFERRED ||
        a.status === ApplicationStatus.CONTRACT_SIGNING
      );
      const approvedCount = approvedApps.length;
      const totalApprovedAmount = approvedApps.reduce((sum, a) => {
        const amt = a.approvedAmount !== undefined && a.approvedAmount > 0 
          ? Number(a.approvedAmount) 
          : Number(a.requestedAmount) || 0;
        return sum + amt;
      }, 0);
      const approvalRate = totalApps > 0 ? (approvedCount / totalApps) * 100 : 0;

      // Active / In-progress applications (لسا متبقي قد ايه)
      const terminalStatuses = [
        ApplicationStatus.APPROVED, 
        ApplicationStatus.AMOUNT_TRANSFERRED, 
        ApplicationStatus.REJECTED, 
        ApplicationStatus.CANCELLED_BY_CLIENT, 
        ApplicationStatus.WITHDRAWN
      ];
      const activeApps = apps.filter(a => !terminalStatuses.includes(a.status));
      const activeCount = activeApps.length;
      const activeAmount = activeApps.reduce((sum, a) => sum + (Number(a.requestedAmount) || 0), 0);

      // Stages breakdown of active applications
      const activeStagesMap: Record<string, number> = {};
      activeApps.forEach(a => {
        const stageLabel = STATUS_ARABIC[a.status] || a.status;
        activeStagesMap[stageLabel] = (activeStagesMap[stageLabel] || 0) + 1;
      });

      // Rejected applications & deep rejection analysis
      const rejectedApps = apps.filter(a => a.status === ApplicationStatus.REJECTED);
      const rejectedCount = rejectedApps.length;
      const rejectedAmount = rejectedApps.reduce((sum, a) => sum + (Number(a.requestedAmount) || 0), 0);
      const rejectionRate = totalApps > 0 ? (rejectedCount / totalApps) * 100 : 0;

      const rejectionsMap: Record<string, { count: number; clients: Application[] }> = {};
      rejectedApps.forEach(a => {
        const rawReason = a.rejectionReason?.trim() || a.rejectionNotes?.trim() || 'عدم استيفاء شروط وسياسات التمويل';
        if (!rejectionsMap[rawReason]) {
          rejectionsMap[rawReason] = { count: 0, clients: [] };
        }
        rejectionsMap[rawReason].count += 1;
        rejectionsMap[rawReason].clients.push(a);
      });

      // Top rejection cause
      let topRejectionReason = 'لا توجد مرفوضات';
      let maxCount = 0;
      Object.entries(rejectionsMap).forEach(([reason, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count;
          topRejectionReason = reason;
        }
      });

      // Target configuration
      const targetConfig = salesTargets[name];
      const targetAmount = targetConfig?.targetAmount ? Number(targetConfig.targetAmount) : 500000;
      const targetCount = targetConfig?.targetApplicationsCount ? Number(targetConfig.targetApplicationsCount) : 10;
      const isTargetCustomized = Boolean(targetConfig?.targetAmount);
      const targetNotes = targetConfig?.notes;

      const achievementPercent = targetAmount > 0 ? (totalApprovedAmount / targetAmount) * 100 : 0;
      const countAchievementPercent = targetCount > 0 ? (approvedCount / targetCount) * 100 : 0;
      const remainingToTarget = Math.max(0, targetAmount - totalApprovedAmount);

      list.push({
        name,
        isRegisteredUser: isRegistered,
        userRole: registeredUser?.role,
        totalApps,
        totalRequestedAmount,
        approvedCount,
        totalApprovedAmount,
        approvalRate,
        activeCount,
        activeAmount,
        activeStagesMap,
        rejectedCount,
        rejectedAmount,
        rejectionRate,
        rejectionsMap,
        topRejectionReason,
        targetAmount,
        targetCount,
        isTargetCustomized,
        targetNotes,
        achievementPercent,
        countAchievementPercent,
        remainingToTarget,
        allApps: apps,
        rejectedApps,
        activeApps,
        approvedApps
      });
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'ACHIEVEMENT_DESC') return b.achievementPercent - a.achievementPercent;
      if (sortBy === 'APPROVED_AMOUNT_DESC') return b.totalApprovedAmount - a.totalApprovedAmount;
      if (sortBy === 'TOTAL_APPS_DESC') return b.totalApps - a.totalApps;
      if (sortBy === 'REMAINING_DESC') return b.activeCount - a.activeCount;
      if (sortBy === 'REJECTION_RATE_DESC') return b.rejectionRate - a.rejectionRate;
      return 0;
    });
  }, [users, salesRepresentatives, applications, filteredApplications, salesTargets, sortBy]);

  // Filtered by search term
  const displayedSalesmen = useMemo(() => {
    if (!searchTerm.trim()) return allSalesmenPerformance;
    const term = searchTerm.trim().toLowerCase();
    return allSalesmenPerformance.filter(s => s.name.toLowerCase().includes(term));
  }, [allSalesmenPerformance, searchTerm]);

  // Platform Aggregate Totals
  const platformSummary = useMemo(() => {
    const totalTarget = allSalesmenPerformance.reduce((sum, s) => sum + s.targetAmount, 0);
    const totalApproved = allSalesmenPerformance.reduce((sum, s) => sum + s.totalApprovedAmount, 0);
    const totalRequested = allSalesmenPerformance.reduce((sum, s) => sum + s.totalRequestedAmount, 0);
    const totalApps = allSalesmenPerformance.reduce((sum, s) => sum + s.totalApps, 0);
    const totalApprovedCount = allSalesmenPerformance.reduce((sum, s) => sum + s.approvedCount, 0);
    const totalActiveCount = allSalesmenPerformance.reduce((sum, s) => sum + s.activeCount, 0);
    const totalActiveAmount = allSalesmenPerformance.reduce((sum, s) => sum + s.activeAmount, 0);
    const totalRejectedCount = allSalesmenPerformance.reduce((sum, s) => sum + s.rejectedCount, 0);
    const totalRejectedAmount = allSalesmenPerformance.reduce((sum, s) => sum + s.rejectedAmount, 0);

    const overallAchievement = totalTarget > 0 ? (totalApproved / totalTarget) * 100 : 0;
    const overallRejectionRate = totalApps > 0 ? (totalRejectedCount / totalApps) * 100 : 0;
    const overallApprovalRate = totalApps > 0 ? (totalApprovedCount / totalApps) * 100 : 0;

    // Platform-wide rejection reasons breakdown
    const globalRejectionsMap: Record<string, number> = {};
    allSalesmenPerformance.forEach(s => {
      Object.entries(s.rejectionsMap).forEach(([reason, d]) => {
        globalRejectionsMap[reason] = (globalRejectionsMap[reason] || 0) + d.count;
      });
    });

    const sortedGlobalRejections = Object.entries(globalRejectionsMap).sort((a, b) => b[1] - a[1]);

    return {
      totalTarget,
      totalApproved,
      totalRequested,
      totalApps,
      totalApprovedCount,
      totalActiveCount,
      totalActiveAmount,
      totalRejectedCount,
      totalRejectedAmount,
      overallAchievement,
      overallRejectionRate,
      overallApprovalRate,
      sortedGlobalRejections
    };
  }, [allSalesmenPerformance]);

  // Open Edit Target Modal
  const handleOpenEditTarget = (salesman: SalesmanPerformance) => {
    const existing = salesTargets[salesman.name];
    setEditingTargetSalesman({
      salesmanName: salesman.name,
      targetAmount: existing?.targetAmount || salesman.targetAmount || 500000,
      targetApplicationsCount: existing?.targetApplicationsCount || salesman.targetCount || 10,
      notes: existing?.notes || ''
    });
    setTargetAmountInput(String(existing?.targetAmount || salesman.targetAmount || 500000));
    setTargetCountInput(String(existing?.targetApplicationsCount || salesman.targetCount || 10));
    setTargetNotesInput(existing?.notes || '');
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTargetSalesman) return;
    setIsSavingTarget(true);
    try {
      await saveSalesTarget({
        salesmanName: editingTargetSalesman.salesmanName,
        targetAmount: Number(targetAmountInput) || 0,
        targetApplicationsCount: Number(targetCountInput) || 0,
        notes: targetNotesInput.trim() || undefined,
        updatedAt: new Date().toISOString()
      });
      setEditingTargetSalesman(null);
    } catch (err) {
      console.error('Error saving sales target:', err);
    } finally {
      setIsSavingTarget(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md shadow-emerald-600/20">
            <Target className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900">
                لوحة التارجت وأداء موظفي البيع والمندوبين
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-300">
                متابعة شاملة
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              متابعة كل موظف: كم طلب رفع، الحالات المتبقية، المبالغ المعتمدة، نسب تحقيق التارجت، وتحليل تفصيلي لأسباب رفض العملاء.
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (allSalesmenPerformance.length > 0) {
                handleOpenEditTarget(allSalesmenPerformance[0]);
              }
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>تعيين / تعديل مستهدف لموظف</span>
          </button>
        </div>
      </div>

      {/* Time Range Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>فترة التحليل:</span>
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'ALL', label: 'كل الفترات' },
              { id: 'THIS_MONTH', label: 'هذا الشهر' },
              { id: 'LAST_MONTH', label: 'الشهر الماضي' },
              { id: 'THIS_QUARTER', label: 'الربع الحالي' },
              { id: 'THIS_YEAR', label: 'العام الحالي' },
              { id: 'CUSTOM', label: 'مخصص' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDatePreset(tab.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  datePreset === tab.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
              />
              <span className="text-slate-400">إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
              />
            </div>
          )}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم الموظف أو المندوب..."
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="ACHIEVEMENT_DESC">الأعلى تحقيقاً للتارجت</option>
              <option value="APPROVED_AMOUNT_DESC">الأعلى في المبالغ المعتمدة</option>
              <option value="TOTAL_APPS_DESC">الأكثر في عدد الطلبات المرفوعة</option>
              <option value="REMAINING_DESC">الأكثر في الطلبات المتبقية والجارية</option>
              <option value="REJECTION_RATE_DESC">الأعلى في معدل الرفض</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target */}
        <div className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-indigo-800/60 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-white/10 rounded-xl text-indigo-300">
              <Target className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
              مستهدف المنظومة
            </span>
          </div>
          <p className="text-xs text-indigo-200 font-medium">إجمالي التارجت المطلوب</p>
          <p className="text-2xl font-black font-mono tracking-tight mt-1">
            {platformSummary.totalTarget.toLocaleString()} <span className="text-xs font-normal text-indigo-300">ج.م</span>
          </p>
          <div className="mt-3 pt-3 border-t border-indigo-800/80 flex items-center justify-between text-[11px] text-indigo-200">
            <span>نسبة التحقيق الإجمالية:</span>
            <span className="font-bold text-white font-mono">{platformSummary.overallAchievement.toFixed(1)}%</span>
          </div>
        </div>

        {/* Total Approved Volume */}
        <div className="p-5 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl shadow-sm border border-emerald-700/60 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-white/10 rounded-xl text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
              معتمد ومصروف
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-medium">إجمالي المبالغ المعتمدة</p>
          <p className="text-2xl font-black font-mono tracking-tight mt-1">
            {platformSummary.totalApproved.toLocaleString()} <span className="text-xs font-normal text-emerald-200">ج.م</span>
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-700/80 flex items-center justify-between text-[11px] text-emerald-100">
            <span>عدد الطلبات المعتمدة:</span>
            <span className="font-bold text-white font-mono">{platformSummary.totalApprovedCount} طلب</span>
          </div>
        </div>

        {/* Active Remaining Applications (لسا متبقي قد ايه) */}
        <div className="p-5 bg-gradient-to-br from-sky-800 to-blue-900 text-white rounded-2xl shadow-sm border border-sky-700/60 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-white/10 rounded-xl text-sky-200">
              <Clock className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold bg-sky-500/30 text-sky-100 px-2.5 py-0.5 rounded-full border border-sky-400/20">
              قيد المتابعة
            </span>
          </div>
          <p className="text-xs text-sky-100 font-medium">طلبات جارية متبقية</p>
          <p className="text-2xl font-black font-mono tracking-tight mt-1">
            {platformSummary.totalActiveCount} <span className="text-xs font-normal text-sky-200">طلب</span>
          </p>
          <div className="mt-3 pt-3 border-t border-sky-700/80 flex items-center justify-between text-[11px] text-sky-100">
            <span>قيمة المتبقي الجاري:</span>
            <span className="font-bold text-white font-mono">{platformSummary.totalActiveAmount.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Rejection Rate & Analysis */}
        <div className="p-5 bg-gradient-to-br from-rose-900 to-red-950 text-white rounded-2xl shadow-sm border border-rose-800/60 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-white/10 rounded-xl text-rose-200">
              <XCircle className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-bold bg-rose-500/30 text-rose-100 px-2.5 py-0.5 rounded-full border border-rose-400/20">
              معدل الرفض
            </span>
          </div>
          <p className="text-xs text-rose-100 font-medium">طلبات مرفوضة للعملاء</p>
          <p className="text-2xl font-black font-mono tracking-tight mt-1">
            {platformSummary.totalRejectedCount} <span className="text-xs font-normal text-rose-200">طلب ({platformSummary.overallRejectionRate.toFixed(1)}%)</span>
          </p>
          <div className="mt-3 pt-3 border-t border-rose-800/80 flex items-center justify-between text-[11px] text-rose-100 truncate">
            <span>السبب الأبرز:</span>
            <span className="font-bold text-white truncate max-w-[140px]">
              {platformSummary.sortedGlobalRejections[0]?.[0] || 'لا توجد مرفوضات'}
            </span>
          </div>
        </div>
      </div>

      {/* Comprehensive Platform Rejection Cause Analysis Section */}
      {platformSummary.totalRejectedCount > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-100 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span>تحليل وتوزيع أسباب رفض عملاء التمويل على مستوى الفريق</span>
                  <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200">
                    {platformSummary.totalRejectedCount} عميل مرفوض
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  رصد أسباب الرفض لمساعدة الموظفين على تفادي نقاط الضعف الائتمانية واكتمال المستندات قبل التقديم.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {platformSummary.sortedGlobalRejections.map(([reason, count], idx) => {
              const pct = (count / platformSummary.totalRejectedCount) * 100;
              return (
                <div key={idx} className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-slate-800 line-clamp-2">
                      {reason}
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md shrink-0">
                      {count} حالة
                    </span>
                  </div>
                  <div>
                    <div className="w-full bg-rose-200/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-rose-700 font-bold mt-1 block text-left">
                      {pct.toFixed(1)}% من إجمالي حالات الرفض
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Performance Cards & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>أداء الموظفين والمندوبين التفصيلي ({displayedSalesmen.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة الإنجاز المالي والعددي، الطلبات المتبقية، وتحليل ملفات الرفض لكل مسؤول مبيعات.
            </p>
          </div>
          <span className="text-xs bg-slate-200/70 text-slate-700 px-3 py-1 rounded-full font-bold">
            مرتب بحسب: {
              sortBy === 'ACHIEVEMENT_DESC' ? 'الأعلى تحقيقاً للتارجت' :
              sortBy === 'APPROVED_AMOUNT_DESC' ? 'المبالغ المعتمدة' :
              sortBy === 'TOTAL_APPS_DESC' ? 'عدد الطلبات المرفوعة' :
              sortBy === 'REMAINING_DESC' ? 'الطلبات المتبقية' : 'معدل الرفض'
            }
          </span>
        </div>

        {/* Desktop View Table */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">الموظف / المندوب</th>
                <th className="p-4">التارجت المستهدف</th>
                <th className="p-4">رفع كام طلب</th>
                <th className="p-4">المبالغ المعتمدة</th>
                <th className="p-4">نسبة التحقيق</th>
                <th className="p-4">لسا متبقي قد ايه (الطلبات الجارية)</th>
                <th className="p-4">تحليل أسباب الرفض</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSalesmen.map(s => {
                const achieve = s.achievementPercent;
                const isOverAchieved = achieve >= 100;
                return (
                  <tr key={s.name} className="hover:bg-slate-50/80 transition-colors">
                    {/* Salesman Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              s.isRegisteredUser ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {s.isRegisteredUser ? 'موظف مسجل' : 'مندوب خارجي / مبيعات'}
                            </span>
                            {s.targetNotes && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded truncate max-w-[120px]" title={s.targetNotes}>
                                📌 {s.targetNotes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Target Amount */}
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">{s.targetAmount.toLocaleString()}</span>
                        <span className="text-slate-400 text-[10px]">ج.م</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        مستهدف: {s.targetCount} طلبات
                      </p>
                    </td>

                    {/* Total Submitted Applications (رفع كام طلب) */}
                    <td className="p-4 font-mono">
                      <span className="font-black text-slate-900 text-sm">{s.totalApps}</span>
                      <span className="text-slate-500 text-xs mr-1">طلب</span>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        إجمالي: {s.totalRequestedAmount.toLocaleString()} ج.م
                      </p>
                    </td>

                    {/* Total Approved Amount (اتوافق عليهم بكام) */}
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-emerald-700 text-sm">{s.totalApprovedAmount.toLocaleString()}</span>
                        <span className="text-emerald-500 text-[10px]">ج.م</span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-sans flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>{s.approvedCount} طلب معتمد ({s.approvalRate.toFixed(0)}%)</span>
                      </p>
                    </td>

                    {/* Achievement % */}
                    <td className="p-4 min-w-[140px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-black font-mono ${
                            isOverAchieved ? 'text-emerald-700' : achieve >= 70 ? 'text-teal-700' : achieve >= 40 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {achieve.toFixed(1)}%
                          </span>
                          {isOverAchieved ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              مكتمل 🏆
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              متبقي {(s.remainingToTarget / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverAchieved
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : achieve >= 70
                                ? 'bg-emerald-500'
                                : achieve >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, achieve)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Active in progress (عنده لسا متبقي قد ايه) */}
                    <td className="p-4">
                      {s.activeCount > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sky-800 text-sm font-mono">{s.activeCount}</span>
                            <span className="text-sky-600 text-xs">حالات جارية</span>
                          </div>
                          <p className="text-[11px] text-sky-700 font-mono">
                            بقيمة: {s.activeAmount.toLocaleString()} ج.م
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(s.activeStagesMap).slice(0, 2).map(([st, c]) => (
                              <span key={st} className="text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded">
                                {st}: {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">لا توجد حالات جارية</span>
                      )}
                    </td>

                    {/* Rejection Analysis */}
                    <td className="p-4">
                      {s.rejectedCount > 0 ? (
                        <div className="space-y-1.5 max-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-rose-700 font-bold text-xs flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>{s.rejectedCount} مرفوض ({s.rejectionRate.toFixed(0)}%)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingRejectionsSalesman(s)}
                              className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                            >
                              تحليل
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-600 truncate bg-rose-50/60 p-1 rounded border border-rose-100" title={s.topRejectionReason}>
                            السبب الأبرز: <span className="font-bold text-rose-900">{s.topRejectionReason}</span>
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          صفر مرفوضات ✨
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTarget(s)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل تارجت الموظف"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingAppsSalesman(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          title="عرض جميع طلبات هذا الموظف"
                        >
                          عرض الطلبات
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card Layout */}
        <div className="xl:hidden divide-y divide-slate-100">
          {displayedSalesmen.map(s => {
            const achieve = s.achievementPercent;
            const isOverAchieved = achieve >= 100;
            return (
              <div key={s.name} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm flex items-center justify-center">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{s.name}</p>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-0.5 inline-block">
                        {s.isRegisteredUser ? 'موظف مسجل' : 'مندوب مبيعات'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEditTarget(s)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 bg-slate-100 rounded-lg"
                    title="تعديل التارجت"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">تحقيق التارجت:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {s.totalApprovedAmount.toLocaleString()} من {s.targetAmount.toLocaleString()} ج.م ({achieve.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOverAchieved ? 'bg-emerald-500' : achieve >= 50 ? 'bg-teal-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, achieve)}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">رفع كام طلب:</span>
                    <span className="font-bold text-slate-900 font-mono">{s.totalApps} طلب ({s.totalRequestedAmount.toLocaleString()} ج.م)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 block">المعتمد والمصروف:</span>
                    <span className="font-bold text-emerald-700 font-mono">{s.approvedCount} معتمد ({s.totalApprovedAmount.toLocaleString()} ج.م)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-600 block">لسا متبقي قد ايه:</span>
                    <span className="font-bold text-sky-800 font-mono">{s.activeCount} طلب جارٍ ({s.activeAmount.toLocaleString()} ج.م)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 block">المرفوضات والنسبة:</span>
                    <span className="font-bold text-rose-700 font-mono">{s.rejectedCount} مرفوض ({s.rejectionRate.toFixed(0)}%)</span>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between pt-1">
                  {s.rejectedCount > 0 ? (
                    <button
                      onClick={() => setViewingRejectionsSalesman(s)}
                      className="text-xs text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>تحليل أسباب الرفض ({s.rejectedCount})</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold">بدون مرفوضات ✨</span>
                  )}

                  <button
                    onClick={() => setViewingAppsSalesman(s)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    عرض كافة الطلبات ({s.totalApps})
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {displayedSalesmen.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">
            لا يوجد موظفون أو مندوبون يطابقون بحثك في الفترة المحددة.
          </div>
        )}
      </div>

      {/* MODAL 1: Set / Edit Salesman Target Modal */}
      {editingTargetSalesman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Target className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    تحديد تارجت المبيعات: {editingTargetSalesman.salesmanName}
                  </h4>
                  <p className="text-[11px] text-slate-500">تحديد المستهدف المالي وعدد الطلبات الشهرية للموظف</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTargetSalesman(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المبلغ المالي المستهدف (ج.م) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="مثال: 1,000,000"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 pl-10 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={targetAmountInput}
                    onChange={e => setTargetAmountInput(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  المبلغ الفعلي المستهدف للموافقات وصرف التمويل خلال الفترة.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عدد الطلبات المستهدفة *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="مثال: 15"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={targetCountInput}
                  onChange={e => setTargetCountInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات أو حوافز المستهدف (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: عمولة إضافية 2% عند تخطي التارجت أو ملاحظات التوزيع الجغرافي..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={targetNotesInput}
                  onChange={e => setTargetNotesInput(e.target.value)}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTargetSalesman(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingTarget}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingTarget ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ التارجت</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Salesman Detailed Rejection Analysis Modal */}
      {viewingRejectionsSalesman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="p-5 border-b border-rose-100 flex justify-between items-center bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-rose-600 text-white rounded-xl">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-black text-rose-950 text-sm">
                    تحليل أسباب رفض عملاء: {viewingRejectionsSalesman.name}
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    إجمالي {viewingRejectionsSalesman.rejectedCount} عملاء مرفوضين (معدل الرفض: {viewingRejectionsSalesman.rejectionRate.toFixed(1)}%)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRejectionsSalesman(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Summary Breakdown */}
              <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100 space-y-2">
                <h5 className="font-black text-xs text-rose-900">توزيع أسباب الرفض لمسؤول المبيعات هذا:</h5>
                <div className="space-y-2 pt-1">
                  {Object.entries(viewingRejectionsSalesman.rejectionsMap).map(([reason, d], idx) => {
                    const pct = (d.count / viewingRejectionsSalesman.rejectedCount) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{reason}</span>
                          <span className="font-mono text-rose-700 font-bold">{d.count} عملاء ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-rose-200/50 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advisory recommendation box */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">توصية ائتمانية ذكية للموظف:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    {viewingRejectionsSalesman.topRejectionReason.includes('ائتمان') || viewingRejectionsSalesman.topRejectionReason.includes('I-Score')
                      ? 'يوصى بفحص سجل الآي سكور المبدئي للعميل قبل استكمال ورفع الأوراق لتجنب الرفض بسبب التاريخ الائتماني والتعثر.'
                      : viewingRejectionsSalesman.topRejectionReason.includes('مستند') || viewingRejectionsSalesman.topRejectionReason.includes('أوراق')
                      ? 'يوصى بالتأكد من رفع صور البطاقات الشخصية سارية والأوراق الإلزامية واضحة لتفادي الرفض الفوري بسبب النواقص.'
                      : 'يوصى بمراجعة الحد الائتماني ونسبة عبء الدين قبل التقديم على التمويل.'}
                  </p>
                </div>
              </div>

              {/* Rejected Clients List */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-900">قائمة العملاء المرفوضين بالتفصيل:</h5>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {viewingRejectionsSalesman.rejectedApps.map(app => (
                    <div key={app.id} className="p-3 bg-white hover:bg-slate-50 transition-colors space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{app.clientName}</span>
                          <span className="font-mono text-slate-400 text-[11px]">#{app.id}</span>
                        </div>
                        <span className="font-bold text-rose-700 font-mono">
                          {app.requestedAmount.toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>الشركة: <strong>{app.companyName || 'غير محدد'}</strong></span>
                        <span>الرقم القومي: <span className="font-mono">{app.clientNationalId || '-'}</span></span>
                      </div>
                      <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 text-[11px]">
                        <span className="font-bold text-rose-800 block">سبب الرفض: {app.rejectionReason || 'عدم استيفاء الشروط'}</span>
                        {app.rejectionNotes && (
                          <span className="text-rose-600 block mt-0.5 italic">ملاحظات: "{app.rejectionNotes}"</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRejectionsSalesman(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Salesman Applications List Explorer */}
      {viewingAppsSalesman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-600 text-white rounded-xl">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    كافة طلبات الموظف: {viewingAppsSalesman.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    إجمالي {viewingAppsSalesman.totalApps} طلبات بقيمة {viewingAppsSalesman.totalRequestedAmount.toLocaleString()} ج.م
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAppsSalesman(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {viewingAppsSalesman.allApps.map(app => (
                <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-900">{app.clientName}</p>
                      <span className="text-[10px] font-mono text-slate-400">#{app.id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      شركة: <span className="font-bold text-slate-700">{app.companyName || 'غير محدد'}</span> — {app.phoneNumber || app.governorate}
                    </p>
                  </div>

                  <div className="text-left space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.AMOUNT_TRANSFERRED
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : app.status === ApplicationStatus.REJECTED
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {STATUS_ARABIC[app.status] || app.status}
                    </span>
                    <p className="font-mono font-bold text-slate-900 text-xs">
                      {app.requestedAmount.toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              ))}

              {viewingAppsSalesman.allApps.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">لا توجد طلبات مسجلة لهذا الموظف في الفترة المختارة.</p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAppsSalesman(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
