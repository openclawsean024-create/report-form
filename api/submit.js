const nodemailer = require('nodemailer');
const multiparty = require('multiparty');

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        const form = new multiparty.Form({
            uploadDir: '/tmp',
            maxFieldsSize: 10 * 1024 * 1024,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                res.status(400).json({ success: false, message: '解析錯誤' });
                return resolve();
            }

            const reporter = fields.reporter?.[0];
            const title = fields.title?.[0];
            const content = fields.content?.[0];
            const photo = files.photo?.[0];

            if (!reporter || !title || !content) {
                res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
                return resolve();
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
            });

            const TARGET_EMAIL = process.env.TARGET_EMAIL;

            let mailOptions = {
                from: process.env.GMAIL_USER,
                to: TARGET_EMAIL,
                subject: `[門市巡訪回報] ${title}`,
                html: `
                    <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                            📋 門市巡訪回報
                        </h2>
                        
                        <p style="margin-top: 16px; font-size: 14px;">
                            <strong>門市名稱：</strong>${title}<br>
                            <strong>反應內容：</strong>
                        </p>
                        <div style="padding: 12px; background: #f; border-radius: 8px;8fafc margin: 8px 0 16px 0; white-space: pre-wrap; text-align: left;">
                            ${content}
                        </div>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 100px;">
                                    商化
                                </td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">
                                    ${reporter}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600;">
                                    回報時間
                                </td>
                                <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">
                                    ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                                </td>
                            </tr>
                        </table>
                        
                        ${photo ? `<p style="margin-top: 20px; color: #64748b;">📎 附件: ${photo.originalFilename}</p>` : ''}
                        
                        <div style="margin-top: 30px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #94a3b8;">
                            此郵件由系統自動發送，請勿直接回覆
                        </div>
                    </div>
                `,
            };

            if (photo) {
                mailOptions.attachments = [{
                    filename: photo.originalFilename,
                    path: photo.path,
                }];
            }

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[${new Date().toISOString()}] 回報已發送: ${title} by ${reporter}`);
                res.status(200).json({ success: true, message: '回報已送出' });
            } catch (error) {
                console.error('發送失敗:', error);
                res.status(500).json({ success: false, message: error.message || '發送失敗' });
            }

            return resolve();
        });
    });
}
