# 問題回報表單系統

一個漂亮的問題回報表單，支持圖片上傳並透過 Gmail SMTP 發送郵件。

## 功能

- ✅ 漂亮的设计界面
- ✅ 支援圖片上傳
- ✅ 自動發送 Email 通知
- ✅ 響應式設計（手機/電腦）

## 安裝

```bash
cd report-form
npm install
```

## 設定 Gmail

### 1. 開啟 Gmail 兩步驟驗證
前往 https://myaccount.google.com/signinoptions/two-step-verification

### 2. 產生應用程式密碼
1. 前往 https://myaccount.google.com/apppasswords
2. 選擇「郵件」
3. 產生密碼（16 位字串，如 `xxxx xxxx xxxx xxxx`）

### 3. 設定環境變數

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

**Linux/Mac:**
```bash
export GMAIL_USER="your-email@gmail.com"
export GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
export TARGET_EMAIL="your@email.com"
npm start
```

## 啟動

```bash
npm start
```

訪問 http://localhost:3000

## 表單欄位

1. 回報人
2. 回報標題
3. 回報內容
4. 上傳照片（可選）

## 部署

可以部署到任何支援 Node.js 的平台：
- Vercel + Express 適配器
- Railway
- Render
- Heroku
- 自己的伺服器
