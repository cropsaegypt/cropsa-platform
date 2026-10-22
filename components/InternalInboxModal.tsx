import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { InboxMessage } from '../types';
import { 
  Inbox, 
  X, 
  Mail, 
  MessageSquare, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Send, 
  FileText, 
  ArrowRight, 
  Check, 
  Trash2,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

interface InternalInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InternalInboxModal: React.FC<InternalInboxModalProps> = ({ isOpen, onClose }) => {
  const { 
    inboxMessages, 
    analyzeInboxMessageWithAi, 
    applyInboxMessageToPlatform, 
    addInboxMessage,
    deleteInboxMessage,
    companies 
  } = useStore();

  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    inboxMessages[0]?.id || ''
  );
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'EMAIL' | 'WHATSAPP' | 'PORTAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New incoming reply state
  const [showNewReplyModal, setShowNewReplyModal] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState(companies[0]?.id || '');
  const [newSenderName, setNewSenderName] = useState('');
  const [newChannel, setNewChannel] = useState<'EMAIL' | 'WHATSAPP' | 'PORTAL'>('EMAIL');
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const filteredMessages = inboxMessages.filter(msg => {
    if (filterChannel !== 'ALL' && msg.channel !== filterChannel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = msg.subject?.toLowerCase().includes(q);
      const matchContent = msg.content?.toLowerCase().includes(q);
      const matchSender = msg.senderName?.toLowerCase().includes(q);
      const matchComp = msg.companyName?.toLowerCase().includes(q);
      const matchClient = msg.clientName?.toLowerCase().includes(q);
      if (!matchSub && !matchContent && !matchSender && !matchComp && !matchClient) return false;
    }
    return true;
  });

  const selectedMessage = inboxMessages.find(m => m.id === selectedMessageId) || filteredMessages[0];

  const handleAnalyze = async (msgId: string) => {
    setIsAnalyzing(true);
    try {
      await analyzeInboxMessageWithAi(msgId);
      setSuccessToast('تم تحليل الرد بنجاح بواسطة الذكاء الاصطناعي!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      alert('حدث خطأ أثناء تحليل الرد، يرجى المحاولة لاحقاً.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async (msgId: string) => {
    setApplyingMessageId(msgId);
    try {
      const success = await applyInboxMessageToPlatform(msgId);
      if (success) {
        setSuccessToast('تم اعتماد التحديث وتطبيقه على الطلب والمنصة بنجاح!');
        setTimeout(() => setSuccessToast(null), 3500);
      } else {
        alert('لم يتم العثور على طلب مطابق أو حدث خطأ أثناء التحديث.');
      }
    } finally {
      setApplyingMessageId(null);
    }
  };

  const handleCreateNewReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      alert('يرجى كتابة نص الرسالة أو الرد الوارد.');
      return;
    }
    const comp = companies.find(c => c.id === newCompanyId);
    addInboxMessage({
      companyId: newCompanyId,
      companyName: comp?.name || 'شركة تمويل',
      channel: newChannel,
      senderName: newSenderName.trim() || `إدارة الائتمان - ${comp?.name || ''}`,
      senderEmail: newChannel === 'EMAIL' ? 'credit@company.com' : undefined,
      subject: newSubject.trim() || `رد ائتماني وارد بخصوص العميل: ${newClientName || 'عميل تقسيط'}`,
      content: newContent.trim(),
      clientName: newClientName.trim() || undefined,
      receivedAt: new Date().toISOString(),
      isRead: true
    });
    setShowNewReplyModal(false);
    setNewContent('');
    setNewSubject('');
    setNewSenderName('');
    setNewClientName('');
    setSuccessToast('تم تسجيل الرد الوارد بنجاح في صندوق الوارد!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">صندوق الوارد الداخلي لردود شركات التمويل</h2>
                <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  مدعوم بالذكاء الاصطناعي
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                استقبال إيميلات وردود الواتساب وتحليل القرارات الائتمانية وتطبيقها على الطلبات بضغطة زر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewReplyModal(true)}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل رد وارد جديد +</span>
            </button>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 shadow-sm animate-in fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successToast}
            </span>
            <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body: Sidebar list (4 cols) & Detail view (8 cols) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Sidebar Messages List */}
          <div className="md:col-span-5 lg:col-span-4 border-l border-slate-200 flex flex-col bg-slate-50 overflow-hidden">
            
            {/* Search & Channel Filters */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث في الرسائل، العميل، الشركة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 rounded-xl pr-9 pl-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'EMAIL', label: 'إيميل 📧' },
                  { id: 'WHATSAPP', label: 'واتساب 💬' },
                  { id: 'PORTAL', label: 'البوابة 🌐' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterChannel(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                      filterChannel === tab.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold">لا توجد رسائل واردة مطابقة</p>
                </div>
              ) : (
                filteredMessages.map(msg => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isAnalyzed = !!msg.aiAnalysis;
                  const isApproved = msg.aiAnalysis?.extractedDecision === 'APPROVED';
                  const isRejected = msg.aiAnalysis?.extractedDecision === 'REJECTED';
                  const isRequiredDocs = msg.aiAnalysis?.extractedDecision === 'REQUIRED_PAPERS';

                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessageId(msg.id)}
                      className={`p-3.5 cursor-pointer transition-all border-r-4 ${
                        isSelected 
                          ? 'bg-white border-sky-600 shadow-sm' 
                          : 'hover:bg-slate-100/80 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {msg.channel === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                          {msg.channel === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          {msg.channel === 'PORTAL' && <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          <span className="text-xs font-black text-slate-900 truncate">
                            {msg.companyName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(msg.receivedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                        {msg.subject || msg.content}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2">
                        {msg.content}
                      </p>

                      <div className="flex items-center justify-between gap-1">
                        {isAnalyzed ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isApproved 
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected 
                              ? 'bg-rose-100 text-rose-800'
                              : isRequiredDocs 
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {isApproved ? 'تمت الموافقة' : isRejected ? 'مرفوض' : isRequiredDocs ? 'مستندات مطلوبة' : 'تحت الدراسة'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full">
                            في انتظار التحليل
                          </span>
                        )}

                        {msg.applied ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            مطبّق على الطلب ✓
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Message Detail & AI Insights */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-white overflow-y-auto p-5 sm:p-6 space-y-5">
            {selectedMessage ? (
              <>
                {/* Message Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-lg border border-sky-200">
                        {selectedMessage.companyName}
                      </span>
                      {selectedMessage.clientName && (
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                          العميل: {selectedMessage.clientName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(selectedMessage.receivedAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedMessage.subject || 'بدون موضوع'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      مرسل بواسطة: <span className="font-bold text-slate-700">{selectedMessage.senderName}</span>
                      {selectedMessage.senderEmail && ` (${selectedMessage.senderEmail})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAnalyze(selectedMessage.id)}
                      disabled={isAnalyzing}
                      className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'جاري التحليل...' : 'تحليل الرد بالذكاء الاصطناعي 🧠'}</span>
                    </button>

                    <button
                      onClick={() => deleteInboxMessage(selectedMessage.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف الرسالة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Raw Message Content */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-700">نص الرد الوارد من الشركة:</span>
                    <span className="text-[10px] text-slate-400 font-mono">Channel: {selectedMessage.channel}</span>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedMessage.content}
                  </div>
                </div>

                {/* AI Analysis Section */}
                {selectedMessage.aiAnalysis ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/60 to-emerald-50/60 border border-indigo-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">
                            نتائج تحليل الذكاء الاصطناعي الفورية (Gemini AI)
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">
                            تم استخراج القرار الائتماني والمبالغ والمستندات بدقة
                          </span>
                        </div>
                      </div>

                      {/* Decision Badge */}
                      {selectedMessage.aiAnalysis.extractedDecision === 'APPROVED' && (
                        <span className="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          موافقة ائتمانية معتمدة
                        </span>
                      )}
                      {selectedMessage.aiAnalysis.extractedDecision === 'REJECTED' && (
                        <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" />
                          تم رفض الطلب
                        </span>
                      )}
                      {selectedMessage.aiAnalysis.extractedDecision === 'REQUIRED_PAPERS' && (
                        <span className="text-xs font-black bg-amber-600 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          مطلوب استكمال مستندات
                        </span>
                      )}
                      {selectedMessage.aiAnalysis.extractedDecision === 'PENDING' && (
                        <span className="text-xs font-black bg-sky-600 text-white px-3 py-1 rounded-xl shadow-sm flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          تحت المراجعة والدراسة
                        </span>
                      )}
                    </div>

                    {/* Summary text */}
                    <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed">
                      <span className="font-black text-indigo-900">الملخص: </span>
                      {selectedMessage.aiAnalysis.summary}
                    </div>

                    {/* Extracted fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMessage.aiAnalysis.extractedAmount ? (
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 font-bold block mb-0.5">
                            المبلغ المالي المعتمد:
                          </span>
                          <span className="text-base font-black text-emerald-700">
                            {selectedMessage.aiAnalysis.extractedAmount.toLocaleString()} ج.م
                          </span>
                        </div>
                      ) : null}

                      {selectedMessage.aiAnalysis.suggestedStatus ? (
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 font-bold block mb-0.5">
                            الحالة المقترحة للطلب:
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {selectedMessage.aiAnalysis.suggestedStatus}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Extracted Missing Docs */}
                    {selectedMessage.aiAnalysis.missingDocuments && selectedMessage.aiAnalysis.missingDocuments.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-xs font-black text-amber-900 block mb-1.5">
                          الأوراق والمستندات الإضافية المطلوبة من العميل:
                        </span>
                        <ul className="space-y-1 text-xs text-amber-950 font-bold">
                          {selectedMessage.aiAnalysis.missingDocuments.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Apply Button */}
                    <div className="pt-2 flex items-center justify-between">
                      {selectedMessage.applied ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl">
                          <Check className="w-4 h-4" />
                          <span>تم اعتماد هذا الرد وتطبيقه على المنصة بنجاح ✓</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(selectedMessage.id)}
                          disabled={applyingMessageId === selectedMessage.id}
                          className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {applyingMessageId === selectedMessage.id 
                              ? 'جاري التحديث والتطبيق...' 
                              : 'اعتماد التحديث وتطبيقه على المنصة والطلب 🚀'}
                          </span>
                        </button>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono">
                        نسبة ثقة الذكاء الاصطناعي: {Math.round(selectedMessage.aiAnalysis.confidence * 100)}%
                      </span>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-60" />
                    <h4 className="text-sm font-black text-slate-800 mb-1">
                      الرسالة لم يتم تحليلها بالذكاء الاصطناعي بعد
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                      اضغط على زر التحليل الذكي ليقوم الموديل باستخراج قرار الموافقة والمبلغ والمستندات المطلوبة تلقائياً وتحديث كارت العميل.
                    </p>
                    <button
                      onClick={() => handleAnalyze(selectedMessage.id)}
                      disabled={isAnalyzing}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-md transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>بدء التحليل الفوري الآن</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
                <Inbox className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-sm font-bold">يرجى اختيار رسالة من القائمة لعرض تفاصيلها</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Manual Add Reply Modal */}
      {showNewReplyModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in" dir="rtl">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black">تسجيل رد وارد جديد من شركة تمويل</h3>
              <button onClick={() => setShowNewReplyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewReply} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شركة التمويل</label>
                  <select
                    value={newCompanyId}
                    onChange={e => setNewCompanyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القناة</label>
                  <select
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="EMAIL">إيميل رسمي 📧</option>
                    <option value="WHATSAPP">واتساب 💬</option>
                    <option value="PORTAL">بوابة الشركة 🌐</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل (اختياري للربط المباشر)</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">موضوع الرسالة</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="مثال: تم قبول طلب التمويل للعميل أحمد"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نص الرد الوارد بالكامل *</label>
                <textarea
                  rows={5}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="انسخ هنا نص الإيميل أو رسالة الواتساب الواردة من مسؤول الائتمان..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl shadow-md transition-all"
                >
                  حفظ الرد وإضافته لصندوق الوارد
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewReplyModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
