import { helloThreeLesson } from './content/helloThree'
import { positionRotationScaleLesson } from './content/positionRotationScale'
import type { Lesson, LessonCatalogItem } from './lesson.types'

const lessons: readonly Lesson[] = [helloThreeLesson, positionRotationScaleLesson]

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
    id: 'position-rotation-scale',
    order: 2,
    title: 'Position, Rotation, Scale',
    summary: 'ย้าย หมุน และปรับขนาดให้ตรงกับเป้าหมาย',
    durationMinutes: 20,
    status: 'available',
    topic: 'Transform',
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

export function getNextPublishedLesson(currentOrder: number) {
  return getPublishedLessons().find((lesson) => lesson.order > currentOrder)
}
