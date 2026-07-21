import type { SandboxSceneDefinition } from '../sandbox/sandbox.types'

export type ConceptCategory =
  | 'พื้นฐานโลก 3D'
  | 'การสร้างวัตถุ'
  | 'การจัดวาง'
  | 'การแสดงผล'

export type Concept = {
  readonly id: string
  readonly order: number
  readonly title: string
  readonly apiName: string
  readonly category: ConceptCategory
  readonly summary: string
  readonly purpose: string
  readonly mentalModel: string
  readonly minimalCode: string
  readonly keyPoints: readonly string[]
  readonly commonMistakes: readonly string[]
  readonly relatedConceptIds: readonly string[]
  readonly officialDocs: string
  readonly demo?: {
    readonly scene: SandboxSceneDefinition
    readonly activeObjectId: string
  }
}
