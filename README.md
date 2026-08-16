# dsh-locale-zh-tw

將 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI 一鍵變成**繁體中文**嘅插件。

> English: A DSH plugin that adds **繁體中文 (Traditional Chinese)** to the Web UI language options. Known UI strings use hand-polished translations; any *new / updated / third-party* strings are auto-converted at runtime from Simplified Chinese — so upstream UI updates and other plugins are covered **without re-translating**.

## 功能

- 設定 → 通用 → 語言 選單新增 **「繁體中文」**（連同原有 中文 / English）。
- **706 條精譯**：官方全部 locale namespace 嘅 UI 字串已逐條手譯成地道繁中（設置→設定、網絡→網路、文件→檔案、軟件→軟體、數據→資料、默認→預設、隊列→佇列、緩存→快取…；英文內容保持英文）。
- **運行時自動轉換兜底**：任何未有精譯嘅簡中字串（官方新版本新增/改動嘅字串、**第三方插件**註冊嘅 namespace，例如 dsh-chat-import 嘅「导入会话」→「導入會話」），顯示時用內置簡→繁字元表（720+ 字）即時轉成繁體。
- **DOM 級兜底轉換**：插件市場描述、README 等由數據/組件直接渲染、唔經 locale 字典嘅內容，繁中模式下用 MutationObserver 將渲染出嚟嘅簡體即時轉繁（輸入框、代碼塊等用戶內容排除）；切返其他語言時自動還原。
- **持久化**：語言選擇存於瀏覽器 `localStorage`，重新載入 / 重開網頁後保持繁體。
- **零侵入**：純 client 插件，唔改任何上游套件；locale 服務缺失時靜默降級，唔影響其他插件。

## 安裝

加入 web profile（`~/.dsh/profiles/web`）：

```bash
dsh plugin --profile web add dsh-locale-zh-tw
```

或手動：喺 `~/.dsh/profiles/web/package.json` 嘅 `dependencies` 加入 `"dsh-locale-zh-tw": "file:<此插件路徑>"`，`dsh.profile.bundles` 加入 `"dsh-locale-zh-tw"`，然後喺 profile 目錄執行 `pnpm install`，最後重啟 `dsh web`。

之後喺 設定 → 通用 → 語言 揀「繁體中文」即可。

## 點樣運作

```
locale translate(ns, key)
        │
        ├─ active = zh-TW ？
        │     ├─ 有精譯字典（DICTS）？  → 直接返回精譯
        │     └─ 冇（新字串 / 第三方插件）
        │           └─ 取 zh 字典值 → 字元表逐字簡→繁 → 返回
        └─ 其他語言 → 原樣交給 dsh-client-locale
```

插件啟動時：

1. 註冊全部 namespace 嘅 zh-TW 精譯字典；
2. 包裝 `locale.translate`（字典兜底轉換）、`locale.setLocale`（接受 zh-TW、寫入 localStorage）；
3. 將「繁體中文」加入語言選項列表（patch locale snapshot + 觸發 `locale/change` 刷新語言行）；
4. 包裝 `locale.adopt`——內建 locale 嘅 host 偏好係異步載入，載入後會用 `locale.preference ?? 瀏覽器語言` 重置 active，若用戶偏好係 zh-TW 則重新斷言為繁體；
5. 啟動 DOM 級兜底轉換（MutationObserver），繁中模式下將非字典內容（插件市場描述等）即時轉繁，切返其他語言時還原。

## 官方更新 UI 點算？要唔要再掃過？

**唔使。** 三層防護：

1. 官方新加嘅字串 → 運行時自動轉換兜底直接覆蓋；
2. 官方改動嘅字串 → 精譯字典保持舊值，但第三方/新增字串照樣自動轉換；想更新精譯可以重新生成（見下）；
3. 想完全同步精譯：跑一次重新生成流程就得，唔使逐條人手翻譯。

### 重新生成精譯字典（可選）

```bash
node scripts/extract.mjs <node_modules/@deepseek-ai 路徑>   # 1. 抽取官方最新 zh 字典到 src/zh-src/
# 2. 翻譯 src/zh-src/*.json → src/zh-tw/*.json（可用 LLM 批量，key/佔位符必須一致）
node scripts/assemble.mjs                                   # 3. 重新生成 lib/client.js
```

### 檢查漏網簡體字（官方/第三方更新後跑一次）

```bash
node scripts/collect-chars.mjs [第三方client.js...]   # 收集所有出現嘅簡體字
node scripts/check-missing-chars.mjs                  # 報出字元表未收錄嘅簡體專用字
```

有報出字就喺 `src/zh-tw-parts/chars.json` 補上「簡體字: 繁體字」映射，再 `node scripts/assemble.mjs`。

## 目錄結構

```
dsh-locale-zh-tw/
├── package.json              # 插件清單（dsh.client.inject / bundle.patch）
├── index.mjs                 # Host 側：聲明 settings namespace「zh-tw」（契約保留）
├── cordis.patch.yml          # Host 插件入口
├── lib/client.js             # 生成嘅 browser bundle（勿手改）
├── src/
│   ├── zh-src/               # 抽取自官方嘅 zh 簡中字典（生成數據）
│   ├── zh-tw/                # 精譯繁中字典（人手/LLM 翻譯，質量基準）
│   ├── zh-tw-parts/
│   │   ├── chars.json        # 簡→繁單字表（運行時兜底用）
│   │   ├── simplified-only.txt  # 簡體專用字檢查表（維護用）
│   │   └── collected-chars.txt  # collect-chars 輸出
│   └── TERMINOLOGY.md        # 術語對照表（精譯時參考）
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright 端到端驗證腳本
```

## 已知限制

- 一對多簡體字（如「复」喺 复制/恢复/复杂 有唔同繁體）只做單字映射（復），精譯字典已覆蓋主要字串；極少數新字串可能出現唔完美轉換。
- 語言偏好存於瀏覽器 `localStorage`（每瀏覽器獨立）；內建 locale 對 remote browser 本來就唔持久，呢個係一致嘅設計。
- 字元表未收錄嘅簡體字會原樣透傳——用 `check-missing-chars.mjs` 定期檢查補表。

## License

MIT
