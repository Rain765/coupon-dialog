# ZamCash 奖励动效 · 前端交付

最终规格：**卡片绕竖直中轴（Y 轴）左右翻转 1 圈，累计 360°。**
版本：`final-2026-10-15-recall-minimal-one-turn`。以包内源码及本说明为准。

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
| `demo/reward-v2.webp` | 卡片顶部星星、金币、丝带素材 |
| `demo/assets/` | 15 个 SVG、1 个 PNG，来自项目设计稿 |
| `docs/FRONTEND-INTEGRATION.md` | 接入、精确时间线、缓动参数、状态与降级方式 |
| `asset-manifest.json` | 文件 SHA-256、原始大小、gzip 估算、源码提交号 |
| `SHA256SUMS.txt` | 包内文件校验表，可执行 `shasum -a 256 -c SHA256SUMS.txt` |
| `references/` | 原始 README、素材提示词和 Figma 来源；原始 README 的旧文案/体积不是当前规格 |

## 最终确认项

- 18 个爆散粒子：14 颗金星 + 4 个微光点，保留金色拖尾。
- 卡片 1 圈翻转：0.6–1.8 秒；连续放大：0.6–2.0 秒；2.2 秒后按钮可用。
- 右侧文案恢复为 Pay on time / and reduce your loan cost；券高缩小，申请倒计时移到右上角，仅显示天/小时；金额动态绑定，保留配色和素材。模拟默认 K25，真实接入读取后端字段。
- 运行资源约 **74.0 KB**，准确字节数见清单。口径为 HTML/SVG gzip level 6 + PNG/WebP 原始字节，不含 HTTP 头、文档和 ZIP 容器开销。
- 线上要为 HTML/SVG 启用 gzip。上述 Python 预览服务器不会自动启用 gzip。

## 交付边界

这是可运行的原生 HTML/CSS/JavaScript 参考实现，尚未封装为 React/Vue SDK，也未连接真实优惠券接口。
宿主项目接入时先设置 `window.REWARD_COUPON_CONFIG = null` 关闭模拟券，再调用 `RewardCoupon.show(coupon, options)`；配置 `onApply` 接申请流程。资格、金额与到期时间由后端决定，过期自动关闭。详见接入说明。
已做浏览器验证；目标市场低端手机真机表现仍需前端在目标设备上验收。
