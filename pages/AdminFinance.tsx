import React, { useMemo } from 'react';
import { useStore } from '../context/Store';
import { Role, ApplicationStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Percent, TrendingUp, Building, Users, Wallet } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AdminFinance: React.FC = () => {
  const { applications, users, transactions, withdrawalRequests, currentUser } = useStore();

  if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPER_ADMIN) return <div>Access Denied</div>;

  const stats = useMemo(() => {
    const approvedApps = applications.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED);
    
    // Total Volume
    const totalApprovedVolume = approvedApps.reduce((acc, a) => acc + (a.approvedAmount || 0), 0);
    
    // Total Commission (from transactions type 'COMMISSION')
    const totalCommission = transactions
        .filter(t => t.type === 'COMMISSION')
        .reduce((acc, t) => acc + t.amount, 0);

    // Analytics per Company
    const companyStats: Record<string, { name: string, volume: number, count: number }> = {};
    users.filter(u => u.role === Role.INSTALLMENT_COMPANY).forEach(c => {
        companyStats[c.id] = { name: c.name, volume: 0, count: 0 };
    });

    approvedApps.forEach(app => {
        const companyId = app.reviewedBy || app.assignedCompanyIds[0];
        if (companyId && companyStats[companyId]) {
            companyStats[companyId].volume += (app.approvedAmount || 0);
            companyStats[companyId].count += 1;
        }
    });

    const companyData = Object.values(companyStats).sort((a,b) => b.volume - a.volume);
    const topByVolume = [...companyData].sort((a,b) => b.volume - a.volume)[0];
    const topByCount = [...companyData].sort((a,b) => b.count - a.count)[0];

    // Supplier & Salesman Analytics
    const supplierRanking = users
        .filter(u => u.role === Role.SUPPLIER || u.role === Role.SALESMAN)
        .map(u => {
           const userApps = applications.filter(app => app.submittedBy === u.id);
           const approvedUserApps = userApps.filter(a => a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.AMOUNT_TRANSFERRED);
           
           const totalVolume = approvedUserApps.reduce((sum, a) => sum + (a.approvedAmount || 0), 0);
           const usedVolume = approvedUserApps.reduce((sum, a) => sum + a.usedAmount, 0);
           
           // Available (Customer Wallet) = Approved - Used
           const availableToWithdraw = totalVolume - usedVolume;
           
           // Withdrawn (from Withdrawal Requests)
           const withdrawn = withdrawalRequests
               .filter(w => w.userId === u.id && w.status === 'APPROVED')
               .reduce((sum, w) => sum + w.amount, 0);

           return {
             id: u.id,
             name: u.name,
             role: u.role,
             totalApps: userApps.length,
             approvedAppsCount: approvedUserApps.length,
             totalVolume,
             availableToWithdraw,
             withdrawn,
             walletBalance: u.walletBalance || 0 // Cropsa Credit
           };
        })
        .sort((a, b) => b.totalApps - a.totalApps);

    // Supplier Cards Data
    const totalSuppliers = users.filter(u => u.role === Role.SUPPLIER).length;
    const totalSalesmen = users.filter(u => u.role === Role.SALESMAN).length;
    const totalCropsaWallets = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    const totalWithdrawn = supplierRanking.reduce((sum, s) => sum + s.withdrawn, 0);

    return { totalApprovedVolume, totalCommission, companyData, topByVolume, topByCount, supplierRanking, totalSuppliers, totalSalesmen, totalCropsaWallets, totalWithdrawn };
  }, [applications, users, transactions, withdrawalRequests]);

  return (
    <div className="space-y-12">
        <h2 className="text-2xl font-bold text-gray-900">التحليلات المالية</h2>

        {/* Global Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">إجمالي التمويل المعتمد</p>
                        <h3 className="text-2xl font-bold text-blue-600">{stats.totalApprovedVolume.toLocaleString()} ج.م</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><DollarSign className="h-6 w-6"/></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">إجمالي العمولات (كروبسا)</p>
                        <h3 className="text-2xl font-bold text-emerald-600">{stats.totalCommission.toLocaleString()} ج.م</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Percent className="h-6 w-6"/></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">الأكبر حجماً (تمويل)</p>
                        <h3 className="text-lg font-bold text-gray-800">{stats.topByVolume?.name || '-'}</h3>
                        <p className="text-xs text-gray-400">{stats.topByVolume?.volume.toLocaleString()} ج.م</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><TrendingUp className="h-6 w-6"/></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm mb-1">الأكثر نشاطاً (عدد)</p>
                        <h3 className="text-lg font-bold text-gray-800">{stats.topByCount?.name || '-'}</h3>
                        <p className="text-xs text-gray-400">{stats.topByCount?.count} طلب</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Building className="h-6 w-6"/></div>
                </div>
            </div>
        </div>

        {/* Suppliers Analytics Section */}
        <div className="border-t pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="h-5 w-5 ml-2 text-blue-600" />
                تحليلات الموردين والمندوبين
            </h3>
            
            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-1">عدد الموردين</p>
                    <p className="text-xl font-bold text-slate-800">{stats.totalSuppliers}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-1">عدد المندوبين</p>
                    <p className="text-xl font-bold text-slate-800">{stats.totalSalesmen}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-1">أرصدة محافظ كروبسا (Credit)</p>
                    <p className="text-xl font-bold text-blue-600">{stats.totalCropsaWallets.toLocaleString()} ج.م</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-1">إجمالي المسحوبات (Cashout)</p>
                    <p className="text-xl font-bold text-emerald-600">{stats.totalWithdrawn.toLocaleString()} ج.م</p>
                </div>
            </div>

            {/* Detailed Ranking Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">الاسم</th>
                            <th className="px-6 py-3">الدور</th>
                            <th className="px-6 py-3">إجمالي الطلبات</th>
                            <th className="px-6 py-3">حجم التمويل (ج.م)</th>
                            <th className="px-6 py-3 text-blue-600">رصيد كروبسا (حد)</th>
                            <th className="px-6 py-3 text-emerald-600">متاح للسحب (أرباح)</th>
                            <th className="px-6 py-3 text-gray-600">تم سحبه</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {stats.supplierRanking.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-xs">{user.role === Role.SUPPLIER ? 'مورد' : 'مندوب'}</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold">{user.totalApps}</span> 
                                    <span className="text-xs text-gray-400 mx-1">({user.approvedAppsCount} مقبول)</span>
                                </td>
                                <td className="px-6 py-4 font-mono">{user.totalVolume.toLocaleString()}</td>
                                <td className="px-6 py-4 font-bold text-blue-700">{user.walletBalance.toLocaleString()}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">{user.availableToWithdraw.toLocaleString()}</td>
                                <td className="px-6 py-4 text-gray-500">{user.withdrawn.toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Company Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-8 border-t">
            {/* Volume Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">حجم التمويل حسب شركة التقسيط</h3>
                <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.companyData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="الحجم (ج.م)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">توزيع عدد الطلبات المقبولة</h3>
                <div className="h-80" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.companyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="name"
                            >
                                {stats.companyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};
