// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { ExperienceShell } from './ExperienceShell'
import type { ExperienceCanvasProps } from './ExperienceCanvas'

let latestCanvasProps: ExperienceCanvasProps | undefined
const manualCanvasMountAttempts: number[] = []
const manualCanvasUnmountAttempts: number[] = []
const errorCanvasMountAttempts: number[] = []
const errorCanvasUnmountAttempts: number[] = []

afterEach(() => {
  latestCanvasProps = undefined
  manualCanvasMountAttempts.length = 0
  manualCanvasUnmountAttempts.length = 0
  errorCanvasMountAttempts.length = 0
  errorCanvasUnmountAttempts.length = 0
})

function ManualCanvas(props: ExperienceCanvasProps) {
  latestCanvasProps = props
  const mountedAttemptRef = useRef(props.attempt)

  useEffect(() => {
    const mountedAttempt = mountedAttemptRef.current
    manualCanvasMountAttempts.push(mountedAttempt)
    return () => {
      manualCanvasUnmountAttempts.push(mountedAttempt)
    }
  }, [])

  return null
}

function ErrorCanvas({ attempt, onError }: ExperienceCanvasProps) {
  const mountedAttemptRef = useRef(attempt)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    const mountedAttempt = mountedAttemptRef.current
    errorCanvasMountAttempts.push(mountedAttempt)
    onErrorRef.current('network')
    return () => {
      errorCanvasUnmountAttempts.push(mountedAttempt)
    }
  }, [])

  return null
}

describe('ExperienceShell', () => {
  it('keeps its canvas mounted through reveal, approach, content reveal, and entry', () => {
    render(<ExperienceShell CanvasComponent={ManualCanvas} />)

    expect(screen.getByText('กำลังพา Mona เข้าสู่ฉาก')).toBeVisible()
    expect(screen.queryByRole('button', { name: /เริ่มประสบการณ์/ })).not.toBeInTheDocument()
    expect(manualCanvasMountAttempts).toEqual([0])
    expect(manualCanvasUnmountAttempts).toEqual([])
    act(() => latestCanvasProps?.onProgress(0.5))
    expect(screen.getByRole('progressbar')).toHaveValue(50)
    act(() => latestCanvasProps?.onReady())

    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'revealing')
    expect(screen.queryByRole('button', { name: /เริ่มประสบการณ์/ })).not.toBeInTheDocument()
    fireEvent.transitionEnd(screen.getByTestId('loader-surface'))

    const start = screen.getByRole('button', { name: 'เริ่มประสบการณ์กับ Mona' })
    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'ready')
    expect(manualCanvasMountAttempts).toEqual([0])
    expect(manualCanvasUnmountAttempts).toEqual([])
    fireEvent.click(start)
    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'approaching')
    expect(latestCanvasProps?.entryActive).toBe(true)
    expect(manualCanvasMountAttempts).toEqual([0])
    expect(manualCanvasUnmountAttempts).toEqual([])

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    act(() => latestCanvasProps?.onEntryComplete())
    const content = screen.getByTestId('experience-content')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('เรียนรู้ Three.js')
    expect(screen.getByRole('main')).toHaveAttribute(
      'data-experience-phase',
      'revealing-content',
    )
    fireEvent.transitionEnd(content)

    expect(screen.getByRole('main')).toHaveAttribute('data-experience-phase', 'entered')
    expect(screen.getByRole('link', { name: 'สำรวจเส้นทางเรียน' })).toHaveAttribute(
      'href',
      '/worlds',
    )
    expect(manualCanvasMountAttempts).toEqual([0])
    expect(manualCanvasUnmountAttempts).toEqual([])
  })

  it('replaces the canvas instance with attempt 1 after a loading failure retry', async () => {
    render(<ExperienceShell CanvasComponent={ErrorCanvas} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('โหลดฉากไม่สำเร็จ')
    expect(errorCanvasMountAttempts).toEqual([0])
    expect(errorCanvasUnmountAttempts).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }))
    expect(errorCanvasUnmountAttempts).toEqual([0])
    expect(errorCanvasMountAttempts).toEqual([0, 1])
  })
})
