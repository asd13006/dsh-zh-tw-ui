// assemble.mjs — 从 src/zh-tw/*.json 生成 lib/client.js（内嵌全部 zh-TW 字典 + 插件逻辑）
// 用法: node scripts/assemble.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const srcDir = path.join(root, "src", "zh-tw");
const outFile = path.join(root, "lib", "client.js");

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort();
const dicts = {};
let totalKeys = 0;
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  for (const entry of data.entries) {
    if (dicts[entry.ns]) throw new Error(`duplicate ns ${entry.ns} in ${f}`);
    dicts[entry.ns] = entry.dict;
    totalKeys += Object.keys(entry.dict).length;
  }
}
const nsList = Object.keys(dicts).sort();
console.log(`assembling ${files.length} files, ${nsList.length} namespaces, ${totalKeys} keys`);

// 单字简→繁字元表：运行时自动转换未知/新增/第三方 namespace 的简中字串
const CHARS = JSON.parse(fs.readFileSync(path.join(root, "src", "zh-tw-parts", "chars.json"), "utf8"));
console.log(`char table: ${Object.keys(CHARS).length} entries`);

const DICTS_JSON = JSON.stringify(dicts, null, 2);
const CHARS_JSON = JSON.stringify(CHARS);

const clientJs = `/* global window */
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
    const DICTS = ${DICTS_JSON};

    // 单字简→繁字元表（运行时自动转换兜底；scripts/verify-converter.mjs 校验）
    const CHARS = ${CHARS_JSON};

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
      return template.replace(/\\{(\\w+)\\}/g, (match, name) => name in params ? String(params[name]) : match);
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
`;

fs.mkdirSync(path.join(root, "lib"), { recursive: true });
fs.writeFileSync(outFile, clientJs, "utf8");
console.log("wrote", outFile, `(${clientJs.length} bytes)`);
