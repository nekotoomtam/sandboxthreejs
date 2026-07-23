// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { CodeLabDefinition, SandboxSceneDefinition } from '../sandbox/sandbox.types'
import { SandboxWorkspace } from './SandboxWorkspace'

vi.mock('../sandbox/SandboxCanvas', () => ({
  SandboxCanvas: () => <div data-testid="mock-canvas">canvas</div>,
}))
vi.mock('./CodeLab', () => ({
  CodeLab: () => <div data-testid="mock-code-lab">code</div>,
}))

const definition: SandboxSceneDefinition = {
  background: '#111111',
  camera: { position: [4, 3, 6], target: [0, 0, 0] },
  objects: [
    {
      id: 'learning-cube',
      label: 'Cube',
      geometry: { kind: 'box', size: [1, 1, 1] },
      material: { color: '#ffffff' },
    },
  ],
}

const codeLab: CodeLabDefinition = {
  title: 'Code',
  description: 'Edit the scene',
  starterCode: 'cube.rotation.y = 1',
  availableBindings: ['cube'],
}

afterEach(cleanup)

it('opens practical lessons in code mode with mobile Code and Result controls', async () => {
  render(
    <SandboxWorkspace
      practical
      definition={definition}
      activeObjectId="learning-cube"
      codeLab={codeLab}
    />,
  )

  expect(await screen.findByTestId('mock-code-lab')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Code' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Result' })).toBeVisible()
  expect(screen.getByTestId('lesson-code-pane')).toHaveClass('lesson-code-pane')
  expect(screen.getByTestId('lesson-result-pane')).toHaveClass('lesson-result-pane')
})

it('selects focused light controls for a lighting lesson', () => {
  render(
    <SandboxWorkspace
      definition={definition}
      activeObjectId="learning-cube"
      lightingControls={{
        lightId: 'key-light',
        casterObjectId: 'learning-cube',
        receiverObjectId: 'shadow-floor',
      }}
    />,
  )

  expect(screen.getByText('กำลังเตรียมแสงและเงา…')).toBeVisible()
})
