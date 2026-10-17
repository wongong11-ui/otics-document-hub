# ศูนย์เอกสารหลักสูตรการบริหารจัดการทักษะไฟฟ้าอุตสาหกรรม
Industrial Electrical Training Hub — GitHub PDF Edition

วิธีใหม่: ใช้ GitHub อย่างเดียว ไม่ต้องใช้ Google Drive หรือ Google Apps Script

เว็บไซต์ของคุณ (หลังอัปโหลดไฟล์ครบ):
https://wongong11-ui.github.io/otics-document-hub/

ขั้นตอนที่ 1 อัปเดตหน้าเว็บ
1. แตก ZIP นี้ก่อน
2. เข้า https://github.com/wongong11-ui/otics-document-hub
3. กด Add file > Upload files
4. อัปโหลด index.html และ app.js และโฟลเดอร์ assets (ไฟล์ assets/course-cover.png)
5. หาก GitHub แสดงว่ามีชื่อไฟล์ซ้ำ ให้เลือกแทนที่ไฟล์เดิม จากนั้น Commit changes
6. โฟลเดอร์ pdfs สร้างได้โดยอัปโหลดไฟล์ .gitkeep ภายใน pdfs ตามโครงสร้าง

ขั้นตอนที่ 2 เพิ่ม PDF
1. ไปที่โฟลเดอร์ pdfs ใน Repository (หรือจะอัปโหลด PDF ไว้ที่ root ก็รองรับ)
2. กด Add file > Upload files
3. เลือก PDF เช่น 01-บทนำ.pdf หรือ 02-ความปลอดภัย.pdf
4. กด Commit changes
5. รอ GitHub Pages เผยแพร่ประมาณ 1-5 นาที แล้วเปิดเว็บ กด รีเฟรช
6. รายชื่อ PDF จะปรากฏโดยอัตโนมัติ กดอ่านได้ในหน้าเว็บ

รองรับแยกหมวดหมู่ด้วยโฟลเดอร์ย่อยใน pdfs เช่น
pdfs/บทที่ 1/การป้องกันไฟฟ้าดูด.pdf
pdfs/บทที่ 2/มอเตอร์ไฟฟ้า.pdf

ปุ่มลิงก์ 🔗 จะคัดลอก URL ที่เปิด PDF ไฟล์นั้นบนเว็บโดยตรง ใช้ทำ QR Code แยกเอกสารได้

ไฟล์ที่จำเป็น:
- index.html  หน้าเว็บไซต์หลัก
- app.js      โหลดรายการ PDF ผ่าน GitHub API สาธารณะ ไม่ต้องมี token
- assets/course-cover.png  ภาพปกจากที่ส่งมา
- pdfs/.gitkeep  ไฟล์ช่วยสร้างโฟลเดอร์ pdfs (จะลบหลังมี PDF ก็ได้)

ไฟล์เก่าที่เลิกใช้: config.js, GoogleAppsScript.gs, documents.js และ README ของ OTICS
ไม่จำเป็นต้องลบทันที แต่แนะนำให้ลบเพื่อไม่ให้สับสน

ข้อจำกัด:
- Repository เป็น Public = PDF ทุกไฟล์เป็นสาธารณะ ไม่เหมาะกับไฟล์ลับ
- GitHub อนุญาตอัปโหลดผ่านเว็บไม่เกิน 25 MiB ต่อไฟล์
- GitHub API สาธารณะมี rate limit (โดยทั่วไป 60 ครั้ง/ชั่วโมงต่อ IP) โปรแกรมแคชข้อมูลไว้ 10 นาทีต่อแท็บ เพื่อลดการเรียก API
- GitHub Pages อาจใช้เวลาสักครู่ในการเผยแพร่ไฟล์ PDF ใหม่
- การฝัง PDF ในมือถือบางรุ่นอาจไม่สมบูรณ์ สามารถกด 'เปิด PDF ในแท็บใหม่'
- เว็บไซต์สร้างบน Repo เดิม จึงยังมี /otics-document-hub/ ใน URL แต่หน้าเว็บจะเป็นหลักสูตรส่วนตัว ไม่ใช้แบรนด์ OTICS

หมายเหตุ หากเปลี่ยนชื่อ Repo ในอนาคต ต้องแก้ชื่อ Repo ในบรรทัด REPO ของ app.js ด้วย
