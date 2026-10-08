import React, { useState, useEffect } from 'react';
import { 
  InstallmentCompany, 
  CompanyWorkflowConfig, 
  WorkflowStageConfig, 
  ApplicationStatus, 
  DEFAULT_COMPANY_WORKFLOW_STAGES,
  STATUS_ARABIC
} from '../types';
import { useStore } from '../context/Store';
import { 
  Compass, 
  Check, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ArrowRight,
  Sliders,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';

interface CompanyWorkflowSettingsProps {
  company: InstallmentCompany;
  onSaved?: () => void;
}

export const CompanyWorkflowSettings: React.FC<CompanyWorkflowSettingsProps> = ({
  company,
  onSaved
}) => {
  const { updateCompanyWorkflowConfig, language } = useStore();
  const isAr = language === 'ar';

  const initialConfig: CompanyWorkflowConfig = company.workflowConfig || {
    useCustomScheme: false,
    autoApproveOnAssign: true,
    postAssignStage: ApplicationStatus.APPROVED,
    stages: DEFAULT_COMPANY_WORKFLOW_STAGES
  };

  const [useCustomScheme, setUseCustomScheme] = useState<boolean>(initialConfig.useCustomScheme);
  const [autoApproveOnAssign, setAutoApproveOnAssign] = useState<boolean>(initialConfig.autoApproveOnAssign ?? true);
  const [postAssignStage, setPostAssignStage] = useState<string>(initialConfig.postAssignStage || ApplicationStatus.APPROVED);
  const [stages, setStages] = useState<WorkflowStageConfig[]>(initialConfig.stages && initialConfig.stages.length > 0 ? initialConfig.stages : DEFAULT_COMPANY_WORKFLOW_STAGES);

  // New stage modal/input
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync if company changes
  useEffect(() => {
    if (company.workflowConfig) {
      setUseCustomScheme(company.workflowConfig.useCustomScheme);
      setAutoApproveOnAssign(company.workflowConfig.autoApproveOnAssign ?? true);
      setPostAssignStage(company.workflowConfig.postAssignStage || ApplicationStatus.APPROVED);
      setStages(company.workflowConfig.stages && company.workflowConfig.stages.length > 0 ? company.workflowConfig.stages : DEFAULT_COMPANY_WORKFLOW_STAGES);
    }
  }, [company]);

  const handleToggleStageEnabled = (id: string) => {
    setStages(prev => prev.map(s => {
      if (s.id === id) {
        if (s.isLocked || s.key === ApplicationStatus.RECEIVED) return s;
        return { ...s, enabled: !s.enabled };
      }
      return s;
    }));
  };

  const handleMoveStage = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    // Do not allow moving before locked stage (e.g. stage_received)
    if (stages[targetIndex].isLocked || stages[index].isLocked) return;

    const newStages = [...stages];
    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    // Reassign orders
    const reordered = newStages.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStages(reordered);
  };

  const handleAddCustomStage = () => {
    if (!newStageName.trim()) return;
    const newStage: WorkflowStageConfig = {
      id: `stage_custom_${Date.now()}`,
      key: `CUSTOM_${Date.now()}`,
      name: newStageName.trim(),
      enabled: true,
      order: stages.length + 1,
      description: newStageDesc.trim() || 'مرحلة عمل مخصصة من قبل الشركة',
      color: 'teal'
    };
    setStages(prev => [...prev, newStage]);
    setNewStageName('');
    setNewStageDesc('');
    setShowAddStage(false);
  };

  const handleRemoveStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
  };

  const handleResetToDefault = () => {
    setUseCustomScheme(false);
    setAutoApproveOnAssign(true);
    setPostAssignStage(ApplicationStatus.APPROVED);
    setStages(DEFAULT_COMPANY_WORKFLOW_STAGES);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const config: CompanyWorkflowConfig = {
        useCustomScheme,
        autoApproveOnAssign,
        postAssignStage,
        stages: stages.map((s, idx) => ({ ...s, order: idx + 1 }))
      };
      await updateCompanyWorkflowConfig(company.id, config);
      setSuccessMsg(isAr ? 'تم حفظ إعدادات مخطط ومراحل العمل بنجاح' : 'Workflow settings saved successfully');
      onSaved?.();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-cropsa-950 to-sky-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-sky-500/20 border border-sky-400/30 rounded-2xl text-sky-400 shrink-0">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <span>{isAr ? 'مخطط ومراحل مسار دراسة الطلبات' : 'Application Workflow & Stages Scheme'}</span>
                <span className="text-[10px] bg-sky-500/30 text-sky-200 border border-sky-400/40 px-2 py-0.5 rounded-full font-bold">
                  {useCustomScheme ? (isAr ? 'مخطط مخصص للشركة' : 'Custom Scheme') : (isAr ? 'المخطط القياسي' : 'Standard Scheme')}
                </span>
              </h3>
              <p className="text-xs text-sky-200/80 mt-1 max-w-2xl leading-relaxed">
                {isAr
                  ? 'تصل كافة الطلبات الجديدة لشركة التقسيط كـ (طلب مستلم)، وعند قيام إدارة الشركة أو مدير الفرع بإسناد الطلب يتحول تلقائياً إلى (طلب معتمد). يمكنك إما ترك المخطط القياسي كما هو أو تخصيص مراحل العمل وتفعيلها أدناه.'
                  : 'All new applications arrive as "Received". Upon assignment by branch or management, it transitions to "Approved". You can leave default stages or customize below.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/15"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black transition-all shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ المخطط' : 'Save Scheme')}</span>
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Scheme Mode Selector: Default vs Custom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Standard Scheme */}
        <div 
          onClick={() => setUseCustomScheme(false)}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            !useCustomScheme
              ? 'bg-sky-50/70 border-sky-500 shadow-sm ring-1 ring-sky-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl text-white ${!useCustomScheme ? 'bg-sky-600' : 'bg-slate-500'}`}>
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {isAr ? 'المخطط الافتراضي القياسي (الموصى به)' : 'Default Standard Workflow'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'طلب مستلم ➔ طلب معتمد (فور الإسناد) ➔ مراجعة المستندات ➔ آي سكور ➔ استعلام ميداني ➔ عقود ➔ صرف' : 'Received ➔ Approved ➔ Paper Review ➔ I-Score ➔ Field ➔ Contracts ➔ Disbursed'}
                </p>
              </div>
            </div>
            {!useCustomScheme && <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0" />}
          </div>
          <div className="text-xs text-slate-600 space-y-1 pr-9">
            <p className="flex items-center gap-1.5 font-bold text-sky-900">
              <Check className="h-3.5 w-3.5 text-sky-600" />
              {isAr ? 'تأكيد وصول الطلب الجديد تلقائياً كـ (طلب مستلم)' : 'New apps automatically arrive as Received'}
            </p>
            <p className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              {isAr ? 'تحويل الطلب فور قيامك بالإسناد مباشرة إلى (طلب معتمد)' : 'Becomes Approved immediately upon case assignment'}
            </p>
          </div>
        </div>

        {/* Option 2: Custom Scheme */}
        <div 
          onClick={() => setUseCustomScheme(true)}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            useCustomScheme
              ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-1 ring-amber-500/20'
              : 'bg-white hover:bg-slate-50 border-slate-200 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl text-white ${useCustomScheme ? 'bg-amber-600' : 'bg-slate-500'}`}>
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {isAr ? 'تخصيص مراحل ومخطط مسار العمل للشركة' : 'Custom Company Workflow Scheme'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'تحديد المرحلة الناتجة بعد الإسناد، وتعطيل أو تفعيل أو إعادة ترتيب المراحل الائتمانية' : 'Customize post-assign stage, toggle stages, reorder steps'}
                </p>
              </div>
            </div>
            {useCustomScheme && <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />}
          </div>
          <div className="text-xs text-slate-600 space-y-1 pr-9">
            <p className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              {isAr ? 'مرونة كاملة لتجاوز مراحل مثل آي سكور أو المعاينة الميدانية' : 'Ability to skip or customize any credit verification step'}
            </p>
            <p className="flex items-center gap-1.5 text-slate-600">
              <Check className="h-3.5 w-3.5 text-slate-400" />
              {isAr ? 'إمكانية اختيار المرحلة المعتمدة عند إسناد الموظف' : 'Select target post-assignment stage'}
            </p>
          </div>
        </div>
      </div>

      {/* Post-Assignment Transition Rule Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-crobsa-700" />
              <span>{isAr ? 'قاعدة التحويل التلقائي عند الإسناد (Smart Assignment Transition)' : 'Post-Assignment Transition Rule'}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr 
                ? 'الحالة التي يتحول إليها الطلب مباشرة عند إسناده لفرع أو لمسؤول الائتمان من قبل الشركة' 
                : 'The stage an incoming request transitions to once assigned to branch/officer'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              {isAr ? 'الحالة بعد الإسناد:' : 'Target Stage:'}
            </label>
            <select
              value={postAssignStage}
              disabled={!useCustomScheme}
              onChange={e => setPostAssignStage(e.target.value)}
              className={`bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-crobsa-500 outline-none ${
                !useCustomScheme ? 'opacity-80 cursor-not-allowed bg-slate-100' : ''
              }`}
            >
              <option value={ApplicationStatus.APPROVED}>طلب معتمد (الافتراضي - موافقة أولية)</option>
              <option value={ApplicationStatus.PAPER_REVIEW}>مراجعة الأوراق والمستندات</option>
              <option value={ApplicationStatus.ISCORE_CHECK}>استعلام I-Score</option>
              <option value={ApplicationStatus.FIELD_INVESTIGATION}>الاستعلام الميداني</option>
              <option value={ApplicationStatus.CONTRACT_SIGNING}>توقيع العقود</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-xs text-sky-950 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isAr ? (
              <>
                <strong>سلوك المنظومة:</strong> عند تقديم العميل للطلب يكون في حالة <strong>"طلب مستلم"</strong>، وبمجرد أن يقوم مدير الشركة أو مدير الفرع بالنقر على <strong>"إسناد الحالة"</strong> وتحديد الفرع أو الموظف، يتم تحديث حالة الطلب فوراً إلى <strong>"{STATUS_ARABIC[postAssignStage] || 'طلب معتمد'}"</strong> مع إشعار كافة الأطراف وإدراجه في متابعة سير العمل.
              </>
            ) : (
              <>
                <strong>Behavior:</strong> New applications are initially "Received". Once assigned to branch/officer, they transition immediately to "{STATUS_ARABIC[postAssignStage] || 'Approved'}".
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stages Pipeline List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-crobsa-700" />
              <span>{isAr ? 'مراحل مسار دراسة وتنفيذ الطلب' : 'Workflow Stages Pipeline'}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr
                ? 'المراحل التي يمر بها الملف الائتماني من الاستلام وحتى صرف التمويل. يمكنك تفعيل/تعطيل أي مرحلة وإعادة ترتيبها.'
                : 'Stages from initial receipt to disbursement. Toggle or reorder stages below.'}
            </p>
          </div>

          {useCustomScheme && (
            <button
              type="button"
              onClick={() => setShowAddStage(!showAddStage)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crobsa-700 hover:bg-crobsa-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAr ? 'إضافة مرحلة مخصصة' : 'Add Custom Stage'}</span>
            </button>
          )}
        </div>

        {/* Add Stage Inline Drawer */}
        {showAddStage && useCustomScheme && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-crobsa-700" />
              {isAr ? 'إضافة مرحلة مخصصة جديدة للمسار' : 'Add New Custom Stage'}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المرحلة *</label>
                <input
                  type="text"
                  placeholder="مثال: فحص الضمانات العينية / موافقة اللجنة العليا"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-crobsa-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">وصف المرحلة</label>
                <input
                  type="text"
                  placeholder="وصف مختصر لإجراءات ومسؤوليات هذه المرحلة"
                  value={newStageDesc}
                  onChange={e => setNewStageDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-crobsa-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddStage(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!newStageName.trim()}
                onClick={handleAddCustomStage}
                className="px-4 py-1.5 bg-crobsa-800 hover:bg-crobsa-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                إضافة للمسار
              </button>
            </div>
          </div>
        )}

        {/* Stages List Items */}
        <div className="space-y-2.5">
          {stages.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === stages.length - 1;
            const isInitial = stage.key === ApplicationStatus.RECEIVED;
            const isPostAssign = stage.key === postAssignStage;

            return (
              <div
                key={stage.id || stage.key}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !stage.enabled
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : isInitial
                    ? 'bg-sky-50/80 border-sky-300 shadow-2xs'
                    : isPostAssign
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  {/* Order Number Badge */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                    isInitial
                      ? 'bg-sky-600 text-white'
                      : isPostAssign
                      ? 'bg-emerald-600 text-white'
                      : stage.enabled
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-black text-slate-900 text-sm">{stage.name}</h5>
                      
                      {isInitial && (
                        <span className="text-[10px] bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          المرحلة الابتدائية (طلب مستلم)
                        </span>
                      )}

                      {isPostAssign && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          المرحلة بعد الإسناد مباشرة
                        </span>
                      )}

                      {!stage.enabled && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                          معطلة (يتم تخطيها)
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {stage.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  {/* Enable / Disable toggle */}
                  {!isInitial && !stage.isLocked && useCustomScheme && (
                    <button
                      type="button"
                      onClick={() => handleToggleStageEnabled(stage.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        stage.enabled
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {stage.enabled ? (isAr ? 'تعطيل المرحلة' : 'Disable') : (isAr ? 'تفعيل المرحلة' : 'Enable')}
                    </button>
                  )}

                  {/* Reorder Buttons */}
                  {useCustomScheme && !isInitial && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        disabled={idx <= 1}
                        onClick={() => handleMoveStage(idx, 'UP')}
                        className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                        title="تحريك لأعلى"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveStage(idx, 'DOWN')}
                        className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600"
                        title="تحريك لأسفل"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Delete custom stage */}
                  {stage.id.startsWith('stage_custom_') && useCustomScheme && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(stage.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                      title="حذف المرحلة"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {isAr
              ? 'تنعكس هذه الإعدادات على بوابات موظفي الائتمان ومدراء الفروع ومسار متابعة الحالات.'
              : 'These configurations apply to credit staff, branch managers, and case tracking.'}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-crobsa-800 hover:bg-crobsa-900 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Workflow')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
