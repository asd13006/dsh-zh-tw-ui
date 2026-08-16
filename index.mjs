// index.mjs — dsh-zh-tw-ui 插件（Host 侧）
//
// 声明自有 settings namespace "zh-tw"（字段 preference: "zh-TW" | null），用于
// 持久化用户对「繁體中文」语言的选择。
//
// 注：当前版本 client 侧用 localStorage 持久化（语言偏好本就是浏览器本地偏好，
// 且 dsh-host-apiproxy 的 settings 白名单 WEB_SETTINGS_NAMESPACES 为硬编码，插件
// 无法 expose 自定义 namespace——官方注释亦标明该能力是 deferred work）。
// 此处的 namespace 注册保留为契约声明：若未来 apiproxy 开放插件 namespace，
// client 可直接切回 settings 通道。
//
// 参考 dsh-client-locale 的 host 注册姿势：ctx.inject(["settings"], …) 延迟挂载，
// settings 服务不可用（headless / 无 Web profile）时插件照常 apply。

import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

const name = "zh-tw-ui";
const inject = ["settings"];

function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace("zh-tw"),
      z.object({ preference: z.string().required(false) }),
    );
  });
}

export { apply, inject, name };
