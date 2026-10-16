# coupon-dialog

ZamCash 轻量优惠券奖励动效，使用 WebP + CSS + JavaScript，无第三方动画库。

## 在线预览

[打开预览（支持手机和桌面）](https://zamcash-reward-one-turn-20261015.sumu1212.chatgpt.site/)

当前为 **Y 轴翻转一圈（360°）最终版**，支持动态金额、天/时/分/秒倒计时与低性能静态降级。移动端动效展示区位于标题栏下方，控制区在其后。

## 换设备继续优化

请让 Codex 先读取根目录 [AGENTS.md](AGENTS.md)：其中记录当前最终版文案、12 个爆散粒子及三颗大金星、一圈时间线、80 KB 预算、移动端兼容修复、动态数据与降级约束，以及验证、GitHub 同步和原 Sites 预览发布方式。

在新设备克隆最新 `main` 后，可以直接告诉 Codex：

> 先读取 AGENTS.md 和 handoff/FRONTEND-INTEGRATION.md，基于最新 main 继续优化 coupon-dialog；只修改我本次提出的部分，保留其余已确认要求。

代码和素材均在仓库内；`output/` 交付包可重新生成。更新 GitHub 不会自动更新 Sites，原预览发布需要有权限的 Sites 账号。

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

优惠券弹窗已预留数据接入口，目前仍使用演示数据，**尚未接入真实后端接口**。后端需提供：`amount`（券金额，单位 K，1–9999 整数）、`expiresAt`（申请截止时间）、`serverNow`（服务端当前时间），时间均为 Unix 毫秒时间戳；另提供 `id`（券 ID）、`eligible`（是否有资格）、`status`（可用状态为 `available`）。前端获取数据后通过 `RewardCoupon.show()` 展示，倒计时每秒更新、到期关闭。业务口径：**6 天内申请，还款时抵扣**。

- [Zepto + SUI Mobile 接入清单](handoff/ZEPTO-SUI-INTEGRATION.md)：前端适配项、后端字段、请求示例及联调要求，现有项目建议先读此文档。
- [完整接入说明](handoff/FRONTEND-INTEGRATION.md)：组件 API、动效时间线、缓动参数、倒计时与低性能降级。
- [交付包说明](handoff/README.md)：打包后的目录结构、资源及验收范围。

真实接入时，在动效脚本加载前设置 `window.REWARD_COUPON_CONFIG = null` 关闭模拟券，再通过 `RewardCoupon.show(coupon, options)` 传入业务数据。后端提供 `id`、`amount`、`eligible`、`status`、`expiresAt`、`serverNow`；前端负责组件适配、低性能策略及 `onApply` 申请回调。

预览使用模拟数据，尚未连接真实优惠券和申请接口。业务口径为「6 天内申请，还款时抵扣」；资格、金额、截止时刻与实际抵扣由后端决定。

### 后端返回 JSON 示例

以下是建议的响应结构，**不是已上线接口**；示例约定 `code: 0` 表示请求成功，实际地址、鉴权、成功码与字段命名由前后端确认。无可用券时可返回 `{"code":0,"data":null}`。

```json
{
  "code": 0,
  "data": {
    "id": "recall-coupon-20261016-001",
    "amount": 50,
    "eligible": true,
    "status": "available",
    "expiresAt": 1792619999000,
    "serverNow": 1792130400000
  }
}
```

`amount` 是单位为 K 的整数，不是字符串或分；`eligible` 是布尔值。两个时间字段均为 UTC Unix **毫秒整数**，不要传秒级时间戳或日期字符串。示例时间仅用于说明格式：后端每次返回最新 `serverNow`，并按已确认的 6 个自然日规则计算 `expiresAt`；发放日是否计入、截止日具体时刻需业务确认，前端不自行推算。

### 前端调用示例（Zepto）

先在奖励动效脚本执行之前关闭演示数据：

```html
<script>
  window.REWARD_COUPON_CONFIG = null;
</script>
<!-- 此后加载已适配的奖励组件 DOM、样式和脚本。 -->
```

待组件初始化完成、`window.RewardCoupon` 可用后执行以下代码。`/REPLACE_WITH_COUPON_ENDPOINT` 必须替换为真实读券接口；`host.startLoanApplication` 是宿主需要实现的申请入口，必须返回覆盖资格重验和申请交接流程的原生 Promise。当前仓库没有提供这个宿主方法，也没有创建该接口。

```js
// 同一页面首次获取优惠券数据的接入示例。
window.RewardCoupon.close();
window.Zepto.ajax({
  url: '/REPLACE_WITH_COUPON_ENDPOINT',
  type: 'GET',
  dataType: 'json',
  timeout: 10000,
  success: function (res) {
    if (!res || res.code !== 0 || !res.data) {
      window.RewardCoupon.close();
      return;
    }
    var data = res.data;
    window.RewardCoupon.show({
      id: data.id,
      amount: data.amount,
      eligible: data.eligible,
      status: data.status,
      expiresAt: data.expiresAt,
      serverNow: data.serverNow
    }, {
      lowPerformance: false, // 替换为宿主设备策略；true 时静态展示。
      onApply: function (coupon) {
        return host.startLoanApplication({ couponId: coupon.id });
      }
    }).catch(function () {
      window.RewardCoupon.close();
    });
  },
  error: function () {
    window.RewardCoupon.close();
    // 宿主按现有流程处理登录失效、错误提示或重试，不回退演示券。
  }
});
```

组件会校验字段、资格、状态和有效期，动态显示金额并启动倒计时；无效数据不展示。申请失败应让 `onApply` 返回的 Promise reject，宿主通过 `couponapplyerror` 接入现有错误提示；不要直接返回 Zepto XHR，也不要把点击按钮当作已绑定或已抵扣。真实申请仍需后端重新校验并处理幂等绑定，还款时才按规则抵扣。

此例针对首次获取：接入页面返回、重复请求或路由切换时，前端还需按接入清单增加请求序号/页面卸载保护，忽略旧响应，并重新获取券状态和服务端时间。继续复用项目的鉴权、CSRF 和错误处理机制。

## 生成交付包

在仓库根目录运行：

```sh
python3 handoff/package.py
```

生成 `output/zamcash-reward-final.zip`，包含演示源码、素材、接入说明和 SHA-256 校验清单。脚本校验运行资源不超过 80,000 字节；当前约 77.3 KB，按 HTML/SVG gzip level 6 + PNG/WebP 原始大小计算，不含文档和 ZIP 开销。本地 Python 服务器不会自动开启 gzip，线上需单独配置。

交付包内的 `docs/API-EXAMPLES.md` 由本页对接说明、后端 JSON 和前端调用示例自动生成，确保重新打包时同步最新内容。
