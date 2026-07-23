// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { ChapterPage } from './ChapterPage'
import { WorldMapPage } from './WorldMapPage'

afterEach(cleanup)

describe('world pages', () => {
  it('shows all three chapter planets', () => {
    render(
      <MemoryRouter>
        <WorldMapPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link', { name: /เปิดบท/ })).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('สามโลก')
  })

  it('shows the foundations lesson and planet', () => {
    render(
      <MemoryRouter initialEntries={['/worlds/foundations']}>
        <Routes>
          <Route path="/worlds/:worldId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('พื้นฐาน')
    expect(screen.getByRole('img', { name: /พื้นฐาน/ })).toBeVisible()
    expect(screen.getByRole('link', { name: /Scene, Camera, Renderer/ })).toHaveAttribute(
      'href',
      '/lessons/hello-threejs',
    )
  })

  it('returns to the map for an unknown world', () => {
    render(
      <MemoryRouter initialEntries={['/worlds/unknown']}>
        <Routes>
          <Route path="/worlds" element={<p>world map</p>} />
          <Route path="/worlds/:worldId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('world map')).toBeVisible()
  })
})
