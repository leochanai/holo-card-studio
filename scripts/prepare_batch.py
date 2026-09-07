#!/usr/bin/env python3
"""Prepare source layers, typography, metadata, and validation for batch cards."""
from __future__ import annotations

import argparse
from collections import deque
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CANVAS = (1024, 1536)
FONT = '/System/Library/Fonts/STHeiti Medium.ttc'


def load_batch() -> dict[str, dict]:
    data = [item for path in sorted((ROOT / 'cards').glob('batch-*.json')) if path.stem[6:9].isdigit() for item in json.loads(path.read_text(encoding='utf-8'))]
    return {item['id']: item for item in data}


def resize(image: Image.Image, mode: str) -> Image.Image:
    return image.convert(mode).resize(CANVAS, Image.Resampling.LANCZOS)


def white_background_alpha(image: Image.Image) -> Image.Image:
    """Remove edge white plus large enclosed white-background holes, not highlights."""
    rgb = np.asarray(image.convert('RGB'), dtype=np.int16)
    height, width = rgb.shape[:2]
    white = (rgb.min(axis=2) > 198) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 28)
    outside = np.zeros((height, width), dtype=bool)
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            if white[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
    for y in range(height):
        for x in (0, width - 1):
            if white[y, x] and not outside[y, x]:
                outside[y, x] = True
                queue.append((y, x))
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < height and 0 <= nx < width and white[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                queue.append((ny, nx))
    # A generated subject can leave a sealed pocket of its white studio backdrop
    # between limbs. Treat it as background only when its loose-white component
    # contains a substantial, nearly pure-white core; specular plate highlights
    # are smaller or have a much lower pure-white proportion.
    pure_white = (rgb.min(axis=2) >= 245) & ((rgb.max(axis=2) - rgb.min(axis=2)) <= 8)
    holes = np.zeros((height, width), dtype=bool)
    visited = outside.copy()
    for y, x in zip(*np.where(white & ~outside)):
        if visited[y, x]:
            continue
        component = []
        queue = deque([(int(y), int(x))])
        visited[y, x] = True
        pure_count = 0
        while queue:
            cy, cx = queue.popleft()
            component.append((cy, cx))
            pure_count += int(pure_white[cy, cx])
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < height and 0 <= nx < width and white[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
        if len(component) >= 600 and pure_count >= 500 and pure_count / len(component) >= 0.75:
            for cy, cx in component:
                holes[cy, cx] = True
    alpha = Image.fromarray(np.where(outside | holes, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.4))
    result = image.convert('RGBA')
    result.putalpha(alpha)
    return result


def subject_layer(source: Path) -> tuple[Image.Image, str]:
    opened = Image.open(source)
    has_real_alpha = 'A' in opened.getbands() and opened.getchannel('A').getextrema()[0] < 255
    if has_real_alpha:
        return resize(opened, 'RGBA'), 'preserved_source_alpha'
    return white_background_alpha(resize(opened, 'RGB')), 'edge_connected_white_removed'


def fit_font(draw: ImageDraw.ImageDraw, value: str, max_width: int, start: int, minimum: int) -> ImageFont.FreeTypeFont:
    for size in range(start, minimum - 1, -2):
        font = ImageFont.truetype(FONT, size)
        if draw.textbbox((0, 0), value, font=font)[2] <= max_width:
            return font
    return ImageFont.truetype(FONT, minimum)


def make_text(item: dict) -> Image.Image:
    image = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    cyan, white, accent = (142, 244, 244, 255), (229, 249, 250, 255), (255, 169, 101, 255)
    def label(x, y, value, size, color=white, anchor='la', max_width=None, minimum=34):
        font = fit_font(draw, value, max_width, size, minimum) if max_width else ImageFont.truetype(FONT, size)
        draw.text((x, y), value, font=font, fill=color, anchor=anchor, stroke_width=1, stroke_fill=(2, 12, 19, 220))

    title = f"机械{item['name']}"
    draw.rounded_rectangle((42, 42, 982, 1494), radius=24, outline=(91, 213, 225, 180), width=2)
    draw.line((70, 234, 954, 234), fill=cyan, width=2)
    label(72, 64, 'NEON GENESIS / 机械物种档案', 22, cyan)
    label(952, 61, f"No.{item['id']}", 32, accent, 'ra')
    label(68, 103, title, 86, max_width=850, minimum=42)
    label(73, 201, f"CYBERNETIC {item['en']}", 21, cyan, max_width=840, minimum=14)
    draw.line((70, 1265, 954, 1265), fill=cyan, width=2)
    label(72, 1283, item['techniqueEn'], 23, accent, max_width=840, minimum=14)
    label(69, 1324, item['technique'], 62, max_width=840, minimum=30)
    label(74, 1408, item['tagline'], 25, cyan, max_width=840, minimum=16)
    label(74, 1463, f"No.{item['id']}", 21)
    label(950, 1463, 'CYBERPUNK / HOLO', 20, cyan, 'ra')
    return image


def config(item: dict) -> dict:
    card_id = item['id']
    return {
        'title': f"机械{item['name']}", 'subtitle': f"CYBERNETIC {item['en']}",
        'technique': item['technique'], 'tagline': item['tagline'], 'edition': f"No.{card_id}",
        'collection': '霓虹纪元 · 机械物种档案', 'description': item['description'],
        'habitat': item['habitatEn'], 'backMark': item['backMark'], 'font': FONT,
        'parameters': {'subjectScale': 1.25, 'subjectDepth': 0.4, 'backgroundDepth': -0.25, 'foil': 0.65},
        'safeArea': {'scale': 1.0, 'offset': [0, -0.012]},
        'assets': {**{key: f"./assets/{key}.png" for key in ('subject', 'background', 'text', 'lineart')}, 'model': './web/assets/card.glb'},
    }


def prepare(item: dict) -> None:
    root = ROOT / 'cards' / item['id']
    assets, renders = root / 'assets', root / 'renders'
    assets.mkdir(parents=True, exist_ok=True)
    renders.mkdir(parents=True, exist_ok=True)
    required = {name: assets / name for name in ('subject-source.png', 'background.png', 'lineart.png')}
    missing = [str(path) for path in required.values() if not path.exists()]
    if missing:
        raise FileNotFoundError('Missing required input layer(s): ' + ', '.join(missing))
    source = Image.open(required['subject-source.png'])
    subject, alpha_method = subject_layer(required['subject-source.png'])
    background, lineart = resize(Image.open(required['background.png']), 'RGB'), resize(Image.open(required['lineart.png']), 'RGB')
    text = make_text(item)
    subject.save(assets / 'subject.png'); background.save(assets / 'background.png'); lineart.save(assets / 'lineart.png'); text.save(assets / 'text.png')
    check = background.convert('RGBA'); check.alpha_composite(subject); check.alpha_composite(text); check.save(renders / 'layer-check.png')
    (root / 'card-config.json').write_text(json.dumps(config(item), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    alpha = np.asarray(subject.getchannel('A'))
    report = {
        'id': item['id'], 'subject_source_size': list(source.size), 'subject_alpha_method': alpha_method,
        'subject': {'size': list(subject.size), 'mode': subject.mode, 'transparent_fraction': round(float((alpha == 0).mean()), 4), 'visible_fraction': round(float((alpha > 0).mean()), 4)},
        'background': {'size': list(background.size), 'mode': background.mode},
        'lineart': {'size': list(lineart.size), 'mode': lineart.mode},
        'text': {'size': list(text.size), 'mode': text.mode, 'transparent_fraction': round(float((np.asarray(text.getchannel('A')) == 0).mean()), 4)},
    }
    (root / 'asset-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main() -> None:
    parser = argparse.ArgumentParser(description='Prepare one or more batch card source directories.')
    parser.add_argument('ids', nargs='*', help='Card IDs, e.g. 003 004')
    parser.add_argument('--all', action='store_true', help='Prepare all entries in cards/batch-NNN-NNN.json.')
    args = parser.parse_args()
    batch = load_batch(); ids = list(batch) if args.all or not args.ids else args.ids
    unknown = [card_id for card_id in ids if card_id not in batch]
    if unknown: parser.error('Unknown card ID(s): ' + ', '.join(unknown))
    for card_id in ids:
        prepare(batch[card_id]); print(f'PREPARED {card_id}')


if __name__ == '__main__':
    main()
