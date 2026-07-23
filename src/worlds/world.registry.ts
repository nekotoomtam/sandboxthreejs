import type { WorldDefinition, WorldId } from './world.types'

export const worldCatalog: readonly WorldDefinition[] = [
  {
    id: 'foundations',
    order: 1,
    title: 'พื้นฐานของโลก Three.js',
    eyebrow: 'WORLD 01 · FOUNDATIONS',
    description: 'สร้างฉาก กล้อง แสง และวัตถุชิ้นแรกให้เข้าใจจากผลลัพธ์จริง',
    imageSrc: '/assets/planets/planet-01-foundations.png',
    accent: '#c9b29a',
    travelColor: '#d59a5f',
    lessons: [
      {
        id: 'hello-threejs',
        lessonId: 'hello-threejs',
        title: 'Scene, Camera, Renderer',
        summary: 'ประกอบองค์ประกอบหลักและทดลองแก้โค้ดกับฉากจริง',
        status: 'available',
      },
      {
        id: 'object-transform',
        title: 'Position, Rotation, Scale',
        summary: 'ควบคุมตำแหน่ง การหมุน และขนาดของวัตถุ',
        status: 'coming-soon',
      },
      {
        id: 'light-and-shadow',
        title: 'Light and Shadow',
        summary: 'ใช้แสงและเงาเพื่อสร้างมิติให้ฉาก',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'controls',
    order: 2,
    title: 'การควบคุมและการเคลื่อนที่',
    eyebrow: 'WORLD 02 · CONTROLS',
    description: 'เชื่อมคีย์บอร์ด เวลา และทิศทางให้วัตถุเคลื่อนอย่างควบคุมได้',
    imageSrc: '/assets/planets/planet-02-controls.png',
    accent: '#6ca6c8',
    travelColor: '#5ba7e1',
    lessons: [
      {
        id: 'keyboard-state',
        title: 'Keyboard State',
        summary: 'ติดตามปุ่มที่กำลังกดอย่างต่อเนื่อง',
        status: 'coming-soon',
      },
      {
        id: 'delta-movement',
        title: 'Delta-time Movement',
        summary: 'ทำให้ความเร็วเท่ากันในทุกเฟรมเรต',
        status: 'coming-soon',
      },
      {
        id: 'camera-modes',
        title: 'Camera Modes',
        summary: 'แยกการควบคุมกล้องออกจากอินพุต',
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'integration',
    order: 3,
    title: 'โมเดล กล้อง และแอนิเมชัน',
    eyebrow: 'WORLD 03 · INTEGRATION',
    description: 'นำโมเดลจริงเข้าฉากและทำให้โมเดล กล้อง และแอนิเมชันทำงานร่วมกัน',
    imageSrc: '/assets/planets/planet-03-integration.png',
    accent: '#a792c8',
    travelColor: '#aeb3bf',
    lessons: [
      {
        id: 'model-loading',
        title: 'Loading GLTF / VRM',
        summary: 'โหลดโมเดลพร้อมสถานะและข้อผิดพลาด',
        status: 'coming-soon',
      },
      {
        id: 'animation-state',
        title: 'Animation State',
        summary: 'สลับ Idle และการเคลื่อนที่อย่างเป็นระบบ',
        status: 'coming-soon',
      },
      {
        id: 'follow-camera',
        title: 'Follow Camera',
        summary: 'ให้กล้องติดตามโมเดลอย่างนุ่มนวล',
        status: 'coming-soon',
      },
    ],
  },
]

export function getWorldById(id: string | undefined) {
  return worldCatalog.find((world) => world.id === (id as WorldId))
}
