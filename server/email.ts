import nodemailer from "nodemailer";

const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log("SMTP configured with:", {
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: process.env.SMTP_PORT || "587",
  user: process.env.SMTP_USER,
});

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  console.log(`Attempting to send password reset email to: ${to}`);
  try {
    const result = await transporter.sendMail({
      from: `"Only-U" <${process.env.SMTP_USER}>`,
      to,
      subject: "【Only-U】パスワードをリセットしてください",
      html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#fff0f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff0f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(236,72,153,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899 0%,#f43f5e 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Only-U</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:0.5px;">クリエイターとファンをつなぐ</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <!-- Icon -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fce7f3,#ffd6e7);line-height:64px;font-size:30px;">🔑</div>
              </div>

              <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1f2937;text-align:center;">パスワードのリセット</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;text-align:center;">
                パスワードリセットのリクエストを受け付けました。<br />
                下のボタンから新しいパスワードを設定してください。
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(236,72,153,0.35);">
                  パスワードをリセット
                </a>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0;" />

              <!-- Notes -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 12px;">
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                      <span style="font-size:13px;color:#6b7280;line-height:1.6;">
                        ⏰ &nbsp;このリンクは <strong style="color:#ec4899;">1時間後</strong> に無効になります。
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size:13px;color:#6b7280;line-height:1.6;">
                      🔒 &nbsp;心当たりがない場合は、このメールを無視してください。パスワードは変更されません。
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <div style="margin-top:24px;padding:16px;background:#fafafa;border-radius:12px;border:1px solid #f3f4f6;">
                <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">ボタンが機能しない場合は以下のURLをブラウザに貼り付けてください：</p>
                <a href="${resetLink}" style="font-size:12px;color:#ec4899;word-break:break-all;">${resetLink}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2025 Only-U &nbsp;|&nbsp; 合同会社SIN JAPAN KANAGAWA
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    console.log(`Password reset email sent to ${to}`, result.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
