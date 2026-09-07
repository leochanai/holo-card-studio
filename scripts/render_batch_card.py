"""Blender render helper: CPU previews at the standard three card angles."""
import bpy
import sys
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
root = Path(args[0]).resolve() if args else Path.cwd()
scene = bpy.context.scene
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.render.resolution_percentage = 100
root.joinpath('renders').mkdir(parents=True, exist_ok=True)
scene.frame_set(25)
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'card.blend'))
for frame, name in ((25, 'hero'), (1, 'tilt-left'), (49, 'tilt-right')):
    scene.frame_set(frame)
    scene.render.filepath = str(root / 'renders' / f'{name}.png')
    bpy.ops.render.render(write_still=True)
print('BATCH_CARD_RENDER_COMPLETE', root)
