// verify-dicts.mjs — 驗證各語言精譯字典完整性：
// 對每個 package，src/zh-src 的 zh 字典與 src/<lang>/* 的各語言字典必須
// namespace 與 key 集合完全一致（無缺漏、無多餘），否則運行時會缺 key
// 掉回兜底。用法：node scripts/verify-dicts.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const srcDir = path.join(root, "src", "zh-src");
const LANGS = ["zh-tw", "ja", "ko", "fr", "de", "es"]; // dir 名

const srcFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort();
let totalNss = 0, totalKeys = 0, errors = 0;

for (const f of srcFiles) {
  const src = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  for (const lang of LANGS) {
    const langFile = path.join(root, "src", lang, f);
    if (!fs.existsSync(langFile)) {
      console.error(`✗ ${lang}: 缺對應檔 ${f}`);
      errors++;
      continue;
    }
    const tw = JSON.parse(fs.readFileSync(langFile, "utf8"));
    const srcNs = new Map(src.entries.map((e) => [e.ns, e.dict]));
    const langNs = new Map(tw.entries.map((e) => [e.ns, e.dict]));
    for (const [ns, dict] of srcNs) {
      totalNss++;
      const langDict = langNs.get(ns);
      if (langDict === undefined) {
        console.error(`✗ ${lang}/${f}: namespace「${ns}」缺失`);
        errors++;
        continue;
      }
      const srcKeys = Object.keys(dict).sort();
      const langKeys = Object.keys(langDict).sort();
      const missing = srcKeys.filter((k) => !(k in langDict));
      const extra = langKeys.filter((k) => !(k in dict));
      if (missing.length || extra.length) {
        console.error(`✗ ${lang}/${f} [${ns}]: 缺 ${missing.length} key（${missing.slice(0, 5).join(", ")}）; 多 ${extra.length} key（${extra.slice(0, 5).join(", ")}）`);
        errors++;
      }
      totalKeys += srcKeys.length;
    }
  }
}

if (errors === 0) {
  console.log(`✓ ${srcFiles.length} 個 package × ${LANGS.length} 語言、${totalNss} 個 ns 檢查、${totalKeys} 條 key 全部一致`);
} else {
  console.error(`✗ 共 ${errors} 處不一致`);
  process.exit(1);
}
