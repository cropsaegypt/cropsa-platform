import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  CommentNotificationType, 
  CommentNotificationTemplate, 
  COMMENT_NOTIFICATION_CONFIG 
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
  ArrowRight
} from 'lucide-react';

export const NotificationTemplatesManager: React.FC = () => {
  const { 
    notificationTemplates, 
    updateNotificationTemplate, 
    createNotificationTemplate, 
    deleteNotificationTemplate, 
    resetNotificationTemplatesToDefault, 
    currentUser,
    language 
  } = useStore();

  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'SYSTEM' | 'COMPANY' | 'SUBMITTER'>('ALL');

  // Modal State
  const [editingTemplate, setEditingTemplate] = useState<CommentNotificationTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CommentNotificationTemplate | null>(null);
  const [activeRecipientTab, setActiveRecipientTab] = useState<'SYSTEM' | 'COMPANY' | 'SUBMITTER'>('SYSTEM');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

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

      {/* ========================================================================= */}
      {/* MODAL: EDIT OR CREATE TEMPLATE */}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع التعليق المرتبط:</label>
                  <select
                    value={editingTemplate.commentType}
                    onChange={e => setEditingTemplate({ ...editingTemplate, commentType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-crobsa-500 focus:outline-none cursor-pointer"
                  >
                    {(Object.keys(COMMENT_NOTIFICATION_CONFIG) as CommentNotificationType[]).map(tKey => (
                      <option key={tKey} value={tKey}>
                        {COMMENT_NOTIFICATION_CONFIG[tKey].labelAr} ({COMMENT_NOTIFICATION_CONFIG[tKey].labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف القالب والغرض منه:</label>
                  <input
                    type="text"
                    value={editingTemplate.description || ''}
                    onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    placeholder="شرح متى يُستخدم هذا القالب لتسهيل المتابعة على الفريق..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-crobsa-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Placeholder Variables Toolstrip */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-crobsa-800">
                    <Sparkles className="h-4 w-4 text-crobsa-600" />
                    <span>المتغيرات الديناميكية الجاهزة (انقر للإدراج في نص الإشعار):</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{clientName}', label: 'اسم العميل' },
                    { tag: '{appId}', label: 'رقم الطلب' },
                    { tag: '{senderName}', label: 'اسم كاتب التعليق' },
                    { tag: '{companyName}', label: 'اسم الشركة' },
                    { tag: '{branchName}', label: 'اسم الفرع' },
                    { tag: '{governorate}', label: 'المحافظة' },
                    { tag: '{commentSnippet}', label: 'مقتطف التعليق' },
                    { tag: '{commentTypeLabel}', label: 'نوع الإشعار' },
                    { tag: '{date}', label: 'التاريخ' }
                  ].map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => insertVariable(v.tag)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-mono font-bold hover:bg-crobsa-50 hover:border-crobsa-300 transition-colors shadow-2xs"
                      title={`إدراج ${v.label}`}
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Setup Sub-Tabs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('SYSTEM')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'SYSTEM'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>1. مدير النظام (Super Admin)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('COMPANY')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'COMPANY'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>2. مدير شركة التقسيط والفرع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRecipientTab('SUBMITTER')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeRecipientTab === 'SUBMITTER'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>3. الموظف مقدم الطلب</span>
                  </button>
                </div>

                {/* Sub-tab 1: System Admin */}
                {activeRecipientTab === 'SYSTEM' && (
                  <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-black text-purple-950 cursor-pointer">
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
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>تفعيل إرسال هذا الإشعار لمدير النظام تلقائياً</span>
                      </label>
                      <span className="text-[11px] text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded-md">
                        {editingTemplate.recipients.systemAdmin.enabled ? 'مفعل للإدارة العليا' : 'معطل'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار لمدير النظام:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">صيغة نص الإشعار الكاملة:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Company Admin */}
                {activeRecipientTab === 'COMPANY' && (
                  <div className="p-4 rounded-2xl bg-sky-50/40 border border-sky-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-black text-sky-950 cursor-pointer">
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
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                        />
                        <span>تفعيل إرسال هذا الإشعار لمدير شركة التقسيط ومديري الفروع</span>
                      </label>
                      <span className="text-[11px] text-sky-700 font-bold bg-sky-100/70 px-2 py-0.5 rounded-md">
                        {editingTemplate.recipients.companyAdmin.enabled ? 'مفعل لشركة التقسيط' : 'معطل'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار لمدير الشركة:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">صيغة نص الإشعار الكاملة:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Submitter */}
                {activeRecipientTab === 'SUBMITTER' && (
                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-black text-amber-950 cursor-pointer">
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
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span>تفعيل إرسال هذا الإشعار للموظف مقدم الطلب (المندوب / المورد)</span>
                      </label>
                      <span className="text-[11px] text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md">
                        {editingTemplate.recipients.submitter.enabled ? 'مفعل لمقدم الطلب' : 'معطل'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار للموظف مقدم الطلب:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">صيغة نص الإشعار الكاملة:</label>
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
                          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Inside Modal */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">
                  معاينة فورية للإشعار كما سيصل للمستلم المحدد ({activeRecipientTab}):
                </span>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-300">
                      {renderSampleText(
                        activeRecipientTab === 'SYSTEM' 
                          ? editingTemplate.recipients.systemAdmin.titleTemplate 
                          : activeRecipientTab === 'COMPANY' 
                          ? editingTemplate.recipients.companyAdmin.titleTemplate 
                          : editingTemplate.recipients.submitter.titleTemplate
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">الآن</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {renderSampleText(
                      activeRecipientTab === 'SYSTEM' 
                        ? editingTemplate.recipients.systemAdmin.bodyTemplate 
                        : activeRecipientTab === 'COMPANY' 
                        ? editingTemplate.recipients.companyAdmin.bodyTemplate 
                        : editingTemplate.recipients.submitter.bodyTemplate
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>حفظ التعديلات والتوجيهات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIVE PREVIEW FOR ALL RECIPIENTS */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-crobsa-700" />
                  <span>معاينة حية للقالب: {previewTemplate.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  هكذا ستصل الإشعارات للأطراف الثلاثة في جرس التنبيهات
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
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
                    <span>إشعار مدير النظام (Super Admin):</span>
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
                    <span>إشعار مدير شركة التقسيط والفرع:</span>
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
      {/* MODAL: RESET CONFIRMATION */}
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
