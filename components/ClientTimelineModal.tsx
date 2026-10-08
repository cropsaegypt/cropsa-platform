import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Client, Role } from '../types';
import { 
  X, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  PlusCircle, 
  DollarSign, 
  PhoneCall, 
  Lock, 
  Unlock 
} from 'lucide-react';

interface ClientTimelineModalProps {
  client?: Client;
  clientId?: string;
  onClose: () => void;
  onRequestAccess?: () => void;
  canViewFullDetails?: boolean;
}

export const ClientTimelineModal: React.FC<ClientTimelineModalProps> = ({
  client: propClient,
  clientId,
  onClose,
  onRequestAccess,
  canViewFullDetails = true
}) => {
  const { clients, currentUser, addClientTimelineEvent, applications, t, language } = useStore();
  const [showAddActionForm, setShowAddActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState<any>('NOTE');
  const [actionDetails, setActionDetails] = useState('');

  const client = propClient || (clientId ? clients.find(c => c.id === clientId) : undefined);

  if (!client) {
    return null;
  }

  const clientNationalId = client.nationalId || '';
  const clientApps = applications.filter(a => a.clientNationalId === clientNationalId);
  const totalApproved = clientApps.reduce((sum, a) => sum + (a.approvedAmount || 0), 0);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !currentUser) return;

    addClientTimelineEvent(client.id, {
      action: actionTitle,
      actionType,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      details: actionDetails,
      badgeColor: actionType === 'PAYMENT' ? 'emerald' : actionType === 'FOLLOWUP' ? 'amber' : actionType === 'AI_ANALYSIS' ? 'purple' : 'blue'
    });

    setActionTitle('');
    setActionDetails('');
    setShowAddActionForm(false);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION': return <FileText className="h-4 w-4 text-sky-600" />;
      case 'STATUS_CHANGE': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'PAYMENT': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'FOLLOWUP': return <PhoneCall className="h-4 w-4 text-amber-600" />;
      case 'AI_ANALYSIS': return <Sparkles className="h-4 w-4 text-purple-600" />;
      case 'ACCESS_REQUEST': return <Lock className="h-4 w-4 text-indigo-600" />;
      default: return <Clock className="h-4 w-4 text-slate-600" />;
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'STATUS_CHANGE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PAYMENT': return 'bg-green-50 text-green-700 border-green-200';
      case 'FOLLOWUP': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AI_ANALYSIS': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ACCESS_REQUEST': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-crobsa-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 text-white text-2xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{client.name}</h2>
                {canViewFullDetails ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Unlock className="h-3 w-3" /> {t('accessGranted')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="h-3 w-3" /> {t('accessLocked')}
                  </span>
                )}
              </div>
              <p className="text-sky-200 text-sm mt-1 font-mono">
                {canViewFullDetails 
                  ? clientNationalId 
                  : clientNationalId.length >= 6 
                    ? `${clientNationalId.slice(0, 4)}********${clientNationalId.slice(-2)}` 
                    : clientNationalId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Client Highlights Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">{language === 'ar' ? 'المحافظة' : 'Governorate'}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-sky-600" /> {client.governorate || 'القاهرة'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">{language === 'ar' ? 'المهنة / النشاط' : 'Profession'}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Briefcase className="h-3.5 w-3.5 text-sky-600" /> {client.profession || 'تاجر'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">{language === 'ar' ? 'التصنيف الائتماني' : 'Credit Rating'}</span>
            <span className="font-bold text-emerald-600 mt-0.5 inline-block">
              {client.creditRating || 'A+'} (ممتاز)
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">{language === 'ar' ? 'إجمالي التمويلات السابقة' : 'Total Financing'}</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {totalApproved > 0 ? `${totalApproved.toLocaleString()} ${t('egp')}` : '85,000 ج.م'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!canViewFullDetails && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">{t('accessLocked')}</h4>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {language === 'ar' 
                      ? 'هذا العميل مسجل في قاعدة كروبسا المركزية لمعاملات مع شركات أخرى. يمكنك إرسال طلب استعلام فوري لمشاركة كامل الملف والمستندات.'
                      : 'This client record is in CROBSA central database. You can request access from CROBSA Admin to view the full file.'}
                  </p>
                </div>
              </div>
              {onRequestAccess && (
                <button
                  onClick={onRequestAccess}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow transition-colors shrink-0"
                >
                  {t('requestAccessToClient')}
                </button>
              )}
            </div>
          )}

          {/* Timeline Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-crobsa-700" />
              <h3 className="font-bold text-lg text-slate-900">{t('clientTimeline')}</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {(client.timeline || []).length} {language === 'ar' ? 'إجراء مسجل' : 'events'}
              </span>
            </div>

            {canViewFullDetails && (
              <button
                onClick={() => setShowAddActionForm(!showAddActionForm)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-crobsa-50 text-crobsa-700 hover:bg-crobsa-100 transition-colors border border-crobsa-200"
              >
                <PlusCircle className="h-4 w-4" />
                {showAddActionForm ? t('cancel') : t('addActionToTimeline')}
              </button>
            )}
          </div>

          {/* Add Action Inline Form */}
          {showAddActionForm && (
            <form onSubmit={handleAddAction} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'عنوان الإجراء' : 'Action Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={actionTitle}
                    onChange={e => setActionTitle(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: مكالمة متابعة، فحص أوراق، استلام شيكات' : 'e.g., Followup call, Document check'}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'ar' ? 'نوع الإجراء' : 'Action Type'}
                  </label>
                  <select
                    value={actionType}
                    onChange={e => setActionType(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                  >
                    <option value="NOTE">{language === 'ar' ? 'ملاحظة عامة' : 'General Note'}</option>
                    <option value="FOLLOWUP">{language === 'ar' ? 'متابعة / تحصيل' : 'Followup / Collection'}</option>
                    <option value="STATUS_CHANGE">{language === 'ar' ? 'تعديل حالة ائتمانية' : 'Credit Status Change'}</option>
                    <option value="PAYMENT">{language === 'ar' ? 'سداد قسط' : 'Installment Payment'}</option>
                    <option value="AI_ANALYSIS">{language === 'ar' ? 'تحليل ذكاء اصطناعي' : 'AI Analysis'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'تفاصيل الإجراء والملاحظات' : 'Action Details'}
                </label>
                <textarea
                  rows={2}
                  value={actionDetails}
                  onChange={e => setActionDetails(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب ما تم خلال هذا الإجراء بدقة ليظهر في السجل الدائم...' : 'Enter action details...'}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActionForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-crobsa-700 hover:bg-crobsa-800 rounded-lg shadow"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          )}

          {/* Timeline View */}
          <div className="relative border-r-2 border-slate-200 pr-6 mr-3 space-y-6">
            {(client.timeline && client.timeline.length > 0) ? (
              client.timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -right-[31px] top-1 h-6 w-6 rounded-full bg-white border-2 border-crobsa-600 flex items-center justify-center shadow-sm">
                    {getActionIcon(item.actionType)}
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getActionBadgeColor(item.actionType)}`}>
                          {item.action}
                        </span>
                        {item.companyName && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {item.companyName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono" dir="ltr">
                        {new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed">
                      {item.details}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {language === 'ar' ? 'المسؤول:' : 'By:'} <strong className="text-slate-600">{item.performedByName || item.performedBy}</strong>
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {item.actionType}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                {language === 'ar' ? 'لا توجد إجراءات مسجلة بعد لهذا العميل.' : 'No timeline events recorded yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {language === 'ar' ? 'المعرف الائتماني للعميل:' : 'Client ID:'} <span className="font-mono">{client.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
