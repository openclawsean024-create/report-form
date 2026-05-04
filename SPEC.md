# 商化回報表單系統 SPEC.md

## 1. 專案概述

- **專案名稱**：商化回報表單系統
- **類型**：網頁表單 + Email 通知服務
- **核心功能**：門市巡訪問題回報，支援圖片上傳，透過 Gmail SMTP 發送郵件通知
- **發布日期**：2025 年 4 月
- **技術棧**：Node.js + Express + Multer + Nodemailer

---

## 2. 技術架構

### 前端
- **框架**：純 HTML/CSS/JS（無框架）
- **字體**：Google Fonts - Noto Sans TC
- **響應式設計**：支援手機與電腦

### 後端
- **Runtime**：Node.js
- **Framework**：Express.js
- **檔案上傳**：Multer
- **郵件發送**：Nodemailer + Gmail SMTP
- **部署**：Vercel（Express 適配器）/ Railway / Render / 自架伺服器

---

## 3. 功能規格

### 3.1 表單欄位

| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| 回報人 | text | ✅ | 商化名稱 |
| 回報標題 | text | ✅ | 門市名稱 |
| 回報內容 | textarea | ✅ | 問題描述 |
| 上傳照片 | file | ❌ | 可上傳 0~1 張圖片 |

### 3.2 API

- **Endpoint**：`POST /api/submit`
- **Content-Type**：`multipart/form-data`
- **Request Body**：
  - `reporter`（string, 必填）
  - `title`（string, 必填）
  - `content`（string, 必填）
  - `photo`（file, 選填）

### 3.3 Email 通知

- **寄件者**：Gmail 應用程式發送的郵件地址
- **收件者**：
  - 系統管理員（TARGET_EMAIL）
  - 其他固定收件人（ADDITIONAL_RECIPIENTS）
- **郵件格式**：HTML 表格，含回報人、門市名稱、反應內容、回報時間
- **附件**：如有上傳圖片則附加於郵件

---

## 4. 圖片上傳規格

### 4.1 客戶端預覽限制
- **最大檔案大小**：**50MB**（客戶端預覽用）
- **檔案類型**：image/*（圖片格式）

### 4.2 壓縮規格（上传时自动压缩）
- **工具**：browser-image-compression
- **輸出格式**：JPEG
- **單張大小上限**：**1MB**
- **壓縮參數**：
  ```javascript
  {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg'
  }
  ```
- **壓縮時機**：檔案選取後、上傳前，於客戶端自動執行
- **目的**：確保郵件附件與傳輸效率，同時支援高品質預覽

### 4.3 伺服器端限制
- **最大檔案大小**：10MB（`multer` 設定）
- **檔案類型**：僅允許 `image/*`

---

## 5. 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `GMAIL_USER` | Gmail 帳號 | - |
| `GMAIL_APP_PASSWORD` | Gmail 應用程式密碼（16碼） | - |
| `TARGET_EMAIL` | 主要收件信箱 | sean0407@gmail.com |
| `PORT` | 伺服器 port | 3000 |

### Gmail 設定流程
1. 開啟 Gmail 兩步驟驗證
2. 產生應用程式密碼（16碼）
3. 設定環境變數

---

## 6. 錯誤處理

| 錯誤情況 | HTTP 狀態碼 | 回應訊息 |
|---------|------------|---------|
| 必填欄位未填 | 400 | 請填寫所有必填欄位 |
| 檔案過大 | 400 | 檔案過大 |
| 非圖片檔案 | 400 | 只能上傳圖片檔案 |
| 郵件發送失敗 | 500 | 發送失敗，請稍後再試 |
| 伺服器錯誤 | 500 | 伺服器錯誤 |

---

## 7. 部署

### 7.1 Vercel（預設）
- `vercel.json` 已設定 Express 適配
- 環境變數需於 Vercel Dashboard 設定

### 7.2 其他平台
- Railway、Render、Heroku 或自架伺服器
- 需設定 `GMAIL_USER`、`GMAIL_APP_PASSWORD`、`TARGET_EMAIL`

---

## 8. 版本紀錄

| 日期 | 版本 | 異動內容 |
|------|------|---------|
| 2025-04-23 | v1.0 | 初始版本 |
| 2025-05-04 | v1.1 | 新增圖片壓縮規格（browser-image-compression，1MB 上限）、調整客戶端預覽限制為 50MB |
