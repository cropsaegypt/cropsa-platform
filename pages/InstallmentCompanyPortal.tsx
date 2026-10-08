import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/Store';
import { 
  Role, 
  InstallmentCompanyStaffRole, 
  ApplicationStatus, 
  Application,
  Client, 
  EGYPT_GOVERNORATES, 
  AiCreditAnalysis,
  CompanyBranch,
  User
} from '../types';
import { 
  Building2, 
  Users, 
  FileText, 
  ShieldCheck, 
  PieChart as PieIcon, 
  Clock, 
  Sparkles, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Printer, 
  Lock, 
  Unlock, 
  Send, 
  MapPin, 
  Phone, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet, 
  FolderLock, 
  Eye, 
  PlusCircle,
  HelpCircle,
  Briefcase,
  Settings,
  ChevronDown,
  MessageSquare,
  Paperclip,
  Bell,
  Zap,
  ArrowRightLeft,
  ArrowLeftRight,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Check,
  X,
  Camera,
  BarChart3,
  Image as ImageIcon,
  KeyRound,
  Copy,
  Edit3,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Save,
  Archive,
  RefreshCw,
  Star,
  Award,
  Upload,
  Compass,
  Layers
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { ClientTimelineModal } from '../components/ClientTimelineModal';
import { CaseDiscussionModal } from '../components/CaseDiscussionModal';
import { SmartCaseAssignmentModal } from '../components/SmartCaseAssignmentModal';
import { CompanyApplicationsTab } from '../components/CompanyApplicationsTab';
import { CompanyBrandingModal } from '../components/CompanyBrandingModal';
import { CompanyProfileSettingsModal } from '../components/CompanyProfileSettingsModal';
import { CompanyWorkflowSettings } from '../components/CompanyWorkflowSettings';
import { CompanyExcelImport } from './CompanyExcelImport';
import { ClientFollowUpModal } from '../components/ClientFollowUpModal';
import { ComprehensiveAnalyticsSection } from '../components/ComprehensiveAnalyticsSection';
import { SmartCreditCalculator } from '../components/SmartCreditCalculator';
import { runClientCreditAiAnalysis } from '../services/gemini';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export interface InstallmentCompanyPortalProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const InstallmentCompanyPortal: React.FC<InstallmentCompanyPortalProps> = ({ initialTab, onTabChange }) => {
  const { 
    currentUser, 
    currentCompany, 
    companies, 
    branches, 
    applications, 
    clients, 
    clientRequests, 
    sharedDocuments, 
    users, 
    requestClientAccess, 
    createCompanyStaff, 
    createBranch, 
    updateBranch,
    deleteBranch,
    updateStaffPassword,
    changePassword,
    addSharedDocument, 
    saveAiAnalysis, 
    updateCompanyRejectionReasons,
    updateApplication,
    archiveApplication,
    unarchiveApplication,
    autoArchiveApplications,
    assignCompanyOfficer,
    assignCompanyBranchAndOfficer,
    autoAssignCompanyBranches,
    addApplicationComment,
    reviewBranchTransfer,
    updateCompany,
    updateUserProfile,
    expediteApplication,
    pendingNavigation,
    notifications,
    markNotificationRead,
    addNotification,
    t, 
    language 
  } = useStore();

  const isCompanyStaff = currentUser?.role === Role.COMPANY_EMPLOYEE || 
                         currentUser?.staffRole === InstallmentCompanyStaffRole.CREDIT_OFFICER || 
                         currentUser?.staffRole === InstallmentCompanyStaffRole.COLLECTION_AGENT ||
                         currentUser?.staffRole === InstallmentCompanyStaffRole.AUDITOR;

  const isBranchManager = currentUser?.role === Role.BRANCH_MANAGER || 
                          currentUser?.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER;

  const isCompanyAdmin = currentUser?.role === Role.SUPER_ADMIN || 
                         currentUser?.role === Role.ADMIN || 
                         currentUser?.role === Role.INSTALLMENT_COMPANY ||
                         currentUser?.staffRole === InstallmentCompanyStaffRole.GENERAL_MANAGER;

  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [showClientFollowUpModal, setShowClientFollowUpModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'branch_transfers' | 'branches' | 'staff' | 'database' | 'followup' | 'reports' | 'shared_docs' | 'ai' | 'settings' | 'excel_import'>(
    (initialTab as any) || (pendingNavigation?.subTab as any) || 'overview'
  );

  React.useEffect(() => {
    if ((isBranchManager || isCompanyStaff) && activeTab === 'ai') {
      setActiveTab('overview');
    }
  }, [isBranchManager, isCompanyStaff, activeTab]);

  React.useEffect(() => {
    if (initialTab) {
      if (initialTab === 'ai_calculator') {
        if (!isBranchManager && !isCompanyStaff) {
          setActiveTab('ai');
        } else {
          setActiveTab('overview');
        }
      } else if (initialTab === 'overdue') {
        setActiveTab('followup');
      } else if (initialTab === 'company_settings') {
        setShowProfileSettingsModal(true);
      } else {
        setActiveTab(initialTab as any);
      }
    }
  }, [initialTab]);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);

  // Close dropdown on outside click or selection
  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId as any);
    onTabChange?.(tabId);
    setOpenDropdown(null);
    setIsSectionMenuOpen(false);
  };

  // Application discussion & workflow management states
  const [discussionApp, setDiscussionApp] = useState<Application | null>(null);
  const [discussionTab, setDiscussionTab] = useState<'comments' | 'documents' | 'reroute'>('comments');
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');
  const [appUrgentOnly, setAppUrgentOnly] = useState(false);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<Application | null>(null);

  // Quick Action Review State (Approve / Reject modals)
  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [approveAmountInput, setApproveAmountInput] = useState<number>(0);
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [rejectionReasonSelected, setRejectionReasonSelected] = useState<string>('');
  const [rejectionNotesText, setRejectionNotesText] = useState<string>('');

  // Interactive Recharts Time Series State (توزيع الطلبات والمحصلات بمرور الوقت)
  const [timeSeriesMetric, setTimeSeriesMetric] = useState<'collections' | 'volume' | 'recovery'>('collections');
  const [timeSeriesRange, setTimeSeriesRange] = useState<'3m' | '6m' | '12m'>('6m');

  // Modal states
  const [selectedClientForTimeline, setSelectedClientForTimeline] = useState<Client | null>(null);
  const [requestAccessModalClient, setRequestAccessModalClient] = useState<Client | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  // Cases Workflow & Followup tracking state
  const [casesWorkflowStatusFilter, setCasesWorkflowStatusFilter] = useState<string>('ALL');
  const [casesSearchTerm, setCasesSearchTerm] = useState('');
  const [casesBranchFilter, setCasesBranchFilter] = useState<string>('ALL');
  const [inlineCommentMap, setInlineCommentMap] = useState<Record<string, string>>({});
  const [isSubmittingCommentMap, setIsSubmittingCommentMap] = useState<Record<string, boolean>>({});
  const [assigningAppInFollowup, setAssigningAppInFollowup] = useState<Application | null>(null);
  const [showPortalNotifications, setShowPortalNotifications] = useState(false);
  const [portalNotifFilter, setPortalNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [expandedFollowupAppId, setExpandedFollowupAppId] = useState<string | null>(null);
  const [followupInlineTab, setFollowupInlineTab] = useState<Record<string, 'workflow' | 'comments' | 'documents'>>({});

  // New staff form state (Immediate user and password)
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    username: '',
    password: '',
    staffRole: InstallmentCompanyStaffRole.CREDIT_OFFICER,
    governorate: 'القاهرة',
    branchId: '',
    email: '',
    phone: '',
    permissions: ['view_clients', 'request_access', 'ai_analysis']
  });

  // New branch form state
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    governorate: 'القاهرة',
    address: '',
    phone: '',
    managerName: ''
  });

  // Shared Doc Upload form
  const [newDocData, setNewDocData] = useState({
    title: '',
    titleEn: '',
    category: 'CONTRACT_TEMPLATE' as any,
    permission: 'ALL_STAFF' as any,
    fileUrl: 'https://crobsa.com/docs/template.pdf',
    fileName: 'نموذج_عقد_جديد.pdf',
    fileSize: '1.5 MB',
    description: ''
  });

  // AI Credit Analysis Form State
  const [aiForm, setAiForm] = useState({
    clientName: 'أحمد محمود رضوان',
    nationalId: '28910120104829',
    monthlyIncome: 18000,
    requestedAmount: 75000,
    requestedDurationMonths: 18,
    debtBurdenRatio: 22,
    employmentType: 'صاحب محل تجاري (سجل تجاري وبطاقة ضريبية 5 سنوات)',
    guaranteesProvided: ['شيكات بنكية مؤجلة', 'إيصال أمانة', 'ضامن موظف حكومي'],
    historicalRepaymentScore: 'منتظم في سداد تمويلين سابقين، درجة I-Score: 790',
    customNotes: 'العميل يرغب في تمويل معدات ري حديثة لمزرعته، التدفق المالي ممتاز'
  });
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [latestAiResult, setLatestAiResult] = useState<AiCreditAnalysis | null>(null);

  // Database Tab Filters
  const [databaseSubTab, setDatabaseSubTab] = useState<'my_clients' | 'crobsa_central'>('my_clients');
  const [dbSearch, setDbSearch] = useState('');
  const [dbGovFilter, setDbGovFilter] = useState('');

  // Reports filters & PDF modal
  const [reportGovFilter, setReportGovFilter] = useState('');
  const [reportBranchFilter, setReportBranchFilter] = useState('');
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);

  // Branch management & statistics states
  const [branchGovFilter, setBranchGovFilter] = useState<string>('ALL');
  const [selectedBranchForStats, setSelectedBranchForStats] = useState<CompanyBranch | null>(null);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    governorate: 'القاهرة',
    address: '',
    phone: '',
    managerName: ''
  });
  const [branchForPasswordChange, setBranchForPasswordChange] = useState<CompanyBranch | null>(null);
  const [branchNewPassword, setBranchNewPassword] = useState('');
  const [branchPasswordSuccess, setBranchPasswordSuccess] = useState<string | null>(null);
  const [branchForStaffView, setBranchForStaffView] = useState<CompanyBranch | null>(null);

  // Settings Sub-tab state
  const [settingsSubTab, setSettingsSubTab] = useState<'info' | 'password' | 'branding' | 'workflow'>('info');

  // Target company ID
  const activeCompany = currentCompany || companies[0];
  const companyId = activeCompany?.id || 'comp_01';

  // Company profile form state for Settings tab
  const [compEditName, setCompEditName] = useState(activeCompany?.name || '');
  const [compEditNameEn, setCompEditNameEn] = useState(activeCompany?.nameEn || '');
  const [compEditPhone, setCompEditPhone] = useState(activeCompany?.phone || '');
  const [compEditEmail, setCompEditEmail] = useState(activeCompany?.email || '');
  const [compEditCR, setCompEditCR] = useState(activeCompany?.commercialRegister || '');
  const [compEditTax, setCompEditTax] = useState(activeCompany?.taxNumber || '');
  const [compEditFRA, setCompEditFRA] = useState(activeCompany?.fraLicense || '');
  const [compEditCeiling, setCompEditCeiling] = useState(activeCompany?.creditCeiling || 25000000);
  const [compEditLogo, setCompEditLogo] = useState(activeCompany?.logo || '');
  const [compEditCover, setCompEditCover] = useState(activeCompany?.coverImage || '');
  const [compSaveSuccess, setCompSaveSuccess] = useState(false);

  // Director Password Change state
  const [newDirectorPassword, setNewDirectorPassword] = useState('');
  const [confirmDirectorPassword, setConfirmDirectorPassword] = useState('');
  const [directorPasswordStatus, setDirectorPasswordStatus] = useState<string | null>(null);

  // Staff quick password change state (in Settings tab)
  const [staffTargetForPassword, setStaffTargetForPassword] = useState<User | null>(null);
  const [staffNewPasswordInput, setStaffNewPasswordInput] = useState('');
  const [staffPasswordChangeSuccess, setStaffPasswordChangeSuccess] = useState<string | null>(null);

  // Reports sub-tab & Sales Staff Performance
  const [reportsSubTab, setReportsSubTab] = useState<'detailed_analytics' | 'sales_performance' | 'geo_analytics'>('detailed_analytics');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesRatingFilter, setSalesRatingFilter] = useState<string>('ALL');
  const [selectedSalesmanDetails, setSelectedSalesmanDetails] = useState<any>(null);

  // Search queries for Staff and Passwords
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffPasswordSearchQuery, setStaffPasswordSearchQuery] = useState('');

  // Auto-Archive states
  const [autoArchiveRunning, setAutoArchiveRunning] = useState(false);
  const [autoArchiveResult, setAutoArchiveResult] = useState<string | null>(null);

  // File Upload refs for company branding (Logo & Cover image)
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompEditLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompEditCover(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (activeCompany) {
      setCompEditName(activeCompany.name || '');
      setCompEditNameEn(activeCompany.nameEn || '');
      setCompEditPhone(activeCompany.phone || '');
      setCompEditEmail(activeCompany.email || '');
      setCompEditCR(activeCompany.commercialRegister || '');
      setCompEditTax(activeCompany.taxNumber || '');
      setCompEditFRA(activeCompany.fraLicense || '');
      setCompEditCeiling(activeCompany.creditCeiling || 25000000);
      setCompEditLogo(activeCompany.logo || '');
      setCompEditCover(activeCompany.coverImage || '');
    }
  }, [activeCompany]);

  // Available branches for current company
  const companyBranches = useMemo(() => {
    return branches.filter(b => b.companyId === companyId);
  }, [branches, companyId]);

  // Filtered branches by user-selected governorate filter tab
  const filteredCompanyBranches = useMemo(() => {
    if (branchGovFilter === 'ALL') return companyBranches;
    return companyBranches.filter(b => b.governorate === branchGovFilter);
  }, [companyBranches, branchGovFilter]);

  // Branches filtered by selected governorate in staff form
  const matchedBranchesForSelectedGov = useMemo(() => {
    return companyBranches.filter(b => b.governorate === newStaffData.governorate);
  }, [companyBranches, newStaffData.governorate]);

  // Applications belonging to this company with role-based visibility scoping
  const companyApps = useMemo(() => {
    const baseApps = applications.filter(a => 
      a.assignedCompanyIds.includes(companyId) || 
      a.assignedCompanyIds.includes(currentUser?.id || '')
    );

    // 1. Employee / Credit Officer / Collection Agent:
    // Only sees requests linked to their specific branch OR their specific assigned tasks
    if (
      currentUser?.role === Role.COMPANY_EMPLOYEE || 
      currentUser?.staffRole === InstallmentCompanyStaffRole.CREDIT_OFFICER || 
      currentUser?.staffRole === InstallmentCompanyStaffRole.COLLECTION_AGENT
    ) {
      return baseApps.filter(a => {
        if (a.status === ApplicationStatus.PENDING_ADMIN) return false;
        // Direct assignment to this specific officer
        if (a.assignedOfficerId === currentUser.id) return true;
        if (a.assignedOfficerName && (
          a.assignedOfficerName.includes(currentUser.name) || 
          (currentUser.username && a.assignedOfficerName.includes(currentUser.username))
        )) return true;
        // Or requests assigned to their branch
        if (currentUser.branchId && a.assignedBranchId === currentUser.branchId) return true;
        if (currentUser.branchName && a.assignedBranchName === currentUser.branchName) return true;
        return false;
      });
    }

    // 2. Branch Manager:
    // Strictly sees cases assigned to their specific branch only (الحالات التي الفرع بيشوفها هي دي بس اللى عنده)
    // Unassigned incoming cases remain "تحت الإسناد" for the General Manager to assign.
    if (
      currentUser?.role === Role.BRANCH_MANAGER || 
      currentUser?.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER
    ) {
      return baseApps.filter(a => {
        if (a.status === ApplicationStatus.PENDING_ADMIN) return false;
        const isBranchCase = (currentUser.branchId && a.assignedBranchId === currentUser.branchId) ||
                             (currentUser.branchName && a.assignedBranchName === currentUser.branchName) ||
                             (a.assignedOfficerId === currentUser.id);
        return Boolean(isBranchCase);
      });
    }

    // 3. Installment Company Admin / CEO / Platform Admin:
    // Sees all company cases across all branches
    return baseApps;
  }, [applications, companyId, currentUser]);

  // Scoped notifications for this company user/staff
  const portalNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
      // 1. Direct assignment to this user
      if (n.userId === currentUser.id || n.targetOfficerId === currentUser.id) return true;
      // 2. Branch manager: notifications for their branch
      if (isBranchManager && currentUser.branchId && n.targetBranchId === currentUser.branchId) return true;
      // 3. Company Admin: notifications for their company
      if (isCompanyAdmin && (n.targetCompanyId === companyId || n.userId === companyId || n.userId === 'COMPANY_ADMIN')) return true;
      // 4. Staff in branch
      if (currentUser.branchId && n.targetBranchId === currentUser.branchId && !n.targetOfficerId) return true;
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser, isBranchManager, isCompanyAdmin, companyId]);

  const unreadPortalNotificationsCount = useMemo(() => {
    return portalNotifications.filter(n => !n.read).length;
  }, [portalNotifications]);

  // Check if an application belongs to "الطلبات الجديدة الواردة" (incoming unassigned)
  const isNewIncomingApp = (a: Application) => {
    if (a.isArchived) return false;
    if (
      a.status === ApplicationStatus.APPROVED || 
      a.status === ApplicationStatus.AMOUNT_TRANSFERRED || 
      a.status === ApplicationStatus.REJECTED ||
      a.status === ApplicationStatus.CANCELLED_BY_CLIENT ||
      a.status === ApplicationStatus.WITHDRAWN
    ) {
      return false;
    }
    if (a.assignedBranchId || a.assignedOfficerId) return false;
    return (
      a.status === ApplicationStatus.RECEIVED || 
      a.status === ApplicationStatus.PENDING_ADMIN || 
      a.status === ApplicationStatus.PENDING_REVIEW
    );
  };

  // New applications count (received / unassigned)
  const newAppsCount = useMemo(() => {
    return companyApps.filter(isNewIncomingApp).length;
  }, [companyApps]);

  // Active tracking cases progressing through the workflow pipeline (الحالات الجارية)
  const trackingAppsCount = useMemo(() => {
    return companyApps.filter(a => 
      !a.isArchived && 
      !isNewIncomingApp(a) &&
      a.status !== ApplicationStatus.REJECTED &&
      a.status !== ApplicationStatus.AMOUNT_TRANSFERRED &&
      a.status !== ApplicationStatus.CANCELLED_BY_CLIENT &&
      a.status !== ApplicationStatus.WITHDRAWN
    ).length;
  }, [companyApps]);

  // Company staff list
  const companyStaffList = useMemo(() => {
    return users.filter(u => u.companyId === companyId || (u.role === Role.INSTALLMENT_COMPANY && u.id === currentUser?.id));
  }, [users, companyId, currentUser]);

  // Filtered staff list by staffSearchQuery
  const filteredCompanyStaffList = useMemo(() => {
    if (!staffSearchQuery.trim()) return companyStaffList;
    const q = staffSearchQuery.toLowerCase().trim();
    return companyStaffList.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.username || s.email)?.toLowerCase().includes(q) ||
      s.branchName?.toLowerCase().includes(q) ||
      s.governorate?.toLowerCase().includes(q) ||
      (s.staffRole || s.role)?.toLowerCase().includes(q)
    );
  }, [companyStaffList, staffSearchQuery]);

  // Filtered staff password list by staffPasswordSearchQuery
  const filteredStaffPasswordList = useMemo(() => {
    if (!staffPasswordSearchQuery.trim()) return companyStaffList;
    const q = staffPasswordSearchQuery.toLowerCase().trim();
    return companyStaffList.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.username || s.email)?.toLowerCase().includes(q) ||
      s.branchName?.toLowerCase().includes(q) ||
      s.governorate?.toLowerCase().includes(q) ||
      (s.staffRole || s.role)?.toLowerCase().includes(q) ||
      (s.password || 'password').toLowerCase().includes(q)
    );
  }, [companyStaffList, staffPasswordSearchQuery]);

  // Filtered branches password list by staffPasswordSearchQuery
  const filteredBranchPasswordList = useMemo(() => {
    if (!staffPasswordSearchQuery.trim()) return companyBranches;
    const q = staffPasswordSearchQuery.toLowerCase().trim();
    return companyBranches.filter(b => 
      b.name.toLowerCase().includes(q) ||
      b.governorate.toLowerCase().includes(q) ||
      b.managerName?.toLowerCase().includes(q) ||
      b.phone?.toLowerCase().includes(q)
    );
  }, [companyBranches, staffPasswordSearchQuery]);

  // Sales Staff Performance Data Calculation (لوحة تحكم أداء موظفي البيع والمندوبين)
  const salesStaffPerformance = useMemo(() => {
    const salesUsers = users.filter(u => 
      u.role === Role.SALESMAN || 
      u.role === Role.SUPPLIER || 
      companyApps.some(a => a.submittedBy === u.id || a.submittedBy === u.username || a.submittedBy === u.name)
    );

    return salesUsers.map(salesman => {
      const salesmanApps = companyApps.filter(a => 
        a.submittedBy === salesman.id || 
        a.submittedBy === salesman.username || 
        a.submittedBy === salesman.name ||
        a.submittedBy === salesman.email
      );

      const totalSubmitted = salesmanApps.length;
      const approvedApps = salesmanApps.filter(a => 
        a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED
      );
      const approvedCount = approvedApps.length;
      const rejectedApps = salesmanApps.filter(a => a.status === ApplicationStatus.REJECTED);
      const rejectedCount = rejectedApps.length;
      const pendingCount = totalSubmitted - approvedCount - rejectedCount;

      const approvalRate = totalSubmitted > 0 ? Math.round((approvedCount / totalSubmitted) * 100) : 0;
      const approvedVolume = approvedApps.reduce((sum, a) => sum + (a.approvedAmount || a.requestedAmount), 0);

      let totalProcessingHours = 0;
      let processedCasesCount = 0;

      salesmanApps.forEach(app => {
        if (app.submittedAt && (app.reviewedAt || app.rejectedAt)) {
          const start = new Date(app.submittedAt).getTime();
          const end = new Date(app.reviewedAt || app.rejectedAt!).getTime();
          if (end > start) {
            const diffHours = (end - start) / (1000 * 60 * 60);
            totalProcessingHours += Math.min(diffHours, 240);
            processedCasesCount++;
          }
        } else if (app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.REJECTED) {
          const histResolve = app.history?.find(h => h.action.includes('موافقة') || h.action.includes('رفض') || h.action.includes('اعتماد'));
          if (histResolve?.timestamp && app.submittedAt) {
            const start = new Date(app.submittedAt).getTime();
            const end = new Date(histResolve.timestamp).getTime();
            if (end > start) {
              totalProcessingHours += (end - start) / (1000 * 60 * 60);
              processedCasesCount++;
            }
          } else {
            const pseudoHours = 14 + ((salesman.name.length * 5) % 20);
            totalProcessingHours += pseudoHours;
            processedCasesCount++;
          }
        }
      });

      const avgSpeedHours = processedCasesCount > 0 
        ? Math.round((totalProcessingHours / processedCasesCount) * 10) / 10 
        : 20;

      let ratingLabel = 'يحتاج متابعة';
      let ratingBadge = 'bg-rose-100 text-rose-800 border-rose-200';
      let ratingTier = 'NEEDS_IMPROVEMENT';
      if (approvalRate >= 75) {
        ratingLabel = 'ممتاز ★★★';
        ratingBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        ratingTier = 'EXCELLENT';
      } else if (approvalRate >= 60) {
        ratingLabel = 'جيد جداً ★★';
        ratingBadge = 'bg-sky-100 text-sky-800 border-sky-200';
        ratingTier = 'VERY_GOOD';
      } else if (approvalRate >= 45) {
        ratingLabel = 'مقبول ★';
        ratingBadge = 'bg-amber-100 text-amber-800 border-amber-200';
        ratingTier = 'GOOD';
      }

      return {
        salesman,
        salesmanApps,
        totalSubmitted,
        approvedCount,
        rejectedCount,
        pendingCount,
        approvalRate,
        approvedVolume,
        avgSpeedHours,
        ratingLabel,
        ratingBadge,
        ratingTier
      };
    }).sort((a, b) => b.totalSubmitted - a.totalSubmitted);
  }, [users, companyApps]);

  const filteredSalesStaff = useMemo(() => {
    return salesStaffPerformance.filter(item => {
      if (salesRatingFilter !== 'ALL' && item.ratingTier !== salesRatingFilter) return false;
      if (salesSearchQuery.trim()) {
        const q = salesSearchQuery.toLowerCase().trim();
        const nameMatch = item.salesman.name.toLowerCase().includes(q);
        const userMatch = (item.salesman.username || item.salesman.email)?.toLowerCase().includes(q);
        const govMatch = item.salesman.governorate?.toLowerCase().includes(q);
        if (!nameMatch && !userMatch && !govMatch) return false;
      }
      return true;
    });
  }, [salesStaffPerformance, salesRatingFilter, salesSearchQuery]);

  // Auto-Archive eligible cases calculation
  const sixMonthsAgoMs = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.getTime();
  }, []);

  const eligibleForAutoArchiveCount = useMemo(() => {
    return companyApps.filter(a => {
      if (a.isArchived) return false;
      const isRejected = a.status === ApplicationStatus.REJECTED;
      const isOld = new Date(a.submittedAt).getTime() < sixMonthsAgoMs;
      return isRejected || isOld;
    }).length;
  }, [companyApps, sixMonthsAgoMs]);

  const handleRunAutoArchive = async () => {
    setAutoArchiveRunning(true);
    setAutoArchiveResult(null);
    try {
      const res = await autoArchiveApplications({ olderThanMonths: 6, archiveRejected: true });
      setAutoArchiveResult(
        language === 'ar'
          ? `تمت أرشفة ${res.count} طلب بنجاح (الطلبات المرفوضة وتلك التي مر عليها أكثر من 6 أشهر)! تم تحسين سرعة الأداء وتفريغ المساحة.`
          : `Successfully archived ${res.count} applications (rejected or older than 6 months)! Database cleaned.`
      );
    } catch (err) {
      console.error('Auto archive failed:', err);
    } finally {
      setAutoArchiveRunning(false);
    }
  };

  // Grouped Navigation Sections (role-scoped for Company Staff vs Admin)
  const navSections = useMemo(() => {
    if (isCompanyStaff) {
      return [
        {
          id: 'section_staff_work',
          title: language === 'ar' ? 'مهام العمل اليومية' : 'Daily Tasks',
          items: [
            { id: 'overview', label: language === 'ar' ? 'الرئيسية ومهامي' : 'Overview & Tasks', icon: PieIcon },
            { id: 'applications', label: language === 'ar' ? 'الطلبات الجديدة الواردة' : 'New Applications', icon: FileText, count: newAppsCount },
            { id: 'followup', label: language === 'ar' ? 'متابعة الحالات ومسار العمل' : 'Cases Workflow', icon: CheckCircle2, count: trackingAppsCount },
          ]
        },
        {
          id: 'section_staff_tools',
          title: language === 'ar' ? 'قاعدة العملاء والأدوات' : 'Client Tools',
          items: [
            { id: 'database', label: language === 'ar' ? 'قاعدة بيانات واستعلام العملاء' : 'Clients Database', icon: Search },
            { id: 'shared_docs', label: language === 'ar' ? 'المستندات والنماذج المشتركة' : 'Shared Documents', icon: FolderLock },
          ]
        },
        {
          id: 'section_staff_reports_settings',
          title: language === 'ar' ? 'التقارير والحساب الشخصي' : 'Performance & Profile',
          items: [
            { id: 'reports', label: language === 'ar' ? 'لوحة تقارير وإنجاز المهام' : 'Performance Dashboard', icon: FileSpreadsheet },
            { id: 'settings', label: language === 'ar' ? 'إعدادات الحساب وكلمة المرور' : 'My Profile & Security', icon: Settings },
          ]
        }
      ];
    }

    return [
      {
        id: 'section_core',
        title: language === 'ar' ? 'الرئيسية والطلبات' : 'Main & Requests',
        items: [
          { id: 'overview', label: language === 'ar' ? 'نظرة عامة والتحليلات' : 'Overview & KPIs', icon: PieIcon },
          { id: 'applications', label: language === 'ar' ? 'طلبات التمويل الجديدة' : 'New Applications', icon: FileText, count: newAppsCount },
          { id: 'followup', label: language === 'ar' ? 'متابعة الحالات ومسار العمل' : 'Cases Workflow & Tracking', icon: CheckCircle2, count: trackingAppsCount },
        ]
      },
      {
        id: 'section_credit',
        title: language === 'ar' ? 'الائتمان والعملاء' : 'Credit & Clients',
        items: [
          { id: 'database', label: language === 'ar' ? 'قاعدة بيانات العملاء' : 'Clients Database', icon: Search },
          ...(isCompanyAdmin ? [
            { id: 'ai', label: language === 'ar' ? 'حاسبة الائتمان والتقييم الذكي' : 'AI Credit Calculator', icon: Sparkles }
          ] : []),
          { 
            id: 'branch_transfers', 
            label: language === 'ar' ? 'طلبات تبديل الفروع' : 'Branch Transfers', 
            icon: ArrowLeftRight, 
            count: applications.filter(a => a.branchTransferRequest?.status === 'PENDING').length 
          }
        ]
      },
      {
        id: 'section_organization',
        title: language === 'ar' ? 'الهيكل الإداري والفروع' : 'Organization & Staff',
        items: [
          { id: 'branches', label: language === 'ar' ? 'الفروع والمواقع' : 'Branches', icon: Building2, count: companyBranches.length },
          { id: 'staff', label: language === 'ar' ? 'فريق العمل والائتمان' : 'Company Staff', icon: Users, count: companyStaffList.length },
          ...(!isBranchManager ? [
            { id: 'excel_import', label: language === 'ar' ? 'استيراد الفروع والموظفين (Excel)' : 'Excel Import', icon: FileSpreadsheet }
          ] : []),
        ]
      },
      {
        id: 'section_tools',
        title: language === 'ar' ? 'المستندات والإعدادات' : 'Documents & Settings',
        items: [
          { id: 'reports', label: language === 'ar' ? 'التقارير وأداء موظفي البيع' : 'Reports & Sales Performance', icon: FileSpreadsheet },
          { id: 'shared_docs', label: language === 'ar' ? 'المستندات والنماذج' : 'Shared Documents', icon: FolderLock },
          ...(!isBranchManager ? [
            { id: 'settings', label: language === 'ar' ? 'إعدادات أسباب الرفض والشركة' : 'Rejection & Settings', icon: Settings }
          ] : []),
        ]
      }
    ];
  }, [language, isCompanyStaff, isBranchManager, newAppsCount, trackingAppsCount, companyBranches.length, companyStaffList.length, applications]);

  // Flattened primary sections for modern tab bar & sleek dropdown selector
  const tabItemsList = useMemo(() => [
    { id: 'overview', label: language === 'ar' ? 'الرئيسية والمؤشرات' : 'Overview & KPIs', icon: PieIcon },
    { id: 'applications', label: language === 'ar' ? 'طلبات وحالات التمويل' : 'Applications & Requests', icon: FileText, count: companyApps.filter(a => !a.isArchived).length || undefined },
    { id: 'followup', label: language === 'ar' ? 'متابعة الحالات ومسار العمل' : 'Cases Workflow', icon: CheckCircle2, count: trackingAppsCount || undefined },
    { id: 'database', label: language === 'ar' ? 'دليل وسجل العملاء' : 'Clients Directory', icon: Search },
    ...(!isCompanyStaff ? [
      { 
        id: 'branches', 
        matchTabs: ['branches', 'staff', 'branch_transfers', 'excel_import'],
        label: language === 'ar' ? 'الفروع وفريق العمل' : 'Branches & Team', 
        icon: Building2, 
        count: companyBranches.length + companyStaffList.length 
      }
    ] : []),
    ...(!isCompanyStaff ? [
      { 
        id: 'reports', 
        matchTabs: ['reports', 'shared_docs'],
        label: language === 'ar' ? 'التقارير والمستندات' : 'Reports & Docs', 
        icon: BarChart3 
      }
    ] : [
      { id: 'reports', label: language === 'ar' ? 'التقارير والأداء' : 'Reports', icon: BarChart3 },
      { id: 'shared_docs', label: language === 'ar' ? 'المستندات والنماذج' : 'Documents', icon: FolderLock }
    ]),
    ...(!isBranchManager && !isCompanyStaff ? [
      { id: 'ai', label: language === 'ar' ? 'حاسبة الائتمان والتقييم' : 'AI Calculator', icon: Sparkles }
    ] : []),
    ...(!isBranchManager && !isCompanyStaff ? [
      { id: 'settings', label: language === 'ar' ? 'إعدادات الشركة' : 'Company Settings', icon: Settings }
    ] : []),
  ], [language, companyApps, trackingAppsCount, isCompanyStaff, companyBranches.length, companyStaffList.length, isBranchManager]);

  const currentTabItem = useMemo(() => {
    return tabItemsList.find(item => item.matchTabs ? item.matchTabs.includes(activeTab) : item.id === activeTab) || tabItemsList[0];
  }, [tabItemsList, activeTab]);

  // Client authorizations
  const isClientAuthorized = (client?: Client) => {
    if (!client) return false;
    if (currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) return true;
    if (client.authorizedCompanies?.includes(companyId)) return true;
    // Check if client has apps with this company
    const hasApp = applications.some(a => a.clientNationalId === client.nationalId && a.assignedCompanyIds?.includes(companyId));
    return hasApp;
  };

  // Filtered Clients for Database tab
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (!c) return false;
      const authorized = isClientAuthorized(c);
      if (databaseSubTab === 'my_clients' && !authorized) return false;
      if (databaseSubTab === 'crobsa_central' && authorized) return false;

      const matchesSearch = 
        (c.name || '').toLowerCase().includes(dbSearch.toLowerCase()) ||
        (c.nationalId || '').includes(dbSearch) ||
        (c.phoneNumber && c.phoneNumber.includes(dbSearch));

      const matchesGov = dbGovFilter ? c.governorate === dbGovFilter : true;
      return matchesSearch && matchesGov;
    });
  }, [clients, databaseSubTab, dbSearch, dbGovFilter, companyId]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalApps = companyApps.length;
    const approvedApps = companyApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length;
    const rejectedApps = companyApps.filter(a => a.status === ApplicationStatus.REJECTED).length;
    const pendingApps = companyApps.filter(a => [
      ApplicationStatus.RECEIVED, 
      ApplicationStatus.PAPER_REVIEW, 
      ApplicationStatus.ISCORE_CHECK, 
      ApplicationStatus.FIELD_INVESTIGATION,
      ApplicationStatus.CONTRACT_SIGNING,
      ApplicationStatus.ADDITIONAL_PAPERS
    ].includes(a.status)).length;

    const totalApprovedVolume = companyApps
      .filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED)
      .reduce((sum, a) => sum + (a.approvedAmount || a.requestedAmount || 0), 0);

    const activeCasesVolume = companyApps
      .filter(a => a.status !== ApplicationStatus.REJECTED && a.status !== ApplicationStatus.RECEIVED)
      .reduce((sum, a) => sum + (a.approvedAmount || a.requestedAmount || 0), 0);

    const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;
    const collectionRate = 96.4;

    // Detailed Governorate Distribution for Recharts
    const govAggregates: Record<string, { total: number; approved: number; rejected: number; pending: number; volume: number }> = {};
    companyApps.forEach(a => {
      const gov = a.governorate || 'القاهرة';
      if (!govAggregates[gov]) {
        govAggregates[gov] = { total: 0, approved: 0, rejected: 0, pending: 0, volume: 0 };
      }
      govAggregates[gov].total += 1;
      if (a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED) {
        govAggregates[gov].approved += 1;
        govAggregates[gov].volume += (a.approvedAmount || a.requestedAmount || 0);
      } else if (a.status === ApplicationStatus.REJECTED) {
        govAggregates[gov].rejected += 1;
      } else {
        govAggregates[gov].pending += 1;
      }
    });

    const govDetailedData = Object.keys(govAggregates)
      .filter(gov => {
        if (currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER) {
          if (currentUser.governorate && gov !== currentUser.governorate) return false;
        }
        return true;
      })
      .map(gov => ({
        name: gov,
        count: govAggregates[gov].total,
        total: govAggregates[gov].total,
        approved: govAggregates[gov].approved,
        rejected: govAggregates[gov].rejected,
        pending: govAggregates[gov].pending,
        volume: govAggregates[gov].volume,
        approvalRate: Math.round((govAggregates[gov].approved / govAggregates[gov].total) * 100) || 0
      }));

    // Status breakdown for PieChart
    const statusPieData = [
      { name: 'معتمد', value: approvedApps, color: '#10b981' },
      { name: 'مرفوض', value: rejectedApps, color: '#f43f5e' },
      { name: 'قيد الفحص والمراجعة', value: pendingApps, color: '#0ea5e9' }
    ].filter(item => item.value > 0);

    // Rejection Reasons distribution
    const reasonsMap: Record<string, number> = {};
    companyApps.filter(a => a.status === ApplicationStatus.REJECTED).forEach(a => {
      const reasonKey = a.rejectionReason || a.reviewNote || 'عدم استيفاء الشروط الائتمانية';
      const cleanKey = reasonKey.length > 35 ? reasonKey.slice(0, 35) + '...' : reasonKey;
      reasonsMap[cleanKey] = (reasonsMap[cleanKey] || 0) + 1;
    });

    const rejectionReasonsData = Object.keys(reasonsMap).map(key => ({
      reason: key,
      count: reasonsMap[key]
    })).sort((a, b) => b.count - a.count);

    // Profession distribution
    const profCounts: Record<string, number> = {};
    companyApps.forEach(a => {
      const profName = a.profession === 'MERCHANT' ? 'تاجر' : a.profession === 'FARMER' ? 'مزارع' : a.profession === 'EQUIPMENT_OWNER' ? 'معدات وآلات' : 'صاحب مزرعة';
      profCounts[profName] = (profCounts[profName] || 0) + 1;
    });
    const profData = Object.keys(profCounts).map(prof => ({
      name: prof,
      value: profCounts[prof]
    }));

    // Branch Performance
    const branchPerformance = companyBranches.map(br => {
      const brApps = companyApps.filter(a => a.assignedBranchId === br.id || a.assignedBranchName === br.name);
      const brApproved = brApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length;
      const brRejected = brApps.filter(a => a.status === ApplicationStatus.REJECTED).length;
      const brVolume = brApps.reduce((acc, curr) => acc + (curr.approvedAmount || curr.requestedAmount || 0), 0);
      return {
        id: br.id,
        name: br.name,
        governorate: br.governorate,
        managerName: br.managerName,
        totalApps: brApps.length,
        approvedApps: brApproved,
        rejectedApps: brRejected,
        volume: brVolume
      };
    });

    return {
      totalApps,
      approvedApps,
      rejectedApps,
      pendingApps,
      totalApprovedVolume,
      activeCasesVolume,
      approvalRate,
      collectionRate,
      govData: govDetailedData,
      govDetailedData: govDetailedData,
      statusPieData: statusPieData.length > 0 ? statusPieData : (currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER ? [] : [
        { name: 'معتمد', value: 8, color: '#10b981' },
        { name: 'مرفوض', value: 3, color: '#f43f5e' },
        { name: 'قيد الفحص', value: 4, color: '#0ea5e9' }
      ]),
      rejectionReasonsData: rejectionReasonsData.length > 0 ? rejectionReasonsData : (currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER ? [] : [
        { reason: 'تعثر ائتماني سابق في الآي سكور (I-Score)', count: 2 },
        { reason: 'ارتفاع عبء الدين DTI يتجاوز 50%', count: 1 },
        { reason: 'عدم وضوح أو انتهاء بطاقة الرقم القومي', count: 1 }
      ]),
      profData: profData.length > 0 ? profData : (currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER ? [] : [{ name: 'تاجر', value: 4 }, { name: 'مزارع', value: 3 }, { name: 'معدات وآلات', value: 2 }]),
      branchPerformance: (currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER)
        ? branchPerformance.filter(b => b.id === currentUser?.branchId || b.name === currentUser?.branchName)
        : branchPerformance
    };
  }, [companyApps, companyBranches]);

  // Dynamic Time-Series Data for Recharts Interactive Dashboard (توزيع الطلبات والمحصلات المالية بمرور الوقت)
  const timeSeriesData = useMemo(() => {
    const rawMonths = [
      {
        month: 'أكتوبر 2025',
        shortMonth: 'أكتوبر',
        applicationsCount: 5,
        approvedCount: 4,
        rejectedCount: 1,
        disbursedAmount: 285000,
        collectedAmount: 260000,
        overdueAmount: 25000,
        collectionRate: 91.2
      },
      {
        month: 'نوفمبر 2025',
        shortMonth: 'نوفمبر',
        applicationsCount: 7,
        approvedCount: 5,
        rejectedCount: 2,
        disbursedAmount: 370000,
        collectedAmount: 345000,
        overdueAmount: 25000,
        collectionRate: 93.2
      },
      {
        month: 'ديسمبر 2025',
        shortMonth: 'ديسمبر',
        applicationsCount: 9,
        approvedCount: 7,
        rejectedCount: 2,
        disbursedAmount: 490000,
        collectedAmount: 460000,
        overdueAmount: 30000,
        collectionRate: 93.8
      },
      {
        month: 'يناير 2026',
        shortMonth: 'يناير',
        applicationsCount: 8,
        approvedCount: 6,
        rejectedCount: 1,
        disbursedAmount: 410000,
        collectedAmount: 395000,
        overdueAmount: 15000,
        collectionRate: 96.3
      },
      {
        month: 'فبراير 2026',
        shortMonth: 'فبراير',
        applicationsCount: 10,
        approvedCount: 7,
        rejectedCount: 2,
        disbursedAmount: 530000,
        collectedAmount: 485000,
        overdueAmount: 45000,
        collectionRate: 91.5
      },
      {
        month: 'مارس 2026',
        shortMonth: 'مارس (الحالي)',
        applicationsCount: Math.max(12, companyApps.length + 3),
        approvedCount: Math.max(8, companyApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length + 2),
        rejectedCount: Math.max(3, companyApps.filter(a => a.status === ApplicationStatus.REJECTED).length + 1),
        disbursedAmount: Math.max(620000, stats.totalApprovedVolume),
        collectedAmount: Math.max(570000, Math.round(stats.totalApprovedVolume * 0.92)),
        overdueAmount: Math.max(50000, stats.totalOverdueVolume),
        collectionRate: 91.9
      }
    ];

    if (timeSeriesRange === '3m') {
      return rawMonths.slice(3);
    }
    if (timeSeriesRange === '6m') {
      return rawMonths;
    }
    return [
      { month: 'أبريل 2025', shortMonth: 'أبريل', applicationsCount: 3, approvedCount: 2, rejectedCount: 1, disbursedAmount: 140000, collectedAmount: 130000, overdueAmount: 10000, collectionRate: 92.8 },
      { month: 'مايو 2025', shortMonth: 'مايو', applicationsCount: 4, approvedCount: 3, rejectedCount: 1, disbursedAmount: 190000, collectedAmount: 175000, overdueAmount: 15000, collectionRate: 92.1 },
      { month: 'يونيو 2025', shortMonth: 'يونيو', applicationsCount: 5, approvedCount: 4, rejectedCount: 1, disbursedAmount: 230000, collectedAmount: 215000, overdueAmount: 15000, collectionRate: 93.4 },
      { month: 'يوليو 2025', shortMonth: 'يوليو', applicationsCount: 4, approvedCount: 3, rejectedCount: 1, disbursedAmount: 210000, collectedAmount: 198000, overdueAmount: 12000, collectionRate: 94.2 },
      { month: 'أغسطس 2025', shortMonth: 'أغسطس', applicationsCount: 5, approvedCount: 4, rejectedCount: 1, disbursedAmount: 260000, collectedAmount: 242000, overdueAmount: 18000, collectionRate: 93.0 },
      { month: 'سبتمبر 2025', shortMonth: 'سبتمبر', applicationsCount: 6, approvedCount: 4, rejectedCount: 2, disbursedAmount: 300000, collectedAmount: 275000, overdueAmount: 25000, collectionRate: 91.6 },
      ...rawMonths
    ];
  }, [timeSeriesRange, companyApps, stats.totalApprovedVolume, stats.activeCasesVolume]);

  const timeSeriesTotals = useMemo(() => {
    const totalDisbursed = timeSeriesData.reduce((sum, d) => sum + d.disbursedAmount, 0);
    const totalCollected = timeSeriesData.reduce((sum, d) => sum + d.collectedAmount, 0);
    const totalApps = timeSeriesData.reduce((sum, d) => sum + d.applicationsCount, 0);
    const totalApproved = timeSeriesData.reduce((sum, d) => sum + d.approvedCount, 0);
    const avgCollectionRate = timeSeriesData.length > 0
      ? (timeSeriesData.reduce((sum, d) => sum + d.collectionRate, 0) / timeSeriesData.length).toFixed(1)
      : '0';

    return {
      totalDisbursed,
      totalCollected,
      totalApps,
      totalApproved,
      avgCollectionRate,
      netFlow: totalCollected
    };
  }, [timeSeriesData]);

  // Handle client access request submission
  const handleSubmitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAccessModalClient || !accessReason.trim()) return;

    await requestClientAccess(requestAccessModalClient.id, accessReason);
    setRequestAccessModalClient(null);
    setAccessReason('');
    alert(t('requestSubmittedNotice'));
  };

  // Handle new staff submission
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffData.name || !newStaffData.username || !newStaffData.password) return;

    const matchedBranch = companyBranches.find(b => b.id === newStaffData.branchId);

    await createCompanyStaff({
      name: newStaffData.name,
      username: newStaffData.username,
      password: newStaffData.password,
      staffRole: newStaffData.staffRole,
      governorate: newStaffData.governorate,
      branchId: newStaffData.branchId || (companyBranches[0]?.id || 'br_01'),
      branchName: matchedBranch?.name || companyBranches[0]?.name || 'الفرع الرئيسي',
      email: newStaffData.email,
      phone: newStaffData.phone,
      permissions: newStaffData.permissions
    });

    setShowAddStaffModal(false);
    setNewStaffData({
      name: '',
      username: '',
      password: '',
      staffRole: InstallmentCompanyStaffRole.CREDIT_OFFICER,
      governorate: 'القاهرة',
      branchId: '',
      email: '',
      phone: '',
      permissions: ['view_clients', 'request_access', 'ai_analysis']
    });
  };

  // Handle new branch submission
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name) return;

    await createBranch({
      name: newBranchData.name,
      governorate: newBranchData.governorate,
      address: newBranchData.address,
      phone: newBranchData.phone,
      managerName: newBranchData.managerName,
      companyId
    });

    setShowAddBranchModal(false);
    setNewBranchData({
      name: '',
      governorate: 'القاهرة',
      address: '',
      phone: '',
      managerName: ''
    });
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editBranchForm.name) return;

    await updateBranch(editingBranch.id, {
      name: editBranchForm.name,
      governorate: editBranchForm.governorate,
      address: editBranchForm.address,
      phone: editBranchForm.phone,
      managerName: editBranchForm.managerName
    });

    setEditingBranch(null);
  };

  const handleChangeBranchPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForPasswordChange || !branchNewPassword.trim()) return;

    const existingManager = users.find(u => 
      u.branchId === branchForPasswordChange.id && 
      (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER)
    ) || users.find(u => u.name === branchForPasswordChange.managerName && u.companyId === companyId);

    let username = '';
    if (existingManager) {
      username = existingManager.username || existingManager.email.split('@')[0];
      await updateStaffPassword(existingManager.id, branchNewPassword.trim());
    } else {
      username = `mgr_${branchForPasswordChange.id.slice(-4)}_${Math.floor(100 + Math.random() * 900)}`;
      await createCompanyStaff({
        name: branchForPasswordChange.managerName || `مدير ${branchForPasswordChange.name}`,
        username,
        password: branchNewPassword.trim(),
        staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER,
        governorate: branchForPasswordChange.governorate,
        branchId: branchForPasswordChange.id,
        branchName: branchForPasswordChange.name,
        permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'manage_staff', 'followup_cases']
      });
    }

    setBranchPasswordSuccess(`تم حفظ وتحديث كلمة مرور الفرع بنجاح! اسم المستخدم: ${username} | كلمة المرور: ${branchNewPassword.trim()}`);
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany(companyId, {
      name: compEditName,
      nameEn: compEditNameEn,
      phone: compEditPhone,
      email: compEditEmail,
      commercialRegister: compEditCR,
      taxNumber: compEditTax,
      fraLicense: compEditFRA,
      creditCeiling: Number(compEditCeiling)
    });
    setCompSaveSuccess(true);
    setTimeout(() => setCompSaveSuccess(false), 3500);
  };

  const handleSaveCompanyBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCompany(companyId, {
      logo: compEditLogo,
      coverImage: compEditCover
    });
    setCompSaveSuccess(true);
    setTimeout(() => setCompSaveSuccess(false), 3500);
  };

  const handleChangeDirectorPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectorPasswordStatus(null);
    if (!newDirectorPassword || newDirectorPassword.length < 6) {
      setDirectorPasswordStatus('يجب أن لا تقل كلمة المرور عن 6 أحرف');
      return;
    }
    if (newDirectorPassword !== confirmDirectorPassword) {
      setDirectorPasswordStatus('كلمتا المرور غير متطابقتين');
      return;
    }

    await changePassword(newDirectorPassword);
    setDirectorPasswordStatus('SUCCESS');
    setNewDirectorPassword('');
    setConfirmDirectorPassword('');
    setTimeout(() => setDirectorPasswordStatus(null), 4000);
  };

  // Handle shared doc upload
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.title) return;

    await addSharedDocument({
      title: newDocData.title,
      titleEn: newDocData.titleEn || newDocData.title,
      category: newDocData.category,
      companyId: activeCompany.id,
      permission: newDocData.permission,
      fileUrl: newDocData.fileUrl,
      fileName: newDocData.fileName,
      fileSize: newDocData.fileSize,
      description: newDocData.description
    });

    setShowAddDocModal(false);
    setNewDocData({
      title: '',
      titleEn: '',
      category: 'CONTRACT_TEMPLATE',
      permission: 'ALL_STAFF',
      fileUrl: 'https://crobsa.com/docs/template.pdf',
      fileName: 'نموذج_عقد_جديد.pdf',
      fileSize: '1.5 MB',
      description: ''
    });
  };

  // Handle AI analysis trigger
  const handleRunAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const result = await runClientCreditAiAnalysis({
        clientId: `c_ai_${Date.now()}`,
        clientName: aiForm.clientName,
        companyId,
        analyzedBy: currentUser?.id || 'system',
        analyzedByName: currentUser?.name || 'محلل الائتمان',
        monthlyIncome: Number(aiForm.monthlyIncome) || 15000,
        requestedAmount: Number(aiForm.requestedAmount) || 50000,
        requestedDurationMonths: Number(aiForm.requestedDurationMonths) || 12,
        debtBurdenRatio: Number(aiForm.debtBurdenRatio) || 20,
        employmentType: aiForm.employmentType,
        guaranteesProvided: aiForm.guaranteesProvided,
        historicalRepaymentScore: aiForm.historicalRepaymentScore,
        customNotes: aiForm.customNotes
      });

      setLatestAiResult(result);
      await saveAiAnalysis(result);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Filtered applications for reports
  const filteredReportApps = useMemo(() => {
    return companyApps.filter(a => {
      if (reportGovFilter && a.governorate !== reportGovFilter) return false;
      if (reportBranchFilter && a.assignedBranchId !== reportBranchFilter && a.assignedBranchName !== reportBranchFilter) return false;
      return true;
    });
  }, [companyApps, reportGovFilter, reportBranchFilter]);

  // Export report to CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'رقم الطلب',
      'اسم العميل',
      'الرقم القومي',
      'المحافظة',
      'الفرع المسند',
      'المهنة / النشاط',
      'المبلغ المطلوب (جنيه)',
      'المبلغ المعتمد (جنيه)',
      'حالة الطلب',
      'سبب الرفض (إن وجد)',
      'ملاحظات المراجعة والائتمان',
      'تاريخ التقديم'
    ];

    const statusMapAr: Record<string, string> = {
      APPROVED: 'معتمد نهائياً',
      AMOUNT_TRANSFERRED: 'تم صرف التمويل',
      REJECTED: 'مرفوض',
      PAPER_REVIEW: 'مراجعة المستندات',
      ISCORE_CHECK: 'فحص الاستعلام الائتماني',
      FIELD_INVESTIGATION: 'الاستعلام الميداني',
      CONTRACT_SIGNING: 'توقيع العقود',
      RECEIVED: 'مستلم جديد'
    };

    const rows = filteredReportApps.map(a => [
      `"${a.id}"`,
      `"${a.clientName || ''}"`,
      `"${a.clientNationalId || ''}"`,
      `"${a.governorate || ''}"`,
      `"${a.assignedBranchName || 'الفرع الرئيسي'}"`,
      `"${a.profession || ''}"`,
      a.requestedAmount || 0,
      a.approvedAmount || 0,
      `"${statusMapAr[a.status] || a.status}"`,
      `"${(a.rejectionReason || '').replace(/"/g, '""')}"`,
      `"${(a.rejectionNotes || a.reviewNote || '').replace(/"/g, '""')}"`,
      `"${new Date(a.submittedAt).toLocaleDateString('ar-EG')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_محفظة_كروبسا_${activeCompany.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportApplicationsCSV = handleExportCsv;

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* ========================================================================= */}
      {/* MAIN COMPANY PROFILE & COVER BANNER (غلاف وكافر وهوية الشركة الرسمية) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-visible space-y-0">
        {/* Cover Banner (Clean, Sharp & Clear - No Blur, Company Name & Logo Only) */}
        <div className="relative h-44 sm:h-52 md:h-60 w-full overflow-hidden bg-slate-900 rounded-t-3xl">
          <img 
            src={activeCompany.coverImage || compEditCover || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80'} 
            alt={activeCompany?.name || 'Company Cover'} 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Natural soft gradient at bottom for text contrast only - No blur */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

          {/* ONLY Company Logo and Company Name on Cover */}
          <div className="absolute bottom-4 inset-x-5 sm:inset-x-7 flex items-end justify-between gap-4 z-10">
            <div className="flex items-end gap-3.5 sm:gap-4.5">
              {/* Logo Card */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-22 md:w-22 rounded-2xl bg-white p-2 border-2 border-white shadow-xl flex items-center justify-center shrink-0">
                {Boolean(activeCompany?.logo?.trim()) ? (
                  <img 
                    src={activeCompany.logo} 
                    alt={activeCompany?.name || 'Company'} 
                    className="h-full w-full object-contain rounded-xl"
                  />
                ) : (
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                )}
              </div>

              {/* Company Name Only */}
              <div className="space-y-0.5 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {activeCompany.name}
                  </h1>
                  <span className="bg-white/20 text-white border border-white/30 text-xs font-mono font-bold px-2 py-0.5 rounded-lg shadow-xs">
                    {activeCompany.code}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 font-medium drop-shadow-sm">
                  {language === 'ar' ? activeCompany.nameEn : activeCompany.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards Grid (مربعات أنيقة واضحة لبيانات التمويل والترخيص والسجل) */}
        <div className="p-3.5 sm:p-5 bg-white space-y-3 sm:space-y-4 rounded-b-3xl border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* Box 1: Credit Ceiling (سقف التمويل المعتمد) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-emerald-950">{t('creditCeiling')}</span>
                <div className="h-6 w-6 rounded-lg bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-sm sm:text-base font-mono font-black text-emerald-900 leading-tight">
                {activeCompany.creditCeiling.toLocaleString()} <span className="text-[11px] font-sans font-bold">{t('egp')}</span>
              </p>
            </div>

            {/* Box 2: FRA License (ترخيص الرقابة المالية) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-amber-950">{t('fraLicense')}</span>
                <div className="h-6 w-6 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-amber-950 truncate" title={activeCompany.fraLicense || 'FRA-2024/982'}>
                {activeCompany.fraLicense || 'FRA-2024/982'}
              </p>
            </div>

            {/* Box 3: Commercial Register (السجل التجاري) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'السجل التجاري' : 'CR'}</span>
                <div className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-900">
                {activeCompany.commercialRegister || '—'}
              </p>
            </div>

            {/* Box 4: Tax Number (البطاقة الضريبية) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'البطاقة الضريبية' : 'Tax No'}</span>
                <div className="h-6 w-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Award className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-900">
                {activeCompany.taxNumber || '—'}
              </p>
            </div>

            {/* Box 5: Branches (الفروع الجغرافية) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'شبكة الفروع' : 'Branches'}</span>
                <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {companyBranches.length} {language === 'ar' ? 'فروع معتمدة' : 'branches'}
              </p>
            </div>

            {/* Box 6: Partner Status / Commission (حالة الاعتماد) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'حالة الاعتماد' : 'Status'}</span>
                <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-emerald-700 flex items-center gap-1">
                <span>{activeCompany.status === 'ACTIVE' ? (language === 'ar' ? 'معتمد رسمياً' : 'Active Partner') : activeCompany.status}</span>
              </p>
            </div>
          </div>

          {/* Scoped Role Notice for Employees and Branch Managers */}
          {(currentUser?.role === Role.COMPANY_EMPLOYEE || currentUser?.role === Role.BRANCH_MANAGER) && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  {language === 'ar' ? (
                    <>
                      <strong>لوحة مهام مخصصة لفرع:</strong>{' '}
                      <span className="font-bold underline">{currentUser.branchName || currentUser.branchId || 'الفرع المحدد'}</span>
                      {' '}— تعرض فقط الإحصائيات والطلبات المرتبطة بفرعك ومهامك المعتمدة.
                    </>
                  ) : (
                    <>
                      <strong>Scoped Dashboard:</strong> Showing only cases and statistics linked to your assigned branch and tasks.
                    </>
                  )}
                </span>
              </div>
              <span className="text-[10px] bg-white border border-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded-lg shrink-0">
                {currentUser.role === Role.BRANCH_MANAGER ? 'مدير فرع' : 'فحص وائتمان'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Company Portal Content Sections (Managed directly from the main sidebar) */}
      <div className="space-y-3">

        {/* Sub-bar when inside 'Branches & Team' */}
        {!isCompanyStaff && ['branches', 'staff', 'branch_transfers', 'excel_import'].includes(activeTab) && (
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200/80 rounded-xl overflow-x-auto text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('branches')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'branches' 
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span>فروع الشركة ({companyBranches.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'staff' 
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>فريق العمل ومسؤولو الائتمان ({companyStaffList.length})</span>
              </button>

              {!isBranchManager && (
                <button
                  type="button"
                  onClick={() => setActiveTab('branch_transfers')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'branch_transfers' 
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
                  <span>طلبات تبديل الفروع</span>
                  {applications.filter(a => a.branchTransferRequest?.status === 'PENDING').length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {applications.filter(a => a.branchTransferRequest?.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {!isBranchManager && (
              <button
                type="button"
                onClick={() => setActiveTab('excel_import')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  activeTab === 'excel_import'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>استيراد الفروع من Excel</span>
              </button>
            )}
          </div>
        )}

        {/* Sub-bar when inside 'Reports & Docs' */}
        {!isCompanyStaff && ['reports', 'shared_docs'].includes(activeTab) && (
          <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200/80 rounded-xl overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'reports' 
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span>التقارير التحليلية وأداء البيع</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shared_docs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'shared_docs' 
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderLock className="h-3.5 w-3.5 text-slate-500" />
              <span>المستندات والنماذج المشتركة</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & KPIS (لوحة المؤشرات العامة) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>{language === 'ar' ? 'إجمالي الطلبات' : 'Total Applications'}</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{stats.totalApps}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-emerald-600 font-bold">{stats.approvedApps} {language === 'ar' ? 'مقبول' : 'approved'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-600 font-bold">{stats.pendingApps} {language === 'ar' ? 'قيد الدراسة' : 'pending'}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>{language === 'ar' ? 'حجم التمويل المعتمد' : 'Approved Financing Volume'}</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-700">{stats.totalApprovedVolume.toLocaleString()} <span className="text-sm font-semibold">{t('egp')}</span></p>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {language === 'ar' ? 'من سقف متاح:' : 'Out of limit:'} {activeCompany.creditCeiling.toLocaleString()} {t('egp')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>{language === 'ar' ? 'نسبة القبول الائتماني' : 'Credit Approval Rate'}</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <PieIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-700">{stats.approvalRate}%</p>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${stats.approvalRate}%` }} />
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('followup')}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-all cursor-pointer hover:border-sky-300 group"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                <span>{language === 'ar' ? 'الحالات قيد الفحص والمتابعة' : 'Active Cases in Progress'}</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-sky-600">{trackingAppsCount}</p>
              <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-500" /> {stats.pendingApps} {language === 'ar' ? 'ملف تمويلي نشط بالفروع' : 'active files in workflow'}
              </p>
            </div>
          </div>

          {/* Charts & Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t('governorateDistribution')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{language === 'ar' ? 'توزيع طلبات التمويل على فروع المحافظات' : 'Applications distributed across governorates'}</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
                  {companyBranches.length} {language === 'ar' ? 'فروع جغرافية' : 'Branches'}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.govData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }}
                      formatter={(val: any) => [`${val} طلبات`, 'العدد']}
                    />
                    <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Required Documents List Checklist for this company */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">{t('requiredDocsList')}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {language === 'ar' ? 'المستندات الإلزامية التي تشترطها الشركة قبل توقيع العقود وصرف التمويل:' : 'Mandatory documents required before contract signing:'}
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700">
                  {activeCompany.requiredDocumentsList.map((docItem, i) => (
                    <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{docItem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('shared_docs')}
                  className="w-full bg-crobsa-50 hover:bg-crobsa-100 text-crobsa-700 border border-crobsa-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FolderLock className="h-4 w-4" />
                  {t('tabSharedDocs')}
                </button>
              </div>
            </div>
          </div>

          {/* Smart Governorate Routing & Branch Assignment Breakdown (توجيه العملاء حسب المحافظة وفروع الشركة) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'ar' ? 'منظومة التوجيه الجغرافي الذكي للفروع والمحافظات' : 'Smart Governorate & Branch Routing System'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar' 
                      ? 'التحقق من توجيه طلبات العملاء تلقائياً للفروع الواقعة في نفس المحافظة لضمان سرعة الاستعلام الميداني' 
                      : 'Auto-routing client requests to the branches located in their residential governorate'}
                  </p>
                </div>
              </div>

              {(currentUser?.role === Role.INSTALLMENT_COMPANY || currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddBranchModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{language === 'ar' ? 'إضافة فرع جديد' : 'Add Branch'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('excel_import')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'رفع كشف فروع (Excel)' : 'Upload Excel'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {stats.govDetailedData.map((govItem, idx) => {
                const matchedBranches = companyBranches.filter(b => b.governorate === govItem.name);
                const hasLocalBranch = matchedBranches.length > 0;

                return (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border transition-all ${
                      hasLocalBranch 
                        ? 'border-slate-200 hover:border-sky-300 bg-slate-50/50' 
                        : 'border-amber-200 bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                        <h4 className="font-bold text-slate-900 text-sm">{govItem.name}</h4>
                      </div>
                      <span className="text-xs font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono text-slate-800">
                        {govItem.total} {language === 'ar' ? 'طلب وارد' : 'cases'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 my-3">
                      <div className="flex items-center justify-between">
                        <span>{language === 'ar' ? 'فروع الشركة بالمحافظة:' : 'Company Branches:'}</span>
                        {hasLocalBranch ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {matchedBranches.length} {language === 'ar' ? 'فرع مفعل' : 'branch'}
                          </span>
                        ) : (
                          <span className="text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300">
                            {language === 'ar' ? 'لا يوجد فرع محلي' : 'No local branch'}
                          </span>
                        )}
                      </div>

                      {hasLocalBranch ? (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 mt-2 space-y-1">
                          <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-sky-600" />
                            {matchedBranches[0].name}
                          </p>
                          {matchedBranches[0].managerName && (
                            <p className="text-[10px] text-slate-500">
                              {language === 'ar' ? 'مدير الفرع:' : 'Manager:'} {matchedBranches[0].managerName}
                            </p>
                          )}
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            ✓ {language === 'ar' ? 'يتم توجيه طلبات المحافظة تلقائياً لهذا الفرع' : 'Cases auto-routed to this branch'}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 mt-2 text-[10px] text-amber-800">
                          {language === 'ar' 
                            ? 'يتم توجيه الحالات حالياً للفرع الرئيسي. يمكنك إضافة فرع لتوزيع أسرع.' 
                            : 'Cases routed to HQ. Add a local branch for faster field review.'}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {language === 'ar' ? 'نسبة القبول:' : 'Approval:'} <strong className="text-slate-700">{govItem.approvalRate}%</strong>
                      </span>
                      <button
                        onClick={() => {
                          setAppSearchTerm(govItem.name);
                          setActiveTab('applications');
                        }}
                        className="text-sky-600 hover:text-sky-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        <span>{language === 'ar' ? 'عرض طلبات المحافظة' : 'View cases'}</span>
                        <ChevronDown className={`h-3 w-3 -rotate-90`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: APPLICATIONS & CASES (طلبات وحالات التمويل) */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <CompanyApplicationsTab
          applications={companyApps}
          branches={companyBranches}
          staffList={companyStaffList}
          rejectionReasons={activeCompany.rejectionReasons || []}
          initialSubView="all"
          onOpenDiscussion={(app, tab) => {
            setDiscussionApp(app);
            setDiscussionTab(tab || 'comments');
          }}
          onExpedite={expediteApplication}
          onAssignOfficer={assignCompanyOfficer}
          onAssignBranchAndOfficer={assignCompanyBranchAndOfficer}
          onAutoAssignBranches={() => autoAssignCompanyBranches(companyId)}
          onUpdateStatus={async (appId, updates) => {
            await updateApplication(appId, updates);
          }}
          onSubSectionChange={(section) => {
            if (section === 'tracking') {
              handleSelectTab('followup');
            } else {
              handleSelectTab('applications');
            }
          }}
          language={language}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATABASE (CLIENT DIRECTORY & CROBSA CENTRAL DATABASE) */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          
          {/* Header & Sub-Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Search className="h-5 w-5 text-crobsa-700" />
                {t('tabDatabase')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' 
                  ? 'البحث في عملاء شركتك أو استعراض عملاء شبكة كروبsa المركزية وطلب مشاركة الملفات' 
                  : 'Search your clients or explore the CROBSA central database to request record access'}
              </p>
            </div>

            {/* Toggle between My Company Clients & Central Crobsa DB */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => setDatabaseSubTab('my_clients')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  databaseSubTab === 'my_clients'
                    ? 'bg-white text-crobsa-900 shadow font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('myCompanyClients')}
              </button>
              <button
                onClick={() => setDatabaseSubTab('crobsa_central')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  databaseSubTab === 'crobsa_central'
                    ? 'bg-white text-crobsa-900 shadow font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('crobsaCentralDb')}
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={dbSearch}
                onChange={e => setDbSearch(e.target.value)}
                placeholder={language === 'ar' ? 'بحث بالاسم، الرقم القومي، أو رقم الهاتف...' : 'Search by name, national ID, or phone...'}
                className="w-full text-sm border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <select
              value={dbGovFilter}
              onChange={e => setDbGovFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 text-slate-700 focus:outline-none"
            >
              <option value="">{language === 'ar' ? 'جميع المحافظات' : 'All Governorates'}</option>
              {EGYPT_GOVERNORATES.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          {/* Notice for Crobsa Central DB tab */}
          {databaseSubTab === 'crobsa_central' && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-800">
              <HelpCircle className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">
                  {language === 'ar' ? 'قاعدة بيانات كروبسا المركزية (CROBSA Central Directory)' : 'Central Directory Notice'}
                </strong>
                {language === 'ar' 
                  ? 'تظهر هنا سجلات العملاء المسجلين في منصة كروبسا بدون بيانات حساسة. للاطلاع على كامل الأوراق والتاريخ الائتماني، اضغط على زر "طلب استعلام / مشاركة ملف العميل" لإرسال طلب فوري لمدير نظام كروبسا للموافقة.' 
                  : 'Client records from the central CROBSA platform. Sensitive data is masked until an access request is approved by CROBSA Admin.'}
              </div>
            </div>
          )}

          {/* Mobile Clients List (بطاقات واضحة للموبايل بدون تمرير أفقي مفرط) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا يوجد عملاء يطابقون شروط البحث.' : 'No clients match the search.'}
              </div>
            ) : (
              filteredClients.map(client => {
                const authorized = isClientAuthorized(client);
                const hasPendingReq = clientRequests.some(r => r.clientId === client.id && r.companyId === companyId && r.status === 'PENDING');

                return (
                  <div key={client.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-2xl bg-crobsa-50 text-crobsa-800 font-black text-sm flex items-center justify-center shrink-0 border border-crobsa-200">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-950 text-base leading-tight">{client.name}</h4>
                          <span className="font-mono text-xs font-bold text-slate-500 block mt-0.5">
                            {authorized 
                              ? (client.nationalId || '') 
                              : (client.nationalId && client.nationalId.length >= 6)
                                ? `${client.nationalId.slice(0, 4)}••••••${client.nationalId.slice(-2)}`
                                : (client.nationalId || 'غير مسجل')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                        {client.creditRating || 'A+'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">المحافظة:</span>
                        <span className="font-bold text-slate-800">{client.governorate || 'القاهرة'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">النشاط / المهنة:</span>
                        <span className="font-bold text-slate-800">
                          {client.profession === 'MERCHANT' ? 'تاجر' : client.profession === 'FARMER' ? 'مزارع' : client.profession || 'أخرى'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <div>
                        {authorized ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <Unlock className="h-3 w-3" /> {t('accessGranted')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Lock className="h-3 w-3" /> {hasPendingReq ? 'طلب معلق' : t('accessLocked')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedClientForTimeline(client)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5 text-slate-600" />
                          <span>سجل العميل</span>
                        </button>

                        {!authorized && (
                          <button
                            type="button"
                            disabled={hasPendingReq}
                            onClick={() => setRequestAccessModalClient(client)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors ${
                              hasPendingReq
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            }`}
                          >
                            <Send className="h-3 w-3" />
                            <span>{hasPendingReq ? 'تم الإرسال' : 'طلب استعلام'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Clients Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                  <th className="px-4 py-3">{language === 'ar' ? 'اسم العميل' : 'Client Name'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الرقم القومي' : 'National ID'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'النشاط / المهنة' : 'Profession'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'التصنيف' : 'Rating'}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'صلاحية الوصول' : 'Access Status'}</th>
                  <th className="px-4 py-3 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => {
                    const authorized = isClientAuthorized(client);
                    const hasPendingReq = clientRequests.some(r => r.clientId === client.id && r.companyId === companyId && r.status === 'PENDING');

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-crobsa-50 text-crobsa-700 font-bold text-xs flex items-center justify-center">
                              {client.name.charAt(0)}
                            </div>
                            <span>{client.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {authorized 
                            ? (client.nationalId || '') 
                            : (client.nationalId && client.nationalId.length >= 6)
                              ? `${client.nationalId.slice(0, 4)}********${client.nationalId.slice(-2)}`
                              : (client.nationalId || 'غير مسجل')}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {client.governorate || 'القاهرة'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {client.profession === 'MERCHANT' ? 'تاجر' : client.profession === 'FARMER' ? 'مزارع' : client.profession || 'أخرى'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {client.creditRating || 'A+'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {authorized ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Unlock className="h-3 w-3" /> {t('accessGranted')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Lock className="h-3 w-3" /> {hasPendingReq ? (language === 'ar' ? 'طلب معلق' : 'Pending Request') : t('accessLocked')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Open Timeline Modal */}
                            <button
                              onClick={() => setSelectedClientForTimeline(client)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5 text-slate-600" />
                              {t('clientTimeline')}
                            </button>

                            {/* Request Access Button if not authorized */}
                            {!authorized && (
                              <button
                                disabled={hasPendingReq}
                                onClick={() => setRequestAccessModalClient(client)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
                                  hasPendingReq
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                }`}
                              >
                                <Send className="h-3 w-3" />
                                {hasPendingReq ? (language === 'ar' ? 'تم الإرسال' : 'Requested') : (language === 'ar' ? 'طلب استعلام' : 'Request')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      {language === 'ar' ? 'لا توجد سجلات مطابقة للبحث.' : 'No matching records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CASES WORKFLOW TRACKING & STAGES (متابعة الحالات ومسار العمل) */}
      {/* ========================================================================= */}
      {activeTab === 'followup' && (
        <CompanyApplicationsTab
          applications={companyApps}
          branches={companyBranches}
          staffList={companyStaffList}
          rejectionReasons={activeCompany.rejectionReasons || []}
          initialSubView="tracking"
          onOpenDiscussion={(app, tab) => {
            setDiscussionApp(app);
            setDiscussionTab(tab || 'comments');
          }}
          onExpedite={expediteApplication}
          onAssignOfficer={assignCompanyOfficer}
          onAssignBranchAndOfficer={assignCompanyBranchAndOfficer}
          onAutoAssignBranches={() => autoAssignCompanyBranches(companyId)}
          onUpdateStatus={async (appId, updates) => {
            await updateApplication(appId, updates);
          }}
          onSubSectionChange={(section) => {
            if (section === 'tracking') {
              handleSelectTab('followup');
            } else {
              handleSelectTab('applications');
            }
          }}
          language={language}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB: COMPREHENSIVE REPORTS & ANALYTICS (التقارير وأداء المحافظات) */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-crobsa-700" />
                {language === 'ar' ? 'التقارير التحليلية والأداء الجغرافي' : 'Reports & Geographic Analytics'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' 
                  ? 'تحليل شامل لأداء المحافظات، وتوزيع الفروع جغرافياً، ومعدلات القبول والرفض وأسبابها.' 
                  : 'Comprehensive analysis of governorates, branch performance, and rejection statistics.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-colors"
                title="تصدير إلى ملف إكسيل"
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تصدير إكسيل (Excel)' : 'Export Excel'}
              </button>

              <button
                onClick={() => setShowPdfReportModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow transition-colors"
                title="معاينة وطباعة تقرير PDF رسمي"
              >
                <Printer className="h-4 w-4" />
                {language === 'ar' ? 'تقرير رسمي (PDF)' : 'Official PDF'}
              </button>
            </div>
          </div>

          {/* Sub Navigation: Detailed Analytics vs Sales Staff Performance vs Geographic Analytics */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-thin">
            <button
              type="button"
              onClick={() => setReportsSubTab('detailed_analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'detailed_analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>{language === 'ar' ? 'لوحة الإحصائيات الشاملة والمؤشرات المتقدمة' : 'Comprehensive Analytics Dashboard'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">
                جديد تفاعلي
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReportsSubTab('sales_performance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'sales_performance'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{language === 'ar' ? 'لوحة تحكم أداء موظفي البيع والمندوبين' : 'Sales Staff Performance Dashboard'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                {salesStaffPerformance.length} موظف
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReportsSubTab('geo_analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'geo_analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>{language === 'ar' ? 'التقارير الجغرافية وتوزيع المحافظات' : 'Geographic & Regional Analytics'}</span>
            </button>
          </div>

          {/* Auto-Archive & Database Optimization Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-crobsa-950 to-slate-900 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 text-amber-400 border border-white/10 shrink-0">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">
                    {language === 'ar' ? 'نظام الأرشفة التلقائية وتنظيف قاعدة البيانات' : 'Auto-Archive & Database Optimization'}
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                    نشط ومرتبط بالفاير بيز
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {language === 'ar' 
                    ? `تفريغ المساحة وأرشفة الطلبات المرفوضة والطلبات القديمة (> 6 أشهر) لتحسين أداء واستجابة التطبيق. يوجد (${eligibleForAutoArchiveCount}) طلب مؤهل للأرشفة.`
                    : `Archive rejected & old cases (>6 months) to speed up database performance. (${eligibleForAutoArchiveCount}) cases eligible.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <button
                type="button"
                disabled={autoArchiveRunning || eligibleForAutoArchiveCount === 0}
                onClick={handleRunAutoArchive}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${autoArchiveRunning ? 'animate-spin' : ''}`} />
                <span>
                  {autoArchiveRunning 
                    ? (language === 'ar' ? 'جاري الأرشفة...' : 'Archiving...') 
                    : (language === 'ar' ? `تشغيل الأرشفة التلقائية (${eligibleForAutoArchiveCount})` : `Run Auto-Archive (${eligibleForAutoArchiveCount})`)}
                </span>
              </button>
            </div>
          </div>

          {autoArchiveResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{autoArchiveResult}</span>
              </div>
              <button onClick={() => setAutoArchiveResult(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 0: COMPREHENSIVE DETAILED ANALYTICS (الإحصائيات الشاملة والمؤشرات المتقدمة) */}
          {/* ========================================================================= */}
          {reportsSubTab === 'detailed_analytics' && (
            <ComprehensiveAnalyticsSection
              applications={companyApps}
              branches={companyBranches}
              companyName={activeCompany.name}
              creditCeiling={activeCompany.creditCeiling}
              language={language}
            />
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 1: SALES STAFF PERFORMANCE DASHBOARD (لوحة أداء موظفي البيع) */}
          {/* ========================================================================= */}
          {reportsSubTab === 'sales_performance' && (
            <div className="space-y-6">
              {/* Top Sales KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200">
                  <div className="flex items-center justify-between text-sky-800 text-xs font-bold mb-1">
                    <span>موظفو البيع النشطون</span>
                    <Users className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="text-2xl font-black text-sky-950 font-mono mt-1">
                    {salesStaffPerformance.length}
                  </p>
                  <p className="text-[11px] text-sky-600 mt-0.5 font-medium">
                    مندوب ومسؤول مبيعات مسجل
                  </p>
                </div>

                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200">
                  <div className="flex items-center justify-between text-indigo-800 text-xs font-bold mb-1">
                    <span>الطلبات المرفوعة</span>
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-black text-indigo-950 font-mono mt-1">
                    {salesStaffPerformance.reduce((s, i) => s + i.totalSubmitted, 0)}
                  </p>
                  <p className="text-[11px] text-indigo-600 mt-0.5 font-medium">
                    طلب تمويل وارد من المندوبين
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
                    <span>متوسط معدل القبول</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                    {salesStaffPerformance.length > 0 
                      ? Math.round(salesStaffPerformance.reduce((s, i) => s + i.approvalRate, 0) / salesStaffPerformance.length) 
                      : 0}%
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                    نسبة قبول حالات المبيعات
                  </p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
                    <span>متوسط سرعة المعالجة</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-amber-900 font-mono mt-1">
                    {salesStaffPerformance.length > 0 
                      ? (salesStaffPerformance.reduce((s, i) => s + i.avgSpeedHours, 0) / salesStaffPerformance.length).toFixed(1)
                      : '20'} <span className="text-xs font-bold text-slate-600">ساعة</span>
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                    متوسط زمن دراسة طلبات المندوب
                  </p>
                </div>

                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between text-purple-800 text-xs font-bold mb-1">
                    <span>المبيعات المعتمدة</span>
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-lg lg:text-xl font-black text-purple-950 font-mono mt-1 truncate">
                    {salesStaffPerformance.reduce((s, i) => s + i.approvedVolume, 0).toLocaleString()} <span className="text-xs font-bold font-sans">ج.م</span>
                  </p>
                  <p className="text-[11px] text-purple-700 mt-0.5 font-medium truncate">
                    الأعلى: {salesStaffPerformance[0]?.salesman.name || 'لا يوجد'}
                  </p>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="h-4 w-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={salesSearchQuery}
                    onChange={e => setSalesSearchQuery(e.target.value)}
                    placeholder="بحث باسم موظف البيع، اسم المستخدم، أو المحافظة..."
                    className="w-full pr-10 pl-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                  {salesSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSalesSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">تصنيف الأداء:</span>
                  <select
                    value={salesRatingFilter}
                    onChange={e => setSalesRatingFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="ALL">جميع التقييمات</option>
                    <option value="EXCELLENT">ممتاز (≥ 75%)</option>
                    <option value="VERY_GOOD">جيد جداً (60% - 74%)</option>
                    <option value="GOOD">مقبول (45% - 59%)</option>
                    <option value="NEEDS_IMPROVEMENT">يحتاج متابعة (&lt; 45%)</option>
                  </select>

                  <div className="text-xs text-slate-500 font-medium mr-2">
                    عرض <strong>{filteredSalesStaff.length}</strong> من أصل <strong>{salesStaffPerformance.length}</strong>
                  </div>
                </div>
              </div>

              {/* Visual Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Applications Volume & Acceptance by Salesman */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-sky-600" />
                        <span>مقارنة أداء موظفي البيع (المرفوعة vs المقبولة vs المرفوضة)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">حجم الإنتاجية ومعدلات الإنجاز لمسؤولي البيع</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={filteredSalesStaff.slice(0, 6).map(item => ({
                          name: item.salesman.name.split(' ')[0] + ' ' + (item.salesman.name.split(' ')[1] || ''),
                          submitted: item.totalSubmitted,
                          approved: item.approvedCount,
                          rejected: item.rejectedCount,
                          rate: item.approvalRate
                        }))} 
                        margin={{ top: 15, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="submitted" name="إجمالي المرفوع" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="approved" name="المقبول" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rejected" name="المرفوض" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Turnaround Speed & Processing Hours */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>متوسط سرعة معالجة ودراسة طلبات كل موظف (ساعات العمل)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">كلما قل عدد الساعات دل على سرعة وسلاسة استيفاء الأوراق والبت</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={filteredSalesStaff.slice(0, 6).map(item => ({
                          name: item.salesman.name.split(' ')[0] + ' ' + (item.salesman.name.split(' ')[1] || ''),
                          speed: item.avgSpeedHours,
                          rate: item.approvalRate
                        }))} 
                        margin={{ top: 15, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" unit=" س" />
                        <Tooltip formatter={(val: any) => [`${val} ساعة عمل`, 'متوسط سرعة المعالجة']} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="speed" name="متوسط سرعة المعالجة (ساعات)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Sales Staff Matrix Table */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span>جدول مصفوفة أداء موظفي البيع ومعدلات القبول وسرعة الإنجاز</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تقييم شامل لكل موظف بيع بناءً على جودة الحالات المرفوعة، نسب الاعتماد، وزمن المعالجة.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="px-4 py-3">موظف البيع / المندوب</th>
                        <th className="px-4 py-3">اسم المستخدم</th>
                        <th className="px-4 py-3 text-center">الطلبات المرفوعة</th>
                        <th className="px-4 py-3 text-center text-emerald-700">المقبول</th>
                        <th className="px-4 py-3 text-center text-rose-700">المرفوض</th>
                        <th className="px-4 py-3 text-center text-sky-700">قيد الفحص</th>
                        <th className="px-4 py-3 text-center">معدل القبول %</th>
                        <th className="px-4 py-3 text-center">سرعة المعالجة</th>
                        <th className="px-4 py-3">إجمالي المبيعات المعتمدة</th>
                        <th className="px-4 py-3 text-center">تقييم الأداء</th>
                        <th className="px-4 py-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSalesStaff.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400">
                            لا يوجد موظفو بيع يطابقون شروط البحث الحالية.
                          </td>
                        </tr>
                      ) : (
                        filteredSalesStaff.map(item => (
                          <tr key={item.salesman.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-600 to-crobsa-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  {item.salesman.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{item.salesman.name}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {item.salesman.governorate || 'القاهرة'} • {item.salesman.role === Role.SALESMAN ? 'مسؤول بيع مباشر' : 'مورد معتمد'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 font-mono text-sky-800 font-bold">
                              @{item.salesman.username || item.salesman.email.split('@')[0]}
                            </td>

                            <td className="px-4 py-3 text-center font-bold font-mono text-slate-900 text-sm">
                              {item.totalSubmitted}
                            </td>

                            <td className="px-4 py-3 text-center font-bold font-mono text-emerald-600 text-sm">
                              {item.approvedCount}
                            </td>

                            <td className="px-4 py-3 text-center font-bold font-mono text-rose-600 text-sm">
                              {item.rejectedCount}
                            </td>

                            <td className="px-4 py-3 text-center font-bold font-mono text-sky-600 text-sm">
                              {item.pendingCount}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  item.approvalRate >= 70 ? 'bg-emerald-100 text-emerald-800' :
                                  item.approvalRate >= 50 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {item.approvalRate}%
                                </span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      item.approvalRate >= 70 ? 'bg-emerald-500' :
                                      item.approvalRate >= 50 ? 'bg-sky-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(5, item.approvalRate))}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-center font-mono">
                              <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>{item.avgSpeedHours} ساعة</span>
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono font-bold text-slate-900 text-xs">
                              {item.approvedVolume.toLocaleString()} {t('egp')}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${item.ratingBadge}`}>
                                {item.ratingLabel}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedSalesmanDetails(item)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors flex items-center gap-1 mx-auto shadow-2xs"
                              >
                                <Eye className="h-3 w-3 text-sky-400" />
                                <span>استعراض الطلبات ({item.totalSubmitted})</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW 2: GEOGRAPHIC & REGIONAL ANALYTICS (التقارير الجغرافية) */}
          {/* ========================================================================= */}
          {reportsSubTab === 'geo_analytics' && (
            <div className="space-y-6">
              {/* Report Filters */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'تصفية التقرير:' : 'Filter Report:'}</span>
                </div>

                <select
                  value={reportGovFilter}
                  onChange={e => setReportGovFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
                >
                  <option value="">{language === 'ar' ? 'جميع المحافظات' : 'All Governorates'}</option>
                  {Array.from(new Set(companyApps.map(a => a.governorate).filter(Boolean))).map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>

                <select
                  value={reportBranchFilter}
                  onChange={e => setReportBranchFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
                >
                  <option value="">{language === 'ar' ? 'جميع الفروع' : 'All Branches'}</option>
                  {companyBranches.map(br => (
                    <option key={br.id} value={br.id}>{br.name} ({br.governorate})</option>
                  ))}
                </select>

                {(reportGovFilter || reportBranchFilter) && (
                  <button
                    onClick={() => {
                      setReportGovFilter('');
                      setReportBranchFilter('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                  >
                    {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
                  </button>
                )}

                <div className="mr-auto text-xs text-slate-500 font-medium">
                  {language === 'ar' ? 'عدد الحالات المشمولة:' : 'Covered Cases:'} <strong>{filteredReportApps.length}</strong>
                </div>
              </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800">{t('totalAccepted')}</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {filteredReportApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                {stats.approvalRate}% {language === 'ar' ? 'نسبة القبول العامة' : 'overall approval'}
              </p>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
              <p className="text-xs font-bold text-rose-800">{t('totalRejected')}</p>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {filteredReportApps.filter(a => a.status === ApplicationStatus.REJECTED).length}
              </p>
              <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
                {stats.rejectedApps} {language === 'ar' ? 'حالة مرفوضة إجمالاً' : 'total rejected'}
              </p>
            </div>

            <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200">
              <p className="text-xs font-bold text-sky-800">{t('totalPending')}</p>
              <p className="text-2xl font-black text-sky-700 mt-1">
                {filteredReportApps.filter(a => ![ApplicationStatus.APPROVED, ApplicationStatus.AMOUNT_TRANSFERRED, ApplicationStatus.REJECTED].includes(a.status)).length}
              </p>
              <p className="text-[11px] text-sky-600 mt-0.5 font-medium">
                {language === 'ar' ? 'قيد الفحص والمراجعة' : 'in-review'}
              </p>
            </div>

            <div className="bg-crobsa-50/70 p-4 rounded-2xl border border-crobsa-200">
              <p className="text-xs font-bold text-crobsa-800">{language === 'ar' ? 'إجمالي المحفظة المصروفة' : 'Disbursed Portfolio'}</p>
              <p className="text-xl lg:text-2xl font-black text-crobsa-950 mt-1 font-mono">
                {stats.totalApprovedVolume.toLocaleString()} {t('egp')}
              </p>
              <p className="text-[11px] text-crobsa-700 mt-0.5 font-medium">
                {language === 'ar' ? 'سقف الائتمان:' : 'Ceiling:'} {activeCompany.creditCeiling.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Interactive Recharts Section */}
          <div className="space-y-6">
            
            {/* Interactive Timeline & Financial Collections Recharts Dashboard (توزيع الطلبات والمحصلات المالية بمرور الوقت) */}
            <div className="border border-slate-200/90 rounded-3xl p-6 bg-white shadow-sm space-y-6">
              
              {/* Header and Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-crobsa-50 text-crobsa-700">
                      <BarChart3 className="h-5 w-5" />
                    </span>
                    <h3 className="font-black text-slate-900 text-lg">
                      {language === 'ar' ? 'لوحة التدفقات والأداء الزمني (توزيع الطلبات والمحصلات بمرور الوقت)' : 'Temporal Performance & Collections Over Time'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    {language === 'ar' 
                      ? 'متابعة بيانية تفاعلية لحجم التمويلات المنصرفة مقابل المحصلات المالية والأقساط المستردة، ونمو عدد الطلبات الواردة ونسب القبول شهرياً' 
                      : 'Interactive tracking of disbursed volume vs collected installments and applications flow over time'}
                  </p>
                </div>

                {/* Range & Metric Controls */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                  {/* Range Selector */}
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTimeSeriesRange('3m')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeSeriesRange === '3m' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ar' ? 'آخر 3 أشهر' : 'Last 3M'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesRange('6m')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeSeriesRange === '6m' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ar' ? 'آخر 6 أشهر' : 'Last 6M'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesRange('12m')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        timeSeriesRange === '12m' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'ar' ? 'العام كاملاً' : 'Full Year'}
                    </button>
                  </div>

                  {/* Metric Mode Switcher */}
                  <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTimeSeriesMetric('collections')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        timeSeriesMetric === 'collections' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{language === 'ar' ? 'المحصلات والتدفقات' : 'Cash Flow'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesMetric('volume')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        timeSeriesMetric === 'volume' ? 'bg-sky-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{language === 'ar' ? 'توزيع الطلبات' : 'Applications'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSeriesMetric('recovery')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                        timeSeriesMetric === 'recovery' ? 'bg-purple-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PieIcon className="h-3.5 w-3.5" />
                      <span>{language === 'ar' ? 'كفاءة التحصيل %' : 'Recovery %'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
                    <span>{language === 'ar' ? 'إجمالي المحصلات المالية' : 'Total Collections'}</span>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-xl lg:text-2xl font-black text-emerald-700 font-mono">
                    {timeSeriesTotals.totalCollected.toLocaleString()} {t('egp')}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                    {language === 'ar' ? 'أقساط محصلة بالفعل بالبنوك وفوري' : 'Actual collected installments'}
                  </p>
                </div>

                <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sky-800 text-xs font-bold mb-1">
                    <span>{language === 'ar' ? 'إجمالي التمويل المنصرف' : 'Disbursed Volume'}</span>
                    <Building2 className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="text-xl lg:text-2xl font-black text-sky-700 font-mono">
                    {timeSeriesTotals.totalDisbursed.toLocaleString()} {t('egp')}
                  </p>
                  <p className="text-[10px] text-sky-600 mt-1 font-medium">
                    {language === 'ar' ? 'تمويلات مفعلة للموردين والعملاء' : 'Financed contracts active'}
                  </p>
                </div>

                <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-purple-800 text-xs font-bold mb-1">
                    <span>{language === 'ar' ? 'متوسط نسبة الاسترداد' : 'Avg Collection Rate'}</span>
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-xl lg:text-2xl font-black text-purple-700 font-mono">
                    {timeSeriesTotals.avgCollectionRate}%
                  </p>
                  <p className="text-[10px] text-purple-600 mt-1 font-medium">
                    {language === 'ar' ? 'كفاءة سداد استثنائية' : 'Outstanding recovery rate'}
                  </p>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
                    <span>{language === 'ar' ? 'حركة طلبات التمويل' : 'Applications Flow'}</span>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-xl lg:text-2xl font-black text-amber-800 font-mono">
                    {timeSeriesTotals.totalApps} {language === 'ar' ? 'طلب' : 'apps'}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1 font-medium">
                    {timeSeriesTotals.totalApproved} {language === 'ar' ? 'معتمد ومقبول ائتمانياً' : 'approved'}
                  </p>
                </div>
              </div>

              {/* Main Interactive Recharts Graph Container */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 lg:p-6">
                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    {timeSeriesMetric === 'collections' ? (
                      <AreaChart data={timeSeriesData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                          </linearGradient>
                          <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02}/>
                          </linearGradient>
                          <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="shortMonth" fontSize={12} stroke="#64748b" />
                        <YAxis 
                          fontSize={12} 
                          stroke="#64748b" 
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1.5 font-sans" dir="rtl">
                                  <p className="font-bold text-sky-300 text-sm border-b border-slate-700 pb-1 flex items-center justify-between">
                                    <span>{d.month}</span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                                      تحصيل {d.collectionRate}%
                                    </span>
                                  </p>
                                  <div className="space-y-1 pt-1">
                                    <p className="text-emerald-400 flex items-center justify-between gap-4">
                                      <span>المحصلات المالية الفعلية:</span>
                                      <strong className="font-mono">{d.collectedAmount.toLocaleString()} ج.م</strong>
                                    </p>
                                    <p className="text-sky-300 flex items-center justify-between gap-4">
                                      <span>حجم التمويل المنصرف:</span>
                                      <strong className="font-mono">{d.disbursedAmount.toLocaleString()} ج.م</strong>
                                    </p>
                                    <p className="text-rose-400 flex items-center justify-between gap-4">
                                      <span>أقساط متأخرة مستحقة:</span>
                                      <strong className="font-mono">{d.overdueAmount.toLocaleString()} ج.م</strong>
                                    </p>
                                    <p className="text-slate-300 pt-1 border-t border-slate-800 flex items-center justify-between gap-4">
                                      <span>عدد الطلبات:</span>
                                      <span>{d.applicationsCount} طلب ({d.approvedCount} معتمد)</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          formatter={(value) => {
                            if (value === 'collectedAmount') return 'المحصلات المالية والأقساط (ج.م)';
                            if (value === 'disbursedAmount') return 'حجم التمويل المنصرف (ج.م)';
                            if (value === 'overdueAmount') return 'الأقساط المتأخرة (ج.م)';
                            return value;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="collectedAmount" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#colorCollected)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="disbursedAmount" 
                          stroke="#0ea5e9" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorDisbursed)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="overdueAmount" 
                          stroke="#f43f5e" 
                          strokeWidth={1.5} 
                          strokeDasharray="4 4"
                          fillOpacity={1} 
                          fill="url(#colorOverdue)" 
                        />
                      </AreaChart>
                    ) : timeSeriesMetric === 'volume' ? (
                      <BarChart data={timeSeriesData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="shortMonth" fontSize={12} stroke="#64748b" />
                        <YAxis fontSize={12} stroke="#64748b" allowDecimals={false} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1" dir="rtl">
                                  <p className="font-bold text-sky-300 text-sm border-b border-slate-700 pb-1">{d.month}</p>
                                  <p className="text-slate-200">إجمالي الطلبات: <strong className="font-mono text-white">{d.applicationsCount}</strong></p>
                                  <p className="text-emerald-400">الطلبات المعتمدة: <strong className="font-mono text-white">{d.approvedCount}</strong></p>
                                  <p className="text-rose-400">الطلبات المرفوضة: <strong className="font-mono text-white">{d.rejectedCount}</strong></p>
                                  <p className="text-sky-300">نسبة القبول: <strong>{Math.round((d.approvedCount / Math.max(d.applicationsCount, 1)) * 100)}%</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          formatter={(value) => {
                            if (value === 'applicationsCount') return 'إجمالي الطلبات المقدمة';
                            if (value === 'approvedCount') return 'الطلبات المعتمدة';
                            if (value === 'rejectedCount') return 'الطلبات المرفوضة';
                            return value;
                          }}
                        />
                        <Bar dataKey="applicationsCount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="approvedCount" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rejectedCount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={timeSeriesData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="shortMonth" fontSize={12} stroke="#64748b" />
                        <YAxis fontSize={12} stroke="#64748b" domain={[80, 100]} unit="%" />
                        <Tooltip 
                          formatter={(val: any) => [`${val}%`, 'نسبة التحصيل']}
                          labelFormatter={(label) => `شهر ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          formatter={() => 'معدل كفاءة واسترداد الأقساط (%)'}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="collectionRate" 
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} 
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Performance Table (Collapsible Details) */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border border-slate-100 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">الشهر</th>
                      <th className="px-4 py-2.5 text-center">الطلبات الواردة</th>
                      <th className="px-4 py-2.5 text-center text-emerald-700">المعتمدة</th>
                      <th className="px-4 py-2.5">التمويل المنصرف</th>
                      <th className="px-4 py-2.5 text-emerald-700">المحصلات والأقساط</th>
                      <th className="px-4 py-2.5 text-rose-700">المتأخرات</th>
                      <th className="px-4 py-2.5 text-center">كفاءة التحصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {timeSeriesData.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{d.month}</td>
                        <td className="px-4 py-2.5 text-center font-bold font-mono">{d.applicationsCount}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-emerald-700 font-mono">{d.approvedCount}</td>
                        <td className="px-4 py-2.5 font-mono">{d.disbursedAmount.toLocaleString()} {t('egp')}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">{d.collectedAmount.toLocaleString()} {t('egp')}</td>
                        <td className="px-4 py-2.5 font-mono text-rose-600">{d.overdueAmount.toLocaleString()} {t('egp')}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {d.collectionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Main Interactive Geographic Distribution (Governorates & Branches Performance) */}
            <div className="border border-slate-200 rounded-3xl p-5 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-sky-600" />
                    {language === 'ar' ? 'توزيع الحالات وأداء الفروع حسب المحافظات (جغرافياً)' : 'Geographic Distribution of Cases by Governorate'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? 'يوضح المخطط عدد الحالات المقبولة، المرفوضة، وقيد الفحص في كل محافظة' : 'Shows accepted, rejected, and pending cases across governorates'}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    {language === 'ar' ? 'معتمد' : 'Approved'}
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-bold">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    {language === 'ar' ? 'مرفوض' : 'Rejected'}
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 font-bold">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                    {language === 'ar' ? 'قيد الفحص' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.govDetailedData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={12} stroke="#475569" />
                    <YAxis fontSize={12} stroke="#475569" allowDecimals={false} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold text-sky-300 text-sm border-b border-slate-700 pb-1">{label}</p>
                              <p className="text-emerald-400">{language === 'ar' ? 'حالات معتمدة:' : 'Approved:'} <span className="font-bold">{data.approved}</span></p>
                              <p className="text-rose-400">{language === 'ar' ? 'حالات مرفوضة:' : 'Rejected:'} <span className="font-bold">{data.rejected}</span></p>
                              <p className="text-sky-400">{language === 'ar' ? 'قيد المراجعة:' : 'Pending:'} <span className="font-bold">{data.pending}</span></p>
                              <p className="text-slate-300 pt-1 border-t border-slate-800">
                                {language === 'ar' ? 'حجم التمويل المعتمد:' : 'Volume:'} <span className="font-mono font-bold text-white">{data.volume.toLocaleString()} {t('egp')}</span>
                              </p>
                              <p className="text-amber-300">{language === 'ar' ? 'معدل القبول:' : 'Approval Rate:'} {data.approvalRate}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="approved" name="معتمد" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="pending" name="قيد الفحص" fill="#0ea5e9" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="rejected" name="مرفوض" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Visual Charts: Rejection Reasons & Overall Portfolio Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rejection Reasons Distribution */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    {language === 'ar' ? 'تحليل أسباب الرفض الأكثر تكراراً' : 'Most Frequent Rejection Reasons'}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {stats.rejectedApps} {language === 'ar' ? 'حالات مسجلة' : 'cases'}
                  </span>
                </div>

                {stats.rejectionReasonsData.length > 0 ? (
                  <div className="space-y-3">
                    {stats.rejectionReasonsData.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.reason}</span>
                          <span className="font-bold text-rose-600 font-mono">{item.count} {language === 'ar' ? 'حالة' : 'cases'}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-rose-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(15, (item.count / Math.max(stats.rejectedApps, 1)) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {language === 'ar' ? 'لا توجد حالات مرفوضة مسجلة حالياً.' : 'No rejected cases found.'}
                  </div>
                )}
              </div>

              {/* Status Breakdown Pie */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <PieIcon className="h-4 w-4 text-crobsa-700" />
                    {language === 'ar' ? 'معدلات الحالات الإجمالية بالمحفظة' : 'Portfolio Status Distribution'}
                  </h4>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={4}
                        label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats.statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table: Branches & Governorates Performance */}
            <div className="border border-slate-200 rounded-3xl p-5 bg-white shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-crobsa-700" />
                {language === 'ar' ? 'جدول أداء فروع ومحافظات شركة التقسيط' : 'Branch Performance Matrix'}
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="px-4 py-2.5">{language === 'ar' ? 'المحافظة / الفرع' : 'Branch / Gov'}</th>
                      <th className="px-4 py-2.5">{language === 'ar' ? 'مدير الفرع' : 'Manager'}</th>
                      <th className="px-4 py-2.5 text-center">{language === 'ar' ? 'إجمالي الطلبات' : 'Total'}</th>
                      <th className="px-4 py-2.5 text-center text-emerald-700">{language === 'ar' ? 'المعتمد' : 'Approved'}</th>
                      <th className="px-4 py-2.5 text-center text-rose-700">{language === 'ar' ? 'المرفوض' : 'Rejected'}</th>
                      <th className="px-4 py-2.5">{language === 'ar' ? 'المحفظة المعتمدة' : 'Volume'}</th>
                      <th className="px-4 py-2.5 text-center">{language === 'ar' ? 'نسبة القبول' : 'Approval %'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats.branchPerformance.map(br => {
                      const rate = br.totalApps > 0 ? Math.round((br.approvedApps / br.totalApps) * 100) : 0;
                      return (
                        <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{br.name}</p>
                            <p className="text-[11px] text-slate-400">{br.governorate}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{br.managerName || 'مسؤول الفرع'}</td>
                          <td className="px-4 py-3 text-center font-bold">{br.totalApps}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600">{br.approvedApps}</td>
                          <td className="px-4 py-3 text-center font-bold text-rose-600">{br.rejectedApps}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {br.volume.toLocaleString()} {t('egp')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              rate >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* ========================================================================= */}
      {/* TAB: BRANCH TRANSFERS MANAGEMENT (طلبات تبديل الفروع الواردة من مديري الفروع) */}
      {/* ========================================================================= */}
      {activeTab === 'branch_transfers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-sky-600" />
                {language === 'ar' ? 'طلبات تبديل وتحويل ملفات العملاء بين الفروع' : 'Branch Transfer Requests'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' 
                  ? 'مراجعة واعتماد طلبات مديري الفروع لنقل ملفات العملاء إلى فروع أخرى بناءً على النطاق الجغرافي وسهولة المتابعة.'
                  : 'Review and approve branch transfer requests submitted by branch managers.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>
                  {applications.filter(a => a.branchTransferRequest?.status === 'PENDING').length} طلبات قيد الانتظار
                </span>
              </span>
            </div>
          </div>

          {/* Transfer Requests List */}
          {(() => {
            const transferApps = applications.filter(a => !!a.branchTransferRequest);

            if (transferApps.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">لا توجد أي طلبات تبديل فروع حالياً</p>
                  <p className="text-xs text-slate-400">عندما يقوم أي مدير فرع بطلب تحويل عميل لفرع آخر، سيظهر الطلب هنا فوراً للبت فيه.</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {transferApps.map(app => {
                  const req = app.branchTransferRequest!;
                  const isPending = req.status === 'PENDING';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <div 
                      key={app.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isPending 
                          ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-300/40' 
                          : isApproved 
                          ? 'border-emerald-200 bg-emerald-50/20' 
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Application & Client Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                              {app.id}
                            </span>
                            <h4 className="text-sm font-black text-slate-900">{app.clientName}</h4>
                            <span className="text-xs text-slate-500 font-mono">({app.clientNationalId})</span>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {app.requestedAmount.toLocaleString()} ج.م
                            </span>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {app.governorate}
                            </span>
                          </div>

                          {/* Branch Transfer Path */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-500">الفرع الحالي / الطالب:</span>
                              <strong className="text-slate-800">{app.assignedBranchName || 'الفرع السابق'}</strong>
                            </div>

                            <ArrowLeftRight className="h-4 w-4 text-sky-600 hidden sm:block rotate-180" />

                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-sky-600" />
                              <span className="text-slate-500">الفرع المطلوب التحويل إليه:</span>
                              <strong className="text-sky-900 font-bold bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                                {req.targetBranchName}
                              </strong>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="text-xs space-y-1">
                            <span className="font-bold text-slate-700">سبب طلب التبديل من مدير الفرع:</span>
                            <p className="p-2.5 bg-slate-100/80 rounded-xl text-slate-800 border border-slate-200/80 leading-relaxed italic">
                              "{req.reason}"
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                              <span>طُلب بواسطة: <strong className="text-slate-600">{req.requestedByName}</strong></span>
                              <span>•</span>
                              <span>بتاريخ: {new Date(req.requestedAt).toLocaleString('ar-EG')}</span>
                              {req.reviewNote && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold text-slate-700">ملاحظة القرار: {req.reviewNote}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end justify-between gap-3 self-stretch lg:self-auto shrink-0">
                          <div>
                            {isPending && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                بانتظار قرار الإدارة
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                تمت الموافقة ونقل الملف
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
                                <X className="h-3.5 w-3.5 text-rose-600" />
                                مرفوض من الإدارة
                              </span>
                            )}
                          </div>

                          {/* Admin Action Buttons */}
                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await reviewBranchTransfer(app.id, true, 'تمت الموافقة ونقل ملف العميل للفرع المطلوب بنجاح');
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors active:scale-95"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>موافقة وتحويل الفرع</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  await reviewBranchTransfer(app.id, false, 'تم رفض طلب النقل: العميل بنطاق الفرع الحالي');
                                }}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors active:scale-95"
                              >
                                <span>رفض الطلب</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: BRANCHES MANAGEMENT (إدارة الفروع - مستقلة تماماً) */}
      {/* ========================================================================= */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-crobsa-700" />
                {language === 'ar' ? 'إدارة الفروع والمواقع الجغرافية' : 'Branch Management'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' ? 'إدارة فروع الشركة الإقليمية ومسؤولي الفروع والتوزيع الجغرافي للمحافظات.' : 'Manage company regional branches and assigned managers.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddBranchModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('addBranch')}
            </button>
          </div>

          {/* Governorate Filter Bar (تصفية الفروع حسب المحافظة) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Filter className="h-4 w-4 text-sky-600" />
                <span>{language === 'ar' ? 'تصفية الفروع حسب المحافظة:' : 'Filter by Governorate:'}</span>
              </div>
              
              {/* Dropdown for All 27 Egyptian Governorates */}
              <select
                value={branchGovFilter}
                onChange={e => setBranchGovFilter(e.target.value)}
                className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ALL">{language === 'ar' ? 'جميع المحافظات (عرض كل الفروع)' : 'All Governorates'}</option>
                {EGYPT_GOVERNORATES.map(g => {
                  const count = companyBranches.filter(b => b.governorate === g).length;
                  return (
                    <option key={g} value={g}>
                      {g} {count > 0 ? `(${count} فرع)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Quick Badges for Active Branch Governorates */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <button
                type="button"
                onClick={() => setBranchGovFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  branchGovFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'} ({companyBranches.length})
              </button>
              {Array.from(new Set(companyBranches.map(b => b.governorate))).map(gov => {
                const count = companyBranches.filter(b => b.governorate === gov).length;
                const isSelected = branchGovFilter === gov;
                return (
                  <button
                    key={gov}
                    type="button"
                    onClick={() => setBranchGovFilter(gov)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{gov}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isSelected ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick branch stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100">
              <p className="text-xs font-bold text-sky-800">{language === 'ar' ? 'إجمالي الفروع' : 'Total Branches'}</p>
              <p className="text-2xl font-black text-sky-900 mt-1">{filteredCompanyBranches.length}</p>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-800">{language === 'ar' ? 'المحافظات المغطاة' : 'Covered Governorates'}</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {new Set(filteredCompanyBranches.map(b => b.governorate)).size}
              </p>
            </div>
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
              <p className="text-xs font-bold text-purple-800">{language === 'ar' ? 'فريق العمل بالفروع' : 'Branch Staff'}</p>
              <p className="text-2xl font-black text-purple-900 mt-1">
                {companyStaffList.filter(s => filteredCompanyBranches.some(fb => fb.id === s.branchId || fb.name === s.branchName)).length}
              </p>
            </div>
            <div className="bg-crobsa-50/60 p-4 rounded-2xl border border-crobsa-100">
              <p className="text-xs font-bold text-crobsa-800">{language === 'ar' ? 'متوسط سرعة المعالجة' : 'Avg. Processing Speed'}</p>
              <p className="text-2xl font-black text-crobsa-950 mt-1">24 {language === 'ar' ? 'ساعة' : 'hours'}</p>
            </div>
          </div>

          {/* Branches Cards */}
          {filteredCompanyBranches.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Building2 className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {language === 'ar' ? `لا توجد فروع مسجلة في محافظة ${branchGovFilter}` : 'No branches found for this filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setNewBranchData(prev => ({ ...prev, governorate: branchGovFilter !== 'ALL' ? branchGovFilter : 'القاهرة' }));
                  setShowAddBranchModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-crobsa-700 text-white hover:bg-crobsa-800"
              >
                <Plus className="h-4 w-4" />
                <span>{language === 'ar' ? `إضافة أول فرع في ${branchGovFilter}` : 'Add Branch'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanyBranches.map(br => {
                const branchApps = companyApps.filter(a => a.assignedBranchId === br.id || a.branchName === br.name || (!a.assignedBranchId && a.governorate === br.governorate));
                const branchStaff = companyStaffList.filter(s => s.branchId === br.id || s.branchName === br.name);
                const approvedCount = branchApps.filter(a => a.status === ApplicationStatus.APPROVED).length;
                const branchVolume = branchApps.filter(a => a.status === ApplicationStatus.APPROVED).reduce((sum, a) => sum + (a.approvedAmount || a.requestedAmount), 0);
                const managerUser = users.find(u => u.branchId === br.id && (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER)) || users.find(u => u.name === br.managerName && u.companyId === companyId);

                return (
                  <div key={br.id} className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="font-bold text-slate-900 text-base leading-snug">{br.name}</h4>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                            كود الفرع: {br.id}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 shrink-0">
                          {br.governorate}
                        </span>
                      </div>

                      {/* Contact & Location Details */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{br.address || 'العنوان المسجل لدى هيئة الرقابة المالية'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 font-mono">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{br.phone || '0224050607'}</span>
                        </p>
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-500">{language === 'ar' ? 'مدير الفرع:' : 'Manager:'}</span>
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            {managerUser ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                            <span>{br.managerName || managerUser?.name || 'مسؤول الفرع'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Mini KPIs strip */}
                      <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">الطلبات</span>
                          <strong className="text-xs font-bold text-slate-900">{branchApps.length}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">المعتمد</span>
                          <strong className="text-xs font-bold text-emerald-700">{approvedCount}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-500 block">الموظفين</span>
                          <strong className="text-xs font-bold text-sky-700">{branchStaff.length}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Rich Action Toolbar for Account Manager */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBranchForStats(br)}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors"
                          title="عرض إحصائيات وأداء الفرع وحالاته"
                        >
                          <TrendingUp className="h-3.5 w-3.5 text-sky-600" />
                          <span>{language === 'ar' ? 'أداء الفرع' : 'Stats'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewStaffData(prev => ({
                              ...prev,
                              branchId: br.id,
                              branchName: br.name,
                              governorate: br.governorate
                            }));
                            setShowAddStaffModal(true);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
                          title="إضافة موظف أو مسؤول ائتمان في هذا الفرع"
                        >
                          <Plus className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{language === 'ar' ? 'إضافة موظف' : '+ Staff'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setBranchForPasswordChange(br);
                            setBranchNewPassword('');
                            setBranchPasswordSuccess(null);
                          }}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition-colors"
                          title="تغيير كلمة مرور حساب الفرع ومدير الفرع"
                        >
                          <KeyRound className="h-3 w-3 text-amber-600" />
                          <span>{language === 'ar' ? 'الباسورد' : 'Pass'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingBranch(br);
                            setEditBranchForm({
                              name: br.name,
                              governorate: br.governorate,
                              address: br.address || '',
                              phone: br.phone || '',
                              managerName: br.managerName || ''
                            });
                          }}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
                          title="تعديل بيانات الفرع"
                        >
                          <Edit3 className="h-3 w-3 text-slate-600" />
                          <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBranchForStaffView(br)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold transition-colors"
                          title="عرض وإدارة فريق عمل هذا الفرع"
                        >
                          <Users className="h-3 w-3 text-purple-600" />
                          <span>{language === 'ar' ? 'الفريق' : 'Team'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: STAFF MANAGEMENT (فريق العمل ومسؤولو الائتمان - مستقلة تماماً) */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-crobsa-700" />
                {language === 'ar' ? 'إدارة فريق العمل ومسؤولي الائتمان' : 'Staff & Credit Officers'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t('staffSubtitle')}</p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('createStaffDirect')}
            </button>
          </div>

          {/* Search Box in Staff Tab */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:max-w-md">
              <Search className="h-4 w-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={e => setStaffSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث بالاسم، اسم المستخدم، الفرع، المحافظة، أو الدور...' : 'Search staff by name, username, branch, role...'}
                className="w-full pr-10 pl-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {staffSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStaffSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              <span>{language === 'ar' ? 'إجمالي الموظفين:' : 'Total Staff:'} </span>
              <strong className="text-slate-900 font-bold">{filteredCompanyStaffList.length}</strong>
              {staffSearchQuery && <span> (مطابق للبحث من {companyStaffList.length})</span>}
            </div>
          </div>

          {/* Mobile Staff Cards View (عرض موظفي الشركة بنسخة الموبايل بدون تمرير أفقي) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {filteredCompanyStaffList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {language === 'ar' ? 'لا يوجد موظفون يطابقون شروط البحث.' : 'No staff members match the search.'}
              </div>
            ) : (
              filteredCompanyStaffList.map(member => (
                <div key={member.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center shrink-0 border border-slate-200">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-950 text-base leading-tight">{member.name}</h4>
                        <span className="font-mono text-xs font-bold text-sky-700 block mt-0.5">
                          @{member.username || member.email?.split('@')[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-xl shrink-0">
                      {member.staffRole || member.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">الفرع المخصص:</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {member.branchName || 'الفرع الرئيسي'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">المحافظة:</span>
                      <span className="font-bold text-slate-800">
                        {member.governorate || 'القاهرة'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5">الصلاحيات المعتمدة:</span>
                    <div className="flex flex-wrap gap-1">
                      {(member.permissions || ['view_clients']).map((perm: string, i: number) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200/80">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Staff Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                  <th className="px-4 py-3">{language === 'ar' ? 'اسم الموظف' : 'Name'}</th>
                  <th className="px-4 py-3">{t('username')}</th>
                  <th className="px-4 py-3">{t('staffRole')}</th>
                  <th className="px-4 py-3">{t('assignedGovernorate')}</th>
                  <th className="px-4 py-3">{t('assignedBranch')}</th>
                  <th className="px-4 py-3">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCompanyStaffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                      {language === 'ar' ? 'لا يوجد موظفون يطابقون شروط البحث.' : 'No staff members match the search.'}
                    </td>
                  </tr>
                ) : (
                  filteredCompanyStaffList.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {member.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-sky-700 font-bold">
                        {member.username || member.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {member.staffRole || member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {member.governorate || 'القاهرة'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {member.branchName || 'الفرع الرئيسي'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(member.permissions || ['view_clients']).map((perm, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMPANY SETTINGS & PASSWORDS (إعدادات الشركة وكلمات المرور والحوكمة) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-crobsa-700" />
                {language === 'ar' ? 'إعدادات الشركة وكلمات المرور' : 'Company Settings & Passwords'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'إدارة بيانات وملف شركة التقسيط، تغيير كلمة مرور الإدارة، إدارة كلمات مرور الفروع والموظفين، وتخصيص الهوية.'
                  : 'Manage company profile, director security, staff passwords, and governance standards.'}
              </p>
            </div>

            {compSaveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{language === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Changes saved successfully!'}</span>
              </div>
            )}
          </div>

          {/* Sub Navigation Strip */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-thin">
            {[
              { id: 'info', label: language === 'ar' ? 'بيانات وملف الشركة' : 'Company Profile', icon: Building2 },
              { id: 'password', label: language === 'ar' ? 'كلمات المرور وحسابات الدخول' : 'Passwords & Access', icon: KeyRound },
              { id: 'branding', label: language === 'ar' ? 'الهوية والشعار (اللوجو)' : 'Branding & Logo', icon: ImageIcon },
              { id: 'workflow', label: language === 'ar' ? 'مخطط ومراحل مسار دراسة الطلبات' : 'Workflow & Stages Scheme', icon: Compass },
            ].map(sub => {
              const SubIcon = sub.icon;
              const isSelected = settingsSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSettingsSubTab(sub.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <SubIcon className="h-4 w-4" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB 1: COMPANY PROFILE */}
          {settingsSubTab === 'info' && (
            <form onSubmit={handleSaveCompanySettings} className="space-y-5 max-w-4xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'اسم الشركة (بالعربية)' : 'Company Name (AR)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={compEditName}
                    onChange={e => setCompEditName(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'اسم الشركة بالإنجليزية' : 'Company Name (EN)'}
                  </label>
                  <input
                    type="text"
                    value={compEditNameEn}
                    onChange={e => setCompEditNameEn(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'رقم الهاتف المعتمد' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={compEditPhone}
                    onChange={e => setCompEditPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={compEditEmail}
                    onChange={e => setCompEditEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'رقم السجل التجاري' : 'Commercial Register'}
                  </label>
                  <input
                    type="text"
                    value={compEditCR}
                    onChange={e => setCompEditCR(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'رقم البطاقة الضريبية' : 'Tax Card Number'}
                  </label>
                  <input
                    type="text"
                    value={compEditTax}
                    onChange={e => setCompEditTax(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'رقم ترخيص الهيئة العامة للرقابة المالية (FRA)' : 'FRA License Number'}
                  </label>
                  <input
                    type="text"
                    value={compEditFRA}
                    onChange={e => setCompEditFRA(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'ar' ? 'سقف الائتمان التمويلي المعتمد (ج.م)' : 'Credit Ceiling (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={compEditCeiling}
                    onChange={e => setCompEditCeiling(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="h-4 w-4 text-sky-400" />
                  <span>{language === 'ar' ? 'حفظ بيانات الشركة' : 'Save Company Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 2: PASSWORDS & SECURITY */}
          {settingsSubTab === 'password' && (
            <div className="space-y-8 max-w-4xl">
              {/* Part 1: Company Director / Account Password */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-crobsa-700" />
                      <span>{language === 'ar' ? 'تغيير كلمة مرور المدير التنفيذي / مدير حساب الشركة' : 'Director Password'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'ar'
                        ? 'تحديث كلمة المرور الخاصة بحسابك الرئيسي لإدارة الشركة والفروع.'
                        : 'Change the master administrator password for this company account.'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                    @{currentUser?.username || currentUser?.email}
                  </span>
                </div>

                <form onSubmit={handleChangeDirectorPassword} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                      </label>
                      <input
                        type="password"
                        required
                        value={newDirectorPassword}
                        onChange={e => setNewDirectorPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmDirectorPassword}
                        onChange={e => setConfirmDirectorPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {directorPasswordStatus && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      directorPasswordStatus === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {directorPasswordStatus === 'SUCCESS' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>{language === 'ar' ? 'تم تحديث كلمة مرور المدير التنفيذي بنجاح!' : 'Password updated successfully!'}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          <span>{directorPasswordStatus}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5 text-sky-400" />
                      <span>{language === 'ar' ? 'حفظ كلمة المرور الجديدة' : 'Update Director Password'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Search Box in Passwords Tab */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="h-4 w-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={staffPasswordSearchQuery}
                    onChange={e => setStaffPasswordSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'بحث في كلمات المرور بالاسم، اسم المستخدم، الفرع، أو الباسورد...' : 'Search credentials by name, username, branch, password...'}
                    className="w-full pr-10 pl-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                  {staffPasswordSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStaffPasswordSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  <span>{language === 'ar' ? 'نتائج البحث:' : 'Search results:'} </span>
                  <strong className="text-slate-900 font-bold">{filteredStaffPasswordList.length} موظف / {filteredBranchPasswordList.length} فرع</strong>
                </div>
              </div>

              {/* Part 2: Company Branches Passwords & Access */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-crobsa-700" />
                      <span>{language === 'ar' ? 'كلمات مرور وحسابات فروع الشركة' : 'Company Branches Passwords & Access'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar'
                        ? 'إدارة بيانات الدخول وكلمات المرور الخاصة بكل فرع ومدير الفرع ونسخ بيانات تسجيل الدخول.'
                        : 'Manage login credentials and passwords for all regional company branches.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBranchModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{language === 'ar' ? 'إضافة فرع جديد' : 'Add Branch'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="px-4 py-3">{language === 'ar' ? 'اسم الفرع' : 'Branch Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'المحافظة' : 'Governorate'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'مدير / مسؤول الفرع' : 'Manager'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBranchPasswordList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            {staffPasswordSearchQuery ? 'لا توجد فروع مطابقة لشروط البحث.' : 'لا توجد فروع مسجلة حتى الآن.'}
                          </td>
                        </tr>
                      ) : (
                        filteredBranchPasswordList.map(br => {
                          const managerUser = users.find(u => u.branchId === br.id && (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER)) || users.find(u => u.name === br.managerName && u.companyId === companyId);
                          return (
                            <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <span>{br.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">كود الفرع: {br.id}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 font-bold border border-sky-100 text-[11px]">
                                  {br.governorate}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-800 font-semibold">
                                {br.managerName || managerUser?.name || 'غير محدد'}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">
                                {br.phone || '0224050607'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBranchForPasswordChange(br);
                                      setBranchNewPassword('');
                                      setBranchPasswordSuccess(null);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition-colors flex items-center gap-1"
                                    title="تغيير باسورد الفرع"
                                  >
                                    <KeyRound className="h-3 w-3 text-amber-600" />
                                    <span>تغيير الباسورد</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBranch(br);
                                      setEditBranchForm({
                                        name: br.name,
                                        governorate: br.governorate,
                                        address: br.address || '',
                                        phone: br.phone || '',
                                        managerName: br.managerName || ''
                                      });
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                                    title="تعديل بيانات الفرع"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Part 3: Branch Managers & Staff Passwords Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-700" />
                      <span>{language === 'ar' ? 'إدارة كلمات مرور مسؤولي الائتمان وموظفي الشركة' : 'Branch Managers & Staff Passwords'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar'
                        ? 'عرض وتعديل كلمات المرور لحسابات الفروع والموظفين ونسخ بيانات الدخول مباشرة.'
                        : 'View and change credentials for all branch staff and managers.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{language === 'ar' ? 'إضافة موظف/مدير فرع' : 'Add Staff'}</span>
                  </button>
                </div>

                {staffPasswordChangeSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{staffPasswordChangeSuccess}</span>
                    </span>
                    <button onClick={() => setStaffPasswordChangeSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="px-4 py-3">{language === 'ar' ? 'المستخدم / الاسم' : 'Staff / Name'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الفرع والمحافظة' : 'Branch & Gov'}</th>
                        <th className="px-4 py-3">{language === 'ar' ? 'الدور الوظيفي' : 'Role'}</th>
                        <th className="px-4 py-3 font-mono">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</th>
                        <th className="px-4 py-3 font-mono">{language === 'ar' ? 'كلمة المرور' : 'Password'}</th>
                        <th className="px-4 py-3 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStaffPasswordList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            {staffPasswordSearchQuery ? 'لا يوجد موظفون يطابقون شروط البحث.' : 'لا يوجد موظفون أو مدراء فروع مسجلين بعد.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStaffPasswordList.map(member => (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {member.name}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <span className="font-semibold">{member.branchName || 'الفرع الرئيسي'}</span>
                              <span className="text-[10px] text-slate-400 block">{member.governorate || 'القاهرة'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                                {member.staffRole || member.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-sky-800 font-bold">
                              {member.username || member.email}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                              {member.password || '••••••••'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStaffTargetForPassword(member);
                                    setStaffNewPasswordInput('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition-colors flex items-center gap-1"
                                  title="تغيير كلمة مرور هذا المستخدم"
                                >
                                  <KeyRound className="h-3 w-3 text-amber-600" />
                                  <span>تعديل الباسورد</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = `بيانات الدخول لمنصة كروبسا:\nاسم المستخدم: ${member.username || member.email}\nكلمة المرور: ${member.password || 'كلمة المرور المحددة'}\nالرابط: https://crobsa.com/login`;
                                    navigator.clipboard.writeText(text);
                                    alert('تم نسخ بيانات الدخول إلى الحافظة بنجاح!');
                                  }}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                  title="نسخ بيانات الدخول"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: BRANDING & LOGO (رفع صورة اللوجو وكافر الشركة كملفات ولينكات) */}
          {settingsSubTab === 'branding' && (
            <form onSubmit={handleSaveCompanyBranding} className="space-y-6 max-w-3xl">
              {/* Company Logo Upload & URL */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-crobsa-700" />
                      <span>{language === 'ar' ? 'شعار الشركة الرسمي (Logo)' : 'Company Official Logo'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar' ? 'يمكنك رفع ملف صورة من جهازك مباشرة أو وضع رابط URL' : 'Upload an image file from your device or paste a URL'}
                    </p>
                  </div>
                  {Boolean(compEditLogo?.trim()) && (
                    <button
                      type="button"
                      onClick={() => setCompEditLogo('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      {language === 'ar' ? 'إزالة الشعار' : 'Remove Logo'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Logo Preview */}
                  <div className="h-20 w-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 p-1.5 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
                    {Boolean(compEditLogo?.trim()) ? (
                      <img src={compEditLogo} alt="Logo Preview" className="h-full w-full object-contain rounded-xl" />
                    ) : (
                      <Building2 className="h-9 w-9 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5">
                    {/* Hidden File Input */}
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />

                    {/* File Upload Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{language === 'ar' ? 'رفع صورة الشعار من الجهاز' : 'Upload Logo Image'}</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        {language === 'ar' ? '(يدعم PNG, JPG, WebP, SVG)' : '(PNG, JPG, WebP, SVG supported)'}
                      </span>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={compEditLogo}
                        onChange={e => setCompEditLogo(e.target.value)}
                        placeholder="أو الصق رابط الصورة: https://example.com/logo.png"
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Cover Banner Upload & URL */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-crobsa-700" />
                      <span>{language === 'ar' ? 'غلاف وكافر الشركة (Cover Banner)' : 'Company Cover Banner'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'ar' ? 'الصورة الترويجية التي تظهر في ترويسة ملف الشركة وبوابات الموردين' : 'Promotional cover banner in company headers and supplier portals'}
                    </p>
                  </div>
                  {Boolean(compEditCover?.trim()) && (
                    <button
                      type="button"
                      onClick={() => setCompEditCover('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      {language === 'ar' ? 'إزالة الغلاف' : 'Remove Cover'}
                    </button>
                  )}
                </div>

                {/* Cover Live Preview */}
                <div className="relative h-32 sm:h-40 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center text-white shadow-xs">
                  {Boolean(compEditCover?.trim()) ? (
                    <img 
                      src={compEditCover} 
                      alt="Cover Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-4">
                      <Camera className="h-8 w-8 mx-auto mb-1 text-slate-500" />
                      <span className="text-xs">{language === 'ar' ? 'لا يوجد غلاف محدد حالياً' : 'No cover banner selected'}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white drop-shadow-sm">
                      {activeCompany.name} • معاينة الغلاف
                    </span>
                  </div>
                </div>

                {/* Upload & Controls */}
                <div className="space-y-3">
                  {/* Hidden File Input */}
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFileChange}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{language === 'ar' ? 'رفع صورة الغلاف (الكافر) من الجهاز' : 'Upload Cover File'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? '(يفضل أبعاد عريضة 16:9 عالية الدقة)' : '(Wide 16:9 high resolution recommended)'}
                    </span>
                  </div>

                  {/* URL input */}
                  <div>
                    <input
                      type="text"
                      value={compEditCover}
                      onChange={e => setCompEditCover(e.target.value)}
                      placeholder="أو الصق رابط صورة الغلاف: https://example.com/cover.jpg"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      {language === 'ar' ? 'أو اختر من خلفيات التمويل الجاهزة:' : 'Or choose from finance presets:'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { name: 'أعمال وتمويل عصري', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'تكنولوجيا مالية زرقاء', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'أبراج مالية وإدارية', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80' },
                        { name: 'استثمار وزراعة مستدامة', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCompEditCover(preset.url)}
                          className="text-right p-2 rounded-xl border border-slate-200 bg-white hover:border-crobsa-400 hover:bg-crobsa-50/40 transition-all text-[11px] font-semibold text-slate-700 truncate"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="h-4 w-4 text-sky-400" />
                  <span>{language === 'ar' ? 'حفظ شعار وغلاف الشركة' : 'Save Branding'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 4: WORKFLOW & STAGES SCHEME */}
          {settingsSubTab === 'workflow' && (
            <div className="pt-2">
              <CompanyWorkflowSettings company={activeCompany} />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SHARED DOCUMENTS REPOSITORY */}
      {/* ========================================================================= */}
      {activeTab === 'shared_docs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FolderLock className="h-5 w-5 text-crobsa-700" />
                {t('sharedDocsTitle')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">{t('sharedDocsSubtitle')}</p>
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('uploadSharedDoc')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedDocuments.map(docItem => (
              <div key={docItem.id} className="p-5 rounded-2xl border border-slate-200 hover:border-crobsa-300 bg-white transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-crobsa-50 text-crobsa-700 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{docItem.title}</h4>
                        <span className="text-[11px] text-slate-400 block font-mono">{docItem.fileName} ({docItem.fileSize})</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {docItem.permission === 'ALL_STAFF' ? (language === 'ar' ? 'لكافة الموظفين' : 'All Staff') : (language === 'ar' ? 'المدير فقط' : 'Admin Only')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {docItem.description || 'مستند رسمي معتمد بين منصة كروبسا وشركة التقسيط.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {language === 'ar' ? 'بواسطة:' : 'By:'} <strong className="text-slate-700">{docItem.uploadedByName}</strong>
                  </span>
                  <a
                    href={docItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-crobsa-700 hover:text-crobsa-900"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('downloadDoc')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: EXCEL IMPORT FOR BRANCHES & STAFF (استيراد الفروع والموظفين) */}
      {/* ========================================================================= */}
      {activeTab === 'excel_import' && (
        <CompanyExcelImport onBack={() => setActiveTab('overview')} />
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SMART CREDIT & RISK ASSESSMENT (حاسبة الائتمان والتقييم الذكي) */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && isCompanyAdmin && (
        <SmartCreditCalculator
          onBack={() => setActiveTab('overview')}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CLIENT TIMELINE & AUDIT MODAL */}
      {/* ========================================================================= */}
      {selectedClientForTimeline && (
        <ClientTimelineModal
          client={selectedClientForTimeline}
          onClose={() => setSelectedClientForTimeline(null)}
          onRequestAccess={() => {
            setRequestAccessModalClient(selectedClientForTimeline);
            setSelectedClientForTimeline(null);
          }}
          canViewFullDetails={isClientAuthorized(selectedClientForTimeline)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REQUEST ACCESS TO CLIENT (قاعدة كروبسا) */}
      {/* ========================================================================= */}
      {requestAccessModalClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{t('sendAccessRequest')}</h3>
              <button onClick={() => setRequestAccessModalClient(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {language === 'ar' ? 'العميل المطلوب استعلامه:' : 'Target Client:'} <strong>{requestAccessModalClient.name}</strong>
            </p>

            <form onSubmit={handleSubmitAccessRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('accessReason')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={accessReason}
                  onChange={e => setAccessReason(e.target.value)}
                  placeholder={t('accessReasonPlaceholder')}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestAccessModalClient(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow"
                >
                  {t('sendAccessRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE STAFF (DIRECT USERNAME & PASSWORD) */}
      {/* ========================================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t('createStaffDirect')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{language === 'ar' ? 'إنشاء حساب موظف تابع لشركتك بكلمة مرور فورية' : 'Create company staff with immediate password'}</p>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffData.name}
                    onChange={e => setNewStaffData({ ...newStaffData, name: e.target.value })}
                    placeholder="مثال: يوسف السعيد"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('username')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffData.username}
                    onChange={e => setNewStaffData({ ...newStaffData, username: e.target.value })}
                    placeholder="مثال: youssef_credit"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('password')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffData.password}
                    onChange={e => setNewStaffData({ ...newStaffData, password: e.target.value })}
                    placeholder="كلمة المرور المباشرة"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('staffRole')} *
                  </label>
                  <select
                    value={newStaffData.staffRole}
                    onChange={e => setNewStaffData({ ...newStaffData, staffRole: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value={InstallmentCompanyStaffRole.CREDIT_OFFICER}>{language === 'ar' ? 'موظف دراسة ائتمانية' : 'Credit Officer'}</option>
                    <option value={InstallmentCompanyStaffRole.COLLECTION_AGENT}>{language === 'ar' ? 'مسؤول متابعة وتحصيل' : 'Collection Agent'}</option>
                    <option value={InstallmentCompanyStaffRole.BRANCH_MANAGER}>{language === 'ar' ? 'مدير فرع' : 'Branch Manager'}</option>
                    <option value={InstallmentCompanyStaffRole.SALES_OFFICER}>{language === 'ar' ? 'مسؤول مبيعات' : 'Sales Officer'}</option>
                  </select>
                </div>
              </div>

              {/* Governorate selection & Auto-Branch filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('assignedGovernorate')} *
                  </label>
                  <select
                    value={newStaffData.governorate}
                    onChange={e => {
                      const newGov = e.target.value;
                      const branchesInGov = companyBranches.filter(b => b.governorate === newGov);
                      setNewStaffData({ 
                        ...newStaffData, 
                        governorate: newGov,
                        branchId: branchesInGov[0]?.id || ''
                      });
                    }}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('assignedBranch')} ({matchedBranchesForSelectedGov.length} {language === 'ar' ? 'متاح' : 'available'}) *
                  </label>
                  <select
                    value={newStaffData.branchId}
                    onChange={e => setNewStaffData({ ...newStaffData, branchId: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    {matchedBranchesForSelectedGov.length > 0 ? (
                      matchedBranchesForSelectedGov.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))
                    ) : (
                      <option value="">{language === 'ar' ? 'الفرع العام للشركة' : 'General Company Branch'}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'الصلاحيات الممنوحة داخل شركة التقسيط' : 'Sub-permissions within company'}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: 'view_clients', label: 'الاطلاع على العملاء' },
                    { id: 'request_access', label: 'طلب استعلام من كروبسا' },
                    { id: 'ai_analysis', label: 'التحليل بالذكاء الاصطناعي' },
                    { id: 'approve_apps', label: 'اتخاذ قرار التمويل' },
                    { id: 'view_reports', label: 'عرض وتصدير التقارير' },
                    { id: 'followup_cases', label: 'إجراءات المتابعة والتحصيل' },
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffData.permissions.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewStaffData({ ...newStaffData, permissions: [...newStaffData.permissions, p.id] });
                          } else {
                            setNewStaffData({ ...newStaffData, permissions: newStaffData.permissions.filter(x => x !== p.id) });
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs text-slate-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow"
                >
                  {t('createStaffDirect')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BRANCH */}
      {/* ========================================================================= */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{t('addBranch')}</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم الفرع' : 'Branch Name'} *</label>
                <input
                  type="text"
                  required
                  value={newBranchData.name}
                  onChange={e => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  placeholder="مثال: فرع الزقازيق الرئيسي"
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('assignedGovernorate')} *</label>
                <select
                  value={newBranchData.governorate}
                  onChange={e => setNewBranchData({ ...newBranchData, governorate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  {EGYPT_GOVERNORATES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Show branches in this selected governorate */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-sky-600" />
                    <span>الفروع الحالية في محافظة {newBranchData.governorate}:</span>
                  </span>
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {companyBranches.filter(b => b.governorate === newBranchData.governorate).length} فرع
                  </span>
                </div>
                {companyBranches.filter(b => b.governorate === newBranchData.governorate).length > 0 ? (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {companyBranches.filter(b => b.governorate === newBranchData.governorate).map(eb => (
                      <div key={eb.id} className="text-[11px] p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-900">{eb.name}</span>
                        <span className="text-slate-500 text-[10px]">مدير الفرع: {eb.managerName || 'مسؤول الفرع'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    لا توجد فروع مسجلة لشركتكم في {newBranchData.governorate} حتى الآن (هذا سيكون أول فرع لشركتكم في هذه المحافظة).
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'العنوان التفصيلي' : 'Address'}</label>
                <input
                  type="text"
                  value={newBranchData.address}
                  onChange={e => setNewBranchData({ ...newBranchData, address: e.target.value })}
                  placeholder="الشارع، الميدان..."
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    value={newBranchData.phone}
                    onChange={e => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                    placeholder="0224050607"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم مدير الفرع' : 'Manager'}</label>
                  <input
                    type="text"
                    value={newBranchData.managerName}
                    onChange={e => setNewBranchData({ ...newBranchData, managerName: e.target.value })}
                    placeholder="أ. مدير الفرع"
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow"
                >
                  {t('addBranch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT BRANCH (تعديل بيانات الفرع) */}
      {/* ========================================================================= */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-crobsa-700" />
                <span>{language === 'ar' ? `تعديل بيانات فرع: ${editingBranch.name}` : 'Edit Branch'}</span>
              </h3>
              <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم الفرع' : 'Branch Name'} *</label>
                <input
                  type="text"
                  required
                  value={editBranchForm.name}
                  onChange={e => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('assignedGovernorate')} *</label>
                <select
                  value={editBranchForm.governorate}
                  onChange={e => setEditBranchForm({ ...editBranchForm, governorate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                >
                  {EGYPT_GOVERNORATES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'العنوان التفصيلي' : 'Address'}</label>
                <input
                  type="text"
                  value={editBranchForm.address}
                  onChange={e => setEditBranchForm({ ...editBranchForm, address: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    value={editBranchForm.phone}
                    onChange={e => setEditBranchForm({ ...editBranchForm, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'اسم مدير الفرع' : 'Manager'}</label>
                  <input
                    type="text"
                    value={editBranchForm.managerName}
                    onChange={e => setEditBranchForm({ ...editBranchForm, managerName: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow"
                >
                  {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE BRANCH PASSWORD (تغيير باسورد الفرع ومدير الفرع) */}
      {/* ========================================================================= */}
      {branchForPasswordChange && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>{language === 'ar' ? `تغيير كلمة مرور فرع: ${branchForPasswordChange.name}` : 'Change Branch Password'}</span>
              </h3>
              <button onClick={() => setBranchForPasswordChange(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>فرع: {branchForPasswordChange.name} ({branchForPasswordChange.governorate})</span>
              </p>
              <p className="text-[11px] text-amber-800">
                المسؤول: {branchForPasswordChange.managerName || 'مدير الفرع'}
              </p>
            </div>

            {branchPasswordSuccess ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{branchPasswordSuccess}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(branchPasswordSuccess);
                      alert('تم نسخ بيانات الدخول إلى الحافظة!');
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5 text-sky-400" />
                    <span>نسخ بيانات الدخول</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranchForPasswordChange(null)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangeBranchPassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'كلمة المرور الجديدة للفرع' : 'New Branch Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={branchNewPassword}
                      onChange={e => setBranchNewPassword(e.target.value)}
                      placeholder="أدخل كلمة مرور قوية (مثال: Pass@2026)"
                      className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2 pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBranchNewPassword(`Br@${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="absolute left-2.5 top-2 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 hover:bg-sky-100"
                    >
                      توليد تلقائي
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    سيتم تحديث كلمة المرور لحساب مدير الفرع فورياً ليتمكن من تسجيل الدخول وإدارة موظفيه.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBranchForPasswordChange(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow flex items-center gap-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{language === 'ar' ? 'حفظ وتحديث كلمة المرور' : 'Save Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BRANCH PERFORMANCE & STATISTICS (إحصائيات وأداء الفرع) */}
      {/* ========================================================================= */}
      {selectedBranchForStats && (() => {
        const br = selectedBranchForStats;
        const bApps = companyApps.filter(a => a.assignedBranchId === br.id || a.branchName === br.name || (!a.assignedBranchId && a.governorate === br.governorate));
        const bApproved = bApps.filter(a => a.status === ApplicationStatus.APPROVED);
        const bRejected = bApps.filter(a => a.status === ApplicationStatus.REJECTED);
        const bVolume = bApproved.reduce((sum, a) => sum + (a.approvedAmount || a.requestedAmount), 0);
        const bStaff = companyStaffList.filter(s => s.branchId === br.id || s.branchName === br.name);
        const bTracking = bApps.filter(a => a.status !== ApplicationStatus.RECEIVED && a.status !== ApplicationStatus.PENDING_ADMIN && a.status !== ApplicationStatus.REJECTED);
        const approvalRate = bApps.length > 0 ? Math.round((bApproved.length / bApps.length) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {language === 'ar' ? `تقرير وأداء: ${br.name}` : `Performance: ${br.name}`}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      محافظة {br.governorate} • كود الفرع: {br.id} • مسؤول الفرع: {br.managerName || 'غير محدد'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedBranchForStats(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block">إجمالي طلبات الفرع</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">{bApps.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[11px] text-emerald-800 font-bold block">الطلبات المعتمدة</span>
                  <span className="text-xl font-black text-emerald-900 mt-1 block">{bApproved.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] text-sky-800 font-bold block">إجمالي المبالغ الممولة</span>
                  <span className="text-base font-black text-sky-950 mt-1 block font-mono">
                    {bVolume.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-[11px] text-indigo-800 font-bold block">معدل القبول</span>
                  <span className="text-xl font-black text-indigo-900 mt-1 block font-mono">{approvalRate}%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <span className="text-[11px] text-purple-800 font-bold block">موظفو الفرع</span>
                  <span className="text-xl font-black text-purple-900 mt-1 block">{bStaff.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[11px] text-amber-800 font-bold block">حالات قيد المتابعة</span>
                  <span className="text-xl font-black text-amber-900 mt-1 block">{bTracking.length}</span>
                </div>
              </div>

              {/* Staff in Branch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>فريق عمل الفرع ({bStaff.length} موظف):</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranchForStats(null);
                      setNewStaffData(prev => ({
                        ...prev,
                        branchId: br.id,
                        branchName: br.name,
                        governorate: br.governorate
                      }));
                      setShowAddStaffModal(true);
                    }}
                    className="text-crobsa-700 hover:underline flex items-center gap-1 font-bold text-[11px]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة موظف لهذا الفرع</span>
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {bStaff.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-500">لا يوجد موظفون معينون في هذا الفرع بعد.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {bStaff.map(s => (
                        <div key={s.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                          <div>
                            <strong className="text-slate-900 font-bold block">{s.name}</strong>
                            <span className="text-[10px] font-mono text-slate-500">@{s.username || s.email}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {s.staffRole || s.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranchForStats(null);
                    setBranchForPasswordChange(br);
                    setBranchNewPassword('');
                    setBranchPasswordSuccess(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl border border-amber-200"
                >
                  تغيير كلمة مرور الفرع
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBranchForStats(null)}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: BRANCH STAFF TEAM (فريق عمل الفرع) */}
      {/* ========================================================================= */}
      {branchForStaffView && (() => {
        const br = branchForStaffView;
        const bStaff = companyStaffList.filter(s => s.branchId === br.id || s.branchName === br.name);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span>{language === 'ar' ? `فريق عمل فرع: ${br.name}` : `Branch Staff: ${br.name}`}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    محافظة {br.governorate} • مدير الفرع: {br.managerName || 'مسؤول الفرع'}
                  </p>
                </div>
                <button onClick={() => setBranchForStaffView(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">قائمة الموظفين ({bStaff.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    setBranchForStaffView(null);
                    setNewStaffData(prev => ({
                      ...prev,
                      branchId: br.id,
                      branchName: br.name,
                      governorate: br.governorate
                    }));
                    setShowAddStaffModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة موظف في هذا الفرع</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
                {bStaff.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <p>لا يوجد موظفون معينون في هذا الفرع بعد.</p>
                    <p className="text-[11px] text-slate-400">يمكنك إضافة مسؤولي ائتمان وتحصيل ومبيعات مباشرة.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-right">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">الاسم</th>
                        <th className="p-3">اسم المستخدم</th>
                        <th className="p-3">الدور</th>
                        <th className="p-3 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bStaff.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{s.name}</td>
                          <td className="p-3 font-mono text-sky-800 font-bold">{s.username || s.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {s.staffRole || s.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setStaffTargetForPassword(s);
                                  setStaffNewPasswordInput('');
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[10px] flex items-center gap-1"
                              >
                                <KeyRound className="h-3 w-3 text-amber-600" />
                                <span>تعديل الباسورد</span>
                              </button>

                              {s.staffRole !== InstallmentCompanyStaffRole.BRANCH_MANAGER && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateUserProfile(s.id, {
                                      role: Role.BRANCH_MANAGER,
                                      staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER
                                    });
                                    await updateBranch(br.id, { managerName: s.name });
                                    alert(`تم تعيين ${s.name} كمدير لفرع ${br.name} بنجاح!`);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] flex items-center gap-1"
                                  title="ترقية وتعيين كمدير للفرع"
                                >
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  <span>تعيين كمدير فرع</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Assign existing staff member to this branch */}
              {(() => {
                const otherStaff = companyStaffList.filter(s => s.branchId !== br.id);
                if (otherStaff.length === 0) return null;
                return (
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-purple-700" />
                      <span>إسناد موظف موجود لهذا الفرع:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        id={`assign-staff-${br.id}`}
                        className="text-xs border border-purple-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-purple-500"
                      >
                        {otherStaff.map(os => (
                          <option key={os.id} value={os.id}>
                            {os.name} ({os.branchName || 'عام'})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={async () => {
                          const selectEl = document.getElementById(`assign-staff-${br.id}`) as HTMLSelectElement;
                          const staffId = selectEl?.value;
                          if (!staffId) return;
                          await updateUserProfile(staffId, {
                            branchId: br.id,
                            branchName: br.name,
                            governorate: br.governorate
                          });
                          alert('تم إسناد الموظف لهذا الفرع بنجاح!');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                      >
                        إسناد للفرع
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBranchForStaffView(null)}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: STAFF QUICK PASSWORD CHANGE (تعديل كلمة مرور موظف/مدير فرع) */}
      {/* ========================================================================= */}
      {staffTargetForPassword && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                <span>تعديل كلمة مرور: {staffTargetForPassword.name}</span>
              </h3>
              <button onClick={() => setStaffTargetForPassword(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!staffNewPasswordInput.trim()) return;
                await updateStaffPassword(staffTargetForPassword.id, staffNewPasswordInput.trim());
                setStaffPasswordChangeSuccess(`تم تحديث كلمة المرور للموظف (${staffTargetForPassword.name}) بنجاح! كلمة المرور: ${staffNewPasswordInput.trim()}`);
                setStaffTargetForPassword(null);
                setStaffNewPasswordInput('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المستخدم:</label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 font-bold">
                  {staffTargetForPassword.username || staffTargetForPassword.email}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="text"
                  required
                  value={staffNewPasswordInput}
                  onChange={e => setStaffNewPasswordInput(e.target.value)}
                  placeholder="Pass@1234"
                  className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStaffTargetForPassword(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow"
                >
                  حفظ وتأكيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: UPLOAD SHARED DOCUMENT */}
      {/* ========================================================================= */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{t('uploadSharedDoc')}</h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'عنوان المستند' : 'Title'} *</label>
                <input
                  type="text"
                  required
                  value={newDocData.title}
                  onChange={e => setNewDocData({ ...newDocData, title: e.target.value })}
                  placeholder="مثال: نموذج ملحق شروط التمويل 2025"
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('fileCategory')}</label>
                  <select
                    value={newDocData.category}
                    onChange={e => setNewDocData({ ...newDocData, category: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="CONTRACT_TEMPLATE">{language === 'ar' ? 'نموذج عقد' : 'Contract Template'}</option>
                    <option value="FORM">{language === 'ar' ? 'نموذج رسمي / إيصال' : 'Form / Receipt'}</option>
                    <option value="CUSTOMER_DOC_REQUIREMENT">{language === 'ar' ? 'تفويض / إقرار عميل' : 'Customer Consent'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('docPermissions')}</label>
                  <select
                    value={newDocData.permission}
                    onChange={e => setNewDocData({ ...newDocData, permission: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="ALL_STAFF">{language === 'ar' ? 'كافة الموظفين' : 'All Staff'}</option>
                    <option value="COMPANY_ADMIN_ONLY">{language === 'ar' ? 'مدير شركة التقسيط فقط' : 'Company Admin Only'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'رابط الملف أو المرفق' : 'File URL'}</label>
                <input
                  type="text"
                  value={newDocData.fileUrl}
                  onChange={e => setNewDocData({ ...newDocData, fileUrl: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{language === 'ar' ? 'وصف المستند' : 'Description'}</label>
                <textarea
                  rows={2}
                  value={newDocData.description}
                  onChange={e => setNewDocData({ ...newDocData, description: e.target.value })}
                  placeholder="وصف مختصر للملف وغرض استخدامه..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-crobsa-700 hover:bg-crobsa-800 text-white rounded-xl shadow"
                >
                  {t('uploadSharedDoc')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: OFFICIAL PDF REPORT PREVIEW & PRINT */}
      {/* ========================================================================= */}
      {showPdfReportModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 sm:p-8 space-y-6 my-6 text-slate-900 animate-in fade-in">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-crobsa-700" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {language === 'ar' ? 'معاينة التقرير الرسمي لشركة التقسيط' : 'Official Installment Portfolio Report'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white shadow transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  {language === 'ar' ? 'طباعة / حفظ كـ PDF' : 'Print / Save PDF'}
                </button>
                <button
                  onClick={() => setShowPdfReportModal(false)}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="space-y-6 print:m-0" id="official-pdf-content">
              {/* Document Header */}
              <div className="border-b-2 border-crobsa-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-crobsa-950 tracking-wider font-sans">Cropsa egypt</span>
                    <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">كروبسا مصر</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">منصة التمويل الاستهلاكي والزراعي المتكاملة</p>
                </div>

                <div className="text-left sm:text-right">
                  <h4 className="font-black text-lg text-slate-900">{activeCompany.name}</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    رقم الترخيص: <span className="font-mono font-bold text-slate-800">{activeCompany.licenseNumber}</span> | هيئة الرقابة المالية
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}
                  </p>
                </div>
              </div>

              {/* Title of Report */}
              <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
                <h2 className="text-base font-black text-slate-900">
                  تقرير الموقف الائتماني والأداء الجغرافي للمحفظة
                </h2>
                <p className="text-xs text-slate-500">
                  {reportGovFilter ? `نطاق المحافظة: ${reportGovFilter}` : 'كافة محافظات جمهورية مصر العربية'}
                </p>
              </div>

              {/* Summary KPIs Row */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-800">الحالات المعتمدة</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    {filteredReportApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED).length}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-[11px] font-bold text-rose-800">الحالات المرفوضة</p>
                  <p className="text-xl font-black text-rose-700 mt-0.5">
                    {filteredReportApps.filter(a => a.status === ApplicationStatus.REJECTED).length}
                  </p>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <p className="text-[11px] font-bold text-sky-800">قيد المراجعة</p>
                  <p className="text-xl font-black text-sky-700 mt-0.5">
                    {filteredReportApps.filter(a => ![ApplicationStatus.APPROVED, ApplicationStatus.AMOUNT_TRANSFERRED, ApplicationStatus.REJECTED].includes(a.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-crobsa-50 rounded-xl border border-crobsa-200">
                  <p className="text-[11px] font-bold text-crobsa-800">إجمالي المبالغ المصروفة</p>
                  <p className="text-lg font-black text-crobsa-950 mt-0.5 font-mono">
                    {stats.totalApprovedVolume.toLocaleString()} جنيه
                  </p>
                </div>
              </div>

              {/* Governorates Performance Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                  أولاً: توزيع الأداء الجغرافي حسب المحافظات
                </h4>
                <table className="w-full text-xs text-right border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2">المحافظة</th>
                      <th className="p-2 text-center">إجمالي الحالات</th>
                      <th className="p-2 text-center text-emerald-700">المعتمد</th>
                      <th className="p-2 text-center text-rose-700">المرفوض</th>
                      <th className="p-2 text-center">قيد الفحص</th>
                      <th className="p-2 text-center">معدل القبول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.govDetailedData.map((g, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{g.name}</td>
                        <td className="p-2 text-center font-semibold">{g.total}</td>
                        <td className="p-2 text-center text-emerald-700 font-bold">{g.approved}</td>
                        <td className="p-2 text-center text-rose-700 font-bold">{g.rejected}</td>
                        <td className="p-2 text-center text-sky-700 font-semibold">{g.pending}</td>
                        <td className="p-2 text-center font-mono font-bold">{g.approvalRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed Sample Cases Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                  ثانياً: سجل الحالات والقرارات الائتمانية
                </h4>
                <table className="w-full text-xs text-right border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2">رقم الطلب</th>
                      <th className="p-2">اسم العميل</th>
                      <th className="p-2">المحافظة</th>
                      <th className="p-2">المبلغ المطلوب</th>
                      <th className="p-2">القرار والسبب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReportApps.slice(0, 10).map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-[11px]">{a.id}</td>
                        <td className="p-2 font-bold text-slate-900">{a.clientName}</td>
                        <td className="p-2 text-slate-600">{a.governorate}</td>
                        <td className="p-2 font-mono">{a.requestedAmount.toLocaleString()} جنيه</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === ApplicationStatus.REJECTED
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            {a.status === ApplicationStatus.APPROVED ? 'معتمد' : a.status === ApplicationStatus.REJECTED ? 'مرفوض' : 'قيد الفحص'}
                          </span>
                          {a.rejectionReason && (
                            <p className="text-[10px] text-rose-600 mt-0.5">سبب الرفض: {a.rejectionReason}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Document Signatures Footer */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">مسؤول الائتمان والمخاطر</p>
                  <p className="text-[11px] text-slate-400 mt-6">التوقيع: ............................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">مدير إدارة التمويل</p>
                  <p className="text-[11px] text-slate-400 mt-6">التوقيع: ............................</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">خاتم الشركة المعتمد</p>
                  <div className="w-20 h-20 mx-auto mt-2 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] text-slate-400">
                    خاتم الشركة
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Discussion & Workflow Modal for Installment Company Staff */}
      {discussionApp && (
        <CaseDiscussionModal
          application={discussionApp}
          initialTab={discussionTab}
          onClose={() => setDiscussionApp(null)}
        />
      )}

      {/* Company Profile Settings Modal (إعدادات ملف الشركة، تغيير الباسورد، تعيين موظفين وكلمات مرورهم، وتغيير اللوجو والكافر) */}
      {showProfileSettingsModal && (
        <CompanyProfileSettingsModal
          company={activeCompany}
          onClose={() => setShowProfileSettingsModal(false)}
        />
      )}

      {/* Company Branding Modal */}
      {showBrandingModal && (
        <CompanyBrandingModal
          company={activeCompany}
          onClose={() => setShowBrandingModal(false)}
        />
      )}

      {/* Client Follow-up and Cross-department Updates Timeline Modal */}
      {showClientFollowUpModal && (
        <ClientFollowUpModal
          onClose={() => setShowClientFollowUpModal(false)}
        />
      )}

      {/* Smart Case Assignment Modal for Followup and Cases Tracking view */}
      {assigningAppInFollowup && (
        <SmartCaseAssignmentModal
          application={assigningAppInFollowup}
          branches={companyBranches}
          staffList={companyStaffList}
          onAssign={async (branchId, branchName, officerId, officerName) => {
            await assignCompanyBranchAndOfficer(assigningAppInFollowup.id, branchId, branchName, officerId, officerName);
            setAssigningAppInFollowup(null);
          }}
          onClose={() => setAssigningAppInFollowup(null)}
        />
      )}

    </div>
  );
};
