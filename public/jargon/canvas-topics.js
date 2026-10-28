import {recordsWithSupplements} from './canvas-navigation.js';
import {BATCH,topicGraph,relatedEdges} from './canvas-topic-model.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',NW=210,NH=90;let W=1460,H=1010,core,catalog,features=[],activeTopic='',shown=BATCH,extraTerms=[];
let map,terms,exercises,selected='',group='all',edgeFocus='',ready=false,tx=0,ty=0,zoom=1,viewWidth=0,viewHeight=0,ignoreClick=false;
const pointers=new Map();let lastGesture=null;
const element=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const svg=(tag,attrs={},text)=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;};
const isGuided=(id=activeTopic)=>id==='core'||features.some(f=>f.id===id);
const current=()=>map.nodes.find(n=>n.id===selected);
const relationships=()=>isGuided()?map.relations.filter(r=>r.from===selected||r.to===selected):relatedEdges(catalog,selected).map(r=>({...r,from:r.fromTerm,to:r.toTerm}));
const normalize=value=>value.normalize('NFKC').toLowerCase().trim();
function state(){const p=new URLSearchParams();if(activeTopic)p.set('topic',activeTopic);if(selected)p.set('node',selected);if(group!=='all')p.set('group',group);if(activeTopic&&!isGuided()){p.set('shown',shown);if(extraTerms.length)p.set('extra',extraTerms.join(','));}history.replaceState(null,'',location.pathname+(p.size?'?'+p:''));}
function link(path,params){return path+'?'+new URLSearchParams(params);}
function back(){return{from:'canvas',topic:activeTopic,node:selected,group,shown:String(shown),extra:extraTerms.join(',')};}
function saveView(){if(!activeTopic)return;try{sessionStorage.setItem('jargon:canvas:topics:'+activeTopic,JSON.stringify({tx,ty,zoom,width:viewWidth,height:viewHeight}));}catch{}}
function transform(){
 $('network-world').setAttribute('transform',`translate(${tx} ${ty}) scale(${zoom})`);$('network-zoom').textContent=Math.round(zoom*100)+'%';
 $('network-camera').setAttribute('x',-tx/zoom);$('network-camera').setAttribute('y',-ty/zoom);$('network-camera').setAttribute('width',viewWidth/zoom);$('network-camera').setAttribute('height',viewHeight/zoom);saveView();
}
function zoomAt(next,x=viewWidth/2,y=viewHeight/2){next=Math.min(2,Math.max(.25,next));const wx=(x-tx)/zoom,wy=(y-ty)/zoom;zoom=next;tx=x-wx*zoom;ty=y-wy*zoom;transform();}
function fit(nodes=null){if(!nodes&&activeTopic&&!isGuided())nodes=map.nodes;let bounds={x:0,y:0,w:W,h:H};if(nodes?.length){const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);bounds={x:Math.min(...xs)-120,y:Math.min(...ys)-90,w:Math.max(...xs)-Math.min(...xs)+NW+240,h:Math.max(...ys)-Math.min(...ys)+NH+180};}zoom=Math.min(1.35,Math.max(.25,Math.min((viewWidth-28)/bounds.w,(viewHeight-110)/bounds.h)));tx=(viewWidth-bounds.w*zoom)/2-bounds.x*zoom;ty=(viewHeight-bounds.h*zoom)/2-bounds.y*zoom-12;transform();}
function focusRelated(){if(!selected){fit();return;}const ids=new Set([selected,...relationships().flatMap(r=>[r.from,r.to])]);fit(map.nodes.filter(n=>ids.has(n.id)));}
function select(id,focus=false){if(ignoreClick)return;
 if(!isGuided()&&!map.nodes.some(n=>n.id===id)){if(!terms.some(t=>t.id===id))return;extraTerms=[...new Set([...extraTerms,id])].slice(-12);rebuild();}
 const node=map.nodes.find(n=>n.id===id);if(!node)return;selected=id;group='all';edgeFocus='';state();render();if(focus){$('canvas-detail-title').tabIndex=-1;$('canvas-detail-title').focus({preventScroll:true});}requestAnimationFrame(()=>{const x=tx+(node.x+NW/2)*zoom,y=ty+(node.y+NH/2)*zoom;if(x<80||x>viewWidth-80||y<80||y>viewHeight-80){tx=viewWidth/2-(node.x+NW/2)*zoom;ty=viewHeight/2-(node.y+NH/2)*zoom;transform();}});
}
function renderFilters(){
 for(const b of document.querySelectorAll('[data-topic]'))b.setAttribute('aria-current',String(b.dataset.topic===activeTopic));$('canvas-current-topic').setAttribute('aria-current',String(activeTopic==='core'));
 const choices=isGuided()?[{id:'all',title:'全景 · '+map.nodes.length+' 概念'},...map.groups]:[{id:'all',title:'当前已展开 · '+map.nodes.length}];
 $('canvas-group-filters').replaceChildren(...choices.map(g=>{const b=element('button',g.title);b.type='button';b.setAttribute('aria-pressed',String(group===g.id));b.onclick=()=>{group=g.id;selected='';edgeFocus='';state();render();requestAnimationFrame(()=>fit(group==='all'?null:map.nodes.filter(n=>n.group===group)));};return b;}));

}
function renderDetail(){
 $('canvas-detail').hidden=!selected;$('canvas-workspace').classList.toggle('has-detail',!!selected);$('canvas-selection-hint').hidden=!!selected;if(!selected)return;
 const n=current(),record=terms.find(t=>t.id===n.termId),exercise=exercises.find(e=>e.id===n.exerciseId);
 $('canvas-detail-title').textContent=n.label;$('canvas-term-context').textContent=`原词条：${record.term} · ${record.collection} / ${record.topic}`;$('canvas-definition').textContent=record.meaning;
 const learning=$('feature-node-learning');learning.replaceChildren();learning.hidden=!n.plain;if(n.plain)learning.append(element('h3','通俗理解'),element('p',n.plain),element('h4','帮助理解的例子'),element('p',n.example),element('h4','反例与边界'),element('p',n.counter),element('p','以上为复习用自拟例子。','quiet'));
 $('canvas-term-link').href=link('/jargon/glossary.html',{term:record.id,...back()});$('canvas-exercise-link').hidden=!exercise;$('canvas-no-exercise').hidden=!!exercise;
 if(exercise){$('canvas-exercise-link').href=link('/jargon/',{exercise:exercise.id,...back()});$('canvas-exercise-link').textContent=`练习：${exercise.title} →`;}
 const edges=relationships();$('canvas-relations').replaceChildren(...edges.map(r=>{
 const a=isGuided()?map.nodes.find(n=>n.id===r.from):{id:r.from,label:terms.find(t=>t.id===r.from).term},b=isGuided()?map.nodes.find(n=>n.id===r.to):{id:r.to,label:terms.find(t=>t.id===r.to).term},other=a.id===selected?b:a;
 const section=element('section',undefined,'canvas-relation'+(edgeFocus===r.id?' is-focused':''));section.id='relation-'+r.id;section.append(element('h4',`${a.label} ${r.kind==='contrast'?'↔':'→'} ${b.label} · ${r.label}`),element('p',r.explanation),element('p',r.kind==='learning'?'学习关联 · 不是强制技术依赖':'已整理的概念关系','quiet'));
 const visible=map.nodes.some(n=>n.id===other.id),button=element('button',`${visible?'沿关系查看':'展开关联概念'} ${other.label} →`,'secondary');button.type='button';button.onclick=()=>select(other.id,true);section.append(button);
 const evidence=element('details',undefined,'canvas-evidence');evidence.append(element('summary','查看整理依据'));
 const ids=r.evidenceTerms||(isGuided()?[map.nodes.find(n=>n.id===r.from).termId,map.nodes.find(n=>n.id===r.to).termId]:[r.from,r.to]);
 for(const id of ids){const term=terms.find(t=>t.id===id);if(!term)continue;const anchor=element('a',term.term+' · 原词条 →');anchor.href=link('/jargon/glossary.html',{term:id,...back()});evidence.append(anchor,element('p',term.meaning));}
 for(const id of r.basis||[]){const exercise=exercises.find(e=>e.id===id);if(exercise)evidence.append(element('p','关联练习：'+exercise.title,'quiet'));}
 section.append(evidence);return section;}));
 if(!edges.length)$('canvas-relations').append(element('p','这条术语的关系暂未整理。没有连线不表示它与其他概念无关；目前先保留原释义。','topic-no-relations'));
}
function route(r){
 const a=map.nodes.find(n=>n.id===r.from),b=map.nodes.find(n=>n.id===r.to),ay=a.y+NH/2,by=b.y+NH/2;
 if(activeTopic==='core'&&r.id==='rag-badcase')return{d:`M${a.x},${ay} H45 V65 H1050 V${by} H${b.x}`,x:720,y:65};
 if(activeTopic==='core'&&r.id==='tools-badcase')return{d:`M${a.x+NW},${ay} H655 V950 H1040 V${by} H${b.x}`,x:835,y:950};
 if(activeTopic==='core'&&r.id==='baseline-loop')return{d:`M${a.x+NW},${ay} C1050,${ay} 1050,${by} ${b.x},${by}`,x:1050,y:710};
 if(a.x===b.x){const x=a.x+NW+46;return{d:`M${a.x+NW},${ay} C${x},${ay} ${x},${by} ${b.x+NW},${by}`,x:x-12,y:(ay+by)/2};}
 const direction=b.x>a.x?1:-1,x1=a.x+(direction===1?NW:0),x2=b.x+(direction===1?0:NW),mid=(x1+x2)/2;
 return{d:`M${x1},${ay} C${mid},${ay} ${mid},${by} ${x2},${by}`,x:mid,y:Math.abs(ay-by)<10?ay-68:(ay+by)/2};
}
function placeLabel(x,y,width,placed){
 const obstacles=[...map.nodes.map(n=>({x:n.x-8,y:n.y-8,w:NW+16,h:NH+16})),...placed];
 const hit=b=>obstacles.some(a=>b.x<a.x+a.w&&b.x+b.w>a.x&&b.y<a.y+a.h&&b.y+b.h>a.y);
 for(const dy of [0,-42,42,-84,84,-126,126,-168,168])for(const dx of [0,-45,45]){const b={x:x+dx-width/2,y:y+dy-17,w:width,h:34};if(b.x<15||b.x+b.w>W-15||b.y<50||b.y+b.h>H-15||hit(b))continue;placed.push(b);return{x:x+dx,y:y+dy};}
 placed.push({x:x-width/2,y:y-17,w:width,h:34});return{x,y};
}
function renderNetwork(){
 const world=$('network-world');world.replaceChildren();
 const groups=activeTopic==='core'?[{id:'design',x:70,w:590,color:'#edf3e6'},{id:'evaluate',x:710,w:310,color:'#f7f1e2'},{id:'improve',x:1080,w:310,color:'#ecf2e9'}]:map.groups.map((g,i)=>({id:g.id,x:70+i*440,w:400,color:['#edf3e6','#f7f1e2','#ecf2e9'][i]}));
 for(const g of (isGuided()?groups:[])){const title=map.groups.find(s=>s.id===g.id);world.append(svg('rect',{x:g.x,y:105,width:g.w,height:810,rx:32,fill:g.color,'fill-opacity':'.75',stroke:'#dce5d3','stroke-dasharray':'4 5'}),svg('text',{x:g.x+24,y:143,class:'map-group-title'},title.title),svg('text',{x:g.x+24,y:165,class:'map-group-caption'},activeTopic==='core'?(g.id==='design'?'方法之间可以配合，而非逐级升级':g.id==='evaluate'?'比较条件先说清楚':'发现、修复、再验证'):(title.description||'学习分组，不代表强制先后')));}
 if(!isGuided()){world.append(svg('rect',{x:65,y:95,width:W-130,height:H-170,rx:28,fill:'#edf3e6','fill-opacity':'.5',stroke:'#dae4d1','stroke-dasharray':'5 6'}),svg('text',{x:105,y:140,class:'map-group-title'},map.title),svg('text',{x:105,y:164,class:'map-group-caption'},'按原词条展开 · 只显示已整理且两端已展开的关系'));}
 const related=new Set(relationships().flatMap(r=>[r.from,r.to])),all=$('network-all-relations').checked;
 const edgeLayer=svg('g'),nodeLayer=svg('g'),labelLayer=svg('g'),placedLabels=[];world.append(edgeLayer,nodeLayer,labelLayer);
 for(const r of map.relations){const active=selected&&(r.from===selected||r.to===selected),core=map.coreRelations.includes(r.id);if(!all&&!core&&!active)continue;if(!isGuided()&&selected&&!all&&!active)continue;
  const routeInfo=route(r),edge=svg('g',{class:`map-edge ${r.kind==='learning'?'learning':''} ${active?'is-active':selected?'is-dim':''}`,'data-edge':r.id,role:'button',tabindex:0,'aria-label':`${map.nodes.find(n=>n.id===r.from).label}与${map.nodes.find(n=>n.id===r.to).label}：${r.label}`});
  edge.append(svg('title',{},r.explanation),svg('path',{d:routeInfo.d,class:'edge-hit'}),svg('path',{d:routeInfo.d,class:'edge-visible',...(r.kind!=='contrast'?{'marker-end':active?'url(#arrow-active)':'url(#arrow-normal)'}:{})}));
  const open=()=>{if(ignoreClick)return;select(r.from);edgeFocus=r.id;renderDetail();const block=$('relation-'+r.id);block.tabIndex=-1;block.focus({preventScroll:true});};edge.onclick=open;edge.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};edgeLayer.append(edge);
  if(active||(!selected&&core)){const text=active?r.label:r.short,width=Math.max(66,text.length*13+20),label=svg('g',{class:edge.getAttribute('class')}),pos=isGuided()&&activeTopic!=='core'?placeLabel(routeInfo.x,routeInfo.y,width,placedLabels):routeInfo;if(pos.x!==routeInfo.x||pos.y!==routeInfo.y)label.append(svg('path',{d:`M${routeInfo.x},${routeInfo.y} L${pos.x},${pos.y}`,fill:'none',stroke:'#86a075','stroke-width':1,'stroke-dasharray':'3 3'}));label.append(svg('rect',{x:pos.x-width/2,y:pos.y-14,width,height:27,rx:12,class:'edge-label-bg'}),svg('text',{x:pos.x,y:pos.y+4},text));label.onclick=open;labelLayer.append(label);}
 }
 for(const n of map.nodes){const muted=selected?!related.has(n.id)&&n.id!==selected:group!=='all'&&n.group!==group;const g=svg('g',{transform:`translate(${n.x} ${n.y})`,class:`map-node ${n.id===selected?'is-selected':related.has(n.id)?'is-related':''} ${muted?'is-muted':''}`,'data-node':n.id,role:'button',tabindex:0,'aria-pressed':String(n.id===selected),'aria-label':`${n.label}，${n.caption}`});g.append(svg('title',{},n.label+'\n'+terms.find(t=>t.id===n.termId).meaning),svg('rect',{width:NW,height:NH,rx:17}));const lines=wrapLabel(n.label);lines.forEach((text,i)=>g.append(svg('text',{x:15,y:lines.length===1?35:29+i*21,class:'map-node-title'},text)));g.append(svg('text',{x:15,y:76,class:'map-node-caption'},isGuided()?n.caption:n.caption.slice(0,19)));g.onclick=()=>select(n.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n.id,true);}};nodeLayer.append(g);}
 $('canvas-network').setAttribute('aria-label',map.nodes.length+' 个已展开概念与已整理关系');$('network-mini-svg').setAttribute('viewBox',`0 0 ${W} ${H}`);$('network-all-relations').disabled=!isGuided()&&(!selected||!map.relations.length);$('network-relation-count').textContent='保留其他已展开连线';$('network-mini-nodes').replaceChildren(...map.nodes.map(n=>svg('rect',{x:n.x,y:n.y,width:NW,height:NH,rx:10,fill:n.id===selected?'#315d42':'#b5c7aa'})));
 transform();
}
function render(){if(!ready||!activeTopic)return;renderFilters();renderDetail();renderNetwork();progress();}
function search(){if(!ready)return;const q=normalize($('canvas-search').value);$('canvas-search-results').hidden=!q;if(!q)return;
 const found=terms.filter(t=>normalize(`${t.term} ${t.meaning}`).includes(q));$('canvas-search-status').textContent=`完整词表找到 ${found.length} 条，先显示前 ${Math.min(8,found.length)} 条；点选后进入所属主题。`;
 $('canvas-search-matches').replaceChildren(...found.slice(0,8).map(t=>{const button=element('button',`${t.term} · ${t.collection} / ${t.topic}`,'secondary');button.type='button';button.onclick=()=>{const topic=catalog.topics.find(p=>p.termIds.includes(t.id));openTopic(topic.id,t.id);$('canvas-search').value='';$('canvas-search-results').hidden=true;};return button;}));$('canvas-full-search').href=link('/jargon/glossary.html',{q:$('canvas-search').value.trim(),...back()});
}
function resize(){if(!activeTopic)return;const rect=$('canvas-board').getBoundingClientRect(),cx=viewWidth?(viewWidth/2-tx)/zoom:W/2,cy=viewHeight?(viewHeight/2-ty)/zoom:H/2;viewWidth=rect.width;viewHeight=rect.height;$('canvas-network').setAttribute('viewBox',`0 0 ${viewWidth} ${viewHeight}`);tx=viewWidth/2-cx*zoom;ty=viewHeight/2-cy*zoom;transform();}
function gesture(){const values=[...pointers.values()];if(values.length>=2){const [a,b]=values;return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y),count:2};}return values.length?{...values[0],count:1}:null;}
const surface=$('canvas-network');
surface.addEventListener('pointerdown',e=>{if(e.button!==0)return;const rect=surface.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX-rect.left,y:e.clientY-rect.top});lastGesture=gesture();surface.classList.add('is-panning');});
surface.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const rect=surface.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX-rect.left,y:e.clientY-rect.top});const next=gesture();if(lastGesture&&next.count===lastGesture.count){const dx=next.x-lastGesture.x,dy=next.y-lastGesture.y;if(Math.abs(dx)+Math.abs(dy)>2){ignoreClick=true;surface.setPointerCapture(e.pointerId);}if(next.count===2&&lastGesture.distance>0)zoomAt(zoom*next.distance/lastGesture.distance,next.x,next.y);tx+=dx;ty+=dy;transform();}lastGesture=next;});
function release(e){pointers.delete(e.pointerId);lastGesture=gesture();if(!pointers.size){surface.classList.remove('is-panning');setTimeout(()=>{ignoreClick=false;},0);}}
surface.addEventListener('pointerup',release);surface.addEventListener('pointercancel',release);
surface.addEventListener('wheel',e=>{e.preventDefault();const r=surface.getBoundingClientRect();zoomAt(zoom*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
$('canvas-board').addEventListener('keydown',e=>{if(e.target!==$('canvas-board'))return;const movement={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]}[e.key];if(movement){e.preventDefault();tx+=movement[0];ty+=movement[1];transform();}else if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(zoom*1.2);}else if(e.key==='-'){e.preventDefault();zoomAt(zoom/1.2);}else if(e.key==='Home'){e.preventDefault();fit();}});
$('network-plus').onclick=()=>zoomAt(zoom*1.2);$('network-minus').onclick=()=>zoomAt(zoom/1.2);$('network-fit').onclick=()=>fit();$('network-related').onclick=focusRelated;$('network-one').onclick=()=>{if(selected){const n=current();zoom=1;tx=viewWidth/2-(n.x+NW/2);ty=viewHeight/2-(n.y+NH/2);transform();}else zoomAt(1);};$('network-all-relations').onchange=renderNetwork;
$('canvas-search').oninput=search;$('canvas-close').onclick=()=>{const previous=selected;selected='';edgeFocus='';state();render();surface.querySelector(`[data-node="${previous}"]`)?.focus({preventScroll:true});};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('canvas-directory').open)$('canvas-directory').open=false;else if(selected)$('canvas-close').click();}});
$('canvas-current-topic').onclick=()=>openTopic('core');

function wrapLabel(label){const lines=[''];let units=0;for(const char of label){const weight=char.charCodeAt(0)>255?2:1;if(units+weight>22){if(lines.length===2){lines[1]=lines[1].slice(0,-1)+'…';break;}lines.push('');units=0;}lines[lines.length-1]+=char;units+=weight;}return lines;}
function rebuild(){if(activeTopic==='core'){map=core;W=1460;H=1010;}else if(isGuided()){map=features.find(f=>f.id===activeTopic);W=map.width;H=map.height;}else{map=topicGraph(catalog,terms,activeTopic,shown,extraTerms);W=map.width;H=map.height;}}
function progress(){
 const isCore=isGuided();$('topic-load-state').hidden=isCore;
 if(isCore)return;const visible=map.nodes.filter(n=>map.topic.termIds.includes(n.termId)).length,external=map.nodes.length-visible;
 $('topic-progress-text').textContent=`本主题已展开 ${visible} / ${map.topic.termIds.length} 条${external?' · 额外关联 '+external+' 条':''}；已展开节点之间有 ${map.relations.length} 条已整理关系。`;
 $('topic-expand').hidden=shown>=map.topic.termIds.length;const nextCount=map.topic.termIds.slice(shown,shown+BATCH).filter(id=>!map.nodes.some(n=>n.id===id)).length;$('topic-expand').textContent=nextCount?`再展开 ${nextCount} 条`:'下一组已展开，继续整理位置';
 $('topic-collapse').hidden=shown<=BATCH&&!extraTerms.length;
 $('topic-accuracy').textContent=map.topic.relationCount?`这个主题涉及 ${map.topic.relationCount} 条已整理联系；未展开的关系可从概念详情按需查看。`:'这个主题的概念关系待整理。目前只展示原词条，不自动连线。';
}
function openTopic(id,node='',limit=BATCH,extras=[],restore=false){
 if(!isGuided(id)&&!catalog.topics.some(t=>t.id===id))return;activeTopic=id;shown=Math.max(BATCH,Math.min(40,Math.ceil(Number(limit)/BATCH)*BATCH||BATCH));extraTerms=extras.filter(x=>terms.some(t=>t.id===x)).slice(-12);group='all';selected='';edgeFocus='';
 if(node&&!isGuided(id)&&terms.some(t=>t.id===node)&&!catalog.topics.find(t=>t.id===id).termIds.slice(0,shown).includes(node)&&!extraTerms.includes(node))extraTerms.push(node);
 rebuild();if(map.nodes.some(n=>n.id===node))selected=node;
 let saved;try{saved=JSON.parse(sessionStorage.getItem('jargon:canvas:topics:'+activeTopic));}catch{}
 $('topic-index').hidden=true;$('topic-breadcrumb').hidden=false;$('canvas-workspace').hidden=false;$('canvas-group-filters').hidden=false;$('canvas-selection-hint').hidden=!!selected;
 $('topic-active-title').textContent=isGuided()?map.title:map.topic.collection+' · '+map.title;document.querySelector('.canvas-hint').textContent=isGuided()?'拖动空白移动，滚轮或双指缩放；点节点看直接联系，点连线看关系说明。其他主题从目录按需展开。':'主题内每次先展开 8 条；只显示已整理且两端已展开的关系。';const feature=features.find(f=>f.id===id);$('feature-guide').hidden=!feature;$('feature-review').hidden=!feature;if(feature){$('feature-summary').textContent=feature.summary;$('feature-order').textContent='阅读分组：'+feature.groups.map(g=>g.title).join(' → ')+'（不是强制执行流程）';$('feature-question').textContent=feature.question;$('feature-answer').textContent=feature.answer;$('feature-answer-details').open=false;}$('canvas-directory').open=false;state();render();
 requestAnimationFrame(()=>{resize();if(restore&&saved&&[saved.tx,saved.ty,saved.zoom,saved.width,saved.height].every(Number.isFinite)&&saved.zoom>=.25&&saved.zoom<=2){zoom=saved.zoom;tx=saved.tx+(viewWidth-saved.width)/2;ty=saved.ty+(viewHeight-saved.height)/2;transform();}else fit();});
}
function home(){$('canvas-directory').open=true;$('canvas-directory').scrollIntoView({block:'nearest'});}
function directory(){
 const curated=element('section',undefined,'feature-directory');curated.append(element('strong','专题学习 · 把概念串起来'));
 for(const f of features){const b=element('button',undefined,'topic-directory-item feature-directory-item');b.type='button';b.dataset.topic=f.id;b.append(element('span',f.title),element('small',`${f.nodes.length} 个概念 · ${f.relations.length} 条关系 · 例子与复习题`));b.onclick=()=>openTopic(f.id);curated.append(b);}
 const archive=element('details',undefined,'feature-archive');archive.append(element('summary',`全部术语分组 · ${catalog.topics.length} 组 / ${terms.length} 条`));
 for(const collection of ['产品经理','AI']){archive.append(element('strong',collection));for(const t of catalog.topics.filter(t=>t.collection===collection)){const b=element('button',`${t.title} · ${t.termIds.length} 条`,'topic-directory-item');b.type='button';b.dataset.topic=t.id;b.onclick=()=>openTopic(t.id);archive.append(b);}}
 $('canvas-topic-links').replaceChildren(curated,archive);
}
$('topic-home').onclick=home;$('topic-open-core').onclick=()=>openTopic('core');
$('topic-expand').onclick=()=>{shown=Math.min(40,shown+BATCH);rebuild();state();render();fit();};
$('topic-collapse').onclick=()=>{shown=BATCH;extraTerms=[];rebuild();if(!map.nodes.some(n=>n.id===selected))selected='';state();render();fit();};
async function boot(){try{
 const responses=await Promise.all(['/jargon/canvas-v2-data.json','/jargon/canvas-topics-data.json','/jargon/glossary-data.json','/jargon/data.json'].map(url=>fetch(url,{cache:'no-store'})));if(responses.some(r=>!r.ok))throw Error();const data=await Promise.all(responses.map(r=>r.json()));[core,catalog]=data;features=catalog.features;terms=data[2].records;exercises=data[3];
 if(!Array.isArray(features)||features.length<1)throw Error();
 if(!terms.length||!Array.isArray(exercises)||!exercises.length||!catalog.topics.length||new Set(catalog.topics.flatMap(t=>t.termIds)).size!==terms.length)throw Error();
 terms=recordsWithSupplements(terms,catalog);for(const record of catalog.supplementalRecords||[]){const topic=catalog.topics.find(t=>t.collection===record.collection&&t.title===record.topic);if(!topic)throw Error('补充词条缺少主题');if(!topic.termIds.includes(record.id))topic.termIds.push(record.id);}
 for(const a of document.querySelectorAll('a[href="/jargon/glossary.html"]'))a.textContent=a.textContent.replace(/\d+/,terms.length);document.querySelector('label[for="canvas-search"]').textContent='查找 '+terms.length+' 条术语';document.querySelector('.project-heading p').textContent=(features.length+1)+' 个串讲专题 · '+terms.length+' 条术语分组速查';
 ready=true;$('canvas-status').textContent='';$('canvas-retry').hidden=true;directory();
 const p=new URLSearchParams(location.search),id=p.get('topic')||'core';
 if(isGuided(id)||catalog.topics.some(t=>t.id===id))openTopic(id,p.get('node')||'',p.get('shown')||BATCH,(p.get('extra')||'').split(',').filter(Boolean),true);else openTopic('core');
 new ResizeObserver(resize).observe($('canvas-board'));
 }catch{$('canvas-status').textContent='主题暂未加载成功，请重新加载。';$('canvas-retry').hidden=false;}}
$('canvas-retry').onclick=boot;boot();
