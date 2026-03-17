# Firebase 設定說明

## 1) 前端環境變數

請在 `app/.env` 依照 `app/.env.example` 填入：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## 2) Firebase 功能

目前已接入：

- 匿名登入（Anonymous Auth）
- 小隊資料：`teams/{teamId}`
- 關卡進度：`teams/{teamId}/progress/{levelId}`
- 冷卻時間：`teams/{teamId}/cooldowns/{levelId}`
- 上傳紀錄：`teams/{teamId}/uploads/{autoId}`
- 掃碼紀錄：`teams/{teamId}/scanAccess/{routeKey}`

## 3) Firebase Storage 上傳流程

前端可直接使用 Firebase SDK 上傳，流程如下：

1. 前端使用 `uploadBytes` 將圖片寫入 Firebase Storage 路徑（例如：`uploads/{teamId}/{levelId}/...`）。
2. 上傳成功後使用 `getDownloadURL` 取得可讀取的圖片 URL。
4. 將圖片 URL 寫回 Firestore 上傳紀錄與關卡進度。

## 4) Firebase Storage 規則建議

可先使用測試規則（僅供開發）：

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{teamId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

若專案使用匿名登入，`request.auth != null` 同樣可通過驗證。

## 5) Firestore 規則建議（重要）

目前專案有「跨隊伍查詢合成支援」需求（`getSynthesisSupportPlan` 會讀取其他隊伍的 session 進度），
如果 Firestore 規則只允許 `request.auth.uid == teamId` 的全路徑讀取，就會造成監聽或查詢資料不更新。

請改用以下規則（可直接貼到 Firestore Rules）：

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }
    function isOwner(teamId) {
      return signedIn() && request.auth.uid == teamId;
    }

    // teams 主文件：自己可讀寫；其他登入隊伍可讀（供合成支援查詢 teamName / activeSessionId）
    match /teams/{teamId} {
      allow read: if signedIn();
      allow write: if isOwner(teamId);
    }

    // 自己的常用資料：只允許本人讀寫
    match /teams/{teamId}/progress/{levelId} {
      allow read, write: if isOwner(teamId);
    }
    match /teams/{teamId}/cooldowns/{levelId} {
      allow read, write: if isOwner(teamId);
    }
    match /teams/{teamId}/uploads/{uploadId} {
      allow read, write: if isOwner(teamId);
    }
    match /teams/{teamId}/scanAccess/{routeKey} {
      allow read, write: if isOwner(teamId);
    }

    // challengeSessions 主文件：自己可讀寫；其他登入隊伍可讀（供查 activeSessionId）
    match /teams/{teamId}/challengeSessions/{sessionId} {
      allow read: if signedIn();
      allow write: if isOwner(teamId);
    }

    // session progress：自己可寫；登入隊伍可讀（供跨隊伍合成支援統計）
    match /teams/{teamId}/challengeSessions/{sessionId}/progress/{levelId} {
      allow read: if signedIn();
      allow write: if isOwner(teamId);
    }

    // 其他未列出的 teams 子集合，預設只允許本人
    match /teams/{teamId}/{document=**} {
      allow read, write: if isOwner(teamId);
    }
  }
}
```

## 6) 手機測試建議

- Android Chrome：測試登入、全螢幕、QR 掃描、拖曳、Level6 上傳。
- iOS Safari：重點驗證全螢幕降級提示與相機權限流程。
