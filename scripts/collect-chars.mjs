// collect-chars.mjs — 收集所有 zh 字典（zh-src/*.json + 指定第三方 client.js 的 zh 字典）
// 中出现的简体汉字，输出唯一字符列表（按出现频次排序），供构建 chars.json 字元表。
// 用法: node scripts/collect-chars.mjs [extra-client.js ...]
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const srcDir = path.join(root, "src", "zh-src");

const freq = new Map(); // char -> count
function addText(text) {
  for (const ch of text) {
    const code = ch.codePointAt(0);
    // CJK 统一表意文字（基本区 + 扩展A 常用）
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)) {
      freq.set(ch, (freq.get(ch) || 0) + 1);
    }
  }
}

// 1) zh-src 全部字典值
for (const f of fs.readdirSync(srcDir).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  for (const entry of data.entries) {
    for (const [k, v] of Object.entries(entry.dict)) {
      addText(v);
      addText(k);
    }
  }
}

// 2) 额外 client.js（第三方插件）：找出 DICT.zh / const zh = { ... } 并取值
function extractZhValues(file) {
  const text = fs.readFileSync(file, "utf8");
  const out = [];
  const re = /const\s+(?:zh|DICT|ZH|zhDict)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    // 找匹配的 }
    let depth = 0, i = text.indexOf("{", m.index);
    const start = i;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        const q = ch; i++;
        while (i < text.length) { if (text[i] === "\\") { i += 2; continue; } if (text[i] === q) break; i++; }
      } else if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) break; }
      i++;
    }
    const literal = text.slice(start, i + 1);
    try {
      const obj = eval("(" + literal + ")");
      // 可能是 {zh: {...}} 或直接字典
      const dict = obj.zh && typeof obj.zh === "object" && !Array.isArray(obj.zh) ? obj.zh : obj;
      for (const v of Object.values(dict)) if (typeof v === "string") out.push(v);
    } catch { /* 忽略无法解析的 */ }
  }
  return out;
}

for (const extra of process.argv.slice(2)) {
  if (fs.existsSync(extra)) {
    for (const v of extractZhValues(extra)) addText(v);
    console.error("included:", path.basename(extra));
  } else {
    console.error("skip missing:", extra);
  }
}

const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
const out = path.join(root, "src", "zh-tw-parts", "collected-chars.txt");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, sorted.map(([c, n]) => `${c}\t${n}`).join("\n"), "utf8");
console.log("unique chars:", sorted.length, "->", out);
