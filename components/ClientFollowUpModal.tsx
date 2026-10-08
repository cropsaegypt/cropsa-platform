import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Client, Application, Role, InstallmentCompanyStaffRole, ApplicationComment } from '../types';
import { 
  X, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Filter,
  Users,
  DollarSign,
  AlertCircle,
  Briefcase,
  Flame,
  Check
} from 'lucide-react';

interface ClientFollowUpModalProps {
  initialClientId?: string;
  initialApplicationId?: string;
  onClose: () => void;
}

interface UnifiedTimelineItem {
  id: string;
  source: 'TIMELINE' | 'COMMENT' | 'HISTORY';
  title: string;
  message: string;
  authorName: string;
  authorRole: string;
  authorCompany?: string;
  timestamp: string;
  category: 'NOTE' | 'STATUS' | 'FIELD' | 'CREDIT' | 'DOCS' | 'PAYMENT' | 'ALERT';
  isUrgent?: boolean;
}

export const ClientFollowUpModal: React.FC<ClientFollowUpModalProps> = ({
  initialClientId,
  initialApplicationId,
  onClose
}) => {
  const { 
    currentUser, 
    currentCompany, 
    clients, 
    applications, 
    branches, 
    users, 
    addClientCrossComment,
    language 
  } = useStore();

  const isAr = language === 'ar';

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialClientId || (clients[0]?.id || '')
  );

  // New comment state
  const [commentText, setCommentText] = useState('');
  const [commentCategory, setCommentCategory] = useState<'NOTE' | 'FIELD' | 'CREDIT' | 'DOCS' | 'PAYMENT'>('NOTE');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Filter clients for search list
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients.slice(0, 15);
    const term = searchTerm.toLowerCase().trim();
    return clients.filter(c => 
      (c?.name || '').toLowerCase().includes(term) ||
      (c?.nationalId || '').includes(term) ||
      (c?.phoneNumber && c.phoneNumber.includes(term)) ||
      (c?.governorate && c.governorate.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  // Selected client
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Related applications for selected client
  const clientApps = useMemo(() => {
    if (!selectedClient?.nationalId) return [];
    return applications.filter(a => a.clientNationalId === selectedClient.nationalId);
  }, [applications, selectedClient]);

  const activeApp = clientApps[0];

  // Construct Unified Multi-Party Timeline
  const unifiedTimeline: UnifiedTimelineItem[] = useMemo(() => {
    if (!selectedClient) return [];
    const items: UnifiedTimelineItem[] = [];

    // 1. From client.timeline
    if (selectedClient.timeline) {
      selectedClient.timeline.forEach(item => {
        let cat: UnifiedTimelineItem['category'] = 'NOTE';
        if (item.actionType === 'STATUS_CHANGE') cat = 'STATUS';
        else if (item.actionType === 'PAYMENT') cat = 'PAYMENT';
        else if (item.actionType === 'AI_ANALYSIS') cat = 'CREDIT';
        else if (item.actionType === 'FOLLOWUP') cat = 'FIELD';
        else if (item.actionType === 'DOC_UPLOAD') cat = 'DOCS';

        items.push({
          id: `t_${item.id}`,
          source: 'TIMELINE',
          title: item.action,
          message: item.details,
          authorName: item.performedByName || 'فريق العمل',
          authorRole: item.companyName || 'منظومة كروبسا',
          authorCompany: item.companyName,
          timestamp: item.timestamp,
          category: cat,
          isUrgent: item.details.includes('🚨') || item.action.includes('عاجل')
        });
      });
    }

    // 2. From clientApps comments & history
    clientApps.forEach(app => {
      // Comments
      if (app.comments) {
        app.comments.forEach(c => {
          items.push({
            id: `comm_${c.id}`,
            source: 'COMMENT',
            title: isAr ? 'تعليق ومناقشة داخلية' : 'Case Discussion Note',
            message: c.message,
            authorName: c.senderName,
            authorRole: c.senderRole,
            authorCompany: c.senderCompanyName,
            timestamp: c.createdAt,
            category: 'NOTE',
            isUrgent: c.isUrgent
          });
        });
      }

      // History
      if (app.history) {
        app.history.forEach((h, idx) => {
          items.push({
            id: `hist_${app.id}_${idx}`,
            source: 'HISTORY',
            title: isAr ? `تحديث حالة الطلب: ${h.action}` : `Status: ${h.action}`,
            message: h.details || '',
            authorName: h.performedByName || h.performedBy,
            authorRole: isAr ? 'تحديث النظام' : 'Workflow',
            timestamp: h.timestamp,
            category: 'STATUS'
          });
        });
      }
    });

    // Sort descending by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedClient, clientApps, isAr]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    if (filterCategory === 'ALL') return unifiedTimeline;
    if (filterCategory === 'URGENT') return unifiedTimeline.filter(i => i.isUrgent);
    return unifiedTimeline.filter(i => i.category === filterCategory);
  }, [unifiedTimeline, filterCategory]);

  // Handle submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedClient) return;

    setIsSubmitting(true);
    try {
      await addClientCrossComment({
        clientId: selectedClient.id,
        applicationId: activeApp?.id,
        message: commentText.trim(),
        commentType: commentCategory,
        isUrgent
      });
      setCommentText('');
      setIsUrgent(false);
    } catch (err) {
      console.error('Error adding cross comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick reply snippets
  const quickSnippets = [
    'تم التواصل مع العميل هاتفياً وبانتظار استكمال باقي الأوراق',
    'الاستعلام الميداني إيجابي والنشاط الزراعي والتجاري قائم',
    'موافقة ائتمانية مشروطة بتقديم ضامن إضافي وسداد التزامات سابقة',
    'تأخر في سداد القسط الشهري وجاري المتابعة الميدانية والتحصيل',
    'تم استلام أصل عقد التمويل وإيصالات الأمانة وجاهز للصرف'
  ];

  const getAuthorBadgeStyle = (authorRole: string, company?: string) => {
    if (authorRole.includes('ADMIN') || authorRole.includes('SUPER_ADMIN') || company?.includes('كروبسا')) {
      return 'bg-purple-100 text-purple-900 border-purple-200';
    }
    if (authorRole.includes('BRANCH_MANAGER')) {
      return 'bg-sky-100 text-sky-900 border-sky-200';
    }
    if (authorRole.includes('EMPLOYEE') || authorRole.includes('CREDIT')) {
      return 'bg-amber-100 text-amber-900 border-amber-200';
    }
    if (authorRole.includes('SALESMAN') || authorRole.includes('SUPPLIER')) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getRoleLabelAr = (role: string) => {
    if (role === Role.SUPER_ADMIN || role === 'SUPER_ADMIN') return 'إدارة كروبسا مصر';
    if (role === Role.ADMIN || role === 'ADMIN') return 'عمليات كروبسا';
    if (role === Role.INSTALLMENT_COMPANY || role === 'INSTALLMENT_COMPANY') return 'إدارة شركة التقسيط';
    if (role === Role.BRANCH_MANAGER || role === 'BRANCH_MANAGER') return 'مدير الفرع';
    if (role === Role.COMPANY_EMPLOYEE || role === 'COMPANY_EMPLOYEE') return 'موظف دراسة وفحص';
    if (role === Role.SALESMAN || role === 'SALESMAN') return 'مندوب مبيعات';
    if (role === Role.SUPPLIER || role === 'SUPPLIER') return 'مورد معتمد';
    return role;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-crobsa-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  {isAr ? 'متابعة العملاء وكتابة التحديثات اللحظية' : 'Client Follow-Up & Real-time Updates'}
                </h2>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  {isAr ? 'تشابك كامل: كروبسا + الشركة + الفرع + الموظف' : 'Unified Ecosystem'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr ? 'مخطط زمني مشترك لكافة الملاحظات والاستفسارات والقرارات المتزامنة' : 'Synchronized chronological timeline across all roles'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body: Split into Left Panel (Client Selector) & Right Panel (Timeline & Update Form) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* Left Panel: Search & Client Quick Picker */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col shrink-0 max-h-56 lg:max-h-none overflow-hidden">
            <div className="p-3 border-b border-slate-200/80 bg-white">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isAr ? 'ابحث باسم العميل أو الرقم القومي...' : 'Search client name or ID...'}
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredClients.map(client => {
                const isSelected = client.id === selectedClientId;
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-right p-3 rounded-2xl transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? 'bg-sky-500 text-white shadow-md font-bold' 
                        : 'bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {client.name.charAt(0)}
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <div className="text-xs font-black truncate">{client.name}</div>
                      <div className={`text-[10px] font-mono mt-0.5 truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                        {client?.nationalId || 'غير مسجل'}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {client.governorate || 'القاهرة'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Client Header, Timeline & New Comment Box */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            
            {/* Active Client Info Banner */}
            {selectedClient && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-crobsa-600 to-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900">{selectedClient.name}</h3>
                      <span className="text-xs font-mono bg-white text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                        {selectedClient?.nationalId || 'غير مسجل'}
                      </span>
                      {selectedClient.phoneNumber && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          {selectedClient.phoneNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-sky-600" />
                        {selectedClient.governorate || 'القاهرة'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                        {selectedClient.profession || 'تاجر / مزارع'}
                      </span>
                      {activeApp?.assignedBranchName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                            <Building2 className="h-3 w-3" />
                            {isAr ? 'الفرع:' : 'Branch:'} {activeApp.assignedBranchName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  {activeApp && (
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-sky-100 text-sky-800 border border-sky-200">
                      {isAr ? 'حالة الطلب:' : 'Status:'} {activeApp.status}
                    </span>
                  )}
                  {selectedClient.creditRating && (
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                      تصنيف: {selectedClient.creditRating}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Filter Tabs */}
            <div className="px-5 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                <span className="text-slate-400 text-xs ml-2">{isAr ? 'تصفية المخطط:' : 'Filter:'}</span>
                {[
                  { id: 'ALL', label: isAr ? 'الكل' : 'All' },
                  { id: 'URGENT', label: isAr ? 'العاجل فقط 🚨' : 'Urgent Only' },
                  { id: 'NOTE', label: isAr ? 'ملاحظات ومناقشات' : 'Notes' },
                  { id: 'STATUS', label: isAr ? 'قرارات واعتمادات' : 'Decisions' },
                  { id: 'FIELD', label: isAr ? 'استعلام ميداني' : 'Field' },
                  { id: 'PAYMENT', label: isAr ? 'سداد وتحصيل' : 'Payments' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterCategory(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs transition-all ${
                      filterCategory === tab.id 
                        ? 'bg-slate-900 text-white font-black shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 hidden sm:inline">
                {filteredTimeline.length} {isAr ? 'حدث زمني مسجل' : 'events'}
              </span>
            </div>

            {/* Timeline Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
              {filteredTimeline.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">{isAr ? 'لا توجد تعليقات أو تحديثات مسجلة بعد' : 'No comments or timeline items yet'}</p>
                  <p className="text-xs mt-1 text-slate-400">{isAr ? 'اكتب أول تحديث للعميل بالأسفل ليظهر لكافة الأطراف' : 'Post the first update below'}</p>
                </div>
              ) : (
                filteredTimeline.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      item.isUrgent 
                        ? 'bg-rose-50/80 border-rose-200 shadow-sm' 
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                          {item.authorName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{item.authorName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAuthorBadgeStyle(item.authorRole, item.authorCompany)}`}>
                              {getRoleLabelAr(item.authorRole)} {item.authorCompany ? `• ${item.authorCompany}` : ''}
                            </span>
                            {item.isUrgent && (
                              <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <Flame className="h-2.5 w-2.5" /> {isAr ? 'عاجل' : 'Urgent'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {item.title}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      {item.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Reply Snippets */}
            <div className="p-2.5 bg-slate-100/70 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-slate-500 font-bold shrink-0">{isAr ? 'ردود سريعة:' : 'Quick Replies:'}</span>
              {quickSnippets.map((snippet, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCommentText(snippet)}
                  className="text-[11px] bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 px-3 py-1 rounded-xl border border-slate-200/80 whitespace-nowrap transition-colors font-medium"
                >
                  {snippet.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* New Comment / Update Input Form */}
            <form onSubmit={handleSubmitComment} className="p-4 bg-white border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">{isAr ? 'نوع التحديث:' : 'Type:'}</span>
                  {[
                    { id: 'NOTE', label: isAr ? 'ملاحظة عامة' : 'General Note' },
                    { id: 'FIELD', label: isAr ? 'استعلام ميداني' : 'Field' },
                    { id: 'CREDIT', label: isAr ? 'فحص ائتماني' : 'Credit' },
                    { id: 'DOCS', label: isAr ? 'طلب مستندات' : 'Docs' },
                    { id: 'PAYMENT', label: isAr ? 'تحصيل وسداد' : 'Payment' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCommentCategory(cat.id as any)}
                      className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all border ${
                        commentCategory === cat.id 
                          ? 'bg-crobsa-600 text-white border-crobsa-700 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                  />
                  <span>{isAr ? 'تنبيه عاجل لكافة الأطراف' : 'High Priority Alert'}</span>
                </label>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={isAr 
                    ? `اكتب تحديثك أو استفسارك بخصوص العميل ${selectedClient?.name || ''}... سيصل التنبيه فوراً لشركة التقسيط والفرع وموظف الائتمان وإدارة كروبسا` 
                    : 'Write your update or inquiry...'}
                  rows={2}
                  className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-medium text-slate-800"
                />
                
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="bg-gradient-to-r from-crobsa-600 to-sky-600 hover:from-crobsa-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold px-5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-md shadow-crobsa-600/20 transition-all shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span className="text-[11px]">{isSubmitting ? (isAr ? 'جاري...' : '...') : (isAr ? 'نشر التحديث' : 'Post')}</span>
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};
