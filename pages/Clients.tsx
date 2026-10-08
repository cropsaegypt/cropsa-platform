import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  Role, 
  ApplicationStatus, 
  ALL_KNOWN_INSTALLMENT_COMPANIES, 
  EGYPT_GOVERNORATES,
  Client 
} from '../types';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  History, 
  Eye, 
  FileSpreadsheet, 
  UserPlus, 
  Filter, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Download,
  AlertTriangle,
  X,
  CreditCard,
  Briefcase,
  MapPin,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';
import { ClientDetailModal } from '../components/ClientDetailModal';
import { ClientTimelineModal } from '../components/ClientTimelineModal';
import { SmartClientBulkImportModal } from '../components/SmartClientBulkImportModal';
import { SmartClientRenewalModal } from '../components/SmartClientRenewalModal';
import { SmartAddClientModal } from '../components/SmartAddClientModal';
import { EditClientModal } from '../components/EditClientModal';

export const Clients: React.FC = () => {
  const { clients, applications, users, currentUser, deleteClient } = useStore();

  const isAdmin = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN;

  // Modals state
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [renewingClient, setRenewingClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [timelineClientId, setTimelineClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [disbursedFilter, setDisbursedFilter] = useState('ALL'); // ALL, HAS_DISBURSED, 0_25K, 25K_50K, 50K_100K, GT_100K, ZERO
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, THIS_MONTH, LAST_MONTH, 3_MONTHS_PLUS, 6_MONTHS_PLUS, CUSTOM
  const [customMonth, setCustomMonth] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('ALL');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'ELIGIBLE_RENEWAL' | 'RECENT_ACTIVE' | 'HISTORICAL'>('ALL');

  // Permission check
  if (
    currentUser?.role !== Role.SUPER_ADMIN && 
    currentUser?.role !== Role.ADMIN && 
    currentUser?.role !== Role.INSTALLMENT_COMPANY &&
    currentUser?.role !== Role.BRANCH_MANAGER &&
    currentUser?.role !== Role.COMPANY_EMPLOYEE &&
    currentUser?.role !== Role.SALESMAN &&
    currentUser?.role !== Role.SUPPLIER
  ) {
    return <div className="p-8 text-center text-slate-500 text-sm">ليس لديك صلاحية للوصول لهذه الصفحة</div>;
  }

  // Scoped clients list strictly isolating data per role to prevent unauthorized data access
  const scopedClients = useMemo(() => {
    if (!currentUser) return [];

    // 1. Super Admin and System Operations Admin: Full access
    if (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) {
      return clients;
    }

    // 2. Installment Company Director: Only clients funded by or assigned to this company
    if (currentUser.role === Role.INSTALLMENT_COMPANY) {
      const compId = currentUser.companyId || currentUser.id;
      return clients.filter(c => {
        if (c.addedBy === currentUser.id) return true;
        if (c.authorizedCompanies?.includes(compId) || c.authorizedCompanies?.includes(currentUser.id)) return true;
        if (c.manualEntry?.installmentCompanyId === compId || c.manualEntry?.installmentCompanyId === currentUser.id) return true;
        return applications.some(a => 
          a.clientNationalId === c.nationalId && 
          (a.assignedCompanyIds?.includes(compId) || a.assignedCompanyIds?.includes(currentUser.id))
        );
      });
    }

    // 3. Branch Manager: Only clients with applications assigned to this branch
    if (currentUser.role === Role.BRANCH_MANAGER) {
      return clients.filter(c => {
        if (c.addedBy === currentUser.id) return true;
        return applications.some(a => 
          a.clientNationalId === c.nationalId && 
          ((currentUser.branchId && a.assignedBranchId === currentUser.branchId) ||
           (currentUser.branchName && a.assignedBranchName === currentUser.branchName))
        );
      });
    }

    // 4. Company Employee (Credit Officer, Collection Agent): Only clients assigned to this employee or their branch
    if (currentUser.role === Role.COMPANY_EMPLOYEE) {
      return clients.filter(c => {
        if (c.addedBy === currentUser.id) return true;
        return applications.some(a => 
          a.clientNationalId === c.nationalId && 
          (
            a.assignedOfficerId === currentUser.id || 
            (currentUser.branchId && a.assignedBranchId === currentUser.branchId) ||
            (currentUser.branchName && a.assignedBranchName === currentUser.branchName)
          )
        );
      });
    }

    // 5. Salesman (رافع الطلبات): Strictly only clients added or submitted by this salesman
    if (currentUser.role === Role.SALESMAN) {
      return clients.filter(c => {
        if (c.addedBy === currentUser.id) return true;
        return applications.some(a => 
          a.clientNationalId === c.nationalId && a.submittedBy === currentUser.id
        );
      });
    }

    // 6. Supplier (المورد): Strictly only clients added or submitted by this supplier
    if (currentUser.role === Role.SUPPLIER) {
      return clients.filter(c => {
        if (c.addedBy === currentUser.id) return true;
        return applications.some(a => 
          a.clientNationalId === c.nationalId && a.submittedBy === currentUser.id
        );
      });
    }

    return [];
  }, [clients, applications, currentUser]);

  // Calculate integrated client data
  const enrichedClients = useMemo(() => {
    return scopedClients.map(client => {
      const clientNatId = client.nationalId || '';
      const clientApps = applications.filter(a => a.clientNationalId === clientNatId);
      const approvedApps = clientApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED);
      
      const appApprovedTotal = approvedApps.reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);
      const appUsedTotal = approvedApps.reduce((acc, curr) => acc + (curr.usedAmount || 0), 0);
      
      const manualApproved = client.totalApprovedAmount || client.manualEntry?.approvedAmount || 0;
      const manualDisbursed = client.disbursedAmount || client.manualEntry?.disbursedAmount || manualApproved;

      const totalApproved = Math.max(appApprovedTotal, manualApproved);
      const totalDisbursed = appUsedTotal > 0 ? appUsedTotal : manualDisbursed;
      const available = Math.max(0, totalApproved - totalDisbursed);

      // Identify funding companies (من مين)
      const companyNamesSet = new Set<string>();
      if (client.companyName) companyNamesSet.add(client.companyName);
      if (client.manualEntry?.companyName) companyNamesSet.add(client.manualEntry.companyName);

      approvedApps.forEach(a => {
        if (a.reviewedBy) {
          const u = users.find(user => user.id === a.reviewedBy);
          if (u) companyNamesSet.add(u.name);
        }
        if (a.assignedCompanyIds) {
          a.assignedCompanyIds.forEach(cid => {
            const comp = ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === cid);
            if (comp) companyNamesSet.add(comp.nameAr);
            const userComp = users.find(u => u.id === cid);
            if (userComp) companyNamesSet.add(userComp.name);
          });
        }
      });

      const fundingCompanies = Array.from(companyNamesSet);
      if (fundingCompanies.length === 0) {
        fundingCompanies.push(client.isHistoricalOnly ? 'سجل تقسيط سابق' : 'بانتظار الصرف');
      }

      // Latest transaction / finance date (من شهر كام)
      let latestDate = client.lastFinanceDate || client.manualEntry?.lastWithdrawalDate || client.manualEntry?.approvalDate || client.addedAt;
      if (clientApps.length > 0) {
        const sorted = [...clientApps].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        latestDate = sorted[0].reviewedAt || sorted[0].submittedAt || latestDate;
      }

      const daysElapsed = latestDate 
        ? Math.max(0, Math.floor((Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const monthsElapsed = Math.floor(daysElapsed / 30);

      // Has active pending app?
      const hasPendingApp = clientApps.some(a => 
        a.status === ApplicationStatus.RECEIVED || 
        a.status === ApplicationStatus.PENDING_ADMIN || 
        a.status === ApplicationStatus.PAPER_REVIEW || 
        a.status === ApplicationStatus.ISCORE_CHECK
      );

      // 3-Month Renewal Eligibility (عدا عليه 3 شهور ومتاح له تجديد)
      const isEligibleForRenewal = (daysElapsed >= 90 || monthsElapsed >= 3) && !hasPendingApp && (totalApproved > 0 || !!client.manualEntry);

      return {
        ...client,
        apps: clientApps,
        approvedTotal: totalApproved,
        disbursedTotal: totalDisbursed,
        available,
        fundingCompanies,
        latestDate,
        daysElapsed,
        monthsElapsed,
        hasPendingApp,
        isEligibleForRenewal
      };
    });
  }, [scopedClients, applications, users]);

  // Aggregate statistics for the intelligence header
  const stats = useMemo(() => {
    const totalClientsCount = enrichedClients.length;
    const totalDisbursedAmount = enrichedClients.reduce((acc, c) => acc + c.disbursedTotal, 0);
    const totalApprovedCeiling = enrichedClients.reduce((acc, c) => acc + c.approvedTotal, 0);
    const eligibleRenewalCount = enrichedClients.filter(c => c.isEligibleForRenewal).length;
    const activeRecentCount = enrichedClients.filter(c => c.daysElapsed < 90 && c.disbursedTotal > 0).length;

    return {
      totalClientsCount,
      totalDisbursedAmount,
      totalApprovedCeiling,
      eligibleRenewalCount,
      activeRecentCount
    };
  }, [enrichedClients]);

  // Filtered Clients based on all dimensions
  const filteredClients = useMemo(() => {
    return enrichedClients.filter(c => {
      // 1. Search text (name, national id, phone, company, app id)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(term);
        const matchesNatId = (c.nationalId || '').includes(term);
        const matchesPhone = (c.phoneNumber || '').includes(term);
        const matchesCompany = c.fundingCompanies.some(comp => comp.toLowerCase().includes(term));
        const matchesApp = c.apps.some(a => a.id.toLowerCase().includes(term));
        if (!matchesName && !matchesNatId && !matchesPhone && !matchesCompany && !matchesApp) {
          return false;
        }
      }

      // 2. Active Tab filter
      if (activeTabFilter === 'ELIGIBLE_RENEWAL' && !c.isEligibleForRenewal) return false;
      if (activeTabFilter === 'RECENT_ACTIVE' && (c.daysElapsed >= 90 || c.disbursedTotal === 0)) return false;
      if (activeTabFilter === 'HISTORICAL' && !c.isHistoricalOnly && !c.manualEntry) return false;

      // 3. Company filter (من مين)
      if (selectedCompanyFilter !== 'ALL') {
        const compObj = ALL_KNOWN_INSTALLMENT_COMPANIES.find(item => item.code === selectedCompanyFilter);
        const targetTitle = compObj?.nameAr || selectedCompanyFilter;
        const matches = c.fundingCompanies.some(f => f.includes(targetTitle) || targetTitle.includes(f));
        if (!matches) return false;
      }

      // 4. Disbursed amount filter (صرف كام)
      if (disbursedFilter === 'HAS_DISBURSED' && c.disbursedTotal <= 0) return false;
      if (disbursedFilter === '0_25K' && (c.disbursedTotal <= 0 || c.disbursedTotal > 25000)) return false;
      if (disbursedFilter === '25K_50K' && (c.disbursedTotal < 25000 || c.disbursedTotal > 50000)) return false;
      if (disbursedFilter === '50K_100K' && (c.disbursedTotal < 50000 || c.disbursedTotal > 100000)) return false;
      if (disbursedFilter === 'GT_100K' && c.disbursedTotal <= 100000) return false;
      if (disbursedFilter === 'ZERO' && c.disbursedTotal > 0) return false;

      // 5. Date / Month filter (من شهر كام)
      if (dateFilter === 'THIS_MONTH' && c.daysElapsed > 30) return false;
      if (dateFilter === 'LAST_MONTH' && (c.daysElapsed < 30 || c.daysElapsed > 60)) return false;
      if (dateFilter === '3_MONTHS_PLUS' && c.daysElapsed < 90) return false;
      if (dateFilter === '6_MONTHS_PLUS' && c.daysElapsed < 180) return false;
      if (dateFilter === 'CUSTOM' && customMonth) {
        if (!c.latestDate || !c.latestDate.startsWith(customMonth)) return false;
      }

      // 6. Governorate filter
      if (governorateFilter !== 'ALL' && c.governorate !== governorateFilter) return false;

      return true;
    });
  }, [enrichedClients, searchTerm, activeTabFilter, selectedCompanyFilter, disbursedFilter, dateFilter, customMonth, governorateFilter]);

  // Export filtered clients as CSV
  const handleExportCsv = () => {
    const headers = 'اسم العميل,الرقم القومي,الهاتف,المحافظة,المهنة,المعتمد,المنصرف,المتاح,الشركات الممولة,تاريخ آخر صرف,حالة التجديد';
    const rows = filteredClients.map(c => [
      `"${c.name}"`,
      `"${c.nationalId}"`,
      `"${c.phoneNumber || '-'}"`,
      `"${c.governorate || '-'}"`,
      `"${c.profession || '-'}"`,
      c.approvedTotal,
      c.disbursedTotal,
      c.available,
      `"${c.fundingCompanies.join(' + ')}"`,
      `"${c.latestDate ? c.latestDate.split('T')[0] : '-'}"`,
      c.isEligibleForRenewal ? 'متاح للتجديد (مر 3+ شهور)' : 'تمويل حديث'
    ].join(','));

    const csvString = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crobsa_clients_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">قاعدة بيانات عملاء كروبسا الذكية</h1>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs px-2.5 py-0.5 rounded-full font-bold">
              متابعة متكاملة للتمويل والصرف
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل شامل لكافة العملاء وعمليات الصرف، الشركات الممولة السابقة والمفعلة، ومؤشرات استحقاق التجديد الدوري بعد 3 أشهر
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="تصدير بيانات الجدول إلى ملف Excel"
          >
            <Download className="h-4 w-4 text-slate-500" />
            تصدير الشيت
          </button>

          {/* Add Client manually - available for employees & admins */}
          <button
            type="button"
            onClick={() => setShowAddClientModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            إضافة عميل يدوياً
          </button>

          {/* Bulk Import from Sheet - EXCLUSIVELY for Super Admin */}
          {currentUser?.role === Role.SUPER_ADMIN && (
            <button
              type="button"
              onClick={() => setShowBulkImportModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors border border-slate-800"
              title="إضافة مجمعة لمدير النظام عبر شيت إكسل"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              إضافة مجمعة عبر الشيت (Super Admin)
            </button>
          )}
        </div>
      </div>

      {/* Intelligence Cards KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Registered Clients */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>إجمالي العملاء بالقاعدة</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {stats.totalClientsCount} <span className="text-xs font-normal text-slate-500">عميل</span>
          </div>
          <div className="text-[11px] text-slate-400">
            سجلات متكاملة ومربوطة بمسارات التمويل
          </div>
        </div>

        {/* Total Disbursed (صرف كام) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>إجمالي المبالغ المنصرفة (صرف كام)</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {stats.totalDisbursedAmount.toLocaleString()} <span className="text-xs font-normal text-emerald-800">ج.م</span>
          </div>
          <div className="text-[11px] text-emerald-800/80">
            تمويلات وسلف فعلية مستخدمة للعملاء
          </div>
        </div>

        {/* Total Approved Ceiling */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>إجمالي الأسقف المعتمدة</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {stats.totalApprovedCeiling.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-400">
            الحدود الائتمانية المقبولة لكافة العملاء
          </div>
        </div>

        {/* Renewal Opportunities (مر 3+ شهور) */}
        <div 
          onClick={() => setActiveTabFilter('ELIGIBLE_RENEWAL')}
          className="bg-linear-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-300 shadow-2xs space-y-1 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
            <span>مؤهل للتجديد (مر 3+ شهور)</span>
            <Sparkles className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono flex items-center gap-2">
            <span>{stats.eligibleRenewalCount}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
              فرصة تجديد
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
            <span>اضغط لعرض المؤهلين فوراً</span>
            <span>←</span>
          </div>
        </div>

      </div>

      {/* 3-Month Renewal Notice Banner */}
      {stats.eligibleRenewalCount > 0 && (
        <div className="bg-linear-to-r from-amber-50 via-sky-50 to-emerald-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                تنبيه ذكي: يوجد ({stats.eligibleRenewalCount}) عملاء استوفوا فترة الـ 3 أشهر ومتاح لهم التجديد الآن!
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                تتيح منصة كروبسا دراسة الأهلية وإعادة التمويل بالذكاء الاصطناعي مع حرية اختيار الشركة الممولة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTabFilter('ELIGIBLE_RENEWAL')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            تصفية المؤهلين للتجديد ({stats.eligibleRenewalCount})
          </button>
        </div>
      )}

      {/* Filtering & Search Workbench */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        
        {/* Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTabFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTabFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            جميع العملاء ({enrichedClients.length})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTabFilter('ELIGIBLE_RENEWAL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTabFilter === 'ELIGIBLE_RENEWAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            مؤهلون للتجديد (مر 3+ شهور) ({stats.eligibleRenewalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('RECENT_ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTabFilter === 'RECENT_ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            تمويل نشط حديث (&lt; 3 شهور) ({stats.activeRecentCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter('HISTORICAL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTabFilter === 'HISTORICAL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            سجلات وشركات سابقة ({enrichedClients.filter(c => c.isHistoricalOnly || c.manualEntry).length})
          </button>
        </div>

        {/* Dimensional Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، الرقم القومي، الهاتف، الشركة..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Company Filter (من مين) */}
          <div>
            <select
              value={selectedCompanyFilter}
              onChange={e => setSelectedCompanyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
            >
              <option value="ALL">جميع الشركات الممولة (من مين)</option>
              <optgroup label="الشركات النشطة على المنصة">
                {ALL_KNOWN_INSTALLMENT_COMPANIES.filter(c => c.isPlatformActive).map(c => (
                  <option key={c.code} value={c.code}>{c.nameAr}</option>
                ))}
              </optgroup>
              <optgroup label="شركات التقسيط والجهات السابقة / الخارجية">
                {ALL_KNOWN_INSTALLMENT_COMPANIES.filter(c => !c.isPlatformActive).map(c => (
                  <option key={c.code} value={c.code}>{c.nameAr}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Disbursed Amount Filter (صرف كام) */}
          <div>
            <select
              value={disbursedFilter}
              onChange={e => setDisbursedFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
            >
              <option value="ALL">المبالغ المنصرفة (صرف كام)</option>
              <option value="HAS_DISBURSED">قام بالصرف (&gt; 0 ج.م)</option>
              <option value="0_25K">حتى 25,000 ج.م</option>
              <option value="25K_50K">من 25,000 إلى 50,000 ج.م</option>
              <option value="50K_100K">من 50,000 إلى 100,000 ج.م</option>
              <option value="GT_100K">أكثر من 100,000 ج.م</option>
              <option value="ZERO">لم يصرف بعد (0 ج.م)</option>
            </select>
          </div>

          {/* Date / Month Filter (من شهر كام) */}
          <div className="flex items-center gap-1.5">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cropsa-500"
            >
              <option value="ALL">تاريخ الصرف (من شهر كام)</option>
              <option value="THIS_MONTH">هذا الشهر (خلال 30 يوماً)</option>
              <option value="LAST_MONTH">الشهر الماضي (30 - 60 يوماً)</option>
              <option value="3_MONTHS_PLUS">منذ 3 أشهر فما فوق (مؤهل للتجديد)</option>
              <option value="6_MONTHS_PLUS">منذ 6 أشهر فما فوق</option>
              <option value="CUSTOM">تحديد شهر مخصص...</option>
            </select>

            {dateFilter === 'CUSTOM' && (
              <input
                type="month"
                value={customMonth}
                onChange={e => setCustomMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs text-slate-900 font-mono"
              />
            )}
          </div>

        </div>

        {/* Results Counter & Reset Filter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-bold">
            تم العثور على <strong className="text-slate-900">{filteredClients.length}</strong> عميل يطابق التصفية
          </span>
          {(searchTerm || selectedCompanyFilter !== 'ALL' || disbursedFilter !== 'ALL' || dateFilter !== 'ALL' || governorateFilter !== 'ALL' || activeTabFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCompanyFilter('ALL');
                setDisbursedFilter('ALL');
                setDateFilter('ALL');
                setCustomMonth('');
                setGovernorateFilter('ALL');
                setActiveTabFilter('ALL');
              }}
              className="text-cropsa-700 hover:text-cropsa-900 font-bold underline"
            >
              إعادة ضبط كل الفلاتر
            </button>
          )}
        </div>

      </div>

      {/* Clients Database Main Table & Mobile View */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        
        {/* Mobile View: Cards */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا يوجد عملاء يطابقون خيارات البحث والتصفية المحددة.
            </div>
          ) : (
            filteredClients.map(c => (
              <div 
                key={c.id}
                className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                      <span>الرقم القومي: {c.nationalId}</span>
                      <span>•</span>
                      <span>{c.governorate || 'القاهرة'}</span>
                    </div>
                  </div>
                  
                  {c.isEligibleForRenewal ? (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                      <Sparkles className="h-3 w-3" />
                      مؤهل للتجديد (مر {c.monthsElapsed} شهر)
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      مر {c.monthsElapsed} شهر
                    </span>
                  )}
                </div>

                {/* Financial figures */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">المعتمد</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {c.approvedTotal.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 block font-bold">صرف كام</span>
                    <span className="font-bold text-emerald-700 font-mono text-xs">
                      {c.disbursedTotal.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-700 block">المتاح</span>
                    <span className="font-bold text-sky-800 font-mono text-xs">
                      {c.available.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                {/* Company and date */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[60%]">
                    الشركة: <strong className="text-slate-800">{c.fundingCompanies[0]}</strong>
                  </span>
                  <span className="font-mono text-[10px]" dir="ltr">
                    {c.latestDate ? new Date(c.latestDate).toLocaleDateString('ar-EG') : '-'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedClientId(c.id)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> التفاصيل
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineClientId(c.id)}
                    className="flex-1 text-purple-700 border border-purple-200 hover:bg-purple-50 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <History className="h-3.5 w-3.5" /> المخطط
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewingClient(c)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs ${
                      c.isEligibleForRenewal 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تجديد
                  </button>
                </div>

                {/* Admin Quick Management (Edit / Delete) */}
                {isAdmin && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100/80">
                    <button
                      type="button"
                      onClick={() => setEditingClient(c)}
                      className="flex-1 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      title="تعديل بيانات العميل"
                    >
                      <Edit className="h-3.5 w-3.5" /> تعديل العميل
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingClient(c)}
                      className="flex-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      title="حذف العميل نهائياً"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف العميل
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">العميل</th>
                <th className="px-5 py-3.5">الرقم القومي</th>
                <th className="px-5 py-3.5">المبلغ المعتمد</th>
                <th className="px-5 py-3.5">صرف كام (المنصرف)</th>
                <th className="px-5 py-3.5">المتاح</th>
                <th className="px-5 py-3.5">الشركة الممولة (من مين)</th>
                <th className="px-5 py-3.5">تاريخ الصرف (من شهر)</th>
                <th className="px-5 py-3.5">حالة التجديد (3 شهور)</th>
                <th className="px-5 py-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    لا يوجد عملاء يطابقون خيارات البحث والتصفية المحددة.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Name & Activity */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.creditRating && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono font-bold">
                            {c.creditRating}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.profession || 'نشاط تجاري'} • {c.governorate || 'القاهرة'}
                      </div>
                    </td>

                    {/* National ID */}
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {c.nationalId}
                    </td>

                    {/* Approved Total */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {c.approvedTotal.toLocaleString()} ج.م
                    </td>

                    {/* Disbursed Amount (صرف كام) */}
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                      {c.disbursedTotal.toLocaleString()} ج.م
                    </td>

                    {/* Available */}
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-800">
                      {c.available.toLocaleString()} ج.م
                    </td>

                    {/* Companies (من مين) */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.fundingCompanies.map((compName, idx) => (
                          <span 
                            key={idx}
                            className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md truncate"
                          >
                            {compName}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Date / Month (من شهر كام) */}
                    <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]" dir="ltr">
                      {c.latestDate ? new Date(c.latestDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      <span className="block text-[9px] text-slate-400 font-sans mt-0.5">
                        منذ {c.monthsElapsed} شهر ({c.daysElapsed} يوم)
                      </span>
                    </td>

                    {/* 3-Month Renewal Status Badge */}
                    <td className="px-5 py-3.5">
                      {c.isEligibleForRenewal ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-xl text-[10px] inline-flex items-center gap-1 animate-pulse">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          متاح للتجديد (مر 3+ شهور)
                        </span>
                      ) : c.daysElapsed < 90 && c.disbursedTotal > 0 ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          تمويل حديث (متبقي {Math.max(0, 90 - c.daysElapsed)} يوم للتجديد)
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          عميل جديد / غير ممول
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedClientId(c.id)}
                          className="text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 transition-colors"
                          title="عرض تفاصيل وسجل الطلبات الكامل"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setTimelineClientId(c.id)}
                          className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg border border-purple-200 transition-colors"
                          title="المخطط الزمني للعمليات"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewingClient(c)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-all ${
                            c.isEligibleForRenewal
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                          }`}
                          title="تجديد التمويل بالذكاء الاصطناعي واختيار الشركة"
                        >
                          <RefreshCw className="h-3 w-3" />
                          تجديد التمويل
                        </button>

                        {/* Admin Edit & Delete Actions */}
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingClient(c)}
                              className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg border border-amber-200 transition-colors"
                              title="تعديل بيانات العميل"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingClient(c)}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-rose-200 transition-colors"
                              title="حذف العميل نهائياً"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modals */}
      {showBulkImportModal && (
        <SmartClientBulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
        />
      )}

      {showAddClientModal && (
        <SmartAddClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
        />
      )}

      {renewingClient && (
        <SmartClientRenewalModal
          client={renewingClient}
          isOpen={!!renewingClient}
          onClose={() => setRenewingClient(null)}
        />
      )}

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClientId(null)}
        />
      )}

      {timelineClientId && (
        <ClientTimelineModal
          clientId={timelineClientId}
          client={clients.find(c => c.id === timelineClientId)}
          canViewFullDetails={true}
          onClose={() => setTimelineClientId(null)}
        />
      )}

      {/* Admin Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}

      {/* Admin Delete Client Confirmation Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-7 w-7" />
            </div>
            
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">تأكيد حذف العميل نهائياً</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف العميل <strong className="text-slate-900 font-bold">"{deletingClient.name}"</strong> (الرقم القومي: <span className="font-mono">{deletingClient.nationalId}</span>)؟
              </p>
              <div className="text-[11px] text-rose-700 font-bold mt-3 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                ⚠️ تنبيه إداري: سيتم حذف العميل وكافة سجلاته نهائياً من قاعدة البيانات، ولا يمكن التراجع عن هذه العملية.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingClient(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteClient(deletingClient.id);
                    setDeletingClient(null);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
