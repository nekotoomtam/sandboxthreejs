// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChapterPage } from './ChapterPage'
import { WorldMapPage } from './WorldMapPage'

vi.mock('../worlds/WorldJourneyCanvas', () => ({
  WorldJourneyCanvas: ({ worldId }: { worldId: string }) => (
    <div data-testid="world-journey-canvas">{worldId}</div>
  ),
}))

afterEach(cleanup)

describe('world pages', () => {
  it('sends the old world map route to the latest chapter', () => {
    render(
      <MemoryRouter initialEntries={['/worlds']}>
        <Routes>
          <Route path="/worlds" element={<WorldMapPage />} />
          <Route path="/worlds/:worldId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('พื้นฐาน')
  })

  it('shows the foundations lesson on the Three.js journey canvas', () => {
    render(
      <MemoryRouter initialEntries={['/worlds/foundations']}>
        <Routes>
          <Route path="/worlds/:worldId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('world-journey-canvas')).toHaveTextContent('foundations')
    expect(screen.getByRole('link', { name: /Scene, Camera, Renderer/ })).toHaveAttribute(
      'href',
      '/lessons/hello-threejs',
    )
    expect(screen.getByRole('button', { name: /ดาวถัดไป/ })).toBeVisible()
  })

  it('returns to the latest chapter for an unknown world', () => {
    render(
      <MemoryRouter initialEntries={['/worlds/unknown']}>
        <Routes>
          <Route path="/worlds/:worldId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('พื้นฐาน')
  })
})
