import { injectable } from 'inversify';
import { emailTransporter, emailConfig } from '../config/email';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@injectable()
export class EmailService {
  private transporter = emailTransporter;

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPasswordResetOTP(email: string, otp: string, firstName: string = 'User'): Promise<void> {
    const html = this.getPasswordResetTemplate(otp, firstName);
    await this.sendEmail({
      to: email,
      subject: 'Şifre Sıfırlama Kodu - Sentimenter CX',
      html,
    });
  }

  private getPasswordResetTemplate(otp: string, firstName: string): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Şifre Sıfırlama</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo svg {
            width: 40px;
            height: 40px;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .email-header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .otp-container {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 2px dashed #059669;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #059669;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            color: #059669;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .otp-expiry {
            font-size: 13px;
            color: #6b7280;
            margin-top: 12px;
        }
        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 16px 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .info-box p {
            font-size: 14px;
            color: #4b5563;
            margin: 0;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        .warning-box p {
            font-size: 14px;
            color: #92400e;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .footer a {
            color: #059669;
            text-decoration: none;
        }
        .company-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .company-info p {
            font-size: 12px;
            color: #9ca3af;
            margin: 4px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="white" opacity="0.3"/>
                    <path d="M16 32V20L24 14L32 20V32H26V26H22V32H16Z" fill="white"/>
                    <circle cx="24" cy="22" r="3" fill="white"/>
                </svg>
            </div>
            <h1>Şifre Sıfırlama</h1>
            <p>Sentimenter CX - Müşteri Deneyimi Platformu</p>
        </div>
        
        <div class="email-body">
            <div class="greeting">Merhaba ${firstName},</div>
            
            <div class="message">
                Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki tek kullanımlık şifre (OTP) kodunu kullanarak şifrenizi sıfırlayabilirsiniz.
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Tek Kullanımlık Şifre</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">Bu kod 10 dakika süreyle geçerlidir</div>
            </div>
            
            <div class="info-box">
                <p><strong>Nasıl kullanılır?</strong></p>
                <p style="margin-top: 8px;">1. Şifre sıfırlama sayfasına gidin<br>
                2. E-posta adresinizi girin<br>
                3. Yukarıdaki OTP kodunu girin<br>
                4. Yeni şifrenizi belirleyin</p>
            </div>
            
            <div class="warning-box">
                <p><strong>⚠️ Güvenlik Uyarısı</strong></p>
                <p style="margin-top: 8px;">Bu kodu kimseyle paylaşmayın. Eğer bu talebi siz yapmadıysanız, lütfen hemen bizimle iletişime geçin.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
            <p>Herhangi bir sorunuz varsa, lütfen <a href="mailto:support@albarakaturk.com.tr">destek ekibimizle</a> iletişime geçin.</p>
            
            <div class="company-info">
                <p><strong>Albaraka Türk Katılım Bankası</strong></p>
                <p>Sentimenter CX - Müşteri Deneyimi Platformu</p>
                <p>© ${new Date().getFullYear()} Tüm hakları saklıdır.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}
