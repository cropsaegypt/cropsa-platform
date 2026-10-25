import { 
  Role, 
  ApplicationStatus, 
  User, 
  Application, 
  Transaction, 
  AuditLog, 
  Notification, 
  Client, 
  WithdrawalRequest,
  InstallmentCompany,
  CompanyBranch,
  ClientAccessRequest,
  OverdueCase,
  SharedDocument,
  InstallmentCompanyStaffRole,
  ApplicationQuestion,
  WorkflowStageConfig,
  CompanyWorkflowConfig,
  ExternalDispatchTemplate,
  SmtpConfig,
  InboxMessage
} from '../types';

export const DEFAULT_WORKFLOW_STAGES: WorkflowStageConfig[] = [
  { id: ApplicationStatus.PAPER_REVIEW, key: 'PAPER_REVIEW', name: 'مراجعة الأوراق والمستندات', enabled: true, order: 1, description: 'فحص بطاقة الرقم القومي وإثبات الدخل والضامن', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: ApplicationStatus.ISCORE_CHECK, key: 'ISCORE_CHECK', name: 'استعلام تقرير I-Score', enabled: true, order: 2, description: 'فحص السجل الائتماني والتقييم الرقمي والتعثرات', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: ApplicationStatus.FIELD_INVESTIGATION, key: 'FIELD_INVESTIGATION', name: 'الاستعلام الميداني', enabled: true, order: 3, description: 'التحري الميداني عن السكن ومقر العمل والنشاط التجاري', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: ApplicationStatus.APPROVED, key: 'APPROVED', name: 'طلب معتمد (موافقة ائتمانية)', enabled: true, order: 4, description: 'اعتماد الحد الائتماني النهائي والموافقة على التمويل', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: ApplicationStatus.CONTRACT_SIGNING, key: 'CONTRACT_SIGNING', name: 'توقيع العقود والضمانات', enabled: true, order: 5, description: 'توقيع عقود التقسيط وإيصالات الأمانة وسندات لأمر', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: ApplicationStatus.AMOUNT_TRANSFERRED, key: 'AMOUNT_TRANSFERRED', name: 'صرف التمويل والتنفيذ', enabled: true, order: 6, description: 'صرف المبلغ للعميل نقداً أو تحويل بنكي أو محفظة', color: 'bg-teal-50 text-teal-800 border-teal-200' }
];

export const MOCK_COMPANIES: InstallmentCompany[] = [
{
    id: 'comp_01',
    name: 'شركة أمان للتمويل الاستهلاكي والتقسيط',
    nameEn: 'Aman Consumer Finance & Installments',
    code: 'AMAN-01',
    logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    email: 'info@aman-finance.eg',
    phone: '19988',
    commercialRegister: '104928',
    taxNumber: '409-281-992',
    fraLicense: 'FRA-FIN-2021-049',
    creditCeiling: 25000000,
    usedCredit: 14200000,
    commissionRate: 3.5,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الغربية', 'الدقهلية'],
    requiredDocumentsList: [
      'بطاقة الرقم القومي سارية للمشتري والضامن',
      'إيصال مرافق حديث لمحل السكن (كهرباء / غاز / مياه)',
      'كشف حساب بنكي لآخر 6 أشهر أو إثبات دخل معتمد',
      'استعلام I-Score ائتماني غير مدرج في القوائم السلبية',
      'سجل تجاري وبطاقة ضريبية سارية (للتجار وأصحاب الأنشطة)'
    ],
    workflowConfig: {
      useCustomScheme: false,
      autoApproveOnAssign: true,
      postAssignStage: ApplicationStatus.APPROVED,
      stages: DEFAULT_WORKFLOW_STAGES
    },
    financingPrograms: [
      {
        id: 'prog_aman_agri',
        name: 'برنامج التمويل الزراعي السريع',
        maxAmount: 150000,
        minAmount: 10000,
        durationMonths: 24,
        requiredDocuments: [
          'أصل وصورة بطاقة الرقم القومي سارية',
          'حيازة زراعية مميكنة أو كارت فلاح سارٍ',
          'إيصال مرافق حديث (كهرباء أو مياه)'
        ],
        description: 'تمويل مستلزمات الإنتاج والأسمدة وبذور المحاصيل بدون فوائد تأخير'
      },
      {
        id: 'prog_aman_equip',
        name: 'برنامج تقسيط الجرارات والمعدات الزراعية',
        maxAmount: 600000,
        minAmount: 100000,
        durationMonths: 36,
        requiredDocuments: [
          'بطاقة الرقم القومي للمشتري والضامن',
          'سجل تجاري وبطاقة ضريبية سارية',
          'عرض سعر رسمي معتمد من المورد المعين',
          'إيصال مرافق حديث لمقر النشاط',
          'كشف حساب بنكي لآخر 6 أشهر'
        ],
        description: 'تمويل المعدات الثقيلة وشبكات الري والطاقة الشمسية'
      },
      {
        id: 'prog_aman_merchant',
        name: 'برنامج تمويل المحلات والتجار',
        maxAmount: 350000,
        minAmount: 20000,
        durationMonths: 18,
        requiredDocuments: [
          'بطاقة الرقم القومي سارية',
          'عقد إيجار أو ملكية المحل موثق',
          'سجل تجاري حديث لا يتجاوز 3 أشهر',
          'بطاقة ضريبية صالحة'
        ],
        description: 'تمويل بضائع ورأس مال عامل للمحلات التجارية والموزعين'
      }
    ],
    rejectionReasons: [
      'تعثر ائتماني سابق / إدراج في القوائم السلبية للآي سكور (I-Score)',
      'عدم تناسب الدخل الشهري مع القسط المطلوب (ارتفاع عبء الدين DTI > 50%)',
      'عدم وضوح أو انتهاء صلاحية بطاقة الرقم القومي أو مستندات الملكية',
      'عنوان السكن أو النشاط خارج النطاق الجغرافي المعتمد للفرع',
      'عدم توفر ضامن مستوفٍ للشروط الائتمانية والضمانات التجارية',
      'وجود نزاعات قضائية أو شيكات مرتدة غير مسواة'
    ],
    status: 'ACTIVE',
    createdAt: '2025-01-10T08:00:00.000Z',
    featuresGranted: {
      canViewCrobsaDb: true,
      canUseAiAnalysis: true,
      canExportReports: true,
      canManageSubUsers: true,
      canManageSharedFiles: true
    }
  },
{
    id: 'comp_1792346183637',
    name: 'كاش للتمويل متناهي الصغر',
    nameEn: 'Kash Microfinance',
    code: 'KASH-01',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    email: 'info@kash-microfinance.eg',
    phone: '16901',
    commercialRegister: '394821',
    taxNumber: '581-902-114',
    fraLicense: 'FRA-FIN-2022-033',
    creditCeiling: 20000000,
    usedCredit: 7500000,
    commissionRate: 3.5,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'المنيا'],
    requiredDocumentsList: [
      'بطاقة الرقم القومي سارية',
      'إيصال مرافق حديث',
      'إثبات مزاولة نشاط تجاري أو خدمي'
    ],
    financingPrograms: [
      {
        id: 'prog_kash_micro',
        name: 'برنامج كاش للتمويل الأصغر والسيولة النقدية',
        companyId: 'comp_1792346183637',
        companyName: 'كاش للتمويل متناهي الصغر',
        maxAmount: 50000,
        minAmount: 5000,
        durationMonths: 12,
        interestRatePercent: 18,
        downPaymentPercent: 0,
        adminFeePercent: 2.5,
        requiredDocuments: ['بطاقة الرقم القومي سارية', 'إيصال مرافق حديث'],
        description: 'تمويل فوري وسريع للأعمال الحرة والتجار بأقل الإجراءات'
      },
      {
        id: 'prog_kash_growth',
        name: 'برنامج كاش لتنمية المشروعات الريفية',
        companyId: 'comp_1792346183637',
        companyName: 'كاش للتمويل متناهي الصغر',
        maxAmount: 120000,
        minAmount: 20000,
        durationMonths: 24,
        interestRatePercent: 20,
        downPaymentPercent: 0,
        adminFeePercent: 2.5,
        requiredDocuments: ['بطاقة الرقم القومي', 'إيصال مرافق حديث', 'إثبات نشاط تجاري'],
        description: 'تسهيلات ائتمانية لدعم المشروعات وتوسيع حجم العمل'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2025-02-10T10:00:00.000Z',
    featuresGranted: {
      canViewCrobsaDb: true,
      canUseAiAnalysis: true,
      canExportReports: true,
      canManageSubUsers: true,
      canManageSharedFiles: true
    }
  },
{
    id: 'comp_1792682249448',
    name: 'بسيطة للتمويل',
    nameEn: 'Baseeta Financing',
    code: 'BASEETA-01',
    logo: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=128&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    email: 'contact@baseeta.eg',
    phone: '19772',
    commercialRegister: '782190',
    taxNumber: '619-301-442',
    fraLicense: 'FRA-FIN-2023-104',
    creditCeiling: 2920000,
    usedCredit: 0,
    commissionRate: 0,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'القليوبية', 'الغربية', 'المنوفية'],
    requiredDocumentsList: [
      'بطاقة الرقم القومي للمشتري',
      'إيصال كهرباء حديث',
      'ضامن من الدرجة الأولى'
    ],
    financingPrograms: [
      {
        id: 'prog_baseeta_easy',
        name: 'برنامج بسيطة الميسر بدون تعقيدات',
        companyId: 'comp_1792682249448',
        companyName: 'بسيطة للتمويل',
        maxAmount: 80000,
        minAmount: 5000,
        durationMonths: 18,
        interestRatePercent: 17,
        downPaymentPercent: 0,
        adminFeePercent: 2.0,
        requiredDocuments: ['بطاقة الرقم القومي سارية', 'إيصال مرافق حديث'],
        description: 'تقسيط ميسر وموافقة خلال 24 ساعة بأبسط الأوراق'
      },
      {
        id: 'prog_baseeta_family',
        name: 'برنامج بسيطة للأسر المنتجة والحرفية',
        companyId: 'comp_1792682249448',
        companyName: 'بسيطة للتمويل',
        maxAmount: 150000,
        minAmount: 20000,
        durationMonths: 24,
        interestRatePercent: 18,
        downPaymentPercent: 0,
        adminFeePercent: 2.0,
        requiredDocuments: ['بطاقة الرقم القومي', 'إيصال مرافق حديث', 'ضامن موظف أو صاحب نشاط'],
        description: 'دعم وتمويل مشروعات الأسر المنتجة والورش والحرفيين'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2025-02-15T09:00:00.000Z',
    featuresGranted: {
      canViewCrobsaDb: true,
      canUseAiAnalysis: true,
      canExportReports: true,
      canManageSubUsers: true,
      canManageSharedFiles: true
    }
  },
{
    id: 'comp_1792681682632',
    name: 'بنك الإسكندرية (تمويل المشروعات)',
    nameEn: 'Bank of Alexandria SME Finance',
    code: 'ALEX-SME',
    logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=128&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80',
    email: 'sme@alexbank.com',
    phone: '19033',
    commercialRegister: '129384',
    taxNumber: '109-283-471',
    fraLicense: 'CBE-LIC-1867',
    creditCeiling: 60000000,
    usedCredit: 21000000,
    commissionRate: 3.0,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الدقهلية', 'الشرقية', 'الغربية', 'المنيا'],
    requiredDocumentsList: [
      'بطاقة الرقم القومي سارية',
      'إيصال مرافق لمقر النشاط والسكن',
      'كشف حساب بنكي لآخر 6 أشهر أو بطاقة حيازة'
    ],
    financingPrograms: [
      {
        id: 'prog_alex_sme',
        name: 'برنامج بنك إسكندرية للمشروعات الصغيرة (مشروعي)',
        companyId: 'comp_1792681682632',
        companyName: 'بنك الإسكندرية (تمويل المشروعات)',
        maxAmount: 400000,
        minAmount: 30000,
        durationMonths: 36,
        interestRatePercent: 15,
        downPaymentPercent: 0,
        adminFeePercent: 1.5,
        requiredDocuments: ['بطاقة الرقم القومي سارية', 'إيصال مرافق حديث', 'إثبات نشاط تجاري أو زراعي'],
        description: 'تمويل بنكي رسمي بأسعار عائد تنافسية لتنمية المشروعات'
      },
      {
        id: 'prog_alex_micro',
        name: 'برنامج التمويل السريع متناهي الصغر',
        companyId: 'comp_1792681682632',
        companyName: 'بنك الإسكندرية (تمويل المشروعات)',
        maxAmount: 100000,
        minAmount: 10000,
        durationMonths: 18,
        interestRatePercent: 17,
        downPaymentPercent: 0,
        adminFeePercent: 2.0,
        requiredDocuments: ['بطاقة الرقم القومي', 'إيصال مرافق حديث'],
        description: 'حلول تمويلية مرنة وسريعة لأصحاب الأنشطة الصغيرة'
      }
    ],
    status: 'ACTIVE',
    createdAt: '2025-01-12T11:00:00.000Z',
    featuresGranted: {
      canViewCrobsaDb: true,
      canUseAiAnalysis: true,
      canExportReports: true,
      canManageSubUsers: true,
      canManageSharedFiles: true
    }
  }
];

export const MOCK_BRANCHES: CompanyBranch[] = [
  {
    id: 'br_01',
    companyId: 'comp_01',
    name: 'فرع مدينة نصر الرئيسي',
    governorate: 'القاهرة',
    address: 'شارع عباس العقاد، المنطقة الأولى، مدينة نصر',
    phone: '0224050607',
    managerName: 'م. أحمد الشناوي',
    active: true
  },
  {
    id: 'br_02',
    companyId: 'comp_01',
    name: 'فرع الدقي والمهندسين',
    governorate: 'الجيزة',
    address: 'ميدان المساحة، الدقي، الجيزة',
    phone: '0237619283',
    managerName: 'أ. سامح عبد الرازق',
    active: true
  },
  {
    id: 'br_03',
    companyId: 'comp_01',
    name: 'فرع سموحة',
    governorate: 'الإسكندرية',
    address: 'طريق 14 مايو، أمام نادي سموحة، الإسكندرية',
    phone: '034298172',
    managerName: 'أ. مروة كمال',
    active: true
  },
  {
    id: 'br_04',
    companyId: 'comp_01',
    name: 'فرع طنطا والميدان',
    governorate: 'الغربية',
    address: 'شارع النحاس، تقاطع الجيش، طنطا',
    phone: '040339182',
    managerName: 'أ. عصام غنيم',
    active: true
  },
  {
    id: 'br_05',
    companyId: 'comp_1792346183637',
    name: 'فرع كاش - القاهرة الرئيسي',
    governorate: 'القاهرة',
    address: 'مبنى 5B، القطاع الأول، القاهرة الجديدة',
    phone: '022819283',
    managerName: 'أ. كريم عبد الله',
    active: true
  },
  {
    id: 'br_06',
    companyId: 'comp_1792681682632',
    name: 'فرع بنك الإسكندرية - سموحة',
    governorate: 'الدقهلية',
    address: 'المشاية السفلية، برج النيل، المنصورة',
    phone: '050221948',
    managerName: 'أ. هاني فوزي',
    active: true
  }
];

export const MOCK_USERS: User[] = [
  // Super Admin
  { 
    id: 'u_super', 
    name: 'المهندس فادي إبراهيم (مدير النظام)', 
    username: 'superadmin',
    role: Role.SUPER_ADMIN, 
    email: 'director@crobsa.com', 
    password: 'password', 
    mustChangePassword: false 
  },
  // Crobsa Admin
  { 
    id: 'u_admin', 
    name: 'محمد خالد (مسؤول العمليات والاعتمادات)', 
    username: 'admin',
    role: Role.ADMIN, 
    email: 'ops@crobsa.com', 
    password: 'password', 
    mustChangePassword: false 
  },
  // Installment Company 1: Aman Manager
  { 
    id: 'u_comp_aman', 
    name: 'أمان للتمويل (المدير التنفيذي)', 
    username: 'aman_manager',
    role: Role.INSTALLMENT_COMPANY, 
    staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
    companyId: 'comp_01',
    email: 'manager@aman-finance.eg', 
    password: 'password', 
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases']
  },
  // Installment Company 1: Credit Officer in Cairo
  { 
    id: 'u_staff_cairo', 
    name: 'محمود عبد الفتاح (مسؤول دراسة ائتمانية - القاهرة)', 
    username: 'cairo_credit',
    role: Role.COMPANY_EMPLOYEE, 
    staffRole: InstallmentCompanyStaffRole.CREDIT_OFFICER,
    companyId: 'comp_01',
    governorate: 'القاهرة',
    branchId: 'br_01',
    branchName: 'فرع مدينة نصر الرئيسي',
    email: 'm.fattah@aman-finance.eg', 
    password: 'password', 
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports']
  },
  // Installment Company 1: Collections Officer
  { 
    id: 'u_staff_collect', 
    name: 'طارق الدسوقي (مسؤول المتابعة والتحصيل)', 
    username: 'aman_collect',
    role: Role.COMPANY_EMPLOYEE, 
    staffRole: InstallmentCompanyStaffRole.COLLECTION_AGENT,
    companyId: 'comp_01',
    governorate: 'القاهرة',
    branchId: 'br_01',
    branchName: 'فرع مدينة نصر الرئيسي',
    email: 't.desouky@aman-finance.eg', 
    password: 'password', 
    mustChangePassword: false,
    permissions: ['view_clients', 'followup_cases']
  },
  // Installment Company 2: Valu Manager
  { 
    id: 'u_comp_kash',
    name: 'إدارة شركة كاش للتمويل متناهي الصغر',
    username: 'kash_admin',
    role: Role.INSTALLMENT_COMPANY,
    staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
    companyId: 'comp_1792346183637',
    email: 'admin@valu-eg.com', 
    password: 'password', 
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff', 'followup_cases']
  },
  // Suppliers / Merchants
  { 
    id: 'u_sup1', 
    name: 'شركة الصفا لتجارة المعدات الزراعية', 
    username: 'alsafa_sup',
    role: Role.SUPPLIER, 
    email: 'alsafa@supplier.com', 
    password: 'password', 
    mustChangePassword: false, 
    commissionRate: 5, 
    walletBalance: 120000 
  },
  // Salesman (موظف البيع - رافع الطلبات)
  { 
    id: 'u_sales1', 
    name: 'ياسر المنشاوي (موظف البيع - رافع الطلبات)', 
    username: 'yasser_sales',
    role: Role.SALESMAN, 
    email: 'yasser@sales.crobsa.com', 
    password: 'password', 
    mustChangePassword: false, 
    commissionRate: 2.5, 
    walletBalance: 15000 
  },
  // Branch Manager
  {
    id: 'u_bm_cairo',
    name: 'أحمد شلبي (مدير فرع القاهرة)',
    username: 'bm_cairo',
    role: Role.BRANCH_MANAGER,
    staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER,
    companyId: 'comp_01',
    governorate: 'القاهرة',
    branchId: 'br_01',
    branchName: 'فرع مدينة نصر الرئيسي',
    email: 'a.shalaby@aman-finance.eg',
    password: 'password',
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff']
  },
  // Branch Manager - Giza Branch
  {
    id: 'u_bm_giza',
    name: 'عماد شكري (مدير فرع الجيزة والمهندسين)',
    username: 'bm_giza',
    role: Role.BRANCH_MANAGER,
    staffRole: InstallmentCompanyStaffRole.BRANCH_MANAGER,
    companyId: 'comp_01',
    governorate: 'الجيزة',
    branchId: 'br_02',
    branchName: 'فرع الدقي والمهندسين',
    email: 'e.shokry@aman-finance.eg',
    password: 'password',
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps', 'view_reports', 'manage_staff']
  },
  // Company Employee
  {
    id: 'u_emp_cairo',
    name: 'سارة عبد الرحمن (موظفة دراسة ومتابعة)',
    username: 'emp_sara',
    role: Role.COMPANY_EMPLOYEE,
    staffRole: InstallmentCompanyStaffRole.COMPANY_EMPLOYEE,
    companyId: 'comp_01',
    governorate: 'القاهرة',
    branchId: 'br_01',
    branchName: 'فرع مدينة نصر الرئيسي',
    email: 'sara@aman-finance.eg',
    password: 'password',
    mustChangePassword: false,
    permissions: ['view_clients', 'request_access', 'ai_analysis', 'approve_apps']
  }
];

export const DEFAULT_BRANDING = {
  platformName: 'Cropsa egypt',
  platformSubtitle: 'كروبسا مصر | منظومة التمويل والتقسيط الزراعي والتجاري',
  logoUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=128&auto=format&fit=crop&q=80',
  loginBannerUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80',
  loginHeadline: 'منصة كروبسا للتمويل والتقسيط الذكي',
  loginSubheadline: 'المنظومة الرقمية الرائدة لربط الموردين بشركات التمويل والمزارعين والتجار في مصر',
  themeColor: '#10b981', // Cropsa Emerald Green
  loginBgStyle: 'emerald-dark' as const,
  loginBgColor: '',
  loginCardStyle: 'cropsa-card' as const,
  loginInputStyle: 'cropsa-bright' as const,
  fontFamily: 'Cairo' as const,
  loginFooterText: 'منظومة كروبسا مصر الرقمية © 2026 | جميع الحقوق محفوظة'
};

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  enabled: false,
  host: 'mail.cropsa-finance.eg',
  port: 465,
  secure: true,
  user: 'operations@cropsa-finance.eg',
  pass: '',
  fromName: 'منظومة كروبسا مصر للتمويل الرقمي',
  fromEmail: 'operations@cropsa-finance.eg'
};

export const DEFAULT_EXTERNAL_DISPATCH_TEMPLATES: ExternalDispatchTemplate[] = [
  // ===================== WHATSAPP TEMPLATES =====================
  {
    id: 'tmpl_wa_new_app',
    type: 'WHATSAPP',
    channel: 'WHATSAPP',
    category: 'NEW_APPLICATION',
    name: 'تقديم طلب تمويل جديد (متضمن رابط المستندات)',
    nameAr: 'تقديم طلب تمويل جديد (متضمن رابط المستندات)',
    nameEn: 'Submit New Application (Drive Link Included)',
    isDefault: true,
    bodyTemplate: `السلام عليكم، عناية إدارة الائتمان بشركة {companyName} المحترمين 🤝
يرجى التكرم بفحص ودراسة طلب تمويل جديد وارد عبر منظومة كروبسا:
📄 رقم الطلب: #{appId}
👤 اسم العميل: {clientName}
🆔 الرقم القومي: {clientNationalId}
📱 رقم الهاتف: {clientPhone}
📍 المحافظة: {governorate}
💰 مبلغ التمويل المطلوب: {requestedAmount} جنيه
⏱️ مدة السداد: {durationMonths} شهر
💵 القسط الشهري المتوقع: {monthlyInstallment} جنيه
📦 السلعة / النشاط: {productType}

📁 رابط ملف المستندات والأوراق الرسمية (Google Drive):
{driveLink}

شاكرين حسن تعاونكم وسرعة إفادتنا بالقرار الائتماني.
فريق عمليات كروبسا - {senderName}`
  },
  {
    id: 'tmpl_wa_expedite',
    type: 'WHATSAPP',
    channel: 'WHATSAPP',
    category: 'EXPEDITE_URGENT',
    name: 'استعجال فحص طلب تمويل ⚡',
    nameAr: 'استعجال فحص طلب تمويل ⚡',
    nameEn: 'Urgent Decision Expedite ⚡',
    isDefault: true,
    bodyTemplate: `عاجل - استعجال رد وتقرير ائتماني ⚡
عناية مسؤولي الائتمان بشركة {companyName}:
نرجو التكرم بسرعة موافاتنا بالقرار الائتماني لطلب العميل:
👤 {clientName} (طلب #{appId} - مبلغ {requestedAmount} ج.م - محافظة {governorate})
العميل والمورد بانتظار الإفادة لتوقيع العقود واستلام البضاعة.
📁 رابط أوراق العميل:
{driveLink}

شاكرين اهتمامكم وسرعة المتابعة.`
  },
  {
    id: 'tmpl_wa_docs_update',
    type: 'WHATSAPP',
    channel: 'WHATSAPP',
    category: 'DOCS_UPDATE',
    name: 'استيفاء وتحديث مستندات العميل',
    nameAr: 'استيفاء وتحديث مستندات العميل',
    nameEn: 'Client Documents Update',
    isDefault: true,
    bodyTemplate: `تحية طيبة شركة {companyName} 📄
بخصوص طلب التمويل #{appId} للعميل: {clientName}:
تم تحديث ملف المستندات وإرفاق الأوراق الإضافية المطلوبة عبر الرابط التالي:
📁 رابط Google Drive:
{driveLink}

يرجى استكمال الفحص وموافاتنا بتمام الاعتماد.`
  },
  {
    id: 'tmpl_wa_inquiry',
    type: 'WHATSAPP',
    channel: 'WHATSAPP',
    category: 'STATUS_INQUIRY',
    name: 'استفسار عن موقف دراسة الطلب',
    nameAr: 'استفسار عن موقف دراسة الطلب',
    nameEn: 'Case Status Inquiry',
    isDefault: true,
    bodyTemplate: `مرحباً شركة {companyName}،
نستفسر عن الموقف الحالي لطلب التمويل #{appId} للعميل {clientName} (مبلغ {requestedAmount} جنيه).
هل توجد أي ملاحظات أو أوراق إضافية مطلوبة من العميل؟
📁 ملف الأوراق: {driveLink}`
  },

  // ===================== EMAIL TEMPLATES =====================
  {
    id: 'tmpl_mail_new_app',
    type: 'EMAIL',
    channel: 'EMAIL',
    category: 'NEW_APPLICATION',
    name: 'تقديم ملف طلب تمويل رسمي جديد',
    nameAr: 'تقديم ملف طلب تمويل رسمي جديد',
    nameEn: 'Official Financing Application Submission',
    isDefault: true,
    subjectTemplate: `[طلب تمويل جديد] #{appId} - العميل: {clientName} - مبلغ: {requestedAmount} ج.م`,
    bodyTemplate: `السادة / مسؤولي إدارة الائتمان والمخاطر بشركة {companyName} المحترمين،
تحية طيبة وبعد،،

تهديكم منصة كروبسا مصر أطيب التحيات، ونود إحاطتكم بتقديم طلب تمويل جديد لفحصه ودراسته ائتمانياً وفقاً للبيانات التالية:

• رقم الطلب بالمنصة: #{appId}
• اسم العميل الثلاثي: {clientName}
• الرقم القومي: {clientNationalId}
• رقم الهاتف: {clientPhone}
• المحافظة والمنطقة: {governorate}
• المبلغ المطلوب تمويله: {requestedAmount} جنيه مصري
• فترة السداد: {durationMonths} شهراً
• القسط الشهري المتوقع: {monthlyInstallment} جنيه مصري
• نوع المنتج / النشاط: {productType}

📁 رابط ملف الوثائق والمستندات الرسمية (Google Drive):
{driveLink}

يرجى التكرم بدراسة الطلب وموافاتنا بقرار الائتمان والحد المعتمد في أقرب وقت ممكن.

وتفضلوا بقبول فائق الاحترام والتقدير،،
فريق العمليات والائتمان - منصة كروبسا مصر
{senderName}
تاريخ الإرسال: {date}`
  },
  {
    id: 'tmpl_mail_expedite',
    type: 'EMAIL',
    channel: 'EMAIL',
    category: 'EXPEDITE_URGENT',
    name: 'استعجال رسمي لسرعة إصدار القرار الائتماني ⚡',
    nameAr: 'استعجال رسمي لسرعة إصدار القرار الائتماني ⚡',
    nameEn: 'Official Case Decision Expedite ⚡',
    isDefault: true,
    subjectTemplate: `⚡ [عاجل - استعجال قرار ائتماني] طلب #{appId} - العميل: {clientName}`,
    bodyTemplate: `السادة / إدارة الائتمان بشركة {companyName}،
تحية طيبة وبعد،،

نلفت عنايتكم الكريمة بخصوص طلب التمويل المسند إليكم برقم #{appId} والخاص بالعميل: {clientName} بمبلغ {requestedAmount} جنيه مصري.
نحيطكم علماً بأن أوراق وملف العميل مستوفاة بالكامل، ونرجو سرعة موافاتنا بالإفادة النهائية والقرار الائتماني نظراً لجاهزية العميل والمورد لتوقيع العقود واستلام المنتج.

📁 رابط المستندات للمراجعة السريعة:
{driveLink}

شاكرين لسيادتكم دوام التعاون المثمر،،
إدارة المتابعة والائتمان - منصة كروبسا مصر
{senderName}`
  },
  {
    id: 'tmpl_mail_docs_update',
    type: 'EMAIL',
    channel: 'EMAIL',
    category: 'DOCS_UPDATE',
    name: 'إشعار استيفاء وإرفاق مستندات إضافية',
    nameAr: 'إشعار استيفاء وإرفاق مستندات إضافية',
    nameEn: 'Additional Documents Submission Notice',
    isDefault: true,
    subjectTemplate: `[استيفاء مستندات] طلب #{appId} - العميل: {clientName}`,
    bodyTemplate: `السادة / مسؤولي الفحص والائتمان بشركة {companyName}،
تحية طيبة وبعد،،

بالإشارة إلى طلب التمويل رقم #{appId} للعميل {clientName}، نفيدكم بأنه تم استيفاء الأوراق والضمانات المطلوبة وتم تحديث الملف على الرابط التالي:

📁 رابط Google Drive المحدث:
{driveLink}

يرجى التكرم باستكمال إجراءات الاعتماد وإصدار الموافقة الائتمانية.

وتفضلوا بقبول فائق التقدير،،
{senderName}`
  }
];

export const DEFAULT_INBOX_MESSAGES: InboxMessage[] = [
  {
    id: 'msg_01',
    applicationId: 'app_01',
    clientName: 'الحاج إبراهيم متولي السيد',
    companyName: 'شركة أمان للتقسيط وتمويل المشروعات',
    companyId: 'comp_01',
    senderName: 'إدارة الائتمان والمخاطر - شركة أمان',
    senderContact: 'credit-approvals@aman-credit.eg',
    subject: 'موافقة ائتمانية مبدئية: طلب تمويل العميل إبراهيم متولي #app_01',
    content: `عناية إدارة العمليات بمنصة كروبسا،
تحية طيبة وبعد،،
نفيدكم بصدور الموافقة الائتمانية المبدئية لطلب التمويل رقم #app_01 الخاص بالعميل إبراهيم متولي السيد، بمبلغ معتمد قدره 85,000 ج.م.

الشروط المطلوبة قبل الصرف:
1. إرفاق إيصال مرافق حديث (كهرباء أو مياه) لمقر النشاط.
2. صورة بطاقة الضامن سارية.

يرجى التوجيه باستكمال الأوراق على رابط درايف لنقوم برفع الملف على السيستم وإصدار أمر الصرف.
تحياتنا،
لجنة الائتمان - شركة أمان`,
    channel: 'EMAIL',
    receivedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'UNREAD',
    isProcessed: false
  },
  {
    id: 'msg_02',
    applicationId: 'app_02',
    clientName: 'محمود عبد الرازق حسن',
    companyName: 'شركة سهولة للتمويل الاستهلاكي (Souhoola)',
    companyId: 'comp_souhoola',
    senderName: 'فريق فحص المستندات - سهولة',
    senderContact: '01019283746',
    subject: 'طلب استيفاء مستندات عاجلة للعميل محمود عبد الرازق',
    content: `مرحباً فريق كروبسا،
بخصوص طلب التمويل للعميل محمود عبد الرازق (#app_02):
تم الاطلاع على ملف درايف وتوجد نواقص بالمستندات:
- مطلوب كشف حساب بنكي حديث لآخر 6 شهور مختوم.
- صورة البطاقة الشخصية للعميل غير واضحة من الخلف.
يرجى إعادة رفعها وموافاتنا للتنفيذ.`,
    channel: 'WHATSAPP',
    receivedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'UNREAD',
    isProcessed: false
  },
  {
    id: 'msg_03',
    applicationId: 'app_03',
    clientName: 'سمير خليل منصور',
    companyName: 'شركة كونتكت للتمويل (Contact)',
    companyId: 'comp_contact',
    senderName: 'إدارة المخاطر والائتمان - كونتكت',
    senderContact: 'operations@contact-finance.com',
    subject: 'قرار ائتماني بخصوص طلب التمويل #app_03',
    content: `السادة منصة كروبسا،
نعتذر عن عدم إمكانية قبول طلب التمويل رقم #app_03 للعميل سمير خليل منصور، وذلك نظراً لانخفاض تقييم الآي سكور I-Score ووجود تأخيرات سابقة مسجلة بالتقرير.
يمكن إعادة تقديم الطلب بعد 3 أشهر بعد تسوية المتأخرات.
شاكرين حسن تعاونكم.`,
    channel: 'EMAIL',
    receivedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'READ',
    isProcessed: false
  }
];

const now = new Date();
const dateAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c_01',
    name: 'الحاج إبراهيم متولي السيد',
    nationalId: '27805120101923',
    phoneNumber: '01099238192',
    governorate: 'القاهرة',
    profession: 'MERCHANT',
    addedBy: 'u_sup1',
    addedAt: dateAgo(45),
    creditRating: 'A+',
    totalApprovedAmount: 85000,
    authorizedCompanies: ['comp_01'],
    aiSolvencyScore: 92,
    aiRiskTier: 'LOW',
    aiSuggestedLimit: 150000,
    monthlyIncome: 35000,
    monthlyObligations: 6500,
    aiSolvencySummary: 'تدفقات نقدية مستقرة من تجارة المعدات الزراعية، عبء دين منخفض 18%، وسجل سداد خالٍ تماماً من التأخيرات.',
    timeline: [
      {
        id: 't_01',
        clientId: 'c_01',
        action: 'تقديم طلب تقسيط بضائع',
        actionType: 'APPLICATION',
        performedBy: 'u_sup1',
        performedByName: 'شركة الصفا للمعدات',
        timestamp: dateAgo(45),
        details: 'تم تقديم طلب تقسيط بقيمة 85,000 ج.م لشراء مضخات زراعية',
        badgeColor: 'blue'
      },
      {
        id: 't_02',
        clientId: 'c_01',
        action: 'استعلام ائتماني I-Score إيجابي',
        actionType: 'STATUS_CHANGE',
        performedBy: 'u_comp_aman',
        performedByName: 'أمان للتمويل',
        timestamp: dateAgo(43),
        details: 'درجة الاستعلام 780 - العميل منتظم في سداد التزامات سابقة',
        badgeColor: 'emerald'
      },
      {
        id: 't_03',
        clientId: 'c_01',
        action: 'اعتماد الموافقة النهائية وتوقيع العقود',
        actionType: 'STATUS_CHANGE',
        performedBy: 'u_comp_aman',
        performedByName: 'أمان للتمويل',
        timestamp: dateAgo(40),
        details: 'الموافقة على تمويل 85,000 ج.م على 18 شهر بفائدة 16%',
        badgeColor: 'green'
      },
      {
        id: 't_04',
        clientId: 'c_01',
        action: 'تحصيل القسط الأول في موعده',
        actionType: 'PAYMENT',
        performedBy: 'u_staff_collect',
        performedByName: 'طارق الدسوقي',
        timestamp: dateAgo(10),
        details: 'تم سداد قسط بقيمة 5,200 ج.م عبر فوري بدون تأخير',
        badgeColor: 'emerald'
      }
    ]
  },
  {
    id: 'c_02',
    name: 'المهندس مصطفى كامل الباجوري',
    nationalId: '28509141600812',
    phoneNumber: '01223910283',
    governorate: 'الجيزة',
    profession: 'EQUIPMENT_OWNER',
    addedBy: 'u_sales1',
    addedAt: dateAgo(30),
    creditRating: 'A',
    totalApprovedAmount: 140000,
    authorizedCompanies: ['comp_01', 'comp_02'],
    aiSolvencyScore: 84,
    aiRiskTier: 'LOW',
    aiSuggestedLimit: 200000,
    monthlyIncome: 42000,
    monthlyObligations: 12000,
    aiSolvencySummary: 'يمتلك أسطول معدات زراعية، إيرادات شهرية قوية، انتظام ممتاز في السجلات الضريبية.',
    timeline: [
      {
        id: 't_05',
        clientId: 'c_02',
        action: 'تسجيل العميل وتقديم طلب تمويل جرار',
        actionType: 'APPLICATION',
        performedBy: 'u_sales1',
        performedByName: 'ياسر المنشاوي',
        timestamp: dateAgo(30),
        details: 'طلب تمويل معدات زراعية بقيمة 140,000 ج.م',
        badgeColor: 'blue'
      },
      {
        id: 't_06',
        clientId: 'c_02',
        action: 'تحليل الجدارة الائتمانية بالذكاء الاصطناعي',
        actionType: 'AI_ANALYSIS',
        performedBy: 'u_staff_cairo',
        performedByName: 'محمود عبد الفتاح',
        timestamp: dateAgo(28),
        details: 'مؤشر AI Score: 84/100 (مخاطر منخفضة) - توصية بالموافقة السريعة',
        badgeColor: 'purple'
      },
      {
        id: 't_07',
        clientId: 'c_02',
        action: 'اعتماد التمويل المشترك',
        actionType: 'STATUS_CHANGE',
        performedBy: 'u_comp_aman',
        performedByName: 'أمان للتمويل',
        timestamp: dateAgo(25),
        details: 'تم تحويل مبلغ التمويل لحساب المورد بعد استيفاء الشيكات',
        badgeColor: 'green'
      }
    ]
  },
  {
    id: 'c_03',
    name: 'الحاج رمضان عبد العاطي غنيم',
    nationalId: '26903111200455',
    phoneNumber: '01155981726',
    governorate: 'البحيرة',
    profession: 'FARMER',
    addedBy: 'u_sup1',
    addedAt: dateAgo(60),
    creditRating: 'B',
    totalApprovedAmount: 60000,
    authorizedCompanies: ['comp_03'], // Not authorized for comp_01 yet
    aiSolvencyScore: 71,
    aiRiskTier: 'MODERATE',
    aiSuggestedLimit: 80000,
    monthlyIncome: 20000,
    monthlyObligations: 5500,
    aiSolvencySummary: 'حيازات زراعية مستقرة وموسمية، يحتاج مراعاة مواسم الحصاد لجدولة الأقساط.',
    timeline: [
      {
        id: 't_08',
        clientId: 'c_03',
        action: 'طلب تمويل أسمدة وبذور',
        actionType: 'APPLICATION',
        performedBy: 'u_sup1',
        performedByName: 'شركة الصفا',
        timestamp: dateAgo(60),
        details: 'تمويل مستلزمات إنتاج زراعي بقيمة 60,000 ج.م',
        badgeColor: 'blue'
      },
      {
        id: 't_09',
        clientId: 'c_03',
        action: 'معاينة ميدانية للحيازة الزراعية',
        actionType: 'STATUS_CHANGE',
        performedBy: 'u_admin',
        performedByName: 'إدارة كروبسا',
        timestamp: dateAgo(55),
        details: 'حيازة 5 أفدنة مزروعة بالقمح وحالة المحصول ممتازة',
        badgeColor: 'sky'
      }
    ]
  },
  {
    id: 'c_04',
    name: 'السيد رأفت فهمي النجار',
    nationalId: '28004221800991',
    phoneNumber: '01004928172',
    governorate: 'الدقهلية',
    profession: 'MERCHANT',
    addedBy: 'u_sales1',
    addedAt: dateAgo(20),
    creditRating: 'C',
    totalApprovedAmount: 45000,
    authorizedCompanies: ['comp_02'],
    aiSolvencyScore: 48,
    aiRiskTier: 'CRITICAL',
    aiSuggestedLimit: 30000,
    monthlyIncome: 14000,
    monthlyObligations: 7800,
    aiSolvencySummary: 'تأخر متكرر في السداد، عبء الدين يتجاوز 55%، يُنصح بتوفير ضامن تجاري إضافي قبل الموافقة.',
    timeline: [
      {
        id: 't_10',
        clientId: 'c_04',
        action: 'إدخال بيانات العميل والنشاط',
        actionType: 'APPLICATION',
        performedBy: 'u_sales1',
        performedByName: 'ياسر المنشاوي',
        timestamp: dateAgo(20),
        details: 'محل تجاري للأعلاف في المنصورة',
        badgeColor: 'blue'
      },
      {
        id: 't_11',
        clientId: 'c_04',
        action: 'تسجيل إشعار تأخير في سداد القسط',
        actionType: 'FOLLOWUP',
        performedBy: 'u_staff_collect',
        performedByName: 'قسم التحصيل',
        timestamp: dateAgo(3),
        details: 'تأخر 18 يوماً في قسط شهر فبراير بقيمة 3,400 ج.م - تم الاتصال ووعد بالسداد',
        badgeColor: 'amber'
      }
    ]
  },
  {
    id: 'c_05',
    name: 'الأستاذ سامح عادل عبد الحميد',
    nationalId: '29207180104819',
    phoneNumber: '01277182940',
    governorate: 'الإسكندرية',
    profession: 'FARM_OWNER',
    addedBy: 'u_sup1',
    addedAt: dateAgo(15),
    creditRating: 'A',
    totalApprovedAmount: 110000,
    authorizedCompanies: ['comp_01'],
    aiSolvencyScore: 89,
    aiRiskTier: 'LOW',
    aiSuggestedLimit: 175000,
    monthlyIncome: 38000,
    monthlyObligations: 8000,
    aiSolvencySummary: 'حيازة استثمارية في برج العرب، تاريخ سداد استثنائي، عائد المحاصيل يغطي الأقساط بأمان تام.',
    timeline: [
      {
        id: 't_12',
        clientId: 'c_05',
        action: 'طلب تمويل شبكة ري حديثة',
        actionType: 'APPLICATION',
        performedBy: 'u_sup1',
        performedByName: 'شركة الصفا',
        timestamp: dateAgo(15),
        details: 'تمويل شبكة ري بالتنقيط لمزرعة برج العرب بقيمة 110,000 ج.م',
        badgeColor: 'blue'
      },
      {
        id: 't_13',
        clientId: 'c_05',
        action: 'الموافقة الائتمانية عبر فرع سموحة',
        actionType: 'STATUS_CHANGE',
        performedBy: 'u_comp_aman',
        performedByName: 'أمان للتمويل',
        timestamp: dateAgo(12),
        details: 'تم ربط الطلب بفرع سموحة بالإسكندرية واستيفاء التوقيعات',
        badgeColor: 'emerald'
      }
    ]
  },
  {
    id: 'c_06',
    name: 'الحاج عاطف عبد السلام البرنس',
    nationalId: '28108191600234',
    phoneNumber: '01019283741',
    governorate: 'الجيزة',
    profession: 'MERCHANT',
    addedBy: 'u_admin',
    addedAt: dateAgo(115),
    creditRating: 'A+',
    totalApprovedAmount: 130000,
    disbursedAmount: 130000,
    companyName: 'شركة كونتكت للتمويل الاستهلاكي (Contact)',
    lastFinanceDate: dateAgo(110),
    isHistoricalOnly: true,
    notes: 'سجل تاريخي من شركة كونتكت، سدد دفعاته بانتظام، مؤهل لتجديد التمويل وسقف أعلى',
    authorizedCompanies: ['comp_01', 'comp_02'],
    aiSolvencyScore: 94,
    aiRiskTier: 'LOW',
    aiSuggestedLimit: 180000,
    monthlyIncome: 45000,
    monthlyObligations: 7000,
    aiSolvencySummary: 'تدفقات تجارية منتظمة بمحافظة الجيزة، عبء دين منخفض، مر أكثر من 3 أشهر ونصف على تمويله السابق.',
    manualEntry: {
      installmentCompanyId: 'CONTACT',
      companyName: 'شركة كونتكت للتمويل الاستهلاكي (Contact)',
      approvedAmount: 130000,
      disbursedAmount: 130000,
      approvalDate: dateAgo(110),
      lastWithdrawalDate: dateAgo(110),
      notes: 'تم صرف التمويل بالكامل من كونتكت وسدد بدون أي تأخير'
    },
    timeline: [
      {
        id: 't_14',
        clientId: 'c_06',
        action: 'استيراد سجل تمويل سابق من كونتكت',
        actionType: 'NOTE',
        performedBy: 'u_admin',
        performedByName: 'إدارة كروبسا',
        timestamp: dateAgo(115),
        details: 'تمويل سابق بقيمة 130,000 ج.م من شركة كونتكت مسدد بالكامل',
        badgeColor: 'blue'
      }
    ]
  },
  {
    id: 'c_07',
    name: 'المهندس طارق منصور الديب',
    nationalId: '28604121200567',
    phoneNumber: '01129384751',
    governorate: 'الغربية',
    profession: 'FARMER',
    addedBy: 'u_sales1',
    addedAt: dateAgo(95),
    creditRating: 'A',
    totalApprovedAmount: 75000,
    disbursedAmount: 75000,
    companyName: 'شركة سهولة لخدمات التقسيط والتمويل (Souhoola)',
    lastFinanceDate: dateAgo(95),
    isHistoricalOnly: true,
    notes: 'تمويل مستلزمات زراعية من شركة سهولة، مر 3 أشهر على الصرف ومؤهل للتجديد الفوري',
    authorizedCompanies: ['comp_03'],
    aiSolvencyScore: 88,
    aiRiskTier: 'LOW',
    aiSuggestedLimit: 110000,
    monthlyIncome: 30000,
    monthlyObligations: 5000,
    aiSolvencySummary: 'نشاط زراعي وإنتاجي منتظم في طنطا، استوفى فترة الـ 90 يوماً للتجديد.',
    manualEntry: {
      installmentCompanyId: 'SOUHOOLA',
      companyName: 'شركة سهولة لخدمات التقسيط والتمويل (Souhoola)',
      approvedAmount: 75000,
      disbursedAmount: 75000,
      approvalDate: dateAgo(95),
      lastWithdrawalDate: dateAgo(95)
    },
    timeline: [
      {
        id: 't_15',
        clientId: 'c_07',
        action: 'تسجيل عملية تمويل سابقة',
        actionType: 'NOTE',
        performedBy: 'u_sales1',
        performedByName: 'ياسر المنشاوي',
        timestamp: dateAgo(95),
        details: 'تمويل مستلزمات زراعية بقيمة 75,000 ج.م من شركة سهولة',
        badgeColor: 'blue'
      }
    ]
  }
];

export const MOCK_APPLICATIONS: Application[] = [];

export const MOCK_CLIENT_REQUESTS: ClientAccessRequest[] = [
  {
    id: 'req_01',
    companyId: 'comp_01',
    companyName: 'شركة أمان للتمويل',
    clientId: 'c_03',
    clientName: 'الحاج رمضان عبد العاطي غنيم',
    clientNationalId: '26903111200455',
    requestedBy: 'u_comp_aman',
    requestedByName: 'أمان للتمويل (المدير التنفيذي)',
    requestReason: 'العميل تقدم بطلب تقسيط جرار جديد ونرغب في فحص سجل معاملاته السابقة في كروبسا لتحديد السقف التمويلي الملائم.',
    status: 'PENDING',
    requestedAt: dateAgo(1)
  },
  {
    id: 'req_02',
    companyId: 'comp_01',
    companyName: 'شركة أمان للتمويل',
    clientId: 'c_02',
    clientName: 'المهندس مصطفى كامل الباجوري',
    clientNationalId: '28509141600812',
    requestedBy: 'u_comp_aman',
    requestedByName: 'أمان للتمويل',
    requestReason: 'دراسة ائتمانية لطلب إعادة تمويل وتوسعة نشاط.',
    status: 'APPROVED',
    requestedAt: dateAgo(29),
    reviewedBy: 'u_admin',
    reviewedAt: dateAgo(28),
    reviewNotes: 'تمت الموافقة على منح حق الاطلاع الكامل على ملف العميل وسجلاته.'
  }
];

export const MOCK_OVERDUE_CASES: OverdueCase[] = [];

export const MOCK_SHARED_DOCUMENTS: SharedDocument[] = [
  {
    id: 'doc_01',
    title: 'عقد المرابحة والتقسيط الموحد لتمويل المعدات',
    titleEn: 'Unified Equipment Financing Murabaha Contract',
    category: 'CONTRACT_TEMPLATE',
    companyId: 'ALL',
    fileUrl: 'https://crobsa.com/templates/equipment_installment_contract_v3.pdf',
    fileName: 'عقد_المرابحة_الموحد_كروبسا.pdf',
    fileSize: '1.4 MB',
    fileType: 'application/pdf',
    uploadedBy: 'u_super',
    uploadedByName: 'إدارة منصة كروبسا',
    uploadedAt: '2025-01-15T10:00:00.000Z',
    permission: 'ALL_STAFF',
    description: 'النموذج الرسمي المعتمد من هيئة الرقابة المالية لعقود التقسيط الاستهلاكي والتجاري بين التاجر والعميل وشركة التمويل.'
  },
  {
    id: 'doc_02',
    title: 'نموذج إيصال الأمانة والشيك التضامني المعتمد',
    titleEn: 'Standard Promissory Note & Solidarity Cheque Form',
    category: 'FORM',
    companyId: 'ALL',
    fileUrl: 'https://crobsa.com/templates/promissory_note_solidarity_guarantee.pdf',
    fileName: 'نموذج_سند_الأمانة_الضامن.pdf',
    fileSize: '850 KB',
    fileType: 'application/pdf',
    uploadedBy: 'u_super',
    uploadedByName: 'إدارة الشؤون القانونية كروبسا',
    uploadedAt: '2025-01-20T12:00:00.000Z',
    permission: 'COMPANY_ADMIN_ONLY',
    description: 'الصيغة القانونية المحصنة لإيصالات الأمانة والشيكات البنكية لضمان حقوق شركة التقسيط.'
  },
  {
    id: 'doc_03',
    title: 'تفويض الاستعلام الائتماني وحماية البيانات (I-Score Consent)',
    titleEn: 'I-Score Credit Inquiry & Privacy Authorization',
    category: 'CUSTOMER_DOC_REQUIREMENT',
    companyId: 'ALL',
    fileUrl: 'https://crobsa.com/templates/iscore_consent_form.pdf',
    fileName: 'إقرار_تفويض_الاستعلام_الائتماني.pdf',
    fileSize: '620 KB',
    fileType: 'application/pdf',
    uploadedBy: 'u_admin',
    uploadedByName: 'محمد خالد (عمليات كروبسا)',
    uploadedAt: '2025-02-05T14:30:00.000Z',
    permission: 'ALL_STAFF',
    description: 'إقرار قانوني موقع من العميل يجيز لشركة التقسيط ومنصة كروبسا الاستعلام عن التاريخ الائتماني ومشاركة البيانات.'
  },
  {
    id: 'doc_04',
    title: 'اتفاقية الشراكة وتوزيع العمولات لشركة أمان للتمويل',
    titleEn: 'Partnership & Commission Agreement - Aman Finance',
    category: 'PARTNERSHIP_AGREEMENT',
    companyId: 'comp_01',
    fileUrl: 'https://crobsa.com/contracts/aman_crobsa_partnership_2025.pdf',
    fileName: 'عقد_شراكة_أمان_كروبسا_2025.pdf',
    fileSize: '3.2 MB',
    fileType: 'application/pdf',
    uploadedBy: 'u_super',
    uploadedByName: 'مدير النظام (كروبسا)',
    uploadedAt: '2025-01-10T11:00:00.000Z',
    permission: 'COMPANY_ADMIN_ONLY',
    description: 'العقد المالي والإداري بين منصة كروبسا وشركة أمان للتمويل، شاملاً نسب العمولات وسقوف التمويل المسموحة.'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_01',
    userId: 'u_comp_aman',
    message: 'تمت الموافقة من إدارة كروبسا على طلب الاستعلام عن العميل: المهندس مصطفى كامل الباجوري.',
    messageEn: 'CROBSA Admin approved your access request for client: Eng. Mostafa Kamel Al-Bagoury.',
    read: false,
    createdAt: dateAgo(1),
    type: 'SUCCESS',
    referenceId: 'c_02',
    referenceType: 'CLIENT_REQUEST'
  },
  {
    id: 'notif_02',
    userId: 'u_comp_aman',
    message: 'تنبيه متابعة: العميل السيد رأفت فهمي النجار متأخر 22 يوماً عن سداد القسط الشهري.',
    messageEn: 'Collection Alert: Client Raafat Fahmy is 22 days overdue for the monthly installment.',
    read: false,
    createdAt: dateAgo(2),
    type: 'WARNING',
    referenceId: 'overdue_01',
    referenceType: 'OVERDUE'
  },
  {
    id: 'notif_03',
    userId: 'u_admin',
    message: 'طلب استعلام ومشاركة ملف جديد وارد من شركة أمان للتمويل بخصوص العميل: الحاج رمضان عبد العاطي غنيم.',
    messageEn: 'New client query request received from Aman Finance regarding client: Ramadan Abdelaty.',
    read: false,
    createdAt: dateAgo(1),
    type: 'INFO',
    referenceId: 'req_01',
    referenceType: 'CLIENT_REQUEST'
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    action: 'CREATE_COMPANY',
    performedBy: 'u_super',
    performedByName: 'المهندس فادي إبراهيم',
    details: 'إضافة شركة أمان للتمويل الاستهلاكي بسقف تمويلي 25,000,000 ج.م',
    timestamp: dateAgo(45),
    referenceId: 'comp_01'
  },
  {
    id: 'log_02',
    action: 'APPROVE_ACCESS_REQUEST',
    performedBy: 'u_admin',
    performedByName: 'محمد خالد',
    details: 'الموافقة على طلب شركة أمان للاطلاع على ملف العميل المهندس مصطفى كامل',
    timestamp: dateAgo(28),
    referenceId: 'req_02'
  },
  {
    id: 'log_03',
    action: 'AI_CREDIT_EVALUATION',
    performedBy: 'u_staff_cairo',
    performedByName: 'محمود عبد الفتاح',
    details: 'إجراء فحص ائتماني بالذكاء الاصطناعي للعميل مصطفى كامل (نتيجة: 84/100)',
    timestamp: dateAgo(28),
    referenceId: 'c_02'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    applicationId: 'app_001',
    amount: 85000,
    type: 'FUNDING',
    performedBy: 'u_comp_aman',
    timestamp: dateAgo(40),
    note: 'صرف تمويل شراء معدات زراعية'
  },
  {
    id: 'tx_02',
    applicationId: 'app_001',
    amount: 2975,
    type: 'COMMISSION',
    performedBy: 'u_admin',
    timestamp: dateAgo(40),
    note: 'عمولة منصة كروبسا (3.5%)'
  }
];

export const MOCK_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'w_01',
    userId: 'u_sup1',
    applicationId: 'app_001',
    amount: 25000,
    status: 'APPROVED',
    requestedAt: dateAgo(15),
    note: 'سحب مستحقات مورد توريدات المحرك',
    actionedBy: 'u_super',
    actionedAt: dateAgo(14)
  }
];

export const MOCK_APPLICATION_QUESTIONS: ApplicationQuestion[] = [
  {
    id: 'q_01',
    labelAr: 'نوع الحيازة أو النشاط الزراعي / التجاري',
    labelEn: 'Type of Agricultural / Commercial Holding',
    type: 'select',
    options: ['حيازة زراعية ملك (كارت فلاح)', 'إيجار أرض زراعية', 'محل تجاري مرخص', 'ورشة معدات وآلات', 'مزرعة دواجن أو مواشي'],
    required: true,
    category: 'FARMING',
    active: true,
    order: 1
  },
  {
    id: 'q_02',
    labelAr: 'مساحة الأرض الزراعية (بالفدان) أو مساحة المتجر (م²)',
    labelEn: 'Land Area (Feddan) or Shop Area (m²)',
    type: 'number',
    required: true,
    category: 'FARMING',
    active: true,
    order: 2
  },
  {
    id: 'q_03',
    labelAr: 'نوع المحاصيل المزروعة الرئيسية أو النشاط التجاري',
    labelEn: 'Main Crops or Commercial Business',
    type: 'text',
    required: true,
    category: 'FARMING',
    active: true,
    order: 3
  },
  {
    id: 'q_04',
    labelAr: 'متوسط صافي الدخل الشهري المتوقع للعميل (جنيه)',
    labelEn: 'Estimated Average Monthly Net Income (EGP)',
    type: 'number',
    required: true,
    category: 'FINANCIAL',
    active: true,
    order: 4
  },
  {
    id: 'q_05',
    labelAr: 'هل يوجد ضامن تضامني من الدرجة الأولى أو شريك نشاط؟',
    labelEn: 'Is there a first-degree guarantor or partner?',
    type: 'boolean',
    required: true,
    category: 'FINANCIAL',
    active: true,
    order: 5
  },
  {
    id: 'q_06',
    labelAr: 'تفاصيل أي التزامات بنكية أو شيكات قائمة',
    labelEn: 'Existing loans or checks obligations',
    type: 'text',
    required: false,
    category: 'FINANCIAL',
    active: true,
    order: 6
  }
];
