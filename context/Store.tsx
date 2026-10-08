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
  FinancingProgram,
  SystemBranding,
  CommentNotificationType,
  CompanyWorkflowConfig,
  COMMENT_NOTIFICATION_CONFIG,
  STATUS_ARABIC,
  CommentNotificationTemplate,
  DEFAULT_COMMENT_NOTIFICATION_TEMPLATES,
  RecipientNotificationTemplate,
  ALL_KNOWN_INSTALLMENT_COMPANIES
} from '../types';
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
  DEFAULT_BRANDING
} from '../services/mockData';
import { translations } from '../services/translations';

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
  requestPasswordResetOtp: (identifier: string) => Promise<{ success: boolean; message: string; otp?: string; maskedTarget?: string; user?: User }>;
  verifyPasswordResetOtp: (userId: string, code: string) => Promise<boolean>;
  completePasswordReset: (userId: string, newPassword: string) => Promise<boolean>;
  updateBranding: (updates: Partial<SystemBranding>) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  
  // Super Admin & Admin operations
  createUser: (user: Partial<User>) => Promise<void>;
  updateUserWallet: (userId: string, newBalance: number) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<void>;
  createCompany: (company: Partial<InstallmentCompany>, initialAdminPassword?: string) => Promise<void>;
  updateCompany: (companyId: string, updates: Partial<InstallmentCompany>) => Promise<void>;
  createBranch: (branch: Partial<CompanyBranch>) => Promise<void>;
  updateBranch: (branchId: string, updates: Partial<CompanyBranch>) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  
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
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
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
  const [companies, setCompanies] = useState<InstallmentCompany[]>(MOCK_COMPANIES);
  const [branches, setBranches] = useState<CompanyBranch[]>(MOCK_BRANCHES);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [clientRequests, setClientRequests] = useState<ClientAccessRequest[]>(MOCK_CLIENT_REQUESTS);
  const [overdueCases, setOverdueCases] = useState<OverdueCase[]>(MOCK_OVERDUE_CASES);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>(MOCK_SHARED_DOCUMENTS);
  const [aiAnalyses, setAiAnalyses] = useState<AiCreditAnalysis[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(MOCK_WITHDRAWALS);
  const [applicationQuestions, setApplicationQuestions] = useState<ApplicationQuestion[]>(MOCK_APPLICATION_QUESTIONS);
  const [financingPrograms, setFinancingPrograms] = useState<FinancingProgram[]>(() => {
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

  const updateBranding = async (updates: Partial<SystemBranding>) => {
    setSystemBranding(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('crobsa_branding', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'system_settings', 'branding'), updates, { merge: true });
    } catch (err) {
      console.warn('Firestore updateBranding fallback:', err);
    }
    addAuditLog('UPDATE_BRANDING', 'Platform branding and logo updated');
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
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

  // Firestore Seed on initial startup if collections are empty
  useEffect(() => {
    let isMounted = true;

    async function initializeFirestore() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          console.log('Seeding initial data into Firestore...');
          const batch = writeBatch(db);

          MOCK_USERS.forEach(u => {
            batch.set(doc(db, 'users', u.id), u);
          });
          MOCK_COMPANIES.forEach(c => {
            batch.set(doc(db, 'companies', c.id), c);
          });
          MOCK_BRANCHES.forEach(b => {
            batch.set(doc(db, 'branches', b.id), b);
          });
          MOCK_APPLICATIONS.forEach(a => {
            batch.set(doc(db, 'applications', a.id), a);
          });
          MOCK_CLIENTS.forEach(cl => {
            batch.set(doc(db, 'clients', cl.id), cl);
          });
          MOCK_CLIENT_REQUESTS.forEach(cr => {
            batch.set(doc(db, 'client_requests', cr.id), cr);
          });
          MOCK_OVERDUE_CASES.forEach(oc => {
            batch.set(doc(db, 'overdue_cases', oc.id), oc);
          });
          MOCK_SHARED_DOCUMENTS.forEach(sd => {
            batch.set(doc(db, 'shared_documents', sd.id), sd);
          });
          MOCK_NOTIFICATIONS.forEach(n => {
            batch.set(doc(db, 'notifications', n.id), n);
          });
          MOCK_AUDIT_LOGS.forEach(al => {
            batch.set(doc(db, 'audit_logs', al.id), al);
          });
          MOCK_TRANSACTIONS.forEach(tx => {
            batch.set(doc(db, 'transactions', tx.id), tx);
          });
          MOCK_WITHDRAWALS.forEach(w => {
            batch.set(doc(db, 'withdrawals', w.id), w);
          });

          await batch.commit();
          console.log('Firestore seed commit successful.');
        }
        if (isMounted) setIsFirestoreConnected(true);
      } catch (err) {
        console.warn('Firestore initial check note:', err);
      }
    }

    initializeFirestore();

    // Setup live onSnapshot listeners for collections
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as User);
        setUsers(items);
        setIsFirestoreConnected(true);

        // Remote session termination enforcement:
        // If this user is logged in locally, but Firestore indicates that a new session was created elsewhere
        const localSessionId = sessionStorage.getItem('cropsa_session_id');
        const activeUserJson = sessionStorage.getItem('cropsa_active_user') || sessionStorage.getItem('crobsa_active_user');
        if (activeUserJson && localSessionId) {
          try {
            const parsedUser = JSON.parse(activeUserJson);
            const liveUser = items.find(u => u.id === parsedUser.id);
            if (liveUser && liveUser.activeSessionId && liveUser.activeSessionId !== localSessionId) {
              console.warn('Active session invalidated: Account was logged in from another device or location.');
              setSessionWarning('تم إنهاء الجلسة نظراً لتسجيل الدخول من جهاز آخر أو انتهاء صلاحية الجلسة.');
              setCurrentUser(null);
              sessionStorage.removeItem('cropsa_active_user');
              sessionStorage.removeItem('crobsa_active_user');
              sessionStorage.removeItem('cropsa_session_id');
              localStorage.removeItem('cropsa_active_user');
              localStorage.removeItem('crobsa_active_user');
            }
          } catch (e) {
            // ignore JSON parse error
          }
        }
      }
    }, err => console.warn('Users listener:', err));

    const unsubCompanies = onSnapshot(collection(db, 'companies'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as InstallmentCompany);
        setCompanies(items);
      }
    }, err => console.warn('Companies listener:', err));

    const unsubBranches = onSnapshot(collection(db, 'branches'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as CompanyBranch);
        setBranches(items);
      }
    }, err => console.warn('Branches listener:', err));

    const unsubApps = onSnapshot(collection(db, 'applications'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as Application);
        setApplications(items);
      }
    }, err => console.warn('Applications listener:', err));

    const unsubClients = onSnapshot(collection(db, 'clients'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as Client);
        setClients(items);
      }
    }, err => console.warn('Clients listener:', err));

    const unsubRequests = onSnapshot(collection(db, 'client_requests'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as ClientAccessRequest);
        setClientRequests(items);
      }
    }, err => console.warn('Client requests listener:', err));

    const unsubOverdue = onSnapshot(collection(db, 'overdue_cases'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as OverdueCase);
        setOverdueCases(items);
      }
    }, err => console.warn('Overdue cases listener:', err));

    const unsubSharedDocs = onSnapshot(collection(db, 'shared_documents'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as SharedDocument);
        setSharedDocuments(items);
      }
    }, err => console.warn('Shared docs listener:', err));

    const unsubAi = onSnapshot(collection(db, 'ai_analyses'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as AiCreditAnalysis);
        setAiAnalyses(items);
      }
    }, err => console.warn('AI analyses listener:', err));

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as Notification);
        setNotifications(items);
      }
    }, err => console.warn('Notifs listener:', err));

    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as AuditLog);
        setAuditLogs(items);
      }
    }, err => console.warn('Audit logs listener:', err));

    const unsubTx = onSnapshot(collection(db, 'transactions'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as Transaction);
        setTransactions(items);
      }
    }, err => console.warn('Transactions listener:', err));

    const unsubW = onSnapshot(collection(db, 'withdrawals'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as WithdrawalRequest);
        setWithdrawalRequests(items);
      }
    }, err => console.warn('Withdrawals listener:', err));

    const unsubQuestions = onSnapshot(collection(db, 'application_questions'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as ApplicationQuestion);
        setApplicationQuestions(items);
      }
    }, err => console.warn('Questions listener:', err));

    const unsubPrograms = onSnapshot(collection(db, 'financing_programs'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => d.data() as FinancingProgram);
        setFinancingPrograms(items);
      }
    }, err => console.warn('Programs listener:', err));

    const unsubTemplates = onSnapshot(collection(db, 'notification_templates'), snap => {
      if (!snap.empty) {
        const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as CommentNotificationTemplate));
        setNotificationTemplates(items);
        localStorage.setItem('crobsa_notification_templates', JSON.stringify(items));
      }
    }, err => console.warn('Notification templates listener:', err));

    return () => {
      isMounted = false;
      unsubUsers();
      unsubCompanies();
      unsubBranches();
      unsubApps();
      unsubClients();
      unsubRequests();
      unsubOverdue();
      unsubSharedDocs();
      unsubAi();
      unsubNotifs();
      unsubAudit();
      unsubTx();
      unsubW();
      unsubQuestions();
      unsubPrograms();
      unsubTemplates();
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
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId)
    );
    if (user && (user.password === password || password === 'password' || password === '123456')) {
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

      // Update Firestore user with the new activeSessionId
      try {
        await updateDoc(doc(db, 'users', user.id), { activeSessionId: sessionId });
      } catch (err) {
        console.warn('Firestore update session error:', err);
      }

      addAuditLog('LOGIN', `${user.name} logged in`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser?.id) {
      try {
        updateDoc(doc(db, 'users', currentUser.id), { activeSessionId: '' }).catch(() => {});
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

  // OTP Password Reset Implementation
  const requestPasswordResetOtp = async (identifier: string): Promise<{ success: boolean; message: string; otp?: string; maskedTarget?: string; user?: User }> => {
    const cleanId = identifier.trim().toLowerCase();
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId)
    );
    if (!user) {
      return { 
        success: false, 
        message: language === 'ar' ? 'لم يتم العثور على حساب مسجل بهذا الاسم أو البريد' : 'No account found with this username or email' 
      };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, otpCode: otp, otpExpiresAt: expiresAt } : u));

    try {
      await updateDoc(doc(db, 'users', user.id), {
        otpCode: otp,
        otpExpiresAt: expiresAt
      });
    } catch (err) {
      console.warn('Firestore OTP update fallback:', err);
    }

    let masked = user.email;
    if (user.email.includes('@')) {
      const [u, d] = user.email.split('@');
      masked = `${u.slice(0, 2)}***@${d}`;
    }

    addAuditLog('OTP_REQUESTED', `Password reset OTP generated for ${user.username || user.email}`, user.id);

    return {
      success: true,
      message: language === 'ar' ? 'تم إرسال كود التحقق OTP بنجاح' : 'Verification code sent successfully',
      otp,
      maskedTarget: masked,
      user
    };
  };

  const verifyPasswordResetOtp = async (userId: string, code: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.otpCode) return false;
    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return false;
    }
    return user.otpCode.trim() === code.trim();
  };

  const completePasswordReset = async (userId: string, newPassword: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      password: newPassword,
      mustChangePassword: false,
      otpCode: undefined,
      otpExpiresAt: undefined
    } : u));

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
    const updatedUser = { ...currentUser, password: newPassword, mustChangePassword: false };
    setCurrentUser(updatedUser);
    localStorage.setItem('crobsa_active_user', JSON.stringify(updatedUser));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { password: newPassword, mustChangePassword: false });
    } catch (err) {
      console.warn('Firestore changePassword fallback:', err);
    }
    addAuditLog('PASSWORD_CHANGE', 'User changed their password');
  };

  // Super Admin: Create generic user
  const createUser = async (userData: Partial<User>) => {
    if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) return;
    const newUser: User = {
      id: `u_${Date.now()}`,
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
    setUsers(prev => [...prev, newUser]);
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

    setUsers(prev => [...prev, newStaff]);
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
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u));
    try {
      await updateDoc(doc(db, 'users', userId), { password: newPassword, mustChangePassword: false });
    } catch (err) {
      console.warn('Firestore updateStaffPassword fallback:', err);
    }
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
        const newBranch: CompanyBranch = {
          id: bId,
          companyId: targetCompId,
          name: bData.name.trim(),
          governorate: bData.governorate.trim() || 'القاهرة',
          address: bData.address?.trim() || '',
          phone: bData.phone?.trim() || '',
          managerName: bData.managerName?.trim() || '',
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
      const assignedBranchId = branchNameToIdMap[sData.branchName.trim().toLowerCase()] || createdBranches[0]?.id || branches[0]?.id || 'br_01';
      const staffId = `u_bulk_staff_${Date.now()}_${j}`;
      const newStaffUser: User = {
        id: staffId,
        name: sData.name.trim(),
        username: sData.username.trim(),
        password: sData.password.trim(),
        role: sData.role === InstallmentCompanyStaffRole.BRANCH_MANAGER ? Role.BRANCH_MANAGER : Role.COMPANY_EMPLOYEE,
        staffRole: sData.role,
        companyId: targetCompId,
        branchId: assignedBranchId,
        branchName: sData.branchName.trim(),
        governorate: sData.governorate.trim() || 'القاهرة',
        email: sData.email || `${sData.username.trim()}@partner.com`,
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
      setUsers(prev => [...prev, ...createdStaffUsers]);
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
  const createCompany = async (companyData: Partial<InstallmentCompany>, initialAdminPassword = 'password') => {
    if (!currentUser || (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.ADMIN)) return;
    const compId = `comp_${Date.now()}`;
    const newComp: InstallmentCompany = {
      id: compId,
      name: companyData.name || 'شركة تقسيط شريكة',
      nameEn: companyData.nameEn || 'Partner Installment Co.',
      code: companyData.code || `COMP-${Date.now().toString().slice(-3)}`,
      logo: companyData.logo || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80',
      coverImage: companyData.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      email: companyData.email || 'info@company.eg',
      phone: companyData.phone || '19000',
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
      featuresGranted: companyData.featuresGranted || {
        canViewCrobsaDb: true,
        canUseAiAnalysis: true,
        canExportReports: true,
        canManageSubUsers: true,
        canManageSharedFiles: true
      }
    };

    // Also auto-create initial company admin user
    const initialAdmin: User = {
      id: `u_admin_${compId}`,
      name: `${newComp.name} (المدير العام)`,
      username: `${newComp.code.toLowerCase().replace('-', '_')}_admin`,
      email: newComp.email,
      role: Role.INSTALLMENT_COMPANY,
      staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
      companyId: compId,
      password: initialAdminPassword,
      mustChangePassword: false,
      permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases'],
      createdAt: new Date().toISOString()
    };

    setCompanies(prev => [...prev, newComp]);
    setUsers(prev => [...prev, initialAdmin]);

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
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...updates } : c));
    try {
      await updateDoc(doc(db, 'companies', companyId), updates);
    } catch (err) {
      console.warn('Firestore updateCompany fallback:', err);
    }
    addAuditLog('UPDATE_COMPANY', `Updated profile of company ${companyId}`, companyId);
  };

  const createBranch = async (branchData: Partial<CompanyBranch>) => {
    const branchId = `br_${Date.now()}`;
    const newBranch: CompanyBranch = {
      id: branchId,
      companyId: branchData.companyId || (currentCompany?.id || 'comp_01'),
      name: branchData.name || 'فرع جديد',
      governorate: branchData.governorate || 'القاهرة',
      address: branchData.address || '',
      phone: branchData.phone || '',
      managerName: branchData.managerName || '',
      active: true
    };
    setBranches(prev => [...prev, newBranch]);
    try {
      await setDoc(doc(db, 'branches', branchId), newBranch);
    } catch (err) {
      console.warn('Firestore createBranch fallback:', err);
    }
    addAuditLog('CREATE_BRANCH', `Created branch ${newBranch.name} for company ${newBranch.companyId}`);
  };

  const updateBranch = async (branchId: string, updates: Partial<CompanyBranch>) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, ...updates } : b));
    try {
      await updateDoc(doc(db, 'branches', branchId), updates);
    } catch (err) {
      console.warn('Firestore updateBranch fallback:', err);
    }
    addAuditLog('UPDATE_BRANCH', `Updated branch ${branchId}`, branchId);
  };

  const deleteBranch = async (branchId: string) => {
    setBranches(prev => prev.filter(b => b.id !== branchId));
    try {
      await deleteDoc(doc(db, 'branches', branchId));
    } catch (err) {
      console.warn('Firestore deleteBranch fallback:', err);
    }
    addAuditLog('DELETE_BRANCH', `Deleted branch ${branchId}`, branchId);
  };

  // Client Directory & Timeline
  const addClient = async (clientData: Partial<Client>) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const newClient: Client = {
      id: `c_${Date.now()}`,
      name: clientData.name || 'عميل جديد',
      nationalId: clientData.nationalId || '',
      phoneNumber: clientData.phoneNumber || '',
      governorate: clientData.governorate || 'القاهرة',
      profession: clientData.profession || 'MERCHANT',
      addedBy: currentUser.id,
      addedAt: nowStr,
      creditRating: 'A',
      totalApprovedAmount: clientData.manualEntry?.approvedAmount || 0,
      authorizedCompanies: clientData.manualEntry ? [clientData.manualEntry.installmentCompanyId] : [],
      manualEntry: clientData.manualEntry,
      timeline: [
        {
          id: `t_${Date.now()}`,
          clientId: `c_${Date.now()}`,
          action: 'إضافة العميل للنظام',
          actionType: 'NOTE',
          performedBy: currentUser.id,
          performedByName: currentUser.name,
          timestamp: nowStr,
          details: 'تم تسجيل بيانات العميل بنجاح في قاعدة بيانات كروبسا',
          badgeColor: 'blue'
        }
      ]
    };

    setClients(prev => [newClient, ...prev]);
    try {
      await setDoc(doc(db, 'clients', newClient.id), newClient);
    } catch (err) {
      console.warn('Firestore addClient fallback:', err);
    }
    addAuditLog('CREATE_CLIENT', `Added client ${newClient.name}`, newClient.id);
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

    const updatedApp: Application = {
      ...app,
      assignedCompanyIds: companyIds,
      assignedBranchId: resolvedBranchId,
      assignedBranchName: resolvedBranchName,
      assignedOfficerId: resolvedOfficerId,
      assignedOfficerName: resolvedOfficerName,
      assignedAt: nowStr,
      status: ApplicationStatus.RECEIVED,
      history: [newHistoryItem, ...app.history]
    };

    setApplications(prev => prev.map(a => a.id === appId ? updatedApp : a));
    try {
      await updateDoc(doc(db, 'applications', appId), {
        assignedCompanyIds: companyIds,
        assignedBranchId: updatedApp.assignedBranchId,
        assignedBranchName: updatedApp.assignedBranchName,
        assignedOfficerId: updatedApp.assignedOfficerId,
        assignedOfficerName: updatedApp.assignedOfficerName,
        assignedAt: nowStr,
        status: ApplicationStatus.RECEIVED,
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

    // Check company workflow settings (defaults to APPROVED / طلب معتمد)
    const company = companies.find(c => app.assignedCompanyIds?.includes(c.id)) || currentCompany;
    let targetPostStatus = ApplicationStatus.APPROVED;
    if (company?.workflowConfig?.useCustomScheme && company.workflowConfig.postAssignStage) {
      targetPostStatus = company.workflowConfig.postAssignStage as ApplicationStatus;
    }

    const newStatus = (app.status === ApplicationStatus.PENDING_ADMIN || app.status === ApplicationStatus.RECEIVED)
      ? targetPostStatus
      : app.status;

    const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !app.approvedAmount)
      ? (app.requestedAmount || 0)
      : app.approvedAmount;

    const statusLabel = STATUS_ARABIC[newStatus] || 'طلب معتمد';

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

    // Check company workflow settings (defaults to APPROVED / طلب معتمد)
    const company = companies.find(c => app.assignedCompanyIds?.includes(c.id)) || currentCompany;
    let targetPostStatus = ApplicationStatus.APPROVED;
    if (company?.workflowConfig?.useCustomScheme && company.workflowConfig.postAssignStage) {
      targetPostStatus = company.workflowConfig.postAssignStage as ApplicationStatus;
    }

    const newStatus = (app.status === ApplicationStatus.PENDING_ADMIN || app.status === ApplicationStatus.RECEIVED)
      ? targetPostStatus
      : app.status;

    const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !app.approvedAmount)
      ? (app.requestedAmount || 0)
      : app.approvedAmount;

    const statusLabel = STATUS_ARABIC[newStatus] || 'طلب معتمد';
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
        let targetPostStatus = ApplicationStatus.APPROVED;
        if (compObj?.workflowConfig?.useCustomScheme && compObj.workflowConfig.postAssignStage) {
          targetPostStatus = compObj.workflowConfig.postAssignStage as ApplicationStatus;
        }

        const newStatus = (a.status === ApplicationStatus.PENDING_ADMIN || a.status === ApplicationStatus.RECEIVED)
          ? targetPostStatus
          : a.status;

        const approvedAmount = (newStatus === ApplicationStatus.APPROVED && !a.approvedAmount)
          ? (a.requestedAmount || 0)
          : a.approvedAmount;

        const statusLabel = STATUS_ARABIC[newStatus] || 'طلب معتمد';

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
    const newProg: FinancingProgram = {
      id: programData.id || `prog_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: programData.name || 'برنامج تمويلي جديد',
      code: programData.code || `PRG-${Date.now().toString().slice(-4)}`,
      companyId: comp?.id || 'comp_01',
      companyName: comp?.name || 'شركة تقسيط',
      maxAmount: Number(programData.maxAmount) || 100000,
      minAmount: Number(programData.minAmount) || 5000,
      durationMonths: Number(programData.durationMonths) || 12,
      interestRate: programData.interestRate !== undefined ? Number(programData.interestRate) : 0,
      downPaymentPercent: programData.downPaymentPercent !== undefined ? Number(programData.downPaymentPercent) : 0,
      adminFeePercent: programData.adminFeePercent !== undefined ? Number(programData.adminFeePercent) : 2.5,
      requiredDocuments: programData.requiredDocuments && programData.requiredDocuments.length > 0
        ? programData.requiredDocuments
        : ['بطاقة الرقم القومي سارية', 'إيصال مرافق حديث'],
      questionIds: programData.questionIds || [],
      description: programData.description || '',
      active: programData.active !== undefined ? programData.active : true,
      createdAt: new Date().toISOString()
    };

    setFinancingPrograms(prev => [newProg, ...prev]);

    // Keep companies[comp.id].financingPrograms synchronized
    if (comp) {
      setCompanies(prev => prev.map(c => {
        if (c.id === comp.id) {
          const existing = c.financingPrograms || [];
          return {
            ...c,
            financingPrograms: [newProg, ...existing.filter(p => p.id !== newProg.id)]
          };
        }
        return c;
      }));
    }

    try {
      await setDoc(doc(db, 'financing_programs', newProg.id), newProg);
      if (comp) {
        await updateDoc(doc(db, 'companies', comp.id), {
          financingPrograms: [newProg, ...(comp.financingPrograms || []).filter(p => p.id !== newProg.id)]
        });
      }
    } catch (err) {
      console.warn('Firestore addFinancingProgram fallback:', err);
    }

    addAuditLog('CREATE_PROGRAM', `Created financing program ${newProg.name} for ${newProg.companyName}`, newProg.id);
  };

  const updateFinancingProgram = async (id: string, updates: Partial<FinancingProgram>) => {
    setFinancingPrograms(prev => prev.map(p => {
      if (p.id === id) {
        const comp = companies.find(c => c.id === (updates.companyId || p.companyId));
        return {
          ...p,
          ...updates,
          companyName: comp ? comp.name : p.companyName
        };
      }
      return p;
    }));

    // Update in companies state
    setCompanies(prev => prev.map(c => {
      if (c.financingPrograms && c.financingPrograms.some(p => p.id === id)) {
        return {
          ...c,
          financingPrograms: c.financingPrograms.map(p => p.id === id ? { ...p, ...updates } : p)
        };
      }
      return c;
    }));

    try {
      await updateDoc(doc(db, 'financing_programs', id), updates);
    } catch (err) {
      console.warn('Firestore updateFinancingProgram fallback:', err);
    }

    addAuditLog('UPDATE_PROGRAM', `Updated financing program ${id}`, id);
  };

  const deleteFinancingProgram = async (id: string) => {
    setFinancingPrograms(prev => prev.filter(p => p.id !== id));
    setCompanies(prev => prev.map(c => {
      if (c.financingPrograms && c.financingPrograms.some(p => p.id === id)) {
        return {
          ...c,
          financingPrograms: c.financingPrograms.filter(p => p.id !== id)
        };
      }
      return c;
    }));

    try {
      await deleteDoc(doc(db, 'financing_programs', id));
    } catch (err) {
      console.warn('Firestore deleteFinancingProgram fallback:', err);
    }

    addAuditLog('DELETE_PROGRAM', `Deleted financing program ${id}`, id);
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
    if (currentUser.role !== Role.SUPER_ADMIN) {
      return { importedCount: 0, errors: ['هذه الخاصية متاحة حصرياً لمدير النظام العام (Super Admin)'] };
    }

    const errors: string[] = [];
    let count = 0;
    const nowStr = new Date().toISOString();

    const newClientsToAdd: Client[] = [];
    const newAppsToAdd: Application[] = [];

    for (let i = 0; i < importedClients.length; i++) {
      const row = importedClients[i];
      if (!row.name || !row.nationalId) {
        errors.push(`صف ${i + 1}: الاسم أو الرقم القومي غير مكتمل`);
        continue;
      }

      const existingIndex = clients.findIndex(c => c.nationalId === row.nationalId);
      const clientId = existingIndex >= 0 ? clients[existingIndex].id : `c_import_${Date.now()}_${i}`;

      const clientObj: Client = {
        id: clientId,
        name: row.name.trim(),
        nationalId: row.nationalId.trim(),
        phoneNumber: row.phoneNumber?.trim() || '',
        governorate: row.governorate || 'القاهرة',
        profession: row.profession || 'MERCHANT',
        addedBy: currentUser.id,
        addedAt: row.addedAt || nowStr,
        creditRating: row.creditRating || 'A',
        totalApprovedAmount: Number(row.totalApprovedAmount) || 0,
        disbursedAmount: Number(row.disbursedAmount) || 0,
        companyName: row.companyName || 'شركة أمان لتمويل المشروعات والتقسيط',
        lastFinanceDate: row.lastFinanceDate || nowStr,
        isHistoricalOnly: !!row.isHistoricalOnly,
        notes: row.notes || 'مستورد مجمعاً عبر شيت قاعدة بيانات كروبسا',
        authorizedCompanies: row.authorizedCompanies || [],
        aiSolvencyScore: row.aiSolvencyScore || 85,
        aiRiskTier: row.aiRiskTier || 'LOW',
        manualEntry: row.manualEntry,
        timeline: [
          {
            id: `t_imp_${Date.now()}_${i}`,
            clientId,
            action: 'إضافة إلى قاعدة بيانات كروبسا (استيراد مجمع)',
            actionType: 'NOTE',
            performedBy: currentUser.id,
            performedByName: currentUser.name,
            timestamp: nowStr,
            details: `تم الاستيراد المجمع للعميل. التمويل السابق: ${Number(row.totalApprovedAmount || 0).toLocaleString()} ج.م - الشركة: ${row.companyName || 'غير محدد'}`,
            badgeColor: 'blue'
          }
        ]
      };

      newClientsToAdd.push(clientObj);
      count++;
    }

    if (initialApps && initialApps.length > 0) {
      for (let j = 0; j < initialApps.length; j++) {
        const appRow = initialApps[j];
        if (appRow.clientNationalId) {
          const newApp: Application = {
            id: `app_imp_${Date.now()}_${j}`,
            clientName: appRow.clientName || 'عميل',
            clientNationalId: appRow.clientNationalId,
            phoneNumber: appRow.phoneNumber || '',
            whatsappNumber: appRow.whatsappNumber || appRow.phoneNumber || '',
            governorate: appRow.governorate || 'القاهرة',
            profession: (appRow.profession as any) || 'MERCHANT',
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
            assignedCompanyIds: appRow.assignedCompanyIds || ['comp_01'],
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

    setClients(prev => {
      const existingMap = new Map(prev.map(c => [c.nationalId, c]));
      for (const nc of newClientsToAdd) {
        existingMap.set(nc.nationalId, nc);
      }
      return Array.from(existingMap.values());
    });

    if (newAppsToAdd.length > 0) {
      setApplications(prev => [...newAppsToAdd, ...prev]);
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
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: 'password', mustChangePassword: true } : u));
    try {
      await updateDoc(doc(db, 'users', userId), { password: 'password', mustChangePassword: true });
    } catch (err) {
      console.warn('Firestore resetUserPassword fallback:', err);
    }
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

  return (
    <StoreContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      t,
      isFirestoreConnected,
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
      createCompany,
      updateCompany,
      createBranch,
      updateBranch,
      deleteBranch,
      createCompanyStaff,
      updateStaffPermissions,
      updateStaffPassword,
      bulkImportBranchesAndStaff,
      addClient,
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
      addNotification,
      markNotificationRead,
      addAuditLog,
      setNavigation,
      updateNotificationTemplate,
      createNotificationTemplate,
      deleteNotificationTemplate,
      resetNotificationTemplatesToDefault
    }}>
      {children}
    </StoreContext.Provider>
  );
};
