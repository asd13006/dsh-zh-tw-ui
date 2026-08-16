// verify-dicts.mjs — 驗證精譯字典完整性：
// 對每個 package，src/zh-src 的 zh 字典與 src/zh-tw 的 zh-TW 字典必須
// namespace 與 key 集合完全一致（無缺漏、無多餘），否則運行時會出現
// 缺 key 掉回簡體或無效 key。用法：node scripts/verify-dicts.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const srcDir = path.join(root, "src", "zh-src");
const twDir = path.join(root, "src", "zh-tw");

const srcFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".json")).sort();
let totalNss = 0, totalKeys = 0, errors = 0;

for (const f of srcFiles) {
  const twFile = path.join(twDir, f);
  if (!fs.existsSync(twFile)) {
    console.error(`✗ 缺 zh-TW 對應檔: ${f}`);
    errors++;
    continue;
  }
  const src = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  const tw = JSON.parse(fs.readFileSync(twFile, "utf8"));
  const srcNs = new Map(src.entries.map((e) => [e.ns, e.dict]));
  const twNs = new Map(tw.entries.map((e) => [e.ns, e.dict]));

  for (const [ns, dict] of srcNs) {
    totalNss++;
    const twDict = twNs.get(ns);
    if (twDict === undefined) {
      console.error(`✗ ${f}: namespace「${ns}」缺 zh-TW`);
      errors++;
      continue;
    }
    const srcKeys = Object.keys(dict).sort();
    const twKeys = Object.keys(twDict).sort();
    const missing = srcKeys.filter((k) => !(k in twDict));
    const extra = twKeys.filter((k) => !(k in dict));
    if (missing.length || extra.length) {
      console.error(`✗ ${f} [${ns}]: 缺 ${missing.length} key（${missing.slice(0, 5).join(", ")}）; 多 ${extra.length} key（${extra.slice(0, 5).join(", ")}）`);
      errors++;
    }
    totalKeys += srcKeys.length;
  }
}

if (errors === 0) {
  console.log(`✓ ${srcFiles.length} 個 package、${totalNss} 個 namespace、${totalKeys} 條 key 全部一致`);
} else {
  console.error(`✗ 共 ${errors} 處不一致`);
  process.exit(1);
}
