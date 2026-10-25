import React, { useState, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Role, Application, ApplicationStatus, STATUS_ARABIC } from '../types';
import { 
  Search, 
  ExternalLink, 
  DollarSign, 
  Check, 
  X, 
  User as UserIcon, 
  CheckSquare, 
  Clock, 
  History, 
  Calendar, 
  Filter, 
  XCircle, 
  AlertTriangle, 
  Phone, 
  Edit, 
  Building, 
  Building2,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ArrowDown,
  MessageSquare,
  Zap,
  Paperclip,
  ArrowRightLeft,
  ShieldAlert,
  HelpCircle,
  Wallet,
  FileCheck,
  Send,
  Eye,
  Download,
  FileText,
  Trash2,
  Calculator,
  Inbox,
  FolderOpen,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { ApplicationForm } from '../components/ApplicationForm';
import { ClientDetailModal } from '../components/ClientDetailModal';
import { CaseDiscussionModal } from '../components/CaseDiscussionModal';
import { DisbursementModal } from '../components/DisbursementModal';
import { ExternalCompanyDispatchModal } from '../components/ExternalCompanyDispatchModal';
import { InternalDocViewerModal } from '../components/InternalDocViewerModal';
import { NeedsUpdateNotificationBoard } from '../components/NeedsUpdateNotificationBoard';
import { BulkApplicationsImportModal } from '../components/BulkApplicationsImportModal';
import { InternalInstallmentCalculatorModal } from '../components/InternalInstallmentCalculatorModal';
import { InternalInboxModal } from '../components/InternalInboxModal';

const REJECTION_REASONS = [
  "درجة الائتمان منخفضة جداً",
  "نسبة الدين إلى الدخل مرتفعة",
  "المستندات غير مكتملة",
  "فشل التحقق من الهوية",
  "اشتباه في احتيال",
  "عدم توافق السياسات",
  "سبب آخر"
];

const actionLabels: Record<string, string> = {
  'CREATED': 'إنشاء الطلب',
  'ASSIGNED': 'تم التعيين',
  'RECEIVED': 'تأكيد الاستلام',
  'UPDATED': 'تحديث بيانات',
  'COMMISSION_DEDUCTED': 'خصم عمولة',
  ...STATUS_ARABIC
};

const professionLabels: Record<string, string> = {
    'MERCHANT': 'تاجر',
    'FARMER': 'مزارع',
    'FARM_OWNER': 'صاحب مزرعة',
    'EQUIPMENT_OWNER': 'معدات وآلات'
};

export const Applications: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    clients, 
    users, 
    branches,
    companies,
    inboxMessages,
    salesRepresentatives,
    addSalesRepresentative,
    assignApplication, 
    acknowledgeApplication, 
    reviewApplication, 
    requestWithdrawal, 
    updateApplication, 
    deleteApplication,
    expediteApplication,
    pendingNavigation, 
    setNavigation 
  } = useStore();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [isAddingSalesmanDirect, setIsAddingSalesmanDirect] = useState(false);
  const [newSalesmanDirectInput, setNewSalesmanDirectInput] = useState('');

  const allSalesmen = React.useMemo(() => {
    const names = new Set<string>();
    users.filter(u => u.role === Role.SALESMAN).forEach(u => names.add(u.name));
    (salesRepresentatives || []).forEach(r => names.add(r));
    applications.forEach(a => {
      if (a.salesmanName) names.add(a.salesmanName);
    });
    return Array.from(names);
  }, [users, salesRepresentatives, applications]);
  
  // Advanced Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBranch, setFilterBranch] = useState<string>('ALL');
  const [filterCompanyId, setFilterCompanyId] = useState<string>('ALL');
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);
  const [showInboxModal, setShowInboxModal] = useState<boolean>(false);
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  
  // Discussion Modal state
  const [discussionApp, setDiscussionApp] = useState<Application | null>(null);
  const [discussionTab, setDiscussionTab] = useState<'comments' | 'documents' | 'reroute'>('comments');
  const [externalDispatchApp, setExternalDispatchApp] = useState<Application | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ document: any; clientName?: string } | null>(null);
  const [showBulkImportAppsModal, setShowBulkImportAppsModal] = useState<boolean>(false);

  // Modals state
  const [deductAmount, setDeductAmount] = useState<number>(0);
  const [deductNote, setDeductNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [isRejecting, setIsRejecting] = useState(false);
  const [nextStatus, setNextStatus] = useState<ApplicationStatus | ''>('');
  const [showDisburseModal, setShowDisburseModal] = useState(false);

  // Sync selectedApp when applications update
  useEffect(() => {
    if (selectedApp) {
      const refreshed = applications.find(a => a.id === selectedApp.id);
      if (refreshed) {
        setSelectedApp(refreshed);
      }
    }
    if (discussionApp) {
      const refreshedDisc = applications.find(a => a.id === discussionApp.id);
      if (refreshedDisc) {
        setDiscussionApp(refreshedDisc);
      }
    }
  }, [applications]);

  useEffect(() => {
    if (pendingNavigation && pendingNavigation.page === 'applications' && pendingNavigation.resourceId) {
      const targetApp = applications.find(a => a.id === pendingNavigation.resourceId);
      if (targetApp) {
        setSelectedApp(targetApp);
      }
      setNavigation(null);
    }
  }, [pendingNavigation, applications, setNavigation]);

  if (!currentUser) return null;

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  // Available branches list for filter
  const availableBranches = React.useMemo(() => {
    const list: Array<{ id: string; name: string; governorate?: string; companyName?: string }> = [];
    const addedIds = new Set<string>();

    branches.forEach(b => {
      if (!addedIds.has(b.id)) {
        addedIds.add(b.id);
        const comp = companies.find(c => c.id === b.companyId);
        list.push({
          id: b.id,
          name: b.name,
          governorate: b.governorate,
          companyName: comp?.name
        });
      }
    });

    // Also include branches attached to applications
    applications.forEach(a => {
      if (a.assignedBranchId && !addedIds.has(a.assignedBranchId)) {
        addedIds.add(a.assignedBranchId);
        list.push({
          id: a.assignedBranchId,
          name: a.assignedBranchName || a.assignedBranchId,
          governorate: a.governorate
        });
      }
    });

    return list;
  }, [branches, companies, applications]);

  // Text normalization for global search
  const normalizeText = (s?: string) => {
    if (!s) return '';
    return s
      .toLowerCase()
      .trim()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/\s+/g, ' ');
  };

  // Date range verification
  const checkDateMatch = (dateStr: string) => {
    if (datePreset === 'ALL' && !dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (datePreset === 'TODAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return itemDate >= todayStart;
    }
    if (datePreset === 'LAST_7_DAYS') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      return itemDate >= past7;
    }
    if (datePreset === 'LAST_30_DAYS') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      return itemDate >= past30;
    }
    if (datePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return itemDate >= startOfMonth;
    }

    if (dateFrom) {
      const fTime = new Date(`${dateFrom}T00:00:00`).getTime();
      if (itemDate.getTime() < fTime) return false;
    }
    if (dateTo) {
      const tTime = new Date(`${dateTo}T23:59:59`).getTime();
      if (itemDate.getTime() > tTime) return false;
    }
    return true;
  };

  const filteredApps = applications.filter(app => {
    // Role based scoping - Strict data isolation
    if (currentUser.role === Role.SUPPLIER || currentUser.role === Role.SALESMAN) {
      if (app.submittedBy !== currentUser.id) return false;
    }
    if (currentUser.role === Role.INSTALLMENT_COMPANY) {
      const compId = currentUser.companyId || currentUser.id;
      const isAssigned = app.assignedCompanyIds?.includes(currentUser.id) || 
                         (currentUser.companyId && app.assignedCompanyIds?.includes(currentUser.companyId)) ||
                         app.assignedCompanyIds?.includes(compId);
      if (!isAssigned) return false;
    }
    if (currentUser.role === Role.BRANCH_MANAGER) {
      const isMyBranch = (currentUser.branchId && app.assignedBranchId === currentUser.branchId) ||
                         (currentUser.branchName && app.assignedBranchName === currentUser.branchName) ||
                         (app.assignedOfficerId === currentUser.id);
      if (!isMyBranch) return false;
    }
    if (currentUser.role === Role.COMPANY_EMPLOYEE) {
      const isMyOfficer = app.assignedOfficerId === currentUser.id || (app.assignedOfficerName && app.assignedOfficerName.includes(currentUser.name));
      const isMyBranch = currentUser.branchId && (app.assignedBranchId === currentUser.branchId || app.assignedBranchName === currentUser.branchName);
      if (!isMyOfficer && !isMyBranch) return false;
    }

    // Status Filter
    if (filterStatus === 'NEEDS_UPDATE') {
      if (!app.needsUpdate) return false;
    } else if (filterStatus !== 'ALL' && app.status !== filterStatus) {
      return false;
    }

    // Company Filter
    if (filterCompanyId !== 'ALL') {
      const targetCompany = companies.find(c => c.id === filterCompanyId);
      const targetName = targetCompany?.name;
      const matchesComp = 
        app.companyId === filterCompanyId || 
        app.assignedCompanyIds?.includes(filterCompanyId) ||
        (targetName && app.companyName === targetName) ||
        (targetName && (app as any).assignedCompanyNames?.includes(targetName));
      if (!matchesComp) return false;
    }

    // Company Branch Filter
    if (filterBranch !== 'ALL') {
      if (filterBranch === 'UNASSIGNED') {
        if (app.assignedBranchId || app.assignedBranchName) return false;
      } else {
        if (app.assignedBranchId !== filterBranch && app.assignedBranchName !== filterBranch) return false;
      }
    }

    // Urgency filter
    if (urgentOnly && !app.isUrgent) return false;

    // Date range filter
    if (!checkDateMatch(app.submittedAt)) return false;

    // Global Search across multiple fields
    if (searchTerm.trim()) {
      const query = normalizeText(searchTerm);
      const cName = normalizeText(app.clientName);
      const cNid = app.clientNationalId || '';
      const cPhone = app.phoneNumber || '';
      const cWa = app.whatsappNumber || '';
      const appId = app.id.toLowerCase();
      const cGov = normalizeText(app.governorate);
      const bName = normalizeText(app.assignedBranchName);
      const oName = normalizeText(app.assignedOfficerName);
      const prof = normalizeText(professionLabels[app.profession] || app.profession);

      const matches = 
        cName.includes(query) ||
        cNid.includes(query) ||
        cPhone.includes(query) ||
        cWa.includes(query) ||
        appId.includes(query) ||
        cGov.includes(query) ||
        bName.includes(query) ||
        oName.includes(query) ||
        prof.includes(query);

      if (!matches) return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterBranch('ALL');
    setFilterCompanyId('ALL');
    setDatePreset('ALL');
    setDateFrom('');
    setDateTo('');
    setUrgentOnly(false);
  };

  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    filterStatus !== 'ALL' || 
    filterBranch !== 'ALL' || 
    filterCompanyId !== 'ALL' ||
    datePreset !== 'ALL' || 
    dateFrom !== '' || 
    dateTo !== '' || 
    urgentOnly;

  const companyStats = React.useMemo(() => {
    return companies.map(comp => {
      const compApps = applications.filter(app => {
        return (
          app.companyId === comp.id ||
          app.assignedCompanyIds?.includes(comp.id) ||
          app.companyName === comp.name ||
          ((app as any).assignedCompanyNames && (app as any).assignedCompanyNames.includes(comp.name))
        );
      });
      const clientCount = compApps.length;
      const totalAmount = compApps.reduce((sum, a) => sum + (Number(a.requestedAmount) || 0), 0);
      return {
        ...comp,
        clientCount,
        totalAmount
      };
    });
  }, [companies, applications]);

  const unreadInboxCount = React.useMemo(() => {
    return (inboxMessages || []).filter(m => !m.isRead || !m.applied).length;
  }, [inboxMessages]);

  const handleWithdrawalRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedApp) {
      requestWithdrawal(selectedApp.id, deductAmount, deductNote);
      setSelectedApp(null);
      setDeductAmount(0);
      setDeductNote('');
    }
  };

  const handleStatusChange = async (status: ApplicationStatus) => {
      if (selectedApp) {
          if (status === ApplicationStatus.REJECTED) {
              setIsRejecting(true);
              return;
          }
          if (status === ApplicationStatus.APPROVED) {
              // Open approve section (handled by UI state)
              setNextStatus(ApplicationStatus.APPROVED);
              return;
          }
          
          if (currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) {
            await updateApplication(selectedApp.id, { status });
          } else {
            reviewApplication(selectedApp.id, status, reviewNote, undefined);
          }
          setReviewNote('');
          // Refresh
          const updated = { ...selectedApp, status: status };
          setSelectedApp(updated as Application);
      }
  };

  const handleFinalReview = (status: ApplicationStatus) => {
    if (selectedApp) {
      let finalNote = reviewNote;
      if (status === ApplicationStatus.REJECTED) {
        finalNote = `السبب: ${rejectionReason}\nملاحظات: ${reviewNote}`;
      }
      
      reviewApplication(selectedApp.id, status, finalNote, approvedAmount || selectedApp.requestedAmount);
      setSelectedApp(null);
      setReviewNote('');
      setApprovedAmount(0);
      setIsRejecting(false);
      setNextStatus('');
      setRejectionReason(REJECTION_REASONS[0]);
    }
  };

  const handleAssign = () => {
    if (selectedApp && selectedCompanyIds.length > 0) {
      assignApplication(selectedApp.id, selectedCompanyIds);
      setSelectedApp(null);
      setSelectedCompanyIds([]);
    }
  };

  const handleReceive = (app: Application) => {
    acknowledgeApplication(app.id);
    if (selectedApp && selectedApp.id === app.id) {
       setSelectedApp(null); 
    }
  };

  const canEditApp = (app: Application) => {
    return (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPER_ADMIN ||
      app.submittedBy === currentUser.id ||
      Boolean(app.needsUpdate) ||
      Boolean(app.externalDispatches && app.externalDispatches.length > 0)
    );
  };

  const handleUpdate = (data: Partial<Application>) => {
      if (selectedApp) {
          updateApplication(selectedApp.id, {
            ...data,
            needsUpdate: false
          });
          setIsEditing(false);
          const updated = { ...selectedApp, ...data, needsUpdate: false };
          setSelectedApp(updated as Application);
      }
  };

  const toggleCompanySelection = (id: string) => {
      if (selectedCompanyIds.includes(id)) {
          setSelectedCompanyIds(selectedCompanyIds.filter(c => c !== id));
      } else {
          setSelectedCompanyIds([...selectedCompanyIds, id]);
      }
  };

  const getStatusColor = (status: ApplicationStatus) => {
      switch(status) {
          case ApplicationStatus.APPROVED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          case ApplicationStatus.REJECTED: return 'bg-rose-50 text-rose-700 border-rose-200';
          case ApplicationStatus.AMOUNT_TRANSFERRED: return 'bg-blue-600 text-white border-blue-600';
          case ApplicationStatus.CANCELLED_BY_CLIENT: return 'bg-gray-200 text-gray-700 border-gray-300';
          case ApplicationStatus.PENDING_ADMIN: return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-amber-50 text-amber-700 border-amber-200';
      }
  };

  const companyStatuses = [
      ApplicationStatus.PAPER_REVIEW,
      ApplicationStatus.ADDITIONAL_PAPERS,
      ApplicationStatus.ISCORE_CHECK,
      ApplicationStatus.FIELD_INVESTIGATION,
      ApplicationStatus.CONTRACT_SIGNING,
      ApplicationStatus.APPROVED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.CANCELLED_BY_CLIENT,
      ApplicationStatus.AMOUNT_TRANSFERRED
  ];

  const availableStatuses = (currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN)
    ? Object.values(ApplicationStatus)
    : companyStatuses;

  return (
    <div className="space-y-6">
      {/* Needs Update Notification Board for WhatsApp / Email dispatched cases */}
      <NeedsUpdateNotificationBoard
        onSelectApp={(app) => {
          setSelectedApp(app);
          setIsEditing(false);
          setNextStatus('');
          setIsRejecting(false);
        }}
        onOpenDiscussion={(app, tab) => {
          setDiscussionApp(app);
          setDiscussionTab(tab || 'documents');
        }}
      />

      {/* Header & Global Advanced Filter System */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-crobsa-700" />
              <span>سجل وقاعدة طلبات التمويل</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              البحث الشامل والتصفية المتقدمة حسب الحالة، الفترة الزمنية، وفروع الشركات
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto font-mono text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setShowInboxModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer relative"
              title="صندوق الوارد الداخلي لردود شركات التمويل والذكاء الاصطناعي"
            >
              <Inbox className="h-4 w-4 text-white" />
              <span className="font-sans">صندوق الوارد (AI)</span>
              {unreadInboxCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white">
                  {unreadInboxCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowCalculatorModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="حاسبة التقسيط والأجل الداخلية للموظفة"
            >
              <Calculator className="h-4 w-4 text-white" />
              <span className="font-sans">حاسبة التقسيط والأجل 🧮</span>
            </button>

            {(currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) && (
              <button
                type="button"
                onClick={() => setShowBulkImportAppsModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors border border-slate-800 cursor-pointer"
                title="استيراد طلبات تقسيط مجمعة عبر شيت إكسيل"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                <span className="font-sans">رفع طلبات بالك</span>
              </button>
            )}
            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold border border-slate-200">
              إجمالي النتائج: <strong className="text-slate-950">{filteredApps.length}</strong> من أصل {applications.length}
            </span>
          </div>
        </div>

        {/* Financing Companies Interactive Cards Grid (مربعات شركات التمويل واللوجو) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-crobsa-700" />
              <span>شركات التمويل الشريكة (تصفية سريعة بالشركة وعدد العملاء):</span>
            </span>
            {filterCompanyId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setFilterCompanyId('ALL')}
                className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200"
              >
                <span>عرض جميع الشركات ({applications.length})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* All Companies Card */}
            <button
              type="button"
              onClick={() => setFilterCompanyId('ALL')}
              className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                filterCompanyId === 'ALL'
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-400'
                  : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  filterCompanyId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  الكل
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  filterCompanyId === 'ALL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  نشط
                </span>
              </div>
              <div>
                <div className="text-xs font-black">جميع الشركات</div>
                <div className={`text-base font-black font-mono mt-0.5 ${
                  filterCompanyId === 'ALL' ? 'text-white' : 'text-crobsa-800'
                }`}>
                  {applications.length} <span className="text-[10px] font-sans font-bold">عميل / طلب</span>
                </div>
              </div>
            </button>

            {/* Individual Company Cards */}
            {companyStats.map(comp => {
              const isSelected = filterCompanyId === comp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setFilterCompanyId(isSelected ? 'ALL' : comp.id)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between relative cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-crobsa-800 to-sky-900 text-white border-crobsa-900 shadow-md ring-2 ring-crobsa-400'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {comp.logo ? (
                      <img src={comp.logo} alt={comp.name} className="w-8 h-8 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-xs" />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {(comp.name || 'شركة').substring(0, 2)}
                      </div>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      سقف {comp.creditCeiling ? `${Math.round(comp.creditCeiling / 1000)}k` : 'مفتوح'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black truncate" title={comp.name}>
                      {comp.name}
                    </div>
                    <div className={`text-base font-black font-mono mt-0.5 ${
                      isSelected ? 'text-emerald-300' : 'text-crobsa-700'
                    }`}>
                      {comp.clientCount} <span className="text-[10px] font-sans font-bold">عميل</span>
                    </div>
                    {comp.totalAmount > 0 && (
                      <div className={`text-[10px] font-mono mt-0.5 truncate ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {comp.totalAmount.toLocaleString()} ج.م
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Primary Filters Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Global Search Input (5 Cols) */}
            <div className="md:col-span-5 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عام بالاسم، الرقم القومي، الهاتف، رقم الطلب، الفرع، أو المهنة..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500 font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="مسح البحث"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter (3 Cols) */}
            <div className="md:col-span-3 relative">
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 pr-9 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 appearance-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">جميع الحالات ({applications.length})</option>
                <option value="NEEDS_UPDATE">⚠️ مطلوب تحديثها واستكمالها ({applications.filter(a => a.needsUpdate).length})</option>
                <option value={ApplicationStatus.RECEIVED}>طلب مستلم ({applications.filter(a => a.status === ApplicationStatus.RECEIVED).length})</option>
                <option value={ApplicationStatus.APPROVED}>طلب معتمد ({applications.filter(a => a.status === ApplicationStatus.APPROVED).length})</option>
                <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة الأوراق ({applications.filter(a => a.status === ApplicationStatus.PAPER_REVIEW).length})</option>
                <option value={ApplicationStatus.ISCORE_CHECK}>استعلام I-Score ({applications.filter(a => a.status === ApplicationStatus.ISCORE_CHECK).length})</option>
                <option value={ApplicationStatus.FIELD_INVESTIGATION}>الاستعلام الميداني ({applications.filter(a => a.status === ApplicationStatus.FIELD_INVESTIGATION).length})</option>
                <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع العقود ({applications.filter(a => a.status === ApplicationStatus.CONTRACT_SIGNING).length})</option>
                <option value={ApplicationStatus.AMOUNT_TRANSFERRED}>تم صرف المبلغ ({applications.filter(a => a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length})</option>
                <option value={ApplicationStatus.REJECTED}>مرفوض ({applications.filter(a => a.status === ApplicationStatus.REJECTED).length})</option>
                <option value={ApplicationStatus.CANCELLED_BY_CLIENT}>إلغاء من العميل ({applications.filter(a => a.status === ApplicationStatus.CANCELLED_BY_CLIENT).length})</option>
                <option value={ApplicationStatus.PENDING_ADMIN}>بانتظار توجيه الأدمن ({applications.filter(a => a.status === ApplicationStatus.PENDING_ADMIN).length})</option>
              </select>
            </div>

            {/* Company Branch Filter (3 Cols) */}
            <div className="md:col-span-3 relative">
              <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 pr-9 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 appearance-none cursor-pointer"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="ALL">جميع فروع الشركات</option>
                <option value="UNASSIGNED">قيد التوزيع (بدون فرع)</option>
                {availableBranches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.governorate ? `(${b.governorate})` : ''} {b.companyName ? `- ${b.companyName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Expand Toggle (1 Col) */}
            <div className="md:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1 w-full transition-colors ${
                  showAdvancedFilters || datePreset !== 'ALL' || dateFrom || dateTo || urgentOnly
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="تصفية حسب التاريخ والأولوية"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="md:hidden">الفلاتر المتقدمة</span>
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Filters: Date Range & Urgency */}
          {(showAdvancedFilters || datePreset !== 'ALL' || dateFrom || dateTo) && (
            <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Date Presets Strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 ml-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>تصفية الفترة الزمنية:</span>
                  </span>
                  {[
                    { id: 'ALL', label: 'كل الفترات' },
                    { id: 'TODAY', label: 'اليوم' },
                    { id: 'LAST_7_DAYS', label: 'آخر 7 أيام' },
                    { id: 'LAST_30_DAYS', label: 'آخر 30 يوم' },
                    { id: 'THIS_MONTH', label: 'هذا الشهر' },
                    { id: 'CUSTOM', label: 'فترة مخصصة' }
                  ].map(dp => (
                    <button
                      key={dp.id}
                      type="button"
                      onClick={() => {
                        setDatePreset(dp.id as any);
                        if (dp.id !== 'CUSTOM') {
                          setDateFrom('');
                          setDateTo('');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                        datePreset === dp.id
                          ? 'bg-crobsa-700 text-white shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {dp.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Pickers */}
                {datePreset === 'CUSTOM' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold">من:</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="text-xs text-slate-800 outline-none bg-transparent font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold">إلى:</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="text-xs text-slate-800 outline-none bg-transparent font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Urgency Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgentOnly(!urgentOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      urgentOnly
                        ? 'bg-amber-500 text-amber-950 font-black shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Zap className={`h-3.5 w-3.5 ${urgentOnly ? 'fill-amber-950 text-amber-950' : 'text-amber-500'}`} />
                    <span>طلبات معجلة فقط</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips & Reset Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">الفلاتر المطبقة:</span>

                {searchTerm && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                    بحث: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">✕</button>
                  </span>
                )}

                {filterStatus !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-sky-200">
                    الحالة: {STATUS_ARABIC[filterStatus] || filterStatus}
                    <button onClick={() => setFilterStatus('ALL')} className="hover:text-rose-600">✕</button>
                  </span>
                )}

                {filterBranch !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-purple-200">
                    الفرع: {filterBranch === 'UNASSIGNED' ? 'قيد التوزيع' : (availableBranches.find(b => b.id === filterBranch)?.name || filterBranch)}
                    <button onClick={() => setFilterBranch('ALL')} className="hover:text-rose-600">✕</button>
                  </span>
                )}

                {datePreset !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-emerald-200">
                    الفترة: {datePreset === 'TODAY' ? 'اليوم' : datePreset === 'LAST_7_DAYS' ? 'آخر 7 أيام' : datePreset === 'LAST_30_DAYS' ? 'آخر 30 يوم' : datePreset === 'THIS_MONTH' ? 'هذا الشهر' : `${dateFrom || 'البداية'} إلى ${dateTo || 'الآن'}`}
                    <button onClick={() => { setDatePreset('ALL'); setDateFrom(''); setDateTo(''); }} className="hover:text-rose-600">✕</button>
                  </span>
                )}

                {urgentOnly && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-amber-300">
                    معجل بأولوية
                    <button onClick={() => setUrgentOnly(false)} className="hover:text-rose-600">✕</button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg"
              >
                <RotateCcw className="h-3 w-3" />
                <span>إعادة تعيين الفلاتر</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Mobile View: Clean Card Layout */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filteredApps.map(app => (
            <div 
              key={app.id}
              onClick={() => { setSelectedApp(app); setIsEditing(false); setNextStatus(''); setIsRejecting(false); }}
              className={`p-4 transition-colors hover:bg-slate-50 cursor-pointer ${app.isUrgent ? 'bg-amber-50/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900">{app.clientName}</p>
                    {app.isUrgent && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        مستعجل
                      </span>
                    )}
                    {app.needsUpdate && (
                      <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 animate-pulse">
                        ⚠️ مطلوب تحديث
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{app.clientNationalId}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-crobsa-700" />
                      <span>{app.companyName || companies.find(c => c.id === app.companyId || app.assignedCompanyIds?.includes(c.id))?.name || 'غير محدد'}</span>
                    </span>
                    {app.selectedProgramName && (
                      <span className="text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded-lg">
                        {app.selectedProgramName}
                      </span>
                    )}
                    {(app.salesmanName || (app.submittedBy && getUserName(app.submittedBy))) && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-blue-600" />
                        <span>مندوب: {app.salesmanName || getUserName(app.submittedBy)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(app.status)}`}>
                  {STATUS_ARABIC[app.status]}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">المبلغ المطلوب</span>
                  <span className="font-bold text-slate-900 font-mono">{app.requestedAmount.toLocaleString()} ج.م</span>
                </div>
                {app.status === ApplicationStatus.APPROVED && app.approvedAmount && (
                  <div>
                    <span className="text-[10px] text-emerald-600 block">المبلغ المعتمد</span>
                    <span className="font-bold text-emerald-700 font-mono">{app.approvedAmount.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block">التاريخ</span>
                  <span className="font-mono text-slate-600">{new Date(app.submittedAt).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-mono">#{app.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDiscussionApp(app);
                      setDiscussionTab('comments');
                    }}
                    className="p-1.5 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>مناقشة</span>
                    {app.comments && app.comments.length > 0 && (
                      <span className="bg-sky-600 text-white rounded-full text-[9px] px-1 font-bold">
                        {app.comments.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExternalDispatchApp(app);
                    }}
                    className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-200"
                    title="مراسلة واستعجال الشركة خارجياً (واتساب / إيميل)"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>استعجال</span>
                  </button>

                  {canEditApp(app) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setIsEditing(true);
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-blue-200 cursor-pointer"
                      title="تعديل بيانات وأوراق الطلب"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>تعديل</span>
                    </button>
                  )}

                  <button 
                    type="button"
                    onClick={() => { setSelectedApp(app); setIsEditing(false); setNextStatus(''); setIsRejecting(false); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                  >
                    عرض التفاصيل
                  </button>
                  {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAppToDelete(app);
                      }}
                      className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-rose-200"
                      title="حذف الطلب نهائياً"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredApps.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا توجد طلبات تطابق بحثك
            </div>
          )}
        </div>

        {/* Desktop View: Clean Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3">رقم الطلب</th>
                <th className="px-5 py-3">العميل</th>
                <th className="px-5 py-3">المبلغ (ج.م)</th>
                <th className="px-5 py-3">الحالة</th>
                <th className="px-5 py-3">التاريخ</th>
                <th className="px-5 py-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map(app => (
                <tr key={app.id} className={`hover:bg-slate-50/80 transition-colors group ${app.isUrgent ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      {app.isUrgent && (
                        <span className="p-1 bg-amber-500 text-white rounded-md shadow-xs animate-pulse" title="طلب مستعجل">
                          <Zap className="h-3 w-3 fill-white" />
                        </span>
                      )}
                      <span>{app.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{app.clientName}</p>
                      {app.isUrgent && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          مستعجل
                        </span>
                      )}
                      {app.needsUpdate && (
                        <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse" title="مطلوب تحديث واستكمال الأوراق والبيانات من رافع الطلب">
                          ⚠️ مطلوب تحديث
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-slate-400 font-mono">{app.clientNationalId || 'بدون رقم قومي'}</p>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-crobsa-700" />
                        <span>{app.companyName || companies.find(c => c.id === app.companyId || app.assignedCompanyIds?.includes(c.id))?.name || 'غير محدد'}</span>
                      </span>
                      {app.selectedProgramName && (
                        <span className="text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded-lg">
                          {app.selectedProgramName}
                        </span>
                      )}
                      {(app.salesmanName || (app.submittedBy && getUserName(app.submittedBy))) && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5 text-blue-600" />
                          <span>مندوب: {app.salesmanName || getUserName(app.submittedBy)}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {app.status === ApplicationStatus.APPROVED ? (
                      <div>
                        <p className="text-emerald-600 font-bold font-mono tabular-nums">{app.approvedAmount?.toLocaleString()} ج.م</p>
                        <p className="text-[10px] text-slate-400">من أصل {app.requestedAmount.toLocaleString()} ج.م</p>
                      </div>
                    ) : (
                      <span className="text-slate-700 font-bold font-mono tabular-nums">{app.requestedAmount.toLocaleString()} ج.م</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(app.status)}`}>
                        {STATUS_ARABIC[app.status]}
                      </span>
                      {app.status === ApplicationStatus.REJECTED && app.rejectionReason && (
                        <p className="text-[10px] text-rose-600 mt-1 line-clamp-1">
                          {app.rejectionReason}
                        </p>
                      )}
                      {app.reRouteHistory && app.reRouteHistory.length > 0 && (
                        <p className="text-[10px] text-sky-600 mt-0.5 flex items-center gap-1">
                          <ArrowRightLeft className="h-2.5 w-2.5" />
                          تم تحويله ({app.reRouteHistory.length})
                        </p>
                      )}
                      {app.needsUpdate && (
                        <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          بانتظار تحديث الرافع
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">
                    {new Date(app.submittedAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-5 py-3.5 text-left flex justify-end gap-1.5">
                    {/* Discussion & Comments Modal Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDiscussionApp(app);
                        setDiscussionTab('comments');
                      }}
                      className="relative text-sky-700 bg-sky-50 hover:bg-sky-100 p-2 rounded-lg transition-colors border border-sky-200"
                      title="المناقشة واستفسارات الملف"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {app.comments && app.comments.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-sky-700 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                          {app.comments.length}
                        </span>
                      )}
                    </button>

                    {/* Quick Expedite Button if not urgent */}
                    {!app.isUrgent && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await expediteApplication(app.id);
                        }}
                        className="text-amber-600 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors border border-amber-200"
                        title="استعجال فحص الطلب"
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* External Company Dispatch / Expedite (واتساب / إيميل) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExternalDispatchApp(app);
                      }}
                      className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors border border-emerald-200"
                      title="مراسلة واستعجال الشركة خارجياً (واتساب / بريد إلكتروني)"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>

                    {currentUser.role === Role.INSTALLMENT_COMPANY && app.status === ApplicationStatus.PENDING_ADMIN && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReceive(app); }}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs rounded-lg px-3 py-1.5 transition-all flex items-center"
                        title="تأكيد الاستلام"
                      >
                         <CheckSquare className="h-3.5 w-3.5" />
                      </button>
                    )}
                    
                    {canEditApp(app) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                          setIsEditing(true);
                        }}
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors border border-blue-200 cursor-pointer"
                        title="تعديل بيانات وأوراق الطلب"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button 
                      onClick={() => { setSelectedApp(app); setIsEditing(false); setNextStatus(''); setIsRejecting(false); }}
                      className="text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 font-semibold text-xs rounded-lg px-3 py-1.5 transition-all border border-sky-100 cursor-pointer"
                    >
                      التفاصيل
                    </button>
                    {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAppToDelete(app);
                        }}
                        className="text-rose-600 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors border border-rose-200"
                        title="حذف الطلب نهائياً (مدير النظام فقط)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                     <p>لا توجد طلبات تطابق بحثك</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            
            {/* Main Content Side */}
            <div className="flex-1 flex flex-col max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      {isEditing ? 'تعديل الطلب' : 'تفاصيل الطلب'}
                      {isEditing && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded mr-2 font-normal">وضع التعديل</span>}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">#{selectedApp.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    {canEditApp(selectedApp) && !isEditing && (
                      <button 
                          type="button"
                          onClick={() => setIsEditing(true)} 
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 border border-sky-200 cursor-pointer"
                          title="تعديل بيانات وأوراق الطلب"
                      >
                          <Edit className="h-4 w-4" />
                          <span>تعديل الطلب</span>
                      </button>
                    )}
                    {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && !isEditing && (
                      <button 
                          type="button"
                          onClick={() => setAppToDelete(selectedApp)} 
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors border border-rose-200 cursor-pointer"
                          title="حذف الطلب نهائياً (صلاحية مدير النظام)"
                      >
                          <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => { setSelectedApp(null); setIsRejecting(false); setIsEditing(false); setSelectedCompanyIds([]); setShowClientModal(false); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <X className="h-6 w-6" />
                    </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                 {isEditing ? (
                     <ApplicationForm 
                        initialData={selectedApp} 
                        onSubmit={handleUpdate} 
                        users={users} 
                        currentUserRole={currentUser.role} 
                        submitLabel="حفظ التعديلات"
                     />
                 ) : (
                 <>
                  {/* Workflow Action Bar */}
                  <div className="bg-gradient-to-r from-slate-900 to-crobsa-950 p-4 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-white/10 rounded-xl">
                        <MessageSquare className="h-5 w-5 text-crobsa-300" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-200">مركز استفسارات ومناقشة الطلب</p>
                        <p className="text-[11px] text-slate-400">
                          {selectedApp.comments?.length || 0} استفسارات وملاحظات مسجلة
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setDiscussionApp(selectedApp);
                          setDiscussionTab('comments');
                        }}
                        className="bg-crobsa-600 hover:bg-crobsa-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        مناقشة الحالة ({selectedApp.comments?.length || 0})
                      </button>

                      <button
                        onClick={() => {
                          setDiscussionApp(selectedApp);
                          setDiscussionTab('documents');
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Paperclip className="h-4 w-4 text-crobsa-300" />
                        المستندات ({selectedApp.documents?.length || 0})
                      </button>

                      {!selectedApp.isUrgent ? (
                        <button
                          onClick={async () => {
                            await expediteApplication(selectedApp.id);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-black px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Zap className="h-4 w-4 fill-amber-950" />
                          استعجال الفحص
                        </button>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 fill-amber-300" />
                          طلب معجل
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setExternalDispatchApp(selectedApp);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                        title="مراسلة واستعجال شركة التقسيط خارجياً (واتساب / بريد إلكتروني)"
                      >
                        <Send className="h-4 w-4" />
                        <span>مراسلة / استعجال خارجي</span>
                      </button>

                      {(currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) && (
                        <button
                          onClick={() => {
                            setDiscussionApp(selectedApp);
                            setDiscussionTab('reroute');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          تحويل الطلب
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection Alert & Re-route trigger */}
                  {selectedApp.status === ApplicationStatus.REJECTED && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-black text-rose-900">
                              تم رفض هذا الطلب من جهة التمويل
                            </h4>
                            <p className="text-xs font-bold text-rose-700 mt-0.5">
                              سبب الرفض: {selectedApp.rejectionReason || 'غير محدد'}
                            </p>
                            {selectedApp.rejectionNotes && (
                              <p className="text-xs text-rose-600 mt-1 italic">
                                ملاحظات مسؤولي الائتمان: "{selectedApp.rejectionNotes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {(currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) && (
                          <button
                            onClick={() => {
                              setDiscussionApp(selectedApp);
                              setDiscussionTab('reroute');
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shrink-0"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            تحويل لشركة أخرى
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Direct Stage & Salesman Quick Control Bar */}
                  {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/80 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                            <ShieldAlert className="h-4 w-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2">
                              <span>لوحة التحكم السريع لمدير النظام (المرحلة والمندوب)</span>
                              <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">صلاحية إدارة كاملة</span>
                            </h4>
                            <p className="text-[11px] text-gray-500">يمكنك نقل الطلب لأي مرحلة أو إعادة تعيين المندوب مباشرة دون الحاجة لفتح شاشة التعديل الكاملة.</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-indigo-600" />
                            <span>مرحلة / حالة الطلب الحالية:</span>
                          </label>
                          <select
                            className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            value={selectedApp.status}
                            onChange={async (e) => {
                              const nextSt = e.target.value as ApplicationStatus;
                              await updateApplication(selectedApp.id, { 
                                status: nextSt,
                                lastStageDate: new Date().toISOString()
                              });
                              setSelectedApp(prev => prev ? { 
                                ...prev, 
                                status: nextSt, 
                                lastStageDate: new Date().toISOString() 
                              } : null);
                            }}
                          >
                            {Object.values(ApplicationStatus).map(st => (
                              <option key={st} value={st}>{STATUS_ARABIC[st] || st}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                              <span>مندوب / موظف المبيعات المسؤول:</span>
                            </span>
                            {!isAddingSalesmanDirect && (
                              <button
                                type="button"
                                onClick={() => setIsAddingSalesmanDirect(true)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                              >
                                + مندوب جديد
                              </button>
                            )}
                          </label>

                          {isAddingSalesmanDirect ? (
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-300 shadow-xs">
                              <input
                                type="text"
                                placeholder="اسم المندوب الجديد..."
                                className="flex-1 px-2 py-1 text-xs outline-none font-medium"
                                value={newSalesmanDirectInput}
                                onChange={e => setNewSalesmanDirectInput(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const trimmed = newSalesmanDirectInput.trim();
                                    if (trimmed) {
                                      await addSalesRepresentative(trimmed);
                                      await updateApplication(selectedApp.id, { salesmanName: trimmed });
                                      setSelectedApp(prev => prev ? { ...prev, salesmanName: trimmed } : null);
                                      setNewSalesmanDirectInput('');
                                      setIsAddingSalesmanDirect(false);
                                    }
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const trimmed = newSalesmanDirectInput.trim();
                                  if (trimmed) {
                                    await addSalesRepresentative(trimmed);
                                    await updateApplication(selectedApp.id, { salesmanName: trimmed });
                                    setSelectedApp(prev => prev ? { ...prev, salesmanName: trimmed } : null);
                                    setNewSalesmanDirectInput('');
                                    setIsAddingSalesmanDirect(false);
                                  }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                حفظ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingSalesmanDirect(false);
                                  setNewSalesmanDirectInput('');
                                }}
                                className="text-gray-400 hover:text-gray-600 px-1 text-xs cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <select
                              className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                              value={selectedApp.salesmanName || ''}
                              onChange={async (e) => {
                                if (e.target.value === '__NEW__') {
                                  setIsAddingSalesmanDirect(true);
                                } else {
                                  await updateApplication(selectedApp.id, { salesmanName: e.target.value });
                                  setSelectedApp(prev => prev ? { ...prev, salesmanName: e.target.value } : null);
                                }
                              }}
                            >
                              <option value="">-- اختر مندوب المبيعات --</option>
                              {allSalesmen.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                              <option value="__NEW__" className="text-indigo-600 font-bold bg-indigo-50">
                                ➕ إضافة مندوب جديد غير مسجل...
                              </option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Stats Grid - Expanded */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 col-span-2 md:col-span-1">
                       <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">بيانات العميل</h4>
                       <div className="space-y-1">
                          <p 
                            className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center"
                            onClick={() => setShowClientModal(true)}
                          >
                              {selectedApp.clientName}
                              <ExternalLink className="h-4 w-4 mr-2 opacity-50" />
                          </p>
                          <p className="text-sm text-gray-500 font-mono">{selectedApp.clientNationalId}</p>
                          <div className="flex gap-3 mt-2 text-sm text-gray-600">
                             {selectedApp.phoneNumber && <span className="flex items-center"><Phone className="h-3 w-3 ml-1" /> {selectedApp.phoneNumber}</span>}
                             <span className="font-bold text-blue-600">{selectedApp.governorate}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                             <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">{professionLabels[selectedApp.profession] || selectedApp.profession}</span>
                             {(selectedApp.salesmanName || (selectedApp.submittedBy && getUserName(selectedApp.submittedBy))) && (
                               <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                 <UserCheck className="h-3 w-3 text-blue-600" />
                                 <span>المندوب: {selectedApp.salesmanName || getUserName(selectedApp.submittedBy)}</span>
                               </span>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 col-span-2 md:col-span-1">
                       <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">الوضع المالي والائتماني</h4>
                       <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-blue-400">المبلغ المطلوب</p>
                            <p className="text-lg font-bold text-blue-900">{selectedApp.requestedAmount.toLocaleString()} ج.م</p>
                            <p className="text-xs text-blue-400 mt-1">{selectedApp.financeType === 'INSTALLMENT' ? 'تقسيط' : 'آجل'} - {selectedApp.durationMonths} شهر</p>
                          </div>
                          {(selectedApp.status === ApplicationStatus.APPROVED || 
                            selectedApp.status === ApplicationStatus.CONTRACT_SIGNING || 
                            selectedApp.status === ApplicationStatus.AMOUNT_TRANSFERRED) ? (
                            <div className="text-left">
                               <p className="text-xs text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded mb-1">موافق عليه ومصرح</p>
                               <p className="text-lg font-bold text-emerald-700">{(selectedApp.approvedAmount || selectedApp.requestedAmount).toLocaleString()} ج.م</p>
                               <div className="mt-2 border-t border-blue-200 pt-1">
                                  <p className="text-xs text-blue-500">الرصيد المتاح:</p>
                                  <p className="text-xl font-bold text-blue-800">{((selectedApp.approvedAmount || selectedApp.requestedAmount) - selectedApp.usedAmount).toLocaleString()} ج.م</p>
                               </div>
                            </div>
                          ) : selectedApp.status === ApplicationStatus.REJECTED ? (
                            <div className="text-left">
                               <p className="text-xs text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded mb-1">تم رفض الطلب</p>
                               <p className="text-xs text-rose-500 max-w-[130px] truncate">{selectedApp.rejectionReason || 'عدم استيفاء الشروط'}</p>
                            </div>
                          ) : (
                            <div className="text-left">
                               <span className="inline-block text-xs text-amber-800 font-bold bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg mb-1">
                                 {STATUS_ARABIC[selectedApp.status] || selectedApp.status}
                               </span>
                               <p className="text-[11px] text-slate-600 font-bold mt-1">
                                 حالة الاعتماد: قيد الدراسة
                               </p>
                               <p className="text-[10px] text-slate-500">
                                 لم يصدر قرار ائتماني بعد
                               </p>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Selected Financing Program & Terms */}
                 {(selectedApp.selectedProgramName || selectedApp.programInterestRate !== undefined) && (
                   <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4">
                     <div className="flex items-center justify-between flex-wrap gap-2">
                       <div className="flex items-center gap-2">
                         <Layers className="h-4 w-4 text-sky-700" />
                         <span className="text-xs font-bold text-sky-900">البرنامج التمويلي للطلب:</span>
                         <span className="bg-sky-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-xs">
                           {selectedApp.selectedProgramName || 'برنامج التمويل المباشر'}
                         </span>
                       </div>
                       <div className="flex items-center gap-2 text-xs flex-wrap">
                         {selectedApp.programInterestRate !== undefined && (
                           <span className="bg-white text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md font-bold">
                             الفائدة: {selectedApp.programInterestRate}%
                           </span>
                         )}
                         {selectedApp.programAdminFeePercent !== undefined && (
                           <span className="bg-white text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                             المصاريف الإدارية: {selectedApp.programAdminFeePercent}%
                           </span>
                         )}
                         {selectedApp.lastStageDate && (
                           <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                             آخر مرحلة: {new Date(selectedApp.lastStageDate).toLocaleDateString('ar-EG')}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Description & Interactive Links */}
                 {selectedApp.description && (
                   <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center justify-between">
                        <span>ملاحظات الطلب والمستندات</span>
                        {selectedApp.description.includes('drive.google.com') && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <FolderOpen className="h-3 w-3 text-amber-500" />
                            يحتوي على رابط Google Drive
                          </span>
                        )}
                      </h4>
                      <div className="text-gray-700 text-sm leading-relaxed">
                        {(() => {
                          const text = selectedApp.description;
                          const urlRegex = /(https?:\/\/[^\s]+)/g;
                          const parts = text.split(urlRegex);
                          const driveMatch = text.match(/(https?:\/\/drive\.google\.com\/[^\s]+)/i);
                          const driveUrl = driveMatch ? driveMatch[0] : null;

                          return (
                            <div>
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {parts.map((part, idx) => {
                                  if (part.match(urlRegex)) {
                                    const isDrive = part.includes('drive.google.com');
                                    return (
                                      <a
                                        key={idx}
                                        href={part}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`font-semibold inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded transition-all underline ${
                                          isDrive 
                                            ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 font-bold' 
                                            : 'text-blue-600 hover:text-blue-800'
                                        }`}
                                        dir="ltr"
                                      >
                                        <span>{isDrive ? '📁 مجلد المستندات (Google Drive)' : part}</span>
                                        <ExternalLink className="h-3 w-3 inline" />
                                      </a>
                                    );
                                  }
                                  return part;
                                })}
                              </p>

                              {driveUrl && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <a
                                    href={driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all w-full sm:w-auto justify-center"
                                  >
                                    <FolderOpen className="h-4 w-4 text-amber-300" />
                                    <span>فتح مجلد ومستندات العميل على Google Drive ↗</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                   </div>
                 )}

                 {/* Assigned Companies List (Visible to Admin/SuperAdmin) */}
                 {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (selectedApp.assignedCompanyIds || []).length > 0 && (
                     <div className="bg-white border border-gray-200 rounded-xl p-4">
                         <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                             <Building className="h-4 w-4 ml-2" />
                             الشركات المعينة
                         </h4>
                         <div className="flex flex-wrap gap-2">
                             {(selectedApp.assignedCompanyIds || []).map(id => (
                                 <span key={id} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center">
                                     {getUserName(id)}
                                 </span>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* Dynamic Questions Answers Section */}
                 {selectedApp.customAnswers && Object.keys(selectedApp.customAnswers).length > 0 && (
                   <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                     <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                       <HelpCircle className="h-4 w-4 text-crobsa-700" />
                       إجابات الاستبيان المخصص للطلب
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                       {Object.entries(selectedApp.customAnswers).map(([qKey, qVal]) => (
                         <div key={qKey} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <p className="text-slate-500 font-bold mb-1">
                             {qKey === 'land_area' ? 'المساحة المزروعة (فدان)' :
                              qKey === 'crop_type' ? 'نوع المحصول والنشاط' :
                              qKey === 'has_irrigation' ? 'توفر نظام ري متطور' :
                              qKey === 'commercial_reg' ? 'رقم السجل التجاري / الحيازة' : qKey}
                           </p>
                           <p className="text-slate-900 font-black text-sm">
                             {typeof qVal === 'boolean' ? (qVal ? 'نعم' : 'لا') : String(qVal || 'غير محدد')}
                           </p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Attached Documents List */}
                 <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                   <div className="flex items-center justify-between border-b pb-2">
                     <div className="flex items-center gap-2">
                       <Paperclip className="h-4 w-4 text-blue-600" />
                       <h4 className="text-sm font-bold text-gray-900">
                         المستندات والوثائق المرفوعة
                       </h4>
                       <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                         {selectedApp.documents?.length || 0}
                       </span>
                     </div>
                     <button
                       onClick={() => {
                         setDiscussionApp(selectedApp);
                         setDiscussionTab('documents');
                       }}
                       className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                     >
                       <span>إدارة ورفع مستندات جديدة</span>
                       <span>+</span>
                     </button>
                   </div>

                   {selectedApp.documents && selectedApp.documents.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                       {selectedApp.documents.map(doc => {
                         const targetUrl = doc.fileUrl || doc.url;
                         const isImg = targetUrl?.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(targetUrl || '') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.fileName || '');
                         const isPdf = targetUrl?.startsWith('data:application/pdf') || doc.fileName?.toLowerCase().endsWith('.pdf') || doc.type === 'application/pdf';

                         return (
                           <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors">
                             <div className="flex items-center gap-2.5 min-w-0">
                               {isImg && targetUrl ? (
                                 <img
                                   src={targetUrl}
                                   alt={doc.name}
                                   className="h-10 w-10 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer hover:opacity-90"
                                   onClick={() => setViewingDoc({
                                     document: {
                                       name: doc.name,
                                       url: targetUrl,
                                       type: 'image/jpeg',
                                       size: doc.fileSize || doc.size,
                                       uploadedByName: doc.uploadedByName,
                                       uploadedAt: doc.uploadedAt
                                     },
                                     clientName: selectedApp.clientName
                                   })}
                                 />
                               ) : (
                                 <span className="p-2.5 bg-white rounded-lg text-blue-600 border border-slate-200 shrink-0">
                                   <FileText className="h-4 w-4" />
                                 </span>
                               )}
                               <div className="min-w-0">
                                 <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                                 <p className="text-[10px] text-slate-400 font-mono">
                                   {doc.fileName ? `${doc.fileName} • ` : ''}{doc.fileSize || doc.size || '1.0 MB'} • بواسطة {doc.uploadedByName || 'النظام'}
                                 </p>
                               </div>
                             </div>

                             <div className="flex items-center gap-1.5 shrink-0">
                               <button
                                 type="button"
                                 onClick={() => setViewingDoc({
                                   document: {
                                     name: doc.name,
                                     url: targetUrl,
                                     type: isPdf ? 'application/pdf' : 'image/jpeg',
                                     size: doc.fileSize || doc.size,
                                     uploadedByName: doc.uploadedByName,
                                     uploadedAt: doc.uploadedAt
                                   },
                                   clientName: selectedApp.clientName
                                 })}
                                 className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                 title="معاينة المستند"
                               >
                                 <Eye className="h-3.5 w-3.5" />
                                 <span>معاينة</span>
                               </button>

                               {targetUrl && (
                                 <a
                                   href={targetUrl}
                                   download={doc.fileName || `${doc.name}.${isPdf ? 'pdf' : 'png'}`}
                                   className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                   title="تحميل الملف إلى جهازك"
                                 >
                                   <Download className="h-3.5 w-3.5" />
                                 </a>
                               )}
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                       <FileText className="h-8 w-8 text-slate-400 mx-auto mb-1.5" />
                       <p className="text-xs font-bold text-slate-700">لم يتم إرفاق مستندات حتى الآن لهذا الطلب</p>
                       <p className="text-[11px] text-slate-400 mt-0.5">يمكنك النقر على "إدارة ورفع مستندات جديدة +" لإرفاق أوراق العميل</p>
                     </div>
                   )}
                 </div>

                 {/* Document Link */}
                 <a 
                    href={selectedApp.documentLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50/50 text-blue-800 rounded-xl hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center">
                       <div className="bg-white p-2 rounded-lg shadow-sm ml-3 text-blue-600">
                          <ExternalLink className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-bold text-sm">مجلد المستندات</p>
                          <p className="text-xs text-blue-500">Google Drive</p>
                       </div>
                    </div>
                    <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-blue-600 group-hover:shadow-sm">فتح</span>
                  </a>

                 {/* ACTIONS AREA */}
                 <div className="border-t border-gray-100 pt-8">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-4 w-4 ml-2 text-blue-600" />
                      الإجراءات المطلوبة
                    </h4>
                    
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      {/* Admin Assign */}
                      {(currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (
                        <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                          <label className="text-sm font-medium text-gray-700 block">
                              {(selectedApp.assignedCompanyIds || []).length > 0 ? 'إضافة شركات أخرى' : 'تعيين لشركة تقسيط'}
                          </label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {users.filter(u => u.role === Role.INSTALLMENT_COMPANY).map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => toggleCompanySelection(u.id)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                            selectedCompanyIds.includes(u.id) || (selectedApp.assignedCompanyIds || []).includes(u.id)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        } ${(selectedApp.assignedCompanyIds || []).includes(u.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={(selectedApp.assignedCompanyIds || []).includes(u.id)}
                                    >
                                        {u.name} {(selectedApp.assignedCompanyIds || []).includes(u.id) && '(معين)'}
                                    </button>
                                ))}
                            </div>
                            <button 
                              disabled={selectedCompanyIds.length === 0}
                              onClick={handleAssign}
                              className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                              حفظ التعيين ({selectedCompanyIds.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Disbursement Action for Admin / Company / Branch Manager */}
                      {(currentUser.role === Role.INSTALLMENT_COMPANY || currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.BRANCH_MANAGER) && 
                       (selectedApp.status === ApplicationStatus.APPROVED || selectedApp.status === ApplicationStatus.AMOUNT_TRANSFERRED || (selectedApp.approvedAmount && selectedApp.approvedAmount > 0)) && (
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => setShowDisburseModal(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <Wallet className="h-4 w-4" />
                            <span>صرف التمويل وتسجيل المبلغ المصروف للعميل</span>
                          </button>
                        </div>
                      )}

                      {/* Installment Company / Admin Workflow Actions */}
                      {(currentUser.role === Role.INSTALLMENT_COMPANY || currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && (
                        <div className="space-y-4">
                          {isRejecting ? (
                            // Reject Flow
                            <div className="space-y-3 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                              <h5 className="font-bold text-red-800 text-sm flex items-center">
                                <XCircle className="h-4 w-4 ml-2" /> بيانات الرفض
                              </h5>
                              <div>
                                <label className="text-xs text-red-700 block mb-1 font-bold">سبب الرفض</label>
                                <select 
                                  className="w-full border border-red-200 p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                >
                                  {REJECTION_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>
                              <textarea 
                                className="w-full border border-red-200 p-3 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="ملاحظات إضافية..."
                                rows={3}
                                value={reviewNote}
                                onChange={e => setReviewNote(e.target.value)}
                              />
                              <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setIsRejecting(false)}
                                    className="flex-1 bg-white text-gray-600 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
                                  >
                                    إلغاء
                                  </button>
                                <button 
                                    onClick={() => handleFinalReview(ApplicationStatus.REJECTED)}
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 font-bold shadow-sm"
                                  >
                                    تأكيد الرفض
                                  </button>
                              </div>
                            </div>
                          ) : nextStatus === ApplicationStatus.APPROVED ? (
                            // Approve Flow
                            <div className="space-y-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in fade-in">
                                <h5 className="font-bold text-emerald-800 text-sm flex items-center">
                                    <Check className="h-4 w-4 ml-2" /> الموافقة النهائية
                                </h5>
                                <div>
                                <label className="text-xs text-emerald-700 font-bold mb-1 block">الحد المعتمد</label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                  <input 
                                    type="number" 
                                    className="w-full border border-emerald-300 p-2.5 pl-10 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder={selectedApp.requestedAmount.toString()}
                                    value={approvedAmount || ''}
                                    onChange={e => setApprovedAmount(Number(e.target.value))}
                                  />
                                </div>
                              </div>
                              <textarea 
                                  className="w-full border border-emerald-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                  placeholder="ملاحظات الموافقة (اختياري)"
                                  rows={2}
                                  value={reviewNote}
                                  onChange={e => setReviewNote(e.target.value)}
                                />
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setNextStatus('')}
                                        className="flex-1 bg-white text-gray-600 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium"
                                    >
                                        إلغاء
                                    </button>
                                    <button 
                                    onClick={() => handleFinalReview(ApplicationStatus.APPROVED)}
                                    className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 flex justify-center items-center font-bold shadow-sm"
                                    >
                                    تأكيد الموافقة
                                    </button>
                                </div>
                            </div>
                          ) : (
                            // Status Selection Flow
                            <div>
                                {currentUser.role === Role.INSTALLMENT_COMPANY && !selectedApp.assignedBranchId && !selectedApp.assignedOfficerId && (selectedApp.status === ApplicationStatus.RECEIVED || selectedApp.status === ApplicationStatus.PENDING_ADMIN) && (
                                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold">تنبيه: الطلب جديد وغير مسند بعد</p>
                                      <p className="text-[11px] text-amber-700 mt-0.5">
                                        يلزم إسناد الطلب لفرع وموظف ائتمان من بوابة شركة التقسيط لتفريغ قائمة الطلبات الجديدة وبدء مسار العمل المعتمد.
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <label className="text-sm font-medium text-gray-700 block mb-2">تحديث حالة الطلب</label>
                                <select 
                                    className="w-full border border-gray-300 p-3 rounded-xl bg-white mb-3"
                                    value={selectedApp.status}
                                    onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                                >
                                    {availableStatuses.map(status => (
                                        <option key={status} value={status}>{STATUS_ARABIC[status]}</option>
                                    ))}
                                </select>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    تغيير الحالة سيقوم بتحديث السجل وإشعار المورد.
                                </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* WITHDRAWAL REQUEST LOGIC */}
                      {(currentUser.role === Role.SUPPLIER || currentUser.role === Role.SALESMAN) && selectedApp.status === ApplicationStatus.APPROVED && (
                        <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                          <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-800 border border-amber-200 mb-2">
                             <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                             <p>تنبيه: سيتم إرسال طلب سحب إلى مدير النظام للموافقة عليه قبل خصم المبلغ.</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-bold mb-1 block">مبلغ السحب</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input 
                                type="number" 
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={deductAmount || ''}
                                onChange={e => setDeductAmount(Number(e.target.value))}
                                required
                                max={(selectedApp.approvedAmount || 0) - selectedApp.usedAmount}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-left">المتاح: {((selectedApp.approvedAmount || 0) - selectedApp.usedAmount).toLocaleString()} ج.م</p>
                          </div>
                          <input 
                            type="text"
                            placeholder="الغرض / رقم الفاتورة"
                            className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={deductNote}
                            onChange={e => setDeductNote(e.target.value)}
                            required
                          />
                          <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                          >
                            إرسال طلب سحب
                          </button>
                        </form>
                      )}

                       {['APPROVED', 'REJECTED', 'AMOUNT_TRANSFERRED', 'CANCELLED_BY_CLIENT'].includes(selectedApp.status) && !['PENDING_ADMIN','PENDING_REVIEW'].includes(selectedApp.status) && (
                        <div className="text-center py-4 border-t border-gray-100 mt-4">
                          {selectedApp.reviewNote && (
                            <div className="mt-1 bg-white p-3 rounded border border-gray-200 text-right">
                               <p className="text-xs font-bold text-gray-700 mb-1">ملاحظات آخر إجراء:</p>
                               <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedApp.reviewNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                 </div>
                 </>
                 )}
              </div>
            </div>

            {/* Sidebar History */}
            {!isEditing && (
                <div className="w-full md:w-80 bg-slate-50 border-r border-gray-200 overflow-y-auto border-t md:border-t-0 md:border-r-0 md:border-l">
                <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-8 flex items-center justify-center">
                    <History className="h-4 w-4 ml-2 text-gray-500" />
                    سجل النشاطات
                    </h4>
                    
                    <div className="relative px-2">
                    {/* Timeline line */}
                    <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {(selectedApp.history || [])
                        .filter(item => !(currentUser.role === Role.INSTALLMENT_COMPANY && item.action === 'COMMISSION_DEDUCTED'))
                        .map((item, idx) => (
                        <div key={idx} className="relative mb-6 pr-10">
                        <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-blue-500 border-4 border-slate-50 z-10 flex items-center justify-center shadow-sm">
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative">
                            <div className="absolute top-3 -right-1.5 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45 transform"></div>
                            <div>
                                <span className="font-bold text-sm text-blue-600 block mb-1">{actionLabels[item.action] || item.action}</span>
                                <div className="text-xs text-gray-500 font-medium mb-1">
                                    بواسطة: {getUserName(item.performedBy)}
                                </div>
                                {item.details && (
                                    <p className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded mb-1 leading-relaxed border border-gray-50">
                                    {item.details}
                                    </p>
                                )}
                                <time className="font-sans text-[10px] text-gray-400 block text-left" dir="ltr">
                                    {new Date(item.timestamp).toLocaleString('en-US', {
                                    year: 'numeric', month: 'numeric', day: 'numeric',
                                    hour: '2-digit', minute:'2-digit'
                                    })}
                                </time>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            )}

          </div>
        </div>
      )}

      {/* Customer Detail Modal Overlay */}
      {showClientModal && selectedApp && (
          <ClientDetailModal 
            client={clients.find(c => (selectedApp.clientId && c.id === selectedApp.clientId) || (selectedApp.clientNationalId && c.nationalId === selectedApp.clientNationalId)) || {
              id: selectedApp.clientId || `client_${selectedApp.id}`,
              name: selectedApp.clientName,
              nationalId: selectedApp.clientNationalId || '',
              phoneNumber: selectedApp.phoneNumber,
              governorate: selectedApp.governorate,
              creditRating: 'A',
              profession: (selectedApp.profession as any) || 'OTHER',
              createdAt: selectedApp.submittedAt,
              updatedAt: selectedApp.submittedAt
            }} 
            onClose={() => setShowClientModal(false)} 
          />
      )}

      {/* Case Discussion & Workflow Modal */}
      {discussionApp && (
        <CaseDiscussionModal
          application={discussionApp}
          initialTab={discussionTab}
          onClose={() => setDiscussionApp(null)}
        />
      )}

      {/* Disbursement Modal (صرف التمويل وتسجيل المبلغ المصروف) */}
      {showDisburseModal && selectedApp && (
        <DisbursementModal
          application={selectedApp}
          onClose={() => setShowDisburseModal(false)}
          onSuccess={() => {
            setShowDisburseModal(false);
          }}
        />
      )}

      {/* External Company Dispatch & Expedite Modal (واتساب / إيميل) */}
      {externalDispatchApp && (
        <ExternalCompanyDispatchModal
          isOpen={!!externalDispatchApp}
          onClose={() => setExternalDispatchApp(null)}
          application={externalDispatchApp}
          initialCategory="NEW_APPLICATION"
        />
      )}

      {/* Internal Document Viewer Modal for Admin */}
      {viewingDoc && (
        <InternalDocViewerModal
          document={viewingDoc.document}
          clientName={viewingDoc.clientName}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Bulk Applications Import Modal */}
      {showBulkImportAppsModal && (
        <BulkApplicationsImportModal
          isOpen={showBulkImportAppsModal}
          onClose={() => setShowBulkImportAppsModal(false)}
        />
      )}

      {/* Delete Application Confirmation Modal - Admin Only */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-right" dir="rtl">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">تأكيد حذف طلب التمويل</h3>
                <p className="text-xs text-slate-500">
                  هل أنت متأكد من رغبتك في حذف طلب التمويل رقم <span className="font-mono font-bold text-slate-700">#{appToDelete.id}</span>؟
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-right text-xs space-y-2 border border-slate-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">اسم العميل:</span>
                  <span className="font-bold text-slate-800">{appToDelete.clientName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">المبلغ المطلوب:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {Number(appToDelete.requestedAmount || 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">الشركة / الجهة:</span>
                  <span className="font-semibold text-slate-700">{appToDelete.companyName || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400">حالة الطلب:</span>
                  <span className="font-semibold text-slate-700">{STATUS_ARABIC[appToDelete.status] || appToDelete.status}</span>
                </div>
              </div>

              <div className="text-[11px] text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center">
                ⚠️ تنبيه إداري: سيتم حذف هذا الطلب نهائياً من قاعدة البيانات، ولا يمكن التراجع عن هذه العملية بعد التأكيد.
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingApp}
                  onClick={() => setAppToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  disabled={isDeletingApp}
                  onClick={async () => {
                    setIsDeletingApp(true);
                    try {
                      await deleteApplication(appToDelete.id);
                      if (selectedApp?.id === appToDelete.id) {
                        setSelectedApp(null);
                      }
                      setAppToDelete(null);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsDeletingApp(false);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isDeletingApp ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Employee Installment & Deferred Calculator Modal */}
      <InternalInstallmentCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        onApplyCalculation={(calc) => {
          setShowCalculatorModal(false);
          setIsEditing(true);
        }}
      />

      {/* Internal Inbox Modal with AI Analysis */}
      <InternalInboxModal
        isOpen={showInboxModal}
        onClose={() => setShowInboxModal(false)}
      />
    </div>
  );
};
