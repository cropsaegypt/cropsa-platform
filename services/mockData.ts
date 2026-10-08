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
  CompanyWorkflowConfig
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
    id: 'comp_02',
    name: 'شركة فاليو للحلول التمويلية الذكية',
    nameEn: 'Valu Smart Financing Solutions',
    code: 'VALU-02',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    email: 'corporate@valu-eg.com',
    phone: '16688',
    commercialRegister: '883921',
    taxNumber: '612-884-103',
    fraLicense: 'FRA-FIN-2020-012',
    creditCeiling: 40000000,
    usedCredit: 28900000,
    commissionRate: 4.0,
    allowedGovernorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'المنوفية', 'البحيرة'],
    requiredDocumentsList: [
      'أصل وصورة بطاقة الرقم القومي',
      'عقد إيجار أو ملكية مقر النشاط / السكن',
      'إيصال كهرباء حديث',
      'شيكات بنكية مؤجلة الدفع للأقساط',
      'إقرار ذمة مالية معتمد'
    ],
    financingPrograms: [
      {
        id: 'prog_valu_quick',
        name: 'برنامج فاليو الفوري (تقسيط ذكي بدون مقدم)',
        maxAmount: 80000,
        minAmount: 5000,
        durationMonths: 12,
        requiredDocuments: [
          'بطاقة الرقم القومي سارية',
          'استعلام ائتماني رقمي I-Score'
        ],
        description: 'موافقة فورية بالذكاء الاصطناعي وتقسيط فوري على 12 شهراً'
      },
      {
        id: 'prog_valu_business',
        name: 'برنامج المشروعات متناهية الصغر والإنتاجية',
        maxAmount: 300000,
        minAmount: 50000,
        durationMonths: 24,
        requiredDocuments: [
          'بطاقة الرقم القومي',
          'إيصال كهرباء حديث',
          'إثبات مزاولة نشاط تجاري أو زراعي',
          'دفتر شيكات بنكية'
        ],
        description: 'حلول تمويلية مرنة لأصحاب الأعمال والتجار لتوسيع حجم التجارة'
      }
    ],
    rejectionReasons: [
      'تقييم ائتماني منخفض في دراسة الذكاء الاصطناعي (< 60/100)',
      'تاريخ سداد غير منتظم مع عملاء وموردين آخرين',
      'عدم استيفاء وثائق إثبات الدخل المالي المعتمدة',
      'رفض البنك إصدار دفاتر شيكات بنكية للعميل'
    ],
    status: 'ACTIVE',
    createdAt: '2025-02-01T09:30:00.000Z',
    featuresGranted: {
      canViewCrobsaDb: true,
      canUseAiAnalysis: true,
      canExportReports: true,
      canManageSubUsers: true,
      canManageSharedFiles: true
    }
  },
  {
    id: 'comp_03',
    name: 'شركة فرصة للتمويل والتقسيط الزراعي',
    nameEn: 'Forsa Agricultural Financing',
    code: 'FORSA-03',
    logo: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=128&auto=format&fit=crop&q=80',
    email: 'contact@forsa-agri.com',
    phone: '15544',
    commercialRegister: '662019',
    taxNumber: '339-108-774',
    fraLicense: 'FRA-FIN-2023-088',
    creditCeiling: 18000000,
    usedCredit: 9150000,
    commissionRate: 3.0,
    allowedGovernorates: ['البحيرة', 'كفر الشيخ', 'الدقهلية', 'الشرقية', 'المنيا', 'بني سويف'],
    requiredDocumentsList: [
      'حيازة زراعية مميكنة (كارت الفلاح)',
      'بطاقة الرقم القومي',
      'شهادة من الجمعية الزراعية تفيد النشاط',
      'إيصال أمانة وضامن تضامني'
    ],
    status: 'ACTIVE',
    createdAt: '2025-03-15T11:00:00.000Z',
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
    companyId: 'comp_02',
    name: 'فرع التجمع الخامس - كايرو فستيفال',
    governorate: 'القاهرة',
    address: 'مبنى 5B، القطاع الأول، القاهرة الجديدة',
    phone: '022819283',
    managerName: 'أ. كريم عبد الله',
    active: true
  },
  {
    id: 'br_06',
    companyId: 'comp_02',
    name: 'فرع المنصورة المشاية',
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
    id: 'u_comp_valu', 
    name: 'إدارة شركة فاليو للتقسيط', 
    username: 'valu_admin',
    role: Role.INSTALLMENT_COMPANY, 
    staffRole: InstallmentCompanyStaffRole.COMPANY_ADMIN,
    companyId: 'comp_02',
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

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app_001',
    clientName: 'الحاج إبراهيم متولي السيد',
    clientNationalId: '27805120101923',
    phoneNumber: '01099238192',
    whatsappNumber: '01099238192',
    governorate: 'القاهرة',
    assignedBranchId: 'br_01',
    assignedBranchName: 'فرع مدينة نصر الرئيسي',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 18,
    hasRecentInstallment: false,
    hasRecentReceipt: true,
    recentReceiptAmount: 85000,
    requestedAmount: 85000,
    approvedAmount: 85000,
    usedAmount: 85000,
    status: ApplicationStatus.APPROVED,
    documentLink: 'https://crobsa.com/docs/app_001.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(45),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(44),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(40),
    reviewNote: 'تمت الموافقة المباشرة بعد دراسة السجل التجاري واستعلام I-score الممتاز.',
    description: 'تمويل شراء بضائع ومعدات زراعية',
    history: [
      { action: 'CREATED', timestamp: dateAgo(45), performedBy: 'u_sup1', performedByName: 'شركة الصفا', details: 'تقديم الطلب' },
      { action: 'ASSIGNED', timestamp: dateAgo(44), performedBy: 'u_admin', performedByName: 'إدارة كروبسا', details: 'توجيه الطلب لشركة أمان (فرع مدينة نصر)' },
      { action: 'APPROVED', timestamp: dateAgo(40), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'موافقة نهائية وتفعيل خط التمويل' }
    ]
  },
  {
    id: 'app_002',
    clientName: 'المهندس مصطفى كامل الباجوري',
    clientNationalId: '28509141600812',
    phoneNumber: '01223910283',
    whatsappNumber: '01223910283',
    governorate: 'الجيزة',
    assignedBranchId: 'br_02',
    assignedBranchName: 'فرع الدقي والمهندسين',
    profession: 'EQUIPMENT_OWNER',
    financeType: 'DEFERRED',
    durationMonths: 12,
    hasRecentInstallment: true,
    hasRecentReceipt: true,
    recentReceiptAmount: 140000,
    requestedAmount: 140000,
    approvedAmount: 140000,
    usedAmount: 140000,
    status: ApplicationStatus.AMOUNT_TRANSFERRED,
    documentLink: 'https://crobsa.com/docs/app_002.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(30),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(29),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(25),
    reviewNote: 'تم تحويل التمويل لحساب المورد بعد توقيع عقد المرابحة.',
    description: 'تمويل آلات حصاد وجرارات زراعية',
    history: [
      { action: 'CREATED', timestamp: dateAgo(30), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'تقديم الطلب' },
      { action: 'APPROVED', timestamp: dateAgo(25), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'الموافقة وتحويل المبلغ' }
    ]
  },
  {
    id: 'app_003',
    clientName: 'الأستاذ سامح عادل عبد الحميد',
    clientNationalId: '29207180104819',
    phoneNumber: '01277182940',
    whatsappNumber: '01277182940',
    governorate: 'الإسكندرية',
    assignedBranchId: 'br_03',
    assignedBranchName: 'فرع سموحة',
    profession: 'FARM_OWNER',
    financeType: 'INSTALLMENT',
    durationMonths: 24,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 110000,
    approvedAmount: 100000,
    usedAmount: 60000,
    status: ApplicationStatus.APPROVED,
    documentLink: 'https://crobsa.com/docs/app_003.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(15),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(14),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(12),
    reviewNote: 'تم اعتماد حد 100,000 ج.م بعد تقرير المعاينة الزراعية.',
    description: 'تمويل شبكة ري حديثة',
    history: [
      { action: 'CREATED', timestamp: dateAgo(15), performedBy: 'u_sup1', performedByName: 'شركة الصفا', details: 'طلب التمويل' },
      { action: 'APPROVED', timestamp: dateAgo(12), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'اعتماد الطلب بحد أقصى 100 ألف' }
    ]
  },
  {
    id: 'app_004',
    clientName: 'خالد عبد المنعم الطوخي',
    clientNationalId: '28811050102918',
    phoneNumber: '01128910293',
    whatsappNumber: '01128910293',
    governorate: 'القاهرة',
    assignedBranchId: 'br_01',
    assignedBranchName: 'فرع مدينة نصر الرئيسي',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 70000,
    usedAmount: 0,
    status: ApplicationStatus.PAPER_REVIEW,
    documentLink: 'https://crobsa.com/docs/app_004.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(3),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(2),
    assignedOfficerId: 'u_emp_cairo',
    assignedOfficerName: 'سارة عبد الرحمن (مسؤولة دراسة وفحص ائتماني)',
    isUrgent: true,
    urgentRequestedAt: dateAgo(1),
    urgentRequestedBy: 'u_sales1',
    urgentRequestedByName: 'ياسر المنشاوي (مندوب مبيعات)',
    description: 'تمويل توسعة متجر ومخزن أعلاف',
    documents: [
      {
        id: 'doc_401',
        name: 'بطاقة الرقم القومي - الوجه الأول',
        type: 'NATIONAL_ID_FRONT',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileName: 'national_id_front.jpg',
        fileSize: '1.2 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(3)
      },
      {
        id: 'doc_402',
        name: 'بطاقة الرقم القومي - الوجه الثاني',
        type: 'NATIONAL_ID_BACK',
        fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        fileName: 'national_id_back.jpg',
        fileSize: '1.1 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(3)
      },
      {
        id: 'doc_403',
        name: 'إيصال كهرباء حديث لمقر النشاط',
        type: 'UTILITY_BILL',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        fileName: 'electricity_bill.pdf',
        fileSize: '840 KB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(3)
      }
    ],
    comments: [
      {
        id: 'comm_01',
        applicationId: 'app_004',
        senderId: 'u_comp_aman',
        senderName: 'أمان للتمويل (قسم الائتمان)',
        senderRole: 'INSTALLMENT_COMPANY',
        senderCompanyName: 'شركة أمان للتقسيط',
        message: 'برجاء تزويدنا بصورة واضحة من السجل التجاري أو عقد إيجار المخزن لتأكيد مساحة التخزين ومطابقة العنوان.',
        createdAt: dateAgo(2),
        isUrgent: true
      },
      {
        id: 'comm_02',
        applicationId: 'app_004',
        senderId: 'u_sales1',
        senderName: 'ياسر المنشاوي (مندوب مبيعات)',
        senderRole: 'SALESMAN',
        message: 'تم التواصل مع العميل وجاري تجهيز صورة طبق الأصل من عقد الإيجار موثق بالشهر العقاري وسيتم رفعه اليوم.',
        createdAt: dateAgo(1)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(3), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'طلب تمويل جديد' },
      { action: 'RECEIVED', timestamp: dateAgo(2), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'جاري فحص المستندات والسجل التجاري' }
    ]
  },
  {
    id: 'app_005',
    clientName: 'محمود جلال الشربيني',
    clientNationalId: '27508191200119',
    phoneNumber: '01018293049',
    whatsappNumber: '01018293049',
    governorate: 'الغربية',
    assignedBranchId: 'br_04',
    assignedBranchName: 'فرع طنطا والميدان',
    profession: 'FARMER',
    financeType: 'INSTALLMENT',
    durationMonths: 6,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 35000,
    usedAmount: 0,
    status: ApplicationStatus.ISCORE_CHECK,
    documentLink: 'https://crobsa.com/docs/app_005.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(2),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(1),
    description: 'شراء بذور شتوية ومبيدات حشرية',
    documents: [
      {
        id: 'doc_501',
        name: 'كارت الفلاح المميكن',
        type: 'AGRICULTURAL_HOLDING',
        fileUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=80',
        fileName: 'kارت_الفلاح.pdf',
        fileSize: '950 KB',
        uploadedBy: 'u_sup1',
        uploadedByName: 'شركة الصفا',
        uploadedAt: dateAgo(2)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(2), performedBy: 'u_sup1', performedByName: 'شركة الصفا', details: 'تقديم الطلب' },
      { action: 'ISCORE_CHECK', timestamp: dateAgo(1), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'طلب تقرير الاستعلام الائتماني' }
    ]
  },
  {
    id: 'app_006',
    clientName: 'هشام بدوي قطب',
    clientNationalId: '28101010105555',
    phoneNumber: '01299998877',
    whatsappNumber: '01299998877',
    governorate: 'القاهرة',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: true,
    hasRecentReceipt: false,
    requestedAmount: 50000,
    usedAmount: 0,
    status: ApplicationStatus.REJECTED,
    documentLink: 'https://crobsa.com/docs/app_006.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(18),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(17),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(16),
    reviewNote: 'تم الرفض لوجود تعثر مصرفي سابق وقضايا شيكات غير منتهية في تقرير I-Score.',
    rejectionReason: 'تعثر ائتماني سابق / إدراج في القوائم السلبية للآي سكور (I-Score)',
    rejectionNotes: 'العميل لديه تقرير سلبي لدى بنكين مع أحكام قضائية غير مسواة وفق استعلام الآي سكور الأخير.',
    rejectedBy: 'u_comp_aman',
    rejectedByName: 'أمان للتمويل (المدير التنفيذي)',
    rejectedAt: dateAgo(16),
    description: 'تمويل مستلزمات زراعية',
    documents: [
      {
        id: 'doc_601',
        name: 'تقرير الاستعلام الائتماني I-Score',
        type: 'OTHER',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        fileName: 'iscore_report_client6.pdf',
        fileSize: '1.4 MB',
        uploadedBy: 'u_comp_aman',
        uploadedByName: 'أمان للتمويل',
        uploadedAt: dateAgo(16)
      }
    ],
    comments: [
      {
        id: 'comm_03',
        applicationId: 'app_006',
        senderId: 'u_comp_aman',
        senderName: 'أمان للتمويل',
        senderRole: 'INSTALLMENT_COMPANY',
        message: 'نعتذر عن رفض الطلب نظراً لوجود مديونيات متعثرة في الآي سكور. يمكنكم المحاولة مع جهات تمويلية أخرى تقبل بضمانات عينية إضافية.',
        createdAt: dateAgo(16)
      },
      {
        id: 'comm_04',
        applicationId: 'app_006',
        senderId: 'u_admin',
        senderName: 'محمد خالد (مدير العمليات)',
        senderRole: 'ADMIN',
        message: 'تم استلام قرار الرفض وملاحظاتكم، سنقوم بدراسة تحويل الحالة لشركة فاليو أو فرصة مع طلب ضامن تجاري إضافي.',
        createdAt: dateAgo(15)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(18), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'تقديم الطلب' },
      { action: 'REJECTED', timestamp: dateAgo(16), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'رفض ائتماني - السبب: تعثر ائتماني سابق في الآي سكور' }
    ]
  },
  {
    id: 'app_007',
    clientName: 'طارق صلاح البسيوني',
    clientNationalId: '27710121400233',
    phoneNumber: '01099238120',
    whatsappNumber: '01099238120',
    governorate: 'الجيزة',
    assignedBranchId: 'br_02',
    assignedBranchName: 'فرع الجيزة والواحات',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 18,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 95000,
    usedAmount: 0,
    status: ApplicationStatus.REJECTED,
    documentLink: 'https://crobsa.com/docs/app_007.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(10),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(9),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(7),
    reviewNote: 'ارتفاع عبء الدين بشكل كبير وعدم كفاية الدخل الصافي لتغطية القسط الشهري.',
    rejectionReason: 'عدم تناسب الدخل الشهري مع القسط المطلوب (ارتفاع عبء الدين DTI > 50%)',
    rejectionNotes: 'الدخل الشهري المثبت 11,000 ج.م والقسط المقترح 6,800 ج.م مع التزامات أخرى قائمة.',
    rejectedBy: 'u_comp_aman',
    rejectedByName: 'محمود عبد الفتاح',
    rejectedAt: dateAgo(7),
    description: 'تمويل خط إنتاج أسمدة سائلة',
    history: [
      { action: 'CREATED', timestamp: dateAgo(10), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'تقديم الطلب' },
      { action: 'REJECTED', timestamp: dateAgo(7), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'تم الرفض لعدم تناسب الدخل مع القسط المطلوب' }
    ]
  },
  {
    id: 'app_008',
    clientName: 'عصام مجدي الجزار',
    clientNationalId: '28405061600981',
    phoneNumber: '01140928172',
    whatsappNumber: '01140928172',
    governorate: 'الدقهلية',
    profession: 'FARM_OWNER',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 60000,
    usedAmount: 0,
    status: ApplicationStatus.REJECTED,
    documentLink: 'https://crobsa.com/docs/app_008.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(6),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(5),
    reviewedBy: 'u_comp_aman',
    reviewedAt: dateAgo(4),
    reviewNote: 'المستندات المقدمة منتهية الصلاحية ولا يوجد إيصال مرافق يطابق السكن الحالي.',
    rejectionReason: 'عدم وضوح أو انتهاء صلاحية بطاقة الرقم القومي أو مستندات الملكية',
    rejectionNotes: 'بطاقة الرقم القومي منتهية الصلاحية منذ 8 أشهر ولم يتم تقديم عقد إيجار موثق.',
    rejectedBy: 'u_comp_aman',
    rejectedByName: 'أمان للتمويل',
    rejectedAt: dateAgo(4),
    description: 'تمويل صوب زراعية حديثة',
    history: [
      { action: 'CREATED', timestamp: dateAgo(6), performedBy: 'u_sup1', performedByName: 'شركة الصفا', details: 'طلب التمويل' },
      { action: 'REJECTED', timestamp: dateAgo(4), performedBy: 'u_comp_aman', performedByName: 'أمان للتمويل', details: 'رفض أوراق ومستندات' }
    ]
  },
  {
    id: 'app_009',
    clientName: 'أحمد محمود رضوان',
    clientNationalId: '28910120104829',
    phoneNumber: '01019283746',
    whatsappNumber: '01019283746',
    governorate: 'القاهرة',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 18,
    hasRecentInstallment: false,
    hasRecentReceipt: true,
    recentReceiptAmount: 75000,
    requestedAmount: 75000,
    usedAmount: 0,
    status: ApplicationStatus.RECEIVED,
    documentLink: 'https://crobsa.com/docs/app_009.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(1),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(1),
    description: 'تمويل شبكة ري وتسميد متطورة',
    isUrgent: false,
    history: [
      { action: 'CREATED', timestamp: dateAgo(1), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'تقديم طلب تمويل جديد - الحالة تحت الإسناد بانتظار اختيار الفرع' }
    ]
  },
  {
    id: 'app_010',
    clientName: 'سعد حسني البحيري',
    clientNationalId: '27604151800293',
    phoneNumber: '01128374920',
    whatsappNumber: '01128374920',
    governorate: 'الجيزة',
    profession: 'FARMER',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 90000,
    usedAmount: 0,
    status: ApplicationStatus.RECEIVED,
    documentLink: 'https://crobsa.com/docs/app_010.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(1),
    assignedCompanyIds: ['comp_01', 'u_comp_aman'],
    assignedAt: dateAgo(1),
    description: 'شراء بذور محسنة ومعدات رش حديثة',
    isUrgent: true,
    urgentRequestedAt: dateAgo(1),
    urgentRequestedBy: 'u_sup1',
    urgentRequestedByName: 'شركة الصفا لتجارة المعدات',
    history: [
      { action: 'CREATED', timestamp: dateAgo(1), performedBy: 'u_sup1', performedByName: 'شركة الصفا', details: 'تقديم طلب تمويل عاجل - الحالة تحت الإسناد بانتظار اختيار فرع الجيزة' }
    ]
  },
  {
    id: 'app_011',
    clientName: 'الحاج عاطف عبد السلام البرنس',
    clientNationalId: '28108191600234',
    phoneNumber: '01019283741',
    whatsappNumber: '01019283741',
    governorate: 'الجيزة',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: true,
    hasRecentReceipt: true,
    requestedAmount: 130000,
    approvedAmount: 130000,
    usedAmount: 130000,
    status: ApplicationStatus.AMOUNT_TRANSFERRED,
    submittedBy: 'u_admin',
    submittedAt: dateAgo(115),
    assignedCompanyIds: ['CONTACT'],
    reviewedBy: 'u_admin',
    reviewedAt: dateAgo(110),
    description: 'تمويل شراء معدات وبضائع تجارية عبر شركة كونتكت للتمويل الاستهلاكي (سجل تاريخي)',
    history: [
      { action: 'CREATED', timestamp: dateAgo(115), performedBy: 'u_admin', details: 'استيراد طلب التمويل من شركة كونتكت' },
      { action: 'APPROVED', timestamp: dateAgo(110), performedBy: 'u_admin', details: 'تم صرف مبلغ التمويل 130,000 ج.م بالكامل وسداد كافة الأقساط' }
    ]
  },
  {
    id: 'app_012',
    clientName: 'المهندس طارق منصور الديب',
    clientNationalId: '28604121200567',
    phoneNumber: '01129384751',
    whatsappNumber: '01129384751',
    governorate: 'الغربية',
    profession: 'FARMER',
    financeType: 'INSTALLMENT',
    durationMonths: 6,
    hasRecentInstallment: true,
    hasRecentReceipt: true,
    requestedAmount: 75000,
    approvedAmount: 75000,
    usedAmount: 75000,
    status: ApplicationStatus.AMOUNT_TRANSFERRED,
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(95),
    assignedCompanyIds: ['SOUHOOLA', 'comp_02'],
    reviewedBy: 'u_sales1',
    reviewedAt: dateAgo(93),
    description: 'تمويل أسمدة وبذور زراعية عبر شركة سهولة لخدمات التقسيط والتمويل (سجل سابق)',
    history: [
      { action: 'CREATED', timestamp: dateAgo(95), performedBy: 'u_sales1', details: 'تسجيل عملية التمويل السابقة' },
      { action: 'APPROVED', timestamp: dateAgo(93), performedBy: 'u_sales1', details: 'تم صرف التمويل 75,000 ج.م ومسدد بالكامل، مؤهل للتجديد' }
    ]
  },
  {
    id: 'app_013',
    clientName: 'الدكتور حازم توفيق المنياوي',
    clientNationalId: '28308110103928',
    phoneNumber: '01019384756',
    whatsappNumber: '01019384756',
    governorate: 'القاهرة',
    assignedBranchId: 'br_05',
    assignedBranchName: 'فرع التجمع الخامس - كايرو فستيفال',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 18,
    hasRecentInstallment: false,
    hasRecentReceipt: true,
    recentReceiptAmount: 110000,
    requestedAmount: 110000,
    approvedAmount: 110000,
    usedAmount: 0,
    status: ApplicationStatus.RECEIVED,
    documentLink: 'https://crobsa.com/docs/app_013.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(1),
    assignedCompanyIds: ['comp_02', 'u_comp_valu'],
    assignedAt: dateAgo(1),
    description: 'تمويل أجهزة ري ومعدات تبريد زراعي متطورة',
    isUrgent: true,
    urgentRequestedAt: dateAgo(1),
    urgentRequestedBy: 'u_sales1',
    urgentRequestedByName: 'ياسر المنشاوي',
    documents: [
      {
        id: 'doc_1301',
        name: 'بطاقة الرقم القومي (سارية وجه وظهر)',
        type: 'NATIONAL_ID',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'national_id_hazem.pdf',
        fileSize: '1.2 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(1)
      },
      {
        id: 'doc_1302',
        name: 'إيصال كهرباء حديث لمقر النشاط',
        type: 'UTILITY_BILL',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'utility_cairo_festival.pdf',
        fileSize: '880 KB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(1)
      },
      {
        id: 'doc_1303',
        name: 'سجل تجاري حديث وبطاقة ضريبية',
        type: 'COMMERCIAL_REGISTER',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'commercial_register_2025.pdf',
        fileSize: '2.1 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(1)
      },
      {
        id: 'doc_1304',
        name: 'شيكات بنكية مؤجلة الدفع (ضمان)',
        type: 'CHECKS',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'bank_checks_guarantee.pdf',
        fileSize: '1.5 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(1)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(1), performedBy: 'u_sales1', performedByName: 'ياسر المنشاوي', details: 'تقديم الطلب وتوجيهه لشركة فاليو' }
    ]
  },
  {
    id: 'app_014',
    clientName: 'أ. طه صبحي الغنام',
    clientNationalId: '29004181200938',
    phoneNumber: '01229384019',
    whatsappNumber: '01229384019',
    governorate: 'الدقهلية',
    assignedBranchId: 'br_06',
    assignedBranchName: 'فرع المنصورة المشاية',
    profession: 'FARM_OWNER',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: false,
    hasRecentReceipt: false,
    requestedAmount: 85000,
    approvedAmount: 85000,
    usedAmount: 0,
    status: ApplicationStatus.PAPER_REVIEW,
    documentLink: 'https://crobsa.com/docs/app_014.pdf',
    submittedBy: 'u_sup1',
    submittedAt: dateAgo(2),
    assignedCompanyIds: ['comp_02', 'u_comp_valu'],
    assignedAt: dateAgo(2),
    description: 'تمويل شبكة تسميد متكاملة لمحصول البرتقال',
    documents: [
      {
        id: 'doc_1401',
        name: 'بطاقة الرقم القومي (وجه وظهر)',
        type: 'NATIONAL_ID',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'national_id_taha.pdf',
        fileSize: '990 KB',
        uploadedBy: 'u_sup1',
        uploadedByName: 'شركة الصفا',
        uploadedAt: dateAgo(2)
      },
      {
        id: 'doc_1402',
        name: 'عقد حيازة زراعية موثق ومميكن',
        type: 'AGRICULTURAL_HOLDING',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'heyaaza_mansoura.pdf',
        fileSize: '1.7 MB',
        uploadedBy: 'u_sup1',
        uploadedByName: 'شركة الصفا',
        uploadedAt: dateAgo(2)
      },
      {
        id: 'doc_1403',
        name: 'إيصال أمانة موقع كضمان إضافي',
        type: 'TRUST_RECEIPT',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'trust_receipt_signed.pdf',
        fileSize: '650 KB',
        uploadedBy: 'u_sup1',
        uploadedByName: 'شركة الصفا',
        uploadedAt: dateAgo(2)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(2), performedBy: 'u_sup1', details: 'تقديم الطلب' },
      { action: 'PAPER_REVIEW', timestamp: dateAgo(1), performedBy: 'u_comp_valu', details: 'مراجعة الأوراق والضمانات المرفوعة' }
    ]
  },
  {
    id: 'app_015',
    clientName: 'الحاج رمضان عبد العاطي غنيم',
    clientNationalId: '27803151600123',
    phoneNumber: '01002345678',
    whatsappNumber: '01002345678',
    governorate: 'القاهرة',
    assignedBranchId: 'br_05',
    assignedBranchName: 'فرع التجمع الخامس - كايرو فستيفال',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 24,
    hasRecentInstallment: true,
    hasRecentReceipt: true,
    requestedAmount: 150000,
    approvedAmount: 150000,
    usedAmount: 150000,
    status: ApplicationStatus.APPROVED,
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(40),
    assignedCompanyIds: ['comp_02', 'u_comp_valu'],
    reviewedBy: 'u_comp_valu',
    reviewedAt: dateAgo(38),
    reviewNote: 'تمت الموافقة الائتمانية من إدارة شركة فاليو لانتظام المعاملات وكفاية الضمانات.',
    description: 'تمويل شراء أسمدة وبذور وتجهيز مخازن مبردة',
    documents: [
      {
        id: 'doc_1501',
        name: 'بطاقة الرقم القومي ورخصة النشاط',
        type: 'NATIONAL_ID',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'client_docs_ramadan.pdf',
        fileSize: '1.8 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(40)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(40), performedBy: 'u_sales1', details: 'تقديم الطلب' },
      { action: 'APPROVED', timestamp: dateAgo(38), performedBy: 'u_comp_valu', details: 'اعتماد التمويل' }
    ]
  },
  {
    id: 'app_016',
    clientName: 'أ. مدحت نبيل السواح',
    clientNationalId: '28709121400829',
    phoneNumber: '01150293847',
    whatsappNumber: '01150293847',
    governorate: 'الدقهلية',
    assignedBranchId: 'br_06',
    assignedBranchName: 'فرع المنصورة المشاية',
    profession: 'MERCHANT',
    financeType: 'INSTALLMENT',
    durationMonths: 12,
    hasRecentInstallment: false,
    hasRecentReceipt: true,
    recentReceiptAmount: 65000,
    requestedAmount: 65000,
    approvedAmount: 65000,
    usedAmount: 0,
    status: ApplicationStatus.ISCORE_CHECK,
    documentLink: 'https://crobsa.com/docs/app_016.pdf',
    submittedBy: 'u_sales1',
    submittedAt: dateAgo(3),
    assignedCompanyIds: ['comp_02', 'u_comp_valu'],
    assignedAt: dateAgo(3),
    description: 'تمويل بذور ومبيدات لمحاصيل الدلتا',
    documents: [
      {
        id: 'doc_1601',
        name: 'بطاقة الرقم القومي سارية',
        type: 'NATIONAL_ID',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'medhat_id.pdf',
        fileSize: '820 KB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(3)
      },
      {
        id: 'doc_1602',
        name: 'سجل تجاري وعقد إيجار محل موثق',
        type: 'COMMERCIAL_REGISTER',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
        fileName: 'medhat_lease_cr.pdf',
        fileSize: '1.4 MB',
        uploadedBy: 'u_sales1',
        uploadedByName: 'ياسر المنشاوي',
        uploadedAt: dateAgo(3)
      }
    ],
    history: [
      { action: 'CREATED', timestamp: dateAgo(3), performedBy: 'u_sales1', details: 'تقديم الطلب' },
      { action: 'ISCORE_CHECK', timestamp: dateAgo(2), performedBy: 'u_comp_valu', details: 'بدء الاستعلام الائتماني' }
    ]
  }
];

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

export const MOCK_OVERDUE_CASES: OverdueCase[] = [
  {
    id: 'overdue_01',
    clientId: 'c_04',
    clientName: 'السيد رأفت فهمي النجار',
    phoneNumber: '01004928172',
    governorate: 'الدقهلية',
    companyId: 'comp_01',
    applicationId: 'app_004',
    totalLoan: 45000,
    installmentAmount: 3400,
    overdueAmount: 3400,
    dueDate: dateAgo(22),
    daysOverdue: 22,
    severity: 'MEDIUM',
    assignedAgent: 'طارق الدسوقي (مسؤول التحصيل)',
    assignedBranchId: 'br_01',
    lastFollowUpDate: dateAgo(3),
    lastFollowUpNotes: 'تم الاتصال بالعميل وأفاد بوجود تأخر في توريدات البضاعة ووعد بالسداد قبل نهاية الأسبوع.',
    collectionStatus: 'PROMISED_TO_PAY',
    followUpHistory: [
      {
        id: 'fu_01',
        date: dateAgo(15),
        agent: 'طارق الدسوقي',
        type: 'SMS',
        note: 'إرسال رسالة تذكيرية أولى بحلول موعد القسط المستحق'
      },
      {
        id: 'fu_02',
        date: dateAgo(7),
        agent: 'طارق الدسوقي',
        type: 'PHONE_CALL',
        note: 'اتصال هاتفي أول - لم يتم الرد'
      },
      {
        id: 'fu_03',
        date: dateAgo(3),
        agent: 'طارق الدسوقي',
        type: 'PHONE_CALL',
        note: 'اتصال هاتفي ثان - العميل وعد بسداد القسط يوم الأحد القادم',
        promisedPaymentDate: dateAgo(-4)
      }
    ]
  },
  {
    id: 'overdue_02',
    clientId: 'c_06_mock',
    clientName: 'عبد الله محمود النبراوي',
    phoneNumber: '01199887766',
    governorate: 'القاهرة',
    companyId: 'comp_01',
    applicationId: 'app_mock_overdue',
    totalLoan: 90000,
    installmentAmount: 6800,
    overdueAmount: 13600,
    dueDate: dateAgo(48),
    daysOverdue: 48,
    severity: 'HIGH',
    assignedAgent: 'طارق الدسوقي (مسؤول التحصيل)',
    assignedBranchId: 'br_01',
    lastFollowUpDate: dateAgo(2),
    lastFollowUpNotes: 'متأخر قسطين متتاليين - تم توجيه إنذار رسمي بالبريد المسجل وتحديد موعد زيارة ميدانية لمحل النشاط.',
    collectionStatus: 'LEGAL_ACTION',
    followUpHistory: [
      {
        id: 'fu_04',
        date: dateAgo(30),
        agent: 'طارق الدسوقي',
        type: 'PHONE_CALL',
        note: 'مطالبة بسداد القسط الأول المتأخر - تقديم وعود غير دقيقة'
      },
      {
        id: 'fu_05',
        date: dateAgo(10),
        agent: 'طارق الدسوقي',
        type: 'VISIT',
        note: 'زيارة ميدانية للمحل - تم مقابلة الضامن وإلزامه بالسداد'
      },
      {
        id: 'fu_06',
        date: dateAgo(2),
        agent: 'طارق الدسوقي',
        type: 'OFFICIAL_WARNING',
        note: 'إرسال إخطار رسمي بنكي قبل اتخاذ الإجراءات القضائية'
      }
    ]
  }
];

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
