import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'reports.json');

export const config = {
    api: {
        bodyParser: true,
    },
};

function loadReports() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    } catch (e) { console.error('Load error:', e); }
    return {};
}

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: '請提供追蹤編號' });
    }

    const reports = loadReports();
    const report = reports[id];

    if (!report) {
        return res.status(404).json({ success: false, message: '找不到此回報' });
    }

    return res.status(200).json({ success: true, report });
}
