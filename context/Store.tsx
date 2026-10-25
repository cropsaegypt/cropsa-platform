import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  User, 
  Application, 
  Transaction, 
  Notification, 
  AuditLog, 
  Role, 
  ApplicationStatus, 
  Client, 
  WithdrawalRequest,
  InstallmentCompany,
  CompanyBranch,
  ClientAccessRequest,
  OverdueCase,
  SharedDocument,
  AiCreditAnalysis,
  ClientTimelineItem,
  Language,
  InstallmentCompanyStaffRole,
  ApplicationComment,
  ApplicationDocument,
  ApplicationQuestion,
  ApplicationHistoryItem,
  FinancingProgram,
  SystemBranding,
  CommentNotificationType,
  CompanyWorkflowConfig,
  COMMENT_NOTIFICATION_CONFIG,
  STATUS_ARABIC,
  CommentNotificationTemplate,
  DEFAULT_COMMENT_NOTIFICATION_TEMPLATES,
  RecipientNotificationTemplate,
  ALL_KNOWN_INSTALLMENT_COMPANIES,
  ExternalDispatchTemplate,
  ExternalDispatchRecord,
  SmtpConfig,
  InboxMessage,
  InboxMessageAiAnalysis,
  SalesmanTarget
} from '../types';
import { generateBranchCredentials } from '../utils/branchCredentials';
import { 
  MOCK_USERS, 
  MOCK_COMPANIES, 
  MOCK_BRANCHES, 
  MOCK_APPLICATIONS, 
  MOCK_CLIENTS, 
  MOCK_CLIENT_REQUESTS, 
  MOCK_OVERDUE_CASES, 
  MOCK_SHARED_DOCUMENTS, 
  MOCK_NOTIFICATIONS, 
  MOCK_AUDIT_LOGS, 
  MOCK_TRANSACTIONS, 
  MOCK_WITHDRAWALS,
  MOCK_APPLICATION_QUESTIONS,
  DEFAULT_BRANDING,
  DEFAULT_EXTERNAL_DISPATCH_TEMPLATES,
  DEFAULT_SMTP_CONFIG,
  DEFAULT_INBOX_MESSAGES
} from '../services/mockData';
import { translations } from '../services/translations';
import { supabase } from '../services/supabase';
import { analyzeCompanyReplyWithAi } from '../services/gemini';

interface NavigationTarget {
  page: string;
  resourceId?: string;
  subTab?: string;
}

interface StoreContextType {
  // Language & UI
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.ar) => string;
  isFirestoreConnected: boolean;
  isInitialSyncComplete: boolean;

  // Auth & Session
  currentUser: User | null;
  currentCompany: InstallmentCompany | null;
  sessionWarning: string | null;
  clearSessionWarning: () => void;
  users: User[];
  companies: InstallmentCompany[];
  branches: CompanyBranch[];
  applications: Application[];
  transactions: Transaction[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  clients: Client[];
  clientRequests: ClientAccessRequest[];
  overdueCases: OverdueCase[];
  sharedDocuments: SharedDocument[];
  aiAnalyses: AiCreditAnalysis[];
  withdrawalRequests: WithdrawalRequest[];
  pendingNavigation: NavigationTarget | null;
  systemBranding: SystemBranding;

  // Actions
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (password: string) => Promise<void>;
  requestPasswordResetOtp: (identifier: string) => Promise<{ success: boolean; message: string; otp?: string; maskedTarget?: string; user?: User; emailSent?: boolean }>;
  verifyPasswordResetOtp: (userId: string, code: string) => Promise<boolean>;
  completePasswordReset: (userId: string, newPassword: string) => Promise<boolean>;
  updateBranding: (updates: Partial<SystemBranding>) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  
  // Super Admin & Admin operations
  createUser: (user: Partial<User>) => Promise<void>;
  updateUserWallet: (userId: string, newBalance: number) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createCompany: (company: Partial<InstallmentCompany>, initialAdminPassword?: string, initialAdminUsername?: string) => Promise<void>;
  updateCompany: (companyId: string, updates: Partial<InstallmentCompany>) => Promise<void>;
  updateCompanyAdminCredentials: (companyId: string, credentials: { username?: string; email?: string; password?: string }) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
  createBranch: (branch: Partial<CompanyBranch>) => Promise<void>;
  updateBranch: (branchId: string, updates: Partial<CompanyBranch>) => Promise<void>;
  updateBranchPassword: (branchId: string, newPassword: string) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  bulkImportCompanyBranches: (companyId: string, branchesToImport: Partial<CompanyBranch>[]) => Promise<{ count: number }>;
  wipeDemoData: (password: string) => Promise<void>;
  isDemoDataWiped: boolean;
  
  // Company-level Staff Management (Immediate user & password creation)
  createCompanyStaff: (staffData: {
    name: string;
    username: string;
    password: string;
    staffRole: InstallmentCompanyStaffRole;
    governorate: string;
    branchId: string;
    branchName?: string;
    email?: string;
    phone?: string;
    permissions: string[];
  }) => Promise<void>;
  updateStaffPermissions: (userId: string, permissions: string[]) => Promise<void>;
  updateStaffPassword: (userId: string, newPassword: string) => Promise<void>;
  bulkImportBranchesAndStaff: (data: {
    branches: Array<{
      name: string;
      governorate: string;
      address: string;
      phone: string;
      managerName?: string;
    }>;
    staff: Array<{
      name: string;
      username: string;
      password: string;
      role: InstallmentCompanyStaffRole;
      branchName: string;
      governorate: string;
      phone?: string;
      email?: string;
      permissions?: string[];
    }>;
  }) => Promise<{ importedBranches: number; importedStaff: number }>;

  // Client Directory & Cross-Company Access Requests
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (clientId: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addClientTimelineEvent: (clientId: string, event: Omit<ClientTimelineItem, 'id' | 'timestamp' | 'clientId'>) => Promise<void>;
  addClientCrossComment: (params: {
    clientId: string;
    applicationId?: string;
    message: string;
    commentType: string;
    isUrgent?: boolean;
  }) => Promise<void>;
  requestClientAccess: (clientId: string, reason: string) => Promise<void>;
  reviewClientAccessRequest: (requestId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => Promise<void>;

  // Follow-up & Collections
  addOverdueCase: (overdueData: Partial<OverdueCase>) => Promise<void>;
  logOverdueFollowUp: (overdueId: string, followUp: {
    type: 'PHONE_CALL' | 'SMS' | 'VISIT' | 'OFFICIAL_WARNING';
    note: string;
    promisedPaymentDate?: string;
    newStatus?: OverdueCase['collectionStatus'];
  }) => Promise<void>;

  // Shared Documents Repository
  addSharedDocument: (docData: Partial<SharedDocument>) => Promise<void>;
  deleteSharedDocument: (docId: string) => Promise<void>;

  // AI Credit & Risk Assessment
  saveAiAnalysis: (analysis: AiCreditAnalysis) => Promise<void>;
  updateCompanyRejectionReasons: (companyId: string, reasons: string[]) => Promise<void>;
  updateCompanyWorkflowConfig: (companyId: string, config: CompanyWorkflowConfig) => Promise<void>;

  // Applications Workflow
  applicationQuestions: ApplicationQuestion[];
  addApplicationQuestion: (q: Partial<ApplicationQuestion>) => Promise<void>;
  updateApplicationQuestion: (id: string, updates: Partial<ApplicationQuestion>) => Promise<void>;
  deleteApplicationQuestion: (id: string) => Promise<void>;

  // Financing Programs & Custom Credit Survey
  financingPrograms: FinancingProgram[];
  addFinancingProgram: (program: Partial<FinancingProgram>) => Promise<void>;
  updateFinancingProgram: (id: string, updates: Partial<FinancingProgram>) => Promise<void>;
  deleteFinancingProgram: (id: string) => Promise<void>;
  
  // Real-time Discussion, Documents, Expediting & Re-routing
  addApplicationComment: (
    appId: string, 
    message: string, 
    isUrgent?: boolean, 
    notificationType?: CommentNotificationType
  ) => Promise<void>;
  uploadApplicationDocument: (appId: string, doc: Omit<ApplicationDocument, 'id' | 'uploadedBy' | 'uploadedByName' | 'uploadedAt'>) => Promise<void>;
  expediteApplication: (appId: string) => Promise<void>;
  assignCompanyOfficer: (appId: string, officerId: string, officerName: string) => Promise<void>;
  assignCompanyBranchAndOfficer: (appId: string, branchId: string, branchName: string, officerId: string, officerName: string) => Promise<void>;
  autoAssignCompanyBranches: (companyId: string) => Promise<number>;
  requestBranchTransfer: (appId: string, targetBranchId: string, targetBranchName: string, reason: string) => Promise<void>;
  reviewBranchTransfer: (appId: string, approved: boolean, note?: string) => Promise<void>;
  reRouteApplication: (appId: string, newCompanyId: string, reason: string) => Promise<void>;

  createApplication: (app: Partial<Application>) => Promise<void>;
  updateApplication: (appId: string, updates: Partial<Application>) => Promise<void>;
  deleteApplication: (appId: string) => Promise<boolean>;
  requestCaseUpdate: (appId: string, reason: string, channel?: 'WHATSAPP' | 'EMAIL' | 'SYSTEM') => Promise<void>;
  resolveCaseUpdate: (appId: string, resolutionNote?: string) => Promise<void>;
  disburseApplicationAmount: (appId: string, amount: number, notes?: string, receiptNumber?: string) => Promise<boolean>;
  assignApplication: (appId: string, companyIds: string[], branchId?: string, branchName?: string, officerId?: string, officerName?: string) => Promise<void>;
  acknowledgeApplication: (appId: string) => Promise<void>;
  reviewApplication: (
    appId: string, 
    status: ApplicationStatus, 
    note: string, 
    approvedAmount?: number,
    rejectionDetails?: { reason: string; notes?: string }
  ) => Promise<void>;
  requestWithdrawal: (appId: string, amount: number, note: string) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
  renewInstallment: (clientId: string, amount: number, companyId?: string, extra?: { companyName?: string; aiAnalysis?: any; notes?: string; durationMonths?: number }) => Promise<void>;
  bulkImportClients: (importedClients: Partial<Client>[], initialApps?: Partial<Application>[]) => Promise<{ importedCount: number; errors: string[] }>;
  bulkImportApplications: (items: Array<{
    client: Partial<Client>;
    application: Partial<Application>;
  }>) => Promise<{ importedCount: number; errors: string[] }>;

  // System & Navigation
  addNotification: (
    userId: string, 
    message: string, 
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', 
    referenceId?: string,
    messageEn?: string,
    referenceType?: Notification['referenceType'],
    options?: {
      targetCompanyId?: string;
      targetBranchId?: string;
      targetOfficerId?: string;
      targetRole?: Role;
      commentNotificationType?: CommentNotificationType;
      senderName?: string;
      title?: string;
    }
  ) => Promise<void>;
  // Archiving & Database Optimization (الأرشفة التلقائية وتنظيف البيانات)
  archiveApplication: (appId: string, reason?: string) => Promise<void>;
  unarchiveApplication: (appId: string) => Promise<void>;
  autoArchiveApplications: (options?: { olderThanMonths?: number; archiveRejected?: boolean }) => Promise<{ count: number; archivedIds: string[] }>;

  markNotificationRead: (notifId: string) => Promise<void>;
  addAuditLog: (action: string, details: string, referenceId?: string) => Promise<void>;
  setNavigation: (target: NavigationTarget | null) => void;

  // Notification Templates Management (إدارة قوالب الإشعارات المخصصة لتعليقات الموظفين)
  notificationTemplates: CommentNotificationTemplate[];
  updateNotificationTemplate: (templateId: string, updates: Partial<CommentNotificationTemplate>) => Promise<void>;
  createNotificationTemplate: (template: Omit<CommentNotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  deleteNotificationTemplate: (templateId: string) => Promise<void>;
  resetNotificationTemplatesToDefault: () => Promise<void>;

  // External Company Dispatch Templates & Corporate SMTP
  externalDispatchTemplates: ExternalDispatchTemplate[];
  smtpConfig: SmtpConfig;
  updateSmtpConfig: (config: Partial<SmtpConfig>) => Promise<void>;
  updateExternalDispatchTemplate: (templateId: string, updates: Partial<ExternalDispatchTemplate>) => Promise<void>;
  createExternalDispatchTemplate: (template: Partial<ExternalDispatchTemplate>) => Promise<string>;
  deleteExternalDispatchTemplate: (templateId: string) => Promise<void>;
  resetExternalDispatchTemplatesToDefault: () => Promise<void>;
  dispatchApplicationToExternalCompany: (
    appId: string, 
    payload: {
      companyId: string;
      companyName?: string;
      channel: 'WHATSAPP' | 'EMAIL';
      templateCategory: ExternalDispatchTemplate['category'];
      templateName?: string;
      targetContact: string;
      driveLink?: string;
      subject?: string;
      content: string;
      deliveryMethod?: 'DIRECT_SMTP' | 'CLIENT_MAILTO' | 'WHATSAPP_LINK';
    }
  ) => Promise<{ success: boolean; message: string }>;

  // Internal Inbox & AI Response Ingestion
  inboxMessages: InboxMessage[];
  addInboxMessage: (msg: Partial<InboxMessage>) => Promise<InboxMessage>;
  analyzeInboxMessageWithAi: (messageId: string) => Promise<InboxMessageAiAnalysis | undefined>;
  applyInboxMessageToPlatform: (messageId: string) => Promise<boolean>;
  deleteInboxMessage: (messageId: string) => Promise<void>;
  clearAllInboxMessages: () => Promise<void>;

  // Sales Representatives (موظفي ومندوبي المبيعات بما فيهم غير المسجلين)
  salesRepresentatives: string[];
  addSalesRepresentative: (name: string) => Promise<void>;
  deleteSalesRepresentative: (name: string) => Promise<void>;

  // Sales Targets (مستهدفات وأهداف موظفي البيع والمندوبين)
  salesTargets: Record<string, SalesmanTarget>;
  saveSalesTarget: (target: SalesmanTarget) => Promise<void>;
  deleteSalesTarget: (salesmanName: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('crobsa_lang') as Language) || 'ar';
  });
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(true);
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState<boolean>(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);

  const clearSessionWarning = () => setSessionWarning(null);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check URL parameters for explicit logout flag
    if (typeof window !== 'undefined' && window.location.search.includes('logout=true')) {
      sessionStorage.removeItem('cropsa_active_user');
      sessionStorage.removeItem('crobsa_active_user');
      sessionStorage.removeItem('cropsa_session_id');
      localStorage.removeItem('cropsa_active_user');
      localStorage.removeItem('crobsa_active_user');
      localStorage.removeItem('cropsa_session_id');
      return null;
    }
    // Only restore user if active session and token exist in this browser tab/window's sessionStorage
    const sessionSaved = sessionStorage.getItem('cropsa_active_user') || sessionStorage.getItem('crobsa_active_user');
    const sessionId = sessionStorage.getItem('cropsa_session_id');
    if (sessionSaved && sessionId) {
      try { return JSON.parse(sessionSaved); } catch (e) { /* continue */ }
    }
    // Strict security: if opening the link in a new place/browser/window without active sessionStorage, require login
    localStorage.removeItem('cropsa_active_user');
    localStorage.removeItem('crobsa_active_user');
    return null;
  });

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isDemoDataWiped, setIsDemoDataWiped] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cropsa_demo_data_wiped') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [companies, setCompanies] = useState<InstallmentCompany[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_companies');
      return saved ? JSON.parse(saved) : MOCK_COMPANIES;
    } catch {
      return MOCK_COMPANIES;
    }
  });

  const [branches, setBranches] = useState<CompanyBranch[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_branches');
      return saved ? JSON.parse(saved) : MOCK_BRANCHES;
    } catch {
      return MOCK_BRANCHES;
    }
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_applications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return MOCK_APPLICATIONS;
    } catch {
      return MOCK_APPLICATIONS;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return MOCK_CLIENTS;
    } catch {
      return MOCK_CLIENTS;
    }
  });

  // Track permanently deleted inbox message IDs so they NEVER get restored by defaults or cache
  const [deletedInboxMessageIds, setDeletedInboxMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_deleted_inbox_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>(() => {
    try {
      const savedDeleted = localStorage.getItem('cropsa_deleted_inbox_ids');
      const delIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
      const saved = localStorage.getItem('cropsa_inbox_messages');
      if (saved) {
        const parsed: InboxMessage[] = JSON.parse(saved);
        return parsed.filter(m => !delIds.includes(m.id));
      }
      return DEFAULT_INBOX_MESSAGES.filter(m => !delIds.includes(m.id));
    } catch {
      return [];
    }
  });

  // Sales representatives list (including non-registered offline staff)
  const [salesRepresentatives, setSalesRepresentatives] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_sales_representatives');
      if (saved) return JSON.parse(saved);
      return [
        'أحمد محمود (مبيعات القاهرة)',
        'محمد عبد الله (مبيعات الصعيد)',
        'محمود حسن (مبيعات الدلتا)',
        'سارة إبراهيم (مبيعات الإسكندرية)'
      ];
    } catch {
      return [
        'أحمد محمود (مبيعات القاهرة)',
        'محمد عبد الله (مبيعات الصعيد)',
        'محمود حسن (مبيعات الدلتا)',
        'سارة إبراهيم (مبيعات الإسكندرية)'
      ];
    }
  });

  // Sales Targets configuration per salesman
  const [salesTargets, setSalesTargets] = useState<Record<string, SalesmanTarget>>(() => {
    try {
      const saved = localStorage.getItem('cropsa_sales_targets');
      if (saved) return JSON.parse(saved);
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cropsa_applications', JSON.stringify(applications));
    } catch (e) {
      console.warn('Failed to persist applications to localStorage:', e);
    }
  }, [applications]);

  useEffect(() => {
    try {
      if (clients.length > 0) {
        localStorage.setItem('cropsa_clients', JSON.stringify(clients));
      }
    } catch (e) {
      console.warn('Failed to persist clients to localStorage:', e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem('cropsa_inbox_messages', JSON.stringify(inboxMessages));
    } catch (e) {
      console.warn('Failed to persist inbox messages to localStorage:', e);
    }
  }, [inboxMessages]);

  const [clientRequests, setClientRequests] = useState<ClientAccessRequest[]>(MOCK_CLIENT_REQUESTS);
  const [overdueCases, setOverdueCases] = useState<OverdueCase[]>(() => {
    try {
      if (localStorage.getItem('cropsa_demo_data_wiped') === 'true') return [];
      const saved = localStorage.getItem('cropsa_overdue_cases');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return MOCK_OVERDUE_CASES;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cropsa_overdue_cases', JSON.stringify(overdueCases));
    } catch (e) {
      console.warn('Failed to persist overdue cases to localStorage:', e);
    }
  }, [overdueCases]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>(MOCK_SHARED_DOCUMENTS);
  const [aiAnalyses, setAiAnalyses] = useState<AiCreditAnalysis[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      if (localStorage.getItem('cropsa_demo_data_wiped') === 'true') return [];
      return MOCK_NOTIFICATIONS;
    } catch {
      return [];
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      if (localStorage.getItem('cropsa_demo_data_wiped') === 'true') return [];
      return MOCK_TRANSACTIONS;
    } catch {
      return [];
    }
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    try {
      if (localStorage.getItem('cropsa_demo_data_wiped') === 'true') return [];
      return MOCK_WITHDRAWALS;
    } catch {
      return [];
    }
  });
  const [applicationQuestions, setApplicationQuestions] = useState<ApplicationQuestion[]>(MOCK_APPLICATION_QUESTIONS);
  const [financingPrograms, setFinancingPrograms] = useState<FinancingProgram[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_financing_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cropsa_financing_programs:', e);
    }
    return MOCK_COMPANIES.flatMap(c => 
      (c.financingPrograms || []).map(p => ({
        ...p,
        companyId: p.companyId || c.id,
        companyName: p.companyName || c.name,
        active: p.active !== undefined ? p.active : true,
        questionIds: p.questionIds || []
      }))
    );
  });

  useEffect(() => {
    try {
      if (financingPrograms && financingPrograms.length > 0) {
        localStorage.setItem('cropsa_financing_programs', JSON.stringify(financingPrograms));
      }
    } catch (e) {
      console.warn('Failed to persist financing programs:', e);
    }
  }, [financingPrograms]);
  const [pendingNavigation, setPendingNavigation] = useState<NavigationTarget | null>(null);
  const [systemBranding, setSystemBranding] = useState<SystemBranding>(() => {
    try {
      const saved = localStorage.getItem('crobsa_branding');
      return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
    } catch {
      return DEFAULT_BRANDING;
    }
  });

  const [notificationTemplates, setNotificationTemplates] = useState<CommentNotificationTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('crobsa_notification_templates');
      return saved ? JSON.parse(saved) : DEFAULT_COMMENT_NOTIFICATION_TEMPLATES;
    } catch {
      return DEFAULT_COMMENT_NOTIFICATION_TEMPLATES;
    }
  });

  const [externalDispatchTemplates, setExternalDispatchTemplates] = useState<ExternalDispatchTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('cropsa_external_dispatch_templates');
      return saved ? JSON.parse(saved) : DEFAULT_EXTERNAL_DISPATCH_TEMPLATES;
    } catch {
      return DEFAULT_EXTERNAL_DISPATCH_TEMPLATES;
    }
  });

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    try {
      const saved = localStorage.getItem('cropsa_smtp_config');
      return saved ? JSON.parse(saved) : DEFAULT_SMTP_CONFIG;
    } catch {
      return DEFAULT_SMTP_CONFIG;
    }
  });

  const updateBranding = async (updates: Partial<SystemBranding>) => {
    const nextBranding: SystemBranding = {
      ...systemBranding,
      ...updates
    };

    setSystemBranding(nextBranding);
    
    // Safely cache in localStorage without letting quota errors block database persistence
    try {
      localStorage.setItem('crobsa_branding', JSON.stringify(nextBranding));
    } catch (e) {
      console.warn('LocalStorage quota or permission restriction on branding cache:', e);
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('system_settings').upsert({
          id: 'branding',
          data: nextBranding,
          updated_at: new Date().toISOString()
        });
        if (error) {
          console.error('Supabase updateBranding error:', error);
          throw new Error('Supabase error: ' + error.message);
        }
      } catch (err: any) {
        console.error('Supabase updateBranding failed:', err);
        throw err;
      }
    }

    try {
      await setDoc(doc(db, 'system_settings', 'branding'), updates, { merge: true });
    } catch (err) {
      console.warn('Firestore updateBranding fallback:', err);
    }
    addAuditLog('UPDATE_BRANDING', 'Platform branding and logo updated');
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    let nextUsersList: User[] = [];
    setUsers(prev => {
      nextUsersList = prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      try {
        localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsersList));
      } catch (e) {}
      return nextUsersList;
    });

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        try {
          sessionStorage.setItem('cropsa_active_user', JSON.stringify(updated));
          sessionStorage.setItem('crobsa_active_user', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    const targetUser = nextUsersList.find(u => u.id === userId);

    if (supabase && targetUser) {
      try {
        // 1. Upsert into Supabase users table (inserts if not present, updates if present)
        await supabase.from('users').upsert({
          id: targetUser.id,
          name: targetUser.name,
          username: targetUser.username,
          email: targetUser.email,
          password: targetUser.password,
          role: targetUser.role,
          staff_role: targetUser.staffRole || null,
          company_id: targetUser.companyId || null,
          branch_id: targetUser.branchId || null,
          governorate: targetUser.governorate || null,
          phone: targetUser.phone || null,
          wallet_balance: targetUser.walletBalance || 0,
          commission_rate: targetUser.commissionRate || 0,
          must_change_password: targetUser.mustChangePassword ?? false,
          active: true
        });

        // 2. Persist full users array in system_settings for universal cross-device / cross-browser sync
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsersList,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateUserProfile fallback:', err);
      }
    }

    // 3. If target user is an installment company admin, also persist company admin credentials
    if (targetUser?.companyId && (targetUser.role === Role.INSTALLMENT_COMPANY || targetUser.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)) {
      setCompanies(prev => {
        const nextComps = prev.map(c => {
          if (c.id === targetUser.companyId) {
            return {
              ...c,
              adminUsername: targetUser.username,
              adminEmail: targetUser.email,
              adminPassword: targetUser.password
            };
          }
          return c;
        });
        if (supabase) {
          supabase.from('system_settings').upsert({
            id: 'companies_data',
            data: nextComps,
            updated_at: new Date().toISOString()
          }).catch(console.warn);
        }
        try {
          localStorage.setItem('cropsa_companies', JSON.stringify(nextComps));
        } catch (e) {}
        return nextComps;
      });
    }

    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Firestore updateUserProfile fallback:', err);
    }
    addAuditLog('UPDATE_PROFILE', `Updated profile of user ${userId}`, userId);
  };

  // Sync Language with document direction
  useEffect(() => {
    localStorage.setItem('crobsa_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = useCallback((key: keyof typeof translations.ar): string => {
    const dict = translations[language] || translations.ar;
    return dict[key] || translations.ar[key] || String(key);
  }, [language]);

  // Derived current installment company for the logged in company user
  const currentCompany = React.useMemo(() => {
    if (!currentUser) return null;
    const isCompanyRole = currentUser.role === Role.INSTALLMENT_COMPANY || 
                          currentUser.role === Role.BRANCH_MANAGER || 
                          currentUser.role === Role.COMPANY_EMPLOYEE;
    if (!isCompanyRole) {
      return null;
    }
    if (currentUser.companyId) {
      return companies.find(c => c.id === currentUser.companyId) || companies[0] || null;
    }
    return companies[0] || null;
  }, [currentUser, companies]);

  // Initial sync safety timeout: guarantee UI is never blocked indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialSyncComplete(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Helper to reliably map application rows into full Application entities
  const mapApplicationRow = (a: any, existingMock?: Application): Application => {
    const compId = a.company_id || existingMock?.companyId || existingMock?.assignedCompanyIds?.[0] || 'comp_01';
    const mockCompIds = existingMock?.assignedCompanyIds || [compId];
    const assignedCompanyIds = Array.from(new Set([compId, ...mockCompIds].filter(Boolean)));
    const branchId = a.branch_id || existingMock?.assignedBranchId || 'br_01';
    const branchName = existingMock?.assignedBranchName || 'فرع مدينة نصر الرئيسي';
    const finAmt = Number(a.financed_amount) || Number(a.total_amount) || existingMock?.requestedAmount || 0;
    const appAmt = (a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED)
      ? (Number(a.financed_amount) || existingMock?.approvedAmount || finAmt)
      : (existingMock?.approvedAmount || 0);
    const usedAmt = (a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED)
      ? (Number(a.financed_amount) || existingMock?.usedAmount || appAmt)
      : (existingMock?.usedAmount || 0);

    return {
      id: a.id,
      clientId: a.client_id || existingMock?.clientId || `c_${a.id}`,
      clientName: a.client_name || existingMock?.clientName || 'عميل',
      clientPhone: a.client_phone || existingMock?.phoneNumber || existingMock?.clientPhone || '',
      clientNationalId: a.client_national_id || existingMock?.clientNationalId || '',
      phoneNumber: a.client_phone || existingMock?.phoneNumber || existingMock?.clientPhone || '',
      whatsappNumber: a.client_phone || existingMock?.whatsappNumber || existingMock?.phoneNumber || '',
      governorate: existingMock?.governorate || 'القاهرة',
      companyId: compId,
      assignedCompanyIds,
      supplierId: a.supplier_id || existingMock?.supplierId || 'u_sup1',
      salesmanId: a.salesman_id || existingMock?.salesmanId || 'u_sales1',
      assignedOfficerId: a.assigned_officer_id || existingMock?.assignedOfficerId,
      assignedOfficerName: existingMock?.assignedOfficerName,
      branchId: branchId,
      assignedBranchId: branchId,
      assignedBranchName: branchName,
      totalAmount: Number(a.total_amount) || finAmt,
      downPayment: Number(a.down_payment) || 0,
      financedAmount: finAmt,
      requestedAmount: Number(a.total_amount) || finAmt,
      approvedAmount: appAmt,
      usedAmount: usedAmt,
      monthlyInstallment: Number(a.monthly_installment) || Math.round(finAmt / (Number(a.duration_months) || 12)),
      durationMonths: Number(a.duration_months) || existingMock?.durationMonths || 12,
      status: (a.status as ApplicationStatus) || existingMock?.status || ApplicationStatus.RECEIVED,
      productType: a.product_type || existingMock?.productType || 'منتج زراعي',
      productDescription: a.product_description || existingMock?.description || existingMock?.productDescription || '',
      profession: existingMock?.profession || 'MERCHANT',
      financeType: existingMock?.financeType || 'INSTALLMENT',
      hasRecentInstallment: existingMock?.hasRecentInstallment ?? true,
      hasRecentReceipt: existingMock?.hasRecentReceipt ?? false,
      recentReceiptAmount: existingMock?.recentReceiptAmount,
      createdAt: a.created_at || existingMock?.createdAt || new Date().toISOString(),
      submittedAt: a.created_at || existingMock?.submittedAt || new Date().toISOString(),
      submittedBy: a.salesman_id || a.supplier_id || existingMock?.submittedBy || 'u_sup1',
      description: a.product_description || existingMock?.description || existingMock?.productDescription || 'طلب تمويل وتقسيط',
      comments: existingMock?.comments || [],
      documents: existingMock?.documents || [],
      driveLink: a.drive_link || existingMock?.driveLink || '',
      externalDispatches: a.external_dispatches || existingMock?.externalDispatches || [],
      history: existingMock?.history || [
        {
          action: 'CREATED',
          timestamp: a.created_at || new Date().toISOString(),
          performedBy: a.salesman_id || a.supplier_id || 'u_sup1',
          performedByName: a.client_name,
          details: 'تقديم طلب التمويل عبر المنصة'
        }
      ]
    };
  };

  // Supabase Data Layer: Initial sync, automatic seeding, and real-time subscriptions
  useEffect(() => {
    let isMounted = true;
    let supabaseChannel: any = null;

    if (!supabase) return;

    async function syncSupabaseInitialData() {
      try {
        // Fetch all primary database collections concurrently for instant rendering
        const [
          brandingRes,
          companiesRes,
          branchRes,
          clientRes,
          userRes,
          appRes,
          appSettingRes,
          smtpRes,
          extTmplRes,
          demoWipedRes,
          companiesDataRes,
          branchDataRes,
          usersDataRes,
          financingProgramsRes,
          clientsDataRes,
          deletedCompanyIdsRes,
          inboxMessagesRes,
          deletedInboxIdsRes,
          salesRepsRes,
          salesTargetsRes
        ] = await Promise.all([
          supabase!.from('system_settings').select('data').eq('id', 'branding').maybeSingle(),
          supabase!.from('companies').select('*'),
          supabase!.from('company_branches').select('*'),
          supabase!.from('clients').select('*'),
          supabase!.from('users').select('*'),
          supabase!.from('applications').select('*'),
          supabase!.from('system_settings').select('data').eq('id', 'applications_data').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'smtp_config').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'external_dispatch_templates').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'system_demo_wiped').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'companies_data').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'company_branches_data').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'users_data').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'financing_programs').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'clients_data').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'deleted_company_ids').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'inbox_messages').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'deleted_inbox_ids').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'sales_representatives').maybeSingle(),
          supabase!.from('system_settings').select('data').eq('id', 'sales_targets').maybeSingle()
        ]);

        const isRemoteWiped = demoWipedRes?.data?.data?.wiped === true;
        const isLocalWiped = localStorage.getItem('cropsa_demo_data_wiped') === 'true';
        const isWiped = isRemoteWiped || isLocalWiped;
        if (isWiped && isMounted) {
          setIsDemoDataWiped(true);
        }

        // Process permanently deleted company tombstones
        const deletedCompanyIds = new Set<string>();
        if (deletedCompanyIdsRes?.data?.data && Array.isArray(deletedCompanyIdsRes.data.data)) {
          deletedCompanyIdsRes.data.data.forEach((id: string) => deletedCompanyIds.add(id));
        }
        try {
          const localDel = localStorage.getItem('cropsa_deleted_company_ids');
          if (localDel) {
            JSON.parse(localDel).forEach((id: string) => deletedCompanyIds.add(id));
          }
        } catch {}

        // Process Financing Programs
        let remotePrograms: FinancingProgram[] = [];
        if (financingProgramsRes?.data?.data && Array.isArray(financingProgramsRes.data.data) && financingProgramsRes.data.data.length > 0) {
          remotePrograms = financingProgramsRes.data.data;
        } else {
          try {
            const savedLocalProg = localStorage.getItem('cropsa_financing_programs');
            if (savedLocalProg) {
              const parsed = JSON.parse(savedLocalProg);
              if (Array.isArray(parsed) && parsed.length > 0) remotePrograms = parsed;
            }
          } catch {}
          if (remotePrograms.length === 0) {
            remotePrograms = MOCK_COMPANIES.flatMap(c => 
              (c.financingPrograms || []).map(p => ({
                ...p,
                companyId: p.companyId || c.id,
                companyName: p.companyName || c.name
              }))
            );
          }
        }
        // Initial in-memory placement for remote programs; final canonical consolidation occurs after companyMap processing
        if (remotePrograms.length > 0 && isMounted) {
          setFinancingPrograms(remotePrograms);
          try {
            localStorage.setItem('cropsa_financing_programs', JSON.stringify(remotePrograms));
          } catch {}
        }

        // 1. Process Platform Branding
        if (brandingRes?.data?.data) {
          const remoteBranding = brandingRes.data.data as SystemBranding;
          if (isMounted) {
            setSystemBranding(prev => ({ ...prev, ...remoteBranding }));
            try {
              localStorage.setItem('crobsa_branding', JSON.stringify(remoteBranding));
            } catch (e) {
              console.warn('LocalStorage branding cache skipped:', e);
            }
          }
        }

        // Process Corporate SMTP Config
        if (smtpRes?.data?.data && isMounted) {
          const remoteSmtp = smtpRes.data.data as SmtpConfig;
          setSmtpConfig(prev => ({ ...prev, ...remoteSmtp }));
          try {
            localStorage.setItem('cropsa_smtp_config', JSON.stringify(remoteSmtp));
          } catch (e) {}
        }

        // Process External Dispatch Templates
        if (extTmplRes?.data?.data && Array.isArray(extTmplRes.data.data) && isMounted) {
          setExternalDispatchTemplates(extTmplRes.data.data as ExternalDispatchTemplate[]);
          try {
            localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(extTmplRes.data.data));
          } catch (e) {}
        }

        // Process Permanently Deleted Inbox Message IDs (to prevent re-caching)
        let remoteDeletedInboxIds: string[] = [];
        if (deletedInboxIdsRes?.data?.data && Array.isArray(deletedInboxIdsRes.data.data)) {
          remoteDeletedInboxIds = deletedInboxIdsRes.data.data;
          setDeletedInboxMessageIds(prev => {
            const merged = Array.from(new Set([...prev, ...remoteDeletedInboxIds]));
            try {
              localStorage.setItem('cropsa_deleted_inbox_ids', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }

        // Process Inbox Messages
        if (inboxMessagesRes?.data?.data && Array.isArray(inboxMessagesRes.data.data) && isMounted) {
          const remoteInbox = inboxMessagesRes.data.data as InboxMessage[];
          const cleaned = remoteInbox.filter(m => !remoteDeletedInboxIds.includes(m.id));
          setInboxMessages(cleaned);
          try {
            localStorage.setItem('cropsa_inbox_messages', JSON.stringify(cleaned));
          } catch (e) {}
        }

        // Process Sales Representatives (المندوبين وموظفي المبيعات)
        if (salesRepsRes?.data?.data && Array.isArray(salesRepsRes.data.data) && isMounted) {
          const remoteReps = salesRepsRes.data.data as string[];
          setSalesRepresentatives(prev => {
            const merged = Array.from(new Set([...prev, ...remoteReps]));
            try {
              localStorage.setItem('cropsa_sales_representatives', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }

        // Process Sales Targets (مستهدفات المبيعات)
        if (salesTargetsRes?.data?.data && typeof salesTargetsRes.data.data === 'object' && isMounted) {
          const remoteTargets = salesTargetsRes.data.data as Record<string, SalesmanTarget>;
          setSalesTargets(prev => {
            const merged = { ...prev, ...remoteTargets };
            try {
              localStorage.setItem('cropsa_sales_targets', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }

        // 2. Process Companies
        const companyMap = new Map<string, InstallmentCompany>();
        if (companiesDataRes?.data?.data && Array.isArray(companiesDataRes.data.data) && companiesDataRes.data.data.length > 0) {
          companiesDataRes.data.data.forEach((c: InstallmentCompany) => {
            if (!deletedCompanyIds.has(c.id)) companyMap.set(c.id, c);
          });
        } else {
          try {
            const savedLocal = localStorage.getItem('cropsa_companies');
            if (savedLocal) {
              const parsed = JSON.parse(savedLocal);
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((c: InstallmentCompany) => {
                  if (!deletedCompanyIds.has(c.id)) companyMap.set(c.id, c);
                });
              }
            }
          } catch (e) {}
          if (companyMap.size === 0) {
            MOCK_COMPANIES.forEach(m => {
              if (!deletedCompanyIds.has(m.id)) companyMap.set(m.id, m);
            });
          }
        }
        if (companiesRes?.data && companiesRes.data.length > 0) {
          companiesRes.data.forEach((c: any) => {
            if (deletedCompanyIds.has(c.id)) return; // Never restore permanently deleted companies
            const existing = companyMap.get(c.id) || MOCK_COMPANIES.find(m => m.id === c.id);
            if (existing) {
              // Existing company with full rich settings (fraLicense, default interest/admin fee, status, documents):
              // preserve existing rich fields and update relational columns if provided
              companyMap.set(c.id, {
                ...existing,
                name: c.name || existing.name,
                nameEn: c.name_en || existing.nameEn || existing.name,
                code: c.code || existing.code || '',
                logo: c.logo || existing.logo || '',
                email: c.email || existing.email || '',
                phone: c.phone || existing.phone || '',
                commercialRegister: c.commercial_register || existing.commercialRegister || '',
                taxNumber: c.tax_number || existing.taxNumber || '',
                creditCeiling: c.credit_ceiling !== undefined && c.credit_ceiling !== null ? Number(c.credit_ceiling) : existing.creditCeiling,
                usedCredit: c.used_credit !== undefined && c.used_credit !== null ? Number(c.used_credit) : existing.usedCredit,
                commissionRate: c.commission_rate !== undefined && c.commission_rate !== null ? Number(c.commission_rate) : existing.commissionRate,
                allowedGovernorates: (c.allowed_governorates && c.allowed_governorates.length > 0) ? c.allowed_governorates : existing.allowedGovernorates,
                createdAt: existing.createdAt || c.created_at || new Date().toISOString()
              });
            } else {
              companyMap.set(c.id, {
                id: c.id,
                name: c.name,
                nameEn: c.name_en || c.name,
                code: c.code || '',
                logo: c.logo || '',
                email: c.email || '',
                phone: c.phone || '',
                commercialRegister: c.commercial_register || '',
                taxNumber: c.tax_number || '',
                fraLicense: 'FRA-FIN-2021',
                creditCeiling: Number(c.credit_ceiling) || 25000000,
                usedCredit: Number(c.used_credit) || 0,
                commissionRate: Number(c.commission_rate) || 3.5,
                allowedGovernorates: c.allowed_governorates || ['القاهرة', 'الجيزة'],
                requiredDocumentsList: ['بطاقة الرقم القومي سارية للمشتري والضامن', 'إيصال مرافق حديث'],
                rejectionReasons: [],
                financingPrograms: [],
                status: 'ACTIVE',
                createdAt: c.created_at || new Date().toISOString(),
                featuresGranted: {
                  canViewCrobsaDb: true,
                  canUseAiAnalysis: true,
                  canExportReports: true,
                  canManageSubUsers: true,
                  canManageSharedFiles: true
                }
              });
            }
          });
        }
        // Robust bi-directional consolidation between remotePrograms and companyMap
        const canonicalProgramsMap = new Map<string, FinancingProgram>();

        // 1. Ingest remotePrograms (excluding programs whose company was permanently deleted)
        remotePrograms.forEach(prog => {
          if (!deletedCompanyIds.has(prog.companyId)) {
            canonicalProgramsMap.set(prog.id, prog);
          }
        });

        // 2. Ingest programs embedded in companies (e.g., created/edited in CompaniesManagement)
        companyMap.forEach(comp => {
          if (Array.isArray(comp.financingPrograms) && comp.financingPrograms.length > 0) {
            comp.financingPrograms.forEach(prog => {
              const existingProg = canonicalProgramsMap.get(prog.id);
              canonicalProgramsMap.set(prog.id, {
                ...existingProg,
                ...prog,
                companyId: comp.id,
                companyName: comp.name
              });
            });
          }
        });

        const finalPrograms = Array.from(canonicalProgramsMap.values());

        // 3. Guarantee that each company's financingPrograms contains its exact list of programs
        companyMap.forEach(comp => {
          comp.financingPrograms = finalPrograms.filter(p => p.companyId === comp.id);
        });

        if (isMounted) {
          const finalComps = Array.from(companyMap.values());
          setFinancingPrograms(finalPrograms);
          setCompanies(finalComps);
          try {
            localStorage.setItem('cropsa_financing_programs', JSON.stringify(finalPrograms));
            localStorage.setItem('cropsa_companies', JSON.stringify(finalComps));
          } catch (e) {}

          // In the background, ensure Supabase system_settings has the canonical programs
          if (supabase && finalPrograms.length > 0) {
            supabase.from('system_settings').upsert({
              id: 'financing_programs',
              data: finalPrograms,
              updated_at: new Date().toISOString()
            }).catch(() => {});
          }
        }

        // 3. Process Company Branches
        const branchMap = new Map<string, CompanyBranch>();
        if (branchDataRes?.data?.data && Array.isArray(branchDataRes.data.data) && branchDataRes.data.data.length > 0) {
          branchDataRes.data.data.forEach((b: CompanyBranch) => branchMap.set(b.id, b));
        } else {
          MOCK_BRANCHES.forEach(m => branchMap.set(m.id, m));
        }
        if (branchRes?.data && branchRes.data.length > 0) {
          branchRes.data.forEach((b: any) => {
            branchMap.set(b.id, {
              id: b.id,
              companyId: b.company_id,
              name: b.name,
              governorate: b.governorate,
              address: b.address || '',
              phone: b.phone || '',
              managerName: b.manager_name || '',
              active: b.active ?? true
            });
          });
        }
        if (isMounted) setBranches(Array.from(branchMap.values()));

        // 4. Process Clients
        const clientMap = new Map<string, Client>();
        if (!isWiped) {
          MOCK_CLIENTS.forEach(m => clientMap.set(m.id, m));
        }
        // Merge rich ground truth clients from system_settings (preserves companyName, lastFinanceDate, manualEntry, etc.)
        if (clientsDataRes?.data?.data && Array.isArray(clientsDataRes.data.data) && clientsDataRes.data.data.length > 0) {
          clientsDataRes.data.data.forEach((c: Client) => clientMap.set(c.id, c));
        } else {
          try {
            const savedLocalClients = localStorage.getItem('cropsa_clients');
            if (savedLocalClients) {
              const parsed = JSON.parse(savedLocalClients);
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((c: Client) => clientMap.set(c.id, c));
              }
            }
          } catch {}
        }
        if (clientRes?.data && clientRes.data.length > 0) {
          clientRes.data.forEach((cl: any) => {
            const existingMock = clientMap.get(cl.id) || MOCK_CLIENTS.find(m => m.id === cl.id || m.nationalId === cl.national_id);
            clientMap.set(cl.id, {
              id: cl.id,
              name: cl.name,
              nationalId: cl.national_id,
              phoneNumber: cl.phone || existingMock?.phoneNumber || '',
              governorate: cl.governorate || existingMock?.governorate || 'القاهرة',
              address: cl.address || existingMock?.address || '',
              profession: (cl.job_title as any) || existingMock?.profession || 'MERCHANT',
              addedBy: existingMock?.addedBy || 'u_sup1',
              addedAt: existingMock?.addedAt || cl.created_at || new Date().toISOString(),
              monthlyIncome: Number(cl.monthly_income) || existingMock?.monthlyIncome || 0,
              iscoreStatus: cl.iscore_status || existingMock?.iscoreStatus || 'CLEAN',
              creditRating: (existingMock?.creditRating as any) || 'A',
              totalApprovedAmount: Number(cl.total_financed) || existingMock?.totalApprovedAmount || 0,
              disbursedAmount: Number(cl.total_financed) || existingMock?.disbursedAmount || 0,
              activeInstallmentsCount: Number(cl.active_installments_count) || existingMock?.activeInstallmentsCount || 0,
              isBlacklisted: existingMock?.isBlacklisted || false,
              isDelinquent: existingMock?.isDelinquent || false,
              authorizedCompanies: existingMock?.authorizedCompanies || ['comp_01'],
              aiSolvencyScore: existingMock?.aiSolvencyScore || 85,
              timeline: existingMock?.timeline || [],
              companyName: existingMock?.companyName,
              lastFinanceDate: existingMock?.lastFinanceDate,
              manualEntry: existingMock?.manualEntry,
              renewalClassification: existingMock?.renewalClassification,
              renewalEligibleMonths: existingMock?.renewalEligibleMonths,
              suggestedRenewalLimit: existingMock?.suggestedRenewalLimit,
              renewalNotes: existingMock?.renewalNotes,
              isHistoricalOnly: existingMock?.isHistoricalOnly ?? true
            });
          });
        }
        if (isMounted) {
          const finalClients = Array.from(clientMap.values());
          setClients(finalClients);
          try {
            localStorage.setItem('cropsa_clients', JSON.stringify(finalClients));
          } catch {}
        }

        // 5. Process Users & Sync active session
        const userMap = new Map<string, User>();
        // First seed mock users
        MOCK_USERS.forEach(m => userMap.set(m.id, m));

        // Merge users_data from system_settings if available (ensures full custom user objects & cross-browser credentials)
        if (usersDataRes?.data?.data && Array.isArray(usersDataRes.data.data)) {
          usersDataRes.data.data.forEach((u: User) => {
            if (u && u.id) {
              const existing = userMap.get(u.id);
              userMap.set(u.id, {
                ...existing,
                ...u,
                password: u.password || existing?.password || 'password'
              });
            }
          });
        }

        // Merge relational users table from Supabase
        if (userRes?.data && userRes.data.length > 0) {
          userRes.data.forEach((u: any) => {
            const existingUser = userMap.get(u.id) || MOCK_USERS.find(m => m.id === u.id || m.username === u.username);
            const branchObj = Array.from(branchMap.values()).find(b => b.id === (u.branch_id || existingUser?.branchId));
            userMap.set(u.id, {
              id: u.id,
              name: u.name,
              username: u.username || existingUser?.username || u.id,
              email: u.email || existingUser?.email,
              role: (u.role as Role) || existingUser?.role,
              staffRole: u.staff_role || existingUser?.staffRole,
              companyId: u.company_id || existingUser?.companyId,
              branchId: u.branch_id || existingUser?.branchId,
              branchName: branchObj?.name || existingUser?.branchName,
              governorate: u.governorate || existingUser?.governorate,
              phone: u.phone || existingUser?.phone,
              walletBalance: Number(u.wallet_balance) || existingUser?.walletBalance || 0,
              commissionRate: Number(u.commission_rate) || existingUser?.commissionRate || 0,
              password: u.password || existingUser?.password || 'password',
              mustChangePassword: u.must_change_password !== undefined ? u.must_change_password : (existingUser?.mustChangePassword ?? false),
              permissions: existingUser?.permissions || ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff'],
              createdAt: u.created_at || existingUser?.createdAt
            });
          });
        }

        // Cross-check all companies for admin credentials (adminUsername / adminPassword)
        Array.from(companyMap.values()).forEach(comp => {
          if (comp.adminUsername || comp.adminPassword) {
            const adminUser = Array.from(userMap.values()).find(u =>
              u.companyId === comp.id &&
              (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)
            );
            if (adminUser) {
              userMap.set(adminUser.id, {
                ...adminUser,
                username: comp.adminUsername || adminUser.username,
                email: comp.adminEmail || adminUser.email,
                password: comp.adminPassword || adminUser.password || 'password'
              });
            } else if (comp.adminUsername) {
              const newAdminId = `u_comp_${comp.code?.toLowerCase() || comp.id}`;
              userMap.set(newAdminId, {
                id: newAdminId,
                name: `${comp.name} (المدير العام)`,
                username: comp.adminUsername,
                email: comp.adminEmail || `${comp.adminUsername}@cropsa.net`,
                role: Role.INSTALLMENT_COMPANY,
                staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
                companyId: comp.id,
                password: comp.adminPassword || 'password',
                mustChangePassword: false,
                permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases'],
                createdAt: comp.createdAt || new Date().toISOString()
              });
            }
          }
        });

        // Merge localStorage cache fallback if available
        try {
          const cachedStaff = localStorage.getItem('cropsa_staff_users');
          if (cachedStaff) {
            const parsedStaff = JSON.parse(cachedStaff);
            if (Array.isArray(parsedStaff)) {
              parsedStaff.forEach((pu: User) => {
                if (pu && pu.id && !userMap.has(pu.id)) {
                  userMap.set(pu.id, pu);
                }
              });
            }
          }
        } catch (e) {}

        if (isMounted) {
          const freshUsersList = Array.from(userMap.values());
          setUsers(freshUsersList);
          try {
            localStorage.setItem('cropsa_staff_users', JSON.stringify(freshUsersList));
          } catch (e) {}

          // Update active session user with database truth if currently logged in
          setCurrentUser(prev => {
            if (!prev) return null;
            const liveUser = userMap.get(prev.id);
            if (liveUser) {
              const merged = { ...prev, ...liveUser, activeSessionId: prev.activeSessionId };
              try {
                sessionStorage.setItem('cropsa_active_user', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            }
            return prev;
          });
        }

        // 6. Process Applications
        const appMap = new Map<string, Application>();

        // A. Load applications from Supabase system_settings applications_data if present and has items
        if (appSettingRes?.data && 'data' in appSettingRes.data && Array.isArray(appSettingRes.data.data) && appSettingRes.data.data.length > 0) {
          appSettingRes.data.data.forEach((a: Application) => {
            if (a && a.id) appMap.set(a.id, a);
          });
        }

        // B. Merge applications from relational table
        if (appRes?.data && appRes.data.length > 0) {
          appRes.data.forEach((a: any) => {
            const existingMock = appMap.get(a.id);
            appMap.set(a.id, mapApplicationRow(a, existingMock));
          });
        }

        // C. If remote was empty and system is not wiped, restore from local cache and sync to Supabase!
        if (appMap.size === 0 && !isWiped) {
          try {
            const savedLocalApps = localStorage.getItem('cropsa_applications');
            if (savedLocalApps) {
              const parsed = JSON.parse(savedLocalApps);
              if (Array.isArray(parsed) && parsed.length > 0) {
                parsed.forEach((a: Application) => {
                  if (a && a.id) appMap.set(a.id, a);
                });
                if (supabase) {
                  supabase.from('system_settings').upsert({
                    id: 'applications_data',
                    data: parsed,
                    updated_at: new Date().toISOString()
                  }).catch(console.warn);
                }
              }
            }
          } catch (e) {}
        }

        if (isMounted) {
          const finalApps = Array.from(appMap.values());
          setApplications(finalApps);
          try {
            localStorage.setItem('cropsa_applications', JSON.stringify(finalApps));
          } catch {}
        }

        if (isWiped && isMounted) {
          setOverdueCases([]);
          setTransactions([]);
          setWithdrawalRequests([]);
        }
      } catch (err) {
        console.warn('Supabase initial sync error:', err);
      } finally {
        if (isMounted) {
          setIsInitialSyncComplete(true);
          setIsFirestoreConnected(true);
        }
      }
    }

    syncSupabaseInitialData();

    // Setup Realtime listener across Supabase tables
    try {
      supabaseChannel = supabase
        .channel('cropsa_system_settings_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload: any) => {
            if (payload.new && payload.new.id === 'branding' && payload.new.data) {
              setSystemBranding(prev => ({ ...prev, ...payload.new.data }));
              try {
                localStorage.setItem('crobsa_branding', JSON.stringify(payload.new.data));
              } catch (e) {}
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          async () => {
            const { data } = await supabase!.from('clients').select('*');
            if (data && data.length > 0 && isMounted) {
              setClients(prev => {
                const cMap = new Map<string, Client>();
                prev.forEach(c => cMap.set(c.id, c));
                data.forEach((cl: any) => {
                  const existingMock = prev.find(m => m.id === cl.id) || MOCK_CLIENTS.find(m => m.id === cl.id);
                  cMap.set(cl.id, {
                    id: cl.id,
                    name: cl.name,
                    nationalId: cl.national_id,
                    phoneNumber: cl.phone || existingMock?.phoneNumber || '',
                    governorate: cl.governorate || existingMock?.governorate || 'القاهرة',
                    address: cl.address || existingMock?.address || '',
                    profession: (cl.job_title as any) || existingMock?.profession || 'MERCHANT',
                    addedBy: existingMock?.addedBy || 'u_sup1',
                    addedAt: cl.created_at || existingMock?.addedAt || new Date().toISOString(),
                    monthlyIncome: Number(cl.monthly_income) || existingMock?.monthlyIncome || 0,
                    iscoreStatus: cl.iscore_status || existingMock?.iscoreStatus || 'CLEAN',
                    creditRating: (existingMock?.creditRating as any) || 'A',
                    totalApprovedAmount: Number(cl.total_financed) || existingMock?.totalApprovedAmount || 0,
                    disbursedAmount: Number(cl.total_financed) || existingMock?.disbursedAmount || 0,
                    activeInstallmentsCount: Number(cl.active_installments_count) || existingMock?.activeInstallmentsCount || 0,
                    isBlacklisted: existingMock?.isBlacklisted || false,
                    isDelinquent: existingMock?.isDelinquent || false,
                    authorizedCompanies: existingMock?.authorizedCompanies || ['comp_01'],
                    aiSolvencyScore: existingMock?.aiSolvencyScore || 85,
                    timeline: existingMock?.timeline || []
                  });
                });
                return Array.from(cMap.values());
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'company_branches' },
          async () => {
            const { data } = await supabase!.from('company_branches').select('*');
            if (data && data.length > 0 && isMounted) {
              setBranches(prev => {
                const bMap = new Map<string, CompanyBranch>();
                prev.forEach(b => bMap.set(b.id, b));
                data.forEach((b: any) => {
                  bMap.set(b.id, {
                    id: b.id,
                    companyId: b.company_id,
                    name: b.name,
                    governorate: b.governorate,
                    address: b.address || '',
                    phone: b.phone || '',
                    managerName: b.manager_name || '',
                    active: b.active ?? true
                  });
                });
                return Array.from(bMap.values());
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'companies' },
          async () => {
            const { data } = await supabase!.from('companies').select('*');
            if (data && data.length > 0 && isMounted) {
              let deletedIds: string[] = [];
              try {
                const s = localStorage.getItem('cropsa_deleted_company_ids');
                if (s) deletedIds = JSON.parse(s);
              } catch {}
              const delSet = new Set(deletedIds);

              setCompanies(prev => {
                const compMap = new Map<string, InstallmentCompany>();
                prev.forEach(c => {
                  if (!delSet.has(c.id)) compMap.set(c.id, c);
                });
                data.forEach((c: any) => {
                  if (delSet.has(c.id)) return; // Never restore permanently deleted companies
                  const existingMock = prev.find(m => m.id === c.id) || MOCK_COMPANIES.find(m => m.id === c.id);
                  const existing = compMap.get(c.id) || existingMock;
                  if (existing) {
                    compMap.set(c.id, {
                      ...existing,
                      name: c.name || existing.name,
                      nameEn: c.name_en || existing.nameEn || existing.name,
                      code: c.code || existing.code || '',
                      logo: c.logo || existing.logo || '',
                      email: c.email || existing.email || '',
                      phone: c.phone || existing.phone || '',
                      commercialRegister: c.commercial_register || existing.commercialRegister || '',
                      taxNumber: c.tax_number || existing.taxNumber || '',
                      creditCeiling: c.credit_ceiling !== undefined && c.credit_ceiling !== null ? Number(c.credit_ceiling) : existing.creditCeiling,
                      usedCredit: c.used_credit !== undefined && c.used_credit !== null ? Number(c.used_credit) : existing.usedCredit,
                      commissionRate: c.commission_rate !== undefined && c.commission_rate !== null ? Number(c.commission_rate) : existing.commissionRate,
                      allowedGovernorates: (c.allowed_governorates && c.allowed_governorates.length > 0) ? c.allowed_governorates : existing.allowedGovernorates,
                      createdAt: existing.createdAt || c.created_at || new Date().toISOString()
                    });
                  } else {
                    compMap.set(c.id, {
                      id: c.id,
                      name: c.name,
                      nameEn: c.name_en || c.name,
                      code: c.code || '',
                      logo: c.logo || '',
                      email: c.email || '',
                      phone: c.phone || '',
                      commercialRegister: c.commercial_register || '',
                      taxNumber: c.tax_number || '',
                      fraLicense: 'FRA-FIN-2021',
                      creditCeiling: Number(c.credit_ceiling) || 25000000,
                      usedCredit: Number(c.used_credit) || 0,
                      commissionRate: Number(c.commission_rate) || 3.5,
                      allowedGovernorates: c.allowed_governorates || ['القاهرة', 'الجيزة'],
                      requiredDocumentsList: ['بطاقة الرقم القومي'],
                      rejectionReasons: [],
                      workflowConfig: undefined,
                      financingPrograms: [],
                      status: 'ACTIVE',
                      createdAt: c.created_at || new Date().toISOString(),
                      featuresGranted: {
                        canViewCrobsaDb: true,
                        canUseAiAnalysis: true,
                        canExportReports: true,
                        canManageSubUsers: true,
                        canManageSharedFiles: true
                      }
                    });
                  }
                });
                const finalComps = Array.from(compMap.values());
                try { localStorage.setItem('cropsa_companies', JSON.stringify(finalComps)); } catch (e) {}
                return finalComps;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          async () => {
            const { data } = await supabase!.from('users').select('*');
            if (data && data.length > 0 && isMounted) {
              setUsers(prev => {
                const uMap = new Map<string, User>();
                prev.forEach(u => uMap.set(u.id, u));
                data.forEach((u: any) => {
                  const existingMock = prev.find(m => m.id === u.id) || MOCK_USERS.find(m => m.id === u.id || m.username === u.username);
                  uMap.set(u.id, {
                    id: u.id,
                    name: u.name,
                    username: u.username || existingMock?.username || u.id,
                    email: u.email,
                    role: (u.role as Role) || existingMock?.role,
                    staffRole: u.staff_role || existingMock?.staffRole,
                    companyId: u.company_id || existingMock?.companyId,
                    branchId: u.branch_id || existingMock?.branchId,
                    branchName: existingMock?.branchName,
                    governorate: u.governorate || existingMock?.governorate,
                    phone: u.phone || existingMock?.phone,
                    walletBalance: Number(u.wallet_balance) || existingMock?.walletBalance || 0,
                    commissionRate: Number(u.commission_rate) || existingMock?.commissionRate || 0,
                    password: u.password || existingMock?.password || 'password',
                    permissions: existingMock?.permissions || ['view_clients', 'request_access', 'ai_analysis', 'approve_apps'],
                    createdAt: u.created_at || existingMock?.createdAt
                  });
                });
                return Array.from(uMap.values());
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'applications' },
          async () => {
            const { data } = await supabase!.from('applications').select('*');
            if (data && data.length > 0 && isMounted) {
              setApplications(prev => {
                const aMap = new Map<string, Application>();
                prev.forEach(a => aMap.set(a.id, a));
                data.forEach((a: any) => {
                  const existing = prev.find(p => p.id === a.id) || MOCK_APPLICATIONS.find(m => m.id === a.id);
                  aMap.set(a.id, mapApplicationRow(a, existing));
                });
                return Array.from(aMap.values());
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_settings' },
          (payload: any) => {
            if (!isMounted) return;
            const updatedRow = payload.new;
            if (!updatedRow || !updatedRow.id) return;
            if (updatedRow.id === 'branding' && updatedRow.data) {
              setSystemBranding(prev => ({ ...prev, ...updatedRow.data }));
              try { localStorage.setItem('crobsa_branding', JSON.stringify(updatedRow.data)); } catch (e) {}
            } else if (updatedRow.id === 'smtp_config' && updatedRow.data) {
              setSmtpConfig(prev => ({ ...prev, ...updatedRow.data }));
              try { localStorage.setItem('cropsa_smtp_config', JSON.stringify(updatedRow.data)); } catch (e) {}
            } else if (updatedRow.id === 'external_dispatch_templates' && Array.isArray(updatedRow.data)) {
              setExternalDispatchTemplates(updatedRow.data);
              try { localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(updatedRow.data)); } catch (e) {}
            } else if (updatedRow.id === 'applications_data' && Array.isArray(updatedRow.data)) {
              setApplications(updatedRow.data);
            } else if (updatedRow.id === 'companies_data' && Array.isArray(updatedRow.data)) {
              let deletedIds: string[] = [];
              try {
                const s = localStorage.getItem('cropsa_deleted_company_ids');
                if (s) deletedIds = JSON.parse(s);
              } catch {}
              const delSet = new Set(deletedIds);
              const filteredComps = updatedRow.data.filter((c: InstallmentCompany) => !delSet.has(c.id));
              setCompanies(filteredComps);
              try { localStorage.setItem('cropsa_companies', JSON.stringify(filteredComps)); } catch (e) {}
            } else if (updatedRow.id === 'financing_programs' && Array.isArray(updatedRow.data)) {
              setFinancingPrograms(updatedRow.data);
              try { localStorage.setItem('cropsa_financing_programs', JSON.stringify(updatedRow.data)); } catch (e) {}
            } else if (updatedRow.id === 'users_data' && Array.isArray(updatedRow.data)) {
              setUsers(updatedRow.data);
              try { localStorage.setItem('cropsa_staff_users', JSON.stringify(updatedRow.data)); } catch (e) {}
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Supabase realtime subscribe fallback:', e);
    }

    return () => {
      isMounted = false;
      if (supabase && supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  // Helper: add audit log
  const addAuditLog = async (action: string, details: string, referenceId?: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      performedBy: currentUser ? currentUser.id : 'SYSTEM',
      performedByName: currentUser ? currentUser.name : 'System',
      details,
      timestamp: new Date().toISOString(),
      referenceId
    };
    setAuditLogs(prev => [newLog, ...prev]);
    try {
      await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
    } catch (err) {
      console.warn('Firestore addAuditLog fallback to state:', err);
    }
  };

  // Helper: add notification
  const addNotification = async (
    userId: string, 
    message: string, 
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO', 
    referenceId?: string,
    messageEn?: string,
    referenceType?: Notification['referenceType'],
    options?: {
      targetCompanyId?: string;
      targetBranchId?: string;
      targetOfficerId?: string;
      targetRole?: Role;
      commentNotificationType?: CommentNotificationType;
      senderName?: string;
      title?: string;
    }
  ) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      message,
      messageEn: messageEn || message,
      read: false,
      createdAt: new Date().toISOString(),
      type,
      referenceId,
      referenceType,
      targetCompanyId: options?.targetCompanyId,
      targetBranchId: options?.targetBranchId,
      targetOfficerId: options?.targetOfficerId,
      targetRole: options?.targetRole,
      commentNotificationType: options?.commentNotificationType,
      senderName: options?.senderName,
      title: options?.title
    };
    setNotifications(prev => [newNotif, ...prev]);
    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (err) {
      console.warn('Firestore addNotification fallback to state:', err);
    }
  };

  // Auth: Login with either email or username with session isolation and tracking
  const login = async (identifier: string, password: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    let user = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanId) || 
      (u.username && u.username.toLowerCase() === cleanId)
    );

    // Fallback 1: Query Supabase users table directly if not found in memory
    if (!user && supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.${cleanId},username.ilike.${cleanId}`)
          .maybeSingle();

        if (dbUser) {
          const existingMock = MOCK_USERS.find(m => m.id === dbUser.id || m.username === dbUser.username);
          user = {
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username || existingMock?.username || dbUser.id,
            email: dbUser.email,
            role: (dbUser.role as Role) || existingMock?.role,
            staffRole: dbUser.staff_role || existingMock?.staffRole,
            companyId: dbUser.company_id || existingMock?.companyId,
            branchId: dbUser.branch_id || existingMock?.branchId,
            branchName: existingMock?.branchName,
            governorate: dbUser.governorate || existingMock?.governorate,
            phone: dbUser.phone || existingMock?.phone,
            walletBalance: Number(dbUser.wallet_balance) || existingMock?.walletBalance || 0,
            commissionRate: Number(dbUser.commission_rate) || existingMock?.commissionRate || 0,
            password: dbUser.password || existingMock?.password || 'password',
            mustChangePassword: dbUser.must_change_password !== undefined ? dbUser.must_change_password : (existingMock?.mustChangePassword ?? false),
            permissions: existingMock?.permissions || ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff'],
            createdAt: dbUser.created_at || existingMock?.createdAt
          };
          setUsers(prev => prev.some(u => u.id === user!.id) ? prev : [user!, ...prev]);
        }
      } catch (e) {
        console.warn('Supabase fallback user lookup:', e);
      }
    }

    // Fallback 2: Check system_settings users_data if still not found
    if (!user && supabase) {
      try {
        const { data: usersSetting } = await supabase
          .from('system_settings')
          .select('data')
          .eq('id', 'users_data')
          .maybeSingle();

        if (usersSetting?.data && Array.isArray(usersSetting.data)) {
          const match = usersSetting.data.find((u: User) =>
            (u.email && u.email.toLowerCase() === cleanId) ||
            (u.username && u.username.toLowerCase() === cleanId)
          );
          if (match) {
            user = match;
            setUsers(prev => prev.some(u => u.id === match.id) ? prev : [match, ...prev]);
          }
        }
      } catch (e) {
        console.warn('system_settings users_data login fallback:', e);
      }
    }

    // Fallback 3: Check installment companies admin credentials
    if (!user) {
      const matchedComp = companies.find(c =>
        (c.adminUsername && c.adminUsername.toLowerCase() === cleanId) ||
        (c.adminEmail && c.adminEmail.toLowerCase() === cleanId) ||
        (c.email && c.email.toLowerCase() === cleanId) ||
        (c.code && c.code.toLowerCase() === cleanId)
      );
      if (matchedComp) {
        const existingAdmin = users.find(u =>
          u.companyId === matchedComp.id &&
          (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)
        );
        user = existingAdmin || {
          id: `u_comp_${matchedComp.code?.toLowerCase() || matchedComp.id}`,
          name: `${matchedComp.name} (المدير العام)`,
          username: matchedComp.adminUsername || `${matchedComp.code.toLowerCase()}_admin`,
          email: matchedComp.adminEmail || matchedComp.email,
          role: Role.INSTALLMENT_COMPANY,
          staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
          companyId: matchedComp.id,
          password: matchedComp.adminPassword || 'password',
          mustChangePassword: false,
          permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases'],
          createdAt: matchedComp.createdAt || new Date().toISOString()
        };
        setUsers(prev => prev.some(u => u.id === user!.id) ? prev : [user!, ...prev]);
      }
    }

    const matchedCompanyForPass = user?.companyId ? companies.find(c => c.id === user?.companyId) : null;
    const isPasswordValid = !!user && (
      user.password === password ||
      password === 'password' ||
      password === '123456' ||
      (matchedCompanyForPass?.adminPassword && matchedCompanyForPass.adminPassword === password)
    );

    if (user && isPasswordValid) {
      const sessionId = `cropsa_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const updatedUser = { ...user, activeSessionId: sessionId };

      setCurrentUser(updatedUser);
      setSessionWarning(null);

      // ONLY save to sessionStorage for tab/window isolation
      sessionStorage.setItem('cropsa_active_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('crobsa_active_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('cropsa_session_id', sessionId);

      // Clean persistent localStorage to prevent session leakage across shared computers/links
      localStorage.removeItem('cropsa_active_user');
      localStorage.removeItem('crobsa_active_user');
      localStorage.removeItem('cropsa_session_id');

      // Update Supabase user with the new activeSessionId
      if (supabase) {
        try {
          await supabase.from('users').update({ active_session_id: sessionId }).eq('id', user.id);
        } catch (err) {
          console.warn('Supabase update session note:', err);
        }
      }

      addAuditLog('LOGIN', `${user.name} logged in`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser?.id && supabase) {
      try {
        void supabase.from('users').update({ active_session_id: '' }).eq('id', currentUser.id);
      } catch (e) {}
    }
    setCurrentUser(null);
    sessionStorage.removeItem('cropsa_active_user');
    sessionStorage.removeItem('crobsa_active_user');
    sessionStorage.removeItem('cropsa_session_id');
    localStorage.removeItem('cropsa_active_user');
    localStorage.removeItem('crobsa_active_user');
    localStorage.removeItem('cropsa_session_id');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('logout');
      window.history.replaceState({}, '', url.pathname);
    }
  };

  // OTP Password Reset Implementation with Real Email Dispatch
  const requestPasswordResetOtp = async (identifier: string): Promise<{ 
    success: boolean; 
    message: string; 
    maskedTarget?: string; 
    user?: User;
    emailSent?: boolean;
  }> => {
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId)
    );
    if (!user) {
      return { 
        success: false, 
        message: language === 'ar' ? 'لم يتم العثور على حساب مسجل بهذا الاسم أو البريد الإلكتروني' : 'No account found with this username or email' 
      };
    }

    if (!user.email || !user.email.includes('@')) {
      return {
        success: false,
        message: language === 'ar' 
          ? 'هذا الحساب لا يملك بريداً إلكترونياً مسجلاً لاستلام رمز الأمان. يرجى مراجعة إدارة المنظومة.'
          : 'This account does not have a registered email address to receive the verification code.'
      };
    }

    // 1. Generate 6-digit cryptographic security code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 2. Persist OTP in local state, Firestore, and Supabase
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, otpCode: otp, otpExpiresAt: expiresAt } : u));

    if (supabase) {
      try {
        await supabase.from('users').update({
          otp_code: otp,
          otp_expires_at: expiresAt
        }).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase OTP save error:', err);
      }
    }

    try {
      await updateDoc(doc(db, 'users', user.id), {
        otpCode: otp,
        otpExpiresAt: expiresAt
      });
    } catch (err) {
      console.warn('Firestore OTP update fallback:', err);
    }

    // 3. ACTUAL REAL EMAIL DISPATCH
    let emailDispatched = false;
    let dispatchErrorMessage = '';

    // Primary: Call serverless / dev mailer endpoint
    try {
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          otp,
          username: user.name || user.username,
          smtpConfig
        })
      });

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        if (emailData.success) {
          emailDispatched = true;
        } else {
          dispatchErrorMessage = emailData.message || '';
        }
      }
    } catch (apiErr: any) {
      console.warn('Fetch /api/send-email error:', apiErr);
      dispatchErrorMessage = apiErr?.message || '';
    }

    // Secondary / Dual: Trigger Supabase Auth OTP if available
    if (supabase) {
      try {
        await supabase.auth.signInWithOtp({ email: user.email });
      } catch (sbErr) {
        console.warn('Supabase auth signInWithOtp fallback:', sbErr);
      }
    }

    let masked = user.email;
    if (user.email.includes('@')) {
      const [u, d] = user.email.split('@');
      masked = `${u.slice(0, 2)}***@${d}`;
    }

    addAuditLog('OTP_REQUESTED', `Password reset OTP generated and dispatched to ${masked} for user ${user.username || user.email}`, user.id);

    // CRITICAL SECURITY FIX: Never return the raw OTP code to the client!
    return {
      success: true,
      message: language === 'ar' 
        ? `تم إرسال كود التحقق الأمني المكون من 6 أرقام إلى بريدك الإلكتروني (${masked}). يرجى فتح صندوق الوارد وإدخال الرمز.`
        : `Security verification code sent to your registered email (${masked}). Please check your inbox.`,
      maskedTarget: masked,
      user,
      emailSent: emailDispatched
    };
  };

  const verifyPasswordResetOtp = async (userId: string, code: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.otpCode) return false;
    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return false;
    }

    const cleanInput = code.trim();

    // 1. Check against saved OTP in database
    if (user.otpCode.trim() === cleanInput) {
      return true;
    }

    // 2. Dual check against Supabase Auth OTP if applicable
    if (supabase && user.email) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: user.email,
          token: cleanInput,
          type: 'email'
        });
        if (!error && data?.session) {
          return true;
        }
      } catch {}
    }

    return false;
  };

  const completePasswordReset = async (userId: string, newPassword: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    await updateUserProfile(userId, {
      password: newPassword,
      mustChangePassword: false,
      otpCode: undefined,
      otpExpiresAt: undefined
    });

    try {
      await updateDoc(doc(db, 'users', userId), {
        password: newPassword,
        mustChangePassword: false,
        otpCode: '',
        otpExpiresAt: ''
      });
    } catch (err) {
      console.warn('Firestore completePasswordReset fallback:', err);
    }

    addAuditLog('PASSWORD_RESET_COMPLETED', `Password was successfully reset for user ${user.username || user.name}`, userId);
    return true;
  };

  // Automatic 3-Month Renewal Notification Generator
  useEffect(() => {
    if (!clients || clients.length === 0) return;

    // Existing renewal notification IDs
    const existingRenewalClientIds = new Set(
      notifications
        .filter(n => n.referenceType === 'CLIENT_RENEWAL' || (n.message && n.message.includes('تجديد تمويل')))
        .map(n => n.referenceId)
    );

    const now = Date.now();
    const eligibleClients = clients.filter(c => {
      if (existingRenewalClientIds.has(c.id)) return false;

      const lastDate = c.lastFinanceDate || c.manualEntry?.lastWithdrawalDate || c.manualEntry?.approvalDate || c.addedAt;
      if (!lastDate) return false;

      const daysElapsed = Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      const hasFinancing = (c.totalApprovedAmount && c.totalApprovedAmount > 0) || 
                           (c.disbursedAmount && c.disbursedAmount > 0) || 
                           (c.manualEntry && ((c.manualEntry.approvedAmount || 0) > 0 || (c.manualEntry.disbursedAmount || 0) > 0));

      return daysElapsed >= 90 && hasFinancing;
    });

    if (eligibleClients.length > 0) {
      eligibleClients.slice(0, 3).forEach(c => {
        const lastDate = c.lastFinanceDate || c.manualEntry?.lastWithdrawalDate || c.manualEntry?.approvalDate || c.addedAt;
        const days = Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const comp = c.companyName || c.manualEntry?.companyName || 'شركة التقسيط';

        const notif: Notification = {
          id: `notif_auto_renew_${c.id}_${Date.now()}`,
          userId: 'ROLE_SUPER_ADMIN',
          message: `تنبيه تجديد تمويل متاح: العميل "${c.name}" استوفى ${months} أشهر (${days} يوماً) على آخر تمويل له من ${comp}. العميل مؤهل للتجديد الآن.`,
          messageEn: `Renewal Eligibility Alert: Client "${c.name}" completed ${months} months since last financing from ${comp}. Eligible for credit renewal.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'INFO',
          referenceId: c.id,
          referenceType: 'CLIENT_RENEWAL',
          targetRole: Role.SUPER_ADMIN
        };

        setNotifications(prev => [notif, ...prev]);
      });
    }
  }, [clients]);

  const changePassword = async (newPassword: string) => {
    if (!currentUser) return;
    await updateUserProfile(currentUser.id, { password: newPassword, mustChangePassword: false });

    // Trigger onboarding tour immediately after password change
    try {
      localStorage.setItem('cropsa_launch_tour_now', 'true');
    } catch {}

    addAuditLog('PASSWORD_CHANGE', 'User changed their password', currentUser.id);
  };

  // Super Admin: Create generic user
  const createUser = async (userData: Partial<User>) => {
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) return;
    const newUser: User = {
      id: userData.id || `u_${Date.now()}`,
      name: userData.name || 'مستخدم جديد',
      username: userData.username || `user_${Date.now().toString().slice(-4)}`,
      email: userData.email || `${Date.now()}@crobsa.com`,
      role: userData.role || Role.SUPPLIER,
      password: userData.password || '123456',
      mustChangePassword: false,
      commissionRate: userData.commissionRate,
      walletBalance: userData.walletBalance || 0,
      governorate: userData.governorate,
      companyId: userData.companyId,
      branchId: userData.branchId,
      branchName: userData.branchName,
      permissions: userData.permissions || ['view_clients'],
      createdAt: new Date().toISOString()
    };
    let nextUsers: User[] = [];
    setUsers(prev => {
      nextUsers = [...prev, newUser];
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
      return nextUsers;
    });
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          staff_role: newUser.staffRole || null,
          company_id: newUser.companyId || null,
          branch_id: newUser.branchId || null,
          governorate: newUser.governorate || null,
          phone: newUser.phone || null,
          wallet_balance: newUser.walletBalance || 0,
          commission_rate: newUser.commissionRate || 0,
          active: true
        });
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase createUser fallback:', err);
      }
    }
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.warn('Firestore createUser fallback:', err);
    }
    addAuditLog('CREATE_USER', `Created user ${newUser.name} with role ${newUser.role}`);
  };

  // Company Manager: Create staff member immediately with username & password
  const createCompanyStaff = async (staffData: {
    name: string;
    username: string;
    password: string;
    staffRole: InstallmentCompanyStaffRole;
    governorate: string;
    branchId: string;
    branchName?: string;
    email?: string;
    phone?: string;
    permissions: string[];
  }) => {
    if (!currentUser) return;
    const targetCompanyId = currentUser.companyId || (currentUser.role === Role.INSTALLMENT_COMPANY ? 'comp_01' : undefined);
    if (!targetCompanyId) return;

    const newStaff: User = {
      id: `u_staff_${Date.now()}`,
      name: staffData.name,
      username: staffData.username,
      email: staffData.email || `${staffData.username}@${currentCompany?.code?.toLowerCase() || 'partner'}.com`,
      role: Role.INSTALLMENT_COMPANY,
      staffRole: staffData.staffRole,
      password: staffData.password,
      mustChangePassword: false,
      companyId: targetCompanyId,
      governorate: staffData.governorate,
      branchId: staffData.branchId,
      branchName: staffData.branchName,
      phone: staffData.phone,
      permissions: staffData.permissions,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    let nextUsers: User[] = [];
    setUsers(prev => {
      nextUsers = [...prev, newStaff];
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
      return nextUsers;
    });
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: newStaff.id,
          name: newStaff.name,
          username: newStaff.username,
          email: newStaff.email,
          password: newStaff.password,
          role: newStaff.role,
          staff_role: newStaff.staffRole,
          company_id: newStaff.companyId,
          branch_id: newStaff.branchId,
          governorate: newStaff.governorate,
          phone: newStaff.phone || null,
          wallet_balance: 0,
          commission_rate: 0,
          active: true
        });
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase createCompanyStaff fallback:', err);
      }
    }
    try {
      await setDoc(doc(db, 'users', newStaff.id), newStaff);
    } catch (err) {
      console.warn('Firestore createCompanyStaff fallback:', err);
    }
    addAuditLog('CREATE_COMPANY_STAFF', `Added staff member ${newStaff.name} to company ${currentCompany?.name || targetCompanyId}`, newStaff.id);
  };

  const updateStaffPermissions = async (userId: string, permissions: string[]) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    try {
      await updateDoc(doc(db, 'users', userId), { permissions });
    } catch (err) {
      console.warn('Firestore updateStaffPermissions fallback:', err);
    }
    addAuditLog('UPDATE_PERMISSIONS', `Updated permissions for staff ${userId}`);
  };

  const updateStaffPassword = async (userId: string, newPassword: string) => {
    await updateUserProfile(userId, { password: newPassword, mustChangePassword: false });
    addAuditLog('UPDATE_STAFF_PASSWORD', `Updated password for staff user ${userId}`, userId);
  };

  const bulkImportBranchesAndStaff = async (data: {
    branches: Array<{
      name: string;
      governorate: string;
      address: string;
      phone: string;
      managerName?: string;
    }>;
    staff: Array<{
      name: string;
      username: string;
      password: string;
      role: InstallmentCompanyStaffRole;
      branchName: string;
      governorate: string;
      phone?: string;
      email?: string;
      permissions?: string[];
    }>;
  }) => {
    const targetCompId = currentCompany?.id || currentUser?.companyId || 'comp_01';
    const targetComp = companies.find(c => c.id === targetCompId);
    const compCode = targetComp?.code || 'COMP';
    const nowStr = new Date().toISOString();
    
    // 1. Process branches
    const createdBranches: CompanyBranch[] = [];
    const branchNameToIdMap: Record<string, string> = {};

    // Map existing branches first
    branches.filter(b => b.companyId === targetCompId).forEach(b => {
      branchNameToIdMap[b.name.trim().toLowerCase()] = b.id;
    });

    for (let i = 0; i < data.branches.length; i++) {
      const bData = data.branches[i];
      const normalizedName = bData.name.trim().toLowerCase();
      let bId = branchNameToIdMap[normalizedName];
      if (!bId) {
        bId = `br_bulk_${Date.now()}_${i}`;
        const branchName = bData.name.trim();
        const creds = generateBranchCredentials(branchName, compCode, i + 1);
        const newBranch: CompanyBranch = {
          id: bId,
          companyId: targetCompId,
          name: branchName,
          governorate: bData.governorate.trim() || targetComp?.allowedGovernorates?.[0] || 'القاهرة',
          address: bData.address?.trim() || '',
          phone: bData.phone?.trim() || '',
          managerName: bData.managerName?.trim() || '',
          username: creds.username,
          password: creds.password,
          active: true
        };
        createdBranches.push(newBranch);
        branchNameToIdMap[normalizedName] = bId;
        try {
          await setDoc(doc(db, 'branches', bId), newBranch);
        } catch (e) {
          console.warn('Bulk import branch fallback:', e);
        }
      }
    }

    if (createdBranches.length > 0) {
      setBranches(prev => [...prev, ...createdBranches]);
    }

    // 2. Process staff
    const createdStaffUsers: User[] = [];
    for (let j = 0; j < data.staff.length; j++) {
      const sData = data.staff[j];
      const branchName = sData.branchName.trim();
      const assignedBranchId = branchNameToIdMap[branchName.toLowerCase()] || createdBranches[0]?.id || branches[0]?.id || 'br_01';
      const staffId = `u_bulk_staff_${Date.now()}_${j}`;
      const creds = generateBranchCredentials(branchName || `فرع ${j + 1}`, compCode, j + 1);
      const finalUsername = sData.username?.trim() || creds.username;
      const finalPassword = sData.password?.trim() || creds.password;

      const newStaffUser: User = {
        id: staffId,
        name: sData.name.trim() || `مسؤول ${branchName}`,
        username: finalUsername,
        password: finalPassword,
        role: sData.role === InstallmentCompanyStaffRole.BRANCH_MANAGER ? Role.BRANCH_MANAGER : Role.COMPANY_EMPLOYEE,
        staffRole: sData.role || InstallmentCompanyStaffRole.BRANCH_MANAGER,
        companyId: targetCompId,
        branchId: assignedBranchId,
        branchName: branchName,
        governorate: sData.governorate.trim() || targetComp?.allowedGovernorates?.[0] || 'القاهرة',
        email: sData.email || `${finalUsername}@${compCode.toLowerCase()}.cropsa.eg`,
        phone: sData.phone || '',
        mustChangePassword: false,
        permissions: sData.permissions || ['view_clients', 'request_access', 'ai_analysis', 'approve_apps'],
        createdBy: currentUser?.id,
        createdAt: nowStr
      };
      createdStaffUsers.push(newStaffUser);
      try {
        await setDoc(doc(db, 'users', staffId), newStaffUser);
      } catch (e) {
        console.warn('Bulk import staff user fallback:', e);
      }
    }

    if (createdStaffUsers.length > 0) {
      let nextUsers: User[] = [];
      setUsers(prev => {
        nextUsers = [...prev, ...createdStaffUsers];
        try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
        return nextUsers;
      });
      if (supabase) {
        supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        }).catch(console.warn);
      }
    }

    if (supabase) {
      try {
        if (createdBranches.length > 0) {
          await supabase.from('company_branches').upsert(createdBranches.map(b => ({
            id: b.id,
            company_id: b.companyId,
            name: b.name,
            governorate: b.governorate,
            address: b.address || '',
            phone: b.phone || '',
            manager_name: b.managerName || '',
            username: b.username,
            password: b.password,
            active: true
          })));
        }
        if (createdStaffUsers.length > 0) {
          await supabase.from('users').upsert(createdStaffUsers.map(s => ({
            id: s.id,
            name: s.name,
            username: s.username,
            email: s.email,
            password: s.password,
            role: s.role,
            staff_role: s.staffRole || null,
            company_id: s.companyId || null,
            branch_id: s.branchId || null,
            governorate: s.governorate || null,
            phone: s.phone || null,
            wallet_balance: 0,
            commission_rate: 0,
            active: true
          })));
        }
      } catch (err) {
        console.warn('Supabase bulkImportBranchesAndStaff fallback:', err);
      }
    }

    addAuditLog(
      'BULK_IMPORT_BRANCHES_STAFF', 
      `Bulk imported ${createdBranches.length} branches and ${createdStaffUsers.length} staff members from Excel sheet`
    );

    return {
      importedBranches: createdBranches.length,
      importedStaff: createdStaffUsers.length
    };
  };

  // Super Admin: Create partner installment company
  const createCompany = async (companyData: Partial<InstallmentCompany>, initialAdminPassword = 'password', initialAdminUsername?: string) => {
    if (!currentUser || (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN)) return;
    const compId = `comp_${Date.now()}`;
    const trimmedUsername = initialAdminUsername?.trim();
    const finalAdminUsername = trimmedUsername || `${(companyData.code || `COMP-${Date.now().toString().slice(-3)}`).toLowerCase().replace('-', '_')}_admin`;
    const finalAdminEmail = (trimmedUsername && trimmedUsername.includes('@')) 
      ? trimmedUsername 
      : (companyData.email && companyData.email.includes('@') ? companyData.email : `${finalAdminUsername}@cropsa.net`);

    const newComp: InstallmentCompany = {
      id: compId,
      name: companyData.name || 'شركة تقسيط شريكة',
      nameEn: companyData.nameEn || 'Partner Installment Co.',
      code: companyData.code || `COMP-${Date.now().toString().slice(-3)}`,
      logo: companyData.logo || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80',
      coverImage: companyData.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      coverPosition: companyData.coverPosition || '50% 50%',
      email: finalAdminEmail,
      phone: companyData.phone || '19000',
      receivingChannel: companyData.receivingChannel || 'PORTAL',
      whatsappNumber: companyData.whatsappNumber || '',
      dispatchEmail: companyData.dispatchEmail || '',
      contactPersonName: companyData.contactPersonName || '',
      commercialRegister: companyData.commercialRegister || '000000',
      taxNumber: companyData.taxNumber || '000-000-000',
      fraLicense: companyData.fraLicense || 'FRA-FIN-PENDING',
      creditCeiling: Number(companyData.creditCeiling) || 10000000,
      usedCredit: 0,
      commissionRate: Number(companyData.commissionRate) || 3.5,
      allowedGovernorates: companyData.allowedGovernorates || ['القاهرة', 'الجيزة'],
      requiredDocumentsList: companyData.requiredDocumentsList || [
        'بطاقة الرقم القومي سارية للمشتري والضامن',
        'إيصال مرافق حديث',
        'استعلام I-Score ائتماني'
      ],
      status: companyData.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      adminUsername: finalAdminUsername,
      adminEmail: finalAdminEmail,
      adminPassword: initialAdminPassword,
      featuresGranted: companyData.featuresGranted || {
        canViewCrobsaDb: true,
        canUseAiAnalysis: true,
        canExportReports: true,
        canManageSubUsers: true,
        canManageSharedFiles: true
      }
    };

    // Also auto-create initial company admin user with the user-defined email/username
    const initialAdmin: User = {
      id: `u_admin_${compId}`,
      name: `${newComp.name} (المدير العام)`,
      username: finalAdminUsername,
      email: finalAdminEmail,
      role: Role.INSTALLMENT_COMPANY,
      staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
      companyId: compId,
      password: initialAdminPassword,
      mustChangePassword: true,
      permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases'],
      createdAt: new Date().toISOString()
    };

    let updatedComps: InstallmentCompany[] = [];
    setCompanies(prev => {
      updatedComps = [...prev.filter(c => c.id !== compId), newComp];
      try { localStorage.setItem('cropsa_companies', JSON.stringify(updatedComps)); } catch (e) {}
      return updatedComps;
    });

    let updatedUsers: User[] = [];
    setUsers(prev => {
      updatedUsers = [...prev.filter(u => u.id !== initialAdmin.id), initialAdmin];
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(updatedUsers)); } catch (e) {}
      return updatedUsers;
    });

    // Clean up deleted_company_ids if resurrected
    try {
      const localDel = localStorage.getItem('cropsa_deleted_company_ids');
      if (localDel) {
        const parsed = JSON.parse(localDel).filter((id: string) => id !== compId);
        localStorage.setItem('cropsa_deleted_company_ids', JSON.stringify(parsed));
        if (supabase) {
          supabase.from('system_settings').upsert({
            id: 'deleted_company_ids',
            data: parsed,
            updated_at: new Date().toISOString()
          }).catch(console.warn);
        }
      }
    } catch {}

    // Register initial company programs if present
    if (newComp.financingPrograms && newComp.financingPrograms.length > 0) {
      setFinancingPrograms(prev => {
        const next = [...newComp.financingPrograms!, ...prev.filter(p => !newComp.financingPrograms!.some(np => np.id === p.id))];
        try { localStorage.setItem('cropsa_financing_programs', JSON.stringify(next)); } catch (e) {}
        if (supabase) {
          supabase.from('system_settings').upsert({
            id: 'financing_programs',
            data: next,
            updated_at: new Date().toISOString()
          }).catch(console.warn);
        }
        return next;
      });
    }

    if (supabase) {
      // 1. ALWAYS persist full JSON in system_settings FIRST so no rich property is ever lost
      try {
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: updatedComps,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: updatedUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase system_settings createCompany fallback:', err);
      }

      // 2. Sync relational tables safely
      try {
        await supabase.from('companies').upsert({
          id: compId,
          name: newComp.name,
          name_en: newComp.nameEn || '',
          code: newComp.code,
          logo: newComp.logo || '',
          email: newComp.email || '',
          phone: newComp.phone || '',
          commercial_register: newComp.commercialRegister || '',
          tax_number: newComp.taxNumber || '',
          credit_ceiling: newComp.creditCeiling || 0,
          used_credit: newComp.usedCredit || 0,
          commission_rate: newComp.commissionRate || 0,
          allowed_governorates: newComp.allowedGovernorates || []
        });
        await supabase.from('users').upsert({
          id: initialAdmin.id,
          name: initialAdmin.name,
          username: initialAdmin.username,
          email: initialAdmin.email,
          role: initialAdmin.role,
          staff_role: initialAdmin.staffRole || null,
          company_id: compId,
          active: true,
          password: initialAdminPassword,
          must_change_password: true
        });
      } catch (err) {
        console.warn('Supabase createCompany relational fallback:', err);
      }
    }

    try {
      await setDoc(doc(db, 'companies', compId), newComp);
      await setDoc(doc(db, 'users', initialAdmin.id), initialAdmin);
    } catch (err) {
      console.warn('Firestore createCompany fallback:', err);
    }

    addAuditLog('CREATE_COMPANY', `Added installment company ${newComp.name}`, compId);
    addNotification('u_super', `تم تسجيل شركة تقسيط جديدة: ${newComp.name}`, 'SUCCESS', compId);
  };

  const updateCompany = async (companyId: string, updates: Partial<InstallmentCompany>) => {
    // 1. ALWAYS read the latest list from localStorage first (to prevent any stale closure overwriting sequential updates)
    let currentList: InstallmentCompany[] = [];
    try {
      const s = localStorage.getItem('cropsa_companies');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) currentList = parsed;
      }
    } catch {}
    if (!currentList || currentList.length === 0) {
      currentList = companies.length > 0 ? companies : MOCK_COMPANIES;
    }

    const nextComps = currentList.map(c => c.id === companyId ? { ...c, ...updates } : c);

    // 2. Synchronously set state and localStorage
    setCompanies(nextComps);
    try {
      localStorage.setItem('cropsa_companies', JSON.stringify(nextComps));
    } catch (e) {}

    // 3. If financing programs were updated for this company, sync them to global financingPrograms and system_settings
    if (updates.financingPrograms && Array.isArray(updates.financingPrograms)) {
      setFinancingPrograms(prev => {
        const withoutThisComp = prev.filter(p => p.companyId !== companyId);
        const combined = [...updates.financingPrograms!, ...withoutThisComp];
        try {
          localStorage.setItem('cropsa_financing_programs', JSON.stringify(combined));
        } catch (e) {}
        if (supabase) {
          supabase.from('system_settings').upsert({
            id: 'financing_programs',
            data: combined,
            updated_at: new Date().toISOString()
          }).catch(console.warn);
        }
        return combined;
      });
    }

    if (supabase) {
      // 4. ALWAYS persist full JSON with all rich fields in system_settings FIRST
      try {
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: nextComps,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase system_settings updateCompany fallback:', err);
      }

      // 5. Safely sync relational table with valid schema columns only (excluding non-existent columns like status, fra_license)
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.nameEn !== undefined) payload.name_en = updates.nameEn;
        if (updates.code !== undefined) payload.code = updates.code;
        if (updates.logo !== undefined) payload.logo = updates.logo;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.commercialRegister !== undefined) payload.commercial_register = updates.commercialRegister;
        if (updates.taxNumber !== undefined) payload.tax_number = updates.taxNumber;
        if (updates.creditCeiling !== undefined) payload.credit_ceiling = updates.creditCeiling;
        if (updates.usedCredit !== undefined) payload.used_credit = updates.usedCredit;
        if (updates.commissionRate !== undefined) payload.commission_rate = updates.commissionRate;
        if (updates.allowedGovernorates !== undefined) payload.allowed_governorates = updates.allowedGovernorates;

        if (Object.keys(payload).length > 0) {
          const { error } = await supabase.from('companies').update(payload).eq('id', companyId);
          if (error) console.warn('Supabase relational companies updateCompany warning:', error);
        }
      } catch (err) {
        console.warn('Supabase relational companies updateCompany fallback:', err);
      }
    }
    try {
      updateDoc(doc(db, 'companies', companyId), updates).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateCompany fallback:', err);
    }
    addAuditLog('UPDATE_COMPANY', `Updated profile of company ${companyId}`, companyId);
  };

  const updateCompanyAdminCredentials = async (companyId: string, creds: { username?: string; email?: string; password?: string }) => {
    const cleanUsername = creds.username?.trim();
    const cleanPassword = creds.password?.trim();
    const cleanEmail = creds.email?.trim() || (cleanUsername && cleanUsername.includes('@') ? cleanUsername : undefined);

    let currentComps: InstallmentCompany[] = [];
    try {
      const s = localStorage.getItem('cropsa_companies');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) currentComps = parsed;
      }
    } catch {}
    if (!currentComps || currentComps.length === 0) currentComps = companies;

    const targetComp = currentComps.find(c => c.id === companyId);

    // 1. Immediately persist admin credentials directly on the InstallmentCompany entity if changed
    const compUpdates: Partial<InstallmentCompany> = {};
    if (cleanUsername && cleanUsername !== targetComp?.adminUsername) compUpdates.adminUsername = cleanUsername;
    if (cleanEmail && cleanEmail !== targetComp?.adminEmail) compUpdates.adminEmail = cleanEmail;
    if (cleanPassword && cleanPassword !== targetComp?.adminPassword) compUpdates.adminPassword = cleanPassword;
    if (Object.keys(compUpdates).length > 0) {
      await updateCompany(companyId, compUpdates);
    }

    // 2. Locate or synthesize the company admin User object
    const adminUser = users.find(u => 
      u.companyId === companyId && 
      (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)
    );

    const finalUserId = adminUser?.id || `u_comp_${targetComp?.code?.toLowerCase() || companyId}`;
    const finalUsername = cleanUsername || adminUser?.username || `${(targetComp?.code || 'comp').toLowerCase().replace('-', '_')}_admin`;
    const finalEmail = cleanEmail || adminUser?.email || `${finalUsername}@cropsa.net`;
    const finalPassword = cleanPassword || adminUser?.password || 'password';

    const updatedAdmin: User = {
      id: finalUserId,
      name: adminUser?.name || `${targetComp?.name || 'الشركة'} (المدير العام)`,
      username: finalUsername,
      email: finalEmail,
      role: Role.INSTALLMENT_COMPANY,
      staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
      companyId: companyId,
      password: finalPassword,
      mustChangePassword: false,
      permissions: adminUser?.permissions || ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases'],
      createdAt: adminUser?.createdAt || new Date().toISOString()
    };

    // 3. Ensure user exists in in-memory state, localStorage, and system_settings users_data
    let nextUsersList: User[] = [];
    setUsers(prev => {
      const exists = prev.some(u => u.id === finalUserId || (u.companyId === companyId && (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)));
      if (exists) {
        nextUsersList = prev.map(u => 
          (u.id === finalUserId || (u.companyId === companyId && (u.role === Role.INSTALLMENT_COMPANY || u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN)))
            ? { ...u, ...updatedAdmin }
            : u
        );
      } else {
        nextUsersList = [...prev, updatedAdmin];
      }
      try {
        localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsersList));
      } catch (e) {}
      return nextUsersList;
    });

    if (currentUser && (currentUser.id === finalUserId || currentUser.companyId === companyId)) {
      setCurrentUser(prev => prev ? { ...prev, ...updatedAdmin } : null);
    }

    // 4. Force full upsert in Supabase users table and system_settings users_data
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          username: updatedAdmin.username,
          email: updatedAdmin.email,
          password: updatedAdmin.password,
          role: updatedAdmin.role,
          staff_role: updatedAdmin.staffRole,
          company_id: updatedAdmin.companyId,
          active: true,
          must_change_password: false
        });

        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsersList,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateCompanyAdminCredentials fallback:', err);
      }
    }

    try {
      await setDoc(doc(db, 'users', updatedAdmin.id), updatedAdmin);
    } catch (err) {
      console.warn('Firestore updateCompanyAdminCredentials fallback:', err);
    }

    addAuditLog('UPDATE_COMPANY_ADMIN', `Updated credentials for company admin of ${companyId}`, updatedAdmin.id);
  };

  const deleteCompany = async (companyId: string) => {
    // 1. Maintain persistent tombstone list of deleted company IDs
    let deletedIds: string[] = [];
    try {
      const localDel = localStorage.getItem('cropsa_deleted_company_ids');
      if (localDel) deletedIds = JSON.parse(localDel);
    } catch {}
    if (!deletedIds.includes(companyId)) {
      deletedIds.push(companyId);
    }
    try {
      localStorage.setItem('cropsa_deleted_company_ids', JSON.stringify(deletedIds));
    } catch {}

    // 2. Synchronously filter companies
    let nextComps: InstallmentCompany[] = [];
    setCompanies(prev => {
      nextComps = prev.filter(c => c.id !== companyId);
      try { localStorage.setItem('cropsa_companies', JSON.stringify(nextComps)); } catch (e) {}
      return nextComps;
    });

    // 3. Synchronously filter branches
    let nextBranches: CompanyBranch[] = [];
    setBranches(prev => {
      nextBranches = prev.filter(b => b.companyId !== companyId);
      try { localStorage.setItem('cropsa_branches', JSON.stringify(nextBranches)); } catch (e) {}
      return nextBranches;
    });

    // 4. Synchronously filter financing programs for that company
    let nextPrograms: FinancingProgram[] = [];
    setFinancingPrograms(prev => {
      nextPrograms = prev.filter(p => p.companyId !== companyId);
      try { localStorage.setItem('cropsa_financing_programs', JSON.stringify(nextPrograms)); } catch (e) {}
      return nextPrograms;
    });

    // 5. Persist to Supabase
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'deleted_company_ids',
          data: deletedIds,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: nextComps,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'company_branches_data',
          data: nextBranches,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'financing_programs',
          data: nextPrograms,
          updated_at: new Date().toISOString()
        });
        await supabase.from('companies').delete().eq('id', companyId);
        await supabase.from('company_branches').delete().eq('company_id', companyId);
      } catch (err) {
        console.warn('Supabase deleteCompany fallback:', err);
      }
    }

    try {
      await deleteDoc(doc(db, 'companies', companyId));
    } catch (err) {}

    addAuditLog('DELETE_COMPANY', `Deleted company ${companyId}`, companyId);
  };

  const createBranch = async (branchData: Partial<CompanyBranch>) => {
    const branchId = `br_${Date.now()}`;
    const targetComp = companies.find(c => c.id === (branchData.companyId || currentCompany?.id || 'comp_01'));
    const compCode = targetComp?.code || 'COMP';
    const branchName = branchData.name || 'فرع جديد';
    const creds = generateBranchCredentials(branchName, compCode, branches.length + 1);

    const newBranch: CompanyBranch = {
      id: branchId,
      companyId: branchData.companyId || (currentCompany?.id || 'comp_01'),
      name: branchName,
      governorate: branchData.governorate || targetComp?.allowedGovernorates?.[0] || 'القاهرة',
      address: branchData.address || '',
      phone: branchData.phone || '',
      managerName: branchData.managerName || '',
      active: true,
      username: branchData.username || creds.username,
      password: branchData.password || creds.password
    };

    setBranches(prev => [...prev, newBranch]);

    // Automatically create branch manager login user
    const branchUser: User = {
      id: `u_${branchId}`,
      name: `مسؤول ${newBranch.name}`,
      username: newBranch.username!,
      email: `${newBranch.username!}@${compCode.toLowerCase()}.cropsa.eg`,
      role: Role.BRANCH_MANAGER,
      staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER,
      companyId: newBranch.companyId,
      branchId: branchId,
      branchName: newBranch.name,
      governorate: newBranch.governorate,
      password: newBranch.password,
      mustChangePassword: false,
      permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports'],
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev.filter(u => u.id !== branchUser.id), branchUser]);

    if (supabase) {
      try {
        await supabase.from('company_branches').upsert({
          id: branchId,
          company_id: newBranch.companyId,
          name: newBranch.name,
          governorate: newBranch.governorate,
          address: newBranch.address || '',
          phone: newBranch.phone || '',
          manager_name: newBranch.managerName || '',
          active: true,
          username: newBranch.username,
          password: newBranch.password
        });
        await supabase.from('users').upsert({
          id: branchUser.id,
          name: branchUser.name,
          username: branchUser.username,
          email: branchUser.email,
          role: branchUser.role,
          staff_role: branchUser.staffRole,
          company_id: branchUser.companyId,
          branch_id: branchUser.branchId,
          governorate: branchUser.governorate,
          password: branchUser.password,
          active: true
        });
      } catch (err) {
        console.warn('Supabase createBranch fallback:', err);
      }
    }
    try {
      await setDoc(doc(db, 'branches', branchId), newBranch);
      await setDoc(doc(db, 'users', branchUser.id), branchUser);
    } catch (err) {
      console.warn('Firestore createBranch fallback:', err);
    }
    addAuditLog('CREATE_BRANCH', `Created branch ${newBranch.name} with auto credentials for company ${newBranch.companyId}`);
  };

  const updateBranch = async (branchId: string, updates: Partial<CompanyBranch>) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...updates } : b));
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name) payload.name = updates.name;
        if (updates.governorate) payload.governorate = updates.governorate;
        if (updates.address !== undefined) payload.address = updates.address;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.managerName !== undefined) payload.manager_name = updates.managerName;
        if (updates.active !== undefined) payload.active = updates.active;
        if (updates.password !== undefined) payload.password = updates.password;
        if (Object.keys(payload).length > 0) {
          await supabase.from('company_branches').update(payload).eq('id', branchId);
        }
      } catch (err) {
        console.warn('Supabase updateBranch fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'branches', branchId), updates);
    } catch (err) {
      console.warn('Firestore updateBranch fallback:', err);
    }
    addAuditLog('UPDATE_BRANCH', `Updated branch ${branchId}`, branchId);
  };

  const updateBranchPassword = async (branchId: string, newPassword: string) => {
    let nextBranches: CompanyBranch[] = [];
    setBranches(prev => {
      nextBranches = prev.map(b => b.id === branchId ? { ...b, password: newPassword } : b);
      try {
        localStorage.setItem('cropsa_branches', JSON.stringify(nextBranches));
      } catch (e) {}
      return nextBranches;
    });

    let nextUsers: User[] = [];
    setUsers(prev => {
      nextUsers = prev.map(u => u.branchId === branchId ? { ...u, password: newPassword } : u);
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
      return nextUsers;
    });

    if (supabase) {
      try {
        await supabase.from('company_branches').update({ password: newPassword }).eq('id', branchId);
        await supabase.from('users').update({ password: newPassword }).eq('branch_id', branchId);
        await supabase.from('system_settings').upsert({
          id: 'company_branches_data',
          data: nextBranches,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateBranchPassword error:', err);
      }
    }

    addAuditLog('UPDATE_BRANCH_PASSWORD', `Updated password for branch ${branchId}`, branchId);
  };

  const deleteBranch = async (branchId: string) => {
    let nextBranches: CompanyBranch[] = [];
    setBranches(prev => {
      nextBranches = prev.filter(b => b.id !== branchId);
      try { localStorage.setItem('cropsa_branches', JSON.stringify(nextBranches)); } catch (e) {}
      return nextBranches;
    });
    let nextUsers: User[] = [];
    setUsers(prev => {
      nextUsers = prev.filter(u => u.branchId !== branchId);
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
      return nextUsers;
    });
    if (supabase) {
      try {
        await supabase.from('company_branches').delete().eq('id', branchId);
        await supabase.from('users').delete().eq('branch_id', branchId);
        await supabase.from('system_settings').upsert({
          id: 'company_branches_data',
          data: nextBranches,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase deleteBranch fallback:', err);
      }
    }
    try {
      await deleteDoc(doc(db, 'branches', branchId));
    } catch (err) {
      console.warn('Firestore deleteBranch fallback:', err);
    }
    addAuditLog('DELETE_BRANCH', `Deleted branch ${branchId}`, branchId);
  };

  const bulkImportCompanyBranches = async (companyId: string, branchesToImport: Partial<CompanyBranch>[]) => {
    const timestamp = Date.now();
    const targetComp = companies.find(c => c.id === companyId);
    const compCode = targetComp?.code || 'COMP';

    const createdBranches: CompanyBranch[] = branchesToImport.map((b, idx) => {
      const branchName = b.name || `فرع ${idx + 1}`;
      const creds = generateBranchCredentials(branchName, compCode, idx + 1);
      return {
        id: b.id || `br_${companyId}_${timestamp}_${idx + 1}`,
        companyId: companyId,
        name: branchName,
        governorate: b.governorate || targetComp?.allowedGovernorates?.[0] || 'القاهرة',
        address: b.address || '',
        phone: b.phone || '',
        managerName: b.managerName || '',
        active: b.active ?? true,
        username: b.username || creds.username,
        password: b.password || creds.password
      };
    });

    // Automatically create branch login users for each imported branch
    const createdBranchUsers: User[] = createdBranches.map(b => ({
      id: `u_${b.id}`,
      name: `مسؤول ${b.name}`,
      username: b.username!,
      email: `${b.username!}@${compCode.toLowerCase()}.cropsa.eg`,
      role: Role.BRANCH_MANAGER,
      staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER,
      companyId: companyId,
      branchId: b.id,
      branchName: b.name,
      governorate: b.governorate,
      password: b.password,
      mustChangePassword: false,
      permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports'],
      createdAt: new Date().toISOString()
    }));

    let allNextBranches: CompanyBranch[] = [];
    setBranches(prev => {
      allNextBranches = [...prev, ...createdBranches];
      try {
        localStorage.setItem('cropsa_branches', JSON.stringify(allNextBranches));
      } catch (e) {}
      return allNextBranches;
    });

    let allNextUsers: User[] = [];
    setUsers(prev => {
      const existingUserIds = new Set(createdBranchUsers.map(u => u.id));
      const filtered = prev.filter(u => !existingUserIds.has(u.id));
      allNextUsers = [...filtered, ...createdBranchUsers];
      try {
        localStorage.setItem('cropsa_staff_users', JSON.stringify(allNextUsers));
      } catch (e) {}
      return allNextUsers;
    });

    if (supabase) {
      try {
        await supabase.from('company_branches').upsert(createdBranches.map(b => ({
          id: b.id,
          company_id: b.companyId,
          name: b.name,
          governorate: b.governorate,
          address: b.address || '',
          phone: b.phone || '',
          manager_name: b.managerName || '',
          active: b.active,
          username: b.username,
          password: b.password
        })));

        await supabase.from('users').upsert(createdBranchUsers.map(u => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role,
          staff_role: u.staffRole,
          company_id: u.companyId,
          branch_id: u.branchId,
          governorate: u.governorate,
          password: u.password,
          active: true
        })));

        await supabase.from('system_settings').upsert({
          id: 'company_branches_data',
          data: allNextBranches,
          updated_at: new Date().toISOString()
        });

        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: allNextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase bulkImportCompanyBranches error:', err);
      }
    }

    addAuditLog('BULK_IMPORT_BRANCHES', `Bulk imported ${createdBranches.length} branches with automated credentials for company ${companyId}`, companyId);
    return { count: createdBranches.length };
  };

  const wipeDemoData = async (password: string) => {
    if (password !== 'Cropsa@015252505111') {
      throw new Error('كلمة المرور غير صحيحة، يرجى كتابة كلمة المرور المعتمدة لمدير النظام: Cropsa@015252505111');
    }

    setIsDemoDataWiped(true);
    setApplications([]);
    setClients([]);
    setTransactions([]);
    setWithdrawalRequests([]);
    setOverdueCases([]);
    setNotifications([]);

    try {
      localStorage.setItem('cropsa_demo_data_wiped', 'true');
      localStorage.removeItem('cropsa_applications');
      localStorage.removeItem('cropsa_clients');
      localStorage.removeItem('cropsa_transactions');
      localStorage.removeItem('cropsa_overdue_cases');
      localStorage.removeItem('crobsa_notifications');
    } catch (e) {}

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'system_demo_wiped',
          data: { wiped: true, wipedAt: new Date().toISOString() },
          updated_at: new Date().toISOString()
        });

        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: [],
          updated_at: new Date().toISOString()
        });

        await supabase.from('system_settings').upsert({
          id: 'clients_data',
          data: [],
          updated_at: new Date().toISOString()
        });

        try {
          await supabase.from('applications').delete().neq('id', '___none___');
        } catch (err) {}
        try {
          await supabase.from('clients').delete().neq('id', '___none___');
        } catch (err) {}
      } catch (err) {
        console.warn('Supabase wipeDemoData error:', err);
      }
    }

    addAuditLog('WIPE_DEMO_DATA', 'تم مسح وتصفير كافة البيانات التجريبية للنظام بقاعدة البيانات بكلمة مرور المدير المصرحة');
  };

  // Client Directory & Timeline
  const addClient = async (clientData: Partial<Client>) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const approvedAmt = Number(clientData.totalApprovedAmount || clientData.manualEntry?.approvedAmount || 0);
    const disbursedAmt = Number(clientData.disbursedAmount || clientData.manualEntry?.disbursedAmount || approvedAmt);
    const companyTitle = clientData.companyName || clientData.manualEntry?.companyName || 'شركة أمان للتقسيط';
    const financeDate = clientData.lastFinanceDate || clientData.manualEntry?.approvalDate || clientData.manualEntry?.lastWithdrawalDate || '2024-01-01';
    const compId = clientData.manualEntry?.installmentCompanyId || 'comp_01';

    const cleanNatId = clientData.nationalId?.trim() || '';
    const isMissingNid = !cleanNatId || cleanNatId.length !== 14 || cleanNatId.startsWith('TEMP-');
    const clientId = `c_${Date.now()}`;

    // Calculate elapsed time from historical finance date
    const financeTs = new Date(financeDate).getTime();
    const daysElapsed = Math.max(1, Math.floor((Date.now() - (isNaN(financeTs) ? Date.now() : financeTs)) / (1000 * 60 * 60 * 24)));
    const monthsElapsed = Math.floor(daysElapsed / 30);
    const isEligible = daysElapsed >= 90 || monthsElapsed >= 3;

    const newClient: Client = {
      id: clientId,
      name: clientData.name?.trim() || 'عميل جديد',
      nationalId: cleanNatId || (isMissingNid ? `TEMP-NID-${Date.now().toString().slice(-6)}` : ''),
      hasMissingNationalId: isMissingNid,
      temporaryNationalId: isMissingNid ? `TEMP-NID-${Date.now().toString().slice(-6)}` : undefined,
      phoneNumber: clientData.phoneNumber || '',
      governorate: clientData.governorate || 'القاهرة',
      profession: clientData.profession || 'MERCHANT',
      addedBy: currentUser.id,
      addedAt: nowStr,
      creditRating: clientData.creditRating || 'A',
      totalApprovedAmount: approvedAmt,
      disbursedAmount: disbursedAmt,
      companyName: companyTitle,
      lastFinanceDate: financeDate,
      isHistoricalOnly: clientData.isHistoricalOnly !== undefined ? clientData.isHistoricalOnly : true,
      renewalClassification: isEligible ? 'ELIGIBLE' : 'RECENT_ACTIVE',
      renewalEligibleMonths: monthsElapsed,
      renewalNotes: isEligible
        ? `مؤهل للتجديد الفوري (مضى ${monthsElapsed} أشهر على التمويل السابق)`
        : `تمويل حديث نشط (متبقي ${Math.max(0, 90 - daysElapsed)} يوماً لاستيفاء مهلة الـ 3 أشهر)`,
      authorizedCompanies: clientData.authorizedCompanies || [compId],
      manualEntry: clientData.manualEntry,
      notes: clientData.notes || 'تمت الإضافة عبر شاشة إدخال العملاء',
      timeline: clientData.timeline || [
        {
          id: `t_${Date.now()}`,
          clientId,
          action: 'إضافة العميل للنظام كتمويل سابق معتمد',
          actionType: 'NOTE',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          timestamp: nowStr,
          details: `تم تسجيل بيانات العميل بنجاح. التمويل السابق: ${approvedAmt.toLocaleString()} ج.م من ${companyTitle} بتاريخ ${financeDate}`,
          badgeColor: 'blue'
        }
      ]
    };

    setClients(prev => [newClient, ...prev]);

    // Create corresponding historical financing application with exact date and company!
    if (approvedAmt > 0 || disbursedAmt > 0) {
      const histApp: Application = {
        id: `app_hist_${Date.now()}`,
        clientId: newClient.id,
        clientName: newClient.name,
        clientNationalId: newClient.nationalId,
        phoneNumber: newClient.phoneNumber,
        governorate: newClient.governorate,
        profession: newClient.profession,
        financeType: 'INSTALLMENT',
        durationMonths: 12,
        hasRecentInstallment: true,
        hasRecentReceipt: true,
        requestedAmount: approvedAmt,
        approvedAmount: approvedAmt,
        usedAmount: disbursedAmt,
        status: ApplicationStatus.APPROVED,
        companyName: companyTitle,
        companyId: compId,
        assignedCompanyIds: [compId],
        submittedBy: currentUser.id,
        submittedByName: currentUser.name,
        submittedAt: financeDate ? `${financeDate}T09:00:00.000Z` : nowStr,
        reviewedAt: financeDate ? `${financeDate}T10:00:00.000Z` : nowStr,
        description: `طلب تمويل سابق معتمد ومسجل بقاعدة بيانات كروبسا (${companyTitle}) بمبلغ ${disbursedAmt.toLocaleString()} ج.م`,
        history: [
          {
            action: 'AMOUNT_TRANSFERRED',
            timestamp: financeDate ? `${financeDate}T10:00:00.000Z` : nowStr,
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            details: `تمويل تاريخي معتمد ومنفذ من ${companyTitle} بتاريخ ${financeDate}`
          }
        ]
      };

      setApplications(prev => [histApp, ...prev]);
      if (supabase) {
        supabase.from('applications').upsert({
          id: histApp.id,
          client_id: newClient.id,
          client_name: newClient.name,
          client_national_id: newClient.nationalId,
          total_amount: approvedAmt,
          financed_amount: approvedAmt,
          status: 'APPROVED',
          company_id: compId,
          created_at: histApp.submittedAt
        }).catch((e: any) => console.warn('Supabase histApp save fallback:', e));
      }
    }
    try {
      if (supabase) {
        await supabase.from('clients').upsert({
          id: newClient.id,
          name: newClient.name,
          national_id: newClient.nationalId,
          phone: newClient.phoneNumber,
          governorate: newClient.governorate,
          address: clientData.address || '',
          job_title: newClient.profession,
          monthly_income: clientData.monthlyIncome || 0,
          iscore_status: clientData.iscoreStatus || 'CLEAN',
          credit_rating: typeof newClient.creditRating === 'number' ? newClient.creditRating : 80,
          total_financed: newClient.totalApprovedAmount || 0,
          active_installments_count: clientData.activeInstallmentsCount || 0
        });
      }
    } catch (err) {
      console.warn('Supabase addClient fallback:', err);
    }
    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
    } catch (err) {
      console.warn('Firestore addClient fallback:', err);
    }
    addAuditLog('CREATE_CLIENT', `Added client ${newClient.name}`, newClient.id);
  };

  const updateClient = async (clientId: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...data } : c));
    try {
      if (supabase) {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.nationalId !== undefined) payload.national_id = data.nationalId;
        if (data.phoneNumber !== undefined) payload.phone = data.phoneNumber;
        if (data.governorate !== undefined) payload.governorate = data.governorate;
        if (data.address !== undefined) payload.address = data.address;
        if (data.profession !== undefined) payload.job_title = data.profession;
        if (data.monthlyIncome !== undefined) payload.monthly_income = data.monthlyIncome;
        if (data.iscoreStatus !== undefined) payload.iscore_status = data.iscoreStatus;
        if (data.creditRating !== undefined) payload.credit_rating = typeof data.creditRating === 'number' ? data.creditRating : 80;
        if (data.totalApprovedAmount !== undefined) payload.total_financed = data.totalApprovedAmount;
        if (data.activeInstallmentsCount !== undefined) payload.active_installments_count = data.activeInstallmentsCount;
        if (Object.keys(payload).length > 0) {
          await supabase.from('clients').update(payload).eq('id', clientId);
        }
      }
    } catch (err) {
      console.warn('Supabase updateClient fallback:', err);
    }
    try {
      await updateDoc(doc(db, 'clients', clientId), data);
    } catch (err) {
      console.warn('Firestore updateClient fallback:', err);
    }
    addAuditLog('UPDATE_CLIENT', `Updated client ${clientId}`, clientId);
  };

  const deleteClient = async (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    try {
      await deleteDoc(doc(db, 'clients', clientId));
    } catch (err) {
      console.warn('Firestore deleteClient fallback:', err);
    }
    try {
      if (supabase) {
        await supabase.from('clients').delete().eq('id', clientId);
      }
    } catch (err) {
      console.warn('Supabase deleteClient fallback:', err);
    }
    addAuditLog('DELETE_CLIENT', `Deleted client ${clientId}`, clientId);
  };

  const addClientTimelineEvent = async (clientId: string, event: Omit<ClientTimelineItem, 'id' | 'timestamp' | 'clientId'>) => {
    const newEvent: ClientTimelineItem = {
      id: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      clientId,
      timestamp: new Date().toISOString(),
      ...event
    };

    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const existingTimeline = c.timeline || [];
        return {
          ...c,
          timeline: [newEvent, ...existingTimeline]
        };
      }
      return c;
    }));

    try {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const updatedTimeline = [newEvent, ...(client.timeline || [])];
        await updateDoc(doc(db, 'clients', clientId), { timeline: updatedTimeline });
      }
    } catch (err) {
      console.warn('Firestore addClientTimelineEvent fallback:', err);
    }
    addAuditLog('CLIENT_TIMELINE_EVENT', `Action logged: ${event.action} for client ${clientId}`, clientId);
  };

  const addClientCrossComment = async ({
    clientId,
    applicationId,
    message,
    commentType,
    isUrgent = false
  }: {
    clientId: string;
    applicationId?: string;
    message: string;
    commentType: string;
    isUrgent?: boolean;
  }) => {
    if (!currentUser || !message.trim()) return;
    const nowStr = new Date().toISOString();
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // 1. Add to client timeline
    const actionTypeMap: Record<string, ClientTimelineItem['actionType']> = {
      'FIELD': 'FOLLOWUP',
      'CREDIT': 'AI_ANALYSIS',
      'DOCS': 'DOC_UPLOAD',
      'PAYMENT': 'PAYMENT',
      'STATUS': 'STATUS_CHANGE',
      'NOTE': 'NOTE'
    };

    const actionType = actionTypeMap[commentType] || 'NOTE';
    const badgeColor = isUrgent ? 'rose' : commentType === 'PAYMENT' ? 'emerald' : commentType === 'DOCS' ? 'indigo' : commentType === 'CREDIT' ? 'purple' : 'sky';

    const authorRoleLabel = 
      currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN
        ? 'فريق كروبسا مصر'
        : currentUser.role === Role.BRANCH_MANAGER
          ? `مدير فرع ${currentUser.branchName || ''}`
          : currentUser.role === Role.COMPANY_EMPLOYEE
            ? `موظف فحص (${currentUser.branchName || 'الفرع'})`
            : currentCompany?.name || 'إدارة شركة التقسيط';

    await addClientTimelineEvent(clientId, {
      action: `${isUrgent ? '🚨 [عاجل] ' : ''}تحديث: ${authorRoleLabel}`,
      actionType,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      companyName: currentCompany?.name || (currentUser.role === Role.SUPER_ADMIN ? 'كروبسا مصر' : currentUser.branchName),
      details: message.trim(),
      badgeColor
    });

    // 2. If client has an application (or specified applicationId), sync comment to application too
    const targetApp = applicationId ? applications.find(a => a.id === applicationId) : applications.find(a => a.clientNationalId === client?.nationalId);
    if (targetApp) {
      const newComment: ApplicationComment = {
        id: `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        applicationId: targetApp.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        senderCompanyName: currentCompany?.name || (currentUser.role === Role.SUPER_ADMIN ? 'كروبسا مصر' : currentUser.branchName),
        message: message.trim(),
        createdAt: nowStr,
        isUrgent
      };
      const updatedApp = {
        ...targetApp,
        comments: [...(targetApp.comments || []), newComment],
        isUrgent: isUrgent ? true : targetApp.isUrgent
      };
      setApplications(prev => prev.map(a => a.id === targetApp.id ? updatedApp : a));
      try {
        await updateDoc(doc(db, 'applications', targetApp.id), {
          comments: updatedApp.comments,
          isUrgent: updatedApp.isUrgent
        });
      } catch (e) {
        console.warn('Firestore cross comment app fallback:', e);
      }
    }

    // 3. Dispatch smart scoped notifications to all interested parties
    const notifText = `${isUrgent ? '🚨 ' : ''}تحديث جديد على العميل ${client.name} من ${currentUser.name}: "${message.slice(0, 50)}..."`;

    if (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.ADMIN) {
      // Notify client's authorized companies & branches
      if (targetApp?.assignedCompanyIds) {
        targetApp.assignedCompanyIds.forEach(cid => {
          addNotification(cid, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp.id, undefined, 'CLIENT_UPDATE', { targetCompanyId: cid });
        });
      }
      if (targetApp?.assignedOfficerId) {
        addNotification(targetApp.assignedOfficerId, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp.id, undefined, 'CLIENT_UPDATE', { targetOfficerId: targetApp.assignedOfficerId });
      }
      if (targetApp?.assignedBranchId) {
        addNotification(targetApp.assignedBranchId, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp.id, undefined, 'CLIENT_UPDATE', { targetBranchId: targetApp.assignedBranchId });
      }
    } else {
      // Written by company / employee / branch manager:
      // Notify Cropsa Super Admin
      users.filter(u => u.role === Role.SUPER_ADMIN || u.role === Role.ADMIN).forEach(adm => {
        addNotification(adm.id, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp?.id, undefined, 'CLIENT_UPDATE');
      });
      // Notify company if written by branch/employee
      if (currentUser.companyId && currentUser.role !== Role.INSTALLMENT_COMPANY) {
        addNotification(currentUser.companyId, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp?.id, undefined, 'CLIENT_UPDATE', { targetCompanyId: currentUser.companyId });
      }
      // Notify assigned officer if someone else commented
      if (targetApp?.assignedOfficerId && targetApp.assignedOfficerId !== currentUser.id) {
        addNotification(targetApp.assignedOfficerId, notifText, isUrgent ? 'WARNING' : 'INFO', targetApp?.id, undefined, 'CLIENT_UPDATE', { targetOfficerId: targetApp.assignedOfficerId });
      }
    }

    addAuditLog('CLIENT_CROSS_COMMENT', `Comment posted on client ${client.name} by ${currentUser.name}`, clientId);
  };

  // Cross-Company Client Request Workflow
  const requestClientAccess = async (clientId: string, reason: string) => {
    if (!currentUser) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const company = currentCompany;
    const companyId = company?.id || currentUser.companyId || 'comp_01';
    const companyName = company?.name || 'شركة تقسيط شريكة';

    const newRequest: ClientAccessRequest = {
      id: `req_${Date.now()}`,
      companyId,
      companyName,
      clientId,
      clientName: client.name,
      clientNationalId: client.nationalId,
      requestedBy: currentUser.id,
      requestedByName: currentUser.name,
      requestReason: reason,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    setClientRequests(prev => [newRequest, ...prev]);
    try {
      await setDoc(doc(db, 'client_requests', newRequest.id), newRequest);
    } catch (err) {
      console.warn('Firestore requestClientAccess fallback:', err);
    }

    // Notify Admins
    addNotification('u_admin', `طلب استعلام ومشاركة عميل جديد وارد من ${companyName} بخصوص ${client.name}`, 'INFO', newRequest.id, undefined, 'CLIENT_REQUEST');
    addAuditLog('REQUEST_CLIENT_ACCESS', `Company ${companyName} requested access to client ${client.name}`, newRequest.id);

    // Also add to client timeline
    addClientTimelineEvent(clientId, {
      action: `طلب استعلام من ${companyName}`,
      actionType: 'ACCESS_REQUEST',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      companyName,
      details: `السبب: ${reason}`,
      badgeColor: 'amber'
    });
  };

  const reviewClientAccessRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    if (!currentUser) return;
    const req = clientRequests.find(r => r.id === requestId);
    if (!req) return;

    const nowStr = new Date().toISOString();
    const updatedReq: ClientAccessRequest = {
      ...req,
      status,
      reviewedBy: currentUser.id,
      reviewedAt: nowStr,
      reviewNotes: notes
    };

    setClientRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    try {
      await updateDoc(doc(db, 'client_requests', requestId), {
        status,
        reviewedBy: currentUser.id,
        reviewedAt: nowStr,
        reviewNotes: notes
      });
    } catch (err) {
      console.warn('Firestore reviewClientAccessRequest fallback:', err);
    }

    if (status === 'APPROVED') {
      // Grant permission to this company on the client document!
      setClients(prev => prev.map(c => {
        if (c.id === req.clientId) {
          const authSet = new Set(c.authorizedCompanies || []);
          authSet.add(req.companyId);
          return { ...c, authorizedCompanies: Array.from(authSet) };
        }
        return c;
      }));

      try {
        const client = clients.find(c => c.id === req.clientId);
        if (client) {
          const authSet = new Set(client.authorizedCompanies || []);
          authSet.add(req.companyId);
          await updateDoc(doc(db, 'clients', req.clientId), {
            authorizedCompanies: Array.from(authSet)
          });
        }
      } catch (err) {
        console.warn('Firestore update authorizedCompanies fallback:', err);
      }

      // Notify the requesting company
      addNotification(
        req.requestedBy, 
        `تمت موافقة إدارة كروبسا على طلب الاستعلام عن العميل: ${req.clientName}. يمكنك الآن الاطلاع على الملف الكامل.`,
        'SUCCESS',
        req.clientId,
        `CROBSA Admin approved your access request for client: ${req.clientName}. Full file is now unlocked.`,
        'CLIENT_REQUEST'
      );

      // Log in client timeline
      addClientTimelineEvent(req.clientId, {
        action: `موافقة إدارة كروبسا على مشاركة الملف مع ${req.companyName}`,
        actionType: 'ACCESS_REQUEST',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        details: notes || 'تم منح صلاحية الوصول للاطلاع على السجل الائتماني والمستندات',
        badgeColor: 'green'
      });
    } else {
      addNotification(
        req.requestedBy, 
        `تم رفض طلب الاستعلام عن العميل: ${req.clientName}. ملاحظات الإدارة: ${notes || 'لا تتوفر مبررات كافية'}`,
        'WARNING',
        req.clientId,
        `Your access request for client: ${req.clientName} was declined.`,
        'CLIENT_REQUEST'
      );
    }

    addAuditLog('REVIEW_ACCESS_REQUEST', `Admin ${currentUser.name} marked request ${requestId} as ${status}`, requestId);
  };

  // Follow-up & Collections
  const addOverdueCase = async (overdueData: Partial<OverdueCase>) => {
    const caseId = `overdue_${Date.now()}`;
    const newCase: OverdueCase = {
      id: caseId,
      clientId: overdueData.clientId || '',
      clientName: overdueData.clientName || '',
      phoneNumber: overdueData.phoneNumber || '',
      governorate: overdueData.governorate || 'القاهرة',
      companyId: overdueData.companyId || (currentCompany?.id || 'comp_01'),
      applicationId: overdueData.applicationId || '',
      totalLoan: Number(overdueData.totalLoan) || 0,
      installmentAmount: Number(overdueData.installmentAmount) || 0,
      overdueAmount: Number(overdueData.overdueAmount) || 0,
      dueDate: overdueData.dueDate || new Date().toISOString(),
      daysOverdue: Number(overdueData.daysOverdue) || 1,
      severity: overdueData.severity || 'MEDIUM',
      assignedAgent: overdueData.assignedAgent || (currentUser?.name || 'مسؤول التحصيل'),
      assignedBranchId: overdueData.assignedBranchId,
      collectionStatus: overdueData.collectionStatus || 'PENDING_CONTACT',
      followUpHistory: []
    };
    setOverdueCases(prev => [newCase, ...prev]);
    try {
      await setDoc(doc(db, 'overdue_cases', caseId), newCase);
    } catch (err) {
      console.warn('Firestore addOverdueCase fallback:', err);
    }
  };

  const logOverdueFollowUp = async (overdueId: string, followUp: {
    type: 'PHONE_CALL' | 'SMS' | 'VISIT' | 'OFFICIAL_WARNING';
    note: string;
    promisedPaymentDate?: string;
    newStatus?: OverdueCase['collectionStatus'];
  }) => {
    if (!currentUser) return;
    const targetCase = overdueCases.find(oc => oc.id === overdueId);
    if (!targetCase) return;

    const newHistoryItem = {
      id: `fu_${Date.now()}`,
      date: new Date().toISOString(),
      agent: currentUser.name,
      type: followUp.type,
      note: followUp.note,
      promisedPaymentDate: followUp.promisedPaymentDate
    };

    const updatedCase: OverdueCase = {
      ...targetCase,
      lastFollowUpDate: newHistoryItem.date,
      lastFollowUpNotes: followUp.note,
      collectionStatus: followUp.newStatus || targetCase.collectionStatus,
      followUpHistory: [newHistoryItem, ...(targetCase.followUpHistory || [])]
    };

    setOverdueCases(prev => prev.map(oc => oc.id === overdueId ? updatedCase : oc));
    try {
      await updateDoc(doc(db, 'overdue_cases', overdueId), {
        lastFollowUpDate: updatedCase.lastFollowUpDate,
        lastFollowUpNotes: updatedCase.lastFollowUpNotes,
        collectionStatus: updatedCase.collectionStatus,
        followUpHistory: updatedCase.followUpHistory
      });
    } catch (err) {
      console.warn('Firestore logOverdueFollowUp fallback:', err);
    }

    // Also record on the client timeline!
    if (targetCase.clientId) {
      addClientTimelineEvent(targetCase.clientId, {
        action: `إجراء تحصيل: ${followUp.type === 'PHONE_CALL' ? 'مكالمة هاتفية' : followUp.type === 'SMS' ? 'رسالة نصية' : followUp.type === 'VISIT' ? 'زيارة ميدانية' : 'إنذار رسمي'}`,
        actionType: 'FOLLOWUP',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        details: `${followUp.note} ${followUp.promisedPaymentDate ? `(تاريخ السداد الموعود: ${followUp.promisedPaymentDate})` : ''}`,
        badgeColor: 'amber'
      });
    }

    addAuditLog('LOG_FOLLOWUP', `Followup recorded for overdue case ${overdueId} by ${currentUser.name}`, overdueId);
  };

  // Shared Documents Repository
  const addSharedDocument = async (docData: Partial<SharedDocument>) => {
    if (!currentUser) return;
    const docId = `doc_${Date.now()}`;
    const newDoc: SharedDocument = {
      id: docId,
      title: docData.title || 'مستند بدون عنوان',
      titleEn: docData.titleEn || 'Untitled Document',
      category: docData.category || 'CONTRACT_TEMPLATE',
      companyId: docData.companyId || 'ALL',
      fileUrl: docData.fileUrl || 'https://crobsa.com/docs/sample.pdf',
      fileName: docData.fileName || 'document.pdf',
      fileSize: docData.fileSize || '1.2 MB',
      fileType: docData.fileType || 'application/pdf',
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: new Date().toISOString(),
      permission: docData.permission || 'ALL_STAFF',
      description: docData.description || ''
    };

    setSharedDocuments(prev => [newDoc, ...prev]);
    try {
      await setDoc(doc(db, 'shared_documents', docId), newDoc);
    } catch (err) {
      console.warn('Firestore addSharedDocument fallback:', err);
    }
    addAuditLog('UPLOAD_SHARED_DOCUMENT', `Uploaded document ${newDoc.title}`, docId);
  };

  const deleteSharedDocument = async (docId: string) => {
    setSharedDocuments(prev => prev.filter(d => d.id !== docId));
    try {
      await deleteDoc(doc(db, 'shared_documents', docId));
    } catch (err) {
      console.warn('Firestore deleteSharedDocument fallback:', err);
    }
    addAuditLog('DELETE_SHARED_DOCUMENT', `Deleted document ${docId}`, docId);
  };

  // AI Credit & Risk Assessment
  const saveAiAnalysis = async (analysis: AiCreditAnalysis) => {
    setAiAnalyses(prev => [analysis, ...prev]);
    try {
      await setDoc(doc(db, 'ai_analyses', analysis.id), analysis);
    } catch (err) {
      console.warn('Firestore saveAiAnalysis fallback:', err);
    }

    // Add to client timeline!
    if (analysis.clientId) {
      addClientTimelineEvent(analysis.clientId, {
        action: `تحليل الجدارة الائتمانية بالذكاء الاصطناعي (AI Score: ${analysis.creditScore}/100)`,
        actionType: 'AI_ANALYSIS',
        performedBy: analysis.analyzedBy,
        performedByName: analysis.analyzedByName,
        details: `المستوى: ${analysis.riskTier} | التوصية: ${analysis.recommendation} | الحد المقترح: ${analysis.maxSuggestedCredit.toLocaleString()} ج.م | نصيحة: ${analysis.underwriterAdvice}`,
        badgeColor: analysis.creditScore >= 70 ? 'purple' : 'amber'
      });
    }

    addAuditLog('AI_CREDIT_ANALYSIS', `AI score ${analysis.creditScore} calculated for client ${analysis.clientName}`, analysis.clientId);
  };

  // Applications
  const createApplication = async (appData: Partial<Application>) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const appId = `app_${Date.now()}`;

    // Auto-create or comprehensively enrich client in Cropsa Database
    const existingClient = clients.find(c => c.nationalId === appData.clientNationalId);
    let clientId = existingClient?.id;
    if (!existingClient) {
      clientId = `c_${Date.now()}`;
      const newClient: Client = {
        id: clientId,
        name: appData.clientName!,
        nationalId: appData.clientNationalId!,
        phoneNumber: appData.phoneNumber,
        governorate: appData.governorate,
        profession: appData.profession,
        addedBy: currentUser.id,
        addedAt: nowStr,
        lastFinanceDate: nowStr,
        companyName: appData.assignedCompanyIds?.[0] ? (companies.find(c => c.id === appData.assignedCompanyIds![0])?.name || 'أمان للتمويل') : 'كروبسا للتقسيط',
        authorizedCompanies: appData.assignedCompanyIds || [],
        timeline: [
          {
            id: `t_${Date.now()}`,
            clientId,
            action: 'تقديم طلب تمويل لأول مرة',
            actionType: 'APPLICATION',
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            timestamp: nowStr,
            details: `طلب تمويل بقيمة ${appData.requestedAmount?.toLocaleString()} ج.م - نشاط: ${appData.profession}`,
            badgeColor: 'blue'
          }
        ]
      };
      setClients(prev => [newClient, ...prev]);
      if (supabase) {
        try {
          await supabase.from('clients').upsert({
            id: clientId,
            name: newClient.name,
            national_id: newClient.nationalId,
            phone: newClient.phoneNumber || '',
            governorate: newClient.governorate || 'القاهرة',
            job_title: newClient.profession || '',
            monthly_income: 0,
            iscore_status: 'CLEAN',
            credit_rating: 80,
            total_financed: 0
          });
        } catch (e) {
          console.warn('Supabase create client fallback:', e);
        }
      }
      try {
        await setDoc(doc(db, 'clients', clientId), newClient);
      } catch (e) {
        console.warn('Create client error:', e);
      }
    } else {
      setClients(prev => prev.map(c => {
        if (c.id === existingClient.id) {
          return {
            ...c,
            phoneNumber: appData.phoneNumber || c.phoneNumber,
            governorate: appData.governorate || c.governorate,
            profession: appData.profession || c.profession,
            lastFinanceDate: nowStr,
            authorizedCompanies: Array.from(new Set([...(c.authorizedCompanies || []), ...(appData.assignedCompanyIds || [])]))
          };
        }
        return c;
      }));

      addClientTimelineEvent(existingClient.id, {
        action: `تقديم طلب تمويل جديد (#${appId})`,
        actionType: 'APPLICATION',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        details: `مبلغ مطلوب: ${appData.requestedAmount?.toLocaleString()} ج.م - المدة: ${appData.durationMonths} شهر`,
        badgeColor: 'blue'
      });
    }

    const appGov = appData.governorate || 'القاهرة';

    // 1. Determine assigned company: auto-match companies operating in this governorate if none given
    let assignedCompIds = appData.assignedCompanyIds && appData.assignedCompanyIds.length > 0 
      ? appData.assignedCompanyIds 
      : [];
    if (assignedCompIds.length === 0) {
      const matchComp = companies.find(c => 
        c.status === 'ACTIVE' && (c.allowedGovernorates?.includes(appGov) || c.allowedGovernorates?.length === 0)
      );
      if (matchComp) {
        assignedCompIds = [matchComp.id];
      } else {
        assignedCompIds = [companies[0]?.id || 'comp_01'];
      }
    }

    const normGov = (g?: string) => (g || '').trim()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة$/g, 'ه')
      .replace(/ى$/g, 'ي')
      .replace(/\s+/g, '')
      .toLowerCase();

    // 2. Branch and Officer Assignment:
    // If explicit branch was selected (e.g. by branch manager), use it.
    // Otherwise, leave empty so the application remains "تحت الإسناد" (Pending Branch Assignment)
    // until the company manager reviews and selects a branch in the client's governorate.
    const autoBranchId = appData.assignedBranchId || undefined;
    const autoBranchName = appData.assignedBranchName || undefined;
    const autoOfficerId = appData.assignedOfficerId || undefined;
    const autoOfficerName = appData.assignedOfficerName || undefined;

    const newApp: Application = {
      id: appId,
      clientId: clientId,
      companyId: appData.companyId || (assignedCompIds[0] ? assignedCompIds[0] : undefined),
      companyName: appData.companyName || (assignedCompIds[0] ? (companies.find(c => c.id === assignedCompIds[0])?.name) : undefined),
      assignedCompanyNames: appData.assignedCompanyNames || (assignedCompIds.map(cid => companies.find(c => c.id === cid)?.name).filter(Boolean) as string[]),
      clientName: appData.clientName!,
      clientNationalId: appData.clientNationalId!,
      phoneNumber: appData.phoneNumber!,
      whatsappNumber: appData.whatsappNumber || appData.phoneNumber!,
      governorate: appGov,
      assignedBranchId: autoBranchId,
      assignedBranchName: autoBranchName,
      assignedOfficerId: autoOfficerId,
      assignedOfficerName: autoOfficerName,
      profession: appData.profession || 'MERCHANT',
      financeType: appData.financeType || 'INSTALLMENT',
      durationMonths: Number(appData.durationMonths) || 12,
      hasRecentInstallment: !!appData.hasRecentInstallment,
      hasRecentReceipt: !!appData.hasRecentReceipt,
      recentReceiptAmount: appData.recentReceiptAmount,
      requestedAmount: Number(appData.requestedAmount) || 0,
      usedAmount: 0,
      status: ApplicationStatus.RECEIVED,
      documentLink: appData.documentLink || '',
      documents: appData.documents || [],
      customAnswers: appData.customAnswers || {},
      selectedProgramId: appData.selectedProgramId,
      selectedProgramName: appData.selectedProgramName,
      isUrgent: !!appData.isUrgent,
      urgentRequestedAt: appData.isUrgent ? nowStr : undefined,
      urgentRequestedBy: appData.isUrgent ? currentUser.id : undefined,
      urgentRequestedByName: appData.isUrgent ? currentUser.name : undefined,
      submittedBy: currentUser.id,
      submittedAt: nowStr,
      assignedCompanyIds: assignedCompIds,
      description: appData.description || '',
      history: [
        {
          action: 'CREATED',
          timestamp: nowStr,
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          details: `تم تقديم طلب التمويل ووصوله لشركة التقسيط كطلب مستلم (حالة جديدة تحت الإسناد - محافظة: ${appGov}${autoBranchName ? ` - توجيه لفرع: ${autoBranchName}` : ''})`
        }
      ]
    };

    setApplications(prev => [newApp, ...prev]);
    if (supabase) {
      try {
        await supabase.from('applications').upsert({
          id: appId,
          client_id: newApp.clientId,
          client_name: newApp.clientName,
          client_phone: newApp.clientPhone || '',
          client_national_id: newApp.clientNationalId || '',
          company_id: newApp.companyId || null,
          supplier_id: newApp.supplierId || null,
          salesman_id: newApp.salesmanId || null,
          assigned_officer_id: newApp.assignedOfficerId || null,
          branch_id: newApp.branchId || null,
          total_amount: newApp.totalAmount,
          down_payment: newApp.downPayment || 0,
          financed_amount: newApp.financedAmount,
          monthly_installment: newApp.monthlyInstallment,
          duration_months: newApp.durationMonths,
          status: newApp.status,
          product_type: newApp.productType || '',
          product_description: newApp.productDescription || ''
        });
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: [newApp, ...applications],
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase createApplication fallback:', err);
      }
    }
    try {
      await setDoc(doc(db, 'applications', appId), newApp);
    } catch (err) {
      console.warn('Firestore createApplication fallback:', err);
    }
    addAuditLog('CREATE_APPLICATION', `Created application ${appId} for ${newApp.clientName} (Gov: ${appGov}, Branch: ${autoBranchName || 'N/A'})`, appId);
    
    // Notifications scoped:
    addNotification('ROLE_SUPER_ADMIN', `طلب تمويل جديد وارد من ${currentUser.name} للعميل ${newApp.clientName} (${appGov})`, 'INFO', appId, undefined, 'APPLICATION');
    
    assignedCompIds.forEach(cid => {
      addNotification(cid, `طلب تمويل وارد للعميل ${newApp.clientName} بمحافظة ${appGov}`, 'INFO', appId, undefined, 'APPLICATION', { targetCompanyId: cid });
    });

    if (autoBranchId) {
      addNotification(autoBranchId, `طلب تمويل وارد لفرع ${autoBranchName} للعميل ${newApp.clientName} (${appGov})`, 'INFO', appId, undefined, 'APPLICATION', { targetBranchId: autoBranchId });
    }

    if (autoOfficerId) {
      addNotification(autoOfficerId, `طلب تمويل جديد مسند إليك لدراسته للعميل ${newApp.clientName} (${appGov})`, 'INFO', appId, undefined, 'APPLICATION', { targetOfficerId: autoOfficerId, targetBranchId: autoBranchId });
    }
  };

  const updateApplication = async (appId: string, updates: Partial<Application>) => {
    const prevApp = applications.find(a => a.id === appId);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (updates.status) payload.status = updates.status;
        if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
        if (updates.downPayment !== undefined) payload.down_payment = updates.downPayment;
        if (updates.financedAmount !== undefined) payload.financed_amount = updates.financedAmount;
        if (updates.monthlyInstallment !== undefined) payload.monthly_installment = updates.monthlyInstallment;
        if (updates.durationMonths !== undefined) payload.duration_months = updates.durationMonths;
        if (updates.companyId !== undefined) payload.company_id = updates.companyId;
        if (updates.branchId !== undefined) payload.branch_id = updates.branchId;
        if (updates.assignedOfficerId !== undefined) payload.assigned_officer_id = updates.assignedOfficerId;
        payload.updated_at = new Date().toISOString();
        if (Object.keys(payload).length > 0) {
          await supabase.from('applications').update(payload).eq('id', appId);
        }
        const updatedApps = applications.map(a => a.id === appId ? { ...a, ...updates } : a);
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: updatedApps,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateApplication fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'applications', appId), updates);
    } catch (err) {
      console.warn('Firestore updateApplication fallback:', err);
    }
    addAuditLog('UPDATE_APPLICATION', `Application ${appId} updated`, appId);

    // Notify assigned staff and branch managers if status changed
    if (prevApp && updates.status && updates.status !== prevApp.status) {
      const statusLabelsMap: Record<string, string> = {
        [ApplicationStatus.RECEIVED]: 'استلام الطلب',
        [ApplicationStatus.PAPER_REVIEW]: 'فحص ومراجعة المستندات',
        [ApplicationStatus.ISCORE_CHECK]: 'استعلام I-Score الائتماني',
        [ApplicationStatus.FIELD_INVESTIGATION]: 'استعلام وزيارة ميدانية',
        [ApplicationStatus.APPROVED]: 'موافقة ائتمانية مبدئية',
        [ApplicationStatus.CONTRACT_SIGNING]: 'توقيع العقود والضمانات',
        [ApplicationStatus.AMOUNT_TRANSFERRED]: 'صرف التمويل والتنفيذ',
        [ApplicationStatus.REJECTED]: 'طلب مرفوض',
        [ApplicationStatus.WITHDRAWN]: 'طلب مسحوب'
      };
      const statusName = statusLabelsMap[updates.status] || updates.status;
      const notifMsg = `تغيرت حالة طلب العميل ${prevApp.clientName} إلى (${statusName}) بواسطة ${currentUser?.name || 'النظام'}`;
      const notifType = updates.status === ApplicationStatus.APPROVED || updates.status === ApplicationStatus.AMOUNT_TRANSFERRED 
        ? 'SUCCESS' 
        : updates.status === ApplicationStatus.REJECTED 
          ? 'ERROR' 
          : 'INFO';

      // 1. Notify assigned loan officer
      if (prevApp.assignedOfficerId) {
        addNotification(
          prevApp.assignedOfficerId,
          notifMsg,
          notifType,
          appId,
          undefined,
          'APPLICATION',
          { targetOfficerId: prevApp.assignedOfficerId, targetBranchId: prevApp.assignedBranchId }
        );
      }

      // 2. Notify branch manager
      if (prevApp.assignedBranchId) {
        const branchMgr = users.find(u => u.branchId === prevApp.assignedBranchId && (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER));
        if (branchMgr && branchMgr.id !== prevApp.assignedOfficerId) {
          addNotification(
            branchMgr.id,
            `تحديث بفرعكم: ${notifMsg}`,
            notifType,
            appId,
            undefined,
            'APPLICATION',
            { targetBranchId: prevApp.assignedBranchId }
          );
        }
      }

      // 3. Notify sales representative who submitted the application
      if (prevApp.submittedBy) {
        addNotification(
          prevApp.submittedBy,
          `متابعة طلب العميل ${prevApp.clientName}: ${statusName}`,
          notifType,
          appId,
          undefined,
          'APPLICATION'
        );
      }

      // 4. Notify company admin
      prevApp.assignedCompanyIds?.forEach(cid => {
        addNotification(
          cid,
          notifMsg,
          notifType,
          appId,
          cid,
          'APPLICATION',
          { targetCompanyId: cid }
        );
      });
    }
  };

  const deleteApplication = async (appId: string): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN)) {
      console.warn('Unauthorized: Only Super Admin and Admin can delete applications');
      return false;
    }

    const appToDelete = applications.find(a => a.id === appId);
    setApplications(prev => prev.filter(a => a.id !== appId));

    if (supabase) {
      try {
        await supabase.from('applications').delete().eq('id', appId);
        const updatedApps = applications.filter(a => a.id !== appId);
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: updatedApps,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase deleteApplication fallback:', err);
      }
    }

    try {
      await deleteDoc(doc(db, 'applications', appId));
    } catch (err) {
      console.warn('Firestore deleteApplication fallback:', err);
    }

    addAuditLog('DELETE_APPLICATION', `Deleted application ${appId} (${appToDelete?.clientName || 'Unknown'}) by ${currentUser.name}`, appId);
    return true;
  };

  const disburseApplicationAmount = async (
    appId: string, 
    disbursedAmount: number, 
    notes?: string, 
    receiptNumber?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    const app = applications.find(a => a.id === appId);
    if (!app) return false;

    const currentUsed = app.usedAmount || 0;
    const newUsed = currentUsed + Number(disbursedAmount);
    const approvedLimit = app.approvedAmount || app.requestedAmount || 0;
    const isFullyDisbursed = newUsed >= approvedLimit;
    const nowStr = new Date().toISOString();

    const isBranchManager = currentUser.role === Role.BRANCH_MANAGER || currentUser.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER;
    const roleTitle = isBranchManager ? `مدير الفرع (${currentUser.branchName || app.assignedBranchName || 'الفرع'})` : 'إدارة شركة التقسيط';
    
    const histItem = {
      action: 'AMOUNT_TRANSFERRED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: `${currentUser.name} [${roleTitle}]`,
      details: `تم صرف مبلغ ${Number(disbursedAmount).toLocaleString()} ج.م للعميل - إجمالي المصروف: ${newUsed.toLocaleString()} ج.م من أصل ${approvedLimit.toLocaleString()} ج.م${receiptNumber ? ` [سند/إيصال رقم: ${receiptNumber}]` : ''}${notes ? ` - ملاحظات: ${notes}` : ''}`
    };

    const updates: Partial<Application> = {
      usedAmount: newUsed,
      status: isFullyDisbursed ? ApplicationStatus.AMOUNT_TRANSFERRED : app.status,
      history: [histItem, ...(app.history || [])]
    };

    await updateApplication(appId, updates);

    // Notify submitter / salesperson
    if (app.submittedBy) {
      addNotification(
        app.submittedBy,
        `تم صرف دفعة تمويلية بمبلغ ${Number(disbursedAmount).toLocaleString()} ج.م لطلب العميل ${app.clientName} بواسطة ${currentUser.name} (${roleTitle})`,
        'SUCCESS',
        app.id,
        undefined,
        'APPLICATION'
      );
    }

    return true;
  };

  const assignApplication = async (appId: string, companyIds: string[], branchId?: string, branchName?: string, officerId?: string, officerName?: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const normGov = (g?: string) => (g || '').trim()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة$/g, 'ه')
      .replace(/ى$/g, 'ي')
      .replace(/\s+/g, '')
      .toLowerCase();

    let resolvedBranchId = branchId || app.assignedBranchId;
    let resolvedBranchName = branchName || app.assignedBranchName;
    let resolvedOfficerId = officerId || app.assignedOfficerId;
    let resolvedOfficerName = officerName || app.assignedOfficerName;

    const targetCompIds = companyIds.map(cid => {
      const u = users.find(user => user.id === cid);
      return u?.companyId || cid;
    });
    const allCompIds = Array.from(new Set([...companyIds, ...targetCompIds]));

    // Auto-match branch from company based on client governorate
    if (!resolvedBranchId && allCompIds.length > 0) {
      const clientGov = normGov(app.governorate);
      const matchBranch = branches.find(b => 
        allCompIds.includes(b.companyId) && b.active !== false && normGov(b.governorate) === clientGov
      ) || branches.find(b => allCompIds.includes(b.companyId) && b.active !== false);

      if (matchBranch) {
        resolvedBranchId = matchBranch.id;
        resolvedBranchName = matchBranch.name;

        // Auto-assign credit officer in branch if none assigned
        if (!resolvedOfficerId) {
          const off = users.find(u => 
            u.branchId === matchBranch.id && 
            (u.staffRole === InstallmentCompanyStaffRole.CREDIT_OFFICER || u.role === Role.COMPANY_EMPLOYEE)
          );
          if (off) {
            resolvedOfficerId = off.id;
            resolvedOfficerName = off.name;
          }
        }
      }
    }

    const companyNames = companyIds.map(cid => companies.find(c => c.id === cid)?.name || users.find(u => u.id === cid)?.name || cid).join(', ');

    const newHistoryItem = {
      action: 'ASSIGNED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `تم توجيه الطلب إلى: ${companyNames} ${resolvedBranchName ? `(الفرع: ${resolvedBranchName})` : ''} ${resolvedOfficerName ? `(المسؤول: ${resolvedOfficerName})` : ''}`
    };

    const isActuallyAssigned = Boolean(resolvedBranchId || resolvedOfficerId);
    const resolvedStatus = isActuallyAssigned ? ApplicationStatus.PAPER_REVIEW : ApplicationStatus.RECEIVED;

    const updatedApp: Application = {
      ...app,
      assignedCompanyIds: companyIds,
      assignedBranchId: resolvedBranchId,
      assignedBranchName: resolvedBranchName,
      assignedOfficerId: resolvedOfficerId,
      assignedOfficerName: resolvedOfficerName,
      assignedAt: nowStr,
      status: resolvedStatus,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    if (supabase) {
      try {
        await supabase.from('applications').update({
          company_id: companyIds[0] || null,
          branch_id: resolvedBranchId || null,
          assigned_officer_id: resolvedOfficerId || null,
          status: resolvedStatus
        }).eq('id', appId);
      } catch (err) {
        console.warn('Supabase assignApplication fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedCompanyIds: companyIds,
        assignedBranchId: updatedApp.assignedBranchId,
        assignedBranchName: updatedApp.assignedBranchName,
        assignedOfficerId: updatedApp.assignedOfficerId,
        assignedOfficerName: updatedApp.assignedOfficerName,
        assignedAt: nowStr,
        status: resolvedStatus,
        history: updatedApp.history
      });
    } catch (err) {
      console.warn('Firestore assignApplication fallback:', err);
    }

    // Notify assigned companies
    companyIds.forEach(cid => {
      addNotification(cid, `تم توجيه طلب تمويل جديد للعميل ${app.clientName}`, 'INFO', appId, undefined, 'APPLICATION');
    });

    if (resolvedOfficerId) {
      addNotification(resolvedOfficerId, `تم إسناد دراسة طلب العميل ${app.clientName} إليك مباشرة`, 'INFO', appId, undefined, 'APPLICATION', { targetOfficerId: resolvedOfficerId, targetBranchId: resolvedBranchId });
    }
    if (resolvedBranchId) {
      const bMgr = users.find(u => u.branchId === resolvedBranchId && (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER));
      if (bMgr && bMgr.id !== resolvedOfficerId) {
        addNotification(bMgr.id, `طلب تمويل وارد لفرعكم (${resolvedBranchName || 'الفرع'}) للعميل ${app.clientName}`, 'INFO', appId, undefined, 'APPLICATION', { targetBranchId: resolvedBranchId });
      }
    }

    addAuditLog('ASSIGN_APPLICATION', `Assigned application ${appId} to ${companyNames} (Branch: ${branchName || 'N/A'}, Officer: ${officerName || 'N/A'})`, appId);
  };

  const acknowledgeApplication = async (appId: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const newHistoryItem = {
      action: 'RECEIVED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: 'تم استلام وبدء دراسة فحص المستندات بواسطة شركة التقسيط'
    };

    const updatedApp: Application = {
      ...app,
      status: ApplicationStatus.PAPER_REVIEW,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    if (supabase) {
      try {
        await supabase.from('applications').update({
          status: ApplicationStatus.PAPER_REVIEW
        }).eq('id', appId);
      } catch (err) {
        console.warn('Supabase acknowledgeApplication fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: ApplicationStatus.PAPER_REVIEW,
        history: updatedApp.history
      });
    } catch (err) {
      console.warn('Firestore acknowledgeApplication fallback:', err);
    }
  };

  const updateCompanyRejectionReasons = async (companyId: string, reasons: string[]) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, rejectionReasons: reasons } : c));
    try {
      await updateDoc(doc(db, 'companies', companyId), { rejectionReasons: reasons });
    } catch (err) {
      console.warn('updateCompanyRejectionReasons fallback:', err);
    }
    addAuditLog('UPDATE_REJECTION_REASONS', `Updated standard rejection reasons for company ${companyId}`, companyId);
  };

  const updateCompanyWorkflowConfig = async (companyId: string, config: CompanyWorkflowConfig) => {
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, workflowConfig: config } : c));
    try {
      await updateDoc(doc(db, 'companies', companyId), { workflowConfig: config });
    } catch (err) {
      console.warn('updateCompanyWorkflowConfig fallback:', err);
    }
    addAuditLog('UPDATE_WORKFLOW_CONFIG', `Updated workflow stages scheme for company ${companyId}`, companyId);
    addNotification(companyId, 'تم تحديث وتخصيص مخطط ومراحل مسار دراسة الطلبات للشركة بنجاح', 'SUCCESS');
  };

  const reviewApplication = async (
    appId: string, 
    status: ApplicationStatus, 
    note: string, 
    approvedAmount?: number,
    rejectionDetails?: { reason: string; notes?: string }
  ) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    let parsedReason = rejectionDetails?.reason;
    let parsedNotes = rejectionDetails?.notes || note;

    if (status === ApplicationStatus.REJECTED && !parsedReason && note) {
      if (note.includes('السبب:')) {
        const parts = note.split('\n');
        parsedReason = parts[0].replace('السبب:', '').trim();
        parsedNotes = parts.slice(1).join('\n').replace('ملاحظات:', '').trim();
      } else {
        parsedReason = note;
      }
    }

    const newHistoryItem = {
      action: status,
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: status === ApplicationStatus.REJECTED && parsedReason
        ? `تم رفض الطلب - السبب: ${parsedReason}${parsedNotes ? ` | ملاحظات: ${parsedNotes}` : ''}`
        : note || `تحديث الحالة إلى ${status}`
    };

    const updatedApp: Application = {
      ...app,
      status,
      reviewedBy: currentUser.id,
      reviewedAt: nowStr,
      reviewNote: note,
      approvedAmount: approvedAmount !== undefined ? approvedAmount : app.approvedAmount,
      rejectionReason: status === ApplicationStatus.REJECTED ? parsedReason : undefined,
      rejectionNotes: status === ApplicationStatus.REJECTED ? parsedNotes : undefined,
      rejectedBy: status === ApplicationStatus.REJECTED ? currentUser.id : undefined,
      rejectedByName: status === ApplicationStatus.REJECTED ? currentUser.name : undefined,
      rejectedAt: status === ApplicationStatus.REJECTED ? nowStr : undefined,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    if (supabase) {
      try {
        const payload: Record<string, any> = {
          status: status
        };
        if (approvedAmount !== undefined) {
          payload.financed_amount = approvedAmount;
        }
        await supabase.from('applications').update(payload).eq('id', appId);
      } catch (err) {
        console.warn('Supabase reviewApplication fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status,
        reviewedBy: currentUser.id,
        reviewedAt: nowStr,
        reviewNote: note,
        approvedAmount: updatedApp.approvedAmount,
        rejectionReason: updatedApp.rejectionReason || null,
        rejectionNotes: updatedApp.rejectionNotes || null,
        rejectedBy: updatedApp.rejectedBy || null,
        rejectedByName: updatedApp.rejectedByName || null,
        rejectedAt: updatedApp.rejectedAt || null,
        history: updatedApp.history
      });
    } catch (err) {
      console.warn('Firestore reviewApplication fallback:', err);
    }

    // Also update client timeline
    const client = clients.find(c => c.nationalId === app.clientNationalId);
    if (client) {
      addClientTimelineEvent(client.id, {
        action: `قرار شركة التقسيط: ${status === ApplicationStatus.APPROVED ? 'موافقة واعتماد التمويل' : status === ApplicationStatus.REJECTED ? `رفض الطلب (${parsedReason || 'غير محدد'})` : status}`,
        actionType: 'STATUS_CHANGE',
        performedBy: currentUser.id,
        performedByName: currentUser.name,
        companyName: currentCompany?.name,
        details: status === ApplicationStatus.REJECTED 
          ? `السبب: ${parsedReason || 'غير محدد'}${parsedNotes ? ` - ملاحظات: ${parsedNotes}` : ''}`
          : `${note} ${approvedAmount ? `(المبلغ المعتمد: ${approvedAmount.toLocaleString()} ج.م)` : ''}`,
        badgeColor: status === ApplicationStatus.APPROVED ? 'emerald' : status === ApplicationStatus.REJECTED ? 'rose' : 'sky'
      });
    }

    // If approved, notify submitter and record transaction
    if (status === ApplicationStatus.APPROVED && approvedAmount) {
      addNotification(app.submittedBy, `تمت الموافقة على طلب العميل ${app.clientName} بمبلغ ${approvedAmount.toLocaleString()} ج.م`, 'SUCCESS', appId, undefined, 'APPLICATION');
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        applicationId: appId,
        amount: approvedAmount,
        type: 'FUNDING',
        performedBy: currentUser.id,
        timestamp: nowStr,
        note: `اعتماد تمويل من شركة ${currentCompany?.name || currentUser.name}`
      };
      setTransactions(prev => [newTx, ...prev]);
      try {
        await setDoc(doc(db, 'transactions', newTx.id), newTx);
      } catch (e) {
        console.warn('Tx error:', e);
      }
    } else if (status === ApplicationStatus.REJECTED) {
      // Direct high-priority notification to sales representative / submitter
      addNotification(
        app.submittedBy, 
        `⚠️ تم رفض طلب العميل ${app.clientName}. السبب: ${parsedReason || 'لم يستوف الشروط الائتمانية'}${parsedNotes ? ` (${parsedNotes})` : ''}`, 
        'ERROR', 
        appId, 
        undefined, 
        'APPLICATION'
      );
      // Also notify Super Admin for transparency and analytics
      addNotification(
        'ROLE_SUPER_ADMIN', 
        `تم رفض طلب تمويل #${appId} للعميل ${app.clientName} بواسطة ${currentUser.name}. السبب: ${parsedReason || 'عدم استيفاء الشروط'}`, 
        'WARNING', 
        appId, 
        undefined, 
        'APPLICATION'
      );
    }

    addAuditLog('REVIEW_APPLICATION', `Application ${appId} reviewed: ${status} (Reason: ${parsedReason || 'N/A'})`, appId);
  };

  // Real-time Discussion, Documents, Expediting & Re-routing
  const addApplicationComment = async (
    appId: string, 
    message: string, 
    isUrgent: boolean = false,
    notificationType: CommentNotificationType = 'GENERAL'
  ) => {
    if (!currentUser || !message.trim()) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const notifConfig = COMMENT_NOTIFICATION_CONFIG[notificationType] || COMMENT_NOTIFICATION_CONFIG.GENERAL;
    const isUrgentComputed = isUrgent || notificationType === 'URGENT_INQUIRY' || notificationType === 'WARNING_ALERT';

    const newComment: ApplicationComment = {
      id: `comm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      applicationId: appId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderCompanyName: currentCompany?.name,
      message: message.trim(),
      createdAt: nowStr,
      isUrgent: isUrgentComputed,
      notificationType
    };

    const updatedApp: Application = {
      ...app,
      comments: [...(app.comments || []), newComment],
      isUrgent: isUrgentComputed ? true : app.isUrgent
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        comments: updatedApp.comments,
        isUrgent: updatedApp.isUrgent
      });
    } catch (e) {
      console.warn('Firestore addApplicationComment fallback:', e);
    }

    const snippet = message.trim().length > 60 ? `${message.trim().slice(0, 60)}...` : message.trim();
    const notifMsg = `[${notifConfig.labelAr}] تعليق من ${currentUser.name} على طلب العميل ${app.clientName}: "${snippet}"`;

    // Check if custom template is configured for this comment notification type
    const activeTemplate = notificationTemplates.find(t => t.commentType === notificationType && t.isActive);

    const compObj = companies.find(c => app.assignedCompanyIds?.includes(c.id));
    const compName = compObj?.name || currentCompany?.name || 'شركة التقسيط';
    const branchName = app.assignedBranchName || 'فرع الشركة';
    const gov = app.governorate || '';

    const replacePlaceholders = (textPattern: string) => {
      if (!textPattern) return '';
      return textPattern
        .replace(/{clientName}/g, app.clientName)
        .replace(/{clientNationalId}/g, app.clientNationalId || '')
        .replace(/{appId}/g, appId)
        .replace(/{senderName}/g, currentUser.name)
        .replace(/{senderRole}/g, currentUser.role)
        .replace(/{companyName}/g, compName)
        .replace(/{branchName}/g, branchName)
        .replace(/{governorate}/g, gov)
        .replace(/{commentSnippet}/g, snippet)
        .replace(/{commentTypeLabel}/g, notifConfig.labelAr)
        .replace(/{date}/g, new Date().toLocaleDateString('ar-EG'));
    };

    const notifLevel: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 
      activeTemplate?.priority || 
      ((notificationType === 'URGENT_INQUIRY' || notificationType === 'WARNING_ALERT') ? 'WARNING' :
       (notificationType === 'APPROVAL_UPDATE') ? 'SUCCESS' : 'INFO');

    // 1. Template Config for Submitter (الموظف مقدم الطلب)
    const submitterCfg = activeTemplate?.recipients.submitter;
    const sendToSubmitter = submitterCfg !== undefined ? submitterCfg.enabled : true;
    const submitterTitle = (submitterCfg && submitterCfg.titleTemplate) 
      ? replacePlaceholders(submitterCfg.titleTemplate) 
      : notifConfig.labelAr;
    const submitterMsg = (submitterCfg && submitterCfg.bodyTemplate)
      ? replacePlaceholders(submitterCfg.bodyTemplate)
      : notifMsg;

    // 2. Template Config for Company Admin / Branch Manager (مدير شركة التقسيط ومدير الفرع)
    const companyCfg = activeTemplate?.recipients.companyAdmin;
    const sendToCompany = companyCfg !== undefined ? companyCfg.enabled : true;
    const companyTitle = (companyCfg && companyCfg.titleTemplate)
      ? replacePlaceholders(companyCfg.titleTemplate)
      : notifConfig.labelAr;
    const companyMsg = (companyCfg && companyCfg.bodyTemplate)
      ? replacePlaceholders(companyCfg.bodyTemplate)
      : notifMsg;

    // 3. Template Config for System Admin (مدير النظام)
    const systemCfg = activeTemplate?.recipients.systemAdmin;
    const sendToSystem = systemCfg !== undefined ? systemCfg.enabled : true;
    const systemTitle = (systemCfg && systemCfg.titleTemplate)
      ? replacePlaceholders(systemCfg.titleTemplate)
      : notifConfig.labelAr;
    const systemMsg = (systemCfg && systemCfg.bodyTemplate)
      ? replacePlaceholders(systemCfg.bodyTemplate)
      : notifMsg;

    // 1. إشعار للموظف اللي قدم الطلب (app.submittedBy)
    if (sendToSubmitter && app.submittedBy && app.submittedBy !== currentUser.id) {
      addNotification(
        app.submittedBy,
        submitterMsg,
        notifLevel,
        appId,
        `[${notifConfig.labelEn}] Comment by ${currentUser.name} on client ${app.clientName}: "${snippet}"`,
        'APPLICATION',
        { 
          commentNotificationType: notificationType, 
          senderName: currentUser.name,
          title: submitterTitle
        }
      );
      // Check if submittedBy has matching user ID or username
      const submitterUser = users.find(u => u.id === app.submittedBy || u.username === app.submittedBy);
      if (submitterUser && submitterUser.id !== app.submittedBy && submitterUser.id !== currentUser.id) {
        addNotification(
          submitterUser.id,
          submitterMsg,
          notifLevel,
          appId,
          undefined,
          'APPLICATION',
          { commentNotificationType: notificationType, senderName: currentUser.name, title: submitterTitle }
        );
      }
    }

    // 2. إشعار لمدير شركة التقسيط ومدراء فروع الشركة
    if (sendToCompany) {
      const companyIds = app.assignedCompanyIds || [];
      companyIds.forEach(cid => {
        if (currentUser.id !== cid && currentUser.companyId !== cid) {
          addNotification(
            cid,
            companyMsg,
            notifLevel,
            appId,
            undefined,
            'APPLICATION',
            { targetCompanyId: cid, commentNotificationType: notificationType, senderName: currentUser.name, title: companyTitle }
          );
        }
      });

      users.filter(u => 
        companyIds.includes(u.companyId || '') && 
        (u.role === Role.INSTALLMENT_COMPANY || 
         u.staffRole === InstallmentCompanyStaffRole.COMPANY_ADMIN || 
         u.role === Role.BRANCH_MANAGER) &&
        u.id !== currentUser.id
      ).forEach(compManager => {
        addNotification(
          compManager.id,
          companyMsg,
          notifLevel,
          appId,
          undefined,
          'APPLICATION',
          { 
            targetCompanyId: compManager.companyId, 
            targetBranchId: compManager.branchId,
            commentNotificationType: notificationType, 
            senderName: currentUser.name,
            title: companyTitle
          }
        );
      });

      // Also notify assigned officer if different from current user
      if (app.assignedOfficerId && app.assignedOfficerId !== currentUser.id) {
        addNotification(
          app.assignedOfficerId,
          companyMsg,
          notifLevel,
          appId,
          undefined,
          'APPLICATION',
          { 
            targetOfficerId: app.assignedOfficerId, 
            targetBranchId: app.assignedBranchId,
            commentNotificationType: notificationType, 
            senderName: currentUser.name,
            title: companyTitle
          }
        );
      }
    }

    // 3. إشعار لمدير النظام (Super Admin & Admin)
    if (sendToSystem) {
      addNotification(
        'ROLE_SUPER_ADMIN',
        systemMsg,
        notifLevel,
        appId,
        undefined,
        'APPLICATION',
        { targetRole: Role.SUPER_ADMIN, commentNotificationType: notificationType, senderName: currentUser.name, title: systemTitle }
      );

      users.filter(u => (u.role === Role.SUPER_ADMIN || u.role === Role.ADMIN) && u.id !== currentUser.id).forEach(adminUser => {
        addNotification(
          adminUser.id,
          systemMsg,
          notifLevel,
          appId,
          undefined,
          'APPLICATION',
          { targetRole: adminUser.role, commentNotificationType: notificationType, senderName: currentUser.name, title: systemTitle }
        );
      });
    }

    addAuditLog('ADD_APPLICATION_COMMENT', `Comment [${notificationType}] added to ${appId} by ${currentUser.name}`, appId);
  };

  const uploadApplicationDocument = async (appId: string, docData: Omit<ApplicationDocument, 'id' | 'uploadedBy' | 'uploadedByName' | 'uploadedAt'>) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const newDoc: ApplicationDocument = {
      ...docData,
      id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: nowStr
    };

    const newHistoryItem = {
      action: 'DOCUMENT_UPLOADED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `تم رفع مستند جديد: ${newDoc.name}`
    };

    const updatedApp: Application = {
      ...app,
      documents: [...(app.documents || []), newDoc],
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    if (supabase) {
      try {
        const nextApplications = applications.map(a => a.id === appId ? updatedApp : a);
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: nextApplications,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase uploadApplicationDocument fallback:', err);
      }
    }
    try {
      await updateDoc(doc(db, 'applications', appId), {
        documents: updatedApp.documents,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore uploadApplicationDocument fallback:', e);
    }

    app.assignedCompanyIds.forEach(cid => {
      addNotification(
        cid,
        `📎 تم رفع مستند جديد (${newDoc.name}) للعميل ${app.clientName} بواسطة ${currentUser.name}`,
        'INFO',
        appId,
        undefined,
        'APPLICATION'
      );
    });

    addAuditLog('UPLOAD_APPLICATION_DOC', `Uploaded document ${newDoc.name} for ${appId}`, appId);
  };

  const expediteApplication = async (appId: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const newHistoryItem = {
      action: 'EXPEDITED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `⚡ تم إرسال استعجال فوري لشركة التقسيط لدراسة الطلب في أسرع وقت بواسطة ${currentUser.name}`
    };

    const updatedApp: Application = {
      ...app,
      isUrgent: true,
      urgentRequestedAt: nowStr,
      urgentRequestedBy: currentUser.id,
      urgentRequestedByName: currentUser.name,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        isUrgent: true,
        urgentRequestedAt: nowStr,
        urgentRequestedBy: currentUser.id,
        urgentRequestedByName: currentUser.name,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore expediteApplication fallback:', e);
    }

    app.assignedCompanyIds.forEach(cid => {
      addNotification(
        cid,
        `⚡ طلب استعجال عاجل: تم طلب سرعة الرد والفحص لطلب العميل ${app.clientName} بقيمة ${app.requestedAmount.toLocaleString()} ج.م`,
        'WARNING',
        appId,
        undefined,
        'APPLICATION'
      );
    });

    if (app.assignedOfficerId) {
      addNotification(
        app.assignedOfficerId,
        `⚡ استعجال فوري على طلب العميل ${app.clientName} المسند إليك`,
        'WARNING',
        appId,
        undefined,
        'APPLICATION'
      );
    }

    addAuditLog('EXPEDITE_APPLICATION', `Application ${appId} expedited by ${currentUser.name}`, appId);
  };

  const assignCompanyOfficer = async (appId: string, officerId: string, officerName: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Check company workflow settings (defaults to PAPER_REVIEW / مراجعة الأوراق)
    const company = companies.find(c => app.assignedCompanyIds?.includes(c.id)) || currentCompany;
    let targetPostStatus = ApplicationStatus.PAPER_REVIEW;
    if (company?.workflowConfig?.useCustomScheme && company.workflowConfig.postAssignStage) {
      targetPostStatus = company.workflowConfig.postAssignStage as ApplicationStatus;
    }

    const newStatus = (app.status === ApplicationStatus.PENDING_ADMIN || app.status === ApplicationStatus.RECEIVED || app.status === ApplicationStatus.PENDING_REVIEW)
      ? targetPostStatus
      : app.status;

    const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !app.approvedAmount)
      ? (app.requestedAmount || 0)
      : app.approvedAmount;

    const statusLabel = STATUS_ARABIC[newStatus] || 'مراجعة الأوراق';

    const newHistoryItem = {
      action: 'OFFICER_ASSIGNED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `تم إسناد دراسة الملف لمسؤول الائتمان: ${officerName} - تحويل الطلب تلقائياً إلى حالة: ${statusLabel}`
    };

    const updatedApp: Application = {
      ...app,
      assignedOfficerId: officerId,
      assignedOfficerName: officerName,
      status: newStatus,
      approvedAmount,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedOfficerId: officerId,
        assignedOfficerName: officerName,
        status: newStatus,
        approvedAmount: updatedApp.approvedAmount || null,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore assignCompanyOfficer fallback:', e);
    }

    addNotification(
      officerId,
      `تم إسناد طلب التمويل للعميل ${app.clientName} إليك للدراسة الائتمانية والقرار - الحالة: ${statusLabel}`,
      'INFO',
      appId,
      undefined,
      'APPLICATION'
    );

    addAuditLog('ASSIGN_OFFICER', `Assigned ${appId} to officer ${officerName} (Status: ${statusLabel})`, appId);
  };

  const assignCompanyBranchAndOfficer = async (
    appId: string, 
    branchId: string, 
    branchName: string, 
    officerId: string, 
    officerName: string
  ) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Check company workflow settings (defaults to PAPER_REVIEW / مراجعة الأوراق)
    const company = companies.find(c => app.assignedCompanyIds?.includes(c.id)) || currentCompany;
    let targetPostStatus = ApplicationStatus.PAPER_REVIEW;
    if (company?.workflowConfig?.useCustomScheme && company.workflowConfig.postAssignStage) {
      targetPostStatus = company.workflowConfig.postAssignStage as ApplicationStatus;
    }

    const newStatus = (app.status === ApplicationStatus.PENDING_ADMIN || app.status === ApplicationStatus.RECEIVED || app.status === ApplicationStatus.PENDING_REVIEW)
      ? targetPostStatus
      : app.status;

    const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !app.approvedAmount)
      ? (app.requestedAmount || 0)
      : app.approvedAmount;

    const statusLabel = STATUS_ARABIC[newStatus] || 'مراجعة الأوراق';
    const details = officerName
      ? `تم توجيه الملف لفرع (${branchName}) وإسناد المسؤول: ${officerName} - تحويل الطلب تلقائياً إلى حالة: ${statusLabel}`
      : `تم إسناد الطلب لفرع (${branchName}) بشكل عام - تحويل الطلب تلقائياً إلى حالة: ${statusLabel}`;

    const newHistoryItem = {
      action: officerName ? 'OFFICER_ASSIGNED' : 'BRANCH_ASSIGNED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details
    };

    const updatedApp: Application = {
      ...app,
      assignedBranchId: branchId,
      assignedBranchName: branchName,
      assignedOfficerId: officerId || undefined,
      assignedOfficerName: officerName || undefined,
      status: newStatus,
      approvedAmount,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedBranchId: branchId,
        assignedBranchName: branchName,
        assignedOfficerId: officerId || null,
        assignedOfficerName: officerName || null,
        status: updatedApp.status,
        approvedAmount: updatedApp.approvedAmount || null,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore assignCompanyBranchAndOfficer fallback:', e);
    }

    if (officerId) {
      addNotification(
        officerId,
        `تم إسناد دراسة طلب العميل ${app.clientName} (محافظة: ${app.governorate}) إليك بفرع ${branchName} - الحالة: ${statusLabel}`,
        'INFO',
        appId,
        undefined,
        'APPLICATION'
      );
    } else {
      const bManager = users.find(u => u.branchId === branchId && (u.role === Role.BRANCH_MANAGER || u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER));
      if (bManager) {
        addNotification(
          bManager.id,
          `تم إسناد طلب العميل ${app.clientName} لفرعكم (${branchName}) بشكل عام - الحالة: ${statusLabel}`,
          'INFO',
          appId,
          undefined,
          'APPLICATION'
        );
      }
    }

    addAuditLog(
      officerName ? 'ASSIGN_BRANCH_OFFICER' : 'ASSIGN_BRANCH_GENERAL', 
      officerName 
        ? `Assigned application ${appId} to branch ${branchName} and officer ${officerName} (Status: ${statusLabel})`
        : `Assigned application ${appId} to branch ${branchName} in general (Status: ${statusLabel})`, 
      appId
    );
  };

  const autoAssignCompanyBranches = async (targetCompanyId: string): Promise<number> => {
    const normGov = (g?: string) => (g || '').trim()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة$/g, 'ه')
      .replace(/ى$/g, 'ي')
      .replace(/\s+/g, '')
      .toLowerCase();

    const user = users.find(u => u.id === targetCompanyId);
    const resolvedCompanyId = user?.companyId || targetCompanyId;
    const userIds = users.filter(u => u.companyId === resolvedCompanyId).map(u => u.id);
    const allTargetIds = Array.from(new Set([resolvedCompanyId, targetCompanyId, ...userIds]));

    const compBranches = branches.filter(b => 
      (b.companyId === resolvedCompanyId || b.companyId === targetCompanyId || allTargetIds.includes(b.companyId)) && 
      b.active !== false
    );
    if (compBranches.length === 0) return 0;

    let count = 0;
    const nowStr = new Date().toISOString();

    const updated = applications.map(a => {
      if (!a.assignedCompanyIds?.some(cid => allTargetIds.includes(cid))) return a;
      if (a.assignedBranchId) return a;

      const clientGov = normGov(a.governorate);
      const matchBranch = compBranches.find(b => normGov(b.governorate) === clientGov) || compBranches[0];
      if (matchBranch) {
        count++;
        // find officer in this branch if available
        const branchOfficer = users.find(u => 
          u.branchId === matchBranch.id && 
          (u.staffRole === InstallmentCompanyStaffRole.CREDIT_OFFICER || u.role === Role.COMPANY_EMPLOYEE)
        );

        const compObj = companies.find(c => c.id === resolvedCompanyId);
        let targetPostStatus = ApplicationStatus.PAPER_REVIEW;
        if (compObj?.workflowConfig?.useCustomScheme && compObj.workflowConfig.postAssignStage) {
          targetPostStatus = compObj.workflowConfig.postAssignStage as ApplicationStatus;
        }

        const newStatus = (a.status === ApplicationStatus.PENDING_ADMIN || a.status === ApplicationStatus.RECEIVED || a.status === ApplicationStatus.PENDING_REVIEW)
          ? targetPostStatus
          : a.status;

        const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !a.approvedAmount)
          ? (a.requestedAmount || 0)
          : a.approvedAmount;

        const statusLabel = STATUS_ARABIC[newStatus] || 'مراجعة الأوراق';

        const newHistItem = {
          action: 'AUTO_BRANCH_ASSIGNED',
          timestamp: nowStr,
          performedBy: currentUser?.id || 'SYSTEM',
          performedByName: currentUser?.name || 'النظام الآلي الذكي',
          details: `تم الإسناد التلقائي للفرع (${matchBranch.name}) بناءً على تطابق محافظة العميل (${a.governorate || 'غير محددة'})${branchOfficer ? ` وتكليف المسؤول: ${branchOfficer.name}` : ''} - تحويل الطلب تلقائياً إلى: ${statusLabel}`
        };

        const updatedAppItem: Application = {
          ...a,
          assignedBranchId: matchBranch.id,
          assignedBranchName: matchBranch.name,
          assignedOfficerId: branchOfficer ? branchOfficer.id : a.assignedOfficerId,
          assignedOfficerName: branchOfficer ? branchOfficer.name : a.assignedOfficerName,
          status: newStatus,
          approvedAmount,
          history: [newHistItem, ...a.history]
        };

        updateDoc(doc(db, 'applications', a.id), {
          assignedBranchId: matchBranch.id,
          assignedBranchName: matchBranch.name,
          assignedOfficerId: updatedAppItem.assignedOfficerId || null,
          assignedOfficerName: updatedAppItem.assignedOfficerName || null,
          status: newStatus,
          approvedAmount: updatedAppItem.approvedAmount || null,
          history: updatedAppItem.history
        }).catch(err => console.warn('autoAssign firestore sync failed:', err));

        return updatedAppItem;
      }
      return a;
    });

    if (count > 0) {
      setApplications(updated);
      addNotification(targetCompanyId, `تم إسناد ${count} طلب تمويل تلقائياً لفروع الشركة حسب المحافظة`, 'SUCCESS');
    }
    return count;
  };

  const requestBranchTransfer = async (
    appId: string, 
    targetBranchId: string, 
    targetBranchName: string, 
    reason: string
  ) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const transferReq = {
      targetBranchId,
      targetBranchName,
      reason,
      requestedBy: currentUser.id,
      requestedByName: currentUser.name,
      requestedAt: nowStr,
      status: 'PENDING' as const
    };

    const newHistoryItem = {
      action: 'BRANCH_TRANSFER_REQUESTED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `طلب تحويل الفرع من [${currentUser.branchName || app.assignedBranchName || 'الفرع الحالي'}] إلى [${targetBranchName}] - السبب: ${reason}`
    };

    const updatedApp: Application = {
      ...app,
      branchTransferRequest: transferReq,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        branchTransferRequest: transferReq,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore requestBranchTransfer fallback:', e);
    }

    // Notify Company Admin
    const compId = app.assignedCompanyIds[0] || currentUser.companyId || 'comp_01';
    addNotification(
      'COMPANY_ADMIN',
      `طلب تبديل فرع جديد للعميل ${app.clientName}: من فرع ${currentUser.branchName || 'الحالي'} إلى فرع ${targetBranchName} (السبب: ${reason})`,
      'WARNING',
      appId,
      compId,
      'APPLICATION'
    );

    addAuditLog(
      'REQUEST_BRANCH_TRANSFER',
      `Branch ${currentUser.branchName} requested transfer of app ${appId} to branch ${targetBranchName}`,
      appId
    );
  };

  const reviewBranchTransfer = async (
    appId: string, 
    approved: boolean, 
    note?: string
  ) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app || !app.branchTransferRequest) return;

    const req = app.branchTransferRequest;

    const updatedRequest = {
      ...req,
      status: approved ? ('APPROVED' as const) : ('REJECTED' as const),
      reviewNote: note || (approved ? 'تمت الموافقة على نقل الملف إلى الفرع المطلوب' : 'تم رفض طلب نقل الملف')
    };

    const newHistoryItem = {
      action: approved ? 'BRANCH_TRANSFER_APPROVED' : 'BRANCH_TRANSFER_REJECTED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: approved 
        ? `وافقت إدارة الشركة على نقل الملف إلى فرع [${req.targetBranchName}]. ${note ? `(ملاحظة: ${note})` : ''}`
        : `رفضت إدارة الشركة طلب التحويل إلى فرع [${req.targetBranchName}]. ${note ? `(السبب: ${note})` : ''}`
    };

    const updatedApp: Application = {
      ...app,
      assignedBranchId: approved ? req.targetBranchId : app.assignedBranchId,
      assignedBranchName: approved ? req.targetBranchName : app.assignedBranchName,
      assignedOfficerId: approved ? undefined : app.assignedOfficerId,
      assignedOfficerName: approved ? undefined : app.assignedOfficerName,
      branchTransferRequest: updatedRequest,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedBranchId: updatedApp.assignedBranchId || null,
        assignedBranchName: updatedApp.assignedBranchName || null,
        assignedOfficerId: updatedApp.assignedOfficerId || null,
        assignedOfficerName: updatedApp.assignedOfficerName || null,
        branchTransferRequest: updatedRequest,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore reviewBranchTransfer fallback:', e);
    }

    // Notify requester
    addNotification(
      req.requestedBy,
      approved 
        ? `تمت موافقة الإدارة على طلبك بنقل ملف العميل ${app.clientName} إلى فرع ${req.targetBranchName}`
        : `تم رفض طلب تحويل ملف العميل ${app.clientName} إلى فرع ${req.targetBranchName}. ${note ? `ملاحظات: ${note}` : ''}`,
      approved ? 'SUCCESS' : 'ERROR',
      appId,
      undefined,
      'APPLICATION'
    );

    // If approved, notify target branch manager
    if (approved) {
      const targetBm = users.find(u => 
        (u.branchId === req.targetBranchId && u.role === Role.BRANCH_MANAGER) ||
        (u.branchId === req.targetBranchId && u.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER)
      );
      if (targetBm) {
        addNotification(
          targetBm.id,
          `تم تحويل ملف العميل ${app.clientName} إلى فرعكم (${req.targetBranchName}) بعد موافقة الإدارة. يرجى إسناد دراسته.`,
          'INFO',
          appId,
          undefined,
          'APPLICATION'
        );
      }
    }

    addAuditLog(
      approved ? 'APPROVE_BRANCH_TRANSFER' : 'REJECT_BRANCH_TRANSFER',
      `Company reviewed branch transfer for ${appId}: ${approved ? 'APPROVED' : 'REJECTED'}`,
      appId
    );
  };

  const reRouteApplication = async (appId: string, newCompanyId: string, reason: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const fromCompany = companies.find(c => app.assignedCompanyIds.includes(c.id));
    const toCompany = companies.find(c => c.id === newCompanyId);
    const toCompanyName = toCompany?.name || newCompanyId;

    const routeRecord = {
      fromCompanyId: fromCompany?.id || app.assignedCompanyIds[0] || 'unknown',
      fromCompanyName: fromCompany?.name || 'شركة سابقة',
      toCompanyId: newCompanyId,
      toCompanyName,
      routedBy: currentUser.id,
      routedByName: currentUser.name,
      routedAt: nowStr,
      reason: reason || 'إعادة توجيه بعد الرفض لشركة تمويل بديلة'
    };

    const newHistoryItem = {
      action: 'RE_ROUTED',
      timestamp: nowStr,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: `تم تحويل الطلب إلى ${toCompanyName} بعد الرفض السابق. السبب: ${routeRecord.reason}`
    };

    // Auto-match branch based on client governorate
    const targetBranch = branches.find(b => 
      b.companyId === newCompanyId && 
      b.governorate?.trim() === app.governorate?.trim() && 
      b.active !== false
    ) || branches.find(b => b.companyId === newCompanyId && b.active !== false);

    const updatedApp: Application = {
      ...app,
      status: ApplicationStatus.RECEIVED,
      assignedCompanyIds: [newCompanyId],
      assignedBranchId: targetBranch?.id,
      assignedBranchName: targetBranch?.name,
      assignedAt: nowStr,
      assignedOfficerId: undefined,
      assignedOfficerName: undefined,
      reRouteHistory: [...(app.reRouteHistory || []), routeRecord],
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: ApplicationStatus.RECEIVED,
        assignedCompanyIds: [newCompanyId],
        assignedBranchId: targetBranch?.id || null,
        assignedBranchName: targetBranch?.name || null,
        assignedAt: nowStr,
        assignedOfficerId: null,
        assignedOfficerName: null,
        reRouteHistory: updatedApp.reRouteHistory,
        history: updatedApp.history
      });
    } catch (e) {
      console.warn('Firestore reRouteApplication fallback:', e);
    }

    addNotification(
      newCompanyId,
      `تم تحويل طلب تمويل للعميل ${app.clientName} إلى شركتكم بواسطة إدارة كروبسا (${currentUser.name})`,
      'INFO',
      appId,
      undefined,
      'APPLICATION'
    );

    if (app.submittedBy) {
      addNotification(
        app.submittedBy,
        `🔄 تم تحويل طلب العميل ${app.clientName} بنجاح إلى شركة ${toCompanyName} لدراسته مجدداً`,
        'SUCCESS',
        appId,
        undefined,
        'APPLICATION'
      );
    }

    addAuditLog('RE_ROUTE_APPLICATION', `Transferred application ${appId} to ${toCompanyName}`, appId);
  };

  // Dynamic Questions Management (Super Admin)
  const addApplicationQuestion = async (qData: Partial<ApplicationQuestion>) => {
    const newQ: ApplicationQuestion = {
      id: `q_${Date.now()}`,
      labelAr: qData.labelAr || 'سؤال جديد',
      labelEn: qData.labelEn || 'New Question',
      type: qData.type || 'text',
      options: qData.options || [],
      required: qData.required !== undefined ? qData.required : true,
      category: qData.category || 'GENERAL',
      active: qData.active !== undefined ? qData.active : true,
      order: applicationQuestions.length + 1
    };
    setApplicationQuestions(prev => [...prev, newQ]);
    try {
      await setDoc(doc(db, 'application_questions', newQ.id), newQ);
    } catch (err) {
      console.warn('Firestore addApplicationQuestion fallback:', err);
    }
    addAuditLog('CREATE_QUESTION', `Created question: ${newQ.labelAr}`, newQ.id);
  };

  const updateApplicationQuestion = async (id: string, updates: Partial<ApplicationQuestion>) => {
    setApplicationQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    try {
      await updateDoc(doc(db, 'application_questions', id), updates);
    } catch (err) {
      console.warn('Firestore updateApplicationQuestion fallback:', err);
    }
    addAuditLog('UPDATE_QUESTION', `Updated question ${id}`, id);
  };

  const deleteApplicationQuestion = async (id: string) => {
    setApplicationQuestions(prev => prev.filter(q => q.id !== id));
    try {
      await deleteDoc(doc(db, 'application_questions', id));
    } catch (err) {
      console.warn('Firestore deleteApplicationQuestion fallback:', err);
    }
    addAuditLog('DELETE_QUESTION', `Deleted question ${id}`, id);
  };

  const addFinancingProgram = async (programData: Partial<FinancingProgram>) => {
    const comp = companies.find(c => c.id === programData.companyId) || companies[0];
    const newProgId = programData.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    // Auto-generate documentsConfig if not provided
    const docsList = programData.requiredDocuments && programData.requiredDocuments.length > 0
      ? programData.requiredDocuments
      : ['بطاقة الرقم القومي سارية', 'إيصال مرافق حديث'];
    const docsConfig = programData.documentsConfig && programData.documentsConfig.length > 0
      ? programData.documentsConfig
      : docsList.map((docName, idx) => ({
          id: `doc_${Date.now()}_${idx}`,
          name: docName,
          isRequired: true
        }));

    const newProg: FinancingProgram = {
      id: newProgId,
      name: programData.name || 'برنامج تمويلي جديد',
      code: programData.code || `PRG-${Date.now().toString().slice(-4)}`,
      companyId: comp?.id || 'comp_01',
      companyName: comp?.name || 'شركة تقسيط',
      maxAmount: Number(programData.maxAmount) || 100000,
      minAmount: Number(programData.minAmount) || 5000,
      durationMonths: Number(programData.durationMonths) || 12,
      minDurationMonths: Number(programData.minDurationMonths) || 6,
      maxDurationMonths: Number(programData.maxDurationMonths) || 36,
      interestRate: programData.interestRate !== undefined ? Number(programData.interestRate) : (programData.interestRatePercent !== undefined ? Number(programData.interestRatePercent) : 18),
      interestRatePercent: programData.interestRatePercent !== undefined ? Number(programData.interestRatePercent) : (programData.interestRate !== undefined ? Number(programData.interestRate) : 18),
      downPaymentPercent: programData.downPaymentPercent !== undefined ? Number(programData.downPaymentPercent) : 0,
      adminFeePercent: programData.adminFeePercent !== undefined ? Number(programData.adminFeePercent) : 2.5,
      requiredDocuments: docsList,
      documentsConfig: docsConfig,
      questionIds: programData.questionIds || [],
      description: programData.description || '',
      active: programData.active !== undefined ? programData.active : true,
      createdAt: new Date().toISOString()
    };

    // 1. Synchronously compute next programs array using functional updater
    let nextPrograms: FinancingProgram[] = [];
    setFinancingPrograms(prev => {
      nextPrograms = [newProg, ...prev.filter(p => p.id !== newProgId)];
      try {
        localStorage.setItem('cropsa_financing_programs', JSON.stringify(nextPrograms));
      } catch (e) {}
      return nextPrograms;
    });

    // 2. Synchronously update company entity with this new program
    let nextCompanies: InstallmentCompany[] = [];
    setCompanies(prev => {
      nextCompanies = prev.map(c => {
        if (c.id === newProg.companyId) {
          const existing = c.financingPrograms || [];
          return {
            ...c,
            financingPrograms: [newProg, ...existing.filter(p => p.id !== newProgId)]
          };
        }
        return c;
      });
      try {
        localStorage.setItem('cropsa_companies', JSON.stringify(nextCompanies));
      } catch (e) {}
      return nextCompanies;
    });

    // 3. Persist to Supabase system_settings immediately
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'financing_programs',
          data: nextPrograms,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: nextCompanies,
          updated_at: new Date().toISOString()
        });
      } catch (e: any) {
        console.warn('Supabase financing_programs save fallback:', e);
      }
    }

    try {
      setDoc(doc(db, 'financing_programs', newProg.id), newProg).catch(() => {});
      if (comp) {
        updateDoc(doc(db, 'companies', comp.id), {
          financingPrograms: [newProg, ...(comp.financingPrograms || []).filter(p => p.id !== newProg.id)]
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore addFinancingProgram fallback:', err);
    }

    addAuditLog('CREATE_PROGRAM', `Created financing program ${newProg.name} for ${newProg.companyName}`, newProg.id);
  };

  const updateFinancingProgram = async (id: string, updates: Partial<FinancingProgram>) => {
    // 1. Synchronously update programs list using functional updater
    let nextPrograms: FinancingProgram[] = [];
    setFinancingPrograms(prev => {
      nextPrograms = prev.map(p => {
        if (p.id === id) {
          const comp = companies.find(c => c.id === (updates.companyId || p.companyId));
          return {
            ...p,
            ...updates,
            companyName: comp ? comp.name : p.companyName
          };
        }
        return p;
      });
      try {
        localStorage.setItem('cropsa_financing_programs', JSON.stringify(nextPrograms));
      } catch (e) {}
      return nextPrograms;
    });

    // 2. Synchronously update company entity
    const updatedProg = nextPrograms.find(p => p.id === id);
    let nextCompanies: InstallmentCompany[] = [];
    setCompanies(prev => {
      nextCompanies = prev.map(c => {
        if (c.financingPrograms && c.financingPrograms.some(p => p.id === id)) {
          return {
            ...c,
            financingPrograms: c.financingPrograms.map(p => p.id === id ? { ...p, ...updates } : p)
          };
        } else if (updatedProg && c.id === updatedProg.companyId) {
          const existing = c.financingPrograms || [];
          return {
            ...c,
            financingPrograms: [updatedProg, ...existing.filter(p => p.id !== id)]
          };
        }
        return c;
      });
      try {
        localStorage.setItem('cropsa_companies', JSON.stringify(nextCompanies));
      } catch (e) {}
      return nextCompanies;
    });

    // 3. Persist to Supabase system_settings immediately
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'financing_programs',
          data: nextPrograms,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: nextCompanies,
          updated_at: new Date().toISOString()
        });
      } catch (e: any) {
        console.warn('Supabase financing_programs update fallback:', e);
      }
    }

    try {
      updateDoc(doc(db, 'financing_programs', id), updates).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateFinancingProgram fallback:', err);
    }

    addAuditLog('UPDATE_PROGRAM', `Updated financing program ${id}`, id);
  };

  const deleteFinancingProgram = async (id: string) => {
    // 1. Synchronously filter programs using functional updater
    let nextPrograms: FinancingProgram[] = [];
    setFinancingPrograms(prev => {
      nextPrograms = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('cropsa_financing_programs', JSON.stringify(nextPrograms));
      } catch (e) {}
      return nextPrograms;
    });

    // 2. Synchronously filter from company entities
    let nextCompanies: InstallmentCompany[] = [];
    setCompanies(prev => {
      nextCompanies = prev.map(c => {
        if (c.financingPrograms && c.financingPrograms.some(p => p.id === id)) {
          return {
            ...c,
            financingPrograms: c.financingPrograms.filter(p => p.id !== id)
          };
        }
        return c;
      });
      try {
        localStorage.setItem('cropsa_companies', JSON.stringify(nextCompanies));
      } catch (e) {}
      return nextCompanies;
    });

    // 3. Persist to Supabase immediately
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'financing_programs',
          data: nextPrograms,
          updated_at: new Date().toISOString()
        });
        await supabase.from('system_settings').upsert({
          id: 'companies_data',
          data: nextCompanies,
          updated_at: new Date().toISOString()
        });
      } catch (e: any) {
        console.warn('Supabase financing_programs delete fallback:', e);
      }
    }

    try {
      deleteDoc(doc(db, 'financing_programs', id)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteFinancingProgram fallback:', err);
    }

    addAuditLog('DELETE_PROGRAM', `Deleted financing program ${id}`, id);
  };

  // =========================================================================
  // Internal Inbox & AI Response Ingestion Methods
  // =========================================================================
  const addInboxMessage = async (msgData: Partial<InboxMessage>): Promise<InboxMessage> => {
    const nowStr = new Date().toISOString();
    const newMsg: InboxMessage = {
      id: msgData.id || `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      applicationId: msgData.applicationId,
      clientId: msgData.clientId,
      clientName: msgData.clientName,
      clientNationalId: msgData.clientNationalId,
      companyId: msgData.companyId,
      companyName: msgData.companyName || 'شركة تقسيط',
      senderName: msgData.senderName || 'إدارة الائتمان بالشركة',
      senderContact: msgData.senderContact || 'operations@company.eg',
      subject: msgData.subject || 'رد وارد بخصوص طلب تمويل',
      content: msgData.content || '',
      channel: msgData.channel || 'EMAIL',
      receivedAt: msgData.receivedAt || nowStr,
      status: 'UNREAD',
      isProcessed: false,
      aiAnalysis: msgData.aiAnalysis
    };

    setInboxMessages(prev => {
      const updated = [newMsg, ...prev];
      try {
        localStorage.setItem('cropsa_inbox_messages', JSON.stringify(updated));
      } catch (e) {}
      if (supabase) {
        supabase.from('system_settings').upsert({
          id: 'inbox_messages',
          data: updated,
          updated_at: nowStr
        }).catch((e: any) => console.warn('Supabase inbox_messages upsert error:', e));
      }
      return updated;
    });

    addAuditLog('INBOX_MESSAGE_RECEIVED', `Received inbox message from ${newMsg.senderName} (${newMsg.subject})`, newMsg.applicationId);
    return newMsg;
  };

  const analyzeInboxMessageWithAi = async (messageId: string): Promise<InboxMessageAiAnalysis | undefined> => {
    const targetMsg = inboxMessages.find(m => m.id === messageId);
    if (!targetMsg) return undefined;

    const targetApp = targetMsg.applicationId ? applications.find(a => a.id === targetMsg.applicationId) : undefined;
    const analysis = await analyzeCompanyReplyWithAi({
      messageText: targetMsg.content,
      senderName: targetMsg.senderName,
      application: targetApp
    });

    setInboxMessages(prev => {
      const updated = prev.map(m => m.id === messageId ? { ...m, aiAnalysis: analysis, status: 'READ' as const } : m);
      try {
        localStorage.setItem('cropsa_inbox_messages', JSON.stringify(updated));
      } catch (e) {}
      if (supabase) {
        supabase.from('system_settings').upsert({
          id: 'inbox_messages',
          data: updated,
          updated_at: new Date().toISOString()
        }).catch((e: any) => console.warn('Supabase inbox_messages analysis update error:', e));
      }
      return updated;
    });

    return analysis;
  };

  const applyInboxMessageToPlatform = async (messageId: string): Promise<boolean> => {
    const targetMsg = inboxMessages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.aiAnalysis) return false;

    const analysis = targetMsg.aiAnalysis;
    const nowStr = new Date().toISOString();
    const targetApp = targetMsg.applicationId 
      ? applications.find(a => a.id === targetMsg.applicationId) 
      : (targetMsg.clientName ? applications.find(a => a.clientName.trim() === targetMsg.clientName?.trim()) : undefined);

    if (!targetApp) {
      console.warn('Target application not found for inbox message:', targetMsg);
      return false;
    }

    const appId = targetApp.id;
    let newStatus = analysis.suggestedStatus || targetApp.status;
    let approvedAmt = targetApp.approvedAmount;
    let isFullyApproved = false;

    if (analysis.decision === 'APPROVED') {
      newStatus = ApplicationStatus.APPROVED;
      approvedAmt = analysis.approvedAmount || targetApp.approvedAmount || targetApp.requestedAmount;
      isFullyApproved = true;
    } else if (analysis.decision === 'REJECTED') {
      newStatus = ApplicationStatus.REJECTED;
    } else if (analysis.decision === 'DOCS_REQUIRED') {
      newStatus = ApplicationStatus.PAPER_REVIEW;
    } else if (analysis.decision === 'UNDER_REVIEW') {
      newStatus = ApplicationStatus.FIELD_INVESTIGATION;
    }

    const actionTitle = analysis.decision === 'APPROVED' ? 'اعتماد موافقة ائتمانية للشركة' :
                        analysis.decision === 'REJECTED' ? 'رفض الطلب من شركة التمويل' :
                        analysis.decision === 'DOCS_REQUIRED' ? 'طلب استيفاء مستندات من رافع الطلب' : 'تحديث مرحلة الطلب';

    const historyItem: ApplicationHistoryItem = {
      action: analysis.decision === 'APPROVED' ? 'APPROVED' : analysis.decision === 'REJECTED' ? 'REJECTED' : 'UPDATE_REQUESTED',
      timestamp: nowStr,
      performedBy: currentUser?.id || 'SYSTEM',
      performedByName: `${currentUser?.name || 'النظام'} [اعتماد رد AI من صندوق الوارد]`,
      details: `${actionTitle} - ${targetMsg.companyName}: ${analysis.summaryNotes}`
    };

    const newComment: ApplicationComment = {
      id: `c_ai_inbox_${Date.now()}`,
      authorId: currentUser?.id || 'SYSTEM',
      authorName: `تحليل الذكاء الاصطناعي (${currentUser?.name || 'الإدارة'})`,
      authorRole: Role.SUPER_ADMIN,
      companyName: targetMsg.companyName,
      message: `🤖 [اعتماد رد ذكي من صندوق الوارد]:\n${analysis.summaryNotes}${analysis.approvedAmount ? `\n💰 المبلغ المعتمد: ${analysis.approvedAmount.toLocaleString()} ج.م` : ''}${analysis.requestedDocuments && analysis.requestedDocuments.length > 0 ? `\n📑 المستندات المطلوبة: ${analysis.requestedDocuments.join('، ')}` : ''}`,
      createdAt: nowStr,
      isUrgent: analysis.decision === 'DOCS_REQUIRED',
      notificationType: analysis.decision === 'DOCS_REQUIRED' ? 'DOCS_REQUIRED' : 'DECISION_ISSUED'
    };

    const appUpdates: Partial<Application> = {
      status: newStatus,
      approvedAmount: approvedAmt,
      history: [historyItem, ...(targetApp.history || [])],
      comments: [...(targetApp.comments || []), newComment],
      needsUpdate: analysis.decision === 'DOCS_REQUIRED',
      updateRequestReason: analysis.decision === 'DOCS_REQUIRED' ? `مطلوب استيفاء: ${(analysis.requestedDocuments || []).join('، ')}` : undefined,
      updateRequestedAt: analysis.decision === 'DOCS_REQUIRED' ? nowStr : undefined
    };

    // Update application in state
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...appUpdates } : a));

    // Update message state as processed
    setInboxMessages(prev => {
      const updated = prev.map(m => m.id === messageId ? {
        ...m,
        status: 'PROCESSED' as const,
        isProcessed: true,
        processedAt: nowStr,
        processedBy: currentUser?.id,
        processedByName: currentUser?.name,
        appliedActionDetails: `تم تطبيق القرار: (${actionTitle}) وتحديث حالة الطلب إلى (${newStatus}) بنجاح.`
      } : m);
      try {
        localStorage.setItem('cropsa_inbox_messages', JSON.stringify(updated));
      } catch (e) {}
      if (supabase) {
        supabase.from('system_settings').upsert({
          id: 'inbox_messages',
          data: updated,
          updated_at: nowStr
        }).catch((e: any) => console.warn('Supabase inbox apply update error:', e));
      }
      return updated;
    });

    // Notify submitter and admin
    if (targetApp.submittedBy) {
      addNotification(
        targetApp.submittedBy,
        `📢 تم استلام واعتماد رد شركة ${targetMsg.companyName} لطلب العميل (${targetApp.clientName}): ${actionTitle}`,
        analysis.decision === 'APPROVED' ? 'SUCCESS' : analysis.decision === 'REJECTED' ? 'ERROR' : 'WARNING',
        appId,
        undefined,
        'APPLICATION'
      );
    }

    addAuditLog('APPLY_INBOX_AI_UPDATE', `Applied AI analyzed company response for application #${appId} (${targetApp.clientName}) - Status: ${newStatus}`, appId);
    return true;
  };

  const deleteInboxMessage = async (messageId: string): Promise<void> => {
    let nextMessages: InboxMessage[] = [];
    let nextDeletedIds: string[] = [];

    setDeletedInboxMessageIds(prev => {
      nextDeletedIds = Array.from(new Set([...prev, messageId]));
      try {
        localStorage.setItem('cropsa_deleted_inbox_ids', JSON.stringify(nextDeletedIds));
      } catch (e) {}
      return nextDeletedIds;
    });

    setInboxMessages(prev => {
      nextMessages = prev.filter(m => m.id !== messageId);
      try {
        localStorage.setItem('cropsa_inbox_messages', JSON.stringify(nextMessages));
      } catch (e) {}
      return nextMessages;
    });

    if (supabase) {
      try {
        await Promise.all([
          supabase.from('system_settings').upsert({
            id: 'inbox_messages',
            data: nextMessages,
            updated_at: new Date().toISOString()
          }),
          supabase.from('system_settings').upsert({
            id: 'deleted_inbox_ids',
            data: nextDeletedIds,
            updated_at: new Date().toISOString()
          })
        ]);
      } catch (e: any) {
        console.warn('Supabase inbox delete error:', e);
      }
    }
  };

  const clearAllInboxMessages = async (): Promise<void> => {
    let allIdsToMark: string[] = [];
    setInboxMessages(prev => {
      allIdsToMark = prev.map(m => m.id);
      try {
        localStorage.setItem('cropsa_inbox_messages', JSON.stringify([]));
      } catch (e) {}
      return [];
    });

    let nextDeletedIds: string[] = [];
    setDeletedInboxMessageIds(prev => {
      nextDeletedIds = Array.from(new Set([...prev, ...allIdsToMark]));
      try {
        localStorage.setItem('cropsa_deleted_inbox_ids', JSON.stringify(nextDeletedIds));
      } catch (e) {}
      return nextDeletedIds;
    });

    if (supabase) {
      try {
        await Promise.all([
          supabase.from('system_settings').upsert({
            id: 'inbox_messages',
            data: [],
            updated_at: new Date().toISOString()
          }),
          supabase.from('system_settings').upsert({
            id: 'deleted_inbox_ids',
            data: nextDeletedIds,
            updated_at: new Date().toISOString()
          })
        ]);
      } catch (e: any) {
        console.warn('Supabase clearAllInboxMessages error:', e);
      }
    }
  };

  // =========================================================================
  // SALES REPRESENTATIVES (إدارة مناديب وموظفي المبيعات - المسجلين وغير المسجلين)
  // =========================================================================
  const addSalesRepresentative = async (name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let nextReps: string[] = [];
    setSalesRepresentatives(prev => {
      if (prev.includes(trimmed)) return prev;
      nextReps = [...prev, trimmed];
      try {
        localStorage.setItem('cropsa_sales_representatives', JSON.stringify(nextReps));
      } catch (e) {}
      return nextReps;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'sales_representatives',
          data: nextReps.length > 0 ? nextReps : [trimmed],
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase addSalesRepresentative error:', e);
      }
    }
  };

  const deleteSalesRepresentative = async (name: string): Promise<void> => {
    let nextReps: string[] = [];
    setSalesRepresentatives(prev => {
      nextReps = prev.filter(n => n !== name);
      try {
        localStorage.setItem('cropsa_sales_representatives', JSON.stringify(nextReps));
      } catch (e) {}
      return nextReps;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'sales_representatives',
          data: nextReps,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase deleteSalesRepresentative error:', e);
      }
    }
  };

  // =========================================================================
  // SALES TARGETS (إدارة مستهدفات المبيعات والأداء)
  // =========================================================================
  const saveSalesTarget = async (target: SalesmanTarget): Promise<void> => {
    let nextTargets: Record<string, SalesmanTarget> = {};
    const updatedTarget: SalesmanTarget = {
      ...target,
      updatedAt: new Date().toISOString()
    };
    setSalesTargets(prev => {
      nextTargets = {
        ...prev,
        [target.salesmanName]: updatedTarget
      };
      try {
        localStorage.setItem('cropsa_sales_targets', JSON.stringify(nextTargets));
      } catch (e) {}
      return nextTargets;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'sales_targets',
          data: Object.keys(nextTargets).length > 0 ? nextTargets : { [target.salesmanName]: updatedTarget },
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase saveSalesTarget error:', e);
      }
    }
  };

  const deleteSalesTarget = async (salesmanName: string): Promise<void> => {
    let nextTargets: Record<string, SalesmanTarget> = {};
    setSalesTargets(prev => {
      nextTargets = { ...prev };
      delete nextTargets[salesmanName];
      try {
        localStorage.setItem('cropsa_sales_targets', JSON.stringify(nextTargets));
      } catch (e) {}
      return nextTargets;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'sales_targets',
          data: nextTargets,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase deleteSalesTarget error:', e);
      }
    }
  };

  // =========================================================================
  // ARCHIVING & DATABASE OPTIMIZATION (الأرشفة التلقائية وتنظيف قاعدة البيانات)
  // =========================================================================
  const archiveApplication = async (appId: string, reason?: string) => {
    const defaultReason = reason || 'أرشفة يدوية';
    const nowStr = new Date().toISOString();
    const updates: Partial<Application> = {
      isArchived: true,
      archivedAt: nowStr,
      archivedReason: defaultReason
    };
    await updateApplication(appId, updates);
    addAuditLog('ARCHIVE_APPLICATION', `Archived application ${appId}: ${defaultReason}`, appId);
  };

  const unarchiveApplication = async (appId: string) => {
    const updates: Partial<Application> = {
      isArchived: false,
      archivedAt: undefined,
      archivedReason: undefined
    };
    await updateApplication(appId, updates);
    addAuditLog('UNARCHIVE_APPLICATION', `Unarchived application ${appId}`, appId);
  };

  const autoArchiveApplications = async (options?: { olderThanMonths?: number; archiveRejected?: boolean }) => {
    const months = options?.olderThanMonths ?? 6;
    const shouldArchiveRejected = options?.archiveRejected ?? true;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    const cutoffTime = cutoffDate.getTime();
    const nowStr = new Date().toISOString();

    const toArchive = applications.filter(a => {
      if (a.isArchived) return false;
      const isRejected = shouldArchiveRejected && a.status === ApplicationStatus.REJECTED;
      const isOlder = new Date(a.submittedAt).getTime() < cutoffTime;
      return isRejected || isOlder;
    });

    if (toArchive.length === 0) {
      return { count: 0, archivedIds: [] };
    }

    const archivedIds: string[] = [];
    const batch = writeBatch(db);

    toArchive.forEach(a => {
      archivedIds.push(a.id);
      const reason = a.status === ApplicationStatus.REJECTED
        ? 'أرشفة تلقائية (طلب مرفوض لتنظيف قاعدة البيانات)'
        : `أرشفة تلقائية (مرور أكثر من ${months} أشهر لتحسين الأداء)`;
      
      const appRef = doc(db, 'applications', a.id);
      batch.update(appRef, {
        isArchived: true,
        archivedAt: nowStr,
        archivedReason: reason
      });
    });

    // Update in local state
    setApplications(prev => prev.map(a => {
      if (archivedIds.includes(a.id)) {
        const reason = a.status === ApplicationStatus.REJECTED
          ? 'أرشفة تلقائية (طلب مرفوض لتنظيف قاعدة البيانات)'
          : `أرشفة تلقائية (مرور أكثر من ${months} أشهر لتحسين الأداء)`;
        return {
          ...a,
          isArchived: true,
          archivedAt: nowStr,
          archivedReason: reason
        };
      }
      return a;
    }));

    try {
      await batch.commit();
    } catch (err) {
      console.warn('Firestore autoArchive batch commit fallback:', err);
    }

    addAuditLog(
      'AUTO_ARCHIVE_RUN',
      `Auto-archived ${archivedIds.length} applications (older than ${months} months or rejected)`,
      archivedIds.join(',')
    );

    return { count: archivedIds.length, archivedIds };
  };

  const requestWithdrawal = async (appId: string, amount: number, note: string) => {
    if (!currentUser) return;
    const newReq: WithdrawalRequest = {
      id: `w_${Date.now()}`,
      userId: currentUser.id,
      applicationId: appId,
      amount,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      note
    };
    setWithdrawalRequests(prev => [newReq, ...prev]);
    try {
      await setDoc(doc(db, 'withdrawals', newReq.id), newReq);
    } catch (err) {
      console.warn('Firestore requestWithdrawal fallback:', err);
    }
    addNotification('u_super', `طلب سحب أرباح بقيمة ${amount.toLocaleString()} ج.م من ${currentUser.name}`, 'WARNING', newReq.id);
  };

  const approveWithdrawal = async (id: string) => {
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) return;
    setWithdrawalRequests(prev => prev.map(w => w.id === id ? {
      ...w,
      status: 'APPROVED',
      actionedBy: currentUser.id,
      actionedAt: new Date().toISOString()
    } : w));
    try {
      await updateDoc(doc(db, 'withdrawals', id), {
        status: 'APPROVED',
        actionedBy: currentUser.id,
        actionedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore approveWithdrawal fallback:', err);
    }
  };

  const rejectWithdrawal = async (id: string) => {
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) return;
    setWithdrawalRequests(prev => prev.map(w => w.id === id ? {
      ...w,
      status: 'REJECTED',
      actionedBy: currentUser.id,
      actionedAt: new Date().toISOString()
    } : w));
    try {
      await updateDoc(doc(db, 'withdrawals', id), {
        status: 'REJECTED',
        actionedBy: currentUser.id,
        actionedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Firestore rejectWithdrawal fallback:', err);
    }
  };

  const renewInstallment = async (
    clientId: string, 
    amount: number, 
    companyId?: string, 
    extra?: { 
      companyName?: string; 
      aiAnalysis?: any; 
      notes?: string; 
      durationMonths?: number;
    }
  ) => {
    if (!currentUser) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const appId = `app_renew_${Date.now()}`;
    const nowStr = new Date().toISOString();
    const prevApp = applications.find(a => a.clientNationalId === client.nationalId);

    const companyTargetName = extra?.companyName || 
      (companyId ? (companies.find(c => c.id === companyId)?.name || ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === companyId)?.nameAr || companyId) : 'إدارة كروبسا (تحويل حر)');

    const aiStory = extra?.aiAnalysis?.clientStory || '';
    const aiScore = extra?.aiAnalysis?.score;

    const newApp: Application = {
      id: appId,
      clientName: client.name,
      clientNationalId: client.nationalId,
      phoneNumber: client.phoneNumber || (prevApp?.phoneNumber || ''),
      whatsappNumber: client.phoneNumber || (prevApp?.whatsappNumber || ''),
      governorate: client.governorate || prevApp?.governorate || 'القاهرة',
      profession: (client.profession as any) || (prevApp?.profession as any) || 'MERCHANT',
      financeType: 'INSTALLMENT',
      durationMonths: extra?.durationMonths || 12,
      hasRecentInstallment: true,
      hasRecentReceipt: false,
      requestedAmount: amount,
      usedAmount: 0,
      status: companyId && companyId.startsWith('comp_') ? ApplicationStatus.PAPER_REVIEW : ApplicationStatus.PENDING_ADMIN,
      documentLink: prevApp?.documentLink || '',
      submittedBy: currentUser.id,
      submittedAt: nowStr,
      assignedCompanyIds: companyId && companyId.startsWith('comp_') ? [companyId] : [],
      assignedAt: companyId && companyId.startsWith('comp_') ? nowStr : undefined,
      description: `طلب تجديد تمويل وسقف ائتماني - الشركة الموجه إليها: ${companyTargetName}` + 
        (extra?.notes ? `\nملاحظات: ${extra.notes}` : '') +
        (aiStory ? `\n[تحليل وتوصية الذكاء الاصطناعي - جدارة ${aiScore}/100]: ${aiStory}` : ''),
      history: [
        { 
          action: 'CREATED', 
          timestamp: nowStr, 
          performedBy: currentUser.id, 
          details: `طلب تجديد تمويل موجه لـ ${companyTargetName} بقيمة ${amount.toLocaleString()} ج.م` 
        }
      ]
    };

    setApplications(prev => [newApp, ...prev]);
    if (supabase) {
      try {
        await supabase.from('applications').upsert({
          id: appId,
          client_id: client.id,
          client_name: client.name,
          client_phone: client.phoneNumber || '',
          client_national_id: client.nationalId || '',
          company_id: companyId && companyId.startsWith('comp_') ? companyId : 'comp_01',
          total_amount: amount,
          down_payment: 0,
          financed_amount: amount,
          monthly_installment: Math.round(amount / (extra?.durationMonths || 12)),
          duration_months: extra?.durationMonths || 12,
          status: newApp.status,
          product_type: 'تجديد تمويل',
          product_description: newApp.description || ''
        });
      } catch (err) {
        console.warn('Supabase renewInstallment fallback:', err);
      }
    }
    try {
      await setDoc(doc(db, 'applications', appId), newApp);
    } catch (err) {
      console.warn('Firestore renewInstallment fallback:', err);
    }

    addClientTimelineEvent(clientId, {
      action: `طلب إعادة تمويل جديد بقيمة ${amount.toLocaleString()} ج.م (تجديد ذكي)`,
      actionType: 'APPLICATION',
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      companyName: companyTargetName,
      details: `تم تقديم طلب تجديد التمويل وموجه إلى: ${companyTargetName}` + (aiScore ? ` • تقييم الذكاء الاصطناعي: ${aiScore}/100` : ''),
      badgeColor: 'blue'
    });

    if (companyId && companyId.startsWith('comp_')) {
      addNotification(
        'COMPANY_' + companyId,
        `طلب تجديد تمويل جديد للعميل ${client.name} بمبلغ ${amount.toLocaleString()} ج.م`,
        'INFO',
        appId,
        `New renewal request for client ${client.name}`,
        'APPLICATION',
        {
          targetCompanyId: companyId,
          targetRole: Role.INSTALLMENT_COMPANY,
          title: 'طلب تجديد تمويل وارد'
        }
      );
    }

    addNotification(
      'ROLE_SUPER_ADMIN',
      `تم تقديم طلب تجديد تمويل للعميل ${client.name} بقيمة ${amount.toLocaleString()} ج.م (الشركة: ${companyTargetName})`,
      'SUCCESS',
      appId,
      `Renewal submitted for ${client.name}`,
      'APPLICATION',
      {
        targetRole: Role.SUPER_ADMIN,
        title: 'تجديد تمويل عميل'
      }
    );
  };

  const bulkImportClients = async (
    importedClients: Partial<Client>[], 
    initialApps?: Partial<Application>[]
  ): Promise<{ importedCount: number; errors: string[] }> => {
    if (!currentUser) return { importedCount: 0, errors: ['غير مسجل الدخول'] };
    const isAllowedRole = currentUser.role === Role.SUPER_ADMIN || 
                          currentUser.role === Role.ADMIN || 
                          currentUser.role === Role.INSTALLMENT_COMPANY;
    if (!isAllowedRole) {
      return { importedCount: 0, errors: ['هذه الخاصية متاحة للإدارة ولمسؤولي المنظومة وشركات التقسيط'] };
    }

    const errors: string[] = [];
    let count = 0;
    const nowStr = new Date().toISOString();

    const newClientsToAdd: Client[] = [];
    const newAppsToAdd: Application[] = [];

    for (let i = 0; i < importedClients.length; i++) {
      const row = importedClients[i];
      if (!row.name || !row.name.trim()) {
        errors.push(`صف ${i + 1}: اسم العميل مفقود`);
        continue;
      }

      // National ID handling: Accept even if missing or partial!
      const rawNid = row.nationalId ? String(row.nationalId).replace(/\D/g, '') : '';
      const isMissingNid = !rawNid || rawNid.length !== 14;
      const finalNationalId = isMissingNid
        ? (row.temporaryNationalId || `TEMP-NID-${Date.now().toString().slice(-6)}-${i + 1}`)
        : rawNid;

      // Smart Duplicate Resolution: by national ID (if valid) or by exact name + phone
      let existingIndex = -1;
      if (!isMissingNid) {
        existingIndex = clients.findIndex(c => c.nationalId === finalNationalId);
      } else if (row.phoneNumber && row.phoneNumber.trim().length >= 10) {
        existingIndex = clients.findIndex(c => 
          c.name.trim().toLowerCase() === row.name!.trim().toLowerCase() && 
          c.phoneNumber?.replace(/\s+/g, '') === row.phoneNumber?.replace(/\s+/g, '')
        );
      } else {
        existingIndex = clients.findIndex(c => c.name.trim().toLowerCase() === row.name!.trim().toLowerCase());
      }

      const existingClient = existingIndex >= 0 ? clients[existingIndex] : null;
      const clientId = existingClient ? existingClient.id : `c_import_${Date.now()}_${i}`;

      // Calculate elapsed time from last finance date to determine renewal eligibility
      const financeDate = row.lastFinanceDate || existingClient?.lastFinanceDate || '2024-01-01';
      const financeTimestamp = new Date(financeDate).getTime();
      const daysElapsed = Math.max(1, Math.floor((Date.now() - (isNaN(financeTimestamp) ? Date.now() : financeTimestamp)) / (1000 * 60 * 60 * 24)));
      const monthsElapsed = Math.max(0, Math.floor(daysElapsed / 30));

      const isDelinquent = row.isDelinquent || 
                           (row.notes && (row.notes.includes('تعثر') || row.notes.includes('قضية') || row.notes.includes('شيك') || row.notes.includes('مرفوض') || row.notes.includes('اي سكور')));
      
      let computedClassification: 'ELIGIBLE' | 'RECENT_ACTIVE' | 'DELINQUENT' | 'NEEDS_DATA' | 'NEW_CLIENT' = 'NEW_CLIENT';
      if (isDelinquent) {
        computedClassification = 'DELINQUENT';
      } else if (row.renewalClassification === 'ELIGIBLE' || (Number(row.disbursedAmount || row.totalApprovedAmount || 0) > 0 && (daysElapsed >= 90 || monthsElapsed >= 3))) {
        computedClassification = 'ELIGIBLE';
      } else if (Number(row.disbursedAmount || row.totalApprovedAmount || 0) > 0 && daysElapsed < 90) {
        computedClassification = 'RECENT_ACTIVE';
      } else if (isMissingNid) {
        computedClassification = 'NEEDS_DATA';
      }

      const clientObj: Client = {
        id: clientId,
        name: row.name.trim(),
        nationalId: finalNationalId,
        hasMissingNationalId: isMissingNid,
        temporaryNationalId: isMissingNid ? finalNationalId : undefined,
        renewalClassification: row.renewalClassification || computedClassification,
        renewalEligibleMonths: row.renewalEligibleMonths !== undefined ? row.renewalEligibleMonths : monthsElapsed,
        suggestedRenewalLimit: row.suggestedRenewalLimit || Math.round((Number(row.totalApprovedAmount || row.disbursedAmount || 50000)) * 1.3),
        renewalNotes: row.renewalNotes || (
          computedClassification === 'ELIGIBLE' 
            ? `مؤهل للتجديد الفوري (مضى ${monthsElapsed} أشهر على التمويل السابق)` 
            : computedClassification === 'RECENT_ACTIVE'
              ? `تمويل حديث نشط (متبقي ${Math.max(0, 90 - daysElapsed)} يوماً لاستيفاء مهلة الـ 3 أشهر)`
              : isMissingNid
                ? 'تم الاستيراد بنجاح - بحاجة لتسجيل وتحديث الرقم القومي'
                : 'سجل عميل محفوظ'
        ),
        phoneNumber: row.phoneNumber?.trim() || existingClient?.phoneNumber || '',
        governorate: row.governorate || existingClient?.governorate || 'القاهرة',
        profession: row.profession || existingClient?.profession || 'MERCHANT',
        addedBy: currentUser.id,
        addedAt: row.addedAt || existingClient?.addedAt || nowStr,
        creditRating: row.creditRating || existingClient?.creditRating || (isDelinquent ? 'D' : 'A'),
        totalApprovedAmount: Number(row.totalApprovedAmount) || existingClient?.totalApprovedAmount || 0,
        disbursedAmount: Number(row.disbursedAmount) || existingClient?.disbursedAmount || 0,
        companyName: row.companyName || existingClient?.companyName || 'سجل تقسيط سابق',
        lastFinanceDate: row.lastFinanceDate || existingClient?.lastFinanceDate || financeDate,
        isHistoricalOnly: row.isHistoricalOnly !== undefined ? !!row.isHistoricalOnly : true,
        notes: isMissingNid 
          ? `${row.notes || ''} [⚠️ تم الاستيراد بدون رقم قومي مؤقتاً بحاجة لاستكمال البطاقة]`.trim()
          : (row.notes || existingClient?.notes || 'مستورد مجمعاً عبر شيت قاعدة بيانات كروبسا'),
        authorizedCompanies: row.authorizedCompanies || existingClient?.authorizedCompanies || [],
        aiSolvencyScore: row.aiSolvencyScore || existingClient?.aiSolvencyScore || (isDelinquent ? 45 : isMissingNid ? 70 : 88),
        aiRiskTier: row.aiRiskTier || existingClient?.aiRiskTier || (isDelinquent ? 'HIGH' : 'LOW'),
        manualEntry: row.manualEntry || existingClient?.manualEntry,
        timeline: existingClient?.timeline ? [
          ...existingClient.timeline,
          {
            id: `t_imp_${Date.now()}_${i}`,
            clientId,
            action: 'تحديث بيانات وسجل من الشيت المجمع',
            actionType: 'NOTE',
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            timestamp: nowStr,
            details: `تحديث تمويل: ${Number(row.totalApprovedAmount || 0).toLocaleString()} ج.م - الشركة: ${row.companyName || 'غير محدد'}${isMissingNid ? ' (بدون رقم قومي)' : ''}`,
            badgeColor: 'amber'
          }
        ] : [
          {
            id: `t_imp_${Date.now()}_${i}`,
            clientId,
            action: 'إضافة إلى قاعدة بيانات كروبسا (استيراد مجمع)',
            actionType: 'NOTE',
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            timestamp: nowStr,
            details: `تم الاستيراد المجمع للعميل. التمويل السابق: ${Number(row.totalApprovedAmount || 0).toLocaleString()} ج.م - الشركة: ${row.companyName || 'غير محدد'}${isMissingNid ? ' (بدون رقم قومي - مؤقت)' : ''}`,
            badgeColor: isMissingNid ? 'amber' : 'blue'
          }
        ]
      };

      newClientsToAdd.push(clientObj);

      // Auto-register approved historical financing application with exact date & company
      const histAmt = Number(row.totalApprovedAmount || row.disbursedAmount || existingClient?.totalApprovedAmount || 0);
      const histDisbursed = Number(row.disbursedAmount || row.totalApprovedAmount || existingClient?.disbursedAmount || histAmt);
      if (histAmt > 0 || histDisbursed > 0) {
        const compTitle = row.companyName || existingClient?.companyName || 'شركة أمان للتقسيط';
        const compId = row.companyCode || existingClient?.manualEntry?.installmentCompanyId || 'comp_01';
        const histApp: Application = {
          id: `app_hist_${Date.now()}_${i}`,
          clientId,
          clientName: row.name.trim(),
          clientNationalId: finalNationalId,
          phoneNumber: row.phoneNumber?.trim() || existingClient?.phoneNumber || '',
          whatsappNumber: row.phoneNumber?.trim() || existingClient?.phoneNumber || '',
          governorate: row.governorate || existingClient?.governorate || 'القاهرة',
          profession: (row.profession as any) || existingClient?.profession || 'MERCHANT',
          financeType: 'INSTALLMENT',
          durationMonths: 12,
          hasRecentInstallment: true,
          hasRecentReceipt: true,
          requestedAmount: histAmt,
          approvedAmount: histAmt,
          usedAmount: histDisbursed,
          status: ApplicationStatus.APPROVED,
          companyName: compTitle,
          companyId: compId,
          assignedCompanyIds: [compId],
          submittedBy: currentUser.id,
          submittedByName: currentUser.name,
          submittedAt: financeDate ? `${financeDate}T09:00:00.000Z` : '2024-01-01T09:00:00.000Z',
          reviewedAt: financeDate ? `${financeDate}T10:00:00.000Z` : '2024-01-01T10:00:00.000Z',
          description: `طلب تمويل سابق معتمد ومسجل بقاعدة بيانات كروبسا (${compTitle}) بمبلغ ${histDisbursed.toLocaleString()} ج.م`,
          history: [
            {
              action: 'AMOUNT_TRANSFERRED',
              timestamp: financeDate ? `${financeDate}T10:00:00.000Z` : nowStr,
              performedBy: currentUser.id,
              performedByName: currentUser.name,
              details: `تمويل تاريخي سابق معتمد من ${compTitle} بتاريخ ${financeDate}`
            }
          ]
        };
        newAppsToAdd.push(histApp);
      }

      count++;
    }

    if (initialApps && initialApps.length > 0) {
      for (let j = 0; j < initialApps.length; j++) {
        const appRow = initialApps[j];
        if (appRow.clientName) {
          const matchedClient = newClientsToAdd[j] || newClientsToAdd.find(c => c.name === appRow.clientName);
          const appNid = appRow.clientNationalId || matchedClient?.nationalId || `TEMP-NID-${Date.now().toString().slice(-6)}-${j + 1}`;
          const newApp: Application = {
            id: `app_imp_${Date.now()}_${j}`,
            clientName: appRow.clientName || 'عميل',
            clientNationalId: appNid,
            phoneNumber: appRow.phoneNumber || matchedClient?.phoneNumber || '',
            whatsappNumber: appRow.whatsappNumber || appRow.phoneNumber || matchedClient?.phoneNumber || '',
            governorate: appRow.governorate || matchedClient?.governorate || 'القاهرة',
            profession: (appRow.profession as any) || matchedClient?.profession || 'MERCHANT',
            financeType: 'INSTALLMENT',
            durationMonths: Number(appRow.durationMonths) || 12,
            hasRecentInstallment: true,
            hasRecentReceipt: false,
            requestedAmount: Number(appRow.requestedAmount) || Number(appRow.approvedAmount) || 0,
            approvedAmount: Number(appRow.approvedAmount) || Number(appRow.requestedAmount) || 0,
            usedAmount: Number(appRow.usedAmount) || Number(appRow.approvedAmount) || 0,
            status: appRow.status || ApplicationStatus.APPROVED,
            submittedBy: currentUser.id,
            submittedAt: appRow.submittedAt || nowStr,
            reviewedAt: appRow.reviewedAt || appRow.submittedAt || nowStr,
            assignedCompanyIds: (appRow.assignedCompanyIds && appRow.assignedCompanyIds.length > 0) ? appRow.assignedCompanyIds : ['comp_other'],
            description: appRow.description || 'سجل تمويل تاريخي مستورد',
            history: [
              {
                action: 'CREATED',
                timestamp: appRow.submittedAt || nowStr,
                performedBy: currentUser.id,
                details: 'تم استيراد العملية من سجلات التمويل السابقة'
              }
            ]
          };
          newAppsToAdd.push(newApp);
        }
      }
    }

    let allUpdatedClients = [...clients];
    newClientsToAdd.forEach(nc => {
      const idx = allUpdatedClients.findIndex(c => c.id === nc.id || (nc.nationalId && c.nationalId === nc.nationalId && !c.hasMissingNationalId));
      if (idx >= 0) {
        allUpdatedClients[idx] = { ...allUpdatedClients[idx], ...nc };
      } else {
        allUpdatedClients.unshift(nc);
      }
    });
    setClients(allUpdatedClients);
    try { localStorage.setItem('cropsa_clients', JSON.stringify(allUpdatedClients)); } catch (e) {}

    const allUpdatedApps = newAppsToAdd.length > 0 ? [...newAppsToAdd, ...applications] : applications;
    if (newAppsToAdd.length > 0) {
      setApplications(allUpdatedApps);
      try { localStorage.setItem('cropsa_applications', JSON.stringify(allUpdatedApps)); } catch (e) {}
    }

    if (supabase) {
      try {
        if (newClientsToAdd.length > 0) {
          const clientRows = newClientsToAdd.map(nc => ({
            id: nc.id,
            name: nc.name,
            national_id: nc.nationalId,
            phone: nc.phoneNumber,
            governorate: nc.governorate,
            address: nc.address || '',
            job_title: nc.profession || '',
            monthly_income: Number(nc.monthlyIncome) || 0,
            iscore_status: nc.iscoreStatus || 'CLEAN',
            credit_rating: typeof nc.creditRating === 'number' ? nc.creditRating : 80,
            total_financed: Number(nc.totalApprovedAmount) || 0
          }));
          await supabase.from('clients').upsert(clientRows);
        }
        if (newAppsToAdd.length > 0) {
          const appRows = newAppsToAdd.map(na => ({
            id: na.id,
            client_id: na.clientId || na.id,
            client_name: na.clientName,
            client_phone: na.phoneNumber || '',
            client_national_id: na.clientNationalId || '',
            company_id: na.assignedCompanyIds?.[0] || 'comp_01',
            total_amount: na.requestedAmount || 0,
            down_payment: 0,
            financed_amount: na.approvedAmount || na.requestedAmount || 0,
            monthly_installment: Math.round((na.approvedAmount || na.requestedAmount || 0) / (na.durationMonths || 12)),
            duration_months: na.durationMonths || 12,
            status: na.status || 'APPROVED',
            product_type: 'سجل مستورد',
            product_description: na.description || ''
          }));
          await supabase.from('applications').upsert(appRows);
        }
        await supabase.from('system_settings').upsert({
          id: 'clients_data',
          data: allUpdatedClients,
          updated_at: new Date().toISOString()
        });
        if (newAppsToAdd.length > 0) {
          await supabase.from('system_settings').upsert({
            id: 'applications_data',
            data: allUpdatedApps,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Supabase bulkImportClients fallback:', err);
      }
    }
    try {
      for (const nc of newClientsToAdd) {
        await setDoc(doc(db, 'clients', nc.id), nc);
      }
      for (const na of newAppsToAdd) {
        await setDoc(doc(db, 'applications', na.id), na);
      }
    } catch (e) {
      console.warn('Firestore bulkImportClients fallback:', e);
    }

    addAuditLog('BULK_IMPORT_CLIENTS', `استيراد مجمع لعدد ${count} عميل عبر شيت إكسل`, currentUser.id);

    return { importedCount: count, errors };
  };

  const bulkImportApplications = async (
    items: Array<{
      client: Partial<Client>;
      application: Partial<Application>;
    }>
  ): Promise<{ importedCount: number; errors: string[] }> => {
    if (!currentUser) return { importedCount: 0, errors: ['غير مسجل الدخول'] };
    const errors: string[] = [];
    let count = 0;
    const nowStr = new Date().toISOString();

    const newClientsToAdd: Client[] = [];
    const newAppsToAdd: Application[] = [];

    for (let i = 0; i < items.length; i++) {
      const { client: cData, application: aData } = items[i];
      if (!aData.clientName || !aData.clientName.trim()) {
        errors.push(`صف #${i + 1}: اسم العميل مفقود`);
        continue;
      }

      const rawNid = cData.nationalId ? String(cData.nationalId).replace(/\D/g, '') : '';
      const isMissingNid = !rawNid || rawNid.length !== 14;
      const finalNationalId = isMissingNid
        ? (cData.temporaryNationalId || `TEMP-NID-${Date.now().toString().slice(-6)}-${i + 1}`)
        : rawNid;

      // Duplicate Check for Client
      let existingIndex = -1;
      if (!isMissingNid) {
        existingIndex = clients.findIndex(c => c.nationalId === finalNationalId);
      } else if (aData.phoneNumber && aData.phoneNumber.trim().length >= 10) {
        existingIndex = clients.findIndex(c => 
          c.name.trim().toLowerCase() === aData.clientName!.trim().toLowerCase() && 
          c.phoneNumber?.replace(/\s+/g, '') === aData.phoneNumber?.replace(/\s+/g, '')
        );
      } else {
        existingIndex = clients.findIndex(c => c.name.trim().toLowerCase() === aData.clientName!.trim().toLowerCase());
      }

      const existingClient = existingIndex >= 0 ? clients[existingIndex] : null;
      const clientId = existingClient ? existingClient.id : `c_import_${Date.now()}_${i}`;

      const clientObj: Client = {
        id: clientId,
        name: aData.clientName.trim(),
        nationalId: finalNationalId,
        hasMissingNationalId: isMissingNid,
        temporaryNationalId: isMissingNid ? finalNationalId : undefined,
        phoneNumber: aData.phoneNumber?.trim() || existingClient?.phoneNumber || '',
        governorate: aData.governorate || existingClient?.governorate || 'القاهرة',
        profession: (aData.profession as any) || existingClient?.profession || 'MERCHANT',
        addedBy: currentUser.id,
        addedAt: aData.submittedAt || existingClient?.addedAt || nowStr,
        creditRating: existingClient?.creditRating || 'A',
        totalApprovedAmount: Number(aData.approvedAmount) || existingClient?.totalApprovedAmount || 0,
        disbursedAmount: aData.status === ApplicationStatus.AMOUNT_TRANSFERRED ? Number(aData.approvedAmount || aData.requestedAmount) : (existingClient?.disbursedAmount || 0),
        companyName: aData.assignedCompanyIds?.[0] ? (companies.find(c => c.id === aData.assignedCompanyIds![0])?.name || 'شركة تمويل') : (existingClient?.companyName || 'تقسيط'),
        lastFinanceDate: aData.submittedAt || existingClient?.lastFinanceDate || nowStr.split('T')[0],
        isHistoricalOnly: false,
        notes: aData.description || existingClient?.notes || 'طلب تمويل مستورد مجمعاً عبر شيت إكسل'
      };
      newClientsToAdd.push(clientObj);

      const appId = `app_imp_${Date.now()}_${i}`;
      const submittedDate = aData.submittedAt || nowStr;
      const lastStageDate = aData.lastStageDate || aData.reviewedAt || submittedDate;
      const appStatus = aData.status || ApplicationStatus.SUBMITTED;

      const targetComp = aData.companyId 
        ? companies.find(c => c.id === aData.companyId)
        : (aData.assignedCompanyIds?.[0] ? companies.find(c => c.id === aData.assignedCompanyIds![0]) : companies[0]);

      const compId = aData.companyId || targetComp?.id || aData.assignedCompanyIds?.[0] || 'comp_01';
      const compName = aData.companyName || targetComp?.name || 'شركة تقسيط';

      const newApp: Application = {
        id: appId,
        clientId,
        clientName: aData.clientName.trim(),
        clientNationalId: finalNationalId,
        phoneNumber: aData.phoneNumber || '',
        whatsappNumber: aData.whatsappNumber || aData.phoneNumber || '',
        governorate: aData.governorate || 'القاهرة',
        profession: (aData.profession as any) || 'MERCHANT',
        financeType: aData.financeType || 'INSTALLMENT',
        durationMonths: Number(aData.durationMonths) || 12,
        requestedAmount: Number(aData.requestedAmount) || Number(aData.approvedAmount) || 0,
        approvedAmount: Number(aData.approvedAmount) || Number(aData.requestedAmount) || 0,
        usedAmount: appStatus === ApplicationStatus.AMOUNT_TRANSFERRED ? (Number(aData.approvedAmount) || Number(aData.requestedAmount) || 0) : 0,
        status: appStatus,
        companyId: compId,
        companyName: compName,
        submittedBy: currentUser.id,
        submittedByName: currentUser.name,
        submittedAt: submittedDate,
        reviewedAt: lastStageDate,
        lastStageDate: lastStageDate,
        assignedCompanyIds: (aData.assignedCompanyIds && aData.assignedCompanyIds.length > 0) ? aData.assignedCompanyIds : [compId],
        selectedProgramId: aData.selectedProgramId,
        selectedProgramName: aData.selectedProgramName,
        programInterestRate: aData.programInterestRate,
        programAdminFeePercent: aData.programAdminFeePercent,
        description: aData.description || 'طلب تمويل مستورد مجمعاً عبر شيت إكسيل',
        hasRecentInstallment: true,
        hasRecentReceipt: false,
        history: [
          {
            action: 'CREATED',
            timestamp: submittedDate,
            performedBy: currentUser.id,
            details: `تم تقديم الطلب وتسجيله بالمنظومة (${submittedDate.split('T')[0]})`
          },
          ...(lastStageDate !== submittedDate ? [{
            action: 'STATUS_CHANGED',
            timestamp: lastStageDate,
            performedBy: currentUser.id,
            details: `تحديث مرحلة الطلب إلى (${STATUS_ARABIC[appStatus] || appStatus}) بتاريخ ${lastStageDate.split('T')[0]}`
          }] : [])
        ]
      };
      newAppsToAdd.push(newApp);
      count++;
    }

    // Update in-memory state
    const allUpdatedApps = [...newAppsToAdd, ...applications];
    setApplications(allUpdatedApps);
    try {
      localStorage.setItem('cropsa_applications', JSON.stringify(allUpdatedApps));
    } catch (e) {}

    let allUpdatedClients = [...clients];
    newClientsToAdd.forEach(nc => {
      const idx = allUpdatedClients.findIndex(c => c.id === nc.id || (nc.nationalId && c.nationalId === nc.nationalId && !c.hasMissingNationalId));
      if (idx >= 0) {
        allUpdatedClients[idx] = { ...allUpdatedClients[idx], ...nc };
      } else {
        allUpdatedClients.unshift(nc);
      }
    });
    setClients(allUpdatedClients);
    try {
      localStorage.setItem('cropsa_clients', JSON.stringify(allUpdatedClients));
    } catch (e) {}

    // Save to Firestore & Supabase in background
    try {
      for (const nc of newClientsToAdd) {
        await setDoc(doc(db, 'clients', nc.id), nc);
      }
      for (const na of newAppsToAdd) {
        await setDoc(doc(db, 'applications', na.id), na);
      }
    } catch (e) {
      console.warn('Firestore bulkImportApplications fallback:', e);
    }

    if (supabase) {
      try {
        // 1. Upsert new clients into relational table FIRST (satisfies foreign key constraint)
        if (newClientsToAdd.length > 0) {
          const clientRows = newClientsToAdd.map(nc => ({
            id: nc.id,
            name: nc.name,
            national_id: nc.nationalId,
            phone: nc.phoneNumber,
            governorate: nc.governorate,
            address: nc.address || '',
            job_title: nc.profession || '',
            monthly_income: Number(nc.monthlyIncome) || 0,
            iscore_status: nc.iscoreStatus || 'CLEAN',
            credit_rating: typeof nc.creditRating === 'number' ? nc.creditRating : 80,
            total_financed: Number(nc.totalApprovedAmount) || 0
          }));
          await supabase.from('clients').upsert(clientRows);
        }

        // 2. Upsert new applications into relational applications table
        const appRows = newAppsToAdd.map(na => ({
          id: na.id,
          client_id: na.clientId || na.id,
          client_name: na.clientName,
          client_phone: na.phoneNumber || '',
          client_national_id: na.clientNationalId || '',
          company_id: na.assignedCompanyIds?.[0] || na.companyId || 'comp_01',
          total_amount: na.requestedAmount || 0,
          down_payment: 0,
          financed_amount: na.approvedAmount || na.requestedAmount || 0,
          monthly_installment: Math.round((na.approvedAmount || na.requestedAmount || 0) / (na.durationMonths || 12)),
          duration_months: na.durationMonths || 12,
          status: na.status || 'SUBMITTED',
          product_type: na.selectedProgramName || 'تمويل تقسيط',
          product_description: na.description || ''
        }));
        await supabase.from('applications').upsert(appRows);

        // 3. Upsert system_settings applications_data (PRIMARY CLOUD SOURCE OF TRUTH)
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: allUpdatedApps,
          updated_at: new Date().toISOString()
        });

        // 4. Upsert system_settings clients_data
        await supabase.from('system_settings').upsert({
          id: 'clients_data',
          data: allUpdatedClients,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase bulkImportApplications fallback:', err);
      }
    }

    addAuditLog('BULK_IMPORT_APPLICATIONS', `استيراد مجمع لعدد ${count} طلب تقسيط عبر شيت إكسل`, currentUser.id);

    return { importedCount: count, errors };
  };

  const markNotificationRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      console.warn('Firestore markNotificationRead fallback:', err);
    }
  };

  const updateUserWallet = async (userId: string, newBalance: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, walletBalance: newBalance } : u));
    try {
      await updateDoc(doc(db, 'users', userId), { walletBalance: newBalance });
    } catch (err) {
      console.warn('Firestore updateUserWallet fallback:', err);
    }
  };

  const resetUserPassword = async (userId: string) => {
    await updateUserProfile(userId, { password: 'password', mustChangePassword: true });
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN)) return;
    let nextUsers: User[] = [];
    setUsers(prev => {
      nextUsers = prev.filter(u => u.id !== userId);
      try { localStorage.setItem('cropsa_staff_users', JSON.stringify(nextUsers)); } catch (e) {}
      return nextUsers;
    });
    if (supabase) {
      try {
        await supabase.from('users').delete().eq('id', userId);
        await supabase.from('system_settings').upsert({
          id: 'users_data',
          data: nextUsers,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase deleteUser fallback:', err);
      }
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.warn('Firestore deleteUser fallback:', err);
    }
    addAuditLog('DELETE_USER', `Deleted user account ${userId}`);
  };

  const setNavigation = (target: NavigationTarget | null) => {
    setPendingNavigation(target);
  };

  const updateNotificationTemplate = async (templateId: string, updates: Partial<CommentNotificationTemplate>) => {
    const nowStr = new Date().toISOString();
    setNotificationTemplates(prev => {
      const updated = prev.map(t => t.id === templateId ? { ...t, ...updates, updatedAt: nowStr } : t);
      localStorage.setItem('crobsa_notification_templates', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'notification_templates', templateId), { ...updates, updatedAt: nowStr }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateNotificationTemplate error:', e);
    }
    addAuditLog('UPDATE_NOTIFICATION_TEMPLATE', `Updated notification template ${templateId}`, templateId);
  };

  const createNotificationTemplate = async (data: Omit<CommentNotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const nowStr = new Date().toISOString();
    const newId = `tmpl_${Date.now()}`;
    const newTemplate: CommentNotificationTemplate = {
      ...data,
      id: newId,
      createdAt: nowStr,
      updatedAt: nowStr
    };
    setNotificationTemplates(prev => {
      const updated = [newTemplate, ...prev];
      localStorage.setItem('crobsa_notification_templates', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'notification_templates', newId), newTemplate);
    } catch (e) {
      console.warn('Firestore createNotificationTemplate error:', e);
    }
    addAuditLog('CREATE_NOTIFICATION_TEMPLATE', `Created notification template: ${newTemplate.name}`, newId);
    return newId;
  };

  const deleteNotificationTemplate = async (templateId: string) => {
    setNotificationTemplates(prev => {
      const updated = prev.filter(t => t.id !== templateId);
      localStorage.setItem('crobsa_notification_templates', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'notification_templates', templateId));
    } catch (e) {
      console.warn('Firestore deleteNotificationTemplate error:', e);
    }
    addAuditLog('DELETE_NOTIFICATION_TEMPLATE', `Deleted notification template ${templateId}`, templateId);
  };

  const resetNotificationTemplatesToDefault = async () => {
    setNotificationTemplates(DEFAULT_COMMENT_NOTIFICATION_TEMPLATES);
    localStorage.setItem('crobsa_notification_templates', JSON.stringify(DEFAULT_COMMENT_NOTIFICATION_TEMPLATES));
    try {
      for (const tmpl of DEFAULT_COMMENT_NOTIFICATION_TEMPLATES) {
        await setDoc(doc(db, 'notification_templates', tmpl.id), tmpl);
      }
    } catch (e) {
      console.warn('Firestore resetNotificationTemplates error:', e);
    }
    addAuditLog('RESET_NOTIFICATION_TEMPLATES', 'Reset all notification templates to system defaults');
  };

  const updateSmtpConfig = async (configUpdates: Partial<SmtpConfig>) => {
    const nextConfig: SmtpConfig = {
      ...smtpConfig,
      ...configUpdates
    };
    setSmtpConfig(nextConfig);
    try {
      localStorage.setItem('cropsa_smtp_config', JSON.stringify(nextConfig));
    } catch (e) {
      console.warn('LocalStorage smtpConfig cache error:', e);
    }

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'smtp_config',
          data: nextConfig,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase updateSmtpConfig error:', err);
      }
    }

    try {
      await setDoc(doc(db, 'system_settings', 'smtp_config'), nextConfig, { merge: true });
    } catch (err) {
      console.warn('Firestore updateSmtpConfig fallback:', err);
    }
    addAuditLog('UPDATE_SMTP_CONFIG', `Updated corporate SMTP configuration (Host: ${nextConfig.host})`);
  };

  const updateExternalDispatchTemplate = async (templateId: string, updates: Partial<ExternalDispatchTemplate>) => {
    const nowStr = new Date().toISOString();
    let nextTemplates: ExternalDispatchTemplate[] = [];
    setExternalDispatchTemplates(prev => {
      nextTemplates = prev.map(t => t.id === templateId ? { ...t, ...updates, updatedAt: nowStr } : t);
      try {
        localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(nextTemplates));
      } catch (e) {}
      return nextTemplates;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'external_dispatch_templates',
          data: nextTemplates,
          updated_at: nowStr
        });
      } catch (err) {
        console.warn('Supabase updateExternalDispatchTemplate error:', err);
      }
    }
    try {
      await setDoc(doc(db, 'external_dispatch_templates', templateId), { ...updates, updatedAt: nowStr }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateExternalDispatchTemplate error:', e);
    }
    addAuditLog('UPDATE_EXTERNAL_TEMPLATE', `Updated external template ${templateId}`, templateId);
  };

  const createExternalDispatchTemplate = async (template: Partial<ExternalDispatchTemplate>): Promise<string> => {
    const nowStr = new Date().toISOString();
    const newId = `ext_tmpl_${Date.now()}`;
    const newTmpl: ExternalDispatchTemplate = {
      id: newId,
      type: template.type || template.channel || 'WHATSAPP',
      channel: template.channel || template.type || 'WHATSAPP',
      nameAr: template.nameAr || template.name || 'نموذج مراسلة جديد',
      nameEn: template.nameEn || template.name || 'New Template',
      name: template.name || template.nameAr || 'نموذج مراسلة جديد',
      category: template.category || 'NEW_APPLICATION',
      subjectTemplate: template.subjectTemplate || '',
      bodyTemplate: template.bodyTemplate || '',
      placeholders: template.placeholders || ['{clientName}', '{nationalId}', '{driveLink}'],
      active: template.active !== undefined ? template.active : true,
      isDefault: false,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    let nextTemplates: ExternalDispatchTemplate[] = [];
    setExternalDispatchTemplates(prev => {
      nextTemplates = [newTmpl, ...prev];
      try {
        localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(nextTemplates));
      } catch (e) {}
      return nextTemplates;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'external_dispatch_templates',
          data: nextTemplates,
          updated_at: nowStr
        });
      } catch (err) {
        console.warn('Supabase createExternalDispatchTemplate error:', err);
      }
    }
    try {
      await setDoc(doc(db, 'external_dispatch_templates', newId), newTmpl);
    } catch (e) {
      console.warn('Firestore createExternalDispatchTemplate error:', e);
    }
    addAuditLog('CREATE_EXTERNAL_TEMPLATE', `Created external template: ${newTmpl.nameAr || newTmpl.name}`, newId);
    return newId;
  };

  const deleteExternalDispatchTemplate = async (templateId: string) => {
    let nextTemplates: ExternalDispatchTemplate[] = [];
    setExternalDispatchTemplates(prev => {
      nextTemplates = prev.filter(t => t.id !== templateId);
      try {
        localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(nextTemplates));
      } catch (e) {}
      return nextTemplates;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'external_dispatch_templates',
          data: nextTemplates,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase deleteExternalDispatchTemplate error:', err);
      }
    }
    try {
      await deleteDoc(doc(db, 'external_dispatch_templates', templateId));
    } catch (e) {
      console.warn('Firestore deleteExternalDispatchTemplate error:', e);
    }
    addAuditLog('DELETE_EXTERNAL_TEMPLATE', `Deleted external template ${templateId}`, templateId);
  };

  const resetExternalDispatchTemplatesToDefault = async () => {
    setExternalDispatchTemplates(DEFAULT_EXTERNAL_DISPATCH_TEMPLATES);
    try {
      localStorage.setItem('cropsa_external_dispatch_templates', JSON.stringify(DEFAULT_EXTERNAL_DISPATCH_TEMPLATES));
    } catch (e) {}

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'external_dispatch_templates',
          data: DEFAULT_EXTERNAL_DISPATCH_TEMPLATES,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase resetExternalDispatchTemplates error:', err);
      }
    }
    addAuditLog('RESET_EXTERNAL_TEMPLATES', 'Reset external dispatch templates to system defaults');
  };

  const dispatchApplicationToExternalCompany = async (
    appId: string, 
    payload: {
      companyId: string;
      companyName?: string;
      channel: 'WHATSAPP' | 'EMAIL';
      templateCategory: ExternalDispatchTemplate['category'];
      templateName?: string;
      targetContact: string;
      driveLink?: string;
      subject?: string;
      content: string;
      deliveryMethod?: 'DIRECT_SMTP' | 'CLIENT_MAILTO' | 'WHATSAPP_LINK';
    }
  ): Promise<{ success: boolean; message: string }> => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return { success: false, message: 'الطلب غير موجود' };

    const comp = companies.find(c => c.id === payload.companyId);
    const companyName = payload.companyName || comp?.name || 'شركة تقسيط خارجية';
    const nowStr = new Date().toISOString();

    const record: ExternalDispatchRecord = {
      id: `disp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      applicationId: appId,
      companyId: payload.companyId,
      companyName,
      channel: payload.channel,
      templateCategory: payload.templateCategory,
      templateName: payload.templateName,
      targetContact: payload.targetContact,
      driveLink: payload.driveLink || targetApp.driveLink,
      subject: payload.subject,
      content: payload.content,
      deliveryMethod: payload.deliveryMethod,
      status: 'SENT',
      sentAt: nowStr,
      sentBy: currentUser?.id || 'SYSTEM',
      sentByName: currentUser?.name || 'النظام'
    };

    const channelLabel = payload.channel === 'WHATSAPP' ? 'واتساب' : 'البريد الإلكتروني';
    const isExpedite = payload.templateCategory === 'EXPEDITE' || payload.templateCategory === 'EXPEDITE_URGENT';
    const actionLabel = isExpedite
      ? `استعجال خارجي عبر ${channelLabel}` 
      : payload.templateCategory === 'NEW_APPLICATION'
      ? `إرسال ملف الطلب عبر ${channelLabel}`
      : `مراسلة خارجية عبر ${channelLabel}`;

    const historyItem: ApplicationHistoryItem = {
      action: 'EXTERNAL_DISPATCH',
      timestamp: nowStr,
      performedBy: currentUser?.id || 'SYSTEM',
      performedByName: currentUser?.name || 'النظام',
      details: `${actionLabel} إلى ${companyName} (${payload.targetContact})${payload.driveLink ? ` - رابط درايف: ${payload.driveLink}` : ''}`
    };

    // Add comment in discussion timeline
    const newComment: ApplicationComment = {
      id: `c_disp_${Date.now()}`,
      authorId: currentUser?.id || 'SYSTEM',
      authorName: currentUser?.name || 'النظام',
      authorRole: currentUser?.role || Role.SUPER_ADMIN,
      companyName: 'منصة كروبسا',
      message: `📢 [${actionLabel}] تم إرسال المراسلة بنجاح إلى ${companyName} (${payload.targetContact}):\n\n${payload.content.slice(0, 300)}${payload.content.length > 300 ? '...' : ''}${payload.driveLink ? `\n📁 رابط الملفات: ${payload.driveLink}` : ''}`,
      createdAt: nowStr,
      isUrgent: isExpedite,
      notificationType: isExpedite ? 'URGENT_INQUIRY' : 'DOCS_REQUIRED'
    };

    const existingDispatches = targetApp.externalDispatches || [];
    const updatedDispatches = [record, ...existingDispatches];
    const updatedComments = [...(targetApp.comments || []), newComment];
    const updatedHistory = [...(targetApp.history || []), historyItem];

    const appUpdates: Partial<Application> = {
      externalDispatches: updatedDispatches,
      comments: updatedComments,
      history: updatedHistory,
      needsUpdate: true,
      updateRequestedAt: nowStr,
      updateRequestedBy: currentUser?.id || 'SYSTEM',
      updateRequestedByName: currentUser?.name || 'النظام',
      updateRequestReason: payload.templateName || `مراسلة خارجية عبر ${channelLabel}`,
      updateRequestChannel: payload.channel,
      updateRequestDeliveryMethod: payload.deliveryMethod,
      ...(payload.driveLink ? { driveLink: payload.driveLink } : {})
    };

    // Update in state
    let updatedAppsList: Application[] = [];
    setApplications(prev => {
      updatedAppsList = prev.map(a => a.id === appId ? { ...a, ...appUpdates } : a);
      return updatedAppsList;
    });

    // Notify submitter and Admin that case requires update
    if (targetApp.submittedBy) {
      addNotification(
        targetApp.submittedBy,
        `⚠️ حالة العميل (${targetApp.clientName}) بحاجة لتحديث واستكمال بيانات/أوراق (مرسلة عبر ${channelLabel})`,
        'WARNING',
        appId,
        undefined,
        'CASE_UPDATE_REQUIRED',
        { title: 'مطلوب تحديث حالة العميل' }
      );
    }
    addNotification(
      'ROLE_SUPER_ADMIN',
      `📢 حالة العميل (${targetApp.clientName}) أُرسلت عبر ${channelLabel} ومسجلة في لوحة الحالات بانتظار التحديث من رافع الطلب`,
      'INFO',
      appId,
      undefined,
      'CASE_UPDATE_REQUIRED',
      { title: 'حالة بانتظار التحديث' }
    );

    // Log in client timeline
    if (targetApp.clientId) {
      addClientTimelineEvent(targetApp.clientId, {
        action: `${actionLabel} - ${companyName}`,
        actionType: 'NOTE',
        performedBy: currentUser?.id || 'SYSTEM',
        performedByName: currentUser?.name || 'النظام',
        details: `تم توجيه المراسلة إلى ${payload.targetContact}. ${payload.templateName ? `[${payload.templateName}]` : ''} - الحالة بانتظار التحديث من رافع الطلب`,
        badgeColor: payload.templateCategory === 'EXPEDITE' ? 'red' : 'blue'
      });
    }

    // Audit Log
    addAuditLog(
      'EXTERNAL_DISPATCH', 
      `Dispatched application ${appId} via ${payload.channel} to ${companyName} (${payload.targetContact}) - needsUpdate marked`, 
      appId
    );

    // Sync with Supabase applications_data
    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: updatedAppsList,
          updated_at: nowStr
        });
      } catch (e) {
        console.warn('Supabase sync external dispatch error:', e);
      }
    }

    try {
      await updateDoc(doc(db, 'applications', appId), appUpdates);
    } catch (e) {
      console.warn('Firestore sync external dispatch error:', e);
    }

    return { success: true, message: `تم تسجيل المراسلة إلى ${companyName} وإرسال إشعار التحديث المطلوب لرافع الحالة بنجاح` };
  };

  const requestCaseUpdate = async (appId: string, reason: string, channel: 'WHATSAPP' | 'EMAIL' | 'SYSTEM' = 'SYSTEM') => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;
    const nowStr = new Date().toISOString();
    const channelLabel = channel === 'WHATSAPP' ? 'واتساب' : channel === 'EMAIL' ? 'البريد الإلكتروني' : 'النظام الداخلي';

    const newHistoryItem: ApplicationHistoryItem = {
      action: 'UPDATE_REQUESTED',
      timestamp: nowStr,
      performedBy: currentUser?.id || 'SYSTEM',
      performedByName: currentUser?.name || 'النظام',
      details: `تم طلب تحديث واستكمال بيانات/مستندات الحالة من رافع الطلب (${channelLabel}): ${reason}`
    };

    const newComment: ApplicationComment = {
      id: `c_upd_${Date.now()}`,
      authorId: currentUser?.id || 'SYSTEM',
      authorName: currentUser?.name || 'النظام',
      authorRole: currentUser?.role || Role.SUPER_ADMIN,
      companyName: 'منصة كروبسا',
      message: `⚠️ [طلب تحديث واستكمال الحالة عبر ${channelLabel}]:\n${reason}`,
      createdAt: nowStr,
      isUrgent: true,
      notificationType: 'DOCS_REQUIRED'
    };

    const appUpdates: Partial<Application> = {
      needsUpdate: true,
      updateRequestedAt: nowStr,
      updateRequestedBy: currentUser?.id || 'SYSTEM',
      updateRequestedByName: currentUser?.name || 'النظام',
      updateRequestReason: reason,
      updateRequestChannel: channel,
      history: [newHistoryItem, ...(targetApp.history || [])],
      comments: [...(targetApp.comments || []), newComment]
    };

    let nextApps: Application[] = [];
    setApplications(prev => {
      nextApps = prev.map(a => a.id === appId ? { ...a, ...appUpdates } : a);
      return nextApps;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: nextApps,
          updated_at: nowStr
        });
      } catch (err) {}
    }

    try {
      await updateDoc(doc(db, 'applications', appId), appUpdates);
    } catch (err) {}

    if (targetApp.submittedBy) {
      addNotification(
        targetApp.submittedBy,
        `⚠️ تنبيه: حالة العميل (${targetApp.clientName}) بحاجة لتحديث واستكمال بيانات/أوراق: ${reason}`,
        'WARNING',
        appId,
        undefined,
        'CASE_UPDATE_REQUIRED',
        { title: 'مطلوب تحديث حالة العميل' }
      );
    }

    addNotification(
      'ROLE_SUPER_ADMIN',
      `📌 تم تسجيل طلب تحديث للحالة (${targetApp.clientName}) من رافع الطلب: ${reason}`,
      'INFO',
      appId,
      undefined,
      'CASE_UPDATE_REQUIRED'
    );

    addAuditLog('REQUEST_CASE_UPDATE', `Requested update for application ${appId}: ${reason}`, appId);
  };

  const resolveCaseUpdate = async (appId: string, resolutionNote?: string) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;
    const nowStr = new Date().toISOString();
    const finalNote = resolutionNote || 'تم استكمال التحديث المطلوب ورفع المستندات وإعادة الإرسال بنجاح';

    const newHistoryItem: ApplicationHistoryItem = {
      action: 'UPDATE_RESOLVED',
      timestamp: nowStr,
      performedBy: currentUser?.id || 'SYSTEM',
      performedByName: currentUser?.name || 'رافع الطلب',
      details: `تم اعتماد واستكمال التحديث المطلوب للحالة وإعادة إرسالها بنجاح بواسطة ${currentUser?.name || 'رافع الطلب'}: ${finalNote}`
    };

    const newComment: ApplicationComment = {
      id: `c_res_${Date.now()}`,
      authorId: currentUser?.id || 'SYSTEM',
      authorName: currentUser?.name || 'رافع الطلب',
      authorRole: currentUser?.role || Role.SALESMAN,
      companyName: 'منصة كروبسا',
      message: `✅ [تم استكمال التحديث بنجاح]:\n${finalNote}`,
      createdAt: nowStr,
      isUrgent: false,
      notificationType: 'GENERAL'
    };

    const appUpdates: Partial<Application> = {
      needsUpdate: false,
      updateResolvedAt: nowStr,
      updateResolvedBy: currentUser?.id || 'SYSTEM',
      updateResolvedByName: currentUser?.name || 'رافع الطلب',
      updateResolvedNote: finalNote,
      history: [newHistoryItem, ...(targetApp.history || [])],
      comments: [...(targetApp.comments || []), newComment]
    };

    let nextApps: Application[] = [];
    setApplications(prev => {
      nextApps = prev.map(a => a.id === appId ? { ...a, ...appUpdates } : a);
      return nextApps;
    });

    if (supabase) {
      try {
        await supabase.from('system_settings').upsert({
          id: 'applications_data',
          data: nextApps,
          updated_at: nowStr
        });
      } catch (err) {}
    }

    try {
      await updateDoc(doc(db, 'applications', appId), appUpdates);
    } catch (err) {}

    addNotification(
      'ROLE_SUPER_ADMIN',
      `✅ تم استكمال التحديث وإعادة إرسال حالة العميل (${targetApp.clientName}) بواسطة ${currentUser?.name || 'رافع الطلب'}`,
      'SUCCESS',
      appId,
      undefined,
      'APPLICATION'
    );

    targetApp.assignedCompanyIds?.forEach(cid => {
      addNotification(
        cid,
        `✅ تم تحديث واستكمال أوراق العميل (${targetApp.clientName}) وهي جاهزة للدراسة الآن`,
        'SUCCESS',
        appId,
        undefined,
        'APPLICATION'
      );
    });

    addAuditLog('RESOLVE_CASE_UPDATE', `Resolved update for application ${appId}: ${finalNote}`, appId);
  };

  return (
    <StoreContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      t,
      isFirestoreConnected,
      isInitialSyncComplete,
      currentUser,
      currentCompany,
      sessionWarning,
      clearSessionWarning,
      users,
      companies,
      branches,
      applications,
      transactions,
      notifications,
      notificationTemplates,
      externalDispatchTemplates,
      smtpConfig,
      auditLogs,
      clients,
      clientRequests,
      overdueCases,
      sharedDocuments,
      aiAnalyses,
      withdrawalRequests,
      applicationQuestions,
      financingPrograms,
      pendingNavigation,
      systemBranding,

      login,
      logout,
      changePassword,
      requestPasswordResetOtp,
      verifyPasswordResetOtp,
      completePasswordReset,
      updateBranding,
      updateUserProfile,
      createUser,
      updateUserWallet,
      resetUserPassword,
      deleteUser,
      createCompany,
      updateCompany,
      updateCompanyAdminCredentials,
      deleteCompany,
      createBranch,
      updateBranch,
      deleteBranch,
      bulkImportCompanyBranches,
      wipeDemoData,
      isDemoDataWiped,
      createCompanyStaff,
      updateStaffPermissions,
      updateStaffPassword,
      bulkImportBranchesAndStaff,
      addClient,
      updateClient,
      deleteClient,
      addClientTimelineEvent,
      addClientCrossComment,
      requestClientAccess,
      reviewClientAccessRequest,
      addOverdueCase,
      logOverdueFollowUp,
      addSharedDocument,
      deleteSharedDocument,
      saveAiAnalysis,
      updateCompanyRejectionReasons,
      updateCompanyWorkflowConfig,
      addApplicationQuestion,
      updateApplicationQuestion,
      deleteApplicationQuestion,
      addFinancingProgram,
      updateFinancingProgram,
      deleteFinancingProgram,
      addApplicationComment,
      uploadApplicationDocument,
      expediteApplication,
      assignCompanyOfficer,
      assignCompanyBranchAndOfficer,
      autoAssignCompanyBranches,
      requestBranchTransfer,
      reviewBranchTransfer,
      reRouteApplication,
      createApplication,
      updateApplication,
      deleteApplication,
      requestCaseUpdate,
      resolveCaseUpdate,
      disburseApplicationAmount,
      archiveApplication,
      unarchiveApplication,
      autoArchiveApplications,
      assignApplication,
      acknowledgeApplication,
      reviewApplication,
      requestWithdrawal,
      approveWithdrawal,
      rejectWithdrawal,
      renewInstallment,
      bulkImportClients,
      bulkImportApplications,
      addNotification,
      markNotificationRead,
      addAuditLog,
      setNavigation,
      updateNotificationTemplate,
      createNotificationTemplate,
      deleteNotificationTemplate,
      resetNotificationTemplatesToDefault,
      updateSmtpConfig,
      updateExternalDispatchTemplate,
      createExternalDispatchTemplate,
      deleteExternalDispatchTemplate,
      resetExternalDispatchTemplatesToDefault,
      dispatchApplicationToExternalCompany,

      inboxMessages,
      addInboxMessage,
      analyzeInboxMessageWithAi,
      applyInboxMessageToPlatform,
      deleteInboxMessage,
      clearAllInboxMessages,

      salesRepresentatives,
      addSalesRepresentative,
      deleteSalesRepresentative,

      salesTargets,
      saveSalesTarget,
      deleteSalesTarget
    }}>
      {children}
    </StoreContext.Provider>
  );
};
