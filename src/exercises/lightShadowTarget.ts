export const LIGHT_SHADOW_TARGET = {
  lightId: 'key-light',
  casterObjectId: 'learning-cube',
  receiverObjectId: 'shadow-floor',
  position: [-3, 6, 4] as const,
  intensity: 2.5,
} as const

export const LIGHT_SHADOW_TOLERANCE = {
  position: 0.1,
  intensity: 0.1,
} as const
