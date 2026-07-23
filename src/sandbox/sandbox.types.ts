export type Vector3Tuple = readonly [x: number, y: number, z: number]

export type SandboxGeometry =
  | { readonly kind: 'box'; readonly size: Vector3Tuple }
  | { readonly kind: 'sphere'; readonly radius: number }

export type SandboxObjectDefinition = {
  readonly id: string
  readonly label: string
  readonly geometry: SandboxGeometry
  readonly material: {
    readonly color: string
    readonly roughness?: number
    readonly metalness?: number
    readonly opacity?: number
    readonly transparent?: boolean
    readonly wireframe?: boolean
    readonly depthWrite?: boolean
  }
  readonly position?: Vector3Tuple
  readonly rotation?: Vector3Tuple
  readonly scale?: Vector3Tuple
  readonly castShadow?: boolean
  readonly receiveShadow?: boolean
}

export type SandboxLightDefinition =
  | {
      readonly id: string
      readonly kind: 'hemisphere'
      readonly skyColor: string
      readonly groundColor: string
      readonly intensity: number
    }
  | {
      readonly id: string
      readonly kind: 'directional'
      readonly color: string
      readonly intensity: number
      readonly position: Vector3Tuple
      readonly castShadow?: boolean
    }

export type SandboxSceneDefinition = {
  readonly background: string
  readonly camera: {
    readonly position: Vector3Tuple
    readonly target: Vector3Tuple
    readonly fieldOfView?: number
  }
  readonly helpers?: {
    readonly grid?: boolean
    readonly axes?: boolean
  }
  readonly renderer?: {
    readonly shadowMapEnabled?: boolean
  }
  readonly lights?: readonly SandboxLightDefinition[]
  readonly objects: readonly SandboxObjectDefinition[]
}

export type ObjectTransform = {
  readonly position: Vector3Tuple
  readonly rotation: Vector3Tuple
  readonly scale: Vector3Tuple
}

export type SandboxObjectState = ObjectTransform & {
  readonly castShadow: boolean
  readonly receiveShadow: boolean
}

export type SandboxRendererState = {
  readonly shadowMapEnabled: boolean
}

export type SandboxLightState = {
  readonly kind: SandboxLightDefinition['kind']
  readonly position: Vector3Tuple
  readonly intensity: number
  readonly castShadow: boolean
}

export type SandboxSnapshot = {
  readonly objects: Readonly<Record<string, SandboxObjectState>>
  readonly renderer: SandboxRendererState
  readonly lights: Readonly<Record<string, SandboxLightState>>
  readonly camera: {
    readonly position: Vector3Tuple
    readonly target: Vector3Tuple
    readonly azimuthDegrees: number
    readonly elevationDegrees: number
    readonly distance: number
  }
}

export type TransformProperty = keyof ObjectTransform

export type TransformPatch = Partial<
  Record<TransformProperty, Partial<Record<'x' | 'y' | 'z', number>>>
>

export type CodeLabDefinition = {
  readonly title: string
  readonly description: string
  readonly starterCode: string
  readonly availableBindings: readonly string[]
}
