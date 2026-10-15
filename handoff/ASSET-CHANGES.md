# 红色飘带素材说明

2026-10-16 按用户要求，将顶部奖励图左下角飘带由紫粉色改为红色。使用内置 `image_gen` 图像编辑工具，以原 `reward-v2.webp` 为编辑输入；生成透明 PNG 后仅做尺寸缩放与 WebP 编码。最终文件为仓库 `reward-motion-v2/reward-v2.webp`（交付包 `demo/reward-v2.webp`），480 × 320px，quality 85，25,356 字节。原图可从 Git 提交 `81a283a` 或原始 ZIP 取回。

卡片背景用 CSS 改为浅红到白；内联 SVG 降级图中的飘带渐变同步为 `#f58a91` → `#c82b3d`。开场 `star-v2.webp` 未修改。

本次边缘柔化通过 `.hero-art { filter: blur(.55px); }` 实现，未再次修改 WebP。滤镜为静态显示样式，接入时与素材一起保留。

## 图像编辑提示词

```text
Use case: precise-object-edit. Edit the provided transparent UI reward illustration. Change ONLY the pink-purple ribbon in the LOWER LEFT of the gold star to a rich warm red matching #E34D59 with red shadow folds and pale red/specular highlights. Preserve its exact shape, folds, position and metallic satin shading. Keep the gold star, gold coin stacks, upper-right gold ribbon, every other color, lighting, silhouette, layout, scale and 3:2 framing exactly unchanged. Do not redraw or add anything. Preserve the transparent background and clean alpha edges; do not add a background, ground plane, shadow, text or padding. Output the same entire illustration with only the lower-left ribbon recolored red.
```
