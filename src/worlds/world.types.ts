export type WorldId = 'foundations' | 'controls' | 'integration'

export type WorldLessonLink = {
  readonly id: string
  readonly lessonId?: string
  readonly title: string
  readonly summary: string
  readonly status: 'available' | 'coming-soon'
}

export type WorldDefinition = {
  readonly id: WorldId
  readonly order: number
  readonly title: string
  readonly eyebrow: string
  readonly description: string
  readonly imageSrc: string
  readonly accent: string
  readonly travelColors: readonly [string, string, string]
  readonly lessons: readonly WorldLessonLink[]
}
