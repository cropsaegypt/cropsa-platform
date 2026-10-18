import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { User, Role, EGYPT_GOVERNORATES } from '../types';
import { 
  Store, 
  Plus, 
  Search, 
  ShieldCheck, 
  MapPin, 
  Wallet, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  Percent,
  Trash2,
  Sparkles,
  Check,
  Mail,
  Edit3,
  Phone,
  Save,
  Copy,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  UserCheck,
  Briefcase
} from 'lucide-react';

export const SuppliersManagement: React.FC = () => {
  const { 
    currentUser, 
    users, 
    applications, 
    createUser, 
    updateUserProfile, 
    updateUserWallet, 
    resetUserPassword,
    deleteUser,
    language 
  } = useStore();

  const isAr = language === 'ar';
  const suppliers = users.filter(u => u.role === Role.SUPPLIER);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGov, setSelectedGov] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<User | null>(null);
  const [walletModalSupplier, setWalletModalSupplier] = useState<User | null>(null);
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<number>(0);
  const [walletAdjustType, setWalletAdjustType] = useState<'add' | 'deduct' | 'set'>('add');
  const [deletingSupplier, setDeletingSupplier] = useState<User | null>(null);

  // Add Supplier Form State
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    governorate: 'القاهرة',
    commissionRate: 5,
    walletBalance: 0
  });

  // Edit Supplier Form State
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    governorate: 'القاهرة',
    commissionRate: 5,
    walletBalance: 0
  });

  // Loading & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(isAr ? 'تم نسخ البيانات إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const totalWalletBalances = suppliers.reduce((acc, s) => acc + (s.walletBalance || 0), 0);
  const totalSupplierApps = applications.filter(a => suppliers.some(s => s.id === a.supplierId)).length;
  const avgCommission = suppliers.length > 0 
    ? (suppliers.reduce((acc, s) => acc + (s.commissionRate || 0), 0) / suppliers.length).toFixed(1)
    : '0';

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery);

    const matchesGov = selectedGov === 'ALL' || s.governorate === selectedGov;
    return matchesSearch && matchesGov;
  });

  // Handle Add Supplier
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.password.trim()) {
      showToast(isAr ? 'يرجى استكمال الحقول الإلزامية المطلوبة' : 'Please complete required fields');
      return;
    }

    setIsSaving(true);
    try {
      await createUser({
        name: addForm.name.trim(),
        username: addForm.username.trim(),
        password: addForm.password.trim(),
        email: addForm.email.trim() || `${addForm.username.trim()}@cropsa.net`,
        phone: addForm.phone.trim(),
        governorate: addForm.governorate,
        role: Role.SUPPLIER,
        commissionRate: Number(addForm.commissionRate) || 0,
        walletBalance: Number(addForm.walletBalance) || 0,
        permissions: ['create_app', 'view_clients', 'manage_sales', 'request_payout']
      });

      setShowAddModal(false);
      setAddForm({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        governorate: 'القاهرة',
        commissionRate: 5,
        walletBalance: 0
      });
      showToast(isAr ? 'تم تسجيل المورد الجديد بنجاح وحفظ بيانات دخوله' : 'Supplier created successfully');
    } catch (err) {
      console.error(err);
      showToast(isAr ? 'حدث خطأ أثناء إضافة المورد' : 'Error creating supplier');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sup: User) => {
    setEditingSupplier(sup);
    setEditForm({
      name: sup.name || '',
      username: sup.username || sup.email?.split('@')[0] || '',
      password: sup.password || '',
      email: sup.email || '',
      phone: sup.phone || '',
      governorate: sup.governorate || 'القاهرة',
      commissionRate: sup.commissionRate !== undefined ? sup.commissionRate : 5,
      walletBalance: sup.walletBalance || 0
    });
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    setIsSaving(true);
    try {
      const updates: Partial<User> = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim() || `${editForm.username.trim()}@cropsa.net`,
        phone: editForm.phone.trim(),
        governorate: editForm.governorate,
        commissionRate: Number(editForm.commissionRate) || 0,
        walletBalance: Number(editForm.walletBalance) || 0
      };

      if (editForm.password.trim()) {
        updates.password = editForm.password.trim();
        updates.mustChangePassword = false;
      }

      await updateUserProfile(editingSupplier.id, updates);
      setEditingSupplier(null);
      showToast(isAr ? 'تم تحديث بيانات المورد والحساب بنجاح' : 'Supplier updated successfully');
    } catch (err) {
      console.error(err);
      showToast(isAr ? 'حدث خطأ أثناء تعديل بيانات المورد' : 'Error updating supplier');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Wallet Adjustment
  const handleSaveWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalSupplier) return;

    setIsSaving(true);
    try {
      const current = walletModalSupplier.walletBalance || 0;
      let newBalance = current;

      if (walletAdjustType === 'add') {
        newBalance = current + Number(walletAdjustAmount);
      } else if (walletAdjustType === 'deduct') {
        newBalance = Math.max(0, current - Number(walletAdjustAmount));
      } else if (walletAdjustType === 'set') {
        newBalance = Math.max(0, Number(walletAdjustAmount));
      }

      await updateUserWallet(walletModalSupplier.id, newBalance);
      setWalletModalSupplier(null);
      setWalletAdjustAmount(0);
      showToast(isAr ? `تم تحديث رصيد محفظة المورد إلى ${newBalance.toLocaleString()} ج.م بنجاح` : 'Wallet updated successfully');
    } catch (err) {
      console.error(err);
      showToast(isAr ? 'حدث خطأ أثناء تحديث المحفظة' : 'Error updating wallet');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    setIsSaving(true);
    try {
      await deleteUser(deletingSupplier.id);
      setDeletingSupplier(null);
      showToast(isAr ? 'تم حذف المورد من المنظومة بنجاح' : 'Supplier deleted successfully');
    } catch (err) {
      console.error(err);
      showToast(isAr ? 'حدث خطأ أثناء حذف المورد' : 'Error deleting supplier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-12 -top-12 w-36 h-36 rounded-full bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                <span>شبكة الموردين والتجار المعتمدين</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-300">
                إدارة مركزية لمدير النظام
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة الموردين والتجار والحسابات المالية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحكم كامل في شبكة التجار والموردين: إضافة موردين جدد، إدارة بيانات تسجيل الدخول (اليوزر والباسورد)، تعديل نسب العمولات، ومتابعة وضبط أرصدة المحافظ المالية.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-crobsa-700 hover:bg-crobsa-800 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:shadow-crobsa-700/30 active:scale-95 border border-white/20"
            >
              <Plus className="h-5 w-5" />
              <span>إضافة مورد جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الموردين والتجار</span>
            <div className="text-2xl font-black text-slate-900">{suppliers.length}</div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">حسابات نشطة بالمنظومة</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي أرصدة المحافظ</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {totalWalletBalances.toLocaleString()} <span className="text-xs font-bold text-slate-600">ج.م</span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold mt-1 inline-block">أرباح وعمولات مستحقة</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي المعاملات والطلبات</span>
            <div className="text-2xl font-black text-purple-700">{totalSupplierApps}</div>
            <span className="text-[11px] text-slate-400 font-bold mt-1 inline-block">طلبات مرفوعة عبر المنصة</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">متوسط نسبة العمولة</span>
            <div className="text-2xl font-black text-amber-600 font-mono">{avgCommission}%</div>
            <span className="text-[11px] text-slate-400 font-bold mt-1 inline-block">لكل عملية بيع ناجحة</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Percent className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، البريد، أو الهاتف..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 shrink-0">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>المحافظة:</span>
          </div>
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">كافة محافظات مصر ({suppliers.length})</option>
            {EGYPT_GOVERNORATES.map(gov => (
              <option key={gov} value={gov}>
                {gov} ({suppliers.filter(s => s.governorate === gov).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-black text-slate-800 mb-1">لا يوجد موردين مطابقين للبحث</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
              يمكنك تغيير معايير البحث أو إضافة مورد جديد الآن للشبكة التابعة لكروبسا
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>تسجيل مورد جديد</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">المورد / المتجر</th>
                  <th className="py-3.5 px-4">بيانات الحساب للدخول</th>
                  <th className="py-3.5 px-4">المحافظة والتواصل</th>
                  <th className="py-3.5 px-4">نسبة العمولة</th>
                  <th className="py-3.5 px-4">رصيد المحفظة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSuppliers.map((sup) => {
                  const supAppsCount = applications.filter(a => a.supplierId === sup.id).length;
                  const displayUsername = sup.username || sup.email?.split('@')[0] || `sup_${sup.id.slice(-4)}`;

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm border border-amber-400/30">
                            {sup.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-xs sm:text-sm">{sup.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <span>المعاملات: {supAppsCount}</span>
                              <span>•</span>
                              <span>ID: {sup.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Credentials */}
                      <td className="py-4 px-4 font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            <span className="text-slate-400 font-sans">اليوزر:</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-sky-800">{displayUsername}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(displayUsername, `user_${sup.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="نسخ اسم المستخدم"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="text-slate-400 font-sans">الباسورد:</span>
                            <span>{sup.password || '••••••••'}</span>
                            {sup.password && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(sup.password!, `pass_${sup.id}`)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                                title="نسخ كلمة المرور"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gov & Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-[11px]">
                          <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-sky-50 text-sky-800 border border-sky-100">
                            {sup.governorate || 'القاهرة'}
                          </span>
                          {sup.phone && (
                            <div className="text-slate-600 font-mono flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{sup.phone}</span>
                            </div>
                          )}
                          {sup.email && (
                            <div className="text-slate-400 text-[10px] truncate max-w-[150px]">
                              {sup.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Commission */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-800 border border-amber-200/60 font-mono">
                          {sup.commissionRate !== undefined ? sup.commissionRate : 5}%
                        </span>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-emerald-700 font-mono">
                            {(sup.walletBalance || 0).toLocaleString()} <span className="text-[10px] font-bold">ج.م</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setWalletModalSupplier(sup);
                              setWalletAdjustAmount(0);
                              setWalletAdjustType('add');
                            }}
                            className="p-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="تعديل رصيد المحفظة"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Details & Credentials */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sup)}
                            className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                            title="تعديل المورد وبيانات الدخول"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>تعديل</span>
                          </button>

                          {/* Quick Wallet Adjust */}
                          <button
                            type="button"
                            onClick={() => {
                              setWalletModalSupplier(sup);
                              setWalletAdjustAmount(0);
                              setWalletAdjustType('add');
                            }}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                            title="تعديل المحفظة"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            <span>المحفظة</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingSupplier(sup)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs"
                            title="حذف المورد"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SUPPLIER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">تسجيل مورد / تاجر جديد في المنظومة</h3>
                  <p className="text-[11px] text-slate-300">قم بتعيين بيانات التاجر وبيانات الدخول الخاصة به مباشرة</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                
                {/* Basic Info */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المورد / الشركة التجارية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="مثال: شركة النصر للمعدات الزراعية"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المحافظة <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={addForm.governorate}
                      onChange={(e) => setAddForm({ ...addForm, governorate: e.target.value })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                    >
                      {EGYPT_GOVERNORATES.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم هاتف التواصل <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      placeholder="010XXXXXXXX"
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Credentials Section */}
                <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/70 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-sky-900 border-b border-sky-100 pb-2">
                    <Lock className="h-4 w-4 text-sky-600" />
                    <span>بيانات تسجيل الدخول لحساب المورد</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اسم المستخدم (اليوزر) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addForm.username}
                        onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                        placeholder="nasr_agro"
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        كلمة المرور <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        placeholder="Cropsa@2026"
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني الرسمي
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      placeholder="info@nasragro.com"
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Financial Rates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      نسبة العمولة (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={addForm.commissionRate}
                      onChange={(e) => setAddForm({ ...addForm, commissionRate: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رصيد المحفظة الافتتاحي (ج.م)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={addForm.walletBalance}
                      onChange={(e) => setAddForm({ ...addForm, walletBalance: Number(e.target.value) })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                    />
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'تسجيل المورد'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SUPPLIER & CREDENTIALS */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400 border border-white/10">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">تعديل بيانات المورد وحساب الدخول</h3>
                  <p className="text-[11px] text-slate-300">تعديل الاسم واليوزر وكلمة المرور والنسب في نفس المكان</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingSupplier(null)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المورد / المتجر <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                  required
                />
              </div>

              {/* Login Credentials in the exact same place! */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/70 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-900 border-b border-sky-100 pb-2">
                  <Lock className="h-4 w-4 text-sky-600" />
                  <span>بيانات حساب تسجيل الدخول (اليوزر والباسورد)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المستخدم للدخول <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="text"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="اتركها فارغة بدون تغيير"
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المحافظة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.governorate}
                    onChange={(e) => setEditForm({ ...editForm, governorate: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نسبة العمولة (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={editForm.commissionRate}
                    onChange={(e) => setEditForm({ ...editForm, commissionRate: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رصيد المحفظة (ج.م)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.walletBalance}
                    onChange={(e) => setEditForm({ ...editForm, walletBalance: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Save className="h-4 w-4 text-sky-400" />
                  <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST WALLET BALANCE */}
      {walletModalSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col">
            
            <div className="bg-gradient-to-r from-emerald-900 to-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">تعديل رصيد محفظة المورد</h3>
                  <p className="text-[11px] text-slate-300">{walletModalSupplier.name}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setWalletModalSupplier(null)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWalletAdjustment} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">الرصيد الحالي:</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {(walletModalSupplier.walletBalance || 0).toLocaleString()} ج.م
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع العملية:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletAdjustType('add')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      walletAdjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span>إيداع (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAdjustType('deduct')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      walletAdjustType === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    <span>خصم (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalletAdjustType('set')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      walletAdjustType === 'set'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>تعيين (=)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ (ج.م) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={walletAdjustAmount || ''}
                  onChange={(e) => setWalletAdjustAmount(Number(e.target.value))}
                  placeholder="أدخل المبلغ..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWalletModalSupplier(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving || walletAdjustAmount <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSaving ? 'جاري التنفيذ...' : 'تأكيد التعديل'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">تأكيد حذف المورد</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف المورد <span className="font-bold text-slate-800 font-sans">"{deletingSupplier.name}"</span>؟ سيتم إيقاف حسابه فورياً ولن يتمكن من الدخول للمنظومة.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isSaving ? 'جاري الحذف...' : 'نعم، حذف المورد'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
