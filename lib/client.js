/* global window */
// lib/client.js — dsh-locale-zh-tw 的 Browser 侧 bundle（手写 CJS factory，供 dsh web
// 客户端 ModuleLoader 注入）。
//
// 职责：
//  1. 为全部 locale namespace 注册 zh-TW（繁體中文）字典——由简体中文（zh）字典
//     逐条翻译而来（英文内容保持英文），经 dsh-client-locale 的 LocaleRuntime 随
//     DSH web 语言设置切换；
//  2. **运行时自动转换兜底**：对任何没有精译的 zh 字串（官方新增/改动的字串、
//     第三方插件注册的 namespace），显示时用内置简→繁字元表即时转成繁体——
//     因此官方更新 UI 或第三方插件未提供繁中时，都无需重新扫描翻译；
//  3. 把「繁體中文」加入设置页「语言」选择行（patch locale snapshot + 触发
//     locale/change 刷新语言行选项，并包装 setLocale 接受 zh-TW）；
//  4. 用 localStorage 持久化用户选择（语言偏好本就是浏览器本地偏好；内置 locale
//     的 settings 通道对 remote browser 也不持久，且 apiproxy 的 settings 白名单
//     不向插件开放自定义 namespace），刷新后保持繁体中文。
//
// 依赖注入：@deepseek-ai/dsh-client-locale（locale 服务）；locale 服务缺失时
// 静默降级（不注册字典、不改语言行），不破坏其他插件。
window.__ModuleLoader__.load({
  id: "dsh-locale-zh-tw",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const LOCALE_ID = "zh-TW";
    const LOCALE_LABEL = "繁體中文";
    const STORAGE_KEY = "dsh-locale-zh-tw.preference";

    // 全部 namespace 的 zh-TW 字典（由 scripts/assemble.mjs 生成；精译质量基准）
    const DICTS = {
  "common": {
    "ok": "確定",
    "cancel": "取消",
    "close": "關閉",
    "copy": "複製",
    "copied": "複製成功",
    "retry": "重試",
    "loading": "載入中…",
    "load.failed": "載入失敗",
    "submit": "提交",
    "submitting": "正在提交…",
    "next": "下一步",
    "previous": "上一步",
    "skip": "略過",
    "delete": "刪除",
    "edit": "編輯",
    "save": "儲存",
    "search": "搜尋",
    "more": "更多",
    "collapse": "收起",
    "expand": "展開",
    "back": "返回",
    "unknown": "未知",
    "none": "無",
    "truncated": "已截斷"
  },
  "settings.locale": {
    "language.title": "語言"
  },
  "settings.agentPreset": {
    "title": "Agent 預設",
    "description": "對之後新增的會話生效。執行中的會話保持它開始時的預設。",
    "loading": "正在載入預設…",
    "error": "無法載入 Agent 預設。",
    "userTrust": "自訂",
    "seatHint": "即將開始的這個會話所用的 Agent 預設",
    "headerHint": "本會話執行的 Agent 預設，開始時即固定",
    "nav": "Agent 預設",
    "sectionIntro": "預設即一個會話的 Agent 所執行的插件組裝 —— 它的工具、提示詞與能力。複製一份既有預設改成自己的，或用「創造模式」讓 Agent 幫你建立。",
    "builtIn": "內建",
    "setDefault": "設為預設",
    "view": "檢視",
    "presetStandardName": "標準模式",
    "presetStandardDescription": "功能完整的編碼 Agent，支援檔案編輯、Shell、檔案與網頁檢索、Skills、計畫、目標、子代理與工作流程。",
    "presetCodeName": "PTC 模式",
    "presetCodeDescription": "具備標準模式的全部能力，並透過 Code Mode SDK 呈現工具，讓模型用一個 TypeScript 程式組合多步操作。",
    "presetMinimalName": "極簡模式",
    "presetMinimalDescription": "僅提供持久 bash 與 str_replace_editor 的雙工具編碼 Agent。",
    "presetCordisName": "創造模式",
    "presetCordisDescription": "用於建立自訂 Agent preset：具備標準模式的全部能力，並提供執行時期檢查、插件實驗與 preset 創作指導。",
    "duplicate": "複製",
    "duplicateUnavailable": "此部署未設定可寫入的預設目錄",
    "delete": "刪除",
    "presetId": "識別碼",
    "presetIdPlaceholder": "my-agent",
    "displayName": "名稱",
    "displayNamePlaceholder": "選擇器中顯示的名字，預設用識別碼",
    "inUse": "目前使用中",
    "builtInGroup": "內建",
    "customGroup": "自訂",
    "noDescription": "暫無描述。",
    "brokenBadge": "載入失敗",
    "brokenNoCopy": "預設載入失敗，無法複製",
    "copyOf": "複製自",
    "composition": "組裝（agent.cordis.yml）",
    "cancel": "取消",
    "close": "關閉",
    "retry": "重試",
    "copyTitle": "複製預設",
    "copyIntro": "整個預設會在本機複製一份。識別碼將成為目錄名，事後無法更改；其餘內容之後直接在預設自己的檔案裡編輯。",
    "create": "建立",
    "creating": "正在建立…",
    "creatorDraft": "用「創造模式」創作自訂預設",
    "openLocation": "開啟目錄",
    "showLocation": "檢視路徑",
    "revealedPathLabel": "預設檔案：",
    "idRequired": "請填寫識別碼。",
    "idInvalid": "只能使用小寫字母、數字與連字號，且以字母或數字開頭。",
    "idTaken": "該識別碼已被占用。",
    "deleteTitle": "刪除該預設？",
    "deleteDescription": "預設目錄將被刪除。已在其上執行的會話不受影響；新會話將無法再選擇它。",
    "deleteConfirm": "刪除",
    "deleting": "正在刪除…"
  },
  "command": {
    "search.placeholder": "搜尋…",
    "search.aria": "篩選選項",
    "status.loading": "正在載入選項…",
    "status.applying": "正在套用…",
    "status.empty": "無選項",
    "overlay.aria": "/{command} 選項",
    "listbox.aria": "/{command} 相符項目"
  },
  "conversation": {
    "view.chat": "對話",
    "hint.plan": "描述你的任務以產生計畫",
    "hint.goal": "輸入目標，智能體將持續執行",
    "hint.goal.active": "目前目標進行中。可輸入 edit 修改 / pause 暫停 / resume 繼續 / clear 清除",
    "placeholder.plan": "描述你的任務以產生計畫",
    "placeholder.default": "傳訊息給智能體",
    "placeholder.unavailable": "會話不可用",
    "placeholder.parentOffline": "父會話已離線，無法繼續傳送；仍可停止目前執行",
    "placeholder.hero": "描述你想建置的內容",
    "placeholder.workspace": "選擇一個工作區開始",
    "input.commands": "命令",
    "input.stop": "停止產生",
    "input.send": "傳送訊息",
    "placeholder.steerQueue": "Cmd/Ctrl+Enter 插話傳送全部排隊訊息",
    "input.accessMode": "存取模式，目前：{name}",
    "image.dropTitle": "將圖片拖曳到此處即可新增",
    "image.dropDesc": "最多 {count} 張，每張 {size}",
    "image.dropBlocked": "目前無法新增圖片",
    "image.pending": "待傳送圖片",
    "image.openOriginal": "檢視原圖",
    "image.openOriginalLabel": "{label}，點擊檢視原圖",
    "image.remove": "移除圖片 {name}",
    "image.scrollLeft": "向左捲動圖片",
    "image.scrollRight": "向右捲動圖片",
    "image.original": "原圖",
    "image.label": "圖片",
    "image.loadFailed": "圖片載入失敗，點擊重試",
    "image.loading": "圖片載入中…",
    "image.preview": "原圖預覽",
    "image.closePreview": "關閉原圖預覽",
    "image.serviceUnavailable": "圖片讀取服務不可用",
    "image.unsupportedType": "僅支援 PNG、JPG、WebP、GIF 格式的圖片",
    "image.tooMany": "一則訊息最多新增 {count} 張圖片",
    "image.fileTooLarge": "單張圖片不能超過 {size}",
    "image.totalTooLarge": "圖片總大小超過 {size}，請移除部分圖片",
    "image.tooManyPixels": "圖片解析度過大，請壓縮後重試",
    "image.modelUnsupported": "目前模型不支援圖片，請切換支援圖片的模型",
    "image.subagentUnsupported": "子智能體會話暫不支援圖片",
    "image.sendFailed": "圖片傳送失敗（{reason}），請重新新增圖片後再試",
    "context.aria": "上下文已用 {percent}",
    "context.used": "上下文已用",
    "context.system": "系統提示詞",
    "context.tools": "工具",
    "context.messages": "對話訊息",
    "stats.counts": "{turns} 輪 · {steps} 步",
    "stats.llm": "LLM {duration}",
    "stats.toolCall": "工具呼叫 {duration}",
    "stats.ttftAverage": "首 token 平均 {duration}",
    "stats.tokensPerSecond": "{throughput} tok/s",
    "stats.cacheHit": "快取命中 {percent}%",
    "stats.tokens": "輸入 {input} tok · 輸出 {output} tok",
    "settings.enter.title": "繁忙時 Enter 鍵行為",
    "settings.enter.description": "僅在智能體執行時生效；Cmd/Ctrl+Enter 使用另一種行為",
    "settings.enter.queue": "排隊傳送",
    "settings.enter.steer": "插話傳送",
    "access.confirm.title": "確認啟用 Full access？",
    "access.confirm.description": "啟用 Full access 後，agent 將減少確認步驟，並且可以直接執行更多操作，包括敏感操作、檔案修改或外部命令。僅建議在你信任目前任務時使用。",
    "access.confirm.acknowledge": "我已了解風險，並願意繼續",
    "access.confirm.cancel": "取消",
    "access.confirm.enable": "啟用 Full access",
    "hero.headline": "探索未至之境",
    "hero.preview": "預覽版",
    "hero.chooseWorkspace": "選擇工作區",
    "session.hierarchy": "會話層級",
    "details.title": "詳細資料",
    "details.close": "關閉詳細資料",
    "details.empty": "點擊訊息流中的工具列以檢視詳細資料",
    "details.notInWindow": "此呼叫不在目前視窗內",
    "details.input": "輸入",
    "details.output": "輸出",
    "details.running": "執行中…",
    "todo.title": "任務",
    "todo.progress.done": "{done} 已完成",
    "todo.progress.active": "{active} 進行中",
    "todo.progress.pending": "{pending} 待處理",
    "todo.rowTitle": "更新任務清單",
    "todo.completed": "{done}/{total} 已完成",
    "chat.loadingHistory": "載入歷史…",
    "chat.loadError": "歷史載入失敗：{message}（{code}）",
    "chat.loadOlder": "載入更早",
    "chat.toBottom": "回到底部",
    "message.extraBlock": "附加內容區塊",
    "message.contextInjection": "上下文注入",
    "message.contextRecall": "跨會話召回",
    "message.context.instructions.loaded": "已載入",
    "message.context.instructions.added": "已新增",
    "message.context.instructions.updated": "已更新",
    "message.context.instructions.removed": "已移除",
    "message.context.catalog.replaced": "替換目錄",
    "message.context.catalog.more": "…還有 {count} 條",
    "message.context.snapshot.supersedes": "取代先前的快照",
    "message.context.relay.from": "來自會話 {session}",
    "message.context.recall.counts": "保留 {retained} 條 · 省略 {omitted} 條",
    "message.context.recall.truncated": "已截斷",
    "message.compaction": "上下文已壓縮",
    "message.compaction.running": "正在壓縮…",
    "message.compaction.completed": "已壓縮 {items} 條歷史記錄（約 {tokens} tokens）",
    "message.compaction.expand": "點擊檢視壓縮摘要",
    "message.compaction.unavailable": "壓縮摘要不可用",
    "message.unknownSurface": "未知 surface 事件：{type}",
    "message.unknownBlock": "未知內容區塊",
    "message.stopped": "已停止",
    "message.branch": "在新對話中分支",
    "message.branchUnavailable": "僅可從已完成輪次的最後一則訊息分支",
    "message.retry.active": "正在重試模型請求",
    "message.retry.cancelled": "模型請求重試已取消",
    "message.retry.started": "已重試模型請求",
    "message.retry.scheduled": "等待重試模型請求",
    "message.retry.status": "{label}（{retry}/{maximum}） · {seconds}s",
    "message.retry.delay": "重試延遲：",
    "message.retry.failure": "失敗原因：",
    "message.turnError": "本輪執行失敗",
    "message.maxTokens": "已達到輸出 token 上限",
    "message.maxTokens.hint": "回答被截斷，已有輸出保留在對話中。傳送「繼續」可讓模型接著輸出。",
    "message.ranFor": "耗時 {duration}",
    "message.ttft": "首 token {seconds}秒",
    "message.tokensPerSecond": "{tps} tok/s",
    "duration.seconds": "{seconds}秒",
    "duration.minutes": "{minutes}分{seconds}秒",
    "command.running": "執行中…",
    "command.failed": "命令失敗",
    "command.done": "已完成",
    "command.title": "命令",
    "approval.waiting": "等待審核",
    "approval.detail.aria": "審核詳細資料",
    "approval.escalation": "工具 {toolName} 請求越權執行",
    "approval.reject": "拒絕",
    "approval.allowOnce": "允許一次",
    "ask.rowTitle": "提問",
    "ask.waiting": "等待回答",
    "ask.cancelled": "已取消",
    "ask.interrupted": "已中斷",
    "ask.answered": "{answered}/{total} 已回答",
    "bash.running": "執行中",
    "bash.failed": "失敗",
    "bash.stopped": "已停止",
    "row.running": "執行中",
    "row.failed": "失敗",
    "row.stopped": "已停止",
    "queue.count": "{n} 條排隊訊息",
    "queue.edit": "編輯排隊訊息",
    "queue.edit.unsupported": "包含非文字內容，暫不支援編輯",
    "queue.save": "儲存排隊訊息",
    "queue.cancelEdit": "取消編輯",
    "queue.remove": "刪除排隊訊息",
    "queue.steer": "插話傳送",
    "queue.steer.unavailable": "僅執行中可插話傳送",
    "queue.editFailed": "編輯失敗：這則訊息可能已經開始傳送。",
    "queue.removeFailed": "刪除失敗：這則訊息可能已經開始傳送。",
    "queue.steerFailed": "插話傳送失敗，請重試。",
    "terminal.signal": "訊號 {signal}",
    "terminal.exitCode": "退出碼 {code}",
    "terminal.running": "執行中",
    "terminal.failed": "失敗",
    "terminal.done": "已完成",
    "terminal.noOutput": "無輸出",
    "terminal.collapseAria": "收起輸出",
    "terminal.expandAria": "展開其餘 {n} 行輸出",
    "terminal.expandRest": "… 其餘 {n} 行",
    "json.truncated": "… 已截斷，共 {total} 字元",
    "clock.md": "{m}月{d}日",
    "clock.ymd": "{y}年{m}月{d}日"
  },
  "cordis": {
    "row.defineTitle": "註冊 Cordis 插件",
    "row.runTitle": "執行 Cordis 插件",
    "row.updateTitle": "更新 Cordis 插件",
    "row.stopTitle": "停止 Cordis 插件",
    "row.removeTitle": "移除 Cordis 插件",
    "purpose.missing": "(未填寫用途)",
    "status.idle": "待啟用",
    "status.awaitingApproval": "待審核",
    "status.failed": "執行失敗",
    "status.clientPending": "Client 待啟用",
    "status.running": "執行中",
    "status.removed": "已移除",
    "status.superseded": "已有更新",
    "run.removed": "套件已不存在",
    "run.superseded": "已有更新的執行卡片，請查看下方",
    "panel.hint": "執行控制位於左下角設定上方的 Cordis 面板",
    "panel.plugins.aria": "Cordis 插件",
    "panel.approvals.aria": "Cordis 審核",
    "panel.trigger": "Cordis Plugin",
    "panel.runningCount": "{count} 執行中",
    "panel.title": "Cordis 插件",
    "panel.empty": "尚未定義任何插件",
    "panel.loading": "讀取中…",
    "panel.readFailed": "讀取插件清單失敗：{message}",
    "panel.group.current": "目前會話",
    "panel.group.others": "其他會話",
    "panel.version": "版本",
    "panel.current": "目前：{packageId}",
    "panel.next": "待切換：{packageId}",
    "action.approve": "允許",
    "action.approveOnce": "僅允許此版本",
    "action.approvePlugin": "允許此插件的後續版本",
    "action.decline": "拒絕",
    "action.run": "執行",
    "action.stop": "停止",
    "action.remove": "移除",
    "action.retry": "重試",
    "action.rollback": "回退",
    "render.failedAbdicated": "{slot} 渲染失敗，已復原預設介面：",
    "render.failedHeld": "{slot} 渲染失敗：",
    "a11y.defining": "正在定義插件",
    "a11y.failed": "定義失敗",
    "a11y.stopped": "定義已中斷",
    "body.source": "插件程式碼",
    "body.hostCode": "Host",
    "body.clientCode": "Client",
    "body.output": "結果",
    "body.copy": "複製",
    "body.copied": "已複製"
  },
  "deliverables": {
    "produced.label": "產物",
    "produced.moreOne": "+ 1 個檔案",
    "produced.more": "+ {count} 個檔案",
    "produced.open": "開啟 {name}",
    "produced.showInFolder": "在資料夾中顯示"
  },
  "directory-browser": {
    "browser.title": "選擇工作區目錄",
    "browser.home": "主目錄",
    "browser.newFolder": "新增資料夾",
    "browser.folderName": "資料夾名稱",
    "browser.createIn": "在\"{name}\"中新增資料夾",
    "browser.untitledFolder": "未命名資料夾",
    "browser.create": "建立",
    "browser.cancel": "取消",
    "browser.open": "開啟",
    "browser.editPath": "編輯路徑",
    "browser.loading": "載入中…",
    "browser.truncated": "資料夾過多，僅顯示開頭部分。",
    "browser.showHidden": "顯示隱藏檔案"
  },
  "goal": {
    "phase.active": "進行中的目標",
    "phase.paused": "已暫停的目標",
    "phase.blocked": "受阻的目標",
    "objective.aria": "目標內容",
    "commandInput.aria": "命令輸入",
    "action.save": "儲存目標",
    "action.cancel": "取消編輯",
    "action.pause": "暫停目標",
    "action.resume": "恢復目標",
    "action.edit": "編輯目標",
    "action.clear": "清除目標"
  },
  "slash.menu": {
    "command": "命令",
    "skill": "技能",
    "subagent": "子智能體",
    "loading": "正在載入…",
    "suggestions.aria": "觸發候選建議"
  },
  "job": {
    "count.live.one": "{count} 個背景任務執行中",
    "count.live.other": "{count} 個背景任務執行中",
    "count.idle.one": "{count} 個背景任務",
    "count.idle.other": "{count} 個背景任務",
    "list.aria": "背景任務",
    "status.running": "執行中",
    "status.stopping": "正在停止",
    "status.completed": "已完成",
    "status.killed": "已取消",
    "status.failed": "已失敗",
    "duration.seconds": "{seconds}秒",
    "duration.minutes": "{minutes}分{seconds}秒",
    "duration.hours": "{hours}小時{minutes}分",
    "duration.title.live": "已執行 {duration}",
    "duration.title.done": "耗時 {duration}"
  },
  "feedback": {
    "action.like": "好的回答",
    "action.likeActive": "取消標記",
    "action.dislike": "有問題的回答",
    "action.dislikeActive": "取消標記",
    "note.open": "補充說明",
    "note.placeholder": "這條回答哪裡好，或哪裡有問題？（選填）",
    "note.save": "儲存",
    "note.cancel": "取消",
    "note.aria": "意見回饋說明",
    "error.conflict": "這條意見回饋已在其他地方變更，已顯示最新狀態",
    "error.load": "意見回饋狀態載入失敗",
    "error.generic": "意見回饋儲存失敗"
  },
  "model": {
    "command.description": "選擇本會話使用的模型",
    "option.loadError": "目錄載入失敗：{message}",
    "trigger.fallback": "選擇模型",
    "trigger.selectAria": "選擇模型",
    "trigger.aria": "選擇模型，目前 {model}",
    "trigger.ariaEffort": "選擇模型，目前 {model}，推理等級 {effort}",
    "menu.aria": "模型與推理等級",
    "menu.model": "模型",
    "menu.effort": "推理等級",
    "effort.providerDefault": "Default",
    "status.loading": "正在重新整理模型清單…",
    "error.action": "模型操作失敗：{message}",
    "action.reload": "重新載入",
    "warning.groupLoad": "{name} 載入失敗：{message}",
    "empty.models": "沒有可用的模型。",
    "blocked.composer": "目前模型不可用，請先選擇模型",
    "empty.efforts": "目前模型未提供推理等級。"
  },
  "permission.access": {
    "confirm.title": "確認啟用 Full access？",
    "confirm.description": "啟用 Full access 後，agent 將減少確認步驟，並且可以直接執行更多操作，包括敏感操作、檔案修改或外部命令。僅建議在你信任目前任務時使用。",
    "confirm.acknowledge": "我已了解風險，並願意繼續",
    "confirm.cancel": "取消",
    "confirm.enable": "啟用 Full access"
  },
  "settings.permission": {
    "title": "權限",
    "description": "選擇新會話的預設權限模式",
    "loading": "載入中",
    "unavailable": "不可用",
    "confirm.title": "確認啟用 Full access？",
    "confirm.description": "啟用 Full access 後，新會話將減少確認步驟，並且可以直接執行更多操作，包括敏感操作、檔案修改或外部命令。僅建議在你信任後續任務時使用。",
    "confirm.acknowledge": "我已了解風險，並願意繼續",
    "confirm.cancel": "取消",
    "confirm.enable": "啟用 Full access"
  },
  "plan": {
    "chip.on.aria": "plan mode 已開啟，按下關閉",
    "chip.on.title": "plan mode 已開啟 — 點擊關閉（/plan off）",
    "chip.off.aria": "plan mode 已關閉，按下開啟",
    "chip.off.title": "plan mode 已關閉 — 點擊開啟（/plan）"
  },
  "settings": {
    "trigger": "設定",
    "title": "設定",
    "close": "關閉",
    "openDocument": "開啟設定檔",
    "openDocument.error": "無法開啟設定檔",
    "general.nav": "一般設定"
  },
  "settings.models": {
    "nav": "模型",
    "title": "模型",
    "intro": "填入各提供方的 API 金鑰即可使用其模型。",
    "edit": "編輯",
    "editProvider": "編輯 {provider}",
    "remove": "刪除",
    "removeProvider": "刪除 {provider}",
    "deleteTitle": "刪除 {provider}？",
    "deleteDescription": "刪除 {provider} 會移除其設定；其使用的憑證（如有）由其他位置管理，將會保留。",
    "deleteDescriptionWithCredential": "刪除 {provider} 會移除其設定與已儲存的 API 金鑰。",
    "deleteConfirm": "刪除 {provider}",
    "deleting": "正在刪除 {provider}…",
    "add": "新增提供方",
    "provider": "提供方",
    "close": "關閉",
    "cancel": "取消",
    "apply": "儲存",
    "applying": "儲存中…",
    "savedProvider": "已儲存 {provider}。",
    "credentialConfigured": "API 金鑰已設定",
    "credentialMissing": "缺少 API 金鑰",
    "readOnly": "目前部署的設定文件為唯讀。",
    "loadFailed": "載入提供方目錄失敗",
    "conflict": "這張卡片開啟期間，這些設定已被其他位置變更。請關閉後重新開啟，並在目前的值上編輯。",
    "retry": "重試",
    "keyInput": "API 金鑰",
    "keyPlaceholder": "輸入 API 金鑰",
    "keyPlaceholderNative": "輸入 API 金鑰，或留空使用環境驗證",
    "keyStored": "已設定——輸入新值即可取代",
    "keyEnvLocked": "由啟動環境提供（唯讀）",
    "customized": "自訂設定",
    "baseUrl": "API 位址",
    "baseUrlDefault": "提供方預設",
    "models": "模型目錄",
    "modelsInherited": "正在使用配接器預設模型",
    "modelsCustomized": "已自訂模型目錄",
    "resetModels": "復原預設模型",
    "model": "模型",
    "modelId": "模型 ID",
    "modelName": "顯示名稱",
    "modelNamePlaceholder": "留空時使用模型 ID",
    "contextWindow": "上下文視窗",
    "contextWindowPlaceholder": "使用提供方預設值",
    "maxTokens": "最大輸出 token 數",
    "maxTokensPlaceholder": "使用提供方預設值",
    "modelAdvanced": "容量",
    "addModel": "新增模型",
    "removeModel": "刪除模型",
    "modelsEmpty": "模型選擇器中將不顯示任何模型；目錄外 ID 仍可直接傳送。",
    "keyBlank": "請輸入 API 金鑰；留空則保留已儲存的金鑰。",
    "keyBlankNew": "請輸入 API 金鑰；若該提供方以其他方式驗證身分，可以留空。",
    "keyIllegalCharacters": "該 API 金鑰格式錯誤，請檢查。",
    "modelIdRequired": "模型 ID 不可為空。",
    "modelIdDuplicate": "模型 ID 不可重複。",
    "modelNameInvalid": "顯示名稱不可為空。",
    "modelContextInvalid": "上下文視窗必須是正數，例如 131072、256K 或 1M。",
    "modelMaxTokensInvalid": "最大輸出 token 數必須是正數，例如 8192、64K 或 1M。",
    "advancedHint": "其餘欄位位於 settings.yaml 中，請直接編輯對應區段。",
    "modelCapacityInvalid": "容量需為數字，可加上 K 或 M 後綴。",
    "modelDuplicate": "每個模型 ID 只能出現一次。",
    "modelContextWindow": "上下文視窗",
    "modelMaxTokens": "最大輸出 token",
    "fetchModels": "取得可用模型",
    "fetching": "正在查詢提供方…",
    "fetchNeedsBaseUrl": "請先填寫 API 位址，再取得。",
    "fetchEmpty": "該提供方沒有列出任何模型，請手動新增。",
    "fetchTitle": "選擇要新增的模型",
    "fetchDescription": "以下是模型提供方的可用模型，勾選要新增的模型。",
    "fetchAdopt": "新增所選",
    "customAdd": "新增自訂提供方",
    "customTitle": "自訂提供方",
    "customTag": "自訂",
    "customRoute": "Provider ID",
    "customRouteHint": "以小寫字母開頭的識別碼，在請求中唯一識別該提供方，並用於產生憑證名稱。",
    "customRouteInvalid": "需以小寫字母開頭，之後可用小寫字母、數字和短橫線。",
    "customRouteTaken": "已有提供方使用這個 ID。",
    "customDisplayName": "顯示名稱",
    "customApi": "API 協定",
    "customApiUnset": "未選擇",
    "customNeedsBaseUrl": "自訂提供方需要填寫 API 位址。",
    "customNeedsModels": "自訂提供方至少需要一個模型。",
    "create": "建立提供方",
    "creating": "建立中…",
    "welcomeTitle": "內測聲明",
    "welcomeBody": "DeepSeek Harness 目前的 0.1 版本仍處於面向 Harness 開發者進行測試的階段，還有許多地方需要持續改進與打磨，希望聽取廣大開發者的意見回饋與建議。預期 DeepSeek Harness 的核心插件以及基礎 API 都會在接下來的一段時間內快速迭代、持續演進。\n\n我們期待與全球開發者一起，在開源、開放、可重複使用、可組合的基礎設施之上，共同探索智慧的上限。歡迎全球 Harness 開發者加入 DSH 插件生態。",
    "welcomeContinue": "繼續",
    "welcomeError": "暫時無法儲存確認狀態，請重試。",
    "onboardingTitle": "新增一個 API Key 開始使用",
    "onboardingDescription": "設定 DeepSeek 官方模型，即可開始使用。",
    "onboardingLater": "稍後設定",
    "onboardingSave": "儲存並繼續",
    "onboardingSaving": "儲存中…",
    "keyRequired": "請輸入 API 金鑰後繼續。"
  },
  "settings.pluginInventory": {
    "tab": "插件清單",
    "loading": "正在讀取插件…",
    "error": "暫時無法讀取插件。",
    "retry": "重試",
    "search": "搜尋插件",
    "catalog": "插件清單",
    "empty": "暫無插件。",
    "emptySearch": "沒有符合的插件。",
    "enabledTag": "已啟用",
    "disabledTag": "已停用",
    "configuration": "設定狀態",
    "cordis": "Cordis 狀態",
    "unobserved": "未掛載",
    "pending": "等待相依套件",
    "loadingPhase": "載入中",
    "active": "已掛載",
    "failed": "掛載失敗",
    "unloading": "卸載中"
  },
  "settings.plugins": {
    "nav": "插件",
    "title": "插件",
    "intro": "設定與檢視本部署已安裝的插件。",
    "tabs": "插件檢視",
    "configurableTab": "插件設定",
    "empty": "本部署沒有開放任何插件設定。",
    "overridden": "已覆寫",
    "reset": "恢復預設",
    "readOnly": "本部署的設定為唯讀。",
    "expand": "展開設定",
    "collapse": "收合設定",
    "save": "儲存",
    "saving": "儲存中…",
    "discard": "放棄修改",
    "unsaved": "未儲存",
    "saveFailed": "本部署沒有接受這些值，已保留供你修改。",
    "invalidNumber": "請填數字；留空表示使用預設值。",
    "bashTitle": "終端機",
    "bashDescription": "限制 agent 執行的每一條命令。",
    "bashTimeoutMs": "命令逾時（毫秒）",
    "bashTimeoutMsHint": "單條命令允許執行多久，逾時即終止。",
    "bashMaxOutputBytes": "單一輸出流上限（位元組）",
    "bashMaxOutputBytesHint": "超出部分會轉存到暫存檔案，而不會被丟棄。",
    "agentLoopTitle": "Agent 迴圈",
    "agentLoopDescription": "Agent 如何派發工具呼叫。",
    "agentLoopMaxParallel": "並行工具呼叫數",
    "agentLoopMaxParallelHint": "同一步內最多同時執行多少個可並行的呼叫。",
    "webSearchTitle": "網頁搜尋",
    "webSearchDescription": "DeepSeek 搜尋提供方。",
    "webSearchApiKey": "API Key",
    "webSearchApiKeyHint": "不會寫入設定檔。留空表示保持目前金鑰。",
    "webSearchApiKeySet": "已設定金鑰。",
    "webSearchApiKeyUnset": "未設定金鑰；設定之前搜尋不可用。",
    "webSearchBaseUrl": "介面位址",
    "webSearchBaseUrlHint": "留空則使用提供方預設位址。",
    "webSearchMaxUses": "單次請求最多搜尋次數",
    "webSearchMaxUsesHint": "一次請求在必須作答前最多可以搜尋多少次。"
  },
  "sidebar": {
    "session.new": "新會話",
    "session.new.label": "新增會話",
    "toggle.open": "開啟側邊欄",
    "toggle.collapse": "收起側邊欄"
  },
  "skill": {
    "row.running": "正在載入 skill",
    "row.failed": "skill 載入失敗",
    "row.stopped": "skill 載入已中止",
    "row.instructions": "說明",
    "menu.userOnly": "僅限使用者"
  },
  "subagent": {
    "diagnostic.corrupt": "會話紀錄損壞",
    "diagnostic.unsupported": "子代理紀錄版本不受支援",
    "diagnostic.unavailable": "會話紀錄暫時無法使用",
    "duration.seconds": "{seconds}秒",
    "duration.minutes": "{minutes}分{seconds}秒",
    "duration.hours": "{hours}小時{minutes}分{seconds}秒",
    "duration.days": "{days}天",
    "duration.daysHours": "{days}天{hours}小時",
    "duration.months": "約{months}個月",
    "duration.monthsDays": "約{months}個月{days}天",
    "duration.years": "約{years}年",
    "duration.yearsMonths": "約{years}年{months}個月",
    "duration.exactDays": "{days}天{hours}小時{minutes}分{seconds}秒",
    "duration.exactTitle": "總活躍耗時：{duration}",
    "loading.label": "正在載入子代理…",
    "loading.aria": "正在載入子代理",
    "load.error": "無法載入子代理",
    "retry": "重試",
    "mode.oneShot": "一次性",
    "mode.continuable": "可繼續",
    "activity.running": "正在執行",
    "activity.inactive": "目前未執行",
    "branch.collapse": "收起 {label} 的下級子代理",
    "branch.expand": "展開 {label} 的下級子代理",
    "count.total.one": "{count} 個子代理",
    "count.total.other": "{count} 個子代理",
    "count.running.one": "{count} 個子代理，正在執行",
    "count.running.other": "{count} 個子代理，正在執行",
    "tree.aria": "子代理會話",
    "readonly.oneShot.title": "一次性子代理紀錄",
    "readonly.title": "此子代理暫時唯讀",
    "readonly.oneShot.body": "一次性任務不支援後續訊息，可以在這裡查看完整的執行紀錄。",
    "readonly.body": "父會話目前不在線上，重新開啟父會話後即可繼續傳送訊息。"
  },
  "settings.theme": {
    "appearance.title": "外觀",
    "appearance.light": "淺色",
    "appearance.dark": "深色",
    "appearance.system": "跟隨系統"
  },
  "trajectory": {
    "view.trajectory": "軌跡",
    "toolbar.aria": "軌跡工具列",
    "toolbar.duration": "Duration",
    "toolbar.useActualDuration": "Use actual duration",
    "toolbar.useEqualWidth": "Use equal-width operations",
    "toolbar.actualTime": "實際時間",
    "toolbar.turns": "Turns",
    "toolbar.expandTurns": "Expand turns",
    "toolbar.collapseTurns": "Collapse turns",
    "toolbar.calls": "Calls",
    "toolbar.expandCalls": "Expand calls",
    "toolbar.collapseCalls": "Collapse calls",
    "toolbar.search": "搜尋軌跡",
    "toolbar.searchPlaceholder": "搜尋"
  },
  "question": {
    "error.incomplete": "請先完成這道問題。",
    "error.unanswered": "請選擇一個選項或填寫自訂答案。",
    "nav.prev": "上一題",
    "nav.next": "下一題",
    "nav.cancel": "放棄整組問題",
    "option.recommended": "推薦",
    "custom.placeholder": "輸入你的答案",
    "action.skip": "略過本題",
    "action.next": "下一題",
    "plan.header": "計畫待審核",
    "plan.approve": "確認執行",
    "plan.decline": "拒絕",
    "plan.discuss": "去聊天裡說"
  },
  "workflowRun": {
    "run.title": "{name}",
    "run.members.one": "{count} 個成員",
    "run.members.other": "{count} 個成員",
    "run.empty": "尚未啟動任何成員",
    "phase.unassigned": "未分配階段",
    "phase.empty": "空白的階段名稱",
    "statusCount.running": "執行中 {count}",
    "statusCount.completed": "已完成 {count}",
    "statusCount.failed": "失敗 {count}",
    "statusCount.cancelled": "已取消 {count}",
    "statusCount.interrupted": "已中斷 {count}",
    "member.empty": "空白的成員名稱",
    "member.open": "開啟 {name}",
    "status.running": "執行中",
    "status.completed": "已完成",
    "status.failed": "失敗",
    "status.cancelled": "已取消",
    "status.interrupted": "已中斷"
  },
  "workspace": {
    "group.ungrouped": "未分組",
    "session.new": "新會話",
    "section.workspaces": "工作區",
    "section.sessions": "會話",
    "viewOptions.label": "檢視選項",
    "groupBy.label": "分組方式",
    "groupBy.workspace": "依工作區",
    "groupBy.flat": "單一清單",
    "orderBy.label": "排序方式",
    "orderBy.manual": "手動排序",
    "orderBy.updated": "最近更新",
    "sessions.expand": "展開其餘 {n} 個會話",
    "sessions.collapse": "收起",
    "empty.none": "暫無會話",
    "empty.noMatches": "無符合結果",
    "workspace.add": "新增工作區",
    "search.sessions.aria": "搜尋會話",
    "search.placeholder": "搜尋會話…",
    "search.clear": "清除搜尋",
    "search.results.aria": "搜尋結果",
    "search.pending": "正在搜尋會話歷史…",
    "search.unavailable": "內容搜尋暫時無法使用，僅顯示名稱相符的項目。",
    "search.noMatches": "無符合的會話",
    "search.hasMore": "僅顯示前 {n} 筆結果，請縮小搜尋範圍。",
    "menu.addWorkspace": "新增工作區…",
    "picker.loading": "正在載入工作區…",
    "conflict.named": "已存在名為“{name}”的工作區。",
    "folderError.title": "無法開啟資料夾",
    "folderError.retry": "重新選擇",
    "rename": "重新命名",
    "rename.workspace.title": "重新命名工作區",
    "rename.session.title": "重新命名會話",
    "field.workspaceName": "工作區名稱",
    "field.sessionName": "會話名稱",
    "delete.workspace": "刪除工作區",
    "delete.desc": "會將“{name}”從工作區清單中移除。資料夾與會話紀錄會保留，其會話將顯示在“未分組”下。",
    "delete.pending": "正在刪除工作區…",
    "menu.fork": "分叉會話",
    "menu.archiveSession": "封存會話",
    "sessions.count.one": "{n} 個會話",
    "sessions.count.other": "{n} 個會話",
    "actions.workspace.aria": "工作區“{name}”的操作",
    "actions.session.aria": "會話“{name}”的操作",
    "actions.newSession.aria": "在“{name}”中新增會話",
    "status.running": "進行中",
    "status.subagentsRunning.one": "{n} 個子代理執行中",
    "status.subagentsRunning.other": "{n} 個子代理執行中",
    "status.idle": "閒置",
    "status.waitingApproval": "等待審核",
    "status.planReview": "計畫待審",
    "status.waitingAnswer": "等待回答",
    "status.completed": "已完成",
    "hover.created": "建立於 {time}",
    "hover.copied": "已複製",
    "date.ymd": "{y}年{m}月{d}日",
    "time.now": "剛剛",
    "time.minutes": "{n}分鐘",
    "time.hours": "{n}小時",
    "time.days": "{n}天",
    "time.months": "{n}個月",
    "time.years": "{n}年",
    "time.ago": "{t}前"
  },
  "session-log-download": {
    "dialog.preparingTitle": "正在匯出 Session",
    "dialog.preparingDescription": "正在準備包含目前 Session、子 Session 和附件的 ZIP 檔案。",
    "dialog.successTitle": "Session 匯出已開始下載",
    "dialog.successDescription": "瀏覽器正在下載 Session ZIP 檔案。",
    "dialog.errorTitle": "Session 匯出失敗",
    "dialog.close": "關閉",
    "dialog.commandFailed": "無法啟動 Session 匯出。"
  }
};

    // 单字简→繁字元表（运行时自动转换兜底；scripts/verify-converter.mjs 校验）
    const CHARS = {"话":"話","会":"會","开":"開","败":"敗","载":"載","运":"運","选":"選","个":"個","设":"設","请":"請","时":"時","图":"圖","标":"標","后":"後","导":"導","输":"輸","发":"發","预":"預","无":"無","当":"當","续":"續","认":"認","启":"啟","试":"試","录":"錄","删":"刪","区":"區","择":"擇","编":"編","义":"義","写":"寫","务":"務","条":"條","钥":"鑰","关":"關","辑":"輯","闭":"閉","创":"創","内":"內","并":"並","仅":"僅","暂":"暫","将":"將","显":"顯","这":"這","组":"組","该":"該","继":"繼","为":"為","动":"動","读":"讀","题":"題","确":"確","过":"過","记":"記","没":"沒","断":"斷","称":"稱","执":"執","单":"單","夹":"夾","对":"對","与":"與","识":"識","项":"項","问":"問","缩":"縮","级":"級","审":"審","计":"計","进":"進","队":"隊","点":"點","击":"擊","压":"壓","议":"議","许":"許","态":"態","划":"劃","余":"餘","应":"應","体":"體","张":"張","轮":"輪","调":"調","约":"約","馈":"饋","状":"狀","间":"間","码":"碼","检":"檢","头":"頭","处":"處","览":"覽","换":"換","详":"詳","历":"歷","来":"來","权":"權","结":"結","说":"說","员":"員","装":"裝","让":"讓","页":"頁","备":"備","现":"現","于":"於","径":"徑","响":"響","线":"線","减":"減","骤":"驟","风":"風","险":"險","愿":"願","还":"還","从":"從","绝":"絕","册":"冊","档":"檔","环":"環","则":"則","须":"須","阶":"階","挂":"掛","弃":"棄","栏":"欄","轨":"軌","迹":"跡","词":"詞","网":"網","双":"雙","实":"實","滚":"滾","总":"總","统":"統","块":"塊","经":"經","凭":"憑","证":"證","储":"儲","获":"獲","测":"測","础":"礎","视":"視","终":"終","侧":"側","边":"邊","归":"歸","刚":"剛","异":"異","语":"語","帮":"幫","极":"極","简":"簡","验":"驗","机":"機","连":"連","占":"佔","筛":"篩","给":"給","离":"離","构":"構","访":"訪","缓":"緩","键":"鍵","层":"層","迟":"遲","达":"達","号":"號","产":"產","隐":"隱","触":"觸","补":"補","适":"適","鉴":"鑑","错":"錯","误":"誤","缀":"綴","询":"詢","据":"據","横":"橫","协":"協","声":"聲","听":"聽","广":"廣","们":"們","欢":"歡","赖":"賴","盖":"蓋","节":"節","转":"轉","临":"臨","丢":"丟","户":"戶","损":"損","坏":"壞","跃":"躍","观":"觀","浅":"淺","随":"隨","际":"際","荐":"薦","范":"範","围":"圍","闲":"閒","钟":"鐘","浏":"瀏","叠":"疊","变":"變","长":"長","扫":"掃","优":"優","严":"嚴","众":"眾","亿":"億","团":"團","场":"場","扩":"擴","扬":"揚","护":"護","报":"報","拦":"攔","担":"擔","拟":"擬","扰":"擾","拥":"擁","拨":"撥","松":"鬆","枣":"棗","枪":"槍","柜":"櫃","桥":"橋","软":"軟","盘":"盤","势":"勢","习":"習","书":"書","买":"買","乱":"亂","争":"爭","亲":"親","仓":"倉","传":"傳","伤":"傷","价":"價","伙":"夥","伟":"偉","伪":"偽","伦":"倫","侦":"偵","侄":"姪","俭":"儉","债":"債","倾":"傾","偿":"償","儿":"兒","兑":"兌","两":"兩","兰":"蘭","兴":"興","养":"養","兽":"獸","冈":"岡","冲":"衝","决":"決","况":"況","冻":"凍","净":"淨","准":"準","凉":"涼","凑":"湊","几":"幾","凯":"凱","别":"別","剂":"劑","剥":"剝","剧":"劇","剑":"劍","办":"辦","劳":"勞","劝":"勸","励":"勵","劲":"勁","匀":"勻","医":"醫","华":"華","卖":"賣","卢":"盧","卫":"衛","却":"卻","厌":"厭","厅":"廳","厉":"厲","厕":"廁","厘":"釐","县":"縣","叶":"葉","吗":"嗎","吴":"吳","哑":"啞","哗":"嘩","哟":"喲","唤":"喚","啧":"嘖","喷":"噴","呜":"嗚","园":"園","圆":"圓","坚":"堅","坛":"壇","坝":"壩","坟":"墳","坠":"墜","垄":"壟","垦":"墾","垫":"墊","垒":"壘","堕":"墮","墙":"牆","壮":"壯","复":"復","够":"夠","梦":"夢","夺":"奪","奋":"奮","奖":"獎","奥":"奧","妈":"媽","妇":"婦","娄":"婁","娇":"嬌","婴":"嬰","婶":"嬸","孙":"孫","学":"學","宁":"寧","宝":"寶","宫":"宮","宪":"憲","宽":"寬","宾":"賓","寻":"尋","寿":"壽","尔":"爾","尘":"塵","尝":"嘗","尸":"屍","尽":"盡","届":"屆","属":"屬","屿":"嶼","岁":"歲","岂":"豈","岗":"崗","岛":"島","岭":"嶺","峡":"峽","巩":"鞏","帅":"帥","师":"師","带":"帶","帧":"幀","干":"幹","庄":"莊","庆":"慶","庙":"廟","废":"廢","库":"庫","庞":"龐","弥":"彌","弯":"彎","弹":"彈","强":"強","彻":"徹","征":"徵","衔":"銜","御":"禦","忆":"憶","怀":"懷","忧":"憂","恋":"戀","恒":"恆","恼":"惱","悦":"悅","惊":"驚","惧":"懼","惨":"慘","惯":"慣","懒":"懶","戏":"戲","战":"戰","扎":"紮","托":"託","抚":"撫","抛":"拋","拢":"攏","挤":"擠","挥":"揮","搁":"擱","搂":"摟","搅":"攪","摄":"攝","摆":"擺","携":"攜","摇":"搖","摊":"攤","撵":"攆","擞":"擻","数":"數","斋":"齋","斗":"鬥","旧":"舊","旷":"曠","晒":"曬","晓":"曉","晕":"暈","术":"術","朴":"樸","杀":"殺","杂":"雜","杆":"桿","杨":"楊","树":"樹","样":"樣","楼":"樓","樱":"櫻","歼":"殲","毕":"畢","气":"氣","氢":"氫","汇":"匯","汉":"漢","污":"汙","沟":"溝","泄":"洩","泪":"淚","洒":"灑","济":"濟","浑":"渾","浓":"濃","浆":"漿","浇":"澆","浊":"濁","润":"潤","涂":"塗","涌":"湧","渊":"淵","湾":"灣","湿":"濕","溃":"潰","溅":"濺","温":"溫","满":"滿","滤":"濾","滥":"濫","潜":"潛","灭":"滅","灯":"燈","灵":"靈","灾":"災","炉":"爐","炼":"煉","烂":"爛","热":"熱","烧":"燒","烛":"燭","烟":"煙","烦":"煩","烫":"燙","营":"營","爱":"愛","爷":"爺","牵":"牽","牺":"犧","犹":"猶","猎":"獵","猪":"豬","猫":"貓","献":"獻","琐":"瑣","电":"電","画":"畫","疗":"療","疯":"瘋","痒":"癢","皱":"皺","盐":"鹽","监":"監","着":"著","矿":"礦","砖":"磚","碍":"礙","礼":"禮","祸":"禍","秃":"禿","种":"種","秘":"祕","积":"積","税":"稅","稳":"穩","穷":"窮","窜":"竄","窍":"竅","竖":"豎","竞":"競","笔":"筆","筑":"築","筝":"箏","篮":"籃","筹":"籌","类":"類","紧":"緊","纠":"糾","红":"紅","纤":"纖","纪":"紀","纯":"純","纸":"紙","纹":"紋","绍":"紹","绕":"繞","绘":"繪","络":"絡","绪":"緒","缘":"緣","缴":"繳","罗":"羅","罢":"罷","羡":"羨","职":"職","联":"聯","聪":"聰","耸":"聳","肃":"肅","肠":"腸","肤":"膚","肿":"腫","胀":"脹","胁":"脅","胜":"勝","胶":"膠","脸":"臉","脱":"脫","腊":"臘","腾":"騰","举":"舉","舰":"艦","舱":"艙","艺":"藝","药":"藥","蓝":"藍","虚":"虛","虫":"蟲","虽":"雖","蚕":"蠶","蜡":"蠟","蛮":"蠻","衬":"襯","裤":"褲","袭":"襲","见":"見","规":"規","觉":"覺","订":"訂","讨":"討","训":"訓","讯":"訊","讲":"講","论":"論","评":"評","诉":"訴","译":"譯","诗":"詩","诚":"誠","诸":"諸","课":"課","谁":"誰","谈":"談","谊":"誼","谋":"謀","谎":"謊","谓":"謂","谜":"謎","谢":"謝","谨":"謹","谱":"譜","誉":"譽","丰":"豐","贝":"貝","负":"負","贡":"貢","财":"財","责":"責","贤":"賢","账":"帳","货":"貨","质":"質","贩":"販","贪":"貪","贫":"貧","购":"購","费":"費","贵":"貴","贴":"貼","贸":"貿","资":"資","赋":"賦","赏":"賞","赔":"賠","赚":"賺","赠":"贈","赵":"趙","趋":"趨","践":"踐","踪":"蹤","车":"車","轻":"輕","辅":"輔","辆":"輛","辞":"辭","辩":"辯","迁":"遷","迈":"邁","远":"遠","违":"違","逻":"邏","递":"遞","遗":"遺","遥":"遙","邓":"鄧","邮":"郵","邻":"鄰","郑":"鄭","酱":"醬","针":"針","钓":"釣","钦":"欽","钱":"錢","钻":"鑽","铁":"鐵","铃":"鈴","铅":"鉛","铜":"銅","银":"銀","链":"鏈","销":"銷","锁":"鎖","锅":"鍋","锈":"鏽","锋":"鋒","锚":"錨","镜":"鏡","门":"門","闷":"悶","闹":"鬧","闻":"聞","阁":"閣","阅":"閱","阔":"闊","阳":"陽","阴":"陰","阵":"陣","陈":"陳","难":"難","雇":"僱","云":"雲","雾":"霧","静":"靜","顶":"頂","顺":"順","顽":"頑","顿":"頓","颇":"頗","领":"領","颈":"頸","频":"頻","颗":"顆","颜":"顏","额":"額","飘":"飄","飞":"飛","饭":"飯","饮":"飲","饱":"飽","饰":"飾","饼":"餅","马":"馬","驭":"馭","驰":"馳","驾":"駕","骂":"罵","骏":"駿","骑":"騎","骗":"騙","骚":"騷","鱼":"魚","鲁":"魯","鲜":"鮮","鸟":"鳥","鸡":"雞","鸣":"鳴","鸭":"鴨","鹅":"鵝","鹰":"鷹","麦":"麥","黄":"黃","齐":"齊","齿":"齒","龄":"齡","龙":"龍","龟":"龜","鲸":"鯨","宠":"寵","娱":"娛","乐":"樂","签":"簽","参":"參","悬":"懸","抠":"摳","锤":"錘","仆":"僕"};

    const name = "zh-tw-locale";
    const inject = [];

    // 纯单字简→繁转换（不做術語片語；{佔位符} 内无汉字，天然安全）。
    // fast-path：先扫一遍有没有需要转换的字，没有就直接返回原串（避免热路径分配）。
    const CHARS_SET = new Set(Object.keys(CHARS));
    function convertZhTw(text) {
      let need = false;
      for (const ch of text) {
        if (CHARS_SET.has(ch)) { need = true; break; }
      }
      if (!need) return text;
      let out = "";
      for (const ch of text) out += CHARS[ch] ?? ch;
      return out;
    }

    function applyParams(template, params) {
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
    }

    function readPref() {
      try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
    }
    function writePref(value) {
      try {
        if (value === null || value === undefined) window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, value);
      } catch { /* 隐私模式等：忽略，语言选择在本次会话内生效 */ }
    }

    // ---- DOM 级兜底轉換 ----
    // locale.translate 只覆盖字典字串；插件市场描述、第三方插件的自有文案等由
    // 数据/组件直接渲染的内容不经字典。zh-TW 活跃时用 MutationObserver 把 DOM 里
    // 残留的简体即时转繁（输入框/代码块等用户内容排除），切回其他语言时还原。
    const DOM_SKIP_SELECTOR = "input, textarea, select, [contenteditable], pre, code, script, style";
    const domConverted = new WeakMap(); // Text -> 原始字符串
    let domObserver = null;
    let domOriginalLang = null;

    function domShouldSkip(node) {
      let el = node.parentElement;
      while (el) {
        if (el.matches && el.matches(DOM_SKIP_SELECTOR)) return true;
        el = el.parentElement;
      }
      return false;
    }
    function domConvertText(node) {
      if (node.nodeType !== 3 || domShouldSkip(node)) return;
      const original = node.nodeValue;
      if (!original) return;
      const converted = convertZhTw(original);
      if (converted !== original) {
        if (!domConverted.has(node)) domConverted.set(node, original);
        node.nodeValue = converted;
      }
    }
    function domRestoreText(node) {
      if (node.nodeType === 3 && domConverted.has(node)) {
        node.nodeValue = domConverted.get(node);
        domConverted.delete(node);
      }
    }
    function domWalk(root, fn) {
      if (root.nodeType === 3) { fn(root); return; }
      if (root.nodeType !== 1) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) fn(n);
    }
    function startDomConversion() {
      if (domObserver) return;
      try {
        domOriginalLang = domOriginalLang ?? document.documentElement.lang;
        document.documentElement.lang = "zh-TW";
      } catch { /* 忽略 */ }
      domWalk(document.body, domConvertText);
      domObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "characterData") domConvertText(m.target);
          else if (m.type === "childList") {
            for (const added of m.addedNodes) {
              if (added.nodeType === 3) domConvertText(added);
              else if (added.nodeType === 1) domWalk(added, domConvertText);
            }
          }
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    function stopDomConversion() {
      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }
      domWalk(document.body, domRestoreText);
      try {
        if (domOriginalLang !== null) document.documentElement.lang = domOriginalLang;
      } catch { /* 忽略 */ }
    }
    function syncDomConversion(active) {
      if (active === LOCALE_ID) startDomConversion();
      else stopDomConversion();
    }

    function apply(ctx) {
      const locale = ctx.get("locale");
      if (!locale || typeof locale.register !== "function" || typeof locale.getLocale !== "function") {
        console.warn("[dsh-locale-zh-tw] locale 服务不可用，插件静默降级");
        return;
      }

      // 1) 注册 zh-TW 字典（单 locale 形态；重复注册会抛错，逐个 try）
      for (const [ns, dict] of Object.entries(DICTS)) {
        try {
          ctx.effect(() => locale.register(ns, LOCALE_ID, dict), "zh-tw-locale: " + ns);
        } catch (error) {
          console.error("[dsh-locale-zh-tw] register", ns, error);
        }
      }

      // 1.5) 包装 translate：zh-TW 活跃时——先取精译（curated）；缺则把 zh 值
      //      即时单字转繁（覆盖官方新增/改动字串与第三方插件 namespace）。
      const originalTranslate = locale.translate.bind(locale);
      locale.translate = (ns, key, params) => {
        if (locale.getLocale().active !== LOCALE_ID) return originalTranslate(ns, key, params);
        const dicts = locale.dicts;
        const curated =
          dicts.get(ns)?.get(LOCALE_ID)?.[key] ??
          (ns !== "common" ? dicts.get("common")?.get(LOCALE_ID)?.[key] : undefined);
        if (curated !== undefined) return applyParams(curated, params);
        const zhVal =
          dicts.get(ns)?.get("zh")?.[key] ??
          (ns !== "common" ? dicts.get("common")?.get("zh")?.[key] : undefined);
        if (zhVal !== undefined) return applyParams(convertZhTw(zhVal), params);
        return key;
      };

      // 2) 把 zh-TW 加入可选语言列表：patch snapshot，再 publish 一次让设置页
      //    语言行（读取 locale/change 事件）刷新出「繁體中文」选项。
      const snapshot = locale.getLocale();
      const locales = [...snapshot.locales];
      if (!locales.some((l) => l.id === LOCALE_ID)) {
        locales.push({ id: LOCALE_ID, label: LOCALE_LABEL });
      }
      try {
        locale.snapshot = Object.freeze({
          active: snapshot.active,
          locales: Object.freeze(locales),
          revision: snapshot.revision,
        });
        locale.publish(snapshot.active, true);
      } catch (error) {
        console.error("[dsh-locale-zh-tw] patch snapshot", error);
      }

      // 3) 包装 setLocale：zh-TW 走自有路径，其余（zh/en）走原逻辑并清除偏好
      const originalSetLocale = locale.setLocale.bind(locale);
      locale.setLocale = (id) => {
        if (id === LOCALE_ID) {
          locale.publish(LOCALE_ID, true);
          writePref("zh-TW");
        } else {
          originalSetLocale(id);
          writePref(null);
        }
        syncDomConversion(locale.getLocale().active);
      };

      // 4) 持久化：启动时若 localStorage 有 zh-TW 偏好则自动启用。
      //    注意：内置 dsh-client-locale 的 host 偏好是异步载入的——它在构造后
      //    才收到 settings 文档，随即 adopt() 用 locale.preference ?? provisional
      //    重置 active（provisional 对 zh 系浏览器是 "zh"），会盖掉我们启动时的
      //    启用。因此除启动时立即启用外，还要包一层 adopt()：每次内置 re-adopt
      //    后若我们的偏好仍是 zh-TW，就重新断言为繁体。
      const activateIfPreferred = () => {
        if (readPref() === "zh-TW" && locale.getLocale().active !== LOCALE_ID) {
          try { locale.publish(LOCALE_ID, true); } catch (error) { /* 忽略 */ }
        }
      };
      if (typeof locale.adopt === "function") {
        const originalAdopt = locale.adopt.bind(locale);
        locale.adopt = (host) => {
          originalAdopt(host);
          activateIfPreferred();
          syncDomConversion(locale.getLocale().active);
        };
      }
      activateIfPreferred();
      syncDomConversion(locale.getLocale().active);
      // 启动后 DOM 可能未渲染完，延后几拍再补一轮兜底转换
      try { window.setTimeout(() => syncDomConversion(locale.getLocale().active), 500); } catch { /* 忽略 */ }
    }

    module.exports = { name, inject, apply };
    return module.exports;
  },
});
