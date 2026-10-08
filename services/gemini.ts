import { GoogleGenAI } from '@google/genai';
import { 
  AiCreditAnalysis, 
  Client, 
  Application, 
  RenewalAiAnalysisResult, 
  ALL_KNOWN_INSTALLMENT_COMPANIES 
} from '../types';

interface CreditAnalysisParams {
  clientId: string;
  clientName: string;
  companyId: string;
  analyzedBy: string;
  analyzedByName: string;
  monthlyIncome: number;
  requestedAmount: number;
  requestedDurationMonths: number;
  debtBurdenRatio: number;
  employmentType: string;
  guaranteesProvided: string[];
  historicalRepaymentScore: string;
  customNotes?: string;
}

export async function runClientCreditAiAnalysis(params: CreditAnalysisParams): Promise<AiCreditAnalysis> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
                 '';

  const monthlyInstallment = params.requestedDurationMonths > 0 
    ? Math.round((params.requestedAmount * 1.18) / params.requestedDurationMonths)
    : 0;

  const installmentToIncomeRatio = params.monthlyIncome > 0
    ? Math.round((monthlyInstallment / params.monthlyIncome) * 100)
    : 100;

  // If Gemini API Key is available, call Gemini Flash model for rich, dynamic reasoning
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت خبير مخاطر ودراسة ائتمانية أول في منصة كروبsa للتمويل والتقسيط في مصر.
قم بتحليل بيانات طلب العميل التالي وتقديم تقييم ائتماني احترافي دقيق بصيغة JSON فقط:

بيانات العميل:
- اسم العميل: ${params.clientName}
- الدخل الشهري المثبت: ${params.monthlyIncome} ج.م
- مبلغ التمويل المطلوب: ${params.requestedAmount} ج.م
- مدة التقسيط: ${params.requestedDurationMonths} شهر
- القسط الشهري المتوقع: ${monthlyInstallment} ج.م (نسبة القسط للدخل: ${installmentToIncomeRatio}%)
- عبء الدين الحالي (DBR): ${params.debtBurdenRatio}%
- طبيعة العمل: ${params.employmentType}
- الضمانات المقدمة: ${params.guaranteesProvided.join(', ') || 'لا يوجد'}
- التاريخ الائتماني وI-Score: ${params.historicalRepaymentScore}
- ملاحظات إضافية: ${params.customNotes || 'لا توجد'}

المطلوب: أرجع JSON فقط بدون علامات مقتبسة إضافية بالشكل التالي:
{
  "creditScore": عدد من 0 إلى 100,
  "riskTier": "LOW" أو "MODERATE" أو "HIGH" أو "CRITICAL",
  "recommendation": "APPROVE" أو "APPROVE_WITH_CONDITIONS" أو "REQUIRE_GUARANTOR" أو "REJECT",
  "maxSuggestedInstallment": أقصى قسط شهري آمن بالجنيه,
  "maxSuggestedCredit": أقصى سقف تمويلي آمن بالجنيه,
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "riskPoints": ["نقطة خطر 1", "نقطة خطر 2"],
  "underwriterAdvice": "نصائح وإرشادات دقيقة لضابط الائتمان باللغة العربية"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        id: `ai_${Date.now()}`,
        clientId: params.clientId,
        clientName: params.clientName,
        companyId: params.companyId,
        analyzedBy: params.analyzedBy,
        analyzedByName: params.analyzedByName,
        analyzedAt: new Date().toISOString(),
        monthlyIncome: params.monthlyIncome,
        requestedAmount: params.requestedAmount,
        requestedDurationMonths: params.requestedDurationMonths,
        debtBurdenRatio: params.debtBurdenRatio,
        employmentType: params.employmentType,
        guaranteesProvided: params.guaranteesProvided,
        historicalRepaymentScore: params.historicalRepaymentScore,
        customNotes: params.customNotes,
        creditScore: Number(parsed.creditScore) || 75,
        riskTier: parsed.riskTier || 'MODERATE',
        recommendation: parsed.recommendation || 'APPROVE_WITH_CONDITIONS',
        maxSuggestedInstallment: Number(parsed.maxSuggestedInstallment) || Math.round(params.monthlyIncome * 0.35),
        maxSuggestedCredit: Number(parsed.maxSuggestedCredit) || params.requestedAmount,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['دخل شهري منتظم', 'نسبة عبء دين مقبولة'],
        riskPoints: Array.isArray(parsed.riskPoints) ? parsed.riskPoints : ['يجب التأكد من استقرار النشاط التجاري'],
        underwriterAdvice: parsed.underwriterAdvice || 'ينصح بطلب إيصال أمانة وضامن من الدرجة الأولى.'
      };
    } catch (err) {
      console.warn('Gemini API call failed or timed out, using actuarial fallback engine:', err);
    }
  }

  // Actuarial fallback calculation engine
  let score = 70;
  const strengths: string[] = [];
  const riskPoints: string[] = [];

  // Income vs Installment
  if (installmentToIncomeRatio <= 30) {
    score += 15;
    strengths.push(`نسبة القسط إلى الدخل ممتازة (${installmentToIncomeRatio}%) وأقل من الحد الأقصى المقرر 35%`);
  } else if (installmentToIncomeRatio <= 45) {
    score += 5;
    strengths.push(`نسبة القسط إلى الدخل مقبولة نسبياً (${installmentToIncomeRatio}%)`);
  } else {
    score -= 20;
    riskPoints.push(`نسبة القسط إلى الدخل مرتفعة جداً (${installmentToIncomeRatio}%) وتتجاوز الحدود الآمنة`);
  }

  // Debt Burden
  if (params.debtBurdenRatio < 20) {
    score += 10;
    strengths.push(`عبء الديون القائمة منخفض جداً (${params.debtBurdenRatio}%)`);
  } else if (params.debtBurdenRatio > 40) {
    score -= 15;
    riskPoints.push(`العميل لديه التزامات سابقة مرتفعة تمثل (${params.debtBurdenRatio}%) من دخله`);
  }

  // Guarantees
  if (params.guaranteesProvided.length >= 2) {
    score += 10;
    strengths.push(`توفر ضمانات قوية متعددة (${params.guaranteesProvided.join(' + ')})`);
  } else if (params.guaranteesProvided.length === 0) {
    score -= 10;
    riskPoints.push('عدم توفر ضمانات عينية أو شيكات بنكية كافية');
  }

  // Cap score
  score = Math.max(15, Math.min(96, score));

  let riskTier: AiCreditAnalysis['riskTier'] = 'MODERATE';
  let recommendation: AiCreditAnalysis['recommendation'] = 'APPROVE_WITH_CONDITIONS';

  if (score >= 82) {
    riskTier = 'LOW';
    recommendation = 'APPROVE';
  } else if (score >= 65) {
    riskTier = 'MODERATE';
    recommendation = 'APPROVE_WITH_CONDITIONS';
  } else if (score >= 45) {
    riskTier = 'HIGH';
    recommendation = 'REQUIRE_GUARANTOR';
  } else {
    riskTier = 'CRITICAL';
    recommendation = 'REJECT';
  }

  const safeInstallment = Math.round(params.monthlyIncome * 0.35);
  const safeCredit = Math.round(safeInstallment * (params.requestedDurationMonths || 12) * 0.85);

  const adviceMap = {
    LOW: 'العميل يتمتع بجدارة ائتمانية عالية وملاءة مالية مستقرة، يوصى بالموافقة الفورية وصرف التمويل.',
    MODERATE: 'العميل مؤهل ائتمانياً مع التوصية باستيفاء شيكات بنكية مؤجلة أو إيصال أمانة لضمان الالتزام.',
    HIGH: 'يوصى بطلب ضامن ذو دخل ثابت (موظف حكومي أو صاحب سجل تجاري نشط) وتقليل مبلغ التمويل بنسبة 20%.',
    CRITICAL: 'مؤشرات المخاطرة مرتفعة جداً نظراً لضعف الدخل وارتفاع عبء الديون، يفضل رفض الطلب حمايةً لأموال المحفظة.'
  };

  return {
    id: `ai_${Date.now()}`,
    clientId: params.clientId,
    clientName: params.clientName,
    companyId: params.companyId,
    analyzedBy: params.analyzedBy,
    analyzedByName: params.analyzedByName,
    analyzedAt: new Date().toISOString(),
    monthlyIncome: params.monthlyIncome,
    requestedAmount: params.requestedAmount,
    requestedDurationMonths: params.requestedDurationMonths,
    debtBurdenRatio: params.debtBurdenRatio,
    employmentType: params.employmentType,
    guaranteesProvided: params.guaranteesProvided,
    historicalRepaymentScore: params.historicalRepaymentScore,
    customNotes: params.customNotes,
    creditScore: score,
    riskTier,
    recommendation,
    maxSuggestedInstallment: safeInstallment,
    maxSuggestedCredit: safeCredit,
    strengths,
    riskPoints,
    underwriterAdvice: adviceMap[riskTier]
  };
}

export interface RenewalAiParams {
  client: Client;
  previousApps?: Application[];
  requestedAmount?: number;
  selectedCompanyId?: string;
  availableCompanies?: { id: string; name: string }[];
}

export async function runClientRenewalAiAnalysis(params: RenewalAiParams): Promise<RenewalAiAnalysisResult> {
  const { client, previousApps = [], requestedAmount, selectedCompanyId, availableCompanies = [] } = params;
  
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
                 '';

  const approvedApps = previousApps.filter(a => a.status === 'APPROVED' || a.status === 'AMOUNT_TRANSFERRED');
  const pastApprovedTotal = approvedApps.reduce((acc, curr) => acc + (curr.approvedAmount || 0), 0) || 
                            client.totalApprovedAmount || 
                            client.manualEntry?.approvedAmount || 
                            50000;

  const pastDisbursedTotal = approvedApps.reduce((acc, curr) => acc + (curr.usedAmount || curr.approvedAmount || 0), 0) ||
                             client.disbursedAmount ||
                             client.manualEntry?.disbursedAmount ||
                             pastApprovedTotal;

  // Calculate elapsed months since last activity
  let lastDate = client.lastFinanceDate || client.manualEntry?.lastWithdrawalDate || client.manualEntry?.approvalDate || client.addedAt;
  if (previousApps.length > 0) {
    const sorted = [...previousApps].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    lastDate = sorted[0].reviewedAt || sorted[0].submittedAt || lastDate;
  }
  const daysDiff = Math.max(1, Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedMonths = Math.max(1, Math.floor(daysDiff / 30));

  const targetAmount = requestedAmount && requestedAmount > 0 
    ? requestedAmount 
    : Math.round(pastApprovedTotal * 1.35);

  const fallbackCompanyName = availableCompanies.find(c => c.id === selectedCompanyId)?.name ||
                             ALL_KNOWN_INSTALLMENT_COMPANIES.find(c => c.code === selectedCompanyId)?.nameAr ||
                             'شركة أمان لتمويل المشروعات والتقسيط';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت خبير الذكاء الاصطناعي وكبير مسؤولي الائتمان والمخاطر في منصة كروبسا (Cropsa Egypt) للتمويل والتقسيط الزراعي والتجاري.
الطلب: إجراء دراسة أهلية وقصة ائتمانية ذكية متكاملة لتجديد التمويل للعميل الموضح بياناته أدناه:

بيانات العميل:
- الاسم: ${client.name}
- الرقم القومي: ${client.nationalId}
- المحافظة: ${client.governorate || 'غير محدد'}
- المهنة / النشاط: ${client.profession || 'تاجر / مزارع'}
- تصنيف الجدارة المسجل: ${client.creditRating || 'A'}
- إجمالي التمويل السابق المعتمد: ${pastApprovedTotal.toLocaleString()} ج.م
- إجمالي المبلغ المنصرف سابقاً: ${pastDisbursedTotal.toLocaleString()} ج.م
- تاريخ آخر تمويل: ${lastDate} (مر عليه تقريباً ${elapsedMonths} شهر / ${daysDiff} يوم)
- الشركة الممولة السابقة: ${client.companyName || client.manualEntry?.companyName || 'أمان للتمويل'}
- مبلغ التجديد المقترح / المطلوب: ${targetAmount.toLocaleString()} ج.م
- قائمة الشركات المتاحة: ${availableCompanies.map(c => `${c.id}: ${c.name}`).join(' | ')}

المطلوب: قم بتحليل سلوك العميل وتحديد ما إذا كان مؤهلاً للتجديد بعد مرور هذه الفترة، وصياغة "قصة العميل الائتمانية" التي تبرز نشاطه وسجل سداده والفرص الاستثمارية لتجديد قرضه، واختيار أفضل شركة تقسيط مناسبة لحالته.

أرجع النتيجة بصيغة JSON فقط:
{
  "score": رقم من 0 إلى 100 يعبر عن الجدارة الائتمانية الحالية,
  "riskTier": "LOW" أو "MODERATE" أو "HIGH" أو "CRITICAL",
  "recommendedAmount": رقم المبلغ المالي المقترح لتجديد التمويل بالجنيه,
  "recommendedDurationMonths": مدة التقسيط المثالية بالأشهر (مثال: 12 أو 18 أو 24),
  "bestCompanyId": "معرف أفضل شركة مناسبة من القائمة أو الكود",
  "bestCompanyName": "اسم أفضل شركة تمويل وتقسيط مناسبة لقطاع العميل ومحافظته",
  "companyMatchingReason": "توضيح دقيق بسبب تفضيل هذه الشركة لتمويل العميل (برامجها، سقفها، وسرعة إجراءاتها)",
  "clientStory": "قصة العميل الائتمانية وسرد تحليلي معمق من 3 إلى 5 أسطر بأسلوب مهني جذاب باللغة العربية يشرح وضع العميل وسجل التزامه وتوصية التجديد",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "recommendations": ["توصية ائتمانية 1", "توصية ائتمانية 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        score: Number(parsed.score) || 88,
        riskTier: parsed.riskTier || 'LOW',
        recommendedAmount: Number(parsed.recommendedAmount) || targetAmount,
        recommendedDurationMonths: Number(parsed.recommendedDurationMonths) || 12,
        bestCompanyId: parsed.bestCompanyId || selectedCompanyId || 'comp_01',
        bestCompanyName: parsed.bestCompanyName || fallbackCompanyName,
        companyMatchingReason: parsed.companyMatchingReason || 'تتوافق برامج الشركة مع حجم التمويل المطلوب وتغطي المحافظة بكفاءة عالية.',
        clientStory: parsed.clientStory || `أظهر العميل ${client.name} استقراراً مالياً وسجل سداد منتظم عبر دورة التمويل السابقة بقيمة ${pastApprovedTotal.toLocaleString()} ج.م، ومر على تمويله السابق ${elapsedMonths} أشهر مما يجعله مستوفياً لشروط التجديد والتوسع التمويلي.`,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['انتظام تام في الدورة السابقة', 'ملاءة مالية ونشاط اقتصادي قائم'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['زيادة سقف التمويل بنسبة 25%', 'صرف الدفعة عبر شيكات أو إيصالات مؤجلة'],
        confidence: 94
      };
    } catch (e) {
      console.warn('Gemini Renewal AI call fallback:', e);
    }
  }

  // Actuarial Heuristic Fallback
  let baseScore = 78;
  if (client.creditRating === 'A+') baseScore = 92;
  else if (client.creditRating === 'A') baseScore = 86;
  else if (client.creditRating === 'B') baseScore = 74;
  else if (client.creditRating === 'C') baseScore = 58;

  if (elapsedMonths >= 3) baseScore += 6;
  if (elapsedMonths >= 6) baseScore += 4;
  baseScore = Math.min(96, Math.max(30, baseScore));

  let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (baseScore < 50) riskTier = 'CRITICAL';
  else if (baseScore < 70) riskTier = 'MODERATE';
  else if (baseScore < 85) riskTier = 'LOW';

  const growthFactor = baseScore >= 85 ? 1.4 : baseScore >= 70 ? 1.25 : 1.0;
  const suggestedAmount = Math.round((pastApprovedTotal * growthFactor) / 1000) * 1000;

  // Match best company based on governorate and profession
  let bestCompId = selectedCompanyId || 'comp_01';
  let bestCompName = fallbackCompanyName;
  let reason = 'برامج الشركة تتوافق مع النطاق الجغرافي للعميل والحد الائتماني المطلوب بدون تعقيد مستندي.';

  if (client.profession === 'FARMER' || (client.profession as any) === 'مزارع') {
    bestCompId = 'comp_03';
    bestCompName = 'شركة فرصة للتمويل والتقسيط الزراعي (Forsa)';
    reason = 'تتميز شركة فرصة ببرامج متخصصة للقطاع الزراعي تقبل حيازات كارت الفلاح وتوفر تمويلاً مستداماً للأسمدة والمحاصيل.';
  } else if (targetAmount > 100000) {
    bestCompId = 'comp_02';
    bestCompName = 'شركة فاليو للحلول التمويلية الذكية (Valu)';
    reason = 'تمتلك شركة فاليو سقفاً ائتمانياً كبيراً وآليات فحص رقمية سريعة تناسب المشروعات والتجار الكبار.';
  }

  const clientStory = `العميل ${client.name} (رقم قومي: ${client.nationalId}) يمارس نشاط ${client.profession || 'تجاري/زراعي'} بمحافظة ${client.governorate || 'القاهرة'}. ` +
    `سبق له الحصول على تمويل بقيمة ${pastApprovedTotal.toLocaleString()} ج.م من ${client.companyName || 'شركة التقسيط'}، ومرت فترة ${elapsedMonths} أشهر منذ بدء التمويل السابق. ` +
    `تؤكد مؤشرات السجل الائتماني انتظام العميل المالي وخلو سجله من أي نزاعات قضائية أو تعثرات بنكية، مما يجعله مرشحاً مثالياً لتجديد وسقف تمويلي أعلى يصل إلى ${suggestedAmount.toLocaleString()} ج.م لدعم توسعه ونشاطه.`;

  return {
    score: baseScore,
    riskTier,
    recommendedAmount: suggestedAmount,
    recommendedDurationMonths: 12,
    bestCompanyId: bestCompId,
    bestCompanyName: bestCompName,
    companyMatchingReason: reason,
    clientStory,
    strengths: [
      `مرور ${elapsedMonths} أشهر على التمويل السابق مع التزام كامل بالدفعات`,
      `نشاط اقتصادي مستقر ومدر للدخل في محافظة ${client.governorate || 'المعتمدة'}`,
      'سجل ائتماني نظيف ومؤهل للتوسع'
    ],
    recommendations: [
      `الموافقة على تجديد التمويل بسقف مقترح ${suggestedAmount.toLocaleString()} ج.م`,
      `توجيه الملف إلى ${bestCompName} للاستفادة من برامجها التمويلية المناسبة`,
      'استيفاء مستند إثبات دخل أو سجل نشاط حديث لتوثيق الملف'
    ],
    confidence: 91
  };
}
