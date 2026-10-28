export const BATCH=8;
export function topicGraph(catalog,records,topicId,shown=BATCH,extra=[]){
 const topic=catalog.topics.find(t=>t.id===topicId);if(!topic)throw Error('未知主题');
 const primary=topic.termIds.slice(0,shown),ids=[...new Set([...primary,...extra])].filter(id=>records.some(r=>r.id===id));
 const outside=ids.filter(id=>!topic.termIds.includes(id));
 const ordered=[...ids.filter(id=>topic.termIds.includes(id)),...outside];
 const nodes=ordered.map((id,index)=>{const r=records.find(r=>r.id===id);return{id,label:r.term,caption:topic.termIds.includes(id)?'原词条 · '+r.collection:'关联展开 · '+r.topic,group:topic.termIds.includes(id)?'topic':'related',termId:id,exerciseId:catalog.exerciseMap[id]||null,x:110+(index%3)*330,y:210+Math.floor(index/3)*190};});
 const relations=catalog.relations.filter(r=>ids.includes(r.fromTerm)&&ids.includes(r.toTerm)).map(r=>({...r,from:r.fromTerm,to:r.toTerm}));
 return{id:topic.id,title:topic.title,groups:[{id:'topic',title:topic.title}],nodes,relations,coreRelations:relations.map(r=>r.id),width:1200,height:Math.max(680,Math.ceil(nodes.length/3)*190+330),topic,outside};
}
export function relatedEdges(catalog,termId){return catalog.relations.filter(r=>r.fromTerm===termId||r.toTerm===termId);}
