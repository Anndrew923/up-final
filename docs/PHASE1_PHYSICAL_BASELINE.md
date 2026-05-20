# Phase 1 — 身體基準（Home Physical Baseline）— **範圍鎖定**

> **術語**：此处的 **Phase 1** 指「首頁身體資料」這一個切片，**不等於**《migration.mdc》裡遷移優先級的 **P1**（訂閱／雲端／六維對齊等）。

## 目標（一句話）

使用者在 **Home** 可輸入並持久化 **性別、年齡、身高（cm）、體重（kg）**，作為後續評測換算的 **唯一本機基準來源**（Core、無需登入）。

---

## In scope（Phase 1 必須交付）

| 區域         | 要求                                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **型別**     | `PhysicalProfile` / `PhysicalProfileGender`（`src/types/userProfile.ts`）                                                        |
| **領域驗證** | `validatePhysicalProfile`、`isPhysicalProfileComplete`、`PHYSICAL_LIMITS`（`src/logic/core/physicalProfile.ts`），**無外部 SDK** |
| **持久化**   | `up.physicalProfile`（`loadPhysicalProfile` / `savePhysicalProfile`）、跨分頁事件（`src/services/localStorageService.ts`）       |
| **UI**       | `HomeProfileForm` 掛在 `HomePage`、**Tailwind + 既有 `ui-*` 元件**、**全表單 i18n**                                              |
| **文案**     | 英語 `en` 完整；**本表單相關**繁中 **zh-Hant** 有對應 key（`home.profile.*` 等）                                                 |
| **測試**     | `physicalProfile` 之邏輯單元測試通過                                                                                             |
| **品質**     | 自訂 hook 內 **Hook 順序固定**、計時器有 **unmount / 重送** 清理，不違反 Rules of Hooks                                          |

---

## Out of scope（不屬於 Phase 1，明確 defer）

下列項目 **不得** 算作 Phase 1 未完，應排到後續切片：

- Assessment／六維輸入 **自動讀取** `loadPhysicalProfile()` 並帶入計分（屬 **Phase 2 — 評測銜接**）。
- **暱稱／displayName** 與 `LocalProfile` 合併、隨機暱稱（reference BasicInfo 延伸）。
- **`CloudBackupPayload`** 纳入身體資料、Pro 備份還原擴充。
- **Firebase Auth**、天梯／Firestore 行為變更。
- **全站** `zh-Hant/common.json` 與 `en` **逐 key 對齊**（僅要求 Phase 1 触及的文案双语）。
- **TrainingProfile**：職業、國家縣市等（reference `TrainingProfileForm` 級）。

---

## Definition of Done（Phase 1 視為「結案」的條件）

- [ ] 無 `LocalProfile`／元件內硬編碼使用者可見文案（表單與錯誤訊息走 i18n）。
- [ ] `npm run lint`、`npm test`、`npm run build` 通過。
- [ ] 重整頁面後身體資料仍存在；清空本機資料流程若存在，會一併清除 **`up.physicalProfile`**（與既有 `clearLocalData` 行為一致）。
- [ ] 不依賴 Pro／Firestore 即可完成輸入與儲存（**Non-Pro 零 leaderboard 流量**規則不受影響）。

---

## 实作索引（給接手／審查）

| 項目 | 路徑                                                                                        |
| ---- | ------------------------------------------------------------------------------------------- |
| 型別 | `src/types/userProfile.ts`                                                                  |
| 驗證 | `src/logic/core/physicalProfile.ts`、`src/logic/core/__tests__/physicalProfile.test.ts`     |
| 儲存 | `src/services/localStorageService.ts`（`PHYSICAL_PROFILE_STORAGE_KEY` 等）                  |
| Hook | `src/hooks/usePhysicalProfileForm.ts`                                                       |
| UI   | `src/components/home/HomeProfileForm.tsx`、`src/pages/HomePage.tsx`                         |
| i18n | `src/i18n/locales/en/common.json`、`src/i18n/locales/zh-Hant/common.json`（`home.profile`） |

---

_文件版本：與 Repo 現況對齊；若範圍需擴張請改文件並標註新版本日期。_
