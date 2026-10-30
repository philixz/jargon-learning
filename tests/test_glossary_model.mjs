import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {directions,directionOf,filterRecords,rankedRecords,relatedFeatures} from '../public/jargon/glossary-model.js';
const glossary=JSON.parse(readFileSync(new URL('../public/jargon/glossary-data.json',import.meta.url)));
const catalog=JSON.parse(readFileSync(new URL('../public/jargon/canvas-topics-data.json',import.meta.url)));
const records=glossary.records;
test('learning directions partition the entire real library without loss or duplication',()=>{
 const ids=directions.filter(d=>d.id!=='all').flatMap(d=>filterRecords(records,{group:d.id}).map(r=>r.id));
 assert.equal(ids.length,records.length);assert.equal(new Set(ids).size,records.length);
 assert.ok(records.every(r=>directions.some(d=>d.id===directionOf(r))));
});
test('aliases match independently of display name and normalize case/fullwidth',()=>{
 const result=filterRecords(records,{query:'Reciprocal Rank Fusion'});
 assert.equal(result.length,1);assert.match(result[0].term,/RRF/);
 assert.ok(filterRecords(records,{query:'ｒａｇ'}).some(r=>r.term==='RAG'));
});
test('exact names rank first while duplicate contexts retain stable identities',()=>{
 const result=rankedRecords(filterRecords(records,{query:'RAG'}),'RAG');
 assert.equal(result[0].term,'RAG');assert.equal(new Set(result.map(r=>r.id)).size,result.length);
 assert.ok(records.filter(r=>r.term==='RAG').every(r=>result.some(x=>x.id===r.id)));
});
test('collection, direction and topic constraints compose; no-match queries stay empty',()=>{
 const filtered=filterRecords(records,{group:'training',collection:'AI',topic:'训练与后训练'});
 assert.ok(filtered.length);assert.ok(filtered.every(r=>r.collection==='AI'&&r.topic==='训练与后训练'));
 assert.equal(filterRecords(records,{query:'zzzz-never-a-term-20261030'}).length,0);
 assert.equal(filterRecords(records).length,483);
});
test('related topics are backed by real core nodes or supporting references',()=>{
 const rag=relatedFeatures(catalog,'term-035ce0ef2cd9');assert.ok(rag.some(f=>f.id==='feature-rag'));
 const rrf=records.find(r=>r.term.includes('RRF'));assert.ok(relatedFeatures(catalog,rrf.id).some(f=>f.id==='feature-rag'));
 assert.deepEqual(relatedFeatures(catalog,'term-000000000000'),[]);
});
