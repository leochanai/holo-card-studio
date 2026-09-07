#!/usr/bin/env python3
"""Read-only acceptance audit for published batch cards 003–010.

Run with the local site already serving, for example:
    python3 scripts/audit_batch.py --base-url http://127.0.0.1:4173
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CARD_IDS = tuple(f'{number:03d}' for number in range(3, 11))
LAYER_NAMES = ('subject', 'background', 'lineart', 'text')
RENDER_NAMES = ('hero', 'tilt-left', 'tilt-right')


def png_evidence(path: Path, require_alpha: bool = False) -> dict[str, Any]:
    evidence: dict[str, Any] = {'path': str(path.relative_to(ROOT)), 'exists': path.is_file()}
    if not path.is_file():
        return evidence
    with Image.open(path) as image:
        evidence.update(size=list(image.size), mode=image.mode)
        if 'A' in image.getbands():
            alpha = np.asarray(image.getchannel('A'))
            evidence['transparent_fraction'] = round(float((alpha == 0).mean()), 4)
            evidence['has_real_alpha'] = bool(alpha.min() < 255)
        else:
            evidence['has_real_alpha'] = False
        evidence['valid'] = image.size == (1024, 1536) and (not require_alpha or evidence['has_real_alpha'])
    return evidence


def line_evidence(path: Path) -> dict[str, Any]:
    evidence = png_evidence(path)
    if not evidence['exists']:
        return evidence
    with Image.open(path) as image:
        pixels = np.asarray(image.convert('RGB'), dtype=np.float32)
    luminance = pixels @ np.array((0.2126, 0.7152, 0.0722), dtype=np.float32)
    p1, p99 = (float(value) for value in np.percentile(luminance, (1, 99)))
    luma_min = float(luminance.min())
    dark_fraction = float((luminance < 64).mean())
    white_fraction = float((luminance > 240).mean())
    evidence.update(
        luma_min=round(luma_min, 2), luma_p1=round(p1, 2), luma_p99=round(p99, 2),
        p99_minus_min=round(p99 - luma_min, 2), dark_fraction=round(dark_fraction, 6),
        white_fraction=round(white_fraction, 6),
    )
    evidence['valid'] = evidence.get('valid', False) and 0.001 < dark_fraction < 0.15 and white_fraction > 0.75 and p99 - luma_min > 128
    return evidence


def glb_evidence(path: Path) -> dict[str, Any]:
    evidence: dict[str, Any] = {'path': str(path.relative_to(ROOT)), 'exists': path.is_file()}
    if not path.is_file():
        return evidence
    try:
        raw = path.read_bytes()
        magic, version, total_length = struct.unpack_from('<4sII', raw, 0)
        chunk_length, chunk_type = struct.unpack_from('<I4s', raw, 12)
        document = json.loads(raw[20:20 + chunk_length].decode('utf-8').rstrip(' \t\r\n\0'))
        material_names = [material.get('name', '') for material in document.get('materials', [])]
        required = {'web_front', 'web_edge', 'web_back', 'web_gold'}
        evidence.update(
            header_valid=magic == b'glTF' and version == 2 and total_length == len(raw) and chunk_type == b'JSON',
            mesh_count=len(document.get('meshes', [])), material_names=material_names,
            required_materials=sorted(required),
        )
        evidence['valid'] = evidence['header_valid'] and evidence['mesh_count'] > 0 and required.issubset(material_names)
    except (OSError, ValueError, UnicodeDecodeError, struct.error, json.JSONDecodeError) as error:
        evidence['error'] = str(error)
        evidence['valid'] = False
    return evidence


def render_evidence(path: Path) -> dict[str, Any]:
    evidence: dict[str, Any] = {'path': str(path.relative_to(ROOT)), 'exists': path.is_file()}
    if not path.is_file():
        return evidence
    with Image.open(path) as image:
        evidence.update(format=image.format, size=list(image.size), mode=image.mode, valid=image.format == 'PNG' and image.size == (1080, 1500))
    evidence['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    return evidence


def http_config(base_url: str, card_id: str, edition: str | None) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/cards/{card_id}/card-config.json"
    evidence: dict[str, Any] = {'url': url, 'expected_edition': edition}
    try:
        with urlopen(url, timeout=5) as response:
            body = response.read()
            evidence['status'] = response.status
        published = json.loads(body.decode('utf-8'))
        evidence['edition'] = published.get('edition')
        assets = {}
        for name, value in published.get('assets', {}).items():
            asset_url = f"{base_url.rstrip('/')}/{value.lstrip('./')}"
            local = ROOT / 'web' / value.lstrip('./')
            item: dict[str, Any] = {'url': asset_url, 'local_path': str(local.relative_to(ROOT)), 'local_exists': local.is_file()}
            try:
                with urlopen(asset_url, timeout=5) as asset_response:
                    asset_body = asset_response.read()
                    item['status'] = asset_response.status
                item['http_sha256'] = hashlib.sha256(asset_body).hexdigest()
                item['local_sha256'] = hashlib.sha256(local.read_bytes()).hexdigest() if local.is_file() else None
                item['valid'] = item['status'] == 200 and item['http_sha256'] == item['local_sha256']
            except (HTTPError, URLError, TimeoutError) as error:
                item.update(status=getattr(error, 'code', None), error=str(error), valid=False)
            assets[name] = item
        evidence['assets'] = assets
        evidence['valid'] = evidence['status'] == 200 and published.get('edition') == edition and bool(assets) and all(item['valid'] for item in assets.values())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        evidence.update(status=getattr(error, 'code', None), error=str(error), valid=False)
    return evidence


def config_evidence(card_root: Path, card_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    path = card_root / 'card-config.json'
    evidence: dict[str, Any] = {'path': str(path.relative_to(ROOT)), 'exists': path.is_file()}
    if not path.is_file():
        return evidence, {}
    try:
        config = json.loads(path.read_text(encoding='utf-8'))
        assets = config.get('assets', {})
        checks = {}
        for name in (*LAYER_NAMES, 'model'):
            value = assets.get(name)
            resolved = card_root / value if isinstance(value, str) and not Path(value).is_absolute() else Path(value or '')
            checks[name] = {'configured_path': value, 'exists': resolved.is_file()}
        evidence.update(edition=config.get('edition'), asset_paths=checks, valid=all(check['exists'] for check in checks.values()))
    except (OSError, json.JSONDecodeError) as error:
        evidence.update(error=str(error), valid=False)
        config = {}
    return evidence, config


def verification_evidence(path: Path) -> dict[str, Any]:
    evidence: dict[str, Any] = {'path': str(path.relative_to(ROOT)), 'exists': path.is_file()}
    if not path.is_file():
        return evidence
    try:
        document = json.loads(path.read_text(encoding='utf-8'))
        planes = document.get('planes', {})
        rotations = {name: value.get('rotation_degrees', []) for name, value in planes.items()}
        x90 = bool(rotations) and all(values and abs(abs(values[0]) - 90) < 0.01 for values in rotations.values())
        images = document.get('images', {})
        packed = bool(images) and all(bool(image.get('packed')) for image in images.values())
        evidence.update(plane_rotations=rotations, planes_x90=x90, packed_images=packed, valid=x90 and packed)
    except (OSError, json.JSONDecodeError) as error:
        evidence.update(error=str(error), valid=False)
    return evidence


def audit(card_id: str, base_url: str) -> dict[str, Any]:
    card_root, web_root = ROOT / 'cards' / card_id, ROOT / 'web' / 'cards' / card_id
    source_config, config = config_evidence(card_root, card_id)
    layers = {name: png_evidence(card_root / 'assets' / f'{name}.png', require_alpha=name in ('subject', 'text')) for name in LAYER_NAMES}
    layers['lineart'] = line_evidence(card_root / 'assets' / 'lineart.png')
    renders = {name: render_evidence(card_root / 'renders' / f'{name}.png') for name in RENDER_NAMES}
    render_hashes = [item.get('sha256') for item in renders.values()]
    views_distinct = all(render_hashes) and len(set(render_hashes)) == len(RENDER_NAMES)
    preview = ROOT / 'web' / 'previews' / f'{card_id}.png'
    preview_hash = hashlib.sha256(preview.read_bytes()).hexdigest() if preview.is_file() else None
    preview_evidence = {'path': str(preview.relative_to(ROOT)), 'exists': preview.is_file(), 'sha256': preview_hash, 'matches_hero': preview_hash == renders['hero'].get('sha256')}
    result = {
        'id': card_id, 'source_config': source_config, 'layers': layers,
        'published_config': http_config(base_url, card_id, config.get('edition')),
        'glb': glb_evidence(web_root / 'assets' / 'card.glb'),
        'renders': renders, 'render_views_distinct': views_distinct, 'preview': preview_evidence,
        'verification': verification_evidence(card_root / 'verification.json'),
    }
    checks = [source_config.get('valid'), result['published_config'].get('valid'), result['glb'].get('valid'), views_distinct, preview_evidence['matches_hero'], result['verification'].get('valid')]
    checks.extend(item.get('valid') for item in layers.values())
    checks.extend(item.get('valid') for item in renders.values())
    result['valid'] = all(checks)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description='Audit published cards 003–010 without modifying card assets.')
    parser.add_argument('--base-url', default='http://127.0.0.1:4173', help='Local server URL used for published-config HTTP checks')
    args = parser.parse_args()
    cards = [audit(card_id, args.base_url) for card_id in CARD_IDS]
    report = {'base_url': args.base_url, 'cards': cards, 'valid': all(card['valid'] for card in cards)}
    output = ROOT / 'cards' / 'batch-verification.json'
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for card in cards:
        print(f"{card['id']}: {'PASS' if card['valid'] else 'FAIL'}")
    print(f'WROTE {output}')
    raise SystemExit(0 if report['valid'] else 1)


if __name__ == '__main__':
    main()
