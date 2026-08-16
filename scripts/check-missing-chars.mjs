// check-missing-chars.mjs — 維護工具：官方/第三方更新後，掃描 zh-src 全部簡中
// 字串 + 指定第三方 client.js，找出「簡體專用字」中未被 chars.json 收錄的字
// （這些字在運行時轉換兜底會原樣透傳，需補上繁體映射）。簡繁同形字不報。
//
// 用法：
//   node scripts/collect-chars.mjs [extra-client.js...]   # 先重新收集字元
//   node scripts/check-missing-chars.mjs                  # 對比 chars.json 報缺失
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const parts = path.join(root, "src", "zh-tw-parts");
const chars = JSON.parse(fs.readFileSync(path.join(parts, "chars.json"), "utf8"));
const simplifiedOnly = new Set(
  fs.readFileSync(path.join(parts, "simplified-only.txt"), "utf8").split("").filter(Boolean),
);
const collectedFile = path.join(parts, "collected-chars.txt");
if (!fs.existsSync(collectedFile)) {
  console.error("先运行: node scripts/collect-chars.mjs [extra-client.js...]");
  process.exit(1);
}
const lines = fs.readFileSync(collectedFile, "utf8").split("\n").filter(Boolean);
const missing = [];
for (const line of lines) {
  const [ch, n] = line.split("\t");
  if (simplifiedOnly.has(ch) && !chars[ch]) missing.push({ ch, n: Number(n) });
}
missing.sort((a, b) => b.n - a.n);
if (missing.length === 0) {
  console.log("✓ 字元表已覆蓋全部簡體專用字，無需更新。");
} else {
  console.log(`字元表缺少 ${missing.length} 個簡體專用字（運行時會原樣透傳）：`);
  for (const { ch, n } of missing) {
    console.log(`  "${ch}"  (出現 ${n} 次)  →  請加到 src/zh-tw-parts/chars.json`);
  }
}
