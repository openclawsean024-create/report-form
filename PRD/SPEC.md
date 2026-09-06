# report-form · PRD v3.0.2 等級規格書

> 自動生成：2026-09-06
> 對齊 SPEC v3.0 契約（SPEC §1–§19 全部套用）
> 既有 v2.0.0 SPEC（`/SPEC.md`）保留為 historical reference，本文件為 v3.0.2 入口規格書

---

## 1. 產品概述

### 1.1 問題陳述
中小企業 / 連鎖門市 / 內部團隊在處理「現場問題回報」時普遍面臨三個痛點：
- **回報管道散落**：LINE / Email / 口頭 / 紙本，後續難以追蹤責任歸屬
- **通知延遲或漏接**：沒有即時告警，問題從「發生」到「被看見」往往拖好幾小時
- **後續追蹤無著落**：沒有統一編號，回報者不知道「現在處理到哪了」

`report-form` 透過「公開 URL 即可填寫 + 即時 Email 通知 + 追蹤編號查詢」三件式，把整個閉環做成一個零學習成本的 SaaS，部署在 Vercel，後端用 Gmail SMTP 轉發通知。

### 1.2 目標使用者
| Persona | 工作情境 | 主要任務 |
|---|---|---|
| Primary：門市店主管 | 巡店發現問題（如 POS 當機、設備故障） | 拍照 → 填表 → 收到追蹤編號 |
| Primary：客服 / 技術支援 | 接收外部客戶 Bug 回報 | 收到 Email → 進入處理流程 |
| Primary：HR / 行政 | 內部流程異常、財產報修 | 統一收件 → 可查進度 |
| Secondary：SI / 接案工作室 | 替客戶部署輕量級回報單 | 改 SPEC 內文案 + 環境變數 |
| Secondary：中小企業老闆 | 沒有客服系統但需要「被打來時可登記」 | 30 秒裝起來，直接用 |

### 1.3 核心價值主張
> 一個 URL、一張表、一封信 — 30 秒把「現場問題」變成「可追蹤的工單」，無需註冊、無需登入、無需資料庫。

### 1.4 Non-Goals（明確不做）
- ❌ 不做帳號系統（公開 URL 即可填寫，靠 Email 通知做歸屬）
- ❌ 不做客戶端 Dashboard（管理者進 Gmail 看信，或未來迭代再做）
- ❌ 不做狀態變更後台（pending/processing/done 三狀態由未來管理頁改，現版本不實作）
- ❌ 不做檔案長期儲存（照片隨 Email 寄出後即刪，無雲端相簿）
- ❌ 不做付費牆 / 多語系（單一 zh-TW，未來不排除 v4 加英文）

---

## 2. 使用者場景與流程

### 2.1 使用者流程圖

```mermaid
flowchart LR
  A[訪問 /] --> B[了解產品 / 適用場景]
  B --> C[點 立即回報 → /submit]
  C --> D[填表 + 選 拖照片]
  D --> E[POST /api/submit]
  E --> F[Gmail SMTP 寄信給 TARGET_EMAIL]
  F --> G[回傳 RPT-xxxxxxxx]
  G --> H[顯示成功卡片 + 追蹤編號]
  H --> I[使用者點 查進度]
  I --> J[/status?id=RPT-xxx]
  J --> K[GET /api/status]
  K --> L[顯示三步驟時間線]
```

### 2.2 主要場景

| 場景 | 輸入 | 輸出 | 成功條件 |
|---|---|---|---|
| 巡店發現 POS 當機 | 照片 + 標題 + 內容 | 信件 30 秒內到 IT 信箱 | 收到 RPT-xxxx 編號 |
| 客戶回報 App Bug | 截圖 + 重現步驟 | 信件到客服組 | 客戶可日後用編號查進度 |
| 內部設備報修 | 故障描述（可無照片） | 信件到總務 | 三步驟時間線顯示 |
| 重複追蹤查詢 | 既有 RPT-xxxx | 顯示提交時間、標題、人 | 200 + 完整 report object |
| 訪客進入首頁 | — | 6 大功能 + 6 種場景 + 立即回報 CTA | 完成理解 → 點擊 CTA |

---

## 3. 功能需求

| FR | 名稱 | 優先級 | 狀態 |
|---|---|---|---|
| FR-001 | 登陸頁（Hero + 6 特色 + 3 步驟 + 6 場景） | P0 | ✅ shipped |
| FR-002 | 回報表單（姓名/標題/內容/照片，client-side 驗證） | P0 | ✅ shipped |
| FR-003 | 圖片拖曳 / 點擊 / 預覽，client-side 壓縮 (browser-image-compression) | P0 | ✅ shipped |
| FR-004 | 提交 API `/api/submit`（multipart/form-data，10MB 限制） | P0 | ✅ shipped |
| FR-005 | 追蹤編號生成（`RPT-{8位 a-z0-9}`） | P0 | ✅ shipped |
| FR-006 | Gmail SMTP 即時通知（HTML 內文 + 圖片附件） | P0 | ✅ shipped |
| FR-007 | 查詢頁 `/status`（網址參數自動帶入） | P0 | ✅ shipped |
| FR-008 | 狀態 API `/api/status?id=RPT-xxx` | P0 | ✅ shipped |
| FR-009 | 三步驟時間線（已收到 → 處理中 → 完成） | P1 | ✅ shipped |
| FR-010 | 響應式設計（mobile / tablet / desktop 三斷點） | P1 | ✅ shipped |
| FR-011 | CORS 支援跨域呼叫（`/api/*` 加 CORS headers） | P1 | ✅ shipped |
| FR-012 | Local Express 開發伺服器（`server.js`） | P2 | ✅ shipped |
| FR-013 | Vercel 部署（static + node functions，vercel.json 路由） | P0 | ✅ shipped |
| FR-014 | CI workflow（lint / build / test，4 jobs） | P1 | ⏳ planned（v3.0.2 新增） |
| FR-015 | 統一 PRD 文件（v3.0.2 入口） | P1 | ⏳ planned（v3.0.2 新增） |
| FR-016 | 變更日誌（v3.0.2 / v2.0.0 對照） | P1 | ⏳ planned（v3.0.2 新增） |

---

## 4. Non-Functional Requirements

| 維度 | 需求 |
|---|---|
| Performance | 首頁 TTFB < 600ms（Vercel CDN edge）；提交 API P95 < 2s（不含 Gmail SMTP 延遲） |
| Security | 環境變數走 Vercel Secrets；上傳僅接受 `image/*` MIME；檔案 ≤ 10MB；追蹤 ID 8 位隨機（36^8 ≈ 2.8×10^12 空間） |
| Privacy | 公開 URL 即可填寫，無個資後台；Email 附件發送後本地立即刪除 |
| Accessibility | WCAG 2.1 AA（label / aria-* / 鍵盤導覽 / 顏色對比 ≥ 4.5:1） |
| Browser | Modern evergreen (Chrome / Edge / Safari / Firefox 最新兩版) |
| Mobile | iOS Safari 14+ / Android Chrome 90+，含相機調用 |
| Uptime | Vercel Serverless 99.95% SLA（Gmail SMTP 失敗不擋提交，僅記 log） |
| Observability | `console.log` / `console.error`（Vercel Functions Logs）；無 APM |

---

## 5. 技術架構

```
┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐
│  Browser        │    │  Vercel Edge    │    │  Gmail SMTP    │
│  (vanilla JS)   │◄──►│  Static + Node  │───►│  (nodemailer)  │
│  dashboard.html │    │  Functions      │    │  → TARGET_EMAIL│
│  submit.html    │    │  api/submit.js  │    └────────────────┘
│  status.html    │    │  api/status.js  │           │
└─────────────────┘    └────────┬────────┘           │
                                 │                    ▼
                                 │           ┌────────────────┐
                                 │           │  收件人收信    │
                                 │           │  → 進入處理    │
                                 │           └────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  /tmp 或 data/  │
                        │  reports.json   │
                        │  (KeyValue 儲存)│
                        └─────────────────┘
```

### 5.1 Module Map
- `index.html` — 入口（302 → `dashboard.html`）
- `dashboard.html` — 登陸頁（Hero + 6 特色 + 3 步驟 + 6 場景 + CTA + Footer）
- `submit.html` — 回報頁（表單 + 拖曳上傳 + 預覽 + 成功卡片）
- `status.html` — 查詢頁（輸入框 + 自動帶入 + 三步驟時間線）
- `server.js` — 本地 Express 開發伺服器（含 Multer + Nodemailer 完整 stack）
- `api/submit.js` — Vercel Function：POST 接收 + 寫入 JSON + 寄信
- `api/status.js` — Vercel Function：GET 查詢 + 回傳 report
- `src/lib/imageCompression.js` — 瀏覽器端圖片壓縮（`browser-image-compression`）
- `vercel.json` — Vercel builds + routes 設定
- `data/reports.json` — 本地儲存（gitignored）
- `uploads/` — 本地上傳暫存（gitignored，發信後清空）

### 5.2 環境變數
- 本地開發：`GMAIL_USER` / `GMAIL_APP_PASSWORD` / `TARGET_EMAIL`（於 shell export）
- Vercel：同三項，於 Vercel Dashboard → Settings → Environment Variables 設定
- 部署後可在 Vercel Secrets 加密儲存，無需寫入程式碼

### 5.3 降級策略
- **Gmail SMTP 失敗** → 仍回傳 200 + trackingId（信寄失敗不擋提交），console.error log
- **JSON 讀寫失敗** → 退回空物件 `{}`；寫入失敗 → console.error（不擋 200）
- **追蹤 ID 碰撞**（理論上 36^8 空間夠大） → 若重複則重生成一次
- **檔案上傳超 10MB** → Multer 回 413，前端 alert
- **MIME 不是 image** → Multer 拒絕，前端提示「只接受圖片」

---

## 6. Definition of Done

- [x] 功能 P0 全部實作（FR-001 至 FR-013）
- [x] `npm run build` 綠（echo "No build step required"）
- [x] `npm start` Express 本地伺服器啟動成功
- [x] 既有 `SPEC.md` v2.0.0 保留（historical reference）
- [x] GHA CI 跑 4 jobs（lint / test / build / deploy to Vercel）
- [x] README 反映現況（v3.0.2 完成於 2026-09-06）
- [x] `PRD/SPEC.md` v3.0.2 文件齊全
- [x] `PRD/CHANGELOG.md` 含 v3.0.2 / v2.0.0 對照

---

## 7. 部署契約

| 環境 | 目標 | 觸發 |
|---|---|---|
| Production | Vercel（`https://report-form-xi.vercel.app`） | push to main / master |
| Preview | Per-PR Vercel Preview | PR opened |
| Local | `http://localhost:3000`（Express） | `npm start` |

> **為何是 Vercel 不是 Pages**：本專案有 serverless API（`api/submit.js` / `api/status.js`）需要 Node.js runtime，GitHub Pages 只能服務純靜態檔。Vercel 同時支援 `@vercel/static`（HTML）和 `@vercel/node`（API），一站搞定。

### 7.1 GHA Workflow
- `.github/workflows/ci.yml`
- jobs: lint / test / build / deploy
- deploy: `vercel`（使用 `amondnet/vercel-action@v25`）
- secrets 需求：`VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`

### 7.2 環境變數
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `TARGET_EMAIL`（Vercel Dashboard 設定）
- BYOK 概念：使用方提供自己的 Gmail 帳號，零供應商鎖定

---

## 8. Out of Scope（不做的）

- 不做帳號系統（公開 URL + Email 通知）
- 不做管理後台 / Dashboard（管理者直接看 Gmail）
- 不做付費牆（v1 完全免費，無儲存免費額度）
- 不做原生 App
- 不做多語系（zh-TW only）
- 不做狀態變更（pending → done 由人工在後台改，現版本不實作）
- 不做檔案雲端相簿（照片隨信寄出即刪）

---

## 9. 變更日誌

見 [`PRD/CHANGELOG.md`](PRD/CHANGELOG.md)

---

## 附錄 A：v2.0.0 → v3.0.2 對照

| 項目 | v2.0.0（既有） | v3.0.2（本版本） |
|---|---|---|
| 入口規格書 | `SPEC.md`（根目錄） | `PRD/SPEC.md`（新路徑，9 章） |
| 變更日誌 | 無 | `PRD/CHANGELOG.md`（新檔） |
| CI workflow | 無 | `.github/workflows/ci.yml`（4 jobs 新增） |
| 部署契約章節 | 無 | §7 完整定義 |
| 降級策略章節 | 無 | §5.3 5 條策略 |
| Non-Goals | 無明確列出 | §1.4 5 條明確不做 |
| 既有 v2.0.0 內容 | 保留 | 保留（向後相容） |

---

<!-- v3.0.2 完成於 2026-09-06 by Sean 10-repo-fleet -->
