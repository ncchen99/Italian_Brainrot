# QR Code 文字清單

本文件整理目前專案中「掃描 QR Code」功能實際使用的文字內容，來源為 `app/src/scanCodes.js`。

## 正式 QR Code 文字

| 關卡 | 角色/站點 | QR Code 文字 | 導向路由 |
| --- | --- | --- | --- |
| Level 1 | Cappuccino Assassino | `IBR-2026-L1-CAPU-9X2K` | `/intro/level1` |
| Level 2 | Ballerina Cappuccina | `IBR-2026-L2-BALL-4M7Q` | `/intro/level2` |
| Level 3 | Brr Brr Patapim | `IBR-2026-L3-PATA-8R1D` | `/intro/level3` |
| Level 4 | Bombardilo Crocodilo | `IBR-2026-L4-BOMB-2V6N` | `/intro/level4` |
| Level 5 | Lirili Larila | `IBR-2026-L5-LIRI-7H3P` | `/intro/level5` |
| Level 6 | Tung Tung Tung Sahur | `IBR-2026-L6-TUNG-5C8W` | `/intro/level6` |
| Level 7 | Tralalero Tralala | `IBR-2026-L7-TRAL-1J9F` | `/intro/level7` |
| Synthesis | Synthesis Station | `IBR-2026-L8-SYNT-3T4Y` | `/synthesis` |

## 可接受的短碼別名

掃描文字若為以下單一數字，系統也會自動轉成對應正式碼：

| 短碼 | 對應正式 QR Code 文字 |
| --- | --- |
| `1` | `IBR-2026-L1-CAPU-9X2K` |
| `2` | `IBR-2026-L2-BALL-4M7Q` |
| `3` | `IBR-2026-L3-PATA-8R1D` |
| `4` | `IBR-2026-L4-BOMB-2V6N` |
| `5` | `IBR-2026-L5-LIRI-7H3P` |
| `6` | `IBR-2026-L6-TUNG-5C8W` |
| `7` | `IBR-2026-L7-TRAL-1J9F` |
| `8` | `IBR-2026-L8-SYNT-3T4Y` |

## 備註

- 掃描輸入會先做 `trim()` 並轉大寫後再比對。
- 目前只接受本文件列出的內容，其他文字會被視為無效 QR Code。
