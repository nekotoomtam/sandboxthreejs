// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'

const runtimeSpies = vi.hoisted(() => {
  const runtime = {
    mount: vi.fn(),
    load: vi.fn(),
    setEntered: vi.fn(),
    dispose: vi.fn(),
  }
  runtime.mount.mockReturnValue(runtime)
  return {
    constructor: vi.fn(function ExperienceRuntimeMock() {
      return runtime
    }),
    runtime,
  }
})

vi.mock('./runtime/ExperienceRuntime', () => ({
  ExperienceRuntime: runtimeSpies.constructor,
}))

describe('ExperienceCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeSpies.runtime.mount.mockReturnValue(runtimeSpies.runtime)
    runtimeSpies.runtime.load.mockResolvedValue(undefined)
  })

  it('keeps one runtime mounted while entry state changes and disposes it on unmount', async () => {
    const onReady = vi.fn()
    const callbacks = {
      onProgress: vi.fn(),
      onReady,
      onError: vi.fn(),
    }
    const { rerender, unmount } = render(
      <ExperienceCanvas attempt={0} entered={false} {...callbacks} />,
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtimeSpies.runtime.load).toHaveBeenCalledWith(
      '/models/mona/Mona.vrm',
      callbacks.onProgress,
    )

    rerender(<ExperienceCanvas attempt={0} entered {...callbacks} />)
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtimeSpies.runtime.setEntered).toHaveBeenLastCalledWith(true)

    unmount()
    expect(runtimeSpies.runtime.dispose).toHaveBeenCalledOnce()
  })

  it('reports synchronous WebGL initialization errors through the UI callback', async () => {
    runtimeSpies.runtime.mount.mockImplementationOnce(() => {
      throw new Error('WebGL unavailable')
    })
    const onError = vi.fn()

    render(
      <ExperienceCanvas
        attempt={0}
        entered={false}
        onProgress={vi.fn()}
        onReady={vi.fn()}
        onError={onError}
      />,
    )

    await waitFor(() => expect(onError).toHaveBeenCalledWith('WebGL unavailable'))
    expect(runtimeSpies.runtime.dispose).toHaveBeenCalledOnce()
  })
})
