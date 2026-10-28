import {addCanvasReturn} from './canvas-navigation.js';
import {createJudge} from './ai-judge.js';
const $=id=>document.getElementById(id),storageKey='xiaozhou:vercel:jargon:v1';
let slices=[],category='全部',selected='',filtered=[],saved={drafts:{},marks:{}};
try{const value=JSON.parse(localStorage.getItem(storageKey)||'{}');if(value.drafts&&typeof value.drafts==='object')saved.drafts=value.drafts;if(value.marks&&typeof value.marks==='object')saved.marks=value.marks;}catch{}
const node=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;};
const current=()=>slices.find(s=>s.id===selected);
const judge=createJudge(current);
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saved));$('draft-status').textContent='草稿已保存在当前浏览器';}catch{$('draft-status').textContent='浏览器未能保存，请自行备份';}}
function renderList(){
 filtered=slices.filter(s=>(category==='全部'||s.group===category)&&`${s.title} ${s.plain} ${s.example}`.toLowerCase().includes($('search').value.trim().toLowerCase()));
 if(!filtered.some(s=>s.id===selected))selected=filtered[0]?.id||'';
 $('count').textContent=`找到 ${filtered.length} 个 · 自评能讲清 ${slices.filter(s=>saved.marks[s.id]==='clear').length}/${slices.length}`;
 $('list').replaceChildren();for(const [i,s] of filtered.entries()){const b=document.createElement('button');b.append(node('span',String(i+1).padStart(2,'0')));const label=node('span',s.title);label.append(node('small',saved.marks[s.id]==='clear'?'自评：能讲清':saved.marks[s.id]==='review'?'待复习':s.group));b.append(label);if(s.id===selected)b.setAttribute('aria-current','true');b.onclick=()=>{selected=s.id;renderList();renderCard();};$('list').append(b);}
}
function renderCard(){const s=current();$('card').hidden=!s;$('empty').hidden=!!s;if(!s)return;
 for(const key of ['plain','example','counter','question'])$(key).textContent=s[key];$('term').textContent=s.title;$('group').textContent=s.group;$('position').textContent=`${filtered.findIndex(x=>x.id===selected)+1} / ${filtered.length}`;$('reference-text').textContent=s.answer;
 $('answer').value=saved.drafts[selected]||'';$('submit').disabled=!$('answer').value.trim();$('draft-status').textContent='保存在当前浏览器';$('feedback').hidden=true;$('reference').hidden=true;$('reference-toggle').setAttribute('aria-expanded','false');$('reference-toggle').textContent='展开参考要点';
 $('review').setAttribute('aria-pressed',String(saved.marks[selected]==='review'));$('clear').setAttribute('aria-pressed',String(saved.marks[selected]==='clear'));
 const index=filtered.findIndex(s=>s.id===selected);$('prev').disabled=index===0;$('next').disabled=index===filtered.length-1;judge.render();
}
function renderFilters(){const groups=['全部',...new Set(slices.map(s=>s.group))];$('filters').replaceChildren();for(const group of groups){const b=node('button',group);b.setAttribute('aria-pressed',String(group===category));b.onclick=()=>{category=group;renderFilters();renderList();renderCard();};$('filters').append(b);}}
$('search').oninput=()=>{renderList();renderCard();};
$('answer').oninput=()=>{saved.drafts[selected]=$('answer').value;persist();judge.render();};
$('practice').onsubmit=e=>{e.preventDefault();judge.submit(current(),$('answer').value.trim());};
$('reference-toggle').onclick=()=>{const show=$('reference').hidden;$('reference').hidden=!show;$('reference-toggle').setAttribute('aria-expanded',String(show));$('reference-toggle').textContent=show?'收起参考要点':'展开参考要点';if(show)judge.help();};
for(const mark of ['review','clear'])$(mark).onclick=()=>{saved.marks[selected]=mark;persist();renderList();$('review').setAttribute('aria-pressed',String(mark==='review'));$('clear').setAttribute('aria-pressed',String(mark==='clear'));};
for(const [id,delta] of [['prev',-1],['next',1]])$(id).onclick=()=>{const next=filtered[filtered.findIndex(s=>s.id===selected)+delta];if(next){selected=next.id;renderList();renderCard();$('term').scrollIntoView({block:'start'});}};
$('show-all').onclick=()=>{category='全部';$('search').value='';renderFilters();renderList();renderCard();};
async function boot(){try{const response=await fetch('/jargon/data.json',{cache:'no-store'});if(!response.ok)throw Error();slices=await response.json();const requested=new URLSearchParams(location.search).get('exercise');selected=slices.some(s=>s.id===requested)?requested:slices[0]?.id||'';renderFilters();renderList();renderCard();$('load-status').hidden=true;$('reload-data').hidden=true;judge.refresh();}catch{$('load-status').textContent='切片暂时没有加载成功，请重新加载。';$('reload-data').hidden=false;}}
$('reload-data').onclick=boot;addCanvasReturn();boot();
