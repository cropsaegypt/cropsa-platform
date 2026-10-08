import React from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface ClientSolvencyGaugeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  riskTier?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  suggestedLimit?: number;
  monthlyIncome?: number;
  monthlyObligations?: number;
  summary?: string;
  clientName?: string;
}

export const ClientSolvencyGauge: React.FC<ClientSolvencyGaugeProps> = ({
  score = 75,
  size = 'md',
  showDetails = true,
  riskTier,
  suggestedLimit,
  monthlyIncome,
  monthlyObligations,
  summary,
  clientName
}) => {
  // Normalize score
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  // Determine Tier and Theme
  let tier = riskTier;
  if (!tier) {
    if (safeScore >= 80) tier = 'LOW';
    else if (safeScore >= 65) tier = 'MODERATE';
    else if (safeScore >= 50) tier = 'HIGH';
    else tier = 'CRITICAL';
  }

  const tierMeta = {
    LOW: {
      label: 'ملاءة ممتازة (مخاطر متدنية)',
      labelEn: 'Prime Solvency (Low Risk)',
      grade: 'A+',
      color: '#059669', // Emerald
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-100 text-emerald-800'
    },
    MODERATE: {
      label: 'ملاءة مستقرة (مخاطر مقبولة)',
      labelEn: 'Stable Solvency (Moderate Risk)',
      grade: 'B',
      color: '#0284c7', // Sky Blue
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-200',
      badgeBg: 'bg-sky-100 text-sky-800'
    },
    HIGH: {
      label: 'ملاءة متوسطة (تتطلب ضامن إضافي)',
      labelEn: 'Marginal Solvency (High Risk)',
      grade: 'C',
      color: '#f59e0b', // Amber
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      badgeBg: 'bg-amber-100 text-amber-800'
    },
    CRITICAL: {
      label: 'ملاءة حرجة (مخاطر تعثر عالية)',
      labelEn: 'Critical Risk (High Default)',
      grade: 'D',
      color: '#ef4444', // Red
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      badgeBg: 'bg-rose-100 text-rose-800'
    }
  }[tier];

  // SVG Gauge calculations
  // Semi-circle radius
  const radius = size === 'sm' ? 44 : size === 'lg' ? 90 : 68;
  const strokeWidth = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const cx = radius + strokeWidth;
  const cy = radius + strokeWidth;
  const svgWidth = (radius + strokeWidth) * 2;
  const svgHeight = radius + strokeWidth * 2 + 10;

  // Circumference of semi-circle = PI * r
  const arcLength = Math.PI * radius;
  const progressOffset = arcLength - (arcLength * safeScore) / 100;

  // Needle angle: 180 (left/red) to 0 (right/green) or reversed for RTL/credit convention
  // In our Egyptian credit score: 0 = left (red), 100 = right (green)
  // Angle: -180deg (left) to 0deg (right)
  const needleAngle = -180 + (safeScore / 100) * 180;

  // DTI calculation if data available
  const dti = monthlyIncome && monthlyIncome > 0 && monthlyObligations !== undefined
    ? Math.round((monthlyObligations / monthlyIncome) * 100)
    : null;

  return (
    <div className={`rounded-2xl border ${tierMeta.borderColor} ${tierMeta.bgColor} p-4 transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-100 text-cropsa-600">
            <Sparkles className="h-4 w-4 text-sky-600 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              مؤشر الملاءة المالية بالذكاء الاصطناعي
            </h4>
            {clientName && <span className="text-[11px] text-slate-500 font-medium">{clientName}</span>}
          </div>
        </div>

        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${tierMeta.badgeBg} border border-black/5`}>
          التقييم: {tierMeta.grade}
        </span>
      </div>

      {/* Visual Gauge Meter */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          <defs>
            <linearGradient id={`gaugeGrad_${safeScore}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Track (Grey) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc (Graduated) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={`url(#gaugeGrad_${safeScore})`}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Ticks markers */}
          {[0, 25, 50, 75, 100].map(val => {
            const angle = -180 + (val / 100) * 180;
            const rad = (angle * Math.PI) / 180;
            const x1 = cx + (radius - strokeWidth / 2 - 2) * Math.cos(rad);
            const y1 = cy + (radius - strokeWidth / 2 - 2) * Math.sin(rad);
            const x2 = cx + (radius - strokeWidth / 2 - 7) * Math.cos(rad);
            const y2 = cy + (radius - strokeWidth / 2 - 7) * Math.sin(rad);
            return (
              <line
                key={val}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Center Needle & Pivot */}
          <g transform={`rotate(${needleAngle} ${cx} ${cy})`} filter="url(#needleShadow)">
            <line
              x1={cx}
              y1={cy}
              x2={cx + radius - 6}
              y2={cy}
              stroke="#0f172a"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={6} fill="#0f172a" />
            <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
          </g>
        </svg>

        {/* Score & Verdict Text */}
        <div className="text-center -mt-4 z-10">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{safeScore}</span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
          </div>
          <p className={`text-xs font-bold ${tierMeta.textColor} mt-0.5`}>
            {tierMeta.label}
          </p>
        </div>
      </div>

      {/* Details & Metrics Pill Grid */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {suggestedLimit !== undefined && (
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">الحد الائتماني الآمن</span>
                <span className="font-bold text-slate-800 text-xs">
                  {suggestedLimit.toLocaleString()} ج.م
                </span>
              </div>
            )}

            {dti !== null ? (
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">نسبة عبء الدين (DTI)</span>
                <span className={`font-bold text-xs ${dti > 45 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {dti}% {dti > 45 ? '(مرتفع)' : '(آمن)'}
                </span>
              </div>
            ) : (
              <div className="bg-white/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">موثوقية السداد</span>
                <span className="font-bold text-emerald-700 text-xs">منتظم وموثق</span>
              </div>
            )}
          </div>

          {summary && (
            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/60 p-2 rounded-lg border border-slate-100/80">
              💡 {summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
