import React, { useState, useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, InstallmentCompanyStaffRole, User as UserType } from '../types';
import { 
  Plus, 
  User, 
  Mail, 
  Shield, 
  AlertCircle, 
  Percent, 
  Wallet, 
  Key, 
  Edit, 
  X, 
  Save, 
  Building2, 
  MapPin, 
  Search, 
  Filter, 
  LogIn, 
  CheckCircle2,
  Briefcase,
  Users as UsersIcon
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { 
    users, 
    createUser, 
    currentUser, 
    resetUserPassword, 
    updateUserWallet, 
    companies, 
    branches, 
    login 
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<{ id: string; amount: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    role: Role.SUPPLIER,
    staffRole: InstallmentCompanyStaffRole.CREDIT_OFFICER,
    companyId: companies[0]?.id || '',
    branchId: '',
    governorate: 'القاهرة',
    commissionRate: 0,
    walletBalance: 0
  });

  if (currentUser?.role !== Role.SUPER_ADMIN) {
    return <div className="p-8 text-center text-rose-600 font-bold">غير مصرح لك بالدخول لهذه الصفحة</div>;
  }

  const roleLabels: Record<string, string> = {
    [Role.SUPER_ADMIN]: 'مدير النظام العام',
    [Role.ADMIN]: 'مسؤول العمليات والاعتمادات',
    [Role.INSTALLMENT_COMPANY]: 'المدير التنفيذي لشركة التقسيط',
    [Role.BRANCH_MANAGER]: 'مدير فرع شركة التقسيط',
    [Role.COMPANY_EMPLOYEE]: 'موظف شركة التقسيط (فحص / تحصيل)',
    [Role.SUPPLIER]: 'مورد معتمد / تاجر',
    [Role.SALESMAN]: 'موظف البيع (رافع الطلبات)'
  };

  const isCompanyRole = formData.role === Role.INSTALLMENT_COMPANY || 
                        formData.role === Role.BRANCH_MANAGER || 
                        formData.role === Role.COMPANY_EMPLOYEE;
  
  const isBranchRole = formData.role === Role.BRANCH_MANAGER || 
                       formData.role === Role.COMPANY_EMPLOYEE;

  const isSupplierOrSalesman = formData.role === Role.SUPPLIER || formData.role === Role.SALESMAN;
  const isSupplier = formData.role === Role.SUPPLIER;

  // Filtered branches based on selected company
  const availableBranchesForCompany = useMemo(() => {
    return branches.filter(b => b.companyId === formData.companyId);
  }, [branches, formData.companyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBranch = branches.find(b => b.id === formData.branchId);
    
    createUser({
      ...formData,
      branchName: selectedBranch?.name || undefined,
      governorate: selectedBranch?.governorate || formData.governorate,
      permissions: isCompanyRole ? ['view_clients', 'request_access', 'ai_analysis', 'approve_apps'] : undefined
    });

    setShowForm(false);
    setFormData({ 
      name: '', 
      username: '',
      email: '', 
      role: Role.SUPPLIER, 
      staffRole: InstallmentCompanyStaffRole.CREDIT_OFFICER,
      companyId: companies[0]?.id || '',
      branchId: '',
      governorate: 'القاهرة',
      commissionRate: 0, 
      walletBalance: 0 
    });
  };

  const handleWalletUpdate = () => {
    if (editingWallet) {
      updateUserWallet(editingWallet.id, editingWallet.amount);
      setEditingWallet(null);
    }
  };

  const getCompanyDisplayName = (user: UserType) => {
    if (user.companyId) {
      const comp = companies.find(c => c.id === user.companyId);
      return comp ? comp.name : 'شركة تقسيط';
    }
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
      return 'منظومة كروبسا مصر';
    }
    if (user.role === Role.SUPPLIER || user.role === Role.SALESMAN) {
      return 'شبكة التجار والموردين';
    }
    return '-';
  };

  // Filtered users list
  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
    if (companyFilter !== 'ALL' && user.companyId !== companyFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = user.name.toLowerCase().includes(term);
      const matchEmail = user.email.toLowerCase().includes(term);
      const matchUsername = user.username?.toLowerCase().includes(term);
      const matchBranch = user.branchName?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchUsername && !matchBranch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>إدارة المستخدمين والصلاحيات</span>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
              {users.length} مستخدم
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة كافة أدوار المنصة وفصل الصلاحيات بدقة بين إدارة كروبسا، شركات التقسيط، مديري الفروع، الموظفين، والموردين.
          </p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-bold text-xs"
        >
          {showForm ? 'إلغاء' : <><Plus className="h-4 w-4" /> إضافة مستخدم جديد</>}
        </button>
      </div>

      {/* Create User Form Modal / Card */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg animate-in fade-in">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <span>إنشاء حساب مستخدم جديد وتحديد نطاق الصلاحيات</span>
          </h3>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              سيتم تعيين كلمة مرور افتراضية للمستخدم الجديد: <strong dir="ltr" className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200">123456</strong>. 
              ويمكن للمستخدم الدخول بها مباشرة أو تغييرها لاحقاً.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم الكامل *</label>
                <input 
                  type="text" required 
                  placeholder="مثال: أحمد محمد رضوان"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المستخدم (للدخول السريع) *</label>
                <input 
                  type="text" required 
                  placeholder="username_ar"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">البريد الإلكتروني *</label>
                <input 
                  type="email" required 
                  placeholder="user@example.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">الدور / مستوى الصلاحية *</label>
                <select 
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as Role})}
                >
                  {Object.values(Role).map(role => (
                    <option key={role} value={role}>{roleLabels[role] || role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company & Branch specific fields */}
            {isCompanyRole && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>شركة التقسيط التابع لها *</span>
                  </label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                    value={formData.companyId}
                    onChange={e => setFormData({...formData, companyId: e.target.value, branchId: ''})}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {isBranchRole && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      <span>الفرع المخصص *</span>
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                      value={formData.branchId}
                      onChange={e => setFormData({...formData, branchId: e.target.value})}
                    >
                      <option value="">-- اختر الفرع --</option>
                      {availableBranchesForCompany.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.governorate})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.role === Role.COMPANY_EMPLOYEE && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                      <span>التخصص الوظيفي *</span>
                    </label>
                    <select 
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white font-medium"
                      value={formData.staffRole}
                      onChange={e => setFormData({...formData, staffRole: e.target.value as any})}
                    >
                      <option value={InstallmentCompanyStaffRole.CREDIT_OFFICER}>مسؤول دراسة وفحص ائتماني</option>
                      <option value={InstallmentCompanyStaffRole.COLLECTION_AGENT}>مسؤول متابعة وتحصيل متأخرات</option>
                      <option value={InstallmentCompanyStaffRole.BRANCH_MANAGER}>مدير مساعد للفرع</option>
                      <option value={InstallmentCompanyStaffRole.LEGAL_OFFICER}>مسؤول الشؤون القانونية والعقود</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Supplier / Salesman specific fields */}
            {isSupplierOrSalesman && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة العمولة المعتمدة (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs"
                      value={formData.commissionRate}
                      onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                    />
                  </div>
                </div>

                {isSupplier && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رصيد المحفظة الافتتاحي (ج.م)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs"
                        value={formData.walletBalance}
                        onChange={e => setFormData({...formData, walletBalance: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                تأكيد إنشاء الحساب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none font-medium"
            >
              <option value="ALL">كافة الصلاحيات ({users.length})</option>
              <option value={Role.SUPER_ADMIN}>مدير النظام العام</option>
              <option value={Role.ADMIN}>مسؤول العمليات</option>
              <option value={Role.INSTALLMENT_COMPANY}>شركات التقسيط</option>
              <option value={Role.BRANCH_MANAGER}>مديرو الفروع</option>
              <option value={Role.COMPANY_EMPLOYEE}>موظفو الشركات</option>
              <option value={Role.SUPPLIER}>الموردون</option>
              <option value={Role.SALESMAN}>المناديب</option>
            </select>
          </div>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none font-medium"
          >
            <option value="ALL">كافة الشركات والجهات</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، اسم المستخدم، أو الفرع..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">المستخدم</th>
                <th className="px-4 py-3.5">الدور / الصلاحية</th>
                <th className="px-4 py-3.5">الجهة / الشركة</th>
                <th className="px-4 py-3.5">الفرع والمحافظة</th>
                <th className="px-4 py-3.5">الرصيد / العمولة</th>
                <th className="px-4 py-3.5 text-center">إجراءات وتبديل فوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const isCurrent = currentUser?.id === user.id;
                const companyName = getCompanyDisplayName(user);

                return (
                  <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-sky-50/40' : ''}`}>
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCurrent ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-full font-bold">
                                أنت هنا
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{user.username || user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        user.role === Role.SUPER_ADMIN ? 'bg-purple-100 text-purple-800 border-purple-200' : 
                        user.role === Role.ADMIN ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        user.role === Role.INSTALLMENT_COMPANY ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        user.role === Role.BRANCH_MANAGER ? 'bg-teal-100 text-teal-800 border-teal-200' :
                        user.role === Role.COMPANY_EMPLOYEE ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                        user.role === Role.SUPPLIER ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-orange-100 text-orange-800 border-orange-200'
                      }`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="px-4 py-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{companyName}</span>
                      </div>
                    </td>

                    {/* Branch & Governorate */}
                    <td className="px-4 py-4 text-slate-600">
                      {user.branchName || user.governorate ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{user.branchName || ''} {user.governorate ? `(${user.governorate})` : ''}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Commission or Wallet */}
                    <td className="px-4 py-4">
                      {user.role === Role.SUPPLIER ? (
                        editingWallet?.id === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              className="w-20 border rounded-lg px-2 py-1 text-xs" 
                              value={editingWallet.amount}
                              onChange={e => setEditingWallet({...editingWallet, amount: Number(e.target.value)})}
                            />
                            <button onClick={handleWalletUpdate} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save className="h-3.5 w-3.5"/></button>
                            <button onClick={() => setEditingWallet(null)} className="text-slate-400 hover:bg-slate-50 p-1 rounded"><X className="h-3.5 w-3.5"/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{user.walletBalance?.toLocaleString()} ج.م</span>
                            <button onClick={() => setEditingWallet({id: user.id, amount: user.walletBalance || 0})} className="text-slate-400 hover:text-blue-600 p-0.5"><Edit className="h-3 w-3"/></button>
                          </div>
                        )
                      ) : user.role === Role.SALESMAN && user.commissionRate ? (
                        <span className="font-semibold text-slate-700">{user.commissionRate}% عمولة</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions & Switch */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Instant Switch Button */}
                        {!isCurrent ? (
                          <button
                            onClick={async () => {
                              await login(user.username || user.email, 'password');
                            }}
                            className="bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-all"
                            title="تسجيل الدخول الفوري بهذا الحساب لتجربة واجهاته"
                          >
                            <LogIn className="h-3 w-3" />
                            <span>دخول بالحساب</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                            الحساب الحالي ✓
                          </span>
                        )}

                        {/* Reset Password */}
                        <button 
                          onClick={() => {
                            resetUserPassword(user.id);
                          }}
                          className="text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-rose-200 flex items-center gap-1 transition-colors"
                          title="إعادة تعيين كلمة المرور إلى 123456"
                        >
                          <Key className="h-3 w-3" />
                          <span>إعادة تعيين (123456)</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
