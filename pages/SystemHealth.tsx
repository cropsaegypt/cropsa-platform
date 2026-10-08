import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { Activity, Server, Database, Wifi, AlertTriangle } from 'lucide-react';

const serverLoadData = [
  { time: '00:00', load: 20 }, { time: '04:00', load: 15 }, 
  { time: '08:00', load: 45 }, { time: '12:00', load: 80 }, 
  { time: '16:00', load: 70 }, { time: '20:00', load: 50 }, 
  { time: '23:59', load: 30 }
];

const memoryUsageData = [
  { name: 'App Server 1', uv: 65 },
  { name: 'App Server 2', uv: 45 },
  { name: 'DB Server', uv: 80 },
  { name: 'Cache', uv: 30 },
];

const apiLatencyData = [
  { time: '1s', val: 120 }, { time: '2s', val: 132 }, 
  { time: '3s', val: 101 }, { time: '4s', val: 134 }, 
  { time: '5s', val: 90 },  { time: '6s', val: 230 }, 
  { time: '7s', val: 210 }
];

const StatBox = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1" dir="ltr">{value}</h3>
      <p className={`text-xs mt-1 ${subtext.includes('+') ? 'text-green-500' : 'text-gray-400'}`}>{subtext}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} text-white`}>
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

export const SystemHealth: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">مراقبة حالة النظام</h2>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatBox title="جهوزية الخادم" value="99.98%" subtext="آخر 30 يوم" icon={Server} color="bg-emerald-500" />
        <StatBox title="الجلسات النشطة" value="1,245" subtext="+12% عن الأمس" icon={Activity} color="bg-blue-500" />
        <StatBox title="متوسط التأخير" value="145ms" subtext="النطاق المثالي" icon={Wifi} color="bg-indigo-500" />
        <StatBox title="معدل الأخطاء" value="0.02%" subtext="3 تنبيهات خلال 24س" icon={AlertTriangle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Load Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">حمل المعالج (24 ساعة)</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serverLoadData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="load" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">استهلاك الذاكرة</h3>
          <div className="h-64" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={memoryUsageData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                 <XAxis type="number" />
                 <YAxis dataKey="name" type="category" width={100} />
                 <Tooltip />
                 <Bar dataKey="uv" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latency & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">زمن استجابة API</h3>
          <div className="h-48" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={apiLatencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Database className="h-4 w-4 ml-2" /> سجلات قاعدة البيانات
          </h3>
          <div className="space-y-4">
            <div className="flex items-start text-xs">
              <span className="text-gray-400 w-12 text-left ml-2">10:42:01</span>
              <span className="text-green-600 font-medium">اكتمال النسخ الاحتياطي بنجاح</span>
            </div>
            <div className="flex items-start text-xs">
              <span className="text-gray-400 w-12 text-left ml-2">10:30:15</span>
              <span className="text-blue-600">انتهاء عملية تحسين الفهرسة</span>
            </div>
            <div className="flex items-start text-xs">
              <span className="text-gray-400 w-12 text-left ml-2">10:15:00</span>
              <span className="text-orange-500">استخدام عالٍ لمجمع الاتصالات (85%)</span>
            </div>
            <div className="flex items-start text-xs">
              <span className="text-gray-400 w-12 text-left ml-2">09:55:22</span>
              <span className="text-gray-600">تم إنشاء ملخص العمليات اليومي</span>
            </div>
             <div className="flex items-start text-xs">
              <span className="text-gray-400 w-12 text-left ml-2">09:12:45</span>
              <span className="text-red-500">انقطاع الاتصال من المصدر 192.168.1.55</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
