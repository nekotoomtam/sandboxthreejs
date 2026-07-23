import type { Exercise } from '../exercises/exercise.types'
import type {
  CodeLabDefinition,
  LightShadowControlsDefinition,
  SandboxSceneDefinition,
} from '../sandbox/sandbox.types'

export type LessonSection = {
  readonly id: string
  readonly heading: string
  readonly paragraphs: readonly string[]
  readonly code?: string
  readonly note?: string
  readonly conceptIds?: readonly string[]
}

export type Lesson = {
  readonly id: string
  readonly order: number
  readonly title: string
  readonly eyebrow: string
  readonly summary: string
  readonly durationMinutes: number
  readonly difficulty: 'เริ่มต้น' | 'พื้นฐาน' | 'ประยุกต์'
  readonly objectives: readonly string[]
  readonly sections: readonly LessonSection[]
  readonly sandbox: {
    readonly scene: SandboxSceneDefinition
    readonly activeObjectId: string
    readonly codeLab?: CodeLabDefinition
    readonly lightingControls?: LightShadowControlsDefinition
  }
  readonly exercises: readonly Exercise[]
}

export type LessonCatalogItem = {
  readonly id: string
  readonly order: number
  readonly title: string
  readonly summary: string
  readonly durationMinutes: number
  readonly status: 'available' | 'coming-soon'
  readonly topic: string
}
