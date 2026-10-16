# Zepto + SUI Mobile 项目接入清单

交付版本：`final-2026-10-16-countdown-20`。保留 Y 轴 半圈（180°）动效；倒计时移回标题下方，券线框采用内联 SVG，分隔虚线采用 CSS 边框。
精确时间线、缓动和完整 API 见 [FRONTEND-INTEGRATION.md](FRONTEND-INTEGRATION.md)。

## 1. 已确认与待联调范围

以下来自测试站已下发的 HTML、JavaScript 和 CSS；未取得后台仓库，不能据此确认全部服务端框架或接口实现。

| 项目 | 已观察到的实现 | 接入影响 |
| --- | --- | --- |
| DOM / 请求 | Zepto 1.1.6，加载 event / ajax / form 等模块 | 复用现有 Zepto，不新增 jQuery；不能假设 Ajax 返回原生 Promise |
| UI | SUI Mobile 0.6.2；已查看页面配置 `$.config.router = false`，通过 `$.init()` 初始化 | 按现有页面生命周期挂载，不为动效重复调用全局 `$.init()`；其他入口配置仍需核对 |
| 页面结构 | `.page-group`、`.page`、`.content` | 优惠券使用独立根节点，避免混入 SUI 的 `.modal` / `.popup` 动画 |
| 尺寸 | 根字号按 `clientWidth / 19` 设置；`.content` 居中且带 transform | 不覆盖全局 rem、resize 处理；遮罩放在 body 下，避开带 transform 的内容容器 |
| 接口返回习惯 | 已查看代码使用 `res.code`、`res.msg`、`res.data`、`res.url` | 可在适配层统一处理；新召回券接口的 URL、字段名及返回码仍待后端确认 |
| 服务端 | 响应头出现 Kestrel | 仅为服务端线索，不作为已确认的 MVC / Razor 版本结论 |

已查看个人中心、`/Order/Repayment` 和 `/Coupon/`。当前测试账号有未结清借款，优惠券列表为空；尚未验证符合召回资格的账号、真实新借款申请页和券绑定链路。未提交申请、还款或兑换操作。

**适用入口由产品和业务端确定：** 在登录且后端确认可展示召回券的入口触发；不能因为访问还款页就默认满足召回条件。实际新借款申请地址由现有项目提供。

## 2. 前端需要适配的内容

| 事项 | 前端工作 | 验收要求 |
| --- | --- | --- |
| 关闭模拟数据 | 在组件脚本之前设置 `window.REWARD_COUPON_CONFIG = null`；真实接口成功后调用 `show()` | 无接口数据、异常或无资格时不出现模拟券 |
| 拆出演示页面 | 保留动效 DOM / SVG / 状态样式；解耦 `#amount`、`#low-motion`、`#replay`、`#loan-page`、`#applied-coupon` 等演示依赖 | 不能只删除演示 HTML：原脚本仍访问这些节点；改为宿主配置、真实背景及触发元素 |
| 根节点与样式 | 将组件挂到 body 下；使用独立类名、ID、keyframe 前缀，根节点内查询；保留无障碍 announcement 和焦点恢复 | 不覆盖 SUI `.card`、`.modal`、`.popup`、button/input 或全站样式；关闭后焦点回到宿主触发位置 |
| 层级与滚动 | 与现有 `#global-popup-mask`、SUI 遮罩和提示层协调 z-index、背景滚动锁定及恢复 | 不叠加两个可操作弹窗；关闭后页面仍可滚动，无残留遮罩 |
| 尺寸与旋转 | 组件内部沿用已确认坐标体系或整体等比适配；保留缩放层与旋转层分离 | 不修改全局字号；320/360/390px 正常；不被 SUI 的 transform 规则覆盖；累计 180° |
| 字段映射 | 将后端响应映射为第 3 节的 6 个字段后交给 `show()` | 不在浏览器计算授信档位、发券条件或自然日截止时间；不以默认金额掩盖缺失字段 |
| 申请按钮 | `onApply` 返回覆盖真实异步流程的 Promise；传入券 ID；成功交接到申请流程后 resolve，失败 reject | 连点仅一笔请求；失败可恢复按钮；点击不代表已绑定或已抵扣 |
| 错误提示 | 使用现有项目提示组件处理 `couponapplyerror`，只展示安全的业务提示 | 不向用户直接输出请求对象、堆栈；登录失效走宿主登录流程 |
| 生命周期 | 页面卸载时清理；返回页面 / 长时间后台恢复后重新取得券状态和服务端时间 | 防止旧响应重开券、重复监听和计时；`destroy()` 后不能复用同一实例，需重新初始化组件 |
| 发布 | 更新 img、preload、CSS mask/background 的资源路径；HTML/SVG 开 gzip | 合并后重新测量实际发送资源；参考演示总量 77,621 字节，低于 80,000 字节 |

当前脚本 IIFE 内的 `$` 只是本地 `getElementById` 帮助函数，不覆盖 `window.$`。拆分时保持作用域，避免与 Zepto 混用。当前项目按整页加载接入即可；若后续启用 SUI 路由，应接到项目的页面挂载/卸载事件，不能只依赖首次 `DOMContentLoaded`。

## 3. 后端需要提供的字段

下面是**组件输入契约，不是已经存在的线上接口字段**。后端可以沿用自己的命名，由前端适配层映射。接口 URL、鉴权及错误码需联调确认。

| 组件字段 | 必填 / 类型 | 后端职责与映射要求 |
| --- | --- | --- |
| `id` | 必填，非空 string | 真实优惠券标识，用于后续校验和绑定；不能用活动 ID 替代；数值 ID 如需转字符串，先验证其存在和精度 |
| `amount` | 必填，integer，1–9999 | 已发放的优惠金额，单位为 K；当前规则举例 K25 / K50 / K100。若接口以分为单位，必须明确转换规则；当前组件不支持小数金额 |
| `eligible` | 必填，boolean | 只有严格 `true` 才展示；服务端判断召回人群、活动有效性、借款状态、发券及展示频控条件 |
| `status` | 必填，string | 映射为 `available` 才可展示；已绑定、已使用、过期、撤销等状态不得映射为 available |
| `expiresAt` | 必填，UTC Unix 毫秒整数 | 此券用于申请新借款的截止时刻；由后端按赞比亚业务时区 `Africa/Lusaka` 及 6 个自然日规则计算 |
| `serverNow` | 必填，UTC Unix 毫秒整数 | 本次响应的服务端当前时间；每次请求刷新，不复用缓存旧时间；注意秒级时间戳不能直接传入 |

`expiresAt` 和 `serverNow` 必须是正的安全整数，`expiresAt` 不超过 `8640000000000000`。缺失、错误、不可用或已到期均不展示，不能回退为演示券。

后端还需与前端确认以下业务契约（这些不是组件当前新增的参数）：

- **截止口径：** 发放日是否计入第 1 天、截止日具体时刻，以明确时间戳返回。这里是「6 天内申请，还款时抵扣」，不是要求 6 天内还款。
- **金额档位：** 原规则在 K450、K950 处存在区间重叠，后端须确认边界包含关系并直接返回最终金额。
- **展示频控：** 券已展示、被关闭后何时可再次展示，是否需要曝光上报及幂等标识；组件本身没有跨页面频控。
- **申请交接：** 真实申请入口、券 ID 如何携带、资格重验接口与失败返回码；不得只把 ID 放在页面上而未进入订单处理。
- **绑定与抵扣：** 申请时由服务端重验资格、期限、券状态并完成幂等绑定；还款时按订单与券规则计算抵扣。点击弹窗按钮不消耗券，也不在前端直接修改账单。
- **状态同步：** 申请成功、绑定、使用、撤销后返回最新状态；并发请求不能重复用券；网络超时后先查状态，避免盲目重试创建申请。

前端传入的 `lowPerformance` 和 `onApply` 位于 `show()` 第二个参数，分别是设备策略和申请回调，**不是后端必填券字段**。

## 4. Zepto 请求适配示例

下面仅示意适配方式：`api.couponEligibility` 和 `host.startLoanApplication` 必须替换为项目确认的实现，示例没有创建新接口。当前已检查的 Zepto 构建未发现 Deferred 模块，不要直接 `await $.post(...)` 后认为请求已经完成。

```js
// 必须放在动效脚本之前。
window.REWARD_COUPON_CONFIG = null;

// 复用现有 Zepto；此例约定成功码为 0，需与实际券接口核对。
function getCouponData(url) {
  return new Promise(function (resolve, reject) {
    window.Zepto.ajax({
      url: url,
      type: 'GET', // 仅用于读券；实际方法按后端契约调整
      dataType: 'json',
      timeout: 10000,
      success: function (res) {
        if (!res || res.code !== 0 || !res.data) {
          reject(new Error('Coupon data unavailable'));
          return;
        }
        resolve(res.data);
      },
      error: function () { reject(new Error('Coupon request failed')); }
    });
  });
}

// 在宿主页面及已完成 DOM 解耦的组件初始化后调用。
// api、host、devicePolicy 都是接入方提供的对象。
function showRecallCoupon(api, host, devicePolicy) {
  return getCouponData(api.couponEligibility).then(function (data) {
    // 此例假设服务端已按上述字段契约返回；否则先明确映射类型和单位。
    return window.RewardCoupon.show({
      id: data.id,
      amount: data.amount,
      eligible: data.eligible,
      status: data.status,
      expiresAt: data.expiresAt,
      serverNow: data.serverNow
    }, {
      lowPerformance: devicePolicy.reduceMotion === true,
      onApply: function (coupon) {
        // 必须返回完成重验/申请交接的原生 Promise，不能返回 Zepto XHR。
        return host.startLoanApplication({ couponId: coupon.id });
      }
    });
  }).catch(function () {
    // 初次读券失败不展示；宿主另外处理登录失效、日志和请求重试。
    return false;
  });
}
```

实际项目需为读券请求加页面生命周期/请求序号保护；页面离开或新请求替代后忽略旧响应。组件内部的播放序号不能替代宿主网络请求的时序管理。写入业务接口继续使用项目现有鉴权与 CSRF 处理，不把账户或令牌写入静态交付包。

已观察到的 `/Coupon/ExchangeCoupon` 用于兑换码；还款页的 `collectionDiscount` 属于延期还款方案，`/OrderExt/ApplyExtentionV2` 等属于延期流程。**这些均未被确认能用于召回券，不复用为本活动的数据或申请接口。**

## 5. 低性能与旧 WebView 处理

- 支持当前脚本的设备：宿主传 `lowPerformance: true`，直接显示最终卡片；系统减少动态同样走静态分支。不要只关 CSS 动画而让按钮继续等待 `animationend`。
- 素材失败或超过 1200ms：现有实现静态展示内联 SVG 兜底；券有效且配置 `onApply` 时允许操作。金额、倒计时和到期校验继续保留。
- **静态模式不等于旧浏览器语法兼容。** 原脚本使用 async/await、Promise、const/let 等；旧 WebView 若不能解析，设置低性能标志也无法启动。前端应按目标版本转译并补齐必要能力，或在加载该脚本前选择独立的兼容静态实现。
- 还需检查 `img.decode()`、`matchMedia().addEventListener()`、`CustomEvent`、数字校验/字符串补零方法与 CSS 3D。缺少图片解码或媒体监听方法需加特性检测和兼容分支；现有源码不能保证自动处理所有缺失方法。
- 动画降级不能放宽业务规则；静态版本同样读取真实券、校验截止时刻、防重复操作，并以服务端最终校验为准。

## 6. 联调完成标准

前端验收：样式与 SUI 无冲突；不同宽度及横竖屏不裁切；正常半圈 / 低性能 / 减少动态 / 慢图坏图均可操作；返回、后台恢复、重复初始化和接口失败不残留遮罩；前台 2.2 秒后按动画结束事件解锁按钮。

后端联调：用有资格且券可用、无资格、无券、过期、绑定、已用、撤销账号分别验证；覆盖申请中到期、重复点击、跨设备使用、网络超时、登录失效；确认 6 个自然日边界、金额档位及还款实际抵扣结果。

已完成的是原生参考实现的浏览器验证和本接入清单；Zepto/SUI 业务页面的实际改造、真实券接口及低端真机验收仍由项目联调完成。
