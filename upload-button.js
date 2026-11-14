/* OTICS Document Hub: safe add-PDF shortcut, GitHub Pages version */
(()=>{
  'use strict';
  const UPLOAD_URL='https://github.com/wongong11-ui/otics-document-hub/upload/main';
  function setup(){
    const toolbar=document.querySelector('#documents .toolbar');
    if(!toolbar || document.getElementById('addPdfButton')) return;
    const style=document.createElement('style');
    style.textContent=`
      #addPdfButton{display:inline-flex;align-items:center;justify-content:center;gap:8px;
        padding:11px 18px;min-height:44px;border-radius:13px;border:1px solid #e9bd72;
        background:linear-gradient(110deg,#ffe0a1,#d89c44);color:#15263d;font:500 14px Mitr,system-ui,sans-serif;
        white-space:nowrap;text-decoration:none;box-shadow:0 4px 20px #e5ad4220;transition:filter .2s,transform .2s}
      #addPdfButton:hover{filter:brightness(1.08);transform:translateY(-1px)}
      #addPdfButton:focus-visible{outline:2px solid #9ae7ff;outline-offset:3px}
      @media(max-width:550px){#addPdfButton{flex:1}}
    `;
    document.head.appendChild(style);
    const button=document.createElement('a');
    button.id='addPdfButton';
    button.href=UPLOAD_URL;
    button.target='_blank';
    button.rel='noopener noreferrer';
    button.textContent='＋ เพิ่มไฟล์ PDF';
    button.title='เปิด GitHub เพื่อเลือกไฟล์ PDF แล้วกด Commit changes (ต้องเข้าสู่ระบบ GitHub ที่มีสิทธิ์)';
    button.setAttribute('aria-label','เพิ่มไฟล์ PDF ผ่าน GitHub');
    const refresh=document.getElementById('refresh');
    if(refresh && refresh.parentElement===toolbar) toolbar.insertBefore(button,refresh);
    else toolbar.appendChild(button);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup);
  else setup();
})();
