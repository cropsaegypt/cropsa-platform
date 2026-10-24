import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, MessageSquare, Mail, Send, ExternalLink, Copy, Check, 
  AlertCircle, Clock, Link2, Sparkles, Building2, UserCheck, 
  HelpCircle, History, CheckCircle2, ChevronDown, Zap
} from 'lucide-react';
import { useStore } from '../context/Store';
import { Application, InstallmentCompany, ExternalDispatchTemplate } from '../types';
import { DEFAULT_EXTERNAL_DISPATCH_TEMPLATES } from '../services/mockData';

interface ExternalCompanyDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  initialCategory?: ExternalDispatchTemplate['category'];
  defaultCompanyId?: string;
}

export const ExternalCompanyDispatchModal: React.FC<ExternalCompanyDispatchModalProps> = ({
  isOpen,
  onClose,
  application,
  initialCategory = 'NEW_APPLICATION',
  defaultCompanyId
}) => {
  const { 
    companies, 
    externalDispatchTemplates, 
    smtpConfig, 
    dispatchApplicationToExternalCompany,
    addNotification
  } = useStore();

  // Find target company: either passed defaultCompanyId, or first assigned company on app, or first available company
  const targetCompanyId = defaultCompanyId || application.assignedCompanyIds?.[0] || application.companyId || companies[0]?.id;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(targetCompanyId);

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  // Determine available channels for this company
  const companyReceivingChannel = selectedCompany?.receivingChannel || 'PORTAL';

  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>(() => {
    if (companyReceivingChannel === 'EMAIL') return 'EMAIL';
    return 'WHATSAPP'; // default to WhatsApp for WHATSAPP, WHATSAPP_AND_EMAIL, or PORTAL
  });

  // Keep channel in sync when selected company changes
  useEffect(() => {
    if (companyReceivingChannel === 'EMAIL') {
      setChannel('EMAIL');
    } else if (companyReceivingChannel === 'WHATSAPP') {
      setChannel('WHATSAPP');
    }
  }, [companyReceivingChannel]);

  // Filter templates for current channel
  const availableTemplates = useMemo(() => {
    const list = externalDispatchTemplates.filter(t => 
      (t.channel === channel || t.type === channel) && t.active !== false
    );
    if (list.length > 0) return list;
    // Fallback to default templates if state was empty or corrupted
    return (DEFAULT_EXTERNAL_DISPATCH_TEMPLATES || []).filter((t: any) => 
      t.channel === channel || t.type === channel
    );
  }, [externalDispatchTemplates, channel]);

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    // Try to match initialCategory or pick first template for this channel
    const matched = availableTemplates.find(t => 
      t.category === initialCategory || 
      (initialCategory === 'EXPEDITE' && (t.category as string) === 'EXPEDITE_URGENT') ||
      (initialCategory === 'DOCS_REQUEST' && (t.category as string) === 'DOCS_UPDATE')
    );
    if (matched) {
      setSelectedTemplateId(matched.id);
    } else if (availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
    } else {
      setSelectedTemplateId('');
    }
  }, [availableTemplates, initialCategory]);

  const currentTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [availableTemplates, selectedTemplateId]);

  // Drive Link & Contacts
  const [driveLink, setDriveLink] = useState<string>(application.driveLink || '');
  const [targetContact, setTargetContact] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [messageBody, setMessageBody] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync targetContact default based on company and channel
  useEffect(() => {
    if (channel === 'WHATSAPP') {
      setTargetContact(selectedCompany?.whatsappNumber || selectedCompany?.phone || '');
    } else {
      setTargetContact(selectedCompany?.dispatchEmail || selectedCompany?.email || '');
    }
  }, [selectedCompany, channel]);

  // Placeholder interpolation helper
  const interpolatePlaceholders = (text: string) => {
    if (!text) return '';
    const formattedAmount = (application.approvedAmount || application.requestedAmount || 0).toLocaleString();
    const driveLinkDisplay = driveLink.trim() ? driveLink.trim() : '[لم يتم إدراج رابط مجلد الملفات بعد]';
    const monthlyAmt = (application.monthlyInstallment || Math.round((application.approvedAmount || application.requestedAmount || 0) / (application.durationMonths || 12))).toLocaleString();

    return text
      .replace(/{clientName}/g, application.clientName || 'العميل')
      .replace(/{clientNationalId}/g, application.clientNationalId || 'غير متوفر')
      .replace(/{nationalId}/g, application.clientNationalId || 'غير متوفر')
      .replace(/{clientPhone}/g, application.phoneNumber || application.clientPhone || 'غير متوفر')
      .replace(/{phone}/g, application.phoneNumber || application.clientPhone || 'غير متوفر')
      .replace(/{requestedAmount}/g, formattedAmount)
      .replace(/{amount}/g, `${formattedAmount} ج.م`)
      .replace(/{monthlyInstallment}/g, monthlyAmt)
      .replace(/{companyName}/g, selectedCompany?.name || 'الشركة')
      .replace(/{programName}/g, application.selectedProgramName || 'برنامج التمويل المباشر')
      .replace(/{programInterest}/g, application.programInterestRate ? `${application.programInterestRate}%` : '0%')
      .replace(/{programFees}/g, application.programAdminFeePercent ? `${application.programAdminFeePercent}%` : '2.5%')
      .replace(/{driveLink}/g, driveLinkDisplay)
      .replace(/{appId}/g, application.id || '')
      .replace(/{governorate}/g, application.governorate || 'القاهرة')
      .replace(/{durationMonths}/g, `${application.durationMonths || 12}`)
      .replace(/{productType}/g, application.productDescription || application.productType || 'تمويل تقسيط')
      .replace(/{product}/g, application.productDescription || 'تمويل تقسيط')
      .replace(/{senderName}/g, 'إدارة عمليات كروبسا');
  };

  // Populate subject & body when template or drive link or company changes
  useEffect(() => {
    if (currentTemplate) {
      setEmailSubject(interpolatePlaceholders(currentTemplate.subjectTemplate || `طلب تمويل: ${application.clientName}`));
      setMessageBody(interpolatePlaceholders(currentTemplate.bodyTemplate || ''));
    }
  }, [currentTemplate, selectedCompany, driveLink]);

  if (!isOpen) return null;

  // Handle WhatsApp Launch
  const handleSendWhatsApp = async () => {
    if (!targetContact.trim()) {
      setStatusFeedback({ type: 'error', message: 'يرجى إدخال رقم هاتف الواتساب الخاص بالشركة' });
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);

    // Normalize phone number (Egyptian prefix 20)
    let cleanPhone = targetContact.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('20') && cleanPhone.startsWith('1')) {
      cleanPhone = '20' + cleanPhone;
    }

    // Build URL
    const encodedText = encodeURIComponent(messageBody);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    // Record dispatch in Store
    const res = await dispatchApplicationToExternalCompany(application.id, {
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      channel: 'WHATSAPP',
      templateCategory: currentTemplate?.category || 'NEW_APPLICATION',
      templateName: currentTemplate?.name || 'مراسلة واتساب',
      targetContact: cleanPhone,
      driveLink: driveLink.trim() || undefined,
      content: messageBody,
      deliveryMethod: 'WHATSAPP_LINK'
    });

    setIsSubmitting(false);
    if (res.success) {
      setStatusFeedback({ 
        type: 'success', 
        message: 'تم فتح تطبيق واتساب وتوثيق المراسلة بنجاح، وتوجيه إشعار لرافع الطلب بتحديث الحالة في لوحة الإشعارات' 
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusFeedback({ type: 'error', message: res.message });
    }
  };

  // Handle Direct SMTP Dispatch
  const handleSendDirectSmtp = async () => {
    if (!targetContact.trim()) {
      setStatusFeedback({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني الخاص بالشركة' });
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback(null);

    let emailSentSuccessfully = false;
    let emailErrorMessage = '';

    // 1. Dispatch actual email via backend SMTP endpoint
    try {
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetContact.trim(),
          subject: emailSubject,
          content: messageBody,
          clientName: application.clientName,
          applicationId: application.id,
          driveLink: driveLink.trim() || undefined,
          smtpConfig
        })
      });

      if (emailRes.ok) {
        const emailData = await emailRes.json();
        if (emailData.success) {
          emailSentSuccessfully = true;
        } else {
          emailErrorMessage = emailData.message || 'فشل إرسال الإيميل عبر خادم البريد';
        }
      } else {
        const errJson = await emailRes.json().catch(() => ({}));
        emailErrorMessage = errJson.message || `خطأ استجابة من خادم البريد (${emailRes.status})`;
      }
    } catch (netErr: any) {
      console.warn('Network error dispatching email:', netErr);
      emailErrorMessage = netErr?.message || 'تعذر الاتصال بخادم البريد المحلي';
    }

    // 2. Record dispatch with DIRECT_SMTP status in Store
    const res = await dispatchApplicationToExternalCompany(application.id, {
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      channel: 'EMAIL',
      templateCategory: currentTemplate?.category || 'NEW_APPLICATION',
      templateName: currentTemplate?.nameAr || currentTemplate?.name || 'مراسلة بريد إلكتروني',
      targetContact: targetContact.trim(),
      driveLink: driveLink.trim() || undefined,
      subject: emailSubject,
      content: messageBody,
      deliveryMethod: 'DIRECT_SMTP'
    });

    setIsSubmitting(false);

    if (emailSentSuccessfully) {
      setStatusFeedback({ 
        type: 'success', 
        message: `تم إرسال الإيميل بنجاح عبر خادم البريد إلى ${selectedCompany.name} (${targetContact.trim()}) وتوثيق الإرسال بنجاح 🟢` 
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setStatusFeedback({ 
        type: 'error', 
        message: `تم توثيق الحالة في النظام، ولكن فشل الإرسال عبر SMTP (${emailErrorMessage}). يمكنك النقر على "فتح تطبيق البريد (Outlook)" لإرسالها فوراً.` 
      });
    }
  };

  // Handle Mailto fallback
  const handleOpenMailto = async () => {
    if (!targetContact.trim()) {
      setStatusFeedback({ type: 'error', message: 'يرجى إدخال البريد الإلكتروني للشركة' });
      return;
    }

    const mailtoUrl = `mailto:${encodeURIComponent(targetContact.trim())}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(messageBody)}`;
    try {
      const mailtoLink = document.createElement('a');
      mailtoLink.href = mailtoUrl;
      mailtoLink.target = '_blank';
      mailtoLink.rel = 'noopener noreferrer';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);
    } catch {
      window.open(mailtoUrl, '_blank');
    }

    // Record dispatch
    await dispatchApplicationToExternalCompany(application.id, {
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      channel: 'EMAIL',
      templateCategory: currentTemplate?.category || 'NEW_APPLICATION',
      templateName: currentTemplate?.name || 'مراسلة تطبيق البريد',
      targetContact: targetContact.trim(),
      driveLink: driveLink.trim() || undefined,
      subject: emailSubject,
      content: messageBody,
      deliveryMethod: 'CLIENT_MAILTO'
    });

    setStatusFeedback({ 
      type: 'success', 
      message: 'تم فتح تطبيق البريد وتوثيق الإرسال وتنبيه رافع الطلب في لوحة الإشعارات بنجاح' 
    });
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // Handle Copy text
  const handleCopyText = () => {
    const fullText = channel === 'EMAIL' 
      ? `الموضوع: ${emailSubject}\n\n${messageBody}`
      : messageBody;

    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-600 via-teal-700 to-indigo-800 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl text-white">
              {channel === 'WHATSAPP' ? <MessageSquare className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                مراسلة وتوجيه الطلب لشركة خارجية
                {currentTemplate?.category === 'EXPEDITE' && (
                  <span className="bg-rose-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> استعجال فوري
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                العميل: <span className="font-bold text-white">{application.clientName}</span> (طلب #{application.id.slice(-6)})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusFeedback && (
          <div className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
            statusFeedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {statusFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{statusFeedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          
          {/* Company & Channel Selection Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            {/* Target Company Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                الشركة المستهدفة:
              </label>
              <select 
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.receivingChannel === 'WHATSAPP' ? '📲 (واتساب)' : c.receivingChannel === 'EMAIL' ? '📧 (إيميل)' : c.receivingChannel === 'WHATSAPP_AND_EMAIL' ? '🔄 (واتساب وإيميل)' : '🌐 (بوابة المنصة)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Switcher */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                قناة المراسلة المعتمدة:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setChannel('WHATSAPP')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    channel === 'WHATSAPP' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  واتساب
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    channel === 'EMAIL' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  بريد إلكتروني
                </button>
              </div>
            </div>
          </div>

          {/* Program & Paperwork Info Card */}
          <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sky-950">البرنامج التمويلي المعتمد:</span>
              <span className="bg-sky-600 text-white px-2 py-0.5 rounded-md font-black text-[11px]">
                {application.selectedProgramName || 'البرنامج المباشر'}
              </span>
              {application.programInterestRate !== undefined && (
                <span className="text-sky-800 font-bold bg-white px-2 py-0.5 rounded-md border border-sky-200 text-[10px]">
                  فائدة: {application.programInterestRate}%
                </span>
              )}
            </div>
            <div className="text-slate-600 text-[11px] font-bold">
              الأوراق المرفوعة: <strong className="text-emerald-700 font-black">{application.documents?.length || 0}</strong> ملفات موثقة
            </div>
          </div>

          {/* Info Banner on Notification & Tracking */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-base shrink-0">🔔</span>
            <div className="leading-relaxed">
              <strong>تنبيه النظام التلقائي:</strong> بمجرد إرسال الحالة عبر واتساب أو البريد، يوجّه النظام إشعاراً لرافع الطلب (<span className="font-bold underline">{application.submittedByName || 'المندوب / الفرع'}</span>) وللإدارة، وتُدرج الحالة فوراً في <strong>لوحة إشعارات الحالات المطلوب تحديثها</strong> لاستكمال الأوراق وتزويد الشركة بالرد.
            </div>
          </div>

          {/* Contact Person & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>{channel === 'WHATSAPP' ? 'رقم هاتف الواتساب المستهدف:' : 'البريد الإلكتروني للشركة:'}</span>
                {selectedCompany?.contactPersonName && (
                  <span className="text-[11px] font-normal text-gray-500">
                    المسؤول: {selectedCompany.contactPersonName}
                  </span>
                )}
              </label>
              <input
                type="text"
                value={targetContact}
                onChange={(e) => setTargetContact(e.target.value)}
                placeholder={channel === 'WHATSAPP' ? 'مثال: 01012345678' : 'مثال: credit@company.eg'}
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                اختر نموذج المراسلة:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 p-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs cursor-pointer"
              >
                {availableTemplates.map(tmpl => {
                  const title = tmpl.nameAr || tmpl.name || tmpl.nameEn || 'نموذج مراسلة معتمد';
                  const isExp = tmpl.category === 'EXPEDITE' || tmpl.category === 'EXPEDITE_URGENT';
                  return (
                    <option key={tmpl.id} value={tmpl.id} className="text-slate-900 font-bold bg-white py-1.5">
                      {title} {isExp ? '⚡ (استعجال فوري)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Google Drive Link input (Core requirement) */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-sky-600" />
                رابط مستندات العميل على Google Drive:
              </label>
              {driveLink && (
                <a 
                  href={driveLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                >
                  فتح وتجربة الرابط <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-sky-700">
              أدخل رابط مجلد مستندات العميل (بطاقة، مفردات مرتب، استعلام ميداني). سيتم دمجه تلقائياً داخل الرسالة.
            </p>
            <input
              type="url"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full text-xs p-2.5 bg-white text-slate-900 border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              dir="ltr"
            />
          </div>

          {/* Email Subject (Only when Channel is EMAIL) */}
          {channel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                عنوان رسالة البريد (Subject):
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full text-xs p-2.5 bg-white text-slate-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>
          )}

          {/* Message Content Preview & Customization */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                نص الرسالة للمعاينة والتعديل المباشر:
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 transition"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={7}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full text-xs p-3.5 bg-white text-slate-900 font-medium border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-sans leading-relaxed resize-y shadow-xs"
              dir="rtl"
            />
          </div>

          {/* History of Previous Dispatches for this application */}
          {application.externalDispatches && application.externalDispatches.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-gray-500" />
                سجل المراسلات الخارجية السابقة لهذا الطلب ({application.externalDispatches.length}):
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {application.externalDispatches.map((disp) => (
                  <div key={disp.id} className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        disp.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {disp.channel === 'WHATSAPP' ? 'واتساب' : 'إيميل'}
                      </span>
                      <span className="font-bold text-gray-800">{disp.companyName}</span>
                      <span className="text-gray-500">({disp.targetContact})</span>
                      {disp.templateCategory === 'EXPEDITE' && (
                        <span className="text-rose-600 font-bold">[استعجال]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <span>{new Date(disp.sentAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-600 font-medium">بواسطة: {disp.sentByName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {channel === 'WHATSAPP' ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                <span>فتح واتساب وإرسال وتوثيق الطلب</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleOpenMailto}
                  className="px-3.5 py-2.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  title="فتح برنامج الإيميل المثبت بجهازك (Outlook أو متصفح الويب)"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح تطبيق البريد (Outlook)</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendDirectSmtp}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
                  title={`إرسال مباشر عبر إيميل المنصة (${smtpConfig.user || 'Corporate SMTP'})`}
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال مباشر عبر SMTP المنصة</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
