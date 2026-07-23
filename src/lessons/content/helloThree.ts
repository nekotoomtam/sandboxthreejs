import { DEFAULT_SANDBOX_SCENE } from '../../sandbox/defaultScene'
import type { Lesson } from '../lesson.types'

export const helloThreeLesson: Lesson = {
  id: 'hello-threejs',
  order: 1,
  title: 'Hello, Three.js',
  eyebrow: 'บทที่ 01 · รู้จักโลก 3D',
  summary: 'ทำความรู้จัก Scene, Camera, Renderer และสร้างกล่องใบแรกของคุณ',
  durationMinutes: 15,
  difficulty: 'เริ่มต้น',
  objectives: [
    'อธิบายหน้าที่ของ Scene, Camera และ Renderer ได้',
    'เข้าใจว่า Geometry + Material ประกอบกันเป็น Mesh',
    'หมุนดูฉากและปรับค่าของกล่องได้ด้วยตัวเอง',
  ],
  sections: [
    {
      id: 'three-parts',
      heading: 'สามส่วนที่ทำให้ฉากปรากฏ',
      paragraphs: [
        'Scene คือพื้นที่ที่เก็บวัตถุ แสง และสิ่งต่าง ๆ ในโลก 3D ส่วน Camera ทำหน้าที่กำหนดว่าเรากำลังมองโลกนั้นจากตำแหน่งใด',
        'Renderer คือผู้วาดสิ่งที่ Camera มองเห็นออกมาเป็นภาพบนหน้าจอ ทั้งสามส่วนต้องทำงานร่วมกันจึงจะเกิดฉาก Three.js ได้',
      ],
      code: `const scene = new THREE.Scene()\nconst camera = new THREE.PerspectiveCamera(45, width / height)\nconst renderer = new THREE.WebGLRenderer()`,
      conceptIds: ['scene', 'perspective-camera', 'webgl-renderer'],
    },
    {
      id: 'mesh',
      heading: 'จากรูปทรงสู่กล่องหนึ่งใบ',
      paragraphs: [
        'Geometry บอกว่าวัตถุมีรูปทรงอย่างไร ส่วน Material บอกว่าพื้นผิวมีสีและตอบสนองต่อแสงแบบไหน เมื่อนำมารวมกันจะได้ Mesh ที่เพิ่มเข้า Scene ได้',
      ],
      code: `const geometry = new THREE.BoxGeometry(1, 1, 1)\nconst material = new THREE.MeshStandardMaterial({ color: '#f3a83b' })\nconst cube = new THREE.Mesh(geometry, material)\nscene.add(cube)`,
      note: 'ลองลากบนฉากเพื่อขยับกล้องรอบกล่อง หรือเลื่อนล้อเมาส์เพื่อซูม ค่ามุมกล้องจะแสดงบนฉาก',
      conceptIds: ['geometry', 'material', 'mesh'],
    },
  ],
  sandbox: {
    scene: DEFAULT_SANDBOX_SCENE,
    activeObjectId: 'learning-cube',
    codeLab: {
      title: 'เขียนคำสั่งแรกของคุณ',
      description: 'เราเตรียม scene, camera และ cube ไว้ให้แล้ว ลองสั่งให้ตัวกล่องหมุนรอบแกน Y เป็น 45°',
      starterCode: `// เปลี่ยน 0 เป็นมุมที่โจทย์ต้องการ\ncube.rotation.y = THREE.MathUtils.degToRad(0)\n\nconsole.log('Rotation Y:', THREE.MathUtils.radToDeg(cube.rotation.y))`,
      availableBindings: ['THREE', 'scene', 'camera', 'cube', 'console'],
    },
  },
  exercises: [
    {
      id: 'first-rotation',
      title: 'ภารกิจแรก: หมุนตัวกล่อง',
      instruction: 'ทำให้ Rotation Y ของตัวกล่องเป็น 45° จะใช้แผงปรับค่าหรือเขียนโค้ดก็ได้',
      hint: 'โจทย์นี้ให้หมุน OBJECT ไม่ใช่กล้อง ลองใช้ cube.rotation.y และแปลงองศาด้วย THREE.MathUtils.degToRad()',
      validator: 'rotate-cube-y-45',
    },
  ],
}
