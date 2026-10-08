import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { X, User as UserIcon, FileText, Clock, AlertOctagon, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { Client, ApplicationStatus } from '../types';
import { ClientSolvencyGauge } from './ClientSolvencyGauge';

interface ClientDetailModalProps {
    client?: Client;
    clientId?: string;
    onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client: propClient, clientId, onClose }) => {
    const { clients, applications, users } = useStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'apps'>('overview');

    const client = propClient || (clientId ? clients.find(c => c.id === clientId) : undefined);

    if (!client) {
        return null;
    }

    const clientNationalId = client.nationalId || '';

    // Calculate Client Stats
    const clientApps = applications.filter(a => a.clientNationalId === clientNationalId);
    const approvedApps = clientApps.filter(a => a.status === ApplicationStatus.APPROVED);
    const rejectedApps = clientApps.filter(a => a.status === ApplicationStatus.REJECTED);
    
    const approvedTotal = approvedApps.reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);
    const usedTotal = approvedApps.reduce((acc, curr) => acc + (curr.usedAmount || 0), 0);
    const available = approvedTotal - usedTotal;

    // Default or calculated AI solvency score
    const solvencyScore = client.aiSolvencyScore ?? (client.creditRating === 'A+' ? 92 : client.creditRating === 'A' ? 85 : client.creditRating === 'B' ? 72 : client.creditRating === 'C' ? 52 : 38);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-cropsa-950 text-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-cropsa-800/80 border border-cropsa-700 flex items-center justify-center text-sky-300 font-bold text-lg">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-white">{client.name}</h2>
                                {client.creditRating && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cropsa-600/50 text-sky-200 border border-sky-400/30 font-bold">
                                        تصنيف: {client.creditRating}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-sky-200/80 font-mono mt-0.5">
                                الرقم القومي: {client.nationalId || 'غير مسجل'} • {client.governorate || 'المحافظة غير محددة'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Sub-nav tabs */}
                <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-600">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                            activeTab === 'overview'
                                ? 'border-cropsa-600 text-cropsa-700'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        نظرة عامة والملاءة الائتمانية
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                            activeTab === 'timeline'
                                ? 'border-cropsa-600 text-cropsa-700'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        المخطط الزمني الكامل ({client.timeline?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('apps')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                            activeTab === 'apps'
                                ? 'border-cropsa-600 text-cropsa-700'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <FileText className="h-4 w-4" />
                        سجل الطلبات ({clientApps.length})
                        {rejectedApps.length > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                {rejectedApps.length} مرفوض
                            </span>
                        )}
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            {/* AI Solvency Gauge & Metrics */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                <div className="lg:col-span-6">
                                    <ClientSolvencyGauge
                                        score={solvencyScore}
                                        riskTier={client.aiRiskTier}
                                        suggestedLimit={client.aiSuggestedLimit ?? (approvedTotal > 0 ? approvedTotal * 1.3 : 75000)}
                                        monthlyIncome={client.monthlyIncome ?? 25000}
                                        monthlyObligations={client.monthlyObligations ?? 6000}
                                        summary={client.aiSolvencySummary || 'العميل لديه مؤشرات ملاءة مستقرة مع التزام دوري بسداد الالتزامات الائتمانية دون أي تعثرات مصرفية مسجلة.'}
                                        clientName={client.name}
                                        size="md"
                                    />
                                </div>

                                <div className="lg:col-span-6 space-y-4">
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-cropsa-50/70 p-3.5 rounded-2xl border border-cropsa-100">
                                            <p className="text-xs text-cropsa-700 font-medium">إجمالي الموافقات</p>
                                            <p className="text-xl font-bold text-cropsa-950 mt-1">{approvedTotal.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                                            <p className="text-xs text-emerald-700 font-medium">المتاح للسحب</p>
                                            <p className="text-xl font-bold text-emerald-950 mt-1">{available.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                            <p className="text-xs text-slate-500 font-medium">إجمالي المسحوب</p>
                                            <p className="text-xl font-bold text-slate-900 mt-1">{usedTotal.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
                                            <p className="text-xs text-purple-700 font-medium">إجمالي الطلبات</p>
                                            <p className="text-xl font-bold text-purple-950 mt-1">{clientApps.length} طلبات</p>
                                        </div>
                                    </div>

                                    {/* Contact & Personal Info */}
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
                                        <h3 className="font-bold text-slate-900 mb-3 flex items-center text-xs">
                                            <UserIcon className="h-4 w-4 ml-1.5 text-cropsa-600" /> البيانات الشخصية والمهنية
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-slate-400">المهنة / النشاط</p>
                                                <p className="font-bold text-slate-800">{client.profession || 'غير محدد'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">رقم الهاتف</p>
                                                <p className="font-bold text-slate-800 font-mono" dir="ltr">{client.phoneNumber || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">المحافظة</p>
                                                <p className="font-bold text-slate-800">{client.governorate || 'القاهرة'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">تاريخ الإضافة بالنظام</p>
                                                <p className="font-bold text-slate-800" dir="ltr">
                                                    {new Date(client.addedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Alert if any */}
                            {rejectedApps.length > 0 && (
                                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div className="space-y-2 flex-1">
                                            <h4 className="text-xs font-bold text-rose-900">
                                                تنبيه ائتماني: يوجد {rejectedApps.length} طلب سابق تم رفضه لهذا العميل
                                            </h4>
                                            {rejectedApps.map(app => (
                                                <div key={app.id} className="bg-white/80 p-2.5 rounded-xl border border-rose-100 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-rose-800">طلب #{app.id} ({app.requestedAmount.toLocaleString()} ج.م)</span>
                                                        <span className="text-[11px] text-slate-500 font-mono">{app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString() : ''}</span>
                                                    </div>
                                                    <p className="text-rose-700 font-medium mt-1">
                                                        السبب: {app.rejectionReason || app.reviewNote || 'عدم استيفاء المعايير'}
                                                    </p>
                                                    {app.rejectionNotes && (
                                                        <p className="text-slate-600 text-[11px] mt-0.5">
                                                            ملاحظات الفاحص: {app.rejectionNotes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-cropsa-600" />
                                    المخطط الزمني الشامل لإجراءات وتعديلات العميل
                                </h3>
                                <span className="text-xs text-slate-500">
                                    إجمالي الإجراءات: {client.timeline?.length || 0}
                                </span>
                            </div>

                            {(!client.timeline || client.timeline.length === 0) ? (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">لا توجد إجراءات مسجلة في المخطط الزمني بعد.</p>
                                </div>
                            ) : (
                                <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:inset-0 before:left-7 sm:before:left-9 before:w-0.5 before:bg-slate-200">
                                    {client.timeline.map((item, idx) => (
                                        <div key={item.id || idx} className="relative flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-white border-2 border-cropsa-600 flex items-center justify-center shrink-0 z-10">
                                                <div className="w-2 h-2 rounded-full bg-cropsa-600" />
                                            </div>
                                            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                                    <span className="font-bold text-xs text-slate-900">
                                                        {item.action}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-mono" dir="ltr">
                                                        {new Date(item.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    {item.details}
                                                </p>
                                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                                    <span>بواسطة: {item.performedByName}</span>
                                                    {item.companyName && <span className="text-cropsa-600 font-medium">{item.companyName}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'apps' && (
                        <div>
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center text-xs">
                                <FileText className="h-4 w-4 ml-2 text-cropsa-600" /> طلبات التمويل المقدمة
                            </h3>
                            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-xs text-right">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-3">رقم الطلب</th>
                                            <th className="px-4 py-3">التاريخ</th>
                                            <th className="px-4 py-3">المبلغ المطلوب</th>
                                            <th className="px-4 py-3">المبلغ المعتمد</th>
                                            <th className="px-4 py-3">الحالة</th>
                                            <th className="px-4 py-3">السبب / الملاحظات</th>
                                            <th className="px-4 py-3">الشركة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {clientApps.map(app => (
                                            <tr key={app.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">#{app.id}</td>
                                                <td className="px-4 py-3 text-slate-500" dir="ltr">{new Date(app.submittedAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-bold text-slate-900">{app.requestedAmount.toLocaleString()} ج.م</td>
                                                <td className="px-4 py-3 font-bold text-emerald-600">
                                                    {app.approvedAmount ? `${app.approvedAmount.toLocaleString()} ج.م` : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                        app.status === ApplicationStatus.APPROVED 
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : app.status === ApplicationStatus.REJECTED
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {app.status === ApplicationStatus.APPROVED ? 'معتمد' : app.status === ApplicationStatus.REJECTED ? 'مرفوض' : app.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-slate-600 max-w-xs truncate">
                                                    {app.rejectionReason ? `سبب الرفض: ${app.rejectionReason}` : app.reviewNote || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-[11px] text-slate-500">
                                                    {app.assignedCompanyIds.map(cid => users.find(u => u.id === cid)?.name).join(', ') || 'كروبسا'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

