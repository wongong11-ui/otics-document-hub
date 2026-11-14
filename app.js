/* OTICS Document Hub - PDF catalog, resilient edition 2026-11-14.
   Public GitHub API only. No credentials needed or stored. */
(() => {
'use strict';
const OWNER='wongong11-ui', REPO='otics-document-hub', BRANCH='main';
const BASE=`https://api.github.com/repos/${OWNER}/${REPO}`;
const CACHE='otics-document-hub-pdfs-v3';
let docs=[], current=null, loading=false;
const $=id=>document.getElementById(id);
const $status=$('status'), grid=$('docGrid'), search=$('search'), category=$('category');
function status(msg,error=false){if($status){$status.textContent=msg;$status.classList.toggle('err',error);}}
function h(tag,cls,text){let e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;}
function niceName(path){return path.split('/').pop().replace(/\.pdf$/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim();}
function group(path){let parts=path.split('/');if(parts[0].toLowerCase()==='pdfs')parts.shift();return parts.length>1?parts.slice(0,-1).join(' / '):'เอกสารทั่วไป';}
function link(path){return new URL(path.split('/').map(encodeURIComponent).join('/'),`https://${OWNER}.github.io/${REPO}/`).href;}
function shareLink(path){let u=new URL(location.href);u.searchParams.set('doc',path);u.hash='';return u.href;}
function pretty(bytes){return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':bytes>=1024?Math.ceil(bytes/1024)+' KB':'';}
function toast(text){let el=$('toast');if(!el)return;el.textContent=text;el.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),3000);}
function setList(items){
 const unique=new Map();for(const file of items){if(file&&typeof file.path==='string'&&/\.pdf$/i.test(file.path)&&!file.path.split('/').some(x=>x.startsWith('.')))unique.set(file.path,{path:file.path,title:niceName(file.path),category:group(file.path),size:Number(file.size)||0});}
 docs=[...unique.values()].sort((a,b)=>a.title.localeCompare(b.title,'th',{numeric:true}));
 if($('totalCount'))$('totalCount').textContent=String(docs.length);
 if(category){let old=category.value;const groups=[...new Set(docs.map(x=>x.category))].sort((a,b)=>a.localeCompare(b,'th'));category.replaceChildren(new Option('ทั้งหมด','all'),...groups.map(g=>new Option(g,g)));category.value=groups.includes(old)?old:'all';}
 draw();const deep=new URL(location.href).searchParams.get('doc');if(deep&&!current){const found=docs.find(x=>x.path===deep);if(found)openPdf(found,false);}
}
function draw(){
 if(!grid)return;grid.replaceChildren();const q=(search?.value||'').toLocaleLowerCase().trim(),g=category?.value||'all';
 const visible=docs.filter(d=>(g==='all'||g===d.category)&&[d.title,d.path,d.category].some(s=>s.toLocaleLowerCase().includes(q)));
 if(!visible.length){let empty=h('div','panel empty');empty.append(h('h3','',docs.length?'ไม่พบเอกสารที่ค้นหา':'ยังไม่มีไฟล์ PDF ให้เปิดอ่าน'));empty.append(h('p','',docs.length?'ลองเปลี่ยนคำค้นหา':'ตรวจว่าไฟล์นามสกุล .pdf ถูกอัปโหลดและ Commit เข้า Repository แล้ว จากนั้นกดรีเฟรช'));grid.append(empty);return;}
 for(const d of visible){let card=h('article','panel doc'),top=h('div','doc-top'),buttons=h('div','doc-actions');top.append(h('span','pdficon','PDF'),h('span','tag',d.category));let open=h('button','','เปิดอ่าน PDF →'),share=h('button','','🔗');open.type=share.type='button';open.addEventListener('click',()=>openPdf(d,true));share.title='คัดลอกลิงก์';share.addEventListener('click',()=>copy(shareLink(d.path)));buttons.append(open,share);card.append(top,h('h3','',d.title),h('small','',pretty(d.size)||'เอกสารประกอบการอบรม'),buttons);grid.append(card);}
}
async function copy(txt){try{await navigator.clipboard.writeText(txt);toast('คัดลอกลิงก์เอกสารแล้ว');}catch(_){window.prompt('คัดลอกลิงก์',txt);}}
function openPdf(d,update){current=d;if($('viewerTitle'))$('viewerTitle').textContent=d.title;if($('pdfFrame'))$('pdfFrame').src=link(d.path)+'#view=FitH&toolbar=1';if($('openOriginal'))$('openOriginal').href=link(d.path);$('viewer')?.classList.add('open');document.body.style.overflow='hidden';if(update)history.pushState({pdf:d.path},'',shareLink(d.path));}
function closePdf(){ $('viewer')?.classList.remove('open');if($('pdfFrame'))$('pdfFrame').src='about:blank';document.body.style.overflow='';current=null;let u=new URL(location.href);if(u.searchParams.has('doc')){u.searchParams.delete('doc');history.replaceState({},'',u);}}
async function getJSON(url,ms=11000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
 try{const res=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/vnd.github+json'}});if(!res.ok)throw new Error('HTTP '+res.status);return await res.json();}finally{clearTimeout(timer);}
}
async function fromTree(){let data=await getJSON(`${BASE}/git/trees/${BRANCH}?recursive=1`);if(!Array.isArray(data.tree))throw new Error('ข้อมูล Git Tree ไม่ถูกต้อง');return data.tree.filter(x=>x.type==='blob').map(x=>({path:x.path,size:x.size}));}
async function fromContents(){
 let files=[];
 async function scan(path,depth){const data=await getJSON(`${BASE}/contents/${path?path.split('/').map(encodeURIComponent).join('/'):''}?ref=${BRANCH}`);if(!Array.isArray(data))return;for(const entry of data){if(entry.type==='file'&&/\.pdf$/i.test(entry.name))files.push({path:entry.path,size:entry.size});else if(entry.type==='dir'&&depth<4&&(path||entry.name.toLowerCase()==='pdfs'))await scan(entry.path,depth+1);}}
 await scan('',0);return files;
}
function lastCache(){try{let c=JSON.parse(localStorage.getItem(CACHE)||'null');return Array.isArray(c?.docs)?c.docs:null;}catch(_){return null;}}
function storeCache(data){try{localStorage.setItem(CACHE,JSON.stringify({time:Date.now(),docs:data}));}catch(_){}}
async function load(force=false){
 if(loading)return;loading=true;status('กำลังอ่านรายการ PDF จาก GitHub…');
 try{
  let found, method='Git Trees API';
  try{found=await fromTree();}catch(e){console.warn('Git Trees API ไม่สำเร็จ ลอง Contents API:',e);method='Contents API';found=await fromContents();}
  setList(found);storeCache(found);status(docs.length?`แสดง ${docs.length} เอกสาร • พร้อมอ่าน (${method})`:'ยังไม่พบไฟล์ PDF ใน Repository');
 }catch(error){console.error('OTICS Document Hub PDF load failed:',error);const cached=lastCache();if(cached?.length){setList(cached);status(`แสดง ${docs.length} เอกสารจากข้อมูลสำรอง • GitHub ยังเชื่อมต่อไม่ได้`,true);}else{setList([]);status('โหลดไฟล์ไม่ได้: '+(error?.message||'เกิดข้อผิดพลาด')+' • ตรวจการเชื่อมต่อ GitHub แล้วกดรีเฟรช',true);}}
 finally{loading=false;}
}
function init(){
 try{
  if(!grid||!$status){console.error('OTICS: missing #docGrid or #status');return;}
  $('closeViewer')?.addEventListener('click',closePdf);
  $('copyViewerLink')?.addEventListener('click',()=>current&&copy(shareLink(current.path)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current)closePdf();});
  window.addEventListener('popstate',()=>{const path=new URL(location.href).searchParams.get('doc');if(!path&&current)closePdf();else if(path&&(!current||current.path!==path)){const d=docs.find(x=>x.path===path);if(d)openPdf(d,false);}});
  search?.addEventListener('input',draw);category?.addEventListener('change',draw);$('refresh')?.addEventListener('click',()=>load(true));
  draw();load();
 }catch(err){console.error('OTICS initialization failed:',err);status('ระบบเริ่มทำงานไม่ได้: '+(err?.message||String(err)),true);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
