"""撳已安裝 tab，dump 插件列表"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3080"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)
    for label in ["設定", "设置"]:
        loc = page.get_by_role("button", name=label, exact=False)
        if loc.count() > 0:
            loc.first.click()
            page.wait_for_timeout(1500)
            break
    for label in ["插件市場", "插件市场"]:
        loc = page.get_by_text(label, exact=True)
        if loc.count() > 0:
            loc.first.click()
            page.wait_for_timeout(3000)
            break
    # 撳「已安装」tab
    for label in ["已安装", "已安裝", "已装好", "已裝好"]:
        loc = page.get_by_text(label, exact=False)
        if loc.count() > 0:
            loc.first.click()
            page.wait_for_timeout(2000)
            print(f"clicked: {label}")
            break
    # 搵 market 面板入面嘅 dsh-zh-tw-ui（排除側邊欄 session）
    body = page.locator("body").inner_text()
    # 側邊欄 session 標題係「安裝dsh-zh-tw-ui」；市場清單係「dsh-zh-tw-ui」
    import re
    idxs = [m.start() for m in re.finditer(r'dsh-zh-tw-ui', body)]
    for idx in idxs:
        snippet = body[max(0, idx-120):idx+250]
        if 'git+' in snippet or 'v0.1.0' in snippet or 'github' in snippet.lower() or '設定' in snippet or '簡體' in snippet:
            print("==== 市場清單 snippet ====")
            print(snippet)
    # dump 已安裝 tab 全文（如果有「已安装」標題後嘅內容）
    try:
        page.screenshot(path=r"C:\Users\leolai\Desktop\dsh-zh-tw-ui\verify\market-installed.png", full_page=True)
    except Exception:
        pass
    browser.close()
    print("DONE")
