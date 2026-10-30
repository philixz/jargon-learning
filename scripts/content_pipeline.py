"""Offline editorial pipeline. No model calls, Git pushes or deployment.

Raw source snapshots and incremental state live under ignored .local/.
An imported row can suggest a match; it can never approve a term.
"""
import argparse
import copy
import csv
import difflib
import hashlib
import json
import re
import subprocess
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(data, encoding='utf-8', newline='\n')
    temporary.replace(path)

def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()

def normalize(text):
    return re.sub(r'[\s\-_/（）()：:·]+', '', unicodedata.normalize('NFKC', text).casefold())

def compact_caption(text):
    result, width = '', 0
    for char in text:
        size = 2 if ord(char) > 255 else 1
        if width + size > 24:
            return result + '…'
        result += char
        width += size
    return result

def parse_snapshot(snapshot):
    """Validate a complete lark-cli cells-get result; use physical coordinates."""
    if snapshot.get('ok') is False:
        raise ValueError('来源读取失败，不能视为完整导入')
    data = snapshot.get('data', snapshot)
    if data.get('schema') == 'jargon.source/v1':
        if data.get('complete') is not True or not isinstance(data.get('records'), list):
            raise ValueError('标准快照必须明确 complete=true 并包含 records')
        result, locators = [], set()
        for item in data['records']:
            if not all(isinstance(item.get(k), str) and item[k].strip() for k in ['locator', 'term', 'definition', 'plain']):
                raise ValueError('标准来源缺稳定定位或文本字段')
            if item['locator'] in locators:
                raise ValueError('来源定位重复')
            locators.add(item['locator'])
            row = {k: item[k].strip() for k in ['locator', 'term', 'definition', 'plain']}
            row['hash'] = fingerprint({k: row[k] for k in ['term', 'definition', 'plain']})
            result.append(row)
        return result, data.get('revision'), data.get('range', 'normalized-records')
    if data.get('has_more') is not False or len(data.get('ranges', [])) != 1:
        raise ValueError('必须提供明确无截断的单个完整范围')
    area = data['ranges'][0]
    match = re.fullmatch(r'A1:([A-Z]+)(\d+)', area.get('actual_range', ''))
    if not match or area.get('truncated'):
        raise ValueError('范围必须从 A1 开始且未截断')
    rows, indices, columns = area.get('cells', []), area.get('row_indices', []), area.get('col_indices', [])
    if indices != list(range(1, int(match[2]) + 1)) or len(rows) != len(indices):
        raise ValueError('行号存在缺口；不接受过滤或缺页的快照')
    if columns[:3] != ['A', 'B', 'C']:
        raise ValueError('缺少名词、专业定义、通俗解释三列')
    header = {col: str(cell.get('value', '')).strip() for col, cell in zip(columns, rows[0])}
    if [header.get(c) for c in 'ABC'] != ['名词', '专业定义', '通俗解释']:
        raise ValueError('表头不匹配，请先适配来源，不猜测列含义')
    result = []
    for number, cells in zip(indices[1:], rows[1:]):
        if len(cells) != len(columns):
            raise ValueError(f'第 {number} 行列数不完整')
        values = {col: str(cell.get('value', '')).strip() for col, cell in zip(columns, cells)}
        if not any(values.get(c) for c in 'ABC'):
            continue
        if not values['A']:
            raise ValueError(f'第 {number} 行有解释但缺名称')
        row = dict(locator=f'row:{number}', row=number, term=values['A'], definition=values['B'], plain=values['C'])
        row['hash'] = fingerprint({key: row[key] for key in ['term', 'definition', 'plain']})
        result.append(row)
    return result, data.get('revision'), area['actual_range']

def matching_index(terms):
    index = defaultdict(set)
    for term in terms:
        for name in [term['term'], *term.get('aliases', [])]:
            index[normalize(name)].add(term['id'])
    return index

def assess(rows, terms, decisions=None):
    index = matching_index(terms)
    decisions = decisions or {}
    seen = defaultdict(list)
    for row in rows:
        seen[normalize(row['term'])].append(row['locator'])
    result = []
    for row in rows:
        key = normalize(row['term'])
        exact = sorted(index.get(key, []))
        flags = []
        if re.search(r'<\|.*?\|>|因.*(?:只能|要求|提取)|任选|答案最终|这里.*(?:选择|选取)', row['term']):
            flags.append('名称含生成指令，排除原行；必要时单独重建正确概念')
        if not row['definition'] or not row['plain']:
            flags.append('解释字段不完整')
        if re.search(r'<\|.*?\|>|文档中未|给定.*(?:岗位|信息)|在岗位[一二三四五六七八九十]', row['definition'] + row['plain']):
            flags.append('解释含岗位或生成上下文，需重写')
        if re.search(r'保证|彻底解决|完全消除|百分之百|一定正确', row['definition'] + row['plain']):
            flags.append('绝对化结论，待核查')
        fuzzy = []
        if not exact:
            names = difflib.get_close_matches(key, index, n=3, cutoff=.72)
            fuzzy = sorted({identity for name in names for identity in index[name]})
        decision = decisions.get(row['locator'])
        if decision and decision.get('row_hash') != row['hash']:
            decision = None
            flags.append('来源已变化，旧人工决定失效，需重审')
        disposition = ('excluded' if flags and '名称含' in flags[0] else
                       'context_review' if len(exact) > 1 else
                       'existing_supplement' if exact else 'new_candidate')
        if '绝对化结论，待核查' in flags:
            disposition = 'possible_conflict'
        result.append({**row, 'candidates': exact, 'similar_candidates': fuzzy,
                       'disposition': decision['disposition'] if decision else disposition,
                       'decision': decision, 'flags': flags,
                       'same_source_locations': seen[key], 'status': 'needs_review' if not decision else 'reviewed'})
    return result

def ingest(source, snapshot, terms, state_path, report_path, decisions=None):
    """Partial/unavailable snapshots leave the last good state untouched."""
    previous = read(state_path) if Path(state_path).exists() else {'rows': {}, 'source_id': source['id']}
    if previous.get('source_id') != source['id']:
        raise ValueError('增量状态属于另一来源')
    rows, revision, actual_range = parse_snapshot(snapshot)
    old = previous['rows']
    current = {r['locator']: r for r in rows}
    delta = {'added': [], 'changed': [], 'unchanged': [], 'removed': []}
    for locator, row in current.items():
        kind = 'added' if locator not in old else 'unchanged' if old[locator]['hash'] == row['hash'] else 'changed'
        delta[kind].append(locator)
    delta['removed'] = sorted(set(old) - set(current))
    assessed = assess(rows, terms, decisions)
    report = {'source_id': source['id'], 'revision': revision, 'actual_range': actual_range,
              'read_at': datetime.now(timezone(timedelta(hours=8))).isoformat(),
              'complete': True, 'row_count': len(rows), 'unique_names': len({normalize(r['term']) for r in rows}),
              'delta': delta, 'counts': dict(Counter(r['disposition'] for r in assessed)), 'rows': assessed,
              'warning': '候选及相似度不是事实裁决；移除行不删除规范词条；行插入可能引起位置变化，需复核。'}
    changed_state = {'source_id': source['id'], 'revision': revision, 'snapshot_hash': fingerprint(snapshot),
                     'rows': current, 'missing_rows': {**previous.get('missing_rows', {}),
                                                       **{k: old[k] for k in delta['removed']}}}
    for key in current:
        changed_state['missing_rows'].pop(key, None)
    if changed_state != previous:
        write(state_path, changed_state)
    write(report_path, report)
    with Path(report_path).with_suffix('.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['来源位置', '名称', '候选处理', '精确候选ID', '相似候选ID', '问题提示', '审核状态'])
        for row in assessed:
            name = row['term']
            if name.startswith(('=', '+', '-', '@')):
                name = "'" + name
            writer.writerow([row['locator'], name, row['disposition'], ','.join(row['candidates']),
                             ','.join(row['similar_candidates']), '；'.join(row['flags']), row['status']])
    return report

def approved(term, sources):
    review = term.get('review', {})
    evidence = review.get('evidence', [])
    return (review.get('status') == 'approved' and review.get('rights') == 'original-synthesis'
            and bool(review.get('note')) and bool(evidence)
            and all(ref in sources and sources[ref].get('public_reference') for ref in evidence)
            and all(term.get(key) for key in ['definition', 'plain', 'example', 'counter', 'context']))

def validate_terms(terms):
    ids = [t['id'] for t in terms]
    if len(set(ids)) != len(ids) or any(not re.fullmatch(r'term-[a-f0-9]{12}', i) for i in ids):
        raise ValueError('词条编号非法或重复')
    for term in terms:
        if not all(term.get(k) for k in ['term', 'collection', 'topic']):
            raise ValueError('词条缺名称或分类')
        baseline = term.get('baseline')
        if baseline and baseline['id'] != term['id']:
            raise ValueError('不得替换已发布词条编号')
        if term.get('review', {}).get('status') not in {'legacy', 'pending', 'conflict', 'approved'}:
            raise ValueError('未知词条审核状态')

def render_terms(terms, sources):
    validate_terms(terms)
    records, blocked = [], []
    for term in terms:
        if approved(term, sources):
            record = {k: term[k] for k in ['id', 'term', 'collection', 'topic']}
            record.update(meaning=term['definition'], plain=term['plain'], example=term['example'],
                          counter=term['counter'], aliases=term.get('aliases', []), context=term['context'],
                          reviewStatus='reviewed', references=term['review']['evidence'])
            if term.get('baseline'):
                for key in ['source_file', 'source_line']:
                    if key in term['baseline']:
                        record[key] = term['baseline'][key]
            records.append(record)
        else:
            if term.get('baseline'):
                record = copy.deepcopy(term['baseline'])
                record['reviewStatus'] = 'legacy-preserved'
                records.append(record)
            if term.get('review', {}).get('status') != 'legacy':
                blocked.append(term['id'])
    return records, blocked

def make_catalog(editorial, records, terms, sources):
    catalog = copy.deepcopy(editorial)
    by_id = {r['id']: r for r in records}
    canonical = {t['id']: t for t in terms}
    catalog['count'] = len(records)
    catalog['supplementalRecords'] = []
    grouping = defaultdict(list)
    for record in records:
        grouping[(record['collection'], record['topic'])].append(record['id'])
    existing = {(t['collection'], t['title']): t for t in catalog['topics']}
    catalog['topics'] = []
    for (collection, title), ids in grouping.items():
        group = copy.deepcopy(existing.get((collection, title), {
            'id': 'topic-' + fingerprint([collection, title])[:10], 'collection': collection, 'title': title}))
        group['termIds'] = ids
        catalog['topics'].append(group)
    features, blocked = [], []
    for feature in catalog['features']:
        if feature.get('review', {}).get('status') not in {'approved', 'legacy'}:
            blocked.append(feature['id'])
            continue
        nodes = feature['nodes']
        ids = {n['id'] for n in nodes}
        if not all(isinstance(feature.get(k), (int, float)) and feature[k] > 0 for k in ['width', 'height']):
            raise ValueError('专题缺有效画布尺寸')
        if not isinstance(feature.get('coreRelations'), list) or not set(feature['coreRelations']).issubset({e['id'] for e in feature['relations']}):
            raise ValueError('专题核心关系配置无效')
        if len(ids) != len(nodes) or any(n['termId'] not in by_id for n in nodes):
            raise ValueError('专题节点重复或引用不存在的词条')
        if any(identity not in by_id for identity in feature.get('supportingTerms', [])):
            raise ValueError('专题延伸词条引用不存在')
        if feature['review']['status'] == 'approved':
            group_ids = {g['id'] for g in feature['groups']}
            if len(group_ids) != len(feature['groups']) or any(n['group'] not in group_ids for n in nodes):
                raise ValueError('专题节点的分组无效')
            if len(feature['groups']) > 3 or any(sum(n['group'] == g['id'] for n in nodes) > 3 for g in feature['groups']):
                raise ValueError('专题超过三组或每组三节点')
            if not all(feature.get(k) for k in ['case', 'question', 'answer']):
                raise ValueError('专题缺案例或复习题')
            for node in nodes:
                term = canonical[node['termId']]
                if not approved(term, sources):
                    raise ValueError('新专题不能引用未校对词条')
                for key in ['plain', 'example', 'counter']:
                    if node.get(key) != term[key]:
                        raise ValueError('专题与规范词条解释不同步')
            for edge in feature['relations']:
                if edge.get('reviewStatus') != 'reviewed' or not edge.get('explanation') or not edge.get('references'):
                    raise ValueError('专题关系缺复核说明或依据')
                if any(ref not in sources or not sources[ref].get('public_reference') for ref in edge['references']):
                    raise ValueError('专题关系引用未确认来源')
        for edge in feature['relations']:
            if edge['from'] not in ids or edge['to'] not in ids or edge['from'] == edge['to']:
                raise ValueError('关系端点无效')
            if edge['kind'] not in {'concept', 'contrast', 'learning', 'part', 'cooperate', 'scope'}:
                raise ValueError('未知关系类型')
        features.append(feature)
    catalog['features'] = features
    return catalog, blocked

def compile_content(root=ROOT):
    content = root / 'content'
    terms = read(content / 'terms.json')['terms']
    provenance = read(content / 'provenance.json')
    term_ids = {t['id'] for t in terms}
    if not set(provenance['baseline_ids']).issubset(term_ids):
        raise ValueError('规范库移除了已发布词条，必须先提供兼容方案')
    originals = [next(t['baseline'] for t in terms if t['id'] == identity) for identity in provenance['baseline_ids']]
    if fingerprint(originals) != provenance['baseline_records_hash']:
        raise ValueError('存量回退快照被修改；修订应写入规范解释，不能改历史基线')
    source_rows = read(content / 'sources.json')['sources']
    sources = {s['id']: s for s in source_rows}
    if len(sources) != len(source_rows):
        raise ValueError('来源 ID 重复')
    records, blocked = render_terms(terms, sources)
    catalog, blocked_topics = make_catalog(read(content / 'topics.json'), records, terms, sources)
    exercises = read(root / 'public/jargon/data.json')
    if not set(provenance['exercise_ids']).issubset({e['id'] for e in exercises}):
        raise ValueError('旧练习丢失')
    feature_nodes = {f['id']: {n['id'] for n in f['nodes']} for f in catalog['features']}
    for identity, nodes in provenance['feature_nodes'].items():
        if identity not in feature_nodes or not set(nodes).issubset(feature_nodes[identity]):
            raise ValueError('旧专题或节点编号丢失，旧深链接将失效')
    baseline = {t['id'] for t in terms if t.get('baseline')}
    if not baseline.issubset({r['id'] for r in records}):
        raise ValueError('已发布词条丢失')
    record_ids = {r['id'] for r in records}
    exercise_ids = {e['id'] for e in exercises}
    for feature in catalog['features']:
        for node in feature['nodes']:
            if node.get('exerciseId') and node['exerciseId'] not in exercise_ids:
                raise ValueError('练习引用无效')
    core = read(root / 'public/jargon/canvas-v2-data.json')
    if any(n['termId'] not in record_ids for n in core['nodes']):
        raise ValueError('旧专题引用失效')
    counts = dict(Counter(r['collection'] for r in records))
    glossary = {'version': 2, 'count': len(records), 'counts': counts,
                'attribution': read(content / 'provenance.json')['attribution'], 'records': records}
    manifest = {'version': 1, 'records': len(records), 'topics': len(catalog['features']) + 1,
                'exercises': len(exercises), 'collections': counts,
                'reviewed': sum(r['reviewStatus'] == 'reviewed' for r in records),
                'legacyPreserved': sum(r['reviewStatus'] == 'legacy-preserved' for r in records),
                'blockedTerms': blocked, 'blockedTopics': blocked_topics,
                'references': [{k: s[k] for k in ['id', 'title', 'url']} for s in sources.values() if s.get('public_reference')]}
    return glossary, catalog, manifest

def sync_labels(text, manifest, html=False):
    n, topics, exercises = manifest['records'], manifest['topics'], manifest['exercises']
    text = re.sub(r'\d+ 条术语', f'{n} 条术语', text)
    text = re.sub(r'\d+ 条产品经理与 AI 术语', f'{n} 条产品经理与 AI 术语', text)
    text = re.sub(r'全部术语 · \d+', f'全部术语 · {n}', text)
    text = re.sub(r'全部词表 · \d+', f'全部词表 · {n}', text)
    text = re.sub(r'\d+ 条速查', f'{n} 条速查', text)
    text = re.sub(r'\d+ 个串讲专题', f'{topics} 个串讲专题', text)
    text = re.sub(r'\d+ 个专题画布', f'{topics} 个专题画布', text)
    text = re.sub(r'\d+ 个场景练习', f'{exercises} 个场景练习', text)
    for collection, count in manifest.get('collections', {}).items():
        text = re.sub(re.escape(collection) + r' · \d+', f'{collection} · {count}', text)
        text = re.sub(re.escape(collection) + r' \d+ 条', f'{collection} {count} 条', text)
    return text

def export(root=ROOT, check=False):
    glossary, catalog, manifest = compile_content(root)
    outputs = {root / 'public/jargon/glossary-data.json': glossary,
               root / 'public/jargon/canvas-topics-data.json': catalog,
               root / 'public/jargon/content-manifest.json': manifest}
    changes = []
    for path, value in outputs.items():
        if not path.exists() or read(path) != value:
            changes.append(str(path.relative_to(root)))
            if not check:
                write(path, value)
    for path in [root / 'README.md', *sorted((root / 'public').rglob('*.html'))]:
        old = path.read_text(encoding='utf-8')
        new = sync_labels(old, manifest)
        if new != old:
            changes.append(str(path.relative_to(root)))
            if not check:
                path.write_text(new, encoding='utf-8', newline='\n')
    if check and changes:
        raise ValueError('生成文件未同步：' + ', '.join(changes))
    return manifest, changes

def draft_topic(identity, title, term_ids, group_titles, root=ROOT):
    """Scaffold only. Never invent edges, cases or review approval."""
    if not re.fullmatch(r'feature-[a-z0-9-]+', identity):
        raise ValueError('专题编号使用 feature- 前缀和小写字母数字')
    if not 1 <= len(term_ids) <= 9 or len(set(term_ids)) != len(term_ids):
        raise ValueError('请选择 1–9 个不同概念')
    if len(group_titles) != (len(term_ids) + 2) // 3:
        raise ValueError('每三节点一组，请提供对应数量的分组名')
    terms = {t['id']: t for t in read(root / 'content/terms.json')['terms']}
    sources = {s['id']: s for s in read(root / 'content/sources.json')['sources']}
    editorial = read(root / 'content/topics.json')
    if any(f['id'] == identity or f['title'] == title for f in editorial['features']):
        raise ValueError('已有同编号或同标题专题，请先检查能否补强已有专题')
    nodes = []
    for i, term_id in enumerate(term_ids):
        term = terms.get(term_id)
        if not term or not approved(term, sources):
            raise ValueError('草稿只接收已校对概念')
        nodes.append(dict(id=term_id, termId=term_id, label=term['term'], caption=compact_caption(term['plain']),
                          group=f'g{i//3}', x=120 + i//3*440, y=225 + i%3*220, exerciseId=None,
                          **{k: term[k] for k in ['plain', 'example', 'counter']}))
    draft = dict(id=identity, title=title, summary='', nodes=nodes, relations=[], coreRelations=[], width=1460, height=1010, case='', question='', answer='',
                 groups=[dict(id=f'g{i}', title=t) for i, t in enumerate(group_titles)],
                 supportingTerms=[], review=dict(status='pending', note='待代理补学习目标、案例、关系及复习题；没有自动连线'))
    editorial['features'].append(draft)
    write(root / 'content/topics.json', editorial)
    return draft

def batch_report(root=ROOT, batch=None):
    batch = batch or datetime.now(timezone(timedelta(hours=8))).strftime('%Y%m%d')
    date = datetime.strptime(batch, '%Y%m%d').strftime('%Y-%m-%d')
    glossary, catalog, manifest = compile_content(root)
    terms = read(root / 'content/terms.json')['terms']
    sources = read(root / 'content/sources.json')['sources']
    reviewed = [t for t in terms if t.get('review', {}).get('status') == 'approved' and t['review'].get('batch') == batch]
    added = [t for t in reviewed if t.get('introduced_batch') == batch]
    revised = [t for t in reviewed if t.get('introduced_batch') != batch]
    lines = [f'# {date} 内容整理批次（本地待验收）', '',
             f'本地共 {manifest["records"]} 条记录、{manifest["topics"]} 个串讲专题、{manifest["exercises"]} 个练习。', '',
             f'本批复核 {len(reviewed)} 项：新增 {len(added)} 条、修订 {len(revised)} 条；原有 431 个编号全部保留。', '',
             f'另有 {manifest["legacyPreserved"]} 条已发布存量待逐条复核；保留不代表已验证正确。', '',
             '## 来源与增量盘点', '',
             '基础词表 430 条加本项目 goodcase 组成原有记录。飞书新表为选题线索，原文转载条件待确认，不直接复制进公开数据。', '']
    for source in sources:
        path = root / '.local/content-sources' / source['id'] / 'report.json'
        if path.exists():
            report = read(path)
            lines += [f'- {source["title"]}：版本 {report["revision"]}，完整读取 {report["actual_range"]}；非空记录 {report["row_count"]}，名称归一后 {report["unique_names"]} 项。',
                      '- 候选分类：' + '；'.join(f'{k} {v}' for k,v in report['counts'].items()) + '。',
                      '- 上述为审核分流建议，possible_conflict 是待核查预警，excluded 是名称噪声排除建议，不宣称已逐条裁决。',
                      '- 本次增量：' + '；'.join(f'{k} {len(v)}' for k,v in report['delta'].items()) + '。']
    lines += ['', '完整候选、冲突预警与人工决定留在 `.local/content-sources/`；report.csv 供逐项筛选，report.json 保留原行及候选依据。', '',
              '## 规范词条变更', '', '| 条目 | 操作 | 别名示例 | 依据 |', '|---|---|---|---|']
    refs = {s['id']:s for s in sources}
    for term in reviewed:
        evidence = '、'.join(f'[{refs[s]["title"]}]({refs[s]["url"]})' for s in term['review']['evidence'])
        lines.append(f'| {term["term"]} | {"修订" if term.get("baseline") else "新增"} | {"、".join(term.get("aliases",[])[:3])} | {evidence} |')
    lines += ['', '## 专题交付', '']
    for feature in catalog['features']:
        if feature.get('review', {}).get('status') == 'approved' and feature['review'].get('batch') == batch:
            lines.append(f'- **{feature["title"]}**：{len(feature["nodes"])} 个核心节点、{len(feature["relations"])} 条经过说明的关系；有自拟贯穿案例、延伸概念和场景题。')
    lines += ['', '已有专题保留旧节点编号；新增支持概念从延伸入口查看。新专题围绕学习问题组织，不按来源机械复制目录。', '',
              '## 待解决与发布边界', '',
              '- 飞书原解释的公开转载授权未确认，继续仅作选题线索；不把可访问等同可转载。',
              '- 尚未覆盖全部新来源候选及旧存量；没有把名称未匹配的条目一律计为新增。',
              '- 名称相似、子类和上位概念仍需逐项分辨。例如图像识别不直接合并成图像分类，服务履约不直接当作 Dialogflow 的 Fulfillment。',
              '- 本轮审核由代理依据所列一手资料和任务边界完成，尚待用户本地验收；不声称完成真人专家复审。',
              '- 未推送 GitHub、未发布 Pages，不修改工具箱服务、账号或公网通道。', '']
    path = root / f'docs/content-batch-{batch}.md'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    return path

def source_access_url(source, folder):
    """Keep private source addresses out of public metadata and Git history."""
    url = source.get('url')
    if not url:
        local = folder / 'source.local.json'
        if local.exists():
            url = read(local).get('url')
    if not isinstance(url, str) or not url.startswith('https://'):
        raise ValueError('缺少来源访问地址；请在本地排除目录配置 source.local.json 的 url，保留上次成功快照')
    return url


def fetch_feishu(source, root=ROOT):
    """Use CLI with isolated cwd so its output path remains in its allowlist."""
    folder = root / '.local/content-sources' / source['id']
    folder.mkdir(parents=True, exist_ok=True)
    url = source_access_url(source, folder)
    cli = 'lark-cli.cmd' if __import__('os').name == 'nt' else 'lark-cli'
    def call(*args):
        result = subprocess.run([cli, *args], cwd=folder, capture_output=True, encoding='utf-8', errors='replace', timeout=180)
        if result.returncode:
            raise ValueError('飞书 CLI 读取失败；保留上次成功快照，请检查登录或访问权限')
        data = json.loads(result.stdout)
        if not data.get('ok'):
            raise ValueError('飞书 CLI 未返回成功结果')
        return data['data']
    info = call('sheets', '+workbook-info', '--url', url)
    sheets = [s for s in info['sheets'] if s['sheet_name'] == source['sheet_name']]
    if len(sheets) != 1:
        raise ValueError('工作表不存在或名称有歧义')
    sheet = sheets[0]
    if sheet['column_count'] < 3 or sheet['column_count'] > 26:
        raise ValueError('需适配列结构')
    end = chr(64 + sheet['column_count'])
    receipt = call('sheets', '+cells-get', '--url', url, '--sheet-id', sheet['sheet_id'],
                   '--range', f'A1:{end}{sheet["row_count"]}', '--include', 'value', '--output-path', './incoming.json')
    if receipt.get('complete') is not True:
        raise ValueError('快照不完整；未替换上次成功版本')
    snapshot = read(folder / 'incoming.json')
    parse_snapshot(snapshot)
    destination = folder / (fingerprint(snapshot)[:16] + '.json')
    if not destination.exists():
        write(destination, snapshot)
    return destination

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ['fetch', 'ingest']:
        command = sub.add_parser(name)
        command.add_argument('--source', required=True)
        if name == 'ingest':
            command.add_argument('--snapshot', required=True)
    command = sub.add_parser('export')
    command.add_argument('--check', action='store_true')
    sub.add_parser('validate')
    command = sub.add_parser('report')
    command.add_argument('--batch', help='YYYYMMDD；默认新加坡当前日期')
    command = sub.add_parser('draft-topic')
    command.add_argument('--id', required=True)
    command.add_argument('--title', required=True)
    command.add_argument('--terms', required=True, help='逗号分隔的已校对词条 ID')
    command.add_argument('--groups', required=True, help='逗号分隔的分组名；最多三组')
    args = parser.parse_args()
    if args.command == 'report':
        print(batch_report(batch=args.batch))
        return
    if args.command == 'draft-topic':
        result = draft_topic(args.id, args.title, args.terms.split(','), args.groups.split(','))
        print(json.dumps({'id': result['id'], 'status': 'pending', 'relations': 0}, ensure_ascii=False))
        return
    if args.command in {'export', 'validate'}:
        manifest, changes = export(check=args.command == 'validate' or args.check)
        print(json.dumps({'counts': {k: manifest[k] for k in ['records', 'topics', 'reviewed', 'legacyPreserved']}, 'changed': changes}, ensure_ascii=False))
        return
    sources = {s['id']: s for s in read(ROOT / 'content/sources.json')['sources']}
    if args.source not in sources:
        raise ValueError('请先在来源档案登记新来源及表格适配信息')
    source = sources[args.source]
    snapshot = fetch_feishu(source) if args.command == 'fetch' else Path(args.snapshot)
    folder = ROOT / '.local/content-sources' / source['id']
    snapshot_data = read(snapshot)
    parse_snapshot(snapshot_data)
    archive = folder / (fingerprint(snapshot_data)[:16] + '.json')
    if not archive.exists():
        write(archive, snapshot_data)
    decisions_path = folder / 'decisions.json'
    decisions = read(decisions_path) if decisions_path.exists() else {}
    report = ingest(source, snapshot_data, read(ROOT / 'content/terms.json')['terms'],
                    folder / 'state.json', folder / 'report.json', decisions)
    print(json.dumps({k: report[k] for k in ['source_id', 'revision', 'row_count', 'counts']}, ensure_ascii=False))

if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.TimeoutExpired) as error:
        raise SystemExit(str(error))
