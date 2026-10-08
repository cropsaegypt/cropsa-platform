import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/Store';
import { Role, ApplicationStatus, COMMENT_NOTIFICATION_CONFIG } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  History, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  Bell,
  UserPlus,
  Wallet,
  UserCheck,
  PieChart,
  Building2,
  Send,
  Sparkles,
  Globe,
  Database,
  Lock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  AlertCircle,
  BrainCircuit,
  FolderLock,
  Settings,
  FileCheck,
  HelpCircle,
  MapPin,
  Briefcase,
  ArrowLeftRight,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  MessageSquare,
  BellRing,
  Calculator
} from 'lucide-react';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import { ClientFollowUpModal } from './ClientFollowUpModal';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  portalTab?: string;
  onNavigate: (page: string) => void;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
  action?: () => void;
}

interface NavSection {
  id: string;
  title: string;
  icon: any;
  badge?: string;
  isStandalone?: boolean;
  pageId?: string;
  children?: NavSubItem[];
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, portalTab, onNavigate }) => {
  const { 
    currentUser, 
    currentCompany,
    logout, 
    notifications, 
    markNotificationRead, 
    setNavigation,
    language,
    toggleLanguage,
    t,
    isFirestoreConnected,
    applications,
    clientRequests,
    overdueCases,
    companies,
    branches,
    financingPrograms,
    systemBranding
  } = useStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleSwitcherModalOpen, setRoleSwitcherModalOpen] = useState(false);
  const [clientFollowUpOpen, setClientFollowUpOpen] = useState(false);

  // Collapsible sidebar state (desktop collapse / expand)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cropsa_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cropsa_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Collapsible dropdown state for sidebar sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'sec_admin_home': true,
    'sec_admin_ops': true,
    'sec_admin_partners': true,
    'sec_admin_finance': false,
    'sec_admin_system': false,
    'sec_comp_main': true,
    'sec_comp_ops': true,
    'sec_comp_org': true,
    'sec_comp_mgmt': false,
    'sec_bm_main': true,
    'sec_bm_ops': true,
    'sec_bm_team': false,
    'sec_emp_work': true,
    'sec_emp_tools': false,
    'sec_partner_home': true,
    'sec_partner_apps': true,
    'sec_partner_wallet': true
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (!currentUser) return <>{children}</>;

  // Smart Scoped Notifications Filtering to prevent permission overlap
  const myNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Super Admin sees all system notifications
      if (currentUser.role === Role.SUPER_ADMIN) return true;

      // 2. Admin Operations
      if (currentUser.role === Role.ADMIN) {
        return n.targetRole === Role.ADMIN || n.userId === 'ROLE_SUPER_ADMIN' || n.userId === currentUser.id;
      }

      // 3. Employee / Credit Officer / Collection Agent:
      // STRICT SCOPING: Only notifications for their assigned ID or specifically directed to their branch
      if (
        currentUser.role === Role.COMPANY_EMPLOYEE || 
        currentUser.staffRole === 'CREDIT_OFFICER' as any || 
        currentUser.staffRole === 'COLLECTION_AGENT' as any
      ) {
        if (n.targetOfficerId && n.targetOfficerId === currentUser.id) return true;
        if (n.targetBranchId && currentUser.branchId && n.targetBranchId === currentUser.branchId && !n.targetOfficerId) return true;
        return n.userId === currentUser.id;
      }

      // 4. Branch Manager:
      // Scoped to their branch cases and direct notifications
      if (currentUser.role === Role.BRANCH_MANAGER || currentUser.staffRole === 'BRANCH_MANAGER' as any) {
        if (n.targetBranchId && currentUser.branchId && n.targetBranchId === currentUser.branchId) return true;
        if (n.targetOfficerId && n.targetOfficerId === currentUser.id) return true;
        return n.userId === currentUser.id;
      }

      // 5. Installment Company Admin / Director:
      // Scoped to their company cases
      if (currentUser.role === Role.INSTALLMENT_COMPANY) {
        const compId = currentUser.companyId || currentCompany?.id || 'comp_01';
        if (n.targetCompanyId && n.targetCompanyId === compId) return true;
        if (n.userId === `COMPANY_${compId}` || n.userId === compId) return true;
        return n.userId === currentUser.id;
      }

      return n.userId === currentUser.id;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser, currentCompany]);

  const unreadCount = myNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: any) => {
    markNotificationRead(notif.id);
    setNotifOpen(false);
    if (notif.referenceType === 'CLIENT_REQUEST') {
      if (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) {
        onNavigate('client-requests');
      } else {
        onNavigate('company-database');
      }
    } else if (notif.referenceType === 'OVERDUE') {
      onNavigate('company-overdue');
    } else if (notif.referenceType === 'CLIENT_RENEWAL') {
      onNavigate('clients');
    } else if (notif.referenceId) {
      setNavigation({ page: 'applications', resourceId: notif.referenceId });
      onNavigate('applications');
    }
  };

  // Human-readable role labels
  const roleLabels: Record<string, string> = {
    [Role.SUPER_ADMIN]: language === 'ar' ? 'مدير النظام العام' : 'Super Admin',
    [Role.ADMIN]: language === 'ar' ? 'مسؤول العمليات والاعتمادات' : 'Admin Operations',
    [Role.INSTALLMENT_COMPANY]: language === 'ar' ? 'شركة تقسيط معتمدة' : 'Installment Company',
    [Role.BRANCH_MANAGER]: language === 'ar' ? 'مدير فرع شركة التقسيط' : 'Branch Manager',
    [Role.COMPANY_EMPLOYEE]: language === 'ar' ? 'موظف شركة التقسيط' : 'Company Employee',
    [Role.SUPPLIER]: language === 'ar' ? 'مورد معتمد' : 'Supplier',
    [Role.SALESMAN]: language === 'ar' ? 'موظف البيع (رافع الطلبات)' : 'Sales Officer'
  };

  // Build Structured Navigation Sections grouped by Role Scope
  const navSections: NavSection[] = useMemo(() => {
    const isAr = language === 'ar';
    const sections: NavSection[] = [];

    // ========================================================
    // 1. SUPER ADMIN & ADMIN (إدارة منظومة كروبسا مصر)
    // ========================================================
    if (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) {
      sections.push({
        id: 'sec_admin_home',
        title: isAr ? 'الرئيسية' : 'General',
        icon: LayoutDashboard,
        children: [
          {
            id: 'dashboard',
            label: isAr ? 'لوحة التحكم الرئيسية' : 'Main Dashboard',
            icon: LayoutDashboard
          }
        ]
      });

      sections.push({
        id: 'sec_admin_ops',
        title: isAr ? 'الطلبات والعمليات' : 'Operations & Cases',
        icon: FileText,
        children: [
          {
            id: 'applications',
            label: isAr ? 'طلبات التمويل' : 'Applications',
            icon: FileCheck,
            count: applications.length
          },
          {
            id: 'client-requests',
            label: isAr ? 'استعلامات العملاء' : 'Client Requests',
            icon: Send,
            count: clientRequests.filter(r => r.status === 'PENDING').length || undefined
          },
          {
            id: 'clients',
            label: isAr ? 'قاعدة بيانات العملاء الذكية' : 'Smart Clients Database',
            icon: UserCheck
          },
          {
            id: 'application-questions',
            label: isAr ? 'أسئلة واستبيان التمويل' : 'Application Questions',
            icon: HelpCircle
          },
          {
            id: 'company-ai',
            label: isAr ? 'حاسبة الائتمان والتقييم' : 'Credit Calculator',
            icon: Calculator
          }
        ]
      });

      sections.push({
        id: 'sec_admin_partners',
        title: isAr ? 'الشركات والبرامج' : 'Partners & Programs',
        icon: Building2,
        children: [
          {
            id: 'companies',
            label: isAr ? 'شركات التقسيط المعتمدة' : 'Installment Companies',
            icon: Building2,
            count: companies.length
          },
          {
            id: 'financing-programs',
            label: isAr ? 'برامج التمويل' : 'Financing Programs',
            icon: Layers,
            count: financingPrograms.length
          }
        ]
      });

      const financeChildren: NavSubItem[] = [
        {
          id: 'admin-finance',
          label: isAr ? 'الحسابات والمالية' : 'Platform Finances',
          icon: PieChart
        }
      ];
      if (currentUser.role === Role.SUPER_ADMIN) {
        financeChildren.push({
          id: 'withdrawals',
          label: isAr ? 'طلبات سحب الأرصدة' : 'Withdrawal Requests',
          icon: Wallet
        });
      }
      sections.push({
        id: 'sec_admin_finance',
        title: isAr ? 'المالية' : 'Finance',
        icon: PieChart,
        children: financeChildren
      });

      const sysChildren: NavSubItem[] = [];
      if (currentUser.role === Role.SUPER_ADMIN) {
        sysChildren.push({
          id: 'users',
          label: isAr ? 'المستخدمين والصلاحيات' : 'User Management',
          icon: UserPlus
        });
        sysChildren.push({
          id: 'audit-logs',
          label: isAr ? 'سجل العمليات والرقابة' : 'Audit Logs',
          icon: History
        });
        sysChildren.push({
          id: 'system-health',
          label: isAr ? 'سلامة النظام' : 'System Health',
          icon: ShieldCheck
        });
      }
      sysChildren.push({
        id: 'notification-templates',
        label: isAr ? 'قوالب إشعارات التعليقات' : 'Notification Templates',
        icon: BellRing
      });
      sysChildren.push({
        id: 'crobsa-settings',
        label: isAr ? 'إعدادات المنظومة والهوية' : 'Platform Settings',
        icon: Settings
      });

      sections.push({
        id: 'sec_admin_system',
        title: isAr ? 'النظام' : 'System',
        icon: ShieldCheck,
        children: sysChildren
      });
    }

    // ========================================================
    // 2. INSTALLMENT COMPANY (المدير التنفيذي لشركة التقسيط)
    // ========================================================
    else if (currentUser.role === Role.INSTALLMENT_COMPANY) {
      const targetCompanyId = currentUser.companyId || currentCompany?.id || 'comp_01';
      const companySpecificApps = applications.filter(a => 
        !a.isArchived && 
        (a.assignedCompanyIds?.includes(targetCompanyId) || a.assignedCompanyIds?.includes(currentUser.id))
      );

      const newAppsCount = companySpecificApps.filter(a => 
        a.status === ApplicationStatus.RECEIVED || 
        a.status === ApplicationStatus.PENDING_ADMIN || 
        !a.assignedOfficerId
      ).length;

      const trackingCasesCount = companySpecificApps.filter(a => 
        a.status !== ApplicationStatus.RECEIVED && 
        a.status !== ApplicationStatus.PENDING_ADMIN &&
        a.status !== ApplicationStatus.REJECTED &&
        a.status !== ApplicationStatus.AMOUNT_TRANSFERRED
      ).length;

      sections.push({
        id: 'sec_comp_main',
        title: isAr ? 'الرئيسية' : 'Main',
        icon: LayoutDashboard,
        children: [
          {
            id: 'company-dashboard',
            label: isAr ? 'لوحة المؤشرات العامة' : 'Company Dashboard',
            icon: LayoutDashboard
          }
        ]
      });

      sections.push({
        id: 'sec_comp_ops',
        title: isAr ? 'المعاملات والطلبات' : 'Applications & Cases',
        icon: FileCheck,
        children: [
          {
            id: 'company-portal',
            label: isAr ? 'طلبات وحالات التمويل' : 'Applications & Requests',
            icon: FileCheck,
            count: companySpecificApps.length > 0 ? companySpecificApps.length : undefined
          },
          {
            id: 'company-portal:followup',
            label: isAr ? 'متابعة الحالات قيد التنفيذ' : 'Active Cases',
            icon: CheckCircle2,
            count: trackingCasesCount || undefined
          },
          {
            id: 'company-ai',
            label: isAr ? 'حاسبة الائتمان والتقييم الذكي' : 'Credit Calculator',
            icon: Calculator
          },
          {
            id: 'company-database',
            label: isAr ? 'دليل وسجل العملاء' : 'Clients Directory',
            icon: Database
          }
        ]
      });

      sections.push({
        id: 'sec_comp_org',
        title: isAr ? 'الفريق والفروع' : 'Branches & Team',
        icon: Building2,
        children: [
          {
            id: 'company-branches',
            label: isAr ? 'فروع الشركة' : 'Company Branches',
            icon: Building2,
            count: branches.filter(b => b.companyId === currentCompany?.id).length || undefined
          },
          {
            id: 'company-staff',
            label: isAr ? 'فريق العمل والائتمان' : 'Company Staff',
            icon: Users
          }
        ]
      });

      sections.push({
        id: 'sec_comp_mgmt',
        title: isAr ? 'التقارير والإعدادات' : 'Reports & Settings',
        icon: Settings,
        children: [
          {
            id: 'company-reports',
            label: isAr ? 'التقارير والأداء' : 'Reports & Performance',
            icon: BarChart3
          },
          {
            id: 'company-docs',
            label: isAr ? 'المستندات والنماذج' : 'Shared Documents',
            icon: FolderLock
          },
          {
            id: 'company-settings',
            label: isAr ? 'إعدادات الشركة وكلمات المرور' : 'Company Settings',
            icon: Settings
          }
        ]
      });
    }

    // ========================================================
    // 3. BRANCH MANAGER (مدير فرع شركة التقسيط)
    // ========================================================
    else if (currentUser.role === Role.BRANCH_MANAGER) {
      const bmCompanyId = currentUser.companyId || currentCompany?.id || 'comp_01';
      const bmCompanyApps = applications.filter(a => 
        !a.isArchived && 
        (a.assignedCompanyIds?.includes(bmCompanyId) || a.assignedCompanyIds?.includes(currentUser.id))
      );

      const bmBranchAppsCount = bmCompanyApps.filter(a => 
        a.status !== ApplicationStatus.RECEIVED && 
        a.status !== ApplicationStatus.PENDING_ADMIN &&
        a.status !== ApplicationStatus.REJECTED &&
        a.status !== ApplicationStatus.AMOUNT_TRANSFERRED &&
        (a.assignedBranchId === currentUser.branchId || (currentUser.branchName && a.assignedBranchName === currentUser.branchName))
      ).length;

      const bmNewAppsCount = bmCompanyApps.filter(a => 
        (a.status === ApplicationStatus.RECEIVED || a.status === ApplicationStatus.PENDING_ADMIN || !a.assignedOfficerId) &&
        (a.assignedBranchId === currentUser.branchId || !a.assignedBranchId)
      ).length;

      sections.push({
        id: 'sec_bm_main',
        title: isAr ? 'الفرع' : 'Branch',
        icon: LayoutDashboard,
        children: [
          {
            id: 'company-dashboard',
            label: isAr ? `مؤشرات الفرع (${currentUser.branchName || 'فرعك'})` : 'Branch Dashboard',
            icon: LayoutDashboard
          }
        ]
      });

      sections.push({
        id: 'sec_bm_ops',
        title: isAr ? 'الطلبات والعملاء' : 'Cases & Clients',
        icon: FileCheck,
        children: [
          {
            id: 'company-portal',
            label: isAr ? 'طلبات تقسيط الفرع' : 'Branch Applications',
            icon: FileCheck,
            count: bmNewAppsCount || undefined
          },
          {
            id: 'company-portal:followup',
            label: isAr ? 'متابعة حالات عملاء الفرع' : 'Branch Cases',
            icon: CheckCircle2,
            count: bmBranchAppsCount || undefined
          },
          {
            id: 'company-database',
            label: isAr ? 'دليل وسجل العملاء' : 'Clients Directory',
            icon: Database
          }
        ]
      });

      sections.push({
        id: 'sec_bm_team',
        title: isAr ? 'الفريق والتقارير' : 'Team & Reports',
        icon: Users,
        children: [
          {
            id: 'company-staff',
            label: isAr ? 'فريق عمل الفرع' : 'Branch Staff',
            icon: Users
          },
          {
            id: 'company-reports',
            label: isAr ? 'تقارير أداء الفرع' : 'Branch Reports',
            icon: BarChart3
          },
          {
            id: 'company-docs',
            label: isAr ? 'المستندات والنماذج' : 'Shared Documents',
            icon: FolderLock
          }
        ]
      });
    }

    // ========================================================
    // 4. COMPANY EMPLOYEE (موظف دراسة وفحص ائتماني)
    // ========================================================
    else if (currentUser.role === Role.COMPANY_EMPLOYEE) {
      const empMyCasesCount = applications.filter(a => 
        !a.isArchived && 
        a.status !== ApplicationStatus.RECEIVED && 
        a.status !== ApplicationStatus.PENDING_ADMIN &&
        (a.assignedOfficerId === currentUser.id || a.assignedBranchId === currentUser.branchId)
      ).length;

      const empNewAppsCount = applications.filter(a => 
        !a.isArchived && 
        (a.status === ApplicationStatus.RECEIVED || a.status === ApplicationStatus.PENDING_ADMIN || !a.assignedOfficerId) &&
        (a.assignedBranchId === currentUser.branchId || !a.assignedBranchId)
      ).length;

      sections.push({
        id: 'sec_emp_work',
        title: isAr ? 'مهام العمل اليومية' : 'Daily Tasks',
        icon: FileCheck,
        children: [
          {
            id: 'company-portal',
            label: isAr ? 'الطلبات الجديدة الواردة' : 'New Applications',
            icon: FileText,
            count: empNewAppsCount || undefined
          },
          {
            id: 'company-portal:followup',
            label: isAr ? 'متابعة الحالات قيد الفحص' : 'My Cases Workflow',
            icon: CheckCircle2,
            count: empMyCasesCount || undefined
          },
          {
            id: 'company-database',
            label: isAr ? 'استعلام ودليل العملاء' : 'Clients Directory',
            icon: Database
          }
        ]
      });

      sections.push({
        id: 'sec_emp_tools',
        title: isAr ? 'التقارير والحساب' : 'Reports & Profile',
        icon: FolderLock,
        children: [
          {
            id: 'company-reports',
            label: isAr ? 'لوحة إنجاز المهام' : 'My Performance',
            icon: BarChart3
          },
          {
            id: 'company-docs',
            label: isAr ? 'المستندات والنماذج' : 'Shared Documents',
            icon: FolderLock
          },
          {
            id: 'company-settings',
            label: isAr ? 'إعدادات الحساب وكلمة المرور' : 'My Profile & Security',
            icon: Settings
          }
        ]
      });
    }

    // ========================================================
    // 5. SUPPLIER & SALESMAN (الموردون والتجار والمناديب)
    // ========================================================
    else {
      const myAppsCount = applications.filter(a => a.submittedBy === currentUser.id).length;

      sections.push({
        id: 'sec_partner_home',
        title: isAr ? 'الرئيسية' : 'Main',
        icon: LayoutDashboard,
        children: [
          {
            id: 'dashboard',
            label: isAr ? 'لوحة التحكم الرئيسية' : 'Dashboard',
            icon: LayoutDashboard
          }
        ]
      });

      sections.push({
        id: 'sec_partner_apps',
        title: isAr ? 'طلبات التمويل' : 'Applications',
        icon: FileText,
        children: [
          {
            id: 'new-application',
            label: isAr ? 'تقديم طلب تقسيط جديد' : 'New Application',
            icon: PlusCircle,
            badge: isAr ? 'جديد' : 'NEW'
          },
          {
            id: 'applications',
            label: isAr ? 'متابعة طلباتي' : 'My Applications',
            icon: FileText,
            count: myAppsCount || undefined
          },
          {
            id: 'clients',
            label: isAr ? 'قاعدة بيانات العملاء' : 'Clients Database',
            icon: UserCheck
          }
        ]
      });

      sections.push({
        id: 'sec_partner_wallet',
        title: isAr ? 'المالية' : 'Finance',
        icon: Wallet,
        children: [
          {
            id: 'user-wallet',
            label: isAr ? 'المحفظة المالية والأرباح' : 'Financial Wallet',
            icon: Wallet
          }
        ]
      });
    }

    return sections;
  }, [currentUser, language, applications.length, clientRequests, overdueCases.length, companies.length, branches, currentCompany]);

  // Bottom Navigation Items for Mobile App Experience (شريط تطبيق الهاتف الذكي مع الأيقونات والتنبيهات)
  const mobileNavItems = useMemo(() => {
    const isAr = language === 'ar';
    const isCompanyUser = currentUser.role === Role.INSTALLMENT_COMPANY || 
                          currentUser.role === Role.BRANCH_MANAGER || 
                          currentUser.role === Role.COMPANY_EMPLOYEE;
    const isAdmin = currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN;

    if (isCompanyUser) {
      const isStaff = currentUser.role === Role.COMPANY_EMPLOYEE;
      const targetCompanyId = currentUser.companyId || currentCompany?.id || 'comp_01';
      const totalScopedApps = applications.filter(a => 
        !a.isArchived && 
        (a.assignedCompanyIds?.includes(targetCompanyId) || a.assignedCompanyIds?.includes(currentUser.id)) &&
        (!isStaff || !currentUser.branchId || a.assignedBranchId === currentUser.branchId || !a.assignedBranchId)
      ).length;

      const trackingCasesCount = applications.filter(a => 
        !a.isArchived && 
        a.status !== ApplicationStatus.RECEIVED && 
        a.status !== ApplicationStatus.PENDING_ADMIN &&
        (!isStaff || a.assignedOfficerId === currentUser.id || a.assignedBranchId === currentUser.branchId)
      ).length;

      return [
        {
          id: 'company-dashboard',
          label: isAr ? 'الرئيسية' : 'Home',
          icon: LayoutDashboard,
          active: currentPage === 'company-dashboard' || (currentPage === 'company-portal' && portalTab === 'overview')
        },
        {
          id: 'company-portal',
          label: isAr ? 'الطلبات' : 'Requests',
          icon: FileText,
          badge: totalScopedApps > 0 ? String(totalScopedApps) : undefined,
          active: (currentPage === 'company-portal' || currentPage === 'company-applications') && 
                  (portalTab === 'applications' || !portalTab || portalTab === '') && 
                  portalTab !== 'followup'
        },
        {
          id: 'company-portal:followup',
          label: isAr ? 'متابعة حالات' : 'Cases',
          icon: CheckCircle2,
          isCenterAction: true,
          badge: trackingCasesCount > 0 ? String(trackingCasesCount) : undefined,
          badgeColor: 'sky',
          active: currentPage === 'company-portal' && portalTab === 'followup'
        },
        {
          id: 'company-reports',
          label: isAr ? 'احصائيات' : 'Stats',
          icon: BarChart3,
          active: currentPage === 'company-reports' || (currentPage === 'company-portal' && portalTab === 'reports')
        },
        {
          id: 'company-settings',
          label: isAr ? 'اعدادات' : 'Settings',
          icon: Settings,
          active: currentPage === 'company-settings' || (currentPage === 'company-portal' && portalTab === 'settings')
        }
      ];
    }

    if (isAdmin) {
      return [
        {
          id: 'dashboard',
          label: isAr ? 'الرئيسية' : 'Home',
          icon: LayoutDashboard,
          active: currentPage === 'dashboard'
        },
        {
          id: 'applications',
          label: isAr ? 'الطلبات' : 'Apps',
          icon: FileText,
          badge: applications.length > 0 ? String(applications.length) : undefined,
          active: currentPage === 'applications'
        },
        {
          id: 'companies-management',
          label: isAr ? 'الشركات' : 'Companies',
          icon: Building2,
          isCenterAction: true,
          badge: companies.length > 0 ? String(companies.length) : undefined,
          active: currentPage === 'companies-management'
        },
        {
          id: 'admin-finance',
          label: isAr ? 'المالية' : 'Finance',
          icon: Wallet,
          active: currentPage === 'admin-finance'
        },
        {
          id: 'action-client-followup',
          label: isAr ? 'متابعة العملاء' : 'Follow-up',
          icon: Users,
          isAction: true,
          action: () => setClientFollowUpOpen(true)
        }
      ];
    }

    // Default: Supplier / Partner
    return [
      {
        id: 'dashboard',
        label: isAr ? 'الرئيسية' : 'Home',
        icon: LayoutDashboard,
        active: currentPage === 'dashboard'
      },
      {
        id: 'applications',
        label: isAr ? 'طلباتي' : 'My Apps',
        icon: FileText,
        badge: applications.length > 0 ? String(applications.length) : undefined,
        active: currentPage === 'applications'
      },
      {
        id: 'new-application',
        label: isAr ? 'طلب جديد' : 'New App',
        icon: PlusCircle,
        isCenterAction: true,
        active: currentPage === 'new-application'
      },
      {
        id: 'user-wallet',
        label: isAr ? 'المحفظة' : 'Wallet',
        icon: Wallet,
        active: currentPage === 'user-wallet'
      },
      {
        id: 'action-client-followup',
        label: isAr ? 'متابعة العملاء' : 'Follow-up',
        icon: Users,
        isAction: true,
        action: () => setClientFollowUpOpen(true)
      }
    ];
  }, [currentUser.role, language, currentPage, applications.length, overdueCases.length, companies.length]);

  // Automatically expand the section that contains the current active page
  useEffect(() => {
    navSections.forEach(section => {
      const hasActiveChild = section.children?.some(child => {
        if (child.id.startsWith('company-portal:')) {
          const tab = child.id.split(':')[1];
          return (currentPage === 'company-portal' || currentPage.startsWith('company-')) && portalTab === tab;
        }
        if (child.id === 'company-portal') {
          return (currentPage === 'company-portal' || currentPage === 'company-applications') && 
                 (portalTab === 'applications' || !portalTab || portalTab === '') && 
                 portalTab !== 'followup';
        }
        return currentPage === child.id;
      });

      if (hasActiveChild) {
        setOpenSections(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [currentPage, portalTab, navSections]);

  // Find page title for top header
  const getPageTitle = () => {
    for (const section of navSections) {
      if (section.isStandalone && section.pageId === currentPage) {
        return section.title;
      }
      const child = section.children?.find(c => c.id === currentPage);
      if (child) return child.label;
    }
    return t('navDashboard');
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex ${language === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-50 shrink-0 bg-slate-900 border-x border-slate-800 text-slate-300 transform transition-all duration-300 ease-in-out flex flex-col shadow-xl
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        w-72
        ${sidebarOpen 
          ? 'translate-x-0' 
          : language === 'ar' 
            ? 'translate-x-full lg:translate-x-0' 
            : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-slate-800/80 bg-slate-950/60 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-all flex items-center justify-center group"
              title={language === 'ar' ? 'توسيع القائمة الجانبية' : 'Expand Sidebar'}
            >
              {Boolean(systemBranding?.logoUrl?.trim()) ? (
                <img 
                  src={systemBranding.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-8 object-contain rounded-xl bg-white p-1 shadow-xs group-hover:scale-105 transition-transform" 
                />
              ) : (
                <div className="h-8 w-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-base group-hover:scale-105 transition-transform">
                  C
                </div>
              )}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {Boolean(systemBranding?.logoUrl?.trim()) ? (
                  <img 
                    src={systemBranding.logoUrl} 
                    alt="Logo" 
                    className="h-8 w-8 object-contain rounded-xl bg-white p-1 shadow-xs shrink-0" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-base shrink-0">
                    C
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1 truncate">
                    {systemBranding?.platformName || 'Cropsa egypt'}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {systemBranding?.platformSubtitle || (language === 'ar' ? 'منظومة التقسيط والتمويل' : 'Financing Platform')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={toggleSidebarCollapsed}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={language === 'ar' ? 'ضم القائمة الجانبية' : 'Collapse Sidebar'}
                >
                  <PanelLeftClose className={`h-4.5 w-4.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
                {/* Mobile close button */}
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Identity Banner (Clickable to switch role) */}
        {isCollapsed ? (
          <div 
            onClick={() => setRoleSwitcherModalOpen(true)}
            className="p-2 mx-auto my-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 cursor-pointer transition-all flex flex-col items-center justify-center shrink-0 w-12 h-12 relative group"
            title={`${currentUser.name} (${roleLabels[currentUser.role] || ''}) - ${language === 'ar' ? 'اضغط لتبديل الحساب وتجربة الصلاحيات' : 'Switch Role'}`}
          >
            <div className="h-8 w-8 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
        ) : (
          <div 
            onClick={() => setRoleSwitcherModalOpen(true)}
            className="p-3 mx-3 my-2.5 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-700/50 cursor-pointer transition-all group shrink-0"
            title={language === 'ar' ? 'اضغط لتغيير الحساب وتجربة الصلاحيات' : 'Switch Role'}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{language === 'ar' ? 'الحساب النشط' : 'Active'}</span>
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-sky-300 flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3 text-slate-400 group-hover:text-sky-300" />
                <span>{language === 'ar' ? 'تبديل' : 'Switch'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white leading-tight truncate">{currentUser.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight truncate mt-0.5">
                  {roleLabels[currentUser.role]}
                </p>
                {currentUser.branchName && (
                  <p className="text-[10px] text-emerald-400 font-medium leading-tight truncate mt-0.5">
                    📍 {currentUser.branchName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Structured Navigation with Dropdowns for Main Sections */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin py-2 ${isCollapsed ? 'px-2 space-y-2' : 'px-3 space-y-2.5'}`}>
          {navSections.map(section => {
            const SectionIcon = section.icon;

            const checkItemActive = (itemId: string) => {
              if (itemId.startsWith('company-portal:')) {
                const tab = itemId.split(':')[1];
                return (currentPage === 'company-portal' || currentPage.startsWith('company-')) && portalTab === tab;
              }
              if (itemId === 'company-portal') {
                return (currentPage === 'company-portal' || currentPage === 'company-applications') && 
                       (portalTab === 'applications' || !portalTab || portalTab === '') && 
                       portalTab !== 'followup';
              }
              if (currentPage === itemId) return true;
              return false;
            };

            const items = section.children || (section.pageId ? [{
              id: section.pageId,
              label: section.title,
              icon: section.icon,
              badge: section.badge
            }] : []);

            const hasActiveChild = items.some(child => checkItemActive(child.id));
            const isOpen = !!openSections[section.id];
            
            // Total aggregated count for the section
            const sectionTotalCount = items.reduce((sum, item) => sum + (item.count || 0), 0);

            // Collapsed Mode Rendering (Mini-sidebar: Icon centered with tooltips / expansion)
            if (isCollapsed) {
              return (
                <div key={section.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCollapsed(false);
                      setOpenSections(prev => ({ ...prev, [section.id]: true }));
                    }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative ${
                      hasActiveChild
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                    title={section.title}
                  >
                    <SectionIcon className={`h-5 w-5 ${hasActiveChild ? 'text-emerald-400' : 'text-slate-300'}`} />
                    {sectionTotalCount > 0 && (
                      <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    )}
                  </button>
                </div>
              );
            }

            // Expanded Mode Rendering: Main Sections as Collapsible Dropdowns with bold & larger font
            return (
              <div key={section.id} className="rounded-xl transition-all">
                {/* Main Section Header - Dropdown Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-right group select-none ${
                    hasActiveChild
                      ? 'bg-slate-800/80 text-emerald-300 border border-slate-700/60 shadow-xs'
                      : 'text-slate-100 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {/* Title & Icon: Larger font & bold */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      hasActiveChild 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-slate-800 text-slate-300 group-hover:text-white'
                    }`}>
                      <SectionIcon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight truncate text-slate-100 group-hover:text-white">
                      {section.title}
                    </span>
                  </div>

                  {/* Badges & Chevron Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {sectionTotalCount > 0 && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {sectionTotalCount}
                      </span>
                    )}
                    <div className={`p-0.5 rounded-md text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-slate-200' : 'rotate-0'
                    }`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </button>

                {/* Sub-items (الأقسام الفرعية) */}
                {isOpen && (
                  <div className={`space-y-1 mt-1.5 transition-all ${
                    language === 'ar' ? 'mr-3.5 pr-2.5 border-r border-slate-800' : 'ml-3.5 pl-2.5 border-l border-slate-800'
                  }`}>
                    {items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = checkItemActive(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.action) {
                              item.action();
                            } else {
                              onNavigate(item.id);
                            }
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-right ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shadow-2xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <ItemIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.count !== undefined && item.count > 0 && (
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {item.count}
                              </span>
                            )}
                            {item.badge && (
                              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: Firestore status, Collapse Toggle & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
          {/* Firestore indicator */}
          {isCollapsed ? (
            <div className="flex items-center justify-center" title={isFirestoreConnected ? (language === 'ar' ? 'سحابة النظام متصلة' : 'Cloud Connected') : (language === 'ar' ? 'جاري الاتصال بالسحابة' : 'Connecting Cloud')}>
              <span className={`h-2.5 w-2.5 rounded-full ${isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isFirestoreConnected 
                  ? (language === 'ar' ? 'سحابة النظام متصلة' : 'Cloud Connected')
                  : (language === 'ar' ? 'جاري الاتصال بالسحابة' : 'Connecting Cloud')}
              </span>
              <Database className="h-3.5 w-3.5 text-slate-500" />
            </div>
          )}

          {/* Sidebar Collapse/Expand Button */}
          {isCollapsed ? (
            <button 
              type="button"
              onClick={toggleSidebarCollapsed}
              className="flex items-center justify-center w-12 h-9 mx-auto text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors border border-slate-800"
              title={language === 'ar' ? 'توسيع القائمة الجانبية' : 'Expand Sidebar'}
            >
              <PanelLeftOpen className={`h-4.5 w-4.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button 
              type="button"
              onClick={toggleSidebarCollapsed}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors border border-slate-800"
              title={language === 'ar' ? 'ضم القائمة الجانبية' : 'Collapse Sidebar'}
            >
              <PanelLeftClose className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'ضم القائمة الجانبية' : 'Collapse Sidebar'}</span>
            </button>
          )}

          {/* Logout Button */}
          {isCollapsed ? (
            <button 
              type="button"
              onClick={logout}
              className="flex items-center justify-center w-12 h-9 mx-auto text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-500/20"
              title={t('logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-xl transition-colors border border-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('logout')}
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-6 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-700">
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button 
              type="button"
              onClick={toggleSidebarCollapsed} 
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs"
              title={isCollapsed ? (language === 'ar' ? 'توسيع القائمة الجانبية' : 'Expand Sidebar') : (language === 'ar' ? 'ضم القائمة الجانبية' : 'Collapse Sidebar')}
            >
              {isCollapsed ? (
                <PanelLeftOpen className={`h-4.5 w-4.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              ) : (
                <PanelLeftClose className={`h-4.5 w-4.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div>
              <h2 className="text-base lg:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{getPageTitle()}</span>
                {currentUser.role === Role.BRANCH_MANAGER && currentUser.branchName && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md">
                    {currentUser.branchName}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Controls: Quick follow-up, Language, Notifications, Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Clean Client Follow-up Button */}
            <button
              onClick={() => setClientFollowUpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-2xs"
              title={language === 'ar' ? 'متابعة العملاء وسجل الإجراءات' : 'Client Follow-Up'}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'متابعة العملاء' : 'Client Follow-Up'}
              </span>
            </button>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Toggle Language"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 relative transition-colors text-slate-600"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[480px] flex flex-col overflow-hidden animate-in fade-in`}>
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-crobsa-600" />
                      <h3 className="text-sm font-bold text-slate-900">{t('notifications')}</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} {language === 'ar' ? 'جديد' : 'new'}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                    {myNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        {t('noNotifications')}
                      </div>
                    ) : (
                      myNotifications.map(notif => {
                        const notifConfig = notif.commentNotificationType 
                          ? COMMENT_NOTIFICATION_CONFIG[notif.commentNotificationType] 
                          : null;

                        return (
                          <div 
                            key={notif.id} 
                            className={`p-3.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                              notif.read ? 'opacity-70 bg-white' : 'bg-sky-50/60 border-r-4 border-sky-500 font-medium'
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              {notifConfig ? (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${notifConfig.badgeBg} ${notifConfig.badgeText} ${notifConfig.borderColor} flex items-center gap-1`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${notifConfig.dotColor}`}></span>
                                  {notifConfig.labelAr}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500">
                                  {notif.type === 'SUCCESS' ? 'اعتماد وإشعار' : notif.type === 'WARNING' ? 'تنبيه عاجل' : notif.type === 'ERROR' ? 'إشعار رفض' : 'إشعار ومتابعة'}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                {new Date(notif.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-900 leading-snug font-sans">
                              {language === 'ar' ? notif.message : (notif.messageEn || notif.message)}
                            </p>
                            {notif.senderName && (
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <span>بواسطة:</span>
                                <span className="font-semibold text-slate-600">{notif.senderName}</span>
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Quick Logout */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <div 
                onClick={() => {
                  if (currentUser.role === Role.SUPER_ADMIN) {
                    setRoleSwitcherModalOpen(true);
                  }
                }}
                className={`flex items-center gap-2 ${
                  currentUser.role === Role.SUPER_ADMIN ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                }`}
                title={currentUser.role === Role.SUPER_ADMIN ? "تبديل الحساب أو فحص الصلاحيات (خاص بمدير النظام)" : undefined}
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-cropsa-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">{currentUser.name}</p>
                  <p className="text-[10px] text-emerald-800 font-semibold leading-tight">{roleLabels[currentUser.role]}</p>
                </div>
              </div>

              {/* Only Super Admin can switch roles */}
              {currentUser.role === Role.SUPER_ADMIN && (
                <button
                  type="button"
                  onClick={() => setRoleSwitcherModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-lg transition-colors cursor-pointer"
                  title="تبديل الحساب (متاح حصرياً لمدير النظام)"
                >
                  <ArrowLeftRight className="h-3 w-3 text-amber-600" />
                  <span>تبديل</span>
                </button>
              )}

              {/* Direct Header Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1 text-xs font-bold"
                title="تسجيل الخروج من المنصة"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden xl:inline text-[11px] text-rose-600">خروج</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Main Content Body */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom App Navigation Bar (تجربة تطبيق الهاتف الذكي مع شريط أيقونات سفلي تفاعلي) */}
        <nav 
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around safe-bottom"
        >
          {mobileNavItems.map(item => {
            const Icon = item.icon;
            if (item.isCenterAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => item.isAction ? item.action?.() : onNavigate(item.id)}
                  className="relative -top-4 flex flex-col items-center group focus:outline-none"
                >
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    item.active 
                      ? 'bg-gradient-to-tr from-crobsa-700 to-sky-600 text-white ring-4 ring-crobsa-100' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${
                    item.active ? 'text-crobsa-800 font-black' : 'text-slate-600'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => item.isAction ? item.action?.() : onNavigate(item.id)}
                className={`relative flex-1 py-1 flex flex-col items-center justify-center transition-all active:scale-95 ${
                  item.active ? 'text-crobsa-700 font-black' : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-colors ${item.active ? 'text-crobsa-700 stroke-[2.5]' : 'text-slate-500'}`} />
                  {item.badge && (
                    <span className={`absolute -top-1.5 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center ring-2 ring-white text-white ${
                      item.badgeColor === 'rose' ? 'bg-rose-500' : item.badgeColor === 'sky' ? 'bg-sky-600' : 'bg-crobsa-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-[64px]">
                  {item.label}
                </span>
                {item.active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-crobsa-700 mt-1 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Client Follow-up & Real-time Update Modal */}
      {clientFollowUpOpen && (
        <ClientFollowUpModal onClose={() => setClientFollowUpOpen(false)} />
      )}

      {/* Role Switcher Modal - STRICTLY restricted to Super Admin only */}
      {currentUser.role === Role.SUPER_ADMIN && (
        <RoleSwitcherModal 
          isOpen={roleSwitcherModalOpen}
          onClose={() => setRoleSwitcherModalOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
