// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CodeLabDefinition, SandboxSnapshot } from '../sandbox/sandbox.types'
import { runSandboxCode } from '../sandbox/code/runSandboxCode'
import { CodeLab } from './CodeLab'

vi.mock('../sandbox/code/runSandboxCode', () => ({ runSandboxCode: vi.fn() }))
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    onRun,
  }: {
    value: string
    onChange: (value: string) => void
    onRun?: () => void
  }) => (
    <textarea
      aria-label="พื้นที่เขียนโค้ด Three.js"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') onRun?.()
      }}
    />
  ),
}))

const definition: CodeLabDefinition = {
  title: 'Rotate',
  description: 'Rotate the cube',
  starterCode: 'cube.rotation.y = 0',
  availableBindings: ['cube'],
}

const snapshot: SandboxSnapshot = {
  objects: {
    'learning-cube': {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  camera: {
    position: [4, 3, 6],
    target: [0, 0, 0],
    azimuthDegrees: 0,
    elevationDegrees: 0,
    distance: 7,
  },
}

afterEach(cleanup)

beforeEach(() => {
  vi.mocked(runSandboxCode).mockReset()
})

describe('CodeLab', () => {
  it('marks edited code as pending until Run succeeds', () => {
    render(
      <CodeLab definition={definition} snapshot={snapshot} onApplySnapshot={vi.fn()} />,
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'cube.rotation.y = 1' },
    })

    expect(screen.getByRole('button', { name: /Run changes/ })).toBeEnabled()
  })

  it('keeps the last preview snapshot when a run fails', async () => {
    const onApplySnapshot = vi.fn()
    vi.mocked(runSandboxCode).mockResolvedValue({
      status: 'error',
      logs: [],
      error: 'SyntaxError',
    })
    render(
      <CodeLab
        definition={definition}
        snapshot={snapshot}
        onApplySnapshot={onApplySnapshot}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^▶ Run$/ }))

    await waitFor(() =>
      expect(screen.getByTestId('code-run-status')).toHaveTextContent('SyntaxError'),
    )
    expect(onApplySnapshot).not.toHaveBeenCalled()
  })

  it('runs code with Ctrl+Enter and clears the pending state on success', async () => {
    const onApplySnapshot = vi.fn()
    vi.mocked(runSandboxCode).mockResolvedValue({
      status: 'success',
      logs: [],
      snapshot,
    })
    render(
      <CodeLab
        definition={definition}
        snapshot={snapshot}
        onApplySnapshot={onApplySnapshot}
      />,
    )

    const editor = screen.getByRole('textbox')
    fireEvent.change(editor, { target: { value: 'cube.rotation.y = 1' } })
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })

    await waitFor(() => expect(onApplySnapshot).toHaveBeenCalledWith(snapshot))
    expect(screen.getByRole('button', { name: /^▶ Run$/ })).toBeEnabled()
  })
})
