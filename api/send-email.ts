import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
    return;
  }

  // Parse body if needed
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { 
    to, 
    otp, 
    username, 
    subject, 
    content, 
    html, 
    clientName, 
    applicationId, 
    driveLink,
    smtpConfig 
  } = body || {};

  if (!to) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'عنوان البريد الإلكتروني للمستلم مطلوب (to)' }));
    return;
  }

  if (!otp && !content && !html && !subject) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'محتوى الرسالة أو كود التحقق مطلوب' }));
    return;
  }

  try {
    // 1. Build transport configuration
    let transporter: any;

    if (smtpConfig && smtpConfig.enabled && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: Number(smtpConfig.port) || 465,
        secure: smtpConfig.secure !== false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // Default fallback transport configuration (direct submission)
      transporter = nodemailer.createTransport({
        host: smtpConfig?.host || 'mail.cropsa-finance.eg',
        port: Number(smtpConfig?.port) || 587,
        secure: false,
        auth: (smtpConfig?.user && smtpConfig?.pass) ? {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        } : undefined,
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    const fromAddress = smtpConfig?.fromEmail || smtpConfig?.user || 'operations@cropsa-finance.eg';
    const fromName = smtpConfig?.fromName || 'منظومة كروبسا مصر للتمويل الرقمي';

    // 2. Branch: OTP Password Reset vs Application / Corporate Dispatch
    let emailSubject = '';
    let emailText = '';
    let emailHtml = '';

    if (otp) {
      emailSubject = `رمز التحقق لاستعادة كلمة المرور: ${otp} - منظومة كروبسا مصر`;
      emailText = `رمز التحقق الخاص بك لاستعادة كلمة المرور في منظومة كروبسا مصر هو: ${otp}. هذا الرمز صالح لمدة 10 دقائق فقط.`;
      emailHtml = `
        <div dir="rtl" style="font-family: Arial, Tahoma, sans-serif; text-align: right; background-color: #f1f5f9; padding: 30px 15px;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 35px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 900;">منظومة كروبسا مصر الرقمية</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 6px; font-weight: bold;">بوابة التمويل والتقسيط المعتمدة</p>
            </div>
            
            <div style="border-top: 2px solid #10b981; padding-top: 20px; margin-bottom: 20px;">
              <p style="font-size: 15px; color: #1e293b; margin-bottom: 12px; font-weight: bold;">
                مرحباً ${username || 'عزيزنا المستخدم'}،
              </p>
              <p style="font-size: 13px; color: #475569; line-height: 1.7; margin-bottom: 25px;">
                لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك المسجل في المنظومة. يرجى استخدام رمز التحقق السري (OTP) التالي لإتمام عملية الاستعادة:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 16px 36px;">
                  <span style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #047857;">
                    ${otp}
                  </span>
                </div>
              </div>
              
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 12px 16px; margin-bottom: 25px; text-align: center;">
                <p style="color: #be123c; font-size: 12px; font-weight: bold; margin: 0;">
                  🔒 هذا الرمز صالح لمدة 10 دقائق فقط. لا تشاركه مع أي شخص لحماية حسابك من الاختراق.
                </p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0;">
                منظومة كروبسا مصر للتمويل الرقمي © 2026 - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      // General Corporate / Application Dispatch Email
      emailSubject = subject || `إشعار بخصوص طلب تمويل${clientName ? ` - العميل: ${clientName}` : ''} | منظومة كروبسا مصر`;
      emailText = content || '';
      
      const formattedBody = (content || '')
        .split('\n')
        .map((line: string) => `<p style="margin: 6px 0; font-size: 14px; line-height: 1.8; color: #1e293b;">${line}</p>`)
        .join('');

      emailHtml = html || `
        <div dir="rtl" style="font-family: Arial, Tahoma, sans-serif; text-align: right; background-color: #f8fafc; padding: 30px 15px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 35px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <div style="border-bottom: 2px solid #047857; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="color: #064e3b; margin: 0; font-size: 22px; font-weight: 900;">منظومة كروبسا مصر للتمويل الرقمي</h1>
                <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: bold;">إدارة العمليات والتنسيق الائتماني الموحد</p>
              </div>
            </div>

            <!-- Subject Bar -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; font-weight: 800; color: #166534;">
                📌 الموضوع: ${emailSubject}
              </p>
            </div>

            <!-- Context Info if Application Linked -->
            ${(applicationId || clientName) ? `
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 12px 18px; margin-bottom: 22px; font-size: 13px; color: #334155; line-height: 1.6;">
                ${clientName ? `<div>👤 <strong>اسم العميل:</strong> ${clientName}</div>` : ''}
                ${applicationId ? `<div>📄 <strong>رقم الطلب:</strong> #${applicationId}</div>` : ''}
                ${driveLink ? `<div>📁 <strong>مجلد المستندات:</strong> <a href="${driveLink}" target="_blank" style="color: #0284c7; font-weight: bold; text-decoration: underline;">فتح ملف Google Drive</a></div>` : ''}
              </div>
            ` : ''}

            <!-- Message Body -->
            <div style="padding: 10px 0 25px 0;">
              ${formattedBody}
            </div>

            ${driveLink ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${driveLink}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);">
                  📁 فتح وتحميل أوراق العميل (Google Drive)
                </a>
              </div>
            ` : ''}

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 25px; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0;">تم إرسال هذا البريد تلقائياً عبر البوابة الرقمية لمنظومة كروبسا مصر للتقسيط والتمويل.</p>
              <p style="margin: 4px 0 0 0; color: #cbd5e1;">Cropsa Egypt Digital Financing Platform © 2026 - All Rights Reserved</p>
            </div>

          </div>
        </div>
      `;
    }

    // 3. Send Mail via Nodemailer
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      messageId: info.messageId,
      message: 'تم إرسال البريد الإلكتروني بنجاح عبر خادم البريد المؤسسي'
    }));
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: error?.message || 'فشل إرسال البريد الإلكتروني عبر خادم SMTP'
    }));
  }
}
