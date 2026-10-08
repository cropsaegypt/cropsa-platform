import React, { useState, useMemo } from 'react';
import { 
  Application, 
  CompanyBranch, 
  Role, 
  InstallmentCompanyStaffRole 
} from '../types';
import { useStore } from '../context/Store';
import { 
  X, 
  MapPin, 
  Building2, 
  UserCheck, 
  Phone, 
  AlertCircle, 
  Send, 
  BadgeCheck, 
  Compass, 
  ArrowLeftRight,
  CheckCircle2,
  Search,
  Filter,
  Check,
  Briefcase,
  Users,
  Globe
} from 'lucide-react';

interface SmartCaseAssignmentModalProps {
  application: Application;
  branches: CompanyBranch[];
  staffList: any[];
  onAssign: (branchId: string, branchName: string, officerId: string, officerName: string) => Promise<void>;
  onClose: () => void;
}

export const SmartCaseAssignmentModal: React.FC<SmartCaseAssignmentModalProps> = ({
  application,
  branches,
  staffList,
  onAssign,
  onClose
}) => {
  const { currentUser, requestBranchTransfer } = useStore();

  const isBranchManager = currentUser?.role === Role.BRANCH_MANAGER || 
                          currentUser?.staffRole === InstallmentCompanyStaffRole.BRANCH_MANAGER;

  // Mode state for branch manager: assign within branch OR request branch transfer
  const [activeMode, setActiveMode] = useState<'ASSIGN' | 'TRANSFER_REQUEST'>('ASSIGN');

  // Client's governorate
  const clientGov = application.governorate || 'القاهرة';

  const normalizeGov = (g?: string) => (g || '').trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة$/g, 'ه')
    .replace(/ى$/g, 'ي')
    .replace(/\s+/g, '')
    .toLowerCase();

  // Branch Manager's own branch
  const managerBranch = useMemo(() => {
    if (!isBranchManager) return null;
    return branches.find(b => b.id === currentUser?.branchId) || 
           branches.find(b => b.name === currentUser?.branchName) || 
           branches[0];
  }, [branches, currentUser, isBranchManager]);

  // Branches matching client governorate
  const matchingBranches = useMemo(() => {
    return branches.filter(b => normalizeGov(b.governorate) === normalizeGov(clientGov));
  }, [branches, clientGov]);

  // Other branches outside client governorate
  const otherBranches = useMemo(() => {
    return branches.filter(b => normalizeGov(b.governorate) !== normalizeGov(clientGov));
  }, [branches, clientGov]);

  // Distinct governorates among other branches
  const otherGovernorates = useMemo(() => {
    const map = new Map<string, number>();
    otherBranches.forEach(b => {
      const g = (b.governorate || 'أخرى').trim();
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries()).map(([gov, count]) => ({ gov, count }));
  }, [otherBranches]);

  // Branches available for transfer (all other branches except current branch)
  const transferDestinationBranches = useMemo(() => {
    const myBranchId = managerBranch?.id || currentUser?.branchId;
    return branches.filter(b => b.id !== myBranchId);
  }, [branches, managerBranch, currentUser]);

  // Initial branch selection
  const initialBranch = isBranchManager 
    ? (managerBranch || branches[0])
    : (matchingBranches[0] || branches.find(b => b.id === application.assignedBranchId) || branches[0]);

  // Scope Tab: 'SAME_GOV' | 'OTHER_GOVS'
  const [branchScopeTab, setBranchScopeTab] = useState<'SAME_GOV' | 'OTHER_GOVS'>(
    matchingBranches.length > 0 ? 'SAME_GOV' : 'OTHER_GOVS'
  );

  // Governorate filter in OTHER_GOVS ('ALL' or specific governorate name)
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('ALL');

  // Search in branches
  const [branchSearch, setBranchSearch] = useState<string>('');

  // Selected branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranch?.id || '');

  // Selected branch object
  const selectedBranch = useMemo(() => {
    if (isBranchManager) return managerBranch || initialBranch;
    return branches.find(b => b.id === selectedBranchId) || initialBranch;
  }, [branches, selectedBranchId, isBranchManager, managerBranch, initialBranch]);

  // Filtered other branches
  const displayedOtherBranches = useMemo(() => {
    return otherBranches.filter(b => {
      if (selectedGovFilter !== 'ALL' && normalizeGov(b.governorate) !== normalizeGov(selectedGovFilter)) {
        return false;
      }
      if (branchSearch.trim()) {
        const q = branchSearch.trim().toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchGov = b.governorate?.toLowerCase().includes(q);
        const matchAddr = b.address?.toLowerCase().includes(q);
        const matchMgr = b.managerName?.toLowerCase().includes(q);
        if (!matchName && !matchGov && !matchAddr && !matchMgr) return false;
      }
      return true;
    });
  }, [otherBranches, selectedGovFilter, branchSearch]);

  // Assignment mode: 'BRANCH_GENERAL' (إسناد للفرع بشكل عام) OR 'SPECIFIC_OFFICER' (تخصيص موظف محدد)
  const [assignmentMode, setAssignmentMode] = useState<'BRANCH_GENERAL' | 'SPECIFIC_OFFICER'>(
    application.assignedOfficerId ? 'SPECIFIC_OFFICER' : 'BRANCH_GENERAL'
  );

  // Staff in the selected branch
  const branchStaff = useMemo(() => {
    if (isBranchManager) {
      const myBranchId = managerBranch?.id || currentUser?.branchId;
      const myBranchStaff = staffList.filter(s => s.branchId === myBranchId || s.id === currentUser?.id);
      if (currentUser && !myBranchStaff.some(s => s.id === currentUser.id)) {
        return [currentUser, ...myBranchStaff];
      }
      return myBranchStaff;
    }

    if (!selectedBranch) return [];

    // ONLY staff belonging to the selected branch itself (حصر الموظفين على موظفي الفرع المختار فقط)
    return staffList.filter(s => s.branchId === selectedBranch.id);
  }, [staffList, selectedBranch, isBranchManager, managerBranch, currentUser]);

  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    application.assignedOfficerId || (branchStaff[0]?.id || currentUser?.id || '')
  );

  // Sync selectedOfficerId when selectedBranch or branchStaff changes
  React.useEffect(() => {
    if (branchStaff.length > 0) {
      if (!branchStaff.some(s => s.id === selectedOfficerId)) {
        setSelectedOfficerId(branchStaff[0].id);
      }
    } else {
      setSelectedOfficerId('');
    }
  }, [branchStaff, selectedOfficerId]);

  // Transfer Request Form State
  const [transferTargetBranchId, setTransferTargetBranchId] = useState<string>(
    transferDestinationBranches[0]?.id || ''
  );
  const [transferReason, setTransferReason] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const chosenOfficer = useMemo(() => {
    return staffList.find(s => s.id === selectedOfficerId) || branchStaff.find(s => s.id === selectedOfficerId);
  }, [staffList, branchStaff, selectedOfficerId]);

  const handleConfirmAssignment = async () => {
    if (!selectedBranch) {
      setErrorMessage('يرجى تحديد الفرع التابع للحالة');
      return;
    }

    let finalOfficerId = '';
    let finalOfficerName = '';

    if (assignmentMode === 'SPECIFIC_OFFICER') {
      if (!chosenOfficer) {
        setErrorMessage('يرجى اختيار الموظف المسؤول عن دراسة الملف أو اختيار (إسناد للفرع بشكل عام)');
        return;
      }
      finalOfficerId = chosenOfficer.id;
      finalOfficerName = chosenOfficer.name;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      await onAssign(
        selectedBranch.id,
        selectedBranch.name,
        finalOfficerId,
        finalOfficerName
      );
      onClose();
    } catch (err) {
      console.error('Error assigning case:', err);
      setErrorMessage('حدث خطأ أثناء إسناد الطلب');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTransferRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetBranchId) {
      setErrorMessage('يرجى اختيار الفرع المراد تحويل العميل إليه');
      return;
    }
    if (!transferReason.trim()) {
      setErrorMessage('يرجى كتابة سبب طلب التحويل للإدارة');
      return;
    }

    const targetBranch = branches.find(b => b.id === transferTargetBranchId);
    if (!targetBranch) return;

    setTransferSubmitting(true);
    setErrorMessage('');
    try {
      await requestBranchTransfer(
        application.id,
        targetBranch.id,
        targetBranch.name,
        transferReason.trim()
      );
      setTransferSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error requesting branch transfer:', err);
      setErrorMessage('حدث خطأ أثناء إرسال طلب التبديل');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const getRoleLabel = (staff: any) => {
    const r = staff.staffRole || staff.role;
    if (staff.id === currentUser?.id && isBranchManager) return 'أنت (مدير الفرع - دراسة ومتابعة مباشرة)';
    if (r === InstallmentCompanyStaffRole.BRANCH_MANAGER || r === Role.BRANCH_MANAGER) return 'مدير الفرع';
    if (r === InstallmentCompanyStaffRole.CREDIT_OFFICER) return 'مسؤول دراسة ائتمانية ومخاطر';
    if (r === InstallmentCompanyStaffRole.COMPANY_EMPLOYEE || r === Role.COMPANY_EMPLOYEE) return 'موظف تقسيط ومتابعة';
    if (r === InstallmentCompanyStaffRole.COLLECTION_AGENT) return 'مسؤول تحصيل';
    if (r === InstallmentCompanyStaffRole.COMPANY_ADMIN) return 'إدارة الشركة';
    return 'مسؤول ائتمان بالفرع';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-crobsa-950 via-crobsa-900 to-sky-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                {isBranchManager ? 'إدارة وتوجيه طلب التمويل بالفرع' : 'إسناد وتكليف طلب التمويل (الفروع والموظفون)'}
              </h2>
              <p className="text-xs text-sky-200 mt-0.5">
                {isBranchManager 
                  ? `إسناد الحالة لنفسك أو لموظفي فرع (${currentUser?.branchName || 'فرعك'}) أو طلب تبديل فرع للإدارة`
                  : 'اختيار الفرع من نفس محافظة العميل أو محافظات أخرى، وتحديد الإسناد العام للفرع أو لموظف محدد'
                }
              </p>
            </div>
          </div>

          {/* Client Summary Box */}
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-sm">{application.clientName}</span>
              <span className="text-slate-300 font-mono">({application.clientNationalId || application.id})</span>
              {application.phoneNumber && (
                <span className="text-slate-300 font-mono flex items-center gap-1" dir="ltr">
                  <Phone className="h-3 w-3 text-sky-400" />
                  {application.phoneNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-xl font-black flex items-center gap-1.5 shadow-xs">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                محافظة العميل: {clientGov}
              </span>
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-xl font-black shadow-xs">
                {application.requestedAmount.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Branch Manager Switcher Tabs */}
          {isBranchManager && (
            <div className="mt-4 flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveMode('ASSIGN')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeMode === 'ASSIGN' 
                    ? 'bg-white text-slate-900 shadow-md font-black' 
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span>إسناد داخل الفرع (لنفسي أو لموظفي الفرع)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('TRANSFER_REQUEST')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeMode === 'TRANSFER_REQUEST' 
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>طلب تبديل فرع آخر (تحويل للإدارة)</span>
                {application.branchTransferRequest?.status === 'PENDING' && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Existing Pending Transfer Request Notification */}
        {application.branchTransferRequest?.status === 'PENDING' && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <ArrowLeftRight className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">يوجد طلب تبديل فرع معلق قيد المراجعة لدى إدارة الشركة:</p>
              <p className="mt-1 text-slate-700">
                الفرع المستهدف: <strong>{application.branchTransferRequest.targetBranchName}</strong> •{' '}
                السبب: <span className="italic">"{application.branchTransferRequest.reason}"</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                طُلب بواسطة: {application.branchTransferRequest.requestedByName} في {new Date(application.branchTransferRequest.requestedAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        )}

        {/* MODE 1: NORMAL ASSIGNMENT */}
        {activeMode === 'ASSIGN' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            
            {/* STEP 1: BRANCH SELECTION */}
            {isBranchManager ? (
              // For Branch Manager: LOCKED to their branch
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-black text-emerald-950">
                      فرعك المعتمد: {selectedBranch?.name || currentUser?.branchName}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                    نطاق فرعك فقط
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  كـمدير فرع، يمكنك الإسناد لنفسك مباشرة أو لأحد موظفي فرعك، أو إسناد الحالة للفرع بشكل عام.
                </p>
              </div>
            ) : (
              // For Company Admin / Installment Company Manager: Same Gov vs Other Govs
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">1</span>
                    <span className="text-sm">اختيار الفرع المسؤول:</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (اختر فرع نفس محافظة العميل أو تصفح باقي الفروع)
                  </span>
                </div>

                {/* Primary Governorates Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200">
                  {/* Tab 1: Same Governorate */}
                  <button
                    type="button"
                    onClick={() => setBranchScopeTab('SAME_GOV')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                      branchScopeTab === 'SAME_GOV'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className={`h-4 w-4 ${branchScopeTab === 'SAME_GOV' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>فروع نفس محافظة العميل ({clientGov})</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      branchScopeTab === 'SAME_GOV' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {matchingBranches.length}
                    </span>
                  </button>

                  {/* Tab 2: Other Governorates */}
                  <button
                    type="button"
                    onClick={() => setBranchScopeTab('OTHER_GOVS')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                      branchScopeTab === 'OTHER_GOVS'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className={`h-4 w-4 ${branchScopeTab === 'OTHER_GOVS' ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>فروع محافظات أخرى</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      branchScopeTab === 'OTHER_GOVS' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {otherBranches.length}
                    </span>
                  </button>
                </div>

                {/* SAME GOVERNORATE BRANCHES VIEW */}
                {branchScopeTab === 'SAME_GOV' && (
                  <div className="space-y-3">
                    {matchingBranches.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchingBranches.map(branch => {
                          const isSelected = selectedBranchId === branch.id;
                          return (
                            <div
                              key={branch.id}
                              onClick={() => setSelectedBranchId(branch.id)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-sky-600 bg-sky-50/80 shadow-md ring-2 ring-sky-200' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2 className={`h-4 w-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                                  <h4 className="text-xs font-black text-slate-900">{branch.name}</h4>
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                  <BadgeCheck className="h-3 w-3 text-emerald-600" />
                                  نفس المحافظة
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{branch.governorate} {branch.address ? `• ${branch.address}` : ''}</span>
                              </p>

                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-500">
                                <span>مدير الفرع: <strong className="text-slate-800">{branch.managerName || 'غير مسجل'}</strong></span>
                                {branch.phone && (
                                  <span className="font-mono flex items-center gap-0.5" dir="ltr">
                                    <Phone className="h-2.5 w-2.5" />
                                    {branch.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">
                            لا يوجد فرع مباشر مسجل لشركتكم داخل محافظة ({clientGov}).
                          </p>
                          <p className="text-[11px] text-amber-800">
                            يمكنك اختيار أقرب فرع جغرافي أو الفرع الرئيسي من تبويب "فروع محافظات أخرى" بالأعلى.
                          </p>
                          <button
                            type="button"
                            onClick={() => setBranchScopeTab('OTHER_GOVS')}
                            className="mt-2 text-xs font-bold text-sky-700 underline hover:text-sky-900"
                          >
                            الانتقال لفروع المحافظات الأخرى ←
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OTHER GOVERNORATES BRANCHES VIEW */}
                {branchScopeTab === 'OTHER_GOVS' && (
                  <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                      {/* Governorate Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedGovFilter('ALL')}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs ${
                            selectedGovFilter === 'ALL'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          جميع المحافظات ({otherBranches.length})
                        </button>
                        {otherGovernorates.map(({ gov, count }) => (
                          <button
                            key={gov}
                            type="button"
                            onClick={() => setSelectedGovFilter(gov)}
                            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs ${
                              selectedGovFilter === gov
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {gov} ({count})
                          </button>
                        ))}
                      </div>

                      {/* Search box */}
                      <div className="relative min-w-[200px]">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="بحث باسم الفرع أو العنوان..."
                          value={branchSearch}
                          onChange={e => setBranchSearch(e.target.value)}
                          className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Filtered Other Branches Grid */}
                    {displayedOtherBranches.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {displayedOtherBranches.map(branch => {
                          const isSelected = selectedBranchId === branch.id;
                          return (
                            <div
                              key={branch.id}
                              onClick={() => setSelectedBranchId(branch.id)}
                              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-sky-600 bg-sky-50/80 shadow-md ring-2 ring-sky-200' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2 className={`h-4 w-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                                  <h4 className="text-xs font-black text-slate-900">{branch.name}</h4>
                                </div>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  {branch.governorate}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{branch.address || branch.governorate}</span>
                              </p>

                              {branch.managerName && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  مدير الفرع: <strong className="text-slate-800">{branch.managerName}</strong>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                        لا توجد فروع مطابقة لبحثك في المحافظات الأخرى.
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Branch Indicator Banner */}
                {selectedBranch && (
                  <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-sky-950 font-bold">
                      <Building2 className="h-4 w-4 text-sky-600 shrink-0" />
                      <span>الفرع المعتمد المختار: <strong>{selectedBranch.name}</strong> (محافظة {selectedBranch.governorate})</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-200/80 text-sky-900">
                      {normalizeGov(selectedBranch.governorate) === normalizeGov(clientGov) ? 'نفس محافظة العميل' : 'محافظة أخرى'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ASSIGNMENT MODE & TARGET (BRANCH GENERAL VS SPECIFIC OFFICER) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-crobsa-700 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {isBranchManager ? '1' : '2'}
                  </span>
                  <span className="text-sm">طريقة الإسناد وتحديد المسؤول:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  (إسناد للفرع بشكل عام أو تكليف موظف محدد)
                </span>
              </div>

              {/* Two Option Cards: Branch General vs Specific Officer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: General Branch Assignment */}
                <div
                  onClick={() => setAssignmentMode('BRANCH_GENERAL')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    assignmentMode === 'BRANCH_GENERAL'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${assignmentMode === 'BRANCH_GENERAL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">إسناد للفرع بشكل عام</h4>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          توزيع داخلي بالفرع
                        </span>
                      </div>
                    </div>
                    {assignmentMode === 'BRANCH_GENERAL' && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                    تحويل الملف إلى صندوق وارد <strong>فرع ({selectedBranch?.name})</strong> بشكل عام بدون تخصيص موظف، ليتولى مدير الفرع التوزيع الداخلي.
                  </p>
                </div>

                {/* Option 2: Specific Employee */}
                <div
                  onClick={() => setAssignmentMode('SPECIFIC_OFFICER')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    assignmentMode === 'SPECIFIC_OFFICER'
                      ? 'border-sky-600 bg-sky-50/70 shadow-md ring-2 ring-sky-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${assignmentMode === 'SPECIFIC_OFFICER' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">تخصيص موظف / مسؤول ائتمان</h4>
                        <span className="text-[10px] text-sky-800 font-bold bg-sky-100/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          تكليف مباشر بالدراسة
                        </span>
                      </div>
                    </div>
                    {assignmentMode === 'SPECIFIC_OFFICER' && (
                      <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                    اختيار مسؤول ائتمان أو باحث محدد بالفرع لبدء فحص المستندات والاستعلام عن العميل فوراً.
                  </p>
                </div>
              </div>

              {/* If General Branch is active */}
              {assignmentMode === 'BRANCH_GENERAL' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    ✓ سيتم إسناد الطلب لفرع <strong>({selectedBranch?.name})</strong> بشكل عام، وإشعار مدير الفرع للتوزيع الداخلي ومتابعة الحالة.
                  </span>
                </div>
              )}

              {/* If Specific Officer is active: Show officer selection cards */}
              {assignmentMode === 'SPECIFIC_OFFICER' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-crobsa-700" />
                    <span>اختر الموظف المسؤول من فريق عمل ({selectedBranch?.name}):</span>
                  </p>

                  {branchStaff.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {branchStaff.map(staff => {
                        const isSelected = selectedOfficerId === staff.id;
                        const isSelf = staff.id === currentUser?.id;
                        const isSameBranch = staff.branchId === selectedBranch?.id;

                        return (
                          <div
                            key={staff.id}
                            onClick={() => setSelectedOfficerId(staff.id)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                              isSelected 
                                ? 'border-crobsa-600 bg-crobsa-50/70 shadow-md ring-2 ring-crobsa-200' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`h-12 w-12 rounded-2xl ${isSelf ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'} border border-slate-200 overflow-hidden flex items-center justify-center text-sm font-black shrink-0 shadow-xs`}>
                              {Boolean(staff.avatarUrl?.trim()) ? (
                                <img src={staff.avatarUrl} alt={staff.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{staff.name.charAt(0)}</span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-slate-900 truncate">
                                  {staff.name} {isSelf && '(أنت)'}
                                </h4>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-crobsa-700 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-crobsa-700 font-bold mt-0.5">
                                {getRoleLabel(staff)}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                <span className={`px-1.5 py-0.5 rounded-md font-bold ${isSameBranch ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {staff.branchName || selectedBranch?.name}
                                </span>
                                {staff.phone && (
                                  <span className="font-mono flex items-center gap-0.5" dir="ltr">
                                    <Phone className="h-2.5 w-2.5" />
                                    {staff.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 space-y-2">
                      <p>لم يتم تسجيل موظفين إضافيين باسم هذا الفرع بعد.</p>
                      <button
                        type="button"
                        onClick={() => setAssignmentMode('BRANCH_GENERAL')}
                        className="text-xs font-bold text-emerald-700 underline"
                      >
                        التبديل إلى (إسناد للفرع بشكل عام) ←
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

          </div>
        )}

        {/* MODE 2: REQUEST BRANCH TRANSFER (FOR BRANCH MANAGER) */}
        {activeMode === 'TRANSFER_REQUEST' && (
          <form onSubmit={handleSendTransferRequest} className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900 space-y-1">
              <h4 className="font-bold text-sky-950 flex items-center gap-1.5">
                <ArrowLeftRight className="h-4 w-4 text-sky-600" />
                طلب تبديل فرع العميل إلى فرع آخر بالشركة
              </h4>
              <p className="text-[11px] leading-relaxed text-sky-800">
                إذا كان العميل يسكن في نطاق جغرافي لفرع آخر، يمكنك تقديم طلب تبديل الفرع لتقوم إدارة شركة التقسيط باعتماده ونقل ملف العميل تلقائياً إلى الفرع المختار.
              </p>
            </div>

            {transferSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-bold text-emerald-950 text-sm">تم إرسال طلب التبديل إلى إدارة الشركة بنجاح!</h4>
                <p className="text-xs text-emerald-800">سيتم إشعار إدارة الشركة بمراجعة الطلب ونقل الحالة للفرع المطلوب فور الاعتماد.</p>
              </div>
            ) : (
              <>
                {/* Select Destination Branch */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    الفرع المطلوب تحويل العميل إليه *
                  </label>
                  <select
                    required
                    value={transferTargetBranchId}
                    onChange={e => setTransferTargetBranchId(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">-- اختر الفرع المستهدف --</option>
                    {transferDestinationBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} — محافظة {branch.governorate} {branch.managerName ? `(مدير: ${branch.managerName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    سبب طلب التبديل ونقل الملف *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                    placeholder="مثال: تبين من الاتصال بالعميل أن محل إقامته الفعلي ونشاطه التجاري بمحافظة الإسكندرية وأقرب لفرع سموحة، أو بناءً على رغبة العميل لسهولة المتابعة..."
                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </>
            )}
          </form>
        )}

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            {activeMode === 'ASSIGN' && selectedBranch && (
              <span>
                سيتم الإسناد إلى: <strong className="text-slate-900">{selectedBranch.name}</strong> •{' '}
                {assignmentMode === 'BRANCH_GENERAL' ? (
                  <span className="text-emerald-700 font-bold">إسناد للفرع بشكل عام</span>
                ) : (
                  <span>المسؤول: <strong className="text-crobsa-800">{chosenOfficer?.name || 'لم يُحدد موظف'}</strong></span>
                )}
              </span>
            )}
            {activeMode === 'TRANSFER_REQUEST' && (
              <span>
                الفرع الحالي: <strong className="text-slate-800">{currentUser?.branchName || selectedBranch?.name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إلغاء
            </button>

            {activeMode === 'ASSIGN' ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmAssignment}
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-crobsa-700 hover:from-sky-500 hover:to-crobsa-600 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {saving 
                    ? 'جاري الإسناد...' 
                    : assignmentMode === 'BRANCH_GENERAL'
                      ? `إسناد لفرع ${selectedBranch?.name?.split(' ')[0] || ''} بشكل عام`
                      : `تأكيد الإسناد إلى ${chosenOfficer?.name ? chosenOfficer.name.split(' ')[0] : 'الموظف'}`
                  }
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={transferSubmitting || transferSuccess || !transferTargetBranchId || !transferReason.trim()}
                onClick={handleSendTransferRequest}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                {transferSubmitting ? 'جاري إرسال الطلب...' : 'إرسال طلب التبديل للإدارة'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
