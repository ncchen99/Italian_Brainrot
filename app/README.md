# app（前端技術說明）

本資料夾是遊戲前端程式，使用 React + Vite + Tailwind + Firebase。

## 技術棧

- React 19
- Vite 7
- Tailwind CSS 4
- React Router
- Firebase（Auth / Firestore / Storage）
- html5-qrcode（掃碼）
- dnd-kit（拖曳互動）

## 快速開始

```bash
cd app
npm install
npm run dev
```

常用指令：

- `npm run dev`：開發模式
- `npm run build`：正式建置
- `npm run preview`：預覽建置結果
- `npm run lint`：程式碼檢查

## 環境變數

請建立 `app/.env`（可參考 `.env.example`）並設定：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

若未完整設定，系統會進入本機 fallback 模式（不連 Firebase）。

## 主要資料流

- 小隊登入：匿名登入 + `teams/{teamId}` 小隊檔案
- 關卡進度：`teams/{teamId}/progress/{levelId}`
- 挑戰場次：`teams/{teamId}/challengeSessions/{sessionId}`
- 掃碼紀錄：`teams/{teamId}/scanAccess/{routeKey}`
- 冷卻資料：`teams/{teamId}/cooldowns/{levelId}`
- 上傳紀錄：`teams/{teamId}/uploads/{uploadId}`

## 測試流程建議

1. 先登入建立小隊
2. 以 QR 或短碼（`1`~`8`）依序測關
3. 驗證關卡完成後進度是否更新（背包與任務狀態）
4. 測試合成站是否能依食材狀態正確進入
5. 測試跨隊合作（至少兩台裝置）

QR code 對照請見：`../docs/QR_Code_文字清單.md`

## 測試清除教學（隱藏維護入口）

此專案提供一個**隱藏重置頁**，可在測試後快速清除帳號與紀錄。

### 使用方式

1. 直接進入路由：`/_sync/health-check-9a7f`
2. 輸入維護碼：`RESET-ITALIA-2026`
3. 輸入目前小隊名稱
4. 長按按鈕約 2.8 秒，執行清除

### 會清掉哪些資料

- Firestore `teams/{teamId}` 主文件
- `progress`、`uploads`、`scanAccess`、`cooldowns`
- `challengeSessions` 與其 `progress`/`cooldowns` 子集合
- 本機 `localStorage` / `sessionStorage` 相關快取
- 目前匿名使用者（可刪除時會刪除，否則登出）

### 安全建議（正式活動前請做）

- 到 `src/pages/HiddenResetPage.jsx` 變更 `SECRET_PASSPHRASE`
- 到 `src/App.jsx` 變更隱藏路由字串
- 不要在對外文件或投影畫面展示此入口資訊
