# coupon-dialog

ZamCash 轻量优惠券奖励动效，使用 WebP + CSS + JavaScript，无第三方动画库。

## 在线预览

[打开预览（支持手机和桌面）](https://zamcash-reward-one-turn-20261015.sumu1212.chatgpt.site/)

当前为 **Y 轴翻转一圈（360°）最终版**，支持动态金额、天/小时倒计时与低性能静态降级。移动端动效展示区位于标题栏下方，控制区在其后。

## 本地运行

无需安装前端依赖。安装 Git 和 Python 3 后，克隆仓库并启动本地服务器：

```sh
git clone https://github.com/Rain765/coupon-dialog.git
cd coupon-dialog
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 [本地预览](http://127.0.0.1:8765/reward-motion-v2/index.html)。按 `Ctrl+C` 停止服务器。

也可直接用浏览器打开 [reward-motion-v2/index.html](reward-motion-v2/index.html)。

## 前端接入说明

- [Zepto + SUI Mobile 接入清单](handoff/ZEPTO-SUI-INTEGRATION.md)：前端适配项、后端字段、请求示例及联调要求，现有项目建议先读此文档。
- [完整接入说明](handoff/FRONTEND-INTEGRATION.md)：组件 API、动效时间线、缓动参数、倒计时与低性能降级。
- [交付包说明](handoff/README.md)：打包后的目录结构、资源及验收范围。

真实接入时，在动效脚本加载前设置 `window.REWARD_COUPON_CONFIG = null` 关闭模拟券，再通过 `RewardCoupon.show(coupon, options)` 传入业务数据。后端提供 `id`、`amount`、`eligible`、`status`、`expiresAt`、`serverNow`；前端负责组件适配、低性能策略及 `onApply` 申请回调。

预览使用模拟数据，尚未连接真实优惠券和申请接口。业务口径为「6 天内申请，还款时抵扣」；资格、金额、截止时刻与实际抵扣由后端决定。

## 生成交付包

在仓库根目录运行：

```sh
python3 handoff/package.py
```

生成 `output/zamcash-reward-final.zip`，包含演示源码、素材、接入说明和 SHA-256 校验清单。脚本校验运行资源不超过 80,000 字节；当前约 74.6 KB，按 HTML/SVG gzip level 6 + PNG/WebP 原始大小计算，不含文档和 ZIP 开销。本地 Python 服务器不会自动开启 gzip，线上需单独配置。
