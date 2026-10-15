# 前端接入说明 · 一圈最终版

版本：`final-2026-10-15-one-turn`，2026-10-15。
运行源码为 `demo/index.html`。所有时间单位为毫秒，角度单位为度。

## 1. 最终视觉和资源约束

- 卡片与顶部星星/金币整体绕 **Y 轴翻转 1 圈（360°）**；旋转角度从 -360 到 0，没有额外圈数。
- 18 个爆散粒子（14 金星 + 4 微光），复用开场 WebP；粒子仅创建一次，重播不追加节点。
- 保留两张原始透明 WebP、ZamCash 红色 `#E34D59`、已确认文案和布局。不引入动画库或外部字体。
- 标题 `Benefit Countdown`；倒计时 `02 day 14 hrs`；面额 `K25`；券标 `Discount`；说明 `Pay on time` / `and reduce your loan cost`；按钮 `Use Now`。换行以源码为准。
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

现有 `play()` 位于 IIFE 内，是演示内部函数，没有导出的 SDK API。宿主封装时建议把“数据更新、重播、低性能开关、销毁”做成组件接口，沿用函数内部顺序。

1. 初始化时创建一次粒子 DOM，预加载并解码两张 WebP。
2. 打开/重播时更新金额，重置已使用状态，应用低性能标志，等待素材策略完成。
3. 正常模式添加 `.is-playing` 并禁用按钮。低性能/减少动态/图片未就绪或失败时直接走静态卡片分支。
4. 监听 **按钮自身**的 `animationend`，同时判断 `event.animationName === 'veil-in'` 和 `.is-playing` 状态；移除 `.is-playing`，添加 `.is-ready`，启用按钮。
5. Use Now 当前只隐藏动效层并显示演示 Coupon 行；接入真实业务时替换为宿主的使用优惠券流程，处理接口中的 loading、成功、失败与重复点击。

不要用固定 `setTimeout(2200)` 解锁按钮：后台暂停时会早于视觉时间线结束。
保留 `run` 序号校验，避免快速连续重播时旧的素材等待结果覆盖新播放。
SPA 卸载组件时移除 change/click/animationend/visibilitychange/media 监听，并让尚未完成的异步回调失效。

当前默认 K25，演示输入限定 1–9999 整数；数字用 `en-US` 千分位显示，超过 999 会添加 `.large-amount`。
倒计时、借款金额、费用、账户均为设计稿静态内容，没有真实倒计时逻辑或费用计算。真实金额、券资格和过期时间应由业务数据驱动，不能把演示静态字段当作接口结果。

## 6. 低性能与异常降级

| 条件 | 当前触发方式 | 表现与交互 |
| --- | --- | --- |
| 用户/宿主选择低性能 | 演示 checkbox 对应 `.low-motion` | 素材等待/超时策略完成后直接显示最终卡片；跳过入场、爆散、光线及就绪后的装饰运动；按钮可用 |
| 系统减少动态 | `matchMedia('(prefers-reduced-motion: reduce)')`，CSS 同时有媒体查询 | 同样直接静态展示；监听偏好变化后重新走播放决策 |
| 素材超过 1200ms 未全部解码 | `.asset-pending` | 用内联 SVG 兜底，静态展示且按钮可用；素材后来全部成功后替换成 WebP，不重播、不重开已使用的卡片 |
| 任意主 WebP 解码失败 | `.asset-error`，`failed = true` | 保留 SVG 兜底；当前实例后续重播仍走降级分支，源码未实现网络重试复位 |
| 页面进入后台 | `document.hidden` → `.is-paused` | 暂停所有 CSS 动画及 `:after` 动画；返回前台继续，按钮按 CSS 动画结束时机解锁 |
| 浏览器不支持图片 mask | `@supports` 未通过 | 仅不显示星星扫光，其余流程照常 |

**没有自动识别低端机的逻辑。** 接入方可基于自己已有的设备策略设置低性能标志，不要假设某个 UA、网络类型或 hardwareConcurrency 阈值已内置。

宿主设置低性能时，要同时执行静态业务分支并启用按钮；不要仅通过外部 CSS 把动画关掉，却让 JS 一直等待 `animationend`。
降级 CSS 保留在完整源码内，关闭 `.scene` 子节点及 `:after` 的 animation，并隐藏开场星星/光环。粒子默认 opacity 为 0，无动画时不会露出。
现有浏览器接口包括 `img.decode()`、`matchMedia().addEventListener()` 和 CSS 3D transform；旧 WebView 兼容性需按目标版本验证。若宿主目标不支持这些接口，应在初始化前选择静态模式或提供对应兼容处理，不能假设源码会自动捕获缺失方法。

## 7. 发布与验收

- HTML 和 SVG 用 gzip（测量 level 6）；WebP/PNG 直接传输。确保服务器响应具备正确 MIME 和 `Content-Encoding: gzip`；不要仅因 ZIP 很小就认定线上已压缩。
- 清单已包含完整演示背景素材，迁入真实页面后可只保留实际依赖，但先确认 CSS background/mask 与 SVG 兜底仍完整。
- 低端优化原则：复用已解码图片、一次创建粒子、保留有限播放次数、只对 transform/opacity 做动画；不用逐帧 JS 调布局，不新增大面积动态 blur。
- 验收正常首播/重播、1 圈累计 360°、18 个粒子、金额最大值、320/360/390px、Use Now、低性能/系统减少动态、素材失败和超过 1200ms、后台暂停、快速重播、file:// 离线。
- 最终一圈版本实测累计角度 360°，18 粒子，正常领取与两种减少动态模式通过；此前验证覆盖窄屏、暂停、慢图/坏图和离线。目标市场低端真机尚未验证。

原始文档保存在 `references/` 供追溯，其旧规格不覆盖本文件。不要把演示外围控制区、说明和体积数字作为线上产品业务文案。
