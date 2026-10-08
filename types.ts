export enum Role {
  SUPPLIER = 'SUPPLIER',
  SALESMAN = 'SALESMAN',
  INSTALLMENT_COMPANY = 'INSTALLMENT_COMPANY',
  BRANCH_MANAGER = 'BRANCH_MANAGER', // مدير فرع شركة التقسيط
  COMPANY_EMPLOYEE = 'COMPANY_EMPLOYEE', // موظف شركة التقسيط
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type Language = 'ar' | 'en';

export enum InstallmentCompanyStaffRole {
  COMPANY_ADMIN = 'COMPANY_ADMIN', // مدير شركة التقسيط
  BRANCH_MANAGER = 'BRANCH_MANAGER', // مدير فرع شركة التقسيط
  CREDIT_OFFICER = 'CREDIT_OFFICER', // موظف دراسة ائتمانية ومخاطر
  COMPANY_EMPLOYEE = 'COMPANY_EMPLOYEE', // موظف شركة التقسيط
  COLLECTION_AGENT = 'COLLECTION_AGENT', // مسؤول المتابعة والتحصيل
  SALES_OFFICER = 'SALES_OFFICER', // موظف مبيعات واستلام طلبات
  GENERAL_MANAGER = 'GENERAL_MANAGER', // المدير العام
  AUDITOR = 'AUDITOR', // المراجع المالي / المدقق
  LEGAL_OFFICER = 'LEGAL_OFFICER' // مسؤول الشؤون القانونية والعقود
}

export enum ApplicationStatus {
  PENDING_ADMIN = 'PENDING_ADMIN', // بانتظار توجيه الأدمن
  PENDING_REVIEW = 'PENDING_REVIEW', // بانتظار المراجعة
  RECEIVED = 'RECEIVED', // تم الاستلام من شركة التقسيط
  PAPER_REVIEW = 'PAPER_REVIEW', // مراجعة الأوراق
  ADDITIONAL_PAPERS = 'ADDITIONAL_PAPERS', // طلب أوراق إضافية
  ISCORE_CHECK = 'ISCORE_CHECK', // استعلام I-Score
  FIELD_INVESTIGATION = 'FIELD_INVESTIGATION', // الاستعلام الميداني
  CONTRACT_SIGNING = 'CONTRACT_SIGNING', // توقيع العقود
  APPROVED = 'APPROVED', // تمت الموافقة
  REJECTED = 'REJECTED', // مرفوض
  WITHDRAWN = 'WITHDRAWN', // طلب مسحوب
  CANCELLED_BY_CLIENT = 'CANCELLED_BY_CLIENT', // إلغاء من العميل
  AMOUNT_TRANSFERRED = 'AMOUNT_TRANSFERRED' // تم تحويل المبلغ
}

export const STATUS_ARABIC: Record<string, string> = {
  [ApplicationStatus.PENDING_ADMIN]: 'بانتظار الأدمن',
  [ApplicationStatus.RECEIVED]: 'طلب مستلم',
  [ApplicationStatus.PAPER_REVIEW]: 'مراجعة الأوراق',
  [ApplicationStatus.ADDITIONAL_PAPERS]: 'طلب أوراق إضافية',
  [ApplicationStatus.ISCORE_CHECK]: 'استعلام I-Score',
  [ApplicationStatus.FIELD_INVESTIGATION]: 'الاستعلام الميداني',
  [ApplicationStatus.CONTRACT_SIGNING]: 'توقيع العقود',
  [ApplicationStatus.APPROVED]: 'طلب معتمد',
  [ApplicationStatus.REJECTED]: 'مرفوض',
  [ApplicationStatus.CANCELLED_BY_CLIENT]: 'إلغاء من العميل',
  [ApplicationStatus.AMOUNT_TRANSFERRED]: 'تم تحويل المبلغ'
};

export const STATUS_ENGLISH: Record<string, string> = {
  [ApplicationStatus.PENDING_ADMIN]: 'Pending Admin',
  [ApplicationStatus.RECEIVED]: 'Received',
  [ApplicationStatus.PAPER_REVIEW]: 'Paper Review',
  [ApplicationStatus.ADDITIONAL_PAPERS]: 'Additional Papers Required',
  [ApplicationStatus.ISCORE_CHECK]: 'I-Score Check',
  [ApplicationStatus.FIELD_INVESTIGATION]: 'Field Investigation',
  [ApplicationStatus.CONTRACT_SIGNING]: 'Contract Signing',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected',
  [ApplicationStatus.CANCELLED_BY_CLIENT]: 'Cancelled by Client',
  [ApplicationStatus.AMOUNT_TRANSFERRED]: 'Amount Transferred'
};

export interface CompanyBranch {
  id: string;
  companyId: string;
  name: string;
  governorate: string;
  address: string;
  phone: string;
  managerName?: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  username?: string; // For instant login with username
  role: Role;
  staffRole?: InstallmentCompanyStaffRole;
  email: string;
  avatarUrl?: string;
  password?: string;
  mustChangePassword?: boolean;
  commissionRate?: number;
  walletBalance?: number;
  
  // Installment Company fields
  companyId?: string; // Belongs to which installment company
  governorate?: string; // Assigned governorate
  branchId?: string; // Assigned branch ID
  branchName?: string;
  permissions?: string[]; // Granular permissions (view_clients, request_access, ai_analysis, approve_apps, view_reports, manage_staff, followup_cases)
  createdBy?: string;
  createdAt?: string;
  phone?: string;
  activeSessionId?: string;
  otpCode?: string;
  otpExpiresAt?: string;
}

export interface SystemBranding {
  platformName: string;
  platformSubtitle: string;
  logoUrl: string;
  loginBannerUrl?: string;
  loginHeadline?: string;
  loginSubheadline?: string;
  themeColor?: string;
  loginBgStyle?: 'dark-slate' | 'navy-blue' | 'emerald-dark' | 'luxury-dark' | 'minimal-light' | 'custom';
  loginBgColor?: string;
  loginCardStyle?: 'glass' | 'solid-dark' | 'clean-white' | 'cropsa-card';
  loginInputStyle?: 'cropsa-bright' | 'cropsa-emerald-dark' | 'glass-outline' | 'clean-white';
  fontFamily?: 'Cairo' | 'Tajawal' | 'IBM Plex Sans Arabic' | 'Almarai' | 'sans-serif';
  loginFooterText?: string;
}

export interface FinancingProgram {
  id: string;
  name: string;
  code?: string;
  companyId?: string;
  companyName?: string;
  maxAmount: number;
  minAmount?: number;
  durationMonths: number;
  interestRate?: number;
  downPaymentPercent?: number;
  adminFeePercent?: number;
  requiredDocuments: string[];
  questionIds?: string[];
  description?: string;
  active?: boolean;
  createdAt?: string;
}

export interface InstallmentCompany {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  logo: string;
  coverImage?: string; // صورة غلاف / كافر الشركة
  email: string;
  phone: string;
  commercialRegister: string; // السجل التجاري
  taxNumber: string; // البطاقة الضريبية
  fraLicense: string; // ترخيص الهيئة العامة للرقابة المالية
  creditCeiling: number; // سقف التمويل بالجنيه
  usedCredit: number; // الرصيد المستخدم
  commissionRate: number; // نسبة عمولة كروبسا
  allowedGovernorates: string[];
  requiredDocumentsList: string[]; // الأوراق المطلوبة من العملاء
  financingPrograms?: FinancingProgram[]; // برامج التمويل والحدود الائتمانية للشركة
  rejectionReasons?: string[]; // أسباب الرفض المعيارية التي يحددها مدير الشركة لموظفيه
  workflowConfig?: CompanyWorkflowConfig; // مخطط ومراحل مسار دراسة الطلبات الخاص بالشركة
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
  createdAt: string;
  featuresGranted: {
    canViewCrobsaDb: boolean;
    canUseAiAnalysis: boolean;
    canExportReports: boolean;
    canManageSubUsers: boolean;
    canManageSharedFiles: boolean;
  };
}

export type CommentNotificationType = 
  | 'GENERAL' 
  | 'URGENT_INQUIRY' 
  | 'DOCS_REQUIRED' 
  | 'FIELD_CREDIT_ALERT' 
  | 'APPROVAL_UPDATE' 
  | 'WARNING_ALERT';

export const COMMENT_NOTIFICATION_CONFIG: Record<CommentNotificationType, {
  labelAr: string;
  labelEn: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  iconType: string;
  descriptionAr: string;
}> = {
  GENERAL: {
    labelAr: 'إشعار وملاحظة عامة',
    labelEn: 'General Note',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    dotColor: 'bg-slate-400',
    iconType: 'general',
    descriptionAr: 'ملاحظة دورية أو متابعة عادية بخصوص الطلب'
  },
  URGENT_INQUIRY: {
    labelAr: 'استفسار وتنبيه عاجل',
    labelEn: 'Urgent Inquiry',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderColor: 'border-amber-400',
    dotColor: 'bg-amber-500',
    iconType: 'urgent',
    descriptionAr: 'استعجال فوري لرد الأطراف وتنبيه بسرعة الفحص'
  },
  DOCS_REQUIRED: {
    labelAr: 'طلب مستندات وأوراق إضافية',
    labelEn: 'Docs Required',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    borderColor: 'border-blue-400',
    dotColor: 'bg-blue-500',
    iconType: 'docs',
    descriptionAr: 'طلب إيصال مرافق، بطاقة ضامن، أو مستند ناقص'
  },
  FIELD_CREDIT_ALERT: {
    labelAr: 'ملاحظة ائتمانية واستعلام ميداني',
    labelEn: 'Credit & Field Alert',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    borderColor: 'border-purple-400',
    dotColor: 'bg-purple-500',
    iconType: 'credit',
    descriptionAr: 'ملاحظات المعاينة الميدانية أو سجلات آي سكور'
  },
  APPROVAL_UPDATE: {
    labelAr: 'تحديث اعتماد وموافقة أولية',
    labelEn: 'Approval Update',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderColor: 'border-emerald-400',
    dotColor: 'bg-emerald-500',
    iconType: 'approval',
    descriptionAr: 'موافقة مبدئية على السقف أو شروط الاعتماد'
  },
  WARNING_ALERT: {
    labelAr: 'تحذير أو توجيه إداري هام',
    labelEn: 'Warning Alert',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    borderColor: 'border-rose-400',
    dotColor: 'bg-rose-500',
    iconType: 'warning',
    descriptionAr: 'تنبيه بشأن مخاطر مرتفعة أو تعارض بيانات'
  }
};

export interface RecipientNotificationTemplate {
  enabled: boolean;
  titleTemplate: string;
  bodyTemplate: string;
}

export interface CommentNotificationTemplate {
  id: string;
  commentType: CommentNotificationType;
  name: string;
  description?: string;
  isActive: boolean;
  priority: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  recipients: {
    systemAdmin: RecipientNotificationTemplate;  // مدير النظام
    companyAdmin: RecipientNotificationTemplate; // مدير شركة التقسيط ومدير الفرع
    submitter: RecipientNotificationTemplate;    // الموظف مقدم الطلب
  };
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_COMMENT_NOTIFICATION_TEMPLATES: CommentNotificationTemplate[] = [
  {
    id: 'tmpl_general',
    commentType: 'GENERAL',
    name: 'قالب الملاحظات العامة والمتابعة',
    description: 'يُستخدم عند كتابة ملاحظة أو استفسار متابعة روتيني بخصوص الطلب',
    isActive: true,
    priority: 'INFO',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: 'ملاحظة عامة على طلب #{appId} ({clientName})',
        bodyTemplate: 'قام {senderName} بإضافة تعليق جديد على طلب العميل {clientName}: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: 'متابعة طلب العميل {clientName}',
        bodyTemplate: 'أضاف {senderName} ملاحظة متابعة جديدة: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: 'إشعار متابعة لطلب العميل {clientName}',
        bodyTemplate: 'أضاف موظف شركة التقسيط ({senderName}) تعليقاً على طلبك: "{commentSnippet}"'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl_urgent',
    commentType: 'URGENT_INQUIRY',
    name: 'قالب الاستفسارات والتنبيهات العاجلة',
    description: 'يُستخدم عند وجود استفسار ذو أولوية قصوى يتطلب رداً وتدقيقاً سريعاً',
    isActive: true,
    priority: 'WARNING',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: '⚡ تنبيه عاجل على طلب #{appId} ({clientName})',
        bodyTemplate: 'استفسار عاجل مسجل من {senderName} بخصوص طلب العميل {clientName}: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: '⚡ استعجال هام بفرعكم: طلب {clientName}',
        bodyTemplate: 'تنبيه عاجل من {senderName} يتطلب تدخلاً سريعاً: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: '⚡ مطلوب رد عاجل بشأن طلب العميل {clientName}',
        bodyTemplate: 'تنبيه عاجل من شركة التقسيط ({senderName}): "{commentSnippet}" - يرجى سرعة المراجعة والرد.'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl_docs',
    commentType: 'DOCS_REQUIRED',
    name: 'قالب طلب الأوراق والمستندات التكميلية',
    description: 'يُستخدم لتوجيه المندوب أو المورد باستيفاء أوراق ناقصة (إيصال مرافق، بطاقة ضامن، عقد)',
    isActive: true,
    priority: 'INFO',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: 'طلب مستندات إضافية للعميل {clientName} (#{appId})',
        bodyTemplate: 'طلب مسؤول الائتمان {senderName} مستندات ناقصة للعميل {clientName}: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: 'مستندات مطلوبة للعميل {clientName}',
        bodyTemplate: 'تم طلب وثائق إضافية لإكمال فحص ودراسة ملف {clientName}: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: '📄 مطلوب استيفاء مستندات لطلب {clientName}',
        bodyTemplate: 'يرجى رفع المستندات المطلوبة من قبل {senderName}: "{commentSnippet}"'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl_credit',
    commentType: 'FIELD_CREDIT_ALERT',
    name: 'قالب ملاحظات الفحص والتحري الميداني',
    description: 'يُستخدم عند تدوين نتائج الاستعلام الميداني أو تقارير الآي سكور والزيارة',
    isActive: true,
    priority: 'INFO',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: 'تقرير استعلام / فحص ميداني - طلب #{appId}',
        bodyTemplate: 'سجل {senderName} إفادة الفحص الميداني للعميل {clientName}: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: 'تحديث الاستعلام الميداني للعميل {clientName}',
        bodyTemplate: 'تقرير ميداني من مسؤول الائتمان {senderName}: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: 'تحديث الفحص والاستعلام لطلب {clientName}',
        bodyTemplate: 'أفاد فريق المعاينة والاستعلام ({senderName}): "{commentSnippet}"'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl_approval',
    commentType: 'APPROVAL_UPDATE',
    name: 'قالب إفادات الاعتماد والموافقة المبدئية',
    description: 'يُستخدم عند صدور توصية بالاعتماد، تعديل السقف المالي، أو شروط الموافقة',
    isActive: true,
    priority: 'SUCCESS',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: 'تحديث اعتماد وموافقة للعميل {clientName} (#{appId})',
        bodyTemplate: 'سجل {senderName} إفادة اعتماد وموافقة للطلب: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: 'موافقة ائتمانية جديدة: {clientName}',
        bodyTemplate: 'أصدر {senderName} إفادة اعتماد للملف: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: '🎉 تحديث اعتماد وموافقة لطلب العميل {clientName}',
        bodyTemplate: 'أخبار سارة! أصدرت شركة التقسيط ({senderName}) إفادة اعتماد: "{commentSnippet}"'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'tmpl_warning',
    commentType: 'WARNING_ALERT',
    name: 'قالب التحذيرات والتعارضات الرقابية',
    description: 'يُستخدم عند رصد شبهة تعارض بيانات، قوائم سلبية، أو مخاطر استعلام مرتفعة',
    isActive: true,
    priority: 'ERROR',
    recipients: {
      systemAdmin: {
        enabled: true,
        titleTemplate: '🚨 تحذير رقابي / تعارض بيانات - طلب #{appId}',
        bodyTemplate: 'تحذير هام من {senderName} بخصوص طلب العميل {clientName}: "{commentSnippet}"'
      },
      companyAdmin: {
        enabled: true,
        titleTemplate: '🚨 تنبيه مخاطر ائتمانية للعميل {clientName}',
        bodyTemplate: 'سجل مسؤول الفحص {senderName} تنبيهاً بشأن مخاطر الملف: "{commentSnippet}"'
      },
      submitter: {
        enabled: true,
        titleTemplate: '⚠️ تنبيه هام بشأن طلب العميل {clientName}',
        bodyTemplate: 'تنبيه مسجل من إدارة الائتمان ({senderName}): "{commentSnippet}"'
      }
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export interface WorkflowStageConfig {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  order: number;
  description?: string;
  color?: string;
  isLocked?: boolean;
}

export interface CompanyWorkflowConfig {
  useCustomScheme: boolean;
  autoApproveOnAssign: boolean;
  postAssignStage?: string;
  stages: WorkflowStageConfig[];
}

export const DEFAULT_COMPANY_WORKFLOW_STAGES: WorkflowStageConfig[] = [
  {
    id: 'stage_received',
    key: ApplicationStatus.RECEIVED,
    name: 'طلب مستلم',
    enabled: true,
    order: 1,
    description: 'المرحلة الابتدائية لكافة الطلبات الجديدة الواردة للشركة تحت الإسناد',
    color: 'sky',
    isLocked: true
  },
  {
    id: 'stage_approved',
    key: ApplicationStatus.APPROVED,
    name: 'طلب معتمد',
    enabled: true,
    order: 2,
    description: 'المرحلة التلقائية فور قيام الشركة أو مدير الفرع بإسناد الحالة',
    color: 'emerald'
  },
  {
    id: 'stage_paper_review',
    key: ApplicationStatus.PAPER_REVIEW,
    name: 'مراجعة الأوراق والمستندات',
    enabled: true,
    order: 3,
    description: 'فحص اكتمال وصحة المستندات والبطاقات والوثائق الائتمانية',
    color: 'blue'
  },
  {
    id: 'stage_iscore',
    key: ApplicationStatus.ISCORE_CHECK,
    name: 'استعلام I-Score',
    enabled: true,
    order: 4,
    description: 'الاستعلام عن التقييم الائتماني والالتزامات القائمة',
    color: 'indigo'
  },
  {
    id: 'stage_field',
    key: ApplicationStatus.FIELD_INVESTIGATION,
    name: 'الاستعلام الميداني',
    enabled: true,
    order: 5,
    description: 'المعاينة الميدانية للنشاط التجاري أو الحيازة ومقر العمل',
    color: 'purple'
  },
  {
    id: 'stage_contract',
    key: ApplicationStatus.CONTRACT_SIGNING,
    name: 'توقيع العقود',
    enabled: true,
    order: 6,
    description: 'توقيع العقد الرسمي وسندات لأمر مع العميل والضامنين',
    color: 'amber'
  },
  {
    id: 'stage_disbursed',
    key: ApplicationStatus.AMOUNT_TRANSFERRED,
    name: 'صرف التمويل وتحويل المبلغ',
    enabled: true,
    order: 7,
    description: 'تنفيذ صرف المبلغ المعتمد للعميل وتسجيل إيصال الصرف',
    color: 'emerald'
  }
];

export interface ApplicationComment {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  senderRole: string; // 'SALESMAN' | 'ADMIN' | 'SUPER_ADMIN' | 'INSTALLMENT_COMPANY'
  senderCompanyName?: string;
  message: string;
  createdAt: string;
  isUrgent?: boolean;
  notificationType?: CommentNotificationType;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: 'NATIONAL_ID_FRONT' | 'NATIONAL_ID_BACK' | 'NATIONAL_ID' | 'UTILITY_BILL' | 'AGRICULTURAL_HOLDING' | 'INCOME_PROOF' | 'COMMERCIAL_REG' | 'COMMERCIAL_REGISTER' | 'CHECKS' | 'TRUST_RECEIPT' | 'OTHER' | string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface ApplicationQuestion {
  id: string;
  labelAr: string;
  labelEn: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'yes_no';
  options?: string[];
  required: boolean;
  category: 'FARMING' | 'FINANCIAL' | 'PERSONAL' | 'GENERAL' | 'AGRICULTURAL' | 'ASSETS';
  programIds?: string[]; // IDs of specific financing programs this question belongs to (empty = all programs)
  companyId?: string;
  description?: string;
  active: boolean;
  order: number;
}

export interface ApplicationHistoryItem {
  action: string;
  timestamp: string;
  performedBy: string;
  performedByName?: string;
  details?: string;
}

export interface Application {
  id: string;
  clientName: string;
  clientNationalId: string;
  phoneNumber: string;
  whatsappNumber: string;
  governorate: string;
  assignedBranchId?: string;
  assignedBranchName?: string;
  
  // Internal staff assignment within installment company
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  
  profession: 'MERCHANT' | 'FARMER' | 'FARM_OWNER' | 'EQUIPMENT_OWNER';
  financeType: 'INSTALLMENT' | 'DEFERRED';
  durationMonths: number;
  requestedAmount: number;
  
  hasRecentInstallment: boolean;
  hasRecentReceipt: boolean;
  recentReceiptAmount?: number;

  approvedAmount?: number;
  usedAmount: number;
  status: ApplicationStatus;
  documentLink?: string;
  
  submittedBy: string;
  submittedAt: string;
  
  assignedCompanyIds: string[];
  assignedAt?: string;

  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;

  // Rejection Details
  rejectionReason?: string;
  rejectionNotes?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;

  // Expedited / Urgent State
  isUrgent?: boolean;
  urgentRequestedAt?: string;
  urgentRequestedBy?: string;
  urgentRequestedByName?: string;

  // Custom Answers from Super Admin questions
  customAnswers?: Record<string, any>;

  // Uploaded Files / Documents attached to application
  documents?: ApplicationDocument[];

  // Selected Financing Program for the company
  selectedProgramId?: string;
  selectedProgramName?: string;

  // Branch Transfer Request (requested by Branch Manager to relocate case)
  branchTransferRequest?: {
    targetBranchId: string;
    targetBranchName: string;
    reason: string;
    requestedBy: string;
    requestedByName: string;
    requestedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewNote?: string;
  };

  // Real-time Discussion / Case Notes between Salesman, Admin & Company
  comments?: ApplicationComment[];

  // Re-routing history if re-routed after rejection
  reRouteHistory?: {
    fromCompanyId: string;
    fromCompanyName?: string;
    toCompanyId: string;
    toCompanyName?: string;
    routedBy: string;
    routedByName: string;
    routedAt: string;
    reason: string;
  }[];

  // Archiving (Auto-archive for rejected or >6 months old)
  isArchived?: boolean;
  archivedAt?: string;
  archivedReason?: string;

  description: string;
  history: ApplicationHistoryItem[];
}

export interface ClientTimelineItem {
  id: string;
  clientId: string;
  action: string;
  actionType: 'APPLICATION' | 'STATUS_CHANGE' | 'PAYMENT' | 'FOLLOWUP' | 'AI_ANALYSIS' | 'NOTE' | 'ACCESS_REQUEST' | 'DOC_UPLOAD';
  performedBy: string;
  performedByName: string;
  companyName?: string;
  timestamp: string;
  details: string;
  badgeColor?: string;
}

export interface CompanyReferenceItem {
  code: string;
  nameAr: string;
  nameEn: string;
  category: 'ACTIVE_PLATFORM' | 'HISTORICAL_OR_EXTERNAL';
  isPlatformActive: boolean;
  typicalPrograms: string;
  notes?: string;
}

export const ALL_KNOWN_INSTALLMENT_COMPANIES: CompanyReferenceItem[] = [
  {
    code: 'comp_01',
    nameAr: 'شركة أمان لتمويل المشروعات والتقسيط',
    nameEn: 'Aman Microfinance & Consumer',
    category: 'ACTIVE_PLATFORM',
    isPlatformActive: true,
    typicalPrograms: 'تمويل مشروعات، بذور، أعلاف، تقسيط أفراد وتجار'
  },
  {
    code: 'comp_02',
    nameAr: 'شركة فاليو للحلول التمويلية الذكية (Valu)',
    nameEn: 'Valu Smart Financing Solutions',
    category: 'ACTIVE_PLATFORM',
    isPlatformActive: true,
    typicalPrograms: 'تقسيط فوري، تمويل تجاري، مشروعات إنتاجية'
  },
  {
    code: 'comp_03',
    nameAr: 'شركة فرصة للتمويل والتقسيط الزراعي (Forsa)',
    nameEn: 'Forsa Agricultural Financing',
    category: 'ACTIVE_PLATFORM',
    isPlatformActive: true,
    typicalPrograms: 'حيازات زراعية، معدات، محاصيل، أسمدة'
  },
  {
    code: 'CONTACT',
    nameAr: 'شركة كونتكت للتمويل الاستهلاكي (Contact)',
    nameEn: 'Contact Financial Holding',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تقسيط تجاري وسيارات وتمويل استهلاكي عام'
  },
  {
    code: 'SOUHOOLA',
    nameAr: 'شركة سهولة لخدمات التقسيط والتمويل (Souhoola)',
    nameEn: 'Souhoola Financing',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تقسيط أجهزة وسلع وسلف متوسطة'
  },
  {
    code: 'HALA_MNT',
    nameAr: 'إم إن تي حالا للتمويل والمدفوعات (MNT-Halan)',
    nameEn: 'MNT-Halan',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تمويل متناهي الصغر، مدفوعات، تمويل أفراد'
  },
  {
    code: 'MASHROOEY',
    nameAr: 'شركة مشروعي لخدمات التقسيط والتجارة',
    nameEn: 'Mashroey Financing',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'مركبات خفيفة، معدات زراعية وتجارية'
  },
  {
    code: 'TAMWEELY',
    nameAr: 'شركة تمويلي للمشروعات متناهية الصغر',
    nameEn: 'Tamweely Microfinance',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تمويل أنشطة إنتاجية وتجارية وريفية'
  },
  {
    code: 'BLINK',
    nameAr: 'شركة بلنك لحلول التقسيط الذكي (Blink)',
    nameEn: 'Blink Fintech',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تقسيط سلع رقمي سريع'
  },
  {
    code: 'SANADAH',
    nameAr: 'شركة سندة للتمويل الأصغر والريفي',
    nameEn: 'Sanad Microfinance',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تمويل صغار المزارعين والريف'
  },
  {
    code: 'PREMIER',
    nameAr: 'شركة بريميير كارد لخدمات التقسيط (Premier Card)',
    nameEn: 'Premier Card',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'بطاقات تقسيط وتسهيلات ائتمانية'
  },
  {
    code: 'KASHAT',
    nameAr: 'شركة كاشات للتمويل الأصغر الرقمي (Kashat)',
    nameEn: 'Kashat Nanofinance',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تمويلات صغيرة فورية'
  },
  {
    code: 'BASATA',
    nameAr: 'شركة بساطة القابضة للمدفوعات والتمويل',
    nameEn: 'Basata Financial',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'مدفوعات وتقسيط أفراد وتجار'
  },
  {
    code: 'AGRI_BANK',
    nameAr: 'البنك الزراعي المصري (تمويل زراعي وسلف محاصيل)',
    nameEn: 'Agricultural Bank of Egypt',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'سلف زراعية ومحاصيل وحيازات كارت الفلاح'
  },
  {
    code: 'MSMEDA',
    nameAr: 'جهاز تنمية المشروعات المتوسطة والصغيرة (MSMEDA)',
    nameEn: 'MSMEDA Egypt',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'قروض مشروعات إنتاجية وتجارية ميسرة'
  },
  {
    code: 'OTHER',
    nameAr: 'شركة تقسيط أخرى / سجل أرشيفي خارجي',
    nameEn: 'Other Historical Entity',
    category: 'HISTORICAL_OR_EXTERNAL',
    isPlatformActive: false,
    typicalPrograms: 'تمويلات سابقة وسجلات خارجية'
  }
];

export interface RenewalAiAnalysisResult {
  score: number; // 0 - 100
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendedAmount: number;
  recommendedDurationMonths: number;
  bestCompanyId: string;
  bestCompanyName: string;
  companyMatchingReason: string;
  clientStory: string; // قصة العميل الائتمانية والتحليل الشامل
  strengths: string[];
  recommendations: string[];
  confidence: number;
}

export interface Client {
  id: string;
  name: string;
  nationalId: string;
  phoneNumber?: string;
  governorate?: string;
  profession?: string;
  addedBy: string;
  addedAt: string;
  creditRating?: 'A+' | 'A' | 'B' | 'C' | 'D';
  totalApprovedAmount?: number;
  disbursedAmount?: number; // إجمالي المبلغ المنصرف أو المستخدم
  companyName?: string; // الشركة الممولة الحالية أو السابقة
  lastFinanceDate?: string; // تاريخ آخر تمويل أو صرف
  isHistoricalOnly?: boolean; // مستورد من سجلات شركات سابقة
  notes?: string;
  authorizedCompanies?: string[]; // Company IDs that have unlocked this client
  
  // AI Solvency Assessment & Metrics
  aiSolvencyScore?: number; // 0 - 100
  aiRiskTier?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  aiSolvencySummary?: string;
  aiSuggestedLimit?: number;
  monthlyIncome?: number;
  monthlyObligations?: number;
  
  manualEntry?: {
    installmentCompanyId: string;
    companyName?: string;
    approvedAmount: number;
    disbursedAmount?: number;
    approvalDate: string;
    lastWithdrawalDate?: string;
    documentLink?: string;
    notes?: string;
  };
  timeline?: ClientTimelineItem[];
}

export interface ClientAccessRequest {
  id: string;
  companyId: string;
  companyName: string;
  clientId: string;
  clientName: string;
  clientNationalId: string;
  requestedBy: string;
  requestedByName: string;
  requestReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface OverdueCase {
  id: string;
  clientId: string;
  clientName: string;
  phoneNumber: string;
  governorate: string;
  companyId: string;
  applicationId: string;
  totalLoan: number;
  installmentAmount: number;
  overdueAmount: number;
  dueDate: string;
  daysOverdue: number; // أيام التأخير
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedAgent: string;
  assignedBranchId?: string;
  lastFollowUpDate?: string;
  lastFollowUpNotes?: string;
  collectionStatus: 'PENDING_CONTACT' | 'PROMISED_TO_PAY' | 'RESCHEDULED' | 'PAID' | 'LEGAL_ACTION';
  followUpHistory: {
    id: string;
    date: string;
    agent: string;
    type: 'PHONE_CALL' | 'SMS' | 'VISIT' | 'OFFICIAL_WARNING';
    note: string;
    promisedPaymentDate?: string;
  }[];
}

export interface SharedDocument {
  id: string;
  title: string;
  titleEn: string;
  category: 'CONTRACT_TEMPLATE' | 'CUSTOMER_DOC_REQUIREMENT' | 'PARTNERSHIP_AGREEMENT' | 'POLICY' | 'FORM';
  companyId: string | 'ALL'; // 'ALL' = all companies, or specific company ID
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  permission: 'ALL_STAFF' | 'COMPANY_ADMIN_ONLY' | 'SUPER_ADMIN_ONLY';
  description?: string;
}

export interface AiCreditAnalysis {
  id: string;
  clientId: string;
  clientName: string;
  companyId: string;
  analyzedBy: string;
  analyzedByName: string;
  analyzedAt: string;
  
  // Inputs
  monthlyIncome: number;
  requestedAmount: number;
  requestedDurationMonths: number;
  debtBurdenRatio: number;
  employmentType: string;
  guaranteesProvided: string[];
  historicalRepaymentScore: string;
  customNotes?: string;

  // AI Output
  creditScore: number; // 0 - 100
  riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REQUIRE_GUARANTOR' | 'REJECT';
  maxSuggestedInstallment: number;
  maxSuggestedCredit: number;
  strengths: string[];
  riskPoints: string[];
  underwriterAdvice: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  applicationId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  note?: string;
  actionedBy?: string;
  actionedAt?: string;
}

export interface Transaction {
  id: string;
  applicationId: string;
  amount: number;
  type: 'DEDUCTION' | 'FUNDING' | 'COMMISSION';
  performedBy: string;
  timestamp: string;
  note?: string;
}

export interface Notification {
  id: string;
  userId: string; // Target user or 'ROLE_SUPER_ADMIN' or 'COMPANY_{companyId}'
  targetRole?: Role;
  targetCompanyId?: string; // Target company ID for company-scoped alerts
  targetBranchId?: string; // Target branch ID for branch-manager scoped alerts
  targetOfficerId?: string; // Target officer / employee ID for assigned employee scoped alerts
  message: string;
  messageEn?: string;
  read: boolean;
  createdAt: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  referenceId?: string;
  referenceType?: 'APPLICATION' | 'CLIENT_REQUEST' | 'OVERDUE' | 'SHARED_DOCUMENT' | 'CLIENT_UPDATE' | 'CLIENT_RENEWAL';
  commentNotificationType?: CommentNotificationType;
  senderName?: string;
  title?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  details: string;
  timestamp: string;
  referenceId?: string;
}

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح'
];
