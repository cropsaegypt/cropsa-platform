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

  const { to, otp, username, smtpConfig } = body || {};

  if (!to || !otp) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Recipient email and OTP code are required' }));
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
      // Default fallback transport configuration
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

    const htmlContent = `
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
              إذا لم تقم بطلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية كما هي دون أي تغيير.
            </p>
            <p style="color: #cbd5e1; font-size: 10px; margin-top: 12px;">
              منظومة كروبسا مصر للتمويل الرقمي © 2026 - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject: `رمز التحقق لاستعادة كلمة المرور: ${otp} - منظومة كروبسا مصر`,
      text: `رمز التحقق الخاص بك لاستعادة كلمة المرور في منظومة كروبسا مصر هو: ${otp}. هذا الرمز صالح لمدة 10 دقائق فقط.`,
      html: htmlContent
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      messageId: info.messageId,
      message: 'تم إرسال كود التحقق بنجاح إلى البريد الإلكتروني'
    }));
  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: error?.message || 'فشل إرسال كود التحقق عبر خادم البريد'
    }));
  }
}
