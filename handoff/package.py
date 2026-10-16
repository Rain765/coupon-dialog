"""Build and verify the frontend handoff without modifying runtime files."""
from pathlib import Path
import gzip
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reward-motion-v2'
OUTPUT = ROOT / 'output' / 'zamcash-reward-final.zip'
PREFIX = 'zamcash-reward-final/'
VERSION = 'final-2026-10-16-fast-half-turn'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    runtime = sorted(p for p in SOURCE.rglob('*')
                     if p.is_file() and p.suffix in {'.html', '.svg', '.png', '.webp'})
    payload = {'demo/' + p.relative_to(SOURCE).as_posix(): p.read_bytes() for p in runtime}
    sizes = []
    for name, data in payload.items():
        compressed = name.endswith(('.html', '.svg'))
        sizes.append({'path': name, 'sha256': sha(data), 'raw_bytes': len(data),
                      'transfer_bytes': len(gzip.compress(data, compresslevel=6, mtime=0))
                      if compressed else len(data),
                      'encoding': 'gzip-level-6' if compressed else 'identity'})
    total = sum(row['transfer_bytes'] for row in sizes)
    if total > 80000:
        raise SystemExit(f'Runtime budget exceeded: {total} bytes')
    html = payload['demo/index.html'].decode()
    if '0%{transform:rotateY(-180deg);' not in html or any(old in html for old in ('rotateY(-360deg)', 'rotateY(-1080deg)')):
        raise SystemExit('Expected the approved half-turn runtime')
    for destination, source in {
        'README.md': ROOT / 'handoff/README.md',
        'docs/FRONTEND-INTEGRATION.md': ROOT / 'handoff/FRONTEND-INTEGRATION.md',
        'docs/ZEPTO-SUI-INTEGRATION.md': ROOT / 'handoff/ZEPTO-SUI-INTEGRATION.md',
        'docs/ASSET-CHANGES.md': ROOT / 'handoff/ASSET-CHANGES.md',
        'references/original-README.txt': SOURCE / 'README.txt',
        'references/asset-prompts.txt': SOURCE / 'asset-prompts.txt',
        'references/FIGMA-SOURCE.txt': SOURCE / 'FIGMA-SOURCE.txt',
    }.items():
        payload[destination] = source.read_bytes()
    # Keep the packaged API note/examples identical to the GitHub README source.
    readme = (ROOT / 'README.md').read_text()
    integration = readme.split('## 前端接入说明\n\n', 1)[1]
    note = integration.split('\n\n', 1)[0]
    examples = readme.split('### 后端返回 JSON 示例\n', 1)[1].split('\n## 生成交付包', 1)[0]
    payload['docs/API-EXAMPLES.md'] = (
        '# 后端字段与前端调用示例\n\n' + note +
        '\n\n### 后端返回 JSON 示例\n' + examples.rstrip() + '\n'
    ).encode()
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT, text=True).strip())
    manifest = {
        'version': VERSION, 'source_commit': commit, 'source_dirty': dirty,
        'runtime_transfer_bytes': total, 'runtime_budget_bytes': 80000,
        'budget_headroom_bytes': 80000 - total,
        'measurement': 'HTML/SVG gzip level 6; PNG/WebP identity; excludes HTTP headers, docs and ZIP overhead',
        'motion': {'axis': 'Y', 'turns': 0.5, 'degrees': 180, 'burst_particles': 12,
                   'rotation_ms': {'delay': 600, 'duration': 600},
                   'growth_ms': {'delay': 600, 'duration': 1400}, 'interactive_at_ms': 2200},
        'runtime_files': sizes,
        'other_files': [{'path': name, 'sha256': sha(data), 'raw_bytes': len(data)}
                        for name, data in payload.items() if not name.startswith('demo/')],
    }
    payload['asset-manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    payload['SHA256SUMS.txt'] = ''.join(f'{sha(data)}  {name}\n' for name, data in sorted(payload.items())).encode()
    OUTPUT.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(PREFIX + name, data)
    with zipfile.ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None
        assert set(archive.namelist()) == {PREFIX + name for name in payload}
        for name, data in payload.items():
            assert archive.read(PREFIX + name) == data, name
        for line in payload['SHA256SUMS.txt'].decode().splitlines():
            digest, name = line.split('  ', 1)
            assert sha(archive.read(PREFIX + name)) == digest, name
    print(json.dumps({'archive': str(OUTPUT), 'archive_bytes': OUTPUT.stat().st_size,
                      'runtime_bytes': total, 'source_commit': commit,
                      'source_dirty': dirty, 'files_verified': len(payload)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
