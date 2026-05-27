# 第一版 Debug APK（實機側載）

本文件描述如何在本機打出 **`app-debug.apk`**、補齊 **Firebase Debug 指紋**，並用 USB 裝機驗收。

---

## 1. 硬性前提（缺一即失敗）

| 項目                       | 說明                                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Android SDK**            | 須有 `android/local.properties`（`sdk.dir=...`）或環境變數 **`ANDROID_HOME`**。最省事：用 Android Studio 開啟 **`android/`** 一次，讓 Studio 自動產生 `local.properties`。 |
| **`google-services.json`** | 必須位於 **`android/app/google-services.json`**（Firebase 下載；套件名 **`com.ultimatephysique.app`**）。                                                                  |
| **Node / npm**             | 與倉庫開發環境一致。                                                                                                                                                       |

---

## 2. 一鍵打包（推薦）

於**專案根目錄**：

```bash
npm run android:apk:debug
```

等價於：

1. `npm run cap:sync`（`tsc -b` + `vite build` + `npx cap sync android`）
2. `cd android && ./gradlew assembleDebug`

**產物路徑**（成功後）：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### 2.1 分拆指令（除錯用）

| 指令                             | 用途                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `npm run android:signing-report` | 列印 **Debug**（與其他 variant）**SHA-1 / SHA-256**，供 Firebase 後台新增指紋 |
| `npm run android:assemble-debug` | 僅 Gradle 組譯（假設已 `cap:sync`）                                           |

---

## 3. Firebase：`fitness-app-69f08` 新增 Debug 指紋（手動）

**無法**由 Agent 代登入 Firebase Console；請 Boss 在瀏覽器完成下列步驟：

1. 開啟 [Firebase Console](https://console.firebase.google.com) → 專案 **`fitness-app-69f08`**。
2. **Project settings**（齒輪）→ **Your apps** → 選 **Android**（`com.ultimatephysique.app`）。
3. **Add fingerprint** → 貼上 **SHA-1**（必要時一併新增 **SHA-256**）。
4. 若 Console 提示更新設定，請**重新下載** `google-services.json` 覆蓋 **`android/app/google-services.json`**，再執行一次 `npm run android:apk:debug`。

### 3.1 指紋從哪裡來？

在專案根目錄執行：

```bash
npm run android:signing-report
```

在輸出中找到 **`Variant: debug`** → 複製 **SHA1** 與 **SHA-256**。

**重要**：每台 Mac 的 **`~/.android/debug.keystore`** 可能不同；**請以 Boss 本機** `signingReport` 輸出為準加入 Firebase。若多人開發，可為每位開發者各加一組 Debug 指紋。

---

## 4. 側載裝機（最快路徑）

1. 用 USB 連接手機，確認已開啟 **USB 偵錯**。
2. 將 **`app-debug.apk`** 拷貝到手機下載資料夾，於手機上點檔案安裝；或於電腦執行：

   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. 若安裝被拒，請在手機上允許「透過 USB 安裝」或關閉廠商安裝來源限制（依機型而定）。

---

## 5. Google 登入仍 `DEVELOPER_ERROR` 時

除 **SHA-1 / SHA-256** 外，請一併核對：

- **套件名** 是否為 **`com.ultimatephysique.app`**（與 Firebase Android App、`google-services.json` 一致）。
- **Google Cloud Console** 內與 OAuth 相關的 Android 用戶端（若有）是否也綁定相同 **package + SHA-1**。

詳見 **`docs/CAPACITOR_ANDROID.md`** §5。

---

## 6. 與 CI / 無 SDK 環境的差異

在**未安裝 Android SDK**的環境（例如部分雲端 Agent）：

- **`./gradlew signingReport`** 仍可能成功（僅讀 keystore）。
- **`./gradlew assembleDebug`** 會失敗並提示 **`SDK location not found`**。

此時請在 **Boss 本機**（已安裝 Android Studio）執行 **`npm run android:apk:debug`** 產出 APK。

---

## 7. 相關文件

- `docs/CAPACITOR_ANDROID.md` — 總覽、Gradle、`cap:open`、SHA 防線
- `docs/REVENUECAT_SETUP.md` — RevenueCat 與原生殼
