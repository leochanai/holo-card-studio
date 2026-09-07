# No.002 机械沧龙

同一网站： http://127.0.0.1:4173/?card=002 ，顶部切换 No.001 / No.002。

- card.blend：可编辑 Blender 工程，纹理已打包。
- renders/hero.png、tilt-left.png、tilt-right.png：成品静态图。
- assets/：透明主体、海底火山、线描和精确文字。
- PROMPTS.json：内置 imagegen 的完整生成与修订提示词。

验证：四层均为 1024×1536；主体 RGBA 透明约 77%。浏览器实测左右旋转、独立 MOSA 卡背及双卡切换；390px 手机端入口和画面可用，渲染控制台无错误。GLB 含三个真实网格和四种材质角色。修正了共用的 F 键翻面角度限制，R 可复位。

网页通过 GLSL 重建 Blender 全息节点材质，与离线渲染存在细节差异。
