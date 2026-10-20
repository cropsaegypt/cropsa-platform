import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, Application } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  MessageSquare, 
  Eye, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search,
  Paperclip,
  Check,
  RefreshCw,
  BellRing
} from 'lucide-react';

interface NeedsUpdateNotificationBoardProps {
  onSelectApp?: (app: Application) => void;
  onOpenDiscussion?: (app: Application, tab?: 'comments' | 'documents' | 'reroute') => void;
  compact?: boolean;
}

export const NeedsUpdateNotificationBoard: React.FC<NeedsUpdateNotificationBoardProps> = ({
  onSelectApp,
  onOpenDiscussion,
  compact = false
}) => {
  const { applications, currentUser, resolveCaseUpdate } = useStore();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resolvingAppId, setResolvingAppId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState<boolean>(false);

  // Filter applications that need update based on user role
  const needsUpdateApps = useMemo(() => {
    return applications.filter(app => {
      if (!app.needsUpdate) return false;
      // Admin / Super Admin sees all
      if (currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.ADMIN) {
        return true;
      }
      // Submitter sees their own submitted cases
      if (app.submittedBy === currentUser?.id) {
        return true;
      }
      // Branch manager sees cases in their branch or governorate
      if (currentUser?.role === Role.BRANCH_MANAGER) {
        return (app.assignedBranchId && app.assignedBranchId === currentUser.branchId) || 
               app.submittedBy === currentUser.id;
      }
      return false;
    });
  }, [applications, currentUser]);

  // Search filter
  const filteredApps = useMemo(() => {
    if (!searchTerm.trim()) return needsUpdateApps;
    const q = searchTerm.toLowerCase();
    return needsUpdateApps.filter(app => 
      app.clientName?.toLowerCase().includes(q) ||
      app.clientNationalId?.includes(q) ||
      app.phoneNumber?.includes(q) ||
      app.governorate?.toLowerCase().includes(q)
    );
  }, [needsUpdateApps, searchTerm]);

  if (needsUpdateApps.length === 0) {
    return null; // Don't take up space if there are no cases requiring update
  }

  const handleConfirmResolve = async (appId: string) => {
    setIsSubmittingResolve(true);
    try {
      await resolveCaseUpdate(appId, resolutionNote.trim() || undefined);
      setResolvingAppId(null);
      setResolutionNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  return (
    <div className="bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-3xl border-2 border-amber-400/80 shadow-md overflow-hidden animate-in fade-in transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-linear-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30 animate-bounce">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                لوحة إشعارات الحالات المطلوب تحديثها (المرسلة واتساب / إيميل)
              </h3>
              <span className="bg-amber-600 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                {needsUpdateApps.length} حالات بانتظار التحديث
              </span>
            </div>
            <p className="text-xs text-amber-900/90 font-medium mt-0.5">
              حالات تم إرسالها لشركات التقسيط وتتطلب استكمال بيانات أو أوراق من رافع الطلب.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {needsUpdateApps.length > 3 && (
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث بالعميل أو الهاتف..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-xs pr-8 pl-3 py-1.5 rounded-xl border border-amber-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500 w-44"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-amber-500/20 text-amber-900 rounded-xl transition-colors cursor-pointer"
            title={isExpanded ? 'طي اللوحة' : 'توسيع اللوحة'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredApps.map(app => {
              const isWhatsapp = app.updateRequestChannel === 'WHATSAPP';
              const isEmail = app.updateRequestChannel === 'EMAIL';
              const elapsedHours = app.updateRequestedAt 
                ? Math.floor((Date.now() - new Date(app.updateRequestedAt).getTime()) / (1000 * 60 * 60))
                : 0;

              return (
                <div 
                  key={app.id}
                  className="bg-white rounded-2xl p-4 border border-amber-300/90 hover:border-amber-500 shadow-xs flex flex-col justify-between gap-3 transition-all group"
                >
                  {/* Top: Client & Channel */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                          {app.clientName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>{app.clientNationalId}</span>
                          <span>•</span>
                          <span>{app.governorate}</span>
                        </div>
                      </div>

                      {/* Channel Pill */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${
                        isWhatsapp 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : isEmail 
                          ? 'bg-sky-100 text-sky-800 border border-sky-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isWhatsapp ? '💬 واتساب' : isEmail ? '✉️ إيميل' : '⚡ نظام'}
                      </span>
                    </div>

                    {/* Reason / Notes */}
                    <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                        <span>المطلوب استكماله:</span>
                        <span className="font-mono text-slate-500">
                          {elapsedHours === 0 ? 'منذ لحظات' : `منذ ${elapsedHours} ساعة`}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium text-[11px] line-clamp-2">
                        {app.updateRequestReason || 'يلزم استكمال أوراق العميل وتحديث الحالة لدى رافع الطلب.'}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span>رافع الطلب: <strong className="text-slate-600">{app.history?.[0]?.performedByName || 'المندوب / الفرع'}</strong></span>
                      <span>الشركة: <strong className="text-slate-600">{app.assignedCompanyIds?.[0] || 'الشركة الممولة'}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                    {onSelectApp && (
                      <button
                        type="button"
                        onClick={() => onSelectApp(app)}
                        className="flex-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="عرض ومراجعة الطلب"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>عرض</span>
                      </button>
                    )}

                    {onOpenDiscussion && (
                      <button
                        type="button"
                        onClick={() => onOpenDiscussion(app, 'documents')}
                        className="flex-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="إرفاق ورفع المستندات"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>الأوراق</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setResolvingAppId(app.id)}
                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="اعتماد التحديث وإعادة الإرسال"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>تم التحديث</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation & Note Modal when resolving update */}
      {resolvingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">اعتماد التحديث وإعادة الإرسال</h4>
                <p className="text-xs text-slate-500">سيتم إزالة الحالة من قائمة المطلوب تحديثها وإشعار الشركة فوراً.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ملاحظات التحديث (اختياري):
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="مثال: تم رفع صورة البطاقة سارية وإيصال غاز حديث..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResolvingAppId(null);
                  setResolutionNote('');
                }}
                disabled={isSubmittingResolve}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleConfirmResolve(resolvingAppId)}
                disabled={isSubmittingResolve}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>{isSubmittingResolve ? 'جاري الاعتماد...' : 'تأكيد واعتماد التحديث'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
