# 問題回報系統 — 產品規格書

**版本：** 2.0.0
**最後更新：** 2025-04-23
**線上網址：** https://report-form-xi.vercel.app
**GitHub：** https://github.com/openclawsean024-create/report-form

---

## 1. 產品概述

### 1.1 產品定位

問題回報系統（Report Form System）是一款專為企業打造的 SaaS 工具，幫助組織快速收集、通知和追蹤各類問題回報。從客戶服務、Bug 回報、門市巡查到內部流程異常，都能一站式處理。

### 1.2 目標用戶

- 客服團隊：收集客戶問題與建議
- 技術團隊：接收 Bug 回報截圖
- 門市管理：巡訪問題即時回報
- HR/行政：內部作業異常處理

---

## 2. 功能模組

### 2.1 登陸頁（Landing Page）— `/`

**目的：** 轉化訪客為實際使用者

**內容區塊：**
1. **導航列** — Logo、特色連結、使用方式連結、適用場景連結、「立即回報」CTA 按鈕
2. **Hero 區** — 主標題「問題回報系統 — 快速收集、即時通知、輕鬆追蹤」、副標題、雙 CTA（填寫回報 / 了解如何運作）
3. **功能特色** — 6 張卡片：圖片上傳、即時 Email 通知、響應式設計、無限使用、追蹤編號查詢、資料安全保障
4. **使用方式** — 3 步驟流程圖（填寫表單 → 上傳截圖 → 我們收到通知）
5. **適用場景** — 6 種場景卡片（客戶服務、Bug 回報、意見反饋、門市巡查、設備報修、作業異常）
6. **CTA 區** — 深藍色背景，「準備好開始使用了嗎？」+ 立即填寫回報按鈕
7. **Footer** — 版權資訊

### 2.2 回報頁（Submit Page）— `/submit`

**目的：** 讓用戶快速完成問題回報

**表單欄位：**
| 欄位 | 類型 | 必填 | 驗證 |
|------|------|------|------|
| 回報人 | text | ✅ | 非空 |
| 回報標題 | text | ✅ | 非空 |
| 回報內容 | textarea | ✅ | 非空 |
| 上傳照片 | file (image) | ❌ | JPG/PNG，最大 10MB |

**功能：**
- Client-side 即時驗證（必填欄位）
- 拖曳上傳 + 點擊選擇
- 圖片預覽
- 提交成功後顯示追蹤編號

**提交成功流程：**
1. 隱藏表單，顯示追蹤編號卡片
2. 提供「查詢進度」連結（帶追蹤編號 URL）
3. 提供「填寫新回報」連結

### 2.3 查詢頁（Status Page）— `/status`

**目的：** 用戶可輸入追蹤編號查詢處理進度

**功能：**
- URL 參數支援： `/status?id=RPT-xxxx` 可自動帶入並查詢
- 三步驟時間線：✅ 已收到回報 → 📋 處理中 → ✅ 完成
- 顯示：追蹤編號、回報標題、回報人、提交時間

---

## 3. 後端架構

### 3.1 API 端點

#### POST `/api/submit`
- **參數：** `multipart/form-data`
  - `reporter` (string, required)
  - `title` (string, required)
  - `content` (string, required)
  - `photo` (file, optional, image/*, max 10MB)
- **回應：**
  - 成功：`{ success: true, message: '回報已送出', trackingId: 'RPT-xxxxxxxx' }`
  - 失敗：`{ success: false, message: '錯誤訊息' }`

#### GET `/api/status?id={trackingId}`
- **參數：** Query string `id`
- **回應：**
  - 成功：`{ success: true, report: { trackingId, reporter, title, content, submittedAt, status } }`
  - 失敗：`{ success: false, message: '找不到此回報' }`

### 3.2 資料模型

**Report Object:**
```json
{
  "trackingId": "RPT-a1b2c3d4",
  "reporter": "王小明",
  "title": "POS 系統當機",
  "content": "今天下午三點...",
  "photo": "screenshot.png",
  "submittedAt": "2025/4/23 下午3:00:00",
  "status": "pending",
  "createdAt": "2025-04-23T07:00:00.000Z"
}
```

**Status 枚舉：** `pending` | `processing` | `done`

### 3.3 追蹤 ID 格式

格式：`RPT-{8位隨機字符}`
字符集：`a-z` + `0-9`（共36個字符）
範例：`RPT-a3x9k2m7`

### 3.4 資料儲存

- **本地開發：** `data/reports.json`（JSON 檔案）
- **Vercel 部署：** 同一 JSON 檔案（寫入 `/tmp` 或 Function 執行目錄）

### 3.5 Email 通知（Gmail SMTP）

觸發時機：每次 `/api/submit` 成功時
收件人：`TARGET_EMAIL`（環境變數）

郵件內容包含：
- 追蹤編號
- 回報人姓名
- 回報標題
- 回報時間
- 回報內容（格式化 HTML）
- 附件（如果有上傳圖片）

---

## 4. 環境變數

| 變數名 | 說明 | 必填 |
|--------|------|------|
| `GMAIL_USER` | Gmail 寄件帳號 | ✅ |
| `GMAIL_APP_PASSWORD` | Gmail 應用程式密碼（16位） | ✅ |
| `TARGET_EMAIL` | 接收回報通知的 Email | ✅ |

---

## 5. 部署架構

### 5.1 Vercel 部署

- **靜態檔案：** `index.html`, `submit.html`, `status.html` → `@vercel/static`
- **API Functions：** `api/submit.js`, `api/status.js` → `@vercel/node`
- **環境變數：** 在 Vercel Dashboard 設定（使用 Vercel Secrets）

### 5.2 路由設定（vercel.json）

```
/api/submit  → api/submit.js
/api/status  → api/status.js
/submit      → submit.html
/status      → status.html
/*           → index.html
```

---

## 6. UI/UX 設計規範

### 6.1 色彩系統

| Token | 色值 | 用途 |
|-------|------|------|
| `--primary` | `#2563eb` | 主色（按鈕、連結、強調） |
| `--primary-dark` | `#1d4ed8` | Hover 狀態 |
| `--primary-light` | `#dbeafe` | 背景、標籤 |
| `--secondary` | `#0ea5e9` | 輔助強調 |
| `--bg` | `#f8fafc` | 頁面背景 |
| `--card` | `#ffffff` | 卡片背景 |
| `--text` | `#1e293b` | 主文字 |
| `--text-muted` | `#64748b` | 次要文字 |
| `--border` | `#e2e8f0` | 邊框、分隔線 |
| `--error` | `#ef4444` | 錯誤提示 |
| `--success` | `#22c55e` | 成功狀態 |

### 6.2 字體

- **主字體：** Noto Sans TC（Google Fonts）
- **權重：** 400（正文）、500（小標題）、700（大標題）、900（Hero）
- **最小正文：** 13px
- **預設行高：** 1.6

### 6.3 響應式斷點

- **Mobile：** < 640px
- **Tablet：** 640px - 1024px
- **Desktop：** > 1024px

---

## 7. 安全考量

- 所有環境變數透過 Vercel Secrets 設定，不寫入程式碼
- 檔案上傳僅接受 `image/*` MIME 類型
- 檔案大小限制：10MB
- Email 附件在發送後自動刪除（本地）
- 追蹤編號隨機生成，不可推測
