import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ShieldCheck, 
  Building2, 
  User, 
  AlertCircle,
  FileText
} from 'lucide-react';

export const ClientRequests: React.FC = () => {
  const { 
    clientRequests, 
    reviewClientAccessRequest, 
    t, 
    language 
  } = useStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const filteredRequests = clientRequests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    const match = 
      req.companyName.toLowerCase().includes(search.toLowerCase()) ||
      req.clientName.toLowerCase().includes(search.toLowerCase()) ||
      req.clientNationalId.includes(search);
    return match;
  });

  const handleApprove = async (requestId: string) => {
    await reviewClientAccessRequest(requestId, 'APPROVED', 'تم اعتماد الطلب ومشاركة ملف العميل من قبل إدارة كروبسا');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReqId) return;
    await reviewClientAccessRequest(rejectModalReqId, 'REJECTED', rejectNote || 'تم الرفض لعدم استيفاء المبررات');
    setRejectModalReqId(null);
    setRejectNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{t('clientAccessRequests')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar' 
                ? 'طلبات استعلام ومشاركة ملفات العملاء الواردة من شركات التقسيط الشريكة' 
                : 'Inbound client access requests submitted by installment companies'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-crobsa-900 text-white shadow'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') :
               status === 'PENDING' ? (language === 'ar' ? 'معلق' : 'Pending') :
               status === 'APPROVED' ? (language === 'ar' ? 'مقبول' : 'Approved') : (language === 'ar' ? 'مرفوض' : 'Rejected')}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={language === 'ar' ? 'بحث باسم الشركة، اسم العميل، أو الرقم القومي...' : 'Search by company, client or national ID...'}
          className="w-full text-sm border border-slate-200 rounded-2xl pr-10 pl-4 py-3 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-sm"
        />
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                <th className="px-5 py-4">{language === 'ar' ? 'شركة التقسيط الطالبة' : 'Requesting Company'}</th>
                <th className="px-5 py-4">{language === 'ar' ? 'العميل المطلوب' : 'Target Client'}</th>
                <th className="px-5 py-4">{language === 'ar' ? 'الرقم القومي' : 'National ID'}</th>
                <th className="px-5 py-4">{language === 'ar' ? 'سبب ومبرر الاستعلام' : 'Reason'}</th>
                <th className="px-5 py-4">{language === 'ar' ? 'تاريخ الطلب' : 'Date'}</th>
                <th className="px-5 py-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-crobsa-600" />
                        <span>{req.companyName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                        {language === 'ar' ? 'المسؤول:' : 'By:'} {req.requestedByName}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span>{req.clientName}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {req.clientNationalId}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs leading-relaxed">
                      {req.requestReason}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 font-mono" dir="ltr">
                      {new Date(req.requestedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    <td className="px-5 py-4">
                      {req.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="h-3.5 w-3.5" />
                          {language === 'ar' ? 'بانتظار الموافقة' : 'Pending'}
                        </span>
                      ) : req.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {language === 'ar' ? 'تمت الموافقة' : 'Approved'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="h-3.5 w-3.5" />
                          {language === 'ar' ? 'مرفوض' : 'Rejected'}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {language === 'ar' ? 'موافقة ومنح الصلاحية' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModalReqId(req.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {language === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {req.reviewNotes || (language === 'ar' ? 'تمت المراجعة' : 'Reviewed')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                    {language === 'ar' ? 'لا توجد طلبات مطابقة.' : 'No access requests found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectModalReqId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">{language === 'ar' ? 'سبب رفض طلب الاستعلام' : 'Reason for rejection'}</h3>
              <button onClick={() => setRejectModalReqId(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ar' ? 'اكتب ملاحظات الرفض لتظهر لشركة التقسيط' : 'Notes for company'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="مثال: يرجى إرفاق تفويض كتابي موقع من العميل أولاً..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReqId(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow"
                >
                  {language === 'ar' ? 'تأكيد الرفض' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
