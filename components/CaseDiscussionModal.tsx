import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { 
  Application, 
  Role, 
  ApplicationDocument, 
  ApplicationComment,
  CommentNotificationType,
  COMMENT_NOTIFICATION_CONFIG
} from '../types';
import { 
  MessageSquare, 
  Send, 
  FileText, 
  Upload, 
  Zap, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  User, 
  Building2, 
  Clock, 
  Paperclip, 
  Download, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  AlertCircle,
  Eye,
  Bell,
  Search
} from 'lucide-react';
import { InternalDocViewerModal } from './InternalDocViewerModal';

interface CaseDiscussionModalProps {
  application: Application;
  onClose: () => void;
  defaultTab?: 'comments' | 'documents' | 'reroute';
}

export const CaseDiscussionModal: React.FC<CaseDiscussionModalProps> = ({
  application,
  onClose,
  defaultTab = 'comments'
}) => {
  const { 
    currentUser, 
    currentCompany, 
    companies, 
    addApplicationComment, 
    uploadApplicationDocument, 
    expediteApplication, 
    reRouteApplication 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'comments' | 'documents' | 'reroute'>(defaultTab);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [selectedNotifType, setSelectedNotifType] = useState<CommentNotificationType>('GENERAL');
  const [isUrgentComment, setIsUrgentComment] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  // Document state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<ApplicationDocument['type']>('NATIONAL_ID');
  const [isUploading, setIsUploading] = useState(false);

  // Re-route state
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [reRouteReason, setReRouteReason] = useState('');
  const [isReRouting, setIsReRouting] = useState(false);
  const [reRouteSuccess, setReRouteSuccess] = useState(false);

  // Internal viewer modal state
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);

  // Handle comment submit
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSendingComment(true);
    try {
      await addApplicationComment(application.id, commentText, isUrgentComment, selectedNotifType);
      setCommentText('');
      setIsUrgentComment(false);
      setSelectedNotifType('GENERAL');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingComment(false);
    }
  };

  // Handle document upload
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    setIsUploading(true);
    try {
      await uploadApplicationDocument(application.id, {
        name: docName.trim(),
        type: docType,
        url: 'https://crobsa.com/uploads/' + encodeURIComponent(docName) + '.pdf',
        size: '1.8 MB'
      });
      setDocName('');
      setShowUploadForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle expedite click
  const handleExpedite = async () => {
    try {
      await expediteApplication(application.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle re-route submit
  const handleReRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompanyId) return;

    setIsReRouting(true);
    try {
      await reRouteApplication(application.id, targetCompanyId, reRouteReason);
      setReRouteSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReRouting(false);
    }
  };

  // Filter companies available for re-routing (exclude current assigned company)
  const availableCompanies = companies.filter(
    c => !application.assignedCompanyIds.includes(c.id) && c.status === 'ACTIVE'
  );

  const comments = application.comments || [];
  const documents = application.documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-crobsa-100 text-crobsa-900 flex items-center justify-center font-bold shadow-sm">
              <MessageSquare className="h-6 w-6 text-crobsa-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900">
                  ملف ومناقشة الطلب: {application.clientName}
                </h3>
                {application.isUrgent && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                    مستعجل
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                رقم قومي: <span className="font-mono text-slate-700">{application.clientNationalId}</span> • المبلغ: <span className="font-bold text-slate-800">{application.requestedAmount.toLocaleString()} ج.م</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!application.isUrgent && (
              <button
                onClick={handleExpedite}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                title="طلب سرعة الرد وفحص الملف"
              >
                <Zap className="h-4 w-4" />
                استعجال الطلب
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Rejection Alert Header if rejected */}
        {application.status === 'REJECTED' && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-rose-950">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded">حالة الطلب: مرفوض</span>
                  <p className="text-sm font-bold">سبب الرفض: {application.rejectionReason || 'عدم استيفاء الشروط الائتمانية'}</p>
                </div>
                {application.rejectionNotes && (
                  <p className="text-xs text-rose-700 mt-1">
                    ملاحظات الفاحص: {application.rejectionNotes}
                  </p>
                )}
              </div>
            </div>

            {(currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) && (
              <button
                onClick={() => setActiveTab('reroute')}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4" />
                تحويل لشركة أخرى
              </button>
            )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center gap-2 p-3 px-6 bg-slate-100/70 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'comments'
                ? 'bg-white text-crobsa-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            المناقشة والاستفسارات
            {comments.length > 0 && (
              <span className="bg-crobsa-100 text-crobsa-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'documents'
                ? 'bg-white text-crobsa-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            مستندات وملفات العميل
            {documents.length > 0 && (
              <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {documents.length}
              </span>
            )}
          </button>

          {(currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) && (
            <button
              onClick={() => setActiveTab('reroute')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reroute'
                  ? 'bg-white text-crobsa-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              إعادة توجيه وتحويل الطلب
              {application.reRouteHistory && application.reRouteHistory.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {application.reRouteHistory.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: COMMENTS / DISCUSSION */}
          {/* ========================================================================= */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              
              {/* Notification Banner Info */}
              <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>نظام الاستفسارات والملاحظات المباشر:</strong> أي تعليق يتم إضافته هنا من قبل شركة التقسيط يصل به إشعار فوري لمسؤول المبيعات ومسؤولي كروبسا، والعكس صحيح لتسريع استيفاء الأوراق واستكمال الموافقات.
                </p>
              </div>

              {/* Comments Feed */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">لا توجد ملاحظات أو استفسارات مسجلة بعد</p>
                    <p className="text-xs text-slate-400 mt-1">ابدأ بكتابة استفسار أو تنبيه لشركة التقسيط أو المندوب أدناه</p>
                  </div>
                ) : (
                  comments.map(c => {
                    const isFromCompany = c.senderRole === Role.INSTALLMENT_COMPANY;
                    const notifConfig = c.notificationType ? COMMENT_NOTIFICATION_CONFIG[c.notificationType] : null;

                    return (
                      <div 
                        key={c.id} 
                        className={`p-4 rounded-2xl border transition-all ${
                          c.isUrgent 
                            ? 'bg-amber-50/70 border-amber-300 shadow-xs' 
                            : notifConfig 
                              ? `${notifConfig.badgeBg}/30 ${notifConfig.borderColor}`
                              : isFromCompany 
                                ? 'bg-purple-50/50 border-purple-100' 
                                : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isFromCompany ? 'bg-purple-600 text-white' : 'bg-slate-700 text-white'
                            }`}>
                              {isFromCompany ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {c.senderName}
                                </span>
                                {notifConfig && (
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${notifConfig.badgeBg} ${notifConfig.badgeText} ${notifConfig.borderColor} flex items-center gap-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${notifConfig.dotColor}`}></span>
                                    {notifConfig.labelAr}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                ({c.senderRole === Role.INSTALLMENT_COMPANY ? (c.senderCompanyName || 'شركة التقسيط') : c.senderRole === Role.SALESMAN ? 'مسؤول المبيعات' : 'إدارة كروبسا'})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(c.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                            {c.isUrgent && (
                              <span className="bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded text-[9px]">عاجل</span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 leading-relaxed font-sans pr-9">
                          {c.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input Box with Notification Type Selector */}
              <form onSubmit={handleSendComment} className="pt-4 border-t border-slate-100 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-crobsa-700" />
                    اختيار نوع الإشعار بناءً على محتوى التعليق:
                  </label>
                  
                  {/* Notification Type Selector Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(COMMENT_NOTIFICATION_CONFIG) as CommentNotificationType[]).map(typeKey => {
                      const cfg = COMMENT_NOTIFICATION_CONFIG[typeKey];
                      const isSelected = selectedNotifType === typeKey;
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => {
                            setSelectedNotifType(typeKey);
                            if (typeKey === 'URGENT_INQUIRY' || typeKey === 'WARNING_ALERT') {
                              setIsUrgentComment(true);
                            }
                          }}
                          className={`p-2 rounded-xl text-right border transition-all text-xs flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? `${cfg.badgeBg} ${cfg.borderColor} ring-2 ring-crobsa-500/50 shadow-xs font-black ${cfg.badgeText}`
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotColor}`}></span>
                            <span className="truncate text-[11px]">{cfg.labelAr}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-crobsa-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    نص التعليق / الملاحظة:
                  </label>
                  
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    placeholder="مثال: يرجى موافاتنا بإيصال مرافق حديث لا يتجاوز 3 أشهر، أو صورة واضحة للرقم القومي..."
                    className="w-full text-sm p-3.5 rounded-2xl border border-slate-300 focus:border-crobsa-500 focus:ring-2 focus:ring-crobsa-200 outline-none transition-all resize-none"
                  />

                  {/* Recipient Announcement Notice */}
                  <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-2.5 px-3 flex items-center gap-2 text-[11px] text-sky-900">
                    <Bell className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span>
                      <strong>أطراف الإشعار الفوري:</strong> سيصل إشعار بنوع <span className="font-bold text-sky-950">({COMMENT_NOTIFICATION_CONFIG[selectedNotifType].labelAr})</span> إلى: <strong>الموظف مقدم الطلب</strong>، <strong>مدير شركة التقسيط</strong>، و<strong>مدير النظام</strong>.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-900 font-bold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={isUrgentComment}
                        onChange={(e) => setIsUrgentComment(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>تحديد كاستفسار عاجل (تنبيه فوري لجميع الأطراف)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSendingComment || !commentText.trim()}
                      className="bg-crobsa-800 hover:bg-crobsa-900 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Send className="h-4 w-4" />
                      {isSendingComment ? 'جاري الإرسال...' : 'إرسال التعليق والإشعار'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DOCUMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">المستندات الرسمية المرفوعة للطلب</h4>
                  <p className="text-xs text-slate-500 mt-0.5">يمكنك فحص الوثائق أو رفع مستندات إضافية طلبتها جهة التقسيط</p>
                </div>

                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Upload className="h-4 w-4" />
                  {showUploadForm ? 'إلغاء' : 'رفع مستند جديد'}
                </button>
              </div>

              {/* Upload Form Modal/Box */}
              {showUploadForm && (
                <form onSubmit={handleUploadDoc} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">إضافة ملف أو مستند إضافي</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">اسم المستند أو الوصف</label>
                      <input
                        type="text"
                        required
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="مثال: إيصال كهرباء حديث شهر مارس 2026"
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">تصنيف المستند</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                      >
                        <option value="NATIONAL_ID">بطاقة الرقم القومي (وجه/ظهر)</option>
                        <option value="UTILITY_BILL">إيصال مرافق (كهرباء / مياه / غاز)</option>
                        <option value="FARM_PROOF">حيازة زراعية / كارت فلاح</option>
                        <option value="INCOME_PROOF">مفردات مرتب / سجل تجاري</option>
                        <option value="CONTRACT">عقد تمويل / شيكات موقعة</option>
                        <option value="OTHER">مستندات أخرى</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !docName.trim()}
                      className="bg-crobsa-800 hover:bg-crobsa-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'جاري الرفع...' : 'حفظ وإرفاق المستند'}
                    </button>
                  </div>
                </form>
              )}

              {/* Documents List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">لا توجد ملفات مرفوعة داخل هذا الطلب</p>
                    <p className="text-xs text-slate-400 mt-1">انقر على "رفع مستند جديد" لإضافة أوراق العميل</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div 
                      key={doc.id} 
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-crobsa-300 shadow-sm flex items-center justify-between gap-3 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-crobsa-100 group-hover:text-crobsa-900 transition-colors">
                          <Paperclip className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {doc.size || '1.5 MB'} • رفع بواسطة: {doc.uploadedByName || 'النظام'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1.5 bg-crobsa-50 hover:bg-crobsa-100 text-crobsa-800 text-xs font-bold rounded-lg border border-crobsa-200 transition-colors flex items-center gap-1 shadow-xs"
                          title="عرض المستند داخل البورتال"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>عرض داخل البورتال</span>
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                          title="فتح في نافذة خارجية"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Portal Internal Document Drive Viewer Banner */}
              {application.documentLink && (
                <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50/70 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl text-sky-600 shadow-sm border border-sky-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <span>أرشيف المستندات والملفات المرفوعة</span>
                        <span className="text-[10px] bg-sky-200/60 text-sky-800 px-2 py-0.5 rounded-full font-bold">بورتال كروبسا الآمن</span>
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        معاينة الملفات الرسمية المرفوعة بواسطة العميل أو المندوب مباشرة دون مغادرة النظام
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        id: 'drive_main',
                        name: `ملف مستندات العميل - ${application.clientName}`,
                        url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
                        size: '4.2 MB',
                        uploadedByName: 'منظومة كروبسا المركزية',
                        uploadedAt: application.submittedAt
                      })}
                      className="bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      معاينة الوثائق بالبورتال
                    </button>
                    <a
                      href={application.documentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white text-sky-700 border border-sky-200 hover:bg-sky-50 text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-colors"
                    >
                      رابط خارجي
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RE-ROUTE TO ANOTHER COMPANY */}
          {/* ========================================================================= */}
          {activeTab === 'reroute' && (
            <div className="space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
                <ArrowRightLeft className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-black text-sm mb-1">إعادة توجيه الطلب المرفوض إلى شركة تمويل أخرى</h5>
                  <p className="leading-relaxed">
                    تتيح هذه الخاصية لإدارة كروبسا إعادة إرسال ملف العميل إلى جهة تمويلية أو شركة تقسيط أخرى لدراسته مجدداً وفق سياساتها الائتمانية دون الحاجة لإعادة إدخال بيانات العميل من الصفر.
                  </p>
                </div>
              </div>

              {/* Previous Re-route logs */}
              {application.reRouteHistory && application.reRouteHistory.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700">سجل التحويلات السابقة:</h5>
                  <div className="space-y-2">
                    {application.reRouteHistory.map((h, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{h.fromCompanyName}</span>
                          <span className="mx-2 text-slate-400">←</span>
                          <span className="font-bold text-crobsa-700">{h.toCompanyName}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">السبب: {h.reason}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.routedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-route Form */}
              <form onSubmit={handleReRoute} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
                {reRouteSuccess ? (
                  <div className="py-8 text-center text-emerald-700 space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                    <p className="text-base font-bold">تم تحويل الطلب بنجاح إلى شركة التمويل الجديدة!</p>
                    <p className="text-xs text-slate-500">تم إرسال إشعار فوري للشركة ومسؤول المبيعات</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        اختر شركة التقسيط البديلة:
                      </label>
                      <select
                        required
                        value={targetCompanyId}
                        onChange={(e) => setTargetCompanyId(e.target.value)}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                      >
                        <option value="">-- اختر شركة التقسيط البديلة --</option>
                        {availableCompanies.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code}) - سقف ائتماني: {c.creditCeiling.toLocaleString()} ج.م
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        سبب التحويل وملاحظات التوجيه:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reRouteReason}
                        onChange={(e) => setReRouteReason(e.target.value)}
                        placeholder="مثال: تم الرفض في الشركة الأولى لعدم توافر فرع قريب في البحيرة، ويتم التحويل لشركة كونتكت لتوافر فرع بمحيط إقامة العميل..."
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={isReRouting || !targetCompanyId || !reRouteReason.trim()}
                        className="bg-crobsa-800 hover:bg-crobsa-900 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        {isReRouting ? 'جاري التحويل...' : 'اعتماد وتحويل الطلب فوراً'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

        </div>
      </div>

      {previewDoc && (
        <InternalDocViewerModal
          document={previewDoc}
          clientName={application.clientName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
