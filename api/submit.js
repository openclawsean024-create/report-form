import nodemailer from 'nodemailer';
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

// Read Node.js stream body fully
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

// Byte-level multipart parser (handles binary content correctly)
function parseMultipartBuffer(buffer, boundary) {
    const fields = {};
    const files = [];

    const boundaryBuffer = Buffer.from('--' + boundary);
    const headerEndMarker = Buffer.from([13, 10, 13, 10]); // \r\n\r\n

    let pos = 0;

    while (pos < buffer.length) {
        // Find next boundary
        const boundaryIdx = buffer.indexOf(boundaryBuffer, pos);
        if (boundaryIdx === -1) break;

        const partStart = boundaryIdx + boundaryBuffer.length;

        // Skip \r\n after boundary, check for -- (end)
        let ptr = partStart;
        if (buffer[ptr] === 13) ptr++; // \r
        if (buffer[ptr] === 10) ptr++; // \n
        if (buffer[ptr] === 45 && buffer[ptr + 1] === 45) break; // '--' end marker

        // Find header end marker
        const headerEndIdx = buffer.indexOf(headerEndMarker, ptr);
        if (headerEndIdx === -1) { pos = boundaryIdx + 1; continue; }

        const contentStart = headerEndIdx + 4;
        const contentStartCheck = headerEndIdx + 4;

        // Find next boundary (after content)
        const nextBoundaryIdx = buffer.indexOf(boundaryBuffer, contentStartCheck);

        // Content ends before \r\n preceding next boundary
        const contentEnd = nextBoundaryIdx === -1
            ? buffer.length
            : nextBoundaryIdx - 2; // Remove trailing \r\n

        const headerSlice = buffer.slice(ptr, headerEndIdx);
        const contentSlice = buffer.slice(contentStart, contentEnd);

        const headerStr = headerSlice.toString('utf8');
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);

        if (!nameMatch) { pos = nextBoundaryIdx !== -1 ? nextBoundaryIdx : buffer.length; continue; }
        const fieldName = nameMatch[1];

        if (filenameMatch) {
            const filename = filenameMatch[1];
            files.push({ name: fieldName, filename, data: contentSlice });
        } else {
            const text = contentSlice.toString('utf8').replace(/\r?\n$/, '');
            if (!fields[fieldName]) fields[fieldName] = [];
            fields[fieldName].push(text);
        }

        pos = nextBoundaryIdx !== -1 ? nextBoundaryIdx : buffer.length;
    }

    return { fields, files };
}

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    try {
        if (req.method !== 'POST') {
            res.status(405).json({ success: false, message: 'Method not allowed' });
            return;
        }

        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
            try {
                const boundaryMatch = contentType.match(/boundary=(.+)$/);
                if (!boundaryMatch) {
                    res.status(400).json({ success: false, message: '找不到上傳boundary' });
                    return;
                }
                const boundary = boundaryMatch[1];

                const rawBuffer = await readBody(req);
                const { fields, files } = parseMultipartBuffer(rawBuffer, boundary);

                const reporter = fields.reporter?.[0] || '';
                const title = fields.title?.[0] || '';
                const content = fields.content?.[0] || '';
                const photos = files.filter(f => f.name === 'photo');

                if (!reporter || !title || !content) {
                    res.status(400).json({ success: false, message: '請填寫所有必填欄位' });
                    return;
                }

                const trackingId = generateTrackingId();
                const submittedAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

                const reports = loadReports();
                reports[trackingId] = {
                    trackingId,
                    reporter,
                    title,
                    content,
                    photos: photos.map(p => p.filename),
                    submittedAt,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                saveReports(reports);

                const gmailUser = process.env.GMAIL_USER;
                const gmailPass = process.env.GMAIL_APP_PASSWORD;
                const targetEmail = process.env.TARGET_EMAIL;

                if (gmailUser && gmailPass && targetEmail) {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: { user: gmailUser, pass: gmailPass },
                    });

                    const photoList = photos.length > 0
                        ? photos.map(p => `<div style="padding:8px 12px;background:#f0f9ff;border-radius:8px;font-size:13px;color:#0369a1;margin-bottom:6px;">📎 ${p.filename}</div>`).join('')
                        : '<div style="padding:8px 12px;background:#f8fafc;border-radius:8px;font-size:13px;color:#94a3b8;">無附件</div>';

                    const mailHtml = `<div style="font-family:'Noto Sans TC',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                        <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;">
                            <h2 style="color:white;margin:0;">📋 問題回報通知</h2>
                            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">新回報已提交（${photos.length} 張附件）</p>
                        </div>
                        <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                                <tr><td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;font-size:13px;">追蹤編號</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#2563eb;font-weight:700;">${trackingId}</td></tr>
                                <tr><td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;font-size:13px;">回報人</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;">${reporter}</td></tr>
                                <tr><td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;font-size:13px;">店名</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;">${title}</td></tr>
                                <tr><td style="padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:600;font-size:13px;">提交時間</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;">${submittedAt}</td></tr>
                            </table>
                            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px;">
                                <div style="font-weight:600;font-size:13px;margin-bottom:8px;">回報內容：</div>
                                <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;">${content}</div>
                            </div>
                            <div style="margin-bottom:16px;">
                                <div style="font-weight:600;font-size:13px;margin-bottom:8px;">📎 附件（${photos.length} 張）：</div>
                                ${photoList}
                            </div>
                            <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px;font-size:12px;color:#94a3b8;text-align:center;">此郵件由系統自動發送，請勿直接回覆 · 追蹤編號：${trackingId}</div>
                        </div>
                    </div>`;

                    const mailOptions = {
                        from: gmailUser,
                        to: targetEmail,
                        subject: `[${trackingId}] ${title}`,
                        html: mailHtml,
                    };

                    if (photos.length > 0) {
                        mailOptions.attachments = photos.map(p => ({
                            filename: p.filename,
                            content: p.data,
                        }));
                    }

                    try {
                        await transporter.sendMail(mailOptions);
                        console.log(`Report: ${trackingId}, ${photos.length} photos`);
                    } catch (emailErr) {
                        console.error('Email error:', emailErr.message);
                    }
                }

                res.status(200).json({ success: true, message: '回報已送出', trackingId });
                return;

            } catch (parseErr) {
                console.error('Multipart parse error:', parseErr);
                res.status(400).json({ success: false, message: '表單解析錯誤：' + parseErr.message });
                return;
            }
        }

        res.status(400).json({ success: false, message: '需要 multipart/form-data' });

    } catch (outerErr) {
        console.error('Submit handler error:', outerErr);
        res.status(500).json({ success: false, message: '伺服器錯誤：' + outerErr.message });
    }
}