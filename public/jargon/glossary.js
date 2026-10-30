import {addCanvasReturn,recordsWithSupplements} from './canvas-navigation.js';
import {directions,directionOf,filterRecords,rankedRecords,relatedFeatures} from './glossary-model.js';
const $=id=>document.getElementById(id),size=20;
let records=[],catalog={},exercises=[],page=1,selected='',group='all',loaded=false;
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const mobile=()=>matchMedia('(max-width:760px)').matches;
function filters(){return {query:$('lookup-search').value,collection:$('lookup-collection').value,topic:$('lookup-topic').value,group};}
function saveLocation(){const p=new URLSearchParams(location.search);for(const [k,v]of Object.entries({q:$('lookup-search').value,collection:$('lookup-collection').value,filterTopic:$('lookup-topic').value,direction:group==='all'?'':group,term:selected,page:page>1?String(page):''})){if(v)p.set(k,v);else p.delete(k);}history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));}
function renderGroups(){
 $('topic-groups').replaceChildren(...directions.map(d=>{const b=make('button',undefined,'direction-button');b.type='button';b.dataset.group=d.id;b.setAttribute('aria-pressed',String(group===d.id));const icon=make('span',d.mark,'direction-icon');icon.setAttribute('aria-hidden','true');b.append(icon,make('span',d.name),make('span',String(records.filter(r=>d.id==='all'||directionOf(r)===d.id).length),'direction-count'));b.onclick=()=>{group=d.id;$('lookup-topic').value='';page=1;selected='';populateTopics();render();document.body.classList.remove('is-reading');if(mobile())$('topic-directory').open=false;};return b;}));
}
function populateTopics(){const prior=$('lookup-topic').value,values=[...new Set(filterRecords(records,{collection:$('lookup-collection').value,group}).map(r=>r.topic))];$('lookup-topic').replaceChildren(new Option('全部主题',''),...values.map(t=>new Option(t,t)));if(values.includes(prior))$('lookup-topic').value=prior;}
function renderDetail(r){
 const detail=$('lookup-detail');detail.replaceChildren();
 if(!r){detail.classList.remove('is-target');detail.append(make('p','选择一条术语，查看它的定义与边界。','detail-placeholder'));return;}
 detail.classList.add('is-target');detail.dataset.termId=r.id;
 const back=make('button','← 返回搜索结果','mobile-back');back.type='button';back.onclick=()=>{document.body.classList.remove('is-reading');$('lookup-results').querySelector('[aria-pressed="true"]')?.focus();};detail.append(back);
 const meta=make('div',undefined,'detail-meta');meta.append(make('span',r.collection+' / '+r.topic),make('span',r.reviewStatus==='reviewed'?'已校对':'存量待复核',r.reviewStatus==='reviewed'?'review-badge':'review-badge legacy'));detail.append(meta);
 const h=make('h2',r.term);h.id='detail-heading';h.tabIndex=-1;detail.append(h);
 if(r.aliases?.length)detail.append(make('p',r.aliases.join(' · '),'detail-aliases'));
 detail.append(make('p',r.meaning,'detail-definition'));
 if(r.reviewStatus!=='reviewed')detail.append(make('p','此解释沿用原词表，尚未完成逐项复核；请结合具体语境理解。','legacy-note'));
 for(const [title,key,cls]of [['通俗理解','plain','plain'],['自拟例子','example','example'],['反例与边界','counter','counter']]){if(!r[key])continue;const section=make('section',undefined,'learning-section '+cls);section.append(make('h3',title),make('p',r[key]));detail.append(section);}
 if(!r.plain)detail.append(make('p','通俗解释、例子与边界仍待补充。','pending-note'));
 const links=make('div',undefined,'detail-links'),features=relatedFeatures(catalog,r.id);
 if(features.length){const list=make('div',undefined,'related-topics');list.append(make('span','相关专题','link-label'));for(const f of features.slice(0,3)){const a=make('a',f.title+' →'),n=f.nodes.find(n=>n.termId===r.id);a.href='/jargon/canvas.html?'+new URLSearchParams({topic:f.id,...(n?{node:n.id}:{})});list.append(a);}links.append(list);}
 const exerciseId=catalog.exerciseMap?.[r.id];
 if(exerciseId&&exercises.some(e=>e.id===exerciseId)){const a=make('a','去练习 ↗','primary');a.href='/jargon/?'+new URLSearchParams({exercise:exerciseId});links.append(a);}else{const a=make('a','浏览场景练习 →','practice-link');a.href='/jargon/';links.append(a);}
 detail.append(links);
}
function render(){
 if(!loaded)return;
 const matches=rankedRecords(filterRecords(records,filters()),$('lookup-search').value),total=Math.max(1,Math.ceil(matches.length/size));page=Math.max(1,Math.min(page,total));
 if(!matches.some(r=>r.id===selected))selected=matches[(page-1)*size]?.id||'';
 $('lookup-status').textContent=`找到 ${matches.length} 条，共 ${records.length} 条术语。第 ${page} 页。`;$('result-count').textContent=matches.length+' / '+records.length;
 $('lookup-results').replaceChildren(...matches.slice((page-1)*size,page*size).map(r=>{const b=make('button',undefined,'result-item');b.type='button';b.dataset.termId=r.id;b.setAttribute('aria-pressed',String(selected===r.id));b.setAttribute('aria-controls','lookup-detail');b.append(make('span',r.term,'result-name'),make('span',r.topic,'result-topic'),make('span',r.reviewStatus==='reviewed'?'已校对':'待复核','result-state'));b.onclick=()=>{selected=r.id;render();if(mobile()){document.body.classList.add('is-reading');$('detail-heading').focus();}};b.onkeydown=e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;e.preventDefault();const list=[...$('lookup-results').children],next=list[list.indexOf(b)+(e.key==='ArrowDown'?1:-1)];next?.focus();};return b;}));
 $('lookup-empty').hidden=!!matches.length;$('lookup-pages').hidden=matches.length<=size;$('lookup-page').textContent=`${page} / ${total}`;$('lookup-prev').disabled=page===1;$('lookup-next').disabled=page===total;
 renderDetail(matches.find(r=>r.id===selected));renderGroups();saveLocation();
}
function reset(){if(!loaded)return;$('lookup-search').value='';$('lookup-collection').value='';group='all';$('lookup-topic').value='';page=1;selected='';populateTopics();document.body.classList.remove('is-reading');render();}
function filter(){page=1;selected='';document.body.classList.remove('is-reading');render();}
$('lookup-form').onsubmit=e=>e.preventDefault();$('lookup-form').onreset=e=>{e.preventDefault();reset();};$('empty-reset').onclick=reset;
$('lookup-search').oninput=filter;$('lookup-search').onkeydown=e=>{if(e.key==='Escape'){$('lookup-search').value='';filter();}};$('lookup-collection').onchange=()=>{populateTopics();filter();};$('lookup-topic').onchange=filter;
for(const [id,delta]of [['lookup-prev',-1],['lookup-next',1]])$(id).onclick=()=>{page+=delta;selected='';render();$('lookup-results').scrollTop=0;};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable&&!document.querySelector('dialog[open]')){e.preventDefault();$('lookup-search').focus();}});
async function boot(){
 $('load-error').hidden=true;$('lookup-retry').disabled=true;
 try{
  const responses=await Promise.all(['/jargon/glossary-data.json','/jargon/canvas-topics-data.json','/jargon/data.json'].map(u=>fetch(u,{cache:'no-store'})));if(responses.some(r=>!r.ok))throw Error();
  const [data,map,lessons]=await Promise.all(responses.map(r=>r.json()));if(!Array.isArray(data.records)||data.count!==data.records.length||!Array.isArray(map.features)||!Array.isArray(lessons))throw Error();records=recordsWithSupplements(data.records,map);if(records.some(r=>!r.id||!r.meaning||!r.term||!r.collection||!r.topic))throw Error();catalog=map;exercises=lessons;
  $('library-stats').textContent=`${records.length} 条术语 · ${records.filter(r=>r.reviewStatus==='reviewed').length} 条已校对`;$('exercise-count-link').textContent=`${exercises.length} 个场景练习 →`;
  $('lookup-collection').replaceChildren(new Option('全部词表',''),...[...new Set(records.map(r=>r.collection))].map(c=>new Option(c,c)));
  const p=new URLSearchParams(location.search);group=directions.some(d=>d.id===p.get('direction'))?p.get('direction'):'all';$('lookup-search').value=p.get('q')||'';if([...$('lookup-collection').options].some(o=>o.value===p.get('collection')))$('lookup-collection').value=p.get('collection');populateTopics();const requestedTopic=p.get('filterTopic')||(p.get('from')!=='canvas'?p.get('topic'):'');if([...$('lookup-topic').options].some(o=>o.value===requestedTopic))$('lookup-topic').value=requestedTopic;selected=p.get('term')||'';page=Math.max(1,Math.floor(Number(p.get('page')))||1);
  const matches=rankedRecords(filterRecords(records,filters()),$('lookup-search').value),index=matches.findIndex(r=>r.id===selected);if(index>=0)page=Math.floor(index/size)+1;
  loaded=true;$('lookup-workspace').hidden=false;render();if(mobile()){$('topic-directory').open=false;if(index>=0)document.body.classList.add('is-reading');}
 }catch{$('lookup-workspace').hidden=true;$('load-error').hidden=false;$('lookup-status').textContent='完整词表暂时未能加载，请重试。';}finally{$('lookup-retry').disabled=false;}
}
$('lookup-retry').onclick=boot;addCanvasReturn();boot();
