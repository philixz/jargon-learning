import {addCanvasReturn,recordsWithSupplements} from './canvas-navigation.js';
const $=id=>document.getElementById(id),size=30;
let records=[],page=1,loaded=false,targetTerm=new URLSearchParams(location.search).get('term')||'';
const normalize=value=>value.normalize('NFKC').toLocaleLowerCase().trim();
function node(tag,value,cls){const element=document.createElement(tag);element.textContent=value;if(cls)element.className=cls;return element;}
function topics(){
 const collection=$('lookup-collection').value,previous=$('lookup-topic').value;
 const values=[...new Set(records.filter(r=>!collection||r.collection===collection).map(r=>r.topic))];
 $('lookup-topic').replaceChildren(new Option('全部主题',''),...values.map(value=>new Option(value,value)));
 if(values.includes(previous))$('lookup-topic').value=previous;
}
function render(){
 if(!loaded)return;
 const collection=$('lookup-collection').value,topic=$('lookup-topic').value,words=normalize($('lookup-search').value).split(/\s+/).filter(Boolean);
 const matches=records.filter(r=>(!targetTerm||r.id===targetTerm)&&(!collection||r.collection===collection)&&(!topic||r.topic===topic)&&words.every(word=>normalize(`${r.term} ${r.meaning} ${r.topic}`).includes(word)));
 const total=Math.max(1,Math.ceil(matches.length/size));page=Math.min(page,total);
 const start=(page-1)*size,visible=matches.slice(start,start+size);
 $('lookup-status').textContent=matches.length?`找到 ${matches.length} 条 / 共 ${records.length} 条 · 显示第 ${start+1}–${start+visible.length} 条`:`找到 0 条 / 共 ${records.length} 条`;
 $('lookup-results').replaceChildren(...visible.map(r=>{const article=document.createElement('article');article.className='lookup-entry'+(r.id===targetTerm?' is-target':'');article.dataset.termId=r.id;article.append(node('p',`${r.collection} · ${r.topic}`,'lookup-topic'),node('h2',r.term),node('p',r.meaning,'lookup-meaning'));return article;}));
 $('lookup-empty').hidden=!!matches.length;$('lookup-pages').hidden=matches.length<=size;
 $('lookup-page').textContent=`第 ${page} / ${total} 页`;$('lookup-prev').disabled=page===1;$('lookup-next').disabled=page===total;
}
function filter(){targetTerm='';page=1;render();}
$('lookup-form').onsubmit=event=>event.preventDefault();
$('lookup-form').onreset=event=>{event.preventDefault();$('lookup-search').value='';$('lookup-collection').value='';$('lookup-topic').value='';topics();filter();};
$('lookup-search').oninput=filter;
$('lookup-collection').onchange=()=>{topics();filter();};$('lookup-topic').onchange=filter;
for(const [id,delta] of [['lookup-prev',-1],['lookup-next',1]])$(id).onclick=()=>{page+=delta;render();$('lookup-status').scrollIntoView({block:'start'});};
async function boot(){
 $('lookup-status').textContent='正在加载完整词表…';$('lookup-retry').hidden=true;
 try{
  const [response,catalogResponse]=await Promise.all(['/jargon/glossary-data.json','/jargon/canvas-topics-data.json'].map(url=>fetch(url,{cache:'no-store'})));if(!response.ok||!catalogResponse.ok)throw Error();
  const data=await response.json();if(!Array.isArray(data.records)||data.records.length!==data.count||data.records.some(r=>!r.id||!r.term||!r.meaning||!r.collection||!r.topic))throw Error();
  records=recordsWithSupplements(data.records,await catalogResponse.json());document.querySelector('.project-heading .pill').textContent=records.length+' 条术语记录';for(const a of document.querySelectorAll('a[href="/jargon/glossary.html"]'))a.textContent=a.textContent.replace(/\d+/,records.length);for(const o of $('lookup-collection').options)o.textContent=o.value?o.value+' · '+records.filter(r=>r.collection===o.value).length:'全部词表 · '+records.length;document.querySelector('.lookup-note').textContent='产品经理 '+records.filter(r=>r.collection==='产品经理').length+' 条 · AI '+records.filter(r=>r.collection==='AI').length+' 条。补充词条纳入对应主题，同名词保留不同语境；调侃表达仅帮助理解语境。';loaded=true;topics();const params=new URLSearchParams(location.search);$('lookup-search').value=params.get('q')||'';const topic=params.get('topic');if([...$('lookup-topic').options].some(o=>o.value===topic))$('lookup-topic').value=topic;render();
 }catch{loaded=false;$('lookup-results').replaceChildren();$('lookup-pages').hidden=true;$('lookup-empty').hidden=true;$('lookup-status').textContent='完整词表暂时未能加载，请重新加载。';$('lookup-retry').hidden=false;}
}
$('lookup-retry').onclick=boot;addCanvasReturn();boot();
