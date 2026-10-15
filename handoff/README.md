# ZamCash 奖励动效 · 前端交付

最终规格：**卡片绕竖直中轴（Y 轴）左右翻转 1 圈，累计 360°。**
版本：`final-2026-10-15-one-turn`。以包内源码及本说明为准。

## 快速查看

解压后直接打开 `demo/index.html`，也可以在解压目录运行：

```sh
python3 -m http.server 8765
```

访问 `http://127.0.0.1:8765/demo/index.html`。无安装步骤、第三方动画库、外部字体或 CDN。
演示提供重播、金额输入、低性能模式及 Use Now 交互。

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
- 文案、配色和现有素材保持确认版本；默认金额 K25。
- 运行资源约 **73.0 KB**，准确字节数见清单。口径为 HTML/SVG gzip level 6 + PNG/WebP 原始字节，不含 HTTP 头、文档和 ZIP 容器开销。
- 线上要为 HTML/SVG 启用 gzip。上述 Python 预览服务器不会自动启用 gzip。

## 交付边界

这是可运行的原生 HTML/CSS/JavaScript 参考实现，尚未封装为 React/Vue SDK，也未连接真实优惠券接口。
宿主项目接入时保留动画参数，替换演示业务处理，按接入说明处理生命周期与降级。
已做浏览器验证；目标市场低端手机真机表现仍需前端在目标设备上验收。
