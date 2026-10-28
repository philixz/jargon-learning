import re
import sys
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.build_pages import build

class PagesExport(unittest.TestCase):
    def test_subpath_assets_and_static_boundaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            build(root, '/jargon-learning')
            self.assertFalse((root / 'serve.py').exists())
            self.assertFalse((root / '.env').exists())
            self.assertFalse((root / '.local').exists())
            for page in root.rglob('*.html'):
                text = page.read_text(encoding='utf-8')
                self.assertIn('name="jargon-hosting" content="static"', text)
                for link in re.findall(r'(?:src|href)="([^"]+)"', text):
                    if not link.startswith('/'):
                        continue
                    self.assertTrue(link.startswith('/jargon-learning/'), link)
                    path = root / urlsplit(link).path.removeprefix('/jargon-learning/')
                    self.assertTrue(path.exists(), link)
            for script in root.rglob('*.js'):
                text = script.read_text(encoding='utf-8')
                self.assertNotRegex(text, r'''["']/jargon/''')
                for link in re.findall(r'''["'](/jargon-learning/[^"'?]+)["']''', text):
                    self.assertTrue((root / link.removeprefix('/jargon-learning/')).exists(), link)
            self.assertIn('if(staticHost)', (root / 'jargon/ai-judge.js').read_text(encoding='utf-8'))

    def test_invalid_base_rejected(self):
        with self.assertRaises(ValueError):
            build('unused', '/../../outside')
