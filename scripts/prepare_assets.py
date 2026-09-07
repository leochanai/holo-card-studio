from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

root = Path(__file__).resolve().parents[1]
im = Image.open(root/'assets/subject-source.png').convert('RGB')
a = np.array(im).astype(np.int16)
h, w = a.shape[:2]
candidate = (a.min(2) > 198) & (a.max(2)-a.min(2) < 28)
outside = np.zeros((h,w), dtype=bool)
q = deque([(0,0)])
outside[0,0] = True
while q:
    y,x = q.popleft()
    for ny,nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
        if 0 <= ny < h and 0 <= nx < w and candidate[ny,nx] and not outside[ny,nx]:
            outside[ny,nx] = True
            q.append((ny,nx))
alpha = Image.fromarray(np.uint8(~outside)*255).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.4))
subject = im.convert('RGBA')
subject.putalpha(alpha)
subject.save(root/'assets/subject.png')
preview = Image.open(root/'assets/background.png').convert('RGBA')
preview.alpha_composite(subject)
preview.save(root/'renders/layer-check.png')
cfg = {
 'title':'机械霸王龙', 'subtitle':'CYBERNETIC TYRANNOSAURUS',
 'technique':'丛林霸主', 'tagline':'钢铁觉醒 · 雨林回响', 'edition':'No.001',
 'collection':'霓虹纪元 · 机械物种档案',
 'description':'雨雾穿过装甲，霓虹沿脊骨亮起。远古的力量，以机械之躯重返热带雨林。',
 'font':'/System/Library/Fonts/STHeiti Medium.ttc',
 'parameters':{'subjectScale':1.25,'subjectDepth':.4,'backgroundDepth':-.25,'foil':.65},
 'safeArea':{'scale':1.0,'offset':[0,-.012]},
 'assets':{k:'./assets/'+k+'.png' for k in ('subject','background','text','lineart')}
}
cfg['assets']['model']='./assets/card.glb'
(root/'card-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
text = Image.new('RGBA',(w,h),(0,0,0,0))
d = ImageDraw.Draw(text)
font='/System/Library/Fonts/STHeiti Medium.ttc'
cyan=(142,244,244,255); white=(229,249,250,255); pink=(249,126,201,255)
def label(x,y,s,size,color=white,anchor='la'):
    d.text((x,y),s,font=ImageFont.truetype(font,size),fill=color,anchor=anchor,stroke_width=1,stroke_fill=(2,12,19,220))
d.rounded_rectangle((42,42,982,1494),radius=24,outline=(91,213,225,180),width=2)
d.line((70,234,954,234),fill=cyan,width=2)
label(72,64,'NEON GENESIS / 机械物种档案',22,cyan)
label(952,61,'No.001',32,pink,'ra')
label(68,103,'机械霸王龙',86)
label(73,201,'CYBERNETIC TYRANNOSAURUS',21,cyan)
d.line((70,1265,954,1265),fill=cyan,width=2)
label(72,1283,'APEX PREDATOR',23,pink)
label(69,1324,'丛林霸主',62)
label(74,1408,'钢铁觉醒 · 雨林回响',25,cyan)
label(74,1463,'No.001',21)
label(950,1463,'CYBERPUNK / HOLO',20,cyan,'ra')
text.save(root/'assets/text.png')
print('Real alpha fraction:',float(outside.mean()))
