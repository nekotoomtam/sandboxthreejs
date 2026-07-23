// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { SandboxSnapshot } from '../sandbox.types'
import { LightShadowControlsPanel } from './LightShadowControlsPanel'

const lightingSnapshot: SandboxSnapshot = {
  objects: {
    'learning-cube': {
      position: [0, 0.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      castShadow: false,
      receiveShadow: false,
    },
    'shadow-floor': {
      position: [0, -0.05, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      castShadow: false,
      receiveShadow: false,
    },
  },
  renderer: { shadowMapEnabled: false },
  lights: {
    'key-light': {
      kind: 'directional',
      position: [1, 4, 3],
      intensity: 1,
      castShadow: false,
    },
  },
  camera: {
    position: [7, 5, 8],
    target: [0, 0.5, -0.4],
    azimuthDegrees: 40,
    elevationDegrees: 25,
    distance: 10,
  },
}

it('emits a snapshot with the edited light intensity', () => {
  const onChange = vi.fn()
  render(
    <LightShadowControlsPanel
      snapshot={lightingSnapshot}
      lightId="key-light"
      casterObjectId="learning-cube"
      receiverObjectId="shadow-floor"
      onChange={onChange}
    />,
  )

  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'ค่าความสว่างของไฟ' }),
    { target: { value: '2.5' } },
  )

  expect(onChange.mock.calls[0][0].lights['key-light'].intensity).toBe(2.5)
})
