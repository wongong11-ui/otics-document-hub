/* OTICS Document Hub - robust GitHub PDF listing (2026-11-14)
   Works for PDF files in repository root and /pdfs/ or any subfolder.
   Public/read-only GitHub API; no tokens, secrets, or server required.
*/
(() => {
  'use strict';
  const OWNER='wongong11-ui', REPO='otics-document-hub', BRANCH='main';
  const API_ROOT=`https://api.github.com/repos/${OWNER}/${REPO}`;
  const TREE_URL=`${API_ROOT}/git/trees/${BRANCH}?recursive=1`;
  const ROOT_URL=`${API_ROOT}/contents?ref=${BRANCH}`;
  const CACHE_KEY=`otics-pdf-docs-v2:${OWNER}/${REPO}/${BRANCH}`;
  const CACHE_MAX_AGE=10*60*1000;
  const UPLOAD_URL=`https://github.com/${OWNER}/${REPO}/upload/${BRANCH}`;

  const byId=id=>document.getElementById(id);
  const grid=byId('docGrid'), status=byId('status'), search=byId('search');
  const category=byId('category'), viewer=byId('viewer'), frame=byId('pdfFrame');
  const original=byId('openOriginal'), total=byId('totalCount');
  if(!grid||!status||!search||!category||!viewer||!frame||!original||!total){
    console.error('[OTICS] Missing required page elements; check index.html');
    return;
  }
  let docs=[], currentDoc=null, busy=false;
  const make=(tag,className='',text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  const setStatus=(message,error=false)=>{
    status.textContent=message;status.classList.toggle('err',error);
  };
  const notify=message=>{
    const t=byId('toast'); if(!t)return;
    t.textContent=message;t.classList.add('on');
    clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('on'),2700);
  };
  const fileUrl=path=>new URL(path.split('/').map(encodeURIComponent).join('/'),new URL('.',location.href)).href;
  const deepLink=path=>{const u=new URL(location.href);u.searchParams.set('doc',path);u.hash='';return u.href;};
  const titleOf=path=>path.split('/').pop().replace(/\.pdf$/i,'').replace(/_+/g,' ').replace(/\s+/g,' ').trim();
  const categoryOf=path=>{
    const parts=path.split('/');if(parts[0].toLowerCase()==='pdfs')parts.shift();
    return parts.length>1?parts.slice(0,-1).join(' / '):'เอกสารทั่วไป';
  };
  const prettySize=bytes=>bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':bytes>=1024?Math.ceil(bytes/1024)+' KB':'';
  const normalize=list=>{
    const paths=new Map();
    for(const e of list){
      if(!e||typeof e.path!=='string'||!(/\.pdf$/i.test(e.path)))continue;
      if(e.path.split('/').some(p=>p.startsWith('.')))continue;
      paths.set(e.path,{path:e.path,title:titleOf(e.path),category:categoryOf(e.path),size:Number(e.size)||0});
    }
    return [...paths.values()].sort((a,b)=>a.title.localeCompare(b.title,'th',{numeric:true,sensitivity:'base'}));
  };
  async function requestJson(url){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
    try{
      const res=await fetch(url,{signal:controller.signal,headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
      if(!res.ok)throw new Error(`GitHub API HTTP ${res.status}`);
      return await res.json();
    }finally{clearTimeout(timer);}
  }
  async function readContents(path='',depth=0){
    if(depth>6)return [];
    const url=path?`${API_ROOT}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${BRANCH}`:ROOT_URL;
    const data=await requestJson(url);
    if(!Array.isArray(data))return [];
    const files=data.filter(e=>e.type==='file').map(e=>({path:e.path,size:e.size}));
    for(const folder of data.filter(e=>e.type==='dir'&&!e.name.startsWith('.'))){
      try{files.push(...await readContents(folder.path,depth+1));}
      catch(e){console.warn('[OTICS] Folder unavailable:',folder.path,e.message);}
    }
    return files;
  }
  async function loadDocs(){
    try{
      const tree=await requestJson(TREE_URL);
      if(!Array.isArray(tree.tree))throw new Error('GitHub returned an invalid file list');
      if(tree.truncated)throw new Error('File list truncated');
      return normalize(tree.tree.filter(e=>e.type==='blob'));
    }catch(primaryError){
      console.warn('[OTICS] Git Trees request failed; trying Contents API:',primaryError);
      try{return normalize(await readContents());}
      catch(fallbackError){
        console.error('[OTICS] Both GitHub listing methods failed:',fallbackError);
        throw new Error(/403|429/.test(primaryError.message+' '+fallbackError.message)
          ?'GitHub จำกัดการเรียก API ชั่วคราว กรุณาลองใหม่ภายหลัง'
          :'โหลดรายการ PDF ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อหรือกดรีเฟรช');
      }
    }
  }
  function readCache(){
    try{const c=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');return c&&Array.isArray(c.docs)?c:null;}
    catch{return null;}
  }
  function saveCache(items){
    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({time:Date.now(),docs:items}));}catch{}
  }
  function render(){
    grid.replaceChildren();
    const term=search.value.toLocaleLowerCase().trim(), group=category.value;
    const visible=docs.filter(d=>(group==='all'||d.category===group)&&[d.title,d.category,d.path].some(s=>s.toLocaleLowerCase().includes(term)));
    if(!visible.length){
      const box=make('div','panel empty');
      box.append(make('h3','',docs.length?'ไม่พบเอกสารที่ค้นหา':'ยังไม่มีไฟล์ PDF ให้เปิดอ่าน'));
      box.append(make('p','',docs.length?'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดอื่น':'เพิ่มไฟล์ PDF ใน GitHub Repository แล้วกดปุ่มรีเฟรช'));
      if(!docs.length){const a=make('a','btn','เพิ่มไฟล์ PDF บน GitHub ↗');a.href=UPLOAD_URL;a.target='_blank';a.rel='noopener noreferrer';box.append(a);}
      grid.append(box);return;
    }
    for(const d of visible){
      const card=make('article','panel doc'), top=make('div','doc-top');
      top.append(make('span','pdficon','PDF'),make('span','tag',d.category));
      const actions=make('div','doc-actions');
      const open=make('button','','เปิดอ่าน PDF →');open.type='button';open.addEventListener('click',()=>openPdf(d,true));
      const share=make('button','','🔗');share.type='button';share.title='คัดลอกลิงก์ตรงไปยังเอกสาร';
      share.setAttribute('aria-label','คัดลอกลิงก์ '+d.title);share.addEventListener('click',()=>copyLink(deepLink(d.path)));
      actions.append(open,share);
      card.append(top,make('h3','',d.title),make('small','',prettySize(d.size)||'เอกสารประกอบการอบรม'),actions);
      grid.append(card);
    }
  }
  function updateDocs(items){
    docs=items;total.textContent=String(items.length);
    const prior=category.value;
    const groups=[...new Set(items.map(d=>d.category))].sort((a,b)=>a.localeCompare(b,'th'));
    category.replaceChildren(new Option('ทั้งหมด','all'),...groups.map(g=>new Option(g,g)));
    category.value=groups.includes(prior)?prior:'all';render();
    const requested=new URL(location.href).searchParams.get('doc');
    if(requested&&!currentDoc){const hit=docs.find(d=>d.path===requested);if(hit)openPdf(hit,false);}
  }
  async function refresh(force=false){
    if(busy)return;
    const cached=readCache();
    if(!force&&cached&&Date.now()-cached.time<CACHE_MAX_AGE){
      updateDocs(cached.docs);setStatus(`แสดง ${docs.length} เอกสาร • ข้อมูลแคชไม่เกิน 10 นาที`);return;
    }
    busy=true;setStatus('กำลังอ่านรายการ PDF จาก GitHub…');
    try{
      const found=await loadDocs();updateDocs(found);saveCache(found);
      setStatus(found.length?`แสดง ${found.length} เอกสาร • พร้อมอ่าน`:'ไม่พบ PDF ใน Repository');
    }catch(err){
      if(cached){updateDocs(cached.docs);setStatus(`กำลังแสดงข้อมูลสำรอง ${docs.length} เอกสาร • GitHub เชื่อมต่อไม่ได้`,true);}
      else{updateDocs([]);setStatus(err.message||'โหลดรายการ PDF ไม่สำเร็จ',true);}
      console.error('[OTICS] Document loading error:',err);
    }finally{busy=false;}
  }
  function openPdf(d,push){
    currentDoc=d;byId('viewerTitle').textContent=d.title;
    const url=fileUrl(d.path);frame.src=url+'#view=FitH&toolbar=1';original.href=url;
    viewer.classList.add('open');document.body.style.overflow='hidden';
    if(push)history.pushState({pdf:d.path},'',deepLink(d.path));
  }
  function closePdf(){
    viewer.classList.remove('open');frame.src='about:blank';document.body.style.overflow='';currentDoc=null;
    const url=new URL(location.href);if(url.searchParams.has('doc')){url.searchParams.delete('doc');history.replaceState({},'',url);}
  }
  async function copyLink(value){
    try{await navigator.clipboard.writeText(value);notify('คัดลอกลิงก์เอกสารแล้ว');}
    catch{window.prompt('คัดลอกลิงก์นี้',value);}
  }
  byId('closeViewer')?.addEventListener('click',closePdf);
  byId('copyViewerLink')?.addEventListener('click',()=>currentDoc&&copyLink(deepLink(currentDoc.path)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&currentDoc)closePdf();});
  window.addEventListener('popstate',()=>{
    const desired=new URL(location.href).searchParams.get('doc');
    if(!desired&&currentDoc)closePdf();
    else if(desired&&(!currentDoc||desired!==currentDoc.path)){
      const hit=docs.find(d=>d.path===desired);if(hit)openPdf(hit,false);
    }
  });
  search.addEventListener('input',render);category.addEventListener('change',render);
  byId('refresh')?.addEventListener('click',()=>refresh(true));
  // Show a useful loading placeholder rather than an empty page.
  grid.append(make('div','panel empty','กำลังตรวจสอบเอกสาร PDF…'));
  refresh(false);
})();
