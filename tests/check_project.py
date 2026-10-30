"""Offline content, links and release-file checks. Never invokes a model."""
import json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'

def check():
 base=json.loads((PUBLIC/'jargon/glossary-data.json').read_text(encoding='utf-8'));catalog=json.loads((PUBLIC/'jargon/canvas-topics-data.json').read_text(encoding='utf-8'));exercises=json.loads((PUBLIC/'jargon/data.json').read_text(encoding='utf-8'));records=base['records']+catalog.get('supplementalRecords',[]);ids={r['id'] for r in records}
 assert len(base['records'])==base['count'] and len(ids)==len(records)
 exercise_ids={e['id'] for e in exercises};assert len(exercise_ids)==len(exercises)
 for feature in catalog['features']:
  nodes={n['id'] for n in feature['nodes']};assert len(nodes)==len(feature['nodes'])
  assert feature['question'] and feature['answer']
  for node in feature['nodes']:
   assert node['termId'] in ids
   assert not node.get('exerciseId') or node['exerciseId'] in exercise_ids
  for edge in feature['relations']:assert edge['from'] in nodes and edge['to'] in nodes and edge['from']!=edge['to']
 for file in PUBLIC.rglob('*'):
  if file.suffix not in {'.html','.js','.css'}:continue
  text=file.read_text(encoding='utf-8')
  for target in re.findall(r'''(?:src|href)=["'](/[^"'#?]+)''',text)+re.findall(r'''["'](/jargon/[^"'?]+)["']''',text):
   path=PUBLIC/target.lstrip('/');assert path.exists(),f'{file.name}: missing {target}'
  for target in re.findall(r'''(?:from\s*|import\s*)["'](\.[^"']+)["']''',text):assert (file.parent/target).resolve().is_file(),f'{file.name}: missing import {target}'
  assert '127.0.0.1:18090' not in text and '127.0.0.1:18116' not in text,f'{file.name}: leaked runtime dependency'
 for name in ['README.md','LICENSE','LICENSE_SCOPE.txt','THIRD_PARTY_NOTICES.md','CONTRIBUTING.md','.gitignore','.env.example','docs/images/glossary.png','docs/images/canvas.png']:assert (ROOT/name).is_file(),f'missing {name}'
 if (ROOT/'.git').exists():
  tracked=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
  for name in tracked:
   path=Path(name);assert not (path.name.startswith('.env') and path.name!='.env.example');assert path.suffix not in {'.key','.pem','.db','.sqlite3','.log'};assert '.local' not in path.parts
   raw=(ROOT/name).read_bytes()
   assert not re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-[A-Za-z0-9_-]{24,}',raw),f'secret-like material in {name}'
 print(f'PASS: {len(records)} records, {len(catalog["features"])+1} topics, {len(exercises)} exercises; local links and release files checked; no model calls')

if __name__=='__main__':check()
