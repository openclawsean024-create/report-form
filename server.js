const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 檔案上傳設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只能上傳圖片檔案'), false);
        }
    }
});

// Gmail SMTP 設定
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    }
});

// 目標收件信箱
const TARGET_EMAIL = process.env.TARGET_EMAIL || 'target@example.com';

// API 路由
app.post('/api/submit', upload.single('photo'), async (req, res) => {
    try {
        const { reporter, title, content } = req.body;
        const file = req.file;

        // 驗證必要欄位
        if (!reporter || !title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: '請填寫所有必填欄位' 
            });
        }

        // 建立郵件內容
        let mailOptions = {
            from: process.env.GMAIL_USER || 'your-email@gmail.com',
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
                    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; margin: 8px 0 16px 0; white-space: pre-wrap; text-align: left;">
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
                    
                    ${file ? `<p style="margin-top: 20px; color: #64748b;">📎 附件: ${file.originalname}</p>` : ''}
                    
                    <div style="margin-top: 30px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #94a3b8;">
                        此郵件由系統自動發送，請勿直接回覆
                    </div>
                </div>
            `
        };

        // 如果有上傳檔案，加入附件
        if (file) {
            mailOptions.attachments = [{
                filename: file.originalname,
                path: file.path
            }];
        }

        // 發送郵件
        await transporter.sendMail(mailOptions);

        // 清理上傳的檔案
        if (file) {
            fs.unlinkSync(file.path);
        }

        console.log(`[${new Date().toISOString()}] 回報已發送: ${title} by ${reporter}`);

        res.json({ success: true, message: '回報已送出' });

    } catch (error) {
        console.error('發送失敗:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || '發送失敗，請稍後再試' 
        });
    }
});

// 錯誤處理
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: '檔案過大' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   問題回報系統已啟動                   ║
║   http://localhost:${PORT}              ║
╚══════════════════════════════════════╝

環境變數說明：
  GMAIL_USER      - 您的 Gmail 帳號
  GMAIL_APP_PASSWORD - Gmail 應用程式密碼
  TARGET_EMAIL    - 收件信箱（預設: target@example.com）

請設定環境變數後再使用：
  Windows:  set GMAIL_USER=your@gmail.com
            set GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
            set TARGET_EMAIL=your@email.com
  Linux/Mac: export GMAIL_USER=your@gmail.com
             export GMAIL_APP_PASSWORD=xxxx...
             export TARGET_EMAIL=your@email.com
    `);
});
