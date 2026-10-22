import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { 
  X, 
  User as UserIcon, 
  FileText, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Building2,
  Plus,
  Upload,
  Trash2,
  Check,
  ArrowRight,
  Layers
} from 'lucide-react';
import { Client, ApplicationStatus, STATUS_ARABIC } from '../types';
import { ClientSolvencyGauge } from './ClientSolvencyGauge';

interface ClientDetailModalProps {
    client?: Client;
    clientId?: string;
    onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client: propClient, clientId, onClose }) => {
    const { clients, applications, users, companies, financingPrograms, createApplication } = useStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'apps' | 'add_company'>('overview');

    const client = propClient || (clientId ? clients.find(c => c.id === clientId) : undefined);

    // New Company Routing Form State
    const [targetCompanyId, setTargetCompanyId] = useState<string>(companies[0]?.id || '');
    const [targetProgramId, setTargetProgramId] = useState<string>('');
    const [targetAmount, setTargetAmount] = useState<number>(30000);
    const [targetDuration, setTargetDuration] = useState<number>(12);
    const [targetDocs, setTargetDocs] = useState<Array<{ name: string; fileName: string; fileSize: string; fileUrl: string; type: string }>>([]);
    const [isSubmittingNewCompany, setIsSubmittingNewCompany] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [routeSuccessMsg, setRouteSuccessMsg] = useState<string | null>(null);

    const clientNationalId = client?.nationalId || '';

    // Calculate Client Stats
    const clientApps = useMemo(() => {
        return applications.filter(a => {
            if (client?.id && a.clientId === client.id) return true;
            if (clientNationalId && a.clientNationalId === clientNationalId) return true;
            return false;
        });
    }, [applications, client, clientNationalId]);

    const approvedApps = clientApps.filter(a => a.status === ApplicationStatus.APPROVED);
    const rejectedApps = clientApps.filter(a => a.status === ApplicationStatus.REJECTED);
    
    const approvedTotal = approvedApps.reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0);
    const usedTotal = approvedApps.reduce((acc, curr) => acc + (curr.usedAmount || 0), 0);
    const available = approvedTotal - usedTotal;

    // Companies this client is associated with
    const clientCompanies = useMemo(() => {
        const compMap = new Map<string, {
            companyId: string;
            companyName: string;
            status: ApplicationStatus;
            statusText: string;
            requestedAmount: number;
            approvedAmount?: number;
            lastDate: string;
            programName?: string;
        }>();

        clientApps.forEach(app => {
            const compId = app.companyId || app.assignedCompanyIds?.[0] || 'default';
            const compObj = companies.find(c => c.id === compId || c.name === app.companyName);
            const compName = app.companyName || compObj?.name || 'شركة تمويل';
            
            if (!compMap.has(compName)) {
                compMap.set(compName, {
                    companyId: compId,
                    companyName: compName,
                    status: app.status,
                    statusText: STATUS_ARABIC[app.status] || app.status,
                    requestedAmount: app.requestedAmount,
                    approvedAmount: app.approvedAmount,
                    lastDate: app.submittedAt,
                    programName: app.selectedProgramName
                });
            }
        });

        if (client?.companyName && !compMap.has(client.companyName)) {
            compMap.set(client.companyName, {
                companyId: client.companyName,
                companyName: client.companyName,
                status: ApplicationStatus.APPROVED,
                statusText: 'تمويل سابق معتمد',
                requestedAmount: 0,
                lastDate: client.lastFinanceDate || client.addedAt
            });
        }

        return Array.from(compMap.values());
    }, [clientApps, client, companies]);

    // Available programs for target company
    const targetCompanyPrograms = useMemo(() => {
        const progs = (financingPrograms || []).filter(p => p.companyId === targetCompanyId && p.active !== false);
        if (progs.length > 0) return progs;
        const comp = companies.find(c => c.id === targetCompanyId);
        return (comp?.financingPrograms || []).filter(p => p.active !== false);
    }, [financingPrograms, targetCompanyId, companies]);

    if (!client) {
        return null;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
            alert('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
            setTargetDocs(prev => [
                ...prev,
                {
                    name: newDocName.trim() || file.name.replace(/\.[^/.]+$/, ""),
                    fileName: file.name,
                    fileSize: sizeStr,
                    fileUrl: dataUrl,
                    type: 'OTHER'
                }
            ]);
            setNewDocName('');
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleRouteToNewCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingNewCompany(true);
        try {
            const targetCompany = companies.find(c => c.id === targetCompanyId) || companies[0];
            const targetProgram = targetCompanyPrograms.find(p => p.id === targetProgramId) || targetCompanyPrograms[0];

            await createApplication({
                clientName: client.name,
                clientNationalId: client.nationalId,
                phoneNumber: client.phoneNumber,
                whatsappNumber: client.phoneNumber,
                governorate: client.governorate,
                profession: client.profession as any || 'MERCHANT',
                financeType: 'INSTALLMENT',
                durationMonths: Number(targetDuration),
                requestedAmount: Number(targetAmount),
                companyId: targetCompanyId,
                companyName: targetCompany?.name,
                assignedCompanyIds: [targetCompanyId],
                assignedCompanyNames: [targetCompany?.name].filter(Boolean) as string[],
                selectedProgramId: targetProgram?.id,
                selectedProgramName: targetProgram?.name,
                documents: targetDocs.map((d, idx) => ({
                    id: `doc_route_${Date.now()}_${idx}`,
                    name: d.name,
                    fileName: d.fileName,
                    fileSize: d.fileSize,
                    fileUrl: d.fileUrl,
                    type: d.type as any,
                    uploadedAt: new Date().toISOString()
                }))
            });

            setRouteSuccessMsg(`تم إرسال الطلب والأوراق بنجاح إلى شركة ${targetCompany?.name || ''}! يمكنك متابعة حالته في سجل الطلبات.`);
            setTargetDocs([]);
            setTimeout(() => {
                setRouteSuccessMsg(null);
                setActiveTab('apps');
            }, 2000);
        } catch (err) {
            alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.');
        } finally {
            setIsSubmittingNewCompany(false);
        }
    };

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
                            <p className="text-xs sm:text-sm text-sky-200/80 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>الرقم القومي:</span>
                                {client.hasMissingNationalId || (client.nationalId && client.nationalId.startsWith('TEMP-NID')) ? (
                                    <span className="bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded text-xs font-bold">
                                        معرف مؤقت (بدون بطاقة): {client.nationalId}
                                    </span>
                                ) : (
                                    <span>{client.nationalId || 'غير مسجل'}</span>
                                )}
                                <span>•</span>
                                <span>{client.governorate || 'المحافظة غير محددة'}</span>
                            </p>
                            
                            {/* Companies Badge Row */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                <span className="text-[11px] text-sky-200 font-bold">الشركات التابع لها:</span>
                                {clientCompanies.length > 0 ? (
                                    clientCompanies.map(c => (
                                        <span key={c.companyName} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20 font-bold flex items-center gap-1">
                                            <Building2 className="w-3 h-3 text-sky-300" />
                                            <span>{c.companyName}</span>
                                            <span className="text-[10px] text-emerald-300 bg-emerald-500/30 px-1 rounded font-black">({c.statusText})</span>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded">غير مسجل مع شركات تمويل</span>
                                )}
                            </div>
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
                <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-600 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                            activeTab === 'overview'
                                ? 'border-cropsa-600 text-cropsa-700'
                                : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        نظرة عامة والشركات
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
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
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
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
                    <button
                        onClick={() => setActiveTab('add_company')}
                        className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 font-black ${
                            activeTab === 'add_company'
                                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/80 rounded-t-xl'
                                : 'border-transparent text-emerald-700 hover:text-emerald-900 bg-emerald-50/40 rounded-t-xl'
                        }`}
                    >
                        <Plus className="h-4 w-4 text-emerald-600" />
                        إضافة وتوجيه لشركة تمويل جديدة +
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

                                    {/* Companies Status Card in Overview */}
                                    <div className="bg-gradient-to-br from-sky-50/80 to-slate-50 border border-sky-200/90 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-sky-600" />
                                                <span>شركات التمويل التابع لها العميل ({clientCompanies.length} شركة):</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('add_company')}
                                                className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-300 shadow-xs flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>إضافة وتوجيه لشركة أخرى +</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {clientCompanies.map(c => (
                                                <div key={c.companyName} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                                                    <div>
                                                        <span className="text-xs font-black text-slate-900 block">{c.companyName}</span>
                                                        {c.programName ? (
                                                            <span className="text-[10px] text-sky-700 font-bold block">{c.programName}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-medium">برنامج معتمد</span>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                            c.status === ApplicationStatus.APPROVED 
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                : c.status === ApplicationStatus.REJECTED
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                                                        }`}>
                                                            {c.statusText}
                                                        </span>
                                                        {c.approvedAmount ? (
                                                            <span className="text-xs font-mono font-black text-emerald-700 block mt-0.5">
                                                                {c.approvedAmount.toLocaleString()} ج.م
                                                            </span>
                                                        ) : c.requestedAmount > 0 ? (
                                                            <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">
                                                                {c.requestedAmount.toLocaleString()} ج.م
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
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
                                                    {app.companyName || app.assignedCompanyIds.map(cid => users.find(u => u.id === cid)?.name).join(', ') || 'كروبسا'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* New Tab: Add & Route to New Financing Company */}
                    {activeTab === 'add_company' && (
                        <div className="space-y-5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-emerald-600" />
                                        إضافة وتوجيه العميل إلى شركة تمويل أخرى ورفع مستنداتها
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        يمكنك إنشاء طلب تمويل جديد لهذا العميل مباشرة مع شركة تمويل أخرى ورفع كافة الأوراق والمستندات المطلوبة لها
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                    توجيه مباشر من الكارت
                                </span>
                            </div>

                            {routeSuccessMsg && (
                                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-black animate-in fade-in">
                                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>{routeSuccessMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleRouteToNewCompany} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Company Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5 text-sky-600" />
                                            <span>شركة التمويل المستهدفة *</span>
                                        </label>
                                        <select
                                            value={targetCompanyId}
                                            onChange={e => {
                                                setTargetCompanyId(e.target.value);
                                                const progs = (financingPrograms || []).filter(p => p.companyId === e.target.value && p.active !== false);
                                                if (progs.length > 0) setTargetProgramId(progs[0].id);
                                            }}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            required
                                        >
                                            {companies.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} — سقف: {c.creditCeiling?.toLocaleString()} ج.م
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Program Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>البرنامج التمويلي للشركة *</span>
                                        </label>
                                        <select
                                            value={targetProgramId}
                                            onChange={e => setTargetProgramId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        >
                                            {targetCompanyPrograms.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (حد {p.maxAmount?.toLocaleString()} ج.م - فائدة {p.interestRate || 0}%)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Requested Amount */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            المبلغ المطلوب تمويله (ج.م) *
                                        </label>
                                        <input
                                            type="number"
                                            min="1000"
                                            step="500"
                                            value={targetAmount || ''}
                                            onChange={e => setTargetAmount(Number(e.target.value) || 0)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            مدة التقسيط (بالأشهر)
                                        </label>
                                        <select
                                            value={targetDuration}
                                            onChange={e => setTargetDuration(Number(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        >
                                            {[3, 6, 9, 12, 18, 24, 36, 48].map(m => (
                                                <option key={m} value={m}>{m} شهر</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Document Upload Section */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>إرفاق مستندات وأوراق العميل المخصصة للشركة:</span>
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            مرفق: {targetDocs.length} مستند
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            placeholder="اسم المستند (مثال: صورة البطاقة، إيصال مرافق، عقد الإيجار)..."
                                            value={newDocName}
                                            onChange={e => setNewDocName(e.target.value)}
                                            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                        />
                                        <label className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs">
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>اختيار ورفع ملف</span>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    {/* Uploaded Documents List */}
                                    {targetDocs.length > 0 ? (
                                        <div className="space-y-1.5 pt-1">
                                            {targetDocs.map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span className="font-bold text-slate-800 truncate">{doc.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">({doc.fileSize})</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTargetDocs(prev => prev.filter((_, i) => i !== idx))}
                                                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 italic">
                                            لم يتم إرفاق مستندات بعد. يمكنك رفع صورة البطاقة، الضامن، أو أي أوراق مطلوبة من هذه الشركة.
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmittingNewCompany}
                                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-700 hover:to-sky-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-60 cursor-pointer"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        <span>
                                            {isSubmittingNewCompany 
                                                ? 'جاري إرسال الطلب والأوراق...' 
                                                : 'إرسال وتوجيه الطلب لشركة التمويل فوراً 🚀'}
                                        </span>
                                    </button>
                                </div>
                            </form>
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

