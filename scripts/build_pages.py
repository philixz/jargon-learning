"""Build only public assets for a GitHub Pages project subpath."""
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def build(destination, base):
    base = '/' + base.strip('/') if base.strip('/') else ''
    if not re.fullmatch(r'(?:/[A-Za-z0-9_-]+)*', base):
        raise ValueError('Invalid Pages base path')
    destination = Path(destination)
    for source in (ROOT / 'public').rglob('*'):
        if not source.is_file():
            continue
        target = destination / source.relative_to(ROOT / 'public')
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix in {'.html', '.js', '.css'}:
            text = source.read_text(encoding='utf-8')
            text = text.replace('/jargon/', base + '/jargon/').replace('/base.css', base + '/base.css')
            if source.suffix == '.html':
                text = text.replace('<head>', '<head><meta name="jargon-hosting" content="static">', 1)
                text = text.replace('独立本地版', '在线学习版').replace('缩放专题版 · 本地', '缩放专题版 · 在线')
                text = text.replace('AI 判答为可选服务，默认关闭；内置服务的反馈仅保存到本机。', '在线版支持速查、画布、参考要点和自评；AI 判答暂未开放，反馈请通过 GitHub Issues 提交。')
                text = text.replace('先写自己的理解，再交给 AI 指出理解到位和需要补充的地方……', '写下自己的理解，再展开参考要点核对……')
                text = text.replace('配置 AI 后，可依据公开练习题和参考要点获得辅助判答。反馈可能出错，掌握状态由你决定。', '在线版暂未连接 AI 判答。先写回答，再展开参考要点；掌握状态由你决定。')
            target.write_text(text, encoding='utf-8', newline='\n')
        else:
            target.write_bytes(source.read_bytes())
    (destination / '.nojekyll').write_text('', encoding='utf-8')
    print(f'Pages assets ready: {destination} (base={base or "/"})')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default=str(ROOT / 'dist'))
    parser.add_argument('--base-path', default='/jargon-learning')
    args = parser.parse_args()
    build(args.output, args.base_path)
