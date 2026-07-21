import { helloThreeLesson } from './content/helloThree'
import type { Lesson, LessonCatalogItem } from './lesson.types'

const lessons: readonly Lesson[] = [helloThreeLesson]

export const lessonCatalog: readonly LessonCatalogItem[] = [
  {
    id: 'hello-threejs',
    order: 1,
    title: 'Hello, Three.js',
    summary: 'Scene, Camera, Renderer และกล่องใบแรก',
    durationMinutes: 15,
    status: 'available',
    topic: 'เริ่มต้น',
  },
  {
    id: 'position-basics',
    order: 2,
    title: 'ขยับในโลก 3D',
    summary: 'เข้าใจตำแหน่งผ่านแกน X, Y และ Z',
    durationMinutes: 20,
    status: 'coming-soon',
    topic: 'Position',
  },
  {
    id: 'rotation-basics',
    order: 3,
    title: 'หมุนให้ถูกแกน',
    summary: 'ทดลองการหมุนวัตถุและหน่วยเรเดียน',
    durationMinutes: 20,
    status: 'coming-soon',
    topic: 'Rotation',
  },
  {
    id: 'camera-basics',
    order: 4,
    title: 'เล่าเรื่องด้วยมุมกล้อง',
    summary: 'จัดตำแหน่งกล้องและเลือกมุมมองที่เหมาะสม',
    durationMinutes: 25,
    status: 'coming-soon',
    topic: 'Camera',
  },
]

export function getLessonById(id: string | undefined) {
  return lessons.find((lesson) => lesson.id === id)
}

export function getPublishedLessons() {
  return [...lessons].sort((a, b) => a.order - b.order)
}
