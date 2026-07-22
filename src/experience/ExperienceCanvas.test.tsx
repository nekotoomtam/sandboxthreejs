// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceCanvas } from './ExperienceCanvas'

const runtimeSpies = vi.hoisted(() => {
  const runtimes: Array<{
    mount: ReturnType<typeof vi.fn>
    load: ReturnType<typeof vi.fn>
    setEntered: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
  }> = []

  const createRuntime = () => {
    const runtime = {
      mount: vi.fn(),
      load: vi.fn().mockResolvedValue(undefined),
      setEntered: vi.fn(),
      dispose: vi.fn(),
    }
    runtime.mount.mockReturnValue(runtime)
    runtimes.push(runtime)
    return runtime
  }

  return {
    constructor: vi.fn(function ExperienceRuntimeMock() {
      return createRuntime()
    }),
    createRuntime,
    runtimes,
  }
})

vi.mock('./runtime/ExperienceRuntime', () => ({
  ExperienceRuntime: runtimeSpies.constructor,
}))

describe('ExperienceCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeSpies.runtimes.length = 0
    runtimeSpies.constructor.mockImplementation(function ExperienceRuntimeMock() {
      return runtimeSpies.createRuntime()
    })
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
    const runtime = runtimeSpies.runtimes[0]
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtime.load).toHaveBeenCalledWith(
      '/models/mona/Mona.vrm',
      expect.any(Function),
    )

    rerender(<ExperienceCanvas attempt={0} entered {...callbacks} />)
    expect(runtimeSpies.constructor).toHaveBeenCalledOnce()
    expect(runtime.setEntered).toHaveBeenLastCalledWith(true)

    unmount()
    expect(runtime.dispose).toHaveBeenCalledOnce()
  })

  it('initializes a replacement runtime with the current entered state', async () => {
    const callbacks = {
      onProgress: vi.fn(),
      onReady: vi.fn(),
      onError: vi.fn(),
    }
    const { rerender } = render(
      <ExperienceCanvas attempt={0} entered {...callbacks} />,
    )
    await waitFor(() => expect(callbacks.onReady).toHaveBeenCalledOnce())

    rerender(<ExperienceCanvas attempt={1} entered {...callbacks} />)
    await waitFor(() => expect(callbacks.onReady).toHaveBeenCalledTimes(2))

    expect(runtimeSpies.runtimes).toHaveLength(2)
    expect(runtimeSpies.runtimes[1].setEntered).toHaveBeenCalledWith(true)
  })

  it('stops forwarding progress after cleanup', () => {
    let reportRuntimeProgress: ((progress: number) => void) | undefined
    runtimeSpies.constructor.mockImplementationOnce(function ExperienceRuntimeMock() {
      const runtime = runtimeSpies.createRuntime()
      runtime.load.mockImplementation((_url, onProgress) => {
        reportRuntimeProgress = onProgress as (progress: number) => void
        return new Promise<void>(() => undefined)
      })
      return runtime
    })
    const onProgress = vi.fn()
    const { unmount } = render(
      <ExperienceCanvas
        attempt={0}
        entered={false}
        onProgress={onProgress}
        onReady={vi.fn()}
        onError={vi.fn()}
      />,
    )

    unmount()
    reportRuntimeProgress?.(0.5)

    expect(onProgress).not.toHaveBeenCalled()
  })

  it('reports synchronous WebGL initialization errors through the UI callback', async () => {
    runtimeSpies.constructor.mockImplementationOnce(function ExperienceRuntimeMock() {
      const runtime = runtimeSpies.createRuntime()
      runtime.mount.mockImplementationOnce(() => {
        throw new Error('WebGL unavailable')
      })
      return runtime
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
    expect(runtimeSpies.runtimes[0].dispose).toHaveBeenCalledOnce()
  })
})
