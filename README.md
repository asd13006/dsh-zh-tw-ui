# dsh-zh-tw-ui

將 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI 一鍵切換為**繁體中文**的插件。

> English: A DSH plugin that adds **繁體中文 (Traditional Chinese)** to the Web UI language options. Known UI strings use hand-polished translations; any *new / updated / third-party* strings are auto-converted at runtime from Simplified Chinese — so upstream UI updates and other plugins are covered **without re-translating**.

## 功能特性

- 在「設定 → 通用 → 語言」選單中新增 **「繁體中文」**（與原有 中文 / English 並列）。
- **706 條精譯**：官方全部 locale namespace 的 UI 字串已逐條手工翻譯為地道繁體中文（設置→設定、網絡→網路、文件→檔案、軟件→軟體、數據→資料、默認→預設、隊列→佇列、緩存→快取…；英文內容保持英文）。
- **運行時自動轉換（備援機制）**：任何未含精譯的簡中字串（官方新版本新增或改動的字串、**第三方插件**註冊的 namespace，例如 dsh-chat-import 的「导入会话」→「導入會話」），顯示時以內置簡→繁字元表（720+ 字）即時轉為繁體。
- **DOM 層備援轉換**：插件市場描述、README 等由數據或組件直接渲染、不經 locale 字典的內容，在繁體中文模式下以 MutationObserver 將渲染出的簡體即時轉為繁體（輸入框、代碼塊等用戶內容一律排除）；切換回其他語言時自動還原。
- **持久化**：語言選擇存於瀏覽器 `localStorage`，重新載入或重開網頁後仍保持繁體。
- **零侵入**：純 client 插件，不改動任何上游套件；locale 服務缺失時靜默降級，不影響其他插件。

## 安裝方式

**推薦：GitHub 安裝（可直接把此連結交給 agent 或自行執行）**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-zh-tw-ui
```

或直接讓 agent 安裝：把本倉庫連結貼給 DSH 的 agent，指示其執行上述命令即可。

安裝後重啟 `dsh web`，在「設定 → 通用 → 語言」中選擇「繁體中文」即可。

**移除（重要）**：請使用 `dsh plugin remove`，它會同步清理 profile 的 bundle 清單；手動刪除套件可能導致殘留引用令 DSH 無法啟動：

```bash
dsh plugin --profile web remove dsh-zh-tw-ui
```

**npm 安裝（發佈至 npm 後可用）**：

```bash
dsh plugin --profile web add dsh-zh-tw-ui
```

## 運作原理

```
locale translate(ns, key)
        │
        ├─ active = zh-TW ？
        │     ├─ 存在精譯字典（DICTS）？  → 直接返回精譯
        │     └─ 不存在（新字串 / 第三方插件）
        │           └─ 取 zh 字典值 → 字元表逐字簡→繁 → 返回
        └─ 其他語言 → 原樣交由 dsh-client-locale 處理
```

插件啟動時：

1. 註冊全部 namespace 的 zh-TW 精譯字典；
2. 包裝 `locale.translate`（字典備援轉換）、`locale.setLocale`（接受 zh-TW、寫入 localStorage）；
3. 將「繁體中文」加入語言選項列表（patch locale snapshot 並觸發 `locale/change` 刷新語言行）；
4. 包裝 `locale.adopt`——內建 locale 的 host 偏好為異步載入，載入後會以 `locale.preference ?? 瀏覽器語言` 重置 active；若用戶偏好為 zh-TW 則重新斷言為繁體；
5. 啟動 DOM 層備援轉換（MutationObserver），在繁體中文模式下將非字典內容（如插件市場描述）即時轉為繁體，切換回其他語言時還原。

## 官方更新後是否需要重新翻譯？

**無需。** 具備三層防護：

1. 官方新增的字串 → 由運行時自動轉換備援機制直接覆蓋；
2. 官方改動的字串 → 精譯字典保留舊值，但第三方或新增字串同樣自動轉換；如需更新精譯可重新生成（見下文）；
3. 如需完全同步精譯：執行一次重新生成流程即可，無需逐條手工翻譯。

### 重新生成精譯字典（可選）

```bash
node scripts/extract.mjs <node_modules/@deepseek-ai 路徑>   # 1. 抽取官方最新 zh 字典至 src/zh-src/
# 2. 翻譯 src/zh-src/*.json → src/zh-tw/*.json（可用 LLM 批量處理，key/佔位符必須一致）
node scripts/assemble.mjs                                   # 3. 重新生成 lib/client.js
```

### 檢查未收錄簡體字（官方或第三方更新後執行）

```bash
node scripts/collect-chars.mjs [第三方client.js...]   # 收集所有出現的簡體字
node scripts/check-missing-chars.mjs                  # 列出字元表未收錄的簡體專用字
```

若檢測到未收錄字，請在 `src/zh-tw-parts/chars.json` 中補上「簡體字: 繁體字」映射，再執行 `node scripts/assemble.mjs`。

## 目錄結構

```
dsh-zh-tw-ui/
├── package.json              # 插件清單（dsh.client.inject / bundle.patch）
├── index.mjs                 # Host 側：no-op 入口（純 client 插件）
├── cordis.patch.yml          # Host 插件入口
├── lib/client.js             # 生成的 browser bundle（請勿手動修改）
├── src/
│   ├── zh-src/               # 抽取自官方的 zh 簡中字典（生成數據）
│   ├── zh-tw/                # 精譯繁中字典（人工/LLM 翻譯，質量基準）
│   ├── zh-tw-parts/
│   │   ├── chars.json        # 簡→繁單字表（運行時備援轉換用）
│   │   ├── simplified-only.txt  # 簡體專用字檢查表（維護用）
│   │   └── collected-chars.txt  # collect-chars 輸出
│   └── TERMINOLOGY.md        # 術語對照表（精譯時參考）
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright 端到端驗證腳本
```

## 已知限制

- 一對多簡體字（如「复」在 复制/恢复/复杂 中對應不同繁體）僅做單字映射（復），精譯字典已覆蓋主要字串；極少數新增字串可能出現不完全的轉換。
- 語言偏好存於瀏覽器 `localStorage`（各瀏覽器相互獨立）；內建 locale 對遠端瀏覽器本就不持久，此為一致的設計。
- 字元表未收錄的簡體字會原樣透傳——請以 `check-missing-chars.mjs` 定期檢查並補表。

## 安全性與隱私

- **無網路通訊**：插件不會發起任何網路請求（無 fetch / WebSocket / 上報）；唯一的對外 URL 僅為 README 中的文件連結。
- **不收集資料**：無 telemetry、無 analytics、無錯誤上報；唯一持久化的資料是瀏覽器 `localStorage["dsh-zh-tw-ui.preference"]`（值僅為 `"zh-TW"` 或不存在）。
- **不觸及敏感資料**：不讀寫 credentials / tokens / 會話記錄 / 檔案系統；Host 側（`index.mjs`）為 no-op，一無所動。
- **DOM 轉換為唯讀**：僅修改 DOM 文字節點（text node），無 innerHTML、無注入；輸入框、textarea、contenteditable、代碼塊（pre/code）一律排除，不影響用戶輸入或程式碼。顯示層的會話訊息會被轉換（僅為唯讀顯示效果，底層資料不變），切換回其他語言時自動還原。
- **零供應鏈風險**：`dependencies` 為空，安裝時不會下載任何新套件；client bundle 完全自包含（零 `require`）；peer 依賴均為 DSH 本機已有的官方套件。

## 常見問題（FAQ）

**Q：插件市場（dshmarket）點解冇顯示我個插件的介紹？**
A：市場的介紹與分類來自「awesome-dsh-plugin」策展 registry（`data/plugins/<owner>__<repo>.yml`），並非讀取本地 package.json。提交 `registry-entry.yml` 到該 registry（需 repo 建立滿 1 日且 ≥ 10 個 commit）後即會顯示。

**Q：版本號一定要發佈 npm 先有？**
A：唔使。已安裝插件的版本號由本地 `node_modules` 的 package.json 讀取（GitHub 安裝版同樣顯示 `v0.1.0`）。npm 發佈只影響「npm 搜尋」與「純 npm 安裝」體驗，與市場顯示無關。

**Q：官方更新 UI 或加了新字串，插件要更新嗎？**
A：無需等待插件更新——運行時簡→繁自動轉換會即時覆蓋任何新字串；第三方插件的簡中字串亦自動轉換。精譯字典可用 `scripts/` 重新生成以保持最佳品質。

**Q：移除插件後 DSH 無法啟動？**
A：請務必使用 `dsh plugin --profile web remove dsh-zh-tw-ui` 移除（會同步清理 profile 的 bundle 清單）。手動刪除套件可能留下殘留引用令 DSH 啟動失敗。

## License

MIT
