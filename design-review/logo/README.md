# 霓虹纪元 LOGO · 设计与截图迭代

2026-09-08。最终独立视觉评审 **9.1/10**，跨页面与尺寸表现 **9.2/10**。分数是依据实际页面截图的设计判断，不是客观测量。

## 定稿

- [透明 SVG](../../web/assets/brand/neon-genesis.svg)：207 字节，暖白 `#e9e8df`，机械头部、斜向骨架与开放卷尾组成一体图案。
- [统一尺寸样式](../../web/brand.css)：34 × 38 px 图标槽，与原有中文和英文品牌文字共同居中。
- 已用于首页、图鉴、详情页导航，以及图鉴页脚。原 NG 字母和详情编号标记已替换；详情页的卡片编号仍保留在原有编号位置。
- 参考图中的红框按标注区域处理，没有引入品牌配色。

## 实际截图与修改

| 轮次 | 独立评审 | 发现与响应 | 桌面 / 手机截图 |
| --- | --- | --- | --- |
| 1 | 8.71 | 机械胚芽方向与页面融合，但内圈偏密、图形偏重，易读成数字 6。 | [桌面](01-home-desktop.png) / [手机](01-home-mobile.png) |
| 2 | 8.82 | 放大内腔并转为原生矢量，清晰度提升；头部辨识与底部重量仍需调整。 | [桌面](02-home-desktop.png) / [手机](02-home-mobile.png) |
| 3 | 9.09，显示为 9.1 | 头部向右伸出、打开下颌、减轻底部并微缩整体，图文重量平衡，达到质量线。 | [桌面](03-home-desktop.png) / [手机](03-home-mobile.png) |

独立评审由只读子代理执行：只依据新一轮真实页面截图评价 LOGO，不评价既有页面其余设计，不要求评分随迭代提高。达到 9 分后停止修改图案。

最终评分：页面气质适配 9.2（30%）、小尺寸辨识 9.2（25%）、独特性与主题 8.7（20%）、图文比例与留白 9.1（15%）、跨尺寸表现 9.2（10%）。加权 9.09；单项均不低于 8.5。

## 落地检查

- [320 px 首页](final-home-320.png)：页面宽度与视口同为 320 px，无横向溢出，图标正常加载。
- [平板图鉴](final-gallery-tablet.png)、[桌面图鉴](final-gallery-desktop.png)、[图鉴页脚](final-gallery-footer.png)。
- [桌面详情](final-detail-desktop.png)、[手机详情](final-detail-mobile.png)：统一图案，001 → 002 切卡正常，无浏览器错误日志。
- [24 / 32 / 38 / 64 px 样张](final-sizes.png)：分别在档案页近黑底与详情页黑底上验证，主体和负形可辨认。
- `npm run build`、`node --check web/app.js`、`git diff --check` 均通过；构建产物包含 SVG 和品牌样式。

截图使用实际浏览器页面。捕获过程出现的视口缩放或整页拼接异常已重拍，未用于定稿评分。临时尺寸样张页面已移除。

## 图案来源与最终提示词

概念探索使用内置 imagegen，共两次调用。保留 [概念 1](concept-01.png) 和 [概念 2](concept-02.png)。生成结果分别包含黑底和棋盘格，没有真实透明通道，故未作为线上图片；页面最终文件是依轮廓手工整理、随后按截图反馈修正的原生 SVG，不依赖图片混合模式、字体、渐变或外部资源。

第二次（最后一次）imagegen 调用，以概念 1 为编辑目标，提示词如下：

> Use case: logo-brand, precise refinement of the supplied logo symbol. Keep the original single warm ivory mechanical-fossil glyph, compact vertical silhouette, angular geometric construction and restrained museum-archive style. Change only the geometry for a highly legible 32px website logo. Current version looks like a number 6: refine the upper shape into a concise right-facing prehistoric head / mechanical beak, with a clear open-jaw cut of substantial width; no tiny eye or teeth. Make the upper head less massive, roughly equal visual band thickness to the lower curled body. Simplify the lower spiral by completely removing the separate small inner U-shaped hook, leaving ONE broad open curled tail with generous empty center; retain the outer lower polygonal loop with an open upper-right mouth, avoid a closed ring. Let the diagonal neck organically connect this folded head to the body, all as one coherent continuous silhouette, no detached little pieces. Aim for mechanical life emerging, with a subtle G-like curling return; NOT literal lettering, NOT the number 6. The wordmark is separate so NO text of any kind. One symbol centered only, no variations or mockup. Solid flat #e9e8df color, truly transparent PNG background and crisp clean vector-like edges, no black backdrop, no gradient, shading, glow, texture, frame or outlines. Tight reasonable margins; no small decorative details. Fewer turns, larger openings, slightly lighter visual weight.

矢量定稿进一步延长头部、放大下颌开口、减轻底部约一成，并将图标槽高度从 42 px 调整为 38 px；最终几何以 SVG 源文件为准。
