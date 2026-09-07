#!/usr/bin/env python3
"""Run the deterministic batch card build/export/render/publish sequence."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BLENDER = Path('/Applications/Blender.app/Contents/MacOS/Blender')
PREPARE = ROOT / 'scripts' / 'prepare_batch.py'
BUILD = ROOT / 'scripts' / 'build_card.py'
EXPORT = ROOT / 'scripts' / 'export_web.py'
RENDER = ROOT / 'scripts' / 'render_batch_card.py'


def batch_ids() -> set[str]:
    return {item['id'] for item in json.loads((ROOT / 'cards' / 'batch-003-010.json').read_text(encoding='utf-8'))}


def run(command: list[str], log: Path) -> None:
    with log.open('w', encoding='utf-8') as stream:
        completed = subprocess.run(command, cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT)
    if completed.returncode:
        raise RuntimeError(f'Command failed ({completed.returncode}); see {log}')


def complete(card_id: str) -> bool:
    destination = ROOT / 'web' / 'cards' / card_id
    required = [destination / 'card-config.json', ROOT / 'web' / 'previews' / f'{card_id}.png']
    required += [destination / 'assets' / name for name in ('subject.png', 'background.png', 'lineart.png', 'text.png', 'card.glb')]
    return all(path.is_file() for path in required)


def publish(card_id: str) -> None:
    card = ROOT / 'cards' / card_id
    destination = ROOT / 'web' / 'cards' / card_id
    destination_assets = destination / 'assets'
    destination_assets.mkdir(parents=True, exist_ok=True)
    for name in ('subject.png', 'background.png', 'lineart.png', 'text.png'):
        shutil.copy2(card / 'assets' / name, destination_assets / name)
    shutil.copy2(card / 'web' / 'assets' / 'card.glb', destination_assets / 'card.glb')
    config = json.loads((card / 'card-config.json').read_text(encoding='utf-8'))
    config['assets'] = {**{name: f"./cards/{card_id}/assets/{name}.png" for name in ('subject', 'background', 'text', 'lineart')}, 'model': f"./cards/{card_id}/assets/card.glb"}
    (destination / 'card-config.json').write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    previews = ROOT / 'web' / 'previews'; previews.mkdir(parents=True, exist_ok=True)
    shutil.copy2(card / 'renders' / 'hero.png', previews / f'{card_id}.png')


def produce(card_id: str) -> None:
    card = ROOT / 'cards' / card_id
    if not BLENDER.is_file():
        raise FileNotFoundError(f'Blender not found: {BLENDER}')
    run([sys.executable, str(PREPARE), card_id], card / 'prepare.log')
    run([str(BLENDER), '--background', '--python', str(BUILD), '--', str(card), '--skip-render'], card / 'build.log')
    run([str(BLENDER), '--background', '--python', str(EXPORT), '--', str(card)], card / 'export.log')
    run([str(BLENDER), '--background', str(card / 'card.blend'), '--python', str(RENDER), '--', str(card)], card / 'render.log')
    publish(card_id)
    print(f'PRODUCED {card_id}')


def main() -> None:
    parser = argparse.ArgumentParser(description='Produce one or more batch cards, or all batch entries.')
    parser.add_argument('ids', nargs='*', help='Card IDs, e.g. 003 004')
    parser.add_argument('--all', action='store_true', help='Produce every batch card')
    parser.add_argument('--force', action='store_true', help='Rebuild cards whose published output already exists')
    args = parser.parse_args(); allowed = batch_ids(); ids = sorted(allowed) if args.all or not args.ids else args.ids
    unknown = [card_id for card_id in ids if card_id not in allowed]
    if unknown: parser.error('Unknown card ID(s): ' + ', '.join(unknown))
    for card_id in ids:
        if complete(card_id) and not args.force:
            print(f'SKIPPED {card_id}: published output already complete')
            continue
        produce(card_id)


if __name__ == '__main__':
    main()
