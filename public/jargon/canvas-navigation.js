// Base glossary stays intact; project additions have their own stable IDs.
export function recordsWithSupplements(base,catalog){
 const extra=catalog.supplementalRecords||[];if(!Array.isArray(extra)||extra.some(r=>!/^term-[a-f0-9]{12}$/.test(r.id)||!r.term||!r.meaning||!r.collection||!r.topic))throw Error('补充词条格式无效');
 const records=[...base,...extra];if(new Set(records.map(r=>r.id)).size!==records.length)throw Error('词条编号重复');return records;
}
// Only accept a fixed local return destination; no arbitrary URL redirects.
export function addCanvasReturn(){
 const params=new URLSearchParams(location.search);if(params.get('from')!=='canvas')return;
 const target=new URLSearchParams();for(const key of ['node','group','topic']){const value=params.get(key);if(value&&/^[a-z0-9-]{1,80}$/.test(value))target.set(key,value);}
 const shown=params.get('shown');if(shown&&/^(8|16|24|32|40)$/.test(shown))target.set('shown',shown);const extra=params.get('extra');if(extra&&/^(term-[a-f0-9]{12})(,term-[a-f0-9]{12}){0,11}$/.test(extra))target.set('extra',extra);
 const link=document.createElement('a');link.className='canvas-return';link.href='/jargon/canvas.html'+(target.size?'?'+target:'');link.textContent='← 返回专题画布';
 document.querySelector('.glossary-modes').after(link);
}

// Shared feedback UI. Only the explicit form and the current glossary/topic IDs
// are submitted; answers, account state and API configuration are never read.
function mountJargonFeedback(){
 if(document.getElementById('jargon-feedback-dialog'))return;
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const trigger=make('button','反馈','secondary jargon-feedback-trigger');trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');
 const header=document.querySelector('.project-heading');if(!header)return;header.append(trigger);
 const dialog=make('dialog',undefined,'jargon-feedback-dialog');dialog.id='jargon-feedback-dialog';dialog.setAttribute('aria-labelledby','jargon-feedback-title');
 const heading=make('div',undefined,'jargon-feedback-heading'),title=make('h2','帮助我们改进黑话工具');title.id='jargon-feedback-title';const close=make('button','关闭 ×','secondary');close.type='button';heading.append(title,close);
 const form=make('form'),kind=make('select'),context=make('input'),message=make('textarea'),contact=make('input'),position=make('p','','jargon-feedback-position'),note=make('p','反馈提交到当前站点的收件服务。仅包含本表单和页面位置，不包含练习原答。使用内置本地服务时，反馈保存在本机。','quiet');
 for(const name of ['内容纠错','关系建议','使用问题','其他建议']){const option=make('option',name);option.value=name;kind.append(option);}
 const field=(id,text,input)=>{const label=make('label',text);label.htmlFor=id;input.id=id;form.append(label,input);};
 field('jargon-feedback-kind','反馈类型',kind);field('jargon-feedback-context','相关术语或专题（可修改）',context);context.maxLength=160;field('jargon-feedback-message','哪里有问题，或希望怎样改进？',message);message.maxLength=2000;message.rows=5;message.required=true;message.placeholder='例如：RAG 的这个例子容易让人误解，我建议……';field('jargon-feedback-contact','联系方式（选填）',contact);contact.maxLength=120;contact.autocomplete='off';
 const status=make('p');status.id='jargon-feedback-status';status.setAttribute('role','status');const submit=make('button','提交反馈','primary');submit.type='submit';const actions=make('div',undefined,'jargon-feedback-actions');actions.append(submit);form.append(position,note,actions,status);dialog.append(heading,form);document.body.append(dialog);
 let page='',key='',requestKey='',signature='',busy=false,receipt='';
 const values=()=>({kind:kind.value,context:context.value.trim(),message:message.value.trim(),contact:contact.value.trim(),page});
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({values:values(),requestKey,signature,receipt}));return true;}catch{return false;}};
 const state=()=>{const p=new URLSearchParams(location.search),safe=new URLSearchParams();for(const name of ['topic','node','term','exercise']){const v=p.get(name);if(v&&/^[a-z0-9-]{1,80}$/.test(v))safe.set(name,v);}return location.pathname+(safe.size?'?'+safe:'');};
 trigger.onclick=()=>{if(busy){dialog.showModal();return;}page=state();key='jargon:feedback:draft:v1:'+page;let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null');}catch{}kind.value=saved?.values?.kind||'内容纠错';context.value=saved?.values?.context||[...document.querySelectorAll('#canvas-detail-title,#term,#topic-active-title,.lookup-entry.is-target h2')].find(n=>n.getClientRects().length&&n.textContent.trim())?.textContent||'';message.value=saved?.values?.message||'';contact.value=saved?.values?.contact||'';requestKey=saved?.requestKey||'';signature=saved?.signature||'';receipt=saved?.receipt||'';position.textContent='页面位置：'+page;status.textContent=receipt?'此前已收到，编号：'+receipt:'关闭后草稿仍保留在当前浏览器。';submit.disabled=!!receipt;submit.textContent=receipt?'这份反馈已收到':'提交反馈';trigger.setAttribute('aria-expanded','true');dialog.showModal();};
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{save();trigger.setAttribute('aria-expanded','false');trigger.focus();});
 form.addEventListener('input',()=>{if(busy)return;receipt='';submit.disabled=false;submit.textContent='提交反馈';status.textContent=save()?'草稿已保存在当前浏览器。':'浏览器无法保存草稿，请保留此窗口。';});
 form.onsubmit=async event=>{event.preventDefault();if(busy)return;const feedback=values();if(!feedback.message){status.textContent='请填写具体反馈内容。';message.focus();return;}const next=JSON.stringify(feedback);if(signature!==next){requestKey=crypto.randomUUID();signature=next;}if(!save()){status.textContent='草稿无法保存，请先复制反馈内容，再重试。';return;}

  busy=true;submit.disabled=true;submit.textContent='正在提交…';for(const field of [kind,context,message,contact])field.disabled=true;
  try{const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json','X-Jargon-Feedback':'1'},credentials:'omit',body:JSON.stringify({request_key:requestKey,feedback}),signal:AbortSignal.timeout(8000)});const data=await response.json();if(!response.ok)throw Error(data.error||'收件未确认');if(typeof data.id!=='string'||data.status!=='received')throw Error('收件结果格式不正确');receipt=data.id;save();status.textContent='已收到反馈，编号：'+receipt+'。感谢帮助我们改进。';submit.textContent='这份反馈已收到';}
  catch(error){status.textContent='尚未确认收到，草稿仍保留。'+(error.message==='Failed to fetch'?'反馈服务暂未连接。':error.message||'请稍后重试。');submit.textContent='重试提交';}
  finally{busy=false;for(const field of [kind,context,message,contact])field.disabled=false;submit.disabled=!!receipt;}
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountJargonFeedback,{once:true});else mountJargonFeedback();
