# 商化回報表單系統規格計劃書 (Report Form System)

## 產品概覽

| 項目 | 內容 |
|------|------|
| **產品名稱** | 商化回報表單系統 |
| **GitHub** | https://github.com/openclawsean024-create/report-form |
| **正式環境** | https://report-form-xi.vercel.app/submit |
| **Page ID** | 329449ca-65d8-8171-845e-d652755b489a |

## 目標用戶

- 門市人員：反映商品銷售、庫存、陳列等商化問題
- 門市主管：審視與追蹤商化回報案件

---

## 核心功能

商化回報表單系統用於收集門市人員回報的商品化問題，包含文字描述與圖片上傳，並透過電子郵件通知相關人員。

---

## 功能規格

### 前端表單 (index.html)

#### 欄位設計

| 欄位名稱 | 類型 | 必填 | 說明 |
|----------|------|------|------|
| 姓名 | text | 是 | 回報者姓名 |
| 門市名稱 | text | 是 | 以標題形式呈現 |
| 反應內容 | textarea | 是 | 問題描述文字 |
| 圖片上傳 | file (multiple) | 否 | 支援多圖上傳 |

#### 圖片處理機制

- **壓縮方式**：前端客戶端壓縮（使用 `browser-image-compression` npm package）
- **壓縮格式**：輸出為 JPG
- **檔案大小限制**：
  - 單張圖片原始大小上限：**50MB**
  - 壓縮後每張圖片目標大小：**1MB 以下**
- **壓縮流程**：
  1. 使用者選擇圖片後，先在瀏覽器客戶端執行壓縮
  2. 確認所有圖片小於 1MB 後再依序上傳
  3. 若圖片已低於 1MB，則跳過壓縮直接上傳

### 後端 API (api/submit.js)

#### 技術規格

- **解析方式**：multiparty（用於處理 multipart/form-data）
- **欄位大小限制**：
  - `maxFieldsSize: 10MB`（一般欄位）
  - `maxFields: 10`（欄位數量）
- **圖片大小限制**：maxFieldsSize: 10MB（需與前端 50MB 限制配合，前端預先篩選）

#### 郵件寄送

- 使用 Gmail SMTP 發送通知郵件
- 郵件內容包含：姓名、門市名稱、反應內容、圖片附件

---

## 技術棧

| 層面 | 技術 |
|------|------|
| 前端 | HTML, CSS, JavaScript |
| 圖片壓縮 | browser-image-compression |
| 後端 | Node.js, Express |
| 檔案解析 | multiparty |
| 郵件服務 | Nodemailer (Gmail SMTP) |
| 部署平台 | Vercel |

---

## 實作要點

### 兩端大小限制對照

| 位置 | 限制類型 | 数值 |
|------|----------|------|
| 前端 | 單張圖片原始大小 | 50MB |
| 前端 | 壓縮後目標大小 | <1MB |
| 後端 | maxFieldsSize | 10MB |

### 前端實作重點

```javascript
// 使用 browser-image-compression 進行客戶端壓縮
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg'
};

// 使用者選擇圖片後，依序壓縮再上傳
```

### 前端 50MB 限制實作

在 `<input type="file">` 的 `change` 事件中先檢查檔案大小，超過 50MB 的檔案給予提示並拒絕上傳。

---

## 更新日誌

### 2026-05-04

- **新增**：圖片壓縮功能
  - 使用 `browser-image-compression` 在前端客戶端執行壓縮
  - 圖片格式統一轉換為 JPG
  - 每張圖片壓縮後目標為 1MB 以下
- **更新**：單張圖片大小限制從隱含值提升至 50MB
  - 前端：JavaScript 檢查，50MB 以上拒絕
  - 後端：維持 maxFieldsSize: 10MB（配合前端壓縮機制）