# 生成记录

使用内置 imagegen，不使用 API 密钥或外部付费生图服务。所有最终素材保存在本项目 assets/。

## 主体首版
Use case: stylized-concept. Create a premium collectible card SUBJECT LAYER, portrait 1024x1536 PNG with ACTUAL TRANSPARENT BACKGROUND (alpha channel). One magnificent cyberpunk mechanical Tyrannosaurus rex, full body, three-quarter view facing right, jaw open revealing articulated titanium teeth, powerful hind legs, two small forearms, long counterbalancing tail curving to left. Sophisticated hard-surface gunmetal and brushed titanium armor, turquoise illuminated circuit seams and subtle hot-magenta edge lights, visible precision pistons and cables, realistic believable T-rex anatomy, glossy rain droplets. Cinematic detailed concept art, bold readable silhouette, dramatic overhead teal lighting. All parts of creature within x=90..940 and y=260..1260 on 1024x1536 canvas, generous transparent space at top and bottom for later typography. No ground, no foliage, no scene, no shadow plane, no text, no border, no logos, no fake checkerboard. True transparent RGBA isolated cutout.

## 主体修订
Edit target: attached mechanical T-rex subject layer. Use case background-extraction. Remove the entire painted checkerboard and return a genuine transparent PNG with alpha=0 outside the dinosaur. Not a checkerboard image, not a white background. Enable actual transparent output. Preserve the mechanical T-rex identity, pose, armor, colors and detailed contours exactly. Also fit the WHOLE dinosaur comfortably inside x=90..940, y=260..1260 on the same 1024x1536 canvas, leaving transparent margins on every side and transparent header/footer space. No text, no scenery, no ground. Actual RGBA transparency is mandatory for compositing.

两次返回均为 RGB 假透明。用户明确批准本地抠图，最终使用 prepare_assets.py 对修订版做边缘连通背景去除和轻微边缘收缩/羽化。原始修订版为 subject-source.png。

## 背景
Use case: stylized-concept. Create BACKGROUND LAYER for premium cyberpunk mechanical dinosaur holographic trading card. Portrait 1024x1536 full opaque artwork. Dense tropical rainforest at night in heavy mist, towering palms and hanging lianas, huge wet monstera leaves and lush ferns framing the left and right edges, mysterious cyan bioluminescent understory, subtle magenta reflected accent light, atmospheric volumetric moon shafts through high canopy, glossy wet jungle floor, rich dark emerald and deep midnight teal. A quiet open clearing in central 65 percent reserved for a large mechanical Tyrannosaurus to be composited later. Top 15 and bottom 15 percent dark and quiet for typography. Cinematic premium detailed digital concept painting with refined realistic materials and a sense of humid depth. No dinosaur, no animal, no people, no lettering, no borders, no buildings, no holographic rainbow overlay.

## 线描
Use case style-transfer. Edit target attached mechanical Tyrannosaurus. Make a registered outline mask: PURE WHITE background, sparse BLACK line art contours only. SAME 1024x1536 canvas, preserve EXACT position, scale, silhouette and pose pixel-for-pixel. Trace major external contours, jaws, eye, armor plate seams and leg shapes. No gray shading, no hatching, no filled black areas, no checkerboard. This image will be overlaid in exact registration with the source. Do not recompose, crop, zoom, add text or draw a new dinosaur. Single simplified thin black ink strokes on white.

## 文字
通过真实字体排版，主标题「机械霸王龙」，副标题「CYBERNETIC TYRANNOSAURUS」，编号「No.001」，主题「丛林霸主」。
