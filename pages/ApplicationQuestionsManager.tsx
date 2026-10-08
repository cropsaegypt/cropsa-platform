import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { ApplicationQuestion, Role } from '../types';
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Eye, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ListPlus,
  Type,
  Hash,
  CheckSquare
} from 'lucide-react';

export const ApplicationQuestionsManager: React.FC = () => {
  const { 
    currentUser, 
    applicationQuestions, 
    addApplicationQuestion, 
    updateApplicationQuestion, 
    deleteApplicationQuestion, 
    t, 
    language 
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ApplicationQuestion | null>(null);

  const [formData, setFormData] = useState<{
    labelAr: string;
    labelEn: string;
    type: 'text' | 'number' | 'select' | 'yes_no';
    category: 'AGRICULTURAL' | 'FINANCIAL' | 'ASSETS' | 'GENERAL';
    required: boolean;
    optionsText: string;
    description?: string;
  }>({
    labelAr: '',
    labelEn: '',
    type: 'text',
    category: 'AGRICULTURAL',
    required: true,
    optionsText: ''
  });

  // Only Super Admin & Admin can access this configuration
  if (currentUser?.role !== Role.SUPER_ADMIN && currentUser?.role !== Role.ADMIN) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center" dir="rtl">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-xl font-black text-amber-900">هذه الصفحة مخصصة لمدير النظام الأول (Super Admin)</h2>
          <p className="text-xs text-amber-700 mt-2">لا تملك الصلاحيات الإدارية لتعديل أسئلة استبيان طلبات التمويل في كروبسا.</p>
        </div>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormData({
      labelAr: '',
      labelEn: '',
      type: 'text',
      category: 'AGRICULTURAL',
      required: true,
      optionsText: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (q: ApplicationQuestion) => {
    setEditingQuestion(q);
    setFormData({
      labelAr: q.labelAr,
      labelEn: q.labelEn || '',
      type: q.type,
      category: q.category,
      required: q.required,
      optionsText: q.options ? q.options.join('\n') : '',
      description: q.description || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.labelAr.trim()) return;

    const parsedOptions = formData.type === 'select'
      ? formData.optionsText.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined;

    if (editingQuestion) {
      await updateApplicationQuestion(editingQuestion.id, {
        labelAr: formData.labelAr.trim(),
        labelEn: formData.labelEn.trim() || undefined,
        type: formData.type,
        category: formData.category,
        required: formData.required,
        options: parsedOptions,
        description: formData.description?.trim() || undefined
      });
    } else {
      await addApplicationQuestion({
        labelAr: formData.labelAr.trim(),
        labelEn: formData.labelEn.trim() || undefined,
        type: formData.type,
        category: formData.category,
        required: formData.required,
        options: parsedOptions,
        description: formData.description?.trim() || undefined,
        active: true
      });
    }

    setShowAddModal(false);
  };

  const categoryLabels = {
    AGRICULTURAL: 'نشاط زراعي وإنتاجي',
    FINANCIAL: 'بيانات مالية وتسهيلات',
    ASSETS: 'أصول وضمانات عينية',
    GENERAL: 'معلومات عامة وإضافية'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir="rtl">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-crobsa-950 via-crobsa-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-crobsa-500/20 text-crobsa-300 p-2.5 rounded-2xl border border-crobsa-400/30">
              <HelpCircle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black">إدارة أسئلة واستبيان طلبات التمويل</h1>
              <p className="text-xs text-slate-300 mt-1">
                صلاحية مدير النظام الأول (Super Admin): تحديد الأسئلة الإلزامية والاختيارية التي تظهر للمناديب والموردين عند إنشاء أي طلب تمويل
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-crobsa-600 hover:bg-crobsa-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          إضافة سؤال جديد للطلب
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>ديناميكية نموذج الطلب:</strong> الأسئلة المفعلة هنا تظهر فوراً في استمارة "إنشاء طلب جديد" لجميع الموردين وموظفي البيع في كروبسا. تُحفظ إجابات العميل مع تفاصيل الطلب وتُعرض لشركات التقسيط لمساعدتها في اتخاذ القرار الائتماني الدقيق.
        </p>
      </div>

      {/* Questions List by Category */}
      <div className="space-y-6">
        {(['AGRICULTURAL', 'FINANCIAL', 'ASSETS', 'GENERAL'] as const).map(catKey => {
          const catQuestions = applicationQuestions.filter(q => q.category === catKey);

          return (
            <div key={catKey} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-crobsa-800" />
                  <h3 className="text-sm font-bold text-slate-900">{categoryLabels[catKey]}</h3>
                  <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {catQuestions.length} أسئلة
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {catQuestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    لا توجد أسئلة مضافة في هذا التصنيف حالياً
                  </div>
                ) : (
                  catQuestions.map(q => (
                    <div key={q.id} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                          q.type === 'select' ? 'bg-purple-100 text-purple-700' :
                          q.type === 'yes_no' ? 'bg-amber-100 text-amber-700' :
                          q.type === 'number' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {q.type === 'select' ? <ListPlus className="h-4 w-4" /> :
                           q.type === 'yes_no' ? <CheckSquare className="h-4 w-4" /> :
                           q.type === 'number' ? <Hash className="h-4 w-4" /> :
                           <Type className="h-4 w-4" />}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{q.labelAr}</h4>
                            {q.required && (
                              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded">إلزامي</span>
                            )}
                            {!q.active && (
                              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded">معطل</span>
                            )}
                          </div>
                          
                          {q.labelEn && (
                            <p className="text-xs text-slate-400 font-sans mt-0.5">{q.labelEn}</p>
                          )}

                          {q.description && (
                            <p className="text-xs text-slate-500 mt-1 italic">{q.description}</p>
                          )}

                          {q.options && q.options.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {q.options.map((opt, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md border border-slate-200">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => updateApplicationQuestion(q.id, { active: !q.active })}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                            q.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={q.active ? 'تعطيل السؤال مؤقتاً' : 'تفعيل السؤال'}
                        >
                          {q.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                          <span className="hidden md:inline">{q.active ? 'مفعل' : 'معطل'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="p-2 hover:bg-slate-100 text-slate-600 hover:text-crobsa-800 rounded-xl transition-colors"
                          title="تعديل السؤال"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteApplicationQuestion(q.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                          title="حذف السؤال نهائياً"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingQuestion ? 'تعديل سؤال الاستبيان' : 'إضافة سؤال جديد لطلب التمويل'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  نص السؤال باللغة العربية *
                </label>
                <input
                  type="text"
                  required
                  value={formData.labelAr}
                  onChange={(e) => setFormData({ ...formData, labelAr: e.target.value })}
                  placeholder="مثال: المساحة المزروعة الفعلية (بالفدان)"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  نص السؤال باللغة الإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.labelEn}
                  onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                  placeholder="e.g. Cultivated Farm Land Area (Feddan)"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500 text-left font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    نوع حقل الإدخال
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                  >
                    <option value="text">نص حر (Text)</option>
                    <option value="number">رقم أو مبلغ (Number)</option>
                    <option value="yes_no">نعم / لا (Yes / No)</option>
                    <option value="select">قائمة اختيارات متعددة (Select)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    تصنيف السؤال
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                  >
                    <option value="AGRICULTURAL">نشاط زراعي وإنتاجي</option>
                    <option value="FINANCIAL">بيانات مالية وتسهيلات</option>
                    <option value="ASSETS">أصول وضمانات عينية</option>
                    <option value="GENERAL">معلومات عامة وإضافية</option>
                  </select>
                </div>
              </div>

              {formData.type === 'select' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    خيارات القائمة (اكتب كل خيار في سطر جديد)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.optionsText}
                    onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                    placeholder="قمح وخضروات&#10;موالح وفاكهة&#10;بيوت محمية وصوب&#10;إنتاج حيواني وتسمين"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  تلميح أو وصف توضيحي للمندوب (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مثال: يرجى تسجيل المساحة وفقاً لبطاقة الحيازة الرسمية"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-crobsa-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="rounded text-crobsa-600 focus:ring-crobsa-500"
                  />
                  <span>جعل هذا السؤال إلزامي ويجب الإجابة عليه لتقديم الطلب</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-crobsa-800 hover:bg-crobsa-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
                >
                  {editingQuestion ? 'حفظ التعديلات' : 'إضافة السؤال للنموذج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
