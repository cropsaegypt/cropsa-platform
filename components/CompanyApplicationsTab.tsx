import React, { useState, useMemo } from 'react';
import { 
  Application, 
  ApplicationStatus, 
  CompanyBranch,
  Role,
  InstallmentCompanyStaffRole,
  CommentNotificationType,
  COMMENT_NOTIFICATION_CONFIG
} from '../types';
import { useStore } from '../context/Store';
import { 
  Search, 
  Filter, 
  Zap, 
  MessageSquare, 
  Paperclip, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Phone, 
  MapPin, 
  Building2, 
  UserCheck, 
  HelpCircle, 
  ExternalLink, 
  ShieldAlert, 
  Calendar, 
  AlertCircle, 
  Eye, 
  Compass, 
  FileCheck, 
  FileText, 
  FolderOpen, 
  Archive, 
  RefreshCw, 
  Send, 
  Wallet,
  Bell,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { SmartCaseAssignmentModal } from './SmartCaseAssignmentModal';
import { InternalDocViewerModal } from './InternalDocViewerModal';
import { DisbursementModal } from './DisbursementModal';

interface CompanyApplicationsTabProps {
  applications: Application[];
  branches: CompanyBranch[];
  staffList: any[];
  rejectionReasons?: string[];
  initialSubView?: 'new_apps' | 'tracking' | 'all';
  onSubSectionChange?: (section: 'new_apps' | 'tracking' | 'all') => void;
  onOpenDiscussion: (app: Application, tab?: 'comments' | 'documents' | 'reroute') => void;
  onExpedite: (appId: string) => Promise<void>;
  onAssignOfficer: (appId: string, officerId: string, officerName: string) => Promise<void>;
  onAssignBranchAndOfficer?: (appId: string, branchId: string, branchName: string, officerId: string, officerName: string) => Promise<void>;
  onAutoAssignBranches?: () => Promise<void>;
  onUpdateStatus: (appId: string, updates: Partial<Application>) => Promise<void>;
  language?: string;
}

export const CompanyApplicationsTab: React.FC<CompanyApplicationsTabProps> = ({
  applications,
  branches,
  staffList,
  rejectionReasons = [],
  initialSubView = 'new_apps',
  onSubSectionChange,
  onOpenDiscussion,
  onExpedite,
  onAssignOfficer,
  onAssignBranchAndOfficer,
  onAutoAssignBranches,
  onUpdateStatus,
  language = 'ar'
}) => {
  const { currentUser, archiveApplication, unarchiveApplication, addApplicationComment } = useStore();
  const canAssign = currentUser?.role === Role.SUPER_ADMIN || 
                    currentUser?.role === Role.ADMIN || 
                    currentUser?.role === Role.INSTALLMENT_COMPANY || 
                    currentUser?.role === Role.BRANCH_MANAGER;

  // Disbursement permissions: Both Company Management AND Branch Manager can record/disburse funds
  const isBranchManager = currentUser?.role === Role.BRANCH_MANAGER || 
                          currentUser?.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER;
  const isCompanyAdmin = currentUser?.role === Role.SUPER_ADMIN || 
                         currentUser?.role === Role.ADMIN || 
                         currentUser?.role === Role.INSTALLMENT_COMPANY || 
                         currentUser?.staffRole === InstallmentCompanyStaffRole.GENERAL_MANAGER;
  const canDisburse = isCompanyAdmin || isBranchManager;

  const [activeSection, setActiveSection] = useState<'new_apps' | 'tracking' | 'all'>(() => {
    return initialSubView || 'new_apps';
  });

  // Sync activeSection when parent initialSubView prop changes
  React.useEffect(() => {
    if (initialSubView) {
      setActiveSection(initialSubView);
    }
  }, [initialSubView]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [governorateFilter, setGovernorateFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Inline follow-up tracking states (متابعة في نفس الصفحة دون فتح بوب أب)
  const [inlineFollowupAppId, setInlineFollowupAppId] = useState<string | null>(null);
  const [inlineFollowupTab, setInlineFollowupTab] = useState<Record<string, 'comments' | 'documents' | 'workflow'>>({});
  const [inlineCommentMap, setInlineCommentMap] = useState<Record<string, string>>({});
  const [inlineCommentTypeMap, setInlineCommentTypeMap] = useState<Record<string, CommentNotificationType>>({});
  const [inlineUrgentMap, setInlineUrgentMap] = useState<Record<string, boolean>>({});
  const [isSubmittingCommentMap, setIsSubmittingCommentMap] = useState<Record<string, boolean>>({});

  const handleSendInlineComment = async (appId: string) => {
    const msg = inlineCommentMap[appId]?.trim();
    if (!msg) return;
    const notifType = inlineCommentTypeMap[appId] || 'GENERAL';
    const isUrgent = inlineUrgentMap[appId] || notifType === 'URGENT_INQUIRY' || notifType === 'WARNING_ALERT';

    setIsSubmittingCommentMap(prev => ({ ...prev, [appId]: true }));
    try {
      await addApplicationComment(appId, msg, isUrgent, notifType);
      setInlineCommentMap(prev => ({ ...prev, [appId]: '' }));
      setInlineCommentTypeMap(prev => ({ ...prev, [appId]: 'GENERAL' }));
      setInlineUrgentMap(prev => ({ ...prev, [appId]: false }));
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingCommentMap(prev => ({ ...prev, [appId]: false }));
    }
  };

  // Sync activeSection if initialSubView changes
  React.useEffect(() => {
    if (initialSubView) {
      setActiveSection(initialSubView);
    }
  }, [initialSubView]);

  const normalizeGov = (g?: string) => (g || '').trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة$/g, 'ه')
    .replace(/ى$/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();

  const normalizeQuery = (s?: string) => (s || '').trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  const checkDateMatch = (dateStr?: string) => {
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

  // A request is considered in "الطلبات الواردة الجديدة" if:
  // 1. It is active (not archived)
  // 2. It has NOT been assigned to a branch or officer yet
  // 3. It is at the intake / initial pending stage (RECEIVED, PENDING_ADMIN, or PENDING_REVIEW)
  // Once it is assigned to a branch or officer, or moves to active review stages (PAPER_REVIEW, ISCORE_CHECK, etc.),
  // it immediately moves to "الحالات الجارية" (Active ongoing cases workflow tracking)
  const isNewIncomingApp = (app: Application) => {
    if (app.isArchived) return false;
    if (
      app.status === ApplicationStatus.APPROVED || 
      app.status === ApplicationStatus.AMOUNT_TRANSFERRED || 
      app.status === ApplicationStatus.REJECTED ||
      app.status === ApplicationStatus.CANCELLED_BY_CLIENT ||
      app.status === ApplicationStatus.WITHDRAWN
    ) {
      return false;
    }
    // If assigned to a branch or officer, it is an active ongoing case (الحالات الجارية)
    if (app.assignedBranchId || app.assignedOfficerId) {
      return false;
    }
    // If its status is already an active study/review stage
    if (
      app.status !== ApplicationStatus.RECEIVED && 
      app.status !== ApplicationStatus.PENDING_ADMIN && 
      app.status !== ApplicationStatus.PENDING_REVIEW
    ) {
      return false;
    }
    return true;
  };

  // Counts for new apps vs active tracking cases
  const newAppsCount = useMemo(() => {
    return applications.filter(a => isNewIncomingApp(a)).length;
  }, [applications]);

  const trackingCasesCount = useMemo(() => {
    return applications.filter(a => 
      !a.isArchived && 
      !isNewIncomingApp(a) &&
      a.status !== ApplicationStatus.REJECTED &&
      a.status !== ApplicationStatus.AMOUNT_TRANSFERRED &&
      a.status !== ApplicationStatus.CANCELLED_BY_CLIENT &&
      a.status !== ApplicationStatus.WITHDRAWN
    ).length;
  }, [applications]);

  const unassignedAppsCount = useMemo(() => {
    return applications.filter(a => !a.isArchived && !a.assignedBranchId).length;
  }, [applications]);

  // Assignment Modal & Internal Doc Viewer State
  const [assigningApp, setAssigningApp] = useState<Application | null>(null);
  const [disbursingApp, setDisbursingApp] = useState<Application | null>(null);
  const [docModalData, setDocModalData] = useState<{
    document: { name: string; url?: string; size?: string; type?: string };
    clientName?: string;
  } | null>(null);

  // Quick Action Dialogs
  const [approvingApp, setApprovingApp] = useState<Application | null>(null);
  const [approvedAmountInput, setApprovedAmountInput] = useState<number>(0);
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  // Credit officers from staff
  const creditOfficers = useMemo(() => {
    return staffList.filter(s => s.staffRole === 'CREDIT_OFFICER' || s.staffRole === 'BRANCH_MANAGER' || s.staffRole === 'COMPANY_ADMIN');
  }, [staffList]);

  // Unique governorates from applications
  const availableGovs = useMemo(() => {
    return Array.from(new Set(applications.map(a => a.governorate).filter(Boolean)));
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Archive Filter
      if (archiveFilter === 'ACTIVE' && app.isArchived) return false;
      if (archiveFilter === 'ARCHIVED' && !app.isArchived) return false;

      // Active Section Filter: New incoming requests vs Active cases workflow tracking
      if (activeSection === 'new_apps') {
        if (!isNewIncomingApp(app)) return false;
      } else if (activeSection === 'tracking') {
        if (isNewIncomingApp(app)) return false;
      }

      if (urgentOnly && !app.isUrgent) return false;
      if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
      if (governorateFilter !== 'ALL' && app.governorate !== governorateFilter) return false;

      // Company Branch Filter
      if (branchFilter !== 'ALL') {
        if (branchFilter === 'UNASSIGNED') {
          if (app.assignedBranchId || app.assignedBranchName) return false;
        } else {
          if (app.assignedBranchId !== branchFilter && app.assignedBranchName !== branchFilter) return false;
        }
      }

      // Date Range Filter
      if (!checkDateMatch(app.submittedAt)) return false;

      // Global Search
      if (searchTerm.trim()) {
        const query = normalizeQuery(searchTerm);
        const matchesClient = normalizeQuery(app.clientName).includes(query);
        const matchesId = app.id.toLowerCase().includes(query);
        const matchesNid = (app.clientNationalId || '').includes(query);
        const matchesPhone = (app.phoneNumber || '').includes(query);
        const matchesWa = (app.whatsappNumber || '').includes(query);
        const matchesBranch = normalizeQuery(app.assignedBranchName).includes(query);
        const matchesOfficer = normalizeQuery(app.assignedOfficerName).includes(query);
        const matchesGov = normalizeQuery(app.governorate).includes(query);

        if (!matchesClient && !matchesId && !matchesNid && !matchesPhone && !matchesWa && !matchesBranch && !matchesOfficer && !matchesGov) {
          return false;
        }
      }
      return true;
    });
  }, [applications, searchTerm, statusFilter, governorateFilter, branchFilter, datePreset, dateFrom, dateTo, urgentOnly, archiveFilter, activeSection]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setGovernorateFilter('ALL');
    setBranchFilter('ALL');
    setDatePreset('ALL');
    setDateFrom('');
    setDateTo('');
    setUrgentOnly(false);
  };

  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    statusFilter !== 'ALL' || 
    governorateFilter !== 'ALL' || 
    branchFilter !== 'ALL' || 
    datePreset !== 'ALL' || 
    dateFrom !== '' || 
    dateTo !== '' || 
    urgentOnly;

  const handleQuickApprove = async () => {
    if (!approvingApp) return;
    const finalAmount = approvedAmountInput > 0 ? approvedAmountInput : approvingApp.requestedAmount;
    await onUpdateStatus(approvingApp.id, {
      status: ApplicationStatus.APPROVED,
      approvedAmount: finalAmount,
      reviewNote: `تمت الموافقة الائتمانية بمبلغ ${finalAmount.toLocaleString()} جنيه.`
    });
    setApprovingApp(null);
  };

  const handleQuickReject = async () => {
    if (!rejectingApp) return;
    const finalReason = selectedReason || 'عدم استيفاء الشروط والضوابط الائتمانية للشركة';
    await onUpdateStatus(rejectingApp.id, {
      status: ApplicationStatus.REJECTED,
      rejectionReason: finalReason,
      rejectionNotes: rejectionNotes.trim() || undefined
    });
    setRejectingApp(null);
    setSelectedReason('');
    setRejectionNotes('');
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.APPROVED:
      case ApplicationStatus.AMOUNT_TRANSFERRED:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> معتمد</span>;
      case ApplicationStatus.REJECTED:
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> مرفوض</span>;
      case ApplicationStatus.PAPER_REVIEW:
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> مراجعة المستندات</span>;
      case ApplicationStatus.ISCORE_CHECK:
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> استعلام آي سكور</span>;
      case ApplicationStatus.FIELD_INVESTIGATION:
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> استعلام ميداني</span>;
      case ApplicationStatus.CONTRACT_SIGNING:
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> توقيع العقود</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> طلب مستلم</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Section Switcher: New Applications vs Cases Workflow Tracking vs All */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setActiveSection('new_apps');
              setStatusFilter('ALL');
              onSubSectionChange?.('new_apps');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
              activeSection === 'new_apps'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{language === 'ar' ? 'الطلبات الواردة الجديدة' : 'New Applications'}</span>
            {newAppsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-black">
                {newAppsCount} جديد
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('tracking');
              setStatusFilter('ALL');
              onSubSectionChange?.('tracking');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
              activeSection === 'tracking'
                ? 'bg-crobsa-700 text-white font-black shadow-md shadow-crobsa-700/20'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{language === 'ar' ? 'متابعة الحالات وسير العمل' : 'Cases Workflow Tracking'}</span>
            {trackingCasesCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                {trackingCasesCount} جارية
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('all');
              setStatusFilter('ALL');
              onSubSectionChange?.('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
              activeSection === 'all'
                ? 'bg-slate-900 text-white font-black shadow-md'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>{language === 'ar' ? 'جميع الملفات' : 'All Files'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
              {applications.length}
            </span>
          </button>
        </div>

        {/* Section Context Guidance Banner */}
        {activeSection === 'new_apps' ? (
          <div className="p-3 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-200/80 text-amber-900 shrink-0 font-bold text-[10px]">جديد</span>
              <p>
                <strong>قسم الطلبات الجديدة الواردة:</strong> يتم توجيه طلب العميل تلقائياً لفرع الشركة في نفس محافظته، وعند النقر على <strong>"إسناد وتكليف"</strong> يتحول الطلب مباشرة لحالة قيد المتابعة والفحص الائتماني.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unassignedAppsCount > 0 && onAutoAssignBranches && canAssign && (
                <button
                  type="button"
                  onClick={async () => {
                    await onAutoAssignBranches();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>إسناد ذكي لجميع الطلبات حسب المحافظة ({unassignedAppsCount})</span>
                </button>
              )}
              <span className="text-[11px] font-bold text-amber-800 shrink-0 bg-white/80 px-2 py-1 rounded-md border border-amber-200">
                {newAppsCount} طلب بحاجة للمراجعة
              </span>
            </div>
          </div>
        ) : activeSection === 'tracking' ? (
          <div className="p-3 bg-sky-50/90 border border-sky-200 text-sky-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-sky-200/80 text-sky-900 shrink-0 font-bold text-[10px]">سير العمل</span>
              <p>
                <strong>قسم متابعة الحالات وسير العمل:</strong> متابعة مراحل الملف الائتماني للعميل (مراجعة المستندات ➔ آي سكور ➔ استعلام ميداني ➔ توقيع عقود ➔ اعتماد التمويل) مع إمكانية إضافة المناقشات والردود فوراً.
              </p>
            </div>
            <span className="text-[11px] font-bold text-sky-800 shrink-0 bg-white/70 px-2 py-1 rounded-md border border-sky-200">
              {trackingCasesCount} حالة قيد الفحص
            </span>
          </div>
        ) : null}
      </div>

      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عام بالاسم، الرقم القومي، الهاتف، رقم الطلب، الفرع، أو المهنة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500 font-sans"
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
            >
              <option value="ALL">جميع الحالات ({applications.length})</option>
              <option value={ApplicationStatus.RECEIVED}>طلب مستلم جديد ({applications.filter(a => a.status === ApplicationStatus.RECEIVED).length})</option>
              <option value={ApplicationStatus.APPROVED}>طلب معتمد ({applications.filter(a => a.status === ApplicationStatus.APPROVED).length})</option>
              <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة المستندات ({applications.filter(a => a.status === ApplicationStatus.PAPER_REVIEW).length})</option>
              <option value={ApplicationStatus.ISCORE_CHECK}>استعلام آي سكور ({applications.filter(a => a.status === ApplicationStatus.ISCORE_CHECK).length})</option>
              <option value={ApplicationStatus.FIELD_INVESTIGATION}>استعلام ميداني ({applications.filter(a => a.status === ApplicationStatus.FIELD_INVESTIGATION).length})</option>
              <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع العقود ({applications.filter(a => a.status === ApplicationStatus.CONTRACT_SIGNING).length})</option>
              <option value={ApplicationStatus.AMOUNT_TRANSFERRED}>تم صرف المبلغ ({applications.filter(a => a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length})</option>
              <option value={ApplicationStatus.REJECTED}>مرفوض ({applications.filter(a => a.status === ApplicationStatus.REJECTED).length})</option>
            </select>

            {/* Company Branch Filter */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pr-3 pl-7 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
              >
                <option value="ALL">جميع فروع الشركة</option>
                <option value="UNASSIGNED">قيد التوزيع (بدون فرع)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.governorate ? `(${b.governorate})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Governorate Filter */}
            {availableGovs.length > 0 && (
              <select
                value={governorateFilter}
                onChange={e => setGovernorateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
              >
                <option value="ALL">جميع المحافظات</option>
                {availableGovs.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            )}

            {/* Date / Advanced Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                showAdvancedFilters || datePreset !== 'ALL' || dateFrom || dateTo
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="تصفية حسب الفترة الزمنية"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>التاريخ</span>
            </button>

            {/* Urgency Toggle */}
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                urgentOnly 
                  ? 'bg-amber-500 text-amber-950 font-black shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${urgentOnly ? 'fill-amber-950 text-amber-950' : 'text-amber-500'}`} />
              طلبات معجلة فقط
            </button>

            {/* Archive State Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setArchiveFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  archiveFilter === 'ACTIVE' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                النشطة ({applications.filter(a => !a.isArchived).length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter('ARCHIVED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  archiveFilter === 'ARCHIVED' 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Archive className="h-3 w-3" />
                المؤرشفة ({applications.filter(a => a.isArchived).length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveFilter('ALL')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  archiveFilter === 'ALL' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                الكل
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Date Range Controls */}
        {(showAdvancedFilters || datePreset !== 'ALL' || dateFrom || dateTo) && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
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

              {/* Custom Date Inputs */}
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
            </div>
          </div>
        )}

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">الفلاتر النشطة:</span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                  بحث: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-sky-200">
                  الحالة: {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {branchFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-purple-200">
                  الفرع: {branchFilter === 'UNASSIGNED' ? 'قيد التوزيع' : (branches.find(b => b.id === branchFilter)?.name || branchFilter)}
                  <button onClick={() => setBranchFilter('ALL')} className="hover:text-rose-600">✕</button>
                </span>
              )}

              {governorateFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-2 py-0.5 rounded-lg text-[11px] font-bold border border-blue-200">
                  المحافظة: {governorateFilter}
                  <button onClick={() => setGovernorateFilter('ALL')} className="hover:text-rose-600">✕</button>
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
                  معجل
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

        {/* Metrics Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">عدد النتائج: <strong className="text-slate-900 font-bold">{filteredApps.length}</strong> طلب</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
            {applications.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length} معتمد
          </span>
          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
            {applications.filter(a => a.status === ApplicationStatus.REJECTED).length} مرفوض
          </span>
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
            {applications.filter(a => a.isUrgent).length} معجل بأولوية
          </span>
        </div>
      </div>

      {/* Applications List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredApps.length === 0 ? (
          activeSection === 'new_apps' && newAppsCount === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  تم إسناد وتوزيع كافة الطلبات الجديدة بنجاح!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  قائمة الطلبات الواردة الجديدة خالية حالياً. تم نقل وتحديث كافة الملفات إلى قسم متابعة الحالات وسير العمل للفحص الائتماني والاعتماد.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('tracking')}
                  className="inline-flex items-center gap-2 bg-crobsa-700 hover:bg-crobsa-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>متابعة الحالات وسير العمل ({trackingCasesCount})</span>
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('all');
                    handleResetFilters();
                  }}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>عرض كافة ملفات الشركة ({applications.length})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-4">
              <AlertCircle className="h-10 w-10 mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">لا توجد طلبات تمويل مطابقة لمعايير البحث الحالية</p>
                <p className="text-xs text-slate-400">
                  يوجد {applications.length} ملف مسجل للشركة، يمكنك إزالة الفلاتر للوصول لكافة الطلبات
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('all');
                  handleResetFilters();
                }}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors"
              >
                <span>إلغاء الفلاتر وعرض جميع الحالات ({applications.length})</span>
              </button>
            </div>
          )
        ) : (
          <>
            {/* Mobile App Cards View (تجربة تطبيق الهاتف المحمول) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredApps.map(app => {
                const isExpanded = expandedAppId === app.id;
                return (
                  <div key={`m-${app.id}`} className={`p-4 space-y-3.5 transition-colors ${app.isUrgent ? 'bg-amber-50/25' : 'hover:bg-slate-50/50'}`}>
                    {/* Header Row: ID, Urgency, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {app.id}
                        </span>
                        {app.isUrgent ? (
                          <span className="bg-amber-500 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Zap className="h-3 w-3 fill-amber-950" />
                            معجل
                          </span>
                        ) : (
                          <button
                            onClick={() => onExpedite(app.id)}
                            className="text-[10px] text-slate-400 hover:text-amber-600 font-bold flex items-center gap-1 bg-slate-100 hover:bg-amber-50 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Zap className="h-3 w-3" />
                            استعجال
                          </button>
                        )}
                      </div>
                      <div>{getStatusBadge(app.status)}</div>
                    </div>

                    {/* Client Information */}
                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-950 text-base sm:text-lg leading-tight truncate">{app.clientName}</h4>
                          <p className="text-xs text-slate-600 font-mono mt-1 font-bold">
                            الرقم القومي: <span className="text-slate-800">{app.clientNationalId || 'غير مسجل'}</span>
                          </p>
                        </div>
                        <span className="text-[11px] bg-slate-200/90 text-slate-800 font-black px-2.5 py-1 rounded-lg shrink-0">
                          {app.governorate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/70">
                        {app.phoneNumber ? (
                          <a 
                            href={`tel:${app.phoneNumber}`} 
                            className="text-sky-700 font-black flex items-center gap-1.5 hover:underline text-xs"
                            dir="ltr"
                          >
                            <Phone className="h-3.5 w-3.5 text-sky-600" />
                            <span>{app.phoneNumber}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">بدون هاتف</span>
                        )}
                        <span className="text-[11px] text-slate-500 font-bold">
                          {new Date(app.submittedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    {/* Financial Amount Comparison with Enlarged Numbers */}
                    <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50/60 to-sky-50/70 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-bold">المبلغ المطلوب:</span>
                          <span className="font-mono font-black text-slate-950 text-base sm:text-lg block mt-0.5">
                            {app.requestedAmount.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-emerald-800 block font-bold">المبلغ المعتمد:</span>
                          <span className="font-mono font-black text-emerald-700 text-base sm:text-lg block mt-0.5">
                            {app.approvedAmount ? `${app.approvedAmount.toLocaleString()} ج.م` : 'قيد الفحص'}
                          </span>
                        </div>
                      </div>

                      {/* Disbursed Amount Progress (صرف التمويل والمبلغ المصروف) */}
                      {app.approvedAmount ? (
                        <div className="pt-2 border-t border-slate-200/70 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-bold">
                              المصروف: <strong className="text-emerald-700 font-mono font-black">{(app.usedAmount || 0).toLocaleString()} ج.م</strong>
                            </span>
                            <span className="text-slate-500 font-bold">
                              المتبقي: <span className="font-mono text-slate-800">{Math.max(0, app.approvedAmount - (app.usedAmount || 0)).toLocaleString()} ج.م</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all" 
                              style={{ width: `${Math.min(100, Math.round(((app.usedAmount || 0) / app.approvedAmount) * 100))}%` }} 
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Branch & Officer Assignment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                        <div className="flex items-center gap-1.5 text-slate-700 truncate text-[11px]">
                          <Building2 className="h-3.5 w-3.5 text-crobsa-700 shrink-0" />
                          <span className="truncate">{app.assignedBranchName || 'تحت الإسناد - بانتظار تحديد فرع'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <UserCheck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                          <span className="font-bold text-slate-800 text-[11px]">
                            {app.assignedOfficerName ? app.assignedOfficerName.split(' ')[0] : (app.assignedBranchId ? 'إسناد عام' : 'غير مسند')}
                          </span>
                          {canAssign && (
                            <button
                              onClick={() => setAssigningApp(app)}
                              className="text-sky-600 hover:text-sky-800 p-1 bg-white rounded-md border border-slate-200 shadow-xs"
                              title="توجيه وتعيين الموظف"
                            >
                              <Compass className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Smart Branch Suggestion & 1-Click Assignment if not assigned yet */}
                      {!app.assignedBranchId && (() => {
                        const matchBranch = branches.find(b => normalizeGov(b.governorate) === normalizeGov(app.governorate)) || branches[0];
                        return (
                          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-950 truncate text-[11px]">
                              <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                              <div className="truncate">
                                <span className="font-black block text-xs">الحالة تحت الإسناد</span>
                                <span className="text-[10px] text-amber-800 truncate">
                                  {matchBranch ? `مطابقة المحافظة: فرع ${matchBranch.name}` : `محافظة ${app.governorate}`}
                                </span>
                              </div>
                            </div>
                            {canAssign && (
                              <button
                                type="button"
                                onClick={() => setAssigningApp(app)}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-xs flex items-center gap-1 transition-colors"
                              >
                                <Compass className="h-3.5 w-3.5" />
                                <span>إسناد الحالة</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Cases Tracking Workflow Stepper (Only in tracking view) */}
                    {activeSection === 'tracking' && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-crobsa-800">
                            <Compass className="h-3 w-3 text-crobsa-600" />
                            مسار دراسة ومتابعة الحالة:
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {app.status === ApplicationStatus.PAPER_REVIEW ? 'مرحلة 1 من 5' :
                             app.status === ApplicationStatus.ISCORE_CHECK ? 'مرحلة 2 من 5' :
                             app.status === ApplicationStatus.FIELD_INVESTIGATION ? 'مرحلة 3 من 5' :
                             app.status === ApplicationStatus.APPROVED ? 'مرحلة 4 من 5' :
                             app.status === ApplicationStatus.CONTRACT_SIGNING ? 'مرحلة 5 من 5' : 'مكتمل'}
                          </span>
                        </div>

                        {/* Visual Stage Dots / Bar */}
                        <div className="grid grid-cols-5 gap-1">
                          {[
                            { id: ApplicationStatus.PAPER_REVIEW, label: 'أوراق' },
                            { id: ApplicationStatus.ISCORE_CHECK, label: 'ائتمان' },
                            { id: ApplicationStatus.FIELD_INVESTIGATION, label: 'استعلام' },
                            { id: ApplicationStatus.APPROVED, label: 'موافقة' },
                            { id: ApplicationStatus.CONTRACT_SIGNING, label: 'تنفيذ' },
                          ].map((step, idx) => {
                            const stageOrder = [
                              ApplicationStatus.RECEIVED,
                              ApplicationStatus.PAPER_REVIEW,
                              ApplicationStatus.ISCORE_CHECK,
                              ApplicationStatus.FIELD_INVESTIGATION,
                              ApplicationStatus.APPROVED,
                              ApplicationStatus.CONTRACT_SIGNING,
                              ApplicationStatus.AMOUNT_TRANSFERRED
                            ];
                            const currIdx = stageOrder.indexOf(app.status);
                            const stepIdx = stageOrder.indexOf(step.id);
                            const isDone = currIdx >= stepIdx;
                            const isCurrent = app.status === step.id;

                            return (
                              <div key={step.id} className="text-center">
                                <div className={`h-1.5 rounded-full transition-colors ${
                                  isCurrent ? 'bg-sky-600 ring-2 ring-sky-300' : isDone ? 'bg-emerald-500' : 'bg-slate-200'
                                }`} />
                                <span className={`text-[9px] block mt-1 truncate ${
                                  isCurrent ? 'font-black text-sky-700' : isDone ? 'text-slate-700 font-semibold' : 'text-slate-400'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Customer Comments & Discussions Preview Snippet */}
                    {app.comments && app.comments.length > 0 && (() => {
                      const latest = app.comments[app.comments.length - 1];
                      return (
                        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 text-xs text-amber-950 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-amber-600" />
                              آخر ملاحظة: {latest.authorName}
                            </span>
                            <span className="text-[10px] text-amber-700 font-mono">
                              {new Date(latest.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2 text-slate-700 font-normal">
                            {latest.text}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'comments') {
                            setInlineFollowupAppId(null);
                          } else {
                            setInlineFollowupAppId(app.id);
                            setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'comments' }));
                          }
                        }}
                        className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'comments'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : (app.comments?.length || 0) > 0 
                              ? 'bg-amber-50 text-amber-900 border border-amber-300' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>متابعة ({app.comments?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'documents') {
                            setInlineFollowupAppId(null);
                          } else {
                            setInlineFollowupAppId(app.id);
                            setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'documents' }));
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                          inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'documents'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : (app.documents?.length || 0) > 0 
                              ? 'bg-blue-50 text-blue-900 border border-blue-300' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>مستندات ({app.documents?.length || 0})</span>
                      </button>

                      {/* إذا كانت الحالة طلباً جديداً وارداً: يلزم الإسناد والتكليف أولاً لبدء مسار العمل */}
                      {isNewIncomingApp(app) ? (
                        canAssign ? (
                          <button
                            type="button"
                            onClick={() => setAssigningApp(app)}
                            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-black py-2 px-3 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Compass className="h-3.5 w-3.5" />
                            <span>إسناد وتكليف الحالة أولاً</span>
                          </button>
                        ) : (
                          <div className="flex-1 text-center py-2 text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 rounded-xl">
                            بانتظار الإسناد من الإدارة
                          </div>
                        )
                      ) : (
                        <>
                          {/* زر صرف التمويل وتسجيل المبلغ المصروف (للإدارة أو مدير الفرع) */}
                          {canDisburse && (app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.CONTRACT_SIGNING || app.status === ApplicationStatus.AMOUNT_TRANSFERRED || (app.approvedAmount && app.approvedAmount > 0)) && (
                            <button
                              type="button"
                              onClick={() => setDisbursingApp(app)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 shrink-0 animate-in fade-in"
                              title="صرف التمويل وتسجيل المبلغ المصروف للعميل"
                            >
                              <Wallet className="h-3.5 w-3.5" />
                              <span>صرف التمويل</span>
                            </button>
                          )}

                          {app.status !== ApplicationStatus.APPROVED && (
                            <button
                              type="button"
                              onClick={() => {
                                setApprovingApp(app);
                                setApprovedAmountInput(app.requestedAmount);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs"
                            >
                              موافقة
                            </button>
                          )}

                          {app.status !== ApplicationStatus.REJECTED && (
                            <button
                              type="button"
                              onClick={() => setRejectingApp(app)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs"
                            >
                              رفض
                            </button>
                          )}
                        </>
                      )}

                      {app.isArchived ? (
                        <button
                          type="button"
                          onClick={() => unarchiveApplication(app.id)}
                          className="p-2 rounded-xl border border-slate-300 bg-slate-200 text-slate-800 hover:bg-slate-300 text-xs font-bold flex items-center gap-1"
                          title="استعادة من الأرشيف"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveApplication(app.id, app.status === ApplicationStatus.REJECTED ? 'طلب مرفوض' : 'أرشفة يدوية')}
                          className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800"
                          title="أرشفة الطلب"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        title="تفاصيل الاستبيان"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* INLINE CASE TRACKING & FOLLOW-UP (متابعة بسيطة في نفس الصفحة دون فتح بوب أب) */}
                    {inlineFollowupAppId === app.id && (
                      <div className="pt-3 border-t border-slate-200 animate-in fade-in space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'comments' }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                (inlineFollowupTab[app.id] || 'comments') === 'comments'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              الملاحظات ({app.comments?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'documents' }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                inlineFollowupTab[app.id] === 'documents'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              المستندات ({app.documents?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'workflow' }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                inlineFollowupTab[app.id] === 'workflow'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              المسار
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInlineFollowupAppId(null)}
                            className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-0.5"
                          >
                            ✕ إغلاق
                          </button>
                        </div>

                        {/* Comments */}
                        {(inlineFollowupTab[app.id] || 'comments') === 'comments' && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="اكتب ملاحظة أو قرار متابعة..."
                                value={inlineCommentMap[app.id] || ''}
                                onChange={e => setInlineCommentMap(prev => ({ ...prev, [app.id]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSendInlineComment(app.id);
                                  }
                                }}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
                              />
                              <button
                                type="button"
                                disabled={!inlineCommentMap[app.id]?.trim() || isSubmittingCommentMap[app.id]}
                                onClick={() => handleSendInlineComment(app.id)}
                                className="bg-crobsa-700 hover:bg-crobsa-800 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                              >
                                <Send className="h-3 w-3" />
                                <span>إرسال</span>
                              </button>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 scrollbar-thin">
                              {(!app.comments || app.comments.length === 0) ? (
                                <p className="text-center text-xs text-slate-400 py-3">لا توجد ملاحظات مسجلة بعد. اكتب أول ملاحظة أعلاه.</p>
                              ) : (
                                app.comments.map(c => (
                                  <div key={c.id} className="p-2 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                      <span className="text-slate-900 font-bold">{c.authorName}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {new Date(c.timestamp || (c as any).createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(c.timestamp || (c as any).createdAt).toLocaleDateString('ar-EG')}
                                      </span>
                                    </div>
                                    <p className="text-slate-800 leading-relaxed font-normal">{c.message || (c as any).text}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {inlineFollowupTab[app.id] === 'documents' && (
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {(!app.documents || app.documents.length === 0) ? (
                              <p className="text-center text-xs text-slate-400 py-2">لم يتم رفع مستندات مرفقة لهذا الطلب بعد.</p>
                            ) : (
                              app.documents.map((docItem, dIdx) => (
                                <div key={dIdx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                    <span className="font-bold text-slate-800 truncate text-[11px]">{docItem.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] text-slate-400 font-mono">{docItem.size || 'ملف'}</span>
                                    {docItem.fileUrl && (
                                      <a
                                        href={docItem.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-600 hover:text-sky-800 p-1 bg-sky-50 rounded font-bold text-[10px]"
                                      >
                                        معاينة
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Workflow */}
                        {inlineFollowupTab[app.id] === 'workflow' && (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <p className="text-[11px] font-bold text-slate-700">تغيير مرحلة الحالة بنقرة واحدة مباشرة:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {[
                                { id: ApplicationStatus.PAPER_REVIEW, label: 'فحص المستندات', color: 'bg-sky-50 text-sky-800 border-sky-200' },
                                { id: ApplicationStatus.ISCORE_CHECK, label: 'استعلام I-Score', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                                { id: ApplicationStatus.FIELD_INVESTIGATION, label: 'استعلام ميداني', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                                { id: ApplicationStatus.APPROVED, label: 'موافقة ائتمانية', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                { id: ApplicationStatus.CONTRACT_SIGNING, label: 'توقيع العقود', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                                { id: ApplicationStatus.AMOUNT_TRANSFERRED, label: 'صرف التمويل', color: 'bg-teal-50 text-teal-800 border-teal-200' }
                              ].map(st => {
                                const isCurrent = app.status === st.id;
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={async () => {
                                      await onUpdateStatus(app.id, {
                                        status: st.id,
                                        approvedAmount: st.id === ApplicationStatus.APPROVED && !app.approvedAmount ? app.requestedAmount : app.approvedAmount
                                      });
                                    }}
                                    className={`p-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                                      isCurrent 
                                        ? 'ring-2 ring-slate-900 bg-slate-900 text-white shadow-xs font-black' 
                                        : `${st.color} hover:shadow-xs`
                                    }`}
                                  >
                                    <span>{st.label}</span>
                                    {isCurrent && <span className="block text-[9px] mt-0.5 font-bold">● الحالي</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile Expanded Questionnaire Details */}
                    {isExpanded && (
                      <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1">
                          <FileCheck className="h-3.5 w-3.5 text-crobsa-700" />
                          إجابات الاستبيان الميداني
                        </p>
                        {app.dynamicAnswers && Object.keys(app.dynamicAnswers).length > 0 ? (
                          <div className="space-y-1.5">
                            {Object.entries(app.dynamicAnswers).map(([k, val]) => (
                              <div key={k} className="flex justify-between bg-white p-2 rounded-lg border border-slate-200/60">
                                <span className="text-slate-500">{k}:</span>
                                <span className="font-bold text-slate-800">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-[11px] py-1">لا توجد إجابات استبيان مخصصة</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                  <th className="px-4 py-3.5">الطلب والأولوية</th>
                  <th className="px-4 py-3.5">بيانات العميل</th>
                  <th className="px-4 py-3.5">المبلغ المطلوب / المعتمد</th>
                  <th className="px-4 py-3.5">مسؤول الائتمان</th>
                  <th className="px-4 py-3.5">حالة الطلب</th>
                  <th className="px-4 py-3.5 text-center">المناقشة والمستندات</th>
                  <th className="px-4 py-3.5 text-center">الإجراءات والقرار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map(app => {
                  const isExpanded = expandedAppId === app.id;
                  return (
                    <React.Fragment key={app.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${app.isUrgent ? 'bg-amber-50/30' : ''}`}>
                        {/* ID and Urgency */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-slate-900 block">{app.id}</span>
                            {app.isUrgent ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500 text-amber-950 font-black px-2 py-0.5 rounded-md text-[10px] animate-pulse">
                                <Zap className="h-3 w-3 fill-amber-950" />
                                معجل
                              </span>
                            ) : (
                              <button
                                onClick={() => onExpedite(app.id)}
                                className="text-[10px] text-slate-400 hover:text-amber-600 font-bold flex items-center gap-0.5"
                                title="تحديد الطلب كعاجل"
                              >
                                <Zap className="h-2.5 w-2.5" />
                                استعجال
                              </button>
                            )}
                            <p className="text-[10px] text-slate-400">
                              {new Date(app.submittedAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </td>

                        {/* Client details */}
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-black text-slate-900 text-sm">{app.clientName}</p>
                            <p className="font-mono text-slate-400 text-[11px]">{app.clientNationalId}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-slate-400" /> {app.governorate}</span>
                              {app.phoneNumber && (
                                <span className="flex items-center gap-0.5"><Phone className="h-3 w-3 text-slate-400" /> {app.phoneNumber}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Finance Details */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <p className="font-mono font-black text-slate-900 text-sm">
                              {app.requestedAmount.toLocaleString()} جنيه
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {app.financeType === 'INSTALLMENT' ? 'تقسيط' : 'آجل'} • {app.durationMonths} شهر
                            </p>
                            {app.approvedAmount ? (
                              <div className="space-y-1 pt-0.5">
                                <span className="inline-block text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black border border-emerald-200">
                                  المعتمد: {app.approvedAmount.toLocaleString()} ج.م
                                </span>
                                <div className="text-[10px] text-slate-600 font-bold flex items-center justify-between gap-1">
                                  <span>المصروف: {(app.usedAmount || 0).toLocaleString()} ج.م</span>
                                  <span className="text-emerald-700 font-mono">
                                    {Math.round(((app.usedAmount || 0) / app.approvedAmount) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all" 
                                    style={{ width: `${Math.min(100, Math.round(((app.usedAmount || 0) / app.approvedAmount) * 100))}%` }} 
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* Branch & Officer Assignment based on Governorate */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5">
                            {app.assignedBranchName ? (
                              <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-2 text-xs">
                                <div className="flex items-center gap-1 text-sky-900 font-bold text-[11px] truncate">
                                  <Building2 className="h-3 w-3 text-sky-600 shrink-0" />
                                  <span className="truncate">{app.assignedBranchName}</span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-slate-600">
                                  <span className="font-semibold truncate">
                                    {app.assignedOfficerName || (app.assignedBranchId ? 'الفرع عام (قيد التوزيع)' : 'مسؤول الائتمان')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setAssigningApp(app)}
                                    className="text-sky-600 hover:text-sky-800 font-bold text-[10px] underline shrink-0"
                                  >
                                    تغيير
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse shrink-0" />
                                  <span>تحت الإسناد ({app.governorate})</span>
                                </div>
                                {canAssign && (
                                  <button
                                    type="button"
                                    onClick={() => setAssigningApp(app)}
                                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black py-1.5 px-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1"
                                    title="إسناد الحالة للفرع ومسؤول الائتمان"
                                  >
                                    <Compass className="h-3 w-3" />
                                    <span>إسناد الحالة</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status with Quick Transition */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1.5">
                            <div>{getStatusBadge(app.status)}</div>
                            {isNewIncomingApp(app) ? (
                              <div className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md font-bold">
                                <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                                <span>يلزم الإسناد أولاً</span>
                              </div>
                            ) : (
                              <select
                                value={app.status}
                                onChange={e => {
                                  const newSt = e.target.value as ApplicationStatus;
                                  if (newSt === ApplicationStatus.APPROVED) {
                                    setApprovingApp(app);
                                    setApprovedAmountInput(app.requestedAmount);
                                  } else if (newSt === ApplicationStatus.REJECTED) {
                                    setRejectingApp(app);
                                  } else {
                                    onUpdateStatus(app.id, { status: newSt });
                                  }
                                }}
                                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] font-bold text-slate-600 hover:border-crobsa-400"
                              >
                                <option value={ApplicationStatus.RECEIVED}>مستلم جديد</option>
                                <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة المستندات</option>
                                <option value={ApplicationStatus.ISCORE_CHECK}>استعلام آي سكور</option>
                                <option value={ApplicationStatus.FIELD_INVESTIGATION}>استعلام ميداني</option>
                                <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع العقود</option>
                                <option value={ApplicationStatus.APPROVED}>موافقة نهائية</option>
                                <option value={ApplicationStatus.REJECTED}>رفض الطلب</option>
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Discussions & Docs triggers */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Comments Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'comments') {
                                  setInlineFollowupAppId(null);
                                } else {
                                  setInlineFollowupAppId(app.id);
                                  setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'comments' }));
                                }
                              }}
                              className={`relative p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                                inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'comments'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : (app.comments?.length || 0) > 0 
                                    ? 'bg-crobsa-50 text-crobsa-800 border-crobsa-300 hover:bg-crobsa-100' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="مناقشة واستفسارات الحالة"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>{app.comments?.length || 0}</span>
                            </button>

                            {/* Docs Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'documents') {
                                  setInlineFollowupAppId(null);
                                } else {
                                  setInlineFollowupAppId(app.id);
                                  setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'documents' }));
                                }
                              }}
                              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                                inlineFollowupAppId === app.id && inlineFollowupTab[app.id] === 'documents'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : (app.documents?.length || 0) > 0
                                    ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="المستندات والمرفقات"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              <span>{app.documents?.length || 0}</span>
                            </button>

                            {/* Details toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                              className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                              title="عرض التفاصيل الإضافية"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>

                        {/* Actions buttons */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {isNewIncomingApp(app) ? (
                              canAssign ? (
                                <button
                                  type="button"
                                  onClick={() => setAssigningApp(app)}
                                  className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                                  title="إسناد وتكليف الحالة لفرع وموظف ائتمان لبدء العمل"
                                >
                                  <Compass className="h-3.5 w-3.5" />
                                  <span>إسناد الحالة أولاً</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">بانتظار الإسناد والتكليف</span>
                              )
                            ) : (
                              <>
                                {/* زر صرف التمويل وتسجيل المبلغ المصروف (للإدارة أو مدير الفرع) */}
                                {canDisburse && (app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.CONTRACT_SIGNING || app.status === ApplicationStatus.AMOUNT_TRANSFERRED || (app.approvedAmount && app.approvedAmount > 0)) && (
                                  <button
                                    onClick={() => setDisbursingApp(app)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 shrink-0 animate-in fade-in transition-colors"
                                    title="صرف التمويل وتسجيل المبلغ المصروف للعميل"
                                  >
                                    <Wallet className="h-3 w-3" />
                                    <span>صرف التمويل</span>
                                  </button>
                                )}

                                {app.status !== ApplicationStatus.APPROVED && (
                                  <button
                                    onClick={() => {
                                      setApprovingApp(app);
                                      setApprovedAmountInput(app.requestedAmount);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                                    title="موافقة على الطلب"
                                  >
                                    موافقة
                                  </button>
                                )}

                                {app.status !== ApplicationStatus.REJECTED && (
                                  <button
                                    onClick={() => setRejectingApp(app)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm"
                                    title="رفض الطلب"
                                  >
                                    رفض
                                  </button>
                                )}
                              </>
                            )}

                            {/* Archive / Unarchive Action */}
                            {app.isArchived ? (
                              <button
                                type="button"
                                onClick={() => unarchiveApplication(app.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-slate-300"
                                title="استعادة الطلب من الأرشيف"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>استعادة</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => archiveApplication(app.id, app.status === ApplicationStatus.REJECTED ? 'طلب مرفوض' : 'أرشفة يدوية')}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="أرشفة الطلب لتنظيف قاعدة البيانات"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Desktop Inline Follow-up Row (متابعة الحالات في نفس الصفحة دون فتح بوب أب) */}
                      {inlineFollowupAppId === app.id && (
                        <tr className="bg-slate-50/95 border-b border-slate-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                              {/* Sub-tabs header */}
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'comments' }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                      (inlineFollowupTab[app.id] || 'comments') === 'comments'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    سجل الملاحظات والمناقشة ({app.comments?.length || 0})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'documents' }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                      inlineFollowupTab[app.id] === 'documents'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    المستندات المرفوعة ({app.documents?.length || 0})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInlineFollowupTab(prev => ({ ...prev, [app.id]: 'workflow' }))}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                      inlineFollowupTab[app.id] === 'workflow'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    التحكم بمراحل المسار
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setInlineFollowupAppId(null)}
                                  className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1"
                                >
                                  ✕ إغلاق
                                </button>
                              </div>

                              {/* Comments Tab */}
                              {(inlineFollowupTab[app.id] || 'comments') === 'comments' && (
                                <div className="space-y-3">
                                  {/* Notification Type Selector */}
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                                      <Bell className="h-3.5 w-3.5 text-crobsa-700" />
                                      <span>اختر نوع الإشعار بناءً على محتوى التعليق:</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                                      {(Object.keys(COMMENT_NOTIFICATION_CONFIG) as CommentNotificationType[]).map(tKey => {
                                        const cfg = COMMENT_NOTIFICATION_CONFIG[tKey];
                                        const isSelected = (inlineCommentTypeMap[app.id] || 'GENERAL') === tKey;
                                        return (
                                          <button
                                            key={tKey}
                                            type="button"
                                            onClick={() => {
                                              setInlineCommentTypeMap(prev => ({ ...prev, [app.id]: tKey }));
                                              if (tKey === 'URGENT_INQUIRY' || tKey === 'WARNING_ALERT') {
                                                setInlineUrgentMap(prev => ({ ...prev, [app.id]: true }));
                                              }
                                            }}
                                            className={`p-1.5 rounded-xl border text-right text-[11px] transition-all flex items-center justify-between gap-1 ${
                                              isSelected
                                                ? `${cfg.badgeBg} ${cfg.borderColor} ring-2 ring-crobsa-500/50 shadow-2xs font-black ${cfg.badgeText}`
                                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                                            }`}
                                          >
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`}></span>
                                              <span className="truncate text-[10px]">{cfg.labelAr}</span>
                                            </div>
                                            {isSelected && <Check className="h-3 w-3 text-crobsa-700 shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="اكتب ملاحظة أو استفسار متابعة للطلب..."
                                      value={inlineCommentMap[app.id] || ''}
                                      onChange={e => setInlineCommentMap(prev => ({ ...prev, [app.id]: e.target.value }))}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSendInlineComment(app.id);
                                        }
                                      }}
                                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500 font-sans"
                                    />
                                    <button
                                      type="button"
                                      disabled={!inlineCommentMap[app.id]?.trim() || isSubmittingCommentMap[app.id]}
                                      onClick={() => handleSendInlineComment(app.id)}
                                      className="bg-crobsa-700 hover:bg-crobsa-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                      <span>إرسال التعليق</span>
                                    </button>
                                  </div>

                                  {/* Recipients Note */}
                                  <div className="bg-sky-50/70 border border-sky-200/70 rounded-xl p-2 px-3 flex items-center gap-2 text-[10px] text-sky-900">
                                    <Bell className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                    <span>
                                      <strong>أطراف الإشعار:</strong> سيصل إشعار بنوع <strong className="text-sky-950">({COMMENT_NOTIFICATION_CONFIG[inlineCommentTypeMap[app.id] || 'GENERAL'].labelAr})</strong> إلى: <strong>الموظف مقدم الطلب</strong> • <strong>مدير شركة التقسيط</strong> • <strong>مدير النظام</strong>.
                                    </span>
                                  </div>

                                  <div className="max-h-56 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 scrollbar-thin">
                                    {(!app.comments || app.comments.length === 0) ? (
                                      <p className="text-center text-xs text-slate-400 py-3">لا توجد ملاحظات مسجلة بعد. اكتب أول ملاحظة أعلاه.</p>
                                    ) : (
                                      app.comments.map(c => {
                                        const cNotifConfig = c.notificationType ? COMMENT_NOTIFICATION_CONFIG[c.notificationType] : null;
                                        return (
                                          <div key={c.id} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-slate-900 font-bold">{c.senderName || (c as any).authorName}</span>
                                                {cNotifConfig && (
                                                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border ${cNotifConfig.badgeBg} ${cNotifConfig.badgeText} ${cNotifConfig.borderColor}`}>
                                                    {cNotifConfig.labelAr}
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                {new Date(c.createdAt || (c as any).timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(c.createdAt || (c as any).timestamp).toLocaleDateString('ar-EG')}
                                              </span>
                                            </div>
                                            <p className="text-slate-800 leading-relaxed font-normal">{c.message || (c as any).text}</p>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Documents Tab */}
                              {inlineFollowupTab[app.id] === 'documents' && (
                                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                  {(!app.documents || app.documents.length === 0) ? (
                                    <p className="text-center text-xs text-slate-400 py-3">لم يتم رفع مستندات مرفقة لهذا الطلب بعد.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {app.documents.map((docItem, dIdx) => (
                                        <div key={dIdx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                                          <div className="flex items-center gap-2 truncate">
                                            <FileText className="h-4 w-4 text-sky-600 shrink-0" />
                                            <span className="font-bold text-slate-800 truncate">{docItem.name}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] text-slate-400 font-mono">{docItem.size || 'ملف'}</span>
                                            {docItem.fileUrl && (
                                              <a
                                                href={docItem.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 hover:text-sky-800 p-1 bg-sky-50 rounded-md font-bold text-[10px]"
                                              >
                                                معاينة
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Workflow Tab */}
                              {inlineFollowupTab[app.id] === 'workflow' && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                  {isNewIncomingApp(app) ? (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <span>يلزم إسناد وتكليف الحالة للفرع ومسؤول الائتمان أولاً قبل التمكن من تحريك وتغيير مراحل سير العمل.</span>
                                      </div>
                                      {canAssign && (
                                        <button
                                          type="button"
                                          onClick={() => setAssigningApp(app)}
                                          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                                        >
                                          <Compass className="h-3.5 w-3.5" />
                                          <span>إسناد الحالة الآن</span>
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-xs font-bold text-slate-700">تغيير مرحلة الحالة بنقرة واحدة مباشرة:</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                        {[
                                          { id: ApplicationStatus.PAPER_REVIEW, label: 'فحص المستندات', color: 'bg-sky-50 text-sky-800 border-sky-200' },
                                          { id: ApplicationStatus.ISCORE_CHECK, label: 'استعلام I-Score', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
                                          { id: ApplicationStatus.FIELD_INVESTIGATION, label: 'استعلام ميداني', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                                          { id: ApplicationStatus.APPROVED, label: 'موافقة ائتمانية', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                                          { id: ApplicationStatus.CONTRACT_SIGNING, label: 'توقيع العقود', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                                          { id: ApplicationStatus.AMOUNT_TRANSFERRED, label: 'صرف التمويل', color: 'bg-teal-50 text-teal-800 border-teal-200' }
                                        ].map(st => {
                                          const isCurrent = app.status === st.id;
                                          return (
                                            <button
                                              key={st.id}
                                              type="button"
                                              onClick={async () => {
                                                await onUpdateStatus(app.id, {
                                                  status: st.id,
                                                  approvedAmount: st.id === ApplicationStatus.APPROVED && !app.approvedAmount ? app.requestedAmount : app.approvedAmount
                                                });
                                              }}
                                              className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                                                isCurrent 
                                                  ? 'ring-2 ring-slate-900 bg-slate-900 text-white shadow-xs font-black' 
                                                  : `${st.color} hover:shadow-xs`
                                              }`}
                                            >
                                              <span>{st.label}</span>
                                              {isCurrent && <span className="block text-[9px] mt-0.5 font-bold">● الحالي</span>}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expanded Row for Dynamic Questionnaire Answers and Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Dynamic Questionnaire Answers */}
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                                  <HelpCircle className="h-4 w-4 text-crobsa-700" />
                                  إجابات الاستبيان المخصص للطلب
                                </h4>
                                {app.customAnswers && Object.keys(app.customAnswers).length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2.5">
                                    {Object.entries(app.customAnswers).map(([k, v]) => (
                                      <div key={k} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <p className="text-slate-400 text-[10px] font-bold">
                                          {k === 'land_area' ? 'المساحة المزروعة (فدان)' :
                                           k === 'crop_type' ? 'نوع المحصول والنشاط' :
                                           k === 'has_irrigation' ? 'توفر نظام ري متطور' :
                                           k === 'commercial_reg' ? 'رقم السجل التجاري / الحيازة' : k}
                                        </p>
                                        <p className="text-slate-900 font-bold text-xs mt-0.5">
                                          {typeof v === 'boolean' ? (v ? 'نعم' : 'لا') : String(v || 'غير محدد')}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-400 text-xs italic">لا توجد إجابات استبيان مخصص مسجلة لهذا الطلب.</p>
                                )}
                              </div>

                              {/* Document and Notes Info */}
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
                                  <Paperclip className="h-4 w-4 text-blue-700" />
                                  وثائق وملاحظات المعاينة
                                </h4>
                                {app.description && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400">ملاحظات التقديم:</p>
                                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                                      {app.description}
                                    </p>
                                  </div>
                                )}
                                {app.rejectionReason && (
                                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                                    <p className="text-rose-800 font-black text-xs">سبب الرفض: {app.rejectionReason}</p>
                                    {app.rejectionNotes && (
                                      <p className="text-rose-700 text-[11px] mt-1 italic">{app.rejectionNotes}</p>
                                    )}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDocModalData({
                                        document: {
                                          name: `ملف مستندات الطلب الرسمي - ${app.clientName}`,
                                          url: (app.documents && app.documents[0]?.fileUrl) || app.documentLink || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
                                          size: '2.4 MB',
                                          type: 'image/jpeg'
                                        },
                                        clientName: app.clientName
                                      })}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-sky-600" />
                                      <span>استعراض ملفات ومستندات العميل بالبوابة</span>
                                    </button>

                                    {app.documents && app.documents.length > 0 && (
                                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-lg">
                                        {app.documents.length} ملفات مؤرشفة
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => onOpenDiscussion(app, 'comments')}
                                    className="bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    فتح شاشة المناقشة الكاملة
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>

      {/* Approve Modal */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-emerald-800 text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                الموافقة الائتمانية على الطلب
              </h3>
              <button
                onClick={() => setApprovingApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 text-sm">{approvingApp.clientName}</p>
                <p className="text-slate-500 font-mono mt-0.5">طلب رقم: {approvingApp.id}</p>
                <p className="text-slate-600 mt-1">المبلغ المطلوب: {approvingApp.requestedAmount.toLocaleString()} جنيه</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">الحد الائتماني المعتمد (جنيه):</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                  <input
                    type="number"
                    value={approvedAmountInput || ''}
                    onChange={e => setApprovedAmountInput(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-emerald-300 rounded-xl p-2.5 pl-10 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder={approvingApp.requestedAmount.toString()}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleQuickApprove}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                تأكيد الموافقة وصرف الحد
              </button>
              <button
                onClick={() => setApprovingApp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-rose-800 text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                تسجيل رفض طلب التمويل
              </h3>
              <button
                onClick={() => setRejectingApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 text-sm">{rejectingApp.clientName}</p>
                <p className="text-slate-500 font-mono mt-0.5">طلب رقم: {rejectingApp.id}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">سبب الرفض المعتمد:</label>
                <select
                  value={selectedReason}
                  onChange={e => setSelectedReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">-- اختر من أسباب الرفض المعتمدة للشركة --</option>
                  {rejectionReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="العميل مدرج في القائمة السلبية I-Score">العميل مدرج في القائمة السلبية I-Score</option>
                  <option value="تجاوز الحد الأقصى لنسبة عبء الدين DBR">تجاوز الحد الأقصى لنسبة عبء الدين DBR</option>
                  <option value="المستندات الزراعية والحيازة غير كافية">المستندات الزراعية والحيازة غير كافية</option>
                  <option value="نتيجة الاستعلام الميداني سلبية">نتيجة الاستعلام الميداني سلبية</option>
                  <option value="عدم مطابقة بيانات الضامن أو محل الإقامة">عدم مطابقة بيانات الضامن أو محل الإقامة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">ملاحظات إضافية وتوصيات مسؤولي الائتمان:</label>
                <textarea
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  placeholder="اكتب توضيحاً تفصيلياً لسبب الرفض لإفادة العميل وكروبسا..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleQuickReject}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-colors"
              >
                تأكيد الرفض النهائي
              </button>
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Case Assignment Modal (Governorate & Branch-based) */}
      {assigningApp && (
        <SmartCaseAssignmentModal
          application={assigningApp}
          branches={branches}
          staffList={staffList}
          onAssign={async (branchId, branchName, officerId, officerName) => {
            if (onAssignBranchAndOfficer) {
              await onAssignBranchAndOfficer(assigningApp.id, branchId, branchName, officerId, officerName);
            } else {
              await onAssignOfficer(assigningApp.id, officerId, officerName);
            }
            setAssigningApp(null);
            if (activeSection === 'new_apps') {
              setActiveSection('tracking');
              setStatusFilter('ALL');
              onSubSectionChange?.('tracking');
            }
          }}
          onClose={() => setAssigningApp(null)}
        />
      )}

      {/* Internal Document Viewer Modal (No external drive redirect) */}
      {docModalData && (
        <InternalDocViewerModal
          document={docModalData.document}
          clientName={docModalData.clientName}
          onClose={() => setDocModalData(null)}
        />
      )}

      {/* Disbursement Modal (صرف التمويل وتسجيل المبلغ المصروف) */}
      {disbursingApp && (
        <DisbursementModal
          application={disbursingApp}
          onClose={() => setDisbursingApp(null)}
          onSuccess={() => setDisbursingApp(null)}
        />
      )}
    </div>
  );
};
