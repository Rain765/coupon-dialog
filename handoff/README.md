# ZamCash 奖励动效 · 前端交付

最终规格：**卡片绕竖直中轴（Y 轴）左右翻转半圈，累计 180°。**
版本：`final-2026-10-16-fast-growth`。标题下方倒计时采用 24px 数字、白色圆角底块与 d/h/m/s 简写，每秒更新；保留券角标、移动端线条修复和半圈动效。

本次交付补充 `docs/API-EXAMPLES.md`，包含可转发的简短说明、后端 JSON 和 Zepto 调用示例，与 GitHub README 同步。当前仍未接入真实后端接口。

## 快速查看

解压后直接打开 `demo/index.html`，也可以在解压目录运行：

```sh
python3 -m http.server 8765
```

访问 `http://127.0.0.1:8765/demo/index.html`。无安装步骤、第三方动画库、外部字体或 CDN。
演示保留标题栏、WebP + CSS + JavaScript 技术标签、重播、金额输入、低性能模式、体积/时长说明及 Apply now 交互；其余外围介绍已移除。

## 文件说明

| 路径 | 用途 |
| --- | --- |
| `demo/index.html` | 已确认的完整演示，内含 CSS、JavaScript 与 SVG 兜底 |
| `demo/star-v2.webp` | 开场大星星及爆散小金星共用素材 |
| `demo/reward-v2.webp` | 卡片顶部星星、金币、红色飘带素材 |
| `demo/assets/` | 15 个 SVG、1 个 PNG，来自项目设计稿 |
| `docs/API-EXAMPLES.md` | 金额/倒计时字段、后端 JSON、Zepto 调用、初始化顺序和接口占位说明 |
| `docs/FRONTEND-INTEGRATION.md` | 接入、精确时间线、缓动参数、状态与降级方式 |
| `docs/ZEPTO-SUI-INTEGRATION.md` | 现有框架适配清单、后端字段契约、Zepto 请求示例及联调边界 |
| `docs/ASSET-CHANGES.md` | 红色飘带素材的编辑方式、提示词与压缩规格 |
| `asset-manifest.json` | 文件 SHA-256、原始大小、gzip 估算、源码提交号 |
| `SHA256SUMS.txt` | 包内文件校验表，可执行 `shasum -a 256 -c SHA256SUMS.txt` |
| `references/` | 原始 README、素材提示词和 Figma 来源；原始 README 的旧文案/体积不是当前规格 |

## 最终确认项

- 12 个爆散粒子：9 颗金星 + 3 个微光点，保留金色拖尾。
- 卡片半圈翻转：0.6–1.2 秒；连续放大：0.6–2.0 秒；2.2 秒后按钮可用。
- 右侧文案恢复为 Pay on time / and reduce your loan cost；券高保持紧凑，申请倒计时位于标题下方，黑字、数字加粗，显示 d/h/m/s 四段倒计时；券角标为 Repayment discount；金额动态绑定，保留配色和素材。模拟默认 K25，真实接入读取后端字段。
- 运行资源约 **77.3 KB**，准确字节数见清单。口径为 HTML/SVG gzip level 6 + PNG/WebP 原始字节，不含 HTTP 头、文档和 ZIP 容器开销。
- 线上要为 HTML/SVG 启用 gzip。上述 Python 预览服务器不会自动启用 gzip。

## 交付边界

这是可运行的原生 HTML/CSS/JavaScript 参考实现，尚未连接真实优惠券接口。现有项目使用 Zepto + SUI Mobile，接入方需完成组件 DOM 解耦、样式隔离、请求适配和生命周期处理；请先阅读 `docs/ZEPTO-SUI-INTEGRATION.md`。
宿主项目接入时先设置 `window.REWARD_COUPON_CONFIG = null` 关闭模拟券，再调用 `RewardCoupon.show(coupon, options)`；配置 `onApply` 接申请流程。资格、金额与到期时间由后端决定，过期自动关闭。详见接入说明。
后端提供 `id`、`amount`、`eligible`、`status`、`expiresAt`、`serverNow`；前端提供 `lowPerformance` 和返回 Promise 的 `onApply`。字段为待对接契约，不代表测试站已有对应接口。
已做浏览器验证；目标市场低端手机真机表现仍需前端在目标设备上验收。
