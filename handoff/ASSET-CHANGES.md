# 红色飘带素材说明

2026-10-16 按用户要求，将顶部奖励图左下角飘带由紫粉色改为红色。使用内置 `image_gen` 图像编辑工具，以原 `reward-v2.webp` 为编辑输入；生成透明 PNG 后仅做尺寸缩放与 WebP 编码。最终文件为仓库 `reward-motion-v2/reward-v2.webp`（交付包 `demo/reward-v2.webp`），480 × 320px，quality 85，25,356 字节。原图可从 Git 提交 `81a283a` 或原始 ZIP 取回。

卡片背景用 CSS 改为浅红到白；内联 SVG 降级图中的飘带渐变同步为 `#f58a91` → `#c82b3d`。开场 `star-v2.webp` 未修改。

早期边缘柔化通过 `.hero-art { filter: blur(.55px); }` 实现，未再次修改 WebP。滤镜为静态显示样式，接入时与素材一起保留。

## 图像编辑提示词

```text
Use case: precise-object-edit. Edit the provided transparent UI reward illustration. Change ONLY the pink-purple ribbon in the LOWER LEFT of the gold star to a rich warm red matching #E34D59 with red shadow folds and pale red/specular highlights. Preserve its exact shape, folds, position and metallic satin shading. Keep the gold star, gold coin stacks, upper-right gold ribbon, every other color, lighting, silhouette, layout, scale and 3:2 framing exactly unchanged. Do not redraw or add anything. Preserve the transparent background and clean alpha edges; do not add a background, ground plane, shadow, text or padding. Output the same entire illustration with only the lower-left ribbon recolored red.
```

## 中心细节恢复（2026-10-16）

WebP 文件保持不变。保留 `.hero-art` 的 0.55px 静态模糊底层，新增 `.hero:after` 复用同一资源作为清晰层，使用径向遮罩从中心向外渐隐：中心 52%/52%，38% 范围内全清晰，55% 为 0.933 不透明度，85% 为透明。无需新增图片下载；增加一个静态合成层，低端真机性能仍需验收。

标准和 WebKit 遮罩均提供；无 mask 支持时保留原柔化底图，素材失败/等待时隐藏伪元素，继续使用原 SVG 兜底。不修改星星形状、金币、红色飘带、开场星星或爆散素材。
