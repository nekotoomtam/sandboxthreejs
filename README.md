# ThreeLab — Three.js Learning Sandbox

เว็บสอน Three.js ผ่านคลังแนวคิด บทเรียนแบบ interactive, Code Lab และโจทย์ที่ตรวจจาก state ของฉากจริง

## เริ่มใช้งาน

ต้องใช้ Node.js 20 ขึ้นไป

```bash
npm install
npm run dev
```

คำสั่งตรวจคุณภาพ:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

ครั้งแรกที่รัน E2E test ให้ติดตั้ง Chromium ของ Playwright ก่อน:

```bash
npx playwright install chromium
```

## Architecture

```text
Lesson data (plain TypeScript data)
            ↓
SandboxSceneDefinition
            ↓
React adapter (SandboxCanvas)
            ↓
SandboxRuntime
            ↓
Native Three.js
```

- `src/lessons` เก็บ model, registry และเนื้อหาบทเรียน โดยไม่เรียก Three.js โดยตรง
- `src/concepts` เป็นแหล่งกลางสำหรับคำอธิบาย โค้ดขั้นต่ำ จุดที่มักพลาด และลิงก์เอกสารทางการ
- `src/sandbox/runtime` เป็นเจ้าของ lifecycle ของ scene, camera, renderer และ OrbitControls
- `src/sandbox/code` รันโค้ดของผู้เรียนใน Web Worker ที่ถูกสร้างและยกเลิกแยกจากหน้าเว็บ
- `src/exercises` ตรวจคำตอบจาก `SandboxSnapshot` ไม่ตรวจรูปแบบโค้ดของผู้เรียน
- `src/components/SandboxWorkspace.tsx` เชื่อม canvas, camera HUD, transform controls, Code Lab และแบบฝึกหัดเข้าด้วยกัน
- `tests/e2e` ตรวจเส้นทางผู้เรียนสำคัญผ่าน browser จริง

## การเพิ่มบทเรียน

1. สร้างไฟล์บทเรียนใน `src/lessons/content`
2. กำหนดเนื้อหา, scene configuration และ exercise validator id
3. เพิ่มบทเรียนเข้า registry ใน `src/lessons/lesson.registry.ts`
4. ถ้ามีโจทย์ใหม่ ให้เพิ่ม validator ใน `src/exercises/validator.registry.ts`

Runtime ไม่ควรมีเงื่อนไขเฉพาะบทเรียน และ lesson data ไม่ควร import `three` เพื่อให้เพิ่มหัวข้อใหม่ได้โดยไม่ผูกสองส่วนเข้าหากัน

## เส้นทางการเรียนรู้

```text
Concept Library → ปรับค่า → เห็นโค้ด → เขียนเอง → Run → ตรวจจาก scene state
```

หน้า `/concepts` มีแนวคิดเริ่มต้น 13 เรื่อง แต่ละหน้าลิงก์กลับไปยังเอกสาร Three.js ทางการและใช้ Sandbox Runtime เดียวกับบทเรียน ส่วน Code Lab เตรียม `THREE`, `scene`, `camera` และ `cube` ให้ผู้เรียนในบทแรก เพื่อลด boilerplate ก่อนเพิ่มความยากในบทถัดไป
