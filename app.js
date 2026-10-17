/* Industrial Electrical Training Hub — GitHub-only PDF catalog
   Public repository: wongong11-ui/otics-document-hub, branch main.
   Upload PDFs to /pdfs/ (including optional subfolders) or repository root.
   The browser lists public files using GitHub's read-only Git Trees API.
*/
(()=>{
  'use strict';
  const REPO={owner:'wongong11-ui',name:'otics-document-hub',branch:'main'};
  const API=`https://api.github.com/repos/${REPO.owner}/${REPO.name}/git/trees/${encodeURIComponent(REPO.branch)}?recursive=1`;
  const PDF_FOLDER=`https://github.com/${REPO.owner}/${REPO.name}/tree/${REPO.branch}/pdfs`;
  const CACHE_KEY=`electrical-docs:${REPO.owner}/${REPO.name}:${REPO.branch}`;
  const CACHE_MS=10*60*1000;
  const grid=document.getElementById('docGrid');
  const status=document.getElementById('status');
  const input=document.getElementById('search');
  const category=document.getElementById('category');
  const viewer=document.getElementById('viewer');
  const frame=document.getElementById('pdfFrame');
  const original=document.getElementById('openOriginal');
  let docs=[];
  let currentDoc=null;
  let fetching=false;

  function elt(tag, className='', content){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(content!==undefined)node.textContent=String(content);
    return node;
  }
  function notify(text){
    const node=document.getElementById('toast');
    node.textContent=text;
    node.classList.add('on');
    clearTimeout(notify.timer);
    notify.timer=setTimeout(()=>node.classList.remove('on'),2700);
  }
  function setStatus(text,error=false){
    status.textContent=text;
    status.classList.toggle('err',error);
  }
  function urlForFile(path){
    // Encodes each segment while preserving '/'; works for Thai and spaced filenames.
    const safePath=path.split('/').map(encodeURIComponent).join('/');
    return new URL(safePath,new URL('.',location.href)).href;
  }
  function deepLink(path){
    const url=new URL(location.href);
    url.searchParams.set('doc',path);
    url.hash='';
    return url.href;
  }
  function docTitle(path){
    const file=path.split('/').pop().replace(/\.pdf$/i,'');
    return file.replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function docCategory(path){
    const p=path.split('/');
    if(p[0].toLowerCase()==='pdfs')p.shift();
    return p.length>1?p.slice(0,-1).join(' / '):'เอกสารทั่วไป';
  }
  function buildDocs(tree){
    return (Array.isArray(tree)?tree:[])
      .filter(e=>e&&e.type==='blob'&&typeof e.path==='string'&&/\.pdf$/i.test(e.path)&&!e.path.split('/').some(s=>s.startsWith('.')))
      .map(e=>({path:e.path,title:docTitle(e.path),category:docCategory(e.path),size:e.size||0}))
      .sort((a,b)=>a.title.localeCompare(b.title,'th',{numeric:true,sensitivity:'base'}));
  }
  function sizeText(bytes){
    return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':bytes>=1024?Math.ceil(bytes/1024)+' KB':'';
  }
  function render(){
    grid.replaceChildren();
    const term=input.value.toLocaleLowerCase().trim();
    const chosen=category.value;
    const filtered=docs.filter(doc=>(chosen==='all'||doc.category===chosen)&&[doc.title,doc.category,doc.path].some(x=>x.toLocaleLowerCase().includes(term)));
    if(!filtered.length){
      const box=elt('div','panel empty');
      box.append(elt('h3','',docs.length?'ไม่พบเอกสารที่ค้นหา':'ยังไม่มีไฟล์ PDF ให้เปิดอ่าน'));
      box.append(elt('p','',docs.length?'ลองเปลี่ยนคำค้นหาหรือเลือกหมวดอื่น':'ให้อัปโหลดไฟล์ PDF ลงในโฟลเดอร์ pdfs ของ GitHub Repository แล้วกดรีเฟรช หน้าเว็บจะดึงรายการมาให้อัตโนมัติ'));
      if(!docs.length){
        const link=elt('a','btn','เปิดโฟลเดอร์ PDF บน GitHub ↗');
        link.href=PDF_FOLDER;link.target='_blank';link.rel='noopener noreferrer';
        box.append(link);
      }
      grid.append(box);
      return;
    }
    for(const doc of filtered){
      const card=elt('article','panel doc');
      const top=elt('div','doc-top');
      top.append(elt('span','pdficon','PDF'),elt('span','tag',doc.category));
      const head=elt('h3','',doc.title);
      const desc=elt('small','',sizeText(doc.size)||'เอกสารประกอบการอบรม');
      const actions=elt('div','doc-actions');
      const open=elt('button','','เปิดอ่าน PDF →');
      open.type='button';open.addEventListener('click',()=>openPdf(doc,true));
      const share=elt('button','','🔗');
      share.type='button';share.title='คัดลอกลิงก์ตรงไปยังเอกสาร';
      share.setAttribute('aria-label','คัดลอกลิงก์ '+doc.title);
      share.addEventListener('click',()=>copyLink(deepLink(doc.path)));
      actions.append(open,share);
      card.append(top,head,desc,actions);
      grid.append(card);
    }
  }
  function setDocs(all){
    docs=all;
    document.getElementById('totalCount').textContent=String(docs.length);
    const previous=category.value;
    const groups=[...new Set(docs.map(d=>d.category))].sort((a,b)=>a.localeCompare(b,'th'));
    category.replaceChildren(new Option('ทั้งหมด','all'),...groups.map(group=>new Option(group,group)));
    category.value=groups.includes(previous)?previous:'all';
    render();
    // Deep links can open the reader immediately after catalog loads.
    const docQuery=new URL(location.href).searchParams.get('doc');
    if(docQuery&&!currentDoc){
      const found=docs.find(d=>d.path===docQuery);
      if(found)openPdf(found,false);
    }
  }
  function cachedDocs(){
    try{
      const cached=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if(cached&&Date.now()-cached.time<CACHE_MS&&Array.isArray(cached.docs))return cached.docs;
    }catch(_){/* disabled storage */}
    return null;
  }
  async function fetchDocs(force=false){
    if(fetching)return;
    const stored=!force?cachedDocs():null;
    if(stored){setDocs(stored);setStatus('พร้อมอ่าน • ข้อมูลแคชไม่เกิน 10 นาที');return;}
    fetching=true;
    setStatus('กำลังอ่านไฟล์ PDF จาก GitHub…');
    try{
      const res=await fetch(API,{headers:{'Accept':'application/vnd.github+json'}});
      if(!res.ok){
        if(res.status===403||res.status===429)throw new Error('GitHub จำกัดจำนวนการเรียก API ชั่วคราว กรุณาลองใหม่ภายหลัง');
        throw new Error('โหลดรายการไฟล์ไม่สำเร็จ (HTTP '+res.status+')');
      }
      const data=await res.json();
      const parsed=buildDocs(data.tree);
      setDocs(parsed);
      try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({time:Date.now(),docs:parsed}));}catch(_){/* disabled storage */}
      setStatus(data.truncated?'ไฟล์จำนวนมาก: รายการอาจแสดงไม่ครบ':parsed.length?'แสดง '+parsed.length+' เอกสาร • พร้อมอ่าน':'ยังไม่มี PDF ใน Repository',!!data.truncated);
    }catch(error){
      setStatus(error.message||'เชื่อม GitHub ไม่สำเร็จ',true);
      if(!docs.length)render();
    }finally{fetching=false;}
  }
  function openPdf(doc,updateUrl){
    currentDoc=doc;
    document.getElementById('viewerTitle').textContent=doc.title;
    const url=urlForFile(doc.path);
    frame.src=url+'#view=FitH&toolbar=1';
    original.href=url;
    viewer.classList.add('open');
    document.body.style.overflow='hidden';
    if(updateUrl)history.pushState({pdf:doc.path},'',deepLink(doc.path));
  }
  function closePdf(){
    viewer.classList.remove('open');
    frame.src='about:blank';
    document.body.style.overflow='';
    currentDoc=null;
    const url=new URL(location.href);
    if(url.searchParams.has('doc')){
      url.searchParams.delete('doc');
      history.replaceState({},'',url);
    }
  }
  async function copyLink(text){
    try{
      await navigator.clipboard.writeText(text);
      notify('คัดลอกลิงก์เอกสารแล้ว');
    }catch(_){
      window.prompt('คัดลอกลิงก์นี้',text);
    }
  }
  document.getElementById('closeViewer').addEventListener('click',closePdf);
  document.getElementById('copyViewerLink').addEventListener('click',()=>currentDoc&&copyLink(deepLink(currentDoc.path)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&currentDoc)closePdf();});
  window.addEventListener('popstate',()=>{
    const desired=new URL(location.href).searchParams.get('doc');
    if(!desired&&currentDoc)closePdf();
    else if(desired&&(!currentDoc||desired!==currentDoc.path)){
      const found=docs.find(d=>d.path===desired);
      if(found)openPdf(found,false);
    }
  });
  input.addEventListener('input',render);
  category.addEventListener('change',render);
  document.getElementById('refresh').addEventListener('click',()=>fetchDocs(true));
  render();
  fetchDocs();
})();
