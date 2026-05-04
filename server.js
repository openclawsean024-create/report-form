const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'reports.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
[path.dirname(DATA_FILE), UPLOAD_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('只能上傳圖片檔案'), false);
    }
});

// Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
});

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'target@example.com';

// Load reports from JSON file
function loadReports() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (e) { console.error('Failed to load reports:', e); }
    return {};
}

// Save reports to JSON file
function saveReports(reports) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));
    } catch (e) { console.error('Failed to save reports:', e); }
}

// Generate tracking ID
function generateTrackingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'RPT-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

// Submit API
app.post('/api/submit', upload.array('photo', 10), async (req, res) => {
    try {
        const { reporter, title, content } = req.body;
        const files = req.files;

        if (!reporter || !title || !content) {
            return res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
        }

        const trackingId = generateTrackingId();
        const submittedAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

        // Save to JSON store
        const reports = loadReports();
        reports[trackingId] = {
            trackingId,
            reporter,
            title,
            content,
            photo: files && files.length > 0 ? files.map(f => f.originalname).join(", ") : "",
            photoPath: files && files.length > 0 ? files.map(f => f.path).join(", ") : "",
            submittedAt,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        saveReports(reports);

        // Send email
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
                    ${files && files.length > 0 ? `<div style="padding: 10px; background: #f0f9ff; border-radius: 8px; font-size: 13px; color: #0369a1;">📎 附件: ${files.map(f => f.originalname).join(", ")}</div>` : ''}
                    <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #94a3b8; text-align: center;">
                        此郵件由系統自動發送，請勿直接回覆 · 追蹤編號：${trackingId}
                    </div>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.GMAIL_USER || 'your-email@gmail.com',
            to: TARGET_EMAIL,
            subject: `[${trackingId}] ${title}`,
            html: mailHtml
        };

        if (files && files.length > 0) {
            mailOptions.attachments = files.map(f => ({ filename: f.originalname, path: f.path }));
        }

        await transporter.sendMail(mailOptions);
        console.log(`[${new Date().toISOString()}] Report sent: ${trackingId} - ${title} by ${reporter}`);

        // Cleanup uploaded file after email
        if (files && files.length > 0) {
            files.forEach(f => { try { fs.unlinkSync(f.path); } catch (e) {} });
        }

        res.json({ success: true, message: '回報已送出', trackingId });

    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ success: false, message: error.message || '發送失敗，請稍後再試' });
    }
});

// Status API
app.get('/api/status', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: '請提供追蹤編號' });

    const reports = loadReports();
    const report = reports[id];

    if (!report) return res.status(404).json({ success: false, message: '找不到此回報' });

    res.json({ success: true, report });
});

// Error handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: '檔案過大，最大支援 10MB' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
});

app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════╗
║   問題回報系統已啟動                   ║
║   http://localhost:${PORT}              ║
╚══════════════════════════════════════╝
`);
});
