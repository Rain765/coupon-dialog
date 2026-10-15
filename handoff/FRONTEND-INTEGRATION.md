# 前端接入说明 · 一圈最终版

版本：`final-2026-10-16-red-ribbon`，2026-10-16。本次将卡片改为浅红到白渐变，并使用红色飘带奖励图；保留秒级倒计时与一圈动效。
运行源码为 `demo/index.html`。所有时间单位为毫秒，角度单位为度。

现有项目请先看 [Zepto + SUI Mobile 接入清单](ZEPTO-SUI-INTEGRATION.md)：已确认框架、前端适配项、后端字段契约、请求包装示例和待联调范围分别列明。当前完整演示仍需拆分适配，不是直接引入即可替换业务页面的 SDK。

## 1. 最终视觉和资源约束

- 卡片与顶部星星/金币整体绕 **Y 轴翻转 1 圈（360°）**；旋转角度从 -360 到 0，没有额外圈数。
- 18 个爆散粒子（14 金星 + 4 微光），复用开场 WebP；粒子仅创建一次，重播不追加节点。
- 保留开场透明 WebP，顶部奖励图使用红色飘带版本；保留 ZamCash 红色 `#E34D59`、已确认文案和布局。不引入动画库或外部字体。
- 标题 `Welcome back!`，下方仅保留倒计时；面额 `K{amount}` 动态更新；说明恢复为 `Pay on time` / `and reduce your loan cost`（保留显式换行）；按钮 `Apply now`。
- 倒计时位于标题下方（间距 12px），显示 `05d 23h 59m 59s`，每秒更新；黑色 `#1d2129`，数字 24px / `font-weight:700`，单位 13px，四段间距 8px；每组两位数字使用白色圆角底块（圆角 6px，最小宽度 34px，padding 3px 4px）；优惠券右上角恢复 `Repayment discount`。券最小高度 76px，说明 padding 为 24px 10px 10px；窄屏自然换行允许高度增加。
- 卡片背景为 `linear-gradient(#fbdde1 0%,#fff0f2 55%,#fff 100%)`，浅红到白的渐变衬托白色数字底块。
- 业务含义：发券后 6 个自然日内申请该笔借款，还款时抵扣。倒计时不是还款截止时间；展示文案按最新确认恢复为 `Pay on time…`，前端不新增还款业务校验规则。
- 包内 `asset-manifest.json` 给出精确体积与哈希。80,000 字节预算只计算运行资源，不把说明文件和校验清单发送给页面。

## 2. 接入结构

先运行整个 `demo/index.html` 对照最终效果。嵌入现有项目时保留 `.veil`、`.scene` 下的完整结构、兜底 SVG 和相关状态样式。

```text
.screen                       状态类挂载点、定位容器、裁切边界
├─ .loan-page                  演示业务背景，可替换为真实页面
├─ .veil                       遮罩
└─ .scene
   ├─ .aura / .ring / .ring.two
   ├─ .welcome-star            star-v2.webp + 遮罩高光
   ├─ .arrival-flash
   ├─ .burst-layer             18 个方向容器 / 飞行层 / 星点
   └─ .reward-reveal           连续缩放 + perspective
      └─ .reward-turn          单独负责 Y 轴翻转
         ├─ .hero             reward-v2.webp + SVG 兜底
         ├─ .spark × 6        静止阶段的小闪光，不计入 18 个爆散粒子
         └─ .reward-card      标题、倒计时、优惠券、按钮
```

`.reward-reveal` 和 `.reward-turn` 必须保留两层，避免一个 transform 覆盖另一个。
二者 `transform-origin: 50% 370px`；外层 `perspective: 700px; perspective-origin: 50% 370px`。
演示内部屏幕基准为 375 × 812 px，手机外框为 391 × 828 px；爆散中心为 `(50%, 370px)`。
卡片 top 为 292px，左右 16px；顶部装饰 top 为 205px。若宿主调整布局，需统一调整中心、装饰与卡片的位置。

源码包含历次覆盖样式，最后的 ZamCash 规则优先。迁移时保留样式顺序，不要仅复制最早一组同名规则。
只将动效样式作用于组件根节点，不将演示 `.shell`、`body`、`:root`、全局 button/input 规则直接覆盖宿主全站。
拆分 CSS 文件或打包图片时，同时更新 `<img src>`、preload、mask 与 CSS background 的相对路径。
移动端兼容：券外框复用原素材轮廓作为内联 `.coupon-outline` SVG，1px 描边并使用 `vector-effect="non-scaling-stroke"`；`.coupon-divider` 为原生 `border-left:1px dashed`，不再依赖外部 SVG 背景或旋转细线。原始 SVG 文件保留供追溯；迁移时不能把线条退回旧实现。
当前脚本通过固定 ID 查找单实例；若同页放多个实例，须改为根节点内查询并给内联 SVG 的渐变/path ID 加实例前缀。

## 3. 精确时间线

`t = 0` 指素材准备完成或策略判断后，添加 `.is-playing` 的时刻，不是导航开始时间。
首次等待图片解码最多 1200ms，该等待不计入下面的 2200ms 动效时长。

| 阶段 / 选择器 | 起点 | 时长 | 终点 | 动作 |
| --- | ---: | ---: | ---: | --- |
| `.veil` | 0 | 240 | 240 | 遮罩渐入 |
| `.welcome-star` | 0 | 640 | 640 | 大星星弹出、蓄力、消散 |
| `.star-sheen:after` | 120 | 380 | 500 | 一次高光扫过 |
| `.arrival-flash` | 380 | 460 | 840 | 爆散瞬间柔光 |
| `.burst-flight` | 400–480 | 920–1280 | 最迟 1728 | 18 个粒子错峰飞出；参数按索引配对，不能把最大 delay 和最大 life 随意相加 |
| `.ring` / `.ring.two` | 400 / 460 | 720 / 800 | 1120 / 1260 | 两道光环 |
| `.reward-turn` | 600 | 1200 | 1800 | -360° → 0°，完整 1 圈 |
| `.reward-reveal` | 600 | 1400 | 2000 | scale .08 → 1，translateY 8px → 0 |
| `.hero-glow` | 640 | 800 | 1440 | 顶部装饰光晕 |
| `.spark` 奇数 / 偶数 | 980 / 1060 | 800 | 1780 / 1860 | 固定装饰星点出现 |
| `.claim` | 1450 | 750 | 2200 | 按钮渐显；结束后允许点击 |

2200ms 后进入 `.is-ready`：顶部装饰上下浮动 2px，3200ms × 2 次；六个星点闪烁 2800ms × 2 次，偶数星点延迟 800ms。
正常前台播放时，所有装饰运动最迟在 t=8600ms 停止，没有无限循环。减少动态/低性能模式跳过这些运动。

## 4. 缓动与关键帧

### 卡片旋转：保持这组分段参数

```css
.is-playing .reward-turn {
  animation: reward-turn 1.2s .6s both;
}
@keyframes reward-turn {
  0% {
    transform: rotateY(-360deg);
    animation-timing-function: cubic-bezier(.336590,.296449,.603158,.690273);
  }
  45.067141% {
    transform: rotateY(-120deg);
    animation-timing-function: cubic-bezier(.230493,.438551,.530806,1);
  }
  100% { transform: rotateY(0deg); }
}
```

中间关键帧位于相对动画 540.806ms，即总时间 t≈1140.806ms；此时已转过 240°。
后段约 659.194ms 完成剩余 120°，保持连接处速度连续，末端速度趋近于零。
关键帧上的 easing 控制从该关键帧到下一关键帧的区间。不要用统一 `ease` 覆盖这两段。

### 卡片放大：独立于旋转

```css
.is-playing .reward-reveal {
  animation: reward-reveal 1.4s .6s both cubic-bezier(.35,0,.5,1);
}
@keyframes reward-reveal {
  0% { opacity: 0; transform: translateY(8px) scale(.08); }
  12% { opacity: 1; }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

缩放单调增长到 1，无末尾缩小回弹。旋转于 1800ms 停稳后，剩余 200ms 完成原缩放曲线的轻微收尾。

### 其余缓动

| 动画 | 缓动 |
| --- | --- |
| 大星星 0–42% | `cubic-bezier(.16,.8,.24,1)` |
| 大星星 42–64% | `ease-in-out` |
| 大星星 64–80% | `cubic-bezier(.3,0,.7,1)` |
| 大星星 80–100% | 默认 `ease` |
| 高光扫过 | `cubic-bezier(.3,0,.2,1)` |
| 粒子飞行 | `cubic-bezier(.12,.64,.22,1)` |
| 粒子自身旋转 | `ease-out` |
| 光线拖尾 | `linear` |
| 遮罩、爆散光、光环、装饰星点出现、按钮渐显 | 默认 `ease` |
| 就绪后的 float / twinkle | `ease-in-out` |

大星星关键帧：0% 为 y18/scale.32/rotate-16/opacity0；42% 为 y-3/scale1.12/rotate4/opacity1；64% 为 y0/scale1.04/rotate-2；80% 为 scale1.18/rotate2/opacity.9；100% 为 scale.4/rotate8/opacity0。
所有播放阶段动画使用 `animation-fill-mode: both`，确保 delay 期间保持起始状态。

### 爆散粒子参数

`i = 0…17`，均为确定性参数，重播不重新随机：

```js
angle = (i * 137.508) % 360;             // deg
reach = 112 + (i * 47) % 126;            // px
isGlint = i % 4 === 3;
size = isGlint ? 5 + i % 5 : 13 + (i * 7) % 17; // px
trail = isGlint ? 24 : 42 + (i * 11) % 48;        // px
delay = 400 + (i % 6) * 16;              // ms
life = 920 + (i % 5) * 90;               // ms
spin = i % 2 ? 160 : -120;               // deg
```

## 5. 数据与交互接入

源码提供 `window.RewardCoupon` 单实例接口。**真实接入必须在本脚本执行前设置 `window.REWARD_COUPON_CONFIG = null`**，关闭默认模拟券；等待业务接口成功后调用 `show()`。不要把完整演示中的模拟数据初始化带入线上。

```html
<!-- 在动效脚本执行前，禁止演示券自动出现 -->
<script>window.REWARD_COUPON_CONFIG = null;</script>
```

```js
// 以下 couponResponse 由宿主真实接口返回，不在前端推导金额档位或发券时间。
const shown = await window.RewardCoupon.show({
  id: couponResponse.id,
  amount: couponResponse.amount,
  eligible: couponResponse.eligible,
  status: couponResponse.status,
  expiresAt: couponResponse.expiresAt,
  serverNow: couponResponse.serverNow,
}, {
  lowPerformance: devicePolicy.reduceMotion,
  onApply: async (coupon) => {
    // 宿主实现：服务端重验券，再进入申请流程并携带 coupon.id。
    // 成功跳转/交接后 resolve；失败 reject，并由宿主显示业务错误。
    // 点击本身不代表申请成功、绑定成功或已经抵扣还款。
    await host.startLoanApplication({ couponId: coupon.id });
  },
});
```

也可预先传入 `window.REWARD_COUPON_CONFIG = {coupon, lowPerformance, onApply}` 直接初始化。示例 `host` / `devicePolicy` / `couponResponse` 是宿主适配接口，不是本包内实现。

以下 6 个字段来自后端，经宿主映射后传入第一个参数：

| 字段 | 类型 / 约束 | 含义 |
| --- | --- | --- |
| `id` | 非空字符串 | 后端真实券 ID，申请流程用它重新校验和绑定 |
| `amount` | 1–9999 整数 | 实际发放的 K 金额；示例业务券为 25 / 50 / 100，前端不计算授信区间 |
| `eligible` | 严格为 `true` 才展示 | 后端已完成召回人群、活动规则、发券/展示频控等条件判断 |
| `status` | 严格为 `available` 才展示 | 其他状态包括已绑定、已使用、已撤销等，均不展示 |
| `expiresAt` | UTC Unix 毫秒整数 | 申请使用优惠券的真实截止时刻，由后端按赞比亚业务时区计算 6 个自然日 |
| `serverNow` | UTC Unix 毫秒整数 | 本次响应的服务端当前时间；每次刷新数据都要更新，不能重用陈旧时间 |

以下是前端提供的第二个参数，不属于后端券字段：

| 配置 | 类型 / 约束 | 含义 |
| --- | --- | --- |
| `lowPerformance` | boolean，位于第二个参数 | 宿主低性能策略；与演示开关、系统减少动态合并判断 |
| `onApply` | 返回 Promise 或同步返回的函数，位于第二个参数 | 点击 Apply now 后交给宿主；未提供时按钮保持禁用 |

**金额、过期时间、ID 缺失或格式不合法，不弹券，也不回退到 K25。** 不满足资格、状态不可用、截止时间已到，也不播放。后端须确定授信档位边界（原需求在 K450、K950 重叠），前端不能自行决定包含关系。

时间处理：以 `serverNow + performance.now()` 的经过时间推进，每秒重算 `expiresAt - now`，不依赖定时器执行次数；将剩余总秒数向下取整，拆成 d/h/m/s（天/时/分/秒），例如 `05d 23h 59m 59s`；数字至少补齐两位。剩余不足一秒显示 `00d 00h 00m 00s`，但仍按精确截止时间判断是否可用，不提前过期。重播不更新截止时间、不重新发券。到期后关闭动效/遮罩并禁用按钮，素材等待中、播放中、静态模式和点击前都会检查有效性。后台暂停的是 CSS 动画，回前台会立即检查倒计时；设备长时间休眠后，宿主应重新请求最新服务端时间/券状态（不同系统的单调时钟在休眠期间行为可能不同）。接口网络延迟不由演示校正，服务端仍是是否允许申请的最终裁决。

| API | 行为 |
| --- | --- |
| `show(coupon, options)` | 替换数据并按资格触发一次播放，返回 Promise<boolean>；false 表示被拒绝、关闭或被新请求替代 |
| `replay()` | 按当前数据重播，不延长有效期；申请回调未完成时不重播 |
| `close()` | 关闭卡片，清理倒计时，使在途素材/申请回调的 UI 更新失效；不取消宿主已发送的业务请求 |
| `destroy()` | 关闭并移除全部事件/定时器，实例不再接受 show；SPA 卸载时调用 |

动画交互：保留独立缩放/旋转、素材准备策略和 `run` 序号检查。正常模式必须等待按钮自身的 `animationend` 且 `animationName === 'veil-in'` 后解锁；不要用 `setTimeout(2200)`，否则后台暂停会提早解锁。静态降级在数据仍有效时直接解锁。

申请回调执行中按钮禁用，阻止连点；成功后关闭弹窗，**不显示原先模拟的 Coupon -K25 扣款行**。失败时若券仍有效则恢复按钮，并在 `#screen` 派发 `couponapplyerror`，`event.detail` 含 `couponId` 与 `error`，由宿主处理错误提示。同一实例中新券已替换旧券时，旧回调不会关闭新券。宿主需保证请求幂等，申请成功/券绑定后刷新服务端状态，避免再次调用旧的 available 数据。不得把点击成功当作真实绑定/抵扣完成。

演示边界：未设置配置全局变量时，使用一张模拟券，金额输入驱动 `amount`，首次访问生成约 6 天的截止时间并存入 `localStorage`（键 `zamcash-recall-demo-expiresAt`）。刷新/重播沿用它，到期不自动续期；这是便于产品确认的模拟时长，真实自然日边界仅由后端计算。预览的 Apply now 只关闭弹窗并回到申请页面背景，不会发起借款或抵扣。浏览器禁用存储时，模拟截止时间仅在本页生命周期内保持；生产数据不依赖浏览器存储。接入模式禁用演示金额输入。

借款金额、费用、账户仍为设计稿背景静态样例，没有真实费用计算。演示脚本不调用真实接口，不自行执行短信发送任务或推导召回人群，不内置跨页面/跨会话频控；这些由宿主后端决定。不要把倒计时或客户端校验作为真实发券、申请审批的依据。

## 6. 低性能与异常降级

| 条件 | 触发方式 | 表现与交互 |
| --- | --- | --- |
| 用户/宿主选择低性能 | `lowPerformance` 或演示 checkbox 对应 `.low-motion` | 素材等待/超时策略完成后直接显示最终卡片；跳过入场、爆散、光线及就绪后的装饰运动；有效券且配置申请回调时按钮可用 |
| 系统减少动态 | `matchMedia('(prefers-reduced-motion: reduce)')`，CSS 同时有媒体查询 | 同样直接静态展示；监听偏好变化后重新走播放决策 |
| 素材超过 1200ms 未全部解码 | `.asset-pending` | 用内联 SVG 兜底，静态展示；有效券且配置申请回调时按钮可用；素材后来全部成功后替换成 WebP，不重播、不重开已使用的卡片 |
| 任意主 WebP 解码失败 | `.asset-error`，`failed = true` | 保留 SVG 兜底；当前实例后续重播仍走降级分支，源码未实现网络重试复位 |
| 页面进入后台 | `document.hidden` → `.is-paused` | 暂停所有 CSS 动画及 `:after` 动画；返回前台继续，按钮按 CSS 动画结束时机解锁 |
| 浏览器不支持图片 mask | `@supports` 未通过 | 仅不显示星星扫光，其余流程照常 |

**没有自动识别低端机的逻辑。** 接入方可基于自己已有的设备策略设置低性能标志，不要假设某个 UA、网络类型或 hardwareConcurrency 阈值已内置。

宿主设置低性能时，要同时执行静态业务分支并启用按钮；不要仅通过外部 CSS 把动画关掉，却让 JS 一直等待 `animationend`。
降级 CSS 保留在完整源码内，关闭 `.scene` 子节点及 `:after` 的 animation，并隐藏开场星星/光环。粒子默认 opacity 为 0，无动画时不会露出。
现有浏览器接口包括 `img.decode()`、`matchMedia().addEventListener()` 和 CSS 3D transform；脚本还使用 async/await、Promise 等语法和能力。旧 WebView 需按目标版本转译、补齐能力或在加载脚本前选择独立兼容静态实现；仅设置 `lowPerformance` 不能解决语法解析失败或缺失方法。详见框架接入清单第 5 节。

## 7. 发布与验收

- HTML 和 SVG 用 gzip（测量 level 6）；WebP/PNG 直接传输。确保服务器响应具备正确 MIME 和 `Content-Encoding: gzip`；不要仅因 ZIP 很小就认定线上已压缩。
- 清单已包含完整演示背景素材，迁入真实页面后可只保留实际依赖，但先确认 CSS background/mask 与 SVG 兜底仍完整。
- 低端优化原则：复用已解码图片、一次创建粒子、保留有限播放次数、只对 transform/opacity 做动画；不用逐帧 JS 调布局，不新增大面积动态 blur。
- 验收正常首播/重播、1 圈累计 360°、18 个粒子、金额最大值、320/360/390px、Apply now、低性能/系统减少动态、素材失败和超过 1200ms、后台暂停、快速重播、file:// 离线。
- 动态数据版本已通过 35 项浏览器断言，包括无资格、金额非法、已过期、播放中到期、刷新/重播不续期、申请失败/重复点击、数据替换、组件销毁、天/小时/分钟边界与秒级更新及 320/390/1200px 排版；回归脚本位于源码仓库 `tests/recall-coupon.browser.js`。
- 最终一圈版本实测累计角度 360°，18 粒子，正常展示与两种减少动态模式通过；此前验证覆盖窄屏、暂停、慢图/坏图和离线。目标市场低端真机尚未验证。

原始文档保存在 `references/` 供追溯，其旧规格不覆盖本文件。不要把演示外围控制区、说明和体积数字作为线上产品业务文案。
