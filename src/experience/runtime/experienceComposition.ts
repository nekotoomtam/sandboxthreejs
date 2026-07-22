export type Vec3Tuple = readonly [number, number, number]

export type CameraPose = {
  cameraPosition: Vec3Tuple
  cameraTarget: Vec3Tuple
}

export type ExperienceComposition = {
  breakpoint: 'desktop' | 'narrow'
  ready: CameraPose
  entered: CameraPose
  monaPosition: Vec3Tuple
}

export function resolveEntryComposition(
  width: number,
  _height: number,
): ExperienceComposition {
  if (width < 768) {
    return {
      breakpoint: 'narrow',
      ready: {
        cameraPosition: [0.1, 0.2, 1.2],
        cameraTarget: [1.45, 1.5, -4],
      },
      entered: {
        cameraPosition: [0.2, 0.95, -0.15],
        cameraTarget: [1.05, 1.05, -4],
      },
      monaPosition: [1.55, 0, -4],
    }
  }

  return {
    breakpoint: 'desktop',
    ready: {
      cameraPosition: [0, 0.18, 1.15],
      cameraTarget: [1.8, 1.55, -4],
    },
    entered: {
      cameraPosition: [0.15, 0.98, -0.2],
      cameraTarget: [0.85, 1.04, -4],
    },
    monaPosition: [1.8, 0, -4],
  }
}
