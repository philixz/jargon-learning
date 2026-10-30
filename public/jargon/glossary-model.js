// Learning directions group records; they never assert concept equivalence.
export const directions=[
 {id:'all',name:'全部术语',mark:'▤'},
 {id:'language',name:'语言与检索',mark:'⌕',topics:['AI 产品与工程','语言、检索与评测','语言与实时交互','提示、推理行为与 Agent']},
 {id:'vision',name:'视觉与多模态',mark:'◈',topics:['视觉与多模态']},
 {id:'training',name:'训练与适配',mark:'◇',topics:['训练与后训练','数据与合成','架构']},
 {id:'evaluation',name:'评测与工程',mark:'▥',topics:['测试与质量','数据与指标','评测与榜单','对齐、安全与可解释','推理、服务与成本','算力与推理','工程管理','数据与安全']},
 {id:'product',name:'产品与协作',mark:'⌘'}
];
export const normalize=v=>String(v||'').normalize('NFKC').toLocaleLowerCase().trim();
export function directionOf(r){return directions.find(d=>d.topics?.includes(r.topic))?.id||'product';}
export function filterRecords(records,{query='',collection='',topic='',group='all'}={}){
 const words=normalize(query).split(/\s+/).filter(Boolean);
 return records.filter(r=>(!collection||r.collection===collection)&&(!topic||r.topic===topic)&&(group==='all'||directionOf(r)===group)&&words.every(w=>normalize([r.term,...(r.aliases||[]),r.meaning,r.topic].join(' ')).includes(w)));
}
export function rankedRecords(records,q){
 if(!normalize(q))return records;
 const score=r=>normalize(r.term)===normalize(q)?0:(r.aliases||[]).some(a=>normalize(a)===normalize(q))?1:2;
 return records.map((r,i)=>({r,i})).sort((a,b)=>score(a.r)-score(b.r)||a.i-b.i).map(x=>x.r);
}
export function relatedFeatures(catalog,id){return (catalog.features||[]).filter(f=>f.nodes.some(n=>n.termId===id)||(f.supportingTerms||[]).includes(id));}
