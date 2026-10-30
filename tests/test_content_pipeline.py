import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.content_pipeline import (ROOT, approved, assess, compile_content, export,
                                      ingest, make_catalog, normalize, parse_snapshot,
                                      read, render_terms, draft_topic, write, sync_labels,
                                      source_access_url, fetch_feishu)

def snapshot(records=None, revision=1):
    return {'schema': 'jargon.source/v1', 'complete': True, 'revision': revision,
            'records': records if records is not None else [
                {'locator': 'row:2', 'term': '检索增强生成', 'definition': '检索后生成', 'plain': '查资料后回答'}]}

def term(identity='term-000000000001', baseline=False, status='approved'):
    t = dict(id=identity, term='RAG', aliases=['检索增强生成'], collection='AI', topic='工程',
             definition='定义', plain='解释', example='例子', counter='反例', context='工程语境',
             review=dict(status=status, rights='original-synthesis', note='已核对', evidence=['official']))
    if baseline:
        t['baseline'] = dict(id=identity, term='RAG', collection='AI', topic='工程', meaning='旧解释')
    return t

SOURCES = {'official': {'public_reference': True}}

class PrivateSourceAccess(unittest.TestCase):
    def test_private_address_resolved_locally_without_mutating_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            source = dict(id='private', url='')
            before = copy.deepcopy(source)
            write(folder / 'source.local.json', dict(url='https://example.invalid/source'))
            self.assertEqual(source_access_url(source, folder), 'https://example.invalid/source')
            self.assertEqual(source, before)
            self.assertEqual(source_access_url(dict(url='https://public.example/source'), folder),
                             'https://public.example/source')

    def test_missing_address_fails_before_cli_and_preserves_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snapshot = root / '.local/content-sources/private/incoming.json'
            write(snapshot, {'last_success': True})
            before = snapshot.read_bytes()
            with self.assertRaisesRegex(ValueError, '缺少来源访问地址'):
                fetch_feishu(dict(id='private', url=''), root)
            self.assertEqual(snapshot.read_bytes(), before)

class IncrementalLabels(unittest.TestCase):
    def test_lookup_badge_updates_across_multiple_batches(self):
        text = '<span>431 条速查 · 16 个练习</span>'
        for records in [455, 475, 483]:
            manifest = dict(records=records, topics=12, exercises=16)
            text = sync_labels(text, manifest)
            self.assertEqual(text, f'<span>{records} 条速查 · 16 个练习</span>')
            self.assertEqual(sync_labels(text, manifest), text)

class IncrementalImport(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.folder = Path(self.tmp.name)
        self.state = self.folder / 'state.json'
        self.report = self.folder / 'report.json'
        self.source = {'id': 'first'}

    def tearDown(self):
        self.tmp.cleanup()

    def run_import(self, data, decisions=None):
        return ingest(self.source, data, [term()], self.state, self.report, decisions)

    def test_repeat_has_no_new_records_or_state_change(self):
        first = self.run_import(snapshot())
        self.assertEqual(first['delta']['added'], ['row:2'])
        before = self.state.read_bytes()
        again = self.run_import(snapshot())
        self.assertEqual(again['delta']['unchanged'], ['row:2'])
        self.assertFalse(again['delta']['added'])
        self.assertEqual(self.state.read_bytes(), before)

    def test_update_invalidates_old_decision(self):
        first = self.run_import(snapshot())
        decision = {'row:2': {'row_hash': first['rows'][0]['hash'],
                             'disposition': 'existing_supplement', 'note': '人工核对'}}
        self.assertEqual(self.run_import(snapshot(), decision)['rows'][0]['status'], 'reviewed')
        changed = snapshot()
        changed['records'][0]['definition'] = '更新后的定义'
        result = self.run_import(changed, decision)
        self.assertEqual(result['delta']['changed'], ['row:2'])
        self.assertEqual(result['rows'][0]['status'], 'needs_review')
        self.assertIsNone(result['rows'][0]['decision'])

    def test_missing_source_and_partial_read_keep_good_state(self):
        self.run_import(snapshot())
        before = self.state.read_bytes()
        for data in [{'ok': False}, {**snapshot(), 'complete': False}, {'has_more': True}]:
            with self.assertRaises(ValueError):
                self.run_import(data)
            self.assertEqual(before, self.state.read_bytes())

    def test_removal_is_archived_not_canonical_deletion(self):
        canonical = [term()]
        before = copy.deepcopy(canonical)
        self.run_import(snapshot())
        result = self.run_import(snapshot([], 2))
        self.assertEqual(result['delta']['removed'], ['row:2'])
        self.assertIn('row:2', read(self.state)['missing_rows'])
        self.assertEqual(canonical, before)

    def test_separate_source_cannot_reuse_state(self):
        self.run_import(snapshot())
        with self.assertRaises(ValueError):
            ingest({'id': 'second'}, snapshot(), [term()], self.state, self.report)

    def test_physical_sheet_coordinates_and_gaps(self):
        area = {'actual_range': 'A1:C2', 'row_indices': [1, 2], 'col_indices': ['A', 'B', 'C'],
                'cells': [[{'value': s} for s in ['名词', '专业定义', '通俗解释']],
                          [{'value': s} for s in ['RAG', '定义', '解释']]]}
        rows, _, _ = parse_snapshot({'has_more': False, 'ranges': [area]})
        self.assertEqual(rows[0]['locator'], 'row:2')
        area['row_indices'] = [1, 3]
        with self.assertRaises(ValueError):
            parse_snapshot({'has_more': False, 'ranges': [area]})

    def test_alias_and_homonym_are_suggestions_only(self):
        rows, _, _ = parse_snapshot(snapshot())
        self.assertEqual(normalize('ＲＡＧ'), normalize('rag'))
        a, b = term(), term('term-000000000002')
        b['context'] = '另一语境'
        result = assess(rows, [a, b])[0]
        self.assertEqual(result['disposition'], 'context_review')
        self.assertEqual(len(result['candidates']), 2)
        self.assertEqual(result['status'], 'needs_review')

    def test_generated_instruction_and_absolute_claim_flagged(self):
        data = snapshot()
        data['records'][0]['term'] = '因题目要求只能提取一个，任选 RAG'
        rows, _, _ = parse_snapshot(data)
        self.assertEqual(assess(rows, [term()])[0]['disposition'], 'excluded')
        data['records'][0]['term'] = 'RAG'
        data['records'][0]['definition'] = '保证完全消除错误'
        rows, _, _ = parse_snapshot(data)
        self.assertEqual(assess(rows, [term()])[0]['disposition'], 'possible_conflict')

class EditorialGates(unittest.TestCase):
    def test_pending_blocked_but_old_published_version_preserved(self):
        old = term(baseline=True, status='conflict')
        new = term('term-000000000002', status='pending')
        records, blocked = render_terms([old, new], SOURCES)
        self.assertEqual([r['id'] for r in records], [old['id']])
        self.assertEqual(records[0]['meaning'], '旧解释')
        self.assertEqual(records[0]['reviewStatus'], 'legacy-preserved')
        self.assertEqual(len(blocked), 2)

    def test_rights_and_evidence_are_required(self):
        t = term()
        self.assertTrue(approved(t, SOURCES))
        self.assertFalse(approved(t, {'official': {'public_reference': False}}))
        t['review']['rights'] = 'unconfirmed'
        self.assertFalse(approved(t, SOURCES))
        t['review']['rights'] = 'original-synthesis'
        t['review']['evidence'] = []
        self.assertFalse(approved(t, SOURCES))

    def test_current_outputs_and_legacy_links_match(self):
        manifest, changes = export(check=True)
        self.assertEqual(changes, [])
        self.assertGreaterEqual(manifest['reviewed'], 40)
        self.assertEqual(manifest['exercises'], 16)
        self.assertGreaterEqual(manifest['records'], 431)
        glossary, catalog, _ = compile_content()
        self.assertEqual(len(glossary['records']), len(set(r['id'] for r in glossary['records'])))
        self.assertEqual(len(catalog['features']) + 1, manifest['topics'])
        for feature in catalog['features']:
            self.assertGreater(feature['width'], 0)
            self.assertGreater(feature['height'], 0)
            self.assertTrue(set(feature['coreRelations']).issubset({r['id'] for r in feature['relations']}))

    def test_bad_topic_and_out_of_sync_explanation_rejected(self):
        editorial = read(ROOT / 'content/topics.json')
        terms = read(ROOT / 'content/terms.json')['terms']
        sources = {s['id']: s for s in read(ROOT / 'content/sources.json')['sources']}
        records, _ = render_terms(terms, sources)
        feature = next(f for f in editorial['features'] if f['id'] == 'feature-service')
        feature['nodes'][0]['plain'] = '与规范库不同的解释'
        with self.assertRaises(ValueError):
            make_catalog(editorial, records, terms, sources)

    def test_draft_topic_does_not_enter_export(self):
        editorial = read(ROOT / 'content/topics.json')
        draft = copy.deepcopy(editorial['features'][-1])
        draft['id'] = 'draft-test'
        draft['review']['status'] = 'pending'
        editorial['features'].append(draft)
        terms = read(ROOT / 'content/terms.json')['terms']
        sources = {s['id']: s for s in read(ROOT / 'content/sources.json')['sources']}
        records, _ = render_terms(terms, sources)
        catalog, blocked = make_catalog(editorial, records, terms, sources)
        self.assertIn('draft-test', blocked)
        self.assertNotIn('draft-test', [f['id'] for f in catalog['features']])

    def test_draft_scaffold_has_no_invented_edges_or_approval(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write(root / 'content/terms.json', {'terms': [term()]})
            write(root / 'content/sources.json', {'sources': [{'id': 'official', 'public_reference': True}]})
            write(root / 'content/topics.json', {'features': []})
            result = draft_topic('feature-draft', '新问题', ['term-000000000001'], ['理解任务'], root)
            self.assertEqual(result['relations'], [])
            self.assertEqual(result['review']['status'], 'pending')
            self.assertEqual(result['nodes'][0]['plain'], term()['plain'])
            self.assertEqual(result['coreRelations'], [])
            with self.assertRaises(ValueError):
                draft_topic('feature-draft', '新问题', ['term-000000000001'], ['理解任务'], root)
