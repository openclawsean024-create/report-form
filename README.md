# 問題回報系統 — 商業版

專業的問題回報系統，支援圖片上傳、即時 Email 通知與追蹤編號查詢。

🌐 **線上版本：** https://report-form-xi.vercel.app

---

## ✨ 功能特色

- 📷 **圖片上傳** — 支援 JPG、PNG 格式，可拖曳上傳或點擊選擇
- 📧 **即時 Email 通知** — 提交後立即發送 Gmail 通知相關人員
- 📱 **響應式設計** — 手機、平板、電腦皆可使用
- ♾️ **無限使用** — 不限次數、不限數量
- 🔍 **追蹤編號查詢** — 每筆回報皆有專屬追蹤編號
- 🔒 **資料安全保障** — 您的資料受到妥善保護

---

## 📄 頁面說明

| 頁面 | 路徑 | 說明 |
|------|------|------|
| 登陸頁 | `/` | 產品介紹、功能說明、使用方式 |
| 回報頁 | `/submit` | 填寫回報表單，上傳圖片 |
| 查詢頁 | `/status` | 輸入追蹤編號查詢處理進度 |

---

## 🚀 本地開發

```bash
git clone https://github.com/openclawsean024-create/report-form.git
cd report-form
npm install
npm start
```

訪問 http://localhost:3000

### 環境變數設定

前往 [Google 應用程式密碼](https://myaccount.google.com/apppasswords) 產生 16 位應用程式密碼。

**Linux/Mac:**
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
export TARGET_EMAIL="your@email.com"
npm start
```

**Windows (CMD):**
```cmd
set GMAIL_USER=your-email@gmail.com
set GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
set TARGET_EMAIL=your@email.com
npm start
```

**Windows (PowerShell):**
```powershell
$env:GMAIL_USER="your-email@gmail.com"
$env:GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
$env:TARGET_EMAIL="your@email.com"
npm start
```

---

## 📋 回報表單欄位

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| 回報人 | 文字 | ✅ | 填寫您的姓名 |
| 回報標題 | 文字 | ✅ | 簡述問題標題 |
| 回報內容 | 多行文字 | ✅ | 詳細描述問題 |
| 上傳照片 | 圖片 | ❌ | 支援 JPG、PNG，最大 10MB |

---

## 🌐 部署到 Vercel

### 方法一：透過 Vercel CLI

```bash
npm i -g vercel
vercel
```

### 方法二：透過 GitHub 部署

1. 將專案推送到 GitHub
2. 前往 [vercel.com](https://vercel.com)
3. Import 您的 GitHub 倉庫
4. 在 Vercel 專案設定中設定環境變數：
   - `GMAIL_USER` — Gmail 帳號
   - `GMAIL_APP_PASSWORD` — Gmail 應用程式密碼
   - `TARGET_EMAIL` — 收件信箱

### Vercel 環境變數設定

在 Vercel 專案 Dashboard → Settings → Environment Variables 設定：

| Name | Value |
|------|-------|
| `GMAIL_USER` | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` |
| `TARGET_EMAIL` | `your@email.com` |

---

## 📁 專案結構

```
report-form/
├── index.html        # 登陸頁（靜態部署）
├── submit.html       # 回報頁（靜態部署）
├── status.html       # 查詢頁（靜態部署）
├── server.js         # Express 伺服器（本地開發）
├── api/
│   ├── submit.js     # 提交 API（Vercel Function）
│   └── status.js     # 查詢 API（Vercel Function）
├── vercel.json       # Vercel 設定
├── data/             # 資料存放目錄
│   └── reports.json  # 回報記錄
├── uploads/          # 上傳檔案暫存（本地）
└── package.json
```

---

## 🔑 Gmail 應用程式密碼設定

1. 前往 [Google 帳戶設定](https://myaccount.google.com/signinoptions/two-step-verification) 啟用兩步驟驗證
2. 前往 [應用程式密碼](https://myaccount.google.com/apppasswords)
3. 選擇「郵件」→ 產生密碼
4. 複製 16 位密碼（格式：`xxxx xxxx xxxx xxxx`）

---

## 📮 追蹤編號說明

每筆成功提交的回報都會獲得一個獨特的追蹤編號，格式為 `RPT-xxxxxxxx`（例如：`RPT-a1b2c3d4`）。

使用此編號可在 `/status` 頁面查詢回報的處理進度。

---

## 技術棧

- **前端：** HTML5、CSS3、Vanilla JavaScript
- **後端：** Node.js、Express
- **部署：** Vercel
- **郵件：** Gmail SMTP + Nodemailer
- **上傳：** Multer / Multiparty
