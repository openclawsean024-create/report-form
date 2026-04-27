import nodemailer from 'nodemailer';
import multiparty from 'multiparty';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'reports.json');

function generateTrackingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'RPT-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function loadReports() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (e) { console.error('Load error:', e); }
    return {};
}

function saveReports(reports) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));
    } catch (e) { console.error('Save error:', e); }
}

export default async function handler(req, res) {
    // Ensure we always send JSON and never crash without a response
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ success: false, message: 'Method not allowed' });
            return;
        }

        await new Promise((resolve, reject) => {
            const form = new multiparty.Form({
                uploadDir: '/tmp/uploads',
                maxFieldsSize: 10 * 1024 * 1024,
            });

            form.on('error', (err) => {
                console.error('Multiparty form error:', err);
                res.status(400).json({ success: false, message: '表單解析錯誤' });
                resolve();
            });

            form.parse(req, async (err, fields, files) => {
                try {
                    if (err) {
                        res.status(400).json({ success: false, message: '解析錯誤' });
                        resolve();
                        return;
                    }

                    const reporter = fields.reporter?.[0] || '';
                    const title = fields.title?.[0] || '';
                    const content = fields.content?.[0] || '';
                    const photo = files.photo?.[0];

                    if (!reporter || !title || !content) {
                        res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
                        resolve();
                        return;
                    }

                    const trackingId = generateTrackingId();
                    const submittedAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

                    // Save to data store
                    const reports = loadReports();
                    reports[trackingId] = {
                        trackingId,
                        reporter,
                        title,
                        content,
                        photo: photo ? photo.originalFilename : null,
                        submittedAt,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    };
                    saveReports(reports);

                    // Send email if credentials are available
                    const gmailUser = process.env.GMAIL_USER;
                    const gmailPass = process.env.GMAIL_APP_PASSWORD;
                    const targetEmail = process.env.TARGET_EMAIL;

                    if (gmailUser && gmailPass && targetEmail) {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: { user: gmailUser, pass: gmailPass },
                        });

                        const mailHtml = `
                            <div style="font-family: 'Noto Sans TC', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
                                    <h2 style="color: white; margin: 0;">📋 問題回報通知</h2>
                                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">新回報已提交</p>
                                </div>
                                <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; width: 100px; font-size: 13px;">追蹤編號</td>
                                            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px; color: #2563eb; font-weight: 700;">${trackingId}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; font-size: 13px;">回報人</td>
                                            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px;">${reporter}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; font-size: 13px;">回報標題</td>
                                            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px;">${title}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: 600; font-size: 13px;">提交時間</td>
                                            <td style="padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px;">${submittedAt}</td>
                                        </tr>
                                    </table>
                                    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px;">回報內容：</div>
                                        <div style="font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${content}</div>
                                    </div>
                                    ${photo ? `<div style="padding: 10px; background: #f0f9ff; border-radius: 8px; font-size: 13px; color: #0369a1;">📎 附件: ${photo.originalFilename}</div>` : ''}
                                    <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #94a3b8; text-align: center;">
                                        此郵件由系統自動發送，請勿直接回覆 · 追蹤編號：${trackingId}
                                    </div>
                                </div>
                            </div>
                        `;

                        const mailOptions = {
                            from: gmailUser,
                            to: targetEmail,
                            subject: `[${trackingId}] ${title}`,
                            html: mailHtml,
                        };

                        if (photo) {
                            mailOptions.attachments = [{ filename: photo.originalFilename, path: photo.path }];
                        }

                        try {
                            await transporter.sendMail(mailOptions);
                            console.log(`[${new Date().toISOString()}] Report sent: ${trackingId}`);
                        } catch (emailErr) {
                            console.error('Email error:', emailErr.message);
                            // Continue even if email fails - report is still saved
                        }

                        // Cleanup photo
                        if (photo) {
                            try { fs.unlinkSync(photo.path); } catch (e) { /* ignore */ }
                        }
                    }

                    res.status(200).json({ success: true, message: '回報已送出', trackingId });
                    resolve();
                } catch (innerErr) {
                    console.error('Submit handler inner error:', innerErr);
                    res.status(500).json({ success: false, message: '伺服器錯誤' });
                    resolve();
                }
            });
        });
    } catch (outerErr) {
        console.error('Submit handler outer error:', outerErr);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
}