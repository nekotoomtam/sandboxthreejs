// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExperienceShell } from './ExperienceShell'
import type { ExperienceCanvasProps } from './ExperienceCanvas'

let latestCanvasProps: ExperienceCanvasProps | undefined
const observedErrorAttempts: number[] = []

afterEach(() => {
  vi.useRealTimers()
})

function ManualCanvas(props: ExperienceCanvasProps) {
  latestCanvasProps = props
  return <div data-testid="fake-canvas" />
}

function ErrorCanvas({ attempt, onError }: ExperienceCanvasProps) {
  observedErrorAttempts.push(attempt)
  useEffect(() => onError('network'), [onError])
  return <div data-testid="fake-canvas" />
}

describe('ExperienceShell', () => {
  it('enables Start only after the scene is ready and keeps one canvas mounted', async () => {
    vi.useFakeTimers()
    render(<ExperienceShell CanvasComponent={ManualCanvas} entryDurationMs={400} />)

    expect(screen.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'เริ่ม' })).not.toBeInTheDocument()
    act(() => latestCanvasProps?.onProgress(0.5))
    expect(screen.getByRole('progressbar')).toHaveValue(50)
    act(() => latestCanvasProps?.onReady())

    const start = screen.getByRole('button', { name: 'เริ่ม' })
    expect(screen.getAllByTestId('fake-canvas')).toHaveLength(1)
    fireEvent.click(start)
    act(() => vi.advanceTimersByTime(400))

    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered')
    expect(screen.getAllByTestId('fake-canvas')).toHaveLength(1)
  })

  it('shows a retry action after loading fails', async () => {
    observedErrorAttempts.length = 0
    render(<ExperienceShell CanvasComponent={ErrorCanvas} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดฉากไม่สำเร็จ')
    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(observedErrorAttempts).toContain(1)
  })
})
