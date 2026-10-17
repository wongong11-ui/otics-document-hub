OTICS DOCUMENT HUB — วิธีติดตั้งฟรี ไม่มีโดเมน
==============================================

1) เตรียม PDF
- อัปโหลดไฟล์ PDF ไปยัง Google Drive
- คลิก Share > General access > Anyone with the link > Viewer
- คัดลอกลิงก์ของ 'ไฟล์ PDF' ไม่ใช่ลิงก์โฟลเดอร์
- ตัวอย่าง https://drive.google.com/file/d/ABC123/view?usp=sharing
  รหัส driveId = ABC123

2) เพิ่มข้อมูลใน documents.js
เปิดไฟล์ documents.js ด้วย Notepad หรือ VS Code เปลี่ยนรายการให้เป็นแบบนี้:
window.OTICS_DOCUMENTS = [
  { id: 'hr-handbook', title: 'คู่มือพนักงาน', category: 'HR', description: 'คู่มือและข้อควรรู้', driveId: 'ABC123' },
  { id: 'safety-policy', title: 'นโยบายความปลอดภัย', category: 'Safety', description: 'เอกสารความปลอดภัย', driveId: 'XYZ456' }
];
* id ต้องไม่ซ้ำกัน และควรใช้ตัวอักษรภาษาอังกฤษ ตัวเลข -
* ตัวอย่างด้านบนต้องเปลี่ยน ABC123, XYZ456 เป็นรหัสไฟล์จริง
* ไม่ใส่ข้อมูลลับหรือเอกสารภายในที่ห้ามเผยแพร่

3) เผยแพร่ด้วย GitHub Pages ฟรี
- สมัคร/เข้า https://github.com
- สร้าง New repository ชื่อ otics-document-hub เลือก Public
- เลือก Add file > Upload files แล้วอัปโหลด index.html และ documents.js (ให้อยู่ระดับบนสุด)
- Commit changes
- Settings > Pages > Build and deployment > Deploy from a branch
- เลือก Branch: main / (root) แล้วกด Save
- เว็บไซต์จะมีหน้าตาคล้าย https://YOUR_USERNAME.github.io/otics-document-hub/
- ตรวจสอบ URL จริงจาก Settings > Pages หลัง publish

4) ทำ QR Code
- สร้าง QR จากลิงก์เว็บไซต์ที่เผยแพร่แล้ว
- QR ไปหน้ารวมเอกสาร: https://YOUR_USERNAME.github.io/otics-document-hub/
- QR ไปเอกสารเฉพาะ: https://YOUR_USERNAME.github.io/otics-document-hub/?doc=hr-handbook
- คุณสามารถส่งลิงก์จริงมาให้ ChatGPT ช่วยทำ QR Code ได้

5) วิธีอัปเดตภายหลัง
- เปลี่ยน documents.js แล้วอัปโหลด/Commit ที่ GitHub
- ถ้าแก้ไฟล์ PDF ใน Google Drive โดยรักษาไฟล์ ID เดิม เว็บและ QR เดิมยังใช้ได้
- GitHub Pages เป็นเว็บ static ไม่มี backend, ไม่มี login, ไม่มีประวัติการอ่าน

หมายเหตุ
- Google Drive เป็นผู้ให้บริการพรีวิว PDF ภายใน iframe อาจมีบางเบราว์เซอร์หรือการตั้งค่าสิทธิ์ที่ทำให้พรีวิวไม่ได้; มีปุ่ม "เปิดต้นฉบับ" เป็นทางเลือก
- เว็บไซต์นี้เป็น public และ PDF ต้องเปิดสิทธิ์ public เช่นกัน
- ใช้งานฟรีภายใต้ข้อจำกัด/เงื่อนไขของบริการ GitHub Pages และ Google Drive
