import { MATCH_TARGET_TRANSFORM } from '../../exercises/transformTarget'
import type { SandboxSceneDefinition } from '../../sandbox/sandbox.types'
import type { Lesson } from '../lesson.types'

const transformScene: SandboxSceneDefinition = {
  background: '#e7edf2',
  camera: {
    position: [5.4, 4.2, 6.6],
    target: [0.6, 0.8, -0.2],
    fieldOfView: 45,
  },
  helpers: {
    grid: true,
    axes: true,
  },
  objects: [
    {
      id: 'learning-cube',
      label: 'Learning cube',
      geometry: { kind: 'box', size: [1.45, 1.45, 1.45] },
      material: {
        color: '#f3a83b',
        roughness: 0.48,
        metalness: 0.05,
      },
      position: [0, 0.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    {
      id: 'target-cube',
      label: 'Target cube',
      geometry: { kind: 'box', size: [1.45, 1.45, 1.45] },
      material: {
        color: '#8bdcff',
        roughness: 0.35,
        opacity: 0.28,
        transparent: true,
        wireframe: true,
        depthWrite: false,
      },
      ...MATCH_TARGET_TRANSFORM,
    },
  ],
}

export const positionRotationScaleLesson: Lesson = {
  id: 'position-rotation-scale',
  order: 2,
  title: 'Position, Rotation, Scale',
  eyebrow: 'บทที่ 02 · ควบคุมวัตถุ',
  summary: 'ย้าย หมุน และปรับขนาดกล่องให้ตรงกับเป้าหมายในฉากจริง',
  durationMinutes: 20,
  difficulty: 'พื้นฐาน',
  objectives: [
    'อ่านตำแหน่งบนแกน X, Y และ Z ได้',
    'หมุนวัตถุด้วยองศาและแปลงเป็นเรเดียนได้',
    'ปรับขนาดวัตถุแยกแต่ละแกนได้',
  ],
  sections: [
    {
      id: 'position',
      heading: 'ย้ายวัตถุด้วย Position',
      paragraphs: [
        'Position กำหนดตำแหน่งของวัตถุบนแกน X, Y และ Z โดย X คือซ้าย–ขวา Y คือขึ้น–ลง และ Z คือหน้า–หลัง',
      ],
      code: `cube.position.set(1.5, 1, -0.5)`,
      conceptIds: ['position'],
    },
    {
      id: 'rotation',
      heading: 'หมุนวัตถุให้ถูกแกน',
      paragraphs: [
        'Rotation หมุนวัตถุรอบแกนของตัวเอง Three.js ใช้เรเดียน จึงควรแปลงค่าจากองศาที่อ่านง่ายก่อน',
      ],
      code: `cube.rotation.y = THREE.MathUtils.degToRad(45)`,
      conceptIds: ['rotation'],
    },
    {
      id: 'scale',
      heading: 'กำหนดสัดส่วนด้วย Scale',
      paragraphs: [
        'Scale คูณขนาดเดิมของวัตถุ ค่า 1 คือขนาดปกติ ค่ามากกว่า 1 ทำให้ใหญ่ขึ้น และค่าระหว่าง 0 ถึง 1 ทำให้เล็กลง',
      ],
      code: `cube.scale.set(1.25, 0.75, 1.25)`,
      conceptIds: ['scale'],
    },
  ],
  sandbox: {
    scene: transformScene,
    activeObjectId: 'learning-cube',
    codeLab: {
      title: 'จัดกล่องให้ตรงเป้าหมาย',
      description:
        'แก้ Position, Rotation และ Scale แล้วทำให้กล่องสีส้มซ้อนตรงกล่องเงาสีฟ้า',
      starterCode: `cube.position.set(0, 0.75, 0)
cube.rotation.set(0, 0, 0)
cube.scale.set(1, 1, 1)`,
      availableBindings: ['THREE', 'scene', 'camera', 'cube', 'console'],
    },
  },
  exercises: [
    {
      id: 'match-target-transform',
      title: 'ภารกิจ: ซ้อนกล่องให้ตรงเงา',
      instruction:
        'เป้าหมาย Position (1.5, 1, -0.5), Rotation Y 45° และ Scale (1.25, 0.75, 1.25)',
      hint: 'ปรับทีละกลุ่ม เริ่มจาก Position แล้วตามด้วย Rotation และ Scale',
      validator: 'match-cube-transform',
    },
  ],
}
