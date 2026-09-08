"""Render gallery-only previews with every holographic contribution set to zero.

Run with Blender --background --python scripts/render_gallery_previews.py -- [IDs].
The original scenes and the home-page previews are not overwritten.
"""
import bpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ids = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ids = ids or [f'{number:03d}' for number in range(1, 21)]
output = ROOT / 'web' / 'previews' / 'gallery'
output.mkdir(parents=True, exist_ok=True)

for card_id in ids:
    source = ROOT if card_id == '001' else ROOT / 'cards' / card_id
    bpy.ops.wm.open_mainfile(filepath=str(source / 'card.blend'))
    nodes = bpy.data.materials['01 · 主体 + 背景 / 核心合成'].node_tree.nodes
    for name, socket in [('叠加 · 主体镭射', 0), ('背景轻镭射', 0),
                         ('条纹强度', 1), ('限制辉光覆盖 0.018', 1), ('闪星亮度', 1)]:
        nodes[name].inputs[socket].default_value = 0
    edge = bpy.data.materials['03 · 卡边镭射 / 材质槽2'].node_tree.nodes
    edge['卡边黑色金属'].inputs['Emission Strength'].default_value = 0
    scene = bpy.context.scene
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32
    scene.render.resolution_percentage = 100
    scene.frame_set(25)
    scene.render.filepath = str(output / f'{card_id}.png')
    bpy.ops.render.render(write_still=True)
    print('GALLERY_FOIL_ZERO', card_id, flush=True)
