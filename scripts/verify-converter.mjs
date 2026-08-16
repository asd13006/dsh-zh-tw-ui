// verify-converter.mjs — 验证转换器覆盖：
// 用 chars 转换全部 zh-src 简中值，报告仍有简体专用字残留的字符串。
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const partsDir = path.join(root, "src", "zh-tw-parts");
const srcDir = path.join(root, "src", "zh-src");

const chars = JSON.parse(fs.readFileSync(path.join(partsDir, "chars.json"), "utf8"));
console.log("chars entries:", Object.keys(chars).length);

// 转换器：纯单字简→繁（不做術語片語）
function convert(text) {
  let res = "";
  for (const ch of text) {
    res += chars[ch] ?? ch;
  }
  return res;
}

// 简体专用字残留检查表（与 check-missing-chars.mjs 共用同一份）
const simplifiedOnly = new Set(
  fs.readFileSync(path.join(partsDir, "simplified-only.txt"), "utf8").split("").filter((c) => c && !/\s/.test(c)),
);

// 5) 转换全部 zh-src 并检查残留
let total = 0, residual = 0;
const problems = [];
for (const f of fs.readdirSync(srcDir).filter((x) => x.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(srcDir, f), "utf8"));
  for (const entry of data.entries) {
    for (const [k, v] of Object.entries(entry.dict)) {
      total++;
      const converted = convert(v);
      const bad = [...converted].filter((ch) => simplifiedOnly.has(ch));
      if (bad.length) {
        residual++;
        problems.push(`${f} ${k} [${[...new Set(bad)].join("")}]: ${v}  =>  ${converted}`);
      }
    }
  }
}
console.log(`converted ${total} strings, ${residual} with residual simplified chars`);
if (problems.length) console.log(problems.slice(0, 40).join("\n"));
