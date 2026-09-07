import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=bpy.context.scene
s.cycles.device='CPU'
s.cycles.samples=32
s.render.resolution_percentage=100
s.frame_set(25)
s.render.filepath=str(root/'renders/hero.png')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'card.blend'))
for frame,name in [(25,'hero'),(1,'tilt-left'),(49,'tilt-right')]:
    s.frame_set(frame)
    s.render.filepath=str(root/'renders'/f'{name}.png')
    bpy.ops.render.render(write_still=True)
