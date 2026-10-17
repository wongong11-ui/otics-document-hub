/**
 * Public document listing endpoint for Electrical Training Hub.
 * Deploy as Web App (Execute as: Me, Who has access: Anyone).
 * The returned file list is PUBLIC. Never use for confidential files.
 * Google Drive permissions must separately permit public PDF viewing.
 */
const FOLDER_ID = '1Tq5YQZSR4QQ9pqS-yjLN2YKzZ1M3ckh2';

function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if (!/^[$A-Z_a-z][$\w]*$/.test(callback) || callback.length > 80) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Invalid callback'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  let payload;
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const items = folder.getFiles();
    const files = [];
    while (items.hasNext()) {
      const file = items.next();
      const isPdf = file.getMimeType() === MimeType.PDF || /\.pdf$/i.test(file.getName());
      if (!isPdf || file.isTrashed()) continue;
      files.push({id:file.getId(), title:file.getName().replace(/\.pdf$/i,''), category:'เอกสารอบรม', updated:file.getLastUpdated().toISOString()});
    }
    files.sort((a,b)=>a.title.localeCompare(b.title,'th'));
    payload = {ok:true, files:files};
  } catch (error) {
    console.error(error);
    payload = {ok:false, error:'Cannot access Google Drive folder'};
  }
  // JSONP allows a static GitHub Pages frontend to load a public file list.
  // Never return file content, user credentials or private information here.
  return ContentService.createTextOutput(callback+'('+JSON.stringify(payload).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
