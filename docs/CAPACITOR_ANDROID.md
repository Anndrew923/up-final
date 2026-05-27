# Capacitor Android 裝機與點火手冊（Ultimate Physique）

本文件描述如何在本機與實機上，從零啟動 **Vite Web 資產 + Capacitor Android 殼 + Firebase（Google 登入）** 的完整路徑。  
套件名稱（`applicationId`）固定為 **`com.ultimatephysique.app`**，須與 Firebase Console、Google Play Console、RevenueCat Android App 完全一致。

---

## 1. 環境宣告（硬性前提）

| 項目               | 要求                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **JDK**            | **17+**（建議與 Android Studio 內建 JDK 一致，避免多 JDK 混用）                                               |
| **Android Studio** | **最新穩定版**（能建立 API 36 專案即可；AGP 由專案鎖定，不需手動對齊小版本號）                                |
| **Android SDK**    | 透過 Android Studio **SDK Manager** 安裝；編譯目標見 `android/variables.gradle`（`compileSdk` / `targetSdk`） |
| **Node.js**        | 與 repo 開發環境一致（建議 LTS；本倉以 `npm` 為準）                                                           |
| **實機**           | 開啟 **開發人員選項 → USB 偵錯**；首次連線需在手機上允許此電腦偵錯                                            |

---

## 2. 金鑰與 Firebase 晶片（一次對齊）

### 2.1 前端環境變數（`.env`，勿提交）

於專案根目錄建立 `.env`（可從根目錄 **`.env.example`** 複製結構），至少包含：

- **Firebase Web**：`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID`、`VITE_FIREBASE_APP_ID`
- **天梯 Callable（選用）**：`VITE_LADDER_CALLABLE_WRITES`、`VITE_FIREBASE_FUNCTIONS_REGION`
- **RevenueCat（Android 真機訂閱）**：`VITE_RC_API_KEY_ANDROID`、`VITE_RC_ENTITLEMENT_ID`、`VITE_RC_PACKAGE_ID`

說明：`.env` 僅供 **Vite 打包進 `dist/`**；不含 Android 原生專用密鑰。Android 原生 Firebase 客戶端識別依 **`google-services.json`**（見下節）。

### 2.2 `google-services.json`（必放、且路徑唯一）

1. 登入 [Firebase Console](https://console.firebase.google.com) → 選專案（例如 **`fitness-app-69f08`**）。
2. **Project settings** → **Your apps** → 若尚無 Android App，請新增，**Android package name** 必須填：**`com.ultimatephysique.app`**。
3. 下載 **`google-services.json`**。
4. 將檔案放在本 repo 的下列路徑（**檔名不可改**）：

   **`android/app/google-services.json`**

5. 此檔含公開客戶端設定，**仍建議不要公開散佈**；本倉 `android/.gitignore` 已預設忽略該檔（依模板註解區塊），每位工程師本機各自放置即可。

> **沒有此檔時**：已套用 **Google Services Gradle 外掛** 的模組在組譯階段會失敗；這是預期行為，用以避免「以為已接上 Firebase 其實沒有」的靜默錯誤。

### 2.3 觸覺回饋（`@capacitor/haptics`）

- Web 層統一由 `src/services/hapticService.ts` 驅動；原生殼使用 Capacitor Haptics，瀏覽器降級為 `navigator.vibrate`。
- `android/app/src/main/AndroidManifest.xml` 已宣告 **`android.permission.VIBRATE`**；`cap sync` 後 Gradle 會納入 `:capacitor-haptics`。
- 系統「減少動態效果」開啟時，觸覺會自動略過（與評測儀式一致）。
- **商業化切片**：Google 登入成功（`firebaseClient`）、Pro 訂閱成功（`subscriptionService`）、天梯上傳（`useLeaderboardUpload` 等）均在服務／Hook I/O 回調觸發，不在 UI 元件散寫。

---

## 3. Android SDK 路徑（`local.properties`）

首次用 **命令列** 執行 `./gradlew` 時，若未設定環境變數 **`ANDROID_HOME`**（或 **`ANDROID_SDK_ROOT`**），Gradle 會要求：

> `SDK location not found ... local.properties`

**建議作法（最省事）**：

1. 用 Android Studio 開啟專案內 **`android/`** 資料夾（見 §4.2）。
2. Studio 會自動在 **`android/local.properties`** 寫入 `sdk.dir=...`（該檔已在 `.gitignore`，不進版控）。

或手動建立 **`android/local.properties`**：

```properties
sdk.dir=/你的/Android/sdk路徑
```

---

## 4. 點火命令流（從 Web 建置到 Run）

### 4.1 同步 Web 資產至 Android 殼

於 **專案根目錄**（`up-final/`，非 `android/`）執行：

```bash
npm install
npm run cap:sync
```

等價於：**`npm run build`**（`tsc -b` + `vite build`）後執行 **`npx cap sync android`**，將 `dist/` 拷貝進 Android 工程。

### 4.2 開啟 Android Studio

於根目錄：

```bash
npm run cap:open
```

在 Android Studio 中：

1. 確認開啟的是 **`android/`** Gradle 專案（Capacitor 標準結構）。
2. 等候 **Gradle Sync** 完成（首次會下載依賴，耗時正常）。
3. 選擇目標裝置（實機或模擬器）→ 點擊綠色 **Run**（`app`）。

### 4.3 僅驗證 Web 層（不開 Android Studio）

```bash
npm run build
```

此指令**不**觸發 Gradle；用於快速確認 TypeScript / Vite 產物無誤。

---

## 5. Google 登入（原生，非網頁 Redirect）

Android/iOS 殼內使用 **`@capacitor-firebase/authentication`** 走 **原生 Google 帳號選擇器**，再以 `signInWithCredential` 同步至 Firebase JS Auth（見 `src/services/firebaseNativeAuth.ts`）。  
**不會**再開 `firebaseapp.com` 的 redirect 頁，可避免 `missing initial state` / `sessionStorage` 錯誤。

前提：

- `capacitor.config.ts` 已啟用 `FirebaseAuthentication.providers: ['google.com']`
- `android/variables.gradle` 含 `rgcfaIncludeGoogle = true`
- 已執行 `npx cap sync android` 後重裝 APK

---

## 6. 天梯與 Google 登入：SHA-1 簽章防線（必讀）

若 **Google 登入** 在 App 內失敗（常見：錯誤碼 `DEVELOPER_ERROR`、Auth 彈窗立即關閉、或後端拒絕），九成是 **SHA 指紋未註冊**。

### 5.1 為什麼要兩組指紋？

| 簽章類型               | 用途                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| **Debug**              | 本機 `Run`、日常偵錯                                              |
| **Release / 上傳金鑰** | Play 內測／正式軌道安裝的包（與 Play App Signing 實際簽署鍵有關） |

兩者指紋不同；**Firebase 與 Google Cloud OAuth 用戶端**需分別加入，否則對應安裝來源的登入會失敗。

### 5.2 取得 SHA-1（範例指令）

於 **`android/`** 目錄：

```bash
# Debug（預設 debug.keystore）
./gradlew signingReport
```

從輸出複製 **SHA1**（與 **SHA-256** 若後台要求）。

Release 請使用 **Play Console → 版本 → App integrity**（或 Play App Signing 頁面）提供的 **App signing key certificate** 指紋；若你本地另有 upload keystore，亦需一併對照。

### 5.3 要填到哪裡？

1. **Firebase Console** → Project settings → 你的 **Android app** → **Add fingerprint** → 貼上 **Debug** 與 **Release（Play）** 的 SHA-1（必要時含 SHA-256）。
2. **Google Cloud Console**（若使用 Web OAuth Client ID 綁 Android）：對應 **OAuth 2.0 Client** 的 Android 設定中，加入相同 **package name + SHA-1**。
3. **Google Play Console**：與 **Play Integrity / 連結 Cloud 專案** 相關的檢查清單，依 Google 當前後台文案完成（避免僅改 Firebase 忘記 Play 側）。

完成後建議 **重新下載** `google-services.json`（若 Console 提示配置更新），再覆蓋 **`android/app/google-services.json`**，最後 **`npm run cap:sync`** 與 Android Studio **Rebuild**。

---

## 7. Gradle：Firebase 外掛線路（維運備忘）

| 檔案                           | 角色                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`android/settings.gradle`**  | `pluginManagement { repositories { google(); ... } }`，讓 **`com.google.gms.google-services`** 可由 Google Maven 解析                 |
| **`android/build.gradle`**     | `plugins { id 'com.google.gms.google-services' version '4.4.1' apply false }`（置於 **`buildscript {}` 之後**，符合 Gradle 語法順序） |
| **`android/app/build.gradle`** | 檔案末端 **`apply plugin: 'com.google.gms.google-services'`**（須在 `com.android.application` 與 `android {}` 設定之後）              |

**注意**：執行 **`npx cap update android`** 時，Capacitor 可能覆寫部分 Gradle 模板檔；若外掛區塊被沖掉，請以此手冊與 git diff 為準回補。

---

## 8. 品質閘門（與 Android 並行）

於專案根目錄：

```bash
npm run lint && npm test && npm run build
```

Android 原生組譯另需本機 **Android SDK** 與 **`google-services.json`**；CI 若僅跑 Web，不需安裝 SDK。

---

## 9. 常見故障排除（冷啟動）

| 現象                                    | 檢查                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Gradle：`SDK location not found`        | **`android/local.properties`** 的 `sdk.dir` 或 **`ANDROID_HOME`**                            |
| Gradle：`google-services.json` 相關錯誤 | 檔案是否在 **`android/app/`**、package name 是否為 **`com.ultimatephysique.app`**            |
| Google 登入失敗                         | **SHA-1** 是否同時涵蓋 **Debug** 與 **Play 安裝來源**；`google-services.json` 是否為最新下載 |
| Web 正常、App 內 Firebase 異常          | 確認已 **`npm run cap:sync`** 再 Run；避免只更新程式未同步 `dist/`                           |

---

## 10. 相關文件

- `docs/DEBUG_APK.md` — **Debug APK** 一鍵打包、`signingReport`、Firebase 指紋、側載
- `docs/REVENUECAT_SETUP.md` — RevenueCat 與 `cap:sync` / `cap:open`
- `docs/FIREBASE_LEADERBOARD_SETUP.md` — Web Firebase 與天梯
- `docs/FIREBASE_EMULATOR.md` — 本機 Emulator（與實機無關時使用）
