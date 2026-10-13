import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  CommentNotificationType, 
  CommentNotificationTemplate, 
  COMMENT_NOTIFICATION_CONFIG,
  ExternalDispatchTemplate
} from '../types';
import { 
  Bell, 
  BellRing, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter, 
  Layers, 
  User, 
  Building2, 
  ShieldCheck, 
  Eye, 
  X, 
  Save, 
  Sparkles, 
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Mail,
  Zap,
  ExternalLink,
  Copy,
  Link2,
  FileCheck,
  FolderOpen
} from 'lucide-react';

const EXT_CATEGORIES: Record<string, { labelAr: string; labelEn: string; badge: string; text: string }> = {
  NEW_APPLICATION: {
    labelAr: 'إرسال طلب تمويل جديد',
    labelEn: 'New Application',
    badge: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700'
  },
  EXPEDITE_URGENT: {
    labelAr: 'استعجال فوري وعاجل (Urgent)',
    labelEn: 'Urgent Expedite',
    badge: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700'
  },
  DOCS_UPDATE: {
    labelAr: 'تحديث واستكمال المستندات',
    labelEn: 'Documents Update',
    badge: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800'
  },
  STATUS_INQUIRY: {
    labelAr: 'استفسار ومتابعة حالة المعاملة',
    labelEn: 'Status Inquiry',
    badge: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700'
  },
  CUSTOM: {
    labelAr: 'نموذج مخصص / إشعار عام',
    labelEn: 'Custom Template',
    badge: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700'
  }
};

const EXT_PLACEHOLDERS = [
  { tag: '{clientName}', label: 'اسم العميل' },
  { tag: '{nationalId}', label: 'الرقم القومي' },
  { tag: '{clientPhone}', label: 'هاتف العميل' },
  { tag: '{amount}', label: 'مبلغ التمويل' },
  { tag: '{monthlyInstallment}', label: 'القسط الشهري' },
  { tag: '{driveLink}', label: 'رابط درايف للأوراق' },
  { tag: '{companyName}', label: 'اسم شركة التقسيط' },
  { tag: '{contactPerson}', label: 'مسؤول التواصل' },
  { tag: '{appId}', label: 'رقم المعاملة' },
  { tag: '{durationMonths}', label: 'مدة التقسيط' },
  { tag: '{governorate}', label: 'المحافظة' },
  { tag: '{productType}', label: 'نوع المنتج / السلعة' },
  { tag: '{senderName}', label: 'اسم الراسل' },
  { tag: '{date}', label: 'تاريخ اليوم' }
];

export const NotificationTemplatesManager: React.FC = () => {
  const { 
    notificationTemplates, 
    updateNotificationTemplate, 
    createNotificationTemplate, 
    deleteNotificationTemplate, 
    resetNotificationTemplatesToDefault, 
    externalDispatchTemplates,
    updateExternalDispatchTemplate,
    createExternalDispatchTemplate,
    deleteExternalDispatchTemplate,
    resetExternalDispatchTemplatesToDefault,
    currentUser,
    language 
  } = useStore();

  const isAr = language === 'ar';

  // Primary view switcher
  const [mainTab, setMainTab] = useState<'EXTERNAL_DISPATCH' | 'PORTAL_COMMENTS'>('EXTERNAL_DISPATCH');

  // Shared toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // =========================================================================
  // EXTERNAL DISPATCH TEMPLATES STATE (WhatsApp & Corporate Email)
  // =========================================================================
  const [extSearchTerm, setExtSearchTerm] = useState('');
  const [extChannelFilter, setExtChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [extCategoryFilter, setExtCategoryFilter] = useState<string>('ALL');

  const [editingExtTemplate, setEditingExtTemplate] = useState<Partial<ExternalDispatchTemplate> | null>(null);
  const [isCreatingNewExt, setIsCreatingNewExt] = useState(false);
  const [previewExtTemplate, setPreviewExtTemplate] = useState<ExternalDispatchTemplate | null>(null);
  const [showResetExtConfirm, setShowResetExtConfirm] = useState(false);

  // Sample data for External Preview
  const extSampleData = {
    clientName: 'محمود أحمد إبراهيم',
    nationalId: '28910120104829',
    clientPhone: '01012345678',
    appId: 'APP-7829',
    amount: '75,000 ج.م',
    monthlyInstallment: '3,250 ج.م',
    companyName: 'شركة أمان للتمويل الاستهلاكي',
    contactPerson: 'أستاذ عصام الشناوي',
    driveLink: 'https://drive.google.com/drive/folders/1aBcD_client_paperwork_example',
    governorate: 'القاهرة',
    durationMonths: '24 شهر',
    productType: 'تمويل أجهزة كهربائية ومعدات',
    senderName: currentUser?.name || 'فريق إدارة عمليات كروبسا',
    date: new Date().toLocaleDateString('ar-EG'),
    status: 'بانتظار المراجعة والاعتماد'
  };

  const renderExtSampleText = (pattern?: string) => {
    if (!pattern) return '';
    return pattern
      .replace(/{clientName}/g, extSampleData.clientName)
      .replace(/{nationalId}/g, extSampleData.nationalId)
      .replace(/{clientPhone}/g, extSampleData.clientPhone)
      .replace(/{appId}/g, extSampleData.appId)
      .replace(/{amount}/g, extSampleData.amount)
      .replace(/{monthlyInstallment}/g, extSampleData.monthlyInstallment)
      .replace(/{companyName}/g, extSampleData.companyName)
      .replace(/{contactPerson}/g, extSampleData.contactPerson)
      .replace(/{driveLink}/g, extSampleData.driveLink)
      .replace(/{governorate}/g, extSampleData.governorate)
      .replace(/{durationMonths}/g, extSampleData.durationMonths)
      .replace(/{productType}/g, extSampleData.productType)
      .replace(/{senderName}/g, extSampleData.senderName)
      .replace(/{date}/g, extSampleData.date)
      .replace(/{status}/g, extSampleData.status);
  };

  const filteredExtTemplates = useMemo(() => {
    return (externalDispatchTemplates || []).filter(tmpl => {
      const channel = tmpl.channel || tmpl.type || 'WHATSAPP';
      if (extChannelFilter !== 'ALL' && channel !== extChannelFilter) {
        return false;
      }
      if (extCategoryFilter !== 'ALL' && tmpl.category !== extCategoryFilter) {
        return false;
      }
      if (extSearchTerm.trim()) {
        const q = extSearchTerm.toLowerCase();
        const matchesName = (tmpl.nameAr || tmpl.name || '').toLowerCase().includes(q) || (tmpl.nameEn || '').toLowerCase().includes(q);
        const matchesSubject = (tmpl.subjectTemplate || '').toLowerCase().includes(q);
        const matchesBody = (tmpl.bodyTemplate || '').toLowerCase().includes(q);
        return matchesName || matchesSubject || matchesBody;
      }
      return true;
    });
  }, [externalDispatchTemplates, extChannelFilter, extCategoryFilter, extSearchTerm]);

  const handleOpenCreateExt = () => {
    const newTmpl: Partial<ExternalDispatchTemplate> = {
      id: `ext_tmpl_${Date.now()}`,
      channel: 'WHATSAPP',
      type: 'WHATSAPP',
      category: 'NEW_APPLICATION',
      nameAr: 'نموذج مراسلة خارجي جديد',
      nameEn: 'New Dispatch Template',
      subjectTemplate: 'طلب تمويل جديد: العميل {clientName} - #{appId}',
      bodyTemplate: `تحية طيبة {companyName}،
عناية الأستاذ/ {contactPerson}

مرسل لسيادتكم طلب تمويل جديد للعميل:
👤 الاسم: {clientName}
🪪 الرقم القومي: {nationalId}
📱 هاتف: {clientPhone}
💰 مبلغ التمويل: {amount}
📍 المحافظة: {governorate}

📂 رابط أوراق ومستندات العميل على Google Drive:
{driveLink}

يرجى الفحص والإفادة بالقرار الائتماني.
مع خالص التحية،
{senderName}`,
      active: true,
      createdAt: new Date().toISOString()
    };
    setEditingExtTemplate(newTmpl);
    setIsCreatingNewExt(true);
  };

  const handleOpenEditExt = (tmpl: ExternalDispatchTemplate) => {
    setEditingExtTemplate(JSON.parse(JSON.stringify(tmpl)));
    setIsCreatingNewExt(false);
  };

  const handleSaveExtModal = async () => {
    if (!editingExtTemplate) return;
    if (!editingExtTemplate.nameAr?.trim()) {
      alert(isAr ? 'يرجى إدخال اسم النموذج' : 'Please enter template name');
      return;
    }
    if (!editingExtTemplate.bodyTemplate?.trim()) {
      alert(isAr ? 'يرجى إدخال نص النموذج' : 'Please enter template body');
      return;
    }

    try {
      if (isCreatingNewExt) {
        await createExternalDispatchTemplate({
          ...editingExtTemplate,
          channel: editingExtTemplate.channel || editingExtTemplate.type || 'WHATSAPP',
          type: editingExtTemplate.channel || editingExtTemplate.type || 'WHATSAPP',
          active: editingExtTemplate.active !== false
        });
        showToast(isAr ? 'تم إنشاء نموذج المراسلة الخارجي بنجاح' : 'New external dispatch template created');
      } else if (editingExtTemplate.id) {
        await updateExternalDispatchTemplate(editingExtTemplate.id, editingExtTemplate);
        showToast(isAr ? 'تم تحديث نموذج المراسلة الخارجي بنجاح' : 'External dispatch template updated');
      }
      setEditingExtTemplate(null);
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء حفظ النموذج' : 'Error saving template');
    }
  };

  const handleToggleExtActive = async (tmpl: ExternalDispatchTemplate) => {
    try {
      const newActive = tmpl.active === false ? true : false;
      await updateExternalDispatchTemplate(tmpl.id, { active: newActive });
      showToast(newActive 
        ? (isAr ? 'تم تفعيل النموذج بنجاح' : 'Template enabled') 
        : (isAr ? 'تم تعطيل النموذج مؤقتاً' : 'Template disabled')
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExtTemplate = async (tmplId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا النموذج؟' : 'Are you sure you want to delete this template?')) return;
    try {
      await deleteExternalDispatchTemplate(tmplId);
      showToast(isAr ? 'تم حذف النموذج بنجاح' : 'Template deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetExtDefaults = async () => {
    try {
      await resetExternalDispatchTemplatesToDefault();
      setShowResetExtConfirm(false);
      showToast(isAr ? 'تمت استعادة كافة نماذج المراسلات الخارجية الافتراضية بنجاح' : 'Default external templates restored');
    } catch (err) {
      console.error(err);
    }
  };

  const insertExtVariable = (variableTag: string) => {
    if (!editingExtTemplate) return;
    const currentBody = editingExtTemplate.bodyTemplate || '';
    setEditingExtTemplate({
      ...editingExtTemplate,
      bodyTemplate: `${currentBody} ${variableTag}`
    });
  };

  // =========================================================================
  // PORTAL COMMENTS NOTIFICATIONS STATE
  // =========================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'SYSTEM' | 'COMPANY' | 'SUBMITTER'>('ALL');

  const [editingTemplate, setEditingTemplate] = useState<CommentNotificationTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CommentNotificationTemplate | null>(null);
  const [activeRecipientTab, setActiveRecipientTab] = useState<'SYSTEM' | 'COMPANY' | 'SUBMITTER'>('SYSTEM');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sample data for preview generator
  const sampleData = {
    clientName: 'محمود أحمد إبراهيم',
    clientNationalId: '28910120104829',
    appId: 'app_7829',
    senderName: currentUser?.name || 'سارة عبد الرحمن',
    senderRole: 'مسؤول الائتمان',
    companyName: 'شركة أمان للتقسيط',
    branchName: 'فرع مدينة نصر',
    governorate: 'القاهرة',
    commentSnippet: 'يرجى تزويدنا بصورة إيصال كهرباء حديث وسجل تجاري ساري',
    commentTypeLabel: 'طلب مستندات وأوراق إضافية',
    date: new Date().toLocaleDateString('ar-EG')
  };

  const renderSampleText = (pattern: string) => {
    if (!pattern) return '';
    return pattern
      .replace(/{clientName}/g, sampleData.clientName)
      .replace(/{clientNationalId}/g, sampleData.clientNationalId)
      .replace(/{appId}/g, sampleData.appId)
      .replace(/{senderName}/g, sampleData.senderName)
      .replace(/{senderRole}/g, sampleData.senderRole)
      .replace(/{companyName}/g, sampleData.companyName)
      .replace(/{branchName}/g, sampleData.branchName)
      .replace(/{governorate}/g, sampleData.governorate)
      .replace(/{commentSnippet}/g, sampleData.commentSnippet)
      .replace(/{commentTypeLabel}/g, sampleData.commentTypeLabel)
      .replace(/{date}/g, sampleData.date);
  };

  const filteredTemplates = useMemo(() => {
    return notificationTemplates.filter(tmpl => {
      if (selectedTypeFilter !== 'ALL' && tmpl.commentType !== selectedTypeFilter) {
        return false;
      }
      if (recipientFilter === 'SYSTEM' && !tmpl.recipients.systemAdmin.enabled) return false;
      if (recipientFilter === 'COMPANY' && !tmpl.recipients.companyAdmin.enabled) return false;
      if (recipientFilter === 'SUBMITTER' && !tmpl.recipients.submitter.enabled) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = tmpl.name.toLowerCase().includes(query);
        const matchesDesc = (tmpl.description || '').toLowerCase().includes(query);
        const cfg = COMMENT_NOTIFICATION_CONFIG[tmpl.commentType];
        const matchesLabel = cfg?.labelAr.toLowerCase().includes(query) || cfg?.labelEn.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesLabel;
      }
      return true;
    });
  }, [notificationTemplates, selectedTypeFilter, recipientFilter, searchTerm]);

  const handleOpenEdit = (tmpl: CommentNotificationTemplate) => {
    setEditingTemplate(JSON.parse(JSON.stringify(tmpl)));
    setIsCreatingNew(false);
    setActiveRecipientTab('SYSTEM');
  };

  const handleOpenCreate = () => {
    const newTmpl: CommentNotificationTemplate = {
      id: `tmpl_${Date.now()}`,
      commentType: 'GENERAL',
      name: 'قالب إشعار جديد مخصص',
      description: 'وصف الغرض من هذا القالب التنبيهي...',
      isActive: true,
      priority: 'INFO',
      recipients: {
        systemAdmin: {
          enabled: true,
          titleTemplate: 'ملاحظة على طلب #{appId} ({clientName})',
          bodyTemplate: 'قام {senderName} بإضافة تعليق على طلب {clientName}: "{commentSnippet}"'
        },
        companyAdmin: {
          enabled: true,
          titleTemplate: 'متابعة بفرعكم لطلب {clientName}',
          bodyTemplate: 'تعليق جديد من {senderName}: "{commentSnippet}"'
        },
        submitter: {
          enabled: true,
          titleTemplate: 'إشعار متابعة لطلب العميل {clientName}',
          bodyTemplate: 'أضاف مسؤول شركة التقسيط ({senderName}) تعليقاً على طلبك: "{commentSnippet}"'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingTemplate(newTmpl);
    setIsCreatingNew(true);
    setActiveRecipientTab('SYSTEM');
  };

  const handleSaveModal = async () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) {
      alert(isAr ? 'يرجى إدخال اسم القالب' : 'Please enter template name');
      return;
    }

    try {
      if (isCreatingNew) {
        await createNotificationTemplate(editingTemplate);
        showToast(isAr ? 'تم إنشاء قالب الإشعار الجديد بنجاح' : 'New notification template created');
      } else {
        await updateNotificationTemplate(editingTemplate.id, editingTemplate);
        showToast(isAr ? 'تم تحديث قالب الإشعار بنجاح' : 'Notification template updated');
      }
      setEditingTemplate(null);
    } catch (err) {
      console.error(err);
      alert(isAr ? 'حدث خطأ أثناء حفظ القالب' : 'Error saving template');
    }
  };

  const handleToggleActive = async (tmpl: CommentNotificationTemplate) => {
    try {
      await updateNotificationTemplate(tmpl.id, { isActive: !tmpl.isActive });
      showToast(tmpl.isActive 
        ? (isAr ? 'تم تعطيل القالب مؤقتاً' : 'Template disabled') 
        : (isAr ? 'تم تفعيل القالب بنجاح' : 'Template enabled')
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (tmplId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) return;
    try {
      await deleteNotificationTemplate(tmplId);
      showToast(isAr ? 'تم حذف القالب' : 'Template deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDefaults = async () => {
    try {
      await resetNotificationTemplatesToDefault();
      setShowResetConfirm(false);
      showToast(isAr ? 'تمت استعادة كافة القوالب الافتراضية للنظام بنجاح' : 'Default templates restored successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const insertVariable = (variableKey: string) => {
    if (!editingTemplate) return;
    const target = activeRecipientTab === 'SYSTEM' 
      ? 'systemAdmin' 
      : activeRecipientTab === 'COMPANY' 
      ? 'companyAdmin' 
      : 'submitter';

    const currentBody = editingTemplate.recipients[target].bodyTemplate;
    setEditingTemplate({
      ...editingTemplate,
      recipients: {
        ...editingTemplate.recipients,
        [target]: {
          ...editingTemplate.recipients[target],
          bodyTemplate: `${currentBody} ${variableKey}`
        }
      }
    });
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Main Top Section Toggle Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2.5 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab('EXTERNAL_DISPATCH')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'EXTERNAL_DISPATCH'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="h-4 w-4 text-emerald-400" />
            <span>نماذج مراسلات الشركات الخارجية (واتساب وإيميل)</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              mainTab === 'EXTERNAL_DISPATCH' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {externalDispatchTemplates?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('PORTAL_COMMENTS')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'PORTAL_COMMENTS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BellRing className="h-4 w-4 text-indigo-400" />
            <span>إشعارات البورتال والتعليقات الداخلية</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              mainTab === 'PORTAL_COMMENTS' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {notificationTemplates.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 px-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium">تخصيص قوالب الاستعجال، روابط درايف، والمراسلة الرسمية</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EXTERNAL DISPATCH TEMPLATES (WHATSAPP & CORPORATE EMAIL) */}
      {/* ========================================================================= */}
      {mainTab === 'EXTERNAL_DISPATCH' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-cropsa-950 to-emerald-950 p-6 sm:p-8 rounded-3xl text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20">
                  <Send className="h-3.5 w-3.5" />
                  <span>مكتبة نماذج التواصل مع شركات التقسيط الخارجية</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  نماذج المراسلة والاستعجال عبر واتساب والبريد المؤسسي (IMAP/SMTP)
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  تتيح لك هذه المكتبة تجهيز صيغ موحدة لإرسال طلبات التمويل، إرفاق روابط Google Drive لأوراق ومستندات العميل، ورسائل الاستعجال العاجلة للشركات التي تعمل خارج بورتال النظام، مع فتح محادثة واتساب أو الإرسال الفوري عبر بريد شركتك.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetExtConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer"
                  title="استعادة النماذج القياسية لواتساب والإيميل"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>استعادة النماذج القياسية</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateExt}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>إنشاء نموذج مراسلة جديد</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500">إجمالي نماذج المراسلات</span>
              <p className="text-2xl font-black text-slate-900 font-mono">{externalDispatchTemplates?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600">نماذج واتساب (WhatsApp)</span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {(externalDispatchTemplates || []).filter(t => (t.channel || t.type) === 'WHATSAPP').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-600">نماذج البريد المؤسسي (Email)</span>
              <p className="text-2xl font-black text-indigo-700 font-mono">
                {(externalDispatchTemplates || []).filter(t => (t.channel || t.type) === 'EMAIL').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-600">رسائل الاستعجال العاجلة</span>
              <p className="text-2xl font-black text-rose-700 font-mono">
                {(externalDispatchTemplates || []).filter(t => t.category === 'EXPEDITE_URGENT' || (t.category as string) === 'EXPEDITE').length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-6 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث في نماذج المراسلات بالاسم، العنوان، أو نص الرسالة..."
                  value={extSearchTerm}
                  onChange={e => setExtSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500"
                />
                {extSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setExtSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Channel Filter */}
              <div className="md:col-span-3">
                <select
                  value={extChannelFilter}
                  onChange={e => setExtChannelFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 cursor-pointer"
                >
                  <option value="ALL">جميع قنوات الإرسال ({externalDispatchTemplates?.length || 0})</option>
                  <option value="WHATSAPP">💬 رسائل واتساب (WhatsApp)</option>
                  <option value="EMAIL">✉️ بريد إلكتروني مؤسسي (Corporate Email)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="md:col-span-3">
                <select
                  value={extCategoryFilter}
                  onChange={e => setExtCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 cursor-pointer"
                >
                  <option value="ALL">جميع تصنيفات المراسلة</option>
                  {Object.entries(EXT_CATEGORIES).map(([catKey, catVal]) => (
                    <option key={catKey} value={catKey}>
                      {catVal.labelAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* External Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExtTemplates.map(tmpl => {
              const channel = tmpl.channel || tmpl.type || 'WHATSAPP';
              const catInfo = EXT_CATEGORIES[tmpl.category] || EXT_CATEGORIES.CUSTOM;
              const hasDriveLink = tmpl.bodyTemplate?.includes('{driveLink}');

              return (
                <div
                  key={tmpl.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md ${
                    tmpl.active !== false ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Channel & Category Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {channel === 'WHATSAPP' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>واتساب (WhatsApp)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <Mail className="h-3.5 w-3.5 text-indigo-600" />
                            <span>بريد مؤسسي (SMTP)</span>
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${catInfo.badge} ${catInfo.text}`}>
                          {catInfo.labelAr}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleExtActive(tmpl)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          tmpl.active !== false 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tmpl.active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{tmpl.active !== false ? 'مفعل' : 'معطل'}</span>
                      </button>
                    </div>

                    {/* Title & Subject */}
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                        {tmpl.category === 'EXPEDITE_URGENT' && <Zap className="h-4 w-4 text-amber-500 shrink-0" />}
                        <span>{tmpl.nameAr || tmpl.name}</span>
                      </h3>
                      {tmpl.subjectTemplate && (
                        <p className="text-xs text-indigo-700 bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 mt-2 font-medium">
                          <span className="font-bold text-indigo-900">عنوان الإيميل: </span>
                          {renderExtSampleText(tmpl.subjectTemplate)}
                        </p>
                      )}
                    </div>

                    {/* Body Preview with Highlighted Variables */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-b border-slate-200 pb-1.5">
                        <span>معاينة نص الرسالة:</span>
                        {hasDriveLink && (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <Link2 className="h-3 w-3" />
                            <span>يتضمن رابط Google Drive</span>
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-line text-slate-700 line-clamp-6 leading-relaxed font-sans text-[11px]">
                        {renderExtSampleText(tmpl.bodyTemplate)}
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewExtTemplate(tmpl)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
                        title="معاينة النموذج الحي مع بيانات تجريبية ورابط درايف"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteExtTemplate(tmpl.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف هذا النموذج"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEditExt(tmpl)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل النموذج</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PORTAL COMMENTS NOTIFICATIONS (EXISTING ROBUST SYSTEM) */}
      {/* ========================================================================= */}
      {mainTab === 'PORTAL_COMMENTS' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-cropsa-950 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/20">
                  <BellRing className="h-3.5 w-3.5" />
                  <span>نظام إدارة قوالب وتوجيه الإشعارات الذكية</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  قوالب إشعارات تعليقات وملاحظات الموظفين
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  تتيح هذه الصفحة تخصيص نصوص وعناوين الإشعارات التلقائية الصادرة عند كتابة الموظف لأي تعليق، مع التحكم الكامل في تحديد المستلمين المعنيين (مدير النظام، مدير شركة التقسيط والفرع، والموظف مقدم المعاملة).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer"
                  title="إعادة ضبط القوالب للافتراضي"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>استعادة القوالب القياسية</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-black shadow-lg shadow-crobsa-700/30 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>إنشاء قالب إشعار جديد</span>
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500">إجمالي القوالب المسجلة</span>
              <p className="text-2xl font-black text-slate-900 font-mono">{notificationTemplates.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600">القوالب النشطة حالياً</span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {notificationTemplates.filter(t => t.isActive).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-purple-600">تغطية أنواع التعليقات</span>
              <p className="text-2xl font-black text-purple-700 font-mono">
                {Object.keys(COMMENT_NOTIFICATION_CONFIG).length} أنواع
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-600">أطراف الإرسال المستهدفة</span>
              <p className="text-2xl font-black text-amber-700 font-mono">3 جهات مستلمة</p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-6 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الوصف، أو نوع التعليق..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-crobsa-500 font-sans"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Comment Type Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 cursor-pointer"
                >
                  <option value="ALL">جميع أنواع التعليقات ({notificationTemplates.length})</option>
                  {(Object.keys(COMMENT_NOTIFICATION_CONFIG) as CommentNotificationType[]).map(tKey => (
                    <option key={tKey} value={tKey}>
                      {COMMENT_NOTIFICATION_CONFIG[tKey].labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Filter */}
              <div className="md:col-span-3">
                <select
                  value={recipientFilter}
                  onChange={e => setRecipientFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-crobsa-500 cursor-pointer"
                >
                  <option value="ALL">تصفية بحسب جهة المستلم (الكل)</option>
                  <option value="SYSTEM">يصل لمدير النظام</option>
                  <option value="COMPANY">يصل لمدير شركة التقسيط</option>
                  <option value="SUBMITTER">يصل للموظف مقدم الطلب</option>
                </select>
              </div>
            </div>
          </div>

          {/* Templates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map(tmpl => {
              const cfg = COMMENT_NOTIFICATION_CONFIG[tmpl.commentType] || COMMENT_NOTIFICATION_CONFIG.GENERAL;
              return (
                <div 
                  key={tmpl.id}
                  className={`bg-white rounded-3xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md ${
                    tmpl.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Type Badge & Active Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.borderColor}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                        <span>{cfg.labelAr}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(tmpl)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          tmpl.isActive 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tmpl.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{tmpl.isActive ? 'مفعل' : 'معطل'}</span>
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{tmpl.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {tmpl.description || cfg.descriptionAr}
                      </p>
                    </div>

                    {/* Recipients Routing Matrix */}
                    <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        المستلمون المعنيون بالإشعار:
                      </span>
                      
                      <div className="space-y-1.5 text-xs">
                        {/* System Admin */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                            <span>مدير النظام:</span>
                          </span>
                          {tmpl.recipients.systemAdmin.enabled ? (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                              مفعل ✓
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              معطل ✕
                            </span>
                          )}
                        </div>

                        {/* Company Admin */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <Building2 className="h-3.5 w-3.5 text-sky-600" />
                            <span>مدير شركة التقسيط:</span>
                          </span>
                          {tmpl.recipients.companyAdmin.enabled ? (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                              مفعل ✓
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              معطل ✕
                            </span>
                          )}
                        </div>

                        {/* Submitter */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                            <User className="h-3.5 w-3.5 text-amber-600" />
                            <span>الموظف مقدم الطلب:</span>
                          </span>
                          {tmpl.recipients.submitter.enabled ? (
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                              مفعل ✓
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                              معطل ✕
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Snippet Preview of Submitter template */}
                    <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/70 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>صيغة إشعار مقدم الطلب:</span>
                        <span className="text-[9px] text-slate-400 font-mono">نموذج حي</span>
                      </div>
                      <p className="line-clamp-2 italic text-slate-600 font-sans">
                        "{renderSampleText(tmpl.recipients.submitter.bodyTemplate)}"
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(tmpl)}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
                        title="معاينة نموذج الإشعارات الحي"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="حذف القالب"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tmpl)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>تعديل القالب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT EXTERNAL DISPATCH TEMPLATE */}
      {/* ========================================================================= */}
      {editingExtTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Send className="h-5 w-5 text-emerald-400" />
                  <span>
                    {isCreatingNewExt ? 'إنشاء نموذج مراسلة خارجي جديد' : `تعديل نموذج: ${editingExtTemplate.nameAr || editingExtTemplate.name}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تجهيز صيغة رسالة واتساب أو بريد إلكتروني رسمي مع المتغيرات التلقائية ورابط Google Drive
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingExtTemplate(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Primary Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم النموذج (بالعربية):</label>
                  <input
                    type="text"
                    value={editingExtTemplate.nameAr || ''}
                    onChange={e => setEditingExtTemplate({ ...editingExtTemplate, nameAr: e.target.value, name: e.target.value })}
                    placeholder="مثال: رسالة استعجال فوري لشركة التقسيط"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم النموذج (بالإنجليزية):</label>
                  <input
                    type="text"
                    value={editingExtTemplate.nameEn || ''}
                    onChange={e => setEditingExtTemplate({ ...editingExtTemplate, nameEn: e.target.value })}
                    placeholder="e.g. Urgent Application Expedite"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-crobsa-500 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">قناة الإرسال:</label>
                  <select
                    value={editingExtTemplate.channel || editingExtTemplate.type || 'WHATSAPP'}
                    onChange={e => {
                      const val = e.target.value as 'WHATSAPP' | 'EMAIL';
                      setEditingExtTemplate({ ...editingExtTemplate, channel: val, type: val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  >
                    <option value="WHATSAPP">💬 رسائل واتساب (WhatsApp Direct Link)</option>
                    <option value="EMAIL">✉️ بريد إلكتروني رسمي (Corporate SMTP/IMAP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تصنيف الغرض من المراسلة:</label>
                  <select
                    value={editingExtTemplate.category || 'NEW_APPLICATION'}
                    onChange={e => setEditingExtTemplate({ ...editingExtTemplate, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  >
                    {Object.entries(EXT_CATEGORIES).map(([catKey, catVal]) => (
                      <option key={catKey} value={catKey}>
                        {catVal.labelAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email Subject Field (if channel is EMAIL) */}
              {(editingExtTemplate.channel === 'EMAIL' || editingExtTemplate.type === 'EMAIL') && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-1.5">
                  <label className="block text-xs font-black text-indigo-950">عنوان رسالة البريد الإلكتروني (Email Subject):</label>
                  <input
                    type="text"
                    value={editingExtTemplate.subjectTemplate || ''}
                    onChange={e => setEditingExtTemplate({ ...editingExtTemplate, subjectTemplate: e.target.value })}
                    placeholder="مثال: [استعجال فوري] طلب تمويل العميل: {clientName} - رقم المعاملة #{appId}"
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 text-xs text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-indigo-700">يمكنك استخدام المتغيرات مثل &#123;clientName&#125; أو &#123;appId&#125; في عنوان الرسالة.</p>
                </div>
              )}

              {/* Variable Chips Inserter */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-crobsa-600" />
                  <span>انقر لإدراج متغير ديناميكي في نص الرسالة تلقائياً:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXT_PLACEHOLDERS.map(p => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => insertExtVariable(p.tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        p.tag === '{driveLink}'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-crobsa-400 hover:text-crobsa-700'
                      }`}
                      title={`إدراج ${p.label}`}
                    >
                      {p.tag === '{driveLink}' && <Link2 className="h-3 w-3 text-emerald-600" />}
                      <span>{p.label}</span>
                      <span className="font-mono text-[10px] text-slate-400 dir-ltr">{p.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">نص وقالب الرسالة:</label>
                  <span className="text-[11px] text-slate-400">
                    عدد الأحرف: {(editingExtTemplate.bodyTemplate || '').length}
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editingExtTemplate.bodyTemplate || ''}
                  onChange={e => setEditingExtTemplate({ ...editingExtTemplate, bodyTemplate: e.target.value })}
                  placeholder="اكتب صيغة الرسالة مع استخدام المتغيرات مثل {clientName} ورابط الدرايف {driveLink}..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-900 leading-relaxed font-sans focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                />
              </div>

              {/* Live Preview Inside Edit Modal */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span>المعاينة التفاعلية المباشرة (مع بيانات عميل تجريبية):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time Simulation</span>
                </div>
                {editingExtTemplate.subjectTemplate && (
                  <p className="text-xs font-bold text-indigo-300 border-b border-slate-800/80 pb-2">
                    الموضوع: {renderExtSampleText(editingExtTemplate.subjectTemplate)}
                  </p>
                )}
                <p className="text-xs whitespace-pre-line text-slate-200 font-sans leading-relaxed">
                  {renderExtSampleText(editingExtTemplate.bodyTemplate)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingExtTemplate(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveExtModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>حفظ النموذج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW EXTERNAL TEMPLATE WITH SAMPLE DATA */}
      {/* ========================================================================= */}
      {previewExtTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-emerald-600" />
                  <span>معاينة نموذج: {previewExtTemplate.nameAr || previewExtTemplate.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  القناة: {(previewExtTemplate.channel || previewExtTemplate.type) === 'WHATSAPP' ? 'واتساب' : 'بريد إلكتروني مؤسسي'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewExtTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {previewExtTemplate.subjectTemplate && (
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-xs">
                <span className="font-black text-indigo-950 block mb-1">عنوان البريد الإلكتروني:</span>
                <p className="font-bold text-indigo-800 font-sans">{renderExtSampleText(previewExtTemplate.subjectTemplate)}</p>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">نص الرسالة المرسل:</span>
              <p className="text-xs whitespace-pre-line text-slate-900 font-sans leading-relaxed">
                {renderExtSampleText(previewExtTemplate.bodyTemplate)}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewExtTemplate(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET EXTERNAL DISPATCH TEMPLATES CONFIRMATION */}
      {/* ========================================================================= */}
      {showResetExtConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">استعادة نماذج المراسلات القياسية؟</h3>
                <p className="text-xs text-slate-500">سيتم استرجاع النماذج الافتراضية المعتمدة لواتساب والبريد الإلكتروني المؤسسي.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              هذا الإجراء سيقوم بإعادة ضبط كافة نماذج المراسلات الخارجية (نماذج إرسال الطلبات، رسائل الاستعجال، روابط درايف) إلى القوالب القياسية. هل ترغب في الاستمرار؟
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetExtConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetExtDefaults}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                تأكيد الاسترجاع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT OR CREATE PORTAL NOTIFICATION TEMPLATE */}
      {/* ========================================================================= */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-indigo-400" />
                  <span>{isCreatingNew ? 'إنشاء قالب إشعار جديد' : `تعديل قالب: ${editingTemplate.name}`}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  حدد نص الإشعار وعنوانه لكل طرف من الأطراف الثلاثة بدقة
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Primary Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم القالب التوضيحي:</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="مثال: قالب طلب مستندات ناقصة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">يرتبط بنوع التعليق:</label>
                  <select
                    value={editingTemplate.commentType}
                    onChange={e => setEditingTemplate({ ...editingTemplate, commentType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-crobsa-500 focus:outline-none cursor-pointer"
                  >
                    {(Object.keys(COMMENT_NOTIFICATION_CONFIG) as CommentNotificationType[]).map(tKey => (
                      <option key={tKey} value={tKey}>
                        {COMMENT_NOTIFICATION_CONFIG[tKey].labelAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف القالب وسياق استخدامه:</label>
                  <input
                    type="text"
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    placeholder="وصف مختصر للغرض من هذا الإشعار..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Recipient Sub-Tabs */}
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-900">
                  تخصيص الرسالة بحسب الجهة المستلمة:
                </label>

                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('SYSTEM')}
                    className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'SYSTEM'
                        ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>إشعار مدير النظام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('COMPANY')}
                    className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'COMPANY'
                        ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>إشعار شركة التقسيط والفرع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('SUBMITTER')}
                    className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'SUBMITTER'
                        ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>إشعار الموظف مقدم المعاملة</span>
                  </button>
                </div>

                {/* Sub-Tab Content: System Admin */}
                {activeRecipientTab === 'SYSTEM' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-purple-50/40 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                        <span>توجيه هذا الإشعار إلى مديري النظام (Super Admin / Admin):</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTemplate.recipients.systemAdmin.enabled}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            recipients: {
                              ...editingTemplate.recipients,
                              systemAdmin: {
                                ...editingTemplate.recipients.systemAdmin,
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-purple-900">تفعيل الإرسال</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-950 mb-1">عنوان الإشعار:</label>
                      <input
                        type="text"
                        value={editingTemplate.recipients.systemAdmin.titleTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            systemAdmin: {
                              ...editingTemplate.recipients.systemAdmin,
                              titleTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-950 mb-1">نص الإشعار:</label>
                      <textarea
                        rows={3}
                        value={editingTemplate.recipients.systemAdmin.bodyTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            systemAdmin: {
                              ...editingTemplate.recipients.systemAdmin,
                              bodyTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Tab Content: Company Admin */}
                {activeRecipientTab === 'COMPANY' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-sky-50/40 border border-sky-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-sky-600" />
                        <span>توجيه هذا الإشعار إلى مديري شركة التقسيط ومدير الفرع:</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTemplate.recipients.companyAdmin.enabled}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            recipients: {
                              ...editingTemplate.recipients,
                              companyAdmin: {
                                ...editingTemplate.recipients.companyAdmin,
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-sky-900">تفعيل الإرسال</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-950 mb-1">عنوان الإشعار:</label>
                      <input
                        type="text"
                        value={editingTemplate.recipients.companyAdmin.titleTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            companyAdmin: {
                              ...editingTemplate.recipients.companyAdmin,
                              titleTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-950 mb-1">نص الإشعار:</label>
                      <textarea
                        rows={3}
                        value={editingTemplate.recipients.companyAdmin.bodyTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            companyAdmin: {
                              ...editingTemplate.recipients.companyAdmin,
                              bodyTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-sky-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Sub-Tab Content: Submitter */}
                {activeRecipientTab === 'SUBMITTER' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-amber-50/40 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-amber-600" />
                        <span>توجيه هذا الإشعار إلى الموظف مقدم المعاملة (المندوب أو المورد):</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTemplate.recipients.submitter.enabled}
                          onChange={e => setEditingTemplate({
                            ...editingTemplate,
                            recipients: {
                              ...editingTemplate.recipients,
                              submitter: {
                                ...editingTemplate.recipients.submitter,
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-amber-900">تفعيل الإرسال</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">عنوان الإشعار:</label>
                      <input
                        type="text"
                        value={editingTemplate.recipients.submitter.titleTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            submitter: {
                              ...editingTemplate.recipients.submitter,
                              titleTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">نص الإشعار:</label>
                      <textarea
                        rows={3}
                        value={editingTemplate.recipients.submitter.bodyTemplate}
                        onChange={e => setEditingTemplate({
                          ...editingTemplate,
                          recipients: {
                            ...editingTemplate.recipients,
                            submitter: {
                              ...editingTemplate.recipients.submitter,
                              bodyTemplate: e.target.value
                            }
                          }
                        })}
                        className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Variables Tool */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-crobsa-600" />
                  <span>انقر لإدراج متغير ديناميكي في نص الإشعار الحالي:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: '{clientName}', label: 'اسم العميل' },
                    { key: '{clientNationalId}', label: 'الرقم القومي' },
                    { key: '{appId}', label: 'رقم الطلب' },
                    { key: '{senderName}', label: 'اسم كاتب التعليق' },
                    { key: '{senderRole}', label: 'صفة كاتب التعليق' },
                    { key: '{companyName}', label: 'اسم شركة التقسيط' },
                    { key: '{branchName}', label: 'اسم الفرع' },
                    { key: '{governorate}', label: 'المحافظة' },
                    { key: '{commentSnippet}', label: 'مقتطف من التعليق' },
                    { key: '{commentTypeLabel}', label: 'تصنيف التعليق' },
                    { key: '{date}', label: 'التاريخ' }
                  ].map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-crobsa-400 hover:text-crobsa-700 text-slate-700 font-bold transition-all cursor-pointer flex items-center gap-1"
                      title={`إدراج ${v.label}`}
                    >
                      <span>{v.label}</span>
                      <span className="font-mono text-[10px] text-slate-400 dir-ltr">{v.key}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveModal}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>حفظ القالب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW PORTAL TEMPLATE */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">معاينة حية: {previewTemplate.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  عرض كيف سيظهر الإشعار لكل جهة مستلمة بناءً على عينة بيانات
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* System Admin */}
              <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                    <span>إشعار مدير النظام:</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    previewTemplate.recipients.systemAdmin.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {previewTemplate.recipients.systemAdmin.enabled ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900">
                  {renderSampleText(previewTemplate.recipients.systemAdmin.titleTemplate)}
                </p>
                <p className="text-xs text-slate-700">
                  {renderSampleText(previewTemplate.recipients.systemAdmin.bodyTemplate)}
                </p>
              </div>

              {/* Company Admin */}
              <div className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-900 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-sky-600" />
                    <span>إشعار شركة التقسيط والفرع:</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    previewTemplate.recipients.companyAdmin.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {previewTemplate.recipients.companyAdmin.enabled ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900">
                  {renderSampleText(previewTemplate.recipients.companyAdmin.titleTemplate)}
                </p>
                <p className="text-xs text-slate-700">
                  {renderSampleText(previewTemplate.recipients.companyAdmin.bodyTemplate)}
                </p>
              </div>

              {/* Submitter */}
              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <User className="h-4 w-4 text-amber-600" />
                    <span>إشعار الموظف مقدم المعاملة (المندوب / المورد):</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    previewTemplate.recipients.submitter.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {previewTemplate.recipients.submitter.enabled ? 'مفعل' : 'معطل'}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900">
                  {renderSampleText(previewTemplate.recipients.submitter.titleTemplate)}
                </p>
                <p className="text-xs text-slate-700">
                  {renderSampleText(previewTemplate.recipients.submitter.bodyTemplate)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET CONFIRMATION FOR PORTAL TEMPLATES */}
      {/* ========================================================================= */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">استعادة القوالب القياسية؟</h3>
                <p className="text-xs text-slate-500">سيتم استرجاع الإعدادات والنصوص الافتراضية المعتمدة لجميع القوالب.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              هذا الإجراء سيقوم بإعادة ضبط كافة قوالب إشعارات التعليقات وتوجيهاتها إلى القوالب الأصلية للنظام. هل ترغب في الاستمرار؟
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                تأكيد الاسترجاع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
