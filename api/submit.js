const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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
            maxFieldsSize: 50 * 1024 * 1024, // 50MB
            maxFileSize: 50 * 1024 * 1024,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Form parse error:', err);
                res.status(400).json({ success: false, message: '解析錯誤: ' + err.message });
                return resolve();
            }

            const reporter = fields.reporter?.[0] || '';
            const title = fields.title?.[0] || '';
            const content = fields.content?.[0] || '';
            const photos = files.photo ? files.photo : [];

            // 轉換 HEIC 為 JPEG
            const convertedPhotos = [];
            for (const photo of photos) {
                try {
                    const ext = path.extname(photo.originalFilename).toLowerCase();
                    if (ext === '.heic' || ext === '.heif') {
                        const jpegPath = photo.path.replace(ext, '.jpg');
                        await sharp(photo.path)
                            .jpeg({ quality: 90 })
                            .toFile(jpegPath);
                        convertedPhotos.push({
                            ...photo,
                            path: jpegPath,
                            originalFilename: photo.originalFilename.replace(ext, '.jpg')
                        });
                    } else {
                        convertedPhotos.push(photo);
                    }
                } catch (err) {
                    console.error('圖片轉換錯誤:', err);
                    convertedPhotos.push(photo);
                }
            }

            console.log('Received fields:', JSON.stringify(fields));

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

            const TARGET_EMAIL = process.env.TARGET_EMAIL || 'sean0407@gmail.com,roger.chang@chinacom.tw,amy@chinacom.tw,jace@chinacom.tw,mark0729@chinacom.tw,sli11@logitech.com';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const allRecipients = TARGET_EMAIL.split(',')
                .map(e => e.trim())
                .filter(e => emailRegex.test(e));

            console.log('TARGET_EMAIL:', TARGET_EMAIL);
            console.log('Valid recipients:', allRecipients);

            if (allRecipients.length === 0) {
                res.status(400).json({ success: false, message: '沒有有效的收件人' });
                return resolve();
            }

            let mailOptions = {
                from: process.env.GMAIL_USER,
                to: allRecipients.join(', '),
                subject: `[門市巡訪回報] ${title}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="font-size: 28px; font-weight: 600; color: #1d1d1f; margin: 0 0 8px 0; letter-spacing: -0.5px;">門市巡訪回報</h1>
                            <p style="font-size: 14px; color: #86868b; margin: 0;">Store Visit Report</p>
                        </div>
                        
                        <div style="background: #f5f5f7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                            <div style="margin-bottom: 20px;">
                                <p style="font-size: 16px; font-weight: 600; color: #86868b; margin: 0 0 6px 0;">商化</p>
                                <p style="font-size: 16px; color: #1d1d1f; margin: 0; padding: 10px 12px; background: white; border-radius: 8px;">${reporter}</p>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <p style="font-size: 16px; font-weight: 600; color: #86868b; margin: 0 0 6px 0;">門市名稱</p>
                                <p style="font-size: 16px; color: #1d1d1f; margin: 0; padding: 10px 12px; background: white; border-radius: 8px;">${title}</p>
                            </div>
                            
                            <div>
                                <p style="font-size: 16px; font-weight: 600; color: #86868b; margin: 0 0 6px 0;">反應內容</p>
                                <p style="font-size: 16px; color: #1d1d1f; margin: 0; padding: 14px 12px; background: white; border-radius: 8px; white-space: pre-wrap; line-height: 1.5;">${content}</p>
                            </div>
                        </div>
                        
                        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e5e5e5;">
                            <p style="font-size: 12px; color: #86868b; margin: 0;">${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
                            ${convertedPhotos.length > 0 ? `<p style="font-size: 12px; color: #0071e3; margin: 8px 0 0 0;">附件 (${convertedPhotos.length} 張): ${convertedPhotos.map(p => p.originalFilename).join(', ')}</p>` : ''}
                        </div>
                    </div>
                `,
            };

            if (convertedPhotos.length > 0) {
                mailOptions.attachments = convertedPhotos.map(photo => ({
                    filename: photo.originalFilename,
                    path: photo.path,
                }));
            }

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[${new Date().toISOString()}] 回報已發送: ${title} by ${reporter}`);
                res.status(200).json({ success: true, message: '回報已送出' });
            } catch (error) {
                console.error('發送失敗:', error);
                console.error('Error code:', error.code);
                res.status(500).json({ success: false, message: error.message || '發送失敗' });
            }

            return resolve();
        });
    });
}
