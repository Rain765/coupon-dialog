# coupon-dialog：跨设备继续开发

本文件记录用户已确认的最终版要求和后续优化注意事项。开始修改前先读本文件、`README.md`、`handoff/FRONTEND-INTEGRATION.md`；涉及业务接入时再读 `handoff/ZEPTO-SUI-INTEGRATION.md`。用户后续明确提出的新要求优先；只修改本次要求涉及的内容。

## 当前基线与入口

- 项目：ZamCash 非洲市场老用户召回优惠券，轻量 WebP + CSS + JavaScript，无第三方动画库。
- 当前视觉版本：`final-2026-10-16-early-button`（2026-10-16）。本版按钮提前至 900–1300ms 渐显，卡片放大停稳时即可点击；装饰交接仍为 2200ms，后续从 GitHub 最新 `main` 继续。
- 仓库：<https://github.com/Rain765/coupon-dialog>。
- 预览：<https://zamcash-reward-one-turn-20261015.sumu1212.chatgpt.site/>。
- 运行入口：`reward-motion-v2/index.html`，内含页面、CSS、JavaScript；`star-v2.webp`、`reward-v2.webp` 和 `assets/` 已全部提交，可直接克隆运行。
- 仓库根目录运行 `python3 -m http.server 8765 --bind 127.0.0.1`，打开 `http://127.0.0.1:8765/reward-motion-v2/index.html`。无前端依赖安装步骤。
- `README.txt`、`asset-prompts.txt`、`FIGMA-SOURCE.txt` 是历史参考，保留原件；其中旧参数不能覆盖本文件及最新接入说明。

## 已确认的视觉与文案

- 保持 ZamCash 红色 `#E34D59`，卡片浅红到白渐变：`linear-gradient(#fbdde1 0%,#fff0f2 55%,#fff 100%)`。
- 标题：`Welcome back!`。标题下方只放倒计时，不恢复已删除的说明小字。
- 优惠券右侧文案严格保留两段：`Pay on time` + 显式换行 + `and reduce your loan cost`。不自行改写、补充或翻译。
- 角标：`Repayment discount`；按钮：`Apply now`；面额：动态 `K{amount}`。
- 倒计时位于标题下方，示例 `05d 23h 59m 59s`，每秒更新；单位使用单字母 d/h/m/s。数字黑色、24px、粗体，每组两位数字后为白色圆角矩形；单位 13px。不要移回优惠券角标位置。
- 优惠券保持紧凑：最小高度 76px；右侧文字 padding 为 `20px 10px 14px`，比之前上移 4px；窄屏允许自然换行增高，不能与角标重叠。
- 顶部奖励图左下飘带为红色，保留 `.hero-art { filter:blur(.55px) }` 的静态柔化，不把模糊加到卡片或文字上。素材编辑历史在 `handoff/ASSET-CHANGES.md`。
- 手机端动效预览位于标题栏下方最上面，演示控制区排在其后。不要增加用户未要求的说明、徽标、水印或预览提示。

## 动效：保持半圈与自然爆散

- 卡片和顶部奖励图绕竖直中轴 **Y 轴翻转半圈（180°）**，不是 Z 轴平面转圈，也不是早期 3 圈版本。
- 旋转从 600ms 到 1200ms，`rotateY(-180deg)` → `rotateY(0deg)`；中间 45.067141% 为 -60deg。两段缓动分别为 `cubic-bezier(.336590,.296449,.603158,.690273)` 和 `cubic-bezier(.230493,.438551,.530806,1)`，保留停稳缓冲。
- 连续放大从 600ms 到 1300ms，scale .08 → 1，缓动 `cubic-bezier(.35,0,.5,1)`；按钮从 900ms 开始渐显，1300ms 后解锁。旋转和缩放使用独立容器，不合并 transform。
- 爆散共 **12 个粒子：9 颗金星 + 3 个微光**。不要恢复到 18 个或更多。
- 基础尺寸数组为 `[8,24,11,5,32,9,15,6,12,28,7,4]` px，乘以 0.9–1.1。其中索引 1、4、9（第 2、5、10 个粒子）是特意放大的三颗金星，基础尺寸为 24/32/28px。
- 保留大小层次、柔和边缘、短光线拖尾、向外减速和向下加速形成的弧线。每次正常播放通过 `scatter()` 做有界随机变化，避免等大、等距、完全重复的直线放射。
- 粒子 400–480ms 错峰开始，持续 720–1120ms，最迟 1600ms 消失。节点只建一次，重播不追加节点；随机参数只在播放前计算，不做逐帧 JS 布局。
- 向外飞行和下坠分别由 `.burst-flight`、`.burst-ray` 控制；保留两层。详细范围和滤镜值见完整接入说明。
- 装饰动画有限次播放，正常前台最迟 8600ms 停止。不要改为无限动画或动画化大面积 blur。

## 动态字段与业务边界

- 业务含义是**发券后 6 个自然日内申请借款，还款时抵扣**。倒计时是申请资格截止，不是还款截止；不因这点自行改写已确认的券文案。
- 金额、资格、状态、截止时刻和服务端时间由后端提供：`id`、`amount`、`eligible`、`status`、`expiresAt`、`serverNow`。金额不能写进图片，截止时间不能每次打开都重新加 6 天。
- 倒计时按服务端时间校准，刷新或重播不续期；到期/无资格关闭奖励。保留防重复申请、异步失败恢复和旧响应不能影响新券等保护。
- `RewardCoupon.show/replay/close/destroy` 为现有单实例接口。真实业务接入前设置 `window.REWARD_COUPON_CONFIG = null`，避免回退到演示模拟券。
- 当前演示没有真实发券、费用计算、申请或还款接口；不要将预览按钮行为当成已完成业务绑定。真实抵扣、资格和频控由后端裁定。
- 宿主项目是 Zepto + SUI Mobile：组件样式需限定作用域，保留本地 `$` 的闭包，不污染全局 Zepto；需适配请求、生命周期及 `onApply` Promise。完整清单在 `handoff/ZEPTO-SUI-INTEGRATION.md`。

## 性能与移动端兼容

- 运行资源预算为 **80,000 字节以内**：HTML/SVG gzip level 6，WebP/PNG 按原始字节计，不包含文档、HTTP 头和 ZIP 开销。当前为 77,384 字节，约 77.4 KB；后续以实际重新打包测量为准。
- 不引入第三方动画库、外部字体或不必要的大素材。优先复用已有透明 WebP；改图时保持透明边缘并重新测量体积。
- 已修复手机端券线条丢失：外框采用内联 `.coupon-outline` SVG 与 `vector-effect="non-scaling-stroke"`，分隔线采用 CSS `border-left:1px dashed`。不要退回外部 SVG 背景或旋转细线实现。
- 保留 `lowPerformance`、系统 `prefers-reduced-motion`、图片失败/解码超过 1200ms 的静态降级与 SVG 兜底；静态模式仍须有正确倒计时和可用按钮，不能只关 CSS 动画却继续等待 `animationend`。
- 当前没有自动低端机检测，需宿主传入策略；低性能开关也不能修复旧 WebView 不支持的 JS 语法/API，兼容范围需前端核实。目标市场低端真机仍待验证。

## 修改、验证与交付

1. 修改前记录分支、HEAD 和工作区状态。使用可用的 `safe-task-commit` 流程；保留无关改动，不整仓盲目暂存。仅提交本次工作，不 amend/rebase/force-push。
2. 保持用户已确认的文案和其他效果。源码有多轮 CSS 覆盖规则，修改时核对最终生效样式；不要只改最早一处同名选择器。
3. 按变更范围验证。视觉变化检查手机窄屏和桌面，重点看 320/390px 下角标、文案、倒计时、线框；涉及兼容时检查 WebKit。动效/逻辑变化运行 `tests/recall-coupon.browser.js`，该文件是交给 Playwright 页面执行的 async 函数，不是直接用 Node 执行的脚本。使用 Playwright CLI 时，打开本地页面后可通过 `run-code "$(cat tests/recall-coupon.browser.js)"` 执行。
4. 验收首播/重播、半圈累计角度、12 粒子与三颗大金星、随机轨迹、动态金额、倒计时边界、过期、减少动态/低性能、图片异常。未做的真机验证要如实说明，不用桌面模拟代替。
5. 运行 `python3 handoff/package.py`，校验体积、素材哈希和 ZIP；同步变化涉及的接入参数与版本。`output/` 是忽略的生成目录，换设备后重新生成，不依赖旧电脑的 ZIP、截图或绝对路径。
6. 审阅完整暂存 diff，再创建范围明确的提交。上传 GitHub或发布按用户授权执行；上传前核对远程最新状态，不覆盖其他设备的新提交。确认推送结果后提供提交链接。

## 换设备与预览发布

- 克隆最新 `main` 即可继续开发；不需要旧设备的下载目录、浏览器会话或本地服务。
- GitHub 更新不会自动更新 Sites。需要原预览同步时，使用有权限的同一 Sites 账号及 Sites 技能流程。
- 原站点 project ID：`appgprj_6ad0d8c3d5d881918e140d6ea386cef7`，现为公开链接访问。先用 Sites 工具核实站点和权限，打开它已有的源码仓库，保留访问范围，不创建同名重复站点。
- Sites 源码部署配置为 `.openai/hosting.json` 中 `static.directory = "dist"`。将验证后的运行入口与素材同步到原站点的 `dist/`，通过 Sites 的源码同步、保存版本、部署流程发布。这个源码 checkout 在新设备上应由工具重新打开，不能照搬旧电脑的 `output/mobile-preview-site` 路径。
- 仓库只记录非敏感站点 ID 与链接，不存账号、验证码、访问令牌或发布凭据。若新设备缺少 Sites 权限，可以完成 GitHub 更新，但须说明原预览尚未更新。
