# report-form · 變更日誌

> 對齊 SPEC v3.0 契約，採 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/) 格式 + [語意化版本](https://semver.org/lang/zh-TW/)。

---

## [v3.0.2] — 2026-09-06 — Sean 10-repo-fleet 升級

### Added
- `PRD/SPEC.md`：v3.0.2 入口規格書（9 章 / ~330 行），含問題陳述、5 種 persona、5 條 Non-Goals、mermaid 流程圖、6 個主要場景、16 條 FR、10 維度 NFR、完整架構圖、Module Map、5 條降級策略、6 條 DoD、部署契約、Out of Scope、附錄 A（v2.0.0 對照表）
- `PRD/CHANGELOG.md`：本檔（v3.0.2 / v2.0.0 對照）
- `.github/workflows/ci.yml`：4-job CI（lint / test / build / deploy to Vercel）
  - lint：`npm run lint`（無 lint script 時 continue-on-error）
  - test：`npm test -- --run`（無 test script 時 echo skip）
  - build：`npm run build`（echo "No build step required"）
  - deploy：`amondnet/vercel-action@v25`（需 `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` secrets）

### Changed
- 無（純新增文件，production code 不動）

### Deprecated
- 無

### Removed
- 無

### Fixed
- 無

### Security
- 無

---

## [v2.0.0] — 2025-04-23 — 既有版本

### Added
- `dashboard.html`：登陸頁（Hero + 6 特色 + 3 步驟 + 6 場景 + CTA）
- `submit.html`：回報表單 + 圖片拖曳上傳 + 預覽 + 成功卡片
- `status.html`：查詢頁 + 三步驟時間線
- `api/submit.js`：Vercel Function（POST 接收 + Gmail SMTP + 寫入 JSON）
- `api/status.js`：Vercel Function（GET 查詢）
- `server.js`：本地 Express 開發伺服器
- `vercel.json`：Vercel builds + routes 設定
- `src/lib/imageCompression.js`：瀏覽器端圖片壓縮
- `SPEC.md`（根目錄）：v2.0.0 規格書（207 行）

### Notes
- 既有 v2.0.0 SPEC.md 保留為 historical reference
- v3.0.2 文件全部移至 `PRD/` 子目錄

---

<!-- v3.0.2 完成於 2026-09-06 by Sean 10-repo-fleet -->
